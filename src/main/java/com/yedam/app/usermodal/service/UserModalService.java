package com.yedam.app.usermodal.service;

import java.util.List;

public interface UserModalService {
	  List<UserModalVO> findUsersByProject(Long projectCode);
	  List<UserModalVO> findUsersByMyProjects(Long loginUserCode);
}
