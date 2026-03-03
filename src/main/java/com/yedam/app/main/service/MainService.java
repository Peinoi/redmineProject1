package com.yedam.app.main.service;

import java.util.List;
import java.util.Set;

import com.yedam.app.mypage.service.MyNoticeDTO;

public interface MainService {
	// 프로젝트 현황 select
	public List<MainProjectStatusVO> findCodeNameCnt(Integer userCode);

	// 유저의 프로젝트별 일감 현황
	public List<ProIssStaVO> findProIssSta(Integer userCode);

	// 프로젝트 관리자 여부 확인
	 public boolean findIsAdminInProject(Integer userCode, Integer projectCode);

	// 본인이 관리자인 프로젝트
	 public List<Integer> findAdminProByUserCode(Integer userCode);

	// 프로젝트 내부 담당자별 일감 현황
	public List<AssigneeIssStaVO> findAssIssSta(Integer projectCode);

	// 프로젝트 내부 본인 일감현황
	public List<AssigneeIssStaVO> findMyAssIssSta(Integer projectCode, Integer userCode);

	// 내가 속한 진행중 프로젝트들의 전체 현재 진척도(가중 평균)
	public int findTodayProgressRate(Integer userCode);

	// 본인 이슈 Top 5
	public List<MyTopIssueVO> findMyTopIssues(Integer projectCode, Integer userCode);

	public List<MyNoticeDTO> findRecentNoticesForMain(Integer userCode, int limit);

	public List<PickedIssueDTO> findPickedIssues(Integer projectCode, Integer assigneeCode, String statusId,
			Integer userCode, boolean isAdmin, int limit);
	
	public String findProjectName(Integer projectCode);
	
	// 달력 메모
	public List<MainMemoDTO> findMemosByMonth(Integer userCode, String month); // "YYYY-MM"
	public MainMemoDTO findMemoByDate(Integer userCode, String date);         // "YYYY-MM-DD"
	public boolean saveMemo(Integer userCode, String date, String content);
	public boolean removeMemo(Integer userCode, String date);
	
	int findTodayProgressRate(Integer userCode, Set<Integer> readableProjects);
	
	List<MainProjectStatusVO> findCodeNameCntByProjects(Set<Integer> readableProjects, Set<Integer> adminProjects);
	
	// 공휴일
	List<MainHolidayDTO> findHolidaysByMonth(String month); // "YYYY-MM"
}
