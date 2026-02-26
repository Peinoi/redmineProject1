package com.yedam.app.usermodal.service;

import java.util.List;

public interface UserModalService {
	  List<UserModalVO> findUsersByProject(Long projectCode);
	  List<UserModalVO> findAssigneeByMyProjects(Long loginUserCode);
	  List<UserModalVO> findCreatorByMyProjects(Long loginUserCode);
	  
	  //공지
	  List<UserModalVO> findNoticeCreatorByMyProjects(Long loginUserCode);
	  //작업내역
	  List<UserModalVO> findUsersInMyProjects(Long loginUserCode);
	  //소요시간
	  List<UserModalVO> findWorklogWorkersByMyProjects(Long loginUserCode);
	  
	  // 문서용
	  List<UserModalVO> findDocsCreatorByMyProjects(Long loginUserCode);
}
