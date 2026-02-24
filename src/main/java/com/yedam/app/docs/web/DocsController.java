package com.yedam.app.docs.web;

import java.util.ArrayList;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.yedam.app.docs.service.DocsService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class DocsController {

	private final DocsService docsService;

	// 문서 화면
	@GetMapping("docs")
	public String docs(Model model) {
		model.addAttribute("documentList", new ArrayList<>()); // 임시 빈 리스트
		model.addAttribute("projectList", new ArrayList<>()); // 프로젝트 선택용
		model.addAttribute("folderList", new ArrayList<>()); // 폴더 선택용
		// model.addAttribute("paging", null); // 페이지네이션은 임시로 제외
		return "docs/list";
	}

	// 등록 화면
	@GetMapping("docsInsert")
	public String docsInsert() {
		return "docs/insert";
	}
}
