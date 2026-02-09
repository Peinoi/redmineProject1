// /js/issue/issue-list.js
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const pageSize = 10;
  let page = 1;

  const ui = {
    tbody: $("#issueTbody"),
    pagination: $("#issuePagination"),
    pageInfo: $("#issuePageInfo"),

    filterForm: $("#issueFilterForm"),

    projectText: $("#filterProjectText"),
    projectValue: $("#filterProjectValue"),
    title: $("#filterTitle"),
    status: $("#filterStatus"),
    priority: $("#filterPriority"),
    assigneeText: $("#filterAssigneeText"),
    assigneeValue: $("#filterAssigneeValue"),
    creatorText: $("#filterCreatorText"),
    creatorValue: $("#filterCreatorValue"),
    createdAt: $("#filterCreatedAt"),
    dueAt: $("#filterDueAt"),

    typeText: $("#filterTypeText"),
    typeValue: $("#filterTypeValue"),

    btnApply: $("#btnApplyFilters"),
    btnReset: $("#btnResetFilters"),

    btnProjectModal: $("#btnOpenProjectModal"),
    btnAssigneeModal: $("#btnOpenAssigneeModal"),
    btnCreatorModal: $("#btnOpenCreatorModal"),
    btnTypeModal: $("#btnOpenTypeModal"),

    projectModalEl: $("#projectSelectModal"),
    assigneeModalEl: $("#assigneeSelectModal"),
    creatorModalEl: $("#creatorSelectModal"),
    typeModalEl: $("#typeSelectModal"),

    projectModalList: $("#projectModalList"),
    assigneeModalList: $("#assigneeModalList"),
    creatorModalList: $("#creatorModalList"),
    typeModalTbody: $("#typeModalTbody"),

    projectModalSearch: $("#projectModalSearch"),
    assigneeModalSearch: $("#assigneeModalSearch"),
    creatorModalSearch: $("#creatorModalSearch"),
    typeModalSearch: $("#typeModalSearch"),

    btnCreate: $("#btnIssueCreate"),
  };

  if (!ui.tbody) return;

  // form submit 자체를 막아서 페이지 이동(리로드) 방지
  ui.filterForm?.addEventListener("submit", (e) => e.preventDefault());

  const rows = () => $$("#issueTbody tr.issueRow");
  const visibleRows = () => rows().filter((tr) => tr.dataset.filtered !== "1");

  const sameDay = (rowDate, filterDate) => {
    if (!filterDate) return true;
    if (!rowDate) return false;
    return rowDate.slice(0, 10) === filterDate;
  };

  const getRow = (tr) => {
    const d = tr.dataset;
    return {
      issueCode: (d.issueCode || "").trim(),
      project: (d.project || "").trim(),
      projectCode: (d.projectCode || "").trim(),
      title: (d.title || "").trim().toLowerCase(),
      status: (d.status || "").trim(),
      priority: (d.priority || "").trim(),
      assigneeCode: (d.assigneeCode || "").trim(),
      creatorCode: (d.creatorCode || "").trim(),
      created: (d.created || "").trim(),
      due: (d.due || "").trim(),
      typeCode: (d.typeCode || "").trim(),
    };
  };

  const STATUS_LABEL = {
    OB1: "신규",
    OB2: "진행",
    OB3: "해결",
    OB4: "반려",
    OB5: "완료",
  };

  const PRIORITY_LABEL = {
    OA1: "긴급",
    OA2: "높음",
    OA3: "보통",
    OA4: "낮음",
  };

  const renderPagination = (totalPages) => {
    ui.pagination.innerHTML = "";
    if (totalPages <= 1) return;

    const addBtn = (label, nextPage, disabled, active) => {
      const li = document.createElement("li");
      li.className = "page-item";
      if (disabled) li.classList.add("disabled");
      if (active) li.classList.add("active");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "page-link";
      btn.textContent = label;
      btn.addEventListener("click", () => {
        if (disabled) return;
        page = nextPage;
        render();
      });

      li.appendChild(btn);
      ui.pagination.appendChild(li);
    };

    addBtn("이전", Math.max(1, page - 1), page === 1, false);
    for (let p = 1; p <= totalPages; p++)
      addBtn(String(p), p, false, p === page);
    addBtn("다음", Math.min(totalPages, page + 1), page === totalPages, false);
  };

  const render = () => {
    const list = visibleRows();
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    rows().forEach((tr) => (tr.style.display = "none"));

    const pageRows = list.slice(start, end);
    pageRows.forEach((tr, idx) => {
      tr.style.display = "";

      // 전체 기준 연속 번호: 1페이지 1~10, 2페이지 11~20...
      const noCell = tr.querySelector(".col-no");
      if (noCell) noCell.textContent = String(start + idx + 1);
    });

    renderPagination(totalPages);

    if (ui.pageInfo) {
      const from = total === 0 ? 0 : start + 1;
      const to = Math.min(end, total);
      ui.pageInfo.textContent = `${from}-${to} / ${total}`;
    }
  };

  // 조회 버튼을 눌렀을 때만 실행되는 필터
  const applyFiltersClient = () => {
    const pCode = ui.projectValue?.value?.trim() || "";
    const pName = ui.projectText?.value?.trim() || "";
    const title = ui.title?.value?.trim()?.toLowerCase() || "";

    const tCode = ui.typeValue?.value?.trim() || "";

    const sCode = ui.status?.value?.trim() || "";
    const prCode = ui.priority?.value?.trim() || "";
    const sLabel = sCode ? STATUS_LABEL[sCode] : "";
    const prLabel = prCode ? PRIORITY_LABEL[prCode] : "";

    const aCode = ui.assigneeValue?.value?.trim() || "";
    const cCode = ui.creatorValue?.value?.trim() || "";

    const created = ui.createdAt?.value?.trim() || "";
    const due = ui.dueAt?.value?.trim() || "";

    rows().forEach((tr) => {
      const d = getRow(tr);
      let ok = true;

      if (pCode)
        ok =
          ok && (d.projectCode ? d.projectCode === pCode : d.project === pName);
      if (title) ok = ok && d.title.includes(title);

      if (tCode) ok = ok && d.typeCode === tCode;

      if (sLabel) ok = ok && d.status === sLabel;
      if (prLabel) ok = ok && d.priority === prLabel;

      if (aCode) ok = ok && d.assigneeCode === aCode;
      if (cCode) ok = ok && d.creatorCode === cCode;

      ok = ok && sameDay(d.created, created);
      ok = ok && sameDay(d.due, due);

      tr.dataset.filtered = ok ? "0" : "1";
    });

    page = 1;
    render();
  };

  const projectModal = ui.projectModalEl
    ? new bootstrap.Modal(ui.projectModalEl)
    : null;
  const assigneeModal = ui.assigneeModalEl
    ? new bootstrap.Modal(ui.assigneeModalEl)
    : null;
  const creatorModal = ui.creatorModalEl
    ? new bootstrap.Modal(ui.creatorModalEl)
    : null;
  const typeModal = ui.typeModalEl ? new bootstrap.Modal(ui.typeModalEl) : null;

  let projectCache = [];
  let userCache = [];
  let typeCache = [];

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

  const renderListButtons = (listEl, items, onPick) => {
    if (!listEl) return;
    listEl.innerHTML = "";

    if (!items.length) {
      const div = document.createElement("div");
      div.className = "text-muted";
      div.textContent = "결과가 없습니다.";
      listEl.appendChild(div);
      return;
    }

    items.forEach((it) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "list-group-item list-group-item-action";
      btn.textContent = it.name;
      btn.addEventListener("click", () => onPick(it));
      listEl.appendChild(btn);
    });
  };

  const ensureProjectCache = async () => {
    if (projectCache.length > 0) return true;

    const res = await fetch("/api/projects/modal", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      showToast("프로젝트 목록을 불러오지 못했습니다.");
      return false;
    }

    const data = await res.json();
    projectCache = data.map((p) => ({
      code: String(p.projectCode),
      name: p.projectName,
    }));
    return true;
  };

  const openProjectModal = async () => {
    if (!projectModal) return;

    if (ui.projectModalSearch) ui.projectModalSearch.value = "";

    const ok = await ensureProjectCache();
    if (!ok) return;

    renderListButtons(ui.projectModalList, projectCache, (picked) => {
      ui.projectText.value = picked.name;
      ui.projectValue.value = picked.code;
      projectModal.hide();
    });

    projectModal.show();
  };

  const ensureUserCache = async () => {
    if (userCache.length > 0) return true;

    const res = await fetch("/api/users/modal", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      showToast("사용자 목록을 불러오지 못했습니다.");
      return false;
    }

    const data = await res.json();
    userCache = data.map((u) => ({
      code: String(u.userCode),
      name: u.userName,
    }));
    return true;
  };

  const openUserModal = async (type) => {
    const modal = type === "assignee" ? assigneeModal : creatorModal;
    const listEl =
      type === "assignee" ? ui.assigneeModalList : ui.creatorModalList;
    const searchEl =
      type === "assignee" ? ui.assigneeModalSearch : ui.creatorModalSearch;

    if (!modal) return;
    if (searchEl) searchEl.value = "";

    const ok = await ensureUserCache();
    if (!ok) return;

    renderListButtons(listEl, userCache, (picked) => {
      if (type === "assignee") {
        ui.assigneeText.value = picked.name;
        ui.assigneeValue.value = picked.code;
      } else {
        ui.creatorText.value = picked.name;
        ui.creatorValue.value = picked.code;
      }
      modal.hide();
    });

    modal.show();
  };

  const ensureTypeCache = async () => {
    if (typeCache.length > 0) return true;

    const res = await fetch("/api/types/modal", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      showToast("유형 목록을 불러오지 못했습니다.");
      return false;
    }

    const data = await res.json();
    typeCache = data.map((t) => {
      const parentName = (t.parTypeName ?? "").trim();
      const name = (t.typeName ?? "").trim();
      return {
        code: String(t.typeCode),
        parentName,
        name,
        label: `${name}`,
      };
    });

    return true;
  };

  const renderTypeTable = (items) => {
    if (!ui.typeModalTbody) return;
    ui.typeModalTbody.innerHTML = "";

    if (!items.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 2;
      td.className = "text-muted";
      td.textContent = "결과가 없습니다.";
      tr.appendChild(td);
      ui.typeModalTbody.appendChild(tr);
      return;
    }

    items.forEach((t) => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";

      const tdParent = document.createElement("td");
      tdParent.textContent = t.parentName;

      const tdName = document.createElement("td");
      tdName.textContent = t.name;

      tr.appendChild(tdParent);
      tr.appendChild(tdName);

      tr.addEventListener("click", () => {
        if (ui.typeText) ui.typeText.value = t.label;
        if (ui.typeValue) ui.typeValue.value = t.code;
        typeModal?.hide();
      });

      ui.typeModalTbody.appendChild(tr);
    });
  };

  const openTypeModal = async () => {
    if (!typeModal) return;

    if (ui.typeModalSearch) ui.typeModalSearch.value = "";

    const ok = await ensureTypeCache();
    if (!ok) return;

    renderTypeTable(typeCache);
    typeModal.show();
  };

  const goDetail = (tr) => {
    const issueCode = tr.dataset.issueCode;
    if (!issueCode) return;
    location.href = `/issueInfo?issueCode=${encodeURIComponent(issueCode)}`;
  };

  // -------------------------
  // 이벤트 바인딩
  // -------------------------
  ui.btnApply?.addEventListener("click", (e) => {
    e.preventDefault();
    applyFiltersClient();
  });

  ui.btnReset?.addEventListener("click", (e) => {
    e.preventDefault();

    if (ui.projectText) ui.projectText.value = "";
    if (ui.projectValue) ui.projectValue.value = "";
    if (ui.title) ui.title.value = "";
    if (ui.typeText) ui.typeText.value = "";
    if (ui.typeValue) ui.typeValue.value = "";
    if (ui.status) ui.status.value = "";
    if (ui.priority) ui.priority.value = "";
    if (ui.assigneeText) ui.assigneeText.value = "";
    if (ui.assigneeValue) ui.assigneeValue.value = "";
    if (ui.creatorText) ui.creatorText.value = "";
    if (ui.creatorValue) ui.creatorValue.value = "";
    if (ui.createdAt) ui.createdAt.value = "";
    if (ui.dueAt) ui.dueAt.value = "";

    rows().forEach((tr) => (tr.dataset.filtered = "0"));
    page = 1;
    render();
  });

  ui.btnProjectModal?.addEventListener("click", openProjectModal);
  ui.btnAssigneeModal?.addEventListener("click", () =>
    openUserModal("assignee"),
  );
  ui.btnCreatorModal?.addEventListener("click", () => openUserModal("creator"));
  ui.btnTypeModal?.addEventListener("click", openTypeModal);

  ui.projectModalSearch?.addEventListener("input", async () => {
    const ok = await ensureProjectCache();
    if (!ok) return;

    const q = ui.projectModalSearch.value.trim().toLowerCase();
    const list = projectCache.filter((p) => p.name.toLowerCase().includes(q));

    renderListButtons(ui.projectModalList, list, (picked) => {
      ui.projectText.value = picked.name;
      ui.projectValue.value = picked.code;
      projectModal?.hide();
    });
  });

  ui.assigneeModalSearch?.addEventListener("input", async () => {
    const ok = await ensureUserCache();
    if (!ok) return;

    const q = ui.assigneeModalSearch.value.trim().toLowerCase();
    const list = userCache.filter((u) => u.name.toLowerCase().includes(q));

    renderListButtons(ui.assigneeModalList, list, (picked) => {
      ui.assigneeText.value = picked.name;
      ui.assigneeValue.value = picked.code;
      assigneeModal?.hide();
    });
  });

  ui.creatorModalSearch?.addEventListener("input", async () => {
    const ok = await ensureUserCache();
    if (!ok) return;

    const q = ui.creatorModalSearch.value.trim().toLowerCase();
    const list = userCache.filter((u) => u.name.toLowerCase().includes(q));

    renderListButtons(ui.creatorModalList, list, (picked) => {
      ui.creatorText.value = picked.name;
      ui.creatorValue.value = picked.code;
      creatorModal?.hide();
    });
  });

  ui.typeModalSearch?.addEventListener("input", async () => {
    const ok = await ensureTypeCache();
    if (!ok) return;

    const q = ui.typeModalSearch.value.trim().toLowerCase();
    const list = q
      ? typeCache.filter((t) =>
          (t.parentName + " " + t.name).toLowerCase().includes(q),
        )
      : typeCache;

    renderTypeTable(list);
  });

  ui.tbody.addEventListener("click", (e) => {
    if (e.target.closest("input, label, button, a")) return;
    const tr = e.target.closest("tr.issueRow");
    if (tr && tr.style.display !== "none") goDetail(tr);
  });

  // Enter로 페이지 이동 방지
  [
    ui.title,
    ui.createdAt,
    ui.dueAt,
    ui.projectText,
    ui.assigneeText,
    ui.creatorText,
    ui.typeText,
  ].forEach((el) => {
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });
  });

  ui.btnCreate?.addEventListener("click", () => {
    location.href = "/issueInsert";
  });

  // 초기: 전체 표시 + 페이지네이션만 세팅
  rows().forEach((tr) => (tr.dataset.filtered = "0"));
  render();
})();
