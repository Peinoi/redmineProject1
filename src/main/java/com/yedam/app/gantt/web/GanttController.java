package com.yedam.app.gantt.web;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.yedam.app.gantt.service.GanttService;
import com.yedam.app.gantt.service.GanttVO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Controller
public class GanttController {
	
	private final GanttService ganttService;
	
	@GetMapping("ganttList")
	public String ganttList(Model model) {
		List<GanttVO> list = ganttService.findAll();
		model.addAttribute("gantt", list);
		return "gantt/list";
	}
}
