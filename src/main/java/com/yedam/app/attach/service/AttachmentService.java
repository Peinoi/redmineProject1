package com.yedam.app.attach.service;

import org.springframework.web.multipart.MultipartFile;

public interface AttachmentService {
	Long saveSingleFile(String tableCode, Long userCode, MultipartFile uploadFile);
	
	void deleteSingleFile(Long fileCode);
}
