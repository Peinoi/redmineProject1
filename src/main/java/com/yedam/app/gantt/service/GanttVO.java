package com.yedam.app.gantt.service;

import java.util.Date;

import lombok.Data;

@Data
public class GanttVO {
	private Integer issueCode;    // 일감 코드
	private String projectName;   // 프로젝트명
	private String title;         // 일감명
	private String priority;      // 우선순위
	private String priorityCode;  // 우선순위 코드
	private String issueStatus;   // 일감 상태
	private Integer progress;     // 진척도
	private Date createdAt;       // 등록일
	private Date startedAt;       // 시작일
	private Date dueAt;           // 마감기한
    private Date resolvedAt;      // 완료일
    private String assigneeCode;  // 작업자 코드
    private String assigneeName;  // 작업자명
    private Integer duration;     // 작업기간
	private Integer projectCode;  // 프로젝트 코드
	private Date createdOn;       // 프로젝트 등록일 - 간트 시작일
	private Date completedOn;     // 프로젝트 종료일
	private String projectStatus; // 프로젝트 상태

	// 간트 전용 필드
	private Integer projectProgress; // 프로젝트 진척도
	private Date projectEndDate;   // 프로젝트 종료일
    private Date issueStartDate;   // 일감 시작일
    private Date issueEndDate;     // 일감 종료일
}
