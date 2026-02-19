package com.yedam.app.usermodal.service;

import java.util.List;

import lombok.Data;

@Data
public class UserModalVO {
	private Long userCode;
	private String userName;
	private Integer projectCode; // 프로젝트별 구분
	private String projectName;
	private List<UserModalVO> children;
}
