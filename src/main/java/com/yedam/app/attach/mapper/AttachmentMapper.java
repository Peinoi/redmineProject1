package com.yedam.app.attach.mapper;

import com.yedam.app.attach.service.AttachmentVO;

public interface AttachmentMapper {
	int insertAttachment(AttachmentVO vo);
	int insertAttachmentDetail(AttachmentVO vo);
	
	AttachmentVO selectDetailByFileCode(Long fileCode);
	
	int deleteAttachmentDetailByFileCode(Long fileCode);
	  int deleteAttachmentByFileCode(Long fileCode);
}
