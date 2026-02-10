package com.yedam.app.kanban.service;

import java.util.List;
import java.util.Map;

import com.yedam.app.issue.service.IssueVO;
import com.yedam.app.kanban.web.dto.KanbanMoveRequest;

public interface KanbanService {
	 Map<String, List<IssueVO>> getBoardColumnsByProject(Long projectCode);
	  Map<String, List<IssueVO>> getBoardColumnsByUser(Long loginUserCode);

	  void moveCard(Long loginUserCode, KanbanMoveRequest req);
}
