package com.yedam.app.user.mapper;

import java.util.Date;
import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.user.service.UserDualIssueStaVO;
import com.yedam.app.user.service.UserWorkLogVO;

public interface UserPageMapper {
	// 기본 정보
	UserVO selectUserProfile(Integer userCode);

	// 일감현황: 내가 등록한 일감, 내가 담당자인 일감
	UserDualIssueStaVO selectUserIssueSummaryDual(Integer userCode, List<Integer> readableProjectCodes,@Param("fixedProjectCode") Integer fixedProjectCode);

	// 작업현황(활동 로그)
	List<UserWorkLogVO> selectWorkLogs(Integer userCode, Date from, Date to, List<Integer> readableProjectCodes, @Param("fixedProjectCode") Integer fixedProjectCode);
}
