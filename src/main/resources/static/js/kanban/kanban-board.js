// /static/js/kanban/kanban-board.js
(() => {
  if (window.__KANBAN_BOARD_INITED__) return;
  window.__KANBAN_BOARD_INITED__ = true;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const ui = {
    form: $("#issueFilterForm"),
    btnApply: $("#btnApplyFilters"),
    btnReset: $("#btnResetFilters"),
    btnCreate: $("#btnIssueCreate"),

    projectText: $("#filterProjectText"),
    projectValue: $("#filterProjectValue"),
    title: $("#filterTitle"),
    typeText: $("#filterTypeText"),
    typeValue: $("#filterTypeValue"),
    priority: $("#filterPriority"),
    assigneeText: $("#filterAssigneeText"),
    assigneeValue: $("#filterAssigneeValue"),
    creatorText: $("#filterCreatorText"),
    creatorValue: $("#filterCreatorValue"),
    createdAt: $("#filterCreatedAt"),
    dueAt: $("#filterDueAt"),

    scopeRadios: $$('input[name="viewScope"]'),

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

    boardMeta: $("#kanbanBoard"),
    wrap: $("#kanbanWrap"),

    rejectModalEl: $("#rejectModal"),
    rejectReason: $("#rejectReason"),
    btnRejectSubmit: $("#btnRejectSubmit"),

    resolveModalEl: $("#resolveModal"),
    resolveFile: $("#resolveFile"),
    btnResolveSubmit: $("#btnResolveSubmit"),

    progressModalEl: $("#progressModal"),
    progressModalTitle: $("#progressModalTitle"),
    progressInput: $("#progressInput"),
    btnProgressSubmit: $("#btnProgressSubmit"),

    resolveHour: $("#resolveHour"),
    resolveMinute: $("#resolveMinute"),
    progressHour: $("#progressHour"),
    progressMinute: $("#progressMinute"),

    progressDesc: $("#progressDesc"),
    resolveDesc: $("#resolveDesc"),

    resolveWorklogSection: $("#resolveWorklogSection"),
    progressWorklogSection: $("#progressWorklogSection"),
  };

  if (!ui.form) return;

  ui.form.addEventListener("submit", (e) => e.preventDefault());
  ui.form.addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.preventDefault();
  });

  // ------------------------------
  // Toast
  // ------------------------------
  const showToast = (message) => {
    const toastEl = $("#commonToast");
    const bodyEl = $("#commonToastBody");
    if (!toastEl || !bodyEl) return;

    bodyEl.textContent = message;
    toastEl.style.display = "block";
    const t = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 1800 });
    t.show();
  };

  const isEndedProjectCard = (card) => {
    const projectStatus = String(card?.dataset?.projectStatus || "").trim();
    return projectStatus === "OD3";
  };

  const mapCompleteErrorMessage = (message, toStatusCode) => {
    const msg = String(message || "").trim();

    if (
      toStatusCode === "OB5" &&
      (msg.includes("ORA-02290") || msg.includes("CHK_ISSUES_DATES"))
    ) {
      return "시작일이 오늘보다 늦어 완료 처리할 수 없습니다.";
    }

    return msg || "저장에 실패했습니다.";
  };

  // ------------------------------
  // Worklog helpers
  // ------------------------------
  const pad2 = (n) => String(n).padStart(2, "0");

  const todayYmd = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  };

  const readWorklogInputs = (mode) => {
    const hEl = mode === "progress" ? ui.progressHour : ui.resolveHour;
    const mEl = mode === "progress" ? ui.progressMinute : ui.resolveMinute;
    const dEl = mode === "progress" ? ui.progressDesc : ui.resolveDesc;

    const rawH = (hEl?.value || "").trim();
    const rawM = (mEl?.value || "").trim();
    const desc = (dEl?.value || "").trim();

    const hasDescInput = desc !== "";

    const hour = rawH === "" ? 0 : Number(rawH);
    const minute = rawM === "" ? 0 : Number(rawM);

    if (Number.isNaN(hour) || hour < 0)
      return { error: "시간(시)을 올바르게 입력해 주세요." };
    if (Number.isNaN(minute) || minute < 0 || minute > 59)
      return { error: "시간(분)은 0~59로 입력해 주세요." };

    const spentMinutes = hour * 60 + minute;

    const shouldSave = spentMinutes >= 1 || hasDescInput;

    // 내용만 있고 시간 0이면 저장 불가
    if (hasDescInput && spentMinutes < 1) {
      return {
        error: "내용 입력은 소요시간을 1분 이상 입력해야 합니다.",
      };
    }

    return {
      shouldSave,
      spentMinutes,
      description: desc,
    };
  };

  const clearWorklogInputs = (mode) => {
    if (mode === "progress") {
      if (ui.progressHour) ui.progressHour.value = "";
      if (ui.progressMinute) ui.progressMinute.value = "";
      if (ui.progressDesc) ui.progressDesc.value = "";
    } else {
      if (ui.resolveHour) ui.resolveHour.value = "";
      if (ui.resolveMinute) ui.resolveMinute.value = "";
      if (ui.resolveDesc) ui.resolveDesc.value = "";
    }
  };

  const postWorklog = async ({ issueCode, spentMinutes, description }) => {
    const res = await fetch("/api/worklogs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        issueCode: Number(issueCode),
        workDate: todayYmd(),
        spentMinutes: Number(spentMinutes),
        // 백엔드에서 trim-empty -> null 처리도 하고 있으니 빈문자면 null로 보내도 됨
        description:
          description && description.trim() ? description.trim() : null,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success === false) {
      throw new Error(data?.message || "소요시간 저장 실패");
    }
    return data;
  };

  // ------------------------------
  // Modal helpers
  // ------------------------------
  const cleanupModalBackdrops = () => {
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("padding-right");
    $$(".modal-backdrop").forEach((bd) => bd.remove());
    $$(".modal.show").forEach((m) => m.classList.remove("show"));
  };

  const bindModalCleanup = (modalEl) => {
    if (!modalEl) return;
    modalEl.addEventListener("hidden.bs.modal", () => cleanupModalBackdrops());
  };

  const getModal = (el) =>
    el ? bootstrap.Modal.getOrCreateInstance(el) : null;

  const projectModal = getModal(ui.projectModalEl);
  const assigneeModal = getModal(ui.assigneeModalEl);
  const creatorModal = getModal(ui.creatorModalEl);
  const typeModal = getModal(ui.typeModalEl);

  const rejectModal = getModal(ui.rejectModalEl);
  const resolveModal = getModal(ui.resolveModalEl);
  const progressModal = getModal(ui.progressModalEl);

  [
    ui.projectModalEl,
    ui.assigneeModalEl,
    ui.creatorModalEl,
    ui.typeModalEl,
    ui.rejectModalEl,
    ui.resolveModalEl,
    ui.progressModalEl,
  ].forEach(bindModalCleanup);

  // ------------------------------
  // Filters / counts / due state
  // ------------------------------
  const cards = () => $$(".kan-card[data-issue-code]");
  const isVisible = (el) => el.style.display !== "none";

  const sameDay = (rowDate, filterDate) => {
    if (!filterDate) return true;
    if (!rowDate) return false;
    return String(rowDate).slice(0, 10) === filterDate;
  };

  const getScope = () => {
    const picked = ui.scopeRadios.find((r) => r.checked);
    return (picked && picked.value) || "ME";
  };

  const updateCounts = () => {
    $$(".kan-col-body[data-status]").forEach((col) => {
      const status = col.dataset.status;
      const cnt = Array.from(col.querySelectorAll(".kan-card")).filter(
        isVisible,
      ).length;
      const badge = document.querySelector(`[data-count-for="${status}"]`);
      if (badge) badge.textContent = String(cnt);
    });
  };

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const parseYmdLocal = (ymd) => {
    if (!ymd || String(ymd).length < 10) return null;
    const s = String(ymd);
    const y = Number(s.slice(0, 4));
    const m = Number(s.slice(5, 7));
    const d = Number(s.slice(8, 10));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  };

  const startOfToday = () => {
    const now = new Date();
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
  };

  const updateCardStates = () => {
    const today = startOfToday();

    $$(".kan-col-body[data-status]").forEach((col) => {
      const status = col.dataset.status;
      const isDoneCol = status === "OB5";

      col.querySelectorAll(".kan-card[data-issue-code]").forEach((card) => {
        card.classList.remove(
          "kb-done",
          "kb-due--2",
          "kb-due--1",
          "kb-due--0",
          "kb-due--over",
        );

        if (isDoneCol) {
          card.classList.add("kb-done");
          return;
        }

        const dueStr = (card.dataset.due || "").trim();
        const dueDate = parseYmdLocal(dueStr);
        if (!dueDate) return;

        const diffDays = Math.ceil(
          (dueDate.getTime() - today.getTime()) / MS_PER_DAY,
        );

        if (diffDays <= 0) {
          card.classList.add(diffDays < 0 ? "kb-due--over" : "kb-due--0");
        } else if (diffDays === 1) {
          card.classList.add("kb-due--1");
        } else if (diffDays === 2) {
          card.classList.add("kb-due--2");
        }
      });
    });
  };

  const isOverdueCard = (card) => {
    const dueStr = (card?.dataset?.due || "").trim();
    const dueDate = parseYmdLocal(dueStr);
    if (!dueDate) return false;
    const today = startOfToday();
    return dueDate.getTime() < today.getTime();
  };

  const applyFiltersClient = () => {
    const scope = getScope();
    const myUserCode = String(ui.boardMeta?.dataset?.userCode || "").trim();

    const pCode = (ui.projectValue?.value || "").trim();
    const title = (ui.title?.value || "").trim().toLowerCase();

    const tCode = (ui.typeValue?.value || "").trim();
    const pr = (ui.priority?.value || "").trim();

    const aCode = (ui.assigneeValue?.value || "").trim();
    const cCode = (ui.creatorValue?.value || "").trim();

    const created = (ui.createdAt?.value || "").trim();
    const due = (ui.dueAt?.value || "").trim();

    cards().forEach((card) => {
      const d = card.dataset;
      let ok = true;

      if (pCode) ok = ok && String(d.projectCode || "") === pCode;

      if (title) {
        ok =
          ok &&
          String(d.title || "")
            .toLowerCase()
            .includes(title);
      }

      if (tCode) ok = ok && String(d.typeCode || "") === tCode;
      if (pr) ok = ok && String(d.priority || "") === pr;

      if (aCode) ok = ok && String(d.assigneeCode || "") === aCode;
      if (cCode) ok = ok && String(d.creatorCode || "") === cCode;

      ok = ok && sameDay(String(d.created || ""), created);
      ok = ok && sameDay(String(d.due || ""), due);

      if (myUserCode) {
        const assigneeCode = String(d.assigneeCode || "");
        const creatorCode = String(d.creatorCode || "");

        if (scope === "ME") ok = ok && assigneeCode === myUserCode;
        else if (scope === "ME_PLUS_CREATED") {
          ok =
            ok && (assigneeCode === myUserCode || creatorCode === myUserCode);
        } else {
          // ALL: 서버 권한 범위 내에서만 내려옴
        }
      }

      card.style.display = ok ? "" : "none";
    });

    if (history.replaceState) {
      history.replaceState(null, "", location.pathname + location.hash);
    }

    updateCounts();
    updateCardStates();
  };

  const resetFiltersClient = () => {
    if (ui.projectText) ui.projectText.value = "";
    if (ui.projectValue) ui.projectValue.value = "";
    if (ui.title) ui.title.value = "";
    if (ui.typeText) ui.typeText.value = "";
    if (ui.typeValue) ui.typeValue.value = "";
    if (ui.priority) ui.priority.value = "";
    if (ui.assigneeText) ui.assigneeText.value = "";
    if (ui.assigneeValue) ui.assigneeValue.value = "";
    if (ui.creatorText) ui.creatorText.value = "";
    if (ui.creatorValue) ui.creatorValue.value = "";
    if (ui.createdAt) ui.createdAt.value = "";
    if (ui.dueAt) ui.dueAt.value = "";

    ui.scopeRadios.forEach((r) => {
      r.checked = false;
    });
    const me = ui.scopeRadios.find((r) => r.value === "ME");
    if (me) me.checked = true;

    applyFiltersClient();

    if (history.replaceState) {
      history.replaceState(null, "", location.pathname + location.hash);
    }
  };

  ui.btnApply?.addEventListener("click", (e) => {
    e.preventDefault();
    applyFiltersClient();
  });

  ui.btnReset?.addEventListener("click", (e) => {
    e.preventDefault();
    resetFiltersClient();
  });

  ui.btnCreate?.addEventListener("click", () => {
    location.href = "/issueInsert";
  });

  // ------------------------------
  // Modal data load / render
  // ------------------------------
  let projectCache = [];
  let assigneeCache = [];
  let creatorCache = [];
  let typeCache = [];

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
      setTimeout(cleanupModalBackdrops, 50);
    });

    projectModal.show();
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
        setTimeout(cleanupModalBackdrops, 50);
      },
    );
  });

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
        setTimeout(cleanupModalBackdrops, 50);
      },
    );

    modal.show();
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
        setTimeout(cleanupModalBackdrops, 50);
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
        setTimeout(cleanupModalBackdrops, 50);
      },
    );
  });

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
        setTimeout(cleanupModalBackdrops, 50);
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

  ui.btnProjectModal?.addEventListener("click", openProjectModal);
  ui.btnAssigneeModal?.addEventListener("click", () =>
    openUserModal("assignee"),
  );
  ui.btnCreatorModal?.addEventListener("click", () => openUserModal("creator"));
  ui.btnTypeModal?.addEventListener("click", openTypeModal);

  // ------------------------------
  // Kanban drag + click
  // ------------------------------
  if (!ui.boardMeta || !ui.wrap) return;

  const isSaving = { value: false };

  const getOrder = (colBody) =>
    Array.from(colBody.querySelectorAll(".kan-card[data-issue-code]")).map(
      (c) => Number(c.dataset.issueCode),
    );

  const resolveProjectCode = (itemEl) => {
    const raw = itemEl?.dataset?.projectCode || "";
    const n = raw ? Number(raw) : null;
    return typeof n === "number" && !Number.isNaN(n) ? n : null;
  };

  const myUserCode = String(ui.boardMeta?.dataset?.userCode || "").trim();

  const canModifyCache = new Map();

  const fetchCanModify = async (projectCode) => {
    if (!projectCode) return false;
    if (canModifyCache.has(projectCode)) return canModifyCache.get(projectCode);

    const res = await fetch(
      `/api/authority/issue/canModify?projectCode=${encodeURIComponent(projectCode)}`,
      { headers: { Accept: "application/json" } },
    );

    const data = await res.json().catch(() => ({}));
    const ok = !!(res.ok && data?.success && data?.canModify);

    canModifyCache.set(projectCode, ok);
    return ok;
  };

  const isAdminCache = new Map();

  const canWorklogCache = new Map();

  const fetchCanWorklog = async (projectCode) => {
    if (!projectCode) return false;
    if (canWorklogCache.has(projectCode))
      return canWorklogCache.get(projectCode);

    const res = await fetch(
      `/api/authority/worklog/canCreate?projectCode=${encodeURIComponent(projectCode)}`,
      { headers: { Accept: "application/json" } },
    );

    const data = await res.json().catch(() => ({}));
    const ok = !!(res.ok && data?.success && data?.canCreate);

    canWorklogCache.set(projectCode, ok);
    return ok;
  };

  const toggleWorklogSection = (mode, visible) => {
    const box =
      mode === "progress"
        ? ui.progressWorklogSection
        : ui.resolveWorklogSection;

    if (!box) return;

    box.classList.toggle("d-none", !visible);

    if (!visible) {
      clearWorklogInputs(mode);
    }
  };

  const fetchIsAdmin = async (projectCode) => {
    if (!projectCode) return false;
    if (isAdminCache.has(projectCode)) return isAdminCache.get(projectCode);

    const res = await fetch(
      `/api/authority/project/isAdmin?projectCode=${encodeURIComponent(projectCode)}`,
      { headers: { Accept: "application/json" } },
    );

    const data = await res.json().catch(() => ({}));
    const ok = !!(res.ok && data?.success && data?.isAdmin);

    isAdminCache.set(projectCode, ok);
    return ok;
  };

  const isAssigneeCard = (card) => {
    if (!myUserCode) return false;
    return String(card?.dataset?.assigneeCode || "") === myUserCode;
  };

  const canEditNormal = async (card, projectCode) => {
    if (isAssigneeCard(card)) return true;
    return await fetchCanModify(projectCode);
  };

  const revertToOrigin = (itemEl, fromCol, oldIndex) => {
    if (!itemEl || !fromCol || typeof oldIndex !== "number") return;

    const children = Array.from(fromCol.querySelectorAll(":scope > .kan-card"));
    const ref = children[oldIndex] || null;

    if (ref) fromCol.insertBefore(itemEl, ref);
    else fromCol.appendChild(itemEl);

    updateCounts();
    updateCardStates();
  };

  let lastNoAuthToastAt = 0;
  const toastNoAuthOnce = () => {
    const now = Date.now();
    if (now - lastNoAuthToastAt < 800) return;
    lastNoAuthToastAt = now;
    showToast("권한이 없습니다.");
  };

  // ------------------------------
  // Card UI update helpers
  // ------------------------------
  const setProgressUI = (card, v) => {
    if (!card) return;

    const n = Number(v);
    if (Number.isNaN(n)) return;

    card.dataset.progress = String(n);

    const bar = card.querySelector(".progress-bar");
    if (bar) {
      bar.style.width = `${n}%`;
      bar.setAttribute("aria-valuenow", String(n));
    }

    const pct = card.querySelector(".small.text-muted");
    if (pct) pct.textContent = `${n}%`;
  };

  const setStatusUI = (card, statusId) => {
    if (!card || !statusId) return;
    card.dataset.statusId = String(statusId);
  };

  const applyMoveResultToCard = (card, data, toStatusCode) => {
    if (toStatusCode === "OB1") {
      setProgressUI(card, 0);
      setStatusUI(card, "OB1");
      return;
    }

    if (toStatusCode === "OB5") {
      setProgressUI(card, 100);
      setStatusUI(card, "OB5");
      return;
    }

    if (data && typeof data === "object") {
      if (data.statusId) setStatusUI(card, data.statusId);
      if (data.progress != null) setProgressUI(card, data.progress);
    }
  };

  const saveMove = async (payload) => {
    const res = await fetch("/api/issues/board/move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success === false) {
      throw new Error(data?.message || "저장에 실패했습니다.");
    }
    return data;
  };

  // ------------------------------
  // Click / dblclick
  // ------------------------------
  let clickTimer = null;

  ui.wrap.addEventListener("dblclick", (e) => {
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }

    const card = e.target.closest(".kan-card");
    if (!card) return;

    const issueCode = card.dataset.issueCode;
    if (!issueCode) return;

    location.href = `/issueInfo?issueCode=${encodeURIComponent(issueCode)}`;
  });

  ui.wrap.addEventListener("click", (e) => {
    if (e.target.closest("a, button, input, textarea, select, label")) return;

    const card = e.target.closest(".kan-card");
    if (!card) return;

    if (clickTimer) clearTimeout(clickTimer);

    clickTimer = setTimeout(() => {
      clickTimer = null;

      const col = card.closest(".kan-col-body[data-status]");
      const status = col?.dataset?.status || "";
      if (status !== "OB2") return;

      openProgressModal(card);
    }, 220);
  });

  // ------------------------------
  // Progress modal (OB2)
  // ------------------------------
  let pendingProgress = null;

  const openProgressModal = async (card) => {
    if (!ui.progressModalEl || !progressModal) return;

    if (isEndedProjectCard(card)) {
      showToast("종료된 프로젝트는 변경 불가합니다.");
      return;
    }

    const issueCode = Number(card.dataset.issueCode || 0);
    const projectCode = resolveProjectCode(card);

    if (!issueCode || Number.isNaN(issueCode)) {
      showToast("일감 코드가 없습니다.");
      return;
    }
    if (!projectCode) {
      showToast("프로젝트 정보가 없습니다.");
      return;
    }

    let allowed = false;
    try {
      allowed = await canEditNormal(card, projectCode);
    } catch (e) {
      allowed = false;
    }
    if (!allowed) {
      toastNoAuthOnce();
      return;
    }

    if (isOverdueCard(card)) {
      showToast("마감기한이 지나 진척도를 수정할 수 없습니다.");
      return;
    }

    let canWorklog = false;
    try {
      canWorklog = await fetchCanWorklog(projectCode);
    } catch (e) {
      canWorklog = false;
    }

    pendingProgress = { issueCode, projectCode, card, canWorklog };

    if (ui.progressModalTitle) {
      ui.progressModalTitle.textContent = card.dataset.title || "";
    }

    const cur = Number(card.dataset.progress || 0);
    if (ui.progressInput) {
      ui.progressInput.value = String(Number.isNaN(cur) ? 0 : cur);
    }

    if (ui.progressHour) ui.progressHour.value = "";
    if (ui.progressMinute) ui.progressMinute.value = "";
    if (ui.progressDesc) ui.progressDesc.value = "";

    toggleWorklogSection("progress", canWorklog);

    progressModal.show();
  };

  ui.btnProgressSubmit?.addEventListener("click", async () => {
    if (!pendingProgress) {
      showToast("대상이 없습니다.");
      return;
    }

    const { projectCode, card, canWorklog } = pendingProgress;

    let v = Number(ui.progressInput?.value);
    if (Number.isNaN(v)) v = 0;

    if (v < 0 || v > 90) {
      showToast("진척도는 0~90 사이로 입력해 주세요.");
      return;
    }

    let wl = null;
    if (canWorklog) {
      wl = readWorklogInputs("progress");
      if (wl.error) {
        showToast(wl.error);
        return;
      }
    }

    try {
      isSaving.value = true;

      const res = await fetch("/api/kanban/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          projectCode,
          issueCode: Number(card.dataset.issueCode || 0),
          progress: v,
        }),
      })
        .then((r) => r.json())
        .catch(() => null);

      if (!res) {
        showToast("요청에 실패했습니다.");
        return;
      }
      if (!res.success) {
        showToast(res.message || "저장 실패");
        return;
      }

      setProgressUI(card, v);

      if (canWorklog && wl?.shouldSave) {
        try {
          await postWorklog({
            issueCode: Number(card.dataset.issueCode || 0),
            spentMinutes: wl.spentMinutes,
            description: wl.description,
          });
        } catch (e) {
          showToast(e?.message || "소요시간 저장 실패");
        }
      }

      if (canWorklog) {
        clearWorklogInputs("progress");
      }

      progressModal.hide();
      cleanupModalBackdrops();
      showToast("진척도가 저장되었습니다.");
    } catch (e) {
      showToast("저장 중 오류가 발생했습니다.");
    } finally {
      pendingProgress = null;
      isSaving.value = false;
    }
  });
  // ------------------------------
  // Reject / Resolve modals
  // ------------------------------
  let pendingReject = null;

  const openRejectModal = ({ item, fromCol, oldIndex, issueCode }) => {
    if (!ui.rejectModalEl || !rejectModal) {
      showToast("반려 모달이 없습니다.");
      revertToOrigin(item, fromCol, oldIndex);
      return;
    }

    pendingReject = { item, fromCol, oldIndex, issueCode };
    if (ui.rejectReason) ui.rejectReason.value = "";

    rejectModal.show();
  };

  ui.rejectModalEl?.addEventListener("hidden.bs.modal", () => {
    if (!pendingReject) return;

    const { item, fromCol, oldIndex } = pendingReject;
    pendingReject = null;

    isSaving.value = false;
    revertToOrigin(item, fromCol, oldIndex);
  });

  ui.btnRejectSubmit?.addEventListener("click", async () => {
    if (!pendingReject) {
      showToast("반려 대상이 없습니다.");
      return;
    }

    const { issueCode } = pendingReject;

    const reason = (ui.rejectReason?.value || "").trim();
    if (!reason) {
      showToast("반려 사유를 입력해 주세요.");
      return;
    }

    try {
      const body = new URLSearchParams();
      body.set("reason", reason);

      const res = await fetch(
        `/api/issues/${encodeURIComponent(issueCode)}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
          },
          body,
        },
      )
        .then((r) => r.json())
        .catch(() => null);

      if (!res) {
        showToast("요청에 실패했습니다.");
        return;
      }
      if (!res.success) {
        showToast(res.message || "반려 실패");
        return;
      }

      pendingReject = null;
      rejectModal.hide();
      cleanupModalBackdrops();

      showToast("반려 처리되었습니다.");
      setTimeout(() => location.reload(), 500);
    } catch (e) {
      showToast("반려 처리 중 오류가 발생했습니다.");
    } finally {
      isSaving.value = false;
    }
  });

  let pendingResolve = null;

  const openResolveModal = async ({
    item,
    fromCol,
    oldIndex,
    issueCode,
    projectCode,
  }) => {
    if (!ui.resolveModalEl || !resolveModal) {
      showToast("해결 모달이 없습니다.");
      revertToOrigin(item, fromCol, oldIndex);
      return;
    }

    let canWorklog = false;
    try {
      canWorklog = await fetchCanWorklog(projectCode);
    } catch (e) {
      canWorklog = false;
    }

    pendingResolve = {
      item,
      fromCol,
      oldIndex,
      issueCode,
      projectCode,
      canWorklog,
    };

    if (ui.resolveFile) ui.resolveFile.value = "";
    if (ui.resolveHour) ui.resolveHour.value = "";
    if (ui.resolveMinute) ui.resolveMinute.value = "";
    if (ui.resolveDesc) ui.resolveDesc.value = "";

    toggleWorklogSection("resolve", canWorklog);

    resolveModal.show();
  };

  ui.resolveModalEl?.addEventListener("hidden.bs.modal", () => {
    if (!pendingResolve) return;

    const { item, fromCol, oldIndex } = pendingResolve;
    pendingResolve = null;

    isSaving.value = false;
    revertToOrigin(item, fromCol, oldIndex);
  });

  ui.btnResolveSubmit?.addEventListener("click", async () => {
    if (!pendingResolve) {
      showToast("대상이 없습니다.");
      return;
    }

    const { issueCode, canWorklog } = pendingResolve;

    const file = ui.resolveFile?.files?.[0] || null;
    if (!file) {
      showToast("첨부파일을 선택해 주세요.");
      return;
    }

    let wl = null;
    if (canWorklog) {
      wl = readWorklogInputs("resolve");
      if (wl.error) {
        showToast(wl.error);
        return;
      }
    }

    try {
      isSaving.value = true;

      const fd = new FormData();
      fd.append("uploadFile", file);

      const res = await fetch(
        `/api/issues/${encodeURIComponent(issueCode)}/resolve`,
        {
          method: "POST",
          body: fd,
          headers: { "X-Requested-With": "XMLHttpRequest" },
        },
      )
        .then((r) => r.json())
        .catch(() => null);

      if (!res) {
        showToast("요청에 실패했습니다.");
        return;
      }
      if (!res.success) {
        showToast(res.message || "해결 처리 실패");
        return;
      }

      if (canWorklog && wl?.shouldSave) {
        try {
          await postWorklog({
            issueCode: Number(issueCode || 0),
            spentMinutes: wl.spentMinutes,
            description: wl.description,
          });
        } catch (e) {
          showToast(e?.message || "소요시간 저장 실패");
        }
      }

      if (canWorklog) {
        clearWorklogInputs("resolve");
      }

      pendingResolve = null;
      resolveModal.hide();
      cleanupModalBackdrops();

      showToast("해결 처리되었습니다.");
      setTimeout(() => location.reload(), 500);
    } catch (e) {
      showToast("해결 처리 중 오류가 발생했습니다.");
    } finally {
      isSaving.value = false;
    }
  });

  // ------------------------------
  // Sortable
  // ------------------------------
  const initSortable = (colBody) => {
    let dragFromCol = null;
    let dragOldIndex = null;
    let blockedEndedProjectDrag = false;

    const isDoneCol = (el) => String(el?.dataset?.status || "") === "OB5";
    const doneThisCol = isDoneCol(colBody);

    return new Sortable(colBody, {
      sort: !doneThisCol,
      group: { name: "kanban", put: true, pull: !doneThisCol },
      animation: 150,
      draggable: ".kan-card",
      handle: ".kan-card",
      filter:
        ".kb-done, .kan-col-body[data-status='OB5'] .kan-card, a, button, input, textarea, select, label",
      preventOnFilter: true,

      onStart: (evt) => {
        dragFromCol = evt.from;
        dragOldIndex = evt.oldIndex;
        blockedEndedProjectDrag = false;

        if (isEndedProjectCard(evt.item)) {
          blockedEndedProjectDrag = true;
          showToast("종료된 프로젝트는 변경 불가합니다.");
          return;
        }

        if (isDoneCol(evt.from)) toastNoAuthOnce();
      },

      onMove: (evt) => {
        if (blockedEndedProjectDrag) return false;
        if (isEndedProjectCard(evt.dragged)) return false;
        if (isDoneCol(evt.from)) return false;
        if (evt.dragged && evt.dragged.classList.contains("kb-done"))
          return false;
        return true;
      },

      onEnd: async (evt) => {
        if (blockedEndedProjectDrag || isEndedProjectCard(evt.item)) {
          blockedEndedProjectDrag = false;
          revertToOrigin(evt.item, dragFromCol, dragOldIndex);
          return;
        }

        if (isSaving.value) {
          revertToOrigin(evt.item, dragFromCol, dragOldIndex);
          return;
        }

        if (evt.from === evt.to && evt.oldIndex === evt.newIndex) return;

        const item = evt.item;

        const issueCode = Number(item?.dataset?.issueCode || 0);
        const projectCode = resolveProjectCode(item);

        if (!issueCode || Number.isNaN(issueCode)) {
          showToast("일감 코드가 없어 처리할 수 없습니다.");
          revertToOrigin(item, dragFromCol, dragOldIndex);
          return;
        }

        if (!projectCode) {
          showToast("프로젝트 정보가 없어 저장할 수 없습니다.");
          revertToOrigin(item, dragFromCol, dragOldIndex);
          return;
        }

        let allowed = false;
        try {
          allowed = await canEditNormal(item, projectCode);
        } catch (e) {
          allowed = false;
        }

        if (!allowed) {
          toastNoAuthOnce();
          revertToOrigin(item, dragFromCol, dragOldIndex);
          return;
        }

        const fromCol = evt.from;
        const toCol = evt.to;

        const fromStatusCode = fromCol?.dataset?.status || "";
        const toStatusCode = toCol?.dataset?.status || "";

        // 반려, 완료는 관리자만 가능
        if (toStatusCode === "OB4" || toStatusCode === "OB5") {
          let isAdmin = isAdminCache.get(projectCode);

          if (isAdmin === undefined) {
            try {
              isAdmin = await fetchIsAdmin(projectCode);
            } catch (e) {
              isAdmin = false;
            }
          }

          if (!isAdmin) {
            toastNoAuthOnce();
            revertToOrigin(item, dragFromCol, dragOldIndex);
            return;
          }

          if (toStatusCode === "OB4") {
            isSaving.value = true;
            openRejectModal({
              item,
              fromCol: evt.from,
              oldIndex: evt.oldIndex,
              issueCode: issueCode || null,
            });
            return;
          }
        }

        if (toStatusCode === "OB3") {
          isSaving.value = true;
          openResolveModal({
            item,
            fromCol: evt.from,
            oldIndex: evt.oldIndex,
            issueCode: issueCode || null,
            projectCode,
          });
          return;
        }

        const payload = {
          projectCode,
          issueCode: issueCode || null,
          fromStatusCode,
          toStatusCode,
          toIndex: typeof evt.newIndex === "number" ? evt.newIndex : null,
          fromOrder: getOrder(fromCol),
          toOrder: getOrder(toCol),
        };

        try {
          isSaving.value = true;

          const data = await saveMove(payload);

          applyMoveResultToCard(item, data, toStatusCode);

          updateCounts();
          updateCardStates();
        } catch (err) {
          showToast(mapCompleteErrorMessage(err?.message, toStatusCode));
          revertToOrigin(item, dragFromCol, dragOldIndex);
        } finally {
          isSaving.value = false;
        }
      },
    });
  };

  $$(".kan-col-body[data-status]").forEach(initSortable);

  // ------------------------------
  // Init view
  // ------------------------------
  const forceScopeME = () => {
    ui.scopeRadios.forEach((r) => (r.checked = false));
    const me = ui.scopeRadios.find((r) => r.value === "ME");
    if (me) me.checked = true;
  };

  const initView = () => {
    const cp = window.__CP__;
    if (!ui.projectValue?.value?.trim() && cp?.projectCode) {
      ui.projectValue.value = String(cp.projectCode);
      ui.projectText.value = cp.projectName || "";
    }
    forceScopeME();
    applyFiltersClient();
    updateCounts();
    updateCardStates();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initView);
  } else {
    initView();
  }

  setTimeout(updateCounts, 0);
})();
