package com.yedam.app.main.web;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.main.service.MainProjectStatusVO;
import com.yedam.app.main.service.MainService;

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
		List<MainProjectStatusVO> proIssList = mainService.findProIssSta(userCode);
		
		model.addAttribute("statusListCnt", listCnt);
		model.addAttribute("ProIssStatusList", proIssList);
		
		return "main/main";
	}
}
