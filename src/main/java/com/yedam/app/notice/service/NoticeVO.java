package com.yedam.app.notice.service;

import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;

import lombok.Data;

@Data
public class NoticeVO {
  private Long noticeCode;
  private Long projectCode;
  private String projectStatus;
  private String projectStatusName;

  private String title;
  private String content;

  private Integer userCode;  
  private String creatorName; 

  @DateTimeFormat(pattern = "yyyy-MM-dd")
  private LocalDateTime createdAt;

  @DateTimeFormat(pattern = "yyyy-MM-dd")
  private LocalDateTime updatedAt;

  private Long fileCode;
  private String originalName;
  private String filePath;
  @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm")
	private LocalDateTime uploadedAt;
  
  private Boolean removeFile;
  
  // 목록 표시용
  private String projectName;
}
