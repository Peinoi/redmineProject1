(() => {
  const $ = (s) => document.querySelector(s);

  const form = $("#issueEditForm");

  const titleInp = $("#title");
  const descInp = $("#editor");

  const statusSel = $("#statusId");
  const prioritySel = $("#priority");
  const progressInp = $("#progress");

  const uploadFileInp = $("#uploadFile");

  const createdView = $("#createdDateView"); // readonly
  const dueView = $("#dueDateView");
  const startedView = $("#startedDateView");
  const resolvedView = $("#resolvedDateView");

  const createdAt = $("#createdAt");
  const dueAt = $("#dueAt");
  const startedAt = $("#startedAt");
  const resolvedAt = $("#resolvedAt");

  const btnBack = $("#btnBack");
  const btnReset = $("#btnReset");

  // --- 일감/프로젝트 정보 ---
  const issueCodeEl = $("#issueCode");

  // 기존 hidden 프로젝트 코드
  const projectCodeEl = $("#projectCode");
  const projectTextEl = $("#projectText");

  // --- 프로젝트 모달(수정화면에서는 보통 없음: optional) ---
  const btnOpenProjectModal = $("#btnOpenProjectModal");
  const projectModalEl = $("#projectSelectModal");
  const projectModal = projectModalEl
    ? new bootstrap.Modal(projectModalEl)
    : null;
  const projectListEl = $("#projectModalList");
  const projectSearchEl = $("#projectModalSearch");

  // --- 상위일감(Parent issue) ---
  const parIssueText = $("#parIssueText");
  const parIssueCode = $("#parIssueCode");
  const btnOpenParIssueModal = $("#btnOpenParIssueModal");
  const btnClearParIssue = $("#btnClearParIssue");

  const parIssueModalEl = $("#parIssueSelectModal");
  const parIssueModal = parIssueModalEl
    ? new bootstrap.Modal(parIssueModalEl)
    : null;
  const parIssueSearchEl = $("#parIssueModalSearch");
  const parIssueTbody = $("#parIssueModalList");

  const toDT = (d) => (d ? `${d}T00:00` : "");

  // --- 유형(Type) 모달 (테이블) ---
  const typeModalEl = $("#typeSelectModal");
  const typeModal = typeModalEl ? new bootstrap.Modal(typeModalEl) : null;

  const typeText = $("#typeText");

  // id 중복 방지용: typeCode는 name 기준으로 마지막 하나를 사용
  const getTypeCodeInput = () => {
    const list = document.querySelectorAll('input[name="typeCode"]');
    if (list.length === 0) return $("#typeCode");
    return list[list.length - 1];
  };
  const typeCode = getTypeCodeInput();

  const btnOpenTypeModal = $("#btnOpenTypeModal");
  const btnClearType = $("#btnClearType");

  const typeTbody = $("#typeModalList");
  const typeSearchEl = $("#typeModalSearch");

  let typeCache = [];

  // --- 담당자 모달 ---
  const assigneeModalEl = $("#assigneeSelectModal");
  const assigneeModal = assigneeModalEl
    ? new bootstrap.Modal(assigneeModalEl)
    : null;
  const assigneeText = $("#assigneeText");
  const assigneeCode = $("#assigneeCode");
  const btnOpenAssigneeModal = $("#btnOpenAssigneeModal");
  const assigneeListEl = $("#assigneeModalList");
  const assigneeSearchEl = $("#assigneeModalSearch");

  // 프로젝트별 캐시
  let projectCache = [];
  let userCache = [];
  let userCacheProjectCode = "";

  const parentIssueCacheByProject = new Map();

  // -------------------------
  // Toast (등록 화면 스타일로 통일)
  // -------------------------
  const showToast = (message) => {
    const toastId = "commonToast";
    let toastEl = document.getElementById(toastId);

    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = toastId;
      toastEl.className = "toast align-items-center text-bg-dark border-0";
      toastEl.setAttribute("role", "alert");
      toastEl.setAttribute("aria-live", "assertive");
      toastEl.setAttribute("aria-atomic", "true");
      toastEl.style.position = "fixed";
      toastEl.style.right = "16px";
      toastEl.style.bottom = "16px";
      toastEl.style.zIndex = "1080";

      toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body" id="commonToastBody"></div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      `;
      document.body.appendChild(toastEl);
    }

    const bodyEl = document.getElementById("commonToastBody");
    if (bodyEl) bodyEl.textContent = message;

    const t = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 1800 });
    t.show();
  };

  // 마감기한 자동복구 토스트 중복 방지
  let lastDueToastAt = 0;
  const showDueAutoToast = () => {
    const now = Date.now();
    if (now - lastDueToastAt < 1200) return;
    lastDueToastAt = now;
    showToast(
      "마감기한이 삭제되어 우선순위 기준으로 자동 설정되어 저장됩니다.",
    );
  };

  // -------------------------
  // 날짜/우선순위 유틸
  // -------------------------
  const pad2 = (n) => String(n).padStart(2, "0");
  const toDate = (d) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const addDays = (base, days) => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
  };

  const PRIORITY_DAYS = { OA1: 2, OA2: 7, OA3: 14, OA4: 21 };
  const getPriorityDays = () => PRIORITY_DAYS[prioritySel?.value] ?? null;

  const setDueByPriority = () => {
    if (!dueView || !dueAt || !prioritySel) return;

    const days = getPriorityDays();
    if (!days) {
      // 우선순위 없으면 자동셋 불가
      return;
    }

    const dueStr = toDate(addDays(new Date(), days));
    dueView.value = dueStr;
    dueAt.value = toDT(dueStr);
  };

  // 마감기한 삭제 방지 + hidden 동기화
  const syncDueWithPriority = () => {
    if (!dueView || !dueAt) return;

    // 비었으면(삭제 시도) 우선순위로 복구 (우선순위가 있을 때만)
    if (!dueView.value) {
      if (!prioritySel?.value) {
        // 우선순위 없으면 여기서 토스트/복구하지 않고 submit에서 막힘
        return;
      }
      showDueAutoToast();
      setDueByPriority();
      return;
    }

    dueAt.value = toDT(dueView.value);
  };

  // 날짜 비교 (yyyy-mm-dd)
  const isBefore = (a, b) => {
    if (!a || !b) return false;
    // ISO 형식이라 문자열 비교로도 안전하지만, 명시적으로 Date로 비교
    const da = new Date(`${a}T00:00:00`);
    const db = new Date(`${b}T00:00:00`);
    return da.getTime() < db.getTime();
  };

  // -------------------------
  // 초기값 백업
  // -------------------------
  const initial = {
    title: titleInp?.value || "",
    description: descInp?.value || "",
    statusId: statusSel?.value || "",
    priority: prioritySel?.value || "",
    progress: progressInp?.value || "",
    due: dueView?.value || "",
    started: startedView?.value || "",
    resolved: resolvedView?.value || "",
    assigneeName: assigneeText?.value || "",
    assigneeCode: assigneeCode?.value || "",
    parIssueText: parIssueText?.value || "",
    parIssueCode: parIssueCode?.value || "",
    parIssueNameEnabled: parIssueCode?.getAttribute("name") === "parIssueCode",
    typeText: typeText?.value || "",
    typeCode: typeCode?.value || "",
    projectCode: projectCodeEl?.value || "",
    projectText: projectTextEl?.value || "",
  };

  // -------------------------
  // hidden 날짜 동기화
  // -------------------------
  const syncHiddenDates = () => {
    if (createdAt && createdView) createdAt.value = toDT(createdView.value);

    // due는 삭제방지 로직 포함해서 동기화
    syncDueWithPriority();

    if (startedAt && startedView) startedAt.value = toDT(startedView.value);

    if (resolvedAt && resolvedView) {
      // 완료(OB5)일 때만 완료일 저장, 아니면 비움
      resolvedAt.value =
        statusSel?.value === "OB5" ? toDT(resolvedView.value) : "";
    }
  };

  // -------------------------
  // 상태에 따른 UI 제어
  // -------------------------
  const toggleResolvedByStatus = () => {
    if (!resolvedView) return;
    const isDone = statusSel?.value === "OB5";
    resolvedView.disabled = !isDone;

    if (!isDone) resolvedView.value = "";
    if (!isDone && resolvedAt) resolvedAt.value = "";
  };

  const setProgressByStatus = () => {
    if (!statusSel || !progressInp) return;
    const s = statusSel.value;

    progressInp.readOnly = false;

    if (s === "OB1") {
      progressInp.value = "0";
      progressInp.min = "0";
      progressInp.max = "0";
      progressInp.readOnly = true;
      return;
    }

    if (s === "OB2") {
      progressInp.min = "0";
      progressInp.max = "90";
      let v = Number(progressInp.value);
      if (Number.isNaN(v)) v = 0;
      if (v < 0) v = 0;
      if (v > 90) v = 90;
      progressInp.value = String(v);
      return;
    }

    if (s === "OB3") {
      progressInp.value = "95";
      progressInp.min = "95";
      progressInp.max = "95";
      progressInp.readOnly = true;
      return;
    }

    if (s === "OB4") {
      progressInp.value = "50";
      progressInp.min = "50";
      progressInp.max = "50";
      progressInp.readOnly = true;
      return;
    }

    if (s === "OB5") {
      progressInp.value = "100";
      progressInp.min = "100";
      progressInp.max = "100";
      progressInp.readOnly = true;
      return;
    }

    progressInp.min = "0";
    progressInp.max = "100";
  };

  const clampProgress = () => {
    if (!statusSel || !progressInp) return;
    if (statusSel.value !== "OB2") return;

    let v = Number(progressInp.value);
    if (Number.isNaN(v)) v = 0;
    if (v < 0) v = 0;
    if (v > 90) v = 90;
    progressInp.value = String(v);
  };

  const onStatusChange = () => {
    const s = statusSel?.value || "";

    // 신규가 아닌 상태로 바꾸려면 시작일 필요
    if (s && s !== "OB1" && !startedView?.value) {
      showToast("신규가 아닌 상태로 변경하려면 시작일을 먼저 등록해야 합니다.");
      statusSel.value = "OB1";
    }

    toggleResolvedByStatus();
    setProgressByStatus();
    syncHiddenDates();
  };

  // -------------------------
  // 공통 fetch
  // -------------------------
  const fetchJson = async (url, failMsg) => {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      showToast(failMsg);
      return null;
    }
    return res.json();
  };

  // -------------------------
  // 프로젝트 모달
  // -------------------------
  const ensureProjectCache = async () => {
    if (projectCache.length) return true;

    const data = await fetchJson(
      "/api/projects/modal",
      "프로젝트 목록을 불러오지 못했습니다.",
    );
    if (!data) return false;

    projectCache = data.map((p) => ({
      value: String(p.projectCode),
      label: p.projectName,
    }));
    return true;
  };

  const renderProjectList = (items) => {
    if (!projectListEl) return;
    projectListEl.innerHTML = "";

    if (!items.length) {
      projectListEl.innerHTML =
        '<div class="text-muted">결과가 없습니다.</div>';
      return;
    }

    items.forEach((p) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "list-group-item list-group-item-action";
      b.textContent = p.label;
      b.addEventListener("click", async () => {
        const prev = String(projectCodeEl?.value || "").trim();
        const next = String(p.value || "").trim();

        if (projectTextEl) projectTextEl.value = p.label;
        if (projectCodeEl) projectCodeEl.value = p.value;

        if (projectSearchEl) projectSearchEl.value = "";
        projectModal?.hide();

        // 프로젝트가 바뀌면: 담당자/상위일감 초기화
        if (prev && prev !== next) {
          if (assigneeText) assigneeText.value = "";
          if (assigneeCode) assigneeCode.value = "";
          if (assigneeSearchEl) assigneeSearchEl.value = "";
          userCache = [];
          userCacheProjectCode = "";

          if (parIssueText) parIssueText.value = "";
          if (parIssueCode) parIssueCode.value = "";
          if (parIssueSearchEl) parIssueSearchEl.value = "";
        }
      });
      projectListEl.appendChild(b);
    });
  };

  const openProjectModal = async () => {
    if (!projectModal || !projectListEl) return;

    const ok = await ensureProjectCache();
    if (!ok) return;

    if (projectSearchEl) projectSearchEl.value = "";
    renderProjectList(projectCache);
    projectModal.show();
  };

  const refreshProjectList = async () => {
    if (!projectListEl) return;

    const ok = await ensureProjectCache();
    if (!ok) return;

    const q = (projectSearchEl?.value || "").trim().toLowerCase();
    const filtered = q
      ? projectCache.filter((p) => (p.label || "").toLowerCase().includes(q))
      : projectCache;

    renderProjectList(filtered);
  };

  // -------------------------
  // 유형 모달
  // -------------------------
  const ensureTypeCache = async () => {
    if (typeCache.length) return true;

    const res = await fetch("/api/types/modal", {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      showToast("유형 목록을 불러오지 못했습니다.");
      return false;
    }

    const data = await res.json();

    typeCache = data.map((t) => {
      const parent = (t.parTypeName ?? "").trim();
      const child = (t.typeName ?? "").trim();
      return {
        value: String(t.typeCode),
        parentName: parent,
        childName: child,
      };
    });

    return true;
  };

  const renderTypeTable = (items) => {
    if (!typeTbody) return;
    typeTbody.innerHTML = "";

    if (!items.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 2;
      td.className = "text-muted";
      td.textContent = "결과가 없습니다.";
      tr.appendChild(td);
      typeTbody.appendChild(tr);
      return;
    }

    items.forEach((t) => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";

      const tdParent = document.createElement("td");
      tdParent.textContent = t.parentName || "";

      const tdChild = document.createElement("td");
      tdChild.textContent = t.childName || "";

      tr.appendChild(tdParent);
      tr.appendChild(tdChild);

      tr.addEventListener("click", () => {
        if (typeText) typeText.value = t.childName;
        if (typeCode) typeCode.value = t.value;

        if (typeSearchEl) typeSearchEl.value = "";
        typeModal?.hide();
      });

      typeTbody.appendChild(tr);
    });
  };

  const openTypeModal = async () => {
    if (!typeModal) return;
    const ok = await ensureTypeCache();
    if (!ok) return;

    if (typeSearchEl) typeSearchEl.value = "";
    renderTypeTable(typeCache);
    typeModal.show();
  };

  const clearType = () => {
    if (typeText) typeText.value = "";
    if (typeCode) typeCode.value = "";
  };

  const filterTypes = (items, q) => {
    const qq = (q || "").trim().toLowerCase();
    if (!qq) return items;
    return items.filter((t) => {
      const p = (t.parentName || "").toLowerCase();
      const c = (t.childName || "").toLowerCase();
      return p.includes(qq) || c.includes(qq);
    });
  };

  const hydrateTypeTextIfEmpty = async () => {
    if (!typeCode || !typeText) return;
    if (!typeCode.value || typeText.value) return;

    const ok = await ensureTypeCache();
    if (!ok) return;

    const found = typeCache.find((t) => t.value === String(typeCode.value));
    if (found) typeText.value = found.childName;
  };

  // -------------------------
  // 담당자 모달(프로젝트 멤버만)
  // -------------------------
  const ensureUserCache = async () => {
    const projCode = String(projectCodeEl?.value || "").trim();
    if (!projCode) {
      showToast("프로젝트 정보가 없습니다.");
      return false;
    }

    if (userCache.length && userCacheProjectCode === projCode) return true;

    const res = await fetch(
      `/api/users/modal?projectCode=${encodeURIComponent(projCode)}`,
      { headers: { Accept: "application/json" } },
    );

    if (!res.ok) {
      showToast("사용자 목록을 불러오지 못했습니다.");
      return false;
    }

    const data = await res.json();

    userCache = data.map((u) => ({
      value: String(u.userCode),
      label: u.userName,
    }));
    userCacheProjectCode = projCode;

    return true;
  };

  const renderUsers = (items) => {
    if (!assigneeListEl) return;
    assigneeListEl.innerHTML = "";

    if (!items.length) {
      assigneeListEl.innerHTML =
        '<div class="text-muted">결과가 없습니다.</div>';
      return;
    }

    items.forEach((u) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "list-group-item list-group-item-action";
      b.textContent = u.label;
      b.addEventListener("click", () => {
        if (assigneeText) assigneeText.value = u.label;
        if (assigneeCode) assigneeCode.value = u.value;
        if (assigneeSearchEl) assigneeSearchEl.value = "";
        assigneeModal?.hide();
      });
      assigneeListEl.appendChild(b);
    });
  };

  const openAssigneeModal = async () => {
    if (!assigneeModal) return;

    const projCode = String(projectCodeEl?.value || "").trim();
    if (!projCode) {
      showToast("프로젝트 정보가 없습니다.");
      return;
    }

    const ok = await ensureUserCache();
    if (!ok) return;

    if (assigneeSearchEl) assigneeSearchEl.value = "";
    renderUsers(userCache);
    assigneeModal.show();
  };

  // -------------------------
  // 상위일감 모달
  // -------------------------
  const ensureParentIssues = async (projectCode) => {
    if (!projectCode) return false;
    if (parentIssueCacheByProject.has(projectCode)) return true;

    const data = await fetchJson(
      `/api/issues/parents?projectCode=${encodeURIComponent(projectCode)}`,
      "상위일감 목록을 불러오지 못했습니다.",
    );
    if (!data) return false;

    const list = data.map((i) => ({
      issueCode: Number(i.issueCode),
      title: i.title ?? "",
      assignee: (i.name ?? "미지정").trim(),
    }));

    parentIssueCacheByProject.set(projectCode, list);
    return true;
  };

  const renderParIssueTable = (items) => {
    if (!parIssueTbody) return;
    parIssueTbody.innerHTML = "";

    if (!items.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 2;
      td.className = "text-muted";
      td.textContent = "결과가 없습니다.";
      tr.appendChild(td);
      parIssueTbody.appendChild(tr);
      return;
    }

    items.forEach((it) => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";

      const tdTitle = document.createElement("td");
      tdTitle.textContent = it.title;

      const tdAssignee = document.createElement("td");
      tdAssignee.textContent = it.assignee;

      tr.appendChild(tdTitle);
      tr.appendChild(tdAssignee);

      tr.addEventListener("click", () => {
        const selfId = Number(issueCodeEl?.value);
        if (!Number.isNaN(selfId) && it.issueCode === selfId) {
          showToast("자기 자신을 상위일감으로 선택할 수 없습니다.");
          return;
        }

        if (parIssueCode) parIssueCode.setAttribute("name", "parIssueCode");

        if (parIssueText) parIssueText.value = it.title;
        if (parIssueCode) parIssueCode.value = String(it.issueCode);

        if (parIssueSearchEl) parIssueSearchEl.value = "";
        parIssueModal?.hide();
      });

      parIssueTbody.appendChild(tr);
    });
  };

  const filterParIssue = (items, q) => {
    const qq = (q || "").trim().toLowerCase();
    if (!qq) return items;
    return items.filter((it) => (it.title || "").toLowerCase().includes(qq));
  };

  const openParIssueModal = async () => {
    if (!parIssueModal) return;

    const projectCode = projectCodeEl?.value;
    if (!projectCode) {
      showToast("프로젝트 정보가 없습니다.");
      return;
    }

    const ok = await ensureParentIssues(projectCode);
    if (!ok) return;

    const list = parentIssueCacheByProject.get(projectCode) || [];
    if (parIssueSearchEl) parIssueSearchEl.value = "";
    renderParIssueTable(list);

    parIssueModal.show();
  };

  const clearParIssue = () => {
    if (!parIssueText || !parIssueCode) return;

    parIssueText.value = "";
    parIssueCode.value = "";

    parIssueCode.removeAttribute("name");
  };

  // -------------------------
  // 검증
  // -------------------------
  const validateBeforeSubmit = () => {
    const s = statusSel?.value || "";

    if (!typeCode?.value) {
      showToast("유형을 선택해 주세요.");
      btnOpenTypeModal?.focus();
      return false;
    }

    // 마감기한 삭제 방지 동기화(우선순위 있을 때 복구)
    syncDueWithPriority();

    // 신규가 아닌 상태는 시작일 필수
    if (s && s !== "OB1" && !startedView?.value) {
      showToast("신규가 아닌 상태로 저장하려면 시작일을 입력해야 합니다.");
      startedView?.focus();
      return false;
    }

    // 완료(OB5)면 완료일 필수
    if (s === "OB5" && !resolvedView?.value) {
      showToast("완료로 저장하려면 완료일을 입력해야 합니다.");
      resolvedView?.focus();
      return false;
    }

    // 완료일은 시작일보다 빠를 수 없음
    if (resolvedView?.value && startedView?.value) {
      if (isBefore(resolvedView.value, startedView.value)) {
        showToast("완료일은 시작일보다 빠를 수 없습니다.");
        resolvedView?.focus();
        return false;
      }
    }

    // 첨부파일 필수 조건: 완료(OB5) -> 해결(OB3)로 변경
    if (s === "OB3") {
      const hasFile = uploadFileInp?.files?.length > 0;
      if (!hasFile) {
        showToast("해결로 저장하려면 첨부파일을 등록해야 합니다.");
        uploadFileInp?.focus();
        return false;
      }
    }

    // 완료가 아니면 완료일 비움
    if (s !== "OB5") {
      if (resolvedView) resolvedView.value = "";
      if (resolvedAt) resolvedAt.value = "";
    }

    if (s === "OB2") clampProgress();
    setProgressByStatus();
    syncHiddenDates();
    return true;
  };

  // -------------------------
  // bind
  // -------------------------
  statusSel?.addEventListener("change", onStatusChange);

  prioritySel?.addEventListener("change", () => {
    // 우선순위 변경 시 마감기한 자동 재설정 + hidden 동기화
    setDueByPriority();
    syncHiddenDates();
  });

  progressInp?.addEventListener("input", () => {
    clampProgress();
    syncHiddenDates();
  });

  // 마감기한: 삭제 시도하면 우선순위로 복구 + 토스트
  dueView?.addEventListener("change", syncHiddenDates);
  dueView?.addEventListener("input", () => {
    if (!dueView.value) syncHiddenDates();
  });

  startedView?.addEventListener("change", () => {
    if (statusSel?.value && statusSel.value !== "OB1" && !startedView.value) {
      showToast("신규가 아닌 상태에서는 시작일을 비울 수 없습니다.");
      statusSel.value = "OB1";
    }
    onStatusChange();
  });

  resolvedView?.addEventListener("change", syncHiddenDates);

  // 프로젝트 모달 바인딩(요소가 있을 때만)
  btnOpenProjectModal?.addEventListener("click", openProjectModal);
  projectSearchEl?.addEventListener("input", refreshProjectList);

  // 담당자 모달
  btnOpenAssigneeModal?.addEventListener("click", openAssigneeModal);

  assigneeSearchEl?.addEventListener("input", async () => {
    const ok = await ensureUserCache();
    if (!ok) return;
    const q = (assigneeSearchEl.value || "").trim().toLowerCase();
    renderUsers(
      q
        ? userCache.filter((u) => u.label.toLowerCase().includes(q))
        : userCache,
    );
  });

  // 상위일감 모달
  btnOpenParIssueModal?.addEventListener("click", openParIssueModal);
  btnClearParIssue?.addEventListener("click", clearParIssue);

  parIssueSearchEl?.addEventListener("input", async () => {
    const projectCode = projectCodeEl?.value;
    if (!projectCode) return;

    const ok = await ensureParentIssues(projectCode);
    if (!ok) return;

    const list = parentIssueCacheByProject.get(projectCode) || [];
    const q = parIssueSearchEl.value || "";
    renderParIssueTable(filterParIssue(list, q));
  });

  // 유형 모달
  btnOpenTypeModal?.addEventListener("click", openTypeModal);
  btnClearType?.addEventListener("click", clearType);

  typeSearchEl?.addEventListener("input", async () => {
    const ok = await ensureTypeCache();
    if (!ok) return;

    const q = typeSearchEl.value || "";
    renderTypeTable(filterTypes(typeCache, q));
  });

  btnBack?.addEventListener("click", () => history.back());

  btnReset?.addEventListener("click", () => {
    if (titleInp) titleInp.value = initial.title;
    if (descInp) descInp.value = initial.description;

    if (statusSel) statusSel.value = initial.statusId;
    if (prioritySel) prioritySel.value = initial.priority;
    if (progressInp) progressInp.value = initial.progress;

    if (dueView) dueView.value = initial.due;
    if (startedView) startedView.value = initial.started;
    if (resolvedView) resolvedView.value = initial.resolved;

    if (assigneeText) assigneeText.value = initial.assigneeName;
    if (assigneeCode) assigneeCode.value = initial.assigneeCode;

    if (parIssueText) parIssueText.value = initial.parIssueText;
    if (parIssueCode) parIssueCode.value = initial.parIssueCode;

    if (typeText) typeText.value = initial.typeText;
    if (typeCode) typeCode.value = initial.typeCode;

    if (projectTextEl) projectTextEl.value = initial.projectText;
    if (projectCodeEl) projectCodeEl.value = initial.projectCode;

    userCache = [];
    userCacheProjectCode = "";

    if (parIssueCode) {
      if (initial.parIssueNameEnabled && initial.parIssueCode)
        parIssueCode.setAttribute("name", "parIssueCode");
      else parIssueCode.removeAttribute("name");
    }

    onStatusChange();
    syncHiddenDates();
  });

  form?.addEventListener("submit", (e) => {
    if (!validateBeforeSubmit()) e.preventDefault();
  });

  // init
  setProgressByStatus();
  toggleResolvedByStatus();
  syncHiddenDates();

  // 초기 상위일감 값이 비어있으면 name 제거
  if (parIssueCode) {
    const hasValue = String(parIssueCode.value || "").trim().length > 0;
    if (!hasValue) parIssueCode.removeAttribute("name");
  }

  hydrateTypeTextIfEmpty();
})();
