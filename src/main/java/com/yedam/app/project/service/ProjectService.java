package com.yedam.app.project.service;

import java.util.List;

public interface ProjectService {
	public List<ProjectVO> findAll();

	public List<UserVO> userFindAll();

	public List<RoleVO> roleFindAll();

	public List<GroupVO> groupFindAll();

}
