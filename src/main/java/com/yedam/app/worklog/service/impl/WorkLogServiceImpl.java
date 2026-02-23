package com.yedam.app.worklog.service.impl;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yedam.app.worklog.mapper.WorkLogMapper;
import com.yedam.app.worklog.service.WorkLogService;
import com.yedam.app.worklog.service.WorkLogVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WorkLogServiceImpl implements WorkLogService {

  private final WorkLogMapper workLogMapper;

  @Override
  public List<Map<String, Object>> listWorklogs(String from, String to) {
    return workLogMapper.selectWorklogList(from, to);
  }

  @Override
  public Map<String, Object> getPrefill(Long issueCode, HttpSession session) {
    Map<String, Object> issue = workLogMapper.selectIssuePrefill(issueCode);
    if (issue == null) issue = new HashMap<>();

    // 로그인 유저 이름은 프로젝트 구조에 맞게 바꿔도 됨
    Object loginName = session.getAttribute("loginUserName");
    if (loginName != null) issue.put("loginUserName", String.valueOf(loginName));

    return issue;
  }

  @Override
  @Transactional
  public void createWorklog(WorkLogVO vo, HttpSession session) {
    if (vo == null || vo.getIssueCode() == null) throw new IllegalArgumentException("일감이 필요합니다.");
    if (vo.getWorkDate() == null) throw new IllegalArgumentException("작업일이 필요합니다.");
    if (vo.getSpentMinutes() == null || vo.getSpentMinutes() <= 0) throw new IllegalArgumentException("소요시간(분)은 1 이상이어야 합니다.");

    Long loginUserCode = (Long) session.getAttribute("loginUserCode");
    if (loginUserCode == null) throw new IllegalStateException("로그인이 필요합니다.");

    Boolean isAdmin = (Boolean) session.getAttribute("isAdmin");
    boolean admin = (isAdmin != null && isAdmin);

    // 담당자 체크
    Long assignee = workLogMapper.selectAssigneeCode(vo.getIssueCode());
    boolean isAssignee = (assignee != null && assignee.equals(loginUserCode));

    if (!(admin || isAssignee)) throw new SecurityException("권한이 없습니다.");

    // 작업자는 지금은 로그인 유저로 고정(작업자 선택은 나중에)
    vo.setWorkerCode(loginUserCode);

    // 문자열로 넘어오는 경우 대비(WorkLogVO를 LocalDate로 받으면 보통 자동 바인딩됨)
    if (vo.getWorkDate() == null) vo.setWorkDate(LocalDate.now());

    workLogMapper.insertWorkLog(vo);
  }
}