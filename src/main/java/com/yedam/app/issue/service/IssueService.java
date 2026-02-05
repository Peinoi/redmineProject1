package com.yedam.app.issue.service;

import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

public interface IssueService {
	// 전체조회
	public List<IssueVO> findAll();
	// 단건조회
	public IssueVO findByIssueCode(IssueVO issue);
	// 등록
	public long addIssue(IssueVO issue);
	// 일괄삭제
    public int removeIssues(List<Long> issueCodes);
    // 수정
    public Map<String, Object> modifyIssueInfo(IssueVO issue, MultipartFile uploadFile, Long userCode);
 	// 첨부파일
 	void attachFileToIssue(Long issueCode, Long userCode, MultipartFile uploadFile);
}
