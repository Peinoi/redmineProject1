package com.yedam.app.login.mapper;

import com.yedam.app.login.service.FindPwVO;

public interface FindPwMapper {
	// 이메일, 이름, 전화번호 select
	public FindPwVO selectFindPwInfo(FindPwVO findPwVO);
}
