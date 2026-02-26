// UserProjectAuthVO.java
package com.yedam.app.project.service;

import lombok.Data;

@Data
public class UserProjectAuthVO {
    private Integer admin;
    private Integer userCode;
    private Integer projectCode;
    private String name;
    private String category;
    private String rdRol;
    private String wrRol;
    private String moRol;
    private String delRol;
}