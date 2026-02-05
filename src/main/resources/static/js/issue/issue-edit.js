// /js/issue/issue-edit.js
(() => {
  const $ = (s) => document.querySelector(s);

  const form = $("#issueEditForm");

  const titleInp = $("#title");
  const descInp = $("#description");

  const statusSel = $("#statusId");
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

  // 담당자 모달
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

  const toDT = (d) => (d ? `${d}T00:00` : "");

  const initial = {
    title: titleInp?.value || "",
    description: descInp?.value || "",
    statusId: statusSel?.value || "",
    progress: progressInp?.value || "",
    due: dueView?.value || "",
    started: startedView?.value || "",
    resolved: resolvedView?.value || "",
    assigneeName: assigneeText?.value || "",
    assigneeCode: assigneeCode?.value || "",
  };

  const syncHiddenDates = () => {
    if (createdAt && createdView) createdAt.value = toDT(createdView.value);
    if (dueAt && dueView) dueAt.value = toDT(dueView.value);
    if (startedAt && startedView) startedAt.value = toDT(startedView.value);

    // 완료 상태일 때만 완료일 저장
    if (resolvedAt && resolvedView) {
      resolvedAt.value =
        statusSel?.value === "OB5" ? toDT(resolvedView.value) : "";
    }
  };

  // 완료 상태일 때만 완료일 입력 가능
  const toggleResolvedByStatus = () => {
    if (!resolvedView) return;
    const isDone = statusSel?.value === "OB5";
    resolvedView.disabled = !isDone;

    // 완료가 아니면 완료일 값 자체를 비움(저장 방지 + UI 일관성)
    if (!isDone) resolvedView.value = "";
    if (!isDone && resolvedAt) resolvedAt.value = "";
  };

  const setProgressByStatus = () => {
    if (!statusSel || !progressInp) return;
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

  // 상태 변경: 여기서는 "완료일 필수"를 막지 않는다(저장 시에만 검증)
  const onStatusChange = () => {
    const s = statusSel?.value || "";

    // 신규 외 상태는 시작일이 없으면 선택을 되돌림(이건 즉시 막는 게 UX상 명확)
    if (s && s !== "OB1" && !startedView?.value) {
      alert("신규가 아닌 상태로 변경하려면 시작일을 먼저 등록해야 합니다.");
      statusSel.value = "OB1";
    }

    toggleResolvedByStatus();
    setProgressByStatus();
    syncHiddenDates();
  };

  // 담당자 모달
  const ensureUserCache = async () => {
    if (userCache.length) return true;
    const res = await fetch("/api/users/modal", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      alert("사용자 목록을 불러오지 못했습니다.");
      return false;
    }
    const data = await res.json();
    userCache = data.map((u) => ({
      value: String(u.userCode),
      label: u.userName,
    }));
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
        assigneeText.value = u.label;
        assigneeCode.value = u.value;
        assigneeSearchEl.value = "";
        assigneeModal?.hide();
      });
      assigneeListEl.appendChild(b);
    });
  };

  const openAssigneeModal = async () => {
    if (!assigneeModal) return;
    const ok = await ensureUserCache();
    if (!ok) return;
    assigneeSearchEl.value = "";
    renderUsers(userCache);
    assigneeModal.show();
  };

  const validateBeforeSubmit = () => {
    const s = statusSel?.value || "";

    // 신규 외에는 시작일 필수
    if (s && s !== "OB1" && !startedView?.value) {
      alert("신규가 아닌 상태로 저장하려면 시작일을 입력해야 합니다.");
      startedView?.focus();
      return false;
    }

    // 완료는 저장 시 완료일 필수
    if (s === "OB5" && !resolvedView?.value) {
      alert("완료로 저장하려면 완료일을 입력해야 합니다.");
      resolvedView?.focus();
      return false;
    }

    // 완료로 저장할 때는 첨부파일 필수
    if (s === "OB5") {
      const hasFile =
        uploadFileInp && uploadFileInp.files && uploadFileInp.files.length > 0;
      if (!hasFile) {
        alert("완료로 저장하려면 첨부파일을 등록해야 합니다.");
        uploadFileInp?.focus();
        return false;
      }
    }

    // 완료가 아니면 완료일 저장 금지
    if (s !== "OB5") {
      if (resolvedView) resolvedView.value = "";
      if (resolvedAt) resolvedAt.value = "";
    }

    if (s === "OB2") clampProgress();
    setProgressByStatus();
    syncHiddenDates();
    return true;
  };

  // bind
  statusSel?.addEventListener("change", onStatusChange);
  progressInp?.addEventListener("input", () => {
    clampProgress();
    syncHiddenDates();
  });

  dueView?.addEventListener("change", syncHiddenDates);

  startedView?.addEventListener("change", () => {
    // 신규 아닌 상태에서 시작일 비우면 신규로
    if (statusSel?.value && statusSel.value !== "OB1" && !startedView.value) {
      alert("신규가 아닌 상태에서는 시작일을 비울 수 없습니다.");
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

  btnBack?.addEventListener("click", () => history.back());

  btnReset?.addEventListener("click", () => {
    if (titleInp) titleInp.value = initial.title;
    if (descInp) descInp.value = initial.description;

    if (statusSel) statusSel.value = initial.statusId;
    if (progressInp) progressInp.value = initial.progress;

    if (dueView) dueView.value = initial.due;
    if (startedView) startedView.value = initial.started;
    if (resolvedView) resolvedView.value = initial.resolved;

    if (assigneeText) assigneeText.value = initial.assigneeName;
    if (assigneeCode) assigneeCode.value = initial.assigneeCode;

    onStatusChange();
  });

  form?.addEventListener("submit", (e) => {
    if (!validateBeforeSubmit()) e.preventDefault();
  });

  // init
  setProgressByStatus();
  toggleResolvedByStatus();
  syncHiddenDates();
})();
