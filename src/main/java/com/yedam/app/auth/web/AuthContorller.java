package com.yedam.app.auth.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.auth.service.AuthService;
import com.yedam.app.login.service.UserVO;
import com.yedam.app.project.service.ProjectService;
import com.yedam.app.project.service.RoleVO;
import com.yedam.app.project.service.UserProjectAuthVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class AuthContorller {
	private final ProjectService projectService;
	private final AuthService authService;

	@GetMapping("auth")
	public String projectList(Model model) {

		List<RoleVO> auth = projectService.roleFindAll();

		model.addAttribute("auths", auth);
		return "auth/auth";
	}

	@GetMapping("authadd")
	public String projectAdd(Model model) {

		return "auth/authadd";
	}

	// AuthContorller.java 내부
	@ResponseBody
	@PostMapping("/api/auth/{adminCk}/{roleCode}/adminmodify")
	public int modifyAdminRole(@PathVariable String adminCk, @PathVariable Integer roleCode) {
		return authService.adminModifyRole(adminCk, roleCode);
	}

	// 역할 삭제
	@ResponseBody
	@PostMapping("/api/auth/{roleCode}/delete")
	public Map<String, Object> deleteRole(@PathVariable Integer roleCode, HttpSession session) {
		Map<String, Object> result = new HashMap<>();

		// 세션에서 사용자 정보 가져오기
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null) {
			result.put("success", false);
			result.put("message", "로그인이 필요합니다.");
			return result;
		}

		// 세션에서 권한 정보 가져오기
		@SuppressWarnings("unchecked")
		List<UserProjectAuthVO> userAuths = (List<UserProjectAuthVO>) session.getAttribute("userAuth");
		// 삭제 처리
		int deleted = authService.deleteAuthInfo(roleCode);

		if (deleted > 0) {
			result.put("success", true);
			result.put("message", "역할이 삭제되었습니다.");
		} else {
			result.put("success", false);
			result.put("message", "삭제에 실패했습니다.");
		}

		return result;
	}

	// 접근 거부
	@GetMapping("/accessDenied")
	public String accessDenied() {
		return "error/accessDenied";
	}
}
