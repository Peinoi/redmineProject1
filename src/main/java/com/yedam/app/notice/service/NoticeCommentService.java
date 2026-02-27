package com.yedam.app.notice.service;

import java.util.List;

public interface NoticeCommentService {

  List<NoticeCommentVO> getCommentList(Long noticeCode,
                                       String sysCk,
                                       List<Long> allProjectCodes,
                                       List<Long> adminProjectCodes,
                                       List<Long> readableProjectCodes);

  NoticeCommentVO createComment(Long noticeCode,
                                Integer userCode,
                                String content,
                                String sysCk,
                                List<Long> allProjectCodes,
                                List<Long> adminProjectCodes,
                                List<Long> readableProjectCodes);

  NoticeCommentVO modifyComment(Long commentCode,
                                Integer userCode,
                                String content,
                                String sysCk,
                                List<Long> allProjectCodes,
                                List<Long> adminProjectCodes,
                                List<Long> readableProjectCodes);

  void deleteComment(Long commentCode,
                     Integer userCode,
                     String sysCk,
                     List<Long> allProjectCodes,
                     List<Long> adminProjectCodes,
                     List<Long> readableProjectCodes);
}