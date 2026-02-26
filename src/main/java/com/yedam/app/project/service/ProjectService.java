package com.yedam.app.project.service;

import java.util.List;

public interface ProjectService {
	List<ProjectVO> findAll(Integer userCode, Integer isAdmin);

	public List<PruserVO> userFindAll();

	public List<RoleVO> roleFindAll();

	public List<GroupVO> groupFindAll();

	public List<ProjectPrVO> progFindAll();

	public List<ProjectVO> findAllProject();

	// 프로젝트 등록
	public int projectAdd(ProjectAddVO projectAddVO); // 프로젝트 등록

	public int projectStatAdd(ProjectAddStatusVO projectAddStatVO); // 프로젝트 상태 등록

	public int projectMapAdd(ProjectAddMapVO projectAddMapVO); // 프로젝트 구성원 매퍼 등록

	public int projectGroupAdd(ProjectAddGroupVO projectAddGroupVO); // 프로젝트 그룹 매퍼 등록

	// 프로젝트 등록
	public int registerProject(ProjectRequestDTO requestDTO);

	// 권한조회
	public UserProjectAuthVO getUserProjectAuth(Integer userCode, String category);

	public List<UserProjectAuthVO> getUserProjectAuthAll(Integer userCode);

	// 프로젝트 상태 변경
	public int updateProjectStatus(Integer projectCode, String status);

	// 프로젝트 상세 조회
	public ProjectDetailVO getProjectDetail(Integer projectCode);

	// 프로젝트 구성원 목록 조회
	public List<ProjectMemberDetailVO> getProjectMembers(Integer projectCode);

	// 프로젝트 그룹 목록 조회
	public List<ProjectGroupDetailVO> getProjectGroups(Integer projectCode);

	// 프로젝트 수정
	public int updateProject(ProjectUpdateDTO updateDTO);
	
	// 프로젝트 복사
	public int copyNewProject(ProjectCopyVO projectCopyVO);
	
	// 프로젝트 담당자 목록
	public List<ProjectManagerVO> findSelectManager(Integer userCode);

}
