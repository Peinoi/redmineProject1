// /static/js/issue/issue-info.js
document.addEventListener("DOMContentLoaded", () => {
  const issueCode = new URLSearchParams(location.search).get("issueCode");

  const btnBack = document.getElementById("btnBack");
  const btnEdit = document.getElementById("btnEdit");
  const btnDelete = document.getElementById("btnDelete");

  const btnApprove = document.getElementById("btnApprove");
  const btnReject = document.getElementById("btnReject");
  const btnRejectSubmit = document.getElementById("btnRejectSubmit");
  const btnRejectHistory = document.getElementById("btnRejectHistory");

  const btnWorklog = document.getElementById("btnWorklog");

  const canModify = (btnEdit?.dataset?.canModify || "false") === "true";
  const canDelete = (btnDelete?.dataset?.canDelete || "false") === "true";
  const canWorklog = (btnWorklog?.dataset?.canWorklog || "false") === "true";

  const ANCHOR_KEY = "issue_back_anchor";

  // referrer가 돌아갈만한 화면이면 저장
  (function saveBackAnchor() {
    const ref = document.referrer || "";
    if (!ref) return;

    // edit/insert 같이 중간 경유 화면은 저장 X
    const isEditLike =
      ref.includes("/issueEdit") || ref.includes("/issueInsert");
    if (isEditLike) return;

    // 돌아가야 하는 후보(목록/칸반/간트/작업이력/공지 )
    const isBackCandidate =
      ref.includes("/issueList") ||
      ref.includes("/kanbanboard") ||
      ref.includes("/ganttChart") ||
      ref.includes("/logs");

    if (!isBackCandidate) return;

    sessionStorage.setItem(ANCHOR_KEY, ref);
  })();

  const withTs = (urlStr) => {
    try {
      const url = new URL(urlStr, location.origin);
      url.searchParams.set("_ts", String(Date.now()));
      return url.toString();
    } catch {
      const sep = urlStr.includes("?") ? "&" : "?";
      return `${urlStr}${sep}_ts=${Date.now()}`;
    }
  };

  btnBack?.addEventListener("click", () => {
    const ref = document.referrer || "";
    const anchor = sessionStorage.getItem(ANCHOR_KEY) || "";

    // 직전이 수정페이지면 저장된 전전페이지로
    if (ref.includes("/issueEdit")) {
      if (anchor) return location.replace(withTs(anchor));
      return location.replace(withTs("/issueList"));
    }

    // 직전이 목록/칸반/간트/작업이력 페이지면 그대로
    if (ref.includes("/issueList")) return location.replace(withTs(ref));
    if (ref.includes("/kanbanboard")) return location.replace(withTs(ref));
    if (ref.includes("/ganttChart")) return location.replace(withTs(ref));
    if (ref.includes("/logs")) return location.replace(withTs(ref));
    if (ref.includes("/my")) return location.replace(withTs(ref));
    if (ref.includes("/calendar")) return location.replace(withTs(ref));

    // ref가 비어있거나 이상하면 anchor 우선
    if (anchor) return location.replace(withTs(anchor));

    // 최종 fallback
    location.replace(withTs("/issueList"));
  });

  // 소요시간 등록
  btnWorklog?.addEventListener("click", () => {
    if (!issueCode) return showToast("issueCode가 없습니다.");
    if (!canWorklog) return showToast("권한이 없습니다.");
    location.href = `/worklogInsert?issueCode=${issueCode}`;
  });

  // 수정
  btnEdit?.addEventListener("click", () => {
    if (!issueCode) return showToast("issueCode가 없습니다.");
    if (!canModify) return showToast("권한이 없습니다.");
    location.href = `/issueEdit?issueCode=${issueCode}`;
  });

  // 삭제
  btnDelete?.addEventListener("click", () => {
    if (!issueCode) return showToast("issueCode가 없습니다.");
    if (!canDelete) return showToast("권한이 없습니다.");
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
    if (!issueCode) return showToast("issueCode가 없습니다.");
    if (!confirm("승인 처리할까요? (상태: 완료, 진척도: 100)")) return;

    const res = await fetch(`/api/issues/${issueCode}/approve`, {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    })
      .then((r) => r.json())
      .catch(() => null);

    if (!res) return showToast("요청에 실패했습니다.");
    if (!res.success) return showToast(res.message || "승인 실패");

    showToast("승인 처리되었습니다.");
    setTimeout(() => location.reload(), 500);
  });

  // 반려 모달 열기
  btnReject?.addEventListener("click", () => {
    const modalEl = document.getElementById("rejectModal");
    if (!modalEl) return showToast("반려 모달이 없습니다.");

    const ta = document.getElementById("rejectReason");
    if (ta) ta.value = "";

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  });

  // 반려 저장
  btnRejectSubmit?.addEventListener("click", async () => {
    if (!issueCode) return showToast("issueCode가 없습니다.");

    const ta = document.getElementById("rejectReason");
    const reason = (ta?.value || "").trim();
    if (!reason) return showToast("반려 사유를 입력해 주세요.");

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

    if (!res) return showToast("요청에 실패했습니다.");
    if (!res.success) return showToast(res.message || "반려 실패");

    const modalEl = document.getElementById("rejectModal");
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();

    showToast("반려 처리되었습니다.");
    setTimeout(() => location.reload(), 500);
  });

  // 반려이력 모달
  btnRejectHistory?.addEventListener("click", async () => {
    if (!issueCode) return showToast("issueCode가 없습니다.");

    const modalEl = document.getElementById("rejectHistoryModal");
    if (!modalEl) return showToast("반려이력 모달이 없습니다.");

    const data = await fetch(`/api/issues/${issueCode}/reject-history`, {
      method: "GET",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    })
      .then((r) => r.json())
      .catch(() => null);

    if (!data) return showToast("요청에 실패했습니다.");
    if (!data.success) return showToast(data.message || "조회 실패");

    const list = Array.isArray(data.data) ? data.data : [];
    renderRejectHistory(list);

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  });

  renderHistory();
  loadWorklogs(issueCode);
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

/* ====== 이력 렌더링 ====== */
function renderHistory() {
  const actionLabelMap = {
    CREATE: "생성",
    UPDATE: "수정",
    REJECT: "반려",
    APPROVE: "승인",
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

  document.querySelectorAll(".history-list").forEach((listEl) => {
    const items = Array.from(listEl.querySelectorAll(".history-item"));
    if (items.length === 0) return;

    let lastDate = "";
    const frag = document.createDocumentFragment();

    items.forEach((item) => {
      const timeStr = (item.dataset.time || "").trim();
      const action = (item.dataset.action || "").trim();
      const user = (item.dataset.user || "").trim();
      const metaStr = item.dataset.meta;

      const { datePart, timePart } = splitDateTime(timeStr);

      if (datePart && datePart !== lastDate) {
        lastDate = datePart;
        const dateHeader = document.createElement("div");
        dateHeader.className = "history-date";
        dateHeader.textContent = datePart;
        frag.appendChild(dateHeader);
      }

      const head = item.querySelector(".head-line");
      if (head) {
        const actionKor = actionLabelMap[action] || action || "";
        const timeOnly = timePart || timeStr || "";
        head.textContent = `${timeOnly} / ${actionKor} / ${user}`.trim();
      }

      const box = item.querySelector(".change-lines");
      if (box) {
        if (action === "CREATE") {
          box.textContent = "일감이 생성되었습니다.";
        } else if (!metaStr || metaStr === "null") {
          box.textContent = "";
        } else {
          try {
            const obj = JSON.parse(metaStr);
            const changes = Array.isArray(obj.changes) ? obj.changes : [];

            if (changes.length === 0) {
              box.textContent = "";
            } else {
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
              } else {
                box.innerHTML = "";
                box.appendChild(ul);
              }
            }
          } catch {
            box.textContent = metaStr;
          }
        }
      }

      frag.appendChild(item);
    });

    listEl.innerHTML = "";
    listEl.appendChild(frag);
  });
}

function splitDateTime(s) {
  if (!s) return { datePart: "", timePart: "" };
  const parts = s.split(" ");
  const datePart = parts[0] || "";
  const timePart = parts[1] || "";
  return { datePart, timePart };
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

/* ====== 소요시간(worklog) 로드/렌더 ====== */
async function loadWorklogs(issueCode) {
  if (!issueCode) return;

  const box = document.getElementById("worklogBox");
  const totalEl = document.getElementById("worklogTotalText");
  if (!box) return;

  const data = await fetch(`/api/issues/${issueCode}/worklogs`, {
    method: "GET",
    headers: { "X-Requested-With": "XMLHttpRequest" },
  })
    .then((r) => r.json())
    .catch(() => null);

  if (!data || !data.success) {
    box.innerHTML = `<div class="empty text-muted">소요시간 조회에 실패했습니다.</div>`;
    return;
  }

  const list = Array.isArray(data.data) ? data.data : [];
  renderWorklogs(list);

  const total = list.reduce((sum, x) => sum + Number(x.spentMinutes || 0), 0);
  if (totalEl)
    totalEl.textContent = total > 0 ? `총 ${formatMinutes(total)}` : "";
}

function renderWorklogs(list) {
  const box = document.getElementById("worklogBox");
  if (!box) return;

  if (!Array.isArray(list) || list.length === 0) {
    box.innerHTML = `<div class="empty text-muted">소요시간 이력이 없습니다.</div>`;
    return;
  }

  box.innerHTML = "";
  list.forEach((row) => {
    const el = document.createElement("div");
    el.className = "worklog-item";

    const workDate = row.workDate ? String(row.workDate).slice(0, 10) : "-";
    const workerName = row.workerName || String(row.workerCode || "");
    const mins = Number(row.spentMinutes || 0);
    const desc = row.description || "";

    el.innerHTML = `
      <div class="worklog-head">
        <div>${escapeHtml(workDate)} / ${escapeHtml(workerName)}</div>
        <div class="worklog-min">${escapeHtml(formatMinutes(mins))}</div>
      </div>
      <div class="worklog-sub">${escapeHtml(desc || "(설명 없음)")}</div>
    `;

    box.appendChild(el);
  });
}

function formatMinutes(mins) {
  const m = Math.max(0, Number(mins || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${r}분`;
  if (r <= 0) return `${h}시간`;
  return `${h}시간 ${r}분`;
}
