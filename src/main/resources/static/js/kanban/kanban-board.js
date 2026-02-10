// /js/issue/kanban-board.js
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const boardMeta = $("#kanbanBoard");
  const wrap = $("#kanbanWrap");
  if (!boardMeta || !wrap) return;

  const projectCode = boardMeta.dataset.projectCode || "";
  const canWrite = (boardMeta.dataset.canWrite || "false") === "true";

  const showToast = (message) => {
    const toastEl = $("#commonToast");
    const bodyEl = $("#commonToastBody");
    if (!toastEl || !bodyEl) return;

    bodyEl.textContent = message;
    toastEl.style.display = "block";
    const t = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 1800 });
    t.show();
  };

  const updateCounts = () => {
    const cols = $$(".kan-col-body[data-status]");
    cols.forEach((col) => {
      const status = col.dataset.status;
      const cnt = col.querySelectorAll(".kan-card").length;
      const badge = document.querySelector(`[data-count-for="${status}"]`);
      if (badge) badge.textContent = String(cnt);
    });
  };

  const getOrder = (colBody) =>
    Array.from(colBody.querySelectorAll(".kan-card")).map((c) =>
      Number(c.dataset.issueCode),
    );

  // 드래그 후 클릭 상세이동 방지 플래그
  let dragging = false;
  let lastDragEndAt = 0;

  // 카드 클릭하면 상세로 이동
  wrap.addEventListener("click", (e) => {
    const card = e.target.closest(".kan-card");
    if (!card) return;

    // 드래그 직후 클릭 무시
    const now = Date.now();
    if (dragging || now - lastDragEndAt < 250) return;

    const issueCode = card.dataset.issueCode;
    if (!issueCode) return;

    location.href = `/issueInfo?issueCode=${encodeURIComponent(issueCode)}`;
  });

  const saveMove = async (payload) => {
    const res = await fetch("/api/issues/board/move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let msg = "저장에 실패했습니다.";
      try {
        const data = await res.json();
        if (data && data.message) msg = data.message;
      } catch (_) {}
      throw new Error(msg);
    }

    return res.json().catch(() => ({}));
  };

  const initSortable = (colBody) => {
    return new Sortable(colBody, {
      group: "kanban",
      animation: 150,
      draggable: ".kan-card",
      handle: ".kan-card-title",
      disabled: !canWrite,

      onStart: () => {
        dragging = true;
        if (!canWrite) showToast("권한이 없습니다.");
      },

      onEnd: async (evt) => {
        dragging = false;
        lastDragEndAt = Date.now();

        if (!canWrite) return;

        // 같은 위치면 저장 호출 안 함
        if (evt.from === evt.to && evt.oldIndex === evt.newIndex) return;

        const item = evt.item;
        const issueCode = Number(item?.dataset?.issueCode || 0);
        const fromCol = evt.from;
        const toCol = evt.to;

        const fromStatus = fromCol?.dataset?.status || "";
        const toStatus = toCol?.dataset?.status || "";

        updateCounts();

        const payload = {
          projectCode: projectCode ? Number(projectCode) : null,
          issueCode: issueCode || null,
          fromStatusId: fromStatus,
          toStatusId: toStatus,
          toIndex: typeof evt.newIndex === "number" ? evt.newIndex : null,

          // 정렬 정확 저장용(서버가 지원하면 바로 사용 가능)
          fromOrder: getOrder(fromCol),
          toOrder: getOrder(toCol),
        };

        try {
          await saveMove(payload);
        } catch (err) {
          showToast(err?.message || "저장에 실패했습니다.");
          // 가장 확실한 원복: 리로드
          location.reload();
        }
      },
    });
  };

  $$(".kan-col-body[data-status]").forEach(initSortable);
  updateCounts();
})();
