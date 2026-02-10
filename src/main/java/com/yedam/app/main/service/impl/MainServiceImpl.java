package com.yedam.app.main.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.yedam.app.main.mapper.MainMapper;
import com.yedam.app.main.service.MainProjectStatusVO;
import com.yedam.app.main.service.MainService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MainServiceImpl implements MainService{
	
	private final MainMapper mainMapper;

	@Override
	public List<MainProjectStatusVO> findCodeNameCnt(Integer userCode) {
		return mainMapper.selectCodeNameCnt(userCode);
	}

	@Override
	public List<MainProjectStatusVO> findProIssSta(Integer userCode) {
		return mainMapper.selectProIssSta(userCode);
	}

}
