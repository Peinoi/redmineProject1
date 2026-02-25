package com.yedam.app.common.web;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.yedam.app.common.service.CommonService;
import com.yedam.app.common.service.CommonVO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Controller
public class CommonController {
	
	private final CommonService commonService;
	
	@GetMapping("/")
	public String home() {
		return "redirect:/G2main";
	}
	
	@GetMapping("empList")
	public String empList(Model model) {
		List<CommonVO> findVO = commonService.findAll();
		model.addAttribute("list", findVO);
		return "ex/empList";
	}
}
