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

  // --- 상위일감 ---
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

  // --- 유형 모달 ---
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
  let userCache = [];
  let userCacheProjectCode = "";

  const parentIssueCacheByProject = new Map();

  // -------------------------
  // Toast 유틸
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
    if (!days) return;

    const dueStr = toDate(addDays(new Date(), days));
    dueView.value = dueStr;
    dueAt.value = toDT(dueStr);
  };

  // 마감기한 삭제 방지 + hidden 동기화
  const syncDueWithPriority = () => {
    if (!dueView || !dueAt) return;

    if (!dueView.value) {
      if (!prioritySel?.value) return;
      showDueAutoToast();
      setDueByPriority();
      return;
    }

    dueAt.value = toDT(dueView.value);
  };

  // 날짜 비교
  const isBefore = (a, b) => {
    if (!a || !b) return false;
    const da = new Date(`${a}T00:00:00`);
    const db = new Date(`${b}T00:00:00`);
    return da.getTime() < db.getTime();
  };

  const todayYmd = () => {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  };

  // 마감기한 지난지 체크 (due < today)
  const isOverdue = () => {
    const due = (dueView?.value || "").trim();
    if (!due) return false;
    return isBefore(due, todayYmd());
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

    syncDueWithPriority();

    if (startedAt && startedView) startedAt.value = toDT(startedView.value);

    if (resolvedAt && resolvedView) {
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

  // 마감기한 지난 진척도 잠금
  let lastOverdueToastAt = 0;
  const blockProgressIfOverdue = (withToast = false) => {
    if (!progressInp) return false;
    if (!isOverdue()) return false;

    progressInp.value = "100";
    progressInp.min = "100";
    progressInp.max = "100";
    progressInp.readOnly = true;

    if (withToast) {
      const now = Date.now();
      if (now - lastOverdueToastAt >= 900) {
        lastOverdueToastAt = now;
        showToast("마감기한이 지나 진척도를 수정할 수 없습니다.");
      }
    }
    return true;
  };

  const setProgressByStatus = () => {
    if (!statusSel || !progressInp) return;

    // 초기/상태변경 시에는 토스트 없이 잠금만
    if (blockProgressIfOverdue(false)) return;

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
      {
        headers: { Accept: "application/json" },
      },
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

    syncDueWithPriority();

    if (s && s !== "OB1" && !startedView?.value) {
      showToast("신규가 아닌 상태로 저장하려면 시작일을 입력해야 합니다.");
      startedView?.focus();
      return false;
    }

    if (s === "OB5" && !resolvedView?.value) {
      showToast("완료로 저장하려면 완료일을 입력해야 합니다.");
      resolvedView?.focus();
      return false;
    }

    if (resolvedView?.value && startedView?.value) {
      if (isBefore(resolvedView.value, startedView.value)) {
        showToast("완료일은 시작일보다 빠를 수 없습니다.");
        resolvedView?.focus();
        return false;
      }
    }

    if (s === "OB3") {
      const hasFile = uploadFileInp?.files?.length > 0;
      if (!hasFile) {
        showToast("해결로 저장하려면 첨부파일을 등록해야 합니다.");
        uploadFileInp?.focus();
        return false;
      }
    }

    if (s !== "OB5") {
      if (resolvedView) resolvedView.value = "";
      if (resolvedAt) resolvedAt.value = "";
    }

    // 저장 직전 마감기한 지난 진척도 강제 100%
    if (isOverdue()) {
      if (progressInp) progressInp.value = "100";
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
    setDueByPriority();
    syncHiddenDates();
    setProgressByStatus(); // 마감기한 변경에 따른 잠금상태 반영
  });

  // 진척도 수정시도 때 토스트
  progressInp?.addEventListener("input", () => {
    if (blockProgressIfOverdue(true)) return;

    clampProgress();
    syncHiddenDates();
  });

  // 클릭 시 토스트
  progressInp?.addEventListener("focus", () => {
    blockProgressIfOverdue(true);
  });

  // 마감기한 변경 시 잠금상태 갱신
  dueView?.addEventListener("change", () => {
    syncHiddenDates();
    setProgressByStatus();
  });

  dueView?.addEventListener("input", () => {
    if (!dueView.value) {
      syncHiddenDates();
      setProgressByStatus();
    }
  });

  startedView?.addEventListener("change", () => {
    if (statusSel?.value && statusSel.value !== "OB1" && !startedView.value) {
      showToast("신규가 아닌 상태에서는 시작일을 비울 수 없습니다.");
      statusSel.value = "OB1";
    }
    onStatusChange();
  });

  resolvedView?.addEventListener("change", syncHiddenDates);

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

  if (parIssueCode) {
    const hasValue = String(parIssueCode.value || "").trim().length > 0;
    if (!hasValue) parIssueCode.removeAttribute("name");
  }

  hydrateTypeTextIfEmpty();
})();
