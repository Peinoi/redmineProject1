package com.yedam.app.issuetype.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.issuetype.service.IssueTypeVO;

public interface IssueTypeMapper {

	// 유형 타입 조회
	public List<IssueTypeVO> selectAllIssueType();

	// 유형 타입 추가
	public int addIssueType(IssueTypeVO issueTypeVO);
	
	// 유형 타입 수정
	public int modifyIssueType(IssueTypeVO issueTypeVO);

	// 유형 타입 삭제
	public int deleteIssueType(@Param("typeCode") int typeCode);
}
