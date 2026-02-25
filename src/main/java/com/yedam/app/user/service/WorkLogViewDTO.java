package com.yedam.app.user.service;

import lombok.Data;

@Data
public class WorkLogViewDTO {
	private String day;          // 2026-02-12
	private String time;         // 17:06
	private String actionLabel;  // 수정/등록/삭제...
	private String actorName;    // 로그 사용자이름 (사용자 페이지니까 profile.name 넣으면 됨)

	private String projectName;
	private String issueTitle;

	private String detailHtml;   // "상태 : 신규 >> 해결<br>..."
	
	private String targetUrl;   // 상세페이지 링크(있으면)
	private Boolean targetLink; // 링크 가능 여부(있으면 true)
	
	private Long targetCode;
}
