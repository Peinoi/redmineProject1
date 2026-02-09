package com.yedam.app.usermodal.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.yedam.app.usermodal.service.UserModalService;
import com.yedam.app.usermodal.service.UserModalVO;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class UserModalController {

  private final UserModalService userModalService;

  @GetMapping("/api/users/modal")
  public List<UserModalVO> userModalList(@RequestParam("projectCode") Long projectCode) {
    return userModalService.findUserModalListByProject(projectCode);
  }
}
