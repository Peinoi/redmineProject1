package com.yedam.app.login.service;

public interface LoginService {
	// 마지막 로그인 업데이트
	public int modifyLastLoginAt(Integer userCode);
	// 로그인 검증
	public LoginResultDTO login(UserVO userVO);
	
	// 첫 로그인 필수정보 업데이트
	public int modifyFirstLoginInfo(UserVO userVO);
}
