package com.yedam.app.usermgr.service.impl;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.project.service.PruserVO;
import com.yedam.app.usermgr.mapper.UsermgrMapper;
import com.yedam.app.usermgr.service.UsermgrService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UsermgrServiceImpl implements UsermgrService {

	private final UsermgrMapper usermgrMapper;
	private final PasswordEncoder passwordEncoder; // BCrypt - LoginServiceImpl과 동일 Bean

	// 사용자 목록
	@Override
	public List<PruserVO> userFindAll() {
		return usermgrMapper.userAll();
	}

	// 사용자 단건 조회
	@Override
	public UserVO userFindInfo(Integer userCode) {
		return usermgrMapper.userInfo(userCode);
	}

	// 채번 (페이지 로드 시 Controller에서 호출)
	@Override
	public PruserVO selectNextNo() {
		return usermgrMapper.selectNextNo();
	}

	// 사용자 추가
	// 비밀번호 암호화, PK/사번 채번 → 모두 Service 책임
	// INSERT 직전에 재조회하는 이유: 페이지 열어둔 사이 다른 사람이
	// 먼저 등록하면 중복 PK가 발생할 수 있으므로 항상 최신값으로 채번
	@Override
	public int insertUser(PruserVO pruserVO) {

		// INSERT 직전 재채번 (동시성 방어)
		PruserVO next = usermgrMapper.selectNextNo();
		int nextUserCode = next.getNextUserCode();
		int nextEmployeeNo = next.getNextEmployeeNo();

		// 초기 비밀번호: 사번(숫자) + "123" 예) 1001 → "1001123"
		// BCrypt 결과 예시: $2a$10$iqE8C4rqjWre6gxPgiJlD.ROU0f1e6LWyDPfThQXER0MzVFFjkxey
		String rawPassword = nextEmployeeNo + "123";
		String encodedPw = passwordEncoder.encode(rawPassword);

		pruserVO.setUserCode(nextUserCode);
		pruserVO.setEmployeeNo(nextEmployeeNo);
		pruserVO.setPasswordHash(encodedPw);

		return usermgrMapper.addUser(pruserVO);
	}

	// 잠금 / 잠금해제
	@Override
	public int lockUpdateUser(String isLock, Integer userCode) {
		return usermgrMapper.lockUser(isLock, userCode);
	}

	// 소프트 삭제
	@Override
	public int deleteUser(Integer userCode) {
		return usermgrMapper.deleteUser(userCode);
	}

	// 사용자 sys권한 변경
	@Override
	public int userSysUpdate(Integer userCode, String sysCk) {
		return usermgrMapper.userSysUpdate(userCode, sysCk);
	}

}