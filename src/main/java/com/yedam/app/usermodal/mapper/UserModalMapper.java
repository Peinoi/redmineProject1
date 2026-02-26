package com.yedam.app.usermodal.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.usermodal.service.UserModalVO;

public interface UserModalMapper {
	// 선택된 프로젝트 참여자 : 등록,수정
	List<UserModalVO> selectUsersByProject(@Param("projectCode") Long projectCode);

	// 로그인 유저가 참여된 프로젝트의 담당자들 : 목록
	List<UserModalVO> selectAssigneeByMyProjects(@Param("loginUserCode") Long loginUserCode);

	// 로그인 유저가 참여된 프로젝트의 등록자들 : 목록
	List<UserModalVO> selectCreatorByMyProjects(@Param("loginUserCode") Long loginUserCode);
	
	// 공지용
	List<UserModalVO> selectNoticeCreatorByMyProjects(@Param("loginUserCode") Long loginUserCode);
	
	// 작업내역용
	List<UserModalVO> selectUsersInMyProjects(@Param("loginUserCode") Long loginUserCode);
	
	// 소요시간용
	List<UserModalVO> selectWorklogWorkersByMyProjects(@Param("loginUserCode") Long loginUserCode);
	
	// 문서용
    List<UserModalVO> selectDocsCreatorByMyProjects(@Param("loginUserCode") Long loginUserCode);
}
