package com.yedam.app.project.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@EqualsAndHashCode
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectAddVO {
	private Integer projectCode; // 프로젝트 코드
	private String projectName; // 프로젝트 명
	private String description; // 설명
	private String status; // 상태
	private Integer userCode; // 유저코드

}
