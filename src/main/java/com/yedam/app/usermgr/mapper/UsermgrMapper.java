package com.yedam.app.usermgr.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.project.service.PruserVO;

public interface UsermgrMapper {

	// 사용자 리스트
	public List<PruserVO> userAll();

	// next 사번, 유저코드
	public PruserVO selectNextNo();

	// 사용자 추가
	public int addUser(PruserVO pruserVO);

	// 잠금 / 잠금해제
	public int lockUser(@Param("isLock") String isLock, @Param("userCode") int userCode);

	// 소프트 삭제
	public int deleteUser(@Param("userCode") int userCode);

}
