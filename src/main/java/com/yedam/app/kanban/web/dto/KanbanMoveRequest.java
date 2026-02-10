package com.yedam.app.kanban.web.dto;

import java.util.List;

import lombok.Data;

@Data
public class KanbanMoveRequest {
  private Long projectCode;

  private Long issueCode;

  private String fromStatusId;
  private String toStatusId;

  private Integer toIndex;

  // 권장: 드롭 후 컬럼의 전체 순서(정렬 정확 저장용)
  private List<Long> fromOrder;
  private List<Long> toOrder;
}
