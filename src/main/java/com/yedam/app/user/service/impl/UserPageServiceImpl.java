package com.yedam.app.user.service.impl;

import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yedam.app.login.service.UserVO;
import com.yedam.app.user.mapper.UserPageMapper;
import com.yedam.app.user.service.UserDualIssueStaVO;
import com.yedam.app.user.service.UserPageService;
import com.yedam.app.user.service.UserWorkLogVO;
import com.yedam.app.user.service.WorkLogViewDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserPageServiceImpl implements UserPageService {

	private final UserPageMapper userPageMapper;

	// 기본 정보
	@Override
	public UserVO getProfile(Integer userCode) {
		return userPageMapper.selectUserProfile(userCode);
	}

	// 일감현황: 내가 등록한 일감, 내가 담당자인 일감
	@Override
	public UserDualIssueStaVO getIssueSummaryDual(Integer userCode, List<Integer> readableProjectCodes,
			Integer fixedProjectCode) {
		UserDualIssueStaVO vo = userPageMapper.selectUserIssueSummaryDual(userCode, readableProjectCodes,
				fixedProjectCode);
		if (vo == null)
			vo = new UserDualIssueStaVO();

		if (vo.getRegNewIss() == null)
			vo.setRegNewIss(0);
		if (vo.getRegProgress() == null)
			vo.setRegProgress(0);
		if (vo.getRegSolution() == null)
			vo.setRegSolution(0);
		if (vo.getRegReturnIss() == null)
			vo.setRegReturnIss(0);
		if (vo.getRegCompletion() == null)
			vo.setRegCompletion(0);

		if (vo.getAssNewIss() == null)
			vo.setAssNewIss(0);
		if (vo.getAssProgress() == null)
			vo.setAssProgress(0);
		if (vo.getAssSolution() == null)
			vo.setAssSolution(0);
		if (vo.getAssReturnIss() == null)
			vo.setAssReturnIss(0);
		if (vo.getAssCompletion() == null)
			vo.setAssCompletion(0);

		return vo;
	}

	// 작업현황(활동 로그)
	@Override
	public Map<String, List<WorkLogViewDTO>> getWorkLogsForView(Integer userCode, String actorName, int days,
			List<Integer> readableProjectCodes, Integer fixedProjectCode) {

		// 한국 시간 기준
		ZoneId zone = ZoneId.of("Asia/Seoul");

		// to = 지금
		ZonedDateTime now = ZonedDateTime.now(zone);

		// from = (오늘 - (days-1)) 00:00:00
		int d = Math.max(days, 1);
		LocalDate startDay = now.toLocalDate().minusDays(d - 1);
		ZonedDateTime fromZdt = startDay.atStartOfDay(zone);

		Date from = Date.from(fromZdt.toInstant());
		Date to = Date.from(now.toInstant());

		List<UserWorkLogVO> logs = userPageMapper.selectWorkLogs(userCode, from, to, readableProjectCodes,
				fixedProjectCode);

		SimpleDateFormat dayFmt = new SimpleDateFormat("yyyy-MM-dd");
		SimpleDateFormat timeFmt = new SimpleDateFormat("HH:mm");

		Map<String, List<WorkLogViewDTO>> grouped = new LinkedHashMap<>();
		ObjectMapper om = new ObjectMapper();

		for (UserWorkLogVO log : logs) {
			String day = log.getCreatedAt() == null ? "unknown" : dayFmt.format(log.getCreatedAt());
			String time = log.getCreatedAt() == null ? "" : timeFmt.format(log.getCreatedAt());

			// ✅ meta가 {"changes":[]} 인 로그는 스킵 (내 페이지와 동일) CREATE는 예외
			if (isEmptyChangesMeta(log.getMeta(), om) && !"CREATE".equalsIgnoreCase(log.getActionType())) {
				continue;
			}

			WorkLogViewDTO dto = new WorkLogViewDTO();
			dto.setDay(day);
			dto.setTime(time);
			dto.setActorName(actorName);
			dto.setActionLabel(toKoreanAction(log.getActionType())); // 아래 함수
			dto.setProjectName(log.getProjectName());
			dto.setIssueTitle(log.getIssueTitle());
			dto.setTargetCode(log.getTargetCode());
			dto.setDetailHtml(buildDetailHtml(log.getMeta(), log.getActionType(), om)); // 아래 함수

			grouped.computeIfAbsent(day, k -> new ArrayList<>()).add(dto);
		}

		return grouped;
	}

	private String toKoreanAction(String actionType) {
		if (actionType == null)
			return "작업";
		switch (actionType.toUpperCase()) {
		case "UPDATE":
			return "수정";
		case "CREATE":
			return "등록";
		case "DELETE":
			return "삭제";
		case "REJECT":
			return "반려";
		case "APPROVE":
			return "완료";
		default:
			return actionType;
		}
	}

	private String buildDetailHtml(String meta, String actionType, ObjectMapper om) {
		// ✅ meta가 비어있으면: 등록이면 문구, 그 외는 빈값
		if (meta == null || meta.isBlank()) {
			return isCreate(actionType) ? "생성되었습니다." : "";
		}

		try {
			JsonNode root = om.readTree(meta);
			JsonNode changes = root.get("changes");

			// ✅ 변경내역이 없으면: 등록이면 문구, 그 외는 빈값
			if (changes == null || !changes.isArray() || changes.size() == 0) {
				return isCreate(actionType) ? "생성되었습니다." : "";
			}

			StringBuilder sb = new StringBuilder();
			for (JsonNode c : changes) {
				String field = text(c.get("field"));
				String before = text(c.get("before"));
				String after = text(c.get("after"));

				String label = toFieldLabel(field);
				String beforeDisp = formatValueByField(field, before);
				String afterDisp = formatValueByField(field, after);

				sb.append(escapeHtml(label)).append(" : ").append(escapeHtml(beforeDisp == null ? "" : beforeDisp))
						.append(" &gt;&gt; ").append(escapeHtml(afterDisp == null ? "" : afterDisp)).append("<br>");
			}
			return sb.toString();
		} catch (Exception e) {
			// 파싱 실패 시: 등록이면 문구, 아니면 meta 텍스트
			return isCreate(actionType) ? "생성되었습니다." : escapeHtml(meta);
		}
	}

	private boolean isCreate(String actionType) {
		return actionType != null && "CREATE".equalsIgnoreCase(actionType.trim());
	}

	private String toFieldLabel(String field) {
		if (field == null)
			return "변경";

		String f = field.trim(); // ✅ 공백/개행 방지

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
		default -> f;
		};
	}

	private String formatValueByField(String field, String v) {
		if (v == null || "null".equals(v))
			return "";

		String f = (field == null) ? "" : field.trim();

		if ("description".equalsIgnoreCase(f)) {
			return stripHtmlToText(v);
		}

		if ("startedAt".equals(f) || "dueAt".equals(f) || "resolvedAt".equals(f)) {
			// 1) ISO_LOCAL_DATE_TIME: 2026-02-12T16:59:31
			try {
				LocalDateTime dt = LocalDateTime.parse(v, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
				return dt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
			} catch (Exception ignore) {
			}

			// 2) 공백형: 2026-02-12 16:59
			try {
				LocalDateTime dt = LocalDateTime.parse(v, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
				return dt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
			} catch (Exception ignore) {
			}

			return v;
		}

		return v;
	}

	// html 태그 제거
	private String stripHtmlToText(String html) {
		if (html == null)
			return "";
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
		if (s == null)
			return "";
		return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'",
				"&#39;");
	}

	private boolean isEmptyChangesMeta(String meta, ObjectMapper om) {
		if (meta == null || meta.isBlank())
			return false; // CREATE 같은 null meta는 표시

		try {
			JsonNode root = om.readTree(meta);
			JsonNode changes = root.get("changes");
			return (changes != null && changes.isArray() && changes.size() == 0);
		} catch (Exception e) {
			return false; // 파싱 실패면 표시(안전)
		}
	}
}
