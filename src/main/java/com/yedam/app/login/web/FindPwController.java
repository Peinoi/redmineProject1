package com.yedam.app.login.web;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.yedam.app.login.service.FindPwService;
import com.yedam.app.login.service.UserVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class FindPwController {

	private final FindPwService findPwService;
	
	// 메일 세션
	private static final String S_USER_CODE = "FIND_USER_CODE";// 유저코드
	private static final String S_EMAIL = "FINDPW_EMAIL";   // 인증 대상 이메일
	private static final String S_OTP = "FINDPW_OTP";     // 인증번호
	private static final String S_EXPIRES = "FINDPW_EXPIRES"; // 만료시간(밀리초)
	
	private static final long OTP_TTL_MS = TimeUnit.MINUTES.toMillis(5);
	
	// 이메일, 이름, 전화번호 select
	//// 페이지 이동
	@GetMapping("/findPw")
	public String findPwForm() {
		return "login/findPw";
	}
	
	//// 처리
	@PostMapping("/findPw")
	public String findPw(UserVO userVO
						,HttpSession session
						,RedirectAttributes ra) {
		
		// 비밀번호 찾기 조회
		UserVO findUser = findPwService.FindPwInfo(userVO);
		
		if (findUser == null) {
			// 비밀번호 찾기 실패
			ra.addFlashAttribute("findPwErrorMsg", "입력하신 정보가 올바르지 않습니다.");
			return "redirect:/findPw";
		}
		
		// 인증번호 담기
		String otp = generateOtp6();
		
		// 세션 저장
		session.setAttribute(S_USER_CODE, findUser.getUserCode());
		session.setAttribute(S_EMAIL, findUser.getEmail());
		session.setAttribute(S_OTP, otp);
		session.setAttribute(S_EXPIRES, System.currentTimeMillis() + OTP_TTL_MS); //현재 시간부터 10분 뒤 만료
		
		// ✅ 비동기 메일 발송 (바로 리턴)
		findPwService.sendOtpMailAsync(findUser.getEmail(), otp);
		
		
		return "redirect:/findPw/verify";
	}
	
	// 메일 인증
	//// 페이지
	@GetMapping("/findPw/verify")
	public String verifyForm(HttpSession session, RedirectAttributes ra, Model model) {
		// 만료시간 가져오기
		Long expires = (Long) session.getAttribute(S_EXPIRES);
		
		// 가져온 만료시간이 null이면
		if (expires == null) {
			ra.addFlashAttribute("findPwErrorMsg", "인증 세션이 없습니다. 다시 인증메일을 요청해주세요.");
			return "redirect:/findPw";
		}
		
		// 모델에 expiresAt 이름으로 시간 저장
		model.addAttribute("expiresAt", expires);
		
		return "login/verify";
	}
	
	//// 처리
	@PostMapping("/findPw/verify")
	public String verify(@RequestParam("inputOtp") String inputOtp
						,HttpSession session
						,RedirectAttributes ra) {
		
		// 세션 값 꺼내기
		String savedOtp = (String) session.getAttribute(S_OTP);
	    Long expires = (Long) session.getAttribute(S_EXPIRES);
	    String email = (String) session.getAttribute(S_EMAIL);
	    
	    // 세션이 없거나 만료되었으면 비밀번호 찾기로
	    if (savedOtp == null || expires == null || email == null) {
	        ra.addFlashAttribute("verifyErrorMsg", "인증 세션이 만료되었습니다. 다시 인증메일을 요청해주세요.");
	        return "redirect:/findPw";
	    }
	    
	    // 시간 만료 체크
	    if (System.currentTimeMillis() > expires) {
	    	// 보안상 만료되면 세션값 제거
	        session.removeAttribute(S_OTP);
	        session.removeAttribute(S_EXPIRES);
	        
	        ra.addFlashAttribute("verifyErrorMsg", "인증번호가 만료되었습니다. 다시 인증메일을 요청해주세요.");
	        return "redirect:/findPw";
	    }
	    
	    // OTP 비교
	    if(!savedOtp.equals(inputOtp == null ? "" : inputOtp.trim())) {
	    	ra.addFlashAttribute("verifyErrorMsg", "인증번호가 올바르지 않습니다.");
	        return "redirect:/findPw/verify";
	    }
	    
	    // 성공 처리
	    // OTP 제거
	    session.removeAttribute(S_OTP);
	    session.removeAttribute(S_EXPIRES);
	    // 성공했으니 세션에 FINDPW_VERIFIED = true 넣기
	    session.setAttribute("FINDPW_VERIFIED", true);
	    
	    // 비밀번호 재설정 페이지로 이동
		return "redirect:/findPw/pwReset";
	}
	
	// 비밀번호 재설정
	//// 페이지
	@GetMapping("/findPw/pwReset")
	public String pwResetForm(HttpSession session, RedirectAttributes ra, Model model) {
		
		// 비밀번호 성공 메세지가 넘어온 경우 세션검증 없이 페이지 오픈
		if (model.containsAttribute("pwResetSuccessMsg")) {
	        return "login/pwReset";
	    }
		
		Boolean verified = (Boolean) session.getAttribute("FINDPW_VERIFIED");
		Integer userCode = (Integer) session.getAttribute(S_USER_CODE);
		
		if (verified == null || !verified || userCode == null) {
	        ra.addFlashAttribute("findPwErrorMsg", "인증이 필요합니다. 다시 진행해주세요.");
	        return "redirect:/findPw";
	    }
		
		// 로그인 폴더 밑에 pwReset.html
		return "login/pwReset";
	}
	
	//// 처리
	@PostMapping("/findPw/pwReset")
	public String pwReset(String newPw
						 ,String newPwConfirm
						 ,HttpSession session
						 ,RedirectAttributes ra) {
		
		// 세션에서 FINDPW_VERIFIED = true, 유저코드 가져오기
		Boolean verified = (Boolean) session.getAttribute("FINDPW_VERIFIED");
		Integer userCode = (Integer) session.getAttribute(S_USER_CODE);
		
		// 세션에 정보 없음
		if(verified == null || !verified || userCode == null) {
	        ra.addFlashAttribute("findPwErrorMsg", "인증 세션이 만료되었습니다. 다시 진행해주세요.");
	        return "redirect:/findPw";
	    }
		
		// 새 비밀번호 입력 확인
		if(newPw == null || newPw.isBlank() || !newPw.equals(newPwConfirm)) {
			ra.addFlashAttribute("pwResetErrorMsg", "비밀번호가 비어있거나 확인이 일치하지 않습니다.");
			return "redirect:/findPw/pwReset";
		}
		
		// update 실행
		try {
			findPwService.modifyPwByUserCode(userCode, newPw);
		} catch(Exception e) {
			ra.addFlashAttribute("pwResetErrorMsg", "비밀번호 변경해 실패했습니다. 관리자에게 문의하세요.");
			return "redirect:/findPw/pwReset";
		}
		
		ra.addFlashAttribute("pwResetSuccessMsg", "비밀번호가 변경되었습니다. 로그인 해주세요.");
		
		// 성공 세 세션 정리
		session.removeAttribute("FINDPW_VERIFIED");
		session.removeAttribute(S_USER_CODE);
		session.removeAttribute(S_EMAIL);
		
		return "redirect:/findPw/pwReset";
	}
	
	@PostMapping("/findPw/resend")
	@ResponseBody
	public ResponseEntity<?> resendOtp(HttpSession session) {

	    Integer userCode = (Integer) session.getAttribute(S_USER_CODE);
	    String email = (String) session.getAttribute(S_EMAIL);

	    if (userCode == null || email == null) {
	        return ResponseEntity.status(401).body(Map.of("ok", false, "msg", "인증 세션이 없습니다."));
	    }

	    // ✅ 새 OTP 발급 (이전 OTP는 세션 덮어쓰기로 자동 무효)
	    String otp = generateOtp6();
	    long newExpiresAt = System.currentTimeMillis() + OTP_TTL_MS;

	    session.setAttribute(S_OTP, otp);
	    session.setAttribute(S_EXPIRES, newExpiresAt);

	    // ✅ 비동기 재발송
	    findPwService.sendOtpMailAsync(email, otp);

	    return ResponseEntity.ok(Map.of("ok", true, "expiresAt", newExpiresAt));
	}
	
	// 인증번호 생성
	private String generateOtp6() {
		SecureRandom r = new SecureRandom();
		int n = r.nextInt(900000) + 100000; // 100000~999999
		return String.valueOf(n); // String으로 형변환
	}
}
