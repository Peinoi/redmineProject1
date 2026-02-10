package com.yedam.app.usermodal.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.yedam.app.usermodal.mapper.UserModalMapper;
import com.yedam.app.usermodal.service.UserModalService;
import com.yedam.app.usermodal.service.UserModalVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserModalServiceImpl implements UserModalService {

  private final UserModalMapper userModalMapper;

  @Override
  public List<UserModalVO> findUsersByProject(Long projectCode) {
    return userModalMapper.selectUsersByProject(projectCode);
  }

  @Override
  public List<UserModalVO> findUsersByMyProjects(Long loginUserCode) {
    return userModalMapper.selectUsersByMyProjects(loginUserCode);
  }
}
