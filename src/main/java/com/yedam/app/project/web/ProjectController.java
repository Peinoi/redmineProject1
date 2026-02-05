package com.yedam.app.project.web;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.yedam.app.project.service.GroupVO;
import com.yedam.app.project.service.ProjectService;
import com.yedam.app.project.service.ProjectVO;
import com.yedam.app.project.service.RoleVO;
import com.yedam.app.project.service.UserVO;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class ProjectController {

	private final ProjectService projectService;

	@GetMapping("projects")
	public String projectList(Model model) {
		List<ProjectVO> find = projectService.findAll();
		model.addAttribute("list", find);
		return "project/projects";

	}

	@GetMapping("projectadd")
	public String projectAdd(Model model) {
		List<UserVO> user = projectService.userFindAll();
		List<RoleVO> role = projectService.roleFindAll();
		List<GroupVO> group = projectService.groupFindAll();
		model.addAttribute("roles", role);
		model.addAttribute("users", user);
		model.addAttribute("groups", group);

		return "project/projectadd";

	}

}
