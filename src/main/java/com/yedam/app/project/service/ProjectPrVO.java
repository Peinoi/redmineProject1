package com.yedam.app.project.service;

import java.util.Date;

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
public class ProjectPrVO {

	private Integer projectCode; // 프로젝트 코드
	private String projectName; // 프로젝트 명
	private Integer actualProg; // 실제 진척도
	private Integer planProg; // 예상 진척도
	private Integer plan; // 일감 갯수
	private Integer endPlan; // 종료된 일감수

}
