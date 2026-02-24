package com.yedam.app.docs.service;

public interface DocsService {

	// 폴더 등록
	public int addFolder(DocsVO docsVO);

	// 파일 등록
	public int addFiles(DocsVO docsVO);
}
