package com.yedam.app.project.service;

import java.util.Date;

import lombok.Data;
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
public class RoleVO {
	private Integer roleCode;
	private String roleName;
	private String explanation;
}
