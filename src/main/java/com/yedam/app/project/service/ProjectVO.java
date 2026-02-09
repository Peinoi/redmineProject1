package com.yedam.app.project.service;

import java.util.Date;

import org.springframework.format.annotation.DateTimeFormat;

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
public class ProjectVO {
	private Integer projectCode; // 프로젝트 코드
	private String projectName; // 프로젝트명
	private String description; // 설명
	@DateTimeFormat(pattern = "yyyy-MM-dd")
	private Date createdOn; // 생성일
	private Integer userCode; // 유저코드
	private String name; // 유저이름
	private String codeName; // 상태명
	private String phone; // 관리자 폰
	private String email; // 관리자 메일
}
