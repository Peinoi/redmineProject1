package com.yedam.app.worklog.service;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;

public interface WorkLogService {
	List<Map<String, Object>> listWorklogs(String from, String to, HttpSession session);

	List<Map<String, Object>> getPrefill(Long issueCode, HttpSession session);

  void createWorklog(WorkLogVO vo, HttpSession session);
  
  Map<String, Object> getWorklog(Long workLogCode, HttpSession session);

  void updateWorklog(Long workLogCode, WorkLogVO vo, HttpSession session);

  void deleteWorklog(Long workLogCode, HttpSession session);
  
  List<Map<String, Object>> getStats(
		  int includeType,
		  int includeWorker,
		  int includeIssue,
	      Long projectCode,
	      Long typeCode,
	      Integer workerCode,
	      String issueTitle,
	      String workTime,
	      HttpSession session
		);
}