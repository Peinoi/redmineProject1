package com.yedam.app.notice.web;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.web.bind.annotation.*;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.notice.service.NoticeCommentService;
import com.yedam.app.notice.service.NoticeCommentVO;
import com.yedam.app.project.service.UserProjectAuthVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class NoticeCommentApiController {

  private final NoticeCommentService noticeCommentService;

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

    public String getSysCk() { return sysCk; }
    public List<Long> getAllProjectCodes() { return allProjectCodes; }
    public List<Long> getAdminProjectCodes() { return adminProjectCodes; }
    public List<Long> getReadableProjectCodes() { return readableProjectCodes; }
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
        allProjectSet.add(code);

        if (auth.getAdmin() != null && auth.getAdmin() == 1) {
          adminProjectSet.add(code);
        }

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

  @GetMapping("/api/notice/{noticeCode}/comments")
  public Map<String, Object> list(@PathVariable("noticeCode") Long noticeCode, HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return Map.of("success", false, "message", "LOGIN_REQUIRED");

    SessionNoticeAuth auth = buildSessionNoticeAuth(session);

    List<NoticeCommentVO> list = noticeCommentService.getCommentList(
        noticeCode,
        auth.getSysCk(),
        auth.getAllProjectCodes(),
        auth.getAdminProjectCodes(),
        auth.getReadableProjectCodes()
    );

    return Map.of("success", true, "comments", list);
  }

  public static class CommentCreateReq {
    public String content;
  }

  @PostMapping("/api/notice/{noticeCode}/comments")
  public Map<String, Object> create(@PathVariable("noticeCode") Long noticeCode,
                                    @RequestBody CommentCreateReq req,
                                    HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return Map.of("success", false, "message", "LOGIN_REQUIRED");

    String content = (req == null || req.content == null) ? "" : req.content.trim();
    if (content.isEmpty()) return Map.of("success", false, "message", "EMPTY_CONTENT");
    if (content.length() > 500) return Map.of("success", false, "message", "TOO_LONG");

    SessionNoticeAuth auth = buildSessionNoticeAuth(session);

    try {
      NoticeCommentVO saved = noticeCommentService.createComment(
          noticeCode,
          user.getUserCode(),
          content,
          auth.getSysCk(),
          auth.getAllProjectCodes(),
          auth.getAdminProjectCodes(),
          auth.getReadableProjectCodes()
      );

      return Map.of("success", true, "comment", toClientComment(saved));
    } catch (SecurityException se) {
      return Map.of("success", false, "message", "NO_PERMISSION");
    } catch (IllegalArgumentException ie) {
      return Map.of("success", false, "message", ie.getMessage());
    }
  }

  public static class CommentUpdateReq {
    public String content;
  }

  @PutMapping("/api/notice/comments/{commentCode}")
  public Map<String, Object> update(@PathVariable("commentCode") Long commentCode,
                                    @RequestBody CommentUpdateReq req,
                                    HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return Map.of("success", false, "message", "LOGIN_REQUIRED");

    String content = (req == null || req.content == null) ? "" : req.content.trim();
    if (content.isEmpty()) return Map.of("success", false, "message", "EMPTY_CONTENT");
    if (content.length() > 500) return Map.of("success", false, "message", "TOO_LONG");

    SessionNoticeAuth auth = buildSessionNoticeAuth(session);

    try {
      NoticeCommentVO updated = noticeCommentService.modifyComment(
          commentCode,
          user.getUserCode(),
          content,
          auth.getSysCk(),
          auth.getAllProjectCodes(),
          auth.getAdminProjectCodes(),
          auth.getReadableProjectCodes()
      );

      return Map.of("success", true, "comment", toClientComment(updated));
    } catch (SecurityException se) {
      return Map.of("success", false, "message", "NO_PERMISSION");
    } catch (IllegalArgumentException ie) {
      return Map.of("success", false, "message", ie.getMessage());
    }
  }

  @DeleteMapping("/api/notice/comments/{commentCode}")
  public Map<String, Object> delete(@PathVariable("commentCode") Long commentCode, HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return Map.of("success", false, "message", "LOGIN_REQUIRED");

    SessionNoticeAuth auth = buildSessionNoticeAuth(session);

    try {
      noticeCommentService.deleteComment(
          commentCode,
          user.getUserCode(),
          auth.getSysCk(),
          auth.getAllProjectCodes(),
          auth.getAdminProjectCodes(),
          auth.getReadableProjectCodes()
      );
      return Map.of("success", true);
    } catch (SecurityException se) {
      return Map.of("success", false, "message", "NO_PERMISSION");
    } catch (IllegalArgumentException ie) {
      return Map.of("success", false, "message", ie.getMessage());
    }
  }

  private Map<String, Object> toClientComment(NoticeCommentVO c) {
    Map<String, Object> m = new HashMap<>();
    m.put("commentCode", c.getCommentCode());
    m.put("noticeCode", c.getNoticeCode());
    m.put("userCode", c.getUserCode());
    m.put("userName", c.getUserName());
    m.put("content", c.getContent());
    m.put("isDeleted", c.getIsDeleted());

    String createdAtText = "";
    if (c.getCreatedAt() != null) {
      createdAtText = c.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
    m.put("createdAtText", createdAtText);

    return m;
  }
}