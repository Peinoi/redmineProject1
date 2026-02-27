package com.yedam.app.usermodal.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.usermodal.service.UserModalService;
import com.yedam.app.usermodal.service.UserModalVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class UserModalController {

	private final UserModalService userModalService;

	// 등록/수정: 선택한 프로젝트 참여자
	@GetMapping("/api/users/modal")
	public List<UserModalVO> usersByProject(@RequestParam("projectCode") Long projectCode) {
		return userModalService.findUsersByProject(projectCode);
	}

	// 목록: 로그인 사용자가 참여한 프로젝트들의 전체 담당자들
	@GetMapping("/api/users/modal/assignees")
	public List<UserModalVO> getAssignees(HttpSession session) {
		UserVO user = (UserVO) session.getAttribute("user");

		if (user == null || user.getUserCode() == null) {
			throw new IllegalStateException("로그인 정보가 없습니다.");
		}

		Integer userCode = user.getUserCode();
		return userModalService.findAssigneeByMyProjects(userCode.longValue());
	}

    //목록: 로그인 사용자가 참여한 프로젝트들의 전체 등록자들
	@GetMapping("/api/users/modal/creators")
	public List<UserModalVO> getCreators(HttpSession session) {
		UserVO user = (UserVO) session.getAttribute("user");

		if (user == null || user.getUserCode() == null) {
			throw new IllegalStateException("로그인 정보가 없습니다.");
		}

		Integer userCode = user.getUserCode();
		return userModalService.findCreatorByMyProjects(userCode.longValue());
	}
	
	// 공지 목록: 로그인 사용자가 참여한 프로젝트들의 공지 등록자들
	@GetMapping("/api/users/modal/notices/creators")
	public List<UserModalVO> getNoticeCreators(HttpSession session) {
	  UserVO user = (UserVO) session.getAttribute("user");

	  if (user == null || user.getUserCode() == null) {
	    throw new IllegalStateException("로그인 정보가 없습니다.");
	  }

	  Integer userCode = user.getUserCode();
	  return userModalService.findNoticeCreatorByMyProjects(userCode.longValue());
	}
	
	// 작업내역
	@GetMapping("/api/users/modal/my-projects")
	public List<UserModalVO> getUsersInMyProjects(HttpSession session) {
	  UserVO user = (UserVO) session.getAttribute("user");
	  if (user == null || user.getUserCode() == null) {
	    throw new IllegalStateException("로그인 정보가 없습니다.");
	  }
	  return userModalService.findUsersInMyProjects(user.getUserCode().longValue());
	}
	
	//소요시간
	@GetMapping("/api/users/modal/worklogs/workers")
	public List<UserModalVO> getWorklogWorkers(HttpSession session) {
	  UserVO user = (UserVO) session.getAttribute("user");

	  if (user == null || user.getUserCode() == null) {
	    throw new IllegalStateException("로그인 정보가 없습니다.");
	  }

	  return userModalService.findWorklogWorkersByMyProjects(user.getUserCode().longValue());
	}
	
	//일감용
	@GetMapping("/api/users/modal/docs/creators")
	public List<UserModalVO> getDocsCreators(HttpSession session) {
		UserVO user = (UserVO) session.getAttribute("user");

		if (user == null || user.getUserCode() == null) {
		    throw new IllegalStateException("로그인 정보가 없습니다.");
		}

		return userModalService.findDocsCreatorByMyProjects(user.getUserCode().longValue());
	}

}
