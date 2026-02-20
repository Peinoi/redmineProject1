package com.yedam.app.groupmgr.mapper;

import java.util.List;

import com.yedam.app.groupmgr.service.GroupMemberVO;
import com.yedam.app.groupmgr.service.GroupMgrVO;
import com.yedam.app.groupmgr.service.GroupProjectVO;
import com.yedam.app.project.service.GroupVO;

public interface GroupMapper {


	// 그룹 전체 조회 (삭제되지 않은 것만)
    public List<GroupMgrVO> groupAll();

    //그룹 단건 상세 조회
    public GroupMgrVO selectGroupDetail(Integer groupCode);

    // 그룹 구성원 목록 조회
    public List<GroupMemberVO> selectGroupMembers(Integer groupCode);

    // 그룹 프로젝트 목록 조회
    public List<GroupProjectVO> selectGroupProjects(Integer groupCode);

    // 그룹 등록
    public int groupInsert(GroupMgrVO gruopMgrVO);

    // 그룹 구성원 등록
    public int groupMemberInsert(GroupMemberVO groupMemberVO);

    // 그룹 프로젝트 매핑 등록
    public int groupProjectInsert(GroupProjectVO groupProjectVO);

    // 그룹 기본 정보 수정
    public int updateGroup(GroupMgrVO gruopMgrVO);

    // 그룹 구성원 삭제 (물리 삭제)
    public int deleteGroupMember(Integer grMemCode);

    // 그룹 프로젝트 소프트 삭제 (project_code 음수 변환)
    public int softDeleteGroupProject(Integer grProCode);

    // 소프트 삭제된 그룹 프로젝트 조회
    public GroupProjectVO findDeletedGroupProject(Integer grCode, Integer projectCode);

    // 그룹 프로젝트 복원
    public int restoreGroupProject(Integer grProCode, Integer roleCode);

    // 그룹 소프트 삭제
	public int softDeleteGroup(Integer groupCode);
}
