package com.yedam.app.attach.web;

import java.io.File;
import java.nio.charset.StandardCharsets;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.yedam.app.attach.mapper.AttachmentMapper;
import com.yedam.app.attach.service.AttachmentVO;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class FileController {

  private final AttachmentMapper attachmentMapper;

  @GetMapping("/files/{fileCode}")
  public ResponseEntity<Resource> download(@PathVariable Long fileCode) {

    AttachmentVO vo = attachmentMapper.selectDetailByFileCode(fileCode);
    if (vo == null) return ResponseEntity.notFound().build();

    File f = new File(vo.getPath());
    if (!f.exists()) return ResponseEntity.notFound().build();

    Resource res = new FileSystemResource(f);

    String filename = (vo.getOriginalName() == null || vo.getOriginalName().isBlank())
        ? "file"
        : vo.getOriginalName();

    // 한글 파일명 깨짐 방지(기본)
    String encoded = new String(filename.getBytes(StandardCharsets.UTF_8), StandardCharsets.ISO_8859_1);

    MediaType mt = MediaType.APPLICATION_OCTET_STREAM;
    if (vo.getMimeType() != null && !vo.getMimeType().isBlank()) {
      try { mt = MediaType.parseMediaType(vo.getMimeType()); } catch (Exception ignored) {}
    }

    return ResponseEntity.ok()
        .contentType(mt)
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encoded + "\"")
        .body(res);
  }
}
