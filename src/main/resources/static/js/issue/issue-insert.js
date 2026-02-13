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
  const typeEndAtView = $("#typeEndAtView"); // HTML에 추가한 종료일 표시 영역

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

  // HTML은 table(tbody)이 아니라 div 트리 영역임
  const typeTree = $("#typeModalTree");

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

  /* ====== 유형 종료일 제한 상태 ====== */
  let selectedTypeEndDate = ""; // "YYYY-MM-DD"

  const normalizeDateOnly = (v) => {
    if (!v) return "";
    const s = String(v).trim();
    if (s.length >= 10 && s[4] === "-" && s[7] === "-") return s.slice(0, 10);
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    return toDate(d);
  };

  const clampByTypeEndDate = (dateStr) => {
    if (!dateStr) return dateStr;
    if (!selectedTypeEndDate) return dateStr;
    return dateStr > selectedTypeEndDate ? selectedTypeEndDate : dateStr;
  };

  const applyTypeEndDateLimit = (endDateStr) => {
    selectedTypeEndDate = endDateStr || "";

    if (typeEndAtView) {
      typeEndAtView.textContent = selectedTypeEndDate || "-";
    }

    if (dueView) {
      if (selectedTypeEndDate) {
        dueView.max = selectedTypeEndDate;
      } else {
        dueView.removeAttribute("max");
      }
    }

    if (
      selectedTypeEndDate &&
      dueView?.value &&
      dueView.value > selectedTypeEndDate
    ) {
      dueView.value = selectedTypeEndDate;
      syncDueHidden();
      showToast(
        "마감기한이 유형 종료일을 초과할 수 없어 종료일로 조정되었습니다.",
      );
    }
  };

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

    let dueStr = toDate(addDays(new Date(), days));
    dueStr = clampByTypeEndDate(dueStr);

    dueView.value = dueStr;
    dueAt.value = toDT(dueStr);
  };

  const syncDueHidden = () => {
    if (!dueView || !dueAt) return;

    if (!dueView.value) {
      if (!priority?.value) return;

      showDueAutoToast();
      setDueByPriority();
      return;
    }

    if (selectedTypeEndDate && dueView.value > selectedTypeEndDate) {
      dueView.value = selectedTypeEndDate;
      showToast("마감기한은 유형 종료일 이후로 설정할 수 없습니다.");
    }

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

  let lastDueToastAt = 0;
  const showDueAutoToast = () => {
    const now = Date.now();
    if (now - lastDueToastAt < 1200) return;
    lastDueToastAt = now;
    showToast(
      "마감기한이 삭제되어 우선순위 기준으로 자동 설정되어 저장됩니다.",
    );
  };

  /* ====== 권한 상태 ====== */
  const setCanCreate = (canWrite) => {
    if (!btnSubmit) return;
    btnSubmit.dataset.canCreate = canWrite ? "true" : "false";
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

  /* ====== 유형 트리 렌더 (HTML: #typeModalTree) ====== */
  const escapeHtml = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const normalizeTypeNodes = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.list)) return data.list;
    return [];
  };

  const getNodeName = (node) => (node?.typeName ?? "").trim();
  const getNodeCode = (node) => node?.typeCode;

  const filterTypeTree = (nodes, qLower) => {
    if (!qLower) return nodes;

    const out = [];
    for (const n of nodes) {
      const name = getNodeName(n).toLowerCase();
      const kids = Array.isArray(n.children) ? n.children : [];
      const filteredKids = filterTypeTree(kids, qLower);

      if (name.includes(qLower) || filteredKids.length) {
        out.push({
          ...n,
          children: filteredKids,
        });
      }
    }
    return out;
  };

  const buildTypeTreeDom = (nodes, depth = 0) => {
    const wrap = document.createElement("div");

    if (!nodes.length) {
      const empty = document.createElement("div");
      empty.className = "text-muted";
      empty.textContent = "결과가 없습니다.";
      wrap.appendChild(empty);
      return wrap;
    }

    for (const n of nodes) {
      const row = document.createElement("div");
      row.className = "type-tree-row d-flex align-items-center";
      row.style.padding = "6px 8px";
      row.style.cursor = "pointer";
      row.style.borderBottom = "1px solid rgba(0,0,0,0.06)";
      row.style.paddingLeft = `${8 + depth * 16}px`;

      const hasChildren = Array.isArray(n.children) && n.children.length > 0;
      const caret = document.createElement("span");
      caret.className = "me-2";
      caret.style.width = "14px";
      caret.style.display = "inline-block";
      caret.textContent = hasChildren ? "▸" : "";
      row.appendChild(caret);

      const name = document.createElement("span");
      name.innerHTML = escapeHtml(getNodeName(n));
      row.appendChild(name);

      row.addEventListener("click", (e) => {
        e.stopPropagation();
        const code = getNodeCode(n);
        if (!code) return;

        if (typeText) typeText.value = getNodeName(n);
        if (typeCode) typeCode.value = String(code);

        // 유형 종료일(endAt) 반영
        const endDate = normalizeDateOnly(n.endAt);
        applyTypeEndDateLimit(endDate);

        // 우선순위가 이미 선택돼 있으면, 자동 마감일도 종료일 기준으로 클램프
        if (priority?.value) setDueByPriority();

        if (typeSearch) typeSearch.value = "";
        typeModal?.hide();
      });

      wrap.appendChild(row);

      if (hasChildren) {
        const childWrap = buildTypeTreeDom(n.children, depth + 1);
        childWrap.style.display = "none";

        caret.style.cursor = "pointer";
        caret.addEventListener("click", (e) => {
          e.stopPropagation();
          const isOpen = childWrap.style.display !== "none";
          childWrap.style.display = isOpen ? "none" : "block";
          caret.textContent = isOpen ? "▸" : "▾";
        });

        wrap.appendChild(childWrap);
      }
    }

    return wrap;
  };

  const renderTypeTree = (nodes) => {
    if (!typeTree) return;
    typeTree.innerHTML = "";
    typeTree.appendChild(buildTypeTreeDom(nodes, 0));
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

  // 유형: 프로젝트별 트리 캐시
  let typeTreeCache = [];
  let typeCacheProjectCode = "";

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

  const ensureUsers = async () => {
    const projCode = projectCode?.value?.trim();
    if (!projCode) {
      showToast("프로젝트를 먼저 선택해 주세요.");
      return false;
    }

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
    const projCode = projectCode?.value?.trim();
    if (!projCode) {
      showToast("프로젝트를 먼저 선택해 주세요.");
      return false;
    }

    if (typeTreeCache.length && typeCacheProjectCode === projCode) return true;

    const data = await fetchJson(
      `/api/types/modal/by-project?projectCode=${encodeURIComponent(projCode)}`,
      "유형 목록을 불러오지 못했습니다.",
    );
    if (!data) return false;

    typeTreeCache = normalizeTypeNodes(data);
    typeCacheProjectCode = projCode;
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
    if (parIssueText) parIssueText.value = "";
    if (parIssueCode) parIssueCode.value = "";
    if (parIssueSearch) parIssueSearch.value = "";

    if (assigneeText) assigneeText.value = "";
    if (assigneeCode) assigneeCode.value = "";
    if (assigneeSearch) assigneeSearch.value = "";

    if (typeText) typeText.value = "";
    if (typeCode) typeCode.value = "";
    if (typeSearch) typeSearch.value = "";
    if (typeTree) typeTree.innerHTML = "";

    userCache = [];
    userCacheProjectCode = "";

    typeTreeCache = [];
    typeCacheProjectCode = "";

    // 유형 종료일 제한 초기화
    applyTypeEndDateLimit("");
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
    if (!typeModal || !typeTree) return;

    if (!projectCode?.value?.trim()) {
      showToast("프로젝트를 먼저 선택해 주세요.");
      return;
    }

    if (!(await ensureTypes())) return;

    const q = (typeSearch?.value || "").trim().toLowerCase();
    const filteredTree = filterTypeTree(typeTreeCache, q);
    renderTypeTree(filteredTree);

    typeModal.show();
  };

  const refreshTypeTree = async () => {
    if (!typeTree) return;

    if (!projectCode?.value?.trim()) {
      typeTree.innerHTML = "";
      const empty = document.createElement("div");
      empty.className = "text-muted";
      empty.textContent = "프로젝트를 먼저 선택해 주세요.";
      typeTree.appendChild(empty);
      return;
    }

    if (!(await ensureTypes())) return;

    const q = (typeSearch?.value || "").trim().toLowerCase();
    const filteredTree = filterTypeTree(typeTreeCache, q);
    renderTypeTree(filteredTree);
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

  // 유형 검색은 트리 갱신
  typeSearch?.addEventListener("input", refreshTypeTree);

  priority?.addEventListener("change", () => {
    setDueByPriority();
    syncDueHidden();
  });

  dueView?.addEventListener("change", syncDueHidden);
  dueView?.addEventListener("input", () => {
    if (!dueView.value) syncDueHidden();
  });

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
    if (typeSearch) typeSearch.value = "";
    if (typeTree) typeTree.innerHTML = "";

    userCache = [];
    userCacheProjectCode = "";

    typeTreeCache = [];
    typeCacheProjectCode = "";

    // 종료일 표시 초기화 + max 제거
    applyTypeEndDateLimit("");

    setCreatedToday();
    setDueByPriority();
    renderSelectedFileName();

    setCanCreate(false);
  });

  form?.addEventListener("submit", (e) => {
    if (createdAt && !createdAt.value) setCreatedToday();

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

    syncDueHidden();

    if (!typeCode?.value) {
      e.preventDefault();
      showToast("유형을 선택해 주세요.");
      return;
    }

    // 최종 방어(유형 종료일 제한)
    if (
      selectedTypeEndDate &&
      dueView?.value &&
      dueView.value > selectedTypeEndDate
    ) {
      e.preventDefault();
      showToast("마감기한은 유형 종료일 이후로 설정할 수 없습니다.");
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

    // 최초 화면: 유형 종료일 표시 초기화(HTML에 strong가 있어도 '-'로)
    applyTypeEndDateLimit("");

    const p = projectCode?.value?.trim();
    if (p) await refreshCanCreate(p);
  };

  init();
})();
