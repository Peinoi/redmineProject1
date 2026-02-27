package com.yedam.app.authority.web;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.yedam.app.authority.AuthorityVO;
import com.yedam.app.authority.service.AuthorityService;
import com.yedam.app.login.service.UserVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class AuthorityApiController {

  private final AuthorityService authorityService;

  @GetMapping("/api/authority/issue/canWrite")
  public Map<String, Object> canWriteIssue(@RequestParam("projectCode") Long projectCode,
                                          HttpSession session) {
    Map<String, Object> res = new HashMap<>();

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) {
      res.put("success", false);
      res.put("canWrite", false);
      res.put("message", "LOGIN_REQUIRED");
      return res;
    }

    Integer userCode = user.getUserCode();
    boolean canWrite = authorityService.canWrite(projectCode, userCode, "일감");

    res.put("success", true);
    res.put("canWrite", canWrite);
    return res;
  }
  
  @GetMapping("/api/authority/issue/canModify")
  public Map<String, Object> canModifyIssue(@RequestParam("projectCode") Long projectCode,
                                           HttpSession session) {
    Map<String, Object> res = new HashMap<>();

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) {
      res.put("success", false);
      res.put("canModify", false);
      res.put("message", "LOGIN_REQUIRED");
      return res;
    }

    Integer userCode = user.getUserCode();
    boolean canModify = authorityService.canModify(projectCode, userCode, "일감");

    res.put("success", true);
    res.put("canModify", canModify);
    return res;
  }

  
  @GetMapping("/api/authority/project/isAdmin")
  public Map<String, Object> isAdmin(@RequestParam("projectCode") Long projectCode,
                                    HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) {
      return Map.of("success", false, "isAdmin", false, "message", "LOGIN_REQUIRED");
    }

    Integer userCode = user.getUserCode().intValue();

    AuthorityVO auth = authorityService.getProjectAuth(userCode, projectCode);
    boolean isAdmin = (auth != null) && "Y".equalsIgnoreCase(auth.getAdminCk());

    return Map.of("success", true, "isAdmin", isAdmin);
  }
  
  @GetMapping("/api/authority/notice/canWrite")
  public Map<String, Object> canWriteNotice(@RequestParam("projectCode") Long projectCode,
                                           HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return Map.of("success", false, "canWrite", false, "message", "LOGIN_REQUIRED");

    boolean canWrite = authorityService.canWrite(projectCode, user.getUserCode(), "공지");
    return Map.of("success", true, "canWrite", canWrite);
  }

  @GetMapping("/api/authority/issue/menuPerms")
  public Map<String, Object> issueMenuPerms(@RequestParam("projectCode") Long projectCode,
                                           @RequestParam("issueCode") Long issueCode,
                                           HttpSession session) {

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) {
      return Map.of(
        "success", false,
        "canEdit", false,
        "canDelete", false,
        "message", "LOGIN_REQUIRED"
      );
    }

    Integer userCode = user.getUserCode();

    // 관리자 여부
    AuthorityVO auth = authorityService.getProjectAuth(userCode, projectCode);
    boolean isAdmin = (auth != null) && "Y".equalsIgnoreCase(auth.getAdminCk());

    // 등록자/담당자 여부
    boolean isCreatorOrAssignee =
        authorityService.isIssueCreatorOrAssignee(issueCode, userCode);

    // 역할 권한
    boolean hasModifyRole = authorityService.canModify(projectCode, userCode, "일감");
    boolean hasDeleteRole = authorityService.canDelete(projectCode, userCode, "일감");

    // 수정 가능: 관리자 OR (수정권한 && (등록자 or 담당자))
    boolean canEdit = isAdmin || (hasModifyRole && isCreatorOrAssignee);

    // 삭제 가능: 관리자 OR (삭제권한 && (등록자 or 담당자))
    boolean canDelete = isAdmin || (hasDeleteRole && isCreatorOrAssignee);

    return Map.of(
      "success", true,
      "canEdit", canEdit,
      "canDelete", canDelete,
      "isAdmin", isAdmin,
      "hasModifyRole", hasModifyRole,
      "hasDeleteRole", hasDeleteRole,
      "isCreatorOrAssignee", isCreatorOrAssignee
    );
  }

  
  @GetMapping("/api/authority/worklog/menuPerms")
  public Map<String, Object> worklogMenuPerms(@RequestParam("projectCode") Long projectCode,
                                              @RequestParam("workLogCode") Long workLogCode,
                                              HttpSession session) {

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) {
      return Map.of(
        "success", false,
        "canEdit", false,
        "canDelete", false,
        "message", "LOGIN_REQUIRED"
      );
    }

    Integer userCode = user.getUserCode();

    //관리자 여부
    AuthorityVO auth = authorityService.getProjectAuth(userCode, projectCode);
    boolean isAdmin = (auth != null) && "Y".equalsIgnoreCase(auth.getAdminCk());

    // 담당자 여부
    boolean isAssignee = authorityService.isWorklogIssueAssignee(workLogCode, userCode);

    // 담당자 OR 관리자
    boolean canEdit = isAdmin || isAssignee;
    boolean canDelete = isAdmin || isAssignee;

    return Map.of(
      "success", true,
      "canEdit", canEdit,
      "canDelete", canDelete,
      "isAdmin", isAdmin,
      "isAssignee", isAssignee
    );
  }
  
  @ResponseBody
  @GetMapping("/api/authority/worklog/canCreate")
  public Map<String, Object> canCreateWorklog(
      @RequestParam("projectCode") Long projectCode,
      HttpSession session
  ) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) {
      return Map.of("success", false, "canCreate", false, "message", "로그인 정보가 없습니다.");
    }

    Integer userCode = user.getUserCode().intValue();

    boolean canCreate = authorityService.canModify(projectCode, userCode, "소요시간");

    return Map.of(
        "success", true,
        "canCreate", canCreate
    );
  }
}
