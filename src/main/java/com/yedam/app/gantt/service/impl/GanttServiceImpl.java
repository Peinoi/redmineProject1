package com.yedam.app.gantt.service.impl;

import java.time.LocalDateTime;
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
	public List<GanttVO> getGanttList(GanttVO ganttVO) {
		List<GanttVO> list = ganttMapper.selectGanttList(ganttVO);

		// ===== 프로젝트별 진척도 계산용 =====
		Map<Integer, Integer> progressSumMap = new HashMap<>();
		Map<Integer, Integer> issueCountMap = new HashMap<>();

		// 1. 프로젝트별 progress 합계 / 개수 계산
		for (GanttVO vo : list) {
			Integer projectCode = vo.getProjectCode();
			if (projectCode == null)
				continue;

			int progress = vo.getProgress() != null ? vo.getProgress() : 0;

			progressSumMap.put(projectCode, progressSumMap.getOrDefault(projectCode, 0) + progress);

			issueCountMap.put(projectCode, issueCountMap.getOrDefault(projectCode, 0) + 1);
		}

		// ===== 프로젝트별 종료일 계산용 =====
		Map<Integer, LocalDateTime> projectEndDateMap = new HashMap<>();

		// 2. 일감 기준 MAX 종료일 계산
		for (GanttVO vo : list) {
			Integer projectCode = vo.getProjectCode();
			if (projectCode == null)
				continue;

			LocalDateTime issueEnd = issueEndDate(vo);
			if (issueEnd == null)
				continue;

			LocalDateTime currentMax = projectEndDateMap.get(projectCode);
			if (currentMax == null || issueEnd.isAfter(currentMax)) {
				projectEndDateMap.put(projectCode, issueEnd);
			}
		}

		// 3. projectProgress / projectEndDate / issueStartDate /
		// issueEndDate
		for (GanttVO vo : list) {
			Integer projectCode = vo.getProjectCode();

			// ===== 프로젝트 진척도 =====
			if (projectCode == null) {
				vo.setProjectProgress(0);
			} else {
				int sum = progressSumMap.getOrDefault(projectCode, 0);
				int count = issueCountMap.getOrDefault(projectCode, 0);
				vo.setProjectProgress(count == 0 ? 0 : sum / count);
			}

			// ===== 프로젝트 종료일 =====
			if ("완료".equals(vo.getProjectStatus())) {
				vo.setProjectEndDate(vo.getCompletedOn());
			} else {
				vo.setProjectEndDate(projectEndDateMap.get(projectCode));
			}

			// ===== 일감 날짜 =====
			vo.setIssueStartDate(issueStartDate(vo));
			vo.setIssueEndDate(issueEndDate(vo));
		}

		return list;
	}

	// ===== 일감 시작일 규칙 =====
	private LocalDateTime issueStartDate(GanttVO vo) {
		String status = vo.getIssueStatus();

		// 신규 → createdAt
		if (status == null || "신규".equals(status)) {
			return vo.getCreatedAt();
		}

		// 진행 / 해결 / 반려 → startedAt
		if (vo.getStartedAt() != null) {
			return vo.getStartedAt();
		}

		// fallback
		return vo.getCreatedAt();
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
