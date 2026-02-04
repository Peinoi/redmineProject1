package com.yedam.app.login.mapper;

import com.yedam.app.login.service.LoginVO;

public interface LoginMapper {
	// 사원번호, 비밀번호 조회
	public LoginVO selectLoginInfo(LoginVO loginVO);
}
