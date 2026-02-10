document.addEventListener("DOMContentLoaded", () => {
  const issueCode = new URLSearchParams(location.search).get("issueCode");

  const btnBack = document.getElementById("btnBack");
  const btnEdit = document.getElementById("btnEdit");
  const btnDelete = document.getElementById("btnDelete");

  const btnApprove = document.getElementById("btnApprove");
  const btnReject = document.getElementById("btnReject");
  const btnRejectSubmit = document.getElementById("btnRejectSubmit");
  const btnRejectHistory = document.getElementById("btnRejectHistory");

  const canModify = (btnEdit?.dataset?.canModify || "false") === "true";
  const canDelete = (btnDelete?.dataset?.canDelete || "false") === "true";

  btnBack?.addEventListener("click", () => {
    location.href = `/issueList`;
  });

  btnEdit?.addEventListener("click", () => {
    if (!issueCode) {
      showToast("issueCode가 없습니다.");
      return;
    }
    if (!canModify) {
      showToast("권한이 없습니다.");
      return;
    }
    location.href = `/issueEdit?issueCode=${issueCode}`;
  });

  btnDelete?.addEventListener("click", () => {
    if (!issueCode) {
      showToast("issueCode가 없습니다.");
      return;
    }
    if (!canDelete) {
      showToast("권한이 없습니다.");
      return;
    }
    if (!confirm("정말 삭제할까요?")) return;

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
  });

  // 승인
  btnApprove?.addEventListener("click", async () => {
    if (!issueCode) {
      showToast("issueCode가 없습니다.");
      return;
    }

    if (!confirm("승인 처리할까요? (상태: 완료, 진척도: 100)")) return;

    const res = await fetch(`/api/issues/${issueCode}/approve`, {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    })
      .then((r) => r.json())
      .catch(() => null);

    if (!res) {
      showToast("요청에 실패했습니다.");
      return;
    }
    if (!res.success) {
      showToast(res.message || "승인 실패");
      return;
    }

    showToast("승인 처리되었습니다.");
    setTimeout(() => location.reload(), 500);
  });

  // 반려 모달 열기
  btnReject?.addEventListener("click", () => {
    const modalEl = document.getElementById("rejectModal");
    if (!modalEl) {
      showToast("반려 모달이 없습니다.");
      return;
    }
    const ta = document.getElementById("rejectReason");
    if (ta) ta.value = "";

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  });

  // 반려 저장
  btnRejectSubmit?.addEventListener("click", async () => {
    if (!issueCode) {
      showToast("issueCode가 없습니다.");
      return;
    }

    const ta = document.getElementById("rejectReason");
    const reason = (ta?.value || "").trim();
    if (!reason) {
      showToast("반려 사유를 입력해 주세요.");
      return;
    }

    const body = new URLSearchParams();
    body.set("reason", reason);

    const res = await fetch(`/api/issues/${issueCode}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
      },
      body,
    })
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

    const modalEl = document.getElementById("rejectModal");
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();

    showToast("반려 처리되었습니다.");
    setTimeout(() => location.reload(), 500);
  });

  // 반려이력 모달
  btnRejectHistory?.addEventListener("click", async () => {
    if (!issueCode) {
      showToast("issueCode가 없습니다.");
      return;
    }

    const modalEl = document.getElementById("rejectHistoryModal");
    if (!modalEl) {
      showToast("반려이력 모달이 없습니다.");
      return;
    }

    const data = await fetch(`/api/issues/${issueCode}/reject-history`, {
      method: "GET",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    })
      .then((r) => r.json())
      .catch(() => null);

    if (!data) {
      showToast("요청에 실패했습니다.");
      return;
    }
    if (!data.success) {
      showToast(data.message || "조회 실패");
      return;
    }

    // 컨트롤러에서 res.put("data", list) 형태를 추천
    const list = Array.isArray(data.data) ? data.data : [];
    renderRejectHistory(list);

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  });

  renderHistory();
});

/* ====== 토스트(공통) ====== */
function showToast(message) {
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
}

/* ====== 반려이력 렌더링 ====== */
function renderRejectHistory(list) {
  const tbody = document.getElementById("rejectHistoryTbody");
  const reasonBox = document.getElementById("rejectHistoryReason");
  if (!tbody) return;

  tbody.innerHTML = "";
  if (reasonBox) reasonBox.textContent = "행을 선택하면 사유가 표시됩니다.";

  if (!Array.isArray(list) || list.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="3" class="text-muted">이력이 없습니다.</td>`;
    tbody.appendChild(tr);
    return;
  }

  list.forEach((row) => {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";

    const rejectedAt = formatDateTime(row.rejectedAt);
    const rejectedByName = row.rejectedByName || (row.rejectedBy ?? "");
    const reason = row.rejectReason || "";

    tr.innerHTML = `
      <td>${escapeHtml(rejectedAt)}</td>
      <td>${escapeHtml(String(rejectedByName))}</td>
    `;

    tr.addEventListener("click", () => {
      if (reasonBox) reasonBox.textContent = reason || "(사유 없음)";
      tbody
        .querySelectorAll("tr")
        .forEach((x) => x.classList.remove("table-active"));
      tr.classList.add("table-active");
    });

    tbody.appendChild(tr);
  });
}

function formatDateTime(v) {
  if (!v) return "";
  // 서버가 ISO(LocalDateTime)로 내려주면 대개 "2026-02-10T12:34:56" 또는 유사
  const s = String(v);
  if (s.includes("T")) {
    const [d, t] = s.split("T");
    const hhmm = (t || "").slice(0, 5);
    return hhmm ? `${d} ${hhmm}` : d;
  }
  return s;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ====== 아래는 네 기존 renderHistory 그대로 ====== */
function renderHistory() {
  const actionLabelMap = {
    CREATE: "생성",
    UPDATE: "수정",
    DELETE: "삭제",
  };

  const fieldLabelMap = {
    title: "제목",
    description: "설명",
    priority: "우선순위",
    status: "상태",
    assignee: "담당자",
    type: "유형",
    parentIssue: "상위일감",
    dueAt: "마감기한",
    startedAt: "시작일",
    resolvedAt: "완료일",
    progress: "진척도",
    rejectReason: "반려사유",
  };

  const dateFields = new Set(["dueAt", "startedAt", "resolvedAt"]);

  document.querySelectorAll(".history-item").forEach((item) => {
    const time = item.dataset.time || "";
    const action = item.dataset.action || "";
    const user = item.dataset.user || "";
    const metaStr = item.dataset.meta;

    const head = item.querySelector(".head-line");
    if (head) {
      const actionKor = actionLabelMap[action] || action || "";
      head.textContent = `${time} / ${actionKor} / ${user}`.trim();
    }

    const box = item.querySelector(".change-lines");
    if (!box) return;

    if (action === "CREATE") {
      box.textContent = "일감이 생성되었습니다.";
      return;
    }

    if (!metaStr || metaStr === "null") {
      box.textContent = "";
      return;
    }

    try {
      const obj = JSON.parse(metaStr);
      const changes = Array.isArray(obj.changes) ? obj.changes : [];

      if (changes.length === 0) {
        box.textContent = "";
        return;
      }

      const ul = document.createElement("ul");
      ul.className = "change-list";

      changes.forEach((c) => {
        const fieldKey = c.field ?? "";
        const label = fieldLabelMap[fieldKey] ?? fieldKey;

        let before = normalizeValue(c.before);
        let after = normalizeValue(c.after);

        if (dateFields.has(fieldKey)) {
          before = formatLocalDateTime(before);
          after = formatLocalDateTime(after);
        }

        if (fieldKey === "description") {
          before = truncateText(stripHtml(before), 80);
          after = truncateText(stripHtml(after), 80);
        }

        if (before === after) return;

        const li = document.createElement("li");
        li.textContent = `${label} : ${before} >> ${after}`;
        ul.appendChild(li);
      });

      if (ul.childElementCount === 0) {
        box.textContent = "";
        return;
      }

      box.innerHTML = "";
      box.appendChild(ul);
    } catch (e) {
      box.textContent = metaStr;
    }
  });
}

function normalizeValue(v) {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  if (s === "" || s === "-") return "";
  return s;
}

function formatLocalDateTime(s) {
  if (!s) return "";
  if (!s.includes("T")) return s;

  const [d, t] = s.split("T");
  if (!t) return d;

  const hhmm = t.slice(0, 5);
  return hhmm ? `${d} ${hhmm}` : d;
}

function stripHtml(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
}

function truncateText(s, maxLen) {
  if (!s) return "";
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen) + "...";
}
