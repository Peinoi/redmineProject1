(() => {
  const $ = (s) => document.querySelector(s);

  const form = $("#issueInsertForm");

  const createdView = $("#createdDateView");
  const dueView = $("#dueDateView");
  const createdAt = $("#createdAt");
  const dueAt = $("#dueAt");

  const priority = $("#priority");

  const projectText = $("#projectText");
  const projectCode = $("#projectCode");

  const typeText = $("#typeText");
  const typeCode = $("#typeCode");

  const parIssueText = $("#parIssueText");
  const parIssueCode = $("#parIssueCode");

  const assigneeText = $("#assigneeText");
  const assigneeCode = $("#assigneeCode");

  const fileInp = $("#uploadFile");
  const label = $("#selectedFileName");

  const btnSubmit = $("#btnSubmit");

  const projectModalEl = $("#projectSelectModal");
  const assigneeModalEl = $("#assigneeSelectModal");
  const parIssueModalEl = $("#parIssueSelectModal");
  const typeModalEl = $("#typeSelectModal");

  const projectModal = projectModalEl
    ? new bootstrap.Modal(projectModalEl)
    : null;
  const assigneeModal = assigneeModalEl
    ? new bootstrap.Modal(assigneeModalEl)
    : null;
  const parIssueModal = parIssueModalEl
    ? new bootstrap.Modal(parIssueModalEl)
    : null;
  const typeModal = typeModalEl ? new bootstrap.Modal(typeModalEl) : null;

  const projectList = $("#projectModalList");
  const assigneeList = $("#assigneeModalList");
  const parIssueTbody = $("#parIssueModalList");
  const typeList = $("#typeModalList");

  const projectSearch = $("#projectModalSearch");
  const assigneeSearch = $("#assigneeModalSearch");
  const parIssueSearch = $("#parIssueModalSearch");
  const typeSearch = $("#typeModalSearch");

  const btnProject = $("#btnOpenProjectModal");
  const btnAssignee = $("#btnOpenAssigneeModal");
  const btnParIssue = $("#btnOpenParIssueModal");
  const btnType = $("#btnOpenTypeModal");

  const btnBack = $("#btnBack");
  const btnReset = $("#btnReset");

  const pad2 = (n) => String(n).padStart(2, "0");
  const toDate = (d) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const toDT = (dateStr) => (dateStr ? `${dateStr}T00:00` : "");
  const addDays = (base, days) => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
  };

  const PRIORITY_DAYS = { OA1: 2, OA2: 7, OA3: 14, OA4: 21 };
  const getPriorityDays = () => PRIORITY_DAYS[priority?.value] ?? null;

  const setCreatedToday = () => {
    const str = toDate(new Date());
    if (createdView) createdView.value = str;
    if (createdAt) createdAt.value = toDT(str);
  };

  const setDueByPriority = () => {
    if (!dueView || !dueAt || !priority) return;

    const days = getPriorityDays();
    if (!days) {
      dueView.value = "";
      dueAt.value = "";
      return;
    }

    const dueStr = toDate(addDays(new Date(), days));
    dueView.value = dueStr;
    dueAt.value = toDT(dueStr);
  };

  const syncDueHidden = () => {
    if (!dueView || !dueAt) return;
    dueAt.value = toDT(dueView.value);
  };

  const renderSelectedFileName = () => {
    if (!label) return;
    const f = fileInp?.files?.[0];
    label.textContent = f ? `선택된 파일: ${f.name}` : "선택된 파일 없음";
  };

  const fetchJson = async (url, failMsg) => {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      showToast(failMsg);
      return null;
    }
    return res.json();
  };

  /* ====== 토스트(공통) ====== */
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

  /* ====== 권한 상태 ====== */
  const setCanCreate = (canWrite) => {
    if (!btnSubmit) return;
    btnSubmit.dataset.canCreate = canWrite ? "true" : "false";
    // disabled 처리 안 함 (요구사항)
  };

  const refreshCanCreate = async (projCode) => {
    if (!projCode) {
      setCanCreate(false);
      return;
    }

    const data = await fetchJson(
      `/api/authority/issue/canWrite?projectCode=${encodeURIComponent(projCode)}`,
      "권한 정보를 불러오지 못했습니다.",
    );
    if (!data || data.success !== true) {
      setCanCreate(false);
      return;
    }
    setCanCreate(!!data.canWrite);
  };

  const renderList = (listEl, items, onPick) => {
    if (!listEl) return;
    listEl.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "text-muted";
      empty.textContent = "결과가 없습니다.";
      listEl.appendChild(empty);
      return;
    }

    items.forEach((it) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "list-group-item list-group-item-action";
      btn.textContent = it.label;
      btn.addEventListener("click", () => onPick(it));
      listEl.appendChild(btn);
    });
  };

  const renderParIssueTable = (tbodyEl, items, onPick) => {
    tbodyEl.innerHTML = "";

    if (!items.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 2;
      td.className = "text-muted";
      td.textContent = "결과가 없습니다.";
      tr.appendChild(td);
      tbodyEl.appendChild(tr);
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

      tr.addEventListener("click", () => onPick(it));
      tbodyEl.appendChild(tr);
    });
  };

  const renderTypeTable = (tbodyEl, items, onPick) => {
    if (!tbodyEl) return;
    tbodyEl.innerHTML = "";

    if (!items.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 2;
      td.className = "text-muted";
      td.textContent = "결과가 없습니다.";
      tr.appendChild(td);
      tbodyEl.appendChild(tr);
      return;
    }

    items.forEach((it) => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";

      const tdParent = document.createElement("td");
      tdParent.textContent = it.parTypeName || "";

      const tdChild = document.createElement("td");
      tdChild.textContent = it.typeName;

      tr.appendChild(tdParent);
      tr.appendChild(tdChild);

      tr.addEventListener("click", () => onPick(it));
      tbodyEl.appendChild(tr);
    });
  };

  const filterBy = (items, q) => {
    const qq = (q || "").trim().toLowerCase();
    if (!qq) return items;
    return items.filter((it) =>
      String(it.title ?? it.label ?? "")
        .toLowerCase()
        .includes(qq),
    );
  };

  let projectCache = [];
  let userCache = [];
  let typeCache = [];

  // 프로젝트가 바뀌면 담당자 캐시는 다시 받아야 함
  let userCacheProjectCode = "";

  const parentIssueCacheByProject = new Map();

  const ensureProjects = async () => {
    if (projectCache.length) return true;

    const data = await fetchJson(
      "/api/projects/modal/create",
      "프로젝트 목록을 불러오지 못했습니다.",
    );
    if (!data) return false;

    projectCache = data.map((p) => ({
      value: String(p.projectCode),
      label: p.projectName,
    }));
    return true;
  };

  // 수정 핵심: projectCode 기준으로 멤버만 조회
  const ensureUsers = async () => {
    const projCode = projectCode?.value?.trim();
    if (!projCode) {
      showToast("프로젝트를 먼저 선택해 주세요.");
      return false;
    }

    // 같은 프로젝트면 캐시 재사용, 프로젝트 바뀌면 새로 받기
    if (userCache.length && userCacheProjectCode === projCode) return true;

    const data = await fetchJson(
      `/api/users/modal?projectCode=${encodeURIComponent(projCode)}`,
      "사용자 목록을 불러오지 못했습니다.",
    );
    if (!data) return false;

    userCache = data.map((u) => ({
      value: String(u.userCode),
      label: u.userName,
    }));
    userCacheProjectCode = projCode;
    return true;
  };

  const ensureTypes = async () => {
    if (typeCache.length) return true;

    const data = await fetchJson(
      "/api/types/modal",
      "유형 목록을 불러오지 못했습니다.",
    );
    if (!data) return false;

    typeCache = data.map((t) => ({
      value: String(t.typeCode),
      typeName: (t.typeName ?? "").trim(),
      parTypeName: (t.parTypeName ?? "").trim(),
    }));

    return true;
  };

  const ensureParentIssues = async (projCode) => {
    if (!projCode) return false;
    if (parentIssueCacheByProject.has(projCode)) return true;

    const data = await fetchJson(
      `/api/issues/parents?projectCode=${encodeURIComponent(projCode)}`,
      "상위일감 목록을 불러오지 못했습니다.",
    );
    if (!data) return false;

    const list = data.map((i) => ({
      value: String(i.issueCode),
      title: i.title ?? "",
      assignee: (i.name ?? "미지정").trim(),
    }));

    parentIssueCacheByProject.set(projCode, list);
    return true;
  };

  const clearProjectDependentFields = () => {
    // 프로젝트 바뀌면: 상위일감/담당자 초기화 + 담당자 캐시도 초기화
    if (parIssueText) parIssueText.value = "";
    if (parIssueCode) parIssueCode.value = "";
    if (parIssueSearch) parIssueSearch.value = "";

    if (assigneeText) assigneeText.value = "";
    if (assigneeCode) assigneeCode.value = "";
    if (assigneeSearch) assigneeSearch.value = "";

    userCache = [];
    userCacheProjectCode = "";
  };

  const openProjectModal = async () => {
    if (!projectModal || !projectList) return;
    if (!(await ensureProjects())) return;

    renderList(projectList, projectCache, async (picked) => {
      const prev = projectCode.value;

      projectText.value = picked.label;
      projectCode.value = picked.value;

      if (projectSearch) projectSearch.value = "";
      projectModal.hide();

      if (prev && prev !== picked.value) {
        clearProjectDependentFields();
      }

      await refreshCanCreate(picked.value);
    });

    projectModal.show();
  };

  const openAssigneeModal = async () => {
    if (!assigneeModal || !assigneeList) return;

    const projCode = projectCode?.value?.trim();
    if (!projCode) {
      showToast("프로젝트를 먼저 선택해 주세요.");
      return;
    }

    if (!(await ensureUsers())) return;

    renderList(assigneeList, userCache, (picked) => {
      assigneeText.value = picked.label;
      assigneeCode.value = picked.value;
      if (assigneeSearch) assigneeSearch.value = "";
      assigneeModal.hide();
    });

    assigneeModal.show();
  };

  const openParIssueModal = async () => {
    if (!parIssueModal || !parIssueTbody) return;

    const projCode = projectCode?.value?.trim();
    if (!projCode) {
      showToast("프로젝트를 먼저 선택해 주세요.");
      return;
    }

    if (!(await ensureParentIssues(projCode))) return;

    const list = parentIssueCacheByProject.get(projCode) || [];
    const filtered = filterBy(list, parIssueSearch?.value);

    renderParIssueTable(parIssueTbody, filtered, (picked) => {
      parIssueText.value = picked.title;
      parIssueCode.value = picked.value;
      if (parIssueSearch) parIssueSearch.value = "";
      parIssueModal.hide();
    });

    parIssueModal.show();
  };

  const openTypeModal = async () => {
    if (!typeModal || !typeList) return;
    if (!(await ensureTypes())) return;

    renderTypeTable(typeList, typeCache, (picked) => {
      if (typeText) typeText.value = picked.typeName;
      if (typeCode) typeCode.value = picked.value;

      if (typeSearch) typeSearch.value = "";
      typeModal.hide();
    });

    typeModal.show();
  };

  const refreshTypeList = async () => {
    if (!typeList) return;
    if (!(await ensureTypes())) return;

    const q = (typeSearch?.value || "").trim().toLowerCase();
    const filtered = q
      ? typeCache.filter((t) => {
          const p = (t.parTypeName || "").toLowerCase();
          const c = (t.typeName || "").toLowerCase();
          return p.includes(q) || c.includes(q);
        })
      : typeCache;

    renderTypeTable(typeList, filtered, (picked) => {
      if (typeText) typeText.value = picked.typeName;
      if (typeCode) typeCode.value = picked.value;

      if (typeSearch) typeSearch.value = "";
      typeModal?.hide();
    });
  };

  const refreshProjectList = async () => {
    if (!projectList) return;
    if (!(await ensureProjects())) return;

    const filtered = projectSearch?.value
      ? projectCache.filter((p) =>
          p.label
            .toLowerCase()
            .includes(projectSearch.value.trim().toLowerCase()),
        )
      : projectCache;

    renderList(projectList, filtered, async (picked) => {
      const prev = projectCode.value;

      projectText.value = picked.label;
      projectCode.value = picked.value;

      if (projectSearch) projectSearch.value = "";
      projectModal?.hide();

      if (prev && prev !== picked.value) {
        clearProjectDependentFields();
      }

      await refreshCanCreate(picked.value);
    });
  };

  const refreshAssigneeList = async () => {
    if (!assigneeList) return;

    const projCode = projectCode?.value?.trim();
    if (!projCode) {
      assigneeList.innerHTML = "";
      const empty = document.createElement("div");
      empty.className = "text-muted";
      empty.textContent = "프로젝트를 먼저 선택해 주세요.";
      assigneeList.appendChild(empty);
      return;
    }

    if (!(await ensureUsers())) return;

    const filtered = assigneeSearch?.value
      ? userCache.filter((u) =>
          u.label
            .toLowerCase()
            .includes(assigneeSearch.value.trim().toLowerCase()),
        )
      : userCache;

    renderList(assigneeList, filtered, (picked) => {
      assigneeText.value = picked.label;
      assigneeCode.value = picked.value;
      if (assigneeSearch) assigneeSearch.value = "";
      assigneeModal?.hide();
    });
  };

  const refreshParIssueTable = async () => {
    if (!parIssueTbody) return;

    const projCode = projectCode?.value?.trim();
    if (!projCode) {
      parIssueTbody.innerHTML = "";
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 2;
      td.className = "text-muted";
      td.textContent = "프로젝트를 먼저 선택해 주세요.";
      tr.appendChild(td);
      parIssueTbody.appendChild(tr);
      return;
    }

    if (!(await ensureParentIssues(projCode))) return;

    const list = parentIssueCacheByProject.get(projCode) || [];
    const filtered = filterBy(list, parIssueSearch?.value);

    renderParIssueTable(parIssueTbody, filtered, (picked) => {
      parIssueText.value = picked.title;
      parIssueCode.value = picked.value;
      if (parIssueSearch) parIssueSearch.value = "";
      parIssueModal?.hide();
    });
  };

  btnProject?.addEventListener("click", () => {
    if (projectSearch) projectSearch.value = "";
    openProjectModal();
  });

  btnAssignee?.addEventListener("click", () => {
    if (!projectCode?.value?.trim()) {
      showToast("프로젝트를 먼저 선택해 주세요.");
      return;
    }
    if (assigneeSearch) assigneeSearch.value = "";
    openAssigneeModal();
  });

  btnParIssue?.addEventListener("click", () => {
    if (parIssueSearch) parIssueSearch.value = "";
    openParIssueModal();
  });

  btnType?.addEventListener("click", () => {
    if (typeSearch) typeSearch.value = "";
    openTypeModal();
  });

  projectSearch?.addEventListener("input", refreshProjectList);
  assigneeSearch?.addEventListener("input", refreshAssigneeList);
  parIssueSearch?.addEventListener("input", refreshParIssueTable);
  typeSearch?.addEventListener("input", refreshTypeList);

  priority?.addEventListener("change", setDueByPriority);
  dueView?.addEventListener("change", syncDueHidden);

  fileInp?.addEventListener("change", renderSelectedFileName);

  btnBack?.addEventListener("click", () => history.back());

  btnReset?.addEventListener("click", () => {
    form?.reset();
    if (projectText) projectText.value = "";
    if (projectCode) projectCode.value = "";

    if (parIssueText) parIssueText.value = "";
    if (parIssueCode) parIssueCode.value = "";
    if (parIssueSearch) parIssueSearch.value = "";

    if (assigneeText) assigneeText.value = "";
    if (assigneeCode) assigneeCode.value = "";
    if (assigneeSearch) assigneeSearch.value = "";

    if (typeText) typeText.value = "";
    if (typeCode) typeCode.value = "";

    userCache = [];
    userCacheProjectCode = "";

    setCreatedToday();
    setDueByPriority();
    renderSelectedFileName();

    setCanCreate(false);
  });

  form?.addEventListener("submit", (e) => {
    if (createdAt && !createdAt.value) setCreatedToday();

    if (dueView && dueAt) {
      if (dueView.value) syncDueHidden();
      else setDueByPriority();
    }

    if (!projectCode.value) {
      e.preventDefault();
      showToast("프로젝트를 선택해 주세요.");
      return;
    }
    if (!$("#title")?.value.trim()) {
      e.preventDefault();
      showToast("제목을 입력해 주세요.");
      return;
    }
    if (!$("#statusCode")?.value) {
      e.preventDefault();
      showToast("상태를 선택해 주세요.");
      return;
    }
    if (!priority?.value) {
      e.preventDefault();
      showToast("우선순위를 선택해 주세요.");
      return;
    }
    if (!typeCode?.value) {
      e.preventDefault();
      showToast("유형을 선택해 주세요.");
      return;
    }

    const canCreate = (btnSubmit?.dataset?.canCreate || "false") === "true";
    if (!canCreate) {
      e.preventDefault();
      showToast("권한이 없습니다.");
      return;
    }
  });

  const init = async () => {
    setCreatedToday();
    renderSelectedFileName();
    setCanCreate(false);

    const p = projectCode?.value?.trim();
    if (p) await refreshCanCreate(p);
  };

  init();
})();
