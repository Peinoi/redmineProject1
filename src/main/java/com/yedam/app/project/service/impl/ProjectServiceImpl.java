package com.yedam.app.project.service.impl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yedam.app.project.mapper.ProjectMapper;
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
import com.yedam.app.project.service.ProjectRequestDTO;
import com.yedam.app.project.service.ProjectService;
import com.yedam.app.project.service.ProjectUpdateDTO;
import com.yedam.app.project.service.ProjectVO;
import com.yedam.app.project.service.PruserVO;
import com.yedam.app.project.service.RoleVO;
import com.yedam.app.project.service.UserProjectAuthVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

	private final ProjectMapper projectMapper;

	@Override
	public List<ProjectVO> findAll(Integer userCode, Integer isAdmin) {
		Map<String, Object> params = new HashMap<>();
		params.put("userCode", userCode);
		params.put("isAdmin", isAdmin);
		return projectMapper.selectAll(params);
	}

	@Override
	public List<PruserVO> userFindAll() {
		return projectMapper.userAll();
	}

	@Override
	public List<RoleVO> roleFindAll() {
		return projectMapper.roleAll();
	}

	@Override
	public List<GroupVO> groupFindAll() {
		return projectMapper.groupAll();
	}

	@Override
	public List<ProjectPrVO> progFindAll() {
		return projectMapper.projPrAll();
	}

	@Override
	public List<ProjectVO> findAllProject() {
		return projectMapper.ProjectAll();
	}

	// 프로젝트 등록
	@Override
	public int projectAdd(ProjectAddVO projectAddVO) {
		int result = projectMapper.projectInsert(projectAddVO);
		return result;
	}

	@Override
	public int projectStatAdd(ProjectAddStatusVO projectAddStatVO) {
		int result = projectMapper.projectStatInsert(projectAddStatVO);
		return result;
	}

	@Override
	public int projectMapAdd(ProjectAddMapVO projectAddMapVO) {
		int result = projectMapper.projectMapInsert(projectAddMapVO);
		return result;
	}

	@Override
	public int projectGroupAdd(ProjectAddGroupVO projectAddGroupVO) {
		int result = projectMapper.projectGroupInsert(projectAddGroupVO);
		return result;
	}

	@Override
	@Transactional
	public int registerProject(ProjectRequestDTO projDTO) {
		// 1. 프로젝트 등록
		ProjectAddVO projectVO = ProjectAddVO.builder().projectName(projDTO.getProjectName())
				.description(projDTO.getDescription()).status(projDTO.getStatus()).userCode(projDTO.getUserCode())
				.build();

		projectMapper.projectInsert(projectVO);
		Integer projectCode = projectVO.getProjectCode();

		// 2. 상태 5개 등록 (OB1 ~ OB5)
		for (int i = 1; i <= 5; i++) {
			ProjectAddStatusVO statusVO = new ProjectAddStatusVO();
			statusVO.setProjectCode(projectCode);
			statusVO.setCodeId("OB" + i);
			statusVO.setSortNo(i);
			projectMapper.projectStatInsert(statusVO);
		}

		// 3. 프로젝트 사용자 매핑 등록
		if (projDTO.getProjectUsers() != null) {
			for (ProjectRequestDTO.ProjectUserDTO userDTO : projDTO.getProjectUsers()) {
				ProjectAddMapVO mapVO = new ProjectAddMapVO();
				mapVO.setProjectCode(projectCode);
				mapVO.setUserCode(Integer.parseInt(userDTO.getUserCode()));
				mapVO.setRoleCode(Integer.parseInt(userDTO.getRoleCode()));
				projectMapper.projectMapInsert(mapVO);
			}
		}

		// 4. 프로젝트 그룹 매핑 등록
		if (projDTO.getProjectGroups() != null) {
			for (ProjectRequestDTO.ProjectGroupDTO groupDTO : projDTO.getProjectGroups()) {
				ProjectAddGroupVO groupVO = new ProjectAddGroupVO();
				groupVO.setProjectCode(projectCode);
				groupVO.setGrCode(Integer.parseInt(groupDTO.getGroupCode()));
				groupVO.setRoleCode(Integer.parseInt(groupDTO.getRoleCode()));
				projectMapper.projectGroupInsert(groupVO);
			}
		}

		return projectCode;
	}

	// 권한 조회
	@Override
	public UserProjectAuthVO getUserProjectAuth(Integer userCode, String category) {
		Map<String, Object> params = new HashMap<>();
		params.put("userCode", userCode);
		params.put("category", category);
		return projectMapper.selectUserProjectAuth(params);
	}

	// 프로젝트 상태 변경
	@Override
	public int updateProjectStatus(Integer projectCode, String status) {
		Map<String, Object> params = new HashMap<>();
		params.put("projectCode", projectCode);
		params.put("status", status);
		return projectMapper.updateProjectStatus(params);
	}

	// 유저 권한
	@Override
	public List<UserProjectAuthVO> getUserProjectAuthAll(Integer userCode) {
		Map<String, Object> params = new HashMap<>();
		params.put("userCode", userCode);
		return projectMapper.selectUserProjectAuthAll(params);
	}

	// 프로젝트 단건 조회 및 수정
	@Override
	public ProjectDetailVO getProjectDetail(Integer projectCode) {
		return projectMapper.selectProjectDetail(projectCode);
	}

	@Override
	public List<ProjectMemberDetailVO> getProjectMembers(Integer projectCode) {
		return projectMapper.selectProjectMembers(projectCode);
	}

	@Override
	public List<ProjectGroupDetailVO> getProjectGroups(Integer projectCode) {
		return projectMapper.selectProjectGroups(projectCode);
	}

	@Override
	@Transactional
	public int updateProject(ProjectUpdateDTO updateDTO) {
		// 1. 프로젝트 기본 정보 수정
		ProjectDetailVO projectVO = new ProjectDetailVO();
		projectVO.setProjectCode(updateDTO.getProjectCode());
		projectVO.setProjectName(updateDTO.getProjectName());
		projectVO.setDescription(updateDTO.getDescription());
		projectVO.setStatus(updateDTO.getStatus());

		int result = projectMapper.updateProject(projectVO);

		// 2. 구성원 처리
		if (updateDTO.getMembers() != null) {
			for (ProjectUpdateDTO.MemberUpdate member : updateDTO.getMembers()) {
				Map<String, Object> params = new HashMap<>();
				params.put("projectCode", updateDTO.getProjectCode());
				params.put("userCode", member.getUserCode());
				params.put("roleCode", member.getRoleCode());
				params.put("mappCode", member.getMappCode());

				switch (member.getAction()) {
				case "delete":
					// 999- prefix 추가
					projectMapper.softDeleteProjectMember(params);
					break;

				case "add":
					// 삭제된 구성원이 있는지 확인
					ProjectMemberDetailVO deleted = projectMapper.findDeletedMember(params);
					if (deleted != null) {
						// 복원
						projectMapper.restoreProjectMember(params);
					} else {
						// 신규 추가
						ProjectAddMapVO mapVO = new ProjectAddMapVO();
						mapVO.setProjectCode(updateDTO.getProjectCode());
						mapVO.setUserCode(member.getUserCode());
						mapVO.setRoleCode(member.getRoleCode());
						projectMapper.projectMapInsert(mapVO);
					}
					break;

				case "keep":
					// roleCode가 변경된 경우 업데이트
					if (member.getMappCode() != null) {
						projectMapper.updateMemberRole(params);
					}

					break;

				}
			}
		}

		// 3. 그룹 처리
		if (updateDTO.getGroups() != null) {
			for (ProjectUpdateDTO.GroupUpdate group : updateDTO.getGroups()) {
				Map<String, Object> params = new HashMap<>();
				params.put("projectCode", updateDTO.getProjectCode());
				params.put("grCode", group.getGrCode());
				params.put("roleCode", group.getRoleCode());
				params.put("grProCode", group.getGrProCode());

				switch (group.getAction()) {
				case "delete":
					// 999- prefix 추가
					projectMapper.softDeleteProjectGroup(params);
					break;

				case "add":
					// 삭제된 그룹이 있는지 확인
					ProjectGroupDetailVO deleted = projectMapper.findDeletedGroup(params);
					if (deleted != null) {
						// 복원
						projectMapper.restoreProjectGroup(params);
					} else {
						// 신규 추가
						ProjectAddGroupVO groupVO = new ProjectAddGroupVO();
						groupVO.setProjectCode(updateDTO.getProjectCode());
						groupVO.setGrCode(group.getGrCode());
						groupVO.setRoleCode(group.getRoleCode());
						projectMapper.projectGroupInsert(groupVO);
					}
					break;

				case "keep":
					// roleCode가 변경된 경우 업데이트
					if (group.getGrProCode() != null) {
						projectMapper.updateGroupRole(params);
					}
					break;
				}
			}
		}

		return result;
	}

	// 프로젝트 복사
	@Override
	@Transactional
	public int copyNewProject(ProjectCopyVO projectCopyVO) {

		// 1. 프로시저 호출 (DB 레코드 복사 - 프로시저 내 COMMIT/ROLLBACK 없음)
		projectMapper.projectCopy(projectCopyVO);

		// 2. 프로시저 실패 시 예외 발생 → @Transactional이 롤백 처리
		if (projectCopyVO.getResultCode() != 0) {
			throw new RuntimeException(projectCopyVO.getResultMsg());
		}

		// 3. 복사된 프로젝트의 첨부파일 상세 목록 조회
		List<AttachmentsDetailVO> details = projectMapper.selectCopiedAttachments(projectCopyVO.getNewProjectCode());

		// 4. 물리 파일 복사 + DB stored_name 업데이트
		for (AttachmentsDetailVO detail : details) {
			String originalStoredName = detail.getStoredName();
			String ext = originalStoredName.contains(".")
					? originalStoredName.substring(originalStoredName.lastIndexOf("."))
					: "";
			String newStoredName = UUID.randomUUID().toString() + ext;

			Path src = Paths.get(detail.getPath(), originalStoredName);
			Path dest = Paths.get(detail.getPath(), newStoredName);

			try {
				// 원본 파일이 존재할 때만 복사
				if (Files.exists(src)) {
					Files.copy(src, dest, StandardCopyOption.REPLACE_EXISTING);
				}
			} catch (IOException e) {
				// 파일 복사 실패 시 예외 발생 → @Transactional이 DB 롤백 처리
				throw new RuntimeException("파일 복사 실패: " + originalStoredName, e);
			}

			// DB stored_name 새 파일명으로 업데이트
			projectMapper.updateStoredName(detail.getFileDetailCode(), newStoredName);
		}

		return projectCopyVO.getResultCode();
	}

	@Override
	public List<ProjectManagerVO> findSelectManager(Integer userCode) {
		return projectMapper.selectManager(userCode);
	}
}
