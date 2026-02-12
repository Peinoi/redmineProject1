package com.yedam.app.auth.service.impl;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.yedam.app.auth.mapper.AuthMapper;
import com.yedam.app.auth.service.AuthService;
import com.yedam.app.project.service.RoleVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

	private final AuthMapper authMapper;

	// 역할명 수정
	@Override
	public Map<String, Object> modifyAuthInfo(Integer roleCode) {
		Map<String, Object> map = new HashMap<>();
		boolean isSuccessed = false;
		int result = authMapper.updateAuth(roleCode);
		if (result == 1) {
			isSuccessed = true;
		}
		map.put("result", isSuccessed);
		return map;
	}

	// 역할 명 삭제
	@Override
	public int deleteAuthInfo(Integer roleCode) {
		int result = authMapper.deleteAuth(roleCode);

		return result;
	}

	@Override
	public int adminModifyRole(String adminCk, Integer roleCode) {
		int result = authMapper.updateAdminRole(adminCk, roleCode);
		return result;
	}

}
