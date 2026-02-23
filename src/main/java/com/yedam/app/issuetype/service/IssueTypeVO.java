package com.yedam.app.issuetype.service;

import java.util.Date;

import com.yedam.app.auth.service.RoleAuthVO;

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
public class IssueTypeVO {

	private Integer typeCode; // 유형타입코드
	private Integer projectCode; // 프로젝트코드
	private String projectName; // 프로젝트명
	private String typeName; // 유형명
	private Date startAt; // 시작일
	private Date endAt; // 종료일
	private String isDeleted; // 삭제 여부
	private Integer parTypeCode;  // 상위 유형 코드 (null이면 최상위)
    private String  parTypeName;  // 상위 유형명 (조회용)

}
