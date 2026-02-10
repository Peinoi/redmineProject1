package com.yedam.app.main.service;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@RequiredArgsConstructor
public class MainProjectStatusVO {
	private Integer roleCode;
	private String roleName;
	private Integer userCode;
	private String name;
	private String projectName;
	private String status;
	private String codeName;
	private String adminCk;
	private Integer codeNameCnt;
}
