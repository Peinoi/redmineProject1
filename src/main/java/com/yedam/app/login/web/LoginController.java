package com.yedam.app.login.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.yedam.app.login.service.LoginService;
import com.yedam.app.login.service.LoginVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class LoginController {

	private final LoginService loginService;
	
	// 사원번호, 비밀번호 조회
	// 페이지 이동
	@GetMapping("/login")
	public String loginFrom() {
		return "login/login";
	}
	
	// 처리
	@PostMapping("/login")
	public String login(LoginVO loginVO
						,HttpSession session
						,RedirectAttributes ra) {
		
		
		// 로그인 조회
		LoginVO user = loginService.findLoginInfo(loginVO);
		
		if (user == null) {
			// 로그인 실패
			ra.addFlashAttribute("loginErrorMsg", "사원번호 또는 비밀번호가 틀렸습니다.");
			return "redirect:/login";
		}
		
		// 로그인 성공 세션저장
		session.setAttribute("user", user);
		
		return "redirect:/";
	}
	
	// 로그아웃
	@GetMapping("/logout")
	public String logout(HttpSession session) {
		session.invalidate(); // 세션 제거
		return "redirect:/login";
	}
}
