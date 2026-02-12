package com.yedam.app.auth.service;

import java.util.List;
import java.util.Map;

import com.yedam.app.project.service.RoleVO;

public interface AuthService {

	// 역할 등록 (역할 + 권한 전체)
	public Map<String, Object> insertRoleWithAuth(Map<String, Object> requestData);
	
	// 역할 단건 조회
	public RoleVO findRoleInfo(Integer roleCode);
	public List<RoleAuthVO> findAuthInfo(Integer roleCode);

	// 역할 수정 (역할 + 권한 전체)
	public Map<String, Object> modifyAuthInfo(Map<String, Object> requestData);

	// 역할 수정 관리자 권한
	public int adminModifyRole(String adminCk, Integer roleCode);

	// 역할 삭제
	public int deleteAuthInfo(Integer roleCode);

}
