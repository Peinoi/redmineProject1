package com.yedam.app.login.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.yedam.app.login.service.LoginResultDTO;
import com.yedam.app.login.service.LoginResultType;
import com.yedam.app.login.service.LoginService;
import com.yedam.app.login.service.UserVO;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class LoginController {

	private final LoginService loginService;
	
	// 사원번호, 비밀번호 조회
	// 페이지 이동
	@GetMapping("/login")
	public String loginFrom(HttpServletRequest request, Model model) {
		
		String savedEmpNo = null;
		// 브라우저 쿠키가 null이 아니면
		if(request.getCookies() != null) {
			// 브라우저 쿠키를 하나씩 c 에 담는다
			for(Cookie c : request.getCookies()) {
				// c 에 담겨있는 Name이 REMEMBER_EMP_NO 이면
				if("REMEMBER_EMP_NO".equals(c.getName())) {
					// c 의 Value를 만들어둔 변수에 담는다
					savedEmpNo = c.getValue();
					// 반복문 종료
					break;
				}
			}
		}
		
		// 모델에 "savedEmpNo" 이름으로 넣는다
		model.addAttribute("savedEmpNo", savedEmpNo);
		return "login/login";
	}
	
	// 처리
	@PostMapping("/login")
	public String login(UserVO userVO
						,HttpSession session
						,RedirectAttributes ra
						,HttpServletResponse response) {
		
		
		LoginResultDTO result = loginService.login(userVO);
		
		// 사번/비번 오류
				if(result.getType() == LoginResultType.INVALID) {
					ra.addFlashAttribute("loginLockedMsg",
										 "사원번호 또는 비밀번호가 틀렸습니다.");
					return "redirect:/login";
				}
		
		// 계정 잠김
		if(result.getType() == LoginResultType.LOCKED) {
			ra.addFlashAttribute("loginLockedMsg", 
								 "해당 계정은 잠금 상태입니다. 관리자에게 문의하세요.");
			return "redirect:/login";
		}
		
		// 로그인 성공
		UserVO user = result.getUser();
		
		// 첫 로그인 확인
		boolean isFirstLogin = (user.getFirstLoginYn().equals("Y"));
		
		// 마지막 로그인 업데이트
		loginService.modifyLastLoginAt(user.getUserCode());
		
		// 로그인 성공 세션저장
		session.setAttribute("user", user);
		
		// 사원번호 기억
		String remember = userVO.getRememberEmpNo(); //체크박스 name과 매핑
		// 체크되면
		if("on".equals(remember)) {
			Cookie c = new Cookie("REMEMBER_EMP_NO", 
									String.valueOf(userVO.getEmployeeNo()));
			
			c.setPath("/"); // 사이트 전체에서 쿠키사용
			c.setMaxAge(60 * 60 * 24 * 30); // 30일
			c.setHttpOnly(true); // Http로만 보게 JS로 못 읽게(보안)
			response.addCookie(c);
		} else {
			// 체크 해제하면 쿠키 삭제
			Cookie c = new Cookie("REMEMBER_EMP_NO", "");
			c.setPath("/");
	        c.setMaxAge(0);
	        response.addCookie(c);
		}
		
		// 첫 로그인 필수정보 입력 페이지로 이동
		if(isFirstLogin) {
			return "redirect:/firstLogin";
		}
		
		return "redirect:/empList";
	}
	
	@GetMapping("/firstLogin")
	public String firstLoginForm(HttpSession session) {
		// 세션정보를 가져오고
		UserVO user = (UserVO) session.getAttribute("user");
		
		// 세션정보가 없는 접근이면 막기
		if(user == null) return "redirect:/login";
		
		// 첫 로그인이 아니면 막기
		if(!user.getFirstLoginYn().equals("Y")) {
			return "redirect:/empList";
		}
		
		return "login/firstLogin";
	}
	
	@PostMapping("/firstLogin")
	public String firstLoginSubmit(UserVO userVO
								  ,String passwordConfirm
								  ,HttpSession session
								  ,RedirectAttributes ra) {
		// 세션에서 user 가져오고
		UserVO sessionUser = (UserVO) session.getAttribute("user");
		// 세션에 데이터가 없다면 막기
		if(sessionUser == null) return "redirect:/login";
		
		// 세션에서 userCode 가져오기
		userVO.setUserCode(sessionUser.getUserCode());
		
		// 빈칸 체크
		if(isBlank(userVO.getPassword()) 
		   || isBlank(passwordConfirm)
		   || isBlank(userVO.getEmail())
		   || isBlank(userVO.getPhone())) {
			
			ra.addFlashAttribute("requiredInfoErrorMsg", "모든 항목을 입력해 주세요.");
			return "redirect:/firstLogin";
		}
		
		// 비밀번호 불일치
		if(!userVO.getPassword().equals(passwordConfirm)) {
			ra.addFlashAttribute("requiredInfoErrorMsg", "비밀번호 확인이 일치하지 않습니다.");
			return "redirect:/firstLogin";
		}
		
		// 필수정보 업데이트 실행
		int updated = loginService.modifyFirstLoginInfo(userVO);
		// 업데이트 실패
		if (updated == 0) {
			ra.addFlashAttribute("requiredInfoErrorMsg", "저장에 실패했습니다. 다시 시도하세요.");
			return "redirect:/firstLogin";
		}
		
		// 세션 갱신
		sessionUser.setFirstLoginYn("N");
		sessionUser.setEmail(userVO.getEmail());
		sessionUser.setPhone(userVO.getPhone());
		session.setAttribute("user", sessionUser);
		
		return "redirect:/empList";
	}
	
	// 로그아웃
	@GetMapping("/logout")
	public String logout(HttpSession session) {
		session.invalidate(); // 세션 제거
		return "redirect:/login";
	}
	
	// 널이거나 공백을 체크하는 메서드
	private boolean isBlank(String s) {
	    return s == null || s.trim().isEmpty();
	}
}
