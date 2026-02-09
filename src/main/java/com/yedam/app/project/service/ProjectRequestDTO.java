package com.yedam.app.project.service;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProjectRequestDTO {
    private String projectName;
    private Integer userCode;
    private String description;
    private String status;
    private List<ProjectUserDTO> projectUsers;
    private List<ProjectGroupDTO> projectGroups;
    
    @Getter
    @Setter
    public static class ProjectUserDTO {
        private String userCode;
        private String roleCode;
    }
    
    @Getter
    @Setter
    public static class ProjectGroupDTO {
        private String groupCode;
        private String roleCode;
    }
}