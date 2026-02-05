package com.yedam.app.attach.service.impl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.yedam.app.attach.mapper.AttachmentMapper;
import com.yedam.app.attach.service.AttachmentService;
import com.yedam.app.attach.service.AttachmentVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AttachmentServiceImpl implements AttachmentService {

  private final AttachmentMapper attachmentMapper;

  @Value("${app.upload.dir:uploads}")
  private String uploadDir; // "uploads"

  @Transactional
  @Override
  public Long saveSingleFile(String tableCode, Long userCode, MultipartFile uploadFile) {
    if (uploadFile == null || uploadFile.isEmpty()) return null;

    AttachmentVO vo = new AttachmentVO();
    vo.setTableCode(tableCode);
    vo.setUserCode(userCode);
    vo.setOriginalName(uploadFile.getOriginalFilename());
    vo.setMimeType(uploadFile.getContentType());
    vo.setSizeBytes(uploadFile.getSize());
    vo.setIsUsed(1);

    // 프로젝트 실행 위치(프로젝트 루트) 기준으로 절대경로 만들기
    Path baseDir = Paths.get(System.getProperty("user.dir"), uploadDir, tableCode.toLowerCase());
    try {
      Files.createDirectories(baseDir);
    } catch (IOException e) {
      throw new RuntimeException("upload dir create failed: " + baseDir, e);
    }

    String orig = (vo.getOriginalName() == null || vo.getOriginalName().isBlank())
      ? "file"
      : vo.getOriginalName();

    String storedName = UUID.randomUUID().toString().replace("-", "") + "_" + orig;
    Path savedPath = baseDir.resolve(storedName);

    try {
      uploadFile.transferTo(savedPath.toFile());
    } catch (IOException e) {
      throw new RuntimeException("file save failed: " + savedPath, e);
    }

    vo.setStoredName(storedName);
    vo.setPath("/uploads/" + tableCode.toLowerCase() + "/" + storedName);

    attachmentMapper.insertAttachment(vo);
    attachmentMapper.insertAttachmentDetail(vo);

    return vo.getFileCode();
  }
  
  @Transactional
  @Override
  public void deleteSingleFile(Long fileCode) {
    if (fileCode == null) return;

    // 1) DB에서 detail 조회
    AttachmentVO detail = attachmentMapper.selectDetailByFileCode(fileCode);
    if (detail == null) {
      return;
    }

    // 2) 실제 파일 삭제
    try {
      String table = (detail.getTableCode() == null) ? "" : detail.getTableCode().toLowerCase();
      String stored = detail.getStoredName();

      if (stored != null && !stored.isBlank() && !table.isBlank()) {
        Path physicalPath = Paths.get(System.getProperty("user.dir"), uploadDir, table, stored);
        Files.deleteIfExists(physicalPath);
      } else {
        String p = detail.getPath(); // /uploads/issue/xxxx
        if (p != null && p.startsWith("/uploads/")) {
          String relative = p.substring("/uploads/".length()); // issue/xxxx
          Path physicalPath = Paths.get(System.getProperty("user.dir"), uploadDir, relative);
          Files.deleteIfExists(physicalPath);
        }
      }
    } catch (IOException e) {
    }

    // 3) DB 삭제 (detail -> master)
    attachmentMapper.deleteAttachmentDetailByFileCode(fileCode);
    attachmentMapper.deleteAttachmentByFileCode(fileCode);
  }

}
