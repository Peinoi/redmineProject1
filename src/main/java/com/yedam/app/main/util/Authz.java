package com.yedam.app.main.util;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import com.yedam.app.project.service.UserProjectAuthVO;

import jakarta.servlet.http.HttpSession;

/**
 * 프로젝트/카테고리 권한 체크 유틸
 * - 세션의 userAuth(List<UserProjectAuthVO>) 기반
 * - 프로젝트 rdRol을 게이트(전제조건)로 사용
 */
public class Authz {

	// ===== 카테고리 상수 =====
	public static final String CAT_PROJECT = "프로젝트";
	public static final String CAT_NOTICE = "공지";
	public static final String CAT_ISSUE = "일감";
	public static final String CAT_DOC = "문서";
	public static final String CAT_KANBAN = "칸반";
	public static final String CAT_GANTT = "간트";
	public static final String CAT_COMMENT = "댓글";
	public static final String CAT_ROLE = "역할";
	public static final String CAT_TYPE = "일감유형";
	public static final String CAT_TIME = "소요시간";
	public static final String CAT_USER = "사용자";
	public static final String CAT_GROUP = "그룹";

	private Authz() {}

	/** 시스템 관리자 여부 */
	public static boolean isSys(HttpSession session) {
		var user = (com.yedam.app.login.service.UserVO) session.getAttribute("user");
		return user != null && "Y".equalsIgnoreCase(user.getSysCk());
	}

	/** 세션에 저장된 권한 목록 반환 */
	@SuppressWarnings("unchecked")
	public static List<UserProjectAuthVO> authList(HttpSession session) {
		Object obj = session.getAttribute("userAuth");
		if (obj instanceof List<?> list) {
			return (List<UserProjectAuthVO>) list;
		}
		return List.of();
	}

	/** 특정 프로젝트의 권한 정보 1건 조회 */
	public static Optional<UserProjectAuthVO> authOf(HttpSession session, Integer projectCode) {
		if (projectCode == null) return Optional.empty();
		return authList(session).stream()
				.filter(a -> projectCode.equals(a.getProjectCode()))
				.findFirst();
	}

	/** 프로젝트 관리자 여부 (sys 포함) */
	public static boolean isAdmin(HttpSession session, Integer projectCode) {
		if (isSys(session)) return true;

		// 프로젝트 내 어떤 카테고리든 admin=1이면 전체 admin 처리
		return authList(session).stream()
				.anyMatch(a -> projectCode.equals(a.getProjectCode())
						&& a.getAdmin() != null && a.getAdmin() == 1);
	}

	/**
	 * 같은 프로젝트 + 같은 카테고리 권한을 병합
	 * (그룹/직접권한 등 여러 행을 OR 방식으로 합침)
	 */
	private static UserProjectAuthVO mergeAuth(HttpSession session, Integer projectCode, String category) {
		if (projectCode == null || category == null) return null;

		UserProjectAuthVO merged = null;

		for (var a : authList(session)) {
			if (!projectCode.equals(a.getProjectCode())) continue;
			if (!category.equals(a.getCategory())) continue;

			if (merged == null) {
				merged = new UserProjectAuthVO();
				merged.setProjectCode(projectCode);
				merged.setCategory(category);
				merged.setAdmin(0);
				merged.setRdRol("N");
				merged.setWrRol("N");
				merged.setMoRol("N");
				merged.setDelRol("N");
			}

			// 하나라도 Y면 Y
			if (a.getAdmin() != null && a.getAdmin() == 1) merged.setAdmin(1);
			if ("Y".equalsIgnoreCase(a.getRdRol())) merged.setRdRol("Y");
			if ("Y".equalsIgnoreCase(a.getWrRol())) merged.setWrRol("Y");
			if ("Y".equalsIgnoreCase(a.getMoRol())) merged.setMoRol("Y");
			if ("Y".equalsIgnoreCase(a.getDelRol())) merged.setDelRol("Y");
		}

		return merged;
	}

	/** 읽기 권한 체크 (프로젝트 rdRol 게이트 적용) */
	public static boolean canRead(HttpSession session, Integer projectCode, String category) {
		if (isSys(session)) return true;
		if (isAdmin(session, projectCode)) return true;

		// 프로젝트 읽기 권한이 전제조건
		var proj = mergeAuth(session, projectCode, CAT_PROJECT);
		if (proj == null || !"Y".equalsIgnoreCase(proj.getRdRol())) {
			return false;
		}

		// 프로젝트 자체 읽기
		if (CAT_PROJECT.equals(category)) return true;

		// 각 카테고리 rdRol 체크
		var a = mergeAuth(session, projectCode, category);
		return a != null && "Y".equalsIgnoreCase(a.getRdRol());
	}

