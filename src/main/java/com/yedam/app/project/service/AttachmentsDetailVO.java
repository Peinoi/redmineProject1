package com.yedam.app.project.service;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class AttachmentsDetailVO {

	private Integer fileDetailCode; // 첨부파일 상세 코드 (PK)
	private Integer fileCode; // 첨부파일 코드 (FK)
	private String originalName; // 원본 파일명
	private String storedName; // 저장 파일명
	private String path; // 저장 경로
	private String mimeType; // MIME 타입
	private Long sizeBytes; // 파일 크기
	private String isUsed; // 사용 여부
}