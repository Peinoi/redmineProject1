(() => {
  const MAIN_URL = "/G2main";
  const API_URL  = "/api/quick/today-due";

  const listEl = document.getElementById("list");
  const countText = document.getElementById("countText");

  if (!listEl || !countText) return;

  // 1) 오늘 마감 일감
  fetch(API_URL, { headers: { "Accept": "application/json" } })
    .then(r => r.ok ? r.json() : [])
    .then(items => {
      listEl.innerHTML = "";

      countText.textContent = items.length ? `${items.length}건` : "없음";

      if (!items.length) {
        listEl.innerHTML = `<li class="empty">오늘 마감인 일감이 없어.</li>`;
        return;
      }

      items.forEach(it => {
        const li = document.createElement("li");
        li.className = "item";
        li.innerHTML = `
          <div class="meta">
            <div class="proj">${escapeHtml(it.projectName ?? "")}</div>
            <div class="ttl">${escapeHtml(it.subject ?? "")}</div>
          </div>
          <div class="due">${escapeHtml(it.dueDate ?? "")}</div>
        `;
        li.addEventListener("click", () => {
          window.location.href = "/issueInfo?issueCode=" + encodeURIComponent(it.issueCode);
        });
        listEl.appendChild(li);
      });
    })
    .catch(() => {
      listEl.innerHTML = `<li class="empty">불러오지 못했어.</li>`;
      countText.textContent = "실패";
    });

  // 2) 메인 페이지 백그라운드 로딩 완료되면 이동
  // - redirect(302)일 수도 있어서 ok만 믿지 말고, 응답이 오면 이동하되
  // - 혹시 네트워크 에러면 fallback으로 이동
  fetch(MAIN_URL, { credentials: "include" })
    .then(() => {
      window.location.replace(MAIN_URL);
    })
    .catch(() => {
      // 메인 프리로드가 실패해도 결국은 메인으로 이동 시도
      window.location.replace(MAIN_URL);
    });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));
  }
})();