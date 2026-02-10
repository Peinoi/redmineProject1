package com.yedam.app.kanban.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.issue.service.IssueVO;
import com.yedam.app.kanban.web.dto.IssuePosUpdate;

public interface KanbanMapper {

  // 프로젝트별 보드(옵션)
  List<IssueVO> selectKanbanIssuesByProject(@Param("projectCode") Long projectCode);

  // 내 일감 보드(기본)
  List<IssueVO> selectKanbanIssuesByUser(@Param("loginUserCode") Long loginUserCode);

  // 카드 상태+position 변경(단건)
  int updateIssueStatusAndPosition(
      @Param("issueCode") Long issueCode,
      @Param("toStatusId") String toStatusId,
      @Param("position") Integer position
  );

  // position 일괄 업데이트
  int batchUpdatePositions(@Param("list") List<IssuePosUpdate> list);
}
