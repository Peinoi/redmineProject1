package com.yedam.app.foldermodal.mapper;

import java.util.List;

import com.yedam.app.foldermodal.service.FolderModalVO;

public interface FolderModalMapper {
	// 폴더 목록 조회 (모달용)
	public List<FolderModalVO> selectFolderList(Integer userCode);
	
	// 폴더 없는 프로젝트 조회
	public List<FolderModalVO> selectProjectListByUser(Integer userCode);
}
