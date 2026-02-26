package com.yedam.app.login.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yedam.app.login.mapper.LoginMapper;
import com.yedam.app.login.service.TodayDueDTO;
import com.yedam.app.login.service.UserVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class QuickApiController {

  private final LoginMapper loginMapper;

  @GetMapping("/api/quick/today-due")
  public List<TodayDueDTO> todayDue(HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return List.of();
    return loginMapper.selectTodayDueTopN(user.getUserCode(), 5);
  }
}