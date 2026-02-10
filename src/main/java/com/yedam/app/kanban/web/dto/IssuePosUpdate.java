package com.yedam.app.kanban.web.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IssuePosUpdate {
  private Long issueCode;
  private Integer position;
}
