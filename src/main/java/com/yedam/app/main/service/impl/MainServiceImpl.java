package com.yedam.app.main.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.yedam.app.main.mapper.MainMapper;
import com.yedam.app.main.service.AssigneeIssStaVO;
import com.yedam.app.main.service.MainProjectStatusVO;
import com.yedam.app.main.service.MainService;
import com.yedam.app.main.service.MyTopIssueVO;
import com.yedam.app.main.service.ProIssStaVO;
import com.yedam.app.mypage.service.MyNoticeDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MainServiceImpl implements MainService{
	
	private final MainMapper mainMapper;

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

}
