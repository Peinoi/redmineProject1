(() => {
	const $ = (sel) => document.querySelector(sel);

	// UI 요소
	const ui = {
		projectText: $("#filterProjectText"),
		projectValue: $("#filterProjectValue"),
		title: $("#filterTitle"),
		status: $("#filterStatus"),
		priority: $("#filterPriority"),
		assigneeText: $("#filterAssigneeText"),
		assigneeValue: $("#filterAssigneeValue"),
		creatorText: $("#filterCreatorText"),
		creatorValue: $("#filterCreatorValue"),
		startDateFrom: $("#filterStartDateFrom"),
		startDateTo: $("#filterStartDateTo"),
		btnApply: $("#btnApplyFilters"),
		btnReset: $("#btnResetFilters"),
		btnProjectModal: $("#btnOpenProjectModal"),
		btnAssigneeModal: $("#btnOpenAssigneeModal"),
		btnCreatorModal: $("#btnOpenCreatorModal"),
		projectModalEl: $("#projectSelectModal"),
		assigneeModalEl: $("#assigneeSelectModal"),
		projectModalList: $("#projectModalList"),
		assigneeModalList: $("#assigneeModalList"),
		projectModalSearch: $("#projectModalSearch"),
		assigneeModalSearch: $("#assigneeModalSearch"),
	};

	let projectModal, assigneeModal, creatorModal;
	let projectCache = [];
	let userCache = [];

	// 초기화 (DOM 로드 대기)
	window.addEventListener("load", () => {
		if (ui.projectModalEl) projectModal = new bootstrap.Modal(ui.projectModalEl);
		if (ui.assigneeModalEl) assigneeModal = new bootstrap.Modal(ui.assigneeModalEl);

		bindEvents();
	});

	function bindEvents() {
		if (ui.btnApply) ui.btnApply.addEventListener("click", applyFilters);
		if (ui.btnReset) ui.btnReset.addEventListener("click", resetFilters);
		if (ui.btnProjectModal) ui.btnProjectModal.addEventListener("click", openProjectModal);
		if (ui.btnAssigneeModal) ui.btnAssigneeModal.addEventListener("click", openAssigneeModal);

		bindProjectModalSearch();
		bindUserModalSearch();
	}

	// 프로젝트 모달 렌더
	function renderProjectModalList(items) {
		if (!ui.projectModalList) return;
		ui.projectModalList.innerHTML = "";

		if (!items.length) {
			const empty = document.createElement("div");
			empty.className = "text-muted";
			empty.textContent = "결과가 없습니다.";
			ui.projectModalList.appendChild(empty);
			return;
		}

		items.forEach((it) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "list-group-item list-group-item-action";
			btn.textContent = it.name;
			btn.addEventListener("click", () => {
				ui.projectText.value = it.name;
				ui.projectValue.value = String(it.code);
				projectModal.hide();
			});
			ui.projectModalList.appendChild(btn);
		});
	}

	async function openProjectModal() {
		if (ui.projectModalSearch) ui.projectModalSearch.value = "";

		if (projectCache.length === 0) {
			const res = await fetch("/api/projects/modal", {
				headers: { Accept: "application/json" },
			});

			if (!res.ok) {
				alert("프로젝트 목록을 불러오지 못했습니다.");
				return;
			}

			const projects = await res.json();
			projectCache = projects.map((p) => ({
				code: p.projectCode,
				name: p.projectName,
			}));
		}

		renderProjectModalList(projectCache);
		projectModal.show();
	}

	function bindProjectModalSearch() {
		if (!ui.projectModalSearch) return;
		ui.projectModalSearch.addEventListener("input", () => {
			const q = ui.projectModalSearch.value.trim().toLowerCase();
			const filtered = projectCache.filter((p) =>
				String(p.name).toLowerCase().includes(q)
			);
			renderProjectModalList(filtered);
		});
	}

	// 유저 캐시 로드
	async function ensureUserCache() {
		if (userCache.length > 0) return true;

		const res = await fetch("/api/users/modal/my-projects", {
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
		if (!listEl) return;
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
		if (ui.assigneeModalSearch) ui.assigneeModalSearch.value = "";

		const ok = await ensureUserCache();
		if (!ok) return;

		renderUserModalList(ui.assigneeModalList, userCache, (picked) => {
			ui.assigneeText.value = picked.name;
			ui.assigneeValue.value = picked.code;
			assigneeModal.hide();
		});

		assigneeModal.show();
	}

	function bindUserModalSearch() {
		if (ui.assigneeModalSearch) {
			ui.assigneeModalSearch.addEventListener("input", async () => {
				const ok = await ensureUserCache();
				if (!ok) return;

				const q = ui.assigneeModalSearch.value.trim().toLowerCase();
				const filtered = userCache.filter((u) =>
					String(u.name).toLowerCase().includes(q)
				);

				renderUserModalList(ui.assigneeModalList, filtered, (picked) => {
					ui.assigneeText.value = picked.name;
					ui.assigneeValue.value = picked.code;
					assigneeModal.hide();
				});
			});
		}
	}

	// 우선순위 코드 매핑
	const priorityCodeMap = {
		'OA1': '긴급',
		'OA2': '높음',
		'OA3': '보통',
		'OA4': '낮음'
	};

	// 상태 코드 매핑
	const statusCodeMap = {
		'OB1': '신규',
		'OB2': '진행',
		'OB3': '해결',
		'OB4': '반려',
		'OB5': '완료'
	};

	// 필터 적용
	function applyFilters() {
		const filters = {
			projectCode: ui.projectValue?.value || '',
			title: ui.title?.value || '',
			status: ui.status?.value || '',
			priority: ui.priority?.value || '',
			assigneeCode: ui.assigneeValue?.value || '',
			startDateFrom: ui.startDateFrom?.value || '',
			startDateTo: ui.startDateTo?.value || '',
		};

		// 상태, 우선순위를 텍스트로 변환
		const filterObj = {
			projectCode: filters.projectCode,
			title: filters.title,
			status: filters.status ? statusCodeMap[filters.status] : '',
			priority: filters.priority ? priorityCodeMap[filters.priority] : '',
			assigneeCode: filters.assigneeCode,
			startDateFrom: filters.startDateFrom,
			startDateTo: filters.startDateTo,
		};

		// list.js의 ganttReload 함수 호출
		if (typeof window.ganttReload === 'function') {
			window.ganttReload(filterObj);
		}
	}

	// 필터 초기화
	function resetFilters() {
		if (ui.projectText) ui.projectText.value = '';
		if (ui.projectValue) ui.projectValue.value = '';
		if (ui.title) ui.title.value = '';
		if (ui.status) ui.status.value = '';
		if (ui.priority) ui.priority.value = '';
		if (ui.assigneeText) ui.assigneeText.value = '';
		if (ui.assigneeValue) ui.assigneeValue.value = '';
		if (ui.startDateFrom) ui.startDateFrom.value = '';
		if (ui.startDateTo) ui.startDateTo.value = '';

		// list.js의 ganttReload 함수 호출 (필터 없이)
		if (typeof window.ganttReload === 'function') {
			window.ganttReload({});
		}
	}

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