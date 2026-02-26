package com.yedam.app.user.mapper;

import java.util.List;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.user.service.MyGroupInfoVO;
import com.yedam.app.user.service.MyGroupProjectRoleVO;
import com.yedam.app.user.service.MyInfoUpdateReqDTO;
import com.yedam.app.user.service.MyProjectRoleVO;

public interface MyInfoMapper {
	
	// 내 정보 select 단건
	public UserVO selectMyInfo(Integer userCode);
	
	// 내 정보 수정
	public int updateMyInfo(MyInfoUpdateReqDTO req);
	
	// 유저코드, 비밀번호 해시 select
	public UserVO selectByUserCode(Integer userCode);
	
	// 새 비밀번호 업데이트
	public int updatePassword(Integer userCode, String encodedPw);
	
	// 내가 속한 프로젝트 + 역할
	public List<MyProjectRoleVO> selectMyProjectsWithRoles(Integer userCode);

	// 내가 속한 프로젝트 + 역할 + 상태명
	public List<MyGroupProjectRoleVO> selectMyGroupsWithProjectRoles(Integer userCode);
	
	// 내가 속한 그룹 + 인원수 + 설명
	public List<MyGroupInfoVO> selectMyGroupsInfo(Integer userCode);
}
