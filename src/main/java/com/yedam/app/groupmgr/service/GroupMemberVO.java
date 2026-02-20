package com.yedam.app.groupmgr.service;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class GroupMemberVO {
    private Integer grMemCode; // 그룹 멤버코드
    private Integer grCode; // 그룹 코드
    private Integer userCode; // 유저코드
    private String userName; // 유저 이름
    private String email; // 이메일
}
