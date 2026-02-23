package com.yedam.app.auth.web;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.servlet.HandlerInterceptor;

import com.yedam.app.auth.service.UriAccessInfoVO;
import com.yedam.app.auth.service.UriAccessService;
import com.yedam.app.login.service.UserVO;
import com.yedam.app.project.service.UserProjectAuthVO;
import com.yedam.app.usermgr.service.UsermgrService;

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
	private final UsermgrService usermgrService;
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

		// 1. 제외할 공통 리소스 체크 (필요시 추가)
		if (requestUri.startsWith("/css") || requestUri.startsWith("/js") || requestUri.equals("/accessDenied")) {
			return true;
		}

		// 2. 해당 URI가 권한 체크가 필요한 '관리 대상'인지 먼저 확인
		UriAccessInfoVO uriInfo = findMatchingUri(requestUri);

		// DB(URI_ACCESS_INFO 테이블)에 등록되지 않은 URI는 권한 체크 없이 통과
		if (uriInfo == null) {
			return true;
		}

		// 3. 권한 체크가 필요한 URI인데 세션에 권한 정보가 없는 경우
		HttpSession session = request.getSession();
		
	    UserVO user = (UserVO) session.getAttribute("user"); // 세션에서 유저 객체 꺼내기

	    if (user != null && user.getSysCk().equals("Y")) {
	        System.out.println("관리자 접근 허용: " + requestUri);
	        return true;
	    }
		
		
		@SuppressWarnings("unchecked")
		List<UserProjectAuthVO> userAuths = (List<UserProjectAuthVO>) session.getAttribute("userAuth");

		// 권한 데이터가 아예 없으면 (프로젝트 미소속 등) 차단
		if (userAuths == null || userAuths.isEmpty()) {
			System.out.println("권한이 필요한 페이지이나 사용자의 권한 정보가 전혀 없음!");
			response.sendRedirect("/accessDenied");
			return false;
		}

		// 4. 사용자의 해당 카테고리 권한 찾기
		UserProjectAuthVO userAuth = findUserAuthByCategory(userAuths, uriInfo.getCategory());
		UserVO findUser = usermgrService.userFindInfo(userAuth.getUserCode());
		if (userAuth == null) {
			System.out.println("해당 카테고리에 대한 권한이 없음!");
			response.sendRedirect("/accessDenied");
			return false;
		}

		// 5. 상세 권한(읽기/쓰기 등) 체크
		boolean hasPermission = checkPermission(uriInfo.getType(), userAuth,findUser);

		if (!hasPermission) {
			String contentType = request.getHeader("Content-Type");
			if (contentType != null && contentType.contains("application/json")) {
			    response.sendError(HttpServletResponse.SC_FORBIDDEN, "접근 권한이 없습니다.");
			} else {
			    response.sendRedirect("/accessDenied");
			}
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
	private boolean checkPermission(String type, UserProjectAuthVO userAuth, UserVO userVO) {
	
		if(userVO.getSysCk().equals('Y')) {
			return true;
		}
		
		// admin이면 모든 권한 허용
	    if (userAuth.getAdmin() == 1) {
	        return true;
	    }
		
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