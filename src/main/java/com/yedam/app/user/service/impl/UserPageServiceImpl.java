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
	public UserDualIssueStaVO getIssueSummaryDual(Integer userCode) {
	  UserDualIssueStaVO vo = userPageMapper.selectUserIssueSummaryDual(userCode);
	  if (vo == null) vo = new UserDualIssueStaVO();

	  // null 방어
	  if (vo.getRegNewIss() == null) vo.setRegNewIss(0);
	  if (vo.getRegProgress() == null) vo.setRegProgress(0);
	  if (vo.getRegSolution() == null) vo.setRegSolution(0);
	  if (vo.getRegReturnIss() == null) vo.setRegReturnIss(0);
	  if (vo.getRegCompletion() == null) vo.setRegCompletion(0);

	  if (vo.getAssNewIss() == null) vo.setAssNewIss(0);
	  if (vo.getAssProgress() == null) vo.setAssProgress(0);
	  if (vo.getAssSolution() == null) vo.setAssSolution(0);
	  if (vo.getAssReturnIss() == null) vo.setAssReturnIss(0);
	  if (vo.getAssCompletion() == null) vo.setAssCompletion(0);

	  return vo;
	}

	// 작업현황(활동 로그)
	@Override
	public Map<String, List<WorkLogViewDTO>> getWorkLogsForView(Integer userCode, String actorName, int days) {
		
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
		
		List<UserWorkLogVO> logs = userPageMapper.selectWorkLogs(userCode, from, to);
		
		SimpleDateFormat dayFmt = new SimpleDateFormat("yyyy-MM-dd");
	    SimpleDateFormat timeFmt = new SimpleDateFormat("HH:mm");
	    
	    Map<String, List<WorkLogViewDTO>> grouped = new LinkedHashMap<>();
	    ObjectMapper om = new ObjectMapper();
	    
	    for (UserWorkLogVO log : logs) {
	        String day = log.getCreatedAt() == null ? "unknown" : dayFmt.format(log.getCreatedAt());
	        String time = log.getCreatedAt() == null ? "" : timeFmt.format(log.getCreatedAt());

	        WorkLogViewDTO dto = new WorkLogViewDTO();
	        dto.setDay(day);
	        dto.setTime(time);
	        dto.setActorName(actorName);
	        dto.setActionLabel(toKoreanAction(log.getActionType())); // 아래 함수
	        dto.setProjectName(log.getProjectName());
	        dto.setIssueTitle(log.getIssueTitle());

	        dto.setDetailHtml(buildDetailHtml(log.getMeta(), om));   // 아래 함수

	        grouped.computeIfAbsent(day, k -> new ArrayList<>()).add(dto);
	      }
	    
		return grouped;
	}
	
	private String toKoreanAction(String actionType) {
		  if (actionType == null) return "작업";
		  switch (actionType.toUpperCase()) {
		    case "UPDATE": return "수정";
		    case "CREATE": return "등록";
		    case "DELETE": return "삭제";
		    case "REJECT": return "반려";
		    case "APPROVE": return "완료";
		    default: return actionType;
		  }
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
		      String afterDisp  = formatValueByField(field, after);

		      // null이면 공백처럼 표시
		      if (beforeDisp == null) beforeDisp = "";
		      if (afterDisp == null) afterDisp = "";

		      sb.append(escapeHtml(label))
		        .append(" : ")
		        .append(escapeHtml(beforeDisp))
		        .append(" &gt;&gt; ")
		        .append(escapeHtml(afterDisp))
		        .append("<br>");
		    }
		    return sb.toString();
		  } catch (Exception e) {
		    // meta가 JSON이 아닐 때 대비 (그냥 그대로 보여주고 싶으면 이쪽에서 escape해서 반환)
		    return escapeHtml(meta);
		  }
		}

		private String toFieldLabel(String field) {
		  if (field == null) return "변경";
		  switch (field) {
		    case "status": return "상태";
		    case "startedAt": return "시작일";
		    case "dueAt": return "마감일";
		    case "progress": return "진척도";
		    default: return field;
		  }
		}

		private String formatValueByField(String field, String v) {
		  if (v == null || v.equals("null")) return "";

		  // startedAt 같은 ISO를 "yyyy-MM-dd HH:mm"로
		  if ("startedAt".equals(field) || "dueAt".equals(field) || "resolvedAt".equals(field)) {
		    // 예: 2026-02-11T00:00
		    try {
		      LocalDateTime dt = LocalDateTime.parse(v, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
		      return dt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
		    } catch (Exception ignore) {
		      return v;
		    }
		  }
		  return v;
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
}
