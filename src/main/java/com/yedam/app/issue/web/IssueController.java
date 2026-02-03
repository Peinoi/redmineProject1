package com.yedam.app.issue.web;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.yedam.app.issue.service.IssueService;
import com.yedam.app.issue.service.IssueVO;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class IssueController {

	private final IssueService issueService;
	
	@GetMapping("issueList")
	public String issueList(Model model) {
		List<IssueVO> findVO = issueService.findAll();
		model.addAttribute("list", findVO);
		return "issue/list";
	}
	
}
