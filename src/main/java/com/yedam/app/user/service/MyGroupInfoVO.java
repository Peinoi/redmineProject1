package com.yedam.app.user.service;

import lombok.Data;

@Data
public class MyGroupInfoVO {
  private Integer groupCode;
  private String groupName;
  private Integer memberCount;
  private String description;
}
