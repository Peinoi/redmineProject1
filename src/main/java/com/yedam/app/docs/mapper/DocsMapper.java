package com.yedam.app.docs.mapper;

import java.util.List;

import com.yedam.app.docs.service.DocsVO;

public interface DocsMapper {
	
	// 폴더 등록
	public int insertFolder(DocsVO docsVO);
	
	// 파일 등록
	public int insertFiles(DocsVO docsVO);
	
	// 문서 조회
	public List<DocsVO> selectDocsList(DocsVO docsVO);
}
