package com.yedam.app.mypage.mapper;

import java.util.Date;
import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.main.service.AssigneeIssStaVO;
import com.yedam.app.mypage.service.AdminProjectOptionDTO;
import com.yedam.app.mypage.service.BlockVO;
import com.yedam.app.mypage.service.CreatorIssStaVO;
import com.yedam.app.mypage.service.MyIssueRowDTO;
import com.yedam.app.mypage.service.MyNoticeDTO;
import com.yedam.app.mypage.service.WeekGanttIssueDTO;
import com.yedam.app.mypage.service.WeekIssueDTO;
import com.yedam.app.user.service.UserWorkLogVO;

public interface MyPageMapper {

	// 블록 CRUD
	List<BlockVO> selectBlocks(Integer userCode);
	
	int insertBlock(BlockVO vo);
	
	int deleteBlock(@Param("blockCode") Integer blockCode, @Param("userCode") Integer userCode);
	
	int updateBlockPosition(@Param("blockCode") Integer blockCode,
            @Param("userCode") Integer userCode,
            @Param("position") Integer position);
	
	// 블록 데이터
	List<MyIssueRowDTO> selectAssignedIssues(@Param("userCode") Integer userCode, @Param("limit") int limit);
	
	List<MyIssueRowDTO> selectRegisteredIssues(@Param("userCode") Integer userCode, @Param("limit") int limit);

	List<MyNoticeDTO> selectRecentNotices(@Param("userCode") Integer userCode, @Param("limit") int limit);

	List<WeekIssueDTO> selectWeekCalendarIssues(@Param("userCode") Integer userCode,
	                                              @Param("from") Date from,
	                                              @Param("to") Date to);

	List<UserWorkLogVO> selectWorkLogs(@Param("userCode") Integer userCode,
	                                     @Param("from") Date from,
	                                     @Param("to") Date to);
	
	List<WeekGanttIssueDTO> selectWeekGanttIssues(@Param("userCode") Integer userCode,
            @Param("from") Date from,
            @Param("to") Date to);

	List<AssigneeIssStaVO> selectAdminAssigneeIssSta(@Param("projectCode") Integer projectCode);
	
	List<CreatorIssStaVO> selectAdminCreatorIssSta(@Param("projectCode") Integer projectCode);
	
	List<Integer> selectAdminProjectCodes(@Param("userCode") Integer userCode);
	
	String selectProjectName(@Param("projectCode") Integer projectCode);
	
	// ✅ ADMIN 모드: 특정 프로젝트 공지
	List<MyNoticeDTO> selectRecentNoticesByProject(@Param("projectCode") Integer projectCode,
	                                               @Param("limit") int limit);

	// ✅ ADMIN 모드: 특정 프로젝트 주간 간트(할당/등록 플래그는 userCode 기준)
	List<WeekGanttIssueDTO> selectWeekGanttIssuesByProject(@Param("userCode") Integer userCode,
	                                                       @Param("projectCode") Integer projectCode,
	                                                       @Param("from") Date from,
	                                                       @Param("to") Date to);

	// ✅ ADMIN 모드: 특정 프로젝트 작업내역(로그)
	List<UserWorkLogVO> selectProjectWorkLogs(@Param("projectCode") Integer projectCode,
	                                          @Param("from") Date from,
	                                          @Param("to") Date to);
	
	// 관리자 프로젝트 목록(코드+이름)
	List<AdminProjectOptionDTO> selectAdminProjects(@Param("userCode") Integer userCode);
	
	// ✅ ADMIN 드릴다운: 프로젝트 + 담당자(할당)
	List<MyIssueRowDTO> selectAssignedIssuesByProjectAndAssignee(
	    @Param("projectCode") Integer projectCode,
	    @Param("assigneeCode") Integer assigneeCode,
	    @Param("limit") int limit
	);

	// ✅ ADMIN 드릴다운: 프로젝트 + 등록자(등록)
	List<MyIssueRowDTO> selectRegisteredIssuesByProjectAndCreator(
	    @Param("projectCode") Integer projectCode,
	    @Param("creatorCode") Integer creatorCode,
	    @Param("limit") int limit
	);
}
