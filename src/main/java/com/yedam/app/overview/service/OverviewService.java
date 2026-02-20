package com.yedam.app.overview.service;

import java.util.List;

import com.github.pagehelper.PageInfo;
import com.yedam.app.main.service.ProIssStaVO;
import com.yedam.app.mypage.service.MyNoticeDTO;

public interface OverviewService {
	// 프로젝트 일감 현황 단건 조회
	public List<ProIssStaVO> getProjectIssueStatus(Integer projectCode);

	// 내가 참여중인 프로젝트의 공지 목록(최신순으로)
	public PageInfo<MyNoticeDTO> getRecentNotices(int userCode, int projectCode, int pageNum);
}
