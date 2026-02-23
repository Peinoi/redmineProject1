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

    // modals (project/type/worker)
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
  };

  if (!ui.tbody) return;

  // =========================
  // submit(이동) 막기
  // =========================
  ui.form?.addEventListener("submit", (e) => e.preventDefault());
  ui.btnApply?.addEventListener("click", (e) => e.preventDefault());

  // Enter로 submit 되는 것도 막기
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

  // =========================
  // row helpers
  // =========================
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
      projectCode: (d.projectCode || "").trim(),
      typeCode: (d.typeCode || "").trim(),
      workerCode: (d.workerCode || "").trim(),
      // 화면 텍스트가 아니라 dataset이 없으니 title은 td 텍스트로 뽑아도 되지만,
      // 이미 서버에서 th:text로 들어가 있으니 셀에서 가져오자.
      issueTitle: (tr.children?.[3]?.textContent || "").trim().toLowerCase(),
      workDate: (tr.children?.[5]?.textContent || "").trim(), // yyyy-MM-dd
      spentMinutes: Number((tr.children?.[6]?.textContent || "0").trim() || 0),
    };
  };

  // =========================
  // pagination
  // =========================
  const closeMenusHard = () => {
    // worklog 화면에 dropdown이 없으면 그냥 비워둬도 됨 (issue-list 패턴 유지용)
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

  // =========================
  // split time (hour/min) -> hidden workTime, 그리고 minutes filter 계산
  // =========================
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

    const hours = String(Number(h || "0")); // 0~999 그대로
    const mins = String(Number(m || "0")).padStart(2, "0"); // 분만 2자리
    ui.workTimeHidden.value = `${hours}:${mins}`;
  };

  // hidden 값이 서버에서 내려오면(예: 125:30) -> split input에 세팅
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

  // =========================
  // apply filters (client)
  // =========================
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
      if (title) ok = ok && d.issueTitle.includes(title);
      if (workDate) ok = ok && sameDay(d.workDate, workDate);

      // 소요시간(시/분) 필터는 "해당 시간 이상"으로 처리 (원하면 ==로 바꿔줄게)
      if (minSpent != null) ok = ok && Number(d.spentMinutes || 0) >= minSpent;

      tr.dataset.filtered = ok ? "0" : "1";
    });

    page = 1;
    render();
    closeMenusHard();
  };

  // =========================
  // reset
  // =========================
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

  // =========================
  // init
  // =========================
  rows().forEach((tr) => (tr.dataset.filtered = "0"));
  render();
})();
