package com.yedam.app.main.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.main.service.AssigneeIssStaVO;
import com.yedam.app.main.service.MainHolidayDTO;
import com.yedam.app.main.service.MainMemoDTO;
import com.yedam.app.main.service.MainProjectStatusVO;
import com.yedam.app.main.service.MyTopIssueVO;
import com.yedam.app.main.service.PickedIssueDTO;
import com.yedam.app.main.service.ProIssStaVO;
import com.yedam.app.mypage.service.MyNoticeDTO;

public interface MainMapper {
	// 프로젝트 현황 select
	public List<MainProjectStatusVO> selectCodeNameCnt(Integer userCode);

	// 유저의 프로젝트별 일감 현황
	public List<ProIssStaVO> selectProIssSta(Integer userCode);

	// 프로젝트 관리자 여부 확인
	public int selectIsAdminInProject(Integer userCode, Integer projectCode);

	// 본인이 관리자인 프로젝트
	public List<Integer> selectAdminProByUserCode(Integer userCode);

	// 프로젝트 내부 담당자별 일감 현황
	public List<AssigneeIssStaVO> selectAssIssSta(Integer projectCode);

	// 프로젝트 내부 본인 일감현황
	public List<AssigneeIssStaVO> selectMyAssIssSta(Integer projectCode, Integer userCode);

	// 내가 속한 진행중 프로젝트들의 전체 현재 진척도(가중 평균)
	public int selectTodayProgressRate(Integer userCode);

	// 본인 이슈 Top 5
	public List<MyTopIssueVO> selectMyTopIssues(Integer projectCode, Integer userCode);

	public List<MyNoticeDTO> selectRecentNoticesForMain(@Param("userCode") Integer userCode, @Param("limit") int limit);

	public List<PickedIssueDTO> selectPickedIssues(@Param("projectCode") Integer projectCode,
			@Param("assigneeCode") Integer assigneeCode, @Param("statusId") String statusId,
			@Param("userCode") Integer userCode, @Param("limit") int limit, @Param("isAdmin") String isAdmin);

	// 프로젝트명 조회
	public String selectProjectName(Integer projectCode);

	// ✅ 월 메모 조회(캘린더 점/툴팁용)
	List<MainMemoDTO> selectMemosByMonth(@Param("userCode") Integer userCode, @Param("fromDate") String fromDate, // "YYYY-MM-DD"
			@Param("toDate") String toDate // "YYYY-MM-DD" (exclusive)
	);

	// ✅ 하루 메모 조회(모달 열 때)
	MainMemoDTO selectMemoByDate(@Param("userCode") Integer userCode, @Param("memoDate") String memoDate // "YYYY-MM-DD"
	);

	// ✅ 저장(업서트: 있으면 update, 없으면 insert)
	int upsertMemo(@Param("userCode") Integer userCode, @Param("memoDate") String memoDate, // "YYYY-MM-DD"
			@Param("content") String content);

	// ✅ 삭제
	int deleteMemo(@Param("userCode") Integer userCode, @Param("memoDate") String memoDate // "YYYY-MM-DD"
	);

	int selectTodayProgressRateByProjects(@Param("userCode") Integer userCode,
			@Param("projectCodes") List<Integer> projectCodes);

	List<MainProjectStatusVO> selectCodeNameCntByProjects2(
			@Param("readableProjectCodes") List<Integer> readableProjectCodes,
			@Param("adminProjectCodes") List<Integer> adminProjectCodes);

	// 공휴일
	List<MainHolidayDTO> selectHolidaysByMonth(String fromDate, String toDate);
}
