package com.yedam.app.login.service;

public interface FindPwService {
	// 사원번호, 이름, 전화번호 select
	public UserVO FindPwInfo(UserVO userVO);
	
	// 인증메일 보내기
	public void sendOtpMail(String toEmail, String otp);
	
	// 유저코드로 비밀번호 업데이트
	public void modifyPwByUserCode(Integer userCode, String newPw);
}
