package com.yedam.app.docs.service.impl;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;

import com.yedam.app.docs.mapper.DocsMapper;
import com.yedam.app.docs.service.DocsService;
import com.yedam.app.docs.service.DocsVO;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DocsServiceImpl implements DocsService {

	private final DocsMapper docsMapper;

	// ================= 폴더 등록 =================
	@Override
	public int addFolder(DocsVO docsVO) {
		docsVO.setCategory("문서");
		return docsMapper.insertFolder(docsVO);
	}

	// ================= 파일 등록 =================
	@Override
	public int addFiles(DocsVO docsVO) {
		docsVO.setCategory("문서");
		return docsMapper.insertFiles(docsVO);
	}

	// ================= 문서 조회 =================
	@Override
	public List<DocsVO> getDocsList(DocsVO docsVO) {
		docsVO.setCategory("문서");

		List<DocsVO> list = docsMapper.selectDocsList(docsVO);

		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
		list.forEach(doc -> {
			if (doc.getUploadedAt() != null) {
				doc.setUploadedAtStr(sdf.format(doc.getUploadedAt()));
			}
		});

		return list;
	}

	// ================= 파일 단건 조회 =================
	@Override
	public DocsVO getFileInfo(Integer fileCode, DocsVO param) {
		param.setFileCode(fileCode);
		param.setCategory("문서");
		return docsMapper.selectFileByCode(param);
	}

	// ================= 폴더 ZIP 다운로드 =================
	@Override
	public void downloadFolderAsZip(Integer folderCode, DocsVO param, HttpServletResponse response) throws IOException {
		param.setFolderCode(folderCode);
		param.setCategory("문서");
		List<DocsVO> files = docsMapper.selectFilesByFolder(param);

		String rootFolderName = "folder_" + folderCode;
		if (!files.isEmpty() && files.get(0).getFolderPath() != null) {
			String[] parts = files.get(0).getFolderPath().split("/");
			if (parts.length > 1) {
				rootFolderName = parts[1];
			}
		}

		String zipName = rootFolderName + ".zip";

		response.setContentType("application/zip");
		response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''"
				+ URLEncoder.encode(zipName, StandardCharsets.UTF_8).replace("+", "%20"));

		try (ZipOutputStream zos = new ZipOutputStream(response.getOutputStream())) {

			Set<String> addedEntries = new HashSet<>();

			for (DocsVO file : files) {

				File f = new File(file.getPath());
				if (!f.exists())
					continue;

				String folderPath = file.getFolderPath() != null ? file.getFolderPath().replaceFirst("^/", "")
						: rootFolderName;

				String entryName = folderPath + "/" + file.getOriginalName();

				// 중복 처리
				String finalEntry = entryName;
				int count = 1;

				while (addedEntries.contains(finalEntry)) {
					String nameOnly = file.getOriginalName();
					int dotIdx = nameOnly.lastIndexOf(".");

					if (dotIdx > 0) {
						finalEntry = folderPath + "/" + nameOnly.substring(0, dotIdx) + "(" + count + ")"
								+ nameOnly.substring(dotIdx);
					} else {
						finalEntry = folderPath + "/" + nameOnly + "(" + count + ")";
					}
					count++;
				}

				addedEntries.add(finalEntry);

				zos.putNextEntry(new ZipEntry(finalEntry));

				try (FileInputStream fis = new FileInputStream(f)) {
					byte[] buffer = new byte[4096];
					int len;
					while ((len = fis.read(buffer)) > 0) {
						zos.write(buffer, 0, len);
					}
				}

				zos.closeEntry();
			}
		}
	}

	// ================= 파일 삭제 =================
	@Override
	public int removeFile(Integer fileCode, DocsVO param) {
		param.setFileCode(fileCode);
		param.setCategory("문서");

		DocsVO file = docsMapper.selectFileByCode(param);
		if (file != null) {
			File f = new File(file.getPath());
			if (f.exists())
				f.delete();
		}
		return docsMapper.deleteFile(param);
	}

	// ================= 폴더 삭제 =================
	@Override
	public int removeFolder(Integer folderCode, DocsVO param) {
		int fileCount = docsMapper.countFilesByFolder(folderCode);
		if (fileCount > 0)
			throw new RuntimeException("파일이 있는 폴더는 삭제할 수 없습니다.");

		int childCount = docsMapper.countChildFolders(folderCode);
		if (childCount > 0)
			throw new RuntimeException("하위 폴더가 있는 폴더는 삭제할 수 없습니다.");

		param.setFolderCode(folderCode);
		param.setCategory("문서");
		return docsMapper.deleteFolder(param);
	}
}