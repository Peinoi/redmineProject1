package com.yedam.app.auth.web;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.servlet.HandlerInterceptor;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.project.service.UserProjectAuthVO;
import com.yedam.app.auth.service.UriAccessInfoVO;
import com.yedam.app.auth.service.UriAccessService;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

	private final UriAccessService uriAccessService;
	private final AntPathMatcher pathMatcher = new AntPathMatcher();

	// URI 정보를 메모리에 캐싱 (성능 향상)
	private Map<String, UriAccessInfoVO> uriCache = new ConcurrentHashMap<>();

	@PostConstruct
	public void init() {
		// 애플리케이션 시작시 URI 정보 로드
		List<UriAccessInfoVO> uriList = uriAccessService.getAllUriAccessInfo();
		for (UriAccessInfoVO uri : uriList) {
			uriCache.put(uri.getUri(), uri);
		}
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {

		String requestUri = request.getRequestURI();

		System.out.println("========== 권한 체크 시작 ==========");
		System.out.println("요청 URI: " + requestUri);

		// 캐시 내용 확인
		System.out.println("========== URI 캐시 내용 ==========");
		/*
		 * for (Map.Entry<String, UriAccessInfoVO> entry : uriCache.entrySet()) {
		 * System.out.println("패턴: " + entry.getKey() + " -> 카테고리: " +
		 * entry.getValue().getCategory() + ", 타입: " + entry.getValue().getType()); }
		 */
		System.out.println("====================================");

		// 세션에서 사용자 정보 가져오기
		HttpSession session = request.getSession();
		UserVO user = (UserVO) session.getAttribute("user");

		// 권한 정보 가져오기
		@SuppressWarnings("unchecked")
		List<UserProjectAuthVO> userAuths = (List<UserProjectAuthVO>) session.getAttribute("userAuth");

		if (userAuths == null || userAuths.isEmpty()) {
			response.sendRedirect("/accessDenied");
			return false;
		}

		// 해당 URI의 접근 정보 찾기
		UriAccessInfoVO uriInfo = findMatchingUri(requestUri);

		// 매칭 결과 확인
		if (uriInfo == null) {
			// System.out.println("⚠️ 매칭되는 URI 패턴을 찾지 못함!");
			// System.out.println("========== 권한 체크 종료 (패턴 없음) ==========");
			return true; // ❌ 문제: 매칭 안 되면 통과시킴!
		}

		/*
		 * System.out.println("매칭된 URI: " + uriInfo.getUri());
		 * System.out.println("카테고리: " + uriInfo.getCategory());
		 * System.out.println("권한 타입: " + uriInfo.getType());
		 */

		// 사용자의 해당 카테고리 권한 찾기
		UserProjectAuthVO userAuth = findUserAuthByCategory(userAuths, uriInfo.getCategory());

		// 해당 카테고리에 대한 권한이 없으면 거부
		if (userAuth == null) {
			System.out.println("해당 카테고리의 권한 없음!");
			response.sendRedirect("/accessDenied");
			return false;
		}

		// 권한 체크
		boolean hasPermission = checkPermission(uriInfo.getType(), userAuth);
		System.out.println("권한 체크 결과: " + hasPermission);
		System.out.println("========== 권한 체크 종료 ==========");

		if (!hasPermission) {
			response.sendRedirect("/accessDenied");
			return false;
		}

		return true;
	}

	// URI 패턴 매칭
	private UriAccessInfoVO findMatchingUri(String requestUri) {
		System.out.println("🔍 매칭 시도 URI: " + requestUri);
		System.out.println("📋 캐시된 패턴 목록:");

		for (Map.Entry<String, UriAccessInfoVO> entry : uriCache.entrySet()) {
			String pattern = entry.getKey();
			boolean matches = pathMatcher.match(pattern, requestUri);
			System.out.println("  - 패턴: " + pattern + " → 매칭: " + matches);

			if (matches) {
				System.out.println("✅ 매칭 성공!");
				return entry.getValue();
			}
		}

		System.out.println("❌ 매칭되는 패턴 없음");
		return null;
	}

	// 카테고리로 사용자 권한 찾기
	private UserProjectAuthVO findUserAuthByCategory(List<UserProjectAuthVO> userAuths, String category) {

		for (UserProjectAuthVO auth : userAuths) {
			if (auth.getCategory().equals(category)) {
				return auth;
			}
		}
		return null;
	}

	// 권한 체크
	private boolean checkPermission(String type, UserProjectAuthVO userAuth) {
		switch (type) {
		case "read":
			return "Y".equals(userAuth.getRdRol());
		case "write":
			return "Y".equals(userAuth.getWrRol());
		case "modify":
			return "Y".equals(userAuth.getMoRol());
		case "delete":
			return "Y".equals(userAuth.getDelRol());
		default:
			return false;
		}
	}
}