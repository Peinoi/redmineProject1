package com.yedam.app.auth.mapper;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.project.service.RoleVO;

public interface AuthMapper {

	// 역할 수정
	public int updateAuth(@Param("roleCode") int roleCode);

	public int updateAdminRole(@Param("adminCk") String adminCk, @Param("roleCode") int roleCode);

	// 역할 삭제
	public int deleteAuth(@Param("roleCode") int roleCode);
}
