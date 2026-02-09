package com.yedam.app.usermodal.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.usermodal.service.UserModalVO;

public interface UserModalMapper {
	 List<UserModalVO> selectUserModalListByProject(@Param("projectCode") Long projectCode);
}
