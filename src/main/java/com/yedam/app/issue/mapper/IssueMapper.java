package com.yedam.app.issue.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.issue.service.IssueVO;

public interface IssueMapper {
	// 로그인 유저의 프로젝트 일감 전체 목록
	  List<IssueVO> selectVisibleIssues(@Param("sysCk") String sysCk,
              @Param("allProjectCodes") List<Long> allProjectCodes,
              @Param("adminProjectCodes") List<Long> adminProjectCodes,
              @Param("readableProjectCodes") List<Long> readableProjectCodes,
              @Param("projectCode") Long projectCode);


	// 단건조회
	public IssueVO selectIssue(IssueVO issue);

	// 등록
	public int insertIssue(IssueVO issue);

	// 첨부파일 등록
	public int updateIssueFileCode(@Param("issueCode") Long issueCode, @Param("fileCode") Long fileCode);

	// 일괄 삭제
	public int deleteIssues(@Param("issueCodes") List<Long> issueCodes);

	// 삭제 대상 file_code 목록 조회
	List<Long> selectFileCodesByIssueCodes(@Param("issueCodes") List<Long> issueCodes);

	// file_code를 참조하는 일감 찾기
	int countIssuesByFileCode(@Param("fileCode") Long fileCode);

	// 수정
	public int updateIssue(@Param("issueCode") Long issueCode, @Param("issue") IssueVO issue);
	
	// 반려사유 등록
	int insertIssueReject(java.util.Map<String, Object> param);

	// 반려코드 일감에 연결
	int setIssueRejectCode(@Param("issueCode") Long issueCode, @Param("rejectCode") Long rejectCode);
	
	// 상태 업데이트
	int updateIssueStatusByStatusId(@Param("issueCode") Long issueCode, @Param("projectCode") Long projectCode,
			@Param("statusId") String statusId);
	
	// 반려이력 목록 조회
	List<IssueVO> selectRejectHistory(@Param("issueCode") Long issueCode);

	// 해결 + 첨부파일 등록
	int resolveIssueWithFile(@Param("issueCode") Long issueCode, @Param("projectCode") Long projectCode,
		    @Param("fileCode") Long fileCode
		);
}
