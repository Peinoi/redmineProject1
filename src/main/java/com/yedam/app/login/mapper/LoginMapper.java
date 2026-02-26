package com.yedam.app.login.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.login.service.AutoLoginTokenVO;
import com.yedam.app.login.service.TodayDueDTO;
import com.yedam.app.login.service.UserVO;

public interface LoginMapper {
	// select
	public UserVO selectLoginInfo(UserVO userVO);

	// 마지막 로그인 업데이트
	public int updateLastLoginAt(Integer userCode);

	// 첫 로그인 필수정보 입력
	public int updateFirstLoginInfo(UserVO userVO);

	// 자동로그인 토큰 저장
	public int insertAutoLoginToken(AutoLoginTokenVO autoLoginTokenVO);

	// 토큰으로 유저 조회(유효기간/잠금 체크 포함)
	public UserVO selectUserByValidAutoLoginToken(String tokenHash);

	// 토큰 마지막 사용시간 갱신
	public int updateAutoLoginLastUsed(String tokenHash);

	// 로그아웃 시 토큰 삭제
	public int deleteAutoLoginToken(String tokenHash);

	public List<TodayDueDTO> selectTodayDueTopN(@Param("userCode") Integer userCode, @Param("n") int n);
}
