package com.yedam.app.usermgr.service;

import java.util.List;

import com.yedam.app.project.service.PruserVO;

public interface UsermgrService {

    // 사용자 목록
    public List<PruserVO> userFindAll();

    // 
    public PruserVO selectNextNo();

    // 사용자 추가 (비밀번호 암호화는 Impl 내부에서 처리)
    public int insertUser(PruserVO pruserVO);

    // 잠금 / 잠금해제
    public int lockUpdateUser(String isLock, Integer userCode);

    // 소프트 삭제
    public int deleteUser(Integer userCode);
}