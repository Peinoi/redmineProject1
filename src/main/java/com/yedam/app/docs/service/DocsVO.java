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
}
