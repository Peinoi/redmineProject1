package com.yedam.app.gantt.service;

import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;

import lombok.Data;

@Data
public class SearchVO {
	private Long projectCode;
	private String projectName;
	private String projectStatus;
	private String projectStatusName;
	
	private String typeCode;
	private String typeName;
	
	private Long issueCode;
	private String title;
	private String statusId;
	private String statusName;
	private String priority;
	private String priorityName;
	private Integer assigneeCode;
	private String assigneeName;
	private Integer createdByCode;
	private String creatorName;
	@DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm")
	private LocalDateTime createdAt;
	@DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm")
	private LocalDateTime dueAt;
}
