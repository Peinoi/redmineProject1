// /js/issue/issue-insert.js
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
  const assigneeText = $("#assigneeText");
  const assigneeCode = $("#assigneeCode");

  const fileInp = $("#uploadFile");
  const label = $("#selectedFileName");

  const projectModalEl = $("#projectSelectModal");
  const assigneeModalEl = $("#assigneeSelectModal");
  const projectModal = projectModalEl
    ? new bootstrap.Modal(projectModalEl)
    : null;
  const assigneeModal = assigneeModalEl
    ? new bootstrap.Modal(assigneeModalEl)
    : null;

  const projectList = $("#projectModalList");
  const assigneeList = $("#assigneeModalList");
  const projectSearch = $("#projectModalSearch");
  const assigneeSearch = $("#assigneeModalSearch");

  const btnProject = $("#btnOpenProjectModal");
  const btnAssignee = $("#btnOpenAssigneeModal");
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

  // 우선순위별 자동 마감일(라벨/코드 모두 지원)
  const PRIORITY_DAYS = {
    긴급: 2,
    높음: 7,
    보통: 14,
    낮음: 21,
    OA1: 2,
    OA2: 7,
    OA3: 14,
    OA4: 21,
  };
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

  // -------- 파일명 표시 --------
  const renderSelectedFileName = () => {
    if (!label) return;
    const f = fileInp?.files?.[0];
    label.textContent = f ? `선택된 파일: ${f.name}` : "선택된 파일 없음";
  };

  // ---- modal common ----
  const renderList = (listEl, items, onPick) => {
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

  const filterBy = (items, q) => {
    const qq = (q || "").trim().toLowerCase();
    if (!qq) return items;
    return items.filter((it) => String(it.label).toLowerCase().includes(qq));
  };

  const fetchJson = async (url, failMsg) => {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      alert(failMsg);
      return null;
    }
    return res.json();
  };

  let projectCache = [];
  let userCache = [];

  const ensureProjects = async () => {
    if (projectCache.length) return true;
    const data = await fetchJson(
      "/api/projects/modal",
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
    if (userCache.length) return true;
    const data = await fetchJson(
      "/api/users/modal",
      "사용자 목록을 불러오지 못했습니다.",
    );
    if (!data) return false;
    userCache = data.map((u) => ({
      value: String(u.userCode),
      label: u.userName,
    }));
    return true;
  };

  const openProjectModal = async () => {
    if (!projectModal || !projectList) return;
    if (!(await ensureProjects())) return;

    renderList(
      projectList,
      filterBy(projectCache, projectSearch?.value),
      (picked) => {
        projectText.value = picked.label;
        projectCode.value = picked.value;
        if (projectSearch) projectSearch.value = "";
        projectModal.hide();
      },
    );

    projectModal.show();
  };

  const openAssigneeModal = async () => {
    if (!assigneeModal || !assigneeList) return;
    if (!(await ensureUsers())) return;

    renderList(
      assigneeList,
      filterBy(userCache, assigneeSearch?.value),
      (picked) => {
        assigneeText.value = picked.label;
        assigneeCode.value = picked.value;
        if (assigneeSearch) assigneeSearch.value = "";
        assigneeModal.hide();
      },
    );

    assigneeModal.show();
  };

  const refreshProjectList = async () => {
    if (!projectList) return;
    if (!(await ensureProjects())) return;

    renderList(
      projectList,
      filterBy(projectCache, projectSearch?.value),
      (picked) => {
        projectText.value = picked.label;
        projectCode.value = picked.value;
        if (projectSearch) projectSearch.value = "";
        projectModal?.hide();
      },
    );
  };

  const refreshAssigneeList = async () => {
    if (!assigneeList) return;
    if (!(await ensureUsers())) return;

    renderList(
      assigneeList,
      filterBy(userCache, assigneeSearch?.value),
      (picked) => {
        assigneeText.value = picked.label;
        assigneeCode.value = picked.value;
        if (assigneeSearch) assigneeSearch.value = "";
        assigneeModal?.hide();
      },
    );
  };

  // ---- bind ----
  btnProject?.addEventListener("click", () => {
    if (projectSearch) projectSearch.value = "";
    openProjectModal();
  });

  btnAssignee?.addEventListener("click", () => {
    if (assigneeSearch) assigneeSearch.value = "";
    openAssigneeModal();
  });

  projectSearch?.addEventListener("input", refreshProjectList);
  assigneeSearch?.addEventListener("input", refreshAssigneeList);

  priority?.addEventListener("change", setDueByPriority);
  dueView?.addEventListener("change", syncDueHidden);

  // 파일 선택 시 파일명 표시
  fileInp?.addEventListener("change", renderSelectedFileName);

  btnBack?.addEventListener("click", () => history.back());

  btnReset?.addEventListener("click", () => {
    form?.reset();
    projectText.value = "";
    projectCode.value = "";
    assigneeText.value = "";
    assigneeCode.value = "";
    setCreatedToday();
    setDueByPriority();
    renderSelectedFileName(); // 파일명 표시도 초기화
  });

  form?.addEventListener("submit", (e) => {
    if (createdAt && !createdAt.value) setCreatedToday();

    if (dueView && dueAt) {
      if (dueView.value) syncDueHidden();
      else setDueByPriority();
    }

    if (!projectCode.value)
      return (e.preventDefault(), alert("프로젝트를 선택해 주세요."));
    if (!$("#title")?.value.trim())
      return (e.preventDefault(), alert("제목을 입력해 주세요."));
    if (!$("#statusCode")?.value)
      return (e.preventDefault(), alert("상태를 선택해 주세요."));
    if (!priority?.value)
      return (e.preventDefault(), alert("우선순위를 선택해 주세요."));
  });

  // init
  setCreatedToday();
  renderSelectedFileName();
})();
