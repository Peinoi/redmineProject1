package com.yedam.app.groupmgr.service;

import java.util.List;

public interface GroupService {

	// 그룹 전체 조회
	public List<GroupMgrVO> groupfindAll();

	// 그룹 단건 상세 조회
	public GroupMgrVO getGroupDetail(Integer groupCode);

	// 그룹 구성원 목록 조회
	public List<GroupMemberVO> getGroupMembers(Integer groupCode);

	// 그룹 프로젝트 목록 조회
	public List<GroupProjectVO> getGroupProjects(Integer groupCode);

	// 그룹 등록 (트랜잭션)
	public int registerGroup(GroupDTO groupDTO);

	// 그룹 수정 (트랜잭션)
	public int updateGroup(GroupDTO groupDTO);

	// 그룹 삭제 (소프트 삭제)
	public int deleteGroup(Integer groupCode);
}
