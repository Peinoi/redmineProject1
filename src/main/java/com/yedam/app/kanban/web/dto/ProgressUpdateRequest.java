package com.yedam.app.kanban.web.dto;

import lombok.Data;

@Data
public class ProgressUpdateRequest {
  private Long projectCode;
  private Long issueCode;
  private Integer progress;
}
