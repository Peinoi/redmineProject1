// /js/worklog/worklog-stats.js
(() => {
  const $ = (s) => document.querySelector(s);

  const ui = {
    // filter form
    form: $("#worklogStatsFilterForm"),

    // filters
    projectText: $("#filterProjectText"),
    projectValue: $("#filterProjectValue"),

    typeText: $("#filterTypeText"),
    typeValue: $("#filterTypeValue"),

    issueTitle: $("#filterIssueTitle"),

    workerText: $("#filterWorkerText"),
    workerValue: $("#filterWorkerValue"),

    workHour: $("#filterWorkHour"),
    workMinute: $("#filterWorkMinute"),
    workTimeHidden: $("#filterWorkTime"),

    // buttons
    btnApply: $("#btnApplyFilters"),
    btnReset: $("#btnResetFilters"),

    // group options
    groupByProject: $("#groupByProject"),
    groupByWorker: $("#groupByWorker"),
    groupByType: $("#groupByType"),
    optIssue: $("#optIssue"),

    // table
    tbody: $("#statsTbody"),
    theadRow: $("#statsTheadRow"),

    // overlay
    overlay: $("#statsOverlay"),

    // modals
    btnProjectModal: $("#btnOpenProjectModal"),
    btnTypeModal: $("#btnOpenTypeModal"),
    btnWorkerModal: $("#btnOpenWorkerModal"),

    projectModalEl: $("#projectSelectModal"),
    projectModalSearch: $("#projectModalSearch"),
    projectModalList: $("#projectModalList"),

    typeModalEl: $("#typeSelectModal"),
    typeModalSearch: $("#typeModalSearch"),
    typeModalTree: $("#typeModalTree"),

    workerModalEl: $("#workerSelectModal"),
    workerModalSearch: $("#workerModalSearch"),
    workerModalTree: $("#workerModalTree"),
  };

  const includeIssueHidden = $("#includeIssueHidden");

  if (!ui.tbody || !ui.theadRow) return;

  // -------------------------
  // bootstrap modal helper
  // -------------------------
  const getModal = (el) => {
    if (!el) return null;
    return bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
  };

  const modal = {
    project: getModal(ui.projectModalEl),
    type: getModal(ui.typeModalEl),
    worker: getModal(ui.workerModalEl),
  };

  // -------------------------
  // overlay
  // -------------------------
  const showOverlay = (on) => {
    if (!ui.overlay) return;
    ui.overlay.classList.toggle("d-none", !on);
  };

  // -------------------------
  // time split -> hidden (HH:mm)
  // -------------------------
  const clampInt = (val, min, max) => {
    const s = String(val ?? "").trim();
    if (s === "") return "";

    const n = Number(s);
    if (!Number.isFinite(n)) return "";

    const x = Math.max(min, Math.min(max, Math.trunc(n)));
    return String(x);
  };

  const syncWorkTimeHidden = () => {
    if (!ui.workTimeHidden) return;

    const rawH = (ui.workHour?.value ?? "").trim();
    const rawM = (ui.workMinute?.value ?? "").trim();

    // 둘 다 비었으면 미적용
    if (rawH === "" && rawM === "") {
      ui.workTimeHidden.value = "";
      return;
    }

    if (rawH === "0" && rawM === "0") {
      ui.workTimeHidden.value = "";
      return;
    }

    const h = clampInt(rawH, 0, 999);
    const m = clampInt(rawM, 0, 59);

    if (h === "" && m === "") {
      ui.workTimeHidden.value = "";
      return;
    }

    const hours = String(Number(h || "0"));
    const mins = String(Number(m || "0")).padStart(2, "0");
    ui.workTimeHidden.value = `${hours}:${mins}`;
  };

  // hidden 값이 있으면 split에 반영
  (() => {
    const v = (ui.workTimeHidden?.value || "").trim();
    if (!v) return;
    const m = v.match(/^(\d{1,3}):(\d{1,2})$/);
    if (!m) return;
    if (ui.workHour) ui.workHour.value = String(Number(m[1]));
    if (ui.workMinute) ui.workMinute.value = String(Number(m[2]));
  })();

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

  // -------------------------
  // options + filters read
  // -------------------------
  const readOptions = () => ({
    groupBy: ui.groupByWorker?.checked
      ? "worker"
      : ui.groupByType?.checked
        ? "type"
        : "project",
    showIssue: !!ui.optIssue?.checked,
  });

  const readFilters = () => {
    syncWorkTimeHidden();
    return {
      projectCode: (ui.projectValue?.value || "").trim(),
      typeCode: (ui.typeValue?.value || "").trim(),
      workerCode: (ui.workerValue?.value || "").trim(),
      issueTitle: (ui.issueTitle?.value || "").trim(),
      workTime: (ui.workTimeHidden?.value || "").trim(),
    };
  };

  const syncIncludeIssueHidden = () => {
    if (!includeIssueHidden) return;
    includeIssueHidden.value = ui.optIssue?.checked ? "true" : "false";
  };

  // -------------------------
  // state
  // -------------------------
  let state = {
    groupBy: "project",
    showIssue: false,
    rows: [],
    collapsed: new Set(),
    keyToRowIndex: new Map(),
    columns: [],
    filter: {
      projectCode: "",
      typeCode: "",
      workerCode: "",
      issueTitle: "",
      workTime: "",
    },
  };

  const updateStateFromUI = () => {
    clampFilterInputs();
    syncIncludeIssueHidden();

    const opt = readOptions();
    state.groupBy = opt.groupBy;
    state.showIssue = opt.showIssue;
    state.filter = readFilters();
  };

  // -------------------------
  // fetch stats (필터 포함)
  // -------------------------
  const fetchStats = async () => {
    // 여기서 최신값을 강제로 동기화
    clampFilterInputs();
    syncIncludeIssueHidden();

    const opt = readOptions();
    const f = readFilters();

    const qs = new URLSearchParams({
      groupBy: opt.groupBy,
      includeIssue: opt.showIssue ? "true" : "false",

      projectCode: f.projectCode,
      typeCode: f.typeCode,
      workerCode: f.workerCode,
      issueTitle: f.issueTitle,
      workTime: f.workTime,
    });

    const res = await fetch(`/api/worklogs/stats?${qs.toString()}`, {
      headers: { Accept: "application/json" },
    });

    const json = await res.json().catch(() => ({}));
    return json && json.success ? json.data || [] : [];
  };

  // -------------------------
  // table render
  // -------------------------
  const minutesToText = (m) => {
    m = Number(m || 0);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    if (h && mm) return `${h}시간 ${mm}분`;
    if (h) return `${h}시간`;
    return `${mm}분`;
  };

  // 4열 고정
  const setColumns = () => {
    state.columns = [
      { key: "c0", label: "프로젝트", width: "35%", align: "left" },
      { key: "c1", label: "작업자/유형", width: "25%", align: "left" },
      { key: "c2", label: "일감", width: "25%", align: "left" },
      { key: "time", label: "시간", width: "15%", align: "right" },
    ];
  };

  const renderThead = () => {
    setColumns();
    ui.theadRow.innerHTML = state.columns
      .map(
        (c) =>
          `<th style="width:${c.width}; text-align:${c.align};">${c.label}</th>`,
      )
      .join("");
  };

  const hasChildrenByIndex = (i) => {
    const cur = state.rows[i];
    const next = state.rows[i + 1];
    return !!(next && next.level > cur.level && next.parent === cur.key);
  };

  const isVisibleByIndex = (i) => {
    const row = state.rows[i];
    if (row.level === 0) return true;

    let parentKey = row.parent;
    while (parentKey) {
      if (state.collapsed.has(parentKey)) return false;
      const pIdx = state.keyToRowIndex.get(parentKey);
      if (pIdx == null) break;
      parentKey = state.rows[pIdx].parent;
    }
    return true;
  };

  const toggleCollapse = (key) => {
    if (!key) return;
    if (state.collapsed.has(key)) state.collapsed.delete(key);
    else state.collapsed.add(key);
  };

  const makeIssueBadge = (issueCode, title) => {
    const a = document.createElement("a");
    a.href = `/issueInfo?issueCode=${encodeURIComponent(issueCode)}`;
    a.className =
      "badge rounded-pill text-bg-light border text-decoration-none px-3 py-2 stats-issue-badge";
    a.style.maxWidth = "360px";
    a.style.display = "inline-block";
    a.style.overflow = "hidden";
    a.style.textOverflow = "ellipsis";
    a.style.whiteSpace = "nowrap";
    a.textContent = title || "";
    return a;
  };

  const makeUserLink = (userCode, name) => {
    const a = document.createElement("a");
    a.href = `/users/${encodeURIComponent(userCode)}`;
    a.className = "user-link text-decoration-none";
    a.textContent = name || "";
    return a;
  };

  const buildRows = (raw) => {
    state.rows = [];
    state.keyToRowIndex.clear();

    const pMap = new Map();

    raw.forEach((r) => {
      const pKey = String(r.projectCode ?? "");
      if (!pMap.has(pKey)) {
        pMap.set(pKey, {
          projectCode: pKey,
          projectName: r.projectName || "",
          minutes: 0,
          mids: new Map(),
          issues: new Map(),
        });
      }

      const p = pMap.get(pKey);
      p.minutes += Number(r.minutes || 0);

      const issueCode = r.issueCode != null ? String(r.issueCode) : "";
      const issueTitle = r.issueTitle || "";

      // groupBy=project
      if (state.groupBy === "project") {
        if (state.showIssue && issueCode) {
          if (!p.issues.has(issueCode)) {
            p.issues.set(issueCode, { issueCode, issueTitle, minutes: 0 });
          }
          p.issues.get(issueCode).minutes += Number(r.minutes || 0);
        }
        return;
      }

      // worker/type
      const gKey = r.groupKey != null ? String(r.groupKey) : "";
      const gName = r.groupName || "-";

      if (!p.mids.has(gKey)) {
        p.mids.set(gKey, {
          groupKey: gKey,
          name: gName,
          minutes: 0,
          issues: new Map(),
        });
      }

      const mid = p.mids.get(gKey);
      mid.minutes += Number(r.minutes || 0);

      if (state.showIssue && issueCode) {
        if (!mid.issues.has(issueCode)) {
          mid.issues.set(issueCode, { issueCode, issueTitle, minutes: 0 });
        }
        mid.issues.get(issueCode).minutes += Number(r.minutes || 0);
      }
    });

    const projects = Array.from(pMap.values()).sort((a, b) =>
      String(a.projectName).localeCompare(String(b.projectName), "ko"),
    );

    projects.forEach((p) => {
      const pRowKey = `p-${p.projectCode}`;

      state.rows.push({
        level: 0,
        key: pRowKey,
        parent: null,
        c0: p.projectName,
        c1: "",
        c2: "",
        time: minutesToText(p.minutes),
      });

      // project + issue
      if (state.groupBy === "project" && state.showIssue) {
        const issues = Array.from(p.issues.values()).sort((a, b) =>
          String(a.issueTitle).localeCompare(String(b.issueTitle), "ko"),
        );

        issues.forEach((it) => {
          state.rows.push({
            level: 1,
            key: `i-${p.projectCode}-${it.issueCode}`,
            parent: pRowKey,
            c0: "",
            c1: "",
            c2: it.issueTitle,
            time: minutesToText(it.minutes),
            issueCode: it.issueCode,
          });
        });

        return;
      }

      // worker/type modes
      if (state.groupBy !== "project") {
        const mids = Array.from(p.mids.values()).sort((a, b) =>
          String(a.name).localeCompare(String(b.name), "ko"),
        );

        mids.forEach((m) => {
          const mRowKey = `m-${p.projectCode}-${m.groupKey}`;
          const isWorkerMode = state.groupBy === "worker";

          state.rows.push({
            level: 1,
            key: mRowKey,
            parent: pRowKey,
            c0: "",
            c1: m.name,
            c2: "",
            time: minutesToText(m.minutes),
            userCode: isWorkerMode ? m.groupKey : null,
            userName: isWorkerMode ? m.name : null,
          });

          if (state.showIssue) {
            const issues = Array.from(m.issues.values()).sort((a, b) =>
              String(a.issueTitle).localeCompare(String(b.issueTitle), "ko"),
            );

            issues.forEach((it) => {
              state.rows.push({
                level: 2,
                key: `i-${p.projectCode}-${m.groupKey}-${it.issueCode}`,
                parent: mRowKey,
                c0: "",
                c1: "",
                c2: it.issueTitle,
                time: minutesToText(it.minutes),
                issueCode: it.issueCode,
                userCode: isWorkerMode ? m.groupKey : null,
                userName: isWorkerMode ? m.name : null,
              });
            });
          }
        });
      }
    });

    state.rows.forEach((r, idx) => state.keyToRowIndex.set(r.key, idx));

    // 기본: 자식 있는 행은 닫힘
    state.collapsed.clear();
    for (let i = 0; i < state.rows.length; i++) {
      if (hasChildrenByIndex(i)) state.collapsed.add(state.rows[i].key);
    }

    // project only는 아코디언 없음
    if (state.groupBy === "project" && !state.showIssue) {
      state.collapsed.clear();
    }
  };

  const renderBody = () => {
    ui.tbody.innerHTML = "";

    state.rows.forEach((r, i) => {
      if (!isVisibleByIndex(i)) return;

      const tr = document.createElement("tr");

      const expandable = hasChildrenByIndex(i);
      if (expandable) tr.classList.add("stats-expandable");

      state.columns.forEach((colDef) => {
        const td = document.createElement("td");
        td.style.textAlign = colDef.align;

        const key = colDef.key;
        const text = r[key] != null ? String(r[key]) : "";

        if (key === "time") {
          td.classList.add("stats-time");
          if (r.level > 0) td.classList.add("stats-time-subtle");
        } else {
          td.classList.add("stats-cell");
          if (r.level === 0 && key === "c0") td.classList.add("stats-lv0");
          if (r.level === 1 && key === "c1") td.classList.add("stats-lv1");
          if (r.level === 2 && key === "c2") td.classList.add("stats-lv2");

          if (state.groupBy === "project" && r.level === 1 && key === "c2") {
            td.classList.add("stats-lv1");
          }
        }

        // 화살표 위치: 프로젝트 행(c0), 중간그룹 행(c1)
        let showArrow = false;
        if (expandable) {
          showArrow =
            (r.level === 0 && key === "c0") || (r.level === 1 && key === "c1");
        }

        if (showArrow) {
          const wrap = document.createElement("div");
          wrap.className = "stats-accordion";

          const arrow = document.createElement("span");
          arrow.className = "stats-arrow";
          arrow.textContent = state.collapsed.has(r.key) ? "▶" : "▼";

          wrap.appendChild(arrow);

          const isWorkerAccordionHeader =
            state.groupBy === "worker" &&
            r.level === 1 &&
            key === "c1" &&
            r.userCode;

          if (isWorkerAccordionHeader) {
            wrap.appendChild(makeUserLink(r.userCode, text));
          } else {
            const label = document.createElement("span");
            label.textContent = text;
            wrap.appendChild(label);
          }

          td.appendChild(wrap);
          td.style.cursor = "pointer";
        } else {
          const isIssueRow =
            (state.groupBy === "project" &&
              state.showIssue &&
              r.level === 1 &&
              key === "c2") ||
            (state.groupBy !== "project" &&
              state.showIssue &&
              r.level === 2 &&
              key === "c2");

          const isUserCell =
            state.groupBy === "worker" && key === "c1" && r.userCode && text;

          if (isIssueRow && r.issueCode) {
            td.appendChild(makeIssueBadge(r.issueCode, text));
          } else if (isUserCell) {
            td.appendChild(makeUserLink(r.userCode, text));
          } else {
            td.textContent = text;
          }
        }

        tr.appendChild(td);
      });

      if (expandable) {
        tr.style.cursor = "pointer";
        tr.addEventListener("click", (e) => {
          const tag = (e.target && e.target.tagName) || "";
          if (tag === "A") return;
          toggleCollapse(r.key);
          renderBody();
        });
      }

      ui.tbody.appendChild(tr);
    });
  };

  const renderAll = async () => {
    showOverlay(true);
    try {
      renderThead();
      const raw = await fetchStats();
      buildRows(raw);
      renderBody();
    } finally {
      showOverlay(false);
    }
  };

  // -------------------------
  // common tree render (worker)
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

  // -------------------------
  // 1) 프로젝트 모달
  // -------------------------
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

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "list-group-item list-group-item-action";
      btn.dataset.projectCode = code;
      btn.dataset.projectName = name;
      btn.textContent = name || "-";
      ui.projectModalList.appendChild(btn);
    });
  };

  const fetchProjectsForModal = async () => {
    const q = (ui.projectModalSearch?.value || "").trim();
    const base = "/api/projects/modal";
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

      const data = await res.json().catch(() => []);
      const list = Array.isArray(data) ? data : data.list || data.data || [];
      renderProjectList(list);
    } catch (err) {
      ui.projectModalList.innerHTML =
        '<div class="text-danger">프로젝트 목록을 불러오지 못했습니다.</div>';
    }
  };

  const openProjectModal = async () => {
    if (!modal.project) return;
    if (ui.projectModalSearch) ui.projectModalSearch.value = "";
    modal.project.show();
    await fetchProjectsForModal();
    ui.projectModalSearch?.focus();
  };

  ui.btnProjectModal?.addEventListener("click", (e) => {
    e.preventDefault();
    openProjectModal();
  });

  let projectSearchTimer = null;
  ui.projectModalSearch?.addEventListener("input", () => {
    clearTimeout(projectSearchTimer);
    projectSearchTimer = setTimeout(fetchProjectsForModal, 200);
  });

  ui.projectModalList?.addEventListener("click", (e) => {
    const item = e.target.closest("[data-project-code]");
    if (!item) return;

    const code = String(item.dataset.projectCode || "").trim();
    const name = String(item.dataset.projectName || "").trim();
    if (!code) return;

    if (ui.projectText) ui.projectText.value = name;
    if (ui.projectValue) ui.projectValue.value = code;

    // 프로젝트 바꾸면 하위 필터는 초기화(목록과 동일)
    if (ui.typeText) ui.typeText.value = "";
    if (ui.typeValue) ui.typeValue.value = "";
    if (ui.workerText) ui.workerText.value = "";
    if (ui.workerValue) ui.workerValue.value = "";

    modal.project.hide();
  });

  // -------------------------
  // 2) 유형 모달
  // -------------------------
  let typeCache = [];

  const ensureTypeCache = async () => {
    if (typeCache.length) return true;

    const res = await fetch("/api/types/modal", {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return false;
    typeCache = await res.json().catch(() => []);
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

        if (ui.typeText) ui.typeText.value = type.name || "";
        if (ui.typeValue) ui.typeValue.value = type.code || "";

        // 유형 클릭 시 프로젝트도 자동 셋(목록과 동일)
        if (type.projectCode && type.projectName) {
          if (ui.projectValue) ui.projectValue.value = type.projectCode;
          if (ui.projectText) ui.projectText.value = type.projectName;
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

      const rootUl = document.createElement("ul");
      (p.children || []).forEach((t) => rootUl.appendChild(createNode(t)));
      contentWrapper.appendChild(rootUl);

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
    ui.typeModalSearch?.focus();
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

  // -------------------------
  // 3) 작업자 모달 (필터용 트리)
  // -------------------------
  let workerFilterCache = [];

  const ensureWorkerFilterCache = async () => {
    if (workerFilterCache.length) return true;

    const res = await fetch("/api/users/modal/worklogs/workers", {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return false;
    workerFilterCache = await res.json().catch(() => []);
    return true;
  };

  const openWorkerModal = async () => {
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
        if (ui.workerText) ui.workerText.value = picked.userName || "";
        if (ui.workerValue) ui.workerValue.value = picked.userCode || "";

        // 작업자 선택으로 프로젝트가 비어있으면 프로젝트도 셋
        if (!ui.projectValue?.value && projectCode) {
          if (ui.projectValue) ui.projectValue.value = projectCode;
          if (ui.projectText) ui.projectText.value = projectName || "";
        }

        modal.worker?.hide();
      },
    );

    modal.worker.show();
    ui.workerModalSearch?.focus();
  };

  ui.btnWorkerModal?.addEventListener("click", (e) => {
    e.preventDefault();
    openWorkerModal();
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
        if (ui.workerText) ui.workerText.value = picked.userName || "";
        if (ui.workerValue) ui.workerValue.value = picked.userCode || "";

        if (!ui.projectValue?.value && projectCode) {
          if (ui.projectValue) ui.projectValue.value = projectCode;
          if (ui.projectText) ui.projectText.value = projectName || "";
        }

        modal.worker?.hide();
      },
    );
  });

  // -------------------------
  // apply/reset (핵심 수정)
  // -------------------------
  ui.btnApply?.addEventListener("click", async (e) => {
    e.preventDefault();

    // 여기서 "현재 입력값"을 state에 반영해야 필터가 먹음
    updateStateFromUI();

    // 폼 submit(페이지 리로드) 대신, 테이블만 갱신
    await renderAll();
  });

  // 혹시 엔터로 submit 하는 경우도 막고 동일하게 처리
  ui.form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    updateStateFromUI();
    await renderAll();
  });

  ui.btnReset?.addEventListener("click", async (e) => {
    e.preventDefault();

    if (ui.projectText) ui.projectText.value = "";
    if (ui.projectValue) ui.projectValue.value = "";

    if (ui.typeText) ui.typeText.value = "";
    if (ui.typeValue) ui.typeValue.value = "";

    if (ui.issueTitle) ui.issueTitle.value = "";

    if (ui.workerText) ui.workerText.value = "";
    if (ui.workerValue) ui.workerValue.value = "";

    if (ui.workHour) ui.workHour.value = "";
    if (ui.workMinute) ui.workMinute.value = "";
    if (ui.workTimeHidden) ui.workTimeHidden.value = "";

    if (ui.groupByProject) ui.groupByProject.checked = true;
    if (ui.optIssue) ui.optIssue.checked = false;
    syncIncludeIssueHidden();

    updateStateFromUI();
    await renderAll();
  });

  ui.optIssue?.addEventListener("change", syncIncludeIssueHidden);

  // -------------------------
  // init
  // -------------------------
  (() => {
    syncIncludeIssueHidden();
    syncWorkTimeHidden();
    updateStateFromUI();
    renderAll();
  })();
})();
