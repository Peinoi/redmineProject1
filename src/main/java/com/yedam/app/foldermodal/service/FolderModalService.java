package com.yedam.app.foldermodal.service;

import java.util.List;

public interface FolderModalService {
	// 프로젝트별 폴더 조회
	public List<FolderModalVO> findFolderModalListByUser(Integer userCode);

	// flatList -> 트리 구조로 변환
	public List<FolderModalVO> buildFolderTree(List<FolderModalVO> flatList);
	
	// 폴더 없는 프로젝트 조회
	public List<FolderModalVO> findProjectListByUser(Integer userCode);
}
