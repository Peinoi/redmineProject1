package com.yedam.app.main.mapper;

import java.util.List;

import com.yedam.app.main.service.MainProjectStatusVO;

public interface MainMapper {
	// 프로젝트 현황 select
	public List<MainProjectStatusVO> selectCodeNameCnt(
			Integer userCode);
	
	// 유저의 프로젝트별 일감 현황
	public List<MainProjectStatusVO> selectProIssSta(Integer userCode);
}
