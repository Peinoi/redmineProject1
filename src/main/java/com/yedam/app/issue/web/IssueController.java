package com.yedam.app.issue.web;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.yedam.app.attach.service.AttachmentService;
import com.yedam.app.issue.service.IssueService;
import com.yedam.app.issue.service.IssueVO;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class IssueController {

	private final IssueService issueService;
	private final AttachmentService attachmentService; // 추가

	// 전체조회
	@GetMapping("issueList")
	public String issueList(Model model) {
		List<IssueVO> findVO = issueService.findAll();
		model.addAttribute("list", findVO);
		return "issue/list";
	}

	// 단건조회
	@GetMapping("issueInfo")
	public String issueInfo(IssueVO issue, Model model) {
		IssueVO findVO = issueService.findByIssueCode(issue);
		model.addAttribute("issue", findVO);
		return "issue/info";
	}

	// 등록 화면
	@GetMapping("issueInsert")
	public String issueInsertForm(Model model) {
		model.addAttribute("issue", new IssueVO());
		return "issue/insert";
	}

	// 등록 처리
	@PostMapping("issueInsert")
	public String issueInsertProcess(IssueVO issue, @RequestParam(required = false) MultipartFile uploadFile) {

		Long issueCode = issueService.addIssue(issue);

		Long userCode = 1L;

		if (uploadFile != null && !uploadFile.isEmpty()) {
			issueService.attachFileToIssue(issueCode, userCode, uploadFile);
		}

		return "redirect:/issueList";
	}

	// 삭제
	@PostMapping("issueDelete")
	public String issueDeleteProcess(@RequestParam("issueCodes") List<Long> issueCodes) {
		if (issueCodes != null && !issueCodes.isEmpty()) {
			issueService.removeIssues(issueCodes);
		}
		return "redirect:/issueList";
	}

	// 수정 화면
	@GetMapping("issueEdit")
	public String issueEditForm(IssueVO issue, Model model) {
		IssueVO findVO = issueService.findByIssueCode(issue);
		model.addAttribute("issue", findVO);
		return "issue/edit";
	}

//수정 처리
	@PostMapping(value = "issueEdit", consumes = "multipart/form-data")
	public String issueEditProcess(@ModelAttribute IssueVO issue,
			@RequestParam(required = false) MultipartFile uploadFile) {
		Long userCode = 1L; // TODO 로그인에서 가져오기

		// 서비스에서 "수정 + 파일" 같이 처리
		issueService.modifyIssueInfo(issue, uploadFile, userCode);

		return "redirect:/issueInfo?issueCode=" + issue.getIssueCode();
	}

}
