package com.yedam.app.typemodal.mapper;

import java.util.List;

import com.yedam.app.typemodal.service.TypeModalVO;

public interface TypeModalMapper {
	
	List<TypeModalVO> selectTypeModalByUser(Integer userCode);

	List<TypeModalVO> selectTypeModalList(Integer projectCode);
	
	//등록 화면용
	List<TypeModalVO> selectTypeModalListForInsert(Integer projectCode);
}