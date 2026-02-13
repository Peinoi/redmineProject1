// /js/issue/issue-edit.js
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

  const isOverdue = () => {
    const due = (dueView?.value || "").trim();
    if (!due) return false;
    return isBefore(due, todayYmd());
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
  // 유형 종료일 제한
  // -------------------------
  const typeEndAtView = $("#typeEndAtView");
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
      if (selectedTypeEndDate) dueView.max = selectedTypeEndDate;
      else dueView.removeAttribute("max");
    }

    if (
      selectedTypeEndDate &&
      dueView?.value &&
      dueView.value > selectedTypeEndDate
    ) {
      dueView.value = selectedTypeEndDate;
      syncDueWithPriority();
      showToast(
        "마감기한이 유형 종료일을 초과할 수 없어 종료일로 조정되었습니다.",
      );
    }
  };

  const setDueByPriority = () => {
    if (!dueView || !dueAt || !prioritySel) return;

    const days = getPriorityDays();
    if (!days) return;

    let dueStr = toDate(addDays(new Date(), days));
    dueStr = clampByTypeEndDate(dueStr);

    dueView.value = dueStr;
    dueAt.value = toDT(dueStr);
  };

  const syncDueWithPriority = () => {
    if (!dueView || !dueAt) return;

    if (!dueView.value) {
      if (!prioritySel?.value) return;
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
    assigneeName: $("#assigneeText")?.value || "",
    assigneeCode: $("#assigneeCode")?.value || "",
    parIssueText: parIssueText?.value || "",
    parIssueCode: parIssueCode?.value || "",
    parIssueNameEnabled: parIssueCode?.getAttribute("name") === "parIssueCode",
    typeText: $("#typeText")?.value || "",
    typeCode: (() => {
      const list = document.querySelectorAll('input[name="typeCode"]');
      const el = list.length ? list[list.length - 1] : $("#typeCode");
      return el?.value || "";
    })(),
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
  // 상태 UI 제어 (완료일: OB5에서만 입력 가능)
  // -------------------------
  const toggleResolvedByStatus = () => {
    if (!resolvedView) return;
    const isDone = statusSel?.value === "OB5";
    resolvedView.disabled = !isDone;

    if (!isDone) resolvedView.value = "";
    if (!isDone && resolvedAt) resolvedAt.value = "";
  };

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
  // 유형 모달 (등록 화면과 동일: 트리 렌더)
  // -------------------------
  const typeModalEl = $("#typeSelectModal");
  const typeModal = typeModalEl ? new bootstrap.Modal(typeModalEl) : null;

  const typeText = $("#typeText");
  const typeTree = $("#typeModalTree");
  const typeSearchEl = $("#typeModalSearch");
  const btnOpenTypeModal = $("#btnOpenTypeModal");
  const btnClearType = $("#btnClearType"); // HTML에 없으면 null이어도 OK

  const getTypeCodeInput = () => {
    const list = document.querySelectorAll('input[name="typeCode"]');
    if (list.length === 0) return $("#typeCode");
    return list[list.length - 1];
  };
  const typeCode = getTypeCodeInput();

  let typeTreeCache = [];
  let typeCacheProjectCode = "";

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
        out.push({ ...n, children: filteredKids });
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

        const endDate = normalizeDateOnly(n.endAt ?? n.end_at);
        applyTypeEndDateLimit(endDate);

        if (prioritySel?.value && !dueView?.value) setDueByPriority();
        syncHiddenDates();

        if (typeSearchEl) typeSearchEl.value = "";
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

  const getProjectCodeSafe = () => {
    const v1 = String(projectCodeEl?.value || "").trim();
    if (v1) return v1;

    const byName = document.querySelector('input[name="projectCode"]');
    const v2 = String(byName?.value || "").trim();
    if (v2) return v2;

    const v3 = String(form?.dataset?.projectCode || "").trim();
    if (v3) return v3;

    return "";
  };

  const ensureTypes = async () => {
    const projCode = getProjectCodeSafe();
    if (!projCode) {
      showToast("프로젝트 코드가 없어 유형을 불러올 수 없습니다.");
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

  const refreshTypeTree = async () => {
    if (!typeTree) return;

    const ok = await ensureTypes();
    if (!ok) return;

    const q = (typeSearchEl?.value || "").trim().toLowerCase();
    const filtered = filterTypeTree(typeTreeCache, q);
    renderTypeTree(filtered);
  };

  const openTypeModal = async () => {
    if (!typeModal) return;
    if (typeSearchEl) typeSearchEl.value = "";
    await refreshTypeTree();
    typeModal.show();
  };

  const clearType = () => {
    if (typeText) typeText.value = "";
    if (typeCode) typeCode.value = "";
    applyTypeEndDateLimit("");
    syncHiddenDates();
  };

  const findTypeNodeByCode = (nodes, codeStr) => {
    const stack = Array.isArray(nodes) ? [...nodes] : [];
    while (stack.length) {
      const n = stack.shift();
      if (!n) continue;

      const code = String(getNodeCode(n) ?? "");
      if (code && code === codeStr) return n;

      const kids = Array.isArray(n.children) ? n.children : [];
      if (kids.length) stack.unshift(...kids);
    }
    return null;
  };

  const applyTypeEndFromCurrentTypeCode = async () => {
    const cur = String(typeCode?.value || "").trim();
    if (!cur) {
      applyTypeEndDateLimit("");
      return;
    }

    const ok = await ensureTypes();
    if (!ok) return;

    const node = findTypeNodeByCode(typeTreeCache, cur);
    const endDate = normalizeDateOnly(node?.endAt ?? node?.end_at);
    applyTypeEndDateLimit(endDate);

    syncHiddenDates();
  };

  const hydrateTypeTextIfEmpty = async () => {
    const cur = String(typeCode?.value || "").trim();
    if (!cur) return;
    if (!typeText) return;
    if (typeText.value) return;

    const ok = await ensureTypes();
    if (!ok) return;

    const node = findTypeNodeByCode(typeTreeCache, cur);
    if (node) typeText.value = getNodeName(node);
  };

  // -------------------------
  // 담당자 모달
  // -------------------------
  const assigneeModalEl = $("#assigneeSelectModal");
  const assigneeModal = assigneeModalEl
    ? new bootstrap.Modal(assigneeModalEl)
    : null;

  const assigneeText = $("#assigneeText");
  const assigneeCode = $("#assigneeCode");
  const btnOpenAssigneeModal = $("#btnOpenAssigneeModal");
  const assigneeListEl = $("#assigneeModalList");
  const assigneeSearchEl = $("#assigneeModalSearch");

  let userCache = [];
  let userCacheProjectCode = "";

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
  const parentIssueCacheByProject = new Map();

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

    if (
      selectedTypeEndDate &&
      dueView?.value &&
      dueView.value > selectedTypeEndDate
    ) {
      showToast("마감기한은 유형 종료일 이후로 설정할 수 없습니다.");
      dueView?.focus();
      return false;
    }

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
    setProgressByStatus();
  });

  progressInp?.addEventListener("input", () => {
    if (blockProgressIfOverdue(true)) return;
    clampProgress();
    syncHiddenDates();
  });

  progressInp?.addEventListener("focus", () => {
    blockProgressIfOverdue(true);
  });

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
  typeSearchEl?.addEventListener("input", refreshTypeTree);

  btnBack?.addEventListener("click", () => history.back());

  btnReset?.addEventListener("click", async () => {
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
    typeTreeCache = [];
    typeCacheProjectCode = "";

    if (parIssueCode) {
      if (initial.parIssueNameEnabled && initial.parIssueCode)
        parIssueCode.setAttribute("name", "parIssueCode");
      else parIssueCode.removeAttribute("name");
    }

    await hydrateTypeTextIfEmpty();
    await applyTypeEndFromCurrentTypeCode();

    onStatusChange();
    syncHiddenDates();
  });

  form?.addEventListener("submit", (e) => {
    if (!validateBeforeSubmit()) e.preventDefault();
  });

  // -------------------------
  // init
  // -------------------------
  const init = async () => {
    setProgressByStatus();
    toggleResolvedByStatus();

    if (parIssueCode) {
      const hasValue = String(parIssueCode.value || "").trim().length > 0;
      if (!hasValue) parIssueCode.removeAttribute("name");
    }

    await hydrateTypeTextIfEmpty();
    await applyTypeEndFromCurrentTypeCode();

    syncHiddenDates();
  };

  init();
})();
