package com.yedam.app.attach.service;

import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;

import lombok.Data;

@Data
public class AttachmentVO {
	private Long fileCode;
	private Long userCode;
	private String tableCode;

	@DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm")
	private LocalDateTime uploadedAt;

	private Long fileDetailCode;
	private String originalName;
	private String storedName;
	private String path;
	private String mimeType;
	private Long sizeBytes;
	private Integer isUsed;
}
