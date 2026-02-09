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
import com.yedam.app.log.service.LogService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IssueServiceImpl implements IssueService {

  private final IssueMapper issueMapper;
  private final AttachmentService attachmentService;
  private final LogService logService;

  @Override
  public List<IssueVO> findVisibleIssues(Integer userCode, Long projectCode) {
    return issueMapper.selectVisibleIssues(userCode, projectCode);
  }

  @Override
  public IssueVO findByIssueCode(IssueVO issue) {
    return issueMapper.selectIssue(issue);
  }

  @Override
  @Transactional
  public Long addIssue(IssueVO issue) {
    int result = issueMapper.insertIssue(issue);
    if (result != 1) return null;

    // CREATE 로그: meta는 굳이 필요 없으니 null
    logService.addActionLog(
      issue.getProjectCode(),
      issue.getCreatedByCode(),
      "CREATE",
      "ISSUE",
      issue.getIssueCode(),
      null
    );

    return issue.getIssueCode();
  }

  @Override
  @Transactional
  public Map<String, Object> modifyIssueInfo(IssueVO issue, MultipartFile uploadFile, Integer userCode) {
    Map<String, Object> result = new java.util.HashMap<>();

    if (issue == null || issue.getIssueCode() == null) {
      result.put("success", false);
      result.put("message", "issueCode가 없습니다.");
      return result;
    }

    // 수정 전 데이터(before)
    IssueVO before = issueMapper.selectIssue(issue);

    // 1) 내용 수정
    int updated = issueMapper.updateIssue(issue.getIssueCode(), issue);
    if (updated <= 0) {
      result.put("success", false);
      result.put("updatedCount", updated);
      result.put("message", "수정할 대상이 없거나 실패했습니다.");
      return result;
    }

    // 2) 파일이 있으면 첨부 저장 -> fileCode 얻기 (파일 로그는 지금은 안 찍음)
    if (uploadFile != null && !uploadFile.isEmpty()) {
      Long fileCode = attachmentService.saveSingleFile("ISSUE", userCode, uploadFile);
      if (fileCode != null) {
        issueMapper.updateIssueFileCode(issue.getIssueCode(), fileCode);
      }
    }

    // 수정 후 데이터(after)
    IssueVO after = issueMapper.selectIssue(issue);

    // UPDATE 로그: meta에는 changes만
    String meta = buildUpdateMeta(before, after);

    logService.addActionLog(
      after.getProjectCode(),
      userCode,
      "UPDATE",
      "ISSUE",
      after.getIssueCode(),
      meta
    );

    result.put("success", true);
    result.put("updatedCount", updated);
    result.put("message", "수정되었습니다.");
    result.put("data", after);
    return result;
  }

  @Override
  @Transactional
  public int removeIssues(List<Long> issueCodes) {
    if (issueCodes == null || issueCodes.isEmpty()) return 0;

    List<Long> fileCodes = issueMapper.selectFileCodesByIssueCodes(issueCodes);
    int deleted = issueMapper.deleteIssues(issueCodes);

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
  @Transactional
  public void attachFileToIssue(Long issueCode, Integer userCode, MultipartFile uploadFile) {
    if (uploadFile == null || uploadFile.isEmpty()) return;

    Long fileCode = attachmentService.saveSingleFile("ISSUE", userCode, uploadFile);
    if (fileCode != null) {
      issueMapper.updateIssueFileCode(issueCode, fileCode);
    }

  }

  // -----------------------------
  // meta 만들기(UPDATE용): changes만
  // -----------------------------
  private String buildUpdateMeta(IssueVO before, IssueVO after) {
	  StringBuilder sb = new StringBuilder();
	  sb.append("{\"changes\":[");

	  boolean first = true;

	  // title/description 같은 건 원문 그대로
	  first = appendChange(sb, first, "title",
	      before == null ? null : before.getTitle(),
	      after == null ? null : after.getTitle());

	  first = appendChange(sb, first, "description",
	      before == null ? null : before.getDescription(),
	      after == null ? null : after.getDescription());

	  // 우선순위: 비교는 코드, 저장은 이름
	  first = appendChangeByCode(sb, first, "priority",
	      before == null ? null : before.getPriority(),
	      after == null ? null : after.getPriority(),
	      before == null ? null : before.getPriorityName(),
	      after == null ? null : after.getPriorityName());

	  // 상태: 비교는 statusId(OB1...), 저장은 statusName(신규/진행/완료...)
	  first = appendChangeByCode(sb, first, "status",
	      before == null ? null : before.getStatusId(),
	      after == null ? null : after.getStatusId(),
	      before == null ? null : before.getStatusName(),
	      after == null ? null : after.getStatusName());

	  // 담당자: 비교는 assigneeCode, 저장은 assigneeName
	  first = appendChangeByCode(sb, first, "assignee",
	      before == null || before.getAssigneeCode() == null ? null : String.valueOf(before.getAssigneeCode()),
	      after == null || after.getAssigneeCode() == null ? null : String.valueOf(after.getAssigneeCode()),
	      before == null ? null : before.getAssigneeName(),
	      after == null ? null : after.getAssigneeName());

	  // 유형: 비교는 typeCode, 저장은 typeName
	  first = appendChangeByCode(sb, first, "type",
	      before == null || before.getTypeCode() == null ? null : String.valueOf(before.getTypeCode()),
	      after == null || after.getTypeCode() == null ? null : String.valueOf(after.getTypeCode()),
	      before == null ? null : before.getTypeName(),
	      after == null ? null : after.getTypeName());

	  // 상위일감: 비교는 parIssueCode, 저장은 parIssueTitle
	  first = appendChangeByCode(sb, first, "parentIssue",
	      before == null || before.getParIssueCode() == null ? null : String.valueOf(before.getParIssueCode()),
	      after == null || after.getParIssueCode() == null ? null : String.valueOf(after.getParIssueCode()),
	      before == null ? null : before.getParIssueTitle(),
	      after == null ? null : after.getParIssueTitle());

	  // 날짜/숫자류는 그대로
	  first = appendChange(sb, first, "dueAt",
	      before == null || before.getDueAt() == null ? null : before.getDueAt().toString(),
	      after == null || after.getDueAt() == null ? null : after.getDueAt().toString());

	  first = appendChange(sb, first, "startedAt",
	      before == null || before.getStartedAt() == null ? null : before.getStartedAt().toString(),
	      after == null || after.getStartedAt() == null ? null : after.getStartedAt().toString());

	  first = appendChange(sb, first, "resolvedAt",
	      before == null || before.getResolvedAt() == null ? null : before.getResolvedAt().toString(),
	      after == null || after.getResolvedAt() == null ? null : after.getResolvedAt().toString());

	  first = appendChange(sb, first, "progress",
	      before == null || before.getProgress() == null ? null : String.valueOf(before.getProgress()),
	      after == null || after.getProgress() == null ? null : String.valueOf(after.getProgress()));

	  sb.append("]}");
	  return sb.toString();
	}

	// "변경 감지"는 code로 하고, "기록"은 display(이름)로 함
	private boolean appendChangeByCode(StringBuilder sb, boolean first, String field,
	                                  String beforeCode, String afterCode,
	                                  String beforeDisplay, String afterDisplay) {
	  if (beforeCode == null && afterCode == null) return first;
	  if (beforeCode != null && beforeCode.equals(afterCode)) return first;

	  if (!first) sb.append(",");
	  sb.append("{\"field\":\"").append(esc(field)).append("\",")
	    .append("\"before\":").append(jsonValue(normalizeDisplay(beforeDisplay))).append(",")
	    .append("\"after\":").append(jsonValue(normalizeDisplay(afterDisplay))).append("}");

	  return false;
	}

	private String normalizeDisplay(String s) {
	  if (s == null || s.isBlank()) return "-";
	  return s;
	}

	private boolean appendChange(StringBuilder sb, boolean first, String field, String before, String after) {
	  if (before == null && after == null) return first;
	  if (before != null && before.equals(after)) return first;

	  if (!first) sb.append(",");
	  sb.append("{\"field\":\"").append(esc(field)).append("\",")
	    .append("\"before\":").append(jsonValue(before)).append(",")
	    .append("\"after\":").append(jsonValue(after)).append("}");

	  return false;
	}

	private String jsonValue(String v) {
	  if (v == null) return "null";
	  return "\"" + esc(v) + "\"";
	}

	private String esc(String s) {
	  if (s == null) return "";
	  return s.replace("\\", "\\\\")
	          .replace("\"", "\\\"")
	          .replace("\n", "\\n")
	          .replace("\r", "\\r")
	          .replace("\t", "\\t");
	}

}
