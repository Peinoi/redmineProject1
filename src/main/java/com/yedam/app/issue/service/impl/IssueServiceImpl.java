package com.yedam.app.issue.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.yedam.app.issue.mapper.IssueMapper;
import com.yedam.app.issue.service.IssueService;
import com.yedam.app.issue.service.IssueVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IssueServiceImpl implements IssueService {
	
	private final IssueMapper issueMapper;
	
	@Override
	public List<IssueVO> findAll() {
		return issueMapper.selectAll();
	}

}
