package com.yedam.app.login.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.yedam.app.login.mapper.FindPwMapper;
import com.yedam.app.login.service.FindPwService;
import com.yedam.app.login.service.UserVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FindPwServiceImpl implements FindPwService {
	
	private static final Logger log = LoggerFactory.getLogger(FindPwServiceImpl.class);

	private final FindPwMapper findPwMapper;
	private final JavaMailSender mailSender;
	private final PasswordEncoder passwordEncoder;

	@Override
	public UserVO FindPwInfo(UserVO userVO) {
		return findPwMapper.selectFindPwInfo(userVO);
	}

	// 인증메일 발송
	public void sendOtpMail(String toEmail, String otp) {
		try {
			SimpleMailMessage msg = new SimpleMailMessage();
			msg.setTo(toEmail);
			msg.setFrom("tjdcksgur.1@daum.net");
			
			msg.setSubject("[Together] 비밀번호 재설정 인증번호");
			msg.setText("인증번호: " + otp + "\n5분 이내에 입력해주세요.");

			mailSender.send(msg);
			log.info("OTP mail sent. to={}, otp={}", toEmail, otp);
		} catch (MailException e) {
			log.error("OTP mail send failed. to={}", toEmail, e);
			throw e;
		}

	}

	@Override
	public void modifyPwByUserCode(Integer userCode, String newPw) {
		
		// 해쉬처리한 비밀번호
		String hashPw = passwordEncoder.encode(newPw);
		
		UserVO vo = new UserVO();
		vo.setUserCode(userCode);
		vo.setPasswordHash(hashPw);
		
		int updated = findPwMapper.updatePwByUserCode(vo);
		if (updated != 1) {
			// 정상 흐름에서 발생하면 안 되는 상태 → 로직 이상
			throw new IllegalStateException("비밀번호 업데이트 실패: userCode=" + userCode);
		}
		
	}
}
