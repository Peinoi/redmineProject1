package com.yedam.app.project.mapper;

import java.util.List;
import java.util.Map;

import com.yedam.app.project.service.GroupVO;
import com.yedam.app.project.service.ProjectAddGroupVO;
import com.yedam.app.project.service.ProjectAddMapVO;
import com.yedam.app.project.service.ProjectAddStatusVO;
import com.yedam.app.project.service.ProjectAddVO;
import com.yedam.app.project.service.ProjectPrVO;
import com.yedam.app.project.service.ProjectVO;
import com.yedam.app.project.service.PruserVO;
import com.yedam.app.project.service.RoleVO;
import com.yedam.app.project.service.UserProjectAuthVO;

public interface ProjectMapper {
	List<ProjectVO> selectAll(Map<String, Object> params);

	public List<PruserVO> userAll();

	public List<RoleVO> roleAll();

	public List<GroupVO> groupAll();

	public List<ProjectPrVO> projPrAll();

	// 프로젝트 등록
	public int projectInsert(ProjectAddVO projectAddVO);

	// 프로젝트 상태 등록
	public int projectStatInsert(ProjectAddStatusVO projectAddStatVO);

	// 프로젝트 매퍼 등록
	public int projectMapInsert(ProjectAddMapVO projectAddMapVO);

	// 프로젝트 그룹 매퍼 등록
	public int projectGroupInsert(ProjectAddGroupVO projectAddGroupVO);
	
	// 권한 조회
	UserProjectAuthVO selectUserProjectAuth(Map<String, Object> params);

	// 프로젝트 상태 변경
	int updateProjectStatus(Map<String, Object> params);
}
