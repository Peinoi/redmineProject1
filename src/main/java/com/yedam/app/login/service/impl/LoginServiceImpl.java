package com.yedam.app.login.service.impl;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.yedam.app.login.mapper.LoginMapper;
import com.yedam.app.login.service.LoginService;
import com.yedam.app.login.service.LoginVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LoginServiceImpl implements LoginService {
	
	private final LoginMapper loginMapper;
	private final PasswordEncoder passwordEncoder;
	
	// 사원번호, 비밀번호 조회
	@Override
	public LoginVO findLoginInfo(LoginVO loginVO) {
		
		LoginVO user = loginMapper.selectLoginInfo(loginVO);
		if (user == null) return null;
		
		System.out.println("employeeNo=" + user.getEmployeeNo());
		System.out.println("passwordHash=" + user.getPasswordHash());
		
		// 입력 비번: loginVO.getPassword()
	    // DB 해시: user.getPasswordHash()
										// 입력 비번				// DB 해시
		if (!passwordEncoder.matches(loginVO.getPassword(), user.getPasswordHash())) {
			return null;
		}
		
		// 세션에 해시 넣지 않게 제거
		user.setPasswordHash(null);
		return user;
	}

}
