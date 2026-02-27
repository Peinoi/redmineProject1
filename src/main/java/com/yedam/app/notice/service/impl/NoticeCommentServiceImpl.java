package com.yedam.app.notice.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yedam.app.authority.AuthorityVO;
import com.yedam.app.authority.service.AuthorityService;
import com.yedam.app.notice.mapper.NoticeCommentMapper;
import com.yedam.app.notice.service.NoticeCommentService;
import com.yedam.app.notice.service.NoticeCommentVO;
import com.yedam.app.notice.service.NoticeService;
import com.yedam.app.notice.service.NoticeVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoticeCommentServiceImpl implements NoticeCommentService {

  private final NoticeCommentMapper noticeCommentMapper;
  private final NoticeService noticeService;
  private final AuthorityService authorityService;

  @Override
  public List<NoticeCommentVO> getCommentList(Long noticeCode,
                                             String sysCk,
                                             List<Long> allProjectCodes,
                                             List<Long> adminProjectCodes,
                                             List<Long> readableProjectCodes) {

    if (noticeCode == null) return List.of();

    if ("Y".equals(sysCk)) {
      if (allProjectCodes == null || allProjectCodes.isEmpty()) return List.of();
    } else {
      boolean noAdmin = (adminProjectCodes == null || adminProjectCodes.isEmpty());
      boolean noRead = (readableProjectCodes == null || readableProjectCodes.isEmpty());
      if (noAdmin && noRead) return List.of();
    }

    return noticeCommentMapper.selectCommentList(
        noticeCode,
        sysCk,
        allProjectCodes,
        adminProjectCodes,
        readableProjectCodes
    );
  }

  @Transactional
  @Override
  public NoticeCommentVO createComment(Long noticeCode,
                                      Integer userCode,
                                      String content,
                                      String sysCk,
                                      List<Long> allProjectCodes,
                                      List<Long> adminProjectCodes,
                                      List<Long> readableProjectCodes) {

    if (noticeCode == null) throw new IllegalArgumentException("NOT_FOUND");

    NoticeVO notice = noticeService.getNoticeInfo(
        noticeCode,
        sysCk,
        allProjectCodes,
        adminProjectCodes,
        readableProjectCodes
    );
    if (notice == null) throw new IllegalArgumentException("NOT_FOUND");

    Long projectCode = notice.getProjectCode();

    boolean canWrite = authorityService.canWrite(projectCode, userCode, "댓글");
    if (!canWrite) throw new SecurityException("NO_PERMISSION");

    NoticeCommentVO c = new NoticeCommentVO();
    c.setNoticeCode(noticeCode);
    c.setUserCode(userCode);
    c.setContent(content);

    noticeCommentMapper.insertComment(c);

    return noticeCommentMapper.selectCommentOne(
        c.getCommentCode(),
        sysCk,
        allProjectCodes,
        adminProjectCodes,
        readableProjectCodes
    );
  }

  @Transactional
  @Override
  public NoticeCommentVO modifyComment(Long commentCode,
                                      Integer userCode,
                                      String content,
                                      String sysCk,
                                      List<Long> allProjectCodes,
                                      List<Long> adminProjectCodes,
                                      List<Long> readableProjectCodes) {

    NoticeCommentVO origin = noticeCommentMapper.selectCommentOne(
        commentCode,
        sysCk,
        allProjectCodes,
        adminProjectCodes,
        readableProjectCodes
    );
    if (origin == null) throw new IllegalArgumentException("NOT_FOUND");
    if (origin.getIsDeleted() != null && origin.getIsDeleted() == 1) throw new IllegalArgumentException("ALREADY_DELETED");
    if (origin.getUserCode() == null || !origin.getUserCode().equals(userCode)) throw new SecurityException("NO_PERMISSION");

    NoticeVO notice = noticeService.getNoticeInfo(
        origin.getNoticeCode(),
        sysCk,
        allProjectCodes,
        adminProjectCodes,
        readableProjectCodes
    );
    if (notice == null) throw new IllegalArgumentException("NOT_FOUND");

    boolean canModify = authorityService.canModify(notice.getProjectCode(), userCode, "댓글");
    if (!canModify) throw new SecurityException("NO_PERMISSION");

    NoticeCommentVO upd = new NoticeCommentVO();
    upd.setCommentCode(commentCode);
    upd.setContent(content);

    noticeCommentMapper.updateComment(upd);

    return noticeCommentMapper.selectCommentOne(
        commentCode,
        sysCk,
        allProjectCodes,
        adminProjectCodes,
        readableProjectCodes
    );
  }

  @Transactional
  @Override
  public void deleteComment(Long commentCode,
                            Integer userCode,
                            String sysCk,
                            List<Long> allProjectCodes,
                            List<Long> adminProjectCodes,
                            List<Long> readableProjectCodes) {

    NoticeCommentVO origin = noticeCommentMapper.selectCommentOne(
        commentCode,
        sysCk,
        allProjectCodes,
        adminProjectCodes,
        readableProjectCodes
    );
    if (origin == null) throw new IllegalArgumentException("NOT_FOUND");
    if (origin.getIsDeleted() != null && origin.getIsDeleted() == 1) return;

    NoticeVO notice = noticeService.getNoticeInfo(
        origin.getNoticeCode(),
        sysCk,
        allProjectCodes,
        adminProjectCodes,
        readableProjectCodes
    );
    if (notice == null) throw new IllegalArgumentException("NOT_FOUND");

    Long projectCode = notice.getProjectCode();

    AuthorityVO auth = authorityService.getProjectAuth(userCode, projectCode);
    boolean isAdmin = (auth != null) && "Y".equalsIgnoreCase(auth.getAdminCk());
    boolean isOwner = origin.getUserCode() != null && origin.getUserCode().equals(userCode);
    if (!(isOwner || isAdmin)) throw new SecurityException("NO_PERMISSION");

    boolean canDelete = authorityService.canDelete(projectCode, userCode, "댓글");
    if (!canDelete) throw new SecurityException("NO_PERMISSION");

    noticeCommentMapper.softDeleteComment(commentCode, userCode);
  }
}