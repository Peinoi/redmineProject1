package com.yedam.app.login.mapper;

import com.yedam.app.login.service.UserVO;

public interface LoginMapper {
	// select
	public UserVO selectLoginInfo(UserVO userVO);
	
	// 마지막 로그인 업데이트
	public int updateLastLoginAt(Integer userCode);
	
	// 첫 로그인 필수정보 입력
	public int updateFirstLoginInfo(UserVO userVO);
}
