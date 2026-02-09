package com.yedam.app.project.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.project.service.GroupVO;
import com.yedam.app.project.service.ProjectPrVO;
import com.yedam.app.project.service.ProjectRequestDTO;
import com.yedam.app.project.service.ProjectService;
import com.yedam.app.project.service.ProjectVO;
import com.yedam.app.project.service.PruserVO;
import com.yedam.app.project.service.RoleVO;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class ProjectController {

	private final ProjectService projectService;

	@GetMapping("projects")
	public String projectList(Model model) {
		List<ProjectVO> find = projectService.findAll();
		List<ProjectPrVO> progVO = projectService.progFindAll();
		// 프로젝트 코드별 진척률 매핑을 위한 Map 생성
		Map<Integer, ProjectPrVO> progMap = new HashMap<>();
		for (ProjectPrVO prog : progVO) {
			progMap.put(prog.getProjectCode(), prog);
		}

		model.addAttribute("list", find);
		model.addAttribute("progMap", progMap);
		return "project/projects";

	}

	@GetMapping("projectadd")
	public String projectAdd(Model model) {
		List<PruserVO> user = projectService.userFindAll();
		List<RoleVO> role = projectService.roleFindAll();
		List<GroupVO> group = projectService.groupFindAll();
		model.addAttribute("roles", role);
		model.addAttribute("users", user);
		model.addAttribute("groups", group);

		return "project/projectadd";

	}

	@PostMapping("projects")
	@ResponseBody
	public Map<String, Object> projectInsert(@RequestBody ProjectRequestDTO requestDTO) {
		Map<String, Object> response = new HashMap<>();

		try {
			// 프로젝트 등록 처리
			int projectCode = projectService.registerProject(requestDTO);

			response.put("success", true);
			response.put("projectCode", projectCode);
			response.put("message", "프로젝트가 정상적으로 등록되었습니다.");

		} catch (Exception e) {
			response.put("success", false);
			response.put("message", "프로젝트 등록 중 오류가 발생했습니다: " + e.getMessage());
		}

		return response;
	}
}
