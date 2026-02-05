package com.yedam.app.common.advice;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import jakarta.servlet.http.HttpServletRequest;

@ControllerAdvice
public class SidebarAdvice {

	@ModelAttribute
	public void addSidebarInfo(Model model, HttpServletRequest request) {
		
		// URI 가져오기
		String uri = request.getRequestURI();

		// 프로젝트 영역: 프로젝트 목록(/projects) 또는 프로젝트 관련 페이지들
		// 여기에 추가해야 추가 사이드 메뉴들이 보인다
		// 아래는 임의의 페이지들이니 변경바람
        boolean inProjectArea =
                uri.equals("/projects")
             || uri.startsWith("/projects/")
             || uri.equals("/issueList")
             || uri.equals("/kanbanboard")
             || uri.equals("/ganttChart")
             || uri.equals("/")
             || uri.equals("/noticeList")
             || uri.equals("/")
             || uri.equals("/projects");

        model.addAttribute("inProjectArea", inProjectArea);
	}
}
