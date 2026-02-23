package com.yedam.app.login.service;

import java.util.Date;

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
	private String position;
	private Date createdAt;
	private Date lastLoginAt;
	private String rememberEmpNo;
	private String isLock;
	private String firstLoginYn;
	private String autoLogin;
	private String sysCk;
}
