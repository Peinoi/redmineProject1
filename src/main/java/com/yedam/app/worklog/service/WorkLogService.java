package com.yedam.app.worklog.service;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;

public interface WorkLogService {
  List<Map<String, Object>> listWorklogs(String from, String to);

  Map<String, Object> getPrefill(Long issueCode, HttpSession session);

  void createWorklog(WorkLogVO vo, HttpSession session);
}