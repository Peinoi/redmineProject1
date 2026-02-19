package com.yedam.app.calendar.service.impl;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;

import com.yedam.app.calendar.mapper.CalendarMapper;
import com.yedam.app.calendar.service.CalendarService;
import com.yedam.app.calendar.service.CalendarVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CalendarServiceImpl implements CalendarService {

	private final CalendarMapper calendarMapper;

	@Override
	public List<CalendarVO> getCalendarList(Integer userCode, CalendarVO calendarVO) {
		List<CalendarVO> list = calendarMapper.selectCalendarList(userCode, calendarVO);

		// 1단계: ISSUE 날짜 먼저 계산
		for (CalendarVO vo : list) {
			if ("ISSUE".equals(vo.getRowType())) {
				vo.setIssueStartDate(issueStartDate(vo));
				vo.setIssueEndDate(issueEndDate(vo));
			}
		}

		// 2단계: 나머지 계산 결과 적용
		applyCalculatedValues(list);

		return list;
	}

	// 작업 기간 계산
	private Integer calculateDuration(CalendarVO vo) {
		String status = vo.getIssueStatus();

		LocalDateTime start = null;
		LocalDateTime end = null;

		// 완료
		if ("완료".equals(status)) {
			start = vo.getStartedAt();
			end = vo.getResolvedAt();
		}
		// 신규
		else if (status == null || "신규".equals(status)) {
			start = vo.getCreatedAt();
			end = vo.getDueAt();
		}
		// 진행 / 해결 / 반려
		else {
			start = vo.getStartedAt();
			end = vo.getDueAt();
		}

		if (start == null || end == null)
			return 0;

		// 날짜 기준 계산 (시작일 포함)
		return (int) ChronoUnit.DAYS.between(start.toLocalDate(), end.toLocalDate()) + 1;
	}

	// 계산 결과 VO에 넣기
	private void applyCalculatedValues(List<CalendarVO> list) {
		for (CalendarVO vo : list) {
			// 1. ISSUE만 날짜 계산
			if ("ISSUE".equals(vo.getRowType())) {
				vo.setDuration(calculateDuration(vo));
			}
		}
	}

	// ===== 일감 시작일 규칙 =====
	private LocalDateTime issueStartDate(CalendarVO vo) {

		String status = vo.getIssueStatus();
		LocalDateTime result = null;

		// 신규 → 마감기한 - 1
		if (status == null || "신규".equals(status)) {
			if (vo.getDueAt() != null) {
				return vo.getDueAt().minusDays(1);
			}
		}
		// 진행 / 해결 / 반려 / 완료 → startedAt
		else if (vo.getStartedAt() != null) {
			result = vo.getStartedAt();
		} else {
			result = vo.getDueAt();
		}

		// 여기 추가 (중요)
		return result == null ? null : result.toLocalDate().atStartOfDay();
	}

	// ===== 일감 종료일 규칙 =====
	private LocalDateTime issueEndDate(CalendarVO vo) {
		LocalDateTime result = null;

		// 완료 → resolvedAt
		if ("완료".equals(vo.getIssueStatus()) && vo.getResolvedAt() != null) {
			result = vo.getResolvedAt();
		} else {
			result = vo.getDueAt();
		}

		// 여기 추가
		return result == null ? null : result.toLocalDate().atStartOfDay();
	}

}
