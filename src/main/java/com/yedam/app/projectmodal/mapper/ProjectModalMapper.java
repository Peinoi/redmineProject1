package com.yedam.app.projectmodal.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.projectmodal.service.ProjectModalVO;

public interface ProjectModalMapper {
	List<ProjectModalVO> selectProjectModalListForListPage(@Param("userCode") Integer userCode); // OD1 + (admin이면 OD3)
	  List<ProjectModalVO> selectProjectModalListForCreate(@Param("userCode") Integer userCode);   // 무조건 OD1
}
