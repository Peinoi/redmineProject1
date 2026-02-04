package com.yedam.app.login.web;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.yedam.app.login.service.FindPwService;
import com.yedam.app.login.service.FindPwVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class FindPwController {

	private final FindPwService findPwService;
	
	private static final String S_EMAIL = "";   // 인증 대상 이메일
	private static final String S_OTP = "";     // 인증번호
	private static final String S_EXPIRES = ""; // 만료시간(밀리초)
	
	private static final long OTP_TTL_MS = TimeUnit.MINUTES.toMillis(10);
	
	// 이메일, 이름, 전화번호 select
	// 페이지 이동
	@GetMapping("/findPw")
	public String findPwFrom() {
		return "login/findPw";
	}
	
	// 처리
	@PostMapping("/findPw")
	public String findPw(FindPwVO findPwVO
						,HttpSession session
						,RedirectAttributes ra) {
		
		// 비밀번호 찾기 조회
		FindPwVO findUser = findPwService.FindPwInfo(findPwVO);
		
		if (findUser == null) {
			// 비밀번호 찾기 실패
			ra.addAttribute("findPwErrorMsg", "입력하신 정보가 올바르지 않습니다.");
			return "redirect:/findPw";
		}
		
		// 인증번호 생성
		String otp = generateOtp6();
		
		// 세션 저장
		session.setAttribute(S_EMAIL, findUser.getEmail());
		session.setAttribute(S_OTP, otp);
		session.setAttribute(S_EXPIRES, System.currentTimeMillis() + OTP_TTL_MS); //현재 시간부터 10분 뒤 만료
		
		// 이메일 발송
		// mailService.sendOtp(findUser.getEmail(), otp);
		
		return "redirect:/findPw/verify";
	}
	
	private String generateOtp6() {
		SecureRandom r = new SecureRandom();
		int n = r.nextInt(900000) + 100000; // 100000~999999
		return String.valueOf(n); // String으로 형변환
	}
}
