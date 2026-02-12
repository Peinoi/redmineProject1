package com.yedam.app.typemodal.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.typemodal.service.TypeModalService;
import com.yedam.app.typemodal.service.TypeModalVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class TypeModalController {

	private final TypeModalService typeModalService;

	@GetMapping("/api/types/modal")
	public List<TypeModalVO> typeModalList(HttpSession session) {
		// 1. 로그인 사용자 정보
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return List.of(); // 로그인 안됐으면 빈 리스트

		// 2. 사용자가 참여한 프로젝트 기준 유형 조회
		return typeModalService.findTypeModalListByUser(user.getUserCode());
	}
}
