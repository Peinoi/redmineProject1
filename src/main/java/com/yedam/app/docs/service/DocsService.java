package com.yedam.app.docs.service;

import java.io.IOException;
import java.util.List;

import jakarta.servlet.http.HttpServletResponse;

public interface DocsService {

	// 폴더 등록
	public int addFolder(DocsVO docsVO);

	// 파일 등록
	public int addFiles(DocsVO docsVO);

	// 문서 조회
	public List<DocsVO> getDocsList(DocsVO docsVO);

	// 문서 단건 조회(다운로드용)
	public DocsVO getFileInfo(Integer fileCode, DocsVO param);

	// 폴더 내 모든 파일 조회 하위 폴더 포함(폴더 다운로드용)
	public void downloadFolderAsZip(Integer folderCode, DocsVO param, HttpServletResponse response) throws IOException;

	// 파일 삭제
	public int removeFile(Integer fileCode, DocsVO param);

	// 폴더 삭제
	public int removeFolder(Integer folderCode, DocsVO param);
}
