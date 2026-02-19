package com.yedam.app.usermodal.service;

import java.util.List;

public interface UserModalService {
	  List<UserModalVO> findUsersByProject(Long projectCode);
	  List<UserModalVO> findAssigneeByMyProjects(Long loginUserCode);
	  List<UserModalVO> findCreatorByMyProjects(Long loginUserCode);
}
