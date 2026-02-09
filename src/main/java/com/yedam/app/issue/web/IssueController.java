package com.yedam.app.issue.web;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.yedam.app.authority.service.AuthorityService;
import com.yedam.app.issue.service.IssueService;
import com.yedam.app.issue.service.IssueVO;
import com.yedam.app.log.service.LogService;
import com.yedam.app.login.service.UserVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class IssueController {

  private final IssueService issueService;
  private final AuthorityService authorityService;
  private final LogService logService;
  
  // 목록조회
  @GetMapping("issueList")
  public String issueList(@RequestParam(required = false) Long projectCode,
                          Model model,
                          HttpSession session) {

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return "redirect:/login";

    Integer userCode = user.getUserCode();

    model.addAttribute("list", issueService.findVisibleIssues(userCode, projectCode));
    model.addAttribute("projectCode", projectCode);

    return "issue/list";
  }


  // 단건조회
  @GetMapping("issueInfo")
  public String issueInfo(IssueVO issue, Model model) {
    IssueVO findVO = issueService.findByIssueCode(issue);
    model.addAttribute("issue", findVO);
    model.addAttribute("logs", logService.findLogsByTarget("ISSUE", issue.getIssueCode()));
    return "issue/info";
  }

  // 등록 화면
  @GetMapping("issueInsert")
  public String issueInsertForm(@RequestParam(required = false) Long projectCode,
                                Model model,
                                HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return "redirect:/login";

    model.addAttribute("issue", new IssueVO());
    model.addAttribute("projectCode", projectCode);
    return "issue/insert";
  }
  // 등록처리
  @PostMapping("issueInsert")
  public String issueInsertProcess(@ModelAttribute IssueVO issue,
                                   @RequestParam(required = false) MultipartFile uploadFile,
                                   HttpSession session,
                                   RedirectAttributes ra) {

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return "redirect:/login";

    Integer userCode = user.getUserCode();

    Long projectCode = issue.getProjectCode();
    if (projectCode == null) {
      ra.addFlashAttribute("errorMessage", "프로젝트를 선택해 주세요.");
      return "redirect:/issueInsert";
    }

    boolean canWrite = authorityService.canWrite(projectCode, userCode, "일감");
    if (!canWrite) {
      ra.addFlashAttribute("errorMessage", "권한이 없습니다.");
      return "redirect:/issueInsert";
    }

    issue.setCreatedByCode(userCode);
    Long issueCode = issueService.addIssue(issue);

    if (uploadFile != null && !uploadFile.isEmpty()) {
      issueService.attachFileToIssue(issueCode, userCode, uploadFile);
    }

    return "redirect:/issueList";
  }

  // 삭제
  @PostMapping("issueDelete")
  public String issueDeleteProcess(@RequestParam("issueCodes") List<Long> issueCodes) {
    if (issueCodes != null && !issueCodes.isEmpty()) {
      issueService.removeIssues(issueCodes);
    }
    return "redirect:/issueList";
  }

  // 수정 화면
  @GetMapping("issueEdit")
  public String issueEditForm(IssueVO issue, Model model) {
    IssueVO findVO = issueService.findByIssueCode(issue);
    model.addAttribute("issue", findVO);
    return "issue/edit";
  }

  // 수정 처리
  @PostMapping(value = "issueEdit", consumes = "multipart/form-data")
  public String issueEditProcess(@ModelAttribute IssueVO issue,
                                 @RequestParam(required = false) MultipartFile uploadFile,
                                 HttpSession session) {

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return "redirect:/login";

    Integer userCode = user.getUserCode();
    issueService.modifyIssueInfo(issue, uploadFile, userCode);

    return "redirect:/issueInfo?issueCode=" + issue.getIssueCode();
  }
}
