package com.yedam.app.docs.service.impl;

import org.springframework.stereotype.Service;

import com.yedam.app.docs.mapper.DocsMapper;
import com.yedam.app.docs.service.DocsService;
import com.yedam.app.docs.service.DocsVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DocsServiceImpl implements DocsService {

	private final DocsMapper docsMapper;

	// 폴더 등록
	@Override
	public int addFolder(DocsVO docsVO) {
		return docsMapper.insertFolder(docsVO);
	}

	// 파일 등록
	@Override
	public int addFiles(DocsVO docsVO) {
		return docsMapper.insertFiles(docsVO);
	}

}
