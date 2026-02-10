// UserProjectAuthVO.java
package com.yedam.app.project.service;

import lombok.Data;

@Data
public class UserProjectAuthVO {
    private Integer admin;
    private Integer roleCode;
    private String roleName;
    private Integer userCode;
    private String name;
    private Integer projectCode;
    private String projectName;
    private String status;
    private String codeName;
    private String category;
    private String rdRol;
    private String wrRol;
    private String moRol;
    private String delRol;
}