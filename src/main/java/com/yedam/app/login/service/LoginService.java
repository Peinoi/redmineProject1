package com.yedam.app.login.service;

public interface LoginService {
	// 사원번호, 비밀번호 조회
	public LoginVO findLoginInfo(LoginVO loginVO);
}
