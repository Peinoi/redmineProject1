package com.yedam.app.user.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.user.mapper.MyInfoMapper;
import com.yedam.app.user.service.MyGroupInfoVO;
import com.yedam.app.user.service.MyInfoService;
import com.yedam.app.user.service.MyInfoUpdateReqDTO;
import com.yedam.app.user.service.MyProjectRoleVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MyInfoServiceImpl implements MyInfoService {

	private final MyInfoMapper myInfoMapper;

	@Override
	public UserVO findMyInfo(Integer userCode) {
		return myInfoMapper.selectMyInfo(userCode);
	}

	@Override
	public int modifyMyInfo(MyInfoUpdateReqDTO req) {
		return myInfoMapper.updateMyInfo(req);
	}

	@Override
	public UserVO findByUserCode(Integer userCode) {
		return myInfoMapper.selectByUserCode(userCode);
	}

	@Override
	public void modifyPassword(Integer userCode, String encodedPw) {
		myInfoMapper.updatePassword(userCode, encodedPw);
	}

	@Override
	public List<MyProjectRoleVO> findMyProjectsWithRoles(Integer userCode) {
		return myInfoMapper.selectMyProjectsWithRoles(userCode);
	}

	@Override
	public List<MyGroupInfoVO> findMyGroupsInfo(Integer userCode) {
		return myInfoMapper.selectMyGroupsInfo(userCode);
	}

}
