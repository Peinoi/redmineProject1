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
		// 이미 계산된 TYPE면 재계산 금지
		if (cache.containsKey(vo.getNodeId())) {
			return cache.get(vo.getNodeId());
		}

		LocalDateTime minStart = null;
		LocalDateTime maxEnd = null;

		// nodeId로 자식 찾기
		String currentNodeId = vo.getNodeId(); // "TYPE_1", "TYPE_2" 등

		for (GanttVO child : list) {
			// parentId가 현재 TYPE의 nodeId와 같은 것이 자식
			if (currentNodeId.equals(child.getParentId())) {

				if ("ISSUE".equals(child.getRowType())) {
					String status = child.getIssueStatus();
					LocalDateTime start = child.getIssueStartDate();
					LocalDateTime end = child.getIssueEndDate();

					// 시작일: 신규이면 null 처리
					if ("신규".equals(status)) {
						start = null; // 시작일 계산에서 제외
					}

					if (start != null && (minStart == null || start.isBefore(minStart))) {
						minStart = start;
					}

					// 종료일: 신규 ISSUE도 포함, dueAt 그대로
					if (end != null && (maxEnd == null || end.isAfter(maxEnd))) {
						maxEnd = end;
					}

				} else if ("TYPE".equals(child.getRowType())) {
					// 하위 TYPE 재귀 호출 → 하위 TYPE 안의 ISSUE까지 포함
					LocalDateTime[] childDates = calculateTypeDate(child, list, cache);
					LocalDateTime childStart = childDates[0];
					LocalDateTime childEnd = childDates[1];

					if (childStart != null && (minStart == null || childStart.isBefore(minStart)))
						minStart = childStart;
					if (childEnd != null && (maxEnd == null || childEnd.isAfter(maxEnd)))
						maxEnd = childEnd;
				}
			}
		}

		// 계산 결과 VO에 저장
		vo.setTypeStartDate(minStart);
		vo.setTypeEndDate(maxEnd);

		LocalDateTime[] result = new LocalDateTime[] { minStart, maxEnd };
		cache.put(vo.getNodeId(), result);

		return result;
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

		// 신규 → 마감기한
		if (status == null || "신규".equals(status)) {
			if (vo.getDueAt() != null) {
				return vo.getDueAt().minusDays(1);
			} else {
				return null; // DueAt가 없으면 null 반환
			}
		}

		// 진행 / 해결 / 반려 / 완료 → startedAt
		if (vo.getStartedAt() != null) {
			return vo.getStartedAt();
		}

		// fallback
		return vo.getDueAt();
	}

	// ===== 일감 종료일 규칙 =====
	private LocalDateTime issueEndDate(GanttVO vo) {
		// 완료 → resolvedAt
		if ("완료".equals(vo.getIssueStatus()) && vo.getResolvedAt() != null) {
			return vo.getResolvedAt();
		}

		// 그 외 → dueAt
		return vo.getDueAt();
	}
}
