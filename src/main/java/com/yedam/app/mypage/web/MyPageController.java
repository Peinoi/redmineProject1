package com.yedam.app.mypage.web;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.mypage.service.MyPageService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class MyPageController {

	private final MyPageService myPageService;

	@GetMapping("/my")
	public String myPage(@RequestParam(defaultValue = "7") int days, @RequestParam(defaultValue = "ME") String mode,
			@RequestParam(required = false) Integer projectCode, HttpSession session, Model model) {
		UserVO login = (UserVO) session.getAttribute("user");
		if (login == null)
			return "redirect:/login";

		Map<String, Object> m = myPageService.buildMyPage(session, login.getUserCode(), login.getName(), days, mode,
				projectCode);

		model.addAllAttributes(m);
		return "mypage/myPage";
	}

	@PostMapping("/my/blocks")
	@ResponseBody
	public ResponseEntity<?> addBlock(@RequestParam String blockType, HttpSession session) {
		UserVO login = (UserVO) session.getAttribute("user");
		if (login == null)
			return ResponseEntity.status(401).build();

		myPageService.addBlock(login.getUserCode(), blockType);
		return ResponseEntity.ok(Map.of("ok", true));
	}

	@DeleteMapping("/my/blocks/{blockCode}")
	@ResponseBody
	public ResponseEntity<?> deleteBlock(@PathVariable Integer blockCode, HttpSession session) {
		UserVO login = (UserVO) session.getAttribute("user");
		if (login == null)
			return ResponseEntity.status(401).build();

		myPageService.deleteBlock(login.getUserCode(), blockCode);
		return ResponseEntity.ok(Map.of("ok", true));
	}

	@PutMapping("/my/blocks/order")
	@ResponseBody
	public ResponseEntity<?> saveOrder(@RequestBody List<Integer> orderedBlockCodes, HttpSession session) {
		UserVO login = (UserVO) session.getAttribute("user");
		if (login == null)
			return ResponseEntity.status(401).build();

		myPageService.saveOrder(login.getUserCode(), orderedBlockCodes);
		return ResponseEntity.ok(Map.of("ok", true));
	}

	@GetMapping("/my/admin/issues")
	@ResponseBody
	public ResponseEntity<?> adminIssueDrilldown(@RequestParam String kind, @RequestParam Integer projectCode,
			@RequestParam Integer userCode, @RequestParam(defaultValue = "60") int limit, HttpSession session) {
		UserVO login = (UserVO) session.getAttribute("user");
		if (login == null)
			return ResponseEntity.status(401).build();

		var list = myPageService.getAdminDrilldownIssues(session, login.getUserCode(), kind, projectCode, userCode,
				limit);

		if (list == null) {
			return ResponseEntity.status(403).body(Map.of("ok", false, "msg", "권한 없음/요청 오류"));
		}
		return ResponseEntity.ok(list);
	}
}