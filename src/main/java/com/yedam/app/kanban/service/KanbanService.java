package com.yedam.app.kanban.service;

import java.util.List;
import java.util.Map;

import com.yedam.app.issue.service.IssueVO;
import com.yedam.app.kanban.web.dto.KanbanMoveRequest;

public interface KanbanService {

  Map<String, List<IssueVO>> getBoardColumns(Integer userCode,
                                             Long projectCode,
                                             String viewScope,
                                             String sysCk,
                                             List<Long> allProjectCodes,
                                             List<Long> adminProjectCodes,
                                             List<Long> readableProjectCodes);

  void moveCard(Integer userCode, KanbanMoveRequest req);

  void updateProgress(Integer userCode, Long projectCode, Long issueCode, Integer progress);

  IssueVO getIssue(Integer userCode,
                   Long projectCode,
                   Long issueCode,
                   String sysCk,
                   List<Long> allProjectCodes,
                   List<Long> adminProjectCodes,
                   List<Long> readableProjectCodes);
}