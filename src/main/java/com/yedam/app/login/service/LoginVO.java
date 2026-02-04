package com.yedam.app.login.service;

import lombok.Data;

@Data
public class LoginVO {
	private Integer employeeNo;
	private String password;
	private String passwordHash;
	private String name;
}
