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
    assigneeModalList: $("#assigneeModalTree"),
    creatorModalList: $("#creatorModalTree"),
    typeModalTree: $("#typeModalTree"),

    projectModalSearch: $("#projectModalSearch"),
    assigneeModalSearch: $("#assigneeModalSearch"),
    creatorModalSearch: $("#creatorModalSearch"),
    typeModalSearch: $("#typeModalSearch"),

    btnCreate: $("#btnIssueCreate"),
  };

  if (!ui.tbody) return;

  // form submit 자체 방지
  ui.filterForm?.addEventListener("submit", (e) => e.preventDefault());

  // -------------------------
  // 목록/페이지네이션
  // -------------------------
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
        closeMenusHard();
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

  // 조회 버튼 눌렀을 때만 필터 적용
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
    closeMenusHard();
  };

  // -------------------------
  // 토스트
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

  const isEndedProject = (tr) => {
    const projectStatus = (tr?.dataset?.projectStatus || "").trim();
    return projectStatus === "OD3";
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

  // -------------------------
  // 모달 인스턴스
  // -------------------------
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

  // -------------------------
  // 캐시
  // -------------------------
  let projectCache = [];
  let assigneeCache = [];
  let creatorCache = [];
  let typeCache = [];

  const ensureProjectCache = async () => {
    if (projectCache.length) return true;

    const res = await fetch("/api/projects/modal", {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      showToast("프로젝트 목록을 불러오지 못했습니다.");
      return false;
    }

    projectCache = (await res.json()).map((p) => ({
      code: String(p.projectCode),
      name: p.projectName,
    }));

    return true;
  };

  const ensureAssigneeCache = async () => {
    if (assigneeCache.length) return true;

    const res = await fetch("/api/users/modal/assignees");
    if (!res.ok) {
      showToast("담당자 목록을 불러오지 못했습니다.");
      return false;
    }

    assigneeCache = await res.json();
    return true;
  };

  const ensureCreatorCache = async () => {
    if (creatorCache.length) return true;

    const res = await fetch("/api/users/modal/creators");
    if (!res.ok) {
      showToast("등록자 목록을 불러오지 못했습니다.");
      return false;
    }

    creatorCache = await res.json();
    return true;
  };

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

  // -------------------------
  // 프로젝트 모달
  // -------------------------
  const openProjectModal = async () => {
    if (!projectModal) return;

    if (ui.projectModalSearch) ui.projectModalSearch.value = "";
    const ok = await ensureProjectCache();
    if (!ok) return;

    renderListButtons(ui.projectModalList, projectCache, (picked) => {
      ui.projectText.value = picked.name;
      ui.projectValue.value = picked.code;

      ui.typeText.value = "";
      ui.typeValue.value = "";
      ui.assigneeText.value = "";
      ui.assigneeValue.value = "";
      ui.creatorText.value = "";
      ui.creatorValue.value = "";

      projectModal.hide();
    });

    projectModal.show();
    closeMenusHard();
  };

  ui.projectModalSearch?.addEventListener("input", async () => {
    const ok = await ensureProjectCache();
    if (!ok) return;

    const q = ui.projectModalSearch.value.trim().toLowerCase();

    renderListButtons(
      ui.projectModalList,
      projectCache.filter((p) => p.name.toLowerCase().includes(q)),
      (picked) => {
        ui.projectText.value = picked.name;
        ui.projectValue.value = picked.code;

        ui.typeText.value = "";
        ui.typeValue.value = "";
        ui.assigneeText.value = "";
        ui.assigneeValue.value = "";
        ui.creatorText.value = "";
        ui.creatorValue.value = "";

        projectModal?.hide();
      },
    );
  });

  // -------------------------
  // 사용자(담당자/등록자) 모달
  // -------------------------
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

  const openUserModal = async (mode) => {
    const modal = mode === "assignee" ? assigneeModal : creatorModal;
    const listEl =
      mode === "assignee" ? ui.assigneeModalList : ui.creatorModalList;
    const searchEl =
      mode === "assignee" ? ui.assigneeModalSearch : ui.creatorModalSearch;

    if (!modal) return;
    if (searchEl) searchEl.value = "";

    const ok =
      mode === "assignee"
        ? await ensureAssigneeCache()
        : await ensureCreatorCache();
    if (!ok) return;

    const cache = mode === "assignee" ? assigneeCache : creatorCache;

    const selectedProjectCode = ui.projectValue?.value || "";
    const projectFiltered = selectedProjectCode
      ? cache.filter(
          (p) => String(p.projectCode) === String(selectedProjectCode),
        )
      : cache;

    renderUserTree(
      projectFiltered,
      listEl,
      (picked, projectCode, projectName) => {
        if (mode === "assignee") {
          ui.assigneeText.value = picked.userName;
          ui.assigneeValue.value = picked.userCode;
        } else {
          ui.creatorText.value = picked.userName;
          ui.creatorValue.value = picked.userCode;
        }

        if (!ui.projectValue?.value && projectCode) {
          ui.projectValue.value = projectCode;
          ui.projectText.value = projectName || "";
        }

        modal.hide();
      },
    );

    modal.show();
    closeMenusHard();
  };

  ui.assigneeModalSearch?.addEventListener("input", async () => {
    const ok = await ensureAssigneeCache();
    if (!ok) return;

    const q = ui.assigneeModalSearch.value.trim().toLowerCase();
    const selectedProjectCode = ui.projectValue?.value || "";
    const projectFiltered = selectedProjectCode
      ? assigneeCache.filter(
          (p) => String(p.projectCode) === String(selectedProjectCode),
        )
      : assigneeCache;

    const filtered = filterUserTree(projectFiltered, q);

    renderUserTree(
      filtered,
      ui.assigneeModalList,
      (picked, projectCode, projectName) => {
        ui.assigneeText.value = picked.userName;
        ui.assigneeValue.value = picked.userCode;

        if (!ui.projectValue?.value && projectCode) {
          ui.projectValue.value = projectCode;
          ui.projectText.value = projectName || "";
        }

        assigneeModal?.hide();
      },
    );
  });

  ui.creatorModalSearch?.addEventListener("input", async () => {
    const ok = await ensureCreatorCache();
    if (!ok) return;

    const q = ui.creatorModalSearch.value.trim().toLowerCase();
    const selectedProjectCode = ui.projectValue?.value || "";
    const projectFiltered = selectedProjectCode
      ? creatorCache.filter(
          (p) => String(p.projectCode) === String(selectedProjectCode),
        )
      : creatorCache;

    const filtered = filterUserTree(projectFiltered, q);

    renderUserTree(
      filtered,
      ui.creatorModalList,
      (picked, projectCode, projectName) => {
        ui.creatorText.value = picked.userName;
        ui.creatorValue.value = picked.userCode;

        if (!ui.projectValue?.value && projectCode) {
          ui.projectValue.value = projectCode;
          ui.projectText.value = projectName || "";
        }

        creatorModal?.hide();
      },
    );
  });

  // -------------------------
  // 타입 모달
  // -------------------------
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

        typeModal?.hide();
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
    if (!typeModal) return;

    if (ui.typeModalSearch) ui.typeModalSearch.value = "";
    const ok = await ensureTypeCache();
    if (!ok) return;

    const selectedProjectCode = ui.projectValue?.value || "";
    const treeData = buildTypeTreeForJS(typeCache);
    const filteredTreeData = selectedProjectCode
      ? treeData.filter((p) => String(p.code) === String(selectedProjectCode))
      : treeData;

    renderTypeTree(filteredTreeData, ui.typeModalTree);

    typeModal.show();
    closeMenusHard();
  };

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

  // -------------------------
  // 상세 이동
  // -------------------------
  const goDetail = (tr) => {
    const issueCode = tr.dataset.issueCode;
    if (!issueCode) return;
    closeMenusHard();
    location.href = `/issueInfo?issueCode=${encodeURIComponent(issueCode)}`;
  };

  // -------------------------
  // 컨텍스트 메뉴 (수정/삭제만)
  // -------------------------

  // -------------------------
  // 메뉴 권한 조회 (projectCode + issueCode)
  // -------------------------
  const permCache = new Map(); // key: `${projectCode}:${issueCode}` -> { canEdit, canDelete }

  const fetchIssueMenuPerms = async (projectCode, issueCode) => {
    const p = String(projectCode || "").trim();
    const i = String(issueCode || "").trim();
    const key = `${p}:${i}`;

    if (!p || !i) return { canEdit: false, canDelete: false };

    const cached = permCache.get(key);
    if (cached) return cached;

    const qs = new URLSearchParams({ projectCode: p, issueCode: i });

    const res = await fetch(`/api/authority/issue/menuPerms?${qs.toString()}`, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) throw new Error("권한 조회에 실패했습니다.");

    const data = await res.json();

    const perms = {
      canEdit: data?.success === true && data?.canEdit === true,
      canDelete: data?.success === true && data?.canDelete === true,
    };

    permCache.set(key, perms);
    return perms;
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
    $$('.issue-dropdown [data-bs-toggle="dropdown"]').forEach((btn) => {
      const inst = bootstrap.Dropdown.getInstance(btn);
      if (inst) inst.hide();
    });
  };

  const closeMenusHard = () => {
    closeAll();
    $$(".issue-dropdown-menu.show").forEach((m) => {
      m.classList.remove("show");
      restoreEl(m);
    });
  };

  const submitDeleteForm = (issueCode) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/issueDelete";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "issueCodes";
    input.value = issueCode;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
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

  const getPermsFromRow = (tr) => {
    const adminCk = (tr?.dataset?.adminCk || "N").toUpperCase() === "Y";
    const canModify = (tr?.dataset?.canModify || "N").toUpperCase() === "Y";
    const statusId = tr?.dataset?.statusId || "";
    return { adminCk, canModify, statusId };
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

  // 뒤로가기(BFCache) 복귀 시 강제 닫기
  window.addEventListener("pageshow", () => {
    closeMenusHard();
  });

  // 링크 이동 전에 닫기 (캡처링)
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

  // submit 전에 닫기
  document.addEventListener(
    "submit",
    () => {
      closeMenusHard();
    },
    true,
  );

  // 모달 열기 전에 닫기
  document.addEventListener("show.bs.modal", () => closeMenusHard(), true);

  // 스크롤/리사이즈 시 닫기
  window.addEventListener("scroll", closeAll, true);
  window.addEventListener("resize", closeAll);

  document.addEventListener("show.bs.dropdown", (e) => {
    const dropdown = e.target;
    const btn = dropdown?.querySelector('[data-bs-toggle="dropdown"]');
    const menu = dropdown?.querySelector(".issue-dropdown-menu");
    if (!btn || !menu) return;

    const tr = dropdown.closest("tr.issueRow");

    // 종료 프로젝트면 메뉴 자체를 열지 않음
    if (isEndedProject(tr)) {
      e.preventDefault();
      closeMenusHard();
      showToast("종료된 프로젝트는 변경 불가합니다.");
      return;
    }

    bootstrap.Dropdown.getOrCreateInstance(btn, { autoClose: "outside" });

    const issueCode = tr?.dataset?.issueCode || "";
    const projectCode = tr?.dataset?.projectCode || "";

    if (issueCode) menu.dataset.ownerIssueCode = issueCode;

    requestAnimationFrame(async () => {
      rememberAndMoveToBody(menu);
      menu.style.display = "block";
      placeFixedBelowRight(btn, menu, 4);
      menu.classList.add("show");

      applyMenuRules(menu, { canEdit: false, canDelete: false });

      if ((tr?.dataset?.statusId || "") === "OB5") return;

      try {
        const perms = await fetchIssueMenuPerms(projectCode, issueCode);
        applyMenuRules(menu, perms);
      } catch (err) {
        showToast(err?.message || "권한 정보를 불러오지 못했습니다.");
        applyMenuRules(menu, { canEdit: false, canDelete: false });
      }
    });
  });

  document.addEventListener("hide.bs.dropdown", (e) => {
    const dropdown = e.target;
    const menu = dropdown?.querySelector(".issue-dropdown-menu");
    if (!menu) return;

    menu.classList.remove("show");
    restoreEl(menu);
  });

  // 바깥 클릭 시 닫기
  document.addEventListener("click", (e) => {
    const inside =
      e.target.closest(".issue-dropdown") ||
      e.target.closest(".issue-dropdown-menu");
    if (!inside) closeAll();
  });

  // -------------------------
  // 액션 처리 (edit / delete만)
  // -------------------------
  const isDisabledItem = (btn) => {
    if (!btn) return true;
    return (
      btn.classList.contains("disabled") ||
      btn.getAttribute("aria-disabled") === "true"
    );
  };

  const findRowByIssueCode = (issueCode) => {
    if (!issueCode) return null;
    return $(
      `#issueTbody tr.issueRow[data-issue-code="${CSS.escape(String(issueCode))}"]`,
    );
  };

  document.addEventListener("click", async (e) => {
    const item = e.target.closest(".dropdown-item[data-action]");
    if (!item) return;

    e.stopPropagation();

    if (isDisabledItem(item)) {
      showToast("권한이 없거나 변경할 수 없는 상태입니다.");
      return;
    }

    const action = item.dataset.action;

    const tr = e.target.closest("tr.issueRow");
    let issueCode = tr?.dataset?.issueCode || "";

    const ownerMenu =
      e.target.closest(".issue-dropdown-menu") ||
      $$(".issue-dropdown-menu.show")[0] ||
      null;

    if (!issueCode && ownerMenu?.dataset?.ownerIssueCode) {
      issueCode = ownerMenu.dataset.ownerIssueCode;
    }
    if (!issueCode) return;

    const ownerTr = findRowByIssueCode(issueCode) || tr;
    const rowInfo = getPermsFromRow(ownerTr);

    if (isEndedProject(ownerTr)) {
      showToast("종료된 프로젝트는 변경 불가합니다.");
      return;
    }

    if (rowInfo.statusId === "OB5") {
      showToast("완료된 일감은 더 이상 변경할 수 없습니다.");
      return;
    }

    // 서버 권한 최종 확인
    const projectCode = String(ownerTr?.dataset?.projectCode || "").trim();

    let perms;
    try {
      perms = await fetchIssueMenuPerms(projectCode, issueCode);
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
        location.href = `/issueEdit?issueCode=${encodeURIComponent(issueCode)}`;
        return;
      }

      if (action === "delete") {
        if (!confirm("삭제하시겠습니까?")) return;
        closeMenusHard();
        submitDeleteForm(issueCode);
        return;
      }
    } catch (err) {
      showToast(err?.message || "처리에 실패했습니다.");
    }
  });

  // -------------------------
  // 이벤트 바인딩
  // -------------------------
  ui.btnApply?.addEventListener("click", (e) => {
    e.preventDefault();
    applyFiltersClient();
  });

  ui.btnReset?.addEventListener("click", (e) => {
    e.preventDefault();

    ui.projectText.value = "";
    ui.projectValue.value = "";
    ui.title.value = "";
    ui.typeText.value = "";
    ui.typeValue.value = "";
    ui.status.value = "";
    ui.priority.value = "";
    ui.assigneeText.value = "";
    ui.assigneeValue.value = "";
    ui.creatorText.value = "";
    ui.creatorValue.value = "";
    ui.createdAt.value = "";
    ui.dueAt.value = "";

    rows().forEach((tr) => (tr.dataset.filtered = "0"));
    page = 1;
    render();
    closeMenusHard();
  });

  ui.btnProjectModal?.addEventListener("click", openProjectModal);
  ui.btnAssigneeModal?.addEventListener("click", () =>
    openUserModal("assignee"),
  );
  ui.btnCreatorModal?.addEventListener("click", () => openUserModal("creator"));
  ui.btnTypeModal?.addEventListener("click", openTypeModal);

  ui.tbody.addEventListener("click", (e) => {
    if (
      e.target.closest("input, label, button, a") ||
      e.target.closest(".issue-actions") ||
      e.target.closest(".issue-dropdown") ||
      e.target.closest(".issue-dropdown-menu")
    ) {
      return;
    }

    const tr = e.target.closest("tr.issueRow");
    if (tr && tr.style.display !== "none") goDetail(tr);
  });

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
    closeMenusHard();
    location.href = "/issueInsert";
  });

  // 초기 렌더
  const cp = window.__CP__;
  if (!ui.projectValue?.value && !ui.projectText?.value && cp?.projectCode) {
    ui.projectValue.value = String(cp.projectCode);
    ui.projectText.value = cp.projectName || "";
    applyFiltersClient(); // render 포함
  } else {
    rows().forEach((tr) => (tr.dataset.filtered = "0"));
    render();
  }
})();
