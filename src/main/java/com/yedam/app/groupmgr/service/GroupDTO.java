package com.yedam.app.groupmgr.service;

import java.util.List;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class GroupDTO {

    // 그룹 기본 정보
    private Integer groupCode;
    private String grName;
    private String description;

    // 구성원 목록
    private List<MemberDTO> groupUsers;

    // 프로젝트 목록
    private List<ProjectDTO> groupProjects;

    @Getter
    @Setter
    public static class MemberDTO {
        private Integer grMemCode;
        private Integer userCode;
        private String action; // "add", "delete", "keep"
    }

    @Getter
    @Setter
    public static class ProjectDTO {
        private Integer grProCode;
        private Integer projectCode;
        private Integer roleCode;
        private String action; // "add", "delete", "keep"
    }
}
