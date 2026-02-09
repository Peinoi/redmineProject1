package com.yedam.app.project.service;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@EqualsAndHashCode
@RequiredArgsConstructor
public class ProjectAddStatusVO {
	private Integer statusCode;
	private Integer projectCode;
	private String codeId;
	private Integer sortNo;
	
	

}
