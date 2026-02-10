package com.yedam.app.authority.service;

import com.yedam.app.authority.AuthorityVO;

public interface AuthorityService {
	boolean canWrite(Long projectCode, Integer userCode, String category);
	  boolean canRead(Long projectCode, Integer userCode, String category);
	  boolean canModify(Long projectCode, Integer userCode, String category);
	  boolean canDelete(Long projectCode, Integer userCode, String category);
	  
	  AuthorityVO getProjectAuth(Integer userCode, Long projectCode);
}
