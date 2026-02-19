package com.yedam.app.calendar.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.calendar.service.CalendarVO;

public interface CalendarMapper {
	// 로그인 유저의 프로젝트 / 타입 / 일감 전체 목록
	public List<CalendarVO> selectCalendarList(@Param("userCode") Integer userCode, CalendarVO calendarVO);
}
