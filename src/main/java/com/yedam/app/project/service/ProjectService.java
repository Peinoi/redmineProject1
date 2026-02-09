package com.yedam.app.project.service;

import java.util.List;

public interface ProjectService {
	public List<ProjectVO> findAll();

	public List<PruserVO> userFindAll();

	public List<RoleVO> roleFindAll();

	public List<GroupVO> groupFindAll();

	public List<ProjectPrVO> progFindAll();

	// 프로젝트 등록
	public int projectAdd(ProjectAddVO projectAddVO); // 프로젝트 등록

	public int projectStatAdd(ProjectAddStatusVO projectAddStatVO); // 프로젝트 상태 등록

	public int projectMapAdd(ProjectAddMapVO projectAddMapVO); // 프로젝트 구성원 매퍼 등록

	public int projectGroupAdd(ProjectAddGroupVO projectAddGroupVO); // 프로젝트 그룹 매퍼 등록
	
	// 프로젝트 등록 통합 메서드 추가
    int registerProject(ProjectRequestDTO requestDTO);

}
