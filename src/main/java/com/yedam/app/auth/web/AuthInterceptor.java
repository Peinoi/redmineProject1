package com.yedam.app.auth.web;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.servlet.HandlerInterceptor;

import com.yedam.app.auth.service.UriAccessInfoVO;
import com.yedam.app.auth.service.UriAccessService;
import com.yedam.app.login.service.UserVO;
import com.yedam.app.project.service.ProjectService;
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
	private final ProjectService projectService;

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

		if (requestUri.startsWith("/css") || requestUri.startsWith("/js") || requestUri.equals("/accessDenied")) {
			return true;
		}

		UriAccessInfoVO uriInfo = findMatchingUri(requestUri);
		if (uriInfo == null)
			return true;

		HttpSession session = request.getSession();
		UserVO user = (UserVO) session.getAttribute("user");

		if (user == null) {
			response.sendRedirect("/login");
			return false;
		}

		if ("Y".equals(user.getSysCk()))
			return true;

		// DB에서 최신 권한 조회 (프로젝트코드 포함)
		List<UserProjectAuthVO> userAuths = projectService.getUserProjectAuthAll(user.getUserCode());

		if (userAuths == null || userAuths.isEmpty()) {
			response.sendRedirect("/accessDenied");
			return false;
		}

		// 현재 프로젝트 컨텍스트
		@SuppressWarnings("unchecked")
		Map<String, Object> currentProject = (Map<String, Object>) session.getAttribute("currentProject");

		Integer currentProjectCode = currentProject != null ? (Integer) currentProject.get("projectCode") : null;

		// 유효 권한 계산
		UserProjectAuthVO effectiveAuth = resolveEffectiveAuth(userAuths, uriInfo.getCategory(), currentProjectCode);

		if (effectiveAuth == null) {
			response.sendRedirect("/accessDenied");
			return false;
		}

		boolean hasPermission = checkPermission(uriInfo.getType(), effectiveAuth, user);
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

	// 프로젝트 컨텍스트 고려한 권한 결정
	private UserProjectAuthVO resolveEffectiveAuth(List<UserProjectAuthVO> userAuths, String category,
			Integer currentProjectCode) {

		List<UserProjectAuthVO> targets;

		if (currentProjectCode != null) {
			// 프로젝트 컨텍스트 있음 → 해당 프로젝트 권한만
			targets = userAuths.stream()
					.filter(a -> category.equals(a.getCategory()) && currentProjectCode.equals(a.getProjectCode()))
					.collect(Collectors.toList());
		} else {
			// 컨텍스트 없음 → 전체 프로젝트 권한 유니온
			targets = userAuths.stream().filter(a -> category.equals(a.getCategory())).collect(Collectors.toList());
		}

		if (targets.isEmpty())
			return null;

		return mergeAuths(targets);
	}

	// Y 우선 유니온 합산
	private UserProjectAuthVO mergeAuths(List<UserProjectAuthVO> auths) {
		UserProjectAuthVO merged = new UserProjectAuthVO();
		merged.setRdRol(auths.stream().anyMatch(a -> "Y".equals(a.getRdRol())) ? "Y" : "N");
		merged.setWrRol(auths.stream().anyMatch(a -> "Y".equals(a.getWrRol())) ? "Y" : "N");
		merged.setMoRol(auths.stream().anyMatch(a -> "Y".equals(a.getMoRol())) ? "Y" : "N");
		merged.setDelRol(auths.stream().anyMatch(a -> "Y".equals(a.getDelRol())) ? "Y" : "N");
		merged.setAdmin(auths.stream().anyMatch(a -> a.getAdmin() == 1) ? 1 : 0);
		merged.setUserCode(auths.get(0).getUserCode());
		return merged;
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
				UriAccessInfoVO matched = entry.getValue();
				System.out.println("✅ 매칭 성공!");
				System.out.println("   ├─ URI 패턴  : " + matched.getUri());
				System.out.println("   ├─ 카테고리  : " + matched.getCategory());
				System.out.println("   └─ 필요 권한 : [" + matched.getType() + "]");
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

		if ("Y".equals(userVO.getSysCk())) {
			System.out.println("관리자 → 모든 권한 허용");
			return true;
		}

		// 마스터이면 모든 권한 허용
		if (userAuth.getAdmin() == 1) {
			System.out.println("마스터권한 → 모든 권한 허용");
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
		case "admin":
			return "Y".equals(userVO.getSysCk());
		default:
			return false;
		}
	}
}