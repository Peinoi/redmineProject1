package com.yedam.app.docs.service;

import java.util.List;

public interface DocsService {

	// 폴더 등록
	public int addFolder(DocsVO docsVO);

	// 파일 등록
	public int addFiles(DocsVO docsVO);

	// 문서 조회
	public List<DocsVO> getDocsList(DocsVO docsVO);
}
