package com.yedam.app.common.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.yedam.app.common.mapper.CommonMapper;
import com.yedam.app.common.service.CommonService;
import com.yedam.app.common.service.CommonVO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class CommonServiceImpl implements CommonService {
	
	private final CommonMapper commonMapper;
	
	@Override
	public List<CommonVO> findAll() {
		return commonMapper.selectAll();
	}

}
