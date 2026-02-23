package com.yedam.app.issue.web;

import java.net.URI;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.yedam.app.authority.AuthorityVO;
import com.yedam.app.authority.service.AuthorityService;
import com.yedam.app.issue.service.IssueService;
import com.yedam.app.issue.service.IssueVO;
import com.yedam.app.log.service.LogService;
import com.yedam.app.login.service.UserVO;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class IssueController {

  private final IssueService issueService;
  private final AuthorityService authorityService;
  private final LogService logService;

  private static final String ISSUE_RETURN_URL = "ISSUE_RETURN_URL";

  private String sanitizeReturnUrl(String referer, String fallbackPath) {
    if (referer == null || referer.isBlank()) return fallbackPath;

    try {
      // referer가 "http(s)://..." 일 수도 있으니 path/query만 뽑아서 내부로 리다이렉트
      URI uri = URI.create(referer);
      String path = (uri.getPath() == null || uri.getPath().isBlank()) ? "" : uri.getPath();
      String query = (uri.getQuery() == null || uri.getQuery().isBlank()) ? "" : "?" + uri.getQuery();

      String cleaned = path + query;
      if (cleaned.isBlank()) return fallbackPath;

      // 등록 화면으로 되돌아가는 건 방지
      if (cleaned.contains("/issueInsert")) return fallbackPath;

      // 내부 경로만 허용(최소 안전장치)
      if (!cleaned.startsWith("/")) return fallbackPath;

      return cleaned;
    } catch (Exception e) {
      // referer가 URI 파싱 불가한 값이면 그냥 fallback
      return fallbackPath;
    }
  }

  // 목록조회
  @GetMapping("issueList")
  public String issueList(@RequestParam(required = false) Long projectCode, Model model, HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return "redirect:/login";

    Integer userCode = user.getUserCode();

    List<IssueVO> list = issueService.findVisibleIssues(userCode, projectCode);
    model.addAttribute("list", list);
    model.addAttribute("projectCode", projectCode);

    return "issue/list";
  }

//단건조회
@GetMapping("issueInfo")
public String issueInfo(IssueVO issue, Model model, HttpSession session) {
 IssueVO findVO = issueService.findByIssueCode(issue);
 model.addAttribute("issue", findVO);
 model.addAttribute("logs", logService.findLogsByTarget("ISSUE", issue.getIssueCode()));

 boolean canModify = false;
 boolean canDelete = false;
 boolean isAdmin = false;

 UserVO user = (UserVO) session.getAttribute("user");
 if (user != null && user.getUserCode() != null && findVO != null) {
   Integer userCode = user.getUserCode();
   Long projectCode = findVO.getProjectCode();
   Long issueCode = findVO.getIssueCode(); // 또는 issue.getIssueCode()

   // 관리자 여부
   AuthorityVO projAuth = authorityService.getProjectAuth(userCode, projectCode);
   isAdmin = projAuth != null && "Y".equalsIgnoreCase(projAuth.getAdminCk());

   // 등록자/담당자 여부
   boolean isCreatorOrAssignee =
       authorityService.isIssueCreatorOrAssignee(issueCode, userCode);

   // 역할 권한
   boolean hasModifyRole = authorityService.canModify(projectCode, userCode, "일감");
   boolean hasDeleteRole = authorityService.canDelete(projectCode, userCode, "일감");

   // 최종 권한 규칙 적용
   canModify = isAdmin || (hasModifyRole && isCreatorOrAssignee);
   canDelete = isAdmin || (hasDeleteRole && isCreatorOrAssignee);
 }

 model.addAttribute("canModify", canModify);
 model.addAttribute("canDelete", canDelete);
 model.addAttribute("isAdmin", isAdmin);

 return "issue/info";
}

  // 등록 화면
  @GetMapping("issueInsert")
  public String issueInsertForm(
      @RequestParam(required = false) Long projectCode,
      Model model,
      HttpSession session,
      HttpServletRequest request
  ) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return "redirect:/login";

    // "등록 화면 들어오기 직전 페이지"를 세션에 저장
    // referer가 없거나 이상하면 /issueList 로
    String fallback = "/issueList";
    String prev = sanitizeReturnUrl(request.getHeader("Referer"), fallback);
    session.setAttribute(ISSUE_RETURN_URL, prev);

    model.addAttribute("issue", new IssueVO());
    model.addAttribute("projectCode", projectCode);

    return "issue/insert";
  }

  // 등록처리
  @PostMapping("issueInsert")
  public String issueInsertProcess(
      @ModelAttribute IssueVO issue,
      @RequestParam(required = false) MultipartFile uploadFile,
      HttpSession session,
      RedirectAttributes ra
  ) {
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

    // GET /issueInsert 진입 시 저장해둔 이전 페이지로 이동
    String returnUrl = (String) session.getAttribute(ISSUE_RETURN_URL);
    String fallback = "/issueList";

    if (returnUrl == null || returnUrl.isBlank()) returnUrl = fallback;
    returnUrl = sanitizeReturnUrl(returnUrl, fallback);

    // 한번 쓰고 지우고 싶으면
    session.removeAttribute(ISSUE_RETURN_URL);

    return "redirect:" + returnUrl;
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
  public String issueEditForm(IssueVO issue, Model model, HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return "redirect:/login";

    IssueVO findVO = issueService.findByIssueCode(issue);
    if (findVO == null) return "redirect:/issueList";

    Integer userCode = user.getUserCode();
    Long projectCode = findVO.getProjectCode();

    var auth = authorityService.getProjectAuth(userCode, projectCode);

    List<String> allowedStatusIds;
    if (auth != null && "Y".equalsIgnoreCase(auth.getAdminCk())) {
      allowedStatusIds = List.of("OB1", "OB2", "OB3", "OB4", "OB5");
    } else {
      allowedStatusIds = List.of("OB1", "OB2", "OB3");
    }

    model.addAttribute("issue", findVO);
    model.addAttribute("allowedStatusIds", allowedStatusIds);
    model.addAttribute("adminCk", auth == null ? "N" : auth.getAdminCk());
    model.addAttribute("userProjectStatus", auth == null ? null : auth.getStatus());

    return "issue/edit";
  }

  // 수정 처리
  @PostMapping(value = "issueEdit", consumes = "multipart/form-data")
  public String issueEditProcess(
      @ModelAttribute IssueVO issue,
      @RequestParam(required = false) MultipartFile uploadFile,
      HttpSession session
  ) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return "redirect:/login";

    Integer userCode = user.getUserCode();
    issueService.modifyIssueInfo(issue, uploadFile, userCode);

    return "redirect:/issueInfo?issueCode=" + issue.getIssueCode();
  }

  // 승인
  @ResponseBody
  @PostMapping("/api/issues/{issueCode}/approve")
  public Map<String, Object> approve(@PathVariable Long issueCode, HttpSession session) {
    Map<String, Object> res = new java.util.HashMap<>();

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) {
      res.put("success", false);
      res.put("message", "LOGIN_REQUIRED");
      return res;
    }

    IssueVO tmp = new IssueVO();
    tmp.setIssueCode(issueCode);
    IssueVO issue = issueService.findByIssueCode(tmp);
    if (issue == null) {
      res.put("success", false);
      res.put("message", "NOT_FOUND");
      return res;
    }

    var auth = authorityService.getProjectAuth(user.getUserCode(), issue.getProjectCode());
    boolean isAdmin = auth != null && "Y".equalsIgnoreCase(auth.getAdminCk());
    if (!isAdmin) {
      res.put("success", false);
      res.put("message", "권한이 없습니다.");
      return res;
    }

    return issueService.approveIssue(issueCode, user.getUserCode());
  }

  // 반려
  @ResponseBody
  @PostMapping("/api/issues/{issueCode}/reject")
  public Map<String, Object> reject(@PathVariable Long issueCode, @RequestParam String reason, HttpSession session) {
    Map<String, Object> res = new java.util.HashMap<>();

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) {
      res.put("success", false);
      res.put("message", "LOGIN_REQUIRED");
      return res;
    }

    IssueVO tmp = new IssueVO();
    tmp.setIssueCode(issueCode);
    IssueVO issue = issueService.findByIssueCode(tmp);
    if (issue == null) {
      res.put("success", false);
      res.put("message", "NOT_FOUND");
      return res;
    }

    var auth = authorityService.getProjectAuth(user.getUserCode(), issue.getProjectCode());
    boolean isAdmin = auth != null && "Y".equalsIgnoreCase(auth.getAdminCk());
    if (!isAdmin) {
      res.put("success", false);
      res.put("message", "권한이 없습니다.");
      return res;
    }

    return issueService.rejectIssue(issueCode, user.getUserCode(), reason);
  }

  // 반려이력 조회
  @ResponseBody
  @GetMapping("/api/issues/{issueCode}/reject-history")
  public Map<String, Object> rejectHistory(@PathVariable Long issueCode, HttpSession session) {
    Map<String, Object> res = new java.util.HashMap<>();

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) {
      res.put("success", false);
      res.put("message", "LOGIN_REQUIRED");
      return res;
    }

    IssueVO tmp = new IssueVO();
    tmp.setIssueCode(issueCode);
    IssueVO issue = issueService.findByIssueCode(tmp);
    if (issue == null) {
      res.put("success", false);
      res.put("message", "NOT_FOUND");
      return res;
    }

    var auth = authorityService.getProjectAuth(user.getUserCode(), issue.getProjectCode());
    boolean isAdmin = auth != null && "Y".equalsIgnoreCase(auth.getAdminCk());
    if (!isAdmin) {
      res.put("success", false);
      res.put("message", "권한이 없습니다.");
      return res;
    }

    res.put("success", true);
    res.put("data", issueService.findRejectHistory(issueCode));
    return res;
  }
  
  // 해결 + 첨부
  @ResponseBody
  @PostMapping(value = "/api/issues/{issueCode}/resolve", consumes = "multipart/form-data")
  public Map<String, Object> resolve(
      @PathVariable Long issueCode,
      @RequestParam("uploadFile") MultipartFile uploadFile,
      HttpSession session
  ) {
    Map<String, Object> res = new java.util.HashMap<>();

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) {
      res.put("success", false);
      res.put("message", "LOGIN_REQUIRED");
      return res;
    }

    IssueVO tmp = new IssueVO();
    tmp.setIssueCode(issueCode);
    IssueVO issue = issueService.findByIssueCode(tmp);
    if (issue == null) {
      res.put("success", false);
      res.put("message", "NOT_FOUND");
      return res;
    }

    boolean canModify = authorityService.canModify(issue.getProjectCode(), user.getUserCode(), "일감");
    if (!canModify) {
      res.put("success", false);
      res.put("message", "권한이 없습니다.");
      return res;
    }

    return issueService.resolveIssue(issueCode, user.getUserCode(), uploadFile);
  }
}
