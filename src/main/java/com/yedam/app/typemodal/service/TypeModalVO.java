package com.yedam.app.typemodal.service;

import lombok.Data;

@Data
public class TypeModalVO {
	private Integer typeCode;
	private String typeName;
	private Integer parTypeCode;
	private String parTypeName; 
}
