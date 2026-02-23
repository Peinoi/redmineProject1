package com.yedam.app.docs.mapper;

import com.yedam.app.docs.service.DocsVO;

public interface DocsMapper {
	
	// 폴더 등록
	public int insertFolder(DocsVO docsVO);
	
	// 파일 등록
	public int insertFiles(DocsVO docsVO);
}
