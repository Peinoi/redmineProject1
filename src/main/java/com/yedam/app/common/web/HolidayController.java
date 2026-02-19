package com.yedam.app.common.web;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.common.service.HolidayService;
import com.yedam.app.common.service.HolidayVO;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class HolidayController {

	private final HolidayService holidayService;
	
	@GetMapping("holidayData")
	@ResponseBody
	public List<HolidayVO> holidayData() {
		return holidayService.getHolidayList();
	}
}
