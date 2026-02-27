package com.yedam.app.issue.service;

import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

public interface IssueService {
	// 목록
	List<IssueVO> findVisibleIssues(String sysCk,
            List<Long> allProjectCodes,
            List<Long> adminProjectCodes,
            List<Long> readableProjectCodes,
            Long projectCode);
	// 단건조회
	public IssueVO findByIssueCode(IssueVO issue);
	// 등록
	public Long addIssue(IssueVO issue);
	// 일괄삭제
    public int removeIssues(List<Long> issueCodes);
    // 수정
    public Map<String, Object> modifyIssueInfo(IssueVO issue, MultipartFile uploadFile, Integer userCode);
 	// 첨부파일
 	void attachFileToIssue(Long issueCode, Integer userCode, MultipartFile uploadFile);
 	// 승인
 	Map<String, Object> approveIssue(Long issueCode, Integer userCode);
 	// 반려
 	Map<String, Object> rejectIssue(Long issueCode, Integer userCode, String reason);
 	// 반려이력 조회
 	List<IssueVO> findRejectHistory(Long issueCode);
 	// 해결 + 첨부
 	Map<String, Object> resolveIssue(Long issueCode, Integer userCode, MultipartFile uploadFile);
 	
}
