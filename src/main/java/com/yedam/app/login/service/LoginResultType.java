package com.yedam.app.login.service;

// enum = 정해진 값만 가지는 상수 묶음
public enum LoginResultType {
	OK,			// 로그인 성공
	INVALID,	// 사번/비번 틀림
	LOCKED		// 계정 잠김
}
