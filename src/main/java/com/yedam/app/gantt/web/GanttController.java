package com.yedam.app.gantt.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.gantt.service.GanttService;
import com.yedam.app.gantt.service.GanttVO;
import com.yedam.app.login.service.UserVO;
import com.yedam.app.main.service.MainService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Controller
public class GanttController {

	private final GanttService ganttService;
	private final MainService mainService;

	@GetMapping("ganttData")
	@ResponseBody
	public Map<String, Object> ganttData(HttpSession session, GanttVO ganttVO) {

		UserVO user = (UserVO) session.getAttribute("user");
		Integer userCode = user.getUserCode();

		// 서비스에서 기본 gantt 데이터 가져오기
		List<GanttVO> ganttList = ganttService.getGanttList(userCode, ganttVO);

		// 관리자 프로젝트 목록
		List<Integer> adminProList = mainService.findAdminProByUserCode(userCode);

		// Map에 담기
		Map<String, Object> map = new HashMap<>();
		map.put("tasks", ganttList); // ⭐ gantt 데이터
		map.put("adminProjects", adminProList); // ⭐ 관리자 프로젝트

		return map;
	}

	@GetMapping("ganttChart")
	public String ganttList(HttpSession session, Model model) {
		return "gantt/list";
	}

}
