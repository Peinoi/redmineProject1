package com.yedam.app.user.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.user.service.UserPageService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class UserPageController {

	private final UserPageService userPageService;
	
	@GetMapping("/users/{userCode}")
	public String userPage(
						@PathVariable Integer userCode,
		      			@RequestParam(defaultValue = "1") int days,
		      			HttpSession session,
		      			Model model) {
		// 로그인 체크
		if (session.getAttribute("user") == null) return "redirect:/login";
		 
		UserVO profile = userPageService.getProfile(userCode);
		if (profile == null) return "redirect:/G2main";
		
		model.addAttribute("profile", profile);
		model.addAttribute("issueStaDual", userPageService.getIssueSummaryDual(userCode));
	    model.addAttribute("workLogsByDay", userPageService.getWorkLogsForView(userCode, profile.getName(), days));
	    model.addAttribute("days", days);
		
		return "user/userPage";
	}
}
