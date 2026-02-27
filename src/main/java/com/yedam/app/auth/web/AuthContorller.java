package com.yedam.app.auth.web;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.auth.service.AuthService;
import com.yedam.app.auth.service.RoleAuthVO;
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

	// 역할 전체 조회
	@GetMapping("auth")
	public String projectList(Model model) {

		List<RoleVO> auth = projectService.roleFindAll();
		Collections.reverse(auth);
		model.addAttribute("auths", auth);
		return "auth/auth";
	}

	// 역할 단건 조회
	@GetMapping("authInfo")
	public String authInfo(@RequestParam Integer roleCode, Model model, HttpSession session) {
		RoleVO findRol = authService.findRoleInfo(roleCode);
		List<RoleAuthVO> findAuth = authService.findAuthInfo(roleCode);
		model.addAttribute("role", findRol);
		model.addAttribute("auths", findAuth);
		return "auth/authinfo";
	}

	// 역할 등록
	@GetMapping("authadd")
	public String projectAdd(Model model) {
		List<RoleAuthVO> findAuth = authService.findAuthInfo(1);
		model.addAttribute("auths", findAuth);
		return "auth/authadd";
	}

	// 역할 등록 기능
	@ResponseBody
	@PostMapping("/api/auth/register")
	public Map<String, Object> registerRole(@RequestBody Map<String, Object> requestData, HttpSession session) {

		// 보안용으로 필요 js끄기로 하면 검증 안됨
		String roleName = (String) requestData.get("roleName");
		if (roleName == null || roleName.trim().isEmpty()) {
			Map<String, Object> result = new HashMap<>();
			result.put("success", false);
			result.put("message", "역할명을 입력해주세요.");
			return result;
		}

		// 서비스에 Map 그대로 전달
		return authService.insertRoleWithAuth(requestData);
	}

	// 역할 관리자 권한 변경
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

	// 역할 및 권한 수정
	@ResponseBody
	@PostMapping("/api/auth/updateRole")
	public Map<String, Object> updateRoleAuth(@RequestBody Map<String, Object> requestData, HttpSession session) {

		// 보안용으로 필요 js끄기로 하면 검증 안됨
		String roleName = (String) requestData.get("roleName");
		if (roleName == null || roleName.trim().isEmpty()) {
			Map<String, Object> result = new HashMap<>();
			result.put("success", false);
			result.put("message", "역할명을 입력해주세요.");
			return result;
		}

		// 서비스에 Map 그대로 전달
		return authService.modifyAuthInfo(requestData);
	}

	// 접근 거부
	@GetMapping("/accessDenied")
	public String accessDenied() {
		return "error/accessDenied";
	}
}
