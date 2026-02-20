package com.yedam.app.overview.mapper;

import java.util.List;

import com.yedam.app.main.service.ProIssStaVO;
import com.yedam.app.mypage.service.MyNoticeDTO;

public interface OverviewMapper {
	// 프로젝트 일감 현황 단건 조회
	public List<ProIssStaVO> selectProjectIssueStatus(Integer projectCode);

	// 내가 참여중인 프로젝트의 공지 목록(최신순으로)
	public List<MyNoticeDTO> selectRecentNotices(int userCode, int projectCode);

	public int selectRecentNotices_COUNT(int userCode, int projectCode);
}
