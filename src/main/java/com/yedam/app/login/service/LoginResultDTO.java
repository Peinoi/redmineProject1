package com.yedam.app.login.service;

import lombok.AllArgsConstructor;
import lombok.Getter;

// DTO 역할을 하는 클래스
// DTO = 데이터를 옮기기 위한 객체
// 비지니스 로직 X, 계산 X, 조건 판단 X
// 데이터 묶음만 담당
// 필드, getter, 생성자

@Getter
@AllArgsConstructor
public class LoginResultDTO {
	private LoginResultType type;
	private UserVO user; // OK일 때만 채움
}
