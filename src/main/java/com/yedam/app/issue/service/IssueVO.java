package com.yedam.app.issue.service;

import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;

import lombok.Data;

@Data
public class IssueVO {
	private Long issueCode;
	private Long projectCode;
	private Long statusCode;

	private String title;
	private String description; 

	private String priority;

	private Long assigneeCode;
	private Long createdByCode;
	
	@DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm")
	private LocalDateTime createdAt;
	private LocalDateTime dueAt;
	private LocalDateTime startedAt;
	private LocalDateTime resolvedAt;
	private LocalDateTime updatedAt;

	private Integer progress; 
	private Integer position;     

	private Long fileCode;

}
