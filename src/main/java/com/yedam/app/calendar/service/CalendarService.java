package com.yedam.app.calendar.service;

import java.util.List;

import org.apache.ibatis.annotations.Param;

public interface CalendarService {
	// 로그인 유저의 프로젝트 / 타입 / 일감 전체 목록
	public List<CalendarVO> getCalendarList(@Param("userCode") Integer userCode, CalendarVO calendarVO);
}
