package com.yedam.app.login.service;

import lombok.Data;

@Data
public class TodayDueDTO {
    private Integer issueCode;
    private String projectName;
    private String subject;
    private String dueDate; // "YYYY-MM-DD"
}
