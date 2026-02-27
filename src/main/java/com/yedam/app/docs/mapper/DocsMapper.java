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
	
	// 문서 단건 조회(파일 다운로드용)
	public DocsVO selectFileByCode(DocsVO docsVO);
	
	// 폴더 내 모든 파일 조회 하위 폴더 포함(폴더 다운로드용)
	public List<DocsVO> selectFilesByFolder(DocsVO docsVO);
	
	// 파일 삭제
	public int deleteFile(DocsVO docsVO);
	
	// 폴더 하위 파일 수 확인(권한 필요 없음)
	public int countFilesByFolder(Integer folderCode);
	
	// 폴더 하위 폴더 수 확인(권한 필요 없음)
	public int countChildFolders(Integer folderCode);
	
	// 폴더 삭제
	public int deleteFolder(DocsVO docsVO);
}
