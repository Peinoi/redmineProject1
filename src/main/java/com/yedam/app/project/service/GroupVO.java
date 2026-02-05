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
public class GroupVO {
	private Integer groupCode;
	private String grName;
	private String description;
}
