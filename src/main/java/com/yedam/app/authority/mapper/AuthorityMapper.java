package com.yedam.app.authority.mapper;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.authority.AuthorityVO;

public interface AuthorityMapper {
	AuthorityVO selectAuthority(@Param("projectCode") Long projectCode,
            @Param("userCode") Integer userCode,
            @Param("category") String category);
	AuthorityVO selectProjectAuth(@Param("userCode") Integer userCode,
            @Param("projectCode") Long projectCode);
}
