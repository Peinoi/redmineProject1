package com.yedam.app.issue.service;

import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;

import lombok.Data;

@Data
public class IssueVO {
	private Long issueCode;
	private Long projectCode;
	private Long statusCode; // status pk
	
	private String statusId; // OB1~5

	private String title;
	private String description;
	
	private String priority; 

	private Long assigneeCode;
	private String assigneeName;
	private Integer createdByCode;
	private String creatorName;
	
	@DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm")
	private LocalDateTime createdAt;
	@DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm")
	private LocalDateTime dueAt;
	@DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm")
	private LocalDateTime startedAt;
	@DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm")
	private LocalDateTime resolvedAt;
	@DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm")
	private LocalDateTime updatedAt;

	private Integer progress; 
	private Integer position; 
	private Integer parIssueCode;
	private String parIssueTitle;

	private Long fileCode;
	private String originalName;
	private String filePath;
	@DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm")
	private LocalDateTime uploadedAt;
	
	private String projectName;
	private String projectStatusName;
	private String projectStatus;
	
	private String statusName; // 신규...
	private String priorityName;
	
	private Integer typeCode;
	private String typeName;
	
	private Long rejectCode;

	private String rejectReason;
	private Integer rejectedBy;
	private String rejectedByName;

	@DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm")
	private LocalDateTime rejectedAt;
}
