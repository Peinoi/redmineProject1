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
	
	/**
	 * 내 페이지 화면
	 * - 로그인 사용자 기준으로 blocks + blockData 구성
	 */
	@GetMapping("/my")
	public String myPage(
	    @RequestParam(defaultValue = "7") int days,
	    @RequestParam(defaultValue = "ME") String mode,
	    @RequestParam(required = false) Integer projectCode,
	    HttpSession session,
	    Model model
	) {
	  UserVO login = (UserVO) session.getAttribute("user");
	  if (login == null) return "redirect:/login";

	  Map<String, Object> m = myPageService.buildMyPage(
	      login.getUserCode(),
	      login.getName(),
	      days,
	      mode,
	      projectCode
	  );

	  model.addAllAttributes(m);
	  return "mypage/myPage";
	}
	
	/**
	 * 블록 추가
	 * - NOTICE / CALENDAR / WORKLOG 등
	 */
	@PostMapping("/my/blocks")
	@ResponseBody
	public ResponseEntity<?> addBlock(@RequestParam String blockType, HttpSession session) {

		UserVO login = (UserVO) session.getAttribute("user");
		if (login == null) return ResponseEntity.status(401).build();

		myPageService.addBlock(login.getUserCode(), blockType);
		return ResponseEntity.ok(Map.of("ok", true));
	}
	
	/**
	 * 블록 삭제
	 */
	@DeleteMapping("/my/blocks/{blockCode}")
	@ResponseBody
	public ResponseEntity<?> deleteBlock(@PathVariable Integer blockCode, HttpSession session) {

		UserVO login = (UserVO) session.getAttribute("user");
		if (login == null) return ResponseEntity.status(401).build();

		myPageService.deleteBlock(login.getUserCode(), blockCode);
		return ResponseEntity.ok(Map.of("ok", true));
	}
	
	/**
	 * 블록 정렬 저장 (드래그앤드롭 결과)
	 * body 예: [3, 9, 10]
	 */
	@PutMapping("/my/blocks/order")
	@ResponseBody
	public ResponseEntity<?> saveOrder(@RequestBody List<Integer> orderedBlockCodes,
									   HttpSession session) {

		UserVO login = (UserVO) session.getAttribute("user");
		if (login == null) return ResponseEntity.status(401).build();

		myPageService.saveOrder(login.getUserCode(), orderedBlockCodes);
		return ResponseEntity.ok(Map.of("ok", true));
	}
	
	/**
	 * ✅ ADMIN 드릴다운: 담당자/등록자 클릭 시 이슈 목록 반환
	 * - /my/admin/issues?kind=ASSIGNED&projectCode=1&userCode=2&limit=60
	 */
	@GetMapping("/my/admin/issues")
	@ResponseBody
	public ResponseEntity<?> adminIssueDrilldown(
	    @RequestParam String kind,
	    @RequestParam Integer projectCode,
	    @RequestParam Integer userCode,
	    @RequestParam(defaultValue = "60") int limit,
	    HttpSession session
	) {
	  UserVO login = (UserVO) session.getAttribute("user");
	  if (login == null) return ResponseEntity.status(401).build();

	  var list = myPageService.getAdminDrilldownIssues(
	      login.getUserCode(),
	      kind,
	      projectCode,
	      userCode,
	      limit
	  );

	  if (list == null) {
	    return ResponseEntity.status(403).body(Map.of("ok", false, "msg", "권한 없음/요청 오류"));
	  }

	  return ResponseEntity.ok(list);
	}
}
