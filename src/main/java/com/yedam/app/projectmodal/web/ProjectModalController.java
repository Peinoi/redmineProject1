package com.yedam.app.projectmodal.web;

import java.util.List;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.yedam.app.projectmodal.service.ProjectModalService;
import com.yedam.app.projectmodal.service.ProjectModalVO;
import com.yedam.app.login.service.UserVO; // 너희 프로젝트 실제 User 클래스 경로로 수정

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ProjectModalController {

  private final ProjectModalService projectModalService;

  private Integer getLoginUserCode(HttpSession session) {
	    Object obj = session.getAttribute("user");
	    if (obj == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
	    UserVO user = (UserVO) obj;
	    if (user.getUserCode() == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
	    return user.getUserCode();
	  }

	  // 목록/조회 화면용
	  @GetMapping("/api/projects/modal")
	  public List<ProjectModalVO> forListPage(HttpSession session) {
	    Integer userCode = getLoginUserCode(session);
	    return projectModalService.findProjectListForListPage(userCode);
	  }

	  // 등록 화면용 (OD1만)
	  @GetMapping("/api/projects/modal/create")
	  public List<ProjectModalVO> forCreate(HttpSession session) {
		  Integer userCode = getLoginUserCode(session);
	    return projectModalService.findProjectListForCreate(userCode);
	  }
}
