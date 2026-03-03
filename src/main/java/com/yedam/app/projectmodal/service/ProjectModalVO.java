package com.yedam.app.projectmodal.service;

import java.util.Date;

import lombok.Data;

@Data
public class ProjectModalVO {
	private Integer projectCode;
	private String projectName;
	private Date createdOn; // 생성일
	private String projectStatusCode;
	
	private String adminCk;
}
