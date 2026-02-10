package com.yedam.app.authority;

import lombok.Data;

@Data
public class AuthorityVO {
	  private String category;
	  private String rdRol;
	  private String wrRol;
	  private String moRol;
	  private String delRol;
	  
	  private String adminCk;
	  private String status;
	  private String roleName;
	  private Long projectCode;
	  private Integer userCode;
}
