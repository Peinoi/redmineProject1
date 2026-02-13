package com.yedam.app.typemodal.service;

import java.time.LocalDate;
import java.util.List;

import lombok.Data;

@Data
public class TypeModalVO {
	private Integer typeCode;
	private String typeName;
	private Integer parTypeCode;
	private String parTypeName; 
	private Integer projectCode; // 프로젝트별 구분
	private String projectName;
	private List<TypeModalVO> children; // 하위 유형 재귀
	
	private LocalDate endAt;
}
