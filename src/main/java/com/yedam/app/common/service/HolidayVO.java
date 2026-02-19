package com.yedam.app.common.service;

import java.util.Date;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
public class HolidayVO {
	private Integer seq; // 번호
	@JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Seoul")
	private Date dt; // 날짜
	private String weekNm; // 요일
	private String holiNm; // 공휴일 명
	private String useYn; // 사용여부
}
