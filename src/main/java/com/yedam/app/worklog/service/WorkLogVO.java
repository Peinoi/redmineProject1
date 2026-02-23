package com.yedam.app.worklog.service;

import java.time.LocalDate;

import lombok.Data;

@Data
public class WorkLogVO {
  private Long workLogCode;
  private Long issueCode;
  private String issueTitle;
  private LocalDate workDate;

  private Long workerCode;
  private String workerName;
  private String projectName;

  private Integer spentMinutes;
  private String description;
}