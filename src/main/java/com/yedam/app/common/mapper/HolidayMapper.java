package com.yedam.app.common.mapper;

import java.util.List;

import com.yedam.app.common.service.HolidayVO;

public interface HolidayMapper {
	
	// 전체조회
	public List<HolidayVO> selectHolidyList();
}
