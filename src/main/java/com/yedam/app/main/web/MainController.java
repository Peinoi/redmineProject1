package com.yedam.app.main.web;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.main.service.AssigneeIssStaVO;
import com.yedam.app.main.service.MainProjectStatusVO;
import com.yedam.app.main.service.MainService;
import com.yedam.app.main.service.MyTopIssueVO;
import com.yedam.app.main.service.ProIssStaVO;
import com.yedam.app.mypage.service.MyNoticeDTO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class MainController {

	private final MainService mainService;
	
	@GetMapping("G2main")
	public String G2main(HttpSession session
						,Model model) {
		UserVO user = (UserVO) session.getAttribute("user");
		
		if(user == null) {
			return "login/login";
		}
		
		Integer userCode = user.getUserCode();
		
		List<MainProjectStatusVO> listCnt = mainService.findCodeNameCnt(userCode);
		List<ProIssStaVO> proIssList = mainService.findProIssSta(userCode);
		List<Integer> adminProList = mainService.findAdminProByUserCode(userCode);
		Integer todayProRate = mainService.findTodayProgressRate(userCode);
		
		int limit = 8;
		List<MyNoticeDTO> recentNotices = mainService.findRecentNoticesForMain(userCode, limit);
		
		model.addAttribute("statusListCnt", listCnt != null ? listCnt : List.of());
	    model.addAttribute("ProIssStatusList", proIssList != null ? proIssList : List.of());
	    model.addAttribute("adminProjectList", adminProList != null ? adminProList : List.of());
	    model.addAttribute("todayProgressRate", todayProRate != null ? todayProRate : 0);
	    model.addAttribute("noticeList", recentNotices != null ? recentNotices : List.of());
		
		return "main/main";
	}
	
	@GetMapping("/G2main/{projectCode}/issuesStatus")
	public String issStaByproject(@PathVariable Integer projectCode
								 ,HttpSession session
								 ,Model model) {
		
		Integer userCode = ((UserVO) session.getAttribute("user")).getUserCode();
		
		boolean isAdmin = mainService.findIsAdminInProject(userCode, projectCode);
		
		// 프로젝트 담당자별 일감현황 조회
		List<AssigneeIssStaVO> assIssStaList;
		if(isAdmin) {
			// 관리자: 프로젝트 담당자별(전체)
			assIssStaList = mainService.findAssIssSta(projectCode);
		} else {
			assIssStaList = mainService.findMyAssIssSta(projectCode, userCode);
		}
		
		List<MyTopIssueVO> topIssueList = List.of();
		if (!isAdmin) {
		  topIssueList = mainService.findMyTopIssues(projectCode, userCode);
		}
		
		model.addAttribute("AssIssStaList", assIssStaList);
		model.addAttribute("isAdmin", isAdmin);
	    model.addAttribute("projectCode", projectCode);
	    model.addAttribute("topIssueList", topIssueList);
		
		return "main/issuesStatus";
	}
}
