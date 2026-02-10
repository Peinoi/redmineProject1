package com.yedam.app.project.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yedam.app.project.mapper.ProjectMapper;
import com.yedam.app.project.service.GroupVO;
import com.yedam.app.project.service.ProjectAddGroupVO;
import com.yedam.app.project.service.ProjectAddMapVO;
import com.yedam.app.project.service.ProjectAddStatusVO;
import com.yedam.app.project.service.ProjectAddVO;
import com.yedam.app.project.service.ProjectPrVO;
import com.yedam.app.project.service.ProjectRequestDTO;
import com.yedam.app.project.service.ProjectService;
import com.yedam.app.project.service.ProjectVO;
import com.yedam.app.project.service.PruserVO;
import com.yedam.app.project.service.RoleVO;
import com.yedam.app.project.service.UserProjectAuthVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

	private final ProjectMapper projectMapper;

	@Override
	public List<ProjectVO> findAll(Integer userCode, Integer isAdmin) {
		Map<String, Object> params = new HashMap<>();
		params.put("userCode", userCode);
		params.put("isAdmin", isAdmin);
		return projectMapper.selectAll(params);
	}

	@Override
	public List<PruserVO> userFindAll() {
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

	@Override
	public List<ProjectPrVO> progFindAll() {
		return projectMapper.projPrAll();
	}

	// 프로젝트 등록
	@Override
	public int projectAdd(ProjectAddVO projectAddVO) {
		int result = projectMapper.projectInsert(projectAddVO);
		return result;
	}

	@Override
	public int projectStatAdd(ProjectAddStatusVO projectAddStatVO) {
		int result = projectMapper.projectStatInsert(projectAddStatVO);
		return result;
	}

	@Override
	public int projectMapAdd(ProjectAddMapVO projectAddMapVO) {
		int result = projectMapper.projectMapInsert(projectAddMapVO);
		return result;
	}

	@Override
	public int projectGroupAdd(ProjectAddGroupVO projectAddGroupVO) {
		int result = projectMapper.projectGroupInsert(projectAddGroupVO);
		return result;
	}

	@Override
	@Transactional
	public int registerProject(ProjectRequestDTO projDTO) {
		// 1. 프로젝트 등록
		ProjectAddVO projectVO = ProjectAddVO.builder().projectName(projDTO.getProjectName())
				.description(projDTO.getDescription()).status(projDTO.getStatus()).userCode(projDTO.getUserCode())
				.build();

		projectMapper.projectInsert(projectVO);
		Integer projectCode = projectVO.getProjectCode();

		// 2. 상태 5개 등록 (OB1 ~ OB5)
		for (int i = 1; i <= 5; i++) {
			ProjectAddStatusVO statusVO = new ProjectAddStatusVO();
			statusVO.setProjectCode(projectCode);
			statusVO.setCodeId("OB" + i);
			statusVO.setSortNo(i);
			projectMapper.projectStatInsert(statusVO);
		}

		// 3. 프로젝트 사용자 매핑 등록
		if (projDTO.getProjectUsers() != null) {
			for (ProjectRequestDTO.ProjectUserDTO userDTO : projDTO.getProjectUsers()) {
				ProjectAddMapVO mapVO = new ProjectAddMapVO();
				mapVO.setProjectCode(projectCode);
				mapVO.setUserCode(Integer.parseInt(userDTO.getUserCode()));
				mapVO.setRoleCode(Integer.parseInt(userDTO.getRoleCode()));
				projectMapper.projectMapInsert(mapVO);
			}
		}

		// 4. 프로젝트 그룹 매핑 등록
		if (projDTO.getProjectGroups() != null) {
			for (ProjectRequestDTO.ProjectGroupDTO groupDTO : projDTO.getProjectGroups()) {
				ProjectAddGroupVO groupVO = new ProjectAddGroupVO();
				groupVO.setProjectCode(projectCode);
				groupVO.setGrCode(Integer.parseInt(groupDTO.getGroupCode()));
				groupVO.setRoleCode(Integer.parseInt(groupDTO.getRoleCode()));
				projectMapper.projectGroupInsert(groupVO);
			}
		}

		return projectCode;
	}

	// 권한 조회
	@Override
    public UserProjectAuthVO getUserProjectAuth(Integer userCode, String category) {
        Map<String, Object> params = new HashMap<>();
        params.put("userCode", userCode);
        params.put("category", category);
        return projectMapper.selectUserProjectAuth(params);
    }
	
	// 프로젝트 상태 변경
    @Override
    public int updateProjectStatus(Integer projectCode, String status) {
        Map<String, Object> params = new HashMap<>();
        params.put("projectCode", projectCode);
        params.put("status", status);
        return projectMapper.updateProjectStatus(params);
    }
}
