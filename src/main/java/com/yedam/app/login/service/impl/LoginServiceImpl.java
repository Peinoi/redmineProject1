package com.yedam.app.login.service.impl;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.yedam.app.login.mapper.LoginMapper;
import com.yedam.app.login.service.LoginResultDTO;
import com.yedam.app.login.service.LoginResultType;
import com.yedam.app.login.service.LoginService;
import com.yedam.app.login.service.UserVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LoginServiceImpl implements LoginService {
	
	private final LoginMapper loginMapper;
	private final PasswordEncoder passwordEncoder;

	// 마지막 로그인 업데이트
	@Override
	public int modifyLastLoginAt(Integer userCode) {
		return loginMapper.updateLastLoginAt(userCode);
	}
	
	// 로그인 검증
	@Override
	public LoginResultDTO login(UserVO userVO) {
		
		UserVO user = loginMapper.selectLoginInfo(userVO);
		// user가 null이면 LoginResultType에는 INVALID, userVO에는 null을 넣는다
		if(user == null) {
			return new LoginResultDTO(LoginResultType.INVALID, null);
		}

		// 입력 비번: loginVO.getPassword()
	    // DB 해시: user.getPasswordHash()
										// 입력 비번				// DB 해시
		if(!passwordEncoder.matches(userVO.getPassword(), user.getPasswordHash())) {
			return new LoginResultDTO(LoginResultType.INVALID, null);
		}
		
		// DB의 is_lock이 '1'이면 LoginResultType에는 INVALID, userVO에는 null을 넣는다
		if("1".equals(user.getIsLock())) {
			return new LoginResultDTO(LoginResultType.LOCKED, null);
		}
		
		// 성공하면 LoginResultType에는 OK, userVO에는 user를 넣는다
		return new LoginResultDTO(LoginResultType.OK, user);
	}

}
