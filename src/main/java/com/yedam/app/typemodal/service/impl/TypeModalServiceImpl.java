package com.yedam.app.typemodal.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.yedam.app.typemodal.mapper.TypeModalMapper;
import com.yedam.app.typemodal.service.TypeModalService;
import com.yedam.app.typemodal.service.TypeModalVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TypeModalServiceImpl implements TypeModalService {

  private final TypeModalMapper typeModalMapper;

  @Override
  public List<TypeModalVO> findTypeModalList() {
    return typeModalMapper.selectTypeModalList();
  }
}
