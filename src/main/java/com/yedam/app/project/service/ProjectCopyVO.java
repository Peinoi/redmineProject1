package com.yedam.app.project.service;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@EqualsAndHashCode
@RequiredArgsConstructor
public class ProjectCopyVO {

	private String projectName; // 프로젝트명
	private Integer projectCode; // 프로젝트코드
	private Integer userCode; // 등록자 유저 코드
	private Integer newProjectCode; // OUT: 새 프로젝트 코드
	private Integer resultCode; // OUT: 실행 결과 (0=성공, -1=실패)
	private String resultMsg; // OUT: 실행 결과 메시지
}
