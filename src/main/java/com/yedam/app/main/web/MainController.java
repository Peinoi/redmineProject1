package com.yedam.app.main.web;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.main.service.AssigneeIssStaVO;
import com.yedam.app.main.service.MainHolidayDTO;
import com.yedam.app.main.service.MainProjectStatusVO;
import com.yedam.app.main.service.MainService;
import com.yedam.app.main.service.MyTopIssueVO;
import com.yedam.app.main.service.PickedIssueDTO;
import com.yedam.app.main.service.ProIssStaVO;
import com.yedam.app.main.util.Authz;
import com.yedam.app.mypage.service.MyNoticeDTO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class MainController {

	private final MainService mainService;

	@GetMapping("G2main")
	public String G2main(HttpSession session, Model model) {
	    UserVO user = (UserVO) session.getAttribute("user");
	    session.removeAttribute("currentProject");
	    if (user == null) return "login/login";

	    int limit = 8;
	    Integer userCode = user.getUserCode();

	    // ✅ 기존 데이터 조회
	    List<ProIssStaVO> proIssList = mainService.findProIssSta(userCode);
	    List<MyNoticeDTO> recentNotices = mainService.findRecentNoticesForMain(userCode, limit);

	    // ✅ 권한 필터링 (sys면 전부 통과)
	    if (!"Y".equalsIgnoreCase(user.getSysCk())) {

	        // 1) 프로젝트/일감현황은 "프로젝트 읽기" 가능한 프로젝트만
	        var readableProjects = Authz.readableProjects(session);
	        proIssList = (proIssList == null ? List.<ProIssStaVO>of() : proIssList).stream()
	                .filter(v -> readableProjects.contains(v.getProjectCode()))
	                .toList();

	        // ✅ 2) 공지는 "공지 읽기" 가능한 것만 (프로젝트 rdRol gate 포함됨)
	        recentNotices = (recentNotices == null ? List.<MyNoticeDTO>of() : recentNotices).stream()
	                .filter(n -> Authz.canRead(session, n.getProjectCode(), Authz.CAT_NOTICE))
	                .toList();
	    }

	    // ✅ admin 프로젝트 목록(배지용)
	    var adminSet = Authz.adminProjects(session);
	    List<Integer> adminProList;
	    if ("Y".equalsIgnoreCase(user.getSysCk())) {
	        adminProList = proIssList.stream().map(ProIssStaVO::getProjectCode).distinct().toList();
	    } else {
	        adminProList = adminSet.stream().toList();
	    }

	    model.addAttribute("ProIssStatusList", proIssList != null ? proIssList : List.of());
	    model.addAttribute("adminProjectList", adminProList != null ? adminProList : List.of());
	    model.addAttribute("noticeList", recentNotices != null ? recentNotices : List.of());

	    model.addAttribute("todayProgressRate", 0);
	    model.addAttribute("statusListCnt", List.of());
	    return "main/main";
	}

	// ✅ 프로젝트 현황(도넛 차트) AJAX
	@GetMapping("/api/main/statusCnt")
	@ResponseBody
	public List<MainProjectStatusVO> statusCnt(HttpSession session) {
	    UserVO user = (UserVO) session.getAttribute("user");
	    if (user == null) return List.of();

	    // sys는 전부 admin 취급 → 그대로 전체 집계(원하면 여기에도 동일 규칙 적용 가능)
	    if ("Y".equalsIgnoreCase(user.getSysCk())) {
	        return mainService.findCodeNameCnt(user.getUserCode());
	    }

	    var readableProjects = Authz.readableProjects(session);
	    var adminProjects    = Authz.adminProjects(session);

	    return mainService.findCodeNameCntByProjects(readableProjects, adminProjects);
	}

	// ✅ 전체 진행률 AJAX
	@GetMapping("/api/main/todayProgressRate")
	@ResponseBody
	public Map<String, Object> todayProgressRate(HttpSession session) {
	    UserVO user = (UserVO) session.getAttribute("user");
	    if (user == null) return Map.of("ok", false, "rate", 0);

	    int rate;

	    if ("Y".equalsIgnoreCase(user.getSysCk())) {
	        rate = mainService.findTodayProgressRate(user.getUserCode());
	    } else {
	        var readableProjects = Authz.readableProjects(session);
	        rate = mainService.findTodayProgressRate(user.getUserCode(), readableProjects);
	    }

	    if (rate < 0) rate = 0;
	    if (rate > 100) rate = 100;

	    return Map.of("ok", true, "rate", rate);
	}

	@GetMapping("/G2main/{projectCode}/issuesStatus")
	public String issStaByproject(@PathVariable Integer projectCode, HttpSession session, Model model) {

		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return "login/login";

		Integer userCode = user.getUserCode();

		// ✅ 읽기 권한 없으면 차단 (중요)
		if (!Authz.canRead(session, projectCode, Authz.CAT_ISSUE)) {
			return "redirect:/G2main"; // 또는 403 페이지
		}

		boolean isAdmin = Authz.isAdmin(session, projectCode);

		List<AssigneeIssStaVO> assIssStaList;
		if (isAdmin) {
			assIssStaList = mainService.findAssIssSta(projectCode);
		} else {
			assIssStaList = mainService.findMyAssIssSta(projectCode, userCode);
		}

		List<MyTopIssueVO> topIssueList = List.of();
		if (!isAdmin) {
			topIssueList = mainService.findMyTopIssues(projectCode, userCode);
		}

		String projectName = mainService.findProjectName(projectCode);

		model.addAttribute("projectName", projectName);
		model.addAttribute("AssIssStaList", assIssStaList);
		model.addAttribute("isAdmin", isAdmin);
		model.addAttribute("projectCode", projectCode);
		model.addAttribute("topIssueList", topIssueList);

		return "main/issuesStatus";
	}

	@GetMapping("/api/main/issuesStatus/picked")
	@ResponseBody
	public List<PickedIssueDTO> pickedIssues(@RequestParam Integer projectCode,
			@RequestParam(required = false) Integer assigneeCode, @RequestParam(required = false) String statusId,
			@RequestParam(defaultValue = "50") int limit, HttpSession session) {

		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return List.of();

		if (!Authz.canRead(session, projectCode, Authz.CAT_ISSUE)) {
			return List.of(); // 또는 403 응답
		}

		boolean isAdmin = Authz.isAdmin(session, projectCode);

		if (limit <= 0)
			limit = 50;
		if (limit > 200)
			limit = 200;

		return mainService.findPickedIssues(projectCode, assigneeCode, statusId, user.getUserCode(), isAdmin, limit);
	}

	@GetMapping("/api/main/memos")
	@ResponseBody
	public List<com.yedam.app.main.service.MainMemoDTO> memosByMonth(@RequestParam String month, // "YYYY-MM"
			HttpSession session) {
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return List.of();
		return mainService.findMemosByMonth(user.getUserCode(), month);
	}

	@GetMapping("/api/main/memos/day")
	@ResponseBody
	public com.yedam.app.main.service.MainMemoDTO memoByDay(@RequestParam String date, // "YYYY-MM-DD"
			HttpSession session) {
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return null;
		return mainService.findMemoByDate(user.getUserCode(), date);
	}

	@PostMapping("/api/main/memos")
	@ResponseBody
	public ResponseEntity<?> saveMemo(@org.springframework.web.bind.annotation.RequestBody Map<String, String> body,
			HttpSession session) {
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return ResponseEntity.status(401).body(Map.of("ok", false));

		String date = body.get("date"); // "YYYY-MM-DD"
		String content = body.get("content");

		if (date == null || date.isBlank()) {
			return ResponseEntity.badRequest().body(Map.of("ok", false, "msg", "date required"));
		}

		mainService.saveMemo(user.getUserCode(), date, content);
		return ResponseEntity.ok(Map.of("ok", true));
	}

	@DeleteMapping("/api/main/memos")
	@ResponseBody
	public ResponseEntity<?> deleteMemo(@RequestParam String date, // "YYYY-MM-DD"
			HttpSession session) {
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return ResponseEntity.status(401).body(Map.of("ok", false));

		if (date == null || date.isBlank()) {
			return ResponseEntity.badRequest().body(Map.of("ok", false, "msg", "date required"));
		}

		boolean deleted = mainService.removeMemo(user.getUserCode(), date);
		return ResponseEntity.ok(Map.of("ok", true, "deleted", deleted));
	}
	
	@GetMapping("/api/main/holidays")
	@ResponseBody
	public List<MainHolidayDTO> holidaysByMonth(
	    @RequestParam String month, // "YYYY-MM"
	    HttpSession session
	) {
	  UserVO user = (UserVO) session.getAttribute("user");
	  if (user == null) return List.of();
	  return mainService.findHolidaysByMonth(month);
	}
}
