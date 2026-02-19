package com.yedam.app.calendar.web;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.calendar.service.CalendarService;
import com.yedam.app.calendar.service.CalendarVO;
import com.yedam.app.login.service.UserVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Controller
public class CalendarController {

	private final CalendarService calendarService;
	
	@GetMapping("calendarData")
	@ResponseBody
	public List<CalendarVO> calendarData(HttpSession session, CalendarVO calendarVO) {
		UserVO user = (UserVO) session.getAttribute("user");
		Integer userCode = user.getUserCode();
		return calendarService.getCalendarList(userCode, calendarVO);
	}
	
	@GetMapping("calendar")
	public String calendar() {
		return "calendar/list";
	}
}
