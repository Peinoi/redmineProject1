package com.yedam.app.main.service;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class ProIssStaVO {
	private Integer projectCode;
	private String projectName;
	
	// 전체
	private Integer newIss;
	private Integer progress;
	private Integer solution;
	private Integer returnIss;
	private Integer completion;

	// 내 이슈
	private Integer myNewIss;
	private Integer myProgress;
	private Integer mySolution;
	private Integer myReturnIss;
	private Integer myCompletion;
}
