package com.yedam.app.login.service;

import lombok.Data;

@Data
public class UserVO {
	private Integer userCode;
	private Integer employeeNo;
	private String email;
	private String password;
	private String passwordHash;
	private String name;
	private String phone;
	private String rememberEmpNo;
	private String isLock;
}
