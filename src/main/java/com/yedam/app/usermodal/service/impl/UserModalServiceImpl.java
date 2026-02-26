package com.yedam.app.usermodal.service.impl;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.yedam.app.usermodal.mapper.UserModalMapper;
import com.yedam.app.usermodal.service.UserModalService;
import com.yedam.app.usermodal.service.UserModalVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserModalServiceImpl implements UserModalService {

	private final UserModalMapper userModalMapper;

	@Override
	public List<UserModalVO> findUsersByProject(Long projectCode) {
		return userModalMapper.selectUsersByProject(projectCode);
	}

	@Override
	public List<UserModalVO> findAssigneeByMyProjects(Long loginUserCode) {
		List<UserModalVO> flatList = userModalMapper.selectAssigneeByMyProjects(loginUserCode);
		return buildProjectUserTree(flatList);
	}
	
	@Override
	public List<UserModalVO> findCreatorByMyProjects(Long loginUserCode) {
		List<UserModalVO> flatList = userModalMapper.selectCreatorByMyProjects(loginUserCode);
		return buildProjectUserTree(flatList);
	}

	private List<UserModalVO> buildProjectUserTree(List<UserModalVO> flatList) {
		Map<Integer, UserModalVO> map = new LinkedHashMap<>();

		for (UserModalVO vo : flatList) {
			// projectCode 기준으로 그룹 가져오기 (없으면 생성)
			UserModalVO projectNode = map.computeIfAbsent(vo.getProjectCode(), key -> {
				UserModalVO p = new UserModalVO();
				p.setProjectCode(vo.getProjectCode());
				p.setProjectName(vo.getProjectName());
				p.setChildren(new ArrayList<>());
				return p;
			});

			UserModalVO userNode = new UserModalVO();
			userNode.setUserCode(vo.getUserCode());
			userNode.setUserName(vo.getUserName());

			projectNode.getChildren().add(userNode);
		}
		return new ArrayList<>(map.values());
	}
	
	//공지
	@Override
	public List<UserModalVO> findNoticeCreatorByMyProjects(Long loginUserCode) {
	  List<UserModalVO> flatList = userModalMapper.selectNoticeCreatorByMyProjects(loginUserCode);
	  return buildProjectUserTree(flatList);
	}
	
	//작업내역
	@Override
	public List<UserModalVO> findUsersInMyProjects(Long loginUserCode) {
	  List<UserModalVO> flatList = userModalMapper.selectUsersInMyProjects(loginUserCode);
	  return buildProjectUserTree(flatList);
	}
	
	//소요시간
	@Override
	public List<UserModalVO> findWorklogWorkersByMyProjects(Long loginUserCode) {
	  List<UserModalVO> flatList = userModalMapper.selectWorklogWorkersByMyProjects(loginUserCode);
	  return buildProjectUserTree(flatList);
	}
	
	// 문서용
    public List<UserModalVO> findDocsCreatorByMyProjects(Long loginUserCode) {
    	List<UserModalVO> flatList = userModalMapper.selectDocsCreatorByMyProjects(loginUserCode);
    	return buildProjectUserTree(flatList);
    }
}
