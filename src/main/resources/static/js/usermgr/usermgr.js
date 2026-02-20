(() => {
	const $ = (s) => document.querySelector(s);
	const $$ = (s) => Array.from(document.querySelectorAll(s));

	const pageSize = 10;
	let page = 1;

	const ui = {
		tbody: $("#userTbody"),
		pagination: $("#userPagination"),
		pageInfo: $("#userPageInfo"),
		filterTitle: $("#filterTitle"),
		filterStatus: $("#filterStatus"),
		filterDateFrom: $("#filterDateFrom"),
		filterDateTo: $("#filterDateTo"),
		btnApply: $("#btnApplyFilters"),
		btnReset: $("#btnResetFilters"),
		btnRegister: $("#btnRegisterUser"),
		btnSave: $("#btnSaveUser"),
		newEmployeeNo: $("#newEmployeeNo"),
		newUserName: $("#newUserName"),
		newPosition: $("#newPosition"),
		pwPreview: $("#pwPreview"),
	};

	if (!ui.tbody) return;

	const rows = () => $$(".userRow");
	const visibleRows = () => rows().filter((tr) => tr.dataset.filtered !== "1");

	// ── 페이지네이션 ──────────────────────────────────────────────
	const renderPagination = (totalPages) => {
		ui.pagination.innerHTML = "";
		if (totalPages <= 1) return;

		const addBtn = (label, nextPage, disabled, active) => {
			const li = document.createElement("li");
			li.className = "page-item" + (disabled ? " disabled" : "") + (active ? " active" : "");
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "page-link";
			btn.textContent = label;
			btn.addEventListener("click", () => { if (!disabled) { page = nextPage; render(); } });
			li.appendChild(btn);
			ui.pagination.appendChild(li);
		};

		addBtn("이전", Math.max(1, page - 1), page === 1, false);
		for (let p = 1; p <= totalPages; p++) addBtn(String(p), p, false, p === page);
		addBtn("다음", Math.min(totalPages, page + 1), page === totalPages, false);
	};

	// ── 렌더 ──────────────────────────────────────────────────────
	const render = () => {
		const list = visibleRows();
		const total = list.length;
		const totalPages = Math.max(1, Math.ceil(total / pageSize));
		if (page > totalPages) page = totalPages;

		const start = (page - 1) * pageSize;
		const end = start + pageSize;

		rows().forEach((tr) => (tr.style.display = "none"));
		list.slice(start, end).forEach((tr, idx) => {
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

		const emptyRow = $("#emptyRow");
		if (emptyRow) emptyRow.style.display = total === 0 ? "" : "none";
	};

	// ── 필터 적용 ─────────────────────────────────────────────────
	const applyFilters = () => {
		const name = (ui.filterTitle?.value || "").trim().toLowerCase();
		const status = (ui.filterStatus?.value || "").trim();
		const dateFrom = (ui.filterDateFrom?.value || "").trim();
		const dateTo = (ui.filterDateTo?.value || "").trim();

		rows().forEach((tr) => {
			const trName = (tr.dataset.name || "").toLowerCase();
			const trLock = (tr.dataset.islock || "").trim();
			const trCreated = (tr.dataset.created || "").trim();

			let ok = true;
			if (name && !trName.includes(name)) ok = false;
			if (status && trLock !== status) ok = false;
			if (dateFrom && trCreated && trCreated < dateFrom) ok = false;
			if (dateTo && trCreated && trCreated > dateTo) ok = false;

			tr.dataset.filtered = ok ? "0" : "1";
		});

		page = 1;
		render();
	};

	// ── 필터 초기화 ───────────────────────────────────────────────
	const resetFilters = () => {
		if (ui.filterTitle) ui.filterTitle.value = "";
		if (ui.filterStatus) ui.filterStatus.value = "";
		if (ui.filterDateFrom) ui.filterDateFrom.value = "";
		if (ui.filterDateTo) ui.filterDateTo.value = "";
		rows().forEach((tr) => (tr.dataset.filtered = "0"));
		page = 1;
		render();
	};

	// ── 등록 모달 열기 ────────────────────────────────────────────
	const openRegisterModal = () => {
		if (ui.newUserName) ui.newUserName.value = "";
		if (ui.newPosition) ui.newPosition.value = "";
		clearFieldError("newUserName", "nameError");
		clearFieldError("newPosition", "positionError");

		const empNo = window.serverData?.nextEmployeeNo ?? "";
		if (ui.newEmployeeNo) ui.newEmployeeNo.value = String(empNo);
		if (ui.pwPreview) ui.pwPreview.textContent = `${empNo}123`;

		new bootstrap.Modal($("#userRegisterModal")).show();
	};

	// ── 등록 저장 ─────────────────────────────────────────────────
	const saveNewUser = async () => {
		const name = (ui.newUserName?.value || "").trim();
		const position = (ui.newPosition?.value || "").trim();
		let hasError = false;

		if (name.length < 2) {
			showFieldError("newUserName", "nameError", "이름을 2자 이상 입력해주세요.");
			hasError = true;
		} else {
			clearFieldError("newUserName", "nameError");
		}
		if (!position) {
			showFieldError("newPosition", "Position", "직책을 입력해주세요.");
			hasError = true;
		} else {
			clearFieldError("newPosition", "Position");
		}
		if (hasError) return;

		try {
			const res = await fetch("/useradd", {
				method: "POST",
				headers: { "Content-Type": "application/json", 'X-Requested-With': 'XMLHttpRequest' },
				body: JSON.stringify({ name, position }),
			});

			if (res.status === 403) {
				showToast('권한이 없습니다.', true);
				return;
			}
			const data = await res.json();

			if (data.success) {
				alert(data.message || "사용자가 등록되었습니다.");
				bootstrap.Modal.getInstance($("#userRegisterModal"))?.hide();
				location.reload();
			} else {
				alert(data.message || "등록에 실패했습니다.");
			}
		} catch (e) {
			console.error("등록 오류:", e);
			alert("사용자 등록 중 오류가 발생했습니다.");
		}
	};

	// ── 잠금 토글 ─────────────────────────────────────────────────
	const toggleLock = async (userCode, currentLock, btn) => {
		const willLock = currentLock === "0";  // 현재 활성(0) → 잠금(1)으로
		const actionMsg = willLock ? "비활성화(잠금)" : "활성화(잠금 해제)";
		if (!confirm(`해당 사용자를 ${actionMsg} 하시겠습니까?`)) return;

		const newLock = willLock ? "1" : "0";

		try {
			const res = await fetch("/userlock", {
				method: "POST",
				headers: { "Content-Type": "application/json", 'X-Requested-With': 'XMLHttpRequest' },
				body: JSON.stringify({ userCode: parseInt(userCode), isLock: newLock }),
			});
			if (res.status === 403) {
				showToast('권한이 없습니다.', true);
				return;
			}
			const data = await res.json();

			if (data.success) {

				btn.dataset.islock = newLock;
				btn.classList.remove("btn-success", "btn-danger");
				btn.classList.add(newLock === "1" ? "btn-danger" : "btn-success");

				const row = btn.closest("tr");
				if (row) row.dataset.islock = newLock;

				const iconClass = (newLock === "1" ? "fa-solid fa-lock" : "fa-solid fa-lock-open");
				btn.innerHTML = `<i class="${iconClass}"></i>`;

				alert(data.message);

			} else {
				alert(data.message || "처리에 실패했습니다.");
			}
		} catch (e) {
			console.error("잠금 오류:", e);
			alert("처리 중 오류가 발생했습니다.");
		}
	};

	// ── 소프트 삭제 ───────────────────────────────────────────────
	const deleteUser = async (userCode, userName, btn) => {
		if (!confirm(`'${userName}' 사용자를 삭제하시겠습니까?\n(삭제 후 목록에서 제외됩니다.)`)) return;

		try {
			const res = await fetch("/userdelete", {
				method: "POST",
				headers: { "Content-Type": "application/json", 'X-Requested-With': 'XMLHttpRequest' },
				body: JSON.stringify({ userCode: parseInt(userCode) }),
			});
			if (res.status === 403) {
				showToast('권한이 없습니다.', true);
				return;
			}

			const data = await res.json();

			if (data.success) {
				const row = btn.closest("tr");
				row.style.transition = "opacity 0.3s";
				row.style.opacity = "0";
				setTimeout(() => { row.remove(); render(); }, 300);
			} else {
				alert(data.message || "삭제에 실패했습니다.");
			}
		} catch (e) {
			console.error("삭제 오류:", e);
			alert("삭제 중 오류가 발생했습니다.");
		}
	};

	// ── 이벤트 바인딩 ─────────────────────────────────────────────
	ui.btnApply?.addEventListener("click", applyFilters);
	ui.btnReset?.addEventListener("click", resetFilters);
	ui.btnRegister?.addEventListener("click", openRegisterModal);
	ui.btnSave?.addEventListener("click", saveNewUser);

	ui.tbody.addEventListener("click", (e) => {
		const lockBtn = e.target.closest(".lock-btn");
		const deleteBtn = e.target.closest(".delete-btn");
		if (lockBtn) {
			e.stopPropagation();
			toggleLock(lockBtn.dataset.usercode, lockBtn.dataset.islock, lockBtn);
			return;
		}
		if (deleteBtn) {
			e.stopPropagation();
			deleteUser(deleteBtn.dataset.usercode, deleteBtn.dataset.username, deleteBtn);
			return;
		}
		const row = e.target.closest(".userRow");
		if (row) {
			window.location.href = `/users/${row.dataset.usercode}`;
		}
	});

	[ui.filterTitle, ui.filterDateFrom, ui.filterDateTo].forEach((el) => {
		el?.addEventListener("keydown", (e) => { if (e.key === "Enter") e.preventDefault(); });
	});

	// ── 유틸 ──────────────────────────────────────────────────────
	function showFieldError(inputId, errorId, msg) {
		$(`#${inputId}`)?.classList.add("is-invalid");
		const err = $(`#${errorId}`);
		if (err) { err.textContent = msg; err.style.display = "block"; }
	}

	function clearFieldError(inputId, errorId) {
		$(`#${inputId}`)?.classList.remove("is-invalid");
		const err = $(`#${errorId}`);
		if (err) { err.textContent = ""; err.style.display = "none"; }
	}

	// ── 초기 렌더 ─────────────────────────────────────────────────
	rows().forEach((tr) => (tr.dataset.filtered = "0"));
	render();

})();