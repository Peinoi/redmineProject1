package com.yedam.app.calendar.service;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
public class CalendarVO {
	// 공통
	private String rowType; // TYPE / ISSUE
	private String nodeId;
	private String parentId;

	private Integer projectCode; // 프로젝트 코드
	private String projectName; // 프로젝트명
	private String projectStatus; // 프로젝트 상태
	private String projectStatusName; // 프로젝트 상태명

	// 타입
	private Integer typeCode; // 타입 코드
	private String typeName; // 타입명
	private Integer typeLevel; // 타입 레벨
	private Integer parTypeCode; // 부모 타입 코드
	private String parTypeName; // 부모 타입 이름

	// 이슈
	private Integer issueCode; // 일감 코드
	private Integer parIssueCode; // 상위 일감 코드
	private String title; // 일감명
	private String priority; // 우선순위
	private String issueStatus; // 일감 상태
	private Integer progress; // 진척도
	private Integer assigneeCode; // 작업자 코드
	private String assigneeName; // 작업자명
	@JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Seoul")
	private LocalDateTime createdAt; // 일감 등록일
	@JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Seoul")
	private LocalDateTime startedAt; // 일감 시작일
	@JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Seoul")
	private LocalDateTime dueAt; // 일감 마감기한
	@JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Seoul")
	private LocalDateTime resolvedAt; // 일감 완료일

	// 달력 전용 필드
	private Integer duration; // 작업기간
	@JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Seoul")
	private LocalDateTime issueStartDate; // 일감 시작일
	@JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Seoul")
	private LocalDateTime issueEndDate; // 일감 종료일

	// 권한 체크용
	private String category;
	private Integer userCode;
}
