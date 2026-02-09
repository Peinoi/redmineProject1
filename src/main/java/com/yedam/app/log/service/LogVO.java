package com.yedam.app.log.service;

import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;

import lombok.Data;

@Data
public class LogVO {
	private Long logCode;
	  private Long projectCode;
	  private Integer userCode;

	  private String actionType;   // CREATE, UPDATE, DELETE, ...
	  private String targetType;   // ISSUE, NOTICE ...
	  private Long targetCode;     // pk
	  @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
	  private LocalDateTime createdAt;
	  private String meta;
	  
	  private String userName;
}
