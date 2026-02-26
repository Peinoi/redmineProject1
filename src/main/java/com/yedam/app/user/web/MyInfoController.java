package com.yedam.app.user.web;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.user.service.MyGroupInfoVO;
import com.yedam.app.user.service.MyInfoService;
import com.yedam.app.user.service.MyInfoUpdateReqDTO;
import com.yedam.app.user.service.MyProjectRoleVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class MyInfoController {

	private final MyInfoService myInfoService;
    private final PasswordEncoder passwordEncoder;
	
	@GetMapping("/myInfo")
	public String myInfo(HttpSession session, Model model, RedirectAttributes ra) {
		
		// 세션에서 user 가져오기
		UserVO sessionUser = (UserVO) session.getAttribute("user");
		// 없으면 로그인으로
		if (sessionUser == null) return "login/login";
		
		// userCode 꺼내기
		Integer userCode = sessionUser.getUserCode();
		
		// 최신 정보 DB에서 다시 조회(세션값 오래된거 방지)
	    UserVO user = myInfoService.findMyInfo(userCode);
	    if (user == null) {
	      ra.addFlashAttribute("msg", "사용자 정보를 찾을 수 없습니다.");
	      return "redirect:/G2main";
	    }
	    
	    // 프로젝트/그룹 정보 조회
	    List<MyProjectRoleVO> myProjects = myInfoService.findMyProjectsWithRoles(userCode);
	    List<MyGroupInfoVO> myGroups = myInfoService.findMyGroupsInfo(userCode);
	    
	    // 모델에 넣기
	    model.addAttribute("user", user);
	    model.addAttribute("myProjects", myProjects);
	    model.addAttribute("myGroups", myGroups);
		
		return "user/myInfo";
	}
	
	@PostMapping("/myInfo")
	public String updateMyInfo(MyInfoUpdateReqDTO req, HttpSession session, RedirectAttributes ra) {
		
		// 세션에서 user 가져오기
		UserVO sessionUser = (UserVO) session.getAttribute("user");
		// 없으면 로그인으로
		if (sessionUser == null) return "login/login";
				
		// userCode 꺼내기
		Integer userCode = sessionUser.getUserCode();
		
		// 서버에서도 수정 불가 항목은 무시/차단
	    req.setUserCode(userCode);
	    
	    // 업데이트 실행
	    int updated = myInfoService.modifyMyInfo(req);
	    if (updated == 1) {
	    	ra.addFlashAttribute("msg", "내 정보가 수정되었습니다.");
	    } else {
	    	ra.addFlashAttribute("msg", "수정에 실패했습니다. 다시 시도해주세요.");
	    }
		
		return "redirect:/myInfo";
	}
	
	// 비밀번호 변경 페이지
	@GetMapping("/myInfo/modifyPw")
    public String passwordForm(HttpSession session) {
        if (session.getAttribute("user") == null) {
            return "redirect:/login";
        }
        return "user/modifyPw";
    }
	
	// 비밀번호 변경 처리
	@PostMapping("/myInfo/modifyPw")
	public String changePassword(
            String currentPw,
            String newPw,
            String confirmPw,
            HttpSession session,
            Model model
    ) {
		
		UserVO loginUser = (UserVO) session.getAttribute("user");
        if (loginUser == null) {
            return "redirect:/login";
        }
		
        UserVO dbUser = myInfoService.findByUserCode(loginUser.getUserCode());
        
        // 현재 비밀번호 확인
        if (!passwordEncoder.matches(currentPw, dbUser.getPasswordHash())) {
            model.addAttribute("errorMsg", "현재 비밀번호가 일치하지 않습니다.");
            return "user/modifyPw";
        }
        
        // 새 비밀번호가 현재 비밀번호와 같으면 금지
        if (passwordEncoder.matches(newPw, dbUser.getPasswordHash())) {
            model.addAttribute("errorMsg", "새 비밀번호는 현재 비밀번호와 다르게 입력해주세요.");
            return "user/modifyPw";
        }
        
        // 새 비밀번호와 비밀번호 확인 일치 확인
        if (newPw == null || !newPw.equals(confirmPw)) {
            model.addAttribute("errorMsg", "새 비밀번호가 일치하지 않습니다.");
            return "user/modifyPw";
        }
        
        String encodedPw = passwordEncoder.encode(newPw);
        myInfoService.modifyPassword(loginUser.getUserCode(), encodedPw);
        
        model.addAttribute("successMsg", "비밀번호가 변경되었습니다.");
        
		return "user/modifyPw";
	}
	
	
}
