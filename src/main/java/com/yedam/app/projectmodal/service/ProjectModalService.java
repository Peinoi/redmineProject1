package com.yedam.app.projectmodal.service;

import java.util.List;

public interface ProjectModalService {
	List<ProjectModalVO> findProjectListForListPage(Integer userCode);
	  List<ProjectModalVO> findProjectListForCreate(Integer userCode);
}
