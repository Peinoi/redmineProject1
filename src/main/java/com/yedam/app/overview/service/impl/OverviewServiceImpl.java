package com.yedam.app.overview.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.yedam.app.main.service.ProIssStaVO;
import com.yedam.app.mypage.service.MyNoticeDTO;
import com.yedam.app.overview.mapper.OverviewMapper;
import com.yedam.app.overview.service.OverviewService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OverviewServiceImpl implements OverviewService {

	private final OverviewMapper overviewMapper;
	
	
	@Override
	public List<ProIssStaVO> getProjectIssueStatus(Integer projectCode) {
		return overviewMapper.selectProjectIssueStatus(projectCode);
	}

	@Override
	public PageInfo<MyNoticeDTO> getRecentNotices(int userCode, int projectCode, int pageNum) {
		int perPage = 10;
		PageInfo<MyNoticeDTO> page = PageHelper.startPage(pageNum, perPage)
                .doSelectPageInfo(() -> overviewMapper.selectRecentNotices(userCode, projectCode));
		return page;
	}


}
