package com.yedam.app.log.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yedam.app.log.mapper.LogMapper;
import com.yedam.app.log.service.LogService;
import com.yedam.app.log.service.LogVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LogServiceImpl implements LogService {

  private final LogMapper logMapper;

  @Override
  @Transactional
  public int addActionLog(Long projectCode,
                          Integer userCode,
                          String actionType,
                          String targetType,
                          Long targetCode,
                          String meta) {

    if (projectCode == null) return 0;
    if (userCode == null) return 0;
    if (actionType == null || actionType.isBlank()) return 0;
    if (targetType == null || targetType.isBlank()) return 0;
    if (targetCode == null) return 0;

    LogVO log = new LogVO();
    log.setProjectCode(projectCode);
    log.setUserCode(userCode);
    log.setActionType(actionType);
    log.setTargetType(targetType);
    log.setTargetCode(targetCode);
    log.setMeta(meta);

    return logMapper.insertLog(log);
  }
  
  @Override
  public List<LogVO> findLogsByTarget(String targetType, Long targetCode) {
    return logMapper.selectLogsByTarget(targetType, targetCode);
  }
}
