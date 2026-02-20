package com.yedam.app.groupmgr.service;

import com.yedam.app.project.service.GroupVO;

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
public class GroupMgrVO {
	private Integer groupCode; // 그룹 코드
	private String grName; // 그룹명
	private String description; // 설명
	private Integer memberCount; // 멤버수 

}
