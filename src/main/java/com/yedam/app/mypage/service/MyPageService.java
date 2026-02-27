// ================================
// 3) MyPageService.java (완성본)
// ================================
package com.yedam.app.mypage.service;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;

public interface MyPageService {

	List<BlockVO> getBlocksEnsured(Integer userCode);

	void addBlock(Integer userCode, String blockType);

	void deleteBlock(Integer userCode, Integer blockCode);

	void saveOrder(Integer userCode, List<Integer> orderedBlockCodes);

	Map<String, Object> buildMyPage(HttpSession session, Integer userCode, String userName, int days, String mode,
			Integer projectCode);

	List<MyIssueRowDTO> getAdminDrilldownIssues(HttpSession session, Integer loginUserCode, String kind,
			Integer projectCode, Integer targetUserCode, int limit);
}