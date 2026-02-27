package com.yedam.app.notice.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.notice.service.NoticeVO;

public interface NoticeMapper {

  // 목록
  List<NoticeVO> selectNoticeList(@Param("cond") NoticeVO cond,
                                  @Param("sysCk") String sysCk,
                                  @Param("allProjectCodes") List<Long> allProjectCodes,
                                  @Param("adminProjectCodes") List<Long> adminProjectCodes,
                                  @Param("readableProjectCodes") List<Long> readableProjectCodes);

  // 상세
  NoticeVO selectNoticeInfo(@Param("noticeCode") Long noticeCode,
                            @Param("sysCk") String sysCk,
                            @Param("allProjectCodes") List<Long> allProjectCodes,
                            @Param("adminProjectCodes") List<Long> adminProjectCodes,
                            @Param("readableProjectCodes") List<Long> readableProjectCodes);

  // 등록
  int insertNotice(NoticeVO notice);

  // 수정
  int updateNotice(NoticeVO notice);

  // 삭제
  int deleteNotice(@Param("noticeCode") Long noticeCode);

  // before/after 비교
  NoticeVO selectNoticeByCode(@Param("noticeCode") Long noticeCode);
}