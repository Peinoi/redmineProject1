package com.yedam.app.main.service.impl;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.yedam.app.main.mapper.MainMapper;
import com.yedam.app.main.service.AssigneeIssStaVO;
import com.yedam.app.main.service.MainHolidayDTO;
import com.yedam.app.main.service.MainMemoDTO;
import com.yedam.app.main.service.MainProjectStatusVO;
import com.yedam.app.main.service.MainService;
import com.yedam.app.main.service.MyTopIssueVO;
import com.yedam.app.main.service.PickedIssueDTO;
import com.yedam.app.main.service.ProIssStaVO;
import com.yedam.app.mypage.service.MyNoticeDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MainServiceImpl implements MainService{
	
	private final MainMapper mainMapper;
	private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

	@Override
	public List<MainProjectStatusVO> findCodeNameCnt(Integer userCode) {
		return mainMapper.selectCodeNameCnt(userCode);
	}

	@Override
	public List<ProIssStaVO> findProIssSta(Integer userCode) {
		return mainMapper.selectProIssSta(userCode);
	}

	@Override
	public List<Integer> findAdminProByUserCode(Integer userCode) {
		return mainMapper.selectAdminProByUserCode(userCode);
	}

	@Override
	public List<AssigneeIssStaVO> findAssIssSta(Integer projectCode) {
		return mainMapper.selectAssIssSta(projectCode);
	}

	@Override
	public boolean findIsAdminInProject(Integer userCode, Integer projectCode) {
		return mainMapper.selectIsAdminInProject(userCode, projectCode) > 0;
	}

	@Override
	public List<AssigneeIssStaVO> findMyAssIssSta(Integer projectCode, Integer userCode) {
		return mainMapper.selectMyAssIssSta(projectCode, userCode);
	}

	@Override
	public int findTodayProgressRate(Integer userCode) {
		return mainMapper.selectTodayProgressRate(userCode);
	}

	@Override
	public List<MyTopIssueVO> findMyTopIssues(Integer projectCode, Integer userCode) {
		return mainMapper.selectMyTopIssues(projectCode, userCode);
	}
	
	@Override
	public List<MyNoticeDTO> findRecentNoticesForMain(Integer userCode, int limit) {
	  return mainMapper.selectRecentNoticesForMain(userCode, limit);
	}

	@Override
	public List<PickedIssueDTO> findPickedIssues(Integer projectCode, Integer assigneeCode, String statusId, Integer userCode, boolean isAdmin, int limit) {
	  return mainMapper.selectPickedIssues(projectCode, assigneeCode, statusId, userCode, limit, isAdmin ? "Y" : "N");
	}
	
	@Override
	public String findProjectName(Integer projectCode) {
	  return mainMapper.selectProjectName(projectCode);
	}
	
	@Override
	public List<MainMemoDTO> findMemosByMonth(Integer userCode, String month) {
	  YearMonth ym = YearMonth.parse(month); // "YYYY-MM"
	  LocalDate from = ym.atDay(1);
	  LocalDate to = ym.plusMonths(1).atDay(1);

	  return mainMapper.selectMemosByMonth(
	      userCode,
	      from.format(DTF),
	      to.format(DTF)
	  );
	}

	@Override
	public MainMemoDTO findMemoByDate(Integer userCode, String date) {
	  return mainMapper.selectMemoByDate(userCode, date);
	}

	@Override
	public boolean saveMemo(Integer userCode, String date, String content) {
	  if (date == null || date.isBlank()) return false;

	  // 정책: 빈 내용이면 삭제 처리(UX 좋음)
	  if (content == null || content.trim().isEmpty()) {
	    mainMapper.deleteMemo(userCode, date);
	    return true;
	  }

	  return mainMapper.upsertMemo(userCode, date, content) >= 0;
	}

	@Override
	public boolean removeMemo(Integer userCode, String date) {
	  if (date == null || date.isBlank()) return false;
	  return mainMapper.deleteMemo(userCode, date) > 0;
	}

	@Override
	public int findTodayProgressRate(Integer userCode, Set<Integer> readableProjects) {
	    if (readableProjects == null || readableProjects.isEmpty()) return 0;
	    return mainMapper.selectTodayProgressRateByProjects(userCode, new ArrayList<>(readableProjects));
	}
	
	@Override
	public List<MainProjectStatusVO> findCodeNameCntByProjects(Set<Integer> readableProjects, Set<Integer> adminProjects) {
	    if (readableProjects == null || readableProjects.isEmpty()) return List.of();
	    List<Integer> readable = new ArrayList<>(readableProjects);
	    List<Integer> admin    = (adminProjects == null ? List.of() : new ArrayList<>(adminProjects));
	    return mainMapper.selectCodeNameCntByProjects2(readable, admin);
	}
	
	@Override
	public List<MainHolidayDTO> findHolidaysByMonth(String month) {
	  YearMonth ym = YearMonth.parse(month);
	  LocalDate from = ym.atDay(1);
	  LocalDate to   = ym.plusMonths(1).atDay(1);

	  return mainMapper.selectHolidaysByMonth(
	      from.format(DTF),
	      to.format(DTF)
	  );
	}
	
}
