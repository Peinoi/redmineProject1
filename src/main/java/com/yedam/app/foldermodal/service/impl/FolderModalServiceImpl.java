package com.yedam.app.foldermodal.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.yedam.app.foldermodal.mapper.FolderModalMapper;
import com.yedam.app.foldermodal.service.FolderModalService;
import com.yedam.app.foldermodal.service.FolderModalVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FolderModalServiceImpl implements FolderModalService {

	private final FolderModalMapper folderModalMapper;

	@Override
	public List<FolderModalVO> findFolderModalListByUser(Integer userCode) {
		List<FolderModalVO> allFolders = folderModalMapper.selectFolderList(userCode);
		return buildFolderTree(allFolders);
	}

	@Override
	public List<FolderModalVO> buildFolderTree(List<FolderModalVO> flatList) {
		Map<Integer, FolderModalVO> map = new HashMap<>();
		List<FolderModalVO> roots = new ArrayList<>();

		for (FolderModalVO vo : flatList) {
			if (vo.getChildren() == null) {
				vo.setChildren(new ArrayList<>());
			}
			map.put(vo.getFolderCode(), vo);
		}

		for (FolderModalVO vo : flatList) {
			if (vo.getHeaderFolderCode() != null && map.containsKey(vo.getHeaderFolderCode())) {
				map.get(vo.getHeaderFolderCode()).getChildren().add(vo);
			} else {
				roots.add(vo);
			}
		}

		return roots;
	}

	@Override
	public List<FolderModalVO> findProjectListByUser(Integer userCode) {
		return folderModalMapper.selectProjectListByUser(userCode);
	}

}
