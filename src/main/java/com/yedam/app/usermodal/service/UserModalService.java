package com.yedam.app.usermodal.service;

import java.util.List;

public interface UserModalService {
	 List<UserModalVO> findUserModalListByProject(Long projectCode);
}
