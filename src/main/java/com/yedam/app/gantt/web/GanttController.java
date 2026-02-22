package com.yedam.app.gantt.web;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.gantt.service.GanttService;
import com.yedam.app.gantt.service.GanttVO;
import com.yedam.app.login.service.UserVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Controller
public class GanttController {

	private final GanttService ganttService;

	@GetMapping("ganttData")
	@ResponseBody
	public List<GanttVO> ganttData(HttpSession session, GanttVO ganttVO) {
		UserVO user = (UserVO) session.getAttribute("user");
		Integer userCode = user.getUserCode();
		return ganttService.getGanttList(userCode, ganttVO);
	}

	@GetMapping("ganttChart")
	public String ganttList() {

		return "gantt/list";
	}

}
