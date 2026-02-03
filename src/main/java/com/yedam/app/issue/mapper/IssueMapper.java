package com.yedam.app.issue.mapper;

import java.util.List;

import com.yedam.app.issue.service.IssueVO;

public interface IssueMapper {
	public List<IssueVO> selectAll();
}
