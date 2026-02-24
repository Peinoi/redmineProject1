package com.yedam.app.calendar.web;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.calendar.service.CalendarService;
import com.yedam.app.calendar.service.CalendarVO;
import com.yedam.app.login.service.UserVO;
import com.yedam.app.main.service.MainService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Controller
public class CalendarController {

	private final CalendarService calendarService;
	private final MainService mainService;

	@GetMapping("calendarData")
	@ResponseBody
	public List<CalendarVO> calendarData(HttpSession session, CalendarVO calendarVO) {
		UserVO user = (UserVO) session.getAttribute("user");
		Integer userCode = user.getUserCode();
		return calendarService.getCalendarList(userCode, calendarVO);
	}

	@GetMapping("calendar")
	public String calendar(HttpSession session, Model model) {

		// 로그인 사용자 정보
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null) {
			return "login/login"; // 로그인 안 되어 있으면 로그인 페이지로
		}

		Integer userCode = user.getUserCode();

		List<Integer> adminProList = mainService.findAdminProByUserCode(userCode);

		boolean isAdmin = adminProList != null && !adminProList.isEmpty();

		model.addAttribute("adminProjectList", adminProList != null ? adminProList : List.of());
		model.addAttribute("isAdmin", isAdmin);

		return "calendar/list";
	}
}
