package com.yedam.app.docs.web;

import java.io.File;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.yedam.app.docs.service.DocsService;
import com.yedam.app.docs.service.DocsVO;
import com.yedam.app.login.service.UserVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class DocsController {

	private final DocsService docsService;

	private static final long MAX_SIZE = 50L * 1024 * 1024;
	private static final Set<String> ALLOWED_EXTS = Set.of("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg",
			"jpeg", "png", "gif", "zip", "txt");

	// 파일 저장 경로
	@Value("${app.upload.dir}")
	private String uploadDir;

	// ===== 문서 목록 화면 =====
	@GetMapping({ "docs", "searchList" })
	public String docs(DocsVO docsVO, HttpSession session, Model model) {
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return "redirect:/login";

		boolean isAdmin = "Y".equals(user.getSysCk());
		docsVO.setUserCode(user.getUserCode());

		if (!isAdmin && (docsVO.getProjectStatusName() == null || docsVO.getProjectStatusName().isEmpty())) {
			docsVO.setProjectStatusName("OD1");
		}

		List<DocsVO> docsList = docsService.getDocsList(docsVO);
		model.addAttribute("docsList", docsList);
		model.addAttribute("isAdmin", isAdmin);

		return "docs/list";
	}

	// ===== 폴더 생성 API (POST /api/folders) =====
	// JS: fetch("/api/folders", { method: "POST", body: JSON.stringify({folderName,
	// headerFolderCode, projectCode}) })
	@PostMapping("/api/folders")
	@ResponseBody
	public ResponseEntity<?> createFolder(@RequestBody DocsVO docsVO, HttpSession session) {
		try {
			UserVO user = (UserVO) session.getAttribute("user"); // ← "loginUserCode" → "user"
			if (user == null) {
				return ResponseEntity.status(401).body("{\"message\":\"로그인이 필요합니다.\"}");
			}
			docsVO.setUserCode(user.getUserCode()); // ← UserVO에서 꺼내기
			docsVO.setCreatedOn(new java.util.Date()); // ← createdOn 세팅

			int result = docsService.addFolder(docsVO);
			if (result > 0) {
				return ResponseEntity.ok().body("{\"message\":\"success\"}");
			} else {
				return ResponseEntity.badRequest().body("{\"message\":\"폴더 생성 실패\"}");
			}
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.internalServerError().body("{\"message\":\"서버 오류\"}");
		}
	}

	// ===== 파일 업로드 (POST /docsUpload) =====
	// JS uploadForm의 action="/docsUpload"
	@PostMapping("/docsUpload")
	public String uploadFiles(@RequestParam("projectCode") Integer projectCode,
			@RequestParam("folderCode") Integer folderCode, @RequestParam("files") List<MultipartFile> files,
			HttpSession session, Model model) {

		try {
			UserVO user = (UserVO) session.getAttribute("user"); // ← 세션 수정
			if (user == null)
				return "redirect:/login";

			File uploadDirFile = new File(uploadDir + File.separator + "docs");
			if (!uploadDirFile.exists())
				uploadDirFile.mkdirs();

			for (MultipartFile file : files) {
				if (file.isEmpty())
					continue;

				String originalName = file.getOriginalFilename();
				if (originalName == null || !originalName.contains(".")) {
					continue;
				}

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
				docsVO.setUserCode(user.getUserCode()); // ← 수정
				docsVO.setUploadedAt(new java.util.Date()); // ← uploadedAt 세팅

				docsVO.setPath(filePath);
				docsService.addFiles(docsVO);
			}
			return "redirect:/docs";
		} catch (Exception e) {
			e.printStackTrace();
			return "redirect:/docs";
		}
	}
}