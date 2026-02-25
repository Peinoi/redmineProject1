package com.yedam.app.foldermodal.service;

import java.util.Date;
import java.util.List;

import lombok.Data;

@Data
public class FolderModalVO {
	// 폴더
	private Integer folderCode; // Not Null
	private String folderName;
	private Date createdOn;
	private Integer headerFolderCode;
	private String headerFolderName;
	private Integer userCode;
	private Integer projectCode; // Not Null
	private String projectName;
	private List<FolderModalVO> children; // 하위 유형 재귀
}
