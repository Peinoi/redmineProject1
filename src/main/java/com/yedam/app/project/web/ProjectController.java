package com.yedam.app.project.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.project.service.GroupVO;
import com.yedam.app.project.service.ProjectCopyVO;
import com.yedam.app.project.service.ProjectDetailVO;
import com.yedam.app.project.service.ProjectGroupDetailVO;
import com.yedam.app.project.service.ProjectMemberDetailVO;
import com.yedam.app.project.service.ProjectPrVO;
import com.yedam.app.project.service.ProjectRequestDTO;
import com.yedam.app.project.service.ProjectService;
import com.yedam.app.project.service.ProjectUpdateDTO;
import com.yedam.app.project.service.ProjectVO;
import com.yedam.app.project.service.PruserVO;
import com.yedam.app.project.service.RoleVO;
import com.yedam.app.project.service.UserProjectAuthVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class ProjectController {

	private final ProjectService projectService;

	@GetMapping("projects")
	public String projectList(HttpSession session, Model model) {
		UserVO user = (UserVO) session.getAttribute("user");

		if (user == null) {
			return "redirect:/login";
		}
		Integer userCode = user.getUserCode();

		// 1. 사용자 권한 조회
		UserProjectAuthVO auth = projectService.getUserProjectAuth(userCode, "프로젝트");

		// 2. 필터링된 프로젝트 목록 조회
		List<ProjectVO> projects = projectService.findAll(userCode, auth.getAdmin());

		// 3. 진척률 조회
		List<ProjectPrVO> progVO = projectService.progFindAll();
		Map<Integer, ProjectPrVO> progMap = new HashMap<>();
		for (ProjectPrVO prog : progVO) {
			progMap.put(prog.getProjectCode(), prog);
		}

		model.addAttribute("list", projects);
		model.addAttribute("progMap", progMap);
		model.addAttribute("auth", auth);
		model.addAttribute("userCode", userCode); // userCode 추가

		return "project/projects";
	}

	// 프로젝트 관리
	@GetMapping("projectsmgr")
	public String projectmgrList(HttpSession session, Model model) {
		UserVO user = (UserVO) session.getAttribute("user");

		if (user == null) {
			return "redirect:/login";
		}
		Integer userCode = user.getUserCode();

		// 1. 사용자 권한 조회
		UserProjectAuthVO auth = projectService.getUserProjectAuth(userCode, "프로젝트");

		// 2. 필터링된 프로젝트 목록 조회
		List<ProjectVO> projects = projectService.findAll(userCode, auth.getAdmin());

		// 3. 진척률 조회
		List<ProjectPrVO> progVO = projectService.progFindAll();
		Map<Integer, ProjectPrVO> progMap = new HashMap<>();
		for (ProjectPrVO prog : progVO) {
			progMap.put(prog.getProjectCode(), prog);
		}

		model.addAttribute("list", projects);
		model.addAttribute("progMap", progMap);
		model.addAttribute("auth", auth);
		model.addAttribute("userCode", userCode); // userCode 추가

		return "project/projectsmgr";
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

	// 종료 처리
	@PostMapping("api/projects/{projectCode}/modify")
	@ResponseBody
	public Map<String, Object> terminateProject(@PathVariable Integer projectCode, HttpSession session) {
		Map<String, Object> response = new HashMap<>();

		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null) {
			response.put("success", false);
			response.put("message", "로그인이 필요합니다.");
			return response;
		}

		Integer userCode = user.getUserCode();

		try {
			UserProjectAuthVO auth = projectService.getUserProjectAuth(userCode, "프로젝트");

			// 권한 체크: 관리자이거나 수정 권한이 있어야 함
			if (auth.getAdmin() != 1 && !"Y".equals(auth.getMoRol())) {
				response.put("success", false);
				response.put("message", "프로젝트 종료 권한이 없습니다.");
				return response;
			}

			int result = projectService.updateProjectStatus(projectCode, "OD3");

			if (result > 0) {
				response.put("success", true);
				response.put("message", "프로젝트가 종료되었습니다.");
			} else {
				response.put("success", false);
				response.put("message", "프로젝트 종료에 실패했습니다.");
			}
		} catch (Exception e) {
			response.put("success", false);
			response.put("message", "종료 처리 중 오류가 발생했습니다: " + e.getMessage());
		}

		return response;
	}

	@GetMapping("/test-delete")
	public String testDeletePage() {
		return "test-delete";
	}

	// 삭제 처리
	@PostMapping("api/projects/{projectCode}/delete")
	@ResponseBody
	public Map<String, Object> deleteProject(@PathVariable Integer projectCode, HttpSession session) {
		Map<String, Object> response = new HashMap<>();

		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null) {
			response.put("success", false);
			response.put("message", "로그인이 필요합니다.");
			return response;
		}

		Integer userCode = user.getUserCode();

		try {
			UserProjectAuthVO auth = projectService.getUserProjectAuth(userCode, "프로젝트");

			// 권한 체크: 관리자이거나 삭제 권한이 있어야 함
			if (auth.getAdmin() != 1 && !"Y".equals(auth.getDelRol())) {
				response.put("success", false);
				response.put("message", "프로젝트 삭제 권한이 없습니다.");
				return response;
			}

			int result = projectService.updateProjectStatus(projectCode, "OD2");

			if (result > 0) {
				response.put("success", true);
				response.put("message", "프로젝트가 삭제되었습니다.");
			} else {
				response.put("success", false);
				response.put("message", "프로젝트 삭제에 실패했습니다.");
			}
		} catch (Exception e) {
			response.put("success", false);
			response.put("message", "삭제 처리 중 오류가 발생했습니다: " + e.getMessage());
		}

		return response;
	}

	// ProjectController.java에 추가할 메서드들

	@GetMapping("project/{projectCode}")
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

		return "project/projectinfo";
	}

	@PostMapping("project/{projectCode}/update")
	@ResponseBody
	public Map<String, Object> updateProject(@PathVariable Integer projectCode, @RequestBody ProjectUpdateDTO updateDTO,
			HttpSession session) {

		Map<String, Object> response = new HashMap<>();

		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null) {
			response.put("success", false);
			response.put("message", "로그인이 필요합니다.");
			return response;
		}

		try {

			// 프로젝트 코드 설정
			updateDTO.setProjectCode(projectCode);

			// 프로젝트 수정
			int result = projectService.updateProject(updateDTO);

			if (result > 0) {
				response.put("success", true);
				response.put("message", "프로젝트가 수정되었습니다.");
			} else {
				response.put("success", false);
				response.put("message", "프로젝트 수정에 실패했습니다.");
			}

		} catch (Exception e) {
			response.put("success", false);
			response.put("message", "수정 처리 중 오류가 발생했습니다: " + e.getMessage());
		}

		return response;
	}

	// 프로젝트 복사
	@PostMapping("project/{projectCode}/copy")
	@ResponseBody
	public Map<String, Object> copyProject(@PathVariable Integer projectCode, @RequestBody ProjectCopyVO projectCopyVO,
			HttpSession session) {

		Map<String, Object> response = new HashMap<>();

		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null) {
			response.put("success", false);
			response.put("message", "로그인이 필요합니다.");
			return response;
		}

		try {
			// session에서 userCode 주입, PathVariable로 projectCode 주입
			projectCopyVO.setUserCode(user.getUserCode());
			projectCopyVO.setProjectCode(projectCode);

			int result = projectService.copyNewProject(projectCopyVO);

			if (result == 0) {
				response.put("success", true);
				response.put("message", "프로젝트가 복사되었습니다.");
			} else {
				response.put("success", false);
				response.put("message", projectCopyVO.getResultMsg());
			}
		} catch (Exception e) {
			response.put("success", false);
			response.put("message", "복사 처리 중 오류가 발생했습니다: " + e.getMessage());
		}

		return response;
	}
}
