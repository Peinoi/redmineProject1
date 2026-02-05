package com.yedam.app.project.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.yedam.app.project.mapper.ProjectMapper;
import com.yedam.app.project.service.GroupVO;
import com.yedam.app.project.service.ProjectService;
import com.yedam.app.project.service.ProjectVO;
import com.yedam.app.project.service.RoleVO;
import com.yedam.app.project.service.UserVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

	private final ProjectMapper projectMapper;

	@Override
	public List<ProjectVO> findAll() {
		return projectMapper.selectAll();
	}

	@Override
	public List<UserVO> userFindAll() {
		return projectMapper.userAll();
	}

	@Override
	public List<RoleVO> roleFindAll() {
		return projectMapper.roleAll();
	}

	@Override
	public List<GroupVO> groupFindAll() {
		return projectMapper.groupAll();
	}

}
