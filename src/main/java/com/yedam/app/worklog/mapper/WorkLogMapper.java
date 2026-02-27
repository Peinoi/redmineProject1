package com.yedam.app.worklog.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.worklog.service.WorkLogVO;

public interface WorkLogMapper {

  List<Map<String, Object>> selectWorklogList(@Param("from") String from,
                                              @Param("to") String to,
                                              @Param("sysCk") String sysCk,
                                              @Param("allProjectCodes") List<Long> allProjectCodes,
                                              @Param("adminProjectCodes") List<Long> adminProjectCodes,
                                              @Param("readableProjectCodes") List<Long> readableProjectCodes);

  List<Map<String, Object>> selectIssuePrefill(@Param("issueCode") Long issueCode,
                                               @Param("sysCk") String sysCk,
                                               @Param("allProjectCodes") List<Long> allProjectCodes,
                                               @Param("adminProjectCodes") List<Long> adminProjectCodes,
                                               @Param("readableProjectCodes") List<Long> readableProjectCodes);

  Map<String, Object> selectIssueAuthInfo(@Param("issueCode") Long issueCode);

  String selectProjectAdminCk(@Param("projectCode") Long projectCode,
                              @Param("userCode") Integer loginUserCode);

  int insertWorkLog(WorkLogVO vo);

  Map<String, Object> selectWorklogDetail(@Param("workLogCode") Long workLogCode,
                                          @Param("sysCk") String sysCk,
                                          @Param("allProjectCodes") List<Long> allProjectCodes,
                                          @Param("adminProjectCodes") List<Long> adminProjectCodes,
                                          @Param("readableProjectCodes") List<Long> readableProjectCodes);

  Map<String, Object> selectWorklogAuthInfo(@Param("workLogCode") Long workLogCode);
  // projectCode, assigneeCode, workerCode, issueCode

  int updateWorkLog(WorkLogVO vo);

  int deleteWorkLog(@Param("workLogCode") Long workLogCode);

  List<Map<String, Object>> selectWorklogStats(@Param("sysCk") String sysCk,
                                               @Param("allProjectCodes") List<Long> allProjectCodes,
                                               @Param("adminProjectCodes") List<Long> adminProjectCodes,
                                               @Param("readableProjectCodes") List<Long> readableProjectCodes,
                                               @Param("includeType") int includeType,
                                               @Param("includeWorker") int includeWorker,
                                               @Param("includeIssue") int includeIssue,
                                               @Param("projectCode") Long projectCode,
                                               @Param("typeCode") Long typeCode,
                                               @Param("workerCode") Integer workerCode,
                                               @Param("issueTitle") String issueTitle,
                                               @Param("minMinutes") Integer minMinutes);
}