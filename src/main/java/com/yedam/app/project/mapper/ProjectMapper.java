package com.yedam.app.project.mapper;

import java.util.List;

import com.yedam.app.project.service.GroupVO;
import com.yedam.app.project.service.ProjectAddGroupVO;
import com.yedam.app.project.service.ProjectAddMapVO;
import com.yedam.app.project.service.ProjectAddStatusVO;
import com.yedam.app.project.service.ProjectAddVO;
import com.yedam.app.project.service.ProjectPrVO;
import com.yedam.app.project.service.ProjectVO;
import com.yedam.app.project.service.PruserVO;
import com.yedam.app.project.service.RoleVO;

public interface ProjectMapper {
	public List<ProjectVO> selectAll();

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

}
