package com.yedam.app.issue.service.impl;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.yedam.app.attach.service.AttachmentService;
import com.yedam.app.issue.mapper.IssueMapper;
import com.yedam.app.issue.service.IssueService;
import com.yedam.app.issue.service.IssueVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IssueServiceImpl implements IssueService {
	
	private final IssueMapper issueMapper;
	 private final AttachmentService attachmentService;
	
	@Override
	public List<IssueVO> findAll() {
		return issueMapper.selectAll();
	}

	@Override
	public long addIssue(IssueVO issue) {
		int result = issueMapper.insertIssue(issue);
		return result == 1 ? issue.getIssueCode() : null;
	}
	
	@Override
	@Transactional
	public int removeIssues(List<Long> issueCodes) {
	  if (issueCodes == null || issueCodes.isEmpty()) return 0;

	  // 1) 삭제 전 fileCodes 확보
	  List<Long> fileCodes = issueMapper.selectFileCodesByIssueCodes(issueCodes);

	  // 2) 이슈 삭제
	  int deleted = issueMapper.deleteIssues(issueCodes);

	  // 3) 첨부 정리
	  if (fileCodes != null) {
	    for (Long fileCode : fileCodes) {
	      if (fileCode == null) continue;

	      int remain = issueMapper.countIssuesByFileCode(fileCode);
	      if (remain == 0) {
	        attachmentService.deleteSingleFile(fileCode);
	      }
	    }
	  }

	  return deleted;
	}



	@Override
	public IssueVO findByIssueCode(IssueVO issue) {
		return issueMapper.selectIssue(issue);
	}

	@Override
	@Transactional
	public Map<String, Object> modifyIssueInfo(IssueVO issue, MultipartFile uploadFile, Long userCode) {
	    Map<String, Object> result = new java.util.HashMap<>();

	    if (issue == null || issue.getIssueCode() == null) {
	        result.put("success", false);
	        result.put("message", "issueCode가 없습니다.");
	        return result;
	    }

	    // 1) 내용 수정
	    int updated = issueMapper.updateIssue(issue.getIssueCode(), issue);
	    if (updated <= 0) {
	        result.put("success", false);
	        result.put("updatedCount", updated);
	        result.put("message", "수정할 대상이 없거나 실패했습니다.");
	        return result;
	    }

	    // 2) 파일이 있으면 첨부 저장 -> fileCode 얻기
	    if (uploadFile != null && !uploadFile.isEmpty()) {
	        Long fileCode = attachmentService.saveSingleFile("ISSUE", userCode, uploadFile);

	        // 3) issues.file_code 갱신
	        if (fileCode != null) {
	            issueMapper.updateIssueFileCode(issue.getIssueCode(), fileCode);
	        }
	    }

	    // 4) 수정 후 재조회
	    IssueVO refreshed = issueMapper.selectIssue(issue);

	    result.put("success", true);
	    result.put("updatedCount", updated);
	    result.put("message", "수정되었습니다.");
	    result.put("data", refreshed);
	    return result;
	}


	@Transactional
	  @Override
	  public void attachFileToIssue(Long issueCode, Long userCode, MultipartFile uploadFile) {
	    if (uploadFile == null || uploadFile.isEmpty()) return;

	    // 공용 첨부 저장(attachments + attachments_detail) -> fileCode 반환
	    Long fileCode = attachmentService.saveSingleFile("ISSUE", userCode, uploadFile);

	    // issues.file_code 업데이트
	    if (fileCode != null) {
	      issueMapper.updateIssueFileCode(issueCode, fileCode);
	    }
	  }

}
