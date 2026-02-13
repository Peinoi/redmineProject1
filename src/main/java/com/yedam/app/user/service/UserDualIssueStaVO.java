package com.yedam.app.user.service;

import lombok.Data;

@Data
public class UserDualIssueStaVO {
	// 등록(작성) 기준
	  private Integer regNewIss;
	  private Integer regProgress;
	  private Integer regSolution;
	  private Integer regReturnIss;
	  private Integer regCompletion;

	  // 담당 기준
	  private Integer assNewIss;
	  private Integer assProgress;
	  private Integer assSolution;
	  private Integer assReturnIss;
	  private Integer assCompletion;
}
