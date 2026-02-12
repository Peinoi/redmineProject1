package com.yedam.app.auth.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yedam.app.auth.mapper.AuthMapper;
import com.yedam.app.auth.service.AuthService;
import com.yedam.app.auth.service.RoleAuthVO;
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

	// 역할 + 권한 전체 등록 (트랜잭션 처리)
	@Override
	@Transactional
	public Map<String, Object> insertRoleWithAuth(Map<String, Object> requestData) {
		Map<String, Object> result = new HashMap<>();

		try {
			// 1. RoleVO 생성
			RoleVO roleVO = new RoleVO();
			roleVO.setRoleName((String) requestData.get("roleName"));
			roleVO.setExplanation((String) requestData.get("explanation"));
			roleVO.setAdminCk((String) requestData.get("adminCk"));

			// 2. 역할 등록 (SELECT KEY로 roleCode 자동 생성)
			int roleResult = authMapper.addAuth(roleVO);

			if (roleResult == 0) {
				result.put("success", false);
				result.put("message", "역할 등록에 실패했습니다.");
				return result;
			}

			// 3. SELECT KEY로 생성된 roleCode 가져오기
			Integer generatedRoleCode = roleVO.getRoleCode();

			// 4. 권한 정보 추출 및 등록
			@SuppressWarnings("unchecked")
			List<Map<String, Object>> permissionsList = (List<Map<String, Object>>) requestData.get("permissions");

			if (permissionsList != null && !permissionsList.isEmpty()) {
				for (Map<String, Object> permission : permissionsList) {
					RoleAuthVO roleAuth = new RoleAuthVO();
					roleAuth.setRoleCode(generatedRoleCode);
					roleAuth.setCategory((String) permission.get("category"));
					roleAuth.setRdRol((String) permission.get("rdRol"));
					roleAuth.setWrRol((String) permission.get("wrRol"));
					roleAuth.setMoRol((String) permission.get("moRol"));
					roleAuth.setDelRol((String) permission.get("delRol"));

					authMapper.addRoleAuth(roleAuth);
				}
			}

			result.put("success", true);
			result.put("message", "역할이 성공적으로 등록되었습니다.");
			result.put("roleCode", generatedRoleCode);

		} catch (Exception e) {
			result.put("success", false);
			result.put("message", "등록 중 오류가 발생했습니다: " + e.getMessage());
			throw e; // 트랜잭션 롤백을 위해 예외를 다시 던짐
		}

		return result;
	}

	@Override
	public RoleVO findRoleInfo(Integer roleCode) {
		return authMapper.selectRole(roleCode);
	}

	@Override
	public List<RoleAuthVO> findAuthInfo(Integer roleCode) {
		// TODO Auto-generated method stub
		return authMapper.selectAuthList(roleCode);
	}

}
