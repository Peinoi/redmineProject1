package com.yedam.app.authority.service.impl;

import org.springframework.stereotype.Service;

import com.yedam.app.authority.AuthorityVO;
import com.yedam.app.authority.mapper.AuthorityMapper;
import com.yedam.app.authority.service.AuthorityService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthorityServiceImpl implements AuthorityService {

  private final AuthorityMapper authorityMapper;

  private boolean isY(String v) {
    return v != null && v.equalsIgnoreCase("Y");
  }

  @Override
  public boolean canWrite(Long projectCode, Integer userCode, String category) {
    AuthorityVO ra = authorityMapper.selectAuthority(projectCode, userCode, category);
    return ra != null && isY(ra.getWrRol());
  }

  @Override
  public boolean canRead(Long projectCode, Integer userCode, String category) {
    AuthorityVO ra = authorityMapper.selectAuthority(projectCode, userCode, category);
    return ra != null && isY(ra.getRdRol());
  }

  @Override
  public boolean canModify(Long projectCode, Integer userCode, String category) {
    AuthorityVO ra = authorityMapper.selectAuthority(projectCode, userCode, category);
    return ra != null && isY(ra.getMoRol());
  }

  @Override
  public boolean canDelete(Long projectCode, Integer userCode, String category) {
    AuthorityVO ra = authorityMapper.selectAuthority(projectCode, userCode, category);
    return ra != null && isY(ra.getDelRol());
  }
  
  @Override
  public AuthorityVO getProjectAuth(Integer userCode, Long projectCode) {
    return authorityMapper.selectProjectAuth(userCode, projectCode);
  }
}
