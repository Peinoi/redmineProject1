package com.yedam.app.login.service.impl;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.yedam.app.login.mapper.FindPwMapper;
import com.yedam.app.login.service.FindPwService;
import com.yedam.app.login.service.FindPwVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FindPwServiceImpl implements FindPwService {

	private final FindPwMapper findPwMapper;
	private final JavaMailSender mailSender;
	
	@Override
	public FindPwVO FindPwInfo(FindPwVO findPwVO) {
		return findPwMapper.selectFindPwInfo(findPwVO);
	}
	
	

}
