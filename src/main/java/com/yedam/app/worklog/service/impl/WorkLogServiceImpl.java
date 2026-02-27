package com.yedam.app.worklog.service.impl;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.project.service.UserProjectAuthVO;
import com.yedam.app.worklog.mapper.WorkLogMapper;
import com.yedam.app.worklog.service.WorkLogService;
import com.yedam.app.worklog.service.WorkLogVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WorkLogServiceImpl implements WorkLogService {

  private final WorkLogMapper workLogMapper;

  private static class SessionWorklogAuth {
    private final String sysCk;
    private final List<Long> allProjectCodes;
    private final List<Long> adminProjectCodes;
    private final List<Long> readableProjectCodes;
    private final List<Long> writableProjectCodes;
    private final List<Long> modifiableProjectCodes;
    private final List<Long> deletableProjectCodes;

    public SessionWorklogAuth(String sysCk,
                              List<Long> allProjectCodes,
                              List<Long> adminProjectCodes,
                              List<Long> readableProjectCodes,
                              List<Long> writableProjectCodes,
                              List<Long> modifiableProjectCodes,
                              List<Long> deletableProjectCodes) {
      this.sysCk = sysCk;
      this.allProjectCodes = allProjectCodes;
      this.adminProjectCodes = adminProjectCodes;
      this.readableProjectCodes = readableProjectCodes;
      this.writableProjectCodes = writableProjectCodes;
      this.modifiableProjectCodes = modifiableProjectCodes;
      this.deletableProjectCodes = deletableProjectCodes;
    }

    public String getSysCk() {
      return sysCk;
    }

    public List<Long> getAllProjectCodes() {
      return allProjectCodes;
    }

    public List<Long> getAdminProjectCodes() {
      return adminProjectCodes;
    }

    public List<Long> getReadableProjectCodes() {
      return readableProjectCodes;
    }

    public List<Long> getWritableProjectCodes() {
      return writableProjectCodes;
    }

    public List<Long> getModifiableProjectCodes() {
      return modifiableProjectCodes;
    }

    public List<Long> getDeletableProjectCodes() {
      return deletableProjectCodes;
    }
  }

  private UserVO getLoginUser(HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) {
      throw new IllegalStateException("로그인이 필요합니다.");
    }
    return user;
  }

  private SessionWorklogAuth buildSessionWorklogAuth(HttpSession session) {
    UserVO user = getLoginUser(session);

    @SuppressWarnings("unchecked")
    List<UserProjectAuthVO> userAuthList =
        (List<UserProjectAuthVO>) session.getAttribute("userAuth");

    String sysCk = user.getSysCk();

    Set<Long> allProjectSet = new LinkedHashSet<>();
    Set<Long> adminProjectSet = new LinkedHashSet<>();
    Set<Long> readableProjectSet = new LinkedHashSet<>();
    Set<Long> writableProjectSet = new LinkedHashSet<>();
    Set<Long> modifiableProjectSet = new LinkedHashSet<>();
    Set<Long> deletableProjectSet = new LinkedHashSet<>();

    if (userAuthList != null) {
      for (UserProjectAuthVO auth : userAuthList) {
        if (auth == null || auth.getProjectCode() == null) continue;

        Long code = auth.getProjectCode().longValue();

        allProjectSet.add(code);

        if (auth.getAdmin() != null && auth.getAdmin() == 1) {
          adminProjectSet.add(code);
        }

        if ("소요시간".equals(auth.getCategory()) && "Y".equals(auth.getRdRol())) {
          readableProjectSet.add(code);
        }

        if ("소요시간".equals(auth.getCategory()) && "Y".equals(auth.getWrRol())) {
          writableProjectSet.add(code);
        }

        if ("소요시간".equals(auth.getCategory()) && "Y".equals(auth.getMoRol())) {
          modifiableProjectSet.add(code);
        }

        if ("소요시간".equals(auth.getCategory()) && "Y".equals(auth.getDelRol())) {
          deletableProjectSet.add(code);
        }
      }
    }

    readableProjectSet.removeAll(adminProjectSet);
    writableProjectSet.removeAll(adminProjectSet);
    modifiableProjectSet.removeAll(adminProjectSet);
    deletableProjectSet.removeAll(adminProjectSet);

    return new SessionWorklogAuth(
        sysCk,
        new ArrayList<>(allProjectSet),
        new ArrayList<>(adminProjectSet),
        new ArrayList<>(readableProjectSet),
        new ArrayList<>(writableProjectSet),
        new ArrayList<>(modifiableProjectSet),
        new ArrayList<>(deletableProjectSet)
    );
  }

  private boolean containsProject(List<Long> list, Long projectCode) {
    return projectCode != null && list != null && list.contains(projectCode);
  }

  private boolean isSysUser(SessionWorklogAuth auth) {
    return auth != null && "Y".equals(auth.getSysCk());
  }

  private boolean canReadProject(SessionWorklogAuth auth, Long projectCode) {
    if (projectCode == null || auth == null) return false;

    if (isSysUser(auth)) {
      return containsProject(auth.getAllProjectCodes(), projectCode);
    }

    return containsProject(auth.getAdminProjectCodes(), projectCode)
        || containsProject(auth.getReadableProjectCodes(), projectCode);
  }

  private boolean canWriteProject(SessionWorklogAuth auth, Long projectCode) {
    if (projectCode == null || auth == null) return false;

    if (isSysUser(auth)) {
      return containsProject(auth.getAllProjectCodes(), projectCode);
    }

    return containsProject(auth.getAdminProjectCodes(), projectCode)
        || containsProject(auth.getWritableProjectCodes(), projectCode);
  }

  private boolean canModifyProject(SessionWorklogAuth auth, Long projectCode) {
    if (projectCode == null || auth == null) return false;

    if (isSysUser(auth)) {
      return containsProject(auth.getAllProjectCodes(), projectCode);
    }

    return containsProject(auth.getAdminProjectCodes(), projectCode)
        || containsProject(auth.getModifiableProjectCodes(), projectCode);
  }

  private boolean canDeleteProject(SessionWorklogAuth auth, Long projectCode) {
    if (projectCode == null || auth == null) return false;

    if (isSysUser(auth)) {
      return containsProject(auth.getAllProjectCodes(), projectCode);
    }

    return containsProject(auth.getAdminProjectCodes(), projectCode)
        || containsProject(auth.getDeletableProjectCodes(), projectCode);
  }

  private boolean isAdminProject(SessionWorklogAuth auth, Long projectCode) {
    if (projectCode == null || auth == null) return false;

    if (isSysUser(auth)) {
      return containsProject(auth.getAllProjectCodes(), projectCode);
    }

    return containsProject(auth.getAdminProjectCodes(), projectCode);
  }

  private boolean hasAnyReadPermission(SessionWorklogAuth auth) {
    if (auth == null) return false;

    if (isSysUser(auth)) {
      return auth.getAllProjectCodes() != null && !auth.getAllProjectCodes().isEmpty();
    }

    boolean noAdmin = auth.getAdminProjectCodes() == null || auth.getAdminProjectCodes().isEmpty();
    boolean noRead = auth.getReadableProjectCodes() == null || auth.getReadableProjectCodes().isEmpty();
    return !(noAdmin && noRead);
  }

  @Override
  public List<Map<String, Object>> listWorklogs(String from, String to, HttpSession session) {
    SessionWorklogAuth auth = buildSessionWorklogAuth(session);

    if (!hasAnyReadPermission(auth)) {
      return List.of();
    }

    return workLogMapper.selectWorklogList(
        from,
        to,
        auth.getSysCk(),
        auth.getAllProjectCodes(),
        auth.getAdminProjectCodes(),
        auth.getReadableProjectCodes()
    );
  }

  @Override
  public List<Map<String, Object>> getPrefill(Long issueCode, HttpSession session) {
    if (issueCode == null) throw new IllegalArgumentException("일감 코드가 필요합니다.");

    SessionWorklogAuth auth = buildSessionWorklogAuth(session);

    if (!hasAnyReadPermission(auth)) {
      return List.of();
    }

    return workLogMapper.selectIssuePrefill(
        issueCode,
        auth.getSysCk(),
        auth.getAllProjectCodes(),
        auth.getAdminProjectCodes(),
        auth.getReadableProjectCodes()
    );
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

    UserVO user = getLoginUser(session);
    Integer loginUserCode = user.getUserCode();

    Map<String, Object> authInfo = workLogMapper.selectIssueAuthInfo(vo.getIssueCode());
    if (authInfo == null || authInfo.get("projectCode") == null) {
      throw new IllegalArgumentException("유효하지 않은 일감입니다.");
    }

    Long projectCode = ((Number) authInfo.get("projectCode")).longValue();

    Long assigneeCode = null;
    Object a = authInfo.get("assigneeCode");
    if (a instanceof Number) {
      assigneeCode = ((Number) a).longValue();
    }

    SessionWorklogAuth auth = buildSessionWorklogAuth(session);

    boolean isAssignee = (assigneeCode != null && assigneeCode.longValue() == loginUserCode.longValue());
    boolean isAdmin = isAdminProject(auth, projectCode);
    boolean canWrite = canWriteProject(auth, projectCode);

    if (!canWrite) {
      throw new SecurityException("소요시간 등록 권한이 없습니다.");
    }

    if (!(isAdmin || isAssignee)) {
      throw new SecurityException("권한이 없습니다.");
    }

    if (isAdmin) {
      if (vo.getWorkerCode() == null) {
        vo.setWorkerCode(loginUserCode);
      }
    } else {
      vo.setWorkerCode(loginUserCode);
    }

    vo.setProjectCode(projectCode);

    if (vo.getDescription() != null && vo.getDescription().trim().isEmpty()) {
      vo.setDescription(null);
    }

    if (vo.getWorkDate() == null) {
      vo.setWorkDate(LocalDate.now());
    }

    workLogMapper.insertWorkLog(vo);
  }

  @Override
  public Map<String, Object> getWorklog(Long workLogCode, HttpSession session) {
    if (workLogCode == null) throw new IllegalArgumentException("소요시간 코드가 필요합니다.");

    SessionWorklogAuth auth = buildSessionWorklogAuth(session);

    Map<String, Object> row = workLogMapper.selectWorklogDetail(
        workLogCode,
        auth.getSysCk(),
        auth.getAllProjectCodes(),
        auth.getAdminProjectCodes(),
        auth.getReadableProjectCodes()
    );

    if (row == null) throw new IllegalArgumentException("데이터가 없습니다.");
    return row;
  }

  private static Long toLong(Object v) {
    if (v == null) return null;
    if (v instanceof Number) return ((Number) v).longValue();
    try {
      return Long.parseLong(String.valueOf(v));
    } catch (Exception e) {
      return null;
    }
  }

  private static Integer toInt(Object v) {
    if (v == null) return null;
    if (v instanceof Number) return ((Number) v).intValue();
    try {
      return Integer.parseInt(String.valueOf(v));
    } catch (Exception e) {
      return null;
    }
  }

  private boolean canEditOrDeleteWorklog(Long workLogCode, HttpSession session, String action) {
    UserVO user = getLoginUser(session);
    Integer loginUserCode = user.getUserCode();

    Map<String, Object> authInfo = workLogMapper.selectWorklogAuthInfo(workLogCode);
    if (authInfo == null || authInfo.get("projectCode") == null) {
      throw new IllegalArgumentException("유효하지 않은 소요시간입니다.");
    }

    Long projectCode = toLong(authInfo.get("projectCode"));
    Integer assigneeCode = toInt(authInfo.get("assigneeCode"));

    SessionWorklogAuth auth = buildSessionWorklogAuth(session);

    boolean isAssignee = (assigneeCode != null && assigneeCode.intValue() == loginUserCode.intValue());
    boolean isAdmin = isAdminProject(auth, projectCode);

    boolean hasActionPermission;
    if ("MODIFY".equals(action)) {
      hasActionPermission = canModifyProject(auth, projectCode);
    } else if ("DELETE".equals(action)) {
      hasActionPermission = canDeleteProject(auth, projectCode);
    } else {
      hasActionPermission = false;
    }

    if (!hasActionPermission) {
      throw new SecurityException("권한이 없습니다.");
    }

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

    UserVO user = getLoginUser(session);
    Integer loginUserCode = user.getUserCode();

    boolean isAdmin = canEditOrDeleteWorklog(workLogCode, session, "MODIFY");

    if (vo.getWorkDate() == null) throw new IllegalArgumentException("작업일이 필요합니다.");
    if (vo.getSpentMinutes() == null || vo.getSpentMinutes() < 1) {
      throw new IllegalArgumentException("소요시간(분)은 1 이상이어야 합니다.");
    }

    if (isAdmin) {
      if (vo.getWorkerCode() == null) {
        vo.setWorkerCode(loginUserCode);
      }
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

    canEditOrDeleteWorklog(workLogCode, session, "DELETE");

    int deleted = workLogMapper.deleteWorkLog(workLogCode);
    if (deleted != 1) throw new IllegalStateException("삭제에 실패했습니다.");
  }

  @Override
  public List<Map<String, Object>> getStats(int includeType,
                                            int includeWorker,
                                            int includeIssue,
                                            Long projectCode,
                                            Long typeCode,
                                            Integer workerCode,
                                            String issueTitle,
                                            String workTime,
                                            HttpSession session) {

    SessionWorklogAuth auth = buildSessionWorklogAuth(session);

    if (projectCode != null && !canReadProject(auth, projectCode)) {
      return List.of();
    }

    if (!hasAnyReadPermission(auth)) {
      return List.of();
    }

    Integer minMinutes = parseWorkTimeToMinutes(workTime);

    return workLogMapper.selectWorklogStats(
        auth.getSysCk(),
        auth.getAllProjectCodes(),
        auth.getAdminProjectCodes(),
        auth.getReadableProjectCodes(),
        includeType,
        includeWorker,
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