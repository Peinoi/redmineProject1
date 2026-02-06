package com.yedam.app.gantt.service;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class GanttVO {
	private String typeName; // 일감 타입명
	private Integer parIssueCode; // 상위 일감 코드
	private Integer issueCode; // 일감 코드
	private String projectName; // 프로젝트명
	private String title; // 일감명
	private String priority; // 우선순위
	private String priorityCode; // 우선순위 코드
	private String issueStatus; // 일감 상태
	private Integer progress; // 진척도
	private LocalDateTime createdAt; // 등록일
	private LocalDateTime startedAt; // 시작일
	private LocalDateTime dueAt; // 마감기한
	private LocalDateTime resolvedAt; // 완료일
	private String assigneeCode; // 작업자 코드
	private String assigneeName; // 작업자명
	private Integer duration; // 작업기간
	private Integer projectCode; // 프로젝트 코드
	private LocalDateTime createdOn; // 프로젝트 등록일 - 간트 시작일
	private LocalDateTime completedOn; // 프로젝트 종료일
	private String projectStatus; // 프로젝트 상태
	
	// 타입 계층 정보
	private Integer typeLevel; // 타입 레벨 
	private Integer parentTypeCode; // 부모 타입 코드
	private String parentType; // 부모 타입 이름

	// 간트 전용 필드
	private Integer projectProgress; // 프로젝트 진척도
	private LocalDateTime projectEndDate; // 프로젝트 종료일
	private LocalDateTime issueStartDate; // 일감 시작일
	private LocalDateTime issueEndDate; // 일감 종료일
	private LocalDateTime typeStartDate; // 타입 시작일
	private LocalDateTime typeEndDate; // 타입 종료일
}
