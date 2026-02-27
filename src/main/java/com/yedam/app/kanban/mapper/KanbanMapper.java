package com.yedam.app.kanban.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.issue.service.IssueVO;
import com.yedam.app.kanban.web.dto.IssuePosUpdate;

public interface KanbanMapper {

  List<IssueVO> selectKanbanIssuesByScope(
      @Param("userCode") Integer userCode,
      @Param("viewScope") String viewScope,
      @Param("projectCode") Long projectCode,
      @Param("sysCk") String sysCk,
      @Param("allProjectCodes") List<Long> allProjectCodes,
      @Param("adminProjectCodes") List<Long> adminProjectCodes,
      @Param("readableProjectCodes") List<Long> readableProjectCodes
  );

  int updateIssueStatusAndPosition(
      @Param("projectCode") Long projectCode,
      @Param("issueCode") Long issueCode,
      @Param("fromStatusCode") String fromStatusCode,
      @Param("toStatusCode") String toStatusCode,
      @Param("position") Integer position
  );

  int batchUpdatePositions(@Param("list") List<IssuePosUpdate> list);

  int updateIssueProgress(
      @Param("projectCode") Long projectCode,
      @Param("issueCode") Long issueCode,
      @Param("progress") Integer progress
  );

  IssueVO selectIssueForAuth(@Param("userCode") Integer userCode,
                             @Param("projectCode") Long projectCode,
                             @Param("issueCode") Long issueCode,
                             @Param("sysCk") String sysCk,
                             @Param("allProjectCodes") List<Long> allProjectCodes,
                             @Param("adminProjectCodes") List<Long> adminProjectCodes,
                             @Param("readableProjectCodes") List<Long> readableProjectCodes);
}