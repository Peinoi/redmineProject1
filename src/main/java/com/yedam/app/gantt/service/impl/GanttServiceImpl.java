package com.yedam.app.gantt.service.impl;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.yedam.app.gantt.mapper.GanttMapper;
import com.yedam.app.gantt.service.GanttService;
import com.yedam.app.gantt.service.GanttVO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class GanttServiceImpl implements GanttService {

	private final GanttMapper ganttMapper;

	// 전체조회
	@Override
	public List<GanttVO> getGanttList(Integer userCode, GanttVO ganttVO) {
		List<GanttVO> list = ganttMapper.selectGanttList(userCode, ganttVO);

		Map<Integer, Integer> issueCountMap = new HashMap<>();
		Map<Integer, LocalDateTime> projectEndDateMap = new HashMap<>();

		// TYPE 날짜 계산용 캐시 (요청 단위)
		Map<String, LocalDateTime[]> typeDateCache = new HashMap<>();

		calculateProjectEndDates(list, projectEndDateMap);

		// 1단계: ISSUE 날짜 먼저 계산
		for (GanttVO vo : list) {
			if ("ISSUE".equals(vo.getRowType())) {
				vo.setIssueStartDate(issueStartDate(vo));
				vo.setIssueEndDate(issueEndDate(vo));

				System.out.println("ISSUE=" + vo.getNodeId() + " / status=" + vo.getIssueStatus() + " / start="
						+ vo.getIssueStartDate() + " / end=" + vo.getIssueEndDate());
			}
		}

		// 2단계: TYPE 날짜 계산 (이제 child의 issueStartDate/issueEndDate가 설정됨)
		for (GanttVO vo : list) {
			if ("TYPE".equals(vo.getRowType())) {
				calculateTypeDate(vo, list, typeDateCache);
			}
		}

		// 3단계: 나머지 계산 결과 적용
		applyCalculatedValues(list, issueCountMap, projectEndDateMap);

		return list;
	}

	// 프로젝트 종료일 계산
	private void calculateProjectEndDates(List<GanttVO> list, Map<Integer, LocalDateTime> projectEndDateMap) {
		for (GanttVO vo : list) {
			// 핵심: ISSUE만
			if (!"ISSUE".equals(vo.getRowType())) {
				continue;
			}

			Integer projectCode = vo.getProjectCode();
			if (projectCode == null)
				continue;

			LocalDateTime issueEnd = issueEndDate(vo);
			if (issueEnd == null)
				continue;

			projectEndDateMap.merge(projectCode, issueEnd,
					(oldVal, newVal) -> newVal.isAfter(oldVal) ? newVal : oldVal);
		}
	}

	// 하위 TYPE과 ISSUE까지 포함해서 TYPE 시작일/종료일 계산
	private LocalDateTime[] calculateTypeDate(GanttVO vo, List<GanttVO> list, Map<String, LocalDateTime[]> cache) {

		if (cache.containsKey(vo.getNodeId())) {
			return cache.get(vo.getNodeId());
		}

		List<GanttVO> childIssues = new java.util.ArrayList<>();

		// 모든 하위 ISSUE 수집
		collectChildIssues(vo.getNodeId(), list, childIssues);

		LocalDateTime minStart = null;
		LocalDateTime maxEnd = null;

		for (GanttVO issue : childIssues) {
			System.out.println("TYPE " + vo.getNodeId() + " 집계 ISSUE = " + issue.getNodeId() + " start="
					+ issue.getIssueStartDate());

			LocalDateTime start = issue.getIssueStartDate();
			LocalDateTime end = issue.getIssueEndDate();

			if (start != null && (minStart == null || start.isBefore(minStart))) {
				minStart = start;
			}

			if (end != null && (maxEnd == null || end.isAfter(maxEnd))) {
				maxEnd = end;
			}
		}

		vo.setTypeStartDate(minStart);
		vo.setTypeEndDate(maxEnd);

		LocalDateTime[] result = new LocalDateTime[] { minStart, maxEnd };
		cache.put(vo.getNodeId(), result);

		return result;
	}

	private void collectChildIssues(String parentId, List<GanttVO> list, List<GanttVO> result) {

		for (GanttVO child : list) {

			// 1️. ISSUE가 현재 TYPE의 직계 자식인 경우
			if ("ISSUE".equals(child.getRowType()) && parentId.equals(child.getParentId())) {

				result.add(child);
			}

			// 2️. 하위 TYPE인 경우 (TYPE 트리 구조)
			if ("TYPE".equals(child.getRowType()) && parentId.equals(child.getParentId())) {

				collectChildIssues(child.getNodeId(), list, result);
			}
		}
	}

	// 작업 기간 계산
	private Integer calculateDuration(GanttVO vo) {
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
	private void applyCalculatedValues(List<GanttVO> list, Map<Integer, Integer> issueCountMap,
			Map<Integer, LocalDateTime> projectEndDateMap) {

		for (GanttVO vo : list) {
			Integer projectCode = vo.getProjectCode();

			// 1. 프로젝트 종료일 (PROJECT / TYPE / ISSUE 공통)
			if ("완료".equals(vo.getProjectStatus())) {
				vo.setProjectEndDate(vo.getCompletedOn());
			} else {
				vo.setProjectEndDate(projectEndDateMap.get(projectCode));
			}

			// 2️. ISSUE만 날짜 계산
			if ("ISSUE".equals(vo.getRowType())) {
				vo.setDuration(calculateDuration(vo));
			}
		}
	}

	// ===== 일감 시작일 규칙 =====
	private LocalDateTime issueStartDate(GanttVO vo) {

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
	private LocalDateTime issueEndDate(GanttVO vo) {
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
