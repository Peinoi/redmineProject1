package com.yedam.app.usermodal.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.usermodal.service.UserModalVO;

public interface UserModalMapper {
	// 선택된 프로젝트 참여자 : 등록,수정
	  List<UserModalVO> selectUsersByProject(@Param("projectCode") Long projectCode);

	  // 로그인 유저가 참여된 프로젝트의 사용자들 : 목록
	  List<UserModalVO> selectUsersByMyProjects(@Param("loginUserCode") Long loginUserCode);
	}
