package com.yedam.app.auth.service;

import com.yedam.app.project.service.ProjectAddGroupVO;

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
public class RoleAuthVO {
	private int raCode; // pk 
	private int roleCode; // 역할  코드
	private String category; // 카테고리
	private String rdRol; // 읽기
	private String wrRol; // 쓰기
	private String moRol; // 수정
	private String delRol; //삭제

}
