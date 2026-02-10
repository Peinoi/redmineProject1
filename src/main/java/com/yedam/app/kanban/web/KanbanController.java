package com.yedam.app.kanban.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.issue.service.IssueVO;
import com.yedam.app.kanban.service.KanbanService;
import com.yedam.app.kanban.web.dto.KanbanMoveRequest;
import com.yedam.app.login.service.UserVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class KanbanController {

  private final KanbanService kanbanService;

  // 화면
  @GetMapping("/kanbanboard")
  public String kanbanboard(
      @RequestParam(value = "projectCode", required = false) Long projectCode,
      HttpSession session,
      Model model
  ) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) {
      return "redirect:/login";
    }

    Long loginUserCode = user.getUserCode().longValue();

    Map<String, List<IssueVO>> cols;

    if (projectCode == null) {
      cols = kanbanService.getBoardColumnsByUser(loginUserCode); // 내 일감 전체
      model.addAttribute("projectCode", "");
      model.addAttribute("projectName", "내 일감");
    } else {
      cols = kanbanService.getBoardColumnsByProject(projectCode); // 프로젝트 보드
      model.addAttribute("projectCode", projectCode);
      model.addAttribute("projectName", "프로젝트"); // TODO 실제 조회
    }

    model.addAttribute("canWrite", true); // TODO 실제 권한 로직 연결

    model.addAttribute("ob1List", cols.getOrDefault("OB1", List.of()));
    model.addAttribute("ob2List", cols.getOrDefault("OB2", List.of()));
    model.addAttribute("ob3List", cols.getOrDefault("OB3", List.of()));
    model.addAttribute("ob4List", cols.getOrDefault("OB4", List.of()));
    model.addAttribute("ob5List", cols.getOrDefault("OB5", List.of()));

    return "kanban/board";
  }


  // 이동 저장 API
  @ResponseBody
  @PostMapping("/api/issues/board/move")
  public Map<String, Object> move(@RequestBody KanbanMoveRequest req,
                                  HttpSession session) {

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) {
      Map<String, Object> r = new HashMap<>();
      r.put("success", false);
      r.put("message", "로그인 정보가 없습니다.");
      return r;
    }

    Long loginUserCode = user.getUserCode().longValue();
    kanbanService.moveCard(loginUserCode, req);

    Map<String, Object> r = new HashMap<>();
    r.put("success", true);
    return r;
  }
}
