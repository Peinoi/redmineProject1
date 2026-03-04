package com.yedam.app.user.service;

import java.util.List;
import java.util.Map;

import com.yedam.app.login.service.UserVO;

public interface UserPageService {
	// 기본 정보
	UserVO getProfile(Integer userCode);

	// 일감현황: 내가 등록한 일감, 내가 담당자인 일감
	UserDualIssueStaVO getIssueSummaryDual(Integer userCode, List<Integer> readableProjectCodes, Integer fixedProjectCode);

	// 작업현황(활동 로그)
	Map<String, List<WorkLogViewDTO>> getWorkLogsForView(Integer userCode, String actorName, int days,
			List<Integer> readableProjectCodes, Integer fixedProjectCode);

}
