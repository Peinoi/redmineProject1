package com.yedam.app.groupmgr.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yedam.app.groupmgr.mapper.GroupMapper;
import com.yedam.app.groupmgr.service.GroupDTO;
import com.yedam.app.groupmgr.service.GroupMemberVO;
import com.yedam.app.groupmgr.service.GroupMgrVO;
import com.yedam.app.groupmgr.service.GroupProjectVO;
import com.yedam.app.groupmgr.service.GroupService;


import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GroupMgrServiceImpl implements GroupService {

	private final GroupMapper groupMapper;

	@Override
	public List<GroupMgrVO> groupfindAll() {
		return groupMapper.groupAll();
	}

	// 그룹 단건 상세 조회
	@Override
	public GroupMgrVO getGroupDetail(Integer groupCode) {
		return groupMapper.selectGroupDetail(groupCode);
	}

	// 그룹 구성원 목록 조회
	@Override
	public List<GroupMemberVO> getGroupMembers(Integer groupCode) {
		return groupMapper.selectGroupMembers(groupCode);
	}

	// 그룹 프로젝트 목록 조회
	@Override
	public List<GroupProjectVO> getGroupProjects(Integer groupCode) {
		return groupMapper.selectGroupProjects(groupCode);
	}

	// 그룹 등록
	@Override
	@Transactional
	public int registerGroup(GroupDTO groupDTO) {
		// 1. 그룹 등록 (GroupVO 재사용)
		GroupMgrVO groupVO = new GroupMgrVO();
		groupVO.setGrName(groupDTO.getGrName());
		groupVO.setDescription(groupDTO.getDescription());
		groupMapper.groupInsert(groupVO);
		Integer groupCode = groupVO.getGroupCode();

		// 2. 구성원 등록
		if (groupDTO.getGroupUsers() != null) {
			for (GroupDTO.MemberDTO memberDTO : groupDTO.getGroupUsers()) {
				GroupMemberVO memberVO = new GroupMemberVO();
				memberVO.setGrCode(groupCode);
				memberVO.setUserCode(memberDTO.getUserCode());
				groupMapper.groupMemberInsert(memberVO);
			}
		}

		// 3. 프로젝트 매핑 등록
		if (groupDTO.getGroupProjects() != null) {
			for (GroupDTO.ProjectDTO projectDTO : groupDTO.getGroupProjects()) {
				GroupProjectVO projectVO = new GroupProjectVO();
				projectVO.setGrCode(groupCode);
				projectVO.setProjectCode(projectDTO.getProjectCode());
				projectVO.setRoleCode(projectDTO.getRoleCode());
				groupMapper.groupProjectInsert(projectVO);
			}
		}

		return groupCode;
	}

	// 그룹 수정
	@Override
	@Transactional
	public int updateGroup(GroupDTO groupDTO) {
		// 1. 그룹 기본 정보 수정 (GroupVO 재사용)
		GroupMgrVO groupVO = new GroupMgrVO();
		groupVO.setGroupCode(groupDTO.getGroupCode());
		groupVO.setGrName(groupDTO.getGrName());
		groupVO.setDescription(groupDTO.getDescription());
		int result = groupMapper.updateGroup(groupVO);

		// 2. 구성원 처리
		if (groupDTO.getGroupUsers() != null) {
			for (GroupDTO.MemberDTO member : groupDTO.getGroupUsers()) {
				switch (member.getAction()) {
				case "delete":
					groupMapper.deleteGroupMember(member.getGrMemCode());
					break;
				case "add":
					GroupMemberVO memberVO = new GroupMemberVO();
					memberVO.setGrCode(groupDTO.getGroupCode());
					memberVO.setUserCode(member.getUserCode());
					groupMapper.groupMemberInsert(memberVO);
					break;
				case "keep":
				default:
					break;
				}
			}
		}

		// 3. 프로젝트 처리
		if (groupDTO.getGroupProjects() != null) {
			for (GroupDTO.ProjectDTO project : groupDTO.getGroupProjects()) {
				switch (project.getAction()) {
				case "delete":
					groupMapper.softDeleteGroupProject(project.getGrProCode());
					break;
				case "add":
					// 소프트 삭제된 동일 프로젝트 있으면 복원, 없으면 신규 등록
					GroupProjectVO deleted = groupMapper.findDeletedGroupProject(groupDTO.getGroupCode(),
							project.getProjectCode());
					if (deleted != null) {
						groupMapper.restoreGroupProject(deleted.getGrProCode(), project.getRoleCode());
					} else {
						GroupProjectVO projectVO = new GroupProjectVO();
						projectVO.setGrCode(groupDTO.getGroupCode());
						projectVO.setProjectCode(project.getProjectCode());
						projectVO.setRoleCode(project.getRoleCode());
						groupMapper.groupProjectInsert(projectVO);
					}
					break;
				case "keep":
				default:
					break;
				}
			}
		}

		return result;
	}

	// 그룹 삭제 (소프트 삭제)
	@Override
	public int deleteGroup(Integer groupCode) {
		return groupMapper.softDeleteGroup(groupCode);
	}
}
