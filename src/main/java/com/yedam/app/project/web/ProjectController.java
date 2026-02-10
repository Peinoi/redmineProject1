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
import com.yedam.app.project.service.ProjectPrVO;
import com.yedam.app.project.service.ProjectRequestDTO;
import com.yedam.app.project.service.ProjectService;
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
    @PostMapping("api/projects/{projectCode}/terminate")
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

}
