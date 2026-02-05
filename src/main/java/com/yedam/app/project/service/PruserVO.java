package com.yedam.app.project.service;

import java.util.Date;

import lombok.Data;
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
public class PruserVO {
	private Integer userCode; // 회원 코드
	private Integer employeeNo; // 사번 (아이디 역할도 함)
	private String name; // 이름
	private String phone; // 폰번호
	private String email; // 이메일
	private Date created_at; // 입사일
	private String isLock; // 잠금 상태
}
