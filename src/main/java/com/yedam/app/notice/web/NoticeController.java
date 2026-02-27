package com.yedam.app.notice.web;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.yedam.app.attach.service.AttachmentService;
import com.yedam.app.authority.AuthorityVO;
import com.yedam.app.authority.service.AuthorityService;
import com.yedam.app.login.service.UserVO;
import com.yedam.app.notice.service.NoticeCommentService;
import com.yedam.app.notice.service.NoticeCommentVO;
import com.yedam.app.notice.service.NoticeService;
import com.yedam.app.notice.service.NoticeVO;
import com.yedam.app.project.service.UserProjectAuthVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class NoticeController {

  private final NoticeService noticeService;
  private final AuthorityService authorityService;
  private final NoticeCommentService noticeCommentService;
  private final AttachmentService attachmentService;

  private static class SessionNoticeAuth {
    private final String sysCk;
    private final List<Long> allProjectCodes;
    private final List<Long> adminProjectCodes;
    private final List<Long> readableProjectCodes;

    public SessionNoticeAuth(String sysCk,
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

  private SessionNoticeAuth buildSessionNoticeAuth(HttpSession session) {
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

        // 참여 프로젝트 전체
        allProjectSet.add(code);

        // 관리자 프로젝트
        if (auth.getAdmin() != null && auth.getAdmin() == 1) {
          adminProjectSet.add(code);
        }

        // 공지 읽기 가능한 프로젝트
        if ("공지".equals(auth.getCategory()) && "Y".equals(auth.getRdRol())) {
          readableProjectSet.add(code);
        }
      }
    }

    readableProjectSet.removeAll(adminProjectSet);

    return new SessionNoticeAuth(
        sysCk,
        new ArrayList<>(allProjectSet),
        new ArrayList<>(adminProjectSet),
        new ArrayList<>(readableProjectSet)
    );
  }
  
  private SessionNoticeAuth buildSessionCommentAuth(HttpSession session) {
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

	      // 댓글 읽기 권한
	      if ("댓글".equals(auth.getCategory()) && "Y".equals(auth.getRdRol())) {
	        readableProjectSet.add(code);
	      }
	    }
	  }

	  readableProjectSet.removeAll(adminProjectSet);

	  return new SessionNoticeAuth(
	      sysCk,
	      new ArrayList<>(allProjectSet),
	      new ArrayList<>(adminProjectSet),
	      new ArrayList<>(readableProjectSet)
	  );
	}

  @GetMapping("/noticeList")
  public String noticeList(NoticeVO cond, Model model, HttpSession session) {
    UserVO loginUser = (UserVO) session.getAttribute("user");
    if (loginUser == null) return "redirect:/login";

    Integer loginUserCode = loginUser.getUserCode();

    SessionNoticeAuth auth = buildSessionNoticeAuth(session);

    if (cond.getProjectCode() != null) {
      boolean allowed;

      if ("Y".equals(auth.getSysCk())) {
        allowed = auth.getAllProjectCodes().contains(cond.getProjectCode());
      } else {
        allowed = auth.getAdminProjectCodes().contains(cond.getProjectCode())
            || auth.getReadableProjectCodes().contains(cond.getProjectCode());
      }

      if (!allowed) {
        model.addAttribute("list", List.of());
        model.addAttribute("projectCode", cond.getProjectCode());
        model.addAttribute("projectName", "");
        model.addAttribute("creatorName", "");
        model.addAttribute("showCreateBtn", authorityService.hasAnyAdminProject(loginUserCode));
        model.addAttribute("errorMessage", "해당 프로젝트 조회 권한이 없습니다.");
        return "notice/list";
      }
    }

    List<NoticeVO> list = noticeService.getNoticeList(
        cond,
        auth.getSysCk(),
        auth.getAllProjectCodes(),
        auth.getAdminProjectCodes(),
        auth.getReadableProjectCodes()
    );

    boolean showCreateBtn = authorityService.hasAnyAdminProject(loginUserCode);
    model.addAttribute("showCreateBtn", showCreateBtn);

    model.addAttribute("list", list);
    model.addAttribute("projectCode", cond.getProjectCode());
    model.addAttribute("projectName", "");
    model.addAttribute("creatorName", "");

    return "notice/list";
  }

  @GetMapping("/noticeCreate")
  public String noticeCreateForm(Model model, HttpSession session,
                                 @RequestParam(value = "projectCode", required = false) Long projectCode) {
    UserVO loginUser = (UserVO) session.getAttribute("user");
    if (loginUser == null) return "redirect:/login";

    NoticeVO notice = new NoticeVO();
    notice.setProjectCode(projectCode);

    Integer loginUserCode = loginUser.getUserCode();

    boolean canWrite = (projectCode != null) && authorityService.canWrite(projectCode, loginUserCode, "공지");

    model.addAttribute("notice", notice);
    model.addAttribute("canWrite", canWrite);
    model.addAttribute("projectName", "");

    return "notice/create";
  }

  @PostMapping("/noticeCreate")
  public String noticeCreate(NoticeVO notice,
                             @RequestParam(value = "uploadFile", required = false) MultipartFile uploadFile,
                             HttpSession session,
                             Model model) {
    UserVO loginUser = (UserVO) session.getAttribute("user");
    if (loginUser == null) return "redirect:/login";

    Integer loginUserCode = loginUser.getUserCode();
    Long projectCode = notice.getProjectCode();

    boolean canWrite = authorityService.canWrite(projectCode, loginUserCode, "공지");
    if (!canWrite) {
      model.addAttribute("errorMessage", "권한이 없습니다.");
      model.addAttribute("notice", notice);
      model.addAttribute("canWrite", false);
      model.addAttribute("projectName", "");
      return "notice/create";
    }

    notice.setUserCode(loginUser.getUserCode());

    Long fileCode = attachmentService.saveSingleFile("NOTICE", loginUserCode, uploadFile);
    notice.setFileCode(fileCode);

    Long noticeCode = noticeService.createNotice(notice);
    return "redirect:/noticeInfo?noticeCode=" + noticeCode;
  }

  @GetMapping("/noticeInfo")
  public String noticeInfo(@RequestParam("noticeCode") Long noticeCode,
                           Model model,
                           HttpSession session) {

    UserVO loginUser = (UserVO) session.getAttribute("user");
    if (loginUser == null) return "redirect:/login";

    Integer loginUserCode = loginUser.getUserCode();

    // 공지 본문 권한
    SessionNoticeAuth noticeAuth = buildSessionNoticeAuth(session);

    // 댓글 권한
    SessionNoticeAuth commentAuth = buildSessionCommentAuth(session);

    NoticeVO notice = noticeService.getNoticeInfo(
        noticeCode,
        noticeAuth.getSysCk(),
        noticeAuth.getAllProjectCodes(),
        noticeAuth.getAdminProjectCodes(),
        noticeAuth.getReadableProjectCodes()
    );

    if (notice == null) {
      return "redirect:/noticeList";
    }

    Long projectCode = notice.getProjectCode();

    AuthorityVO authVo = authorityService.getProjectAuth(loginUserCode, projectCode);
    boolean isAdmin = (authVo != null) && "Y".equalsIgnoreCase(authVo.getAdminCk());

    boolean isOwner = (notice.getUserCode() != null) && notice.getUserCode().equals(loginUserCode);

    boolean showManageButtons = isOwner || isAdmin;

    boolean canModify = authorityService.canModify(projectCode, loginUserCode, "공지");
    boolean canDelete = authorityService.canDelete(projectCode, loginUserCode, "공지");

    model.addAttribute("notice", notice);
    model.addAttribute("showManageButtons", showManageButtons);
    model.addAttribute("canModify", canModify);
    model.addAttribute("canDelete", canDelete);

    boolean canWriteComment  = authorityService.canWrite(projectCode, loginUserCode, "댓글");
    boolean canModifyComment = authorityService.canModify(projectCode, loginUserCode, "댓글");
    boolean canDeleteComment = authorityService.canDelete(projectCode, loginUserCode, "댓글");

    model.addAttribute("canWriteComment", canWriteComment);
    model.addAttribute("canModifyComment", canModifyComment);
    model.addAttribute("canDeleteComment", canDeleteComment);
    model.addAttribute("loginUserCode", loginUserCode);
    model.addAttribute("isAdmin", isAdmin);

    // 댓글 읽기 가능 여부
    boolean canReadComment;
    if ("Y".equals(commentAuth.getSysCk())) {
      canReadComment = commentAuth.getAllProjectCodes().contains(projectCode);
    } else {
      canReadComment = commentAuth.getAdminProjectCodes().contains(projectCode)
          || commentAuth.getReadableProjectCodes().contains(projectCode);
    }

    model.addAttribute("canReadComment", canReadComment);

    List<NoticeCommentVO> comments = List.of();
    if (canReadComment) {
      comments = noticeCommentService.getCommentList(
          noticeCode,
          commentAuth.getSysCk(),
          commentAuth.getAllProjectCodes(),
          commentAuth.getAdminProjectCodes(),
          commentAuth.getReadableProjectCodes()
      );
    }

    model.addAttribute("comments", comments);

    return "notice/info";
  }

  @GetMapping("/noticeEdit")
  public String noticeEditForm(@RequestParam("noticeCode") Long noticeCode,
                               Model model,
                               HttpSession session) {
    UserVO loginUser = (UserVO) session.getAttribute("user");
    if (loginUser == null) return "redirect:/login";

    Integer loginUserCode = loginUser.getUserCode();

    SessionNoticeAuth auth = buildSessionNoticeAuth(session);

    NoticeVO notice = noticeService.getNoticeInfo(
        noticeCode,
        auth.getSysCk(),
        auth.getAllProjectCodes(),
        auth.getAdminProjectCodes(),
        auth.getReadableProjectCodes()
    );

    if (notice == null) return "redirect:/noticeList";

    Long projectCode = notice.getProjectCode();

    AuthorityVO authVo = authorityService.getProjectAuth(loginUserCode, projectCode);
    boolean isAdmin = (authVo != null) && "Y".equalsIgnoreCase(authVo.getAdminCk());
    boolean isOwner = (notice.getUserCode() != null) && notice.getUserCode().equals(loginUserCode);

    boolean showManageButtons = isOwner || isAdmin;
    if (!showManageButtons) {
      return "redirect:/noticeInfo?noticeCode=" + noticeCode;
    }

    boolean canModify = authorityService.canModify(projectCode, loginUserCode, "공지");

    model.addAttribute("notice", notice);
    model.addAttribute("projectName", notice.getProjectName());
    model.addAttribute("canModify", canModify);

    return "notice/edit";
  }

  @PostMapping("/noticeEdit")
  public String noticeEdit(
      NoticeVO notice,
      @RequestParam(value = "uploadFile", required = false) MultipartFile uploadFile,
      @RequestParam(value = "removeFile", required = false) Boolean removeFile,
      HttpSession session,
      Model model
  ) {
    UserVO loginUser = (UserVO) session.getAttribute("user");
    if (loginUser == null) return "redirect:/login";

    Integer loginUserCode = loginUser.getUserCode();

    SessionNoticeAuth auth = buildSessionNoticeAuth(session);

    NoticeVO origin = noticeService.getNoticeInfo(
        notice.getNoticeCode(),
        auth.getSysCk(),
        auth.getAllProjectCodes(),
        auth.getAdminProjectCodes(),
        auth.getReadableProjectCodes()
    );

    if (origin == null) return "redirect:/noticeList";

    Long projectCode = origin.getProjectCode();

    AuthorityVO authVo = authorityService.getProjectAuth(loginUserCode, projectCode);
    boolean isAdmin = (authVo != null) && "Y".equalsIgnoreCase(authVo.getAdminCk());
    boolean isOwner = (origin.getUserCode() != null) && origin.getUserCode().equals(loginUserCode);

    boolean canModify = authorityService.canModify(projectCode, loginUserCode, "공지");
    if (!(isOwner || isAdmin) || !canModify) {
      model.addAttribute("errorMessage", "권한이 없습니다.");
      model.addAttribute("notice", origin);
      model.addAttribute("projectName", origin.getProjectName());
      model.addAttribute("canModify", false);
      return "notice/edit";
    }

    notice.setProjectCode(origin.getProjectCode());
    notice.setUserCode(origin.getUserCode());

    Long oldFileCode = origin.getFileCode();
    boolean wantRemove = Boolean.TRUE.equals(removeFile);

    if (wantRemove) {
      notice.setFileCode(null);

      noticeService.updateNotice(notice);

      if (oldFileCode != null) {
        attachmentService.deleteSingleFile(oldFileCode);
      }

      return "redirect:/noticeInfo?noticeCode=" + notice.getNoticeCode();
    }

    if (uploadFile != null && !uploadFile.isEmpty()) {
      Long newFileCode = attachmentService.saveSingleFile("NOTICE", loginUserCode, uploadFile);
      notice.setFileCode(newFileCode);

      noticeService.updateNotice(notice);

      if (oldFileCode != null) {
        attachmentService.deleteSingleFile(oldFileCode);
      }

      return "redirect:/noticeInfo?noticeCode=" + notice.getNoticeCode();
    }

    notice.setFileCode(oldFileCode);
    noticeService.updateNotice(notice);

    return "redirect:/noticeInfo?noticeCode=" + notice.getNoticeCode();
  }

  @PostMapping("/noticeDelete")
  @ResponseBody
  public Map<String, Object> noticeDelete(@RequestParam("noticeCode") Long noticeCode,
                                          HttpSession session) {
    UserVO loginUser = (UserVO) session.getAttribute("user");
    if (loginUser == null) {
      return Map.of("success", false, "message", "LOGIN_REQUIRED");
    }

    Integer userCode = loginUser.getUserCode();

    SessionNoticeAuth auth = buildSessionNoticeAuth(session);

    NoticeVO notice = noticeService.getNoticeInfo(
        noticeCode,
        auth.getSysCk(),
        auth.getAllProjectCodes(),
        auth.getAdminProjectCodes(),
        auth.getReadableProjectCodes()
    );

    if (notice == null) {
      return Map.of("success", false, "message", "NOT_FOUND");
    }

    Long projectCode = notice.getProjectCode();

    AuthorityVO authVo = authorityService.getProjectAuth(userCode, projectCode);
    boolean isAdmin = (authVo != null) && "Y".equalsIgnoreCase(authVo.getAdminCk());

    boolean isOwner = (notice.getUserCode() != null) && notice.getUserCode().equals(userCode);

    boolean canDelete = authorityService.canDelete(projectCode, userCode, "공지");

    if (!(isOwner || isAdmin)) {
      return Map.of("success", false, "message", "NO_PERMISSION");
    }
    if (!canDelete) {
      return Map.of("success", false, "message", "NO_PERMISSION");
    }

    noticeService.deleteNotice(noticeCode);
    return Map.of("success", true);
  }
}