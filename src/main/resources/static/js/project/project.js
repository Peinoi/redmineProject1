(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const pageSize = 10;

  const rowsAll = () => $$("#projectTbody tr.projectRow");
  const rowsVisible = () => rowsAll().filter((tr) => tr.dataset.filtered !== "1");

  const ui = {
    title: $("#filterTitle"),
    priority: $("#filterPriority"),
    assigneeText: $("#filterAssigneeText"),
    assigneeValue: $("#filterAssigneeValue"),

    btnApply: $("#btnApplyFilters"),
    btnReset: $("#btnResetFilters"),
    btnAssigneeModal: $("#btnOpenAssigneeModal"),

    creatorModalEl: $("#creatorSelectModal"),
    creatorModalList: $("#creatorModalList"),
    creatorModalSearch: $("#creatorModalSearch"),

    pagination: $("#projectPagination"),
    pageInfo: $("#projectPageInfo"),
  };

  const STATUS_LABEL = {
    OD1: "진행",
    OD2: "중지",
    OD3: "종료",
  };

  let currentPage = 1;

  const creatorModal = new bootstrap.Modal(ui.creatorModalEl);

  // 유저 모달(관리자) 캐시
  let userCache = [];

  function rowData(tr) {
    const cells = tr.querySelectorAll("td");
    return {
      number: cells[0]?.textContent.trim() || "",
      projectName: cells[1]?.textContent.trim() || "",
      createdOn: cells[2]?.textContent.trim() || "",
      managerName: cells[3]?.textContent.trim() || "",
      managerPhone: cells[4]?.textContent.trim() || "",
      managerEmail: cells[5]?.textContent.trim() || "",
      status: cells[6]?.textContent.trim() || "",
    };
  }

  // 유저 캐시 로드
  async function ensureUserCache() {
    if (userCache.length > 0) return true;

    const res = await fetch("/api/users/modal", {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      alert("사용자 목록을 불러오지 못했습니다.");
      return false;
    }

    const users = await res.json();
    userCache = users.map((u) => ({
      code: String(u.userCode),
      name: u.userName,
    }));
    return true;
  }

  // 유저 모달 렌더
  function renderUserModalList(listEl, items, onPick) {
    listEl.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "text-muted";
      empty.textContent = "결과가 없습니다.";
      listEl.appendChild(empty);
      return;
    }

    items.forEach((u) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "list-group-item list-group-item-action";
      btn.textContent = u.name;
      btn.addEventListener("click", () => onPick(u));
      listEl.appendChild(btn);
    });
  }

  async function openAssigneeModal() {
    ui.creatorModalSearch.value = "";

    const ok = await ensureUserCache();
    if (!ok) return;

    renderUserModalList(ui.creatorModalList, userCache, (picked) => {
      ui.assigneeText.value = picked.name;
      ui.assigneeValue.value = picked.code;
      creatorModal.hide();
    });

    creatorModal.show();
  }

  // 관리자 모달 검색
  function bindUserModalSearch() {
    ui.creatorModalSearch.addEventListener("input", async () => {
      const ok = await ensureUserCache();
      if (!ok) return;

      const q = ui.creatorModalSearch.value.trim().toLowerCase();
      const filtered = userCache.filter((u) =>
        String(u.name).toLowerCase().includes(q)
      );

      renderUserModalList(ui.creatorModalList, filtered, (picked) => {
        ui.assigneeText.value = picked.name;
        ui.assigneeValue.value = picked.code;
        creatorModal.hide();
      });
    });
  }

  function applyFilters() {
    const t = ui.title.value.trim().toLowerCase();
    const prCode = ui.priority.value.trim();
    const prLabel = prCode ? STATUS_LABEL[prCode] : "";
    const managerName = ui.assigneeText.value.trim();

    rowsAll().forEach((tr) => {
      const d = rowData(tr);
      let ok = true;

      if (t && !d.projectName.toLowerCase().includes(t)) ok = false;
      if (prLabel && d.status !== prLabel) ok = false;
      if (managerName && d.managerName !== managerName) ok = false;

      tr.dataset.filtered = ok ? "0" : "1";
    });

    currentPage = 1;
    renderPage();
  }

  function resetFilters() {
    ui.title.value = "";
    ui.priority.value = "";
    ui.assigneeText.value = "";
    ui.assigneeValue.value = "";

    rowsAll().forEach((tr) => (tr.dataset.filtered = "0"));
    currentPage = 1;
    renderPage();
  }

  function renderPagination(totalPages) {
    ui.pagination.innerHTML = "";
    if (totalPages <= 1) return;

    const makeItem = (label, page, disabled, active) => {
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
        currentPage = page;
        renderPage();
      });

      li.appendChild(btn);
      return li;
    };

    ui.pagination.appendChild(
      makeItem("이전", Math.max(1, currentPage - 1), currentPage === 1, false)
    );

    for (let p = 1; p <= totalPages; p++) {
      ui.pagination.appendChild(makeItem(String(p), p, false, p === currentPage));
    }

    ui.pagination.appendChild(
      makeItem("다음", Math.min(totalPages, currentPage + 1), currentPage === totalPages, false)
    );
  }

  function renderPage() {
    const visible = rowsVisible();
    const total = visible.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    rowsAll().forEach((tr) => {
      tr.style.display = "none";
    });

    visible.slice(start, end).forEach((tr) => {
      tr.style.display = "";
    });

    renderPagination(totalPages);

    if (ui.pageInfo) {
      const from = total === 0 ? 0 : start + 1;
      const to = Math.min(end, total);
      ui.pageInfo.textContent = `${from}-${to} / ${total}`;
    }
  }

  // 이벤트 바인딩
  ui.btnApply.addEventListener("click", applyFilters);
  ui.btnReset.addEventListener("click", resetFilters);
  ui.btnAssigneeModal.addEventListener("click", openAssigneeModal);

  bindUserModalSearch();

  // 엔터키로 검색
  ["#filterTitle", "#filterAssigneeText"].forEach((sel) => {
    const el = $(sel);
    if (!el) return;
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyFilters();
      }
    });
  });

  // 삭제 버튼 이벤트
  $("#projectTbody").addEventListener("click", (e) => {
    if (e.target && e.target.classList.contains("btn-danger")) {
      const row = e.target.closest("tr");
      const projectName = rowData(row).projectName;

      if (!confirm(`"${projectName}" 프로젝트를 삭제하시겠습니까?`)) return;

      // 여기에 삭제 로직 추가
      // 예: fetch로 서버에 삭제 요청 후 성공시 row.remove()
      console.log("삭제 요청:", projectName);
      // row.remove();
      // renderPage();
    }
  });

  // 초기 화면
  rowsAll().forEach((tr) => (tr.dataset.filtered = "0"));
  renderPage();
})();