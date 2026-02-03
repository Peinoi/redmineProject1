package com.yedam.app.gantt.service;

import java.util.Date;

import lombok.Data;

@Data
public class GanttVO {
	private Integer projectCode; // PK, Not Null, 프로젝트 코드
	private String projectName;  // 프로젝트명
	private String description;  // 설명
	private Date createdOn;      // Default SYSDATE, 등록일
	private String status;       // 상태
	private Integer userCode;    // FK, 담당자 코드
}
