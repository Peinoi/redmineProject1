package com.yedam.app.groupmgr.web;

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

import com.yedam.app.groupmgr.service.GroupDTO;
import com.yedam.app.groupmgr.service.GroupMemberVO;
import com.yedam.app.groupmgr.service.GroupMgrVO;
import com.yedam.app.groupmgr.service.GroupProjectVO;
import com.yedam.app.groupmgr.service.GroupService;
import com.yedam.app.project.service.GroupVO;
import com.yedam.app.project.service.ProjectService;
import com.yedam.app.project.service.ProjectVO;
import com.yedam.app.project.service.PruserVO;
import com.yedam.app.project.service.RoleVO;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class GroupController {

	private final GroupService groupService;
	private final ProjectService projectService;

	@GetMapping("groupmgrs")
	public String groupsList(Model model) {
		List<GroupMgrVO> find = groupService.groupfindAll();
		model.addAttribute("groups", find);

		return "groupmgr/groupmgrlist";

	}

	// 그룹 등록 페이지
	@GetMapping("groupadd")
	public String groupAdd(Model model) {
		List<PruserVO> users = projectService.userFindAll();
		List<RoleVO> roles = projectService.roleFindAll();
		List<ProjectVO> projects = projectService.findAllProject();
	
		model.addAttribute("users", users);
		model.addAttribute("roles", roles);
		model.addAttribute("projects", projects);
		return "groupmgr/groupmgradd";
	}

	// 그룹 등록 처리
	@PostMapping("groupmgrsadd")
	@ResponseBody
	public Map<String, Object> groupInsert(@RequestBody GroupDTO groupDTO) {
		Map<String, Object> response = new HashMap<>();
		try {
			int groupCode = groupService.registerGroup(groupDTO);
			response.put("success", true);
			response.put("groupCode", groupCode);
			response.put("message", "그룹이 정상적으로 등록되었습니다.");
		} catch (Exception e) {
			response.put("success", false);
			response.put("message", "그룹 등록 중 오류가 발생했습니다: " + e.getMessage());
		}
		return response;
	}

	// 그룹 상세 조회 페이지
	@GetMapping("groupmgr/{groupCode}")
	public String groupDetail(@PathVariable Integer groupCode, Model model) {
		GroupMgrVO group = groupService.getGroupDetail(groupCode);
		List<GroupMemberVO> members = groupService.getGroupMembers(groupCode);
		List<GroupProjectVO> projects = groupService.getGroupProjects(groupCode);

		List<PruserVO> allUsers = projectService.userFindAll();
		List<RoleVO> allRoles = projectService.roleFindAll();
		List<ProjectVO> allProjects = projectService.findAllProject();

		model.addAttribute("group", group);
		model.addAttribute("members", members);
		model.addAttribute("projects", projects);
		model.addAttribute("users", allUsers);
		model.addAttribute("roles", allRoles);
		model.addAttribute("allProjects", allProjects);

		return "groupmgr/groupinfo";
	}

	// 그룹 수정
	@PostMapping("groupmgr/{groupCode}/update")
	@ResponseBody
	public Map<String, Object> updateGroup(@PathVariable Integer groupCode, @RequestBody GroupDTO groupDTO) {
		Map<String, Object> response = new HashMap<>();
		try {
			groupDTO.setGroupCode(groupCode);
			int result = groupService.updateGroup(groupDTO);
			if (result > 0) {
				response.put("success", true);
				response.put("message", "그룹이 수정되었습니다.");
			} else {
				response.put("success", false);
				response.put("message", "그룹 수정에 실패했습니다.");
			}
		} catch (Exception e) {
			response.put("success", false);
			response.put("message", "수정 처리 중 오류가 발생했습니다: " + e.getMessage());
		}
		return response;
	}

	// 그룹 삭제
	@PostMapping("api/groupmgr/{groupCode}/delete")
	@ResponseBody
	public Map<String, Object> deleteGroup(@PathVariable Integer groupCode) {
		Map<String, Object> response = new HashMap<>();
		try {
			int result = groupService.deleteGroup(groupCode);
			if (result > 0) {
				response.put("success", true);
				response.put("message", "그룹이 삭제되었습니다.");
			} else {
				response.put("success", false);
				response.put("message", "그룹 삭제에 실패했습니다.");
			}
		} catch (Exception e) {
			response.put("success", false);
			response.put("message", "삭제 처리 중 오류가 발생했습니다: " + e.getMessage());
		}
		return response;
	}
}
