package com.yedam.app.user.web;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.main.util.Authz;
import com.yedam.app.user.service.UserPageService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class UserPageController {

	private final UserPageService userPageService;

	@GetMapping("/users/{userCode}")
	public String userPage(@PathVariable Integer userCode, @RequestParam(defaultValue = "7") int days,
			HttpSession session, Model model) {
		
		// ✅ 고정 프로젝트(currentProject) 컨텍스트 읽기
		Integer fixedProjectCode = null;
		
		Object cp = session.getAttribute("currentProject");
		if (cp != null) {
			if (cp instanceof java.util.Map<?, ?> m) {
				Object pc = m.get("projectCode");
				if (pc != null) fixedProjectCode = Integer.valueOf(String.valueOf(pc));
			}
		}

		if (session.getAttribute("user") == null)
			return "redirect:/login";

		// ✅ 1) 사용자 페이지 접근 권한 (원하면 CAT_PROJECT로 바꿔도 됨)
//		if (!Authz.canReadUserPage(session)) {
//			// 취향대로: 403 페이지 / 메인 리다이렉트
//			return "redirect:/G2main";
//		}

		UserVO profile = userPageService.getProfile(userCode);
		if (profile == null)
			return "redirect:/G2main";

		// ✅ 2) 일감/로그는 '일감' 카테고리 read 가능한 프로젝트만 보여주기
		List<Integer> issueReadableProjectCodes = null; // sys면 null로(필터 없음)
		if (!Authz.isSys(session)) {
			Set<Integer> set = Authz.readableProjectsByCategory(session, Authz.CAT_ISSUE);
			issueReadableProjectCodes = new ArrayList<>(set);

			// (선택) 아예 보여줄 프로젝트가 없으면 데이터는 빈값으로
			// 여기서 return으로 막고 싶으면 막아도 됨(요구사항에 맞춰 선택)
		}

		model.addAttribute("profile", profile);
		model.addAttribute("issueStaDual", userPageService.getIssueSummaryDual(userCode, issueReadableProjectCodes, fixedProjectCode));
		model.addAttribute("workLogsByDay",
				userPageService.getWorkLogsForView(userCode, profile.getName(), days, issueReadableProjectCodes, fixedProjectCode));
		model.addAttribute("days", days);

		return "user/userPage";
	}
}
