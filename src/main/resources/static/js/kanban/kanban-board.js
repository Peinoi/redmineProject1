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
    assigneeModalList: $("#assigneeModalList"),
    creatorModalList: $("#creatorModalList"),
    typeModalTbody: $("#typeModalTbody"),

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

  const cleanupModalBackdrops = () => {
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("padding-right");
    $$(".modal-backdrop").forEach((bd) => bd.remove());
    $$(".modal.show").forEach((m) => m.classList.remove("show"));
  };

  const bindModalCleanup = (modalEl) => {
    if (!modalEl) return;
    modalEl.addEventListener("hidden.bs.modal", () => {
      cleanupModalBackdrops();
    });
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

  const cards = () => $$(".kan-card[data-issue-code]");
  const isVisible = (el) => el.style.display !== "none";

  const sameDay = (rowDate, filterDate) => {
    if (!filterDate) return true;
    if (!rowDate) return false;
    return rowDate.slice(0, 10) === filterDate;
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
    if (!ymd || ymd.length < 10) return null;
    const y = Number(ymd.slice(0, 4));
    const m = Number(ymd.slice(5, 7));
    const d = Number(ymd.slice(8, 10));
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
  // 모달 데이터 로드/렌더
  // ------------------------------
  let projectCache = [];
  let userCache = [];
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
    if (projectCache.length > 0) return true;
    const res = await fetch("/api/projects/modal", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      showToast("프로젝트 목록을 불러오지 못했습니다.");
      return false;
    }
    const data = await res.json().catch(() => []);
    projectCache = (data || []).map((p) => ({
      code: String(p.projectCode),
      name: p.projectName,
    }));
    return true;
  };

  const ensureUserCache = async () => {
    if (userCache.length > 0) return true;
    const res = await fetch("/api/users/modal/my-projects", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      showToast("사용자 목록을 불러오지 못했습니다.");
      return false;
    }
    const data = await res.json().catch(() => []);
    userCache = (data || []).map((u) => ({
      code: String(u.userCode),
      name: u.userName,
    }));
    return true;
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
    const data = await res.json().catch(() => []);
    typeCache = (data || []).map((t) => ({
      code: String(t.typeCode),
      parentName: (t.parTypeName ?? "").trim(),
      name: (t.typeName ?? "").trim(),
    }));
    return true;
  };

  const openProjectModal = async () => {
    if (!projectModal) return;
    if (ui.projectModalSearch) ui.projectModalSearch.value = "";

    const ok = await ensureProjectCache();
    if (!ok) return;

    renderListButtons(ui.projectModalList, projectCache, (picked) => {
      if (ui.projectText) ui.projectText.value = picked.name;
      if (ui.projectValue) ui.projectValue.value = picked.code;

      projectModal.hide();
      setTimeout(cleanupModalBackdrops, 50);
    });

    projectModal.show();
  };

  const openUserModal = async (kind) => {
    const modal = kind === "assignee" ? assigneeModal : creatorModal;
    const listEl =
      kind === "assignee" ? ui.assigneeModalList : ui.creatorModalList;
    const searchEl =
      kind === "assignee" ? ui.assigneeModalSearch : ui.creatorModalSearch;

    if (!modal) return;
    if (searchEl) searchEl.value = "";

    const ok = await ensureUserCache();
    if (!ok) return;

    renderListButtons(listEl, userCache, (picked) => {
      if (kind === "assignee") {
        if (ui.assigneeText) ui.assigneeText.value = picked.name;
        if (ui.assigneeValue) ui.assigneeValue.value = picked.code;
      } else {
        if (ui.creatorText) ui.creatorText.value = picked.name;
        if (ui.creatorValue) ui.creatorValue.value = picked.code;
      }

      modal.hide();
      setTimeout(cleanupModalBackdrops, 50);
    });

    modal.show();
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
        if (ui.typeText) ui.typeText.value = t.name;
        if (ui.typeValue) ui.typeValue.value = t.code;

        typeModal?.hide();
        setTimeout(cleanupModalBackdrops, 50);
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
      if (ui.projectText) ui.projectText.value = picked.name;
      if (ui.projectValue) ui.projectValue.value = picked.code;

      projectModal?.hide();
      setTimeout(cleanupModalBackdrops, 50);
    });
  });

  ui.assigneeModalSearch?.addEventListener("input", async () => {
    const ok = await ensureUserCache();
    if (!ok) return;

    const q = ui.assigneeModalSearch.value.trim().toLowerCase();
    const list = userCache.filter((u) => u.name.toLowerCase().includes(q));

    renderListButtons(ui.assigneeModalList, list, (picked) => {
      if (ui.assigneeText) ui.assigneeText.value = picked.name;
      if (ui.assigneeValue) ui.assigneeValue.value = picked.code;

      assigneeModal?.hide();
      setTimeout(cleanupModalBackdrops, 50);
    });
  });

  ui.creatorModalSearch?.addEventListener("input", async () => {
    const ok = await ensureUserCache();
    if (!ok) return;

    const q = ui.creatorModalSearch.value.trim().toLowerCase();
    const list = userCache.filter((u) => u.name.toLowerCase().includes(q));

    renderListButtons(ui.creatorModalList, list, (picked) => {
      if (ui.creatorText) ui.creatorText.value = picked.name;
      if (ui.creatorValue) ui.creatorValue.value = picked.code;

      creatorModal?.hide();
      setTimeout(cleanupModalBackdrops, 50);
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

  // ------------------------------
  // 칸반 드래그 + 클릭 기능
  // ------------------------------
  if (!ui.boardMeta || !ui.wrap) return;

  const isSaving = { value: false };

  const getOrder = (colBody) =>
    Array.from(colBody.querySelectorAll(".kan-card"))
      .filter(isVisible)
      .map((c) => Number(c.dataset.issueCode));

  const resolveProjectCode = (itemEl) => {
    const raw = itemEl?.dataset?.projectCode || "";
    const n = raw ? Number(raw) : null;
    return typeof n === "number" && !Number.isNaN(n) ? n : null;
  };

  // 권한 캐시
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

  // 드래그 원복
  const revertToOrigin = (itemEl, fromCol, oldIndex) => {
    if (!itemEl || !fromCol || typeof oldIndex !== "number") return;

    const children = Array.from(fromCol.querySelectorAll(":scope > .kan-card"));
    const ref = children[oldIndex] || null;

    if (ref) fromCol.insertBefore(itemEl, ref);
    else fromCol.appendChild(itemEl);

    updateCounts();
    updateCardStates();
  };

  // 토스트 중복 방지
  let lastNoAuthToastAt = 0;
  const toastNoAuthOnce = () => {
    const now = Date.now();
    if (now - lastNoAuthToastAt < 800) return;
    lastNoAuthToastAt = now;
    showToast("권한이 없습니다.");
  };

  // ------------------------------
  // (추가) 카드 UI 즉시 반영 유틸
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

    const badge = card.querySelector(".kb-progress");
    if (badge) badge.textContent = `진척도 ${n}%`;

    // 너 마크업이 ".small.text-muted"였는데 혹시 구조가 다를 수도 있어서 후보를 넓힘
    const pct =
      card.querySelector(".kb-progress-text") ||
      card.querySelector(".progress-text") ||
      card.querySelector(".small.text-muted");
    if (pct) pct.textContent = `${n}%`;
  };

  const setStatusUI = (card, statusId) => {
    if (!card || !statusId) return;
    card.dataset.statusId = String(statusId);
  };

  const applyMoveResultToCard = (card, data, toStatusCode) => {
    // 1) 신규로 돌아오면 progress는 무조건 0으로 즉시 보정
    if (toStatusCode === "OB1") {
      setProgressUI(card, 0);
      setStatusUI(card, "OB1");
      return;
    }

    // 2) 서버가 내려준 값이 있으면 그걸로 반영
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
  // 클릭 / 더블클릭
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
  // 진행(OB2) 진척도 모달 + 저장
  // ------------------------------
  let pendingProgress = null; // { issueCode, projectCode, card }

  const openProgressModal = async (card) => {
    if (!ui.progressModalEl || !progressModal) return;

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

    // 권한 체크
    let allowed = canModifyCache.get(projectCode);
    if (allowed === undefined) {
      try {
        allowed = await fetchCanModify(projectCode);
      } catch (e) {
        allowed = false;
      }
    }
    if (!allowed) {
      toastNoAuthOnce();
      return;
    }

    if (isOverdueCard(card)) {
      showToast("마감기한이 지나 진척도를 수정할 수 없습니다.");
      return;
    }

    pendingProgress = { issueCode, projectCode, card };

    if (ui.progressModalTitle)
      ui.progressModalTitle.textContent = card.dataset.title || "";

    const cur = Number(card.dataset.progress || 0);
    if (ui.progressInput)
      ui.progressInput.value = String(Number.isNaN(cur) ? 0 : cur);

    progressModal.show();
  };

  ui.btnProgressSubmit?.addEventListener("click", async () => {
    if (!pendingProgress) {
      showToast("대상이 없습니다.");
      return;
    }

    const { issueCode, projectCode, card } = pendingProgress;

    let v = Number(ui.progressInput?.value);
    if (Number.isNaN(v)) v = 0;

    // 진행(OB2): 0~90
    if (v < 0 || v > 90) {
      showToast("진척도는 0~90 사이로 입력해 주세요.");
      return;
    }

    try {
      isSaving.value = true;

      const res = await fetch("/api/issues/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ projectCode, issueCode, progress: v }),
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

      // UI 반영
      setProgressUI(card, v);

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
  // 반려 / 해결 모달
  // ------------------------------
  let pendingReject = null; // { item, fromCol, oldIndex, issueCode }

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

  let pendingResolve = null; // { item, fromCol, oldIndex, issueCode, projectCode }

  const openResolveModal = ({
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

    pendingResolve = { item, fromCol, oldIndex, issueCode, projectCode };

    if (ui.resolveFile) ui.resolveFile.value = "";
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

    const { issueCode } = pendingResolve;

    const file = ui.resolveFile?.files?.[0] || null;
    if (!file) {
      showToast("첨부파일을 선택해 주세요.");
      return;
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

    const isDoneCol = (el) => String(el?.dataset?.status || "") === "OB5";
    const doneThisCol = isDoneCol(colBody);

    return new Sortable(colBody, {
      sort: !doneThisCol,

      group: {
        name: "kanban",
        put: true,
        pull: !doneThisCol,
      },

      animation: 150,
      draggable: ".kan-card",
      handle: ".kan-card",

      filter:
        ".kb-done, .kan-col-body[data-status='OB5'] .kan-card, a, button, input, textarea, select, label",
      preventOnFilter: true,

      onStart: (evt) => {
        dragFromCol = evt.from;
        dragOldIndex = evt.oldIndex;

        if (isDoneCol(evt.from)) {
          toastNoAuthOnce();
        }
      },

      onMove: (evt) => {
        if (isDoneCol(evt.from)) return false;
        if (evt.dragged && evt.dragged.classList.contains("kb-done"))
          return false;
        return true;
      },

      onEnd: async (evt) => {
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

        let allowed = canModifyCache.get(projectCode);
        if (allowed === undefined) {
          try {
            allowed = await fetchCanModify(projectCode);
          } catch (e) {
            allowed = false;
          }
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

          // (핵심) 서버 반영 성공 즉시 카드 UI에 progress 반영
          applyMoveResultToCard(item, data, toStatusCode);

          updateCounts();
          updateCardStates();
        } catch (err) {
          showToast(err?.message || "저장에 실패했습니다.");
          revertToOrigin(item, dragFromCol, dragOldIndex);
        } finally {
          isSaving.value = false;
        }
      },
    });
  };

  $$(".kan-col-body[data-status]").forEach(initSortable);

  const forceScopeME = () => {
    ui.scopeRadios.forEach((r) => {
      r.checked = false;
    });
    const me = ui.scopeRadios.find((r) => r.value === "ME");
    if (me) me.checked = true;
  };

  const initView = () => {
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
