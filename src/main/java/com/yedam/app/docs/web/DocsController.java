package com.yedam.app.docs.web;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.server.ResponseStatusException;

import com.yedam.app.docs.service.DocsService;
import com.yedam.app.login.service.UserVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class DocsController {

	private final DocsService docsService;

	private Integer getLoginUserCode(HttpSession session) {
		Object obj = session.getAttribute("user");
		if (obj == null)
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		UserVO user = (UserVO) obj;
		if (user.getUserCode() == null)
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		return user.getUserCode();
	}

	// 등록 화면
	@GetMapping("docsInsert")
	public String docsInsert() {
		return "docs/insert";
	}
}
