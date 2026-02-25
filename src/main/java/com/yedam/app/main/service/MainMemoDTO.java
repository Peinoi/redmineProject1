package com.yedam.app.main.service;

import lombok.Data;

@Data
public class MainMemoDTO {
	private Integer memoCode;
	private Integer userCode;
	private String memoDate;   // 날짜(TRUNC로 저장/조회)
	private String content;
}
