package com.yedam.app.docs.service;

import java.util.Date;

import lombok.Data;

@Data
public class DocsVO {
	
	// 폴더
	private Integer folderCode;
	private String folderName;
	private Date createdOn;
	private Integer headerFolderCode;
	private Integer userCode;
	private Integer projectCode;
	
	// 파일
	private Integer fileCode;
	private String originalName;
	private String storedName;
	private String path;
	private String mimeType;
	private Integer sizeBytes;
	private Date uploadedAt;	
}