	/** 쓰기 권한 체크 */
	public static boolean canWrite(HttpSession session, Integer projectCode, String category) {
		if (isSys(session)) return true;
		if (isAdmin(session, projectCode)) return true;

		var proj = mergeAuth(session, projectCode, CAT_PROJECT);
		if (proj == null || !"Y".equalsIgnoreCase(proj.getRdRol())) return false;

		var a = mergeAuth(session, projectCode, category);
		return a != null && "Y".equalsIgnoreCase(a.getWrRol());
	}

	/** 수정 권한 체크 */
	public static boolean canModify(HttpSession session, Integer projectCode, String category) {
		if (isSys(session)) return true;
		if (isAdmin(session, projectCode)) return true;

		var proj = mergeAuth(session, projectCode, CAT_PROJECT);
		if (proj == null || !"Y".equalsIgnoreCase(proj.getRdRol())) return false;

		var a = mergeAuth(session, projectCode, category);
		return a != null && "Y".equalsIgnoreCase(a.getMoRol());
	}

	/** 삭제 권한 체크 */
	public static boolean canDelete(HttpSession session, Integer projectCode, String category) {
		if (isSys(session)) return true;
		if (isAdmin(session, projectCode)) return true;

		var proj = mergeAuth(session, projectCode, CAT_PROJECT);
		if (proj == null || !"Y".equalsIgnoreCase(proj.getRdRol())) return false;

		var a = mergeAuth(session, projectCode, category);
		return a != null && "Y".equalsIgnoreCase(a.getDelRol());
	}

	/** admin 권한을 가진 프로젝트 목록 */
	public static Set<Integer> adminProjects(HttpSession session) {
		if (isSys(session)) return Set.of();

		Set<Integer> set = new HashSet<>();
		for (var a : authList(session)) {
			if (a.getProjectCode() != null && a.getAdmin() != null && a.getAdmin() == 1) {
				set.add(a.getProjectCode());
			}
		}
		return set;
	}

	/** 읽기 가능한 프로젝트 목록 (admin + 프로젝트 rdRol=Y) */
	public static Set<Integer> readableProjects(HttpSession session) {
		if (isSys(session)) return Set.of();

		Set<Integer> set = new HashSet<>();

		// admin 프로젝트
		for (var a : authList(session)) {
			if (a.getProjectCode() != null && a.getAdmin() != null && a.getAdmin() == 1) {
				set.add(a.getProjectCode());
			}
		}

		// 프로젝트 카테고리 rdRol=Y
		for (var a : authList(session)) {
			if (a.getProjectCode() == null) continue;
			if (!CAT_PROJECT.equals(a.getCategory())) continue;
			if ("Y".equalsIgnoreCase(a.getRdRol())) {
				set.add(a.getProjectCode());
			}
		}

		return set;
	}

	/** 권한 목록에 존재하는 프로젝트 코드 전체 */
	public static Set<Integer> projectCodesInAuth(HttpSession session) {
		return authList(session).stream()
				.map(UserProjectAuthVO::getProjectCode)
				.filter(pc -> pc != null)
				.collect(Collectors.toSet());
	}

	/** 특정 카테고리를 읽을 수 있는 프로젝트 목록 */
	public static Set<Integer> readableProjectsByCategory(HttpSession session, String category) {
		if (isSys(session)) return Set.of();

		Set<Integer> set = new HashSet<>();
		for (Integer pc : projectCodesInAuth(session)) {
			if (canRead(session, pc, category)) {
				set.add(pc);
			}
		}
		return set;
	}

	/** 사용자 페이지 접근 가능 여부 (사용자 카테고리 read 기준) */
	public static boolean canReadUserPage(HttpSession session) {
		if (isSys(session)) return true;
		return !readableProjectsByCategory(session, CAT_USER).isEmpty();
	}

	/** 특정 카테고리를 수정할 수 있는 프로젝트 목록 */
	public static Set<Integer> editableProjectsByCategory(HttpSession session, String category) {
		if (isSys(session)) return Set.of();

		Set<Integer> set = new HashSet<>();
		for (Integer pc : projectCodesInAuth(session)) {
			if (canModify(session, pc, category)) {
				set.add(pc);
			}
		}
		return set;
	}
}