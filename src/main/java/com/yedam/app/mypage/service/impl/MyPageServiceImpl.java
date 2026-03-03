// ================================
// 4) MyPageServiceImpl.java (완성본)
// ================================
package com.yedam.app.mypage.service.impl;

import java.text.SimpleDateFormat;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yedam.app.main.util.Authz;
import com.yedam.app.mypage.mapper.MyPageMapper;
import com.yedam.app.mypage.service.*;
import com.yedam.app.user.service.UserWorkLogVO;
import com.yedam.app.user.service.WorkLogViewDTO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MyPageServiceImpl implements MyPageService {

  private final MyPageMapper myPageMapper;

  private static final String BT_ASSIGNED = "ASSIGNED";
  private static final String BT_REGISTERED = "REGISTERED";

  private static final Set<String> ALLOWED_BLOCK_TYPES =
      Set.of("ASSIGNED", "REGISTERED", "NOTICE", "CALENDAR", "WORKLOG");

  private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

  @Override
  @Transactional
  public List<BlockVO> getBlocksEnsured(Integer userCode) {
    List<BlockVO> blocks = myPageMapper.selectBlocks(userCode);

    if (blocks == null || blocks.isEmpty()) {
      BlockVO a = new BlockVO();
      a.setUserCode(userCode);
      a.setBlockType(BT_ASSIGNED);
      a.setPosition(0);
      myPageMapper.insertBlock(a);

      BlockVO r = new BlockVO();
      r.setUserCode(userCode);
      r.setBlockType(BT_REGISTERED);
      r.setPosition(1);
      myPageMapper.insertBlock(r);

      return myPageMapper.selectBlocks(userCode);
    }
    return blocks;
  }

  @Override
  @Transactional
  public void addBlock(Integer userCode, String blockType) {
    if (blockType == null) return;

    String bt = blockType.toUpperCase();
    if (!ALLOWED_BLOCK_TYPES.contains(bt)) return;

    List<BlockVO> blocks = myPageMapper.selectBlocks(userCode);
    for (BlockVO b : blocks) {
      if (bt.equalsIgnoreCase(b.getBlockType())) return;
    }

    int maxPos = blocks.stream()
        .map(BlockVO::getPosition)
        .filter(Objects::nonNull)
        .max(Integer::compareTo)
        .orElse(-1);

    BlockVO vo = new BlockVO();
    vo.setUserCode(userCode);
    vo.setBlockType(bt);
    vo.setPosition(maxPos + 1);

    myPageMapper.insertBlock(vo);
  }

  @Override
  @Transactional
  public void deleteBlock(Integer userCode, Integer blockCode) {
    if (blockCode == null) return;
    myPageMapper.deleteBlock(blockCode, userCode);
  }

  @Override
  @Transactional
  public void saveOrder(Integer userCode, List<Integer> orderedBlockCodes) {
    if (orderedBlockCodes == null) return;

    for (int i = 0; i < orderedBlockCodes.size(); i++) {
      Integer blockCode = orderedBlockCodes.get(i);
      if (blockCode == null) continue;
      myPageMapper.updateBlockPosition(blockCode, userCode, i);
    }
  }

  @Override
  public Map<String, Object> buildMyPage(
      HttpSession session,
      Integer userCode,
      String userName,
      int days,
      String mode,
      Integer projectCode
  ) {
    // 1) 블록 목록
    List<BlockVO> blocks = getBlocksEnsured(userCode);
    int limit = 8;

    // 2) 권한 기반 프로젝트 필터 준비
    boolean isSys = Authz.isSys(session);

    List<Integer> issueReadable = null;   // CAT_PROJECT gate + CAT_ISSUE rdRol 결과
    List<Integer> noticeReadable = null;  // CAT_PROJECT gate + CAT_NOTICE rdRol 결과
    List<Integer> issueEditable = null;

    if (!isSys) {
      issueReadable = new ArrayList<>(Authz.readableProjectsByCategory(session, Authz.CAT_ISSUE));
      noticeReadable = new ArrayList<>(Authz.readableProjectsByCategory(session, Authz.CAT_NOTICE));
      issueEditable = new ArrayList<>(Authz.editableProjectsByCategory(session, Authz.CAT_ISSUE));
    }

    // 3) ADMIN 모드 판정
    boolean requestedAdmin = "ADMIN".equalsIgnoreCase(mode) && projectCode != null;
    boolean isAdminMode = requestedAdmin && Authz.isAdmin(session, projectCode);

    // 4) ADMIN 드롭다운 목록(Authz.adminProjects 기반)
    List<AdminProjectOptionDTO> adminProjectOptions;
    if (isSys) {
      // sys는 모든 프로젝트 admin처럼 취급 가능하지만,
      // 목록이 너무 많을 수 있으니 필요 시 "전체 프로젝트 조회" 쿼리로 바꿔도 됨.
      adminProjectOptions = List.of();
    } else {
      Set<Integer> adminSet = Authz.adminProjects(session);
      if (adminSet.isEmpty()) adminProjectOptions = List.of();
      else adminProjectOptions = myPageMapper.selectProjectOptionsByCodes(new ArrayList<>(adminSet));
    }

    // 5) 블록별 데이터
    Map<String, Object> blockData = new HashMap<>();

    for (BlockVO b : blocks) {
      String t = (b.getBlockType() == null) ? "" : b.getBlockType().toUpperCase();

      switch (t) {
        case BT_ASSIGNED -> {
          if (isAdminMode) {
            blockData.put(BT_ASSIGNED, myPageMapper.selectAdminAssigneeIssSta(projectCode));
          } else {
        	  blockData.put(BT_ASSIGNED,
        			    myPageMapper.selectAssignedIssues(userCode, limit, isSys, issueReadable, issueEditable)
        			);
          }
        }
        case BT_REGISTERED -> {
          if (isAdminMode) {
            blockData.put(BT_REGISTERED, myPageMapper.selectAdminCreatorIssSta(projectCode));
          } else {
        	  blockData.put(BT_REGISTERED,
        			    myPageMapper.selectRegisteredIssues(userCode, limit, isSys, issueReadable, issueEditable)
        			);
          }
        }
        case "NOTICE" -> {
          if (isAdminMode) {
            blockData.put("NOTICE", myPageMapper.selectRecentNoticesByProject(projectCode, limit));
          } else {
            blockData.put("NOTICE", myPageMapper.selectRecentNotices(userCode, limit, isSys, noticeReadable));
          }
        }
        case "CALENDAR" -> {
          if (isAdminMode) {
            blockData.put("CALENDAR", buildWeekGanttByProject(userCode, projectCode));
          } else {
            blockData.put("CALENDAR", buildWeekGantt(userCode, isSys, issueReadable));
          }
        }
        case "WORKLOG" -> {
          if (isAdminMode) {
            blockData.put("WORKLOG", buildProjectWorkLogsForView(projectCode, days));
          } else {
            blockData.put("WORKLOG", buildWorkLogsForView(userCode, userName, days, isSys, issueReadable));
          }
        }
        default -> { }
      }
    }

    // 6) addableBlocks
    Set<String> existed = new HashSet<>();
    for (BlockVO b : blocks) {
      if (b.getBlockType() != null) existed.add(b.getBlockType().toUpperCase());
    }

    List<Map<String, String>> addables = new ArrayList<>();
    addIfNotExists(addables, existed, "ASSIGNED", "할당된 일감");
    addIfNotExists(addables, existed, "REGISTERED", "등록한 일감");
    addIfNotExists(addables, existed, "NOTICE", "최근공지");
    addIfNotExists(addables, existed, "CALENDAR", "달력(주간)");
    addIfNotExists(addables, existed, "WORKLOG", "작업내역");

    // 7) today / weekend
    String todayStr = LocalDate.now(ZONE).toString();
    Set<String> weekendDays = calcWeekendDaysOfThisWeek();

    String selectedName = null;
    if (isAdminMode && adminProjectOptions != null) {
      for (var opt : adminProjectOptions) {
        if (opt.getProjectCode() != null && opt.getProjectCode().equals(projectCode)) {
          selectedName = opt.getProjectName();
          break;
        }
      }
      if (selectedName == null) selectedName = myPageMapper.selectProjectName(projectCode);
    }

    Map<String, Object> result = new HashMap<>();
    result.put("blocks", blocks);
    result.put("blockData", blockData);
    result.put("days", Math.max(days, 1));

    result.put("addableBlocks", addables);
    result.put("todayStr", todayStr);
    result.put("weekendDays", weekendDays);

    result.put("adminProjectList", adminProjectOptions);
    result.put("mode", isAdminMode ? "ADMIN" : "ME");
    result.put("adminProjectCode", isAdminMode ? projectCode : null);
    result.put("adminProjectName", isAdminMode ? selectedName : null);

    return result;
  }

  @Override
  public List<MyIssueRowDTO> getAdminDrilldownIssues(
      HttpSession session,
      Integer loginUserCode,
      String kind,
      Integer projectCode,
      Integer targetUserCode,
      int limit
  ) {
    if (loginUserCode == null || projectCode == null || targetUserCode == null) return null;

    if (!Authz.isAdmin(session, projectCode)) return null;

    String k = (kind == null) ? "" : kind.trim().toUpperCase();
    int lim = Math.max(1, Math.min(limit, 200));

    if ("ASSIGNED".equals(k)) {
      return myPageMapper.selectAssignedIssuesByProjectAndAssignee(projectCode, targetUserCode, lim);
    }
    if ("REGISTERED".equals(k)) {
      return myPageMapper.selectRegisteredIssuesByProjectAndCreator(projectCode, targetUserCode, lim);
    }
    return null;
  }

  // ================================
  // 내부 유틸
  // ================================
  private void addIfNotExists(List<Map<String, String>> out, Set<String> existed, String type, String label) {
    if (existed.contains(type)) return;
    Map<String, String> m = new HashMap<>();
    m.put("type", type);
    m.put("label", label);
    out.add(m);
  }

  private Set<String> calcWeekendDaysOfThisWeek() {
    LocalDate today = LocalDate.now(ZONE);
    LocalDate monday = today.with(DayOfWeek.MONDAY);

    Set<String> weekendDays = new HashSet<>();
    for (int i = 0; i < 7; i++) {
      LocalDate d = monday.plusDays(i);
      DayOfWeek dow = d.getDayOfWeek();
      if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
        weekendDays.add(d.toString());
      }
    }
    return weekendDays;
  }

  // ================================
  // 주간 간트 (ME) - 권한필터 적용
  // ================================
  private Map<String, Object> buildWeekGantt(Integer userCode, boolean isSys, List<Integer> readableProjectCodes) {
    LocalDate today = LocalDate.now(ZONE);
    LocalDate monday = today.with(DayOfWeek.MONDAY);
    LocalDate nextMonday = monday.plusDays(7);

    Date from = Date.from(monday.atStartOfDay(ZONE).toInstant());
    Date to = Date.from(nextMonday.atStartOfDay(ZONE).toInstant());

    List<WeekGanttIssueDTO> rows =
        myPageMapper.selectWeekGanttIssues(userCode, from, to, isSys, readableProjectCodes);

    Map<Integer, Map<String, Object>> byProject = new LinkedHashMap<>();
    for (WeekGanttIssueDTO r : rows) {
      if (r.getProjectCode() == null) continue;

      byProject.computeIfAbsent(r.getProjectCode(), k -> {
        Map<String, Object> m = new HashMap<>();
        m.put("projectCode", r.getProjectCode());
        m.put("projectName", r.getProjectName());
        m.put("items", new ArrayList<WeekGanttIssueDTO>());
        return m;
      });

      @SuppressWarnings("unchecked")
      List<WeekGanttIssueDTO> items =
          (List<WeekGanttIssueDTO>) byProject.get(r.getProjectCode()).get("items");
      items.add(r);
    }

    List<String> days = new ArrayList<>();
    for (int i = 0; i < 7; i++) days.add(monday.plusDays(i).toString());

    Map<String, Object> out = new HashMap<>();
    out.put("weekStart", monday.toString());
    out.put("days", days);
    out.put("projects", new ArrayList<>(byProject.values()));
    return out;
  }

  // ================================
  // 작업내역 (ME) - 권한필터 적용
  // ================================
  private Map<String, List<WorkLogViewDTO>> buildWorkLogsForView(
      Integer userCode,
      String actorName,
      int days,
      boolean isSys,
      List<Integer> readableProjectCodes
  ) {
    ZonedDateTime now = ZonedDateTime.now(ZONE);

    int d = Math.max(days, 1);
    LocalDate startDay = now.toLocalDate().minusDays(d - 1);
    ZonedDateTime fromZdt = startDay.atStartOfDay(ZONE);

    Date from = Date.from(fromZdt.toInstant());
    Date to = Date.from(now.toInstant());

    List<UserWorkLogVO> logs = myPageMapper.selectWorkLogs(userCode, from, to, isSys, readableProjectCodes);

    SimpleDateFormat dayFmt = new SimpleDateFormat("yyyy-MM-dd");
    SimpleDateFormat timeFmt = new SimpleDateFormat("HH:mm");

    Map<String, List<WorkLogViewDTO>> grouped = new LinkedHashMap<>();
    ObjectMapper om = new ObjectMapper();

    for (UserWorkLogVO log : logs) {
      String day = (log.getCreatedAt() == null) ? "unknown" : dayFmt.format(log.getCreatedAt());
      String time = (log.getCreatedAt() == null) ? "" : timeFmt.format(log.getCreatedAt());

      if (isEmptyChangesMeta(log.getMeta(), om)) continue;

      WorkLogViewDTO dto = new WorkLogViewDTO();
      dto.setDay(day);
      dto.setTime(time);
      dto.setActorName(actorName);
      dto.setActionLabel(toKoreanAction(log.getActionType()));
      dto.setProjectName(log.getProjectName());

      String typeLabel = toKoreanTargetType(log.getTargetType());
      String title = (log.getTargetTitle() == null || log.getTargetTitle().isBlank()) ? "-" : log.getTargetTitle();

      String type = (log.getTargetType() == null) ? "" : log.getTargetType().trim().toUpperCase();
      Long code = log.getTargetCode();

      String targetUrl = null;
      boolean linkable = false;

      switch (type) {
        case "ISSUE"  -> { targetUrl = "/issueInfo?issueCode=" + code;  linkable = true; }
        case "NOTICE" -> { targetUrl = "/noticeInfo?noticeCode=" + code; linkable = true; }
        case "DOC"    -> { targetUrl = null; linkable = false; }
        default       -> { targetUrl = null; linkable = false; }
      }

      dto.setTargetTypeLabel(typeLabel);  // "일감" / "공지" / "문서"
      dto.setIssueTitle(title);           // 제목만 (링크 텍스트로 쓸 거)
      dto.setDetailHtml(buildDetailHtml(log.getMeta(), om));
      dto.setTargetUrl(targetUrl);
      dto.setTargetLink(linkable);

      grouped.computeIfAbsent(day, k -> new ArrayList<>()).add(dto);
    }

    return grouped;
  }

  // ================================
  // ADMIN gantt/log (프로젝트 1개)
  // ================================
  private Map<String, Object> buildWeekGanttByProject(Integer userCode, Integer projectCode) {
    LocalDate today = LocalDate.now(ZONE);
    LocalDate monday = today.with(DayOfWeek.MONDAY);
    LocalDate nextMonday = monday.plusDays(7);

    Date from = Date.from(monday.atStartOfDay(ZONE).toInstant());
    Date to = Date.from(nextMonday.atStartOfDay(ZONE).toInstant());

    List<WeekGanttIssueDTO> rows = myPageMapper.selectWeekGanttIssuesByProject(userCode, projectCode, from, to);

    Map<Integer, Map<String, Object>> byProject = new LinkedHashMap<>();
    for (WeekGanttIssueDTO r : rows) {
      if (r.getProjectCode() == null) continue;

      byProject.computeIfAbsent(r.getProjectCode(), k -> {
        Map<String, Object> m = new HashMap<>();
        m.put("projectCode", r.getProjectCode());
        m.put("projectName", r.getProjectName());
        m.put("items", new ArrayList<WeekGanttIssueDTO>());
        return m;
      });

      @SuppressWarnings("unchecked")
      List<WeekGanttIssueDTO> items =
          (List<WeekGanttIssueDTO>) byProject.get(r.getProjectCode()).get("items");
      items.add(r);
    }

    List<String> days = new ArrayList<>();
    for (int i = 0; i < 7; i++) days.add(monday.plusDays(i).toString());

    Map<String, Object> out = new HashMap<>();
    out.put("weekStart", monday.toString());
    out.put("days", days);
    out.put("projects", new ArrayList<>(byProject.values()));
    return out;
  }

  private Map<String, List<WorkLogViewDTO>> buildProjectWorkLogsForView(Integer projectCode, int days) {
    ZonedDateTime now = ZonedDateTime.now(ZONE);

    int d = Math.max(days, 1);
    LocalDate startDay = now.toLocalDate().minusDays(d - 1);
    ZonedDateTime fromZdt = startDay.atStartOfDay(ZONE);

    Date from = Date.from(fromZdt.toInstant());
    Date to = Date.from(now.toInstant());

    List<UserWorkLogVO> logs = myPageMapper.selectProjectWorkLogs(projectCode, from, to);

    SimpleDateFormat dayFmt = new SimpleDateFormat("yyyy-MM-dd");
    SimpleDateFormat timeFmt = new SimpleDateFormat("HH:mm");

    Map<String, List<WorkLogViewDTO>> grouped = new LinkedHashMap<>();
    ObjectMapper om = new ObjectMapper();

    for (UserWorkLogVO log : logs) {
      String day = (log.getCreatedAt() == null) ? "unknown" : dayFmt.format(log.getCreatedAt());
      String time = (log.getCreatedAt() == null) ? "" : timeFmt.format(log.getCreatedAt());

      if (isEmptyChangesMeta(log.getMeta(), om)) continue;

      WorkLogViewDTO dto = new WorkLogViewDTO();
      dto.setDay(day);
      dto.setTime(time);

      String actor = (log.getUserName() != null && !log.getUserName().isBlank()) ? log.getUserName() : "사용자";
      dto.setActorName(actor);

      dto.setActionLabel(toKoreanAction(log.getActionType()));
      dto.setProjectName(log.getProjectName());

      String typeLabel = toKoreanTargetType(log.getTargetType());
      String title = (log.getTargetTitle() == null || log.getTargetTitle().isBlank()) ? "-" : log.getTargetTitle();

      String type = (log.getTargetType() == null) ? "" : log.getTargetType().trim().toUpperCase();
      Long code = log.getTargetCode();

      String targetUrl = null;
      boolean linkable = false;

      switch (type) {
        case "ISSUE"  -> { targetUrl = "/issueInfo?issueCode=" + code;  linkable = true; }
        case "NOTICE" -> { targetUrl = "/noticeInfo?noticeCode=" + code; linkable = true; }
        case "DOC"    -> { targetUrl = null; linkable = false; }
        default       -> { targetUrl = null; linkable = false; }
      }

      dto.setTargetTypeLabel(typeLabel);
      dto.setIssueTitle(title);  
      dto.setDetailHtml(buildDetailHtml(log.getMeta(), om));
      dto.setTargetUrl(targetUrl);
      dto.setTargetLink(linkable);

      grouped.computeIfAbsent(day, k -> new ArrayList<>()).add(dto);
    }

    return grouped;
  }

  // ================================
  // 유틸 (네 기존 그대로)
  // ================================
  private String toKoreanAction(String field) {
    if (field == null) return "작업";
    String f = field.trim();
    return switch (f.toUpperCase()) {
      case "UPDATE" -> "수정";
      case "CREATE" -> "등록";
      case "DELETE" -> "삭제";
      case "REJECT" -> "반려";
      case "APPROVE" -> "완료";
      default -> f;
    };
  }

  private String toKoreanTargetType(String targetType) {
    if (targetType == null) return "기타";
    return switch (targetType.toUpperCase()) {
      case "ISSUE" -> "일감";
      case "NOTICE" -> "공지";
      case "DOC" -> "문서";
      default -> targetType;
    };
  }

  private String buildDetailHtml(String meta, ObjectMapper om) {
    if (meta == null || meta.isBlank()) return "";
    try {
      JsonNode root = om.readTree(meta);
      JsonNode changes = root.get("changes");
      if (changes == null || !changes.isArray() || changes.size() == 0) return "";

      StringBuilder sb = new StringBuilder();
      for (JsonNode c : changes) {
        String field = text(c.get("field"));
        String before = text(c.get("before"));
        String after = text(c.get("after"));

        String label = toFieldLabel(field);
        String beforeDisp = formatValueByField(field, before);
        String afterDisp = formatValueByField(field, after);

        sb.append(escapeHtml(label)).append(" : ")
          .append(escapeHtml(nvl(beforeDisp))).append(" &gt;&gt; ")
          .append(escapeHtml(nvl(afterDisp))).append("<br>");
      }
      return sb.toString();
    } catch (Exception e) {
      return escapeHtml(meta);
    }
  }

  private String nvl(String s) { return (s == null) ? "" : s; }

  private String toFieldLabel(String field) {
    if (field == null) return "변경";
    String f = field.trim();
    return switch (f) {
      case "status" -> "상태";
      case "startedAt" -> "시작일";
      case "dueAt" -> "마감일";
      case "resolvedAt" -> "완료일";
      case "progress" -> "진척도";
      case "priority" -> "우선순위";
      case "assignee" -> "담당자";
      case "type" -> "유형";
      case "parentIssue" -> "상위일감";
      case "rejectReason" -> "반려 사유";
      case "description" -> "설명";
      case "title" -> "제목";
      case "content" -> "내용";
      default -> f;
    };
  }

  private String formatValueByField(String field, String v) {
    if (v == null || "null".equals(v)) return "";
    String f = (field == null) ? "" : field.trim();
    
    if ("content".equalsIgnoreCase(f) || "description".equalsIgnoreCase(f)) {
        return stripHtmlToText(v);
    }

    if ("startedAt".equals(f) || "dueAt".equals(f) || "resolvedAt".equals(f)) {
      try {
        LocalDateTime dt = LocalDateTime.parse(v, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        return dt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
      } catch (Exception ignore) { }
      try {
        LocalDateTime dt = LocalDateTime.parse(v, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        return dt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
      } catch (Exception ignore) { }
      return v;
    }
    return v;
  }
  
  // html 태그 제거
  private String stripHtmlToText(String html) {
	  if (html == null) return "";
	  String s = html;

	  // 자주 보이는 nbsp 처리
	  s = s.replace("&nbsp;", " ");

	  // 태그 제거
	  s = s.replaceAll("(?is)<script[^>]*>.*?</script>", "");
	  s = s.replaceAll("(?is)<style[^>]*>.*?</style>", "");
	  s = s.replaceAll("(?is)<[^>]+>", " ");

	  // 공백 정리
	  s = s.replaceAll("[\\t\\n\\r]+", " ");
	  s = s.replaceAll(" +", " ").trim();

	  return s;
	}

  private String text(JsonNode n) {
    return (n == null || n.isNull()) ? null : n.asText();
  }

  private String escapeHtml(String s) {
    if (s == null) return "";
    return s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#39;");
  }

  private boolean isEmptyChangesMeta(String meta, ObjectMapper om) {
    if (meta == null || meta.isBlank()) return false;
    try {
      JsonNode root = om.readTree(meta);
      JsonNode changes = root.get("changes");
      return (changes != null && changes.isArray() && changes.size() == 0);
    } catch (Exception e) {
      return false;
    }
  }
}