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
public class ProjectManagerVO {
	// 자신이 속한 프로젝트의 담당자 체크
	private Integer userCode;// 유저 코드
	private String name; // 프로젝트 담당자 이름
}
