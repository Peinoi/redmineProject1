package com.yedam.app.project.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.project.service.AttachmentsDetailVO;
import com.yedam.app.project.service.GroupVO;
import com.yedam.app.project.service.ProjectAddGroupVO;
import com.yedam.app.project.service.ProjectAddMapVO;
import com.yedam.app.project.service.ProjectAddStatusVO;
import com.yedam.app.project.service.ProjectAddVO;
import com.yedam.app.project.service.ProjectCopyVO;
import com.yedam.app.project.service.ProjectDetailVO;
import com.yedam.app.project.service.ProjectGroupDetailVO;
import com.yedam.app.project.service.ProjectManagerVO;
import com.yedam.app.project.service.ProjectMemberDetailVO;
import com.yedam.app.project.service.ProjectPrVO;
import com.yedam.app.project.service.ProjectVO;
import com.yedam.app.project.service.PruserVO;
import com.yedam.app.project.service.RoleVO;
import com.yedam.app.project.service.UserProjectAuthVO;

public interface ProjectMapper {
	List<ProjectVO> selectAll(Map<String, Object> params);

	public List<PruserVO> userAll();

	public List<RoleVO> roleAll();

	public List<GroupVO> groupAll();

	public List<ProjectPrVO> projPrAll();

	public List<ProjectVO> ProjectAll();

	// 프로젝트 등록
	public int projectInsert(ProjectAddVO projectAddVO);

	// 프로젝트 상태 등록
	public int projectStatInsert(ProjectAddStatusVO projectAddStatVO);

	// 프로젝트 매퍼 등록
	public int projectMapInsert(ProjectAddMapVO projectAddMapVO);

	// 프로젝트 그룹 매퍼 등록
	public int projectGroupInsert(ProjectAddGroupVO projectAddGroupVO);

	// 권한 조회
	public UserProjectAuthVO selectUserProjectAuth(Map<String, Object> params);

	public List<UserProjectAuthVO> selectUserProjectAuthAll(Map<String, Object> params);

	// 프로젝트 상태 변경
	public int updateProjectStatus(Map<String, Object> params);

	// 프로젝트 상세 조회
	public ProjectDetailVO selectProjectDetail(Integer projectCode);

	// 프로젝트 구성원 목록 조회
	public List<ProjectMemberDetailVO> selectProjectMembers(Integer projectCode);

	// 프로젝트 그룹 목록 조회
	public List<ProjectGroupDetailVO> selectProjectGroups(Integer projectCode);

	// 프로젝트 정보 수정
	public int updateProject(ProjectDetailVO projectDetailVO);

	// 구성원 삭제 (999- prefix 추가)
	public int softDeleteProjectMember(Map<String, Object> params);

	// 구성원 복원 (999- prefix 제거)
	public int restoreProjectMember(Map<String, Object> params);

	// 그룹 삭제 (999- prefix 추가)
	public int softDeleteProjectGroup(Map<String, Object> params);

	// 그룹 복원 (999- prefix 제거)
	public int restoreProjectGroup(Map<String, Object> params);

	// 삭제된 구성원 확인
	public ProjectMemberDetailVO findDeletedMember(Map<String, Object> params);

	// 삭제된 그룹 확인
	public ProjectGroupDetailVO findDeletedGroup(Map<String, Object> params);

	// 프로젝트 복사
	public void projectCopy(ProjectCopyVO projectCopyVO);
	
	// 복사된 프로젝트의 첨부파일 상세 목록 조회
	public List<AttachmentsDetailVO> selectCopiedAttachments(Integer newProjectCode);

	// 물리 파일 복사 후 stored_name 업데이트
	public int updateStoredName(@Param("fileDetailCode") Integer fileDetailCode,
	                            @Param("newStoredName")  String  newStoredName);
	
	public List<ProjectManagerVO> selectManager(Integer userCode);
	
	// 프로젝트 수정 구성원 / 그룹 권한 변경
	public int updateMemberRole(Map<String, Object> params);
	public int updateGroupRole(Map<String, Object> params);
}
