package com.yedam.app.mypage.service;

import java.util.Date;

import lombok.Data;

@Data
public class MyIssueRowDTO {
	private Integer issueCode;
	  private Integer projectCode;
	  private String projectName;

	  private String title;
	  private String statusName;   // OB1~OB5 => code_name
	  private Date dueAt;
	  private Date updatedAt;
	  private Integer progress; // 0~100
	  
	  private String canEdit; // 'Y' or 'N'
}
