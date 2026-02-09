package com.yedam.app.log.service;

import java.util.List;

public interface LogService {
  int addActionLog(Long projectCode,
                   Integer userCode,
                   String actionType,
                   String targetType,
                   Long targetCode,
                   String meta);
  
  List<LogVO> findLogsByTarget(String targetType, Long targetCode);
}
