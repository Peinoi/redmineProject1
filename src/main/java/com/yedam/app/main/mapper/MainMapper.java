package com.yedam.app.main.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.main.service.AssigneeIssStaVO;
import com.yedam.app.main.service.MainProjectStatusVO;
import com.yedam.app.main.service.MyTopIssueVO;
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
}
