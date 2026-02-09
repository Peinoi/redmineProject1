package com.yedam.app.typemodal.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yedam.app.typemodal.service.TypeModalService;
import com.yedam.app.typemodal.service.TypeModalVO;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class TypeModalController {

  private final TypeModalService typeModalService;

  @GetMapping("/api/types/modal")
  public List<TypeModalVO> typeModalList() {
    return typeModalService.findTypeModalList();
  }
}
