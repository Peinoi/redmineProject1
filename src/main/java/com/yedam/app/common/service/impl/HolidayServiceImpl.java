package com.yedam.app.common.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.yedam.app.common.mapper.HolidayMapper;
import com.yedam.app.common.service.HolidayService;
import com.yedam.app.common.service.HolidayVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HolidayServiceImpl implements HolidayService {

	private final HolidayMapper holidayMapper;
	
	@Override
	public List<HolidayVO> getHolidayList() {
		return holidayMapper.selectHolidyList();
	}

}
