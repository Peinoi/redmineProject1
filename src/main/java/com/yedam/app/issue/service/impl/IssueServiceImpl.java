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
  public List<IssueVO> findVisibleIssues(String sysCk,
                                         List<Long> allProjectCodes,
                                         List<Long> adminProjectCodes,
                                         List<Long> readableProjectCodes,
                                         Long projectCode) {
      return issueMapper.selectVisibleIssues(
              sysCk,
              allProjectCodes,
              adminProjectCodes,
              readableProjectCodes,
              projectCode
      );
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

    IssueVO before = issueMapper.selectIssue(issue);

    int updated = issueMapper.updateIssue(issue.getIssueCode(), issue);
    if (updated <= 0) {
      result.put("success", false);
      result.put("updatedCount", updated);
      result.put("message", "수정할 대상이 없거나 실패했습니다.");
      return result;
    }

    if (uploadFile != null && !uploadFile.isEmpty()) {
      Long fileCode = attachmentService.saveSingleFile("ISSUE", userCode, uploadFile);
      if (fileCode != null) {
        issueMapper.updateIssueFileCode(issue.getIssueCode(), fileCode);
      }
    }

    IssueVO after = issueMapper.selectIssue(issue);

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
  // meta 만들기(UPDATE용): changes
  // -----------------------------
  private String buildUpdateMeta(IssueVO before, IssueVO after) {
    StringBuilder sb = new StringBuilder();
    sb.append("{\"changes\":[");

    boolean first = true;

    first = appendChange(sb, first, "title",
        before == null ? null : before.getTitle(),
        after == null ? null : after.getTitle());

    first = appendChange(sb, first, "description",
        before == null ? null : before.getDescription(),
        after == null ? null : after.getDescription());

    first = appendChangeByCode(sb, first, "priority",
        before == null ? null : before.getPriority(),
        after == null ? null : after.getPriority(),
        before == null ? null : before.getPriorityName(),
        after == null ? null : after.getPriorityName());

    first = appendChangeByCode(sb, first, "status",
        before == null ? null : before.getStatusId(),
        after == null ? null : after.getStatusId(),
        before == null ? null : before.getStatusName(),
        after == null ? null : after.getStatusName());

    first = appendChangeByCode(sb, first, "assignee",
        before == null || before.getAssigneeCode() == null ? null : String.valueOf(before.getAssigneeCode()),
        after == null || after.getAssigneeCode() == null ? null : String.valueOf(after.getAssigneeCode()),
        before == null ? null : before.getAssigneeName(),
        after == null ? null : after.getAssigneeName());

    first = appendChangeByCode(sb, first, "type",
        before == null || before.getTypeCode() == null ? null : String.valueOf(before.getTypeCode()),
        after == null || after.getTypeCode() == null ? null : String.valueOf(after.getTypeCode()),
        before == null ? null : before.getTypeName(),
        after == null ? null : after.getTypeName());

    first = appendChangeByCode(sb, first, "parentIssue",
        before == null || before.getParIssueCode() == null ? null : String.valueOf(before.getParIssueCode()),
        after == null || after.getParIssueCode() == null ? null : String.valueOf(after.getParIssueCode()),
        before == null ? null : before.getParIssueTitle(),
        after == null ? null : after.getParIssueTitle());

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

  private boolean appendChange(StringBuilder sb, boolean first, String field, String before, String after) {
    if (before == null && after == null) return first;
    if (before != null && before.equals(after)) return first;

    if (!first) sb.append(",");
    sb.append("{\"field\":\"").append(esc(field)).append("\",")
      .append("\"before\":").append(jsonValue(before)).append(",")
      .append("\"after\":").append(jsonValue(after)).append("}");

    return false;
  }

  private String normalizeDisplay(String s) {
    if (s == null || s.isBlank()) return "-";
    return s;
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

  // -----------------------------
  // REJECT에서만 반려사유를 meta에 "추가"
  // -----------------------------
  private String addRejectReasonToMeta(String meta, String reason) {
    String r = (reason == null) ? null : reason.trim();
    if (r == null || r.isEmpty()) return meta;

    if (meta == null || meta.isBlank() || !meta.contains("\"changes\"")) {
      return "{\"changes\":[{\"field\":\"rejectReason\",\"before\":null,\"after\":\"" + esc(r) + "\"}]}";
    }

    if (meta.contains("\"changes\":[]")) {
      return meta.replace("\"changes\":[]",
          "\"changes\":[{\"field\":\"rejectReason\",\"before\":null,\"after\":\"" + esc(r) + "\"}]");
    }

    int pos = meta.lastIndexOf("]}");
    if (pos < 0) return meta;

    String insert = ",{\"field\":\"rejectReason\",\"before\":null,\"after\":\"" + esc(r) + "\"}";
    return meta.substring(0, pos) + insert + meta.substring(pos);
  }

  // 승인
  @Override
  @Transactional
  public Map<String, Object> approveIssue(Long issueCode, Integer userCode) {
    Map<String, Object> res = new java.util.HashMap<>();

    if (issueCode == null) {
      res.put("success", false);
      res.put("message", "issueCode가 없습니다.");
      return res;
    }

    IssueVO param = new IssueVO();
    param.setIssueCode(issueCode);

    IssueVO before = issueMapper.selectIssue(param);
    if (before == null) {
      res.put("success", false);
      res.put("message", "일감을 찾을 수 없습니다.");
      return res;
    }

    int updated = issueMapper.updateIssueStatusByStatusId(
        issueCode, before.getProjectCode(), "OB5"
    );

    if (updated <= 0) {
      res.put("success", false);
      res.put("message", "승인 처리에 실패했습니다.");
      return res;
    }

    IssueVO after = issueMapper.selectIssue(param);

    String meta = buildUpdateMeta(before, after);

    logService.addActionLog(
        after.getProjectCode(),
        userCode,
        "APPROVE",
        "ISSUE",
        after.getIssueCode(),
        meta
    );

    res.put("success", true);
    res.put("message", "승인 처리되었습니다.");
    res.put("data", after);
    return res;
  }

  // 반려
  @Override
  @Transactional
  public Map<String, Object> rejectIssue(Long issueCode, Integer userCode, String reason) {
    Map<String, Object> res = new java.util.HashMap<>();

    if (issueCode == null) {
      res.put("success", false);
      res.put("message", "issueCode가 없습니다.");
      return res;
    }
    if (reason == null || reason.trim().isEmpty()) {
      res.put("success", false);
      res.put("message", "반려 사유를 입력해 주세요.");
      return res;
    }

    IssueVO param = new IssueVO();
    param.setIssueCode(issueCode);

    IssueVO before = issueMapper.selectIssue(param);
    if (before == null) {
      res.put("success", false);
      res.put("message", "일감을 찾을 수 없습니다.");
      return res;
    }

    java.util.Map<String, Object> p = new java.util.HashMap<>();
    p.put("issueCode", issueCode);
    p.put("rejectedBy", userCode);
    p.put("reason", reason.trim());

    int ins = issueMapper.insertIssueReject(p);
    if (ins <= 0) {
      res.put("success", false);
      res.put("message", "반려 사유 저장에 실패했습니다.");
      return res;
    }

    Long rejectCode = (Long) p.get("rejectCode");

    issueMapper.setIssueRejectCode(issueCode, rejectCode);

    issueMapper.updateIssueStatusByStatusId(
        issueCode, before.getProjectCode(), "OB4"
    );

    IssueVO after = issueMapper.selectIssue(param);

    // 일반 변경(meta) + 반려사유는 REJECT에서만 추가
    String meta = buildUpdateMeta(before, after);
    meta = addRejectReasonToMeta(meta, reason);

    logService.addActionLog(
        after.getProjectCode(),
        userCode,
        "REJECT",
        "ISSUE",
        after.getIssueCode(),
        meta
    );

    res.put("success", true);
    res.put("message", "반려 처리되었습니다.");
    res.put("data", after);
    return res;
  }

  // 반려이력조회
  @Override
  public List<IssueVO> findRejectHistory(Long issueCode) {
    return issueMapper.selectRejectHistory(issueCode);
  }

  // 해결 + 첨부
  @Override
  @Transactional
  public Map<String, Object> resolveIssue(Long issueCode, Integer userCode, MultipartFile uploadFile) {
    Map<String, Object> res = new java.util.HashMap<>();

    if (issueCode == null) {
      res.put("success", false);
      res.put("message", "issueCode가 없습니다.");
      return res;
    }
    if (uploadFile == null || uploadFile.isEmpty()) {
      res.put("success", false);
      res.put("message", "첨부파일을 선택해 주세요.");
      return res;
    }

    IssueVO param = new IssueVO();
    param.setIssueCode(issueCode);

    IssueVO before = issueMapper.selectIssue(param);
    if (before == null) {
      res.put("success", false);
      res.put("message", "일감을 찾을 수 없습니다.");
      return res;
    }

    Long fileCode = attachmentService.saveSingleFile("ISSUE", userCode, uploadFile);
    if (fileCode == null) {
      res.put("success", false);
      res.put("message", "파일 저장에 실패했습니다.");
      return res;
    }

    int updated = issueMapper.resolveIssueWithFile(issueCode, before.getProjectCode(), fileCode);
    if (updated <= 0) {
      attachmentService.deleteSingleFile(fileCode);
      res.put("success", false);
      res.put("message", "해결 처리에 실패했습니다.");
      return res;
    }

    IssueVO after = issueMapper.selectIssue(param);

    // resolve/update는 그냥 일반 변경만 (rejectReason 절대 넣지 않음)
    String meta = buildUpdateMeta(before, after);

    logService.addActionLog(
        after.getProjectCode(),
        userCode,
        "UPDATE",
        "ISSUE",
        after.getIssueCode(),
        meta
    );

    res.put("success", true);
    res.put("message", "해결 처리되었습니다.");
    res.put("data", after);
    res.put("fileCode", fileCode);
    return res;
  }
  
  
}
