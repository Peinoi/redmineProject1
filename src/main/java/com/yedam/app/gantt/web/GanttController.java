package com.yedam.app.gantt.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.gantt.service.GanttService;
import com.yedam.app.gantt.service.GanttVO;
import com.yedam.app.gantt.service.SearchVO;
import com.yedam.app.login.service.UserVO;
import com.yedam.app.main.service.MainService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Controller
public class GanttController {

	private final GanttService ganttService;
	private final MainService mainService;

	// 검색조건 필터
	@GetMapping("searchList")
	public String searchList(SearchVO searchVO,
			@RequestParam(required = false, defaultValue = "gantt/list") String view, Model model,
			HttpSession session) {

		// 로그인 사용자 정보
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return "login/login";

		Integer userCode = user.getUserCode();

		// 본인이 관리자인 프로젝트 목록
		List<Integer> adminProList = mainService.findAdminProByUserCode(userCode);

		// 하나라도 있으면 관리자
		boolean isAdmin = adminProList != null && !adminProList.isEmpty();

		model.addAttribute("projectCode", searchVO.getProjectCode());
		model.addAttribute("adminProjectList", adminProList != null ? adminProList : List.of());
		model.addAttribute("isAdmin", isAdmin);
		
		return view;
	}

	// 간트차트 데이터 조회
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

	// 간트차트 페이지
	@GetMapping("ganttChart")
	public String ganttList(HttpSession session, Model model) {

		// 로그인 사용자 정보
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null) {
			return "login/login"; // 로그인 안 되어 있으면 로그인 페이지로
		}
		
		Integer userCode = user.getUserCode();

	    List<Integer> adminProList =
	            mainService.findAdminProByUserCode(userCode);

	    boolean isAdmin =
	            adminProList != null && !adminProList.isEmpty();

	    model.addAttribute("adminProjectList",
	            adminProList != null ? adminProList : List.of());
	    model.addAttribute("isAdmin", isAdmin);
	    
		return "gantt/list";
	}

}
