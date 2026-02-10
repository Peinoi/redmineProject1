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

  // 목록: 로그인 사용자가 참여한 프로젝트들의 전체 참여자
  @GetMapping("/api/users/modal/my-projects")
  public List<UserModalVO> usersByMyProjects(HttpSession session) {
     UserVO user = (UserVO) session.getAttribute("user");
     
     if (user == null || user.getUserCode() == null) {
    	  throw new IllegalStateException("로그인 정보가 없습니다.");
    	}

    Integer userCode = user.getUserCode(); 
    return userModalService.findUsersByMyProjects(userCode.longValue());
  }
}
