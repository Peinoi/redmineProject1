package com.yedam.app.common.web;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpSession;

@Controller
public class HeaderFixedProjectController {

	@PostMapping("/header/fixed-project/clear")
	@ResponseBody
	public ResponseEntity<?> clearFixedProject(HttpSession session) {

		// 임시로 fixedProjectCode, fixedProjectName
		session.removeAttribute("fixedProjectCode");
		session.removeAttribute("fixedProjectName");

		return ResponseEntity.ok(Map.of("ok", true));
	}
}
