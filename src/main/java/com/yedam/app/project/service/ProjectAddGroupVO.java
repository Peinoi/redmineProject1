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
public class ProjectAddGroupVO {
	private Integer grProCode;
	private Integer grCode;
	private Integer projectCode;
	private Integer roleCode;

}
