package com.yedam.app.kanban.service.impl;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yedam.app.issue.service.IssueVO;
import com.yedam.app.kanban.mapper.KanbanMapper;
import com.yedam.app.kanban.service.KanbanService;
import com.yedam.app.kanban.web.dto.IssuePosUpdate;
import com.yedam.app.kanban.web.dto.KanbanMoveRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class KanbanServiceImpl implements KanbanService {

  private final KanbanMapper kanbanMapper;

  @Override
  public Map<String, List<IssueVO>> getBoardColumnsByProject(Long projectCode) {
    List<IssueVO> list = kanbanMapper.selectKanbanIssuesByProject(projectCode);
    return groupByStatus(list);
  }

  @Override
  public Map<String, List<IssueVO>> getBoardColumnsByUser(Long loginUserCode) {
    List<IssueVO> list = kanbanMapper.selectKanbanIssuesByUser(loginUserCode);
    return groupByStatus(list);
  }

  private Map<String, List<IssueVO>> groupByStatus(List<IssueVO> list) {
    Map<String, List<IssueVO>> cols = new LinkedHashMap<>();
    cols.put("OB1", new ArrayList<>());
    cols.put("OB2", new ArrayList<>());
    cols.put("OB3", new ArrayList<>());
    cols.put("OB4", new ArrayList<>());
    cols.put("OB5", new ArrayList<>());

    if (list == null) return cols;

    for (IssueVO it : list) {
      String s = it.getStatusId();
      if (s == null) continue;
      cols.computeIfAbsent(s, k -> new ArrayList<>()).add(it);
    }
    return cols;
  }

  @Transactional
  @Override
  public void moveCard(Long loginUserCode, KanbanMoveRequest req) {
    if (req == null || req.getIssueCode() == null || req.getToStatusId() == null) {
      throw new IllegalArgumentException("invalid request");
    }

    // TODO: 서버 권한 체크 강력 추천
    // move는 프로젝트 권한이 다를 수 있어서
    // issueCode로 projectCode 조회 후 canWrite 검사하는 방식이 안전함

    boolean hasOrders = req.getToOrder() != null && !req.getToOrder().isEmpty();

    if (hasOrders) {
      int tmpPos = (req.getToIndex() == null ? 9999 : req.getToIndex() + 1);

      // 상태를 먼저 바꿔두고
      kanbanMapper.updateIssueStatusAndPosition(req.getIssueCode(), req.getToStatusId(), tmpPos);

      // from/to 컬럼을 1..N으로 재정렬 저장
      List<IssuePosUpdate> updates = new ArrayList<>();

      for (int i = 0; i < req.getToOrder().size(); i++) {
        updates.add(new IssuePosUpdate(req.getToOrder().get(i), i + 1));
      }

      if (req.getFromOrder() != null && !req.getFromOrder().isEmpty()) {
        for (int i = 0; i < req.getFromOrder().size(); i++) {
          updates.add(new IssuePosUpdate(req.getFromOrder().get(i), i + 1));
        }
      }

      kanbanMapper.batchUpdatePositions(updates);
      return;
    }

    // toIndex만 오는 간단 버전(최소 동작)
    int pos = (req.getToIndex() == null ? 9999 : (req.getToIndex() + 1));
    kanbanMapper.updateIssueStatusAndPosition(req.getIssueCode(), req.getToStatusId(), pos);
  }
}
