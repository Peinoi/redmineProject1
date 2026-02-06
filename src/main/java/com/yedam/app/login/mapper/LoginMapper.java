package com.yedam.app.login.mapper;

import com.yedam.app.login.service.UserVO;

public interface LoginMapper {
	// 사원번호, 비밀번호 조회
	public UserVO selectLoginInfo(UserVO userVO);
	public int updateLastLoginAt(Integer userCode);
}
