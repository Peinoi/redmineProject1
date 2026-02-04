package com.yedam.app.gantt.service;

import java.util.Date;

import lombok.Data;

@Data
public class GanttVO {
	private Integer issueCode;   // 일감 코드
	private String projectName;  // 프로젝트명
	private String title;        // 일감명
	private String priority;     // 우선순위
	private String status;       // 일감 상태
	private Integer progress;    // 진척도
	private Date startedAt;      // 시작일
    private Date resolvedAt;     // 종료일
    private String assigneeName; // 작업자
    private Integer duration;    // 작업기간
	private Integer projectCode; // 프로젝트 코드
	private Date createdOn;      // 프로젝트 등록일
	
	// 검색 조건
    private Date createdOnFrom;  // 프로젝트 등록일 조회시작날짜
    private Date createdOnTo;    // 프로젝트 등록일 조회종료날짜
}
