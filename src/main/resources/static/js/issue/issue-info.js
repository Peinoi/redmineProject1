document.addEventListener("DOMContentLoaded", () => {
  const issueCode = new URLSearchParams(location.search).get("issueCode");

  document
    .getElementById("btnBack")
    ?.addEventListener("click", () => (location.href = `/issueList`));

  document.getElementById("btnEdit")?.addEventListener("click", () => {
    if (!issueCode) return alert("issueCode 없음");
    location.href = `/issueEdit?issueCode=${issueCode}`;
  });

  document.getElementById("btnDelete")?.addEventListener("click", () => {
    if (!issueCode) return alert("issueCode 없음");
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

  renderHistory();
});

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
  };

  const dateFields = new Set(["dueAt", "startedAt", "resolvedAt"]);

  document.querySelectorAll(".history-item").forEach((item) => {
    const time = item.dataset.time || "";
    const action = item.dataset.action || "";
    const user = item.dataset.user || "";
    const metaStr = item.dataset.meta;

    // 헤더
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

        // 설명은 태그 제거 + 길이 제한
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

// 핵심: null/undefined/""/"-" 전부 빈 값으로 처리해서 "-"가 화면에 안 뜨게
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
