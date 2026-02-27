// /js/worklog/worklog-list.js
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const pageSize = 10;
  let page = 1;

  const ui = {
    tbody: $("#worklogTbody"),
    pagination: $("#worklogPagination"),
    pageInfo: $("#worklogPageInfo"),

    form: $("#worklogFilterForm"),

    // filters
    projectText: $("#filterProjectText"),
    projectValue: $("#filterProjectValue"),

    typeText: $("#filterTypeText"),
    typeValue: $("#filterTypeValue"),

    issueTitle: $("#filterIssueTitle"),

    workerText: $("#filterWorkerText"),
    workerValue: $("#filterWorkerValue"),

    workDate: $("#filterWorkDate"),

    // split time
    workHour: $("#filterWorkHour"),
    workMinute: $("#filterWorkMinute"),
    workTimeHidden: $("#filterWorkTime"),

    btnApply: $("#btnApplyFilters"),
    btnReset: $("#btnResetFilters"),

    // filter modals
    btnProjectModal: $("#btnOpenProjectModal"),
    btnTypeModal: $("#btnOpenTypeModal"),
    btnWorkerModal: $("#btnOpenWorkerModal"),

    projectModalEl: $("#projectSelectModal"),
    typeModalEl: $("#typeSelectModal"),
    workerModalEl: $("#workerSelectModal"),

    projectModalList: $("#projectModalList"),
    projectModalSearch: $("#projectModalSearch"),

    typeModalTree: $("#typeModalTree"),
    typeModalSearch: $("#typeModalSearch"),

    workerModalTree: $("#workerModalTree"),
    workerModalSearch: $("#workerModalSearch"),

    // create modal
    btnOpenCreate: $("#btnOpenWorklogInsert"),
    createModalEl: $("#worklogCreateModal"),

    wlProjectText: $("#wlProjectText"),
    wlProjectCode: $("#wlProjectCode"),
    btnPickProject: $("#btnPickProject"),

    wlIssueText: $("#wlIssueText"),
    wlIssueCode: $("#wlIssueCode"),
    btnPickIssue: $("#btnPickIssue"),

    wlWorkerText: $("#wlWorkerText"),
    wlWorkerCode: $("#wlWorkerCode"),
    btnPickWorker: $("#btnPickWorker"),

    wlWorkDate: $("#wlWorkDate"),
    wlHour: $("#wlHour"),
    wlMinute: $("#wlMinute"),
    wlDesc: $("#wlDesc"),

    btnWlCancel: $("#btnWlCancel"),
    btnWlSaveContinue: $("#btnWlSaveContinue"),
    btnWlSaveClose: $("#btnWlSaveClose"),

    // edit modal
    editModalEl: $("#worklogEditModal"),
    weWorklogCode: $("#weWorklogCode"),

    weProjectText: $("#weProjectText"),
    weProjectCode: $("#weProjectCode"),
    btnEditPickProject: $("#btnEditPickProject"),

    weIssueText: $("#weIssueText"),
    weIssueCode: $("#weIssueCode"),
    btnEditPickIssue: $("#btnEditPickIssue"),

    weWorkerText: $("#weWorkerText"),
    weWorkerCode: $("#weWorkerCode"),
    btnEditPickWorker: $("#btnEditPickWorker"),

    weWorkDate: $("#weWorkDate"),
    weHour: $("#weHour"),
    weMinute: $("#weMinute"),
    weDesc: $("#weDesc"),

    btnWeCancel: $("#btnWeCancel"),
    btnWeSave: $("#btnWeSave"),

    // issue pick modal (shared)
    issueModalEl: $("#issueSelectModal"),
    issueModalTree: $("#issueModalTree"),
    issueModalSearch: $("#issueModalSearch"),

    // login hidden
    loginUserCode: $("#loginUserCode"),
    loginUserName: $("#loginUserName"),
  };

  if (!ui.tbody) return;

  const cpRaw = window.__CP__ || null;
  const CURRENT_PROJECT =
    cpRaw && cpRaw.projectCode
      ? {
          projectCode: String(cpRaw.projectCode).trim(),
          projectName: String(cpRaw.projectName || "").trim(),
          adminCk: String(cpRaw.adminCk || cpRaw.admin_ck || "").trim(),
        }
      : null;

  const hasCurrentProject = () =>
    !!(CURRENT_PROJECT && CURRENT_PROJECT.projectCode);

  // -------------------------
  // Toast
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

    bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 1800 }).show();
  };

  const getModal = (el) => {
    if (!el) return null;
    return bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
  };

  const modal = {
    project: getModal(ui.projectModalEl),
    type: getModal(ui.typeModalEl),
    worker: getModal(ui.workerModalEl),
    create: getModal(ui.createModalEl),
    edit: getModal(ui.editModalEl),
    issue: getModal(ui.issueModalEl),
  };

  // 등록 후 계속을 눌렀는가
  let refreshListOnCreateClose = false;

  // -------------------------
  // 폼 기본 submit 방지
  // -------------------------
  ui.form?.addEventListener("submit", (e) => e.preventDefault());

  [
    ui.projectText,
    ui.typeText,
    ui.issueTitle,
    ui.workerText,
    ui.workDate,
    ui.workHour,
    ui.workMinute,
  ].forEach((el) => {
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });
  });

  // -------------------------
  // 목록/페이지네이션
  // -------------------------
  const rows = () => $$("#worklogTbody tr.worklogRow");
  const visibleRows = () => rows().filter((tr) => tr.dataset.filtered !== "1");

  const sameDay = (rowDate, filterDate) => {
    if (!filterDate) return true;
    if (!rowDate) return false;
    return String(rowDate).slice(0, 10) === filterDate;
  };

  const getRow = (tr) => {
    const d = tr.dataset;
    return {
      worklogCode: (d.worklogCode || "").trim(),
      issueCode: (d.issueCode || "").trim(),
      projectCode: (d.projectCode || "").trim(),
      projectName: (d.projectName || "").trim(),
      projectStatus: (d.projectStatus || "").trim(),
      typeCode: (d.typeCode || "").trim(),
      typeName: (d.typeName || "").trim(),
      workerCode: (d.workerCode || "").trim(),
      workerName: (d.workerName || "").trim(),
      issueTitle: (d.issueTitle || "").trim(),
      description: (d.description || "").trim(),
      workDate: (d.workDate || "").trim(),
      spentMinutes: Number(String(d.spentMinutes || "0").trim() || 0),
      loginUserCode: (d.loginUserCode || "").trim(),
    };
  };

  const isEndedProjectRow = (rowOrTr) => {
    if (!rowOrTr) return false;

    if (rowOrTr.dataset) {
      return String(rowOrTr.dataset.projectStatus || "").trim() === "OD3";
    }

    return String(rowOrTr.projectStatus || "").trim() === "OD3";
  };

  const renderPagination = (totalPages) => {
    if (!ui.pagination) return;
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
        closeMenusHard();
      });

      li.appendChild(btn);
      ui.pagination.appendChild(li);
    };

    addBtn("이전", Math.max(1, page - 1), page === 1, false);
    for (let p = 1; p <= totalPages; p++) {
      addBtn(String(p), p, false, p === page);
    }
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

  // -------------------------
  // time split -> hidden(HH:mm)
  // -------------------------
  const clampInt = (val, min, max) => {
    const n = Number(String(val ?? "").trim());
    if (!Number.isFinite(n)) return "";
    const x = Math.max(min, Math.min(max, Math.trunc(n)));
    return String(x);
  };

  const syncWorkTimeHidden = () => {
    if (!ui.workTimeHidden) return;

    const h = ui.workHour ? clampInt(ui.workHour.value, 0, 999) : "";
    const m = ui.workMinute ? clampInt(ui.workMinute.value, 0, 59) : "";

    if (!h && !m) {
      ui.workTimeHidden.value = "";
      return;
    }

    const hours = String(Number(h || "0"));
    const mins = String(Number(m || "0")).padStart(2, "0");
    ui.workTimeHidden.value = `${hours}:${mins}`;
  };

  const workTimeToMinutes = (timeStr) => {
    const v = String(timeStr || "").trim();
    if (!v) return null;
    const m = v.match(/^(\d{1,3}):(\d{1,2})$/);
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    return hh * 60 + mm;
  };

  (() => {
    if (!ui.workTimeHidden) return;
    const v = (ui.workTimeHidden.value || "").trim();
    if (!v) return;
    const m = v.match(/^(\d{1,3}):(\d{1,2})$/);
    if (!m) return;
    if (ui.workHour) ui.workHour.value = String(Number(m[1]));
    if (ui.workMinute) ui.workMinute.value = String(Number(m[2]));
  })();

  ui.workHour?.addEventListener("input", syncWorkTimeHidden);
  ui.workMinute?.addEventListener("input", syncWorkTimeHidden);

  // -------------------------
  // 필터 적용/초기화
  // -------------------------
  const applyFiltersClient = () => {
    syncWorkTimeHidden();

    const pCode = ui.projectValue?.value?.trim() || "";
    const tCode = ui.typeValue?.value?.trim() || "";
    const wCode = ui.workerValue?.value?.trim() || "";
    const title = ui.issueTitle?.value?.trim()?.toLowerCase() || "";
    const workDate = ui.workDate?.value?.trim() || "";
    const minSpent = workTimeToMinutes(ui.workTimeHidden?.value || "");

    rows().forEach((tr) => {
      const d = getRow(tr);
      let ok = true;

      if (pCode) ok = ok && d.projectCode === pCode;
      if (tCode) ok = ok && d.typeCode === tCode;
      if (wCode) ok = ok && d.workerCode === wCode;
      if (title) {
        ok =
          ok &&
          String(d.issueTitle || "")
            .toLowerCase()
            .includes(title);
      }
      if (workDate) ok = ok && sameDay(d.workDate, workDate);
      if (minSpent != null) ok = ok && Number(d.spentMinutes || 0) >= minSpent;

      tr.dataset.filtered = ok ? "0" : "1";
    });

    page = 1;
    render();
    closeMenusHard();
  };

  const resetFilters = () => {
    if (ui.projectText) ui.projectText.value = "";
    if (ui.projectValue) ui.projectValue.value = "";

    if (ui.typeText) ui.typeText.value = "";
    if (ui.typeValue) ui.typeValue.value = "";

    if (ui.issueTitle) ui.issueTitle.value = "";

    if (ui.workerText) ui.workerText.value = "";
    if (ui.workerValue) ui.workerValue.value = "";

    if (ui.workDate) ui.workDate.value = "";
    if (ui.workHour) ui.workHour.value = "";
    if (ui.workMinute) ui.workMinute.value = "";
    if (ui.workTimeHidden) ui.workTimeHidden.value = "";

    rows().forEach((tr) => (tr.dataset.filtered = "0"));
    page = 1;
    render();
    closeMenusHard();
  };

  ui.btnApply?.addEventListener("click", (e) => {
    e.preventDefault();
    applyFiltersClient();
  });

  ui.btnReset?.addEventListener("click", (e) => {
    e.preventDefault();
    resetFilters();
  });

  // =========================================================
  // 공용: 트리 렌더 (프로젝트 -> children)
  // =========================================================
  const renderUserTree = (projects, container, pickHandler) => {
    if (!container) return;
    container.innerHTML = "";

    if (!projects || projects.length === 0) {
      container.innerHTML =
        '<div class="p-4 text-center text-muted">결과가 없습니다.</div>';
      return;
    }

    projects.forEach((p) => {
      const groupWrapper = document.createElement("div");
      groupWrapper.className = "type-project-group";

      const header = document.createElement("div");
      header.className = "type-project-header";
      header.textContent = p.projectName;

      const content = document.createElement("div");
      content.className = "type-project-content";
      content.style.display = "none";

      header.addEventListener("click", () => {
        const isOpen = content.style.display === "block";

        document
          .querySelectorAll(".type-project-content")
          .forEach((el) => (el.style.display = "none"));
        document
          .querySelectorAll(".type-project-header")
          .forEach((el) => el.classList.remove("active"));

        if (!isOpen) {
          content.style.display = "block";
          header.classList.add("active");
        }
      });

      const ul = document.createElement("ul");
      (p.children || []).forEach((u) => {
        const li = document.createElement("li");
        const btn = document.createElement("div");
        btn.className = "type-item";
        btn.textContent = u.userName;
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          pickHandler(u, p.projectCode, p.projectName);
        });
        li.appendChild(btn);
        ul.appendChild(li);
      });

      content.appendChild(ul);
      groupWrapper.appendChild(header);
      groupWrapper.appendChild(content);
      container.appendChild(groupWrapper);
    });
  };

  const filterUserTree = (projects, keyword) => {
    if (!keyword || !keyword.trim()) return projects;

    const q = keyword.trim().toLowerCase();
    const result = [];

    projects.forEach((p) => {
      const matchedUsers = (p.children || []).filter((u) => {
        const name = (u.userName || "").toLowerCase().trim();
        return name.includes(q);
      });

      if (matchedUsers.length > 0) {
        result.push({
          projectCode: p.projectCode,
          projectName: p.projectName,
          children: matchedUsers,
        });
      }
    });

    return result;
  };

  // =========================================================
  // 1) 필터: 프로젝트 모달
  // =========================================================
  let projectPickTarget = "filter";
  let reopenAfterProjectPick = null;

  const renderProjectList = (list) => {
    if (!ui.projectModalList) return;
    ui.projectModalList.innerHTML = "";

    if (!Array.isArray(list) || list.length === 0) {
      const empty = document.createElement("div");
      empty.className = "text-muted";
      empty.textContent = "프로젝트가 없습니다.";
      ui.projectModalList.appendChild(empty);
      return;
    }

    list.forEach((p) => {
      const code = String(p.projectCode ?? p.code ?? "").trim();
      const name = String(p.projectName ?? p.name ?? "").trim();
      const adminCk = String(p.adminCk ?? p.admin_ck ?? "N").trim();

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "list-group-item list-group-item-action";
      btn.dataset.projectCode = code;
      btn.dataset.projectName = name;
      btn.dataset.adminCk = adminCk;
      btn.textContent = name || "-";
      ui.projectModalList.appendChild(btn);
    });
  };

  const fetchProjectsForModal = async () => {
    const q = (ui.projectModalSearch?.value || "").trim();

    const base =
      projectPickTarget === "create"
        ? "/api/projects/modal/create"
        : "/api/projects/modal";

    const url = q ? `${base}?q=${encodeURIComponent(q)}` : base;

    if (ui.projectModalList) {
      ui.projectModalList.innerHTML =
        '<div class="text-muted">불러오는 중...</div>';
    }

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        ui.projectModalList.innerHTML =
          '<div class="text-danger">프로젝트 목록을 불러오지 못했습니다.</div>';
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.list || data.data || [];
      renderProjectList(list);
    } catch (err) {
      ui.projectModalList.innerHTML =
        '<div class="text-danger">프로젝트 목록을 불러오지 못했습니다.</div>';
    }
  };

  let suppressCreateReset = false;
  let suppressEditReset = false;

  const openProjectModal = (target) => {
    projectPickTarget = target;
    if (ui.projectModalSearch) ui.projectModalSearch.value = "";

    const afterShow = async () => {
      await fetchProjectsForModal();
      ui.projectModalSearch?.focus();
    };

    if (target === "create" && ui.createModalEl && modal.create) {
      reopenAfterProjectPick = "create";
      suppressCreateReset = true;
      ui.createModalEl.addEventListener(
        "hidden.bs.modal",
        async () => {
          suppressCreateReset = false;
          modal.project?.show();
          await afterShow();
        },
        { once: true },
      );
      modal.create.hide();
      return;
    }

    if (target === "edit" && ui.editModalEl && modal.edit) {
      reopenAfterProjectPick = "edit";
      suppressEditReset = true;
      ui.editModalEl.addEventListener(
        "hidden.bs.modal",
        async () => {
          suppressEditReset = false;
          modal.project?.show();
          await afterShow();
        },
        { once: true },
      );
      modal.edit.hide();
      return;
    }

    modal.project?.show();
    afterShow();
  };

  ui.btnProjectModal?.addEventListener("click", (e) => {
    e.preventDefault();
    openProjectModal("filter");
  });

  ui.btnPickProject?.addEventListener("click", (e) => {
    e.preventDefault();
    openProjectModal("create");
  });

  ui.btnEditPickProject?.addEventListener("click", (e) => {
    e.preventDefault();
    showToast("수정에서는 프로젝트를 변경할 수 없습니다.");
  });

  let projectSearchTimer = null;
  ui.projectModalSearch?.addEventListener("input", () => {
    clearTimeout(projectSearchTimer);
    projectSearchTimer = setTimeout(() => {
      fetchProjectsForModal();
    }, 200);
  });

  ui.projectModalEl?.addEventListener("hidden.bs.modal", () => {
    if (!reopenAfterProjectPick) return;
    const t = reopenAfterProjectPick;
    reopenAfterProjectPick = null;
    if (t === "create") modal.create?.show();
    if (t === "edit") modal.edit?.show();
  });

  // =========================================================
  // 2) 등록: 프로젝트 admin_ck에 따른 작업자 고정
  // =========================================================
  const LOGIN_USER_CODE = String(ui.loginUserCode?.value || "").trim();
  const LOGIN_USER_NAME = String(ui.loginUserName?.value || "").trim();

  let createProjectAdminCk = "N";
  let editProjectAdminCk = "N";

  const setWorkerPickEnabled = (btn, enabled) => {
    if (!btn) return;
    btn.disabled = !enabled;
    btn.classList.toggle("disabled", !enabled);
    btn.setAttribute("aria-disabled", enabled ? "false" : "true");
  };

  const applyWorkerRuleByAdminCk = (mode) => {
    const isCreate = mode === "create";
    const isAdmin =
      String(
        isCreate ? createProjectAdminCk : editProjectAdminCk,
      ).toUpperCase() === "Y";

    const workerCodeEl = isCreate ? ui.wlWorkerCode : ui.weWorkerCode;
    const workerTextEl = isCreate ? ui.wlWorkerText : ui.weWorkerText;
    const pickBtn = isCreate ? ui.btnPickWorker : ui.btnEditPickWorker;

    if (!isAdmin) {
      if (!LOGIN_USER_CODE) {
        showToast("로그인 사용자 정보를 불러오지 못했습니다.");
        return;
      }
      if (workerCodeEl) workerCodeEl.value = LOGIN_USER_CODE;
      if (workerTextEl) workerTextEl.value = LOGIN_USER_NAME || "나";
      setWorkerPickEnabled(pickBtn, false);
    } else {
      setWorkerPickEnabled(pickBtn, true);
    }
  };

  const fetchIsAdminOfProject = async (projectCode) => {
    const p = String(projectCode || "").trim();
    if (!p) return false;

    const qs = new URLSearchParams({ projectCode: p });
    const res = await fetch(`/api/authority/project/isAdmin?${qs.toString()}`, {
      headers: { Accept: "application/json" },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success !== true) return false;
    return data?.isAdmin === true;
  };

  const applyCurrentProjectToFilter = () => {
    if (!hasCurrentProject()) return false;
    if (ui.projectValue?.value?.trim()) return false;

    if (ui.projectValue) ui.projectValue.value = CURRENT_PROJECT.projectCode;
    if (ui.projectText)
      ui.projectText.value = CURRENT_PROJECT.projectName || "";
    return true;
  };

  const applyCurrentProjectToCreate = async () => {
    if (!hasCurrentProject()) return false;

    if (ui.wlProjectCode) ui.wlProjectCode.value = CURRENT_PROJECT.projectCode;
    if (ui.wlProjectText)
      ui.wlProjectText.value = CURRENT_PROJECT.projectName || "";

    if (ui.wlIssueText) ui.wlIssueText.value = "";
    if (ui.wlIssueCode) ui.wlIssueCode.value = "";

    if (ui.wlWorkerText) ui.wlWorkerText.value = "";
    if (ui.wlWorkerCode) ui.wlWorkerCode.value = "";

    clearIssueCache("create");

    let isAdmin = false;
    if (CURRENT_PROJECT.adminCk) {
      isAdmin = CURRENT_PROJECT.adminCk.toUpperCase() === "Y";
    } else {
      isAdmin = await fetchIsAdminOfProject(CURRENT_PROJECT.projectCode);
    }

    createProjectAdminCk = isAdmin ? "Y" : "N";
    applyWorkerRuleByAdminCk("create");
    return true;
  };

  // =========================================================
  // 등록 모달 초기화
  // =========================================================
  let workerCreateCache = [];
  let workerCreateCacheProjectCode = "";

  const resetCreateForm = async () => {
    if (ui.wlProjectText) ui.wlProjectText.value = "";
    if (ui.wlProjectCode) ui.wlProjectCode.value = "";

    if (ui.wlIssueText) ui.wlIssueText.value = "";
    if (ui.wlIssueCode) ui.wlIssueCode.value = "";

    if (ui.wlWorkerText) ui.wlWorkerText.value = "";
    if (ui.wlWorkerCode) ui.wlWorkerCode.value = "";

    if (ui.wlWorkDate) ui.wlWorkDate.value = "";
    if (ui.wlHour) ui.wlHour.value = "";
    if (ui.wlMinute) ui.wlMinute.value = "";
    if (ui.wlDesc) ui.wlDesc.value = "";

    workerCreateCache = [];
    workerCreateCacheProjectCode = "";

    createProjectAdminCk = "N";
    setWorkerPickEnabled(ui.btnPickWorker, true);

    if (ui.btnPickProject) {
      ui.btnPickProject.disabled = false;
      ui.btnPickProject.classList.remove("disabled");
      ui.btnPickProject.setAttribute("aria-disabled", "false");
    }

    clearIssueCache("create");

    if (hasCurrentProject()) {
      await applyCurrentProjectToCreate();
    }
  };

  ui.createModalEl?.addEventListener("hidden.bs.modal", async () => {
    if (!suppressCreateReset) await resetCreateForm();

    if (refreshListOnCreateClose) {
      refreshListOnCreateClose = false;
      location.reload();
    }
  });

  ui.btnOpenCreate?.addEventListener("click", async (e) => {
    e.preventDefault();
    await resetCreateForm();
    modal.create?.show();
  });

  ui.btnWlCancel?.addEventListener("click", (e) => {
    e.preventDefault();
    modal.create?.hide();
  });

  // =========================================================
  // 수정 모달 초기화
  // =========================================================
  let workerEditCache = [];
  let workerEditCacheProjectCode = "";

  const resetEditForm = () => {
    if (ui.weWorklogCode) ui.weWorklogCode.value = "";

    if (ui.weProjectText) ui.weProjectText.value = "";
    if (ui.weProjectCode) ui.weProjectCode.value = "";

    if (ui.weIssueText) ui.weIssueText.value = "";
    if (ui.weIssueCode) ui.weIssueCode.value = "";

    if (ui.weWorkerText) ui.weWorkerText.value = "";
    if (ui.weWorkerCode) ui.weWorkerCode.value = "";

    if (ui.weWorkDate) ui.weWorkDate.value = "";
    if (ui.weHour) ui.weHour.value = "";
    if (ui.weMinute) ui.weMinute.value = "";
    if (ui.weDesc) ui.weDesc.value = "";

    workerEditCache = [];
    workerEditCacheProjectCode = "";

    editProjectAdminCk = "N";
    setWorkerPickEnabled(ui.btnEditPickWorker, true);

    if (ui.btnEditPickProject) ui.btnEditPickProject.disabled = false;
    if (ui.btnEditPickIssue) ui.btnEditPickIssue.disabled = false;

    clearIssueCache("edit");
  };

  ui.editModalEl?.addEventListener("hidden.bs.modal", () => {
    if (!suppressEditReset) resetEditForm();
  });

  // =========================================================
  // 프로젝트 선택 click (필터/등록/수정)
  // =========================================================
  ui.projectModalList?.addEventListener("click", (e) => {
    const item = e.target.closest("[data-project-code]");
    if (!item) return;

    const code = String(item.dataset.projectCode || "").trim();
    const name = String(item.dataset.projectName || "").trim();
    const adminCk = String(item.dataset.adminCk || "N").trim();

    if (!code) return;

    if (projectPickTarget === "create") {
      if (ui.wlProjectText) ui.wlProjectText.value = name;
      if (ui.wlProjectCode) ui.wlProjectCode.value = code;

      if (ui.wlIssueText) ui.wlIssueText.value = "";
      if (ui.wlIssueCode) ui.wlIssueCode.value = "";

      if (ui.wlWorkerText) ui.wlWorkerText.value = "";
      if (ui.wlWorkerCode) ui.wlWorkerCode.value = "";

      workerCreateCache = [];
      workerCreateCacheProjectCode = "";

      createProjectAdminCk = adminCk || "N";
      applyWorkerRuleByAdminCk("create");

      clearIssueCache("create");
    } else if (projectPickTarget === "edit") {
      showToast("수정에서는 프로젝트를 변경할 수 없습니다.");
    } else {
      if (ui.projectText) ui.projectText.value = name;
      if (ui.projectValue) ui.projectValue.value = code;

      if (ui.typeText) ui.typeText.value = "";
      if (ui.typeValue) ui.typeValue.value = "";
      if (ui.workerText) ui.workerText.value = "";
      if (ui.workerValue) ui.workerValue.value = "";
    }

    modal.project?.hide();
  });

  // =========================================================
  // 필터: 유형 모달
  // =========================================================
  let typeCache = [];

  const ensureTypeCache = async () => {
    if (typeCache.length) return true;

    const res = await fetch("/api/types/modal", {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      showToast("유형 목록을 불러오지 못했습니다.");
      return false;
    }

    typeCache = await res.json();
    return true;
  };

  const buildTypeTreeForJS = (serverData) => {
    const projectMap = {};

    const convertType = (type, projectCode, projectName) => ({
      code: String(type.typeCode),
      name: type.typeName,
      projectCode,
      projectName,
      children: (type.children || []).map((child) =>
        convertType(child, projectCode, projectName),
      ),
    });

    (serverData || []).forEach((type) => {
      const pCode = String(type.projectCode);
      const pName = type.projectName || "기타 프로젝트";

      if (!projectMap[pCode]) {
        projectMap[pCode] = { code: pCode, name: pName, children: [] };
      }

      if (!type.parTypeCode) {
        projectMap[pCode].children.push(convertType(type, pCode, pName));
      }
    });

    return Object.values(projectMap).filter((p) => p.children.length > 0);
  };

  const renderTypeTree = (items, container) => {
    if (!container) return;
    container.innerHTML = "";

    const createNode = (type) => {
      const li = document.createElement("li");

      const div = document.createElement("div");
      div.className = "type-item";
      div.textContent = type.name;
      div.addEventListener("click", (e) => {
        e.stopPropagation();

        ui.typeText.value = type.name;
        ui.typeValue.value = type.code;

        if (type.projectCode && type.projectName) {
          ui.projectValue.value = type.projectCode;
          ui.projectText.value = type.projectName;
        }

        modal.type?.hide();
      });

      li.appendChild(div);

      if (type.children && type.children.length > 0) {
        const ul = document.createElement("ul");
        type.children.forEach((c) => ul.appendChild(createNode(c)));
        li.appendChild(ul);
      }

      return li;
    };

    if (!items || items.length === 0) {
      container.innerHTML =
        '<div class="p-4 text-center text-muted">결과가 없습니다.</div>';
      return;
    }

    items.forEach((p) => {
      const groupWrapper = document.createElement("div");
      groupWrapper.className = "type-project-group";

      const projHeader = document.createElement("div");
      projHeader.className = "type-project-header";
      projHeader.textContent = p.name;
      groupWrapper.appendChild(projHeader);

      const contentWrapper = document.createElement("div");
      contentWrapper.className = "type-project-content";
      contentWrapper.style.display = "none";

      projHeader.addEventListener("click", () => {
        const isOpen = contentWrapper.style.display === "block";

        document
          .querySelectorAll(".type-project-content")
          .forEach((el) => (el.style.display = "none"));
        document
          .querySelectorAll(".type-project-header")
          .forEach((el) => el.classList.remove("active"));

        if (!isOpen) {
          contentWrapper.style.display = "block";
          projHeader.classList.add("active");
        } else {
          contentWrapper.style.display = "none";
          projHeader.classList.remove("active");
        }
      });

      if (p.children && p.children.length > 0) {
        const rootUl = document.createElement("ul");
        p.children.forEach((t) => rootUl.appendChild(createNode(t)));
        contentWrapper.appendChild(rootUl);
      }

      groupWrapper.appendChild(contentWrapper);
      container.appendChild(groupWrapper);
    });
  };

  const openTypeModal = async () => {
    if (!modal.type) return;

    if (ui.typeModalSearch) ui.typeModalSearch.value = "";
    const ok = await ensureTypeCache();
    if (!ok) return;

    const selectedProjectCode = ui.projectValue?.value || "";
    const treeData = buildTypeTreeForJS(typeCache);

    const filteredTreeData = selectedProjectCode
      ? treeData.filter((p) => String(p.code) === String(selectedProjectCode))
      : treeData;

    renderTypeTree(filteredTreeData, ui.typeModalTree);

    modal.type.show();
    closeMenusHard();
  };

  ui.btnTypeModal?.addEventListener("click", (e) => {
    e.preventDefault();
    openTypeModal();
  });

  ui.typeModalSearch?.addEventListener("input", async () => {
    const ok = await ensureTypeCache();
    if (!ok) return;

    const q = ui.typeModalSearch.value.trim().toLowerCase();
    const selectedProjectCode = ui.projectValue?.value || "";
    const treeData = buildTypeTreeForJS(typeCache);

    const projectFiltered = selectedProjectCode
      ? treeData.filter((p) => String(p.code) === String(selectedProjectCode))
      : treeData;

    if (!q) {
      renderTypeTree(projectFiltered, ui.typeModalTree);
      return;
    }

    const searchInTree = (nodes) =>
      (nodes || [])
        .map((node) => {
          const nameHit = (node.name || "").toLowerCase().includes(q);
          const childHits = searchInTree(node.children || []);
          if (nameHit || childHits.length > 0)
            return { ...node, children: childHits };
          return null;
        })
        .filter(Boolean);

    const filtered = projectFiltered
      .map((proj) => ({ ...proj, children: searchInTree(proj.children || []) }))
      .filter((proj) => (proj.children || []).length > 0);

    renderTypeTree(filtered, ui.typeModalTree);
  });

  // =========================================================
  // 필터 : 작업자 모달
  // =========================================================
  let workerFilterCache = [];

  const ensureWorkerFilterCache = async () => {
    if (workerFilterCache.length) return true;

    const res = await fetch("/api/users/modal/worklogs/workers", {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      showToast("작업자 목록을 불러오지 못했습니다.");
      return false;
    }

    workerFilterCache = await res.json();
    return true;
  };

  const openWorkerFilterModal = async () => {
    if (!modal.worker) return;

    if (ui.workerModalSearch) ui.workerModalSearch.value = "";

    const ok = await ensureWorkerFilterCache();
    if (!ok) return;

    const selectedProjectCode = ui.projectValue?.value || "";
    const projectFiltered = selectedProjectCode
      ? workerFilterCache.filter(
          (p) => String(p.projectCode) === String(selectedProjectCode),
        )
      : workerFilterCache;

    renderUserTree(
      projectFiltered,
      ui.workerModalTree,
      (picked, projectCode, projectName) => {
        ui.workerText.value = picked.userName;
        ui.workerValue.value = picked.userCode;

        if (!ui.projectValue?.value && projectCode) {
          ui.projectValue.value = projectCode;
          ui.projectText.value = projectName || "";
        }

        modal.worker?.hide();
      },
    );

    modal.worker.show();
    closeMenusHard();
  };

  ui.btnWorkerModal?.addEventListener("click", (e) => {
    e.preventDefault();
    openWorkerFilterModal();
  });

  ui.workerModalSearch?.addEventListener("input", async () => {
    const ok = await ensureWorkerFilterCache();
    if (!ok) return;

    const q = ui.workerModalSearch.value.trim().toLowerCase();
    const selectedProjectCode = ui.projectValue?.value || "";

    const projectFiltered = selectedProjectCode
      ? workerFilterCache.filter(
          (p) => String(p.projectCode) === String(selectedProjectCode),
        )
      : workerFilterCache;

    const filtered = filterUserTree(projectFiltered, q);

    renderUserTree(
      filtered,
      ui.workerModalTree,
      (picked, projectCode, projectName) => {
        ui.workerText.value = picked.userName;
        ui.workerValue.value = picked.userCode;

        if (!ui.projectValue?.value && projectCode) {
          ui.projectValue.value = projectCode;
          ui.projectText.value = projectName || "";
        }

        modal.worker?.hide();
      },
    );
  });

  // =========================================================
  // 등록/수정: 작업자 선택 (평면 리스트)
  // =========================================================
  const fetchWorkersForProject = async (projectCode) => {
    const pCode = String(projectCode || "").trim();
    if (!pCode) return { ok: false, list: [] };

    const qs = new URLSearchParams({ projectCode: pCode });
    const res = await fetch(`/api/users/modal?${qs.toString()}`, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return { ok: false, list: [] };
    const list = await res.json();
    return { ok: true, list: Array.isArray(list) ? list : [] };
  };

  const renderUserListFlat = (list, container, pickHandler) => {
    if (!container) return;
    container.innerHTML = "";

    const arr = Array.isArray(list) ? list : [];
    if (!arr.length) {
      container.innerHTML =
        '<div class="p-4 text-center text-muted">결과가 없습니다.</div>';
      return;
    }

    const ul = document.createElement("ul");
    ul.style.listStyle = "none";
    ul.style.padding = "0";
    ul.style.margin = "0";

    arr.forEach((u) => {
      const li = document.createElement("li");
      const div = document.createElement("div");
      div.className = "type-item";
      div.textContent = u.userName || "-";
      div.addEventListener("click", () => pickHandler(u));
      li.appendChild(div);
      ul.appendChild(li);
    });

    container.appendChild(ul);
  };

  let reopenAfterWorkerPick = null;

  ui.workerModalEl?.addEventListener("hidden.bs.modal", () => {
    const t = reopenAfterWorkerPick;
    reopenAfterWorkerPick = null;

    if (t === "create") modal.create?.show();
    if (t === "edit") modal.edit?.show();
  });

  const openWorkerModalForCreate = async () => {
    const pCode = ui.wlProjectCode?.value?.trim() || "";
    if (!pCode) {
      showToast("프로젝트를 먼저 선택해주세요.");
      return;
    }

    const isAdmin = String(createProjectAdminCk || "N").toUpperCase() === "Y";
    if (!isAdmin) {
      applyWorkerRuleByAdminCk("create");
      showToast("프로젝트 관리자가 아니면 작업자는 본인으로 고정됩니다.");
      return;
    }

    if (!modal.worker) return;
    if (ui.workerModalSearch) ui.workerModalSearch.value = "";

    const showWorkerModal = async () => {
      const r = await fetchWorkersForProject(pCode);
      if (!r.ok) {
        showToast("작업자 목록을 불러오지 못했습니다.");
        return;
      }

      renderUserListFlat(r.list, ui.workerModalTree, (picked) => {
        if (ui.wlWorkerText) ui.wlWorkerText.value = picked.userName || "";
        if (ui.wlWorkerCode) ui.wlWorkerCode.value = picked.userCode || "";
        modal.worker?.hide();
      });

      modal.worker.show();
      closeMenusHard();
    };

    if (ui.createModalEl && modal.create) {
      suppressCreateReset = true;
      reopenAfterWorkerPick = "create";

      ui.createModalEl.addEventListener(
        "hidden.bs.modal",
        async () => {
          suppressCreateReset = false;
          await showWorkerModal();
        },
        { once: true },
      );

      modal.create.hide();
      return;
    }

    await showWorkerModal();
  };

  const openWorkerModalForEdit = async () => {
    const pCode = ui.weProjectCode?.value?.trim() || "";
    if (!pCode) {
      showToast("프로젝트를 먼저 선택해주세요.");
      return;
    }

    const isAdmin = String(editProjectAdminCk || "N").toUpperCase() === "Y";
    if (!isAdmin) {
      applyWorkerRuleByAdminCk("edit");
      showToast("프로젝트 관리자가 아니면 작업자는 본인으로 고정됩니다.");
      return;
    }

    if (!modal.worker) return;
    if (ui.workerModalSearch) ui.workerModalSearch.value = "";

    const showWorkerModal = async () => {
      const r = await fetchWorkersForProject(pCode);
      if (!r.ok) {
        showToast("작업자 목록을 불러오지 못했습니다.");
        return;
      }

      renderUserListFlat(r.list, ui.workerModalTree, (picked) => {
        if (ui.weWorkerText) ui.weWorkerText.value = picked.userName || "";
        if (ui.weWorkerCode) ui.weWorkerCode.value = picked.userCode || "";
        modal.worker?.hide();
      });

      modal.worker.show();
      closeMenusHard();
    };

    if (ui.editModalEl && modal.edit) {
      suppressEditReset = true;
      reopenAfterWorkerPick = "edit";

      ui.editModalEl.addEventListener(
        "hidden.bs.modal",
        async () => {
          suppressEditReset = false;
          await showWorkerModal();
        },
        { once: true },
      );

      modal.edit.hide();
      return;
    }

    await showWorkerModal();
  };

  ui.btnPickWorker?.addEventListener("click", (e) => {
    e.preventDefault();
    openWorkerModalForCreate();
  });

  ui.btnEditPickWorker?.addEventListener("click", (e) => {
    e.preventDefault();
    openWorkerModalForEdit();
  });

  // =========================================================
  // 등록/수정: 일감 선택 모달
  // =========================================================
  let issueCreateCache = [];
  let issueEditCache = [];
  let issueCacheKeyCreate = "";
  let issueCacheKeyEdit = "";

  let reopenAfterIssuePick = null;
  let currentIssueMode = "create";

  const fetchIssuesForProject = async (projectCode, adminCk) => {
    const pCode = String(projectCode || "").trim();
    const a = String(adminCk || "N")
      .trim()
      .toUpperCase();
    if (!pCode) return { ok: false, roots: [] };

    const qs = new URLSearchParams({ projectCode: pCode, adminCk: a });
    const res = await fetch(
      `/api/issues/modal/worklog/create?${qs.toString()}`,
      {
        headers: { Accept: "application/json" },
      },
    );

    if (!res.ok) return { ok: false, roots: [] };
    const roots = await res.json();
    return { ok: true, roots: Array.isArray(roots) ? roots : [] };
  };

  const renderIssueTree = (roots, container, pickHandler) => {
    if (!container) return;
    container.innerHTML = "";

    const list = Array.isArray(roots) ? roots : [];
    if (!list.length) {
      container.innerHTML =
        '<div class="p-4 text-center text-muted">결과가 없습니다.</div>';
      return;
    }

    const createNode = (node) => {
      const li = document.createElement("li");

      const div = document.createElement("div");
      div.className = "type-item";
      div.textContent = node.title || "(제목없음)";
      div.addEventListener("click", (e) => {
        e.stopPropagation();
        pickHandler(node);
      });

      li.appendChild(div);

      if (node.children && node.children.length > 0) {
        const ul = document.createElement("ul");
        node.children.forEach((c) => ul.appendChild(createNode(c)));
        li.appendChild(ul);
      }

      return li;
    };

    const rootUl = document.createElement("ul");
    list.forEach((n) => rootUl.appendChild(createNode(n)));
    container.appendChild(rootUl);
  };

  const filterIssueTree = (roots, keyword) => {
    const q = String(keyword || "")
      .trim()
      .toLowerCase();
    if (!q) return roots;

    const walk = (nodes) =>
      (nodes || [])
        .map((n) => {
          const title = String(n.title || "").toLowerCase();
          const childHits = walk(n.children || []);
          const hit = title.includes(q);
          if (hit || childHits.length > 0) return { ...n, children: childHits };
          return null;
        })
        .filter(Boolean);

    return walk(roots);
  };

  const openIssueModal = async (mode) => {
    const isCreate = mode === "create";
    currentIssueMode = mode;

    const pCode = isCreate
      ? ui.wlProjectCode?.value?.trim()
      : ui.weProjectCode?.value?.trim();

    if (!pCode) {
      showToast("프로젝트를 먼저 선택해주세요.");
      return;
    }

    if (!modal.issue) return;
    if (ui.issueModalSearch) ui.issueModalSearch.value = "";

    const adminCk = isCreate ? createProjectAdminCk : editProjectAdminCk;
    const cacheKey = `${pCode}|${String(adminCk || "N").toUpperCase()}`;

    const showIssueModal = async () => {
      if (isCreate) {
        if (issueCacheKeyCreate !== cacheKey) {
          const r = await fetchIssuesForProject(pCode, adminCk);
          if (!r.ok) {
            showToast("일감 목록을 불러오지 못했습니다.");
            return;
          }
          issueCreateCache = r.roots;
          issueCacheKeyCreate = cacheKey;
        }

        renderIssueTree(issueCreateCache, ui.issueModalTree, (picked) => {
          if (ui.wlIssueText) ui.wlIssueText.value = picked.title || "";
          if (ui.wlIssueCode) ui.wlIssueCode.value = picked.issueCode || "";
          modal.issue?.hide();
        });
      } else {
        if (issueCacheKeyEdit !== cacheKey) {
          const r = await fetchIssuesForProject(pCode, adminCk);
          if (!r.ok) {
            showToast("일감 목록을 불러오지 못했습니다.");
            return;
          }
          issueEditCache = r.roots;
          issueCacheKeyEdit = cacheKey;
        }

        renderIssueTree(issueEditCache, ui.issueModalTree, (picked) => {
          if (ui.weIssueText) ui.weIssueText.value = picked.title || "";
          if (ui.weIssueCode) ui.weIssueCode.value = picked.issueCode || "";
          modal.issue?.hide();
        });
      }

      modal.issue.show();
      closeMenusHard();
    };

    const parentModalEl = isCreate ? ui.createModalEl : ui.editModalEl;
    const parentModal = isCreate ? modal.create : modal.edit;

    if (parentModalEl && parentModal) {
      if (isCreate) {
        suppressCreateReset = true;
        reopenAfterIssuePick = "create";
      } else {
        suppressEditReset = true;
        reopenAfterIssuePick = "edit";
      }

      parentModalEl.addEventListener(
        "hidden.bs.modal",
        async () => {
          await showIssueModal();
        },
        { once: true },
      );

      parentModal.hide();
      return;
    }

    await showIssueModal();
  };

  ui.btnPickIssue?.addEventListener("click", (e) => {
    e.preventDefault();
    openIssueModal("create");
  });

  ui.btnEditPickIssue?.addEventListener("click", (e) => {
    e.preventDefault();
    showToast("수정에서는 일감을 변경할 수 없습니다.");
  });

  ui.issueModalEl?.addEventListener("hidden.bs.modal", () => {
    const t = reopenAfterIssuePick;
    reopenAfterIssuePick = null;

    if (t === "create") {
      suppressCreateReset = false;
      modal.create?.show();
      return;
    }

    if (t === "edit") {
      suppressEditReset = false;
      modal.edit?.show();
    }
  });

  ui.issueModalSearch?.addEventListener("input", () => {
    const q = ui.issueModalSearch?.value || "";

    if (currentIssueMode === "create") {
      const filtered = filterIssueTree(issueCreateCache, q);
      renderIssueTree(filtered, ui.issueModalTree, (picked) => {
        if (ui.wlIssueText) ui.wlIssueText.value = picked.title || "";
        if (ui.wlIssueCode) ui.wlIssueCode.value = picked.issueCode || "";
        modal.issue?.hide();
      });
      return;
    }

    const filtered = filterIssueTree(issueEditCache, q);
    renderIssueTree(filtered, ui.issueModalTree, (picked) => {
      if (ui.weIssueText) ui.weIssueText.value = picked.title || "";
      if (ui.weIssueCode) ui.weIssueCode.value = picked.issueCode || "";
      modal.issue?.hide();
    });
  });

  const clearIssueCache = (mode) => {
    if (mode === "create") {
      issueCreateCache = [];
      issueCacheKeyCreate = "";
    } else if (mode === "edit") {
      issueEditCache = [];
      issueCacheKeyEdit = "";
    }
  };

  // =========================================================
  // 입력 보정 (필터/등록/수정)
  // =========================================================
  const clampFilterInputs = () => {
    if (ui.workHour) ui.workHour.value = clampInt(ui.workHour.value, 0, 999);
    if (ui.workMinute)
      ui.workMinute.value = clampInt(ui.workMinute.value, 0, 59);
    syncWorkTimeHidden();
  };

  ui.workHour?.addEventListener("input", clampFilterInputs);
  ui.workMinute?.addEventListener("input", clampFilterInputs);
  ui.workHour?.addEventListener("blur", clampFilterInputs);
  ui.workMinute?.addEventListener("blur", clampFilterInputs);

  const clampIntModal = (val, min, max) => {
    const n = Number(String(val ?? "").trim());
    if (!Number.isFinite(n)) return "";
    const x = Math.max(min, Math.min(max, Math.trunc(n)));
    return String(x);
  };

  const clampCreateTime = () => {
    if (ui.wlHour) ui.wlHour.value = clampIntModal(ui.wlHour.value, 0, 999);
    if (ui.wlMinute)
      ui.wlMinute.value = clampIntModal(ui.wlMinute.value, 0, 59);
  };

  const clampEditTime = () => {
    if (ui.weHour) ui.weHour.value = clampIntModal(ui.weHour.value, 0, 999);
    if (ui.weMinute)
      ui.weMinute.value = clampIntModal(ui.weMinute.value, 0, 59);
  };

  ui.wlHour?.addEventListener("input", clampCreateTime);
  ui.wlMinute?.addEventListener("input", clampCreateTime);
  ui.wlHour?.addEventListener("blur", clampCreateTime);
  ui.wlMinute?.addEventListener("blur", clampCreateTime);

  ui.weHour?.addEventListener("input", clampEditTime);
  ui.weMinute?.addEventListener("input", clampEditTime);
  ui.weHour?.addEventListener("blur", clampEditTime);
  ui.weMinute?.addEventListener("blur", clampEditTime);

  // =========================================================
  // 등록 저장
  // =========================================================
  const getCreateSpentMinutes = () => {
    const h = Number(String(ui.wlHour?.value || "").trim() || 0);
    const m = Number(String(ui.wlMinute?.value || "").trim() || 0);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
    const hh = Math.max(0, Math.min(999, Math.trunc(h)));
    const mm = Math.max(0, Math.min(59, Math.trunc(m)));
    return hh * 60 + mm;
  };

  const validateCreate = () => {
    const p = ui.wlProjectCode?.value?.trim() || "";
    const i = ui.wlIssueCode?.value?.trim() || "";
    const w = ui.wlWorkerCode?.value?.trim() || "";
    const d = ui.wlWorkDate?.value?.trim() || "";
    const spent = getCreateSpentMinutes();

    if (!p) return { ok: false, message: "프로젝트를 선택해주세요." };
    if (!i) return { ok: false, message: "일감을 선택해주세요." };
    if (!w) return { ok: false, message: "작업자를 선택해주세요." };
    if (!d) return { ok: false, message: "작업일을 입력해주세요." };
    if (spent < 1)
      return { ok: false, message: "시간(시/분)을 올바르게 입력해주세요." };

    return { ok: true };
  };

  const setCreateButtonsBusy = (busy) => {
    [ui.btnWlSaveContinue, ui.btnWlSaveClose].forEach((b) => {
      if (!b) return;
      b.disabled = !!busy;
    });
  };

  const postCreate = async () => {
    const payload = {
      issueCode: ui.wlIssueCode?.value ? Number(ui.wlIssueCode.value) : null,
      workerCode: ui.wlWorkerCode?.value ? Number(ui.wlWorkerCode.value) : null,
      workDate: ui.wlWorkDate?.value || null,
      spentMinutes: getCreateSpentMinutes(),
      description: (ui.wlDesc?.value || "").trim() || null,
    };

    const res = await fetch("/api/worklogs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || "등록에 실패했습니다.");
    }
    return data;
  };

  const resetCreateForContinue = async () => {
    if (ui.wlHour) ui.wlHour.value = "";
    if (ui.wlMinute) ui.wlMinute.value = "";
    if (ui.wlDesc) ui.wlDesc.value = "";

    if (hasCurrentProject()) {
      await applyCurrentProjectToCreate();
    }
  };

  ui.btnWlSaveContinue?.addEventListener("click", async (e) => {
    e.preventDefault();

    const v = validateCreate();
    if (!v.ok) {
      showToast(v.message);
      return;
    }

    try {
      setCreateButtonsBusy(true);
      await postCreate();
      refreshListOnCreateClose = true;
      showToast("등록되었습니다.");
      await resetCreateForContinue();
    } catch (err) {
      showToast(err?.message || "등록에 실패했습니다.");
    } finally {
      setCreateButtonsBusy(false);
    }
  });

  ui.btnWlSaveClose?.addEventListener("click", async (e) => {
    e.preventDefault();

    const v = validateCreate();
    if (!v.ok) {
      showToast(v.message);
      return;
    }

    try {
      setCreateButtonsBusy(true);
      await postCreate();
      refreshListOnCreateClose = true;
      showToast("등록되었습니다.");
      modal.create?.hide();
    } catch (err) {
      showToast(err?.message || "등록에 실패했습니다.");
    } finally {
      setCreateButtonsBusy(false);
    }
  });

  // =========================================================
  // 수정 저장
  // =========================================================
  const getEditSpentMinutes = () => {
    const h = Number(String(ui.weHour?.value || "").trim() || 0);
    const m = Number(String(ui.weMinute?.value || "").trim() || 0);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
    const hh = Math.max(0, Math.min(999, Math.trunc(h)));
    const mm = Math.max(0, Math.min(59, Math.trunc(m)));
    return hh * 60 + mm;
  };

  const validateEdit = () => {
    const code = ui.weWorklogCode?.value?.trim() || "";
    const p = ui.weProjectCode?.value?.trim() || "";
    const i = ui.weIssueCode?.value?.trim() || "";
    const w = ui.weWorkerCode?.value?.trim() || "";
    const d = ui.weWorkDate?.value?.trim() || "";
    const spent = getEditSpentMinutes();

    if (!code) return { ok: false, message: "수정 대상이 올바르지 않습니다." };
    if (!p) return { ok: false, message: "프로젝트 정보가 올바르지 않습니다." };
    if (!i) return { ok: false, message: "일감 정보가 올바르지 않습니다." };
    if (!w) return { ok: false, message: "작업자를 선택해주세요." };
    if (!d) return { ok: false, message: "작업일을 입력해주세요." };
    if (spent < 1)
      return { ok: false, message: "시간(시/분)을 올바르게 입력해주세요." };

    return { ok: true };
  };

  const setEditButtonsBusy = (busy) => {
    if (ui.btnWeSave) ui.btnWeSave.disabled = !!busy;
  };

  const putEdit = async () => {
    const workLogCode = ui.weWorklogCode?.value
      ? Number(ui.weWorklogCode.value)
      : null;

    const payload = {
      issueCode: ui.weIssueCode?.value ? Number(ui.weIssueCode.value) : null,
      workerCode: ui.weWorkerCode?.value ? Number(ui.weWorkerCode.value) : null,
      workDate: ui.weWorkDate?.value || null,
      spentMinutes: getEditSpentMinutes(),
      description: (ui.weDesc?.value || "").trim() || null,
    };

    const res = await fetch(
      `/api/worklogs/${encodeURIComponent(String(workLogCode))}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || "수정에 실패했습니다.");
    }
    return data;
  };

  ui.btnWeSave?.addEventListener("click", async (e) => {
    e.preventDefault();

    const v = validateEdit();
    if (!v.ok) {
      showToast(v.message);
      return;
    }

    try {
      setEditButtonsBusy(true);
      await putEdit();
      showToast("수정되었습니다.");
      modal.edit?.hide();
      location.reload();
    } catch (err) {
      showToast(err?.message || "수정에 실패했습니다.");
    } finally {
      setEditButtonsBusy(false);
    }
  });

  ui.btnWeCancel?.addEventListener("click", (e) => {
    e.preventDefault();
    modal.edit?.hide();
  });

  // =========================================================
  // 컨텍스트 메뉴
  // =========================================================
  const permCache = new Map();

  const fetchWorklogMenuPerms = async (projectCode, workLogCode) => {
    const p = String(projectCode || "").trim();
    const w = String(workLogCode || "").trim();
    const key = `${p}:${w}`;

    if (!p || !w) return { canEdit: false, canDelete: false };

    const cached = permCache.get(key);
    if (cached) return cached;

    const qs = new URLSearchParams({ projectCode: p, workLogCode: w });

    const res = await fetch(
      `/api/authority/worklog/menuPerms?${qs.toString()}`,
      {
        headers: { Accept: "application/json" },
      },
    );

    if (!res.ok) throw new Error("권한 조회에 실패했습니다.");

    const data = await res.json().catch(() => ({}));
    const perms = {
      canEdit: data?.success === true && data?.canEdit === true,
      canDelete: data?.success === true && data?.canDelete === true,
    };

    permCache.set(key, perms);
    return perms;
  };

  const setDisabled = (el, disabled) => {
    if (!el) return;
    if (disabled) {
      el.classList.add("disabled");
      el.setAttribute("aria-disabled", "true");
      el.setAttribute("tabindex", "-1");
    } else {
      el.classList.remove("disabled");
      el.removeAttribute("aria-disabled");
      el.removeAttribute("tabindex");
    }
  };

  const applyMenuRules = (menu, perms) => {
    if (!menu) return;

    const editBtn = menu.querySelector(
      'button.dropdown-item[data-action="edit"]',
    );
    const deleteBtn = menu.querySelector(
      'button.dropdown-item[data-action="delete"]',
    );

    setDisabled(editBtn, !(perms?.canEdit === true));
    setDisabled(deleteBtn, !(perms?.canDelete === true));
  };

  const MOVED = new WeakMap();

  const rememberAndMoveToBody = (el) => {
    if (!el || MOVED.has(el)) return;
    MOVED.set(el, { parent: el.parentNode, nextSibling: el.nextSibling });
    document.body.appendChild(el);
  };

  const restoreEl = (el) => {
    const st = MOVED.get(el);
    if (!st) return;

    const { parent, nextSibling } = st;
    if (nextSibling && nextSibling.parentNode === parent)
      parent.insertBefore(el, nextSibling);
    else parent.appendChild(el);

    el.style.position = "";
    el.style.left = "";
    el.style.top = "";
    el.style.zIndex = "";
    el.style.display = "";
    el.style.visibility = "";
    el.style.opacity = "";

    MOVED.delete(el);
  };

  const placeFixedBelowRight = (btn, menu, gap = 4) => {
    const rect = btn.getBoundingClientRect();
    const w = menu.offsetWidth || 220;
    const h = menu.offsetHeight || 260;

    let left = rect.right - w;
    let top = rect.bottom + gap;

    if (left < 8) left = 8;
    if (window.innerHeight - rect.bottom < h && rect.top > h)
      top = rect.top - h - gap;
    if (top < 8) top = 8;

    menu.style.position = "fixed";
    menu.style.zIndex = "9999";
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  };

  const closeAll = () => {
    $$('.worklog-dropdown [data-bs-toggle="dropdown"]').forEach((btn) => {
      const inst = bootstrap.Dropdown.getInstance(btn);
      if (inst) inst.hide();
    });
  };

  const closeMenusHard = () => {
    closeAll();
    $$(".worklog-dropdown-menu.show").forEach((m) => {
      m.classList.remove("show");
      restoreEl(m);
    });
  };

  window.addEventListener("pageshow", () => closeMenusHard());

  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest("a[href]");
      if (!a) return;

      const href = a.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("javascript:"))
        return;
      if (a.target === "_blank") return;

      closeMenusHard();
    },
    true,
  );

  document.addEventListener("submit", () => closeMenusHard(), true);
  document.addEventListener("show.bs.modal", () => closeMenusHard(), true);

  window.addEventListener("scroll", closeAll, true);
  window.addEventListener("resize", closeAll);

  document.addEventListener("show.bs.dropdown", (e) => {
    const dropdown = e.target;
    if (!dropdown?.classList?.contains("worklog-dropdown")) return;

    const btn = dropdown?.querySelector('[data-bs-toggle="dropdown"]');
    const menu = dropdown?.querySelector(".worklog-dropdown-menu");
    if (!btn || !menu) return;

    bootstrap.Dropdown.getOrCreateInstance(btn, { autoClose: "outside" });

    const tr = dropdown.closest("tr.worklogRow");
    const d = tr ? getRow(tr) : null;
    const endedProject = isEndedProjectRow(tr);
    const workLogCode = d?.worklogCode || "";
    const projectCode = d?.projectCode || "";

    if (workLogCode) menu.dataset.ownerWorklogCode = workLogCode;

    requestAnimationFrame(async () => {
      rememberAndMoveToBody(menu);
      menu.style.display = "block";
      placeFixedBelowRight(btn, menu, 4);
      menu.classList.add("show");

      if (endedProject) {
        applyMenuRules(menu, { canEdit: false, canDelete: false });
        return;
      }

      applyMenuRules(menu, { canEdit: false, canDelete: false });

      try {
        const perms = await fetchWorklogMenuPerms(projectCode, workLogCode);
        applyMenuRules(menu, perms);
      } catch (err) {
        showToast(err?.message || "권한 정보를 불러오지 못했습니다.");
        applyMenuRules(menu, { canEdit: false, canDelete: false });
      }
    });
  });

  document.addEventListener("hide.bs.dropdown", (e) => {
    const dropdown = e.target;
    if (!dropdown?.classList?.contains("worklog-dropdown")) return;

    const menu = dropdown?.querySelector(".worklog-dropdown-menu");
    if (!menu) return;

    menu.classList.remove("show");
    restoreEl(menu);
  });

  document.addEventListener("click", (e) => {
    const inside =
      e.target.closest(".worklog-dropdown") ||
      e.target.closest(".worklog-dropdown-menu");
    if (!inside) closeAll();
  });

  const isDisabledItem = (btn) => {
    if (!btn) return true;
    return (
      btn.classList.contains("disabled") ||
      btn.getAttribute("aria-disabled") === "true"
    );
  };

  const findRowByWorklogCode = (worklogCode) => {
    if (!worklogCode) return null;
    return $(
      `#worklogTbody tr.worklogRow[data-worklog-code="${CSS.escape(String(worklogCode))}"]`,
    );
  };

  const deleteWorklog = async (workLogCode) => {
    const res = await fetch(
      `/api/worklogs/${encodeURIComponent(String(workLogCode))}`,
      {
        method: "DELETE",
        headers: { Accept: "application/json" },
      },
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || "삭제에 실패했습니다.");
    }
    return data;
  };

  const fetchWorklogOne = async (workLogCode) => {
    const code = String(workLogCode || "").trim();
    if (!code) throw new Error("대상이 올바르지 않습니다.");

    const res = await fetch(`/api/worklogs/${encodeURIComponent(code)}`, {
      headers: { Accept: "application/json" },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || "단건 조회에 실패했습니다.");
    }
    return data.data;
  };

  const fillEditModalFromOne = (one) => {
    if (!one) return;

    const workLogCode = String(one.workLogCode ?? one.worklogCode ?? "").trim();
    const projectCode = String(one.projectCode ?? "").trim();
    const projectName = String(one.projectName ?? "").trim();

    const issueCode = String(one.issueCode ?? "").trim();
    const issueTitle = String(one.issueTitle ?? "").trim();

    const workerCode = String(one.workerCode ?? "").trim();
    const workerName = String(one.workerName ?? "").trim();

    const workDate = String(one.workDate ?? "").trim();
    const spentMinutes = Number(one.spentMinutes ?? 0);
    const description = String(one.description ?? "").trim();

    if (ui.weWorklogCode) ui.weWorklogCode.value = workLogCode;

    if (ui.weProjectText) ui.weProjectText.value = projectName;
    if (ui.weProjectCode) ui.weProjectCode.value = projectCode;

    if (ui.weIssueText) ui.weIssueText.value = issueTitle;
    if (ui.weIssueCode) ui.weIssueCode.value = issueCode;

    if (ui.weWorkerText) ui.weWorkerText.value = workerName;
    if (ui.weWorkerCode) ui.weWorkerCode.value = workerCode;

    if (ui.weWorkDate)
      ui.weWorkDate.value = workDate ? workDate.slice(0, 10) : "";

    const mins = Number.isFinite(spentMinutes) ? spentMinutes : 0;
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;

    if (ui.weHour) ui.weHour.value = mins > 0 ? String(hh) : "";
    if (ui.weMinute) ui.weMinute.value = mins > 0 ? String(mm) : "";

    if (ui.weDesc) ui.weDesc.value = description || "";

    if (ui.btnEditPickProject) ui.btnEditPickProject.disabled = true;
    if (ui.btnEditPickIssue) ui.btnEditPickIssue.disabled = true;

    setWorkerPickEnabled(ui.btnEditPickWorker, true);
  };

  document.addEventListener("click", async (e) => {
    const item = e.target.closest(".dropdown-item[data-action]");
    if (!item) return;

    const menuEl = e.target.closest(".worklog-dropdown-menu");
    if (!menuEl) return;

    e.stopPropagation();

    if (isDisabledItem(item)) {
      showToast("권한이 없습니다.");
      return;
    }

    const action = item.dataset.action;

    let tr = e.target.closest("tr.worklogRow");
    let worklogCode = tr?.dataset?.worklogCode || "";

    if (!worklogCode && menuEl?.dataset?.ownerWorklogCode) {
      worklogCode = menuEl.dataset.ownerWorklogCode;
    }
    if (!worklogCode) return;

    const ownerTr = findRowByWorklogCode(worklogCode) || tr;
    if (!ownerTr) return;

    const d = getRow(ownerTr);

    if (isEndedProjectRow(ownerTr)) {
      closeMenusHard();
      showToast("종료된 프로젝트는 변경 불가합니다.");
      return;
    }

    let perms;
    try {
      perms = await fetchWorklogMenuPerms(d.projectCode, d.worklogCode);
    } catch (err) {
      showToast(err?.message || "권한 조회에 실패했습니다.");
      return;
    }

    if (action === "edit" && !perms.canEdit) {
      showToast("수정 권한이 없습니다.");
      return;
    }
    if (action === "delete" && !perms.canDelete) {
      showToast("삭제 권한이 없습니다.");
      return;
    }

    try {
      if (action === "edit") {
        closeMenusHard();

        try {
          const one = await fetchWorklogOne(d.worklogCode);
          fillEditModalFromOne(one);

          const isAdmin = await fetchIsAdminOfProject(one.projectCode);
          editProjectAdminCk = isAdmin ? "Y" : "N";
          applyWorkerRuleByAdminCk("edit");

          modal.edit?.show();
        } catch (err) {
          showToast(err?.message || "단건 조회에 실패했습니다.");
        }
        return;
      }

      if (action === "delete") {
        if (!confirm("삭제하시겠습니까?")) return;
        closeMenusHard();
        await deleteWorklog(d.worklogCode);
        showToast("삭제되었습니다.");
        location.reload();
        return;
      }
    } catch (err) {
      showToast(err?.message || "처리에 실패했습니다.");
    }
  });

  // -------------------------
  // 초기 렌더
  // -------------------------
  const applied = applyCurrentProjectToFilter();

  if (applied) {
    applyFiltersClient();
  } else {
    rows().forEach((tr) => (tr.dataset.filtered = "0"));
    render();
  }
})();
