package com.yedam.app.kanban.web;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
import com.yedam.app.kanban.web.dto.ProgressUpdateRequest;
import com.yedam.app.login.service.UserVO;
import com.yedam.app.project.service.UserProjectAuthVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class KanbanController {

  private final KanbanService kanbanService;
  private final AuthorityService authorityService;

  private static class SessionIssueAuth {
    private final String sysCk;
    private final List<Long> allProjectCodes;
    private final List<Long> adminProjectCodes;
    private final List<Long> readableProjectCodes;

    public SessionIssueAuth(String sysCk,
                            List<Long> allProjectCodes,
                            List<Long> adminProjectCodes,
                            List<Long> readableProjectCodes) {
      this.sysCk = sysCk;
      this.allProjectCodes = allProjectCodes;
      this.adminProjectCodes = adminProjectCodes;
      this.readableProjectCodes = readableProjectCodes;
    }

    public String getSysCk() {
      return sysCk;
    }

    public List<Long> getAllProjectCodes() {
      return allProjectCodes;
    }

    public List<Long> getAdminProjectCodes() {
      return adminProjectCodes;
    }

    public List<Long> getReadableProjectCodes() {
      return readableProjectCodes;
    }
  }

  private SessionIssueAuth buildSessionIssueAuth(HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");

    @SuppressWarnings("unchecked")
    List<UserProjectAuthVO> userAuthList =
        (List<UserProjectAuthVO>) session.getAttribute("userAuth");

    String sysCk = (user == null ? null : user.getSysCk());

    Set<Long> allProjectSet = new LinkedHashSet<>();
    Set<Long> adminProjectSet = new LinkedHashSet<>();
    Set<Long> readableProjectSet = new LinkedHashSet<>();

    if (userAuthList != null) {
      for (UserProjectAuthVO auth : userAuthList) {
        if (auth == null || auth.getProjectCode() == null) continue;

        Long code = auth.getProjectCode().longValue();

        allProjectSet.add(code);

        if (auth.getAdmin() != null && auth.getAdmin() == 1) {
          adminProjectSet.add(code);
        }

        if ("일감".equals(auth.getCategory()) && "Y".equals(auth.getRdRol())) {
          readableProjectSet.add(code);
        }
      }
    }

    readableProjectSet.removeAll(adminProjectSet);

    return new SessionIssueAuth(
        sysCk,
        new ArrayList<>(allProjectSet),
        new ArrayList<>(adminProjectSet),
        new ArrayList<>(readableProjectSet)
    );
  }

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

    SessionIssueAuth auth = buildSessionIssueAuth(session);

    if (projectCode != null) {
      boolean allowed;

      if ("Y".equals(auth.getSysCk())) {
        allowed = auth.getAllProjectCodes().contains(projectCode);
      } else {
        allowed = auth.getAdminProjectCodes().contains(projectCode)
            || auth.getReadableProjectCodes().contains(projectCode);
      }

      if (!allowed) {
        model.addAttribute("projectCode", projectCode == null ? "" : projectCode);
        model.addAttribute("userCode", userCode);
        model.addAttribute("ob1List", List.of());
        model.addAttribute("ob2List", List.of());
        model.addAttribute("ob3List", List.of());
        model.addAttribute("ob4List", List.of());
        model.addAttribute("ob5List", List.of());
        model.addAttribute("errorMessage", "해당 프로젝트 조회 권한이 없습니다.");
        return "kanban/board";
      }
    }

    Map<String, List<IssueVO>> cols = kanbanService.getBoardColumns(
        userCode,
        projectCode,
        scope,
        auth.getSysCk(),
        auth.getAllProjectCodes(),
        auth.getAdminProjectCodes(),
        auth.getReadableProjectCodes()
    );

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

    if (req == null || req.getProjectCode() == null || req.getIssueCode() == null) {
      return Map.of("success", false, "message", "요청 값이 올바르지 않습니다.");
    }

    Long projectCode = req.getProjectCode();
    Long issueCode = req.getIssueCode();
    String to = req.getToStatusCode();

    SessionIssueAuth auth = buildSessionIssueAuth(session);

    IssueVO issue = kanbanService.getIssue(
        userCode,
        projectCode,
        issueCode,
        auth.getSysCk(),
        auth.getAllProjectCodes(),
        auth.getAdminProjectCodes(),
        auth.getReadableProjectCodes()
    );

    if (issue == null) {
      return Map.of("success", false, "message", "일감 정보를 찾을 수 없습니다.");
    }

    boolean canModifyProject = authorityService.canModify(projectCode, userCode, "일감");

    boolean isAssignee = (issue.getAssigneeCode() != null)
        && issue.getAssigneeCode().intValue() == userCode;

    boolean isNormalMove = "OB1".equals(to) || "OB2".equals(to) || "OB3".equals(to);
    boolean isAdminMove = "OB4".equals(to) || "OB5".equals(to);

    if (isAdminMove) {
      AuthorityVO authVo = authorityService.getProjectAuth(userCode, projectCode);
      boolean isAdmin = (authVo != null) && "Y".equalsIgnoreCase(authVo.getAdminCk());
      if (!isAdmin) {
        return Map.of("success", false, "message", "권한이 없습니다.");
      }
    } else if (isNormalMove) {
      if (!(canModifyProject || isAssignee)) {
        return Map.of("success", false, "message", "권한이 없습니다.");
      }
    } else {
      return Map.of("success", false, "message", "이동할 수 없는 상태입니다.");
    }

    try {
      kanbanService.moveCard(userCode, req);
      return Map.of("success", true);
    } catch (Exception e) {
      return Map.of("success", false, "message", e.getMessage());
    }
  }

  @ResponseBody
  @PostMapping("/api/kanban/progress")
  public Map<String, Object> updateProgress(@RequestBody ProgressUpdateRequest req, HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) {
      return Map.of("success", false, "message", "로그인 정보가 없습니다.");
    }
    Integer userCode = user.getUserCode().intValue();

    if (req == null || req.getProjectCode() == null || req.getIssueCode() == null || req.getProgress() == null) {
      return Map.of("success", false, "message", "요청 값이 올바르지 않습니다.");
    }

    Long projectCode = req.getProjectCode();
    Long issueCode = req.getIssueCode();

    SessionIssueAuth auth = buildSessionIssueAuth(session);

    IssueVO issue = kanbanService.getIssue(
        userCode,
        projectCode,
        issueCode,
        auth.getSysCk(),
        auth.getAllProjectCodes(),
        auth.getAdminProjectCodes(),
        auth.getReadableProjectCodes()
    );

    if (issue == null) {
      return Map.of("success", false, "message", "일감 정보를 찾을 수 없습니다.");
    }

    String statusId = issue.getStatusId();
    if (!"OB2".equals(statusId)) {
      return Map.of("success", false, "message", "진행 상태에서만 진척도를 수정할 수 있습니다.");
    }

    boolean canModifyProject = authorityService.canModify(projectCode, userCode, "일감");
    boolean isAssignee = (issue.getAssigneeCode() != null)
        && issue.getAssigneeCode().intValue() == userCode;

    if (!(canModifyProject || isAssignee)) {
      return Map.of("success", false, "message", "권한이 없습니다.");
    }

    Integer progress = req.getProgress();
    if (progress < 0 || progress > 90) {
      return Map.of("success", false, "message", "진척도는 0~90 사이로 입력해 주세요.");
    }

    try {
      kanbanService.updateProgress(userCode, projectCode, issueCode, progress);
      return Map.of("success", true);
    } catch (Exception e) {
      return Map.of("success", false, "message", e.getMessage());
    }
  }
}