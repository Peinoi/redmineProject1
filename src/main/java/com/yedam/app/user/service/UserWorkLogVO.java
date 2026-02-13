package com.yedam.app.user.service;

import java.util.Date;

import lombok.Data;

@Data
public class UserWorkLogVO {
	private Long logCode;
	  private Integer projectCode;
	  private String projectName;

	  private String actionType;   // UPDATE/CREATE...
	  private String targetType;   // ISSUE...
	  private Long targetCode;     // issue_code
	  private String issueTitle;   // 조인으로 가져올 것

	  private Date createdAt;
	  private String meta;
}
