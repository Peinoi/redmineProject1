package com.yedam.app.auth.service;

import java.util.Map;

import com.yedam.app.project.service.RoleVO;

public interface AuthService {
	// 역할 수정
	public Map<String, Object> modifyAuthInfo(Integer roleCode);

	// 역할 수정 관리자 권한
	public int adminModifyRole(String adminCk, Integer roleCode);
	
	// 역할 삭제
	public int deleteAuthInfo(Integer roleCode);

}
