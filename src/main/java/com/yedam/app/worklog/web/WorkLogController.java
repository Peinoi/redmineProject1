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
  public String page(Model model) {
    return "worklog/list";
  }

  @ResponseBody
  @GetMapping("/api/worklogs")
  public Map<String, Object> list(@RequestParam(required = false) String from,
                                 @RequestParam(required = false) String to) {
    Map<String, Object> res = new HashMap<>();
    List<Map<String, Object>> data = workLogService.listWorklogs(from, to);
    res.put("success", true);
    res.put("data", data);
    return res;
  }

  @ResponseBody
  @GetMapping("/api/worklogs/prefill")
  public Map<String, Object> prefill(@RequestParam("issueCode") Long issueCode,
                                     HttpSession session) {
    Map<String, Object> res = new HashMap<>();
    Map<String, Object> data = workLogService.getPrefill(issueCode, session);
    res.put("success", true);
    res.put("data", data);
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
      return res;
    } catch (Exception e) {
      res.put("success", false);
      res.put("message", e.getMessage());
      return res;
    }
  }
}