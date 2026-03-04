// ================================
// 1) MyPageMapper.java (완성본)
// ================================
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

	int updateBlockPosition(@Param("blockCode") Integer blockCode, @Param("userCode") Integer userCode,
			@Param("position") Integer position);

	// =========================
	// ME 모드 (권한필터 적용)
	// - isSys=true면 readableProjectCodes 무시(필터 안 함)
	// - isSys=false면 readableProjectCodes 필수(없으면 1=0)
	// =========================
	List<MyIssueRowDTO> selectAssignedIssues(@Param("userCode") Integer userCode, @Param("limit") int limit,
			@Param("isSys") boolean isSys, @Param("readableProjectCodes") List<Integer> readableProjectCodes,
			@Param("editableProjectCodes") List<Integer> editableProjectCodes, @Param("fixedProjectCode") Integer fixedProjectCode);

	List<MyIssueRowDTO> selectRegisteredIssues(@Param("userCode") Integer userCode, @Param("limit") int limit,
			@Param("isSys") boolean isSys, @Param("readableProjectCodes") List<Integer> readableProjectCodes,
			@Param("editableProjectCodes") List<Integer> editableProjectCodes, @Param("fixedProjectCode") Integer fixedProjectCode);

	List<MyNoticeDTO> selectRecentNotices(@Param("userCode") Integer userCode, @Param("limit") int limit,
			@Param("isSys") boolean isSys, @Param("readableProjectCodes") List<Integer> readableProjectCodes, @Param("fixedProjectCode") Integer fixedProjectCode);

	List<WeekIssueDTO> selectWeekCalendarIssues(@Param("userCode") Integer userCode, @Param("from") Date from,
			@Param("to") Date to, @Param("isSys") boolean isSys,
			@Param("readableProjectCodes") List<Integer> readableProjectCodes, @Param("fixedProjectCode") Integer fixedProjectCode);

	List<UserWorkLogVO> selectWorkLogs(@Param("userCode") Integer userCode, @Param("from") Date from,
			@Param("to") Date to, @Param("isSys") boolean isSys,
			@Param("readableProjectCodes") List<Integer> readableProjectCodes, @Param("fixedProjectCode") Integer fixedProjectCode);

	List<WeekGanttIssueDTO> selectWeekGanttIssues(@Param("userCode") Integer userCode, @Param("from") Date from,
			@Param("to") Date to, @Param("isSys") boolean isSys,
			@Param("readableProjectCodes") List<Integer> readableProjectCodes, @Param("fixedProjectCode") Integer fixedProjectCode);

	// =========================
	// ADMIN 모드 (프로젝트 1개 대상으로)
	// =========================
	List<AssigneeIssStaVO> selectAdminAssigneeIssSta(@Param("projectCode") Integer projectCode);

	List<CreatorIssStaVO> selectAdminCreatorIssSta(@Param("projectCode") Integer projectCode);

	String selectProjectName(@Param("projectCode") Integer projectCode);

	List<MyNoticeDTO> selectRecentNoticesByProject(@Param("projectCode") Integer projectCode,
			@Param("limit") int limit);

	List<WeekGanttIssueDTO> selectWeekGanttIssuesByProject(@Param("userCode") Integer userCode,
			@Param("projectCode") Integer projectCode, @Param("from") Date from, @Param("to") Date to);

	List<UserWorkLogVO> selectProjectWorkLogs(@Param("projectCode") Integer projectCode, @Param("from") Date from,
			@Param("to") Date to);

	// ✅ ADMIN 드릴다운
	List<MyIssueRowDTO> selectAssignedIssuesByProjectAndAssignee(@Param("projectCode") Integer projectCode,
			@Param("assigneeCode") Integer assigneeCode, @Param("limit") int limit);

	List<MyIssueRowDTO> selectRegisteredIssuesByProjectAndCreator(@Param("projectCode") Integer projectCode,
			@Param("creatorCode") Integer creatorCode, @Param("limit") int limit);

	// ✅ Authz.adminProjects(Set) 기반으로 코드+이름만 조회
	List<AdminProjectOptionDTO> selectProjectOptionsByCodes(@Param("codes") List<Integer> codes);
	
	List<AdminProjectOptionDTO> selectAllProjectOptions();
}