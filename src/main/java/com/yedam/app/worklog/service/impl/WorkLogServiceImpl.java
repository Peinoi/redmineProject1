package com.yedam.app.worklog.service.impl;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.worklog.mapper.WorkLogMapper;
import com.yedam.app.worklog.service.WorkLogService;
import com.yedam.app.worklog.service.WorkLogVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WorkLogServiceImpl implements WorkLogService {

  private final WorkLogMapper workLogMapper;

  @Override
  public List<Map<String, Object>> listWorklogs(String from, String to, HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) {
      throw new IllegalStateException("로그인이 필요합니다.");
    }
    Integer loginUserCode = user.getUserCode();
    return workLogMapper.selectWorklogList(from, to, loginUserCode);
  }

  @Override
  public List<Map<String, Object>> getPrefill(Long issueCode, HttpSession session) {
    if (issueCode == null) throw new IllegalArgumentException("일감 코드가 필요합니다.");

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) {
      throw new IllegalStateException("로그인이 필요합니다.");
    }

    Integer loginUserCode = user.getUserCode();
    return workLogMapper.selectIssuePrefill(issueCode, loginUserCode);
  }

  @Override
  @Transactional
  public void createWorklog(WorkLogVO vo, HttpSession session) {
    if (vo == null) throw new IllegalArgumentException("요청 값이 없습니다.");
    if (vo.getIssueCode() == null) throw new IllegalArgumentException("일감이 필요합니다.");
    if (vo.getWorkDate() == null) throw new IllegalArgumentException("작업일이 필요합니다.");
    if (vo.getSpentMinutes() == null || vo.getSpentMinutes() < 1) {
      throw new IllegalArgumentException("소요시간(분)은 1 이상이어야 합니다.");
    }

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) throw new IllegalStateException("로그인이 필요합니다.");
    Integer loginUserCode = user.getUserCode();

    Map<String, Object> authInfo = workLogMapper.selectIssueAuthInfo(vo.getIssueCode());
    if (authInfo == null || authInfo.get("projectCode") == null) {
      throw new IllegalArgumentException("유효하지 않은 일감입니다.");
    }

    Long projectCode = ((Number) authInfo.get("projectCode")).longValue();
    Long assigneeCode = null;
    Object a = authInfo.get("assigneeCode");
    if (a instanceof Number) assigneeCode = ((Number) a).longValue();

    boolean isAssignee = (assigneeCode != null && assigneeCode.longValue() == loginUserCode.longValue());

    String adminCk = workLogMapper.selectProjectAdminCk(projectCode, loginUserCode);
    boolean isAdmin = "Y".equalsIgnoreCase(String.valueOf(adminCk));

    if (!(isAdmin || isAssignee)) throw new SecurityException("권한이 없습니다.");

    // 서버도 UI 규칙과 동일하게 적용
    if (isAdmin) {
      // 관리자는 선택 작업자 허용, 단 비어있으면 본인으로
      if (vo.getWorkerCode() == null) vo.setWorkerCode(loginUserCode);
    } else {
      // 관리자가 아니면 무조건 본인 고정
      vo.setWorkerCode(loginUserCode);
    }

    // projectCode는 DB insert에 직접 안 넣어도 되지만, 검증/확장 위해 세팅
    vo.setProjectCode(projectCode);

    // description null 방지
    if (vo.getDescription() != null && vo.getDescription().trim().isEmpty()) {
      vo.setDescription(null);
    }

    // 날짜가 이상하게 들어오는 케이스 방지(보험)
    if (vo.getWorkDate() == null) vo.setWorkDate(LocalDate.now());

    workLogMapper.insertWorkLog(vo);
  }
  
  @Override
  public Map<String, Object> getWorklog(Long workLogCode, HttpSession session) {
    if (workLogCode == null) throw new IllegalArgumentException("소요시간 코드가 필요합니다.");

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) {
      throw new IllegalStateException("로그인이 필요합니다.");
    }

    Map<String, Object> row = workLogMapper.selectWorklogDetail(workLogCode, user.getUserCode());
    if (row == null) throw new IllegalArgumentException("데이터가 없습니다.");
    return row;
  }

  private static Long toLong(Object v) {
    if (v == null) return null;
    if (v instanceof Number) return ((Number) v).longValue();
    try { return Long.parseLong(String.valueOf(v)); } catch (Exception e) { return null; }
  }

  private static Integer toInt(Object v) {
    if (v == null) return null;
    if (v instanceof Number) return ((Number) v).intValue();
    try { return Integer.parseInt(String.valueOf(v)); } catch (Exception e) { return null; }
  }

  private boolean canEditOrDeleteWorklog(Long workLogCode, Integer loginUserCode) {
    Map<String, Object> authInfo = workLogMapper.selectWorklogAuthInfo(workLogCode);
    if (authInfo == null || authInfo.get("projectCode") == null) {
      throw new IllegalArgumentException("유효하지 않은 소요시간입니다.");
    }

    Long projectCode = toLong(authInfo.get("projectCode"));
    Integer assigneeCode = toInt(authInfo.get("assigneeCode"));

    boolean isAssignee = (assigneeCode != null && assigneeCode.intValue() == loginUserCode.intValue());

    String adminCk = workLogMapper.selectProjectAdminCk(projectCode, loginUserCode);
    boolean isAdmin = "Y".equalsIgnoreCase(String.valueOf(adminCk));

    if (!(isAdmin || isAssignee)) {
      throw new SecurityException("권한이 없습니다.");
    }
    return isAdmin;
  }

  @Override
  @Transactional
  public void updateWorklog(Long workLogCode, WorkLogVO vo, HttpSession session) {
    if (workLogCode == null) throw new IllegalArgumentException("소요시간 코드가 필요합니다.");
    if (vo == null) throw new IllegalArgumentException("요청 값이 없습니다.");

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) throw new IllegalStateException("로그인이 필요합니다.");
    Integer loginUserCode = user.getUserCode();

    // 권한 체크 
    boolean isAdmin = canEditOrDeleteWorklog(workLogCode, loginUserCode);

    // 기본 유효성
    if (vo.getWorkDate() == null) throw new IllegalArgumentException("작업일이 필요합니다.");
    if (vo.getSpentMinutes() == null || vo.getSpentMinutes() < 1) {
      throw new IllegalArgumentException("소요시간(분)은 1 이상이어야 합니다.");
    }

    // workerCode 규칙
    if (isAdmin) {
      if (vo.getWorkerCode() == null) vo.setWorkerCode(loginUserCode);
    } else {
      vo.setWorkerCode(loginUserCode);
    }

    if (vo.getDescription() != null && vo.getDescription().trim().isEmpty()) {
      vo.setDescription(null);
    }

    vo.setWorkLogCode(workLogCode);

    int updated = workLogMapper.updateWorkLog(vo);
    if (updated != 1) throw new IllegalStateException("수정에 실패했습니다.");
  }

  @Override
  @Transactional
  public void deleteWorklog(Long workLogCode, HttpSession session) {
    if (workLogCode == null) throw new IllegalArgumentException("소요시간 코드가 필요합니다.");

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) throw new IllegalStateException("로그인이 필요합니다.");
    Integer loginUserCode = user.getUserCode();

    // 권한 체크
    canEditOrDeleteWorklog(workLogCode, loginUserCode);

    int deleted = workLogMapper.deleteWorkLog(workLogCode);
    if (deleted != 1) throw new IllegalStateException("삭제에 실패했습니다.");
  }
  
  @Override
  public List<Map<String, Object>> getStats(
      String groupBy,
      boolean includeIssue,
      Long projectCode,
      Long typeCode,
      Integer workerCode,
      String issueTitle,
      String workTime,
      HttpSession session
  ) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) {
      throw new IllegalStateException("로그인이 필요합니다.");
    }

    // groupBy 기본값 정리 (project/worker/type 허용)
    String g = (groupBy == null) ? "worker" : groupBy.toLowerCase();
    if (!"project".equals(g) && !"worker".equals(g) && !"type".equals(g)) {
      g = "worker";
    }

    Integer minMinutes = parseWorkTimeToMinutes(workTime);

    return workLogMapper.selectWorklogStats(
        user.getUserCode(),
        g,
        includeIssue,
        projectCode,
        typeCode,
        workerCode,
        issueTitle,
        minMinutes
    );
  }

  private Integer parseWorkTimeToMinutes(String workTime) {
    if (workTime == null) return null;
    String s = workTime.trim();
    if (s.isEmpty()) return null;

    // "0:00"은 미적용으로 취급
    if ("0:00".equals(s) || "00:00".equals(s)) return null;

    String[] parts = s.split(":");
    if (parts.length != 2) return null;

    try {
      int h = Integer.parseInt(parts[0].trim());
      int m = Integer.parseInt(parts[1].trim());
      if (h < 0) h = 0;
      if (m < 0) m = 0;
      if (m > 59) m = 59;
      return h * 60 + m;
    } catch (Exception e) {
      return null;
    }
  }
}