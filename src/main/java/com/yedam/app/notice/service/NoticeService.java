package com.yedam.app.notice.service;

import java.util.List;

public interface NoticeService {

  List<NoticeVO> getNoticeList(NoticeVO cond,
                               String sysCk,
                               List<Long> allProjectCodes,
                               List<Long> adminProjectCodes,
                               List<Long> readableProjectCodes);

  NoticeVO getNoticeInfo(Long noticeCode,
                         String sysCk,
                         List<Long> allProjectCodes,
                         List<Long> adminProjectCodes,
                         List<Long> readableProjectCodes);

  Long createNotice(NoticeVO notice);

  Long updateNotice(NoticeVO notice);

  int deleteNotice(Long noticeCode);
}