package com.yedam.app.worklog.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.worklog.service.WorkLogVO;

public interface WorkLogMapper {

  List<Map<String, Object>> selectWorklogList(@Param("from") String from,
                                             @Param("to") String to);

  Map<String, Object> selectIssuePrefill(@Param("issueCode") Long issueCode);

  Long selectAssigneeCode(@Param("issueCode") Long issueCode);

  int insertWorkLog(WorkLogVO vo);
}