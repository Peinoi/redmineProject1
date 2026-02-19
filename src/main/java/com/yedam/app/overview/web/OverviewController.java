package com.yedam.app.overview.web;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.yedam.app.project.service.GroupVO;
import com.yedam.app.project.service.ProjectDetailVO;
import com.yedam.app.project.service.ProjectGroupDetailVO;
import com.yedam.app.project.service.ProjectMemberDetailVO;
import com.yedam.app.project.service.ProjectService;
import com.yedam.app.project.service.PruserVO;
import com.yedam.app.project.service.RoleVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class OverviewController {

	private final ProjectService projectService;
	
	@GetMapping("project/overview/{projectCode}")
	public String projectDetail(@PathVariable Integer projectCode, Model model, HttpSession session) {

		// 프로젝트 상세 정보 조회
		ProjectDetailVO project = projectService.getProjectDetail(projectCode);

		// 구성원 목록 조회
		List<ProjectMemberDetailVO> members = projectService.getProjectMembers(projectCode);

		// 그룹 목록 조회
		List<ProjectGroupDetailVO> groups = projectService.getProjectGroups(projectCode);

		// 전체 사용자 목록 (구성원 추가용)
		List<PruserVO> allUsers = projectService.userFindAll();

		// 전체 역할 목록
		List<RoleVO> allRoles = projectService.roleFindAll();

		// 전체 그룹 목록
		List<GroupVO> allGroups = projectService.groupFindAll();

		model.addAttribute("project", project);
		model.addAttribute("members", members);
		model.addAttribute("groups", groups);
		model.addAttribute("users", allUsers);
		model.addAttribute("roles", allRoles);
		model.addAttribute("allGroups", allGroups);

		return "overview/overview";
	}
}
