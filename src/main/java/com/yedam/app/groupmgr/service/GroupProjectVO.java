package com.yedam.app.groupmgr.service;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class GroupProjectVO {
    private Integer grProCode; // 그룹 프로젝트 매핑 코드 
    private Integer grCode; // 그룹 코드
    private Integer projectCode; // 프로젝트 코드
    private String projectName; // 프로젝트명
    private Integer roleCode; // 역할 코드
    private String roleName; // 역할 명
    private String status;// 프로젝트 상태
}
