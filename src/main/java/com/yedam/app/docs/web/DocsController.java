package com.yedam.app.docs.web;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.yedam.app.docs.service.DocsService;
import com.yedam.app.docs.service.DocsVO;
import com.yedam.app.login.service.UserVO;
import com.yedam.app.project.service.UserProjectAuthVO;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class DocsController {

	private final DocsService docsService;

	private static final long MAX_SIZE = 50L * 1024 * 1024;
	private static final Set<String> ALLOWED_EXTS = Set.of("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt",
			"hwp", "csv", "jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "zip", "7z", "rar", "tar", "gz");

	@Value("${app.upload.dir}")
	private String uploadDir;

	// ===== 공통: 세션에서 권한 세팅 =====
	private void setAuthFromSession(DocsVO docsVO, HttpSession session) {
		List<UserProjectAuthVO> userAuthList = (List<UserProjectAuthVO>) session.getAttribute("userAuth");
		if (userAuthList != null && docsVO.getProjectCode() != null) {
			userAuthList.stream()
					.filter(a -> "문서".equals(a.getCategory()) && a.getProjectCode().equals(docsVO.getProjectCode()))
					.findFirst().ifPresent(auth -> {
						docsVO.setAdmin(auth.getAdmin());
						docsVO.setRdRol(auth.getRdRol());
						docsVO.setWrRol(auth.getWrRol());
						docsVO.setDelRol(auth.getDelRol());
					});
		}
	}

	// ===== 공통: 유저 기본 정보 세팅 =====
	private boolean setUserInfo(DocsVO docsVO, UserVO user) {
		if (user == null)
			return false;
		boolean isAdmin = "Y".equals(user.getSysCk());
		docsVO.setUserCode(user.getUserCode());
		docsVO.setAdmin(isAdmin ? 1 : 0);
		return isAdmin;
	}

	// ===== 문서 목록 화면 =====
	@GetMapping("docs")
	public String docs(DocsVO docsVO, HttpSession session, Model model) {
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return "redirect:/login";

		/*
		 * // ===== 세션 확인 ===== System.out.println("===== 세션 확인 =====");
		 * System.out.println("user = " + user); List<UserProjectAuthVO> userAuthList =
		 * (List<UserProjectAuthVO>) session.getAttribute("userAuth");
		 * System.out.println("userAuth = " + userAuthList);
		 * System.out.println("docsVO.projectCode = " + docsVO.getProjectCode());
		 * System.out.println("docsVO.admin = " + docsVO.getAdmin());
		 * System.out.println("docsVO.rdRol = " + docsVO.getRdRol());
		 * System.out.println("docsVO.wrRol = " + docsVO.getWrRol());
		 * System.out.println("docsVO.delRol = " + docsVO.getDelRol());
		 * System.out.println("===================="); // ====================
		 */

		boolean isAdmin = "Y".equals(user.getSysCk());
		docsVO.setUserCode(user.getUserCode());
		docsVO.setAdmin(isAdmin ? 1 : 0);

		// projectCode가 있을 때만 권한 세팅 (특정 프로젝트 필터링 시)
		if (docsVO.getProjectCode() != null) {
			setAuthFromSession(docsVO, session);
		}

		if (!isAdmin && (docsVO.getProjectStatusName() == null || docsVO.getProjectStatusName().isEmpty())) {
			docsVO.setProjectStatusName("OD1");
		}

		List<DocsVO> docsList = docsService.getDocsList(docsVO);
		model.addAttribute("docsList", docsList);
		model.addAttribute("isAdmin", isAdmin);

		return "docs/list";
	}

	// ===== 폴더 생성 =====
	@PostMapping("/api/folders")
	@ResponseBody
	public ResponseEntity<?> createFolder(@RequestBody DocsVO docsVO, HttpSession session) {
		try {
			UserVO user = (UserVO) session.getAttribute("user");
			if (user == null)
				return ResponseEntity.status(401).body("{\"message\":\"로그인이 필요합니다.\"}");

			setAuthFromSession(docsVO, session);
			setUserInfo(docsVO, user);
			docsVO.setCreatedOn(new java.util.Date());

			int result = docsService.addFolder(docsVO);
			if (result > 0)
				return ResponseEntity.ok().body("{\"message\":\"success\"}");
			else
				return ResponseEntity.badRequest().body("{\"message\":\"폴더 생성 실패\"}");
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.internalServerError().body("{\"message\":\"서버 오류\"}");
		}
	}

	// ===== 파일 업로드 =====
	@PostMapping("/docsUpload")
	public String uploadFiles(@RequestParam("projectCode") Integer projectCode,
			@RequestParam("folderCode") Integer folderCode, @RequestParam("files") List<MultipartFile> files,
			HttpSession session, Model model) {
		try {
			UserVO user = (UserVO) session.getAttribute("user");
			if (user == null)
				return "redirect:/login";

			File uploadDirFile = new File(uploadDir + File.separator + "docs");
			if (!uploadDirFile.exists())
				uploadDirFile.mkdirs();

			for (MultipartFile file : files) {
				if (file.isEmpty())
					continue;

				String originalName = file.getOriginalFilename();
				if (originalName == null || !originalName.contains("."))
					continue;

				String ext = originalName.substring(originalName.lastIndexOf("."));
				String extLower = ext.replace(".", "").toLowerCase();

				if (!ALLOWED_EXTS.contains(extLower) || file.getSize() > MAX_SIZE) {
					throw new IllegalArgumentException("허용되지 않은 파일 형식입니다.");
				}

				String storedName = UUID.randomUUID().toString() + ext;
				String filePath = uploadDirFile.getAbsolutePath() + File.separator + storedName;
				file.transferTo(new File(filePath).getAbsoluteFile());

				DocsVO docsVO = new DocsVO();
				docsVO.setProjectCode(projectCode);
				docsVO.setFolderCode(folderCode);
				docsVO.setOriginalName(originalName);
				docsVO.setStoredName(storedName);
				docsVO.setPath(filePath);
				docsVO.setMimeType(file.getContentType());
				docsVO.setSizeBytes((int) file.getSize());
				docsVO.setUploadedAt(new java.util.Date());
				setAuthFromSession(docsVO, session);
				setUserInfo(docsVO, user);

				docsService.addFiles(docsVO);
			}
			return "redirect:/docs";
		} catch (Exception e) {
			e.printStackTrace();
			return "redirect:/docs";
		}
	}

	// ===== 파일 다운로드 =====
	@GetMapping("/docsDownload")
	public ResponseEntity<Resource> downloadFile(@RequestParam Integer fileCode, @RequestParam Integer projectCode,
			HttpSession session) {
		try {
			UserVO user = (UserVO) session.getAttribute("user");
			if (user == null)
				return ResponseEntity.status(401).build();

			DocsVO param = new DocsVO();
			param.setProjectCode(projectCode);
			setAuthFromSession(param, session);
			setUserInfo(param, user);

			DocsVO file = docsService.getFileInfo(fileCode, param);
			if (file == null)
				return ResponseEntity.notFound().build();

			Path filePath = Paths.get(file.getPath());
			Resource resource = new FileSystemResource(filePath);
			if (!resource.exists())
				return ResponseEntity.notFound().build();

			String encodedName = URLEncoder.encode(file.getOriginalName(), StandardCharsets.UTF_8).replace("+", "%20");

			return ResponseEntity.ok()
					.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
					.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE).body(resource);
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.internalServerError().build();
		}
	}

	// ===== 폴더 다운로드 =====
	@GetMapping("/api/folders/{folderCode}/download")
	public void downloadFolder(@PathVariable Integer folderCode, @RequestParam Integer projectCode, HttpSession session,
			HttpServletResponse response) throws IOException {
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null) {
			response.sendError(401);
			return;
		}

		DocsVO param = new DocsVO();
		param.setProjectCode(projectCode);
		setAuthFromSession(param, session);
		setUserInfo(param, user);

		docsService.downloadFolderAsZip(folderCode, param, response);
	}

	// ===== 파일 삭제 =====
	@DeleteMapping("/api/docs/{fileCode}")
	@ResponseBody
	public ResponseEntity<?> deleteFile(@PathVariable Integer fileCode, @RequestParam Integer projectCode,
			HttpSession session) {
		try {
			UserVO user = (UserVO) session.getAttribute("user");
			if (user == null)
				return ResponseEntity.status(401).body("{\"message\":\"로그인이 필요합니다.\"}");

			DocsVO param = new DocsVO();
			param.setProjectCode(projectCode);
			setAuthFromSession(param, session);
			setUserInfo(param, user);

			int result = docsService.removeFile(fileCode, param);
			if (result > 0)
				return ResponseEntity.ok().body("{\"message\":\"success\"}");
			else
				return ResponseEntity.badRequest().body("{\"message\":\"삭제 실패\"}");
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.internalServerError().body("{\"message\":\"서버 오류\"}");
		}
	}

	// ===== 폴더 삭제 =====
	@DeleteMapping("/api/folders/delete/{folderCode}")
	@ResponseBody
	public ResponseEntity<?> deleteFolder(@PathVariable Integer folderCode, @RequestParam Integer projectCode,
			HttpSession session) {
		try {
			UserVO user = (UserVO) session.getAttribute("user");
			if (user == null)
				return ResponseEntity.status(401).body("{\"message\":\"로그인이 필요합니다.\"}");

			DocsVO param = new DocsVO();
			param.setProjectCode(projectCode);
			setAuthFromSession(param, session);
			setUserInfo(param, user);

			docsService.removeFolder(folderCode, param);
			return ResponseEntity.ok().body("{\"message\":\"success\"}");
		} catch (RuntimeException e) {
			return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.internalServerError().body("{\"message\":\"서버 오류\"}");
		}
	}

	// ===== 문서 목록 AJAX API =====
	@GetMapping("/api/docs/list")
	@ResponseBody
	public ResponseEntity<?> docsListApi(DocsVO docsVO, HttpSession session) {
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return ResponseEntity.status(401).build();

		setAuthFromSession(docsVO, session);
		boolean isAdmin = setUserInfo(docsVO, user);

		// 관리자일 경우
		if (isAdmin) {
			// 특정 상태를 선택해서 검색한 게 아니라면, 상태 필터를 제거하여 OD1, OD2, OD3 모두 나오게 함
			if ("".equals(docsVO.getProjectStatusName())) {
				docsVO.setProjectStatusName(null);
			}
		} else {
			// 일반 유저일 경우 (진행중인 것만 강제)
			if (docsVO.getProjectStatusName() == null || docsVO.getProjectStatusName().isEmpty()) {
				docsVO.setProjectStatusName("OD1");
			}
		}

		List<DocsVO> docsList = docsService.getDocsList(docsVO);
		return ResponseEntity.ok(docsList);
	}
}