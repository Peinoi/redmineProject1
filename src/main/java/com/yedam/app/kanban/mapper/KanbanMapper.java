package com.yedam.app.kanban.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.issue.service.IssueVO;
import com.yedam.app.kanban.web.dto.IssuePosUpdate;

public interface KanbanMapper {

  // 보드 조회 (scope + (optional) projectCode)
  List<IssueVO> selectKanbanIssuesByScope(
      @Param("userCode") Integer userCode,
      @Param("viewScope") String viewScope,      
      @Param("projectCode") Long projectCode   
  );

  // 카드 상태(code_id: OB1~OB5) + position 변경(단건)
  int updateIssueStatusAndPosition(
	      @Param("projectCode") Long projectCode,
	      @Param("issueCode") Long issueCode,
	      @Param("fromStatusCode") String fromStatusCode,
	      @Param("toStatusCode") String toStatusCode,
	      @Param("position") Integer position
	  );

  // position 일괄 업데이트
  int batchUpdatePositions(@Param("list") List<IssuePosUpdate> list);
  
  // 진행 진척도 업데이트
  int updateIssueProgress(
	      @Param("projectCode") Long projectCode,
	      @Param("issueCode") Long issueCode,
	      @Param("progress") Integer progress
	  );
}
