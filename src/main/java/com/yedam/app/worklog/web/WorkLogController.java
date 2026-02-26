package com.yedam.app.worklog.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.yedam.app.worklog.service.WorkLogService;
import com.yedam.app.worklog.service.WorkLogVO;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class WorkLogController {

  private final WorkLogService workLogService;

  @GetMapping("/worklogs")
  public String page(@RequestParam(required = false) String from,
                     @RequestParam(required = false) String to,
                     Model model,
                     HttpSession session) {

    List<Map<String, Object>> list = workLogService.listWorklogs(from, to, session);
    model.addAttribute("list", list);
    return "worklog/list";
  }

  @ResponseBody
  @GetMapping("/api/worklogs")
  public Map<String, Object> list(@RequestParam(required = false) String from,
                                 @RequestParam(required = false) String to,
                                 HttpSession session) {
    Map<String, Object> res = new HashMap<>();
    List<Map<String, Object>> data = workLogService.listWorklogs(from, to, session);
    res.put("success", true);
    res.put("data", data);
    return res;
  }

  @ResponseBody
  @GetMapping("/api/worklogs/prefill")
  public Map<String, Object> prefill(@RequestParam("issueCode") Long issueCode,
                                     HttpSession session) {
    Map<String, Object> res = new HashMap<>();
    try {
      List<Map<String, Object>> data = workLogService.getPrefill(issueCode, session);
      res.put("success", true);
      res.put("data", data);
    } catch (Exception e) {
      res.put("success", false);
      res.put("message", e.getMessage());
    }
    return res;
  }

  @ResponseBody
  @PostMapping("/api/worklogs")
  public Map<String, Object> create(@RequestBody WorkLogVO vo,
                                    HttpSession session) {
    Map<String, Object> res = new HashMap<>();
    try {
      workLogService.createWorklog(vo, session);
      res.put("success", true);
      res.put("workLogCode", vo.getWorkLogCode());
      return res;
    } catch (Exception e) {
      res.put("success", false);
      res.put("message", e.getMessage());
      return res;
    }
  }
  
  @ResponseBody
  @GetMapping("/api/worklogs/{workLogCode}")
  public Map<String, Object> getOne(@PathVariable Long workLogCode,
                                   HttpSession session) {
    Map<String, Object> res = new HashMap<>();
    try {
      res.put("success", true);
      res.put("data", workLogService.getWorklog(workLogCode, session));
    } catch (Exception e) {
      res.put("success", false);
      res.put("message", e.getMessage());
    }
    return res;
  }

  @ResponseBody
  @PutMapping("/api/worklogs/{workLogCode}")
  public Map<String, Object> update(@PathVariable Long workLogCode,
                                   @RequestBody WorkLogVO vo,
                                   HttpSession session) {
    Map<String, Object> res = new HashMap<>();
    try {
      workLogService.updateWorklog(workLogCode, vo, session);
      res.put("success", true);
    } catch (Exception e) {
      res.put("success", false);
      res.put("message", e.getMessage());
    }
    return res;
  }

  @ResponseBody
  @DeleteMapping("/api/worklogs/{workLogCode}")
  public Map<String, Object> delete(@PathVariable Long workLogCode,
                                   HttpSession session) {
    Map<String, Object> res = new HashMap<>();
    try {
      workLogService.deleteWorklog(workLogCode, session);
      res.put("success", true);
    } catch (Exception e) {
      res.put("success", false);
      res.put("message", e.getMessage());
    }
    return res;
  }
  
  @GetMapping("/worklogStats")
  public String worklogStatsPage() {
      return "worklog/stats";
  }
  
  @ResponseBody
  @GetMapping("/api/worklogs/stats")
  public Map<String, Object> stats(
		  @RequestParam(defaultValue = "0") int includeType,
		  @RequestParam(defaultValue = "0") int includeWorker,
		  @RequestParam(defaultValue = "0") int includeIssue,

      @RequestParam(required = false) Long projectCode,
      @RequestParam(required = false) Long typeCode,
      @RequestParam(required = false) Integer workerCode,
      @RequestParam(required = false) String issueTitle,
      @RequestParam(required = false) String workTime,

      HttpSession session
  ) {
    Map<String, Object> res = new HashMap<>();
    try {
      List<Map<String, Object>> data = workLogService.getStats(
          includeType, includeWorker, includeIssue,
          projectCode, typeCode, workerCode, issueTitle, workTime,
          session
      );
      res.put("success", true);
      res.put("data", data);
    } catch (Exception e) {
      res.put("success", false);
      res.put("message", e.getMessage());
    }
    return res;
  }
}