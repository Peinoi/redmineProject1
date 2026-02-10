package com.yedam.app.main.service;

import java.util.List;

public interface MainService {
	// 프로젝트 현황 select
	public List<MainProjectStatusVO> findCodeNameCnt(Integer userCode);
	
	// 유저의 프로젝트별 일감 현황
	public List<MainProjectStatusVO> findProIssSta(Integer userCode);
}
