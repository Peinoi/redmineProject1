package com.yedam.app.user.service;

import java.util.List;

import com.yedam.app.login.service.UserVO;

public interface MyInfoService {

	// 내 정보 select 단건
	public UserVO findMyInfo(Integer userCode);

	// 내 정보 수정
	public int modifyMyInfo(MyInfoUpdateReqDTO req);

	// 유저코드, 비밀번호 해시 select
	public UserVO findByUserCode(Integer userCode);

	// 새 비밀번호 업데이트
	public void modifyPassword(Integer userCode, String encodedPw);

	// 내가 속한 프로젝트 + 역할
	public List<MyProjectRoleVO> findMyProjectsWithRoles(Integer userCode);

	// 내가 속한 그룹 + (프로젝트 + 역할)
	public List<MyGroupInfoVO> findMyGroupsInfo(Integer userCode);
}
