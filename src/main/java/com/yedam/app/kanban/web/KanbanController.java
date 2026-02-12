package com.yedam.app.kanban.web;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.authority.AuthorityVO;
import com.yedam.app.authority.service.AuthorityService;
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
  private final AuthorityService authorityService; // move API에서만 사용

  @GetMapping("/kanbanboard")
  public String kanbanboard(
      @RequestParam(value = "projectCode", required = false) Long projectCode,
      @RequestParam(value = "viewScope", required = false) String viewScope,
      HttpSession session,
      Model model
  ) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) return "redirect:/login";

    Integer userCode = user.getUserCode().intValue();

    String scope = (viewScope == null || viewScope.isBlank()) ? "ALL" : viewScope;

    Map<String, List<IssueVO>> cols = kanbanService.getBoardColumns(userCode, projectCode, scope);

    model.addAttribute("projectCode", projectCode == null ? "" : projectCode);
    model.addAttribute("userCode", userCode);

    model.addAttribute("ob1List", cols.getOrDefault("OB1", List.of()));
    model.addAttribute("ob2List", cols.getOrDefault("OB2", List.of()));
    model.addAttribute("ob3List", cols.getOrDefault("OB3", List.of()));
    model.addAttribute("ob4List", cols.getOrDefault("OB4", List.of()));
    model.addAttribute("ob5List", cols.getOrDefault("OB5", List.of()));

    return "kanban/board";
  }

  @ResponseBody
  @PostMapping("/api/issues/board/move")
  public Map<String, Object> move(@RequestBody KanbanMoveRequest req, HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) {
      return Map.of("success", false, "message", "로그인 정보가 없습니다.");
    }

    Integer userCode = user.getUserCode().intValue();

    if (req == null || req.getProjectCode() == null) {
      return Map.of("success", false, "message", "프로젝트 정보가 없습니다.");
    }

    boolean canModify = authorityService.canModify(req.getProjectCode(), userCode, "일감");
    if (!canModify) {
      return Map.of("success", false, "message", "권한이 없습니다.");
    }
    
    String to = req.getToStatusCode();
    if ("OB4".equals(to) || "OB5".equals(to)) {
      AuthorityVO auth = authorityService.getProjectAuth(userCode, req.getProjectCode());
      boolean isAdmin = (auth != null) && "Y".equalsIgnoreCase(auth.getAdminCk());
      if (!isAdmin) {
        return Map.of("success", false, "message", "권한이 없습니다.");
      }
    }

    try {
      kanbanService.moveCard(userCode, req);
      return Map.of("success", true);
    } catch (Exception e) {
      return Map.of("success", false, "message", e.getMessage());
    }
  }
  
  // 진척도 업데이트
  @ResponseBody
  @PostMapping("/api/issues/progress")
  public Map<String, Object> updateProgress(@RequestBody com.yedam.app.kanban.web.dto.ProgressUpdateRequest req,
                                           HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) {
      return Map.of("success", false, "message", "로그인 정보가 없습니다.");
    }
    Integer userCode = user.getUserCode().intValue();

    if (req == null || req.getProjectCode() == null || req.getIssueCode() == null || req.getProgress() == null) {
      return Map.of("success", false, "message", "요청 값이 올바르지 않습니다.");
    }

    // 권한 체크
    boolean canModify = authorityService.canModify(req.getProjectCode(), userCode, "일감");
    if (!canModify) {
      return Map.of("success", false, "message", "권한이 없습니다.");
    }

    try {
      kanbanService.updateProgress(userCode, req.getProjectCode(), req.getIssueCode(), req.getProgress());
      return Map.of("success", true);
    } catch (Exception e) {
      return Map.of("success", false, "message", e.getMessage());
    }
  }

}
