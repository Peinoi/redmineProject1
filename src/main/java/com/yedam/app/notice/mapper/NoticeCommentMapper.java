package com.yedam.app.notice.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.notice.service.NoticeCommentVO;

public interface NoticeCommentMapper {

  List<NoticeCommentVO> selectCommentList(@Param("noticeCode") Long noticeCode,
                                         @Param("sysCk") String sysCk,
                                         @Param("allProjectCodes") List<Long> allProjectCodes,
                                         @Param("adminProjectCodes") List<Long> adminProjectCodes,
                                         @Param("readableProjectCodes") List<Long> readableProjectCodes);

  NoticeCommentVO selectCommentOne(@Param("commentCode") Long commentCode,
                                  @Param("sysCk") String sysCk,
                                  @Param("allProjectCodes") List<Long> allProjectCodes,
                                  @Param("adminProjectCodes") List<Long> adminProjectCodes,
                                  @Param("readableProjectCodes") List<Long> readableProjectCodes);

  int insertComment(NoticeCommentVO c);

  int updateComment(NoticeCommentVO c);

  int softDeleteComment(@Param("commentCode") Long commentCode,
                        @Param("deletedByCode") Integer deletedByCode);
}