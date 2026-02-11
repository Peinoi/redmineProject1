// /js/issue/search.js
(() => {
	const $ = (s) => document.querySelector(s);
	const $$ = (s) => Array.from(document.querySelectorAll(s));

	// -------------------------
	// DOM 요소
	// -------------------------
	const ui = {
		filterForm: $("#issueFilterForm"),

		projectText: $("#filterProjectText"),
		projectValue: $("#filterProjectValue"),
		title: $("#filterTitle"),
		status: $("#filterStatus"),
		priority: $("#filterPriority"),
		assigneeText: $("#filterAssigneeText"),
		assigneeValue: $("#filterAssigneeValue"),
		creatorText: $("#filterCreatorText"),
		creatorValue: $("#filterCreatorValue"),
		createdAt: $("#filterCreatedAt"),
		dueAt: $("#filterDueAt"),

		typeText: $("#filterTypeText"),
		typeValue: $("#filterTypeValue"),

		btnApply: $("#btnApplyFilters"),
		btnReset: $("#btnResetFilters"),

		btnProjectModal: $("#btnOpenProjectModal"),
		btnAssigneeModal: $("#btnOpenAssigneeModal"),
		btnCreatorModal: $("#btnOpenCreatorModal"),
		btnTypeModal: $("#btnOpenTypeModal"),

		projectModalEl: $("#projectSelectModal"),
		assigneeModalEl: $("#assigneeSelectModal"),
		creatorModalEl: $("#creatorSelectModal"),
		typeModalEl: $("#typeSelectModal"),

		projectModalList: $("#projectModalList"),
		assigneeModalList: $("#assigneeModalList"),
		creatorModalList: $("#creatorModalList"),
		typeModalTbody: $("#typeModalTbody"),

		projectModalSearch: $("#projectModalSearch"),
		assigneeModalSearch: $("#assigneeModalSearch"),
		creatorModalSearch: $("#creatorModalSearch"),
		typeModalSearch: $("#typeModalSearch"),
	};

	// form submit 자체 방지
	ui.filterForm?.addEventListener("submit", (e) => e.preventDefault());

	// -------------------------
	// 유틸 함수
	// -------------------------
	const rows = () => $$("tr.issueRow");
	const getRow = (tr) => {
		const d = tr.dataset;
		return {
			issueCode: (d.issueCode || "").trim(),
			project: (d.project || "").trim(),
			projectCode: (d.projectCode || "").trim(),
			title: (d.title || "").trim().toLowerCase(),
			status: (d.status || "").trim(),
			priority: (d.priority || "").trim(),
			assigneeCode: (d.assigneeCode || "").trim(),
			creatorCode: (d.creatorCode || "").trim(),
			created: (d.created || "").trim(),
			due: (d.due || "").trim(),
			typeCode: (d.typeCode || "").trim(),
		};
	};

	const sameDay = (rowDate, filterDate) => {
		if (!filterDate) return true;
		if (!rowDate) return false;
		return rowDate.slice(0, 10) === filterDate;
	};

	const STATUS_LABEL = {
		OB1: "신규",
		OB2: "진행",
		OB3: "해결",
		OB4: "반려",
		OB5: "완료",
	};

	const PRIORITY_LABEL = {
		OA1: "긴급",
		OA2: "높음",
		OA3: "보통",
		OA4: "낮음",
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

	const renderListButtons = (listEl, items, onPick) => {
		if (!listEl) return;
		listEl.innerHTML = "";

		if (!items.length) {
			const div = document.createElement("div");
			div.className = "text-muted";
			div.textContent = "결과가 없습니다.";
			listEl.appendChild(div);
			return;
		}

		items.forEach((it) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "list-group-item list-group-item-action";
			btn.textContent = it.name;
			btn.addEventListener("click", () => onPick(it));
			listEl.appendChild(btn);
		});
	};

	// -------------------------
	// 캐시
	// -------------------------
	let projectCache = [];
	let userCache = [];
	let typeCache = [];

	const ensureProjectCache = async () => {
		if (projectCache.length) return true;
		const res = await fetch("/api/projects/modal", { headers: { Accept: "application/json" } });
		if (!res.ok) { showToast("프로젝트 목록을 불러오지 못했습니다."); return false; }
		projectCache = (await res.json()).map(p => ({ code: String(p.projectCode), name: p.projectName }));
		return true;
	};

	const ensureUserCache = async () => {
		if (userCache.length) return true;
		const res = await fetch("/api/users/modal/my-projects", { headers: { Accept: "application/json" } });
		if (!res.ok) { showToast("사용자 목록을 불러오지 못했습니다."); return false; }
		userCache = (await res.json()).map(u => ({ code: String(u.userCode), name: u.userName }));
		return true;
	};

	const ensureTypeCache = async () => {
		if (typeCache.length) return true;
		const res = await fetch("/api/types/modal", { headers: { Accept: "application/json" } });
		if (!res.ok) { showToast("유형 목록을 불러오지 못했습니다."); return false; }
		typeCache = (await res.json()).map(t => ({
			code: String(t.typeCode),
			parentName: (t.parTypeName ?? "").trim(),
			name: (t.typeName ?? "").trim(),
			label: t.typeName ?? "",
		}));
		return true;
	};

	// -------------------------
	// 필터 적용
	// -------------------------
	const applyFiltersClient = () => {
		const pCode = ui.projectValue?.value?.trim() || "";
		const pName = ui.projectText?.value?.trim() || "";
		const title = ui.title?.value?.trim()?.toLowerCase() || "";

		const tCode = ui.typeValue?.value?.trim() || "";
		const sCode = ui.status?.value?.trim() || "";
		const prCode = ui.priority?.value?.trim() || "";
		const sLabel = sCode ? STATUS_LABEL[sCode] : "";
		const prLabel = prCode ? PRIORITY_LABEL[prCode] : "";
		const aCode = ui.assigneeValue?.value?.trim() || "";
		const cCode = ui.creatorValue?.value?.trim() || "";
		const created = ui.createdAt?.value?.trim() || "";
		const due = ui.dueAt?.value?.trim() || "";

		const issueMatches = new Set(); // title 매칭 ISSUE 코드 저장

		rows().forEach((tr) => {
			const d = getRow(tr);
			let ok = true;

			if (pCode) ok = ok && (d.projectCode ? d.projectCode === pCode : d.project === pName);
			if (title) ok = ok && (d.title || "").toLowerCase().includes(title);
			if (tCode) ok = ok && d.typeCode === tCode;
			if (sLabel) ok = ok && d.status === sLabel;
			if (prLabel) ok = ok && d.priority === prLabel;
			if (aCode) ok = ok && d.assigneeCode === aCode;
			if (cCode) ok = ok && d.creatorCode === cCode;
			ok = ok && sameDay(d.created, created);
			ok = ok && sameDay(d.due, due);

			// ISSUE 매칭 체크
			if (d.rowType === "ISSUE" && ok) {
				issueMatches.add(d.issueCode);
			}

			tr.dataset.filtered = ok ? "0" : "1";
			tr.style.display = ok ? "" : "none"; // 페이지네이션 없이 바로 숨김
		});

		// PROJECT/TYPE 표시 여부 결정
		rows().forEach((tr) => {
			const d = getRow(tr);

			if (d.rowType === "PROJECT" || d.rowType === "TYPE") {
				// 하위 ISSUE가 있으면 보여주고, 없으면 숨기기
				const hasChildIssue = rows().some((childTr) => {
					const c = getRow(childTr);
					return c.rowType === "ISSUE" &&
						c.parentTypeCode === d.typeCode &&
						issueMatches.has(c.issueCode);
				});
				// PROJECT는 모든 하위 ISSUE 체크
				const hasChildForProject = d.rowType === "PROJECT" &&
					rows().some((childTr) => {
						const c = getRow(childTr);
						return c.rowType === "ISSUE" &&
							c.projectCode === d.projectCode &&
							issueMatches.has(c.issueCode);
					});

				const ok = d.rowType === "PROJECT" ? hasChildForProject : hasChildIssue;
				tr.dataset.filtered = ok ? "0" : "1";
				tr.style.display = ok ? "" : "none";
			}
		});
	};

	// Gantt용 필터 객체 만들기
	const getGanttFilters = () => {
		return {
			projectCode: ui.projectValue?.value || "",
			title: ui.title?.value?.trim()?.toLowerCase() || "",
			type: ui.typeValue?.value || "",
			status: ui.status?.value || "",
			priority: ui.priority?.value || "",
			assigneeCode: ui.assigneeValue?.value || "",
			creatorCode: ui.creatorValue?.value || "",
			createdAt: ui.createdAt?.value || "",
			dueAt: ui.dueAt?.value || ""
		};
	};

	// -------------------------
	// 모달
	// -------------------------
	const projectModal = ui.projectModalEl ? new bootstrap.Modal(ui.projectModalEl) : null;
	const assigneeModal = ui.assigneeModalEl ? new bootstrap.Modal(ui.assigneeModalEl) : null;
	const creatorModal = ui.creatorModalEl ? new bootstrap.Modal(ui.creatorModalEl) : null;
	const typeModal = ui.typeModalEl ? new bootstrap.Modal(ui.typeModalEl) : null;

	const openProjectModal = async () => {
		if (!projectModal) return;
		ui.projectModalSearch && (ui.projectModalSearch.value = "");
		const ok = await ensureProjectCache(); if (!ok) return;
		renderListButtons(ui.projectModalList, projectCache, (picked) => {
			ui.projectText.value = picked.name;
			ui.projectValue.value = picked.code;
			projectModal.hide();
		});
		projectModal.show();
	};

	const openUserModal = async (type) => {
		const modal = type === "assignee" ? assigneeModal : creatorModal;
		const listEl = type === "assignee" ? ui.assigneeModalList : ui.creatorModalList;
		const searchEl = type === "assignee" ? ui.assigneeModalSearch : ui.creatorModalSearch;
		if (!modal) return;
		searchEl && (searchEl.value = "");
		const ok = await ensureUserCache(); if (!ok) return;
		renderListButtons(listEl, userCache, (picked) => {
			if (type === "assignee") { ui.assigneeText.value = picked.name; ui.assigneeValue.value = picked.code; }
			else { ui.creatorText.value = picked.name; ui.creatorValue.value = picked.code; }
			modal.hide();
		});
		modal.show();
	};

	const renderTypeTable = (items) => {
		if (!ui.typeModalTbody) return;
		ui.typeModalTbody.innerHTML = "";
		if (!items.length) {
			const tr = document.createElement("tr");
			const td = document.createElement("td");
			td.colSpan = 2; td.className = "text-muted"; td.textContent = "결과가 없습니다.";
			tr.appendChild(td); ui.typeModalTbody.appendChild(tr);
			return;
		}
		items.forEach(t => {
			const tr = document.createElement("tr");
			tr.style.cursor = "pointer";
			const tdParent = document.createElement("td"); tdParent.textContent = t.parentName;
			const tdName = document.createElement("td"); tdName.textContent = t.name;
			tr.appendChild(tdParent); tr.appendChild(tdName);
			tr.addEventListener("click", () => { ui.typeText.value = t.label; ui.typeValue.value = t.code; typeModal?.hide(); });
			ui.typeModalTbody.appendChild(tr);
		});
	};

	const openTypeModal = async () => {
		if (!typeModal) return;
		ui.typeModalSearch && (ui.typeModalSearch.value = "");
		const ok = await ensureTypeCache(); if (!ok) return;
		renderTypeTable(typeCache);
		typeModal.show();
	};

	// -------------------------
	// 이벤트 바인딩
	// -------------------------
	ui.btnApply?.addEventListener("click", (e) => {
		e.preventDefault();
		// 기존 클라이언트 테이블 필터 적용
		applyFiltersClient();

		// Gantt 필터 적용
		if (window.ganttReload) {
			const filters = getGanttFilters();
			window.ganttReload(filters);
		}
	});
	ui.btnReset?.addEventListener("click", (e) => {
		e.preventDefault();
		ui.projectText.value = "";
		ui.projectValue.value = "";
		ui.title.value = "";
		ui.typeText.value = "";
		ui.typeValue.value = "";
		ui.status.value = "";
		ui.priority.value = "";
		ui.assigneeText.value = "";
		ui.assigneeValue.value = "";
		ui.creatorText.value = "";
		ui.creatorValue.value = "";
		ui.createdAt.value = "";
		ui.dueAt.value = "";
		rows().forEach(tr => { tr.dataset.filtered = "0"; tr.style.display = ""; });
	});

	ui.btnProjectModal?.addEventListener("click", openProjectModal);
	ui.btnAssigneeModal?.addEventListener("click", () => openUserModal("assignee"));
	ui.btnCreatorModal?.addEventListener("click", () => openUserModal("creator"));
	ui.btnTypeModal?.addEventListener("click", openTypeModal);

	ui.projectModalSearch?.addEventListener("input", async () => {
		const ok = await ensureProjectCache(); if (!ok) return;
		const q = ui.projectModalSearch.value.trim().toLowerCase();
		renderListButtons(ui.projectModalList, projectCache.filter(p => p.name.toLowerCase().includes(q)), picked => { ui.projectText.value = picked.name; ui.projectValue.value = picked.code; projectModal?.hide(); });
	});

	ui.assigneeModalSearch?.addEventListener("input", async () => {
		const ok = await ensureUserCache(); if (!ok) return;
		const q = ui.assigneeModalSearch.value.trim().toLowerCase();
		renderListButtons(ui.assigneeModalList, userCache.filter(u => u.name.toLowerCase().includes(q)), picked => { ui.assigneeText.value = picked.name; ui.assigneeValue.value = picked.code; assigneeModal?.hide(); });
	});

	ui.creatorModalSearch?.addEventListener("input", async () => {
		const ok = await ensureUserCache(); if (!ok) return;
		const q = ui.creatorModalSearch.value.trim().toLowerCase();
		renderListButtons(ui.creatorModalList, userCache.filter(u => u.name.toLowerCase().includes(q)), picked => { ui.creatorText.value = picked.name; ui.creatorValue.value = picked.code; creatorModal?.hide(); });
	});

	ui.typeModalSearch?.addEventListener("input", async () => {
		const ok = await ensureTypeCache(); if (!ok) return;
		const q = ui.typeModalSearch.value.trim().toLowerCase();
		renderTypeTable(q ? typeCache.filter(t => (t.parentName + " " + t.name).toLowerCase().includes(q)) : typeCache);
	});

	document.addEventListener("DOMContentLoaded", () => {
		const toggleBtn = document.getElementById("btnToggleSearch");
		const searchWrapper = document.getElementById("searchConditionWrapper");

		if (!toggleBtn || !searchWrapper) return;

		toggleBtn.addEventListener("click", () => {
			const isOpen = searchWrapper.style.display === "block";

			searchWrapper.style.display = isOpen ? "none" : "block";
			toggleBtn.textContent = isOpen ? "검색조건 열기" : "검색조건 닫기";
		});
	});

})();
