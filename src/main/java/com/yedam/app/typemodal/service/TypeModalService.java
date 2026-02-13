package com.yedam.app.typemodal.service;

import java.util.List;

public interface TypeModalService {

	public List<TypeModalVO> findTypeModalListByUser(Integer userCode);

	// 프로젝트별 유형 조회 (Mapper 호출)
	public List<TypeModalVO> findTypeModalListByProjects(List<Integer> projectCodes);

	// flatList -> 트리 구조로 변환
	public List<TypeModalVO> buildTypeTree(List<TypeModalVO> flatList);
	
	// 등록 화면용
	List<TypeModalVO> findTypeModalListForInsert(Integer projectCode);
}
