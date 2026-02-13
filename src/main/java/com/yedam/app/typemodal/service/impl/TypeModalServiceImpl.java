package com.yedam.app.typemodal.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.yedam.app.typemodal.mapper.TypeModalMapper;
import com.yedam.app.typemodal.service.TypeModalService;
import com.yedam.app.typemodal.service.TypeModalVO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class TypeModalServiceImpl implements TypeModalService {

	private final TypeModalMapper typeModalMapper;

	@Override
	public List<TypeModalVO> findTypeModalListByUser(Integer userCode) {
		List<TypeModalVO> allTypes = typeModalMapper.selectTypeModalByUser(userCode);
		return buildTypeTree(allTypes); // 기존 재귀 트리 변환 재사용
	}

	@Override
	public List<TypeModalVO> findTypeModalListByProjects(List<Integer> projectCodes) {
		List<TypeModalVO> allTypes = new ArrayList<>();
		for (Integer projectCode : projectCodes) {
			allTypes.addAll(typeModalMapper.selectTypeModalList(projectCode));
		}
		return allTypes;
	}

	@Override
	public List<TypeModalVO> buildTypeTree(List<TypeModalVO> flatList) {
		Map<Integer, TypeModalVO> map = new HashMap<>();
		List<TypeModalVO> roots = new ArrayList<>();

		for (TypeModalVO vo : flatList) {
			if (vo.getChildren() == null) {
				vo.setChildren(new ArrayList<>());
			}
			map.put(vo.getTypeCode(), vo);
		}

		for (TypeModalVO vo : flatList) {
			if (vo.getParTypeCode() != null && map.containsKey(vo.getParTypeCode())) {
				map.get(vo.getParTypeCode()).getChildren().add(vo);
			} else {
				roots.add(vo);
			}
		}

		return roots;
	}
	
	// 등록화면용
	@Override
	public List<TypeModalVO> findTypeModalListForInsert(Integer projectCode) {
	  if (projectCode == null) return List.of();
	  return typeModalMapper.selectTypeModalListForInsert(projectCode);
	}

}