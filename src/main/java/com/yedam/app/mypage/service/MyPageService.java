package com.yedam.app.mypage.service;

import java.util.List;
import java.util.Map;

public interface MyPageService {

	// 내 페이지 블록 목록 조회 (기본 블록 보장)
	List<BlockVO> getBlocksEnsured(Integer userCode);

	// 블록 추가
	void addBlock(Integer userCode, String blockType);

	// 블록 삭제
	void deleteBlock(Integer userCode, Integer blockCode);

	// 블록 정렬 저장
	void saveOrder(Integer userCode, List<Integer> orderedBlockCodes);

	Map<String, Object> buildMyPage(Integer userCode, String userName, int days, String mode, Integer projectCode);
	
	List<MyIssueRowDTO> getAdminDrilldownIssues(
		    Integer loginUserCode,
		    String kind,
		    Integer projectCode,
		    Integer targetUserCode,
		    int limit
		);
}
