// /js/notice/notice-info.js
(() => {
  const $ = (s) => document.querySelector(s);

  const ui = {
    btnBack: $("#btnBack"),
    btnEdit: $("#btnEdit"),
    btnDelete: $("#btnDelete"),

    noticeCode: $("#noticeCode"),

    commentContent: $("#commentContent"),
    commentCounter: $("#commentCounter"),
    btnCommentSubmit: $("#btnCommentSubmit"),
    commentList: $("#commentList"),
  };

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

  const hasTrue = (v) => String(v).toLowerCase() === "true";

  // =========================
  // 뒤로가기 앵커 저장/복원
  // =========================
  const ANCHOR_KEY = "notice_back_anchor";

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

  (function saveBackAnchor() {
    const ref = document.referrer || "";
    if (!ref) return;

    // 수정/등록 화면에서 온 ref는 저장하지 않음(중간 경유 방지)
    const isEditLike =
      ref.includes("/noticeEdit") || ref.includes("/noticeInsert");

    if (isEditLike) return;

    // 돌아갈 후보: 공지목록 / 작업이력 등 (필요하면 추가)
    const isBackCandidate =
      ref.includes("/noticeList") || ref.includes("/logs");

    if (!isBackCandidate) return;

    sessionStorage.setItem(ANCHOR_KEY, ref);
  })();

  ui.btnBack?.addEventListener("click", () => {
    const ref = document.referrer || "";
    const anchor = sessionStorage.getItem(ANCHOR_KEY) || "";

    // 직전이 수정페이지면 저장된 전전페이지로(없으면 목록)
    if (ref.includes("/noticeEdit")) {
      if (anchor) return location.replace(withTs(anchor));
      return location.replace(withTs("/noticeList"));
    }

    // 직전이 목록/작업이력/내페이지/개요면 그대로 이동
    if (ref.includes("/noticeList")) return location.replace(withTs(ref));
    if (ref.includes("/logs")) return location.replace(withTs(ref));
    if (ref.includes("/my")) return location.replace(withTs(ref));
    if (ref.includes("/G2main")) return location.replace(withTs(ref));
    if (ref.includes("/project/overview/"))
      return location.replace(withTs(ref));

    // ref가 이상하면 anchor 우선
    if (anchor) return location.replace(withTs(anchor));

    // 최종 fallback
    location.replace(withTs("/noticeList"));
  });

  // 공지 수정/삭제 버튼
  ui.btnEdit?.addEventListener("click", () => {
    const can = hasTrue(ui.btnEdit?.dataset?.canModify);
    if (!can) {
      showToast("권한이 없습니다.");
      return;
    }
    const noticeCode = ui.btnEdit.dataset.noticeCode;
    if (!noticeCode) return;
    location.href = `/noticeEdit?noticeCode=${encodeURIComponent(noticeCode)}`;
  });

  ui.btnDelete?.addEventListener("click", async () => {
    const can = hasTrue(ui.btnDelete?.dataset?.canDelete);
    if (!can) {
      showToast("권한이 없습니다.");
      return;
    }
    const noticeCode = ui.btnDelete.dataset.noticeCode;
    if (!noticeCode) return;

    const ok = confirm("정말 삭제하시겠습니까?");
    if (!ok) return;

    try {
      const res = await fetch(`/noticeDelete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: `noticeCode=${encodeURIComponent(noticeCode)}`,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        showToast(data.message || "삭제에 실패했습니다.");
        return;
      }

      showToast("삭제되었습니다.");

      // 삭제 후에도 "원래 오던 곳"으로
      const anchor = sessionStorage.getItem(ANCHOR_KEY) || "";
      if (anchor) location.replace(withTs(anchor));
      else location.replace(withTs("/noticeList"));
    } catch (e) {
      showToast("삭제 중 오류가 발생했습니다.");
    }
  });

  // 댓글 영역이 없는 경우
  const updateCounter = () => {
    if (!ui.commentContent || !ui.commentCounter) return;
    const len = (ui.commentContent.value || "").length;
    ui.commentCounter.textContent = `${len} / 500`;
  };

  ui.commentContent?.addEventListener("input", updateCounter);

  const renderNewComment = (c) => {
    if (!ui.commentList) return;

    const empty = ui.commentList.querySelector(".comment-empty");
    if (empty) empty.remove();

    const wrap = document.createElement("div");
    wrap.className = "comment-item";
    wrap.dataset.commentCode = String(c.commentCode);
    wrap.dataset.userCode = String(c.userCode || "");
    wrap.dataset.isDeleted = String(c.isDeleted || 0);

    wrap.innerHTML = `
      <div class="comment-head">
        <div class="head-left">
          <span class="comment-writer"></span>
          <span class="comment-time"></span>
        </div>
        <div class="head-actions"></div>
      </div>
      <pre class="comment-body"></pre>
    `;

    wrap.querySelector(".comment-writer").textContent =
      c.userName || String(c.userCode || "-");
    wrap.querySelector(".comment-time").textContent = c.createdAtText || "";
    wrap.querySelector(".comment-body").textContent = c.content || "";

    const actions = wrap.querySelector(".head-actions");
    if (actions) {
      actions.innerHTML = `
        <button type="button" class="btn btn-sm btn-outline-secondary btnCommentEdit" data-can-modify="true">수정</button>
        <button type="button" class="btn btn-sm btn-outline-danger btnCommentDelete" data-can-delete="true">삭제</button>
      `;
    }

    ui.commentList.prepend(wrap);
  };

  const submitComment = async () => {
    const noticeCode = ui.noticeCode?.value?.trim();
    if (!noticeCode) {
      showToast("공지 코드가 없습니다.");
      return;
    }

    if (!ui.commentContent) return;

    const content = (ui.commentContent.value || "").trim();
    if (!content) {
      showToast("댓글을 입력해주세요.");
      ui.commentContent.focus();
      return;
    }
    if (content.length > 500) {
      showToast("댓글은 500자 이내로 입력해주세요.");
      ui.commentContent.focus();
      return;
    }

    if (ui.btnCommentSubmit) ui.btnCommentSubmit.disabled = true;

    try {
      const res = await fetch(
        `/api/notice/${encodeURIComponent(noticeCode)}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ content }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        if (data.message === "NO_PERMISSION") showToast("권한이 없습니다.");
        else showToast(data.message || "댓글 등록에 실패했습니다.");
        return;
      }

      renderNewComment(data.comment);
      ui.commentContent.value = "";
      updateCounter();
      showToast("댓글이 등록되었습니다.");
    } catch (e) {
      showToast("댓글 등록 중 오류가 발생했습니다.");
    } finally {
      if (ui.btnCommentSubmit) ui.btnCommentSubmit.disabled = false;
    }
  };

  ui.btnCommentSubmit?.addEventListener("click", submitComment);

  // Enter 등록, Shift+Enter는 줄바꿈
  ui.commentContent?.addEventListener("keydown", (e) => {
    if (e.isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  });

  // 이벤트 위임: 수정/삭제
  ui.commentList?.addEventListener("click", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const item = target.closest(".comment-item");
    if (!item) return;

    const commentCode = item.dataset.commentCode;
    const isDeleted = String(item.dataset.isDeleted) === "1";
    if (!commentCode || isDeleted) return;

    // 수정
    if (target.classList.contains("btnCommentEdit")) {
      const canModify = hasTrue(target.dataset.canModify);
      if (!canModify) {
        showToast("권한이 없습니다.");
        return;
      }

      const bodyEl = item.querySelector(".comment-body");
      if (!bodyEl) return;

      if (item.querySelector(".comment-edit-area")) return;

      const origin = bodyEl.textContent || "";
      const editWrap = document.createElement("div");
      editWrap.className = "comment-edit-area";
      editWrap.innerHTML = `
        <textarea class="form-control comment-edit-text" rows="3"></textarea>
        <div class="d-flex justify-content-end gap-2 mt-2">
          <button type="button" class="btn btn-sm btn-secondary btnCommentCancel">취소</button>
          <button type="button" class="btn btn-sm btn-success btnCommentSave">저장</button>
        </div>
      `;

      const ta = editWrap.querySelector(".comment-edit-text");
      ta.value = origin;

      bodyEl.style.display = "none";
      item.appendChild(editWrap);
      ta.focus();
      return;
    }

    // 취소
    if (target.classList.contains("btnCommentCancel")) {
      const bodyEl = item.querySelector(".comment-body");
      const editArea = item.querySelector(".comment-edit-area");
      if (editArea) editArea.remove();
      if (bodyEl) bodyEl.style.display = "";
      return;
    }

    // 저장
    if (target.classList.contains("btnCommentSave")) {
      const canModifyBtn = item.querySelector(".btnCommentEdit");
      const canModify = hasTrue(canModifyBtn?.dataset?.canModify);
      if (!canModify) {
        showToast("권한이 없습니다.");
        return;
      }

      const ta = item.querySelector(".comment-edit-text");
      if (!(ta instanceof HTMLTextAreaElement)) return;

      const content = (ta.value || "").trim();
      if (!content) {
        showToast("댓글을 입력해주세요.");
        ta.focus();
        return;
      }
      if (content.length > 500) {
        showToast("댓글은 500자 이내로 입력해주세요.");
        ta.focus();
        return;
      }

      target.disabled = true;

      try {
        const res = await fetch(
          `/api/notice/comments/${encodeURIComponent(commentCode)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ content }),
          },
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          if (data.message === "NO_PERMISSION") showToast("권한이 없습니다.");
          else showToast(data.message || "댓글 수정에 실패했습니다.");
          return;
        }

        const bodyEl = item.querySelector(".comment-body");
        if (bodyEl) bodyEl.textContent = data.comment?.content || content;

        const editArea = item.querySelector(".comment-edit-area");
        if (editArea) editArea.remove();
        if (bodyEl) bodyEl.style.display = "";

        showToast("댓글이 수정되었습니다.");
      } catch (err) {
        showToast("댓글 수정 중 오류가 발생했습니다.");
      } finally {
        target.disabled = false;
      }
      return;
    }

    // 삭제
    if (target.classList.contains("btnCommentDelete")) {
      const canDelete = hasTrue(target.dataset.canDelete);
      if (!canDelete) {
        showToast("권한이 없습니다.");
        return;
      }

      const ok = confirm("댓글을 삭제하시겠습니까?");
      if (!ok) return;

      target.disabled = true;

      try {
        const res = await fetch(
          `/api/notice/comments/${encodeURIComponent(commentCode)}`,
          {
            method: "DELETE",
            headers: { Accept: "application/json" },
          },
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          if (data.message === "NO_PERMISSION") showToast("권한이 없습니다.");
          else showToast(data.message || "댓글 삭제에 실패했습니다.");
          return;
        }

        item.dataset.isDeleted = "1";

        const actions = item.querySelector(".head-actions");
        if (actions) actions.remove();

        const editArea = item.querySelector(".comment-edit-area");
        if (editArea) editArea.remove();

        const bodyEl = item.querySelector(".comment-body");
        if (bodyEl) {
          bodyEl.textContent = "삭제된 댓글입니다.";
          bodyEl.classList.add("deleted");
          bodyEl.style.display = "";
        }

        showToast("삭제되었습니다.");
      } catch (err) {
        showToast("댓글 삭제 중 오류가 발생했습니다.");
      } finally {
        target.disabled = false;
      }
      return;
    }
  });

  updateCounter();
})();
