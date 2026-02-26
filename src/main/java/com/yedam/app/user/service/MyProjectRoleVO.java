package com.yedam.app.user.service;

import lombok.Data;

@Data
public class MyProjectRoleVO {
	private Integer projectCode;
    private String projectName;
    private String status;       // projects.status (OD1/OD2/OD3)
    private String statusName;   // COMMON_CODE.CODE_NAME (예: 진행/보류/종료)
    private String roles;        // "PM, DEV" 같은 LISTAGG 결과
}
