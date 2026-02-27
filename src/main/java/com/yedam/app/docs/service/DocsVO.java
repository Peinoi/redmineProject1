package com.yedam.app.docs.service;

import java.util.Date;

import lombok.Data;

@Data
public class DocsVO {

	// 폴더
	private Integer folderCode; // Not Null
	private String folderName;
	private Date createdOn;
	private Integer headerFolderCode;
	private Integer userCode;
	private Integer projectCode; // Not Null

	// 파일
	private Integer fileCode; // Not Null
	private String originalName;
	private String storedName; 
	private String path;
	private String mimeType;
	private Integer sizeBytes; // Not Null
	private Date uploadedAt;

	// 조회용 추가 필드
	private String uploaderName;
	private String projectName;
	private String folderPath; // 전체 경로 (표시용)
	private Integer folderDepth; // 들여쓰기 depth
	private String sortPath; // 정렬용
	private String uploadedAtStr; // 포맷된 날짜 문자열
	private String rowType;

	// 검색 조건
	private String projectStatusName;
	private String fileName;
	private String fileType;
	private String createdFrom;
	private String createdTo;
	private Integer createdCode;
	
	// 권한 체크용 (UserProjectAuthVO에서 복사해올 필드)
    private Integer admin;      // 관리자 여부 (1: 관리자, 0: 일반)
    private String rdRol;       // 읽기
    private String wrRol;       // 쓰기
    private String moRol;       // 수정
    private String delRol;      // 삭제
    private String category;    // '문서'
}
