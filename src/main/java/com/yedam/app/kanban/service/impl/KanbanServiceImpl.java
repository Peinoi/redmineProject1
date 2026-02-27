package com.yedam.app.kanban.service.impl;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yedam.app.issue.mapper.IssueMapper;
import com.yedam.app.issue.service.IssueVO;
import com.yedam.app.kanban.mapper.KanbanMapper;
import com.yedam.app.kanban.service.KanbanService;
import com.yedam.app.kanban.web.dto.IssuePosUpdate;
import com.yedam.app.kanban.web.dto.KanbanMoveRequest;
import com.yedam.app.log.service.LogService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class KanbanServiceImpl implements KanbanService {

  private final KanbanMapper kanbanMapper;

  private final IssueMapper issueMapper;
  private final LogService logService;
  private static final DateTimeFormatter LOG_DT =
      DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

  private String fmt(LocalDateTime dt) {
    if (dt == null) return null;
    return dt.format(LOG_DT);
  }

  @Override
  public Map<String, List<IssueVO>> getBoardColumns(Integer userCode,
                                                    Long projectCode,
                                                    String viewScope,
                                                    String sysCk,
                                                    List<Long> allProjectCodes,
                                                    List<Long> adminProjectCodes,
                                                    List<Long> readableProjectCodes) {
    String scope = (viewScope == null || viewScope.isBlank()) ? "ME" : viewScope;

    if ("Y".equals(sysCk)) {
      if (allProjectCodes == null || allProjectCodes.isEmpty()) {
        return groupByStatus(List.of());
      }
    } else {
      boolean noAdmin = (adminProjectCodes == null || adminProjectCodes.isEmpty());
      boolean noRead = (readableProjectCodes == null || readableProjectCodes.isEmpty());
      if (noAdmin && noRead) {
        return groupByStatus(List.of());
      }
    }

    List<IssueVO> list = kanbanMapper.selectKanbanIssuesByScope(
        userCode,
        scope,
        projectCode,
        sysCk,
        allProjectCodes,
        adminProjectCodes,
        readableProjectCodes
    );

    return groupByStatus(list);
  }

  private Map<String, List<IssueVO>> groupByStatus(List<IssueVO> list) {
    Map<String, List<IssueVO>> cols = new LinkedHashMap<>();
    cols.put("OB1", new ArrayList<>());
    cols.put("OB2", new ArrayList<>());
    cols.put("OB3", new ArrayList<>());
    cols.put("OB4", new ArrayList<>());
    cols.put("OB5", new ArrayList<>());

    if (list == null) return cols;

    for (IssueVO it : list) {
      String s = it.getStatusId();
      if (s == null) continue;
      cols.computeIfAbsent(s, k -> new ArrayList<>()).add(it);
    }
    return cols;
  }

  @Transactional
  @Override
  public void moveCard(Integer userCode, KanbanMoveRequest req) {
    if (req == null || req.getProjectCode() == null || req.getIssueCode() == null || req.getToStatusCode() == null) {
      throw new IllegalArgumentException("invalid request");
    }

    IssueVO param = new IssueVO();
    param.setIssueCode(req.getIssueCode());
    IssueVO before = issueMapper.selectIssue(param);
    if (before == null) {
      throw new IllegalArgumentException("issue not found");
    }

    boolean hasOrders = req.getToOrder() != null && !req.getToOrder().isEmpty();
    int tmpPos = (req.getToIndex() == null ? 9999 : req.getToIndex() + 1);

    kanbanMapper.updateIssueStatusAndPosition(
        req.getProjectCode(),
        req.getIssueCode(),
        req.getFromStatusCode(),
        req.getToStatusCode(),
        tmpPos
    );

    if (hasOrders) {
      List<IssuePosUpdate> updates = new ArrayList<>();

      for (int i = 0; i < req.getToOrder().size(); i++) {
        updates.add(new IssuePosUpdate(req.getToOrder().get(i), i + 1));
      }

      if (req.getFromOrder() != null && !req.getFromOrder().isEmpty()) {
        for (int i = 0; i < req.getFromOrder().size(); i++) {
          updates.add(new IssuePosUpdate(req.getFromOrder().get(i), i + 1));
        }
      }

      kanbanMapper.batchUpdatePositions(updates);
    }

    IssueVO after = issueMapper.selectIssue(param);

    String meta = buildKanbanMoveMeta(before, after);

    logService.addActionLog(
        after.getProjectCode(),
        userCode,
        "UPDATE",
        "ISSUE",
        after.getIssueCode(),
        meta
    );
  }

  private String buildKanbanMoveMeta(IssueVO before, IssueVO after) {
    StringBuilder sb = new StringBuilder();
    sb.append("{\"changes\":[");

    boolean first = true;

    first = appendChangeByCode(sb, first, "status",
        before == null ? null : before.getStatusId(),
        after == null ? null : after.getStatusId(),
        before == null ? null : before.getStatusName(),
        after == null ? null : after.getStatusName()
    );

    first = appendChange(sb, first, "progress",
        before == null || before.getProgress() == null ? null : String.valueOf(before.getProgress()),
        after == null || after.getProgress() == null ? null : String.valueOf(after.getProgress())
    );

    first = appendChange(sb, first, "startedAt",
        before == null ? null : fmt(before.getStartedAt()),
        after == null ? null : fmt(after.getStartedAt())
    );

    first = appendChange(sb, first, "resolvedAt",
        before == null ? null : fmt(before.getResolvedAt()),
        after == null ? null : fmt(after.getResolvedAt())
    );

    sb.append("]}");
    return sb.toString();
  }

  private boolean appendChangeByCode(StringBuilder sb, boolean first, String field,
                                     String beforeCode, String afterCode,
                                     String beforeDisplay, String afterDisplay) {
    if (beforeCode == null && afterCode == null) return first;
    if (beforeCode != null && beforeCode.equals(afterCode)) return first;

    if (!first) sb.append(",");
    sb.append("{\"field\":\"").append(esc(field)).append("\",")
      .append("\"before\":").append(jsonValue(normalizeDisplay(beforeDisplay))).append(",")
      .append("\"after\":").append(jsonValue(normalizeDisplay(afterDisplay))).append("}");

    return false;
  }

  private boolean appendChange(StringBuilder sb, boolean first, String field, String before, String after) {
    if (before == null && after == null) return first;
    if (before != null && before.equals(after)) return first;

    if (!first) sb.append(",");
    sb.append("{\"field\":\"").append(esc(field)).append("\",")
      .append("\"before\":").append(jsonValue(before)).append(",")
      .append("\"after\":").append(jsonValue(after)).append("}");

    return false;
  }

  private String normalizeDisplay(String s) {
    if (s == null || s.isBlank()) return "-";
    return s;
  }

  private String jsonValue(String v) {
    if (v == null) return "null";
    return "\"" + esc(v) + "\"";
  }

  private String esc(String s) {
    if (s == null) return "";
    return s.replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");
  }

  @Transactional
  @Override
  public void updateProgress(Integer userCode, Long projectCode, Long issueCode, Integer progress) {
    if (userCode == null || projectCode == null || issueCode == null || progress == null) {
      throw new IllegalArgumentException("invalid request");
    }

    IssueVO param = new IssueVO();
    param.setIssueCode(issueCode);

    IssueVO before = issueMapper.selectIssue(param);
    if (before == null) throw new IllegalArgumentException("issue not found");

    if (before.getProjectCode() == null || !before.getProjectCode().equals(projectCode)) {
      throw new IllegalArgumentException("프로젝트 정보가 일치하지 않습니다.");
    }

    String statusId = before.getStatusId();
    if (!"OB2".equals(statusId)) {
      throw new IllegalArgumentException("진척도 변경은 진행 상태에서만 가능합니다.");
    }

    int updated = kanbanMapper.updateIssueProgress(projectCode, issueCode, progress);
    if (updated <= 0) {
      throw new IllegalArgumentException("진척도 저장에 실패했습니다.");
    }

    IssueVO after = issueMapper.selectIssue(param);

    String meta = buildProgressMeta(before, after);

    logService.addActionLog(
        projectCode,
        userCode,
        "UPDATE",
        "ISSUE",
        issueCode,
        meta
    );
  }

  private String buildProgressMeta(IssueVO before, IssueVO after) {
    StringBuilder sb = new StringBuilder();
    sb.append("{\"changes\":[");

    boolean first = true;

    first = appendChange(sb, first, "progress",
        before == null || before.getProgress() == null ? null : String.valueOf(before.getProgress()),
        after == null || after.getProgress() == null ? null : String.valueOf(after.getProgress())
    );

    sb.append("]}");
    return sb.toString();
  }

  @Override
  @Transactional(readOnly = true)
  public IssueVO getIssue(Integer userCode,
                          Long projectCode,
                          Long issueCode,
                          String sysCk,
                          List<Long> allProjectCodes,
                          List<Long> adminProjectCodes,
                          List<Long> readableProjectCodes) {
    if (userCode == null || projectCode == null || issueCode == null) return null;

    if ("Y".equals(sysCk)) {
      if (allProjectCodes == null || allProjectCodes.isEmpty()) return null;
    } else {
      boolean noAdmin = (adminProjectCodes == null || adminProjectCodes.isEmpty());
      boolean noRead = (readableProjectCodes == null || readableProjectCodes.isEmpty());
      if (noAdmin && noRead) return null;
    }

    return kanbanMapper.selectIssueForAuth(
        userCode,
        projectCode,
        issueCode,
        sysCk,
        allProjectCodes,
        adminProjectCodes,
        readableProjectCodes
    );
  }
}