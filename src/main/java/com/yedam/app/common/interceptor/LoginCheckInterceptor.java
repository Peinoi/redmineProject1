package com.yedam.app.common.interceptor;

import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

public class LoginCheckInterceptor implements HandlerInterceptor {

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {
		
		// 세션 없으면 새로 안 만들게 false
		HttpSession session = request.getSession(false);
		
		// 로그인 정보 가져오기
		Object user = (session == null) ? null : session.getAttribute("user");
		
		// 로그인 안 한 경우 로그인 페이지로 이동
		if (user == null) {
			response.sendRedirect("/login");
			return false;
		}
		
		return true;
	}

}
