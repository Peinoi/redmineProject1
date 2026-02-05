package com.yedam.app.issue.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.issue.service.IssueVO;

public interface IssueMapper {
	// 전체조회
	public List<IssueVO> selectAll();
	// 단건조회
	public IssueVO selectIssue(IssueVO issue);
	// 등록
	public int insertIssue(IssueVO issue);
	// 첨부파일 등록
	public int updateIssueFileCode(@Param("issueCode") Long issueCode,
            @Param("fileCode") Long fileCode);
    // 일괄 삭제
    public int deleteIssues(@Param("issueCodes") List<Long> issueCodes);
    // 삭제 대상 file_code 목록 조회
    List<Long> selectFileCodesByIssueCodes(@Param("issueCodes") List<Long> issueCodes);
    // file_code를 참조하는 일감 찾기
    int countIssuesByFileCode(@Param("fileCode") Long fileCode);
    // 수정
    public int updateIssue(@Param("issueCode") Long issueCode,
    						@Param("issue") IssueVO issue);
}
