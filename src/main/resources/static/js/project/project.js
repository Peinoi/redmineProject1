(() => {
	// 툴팁
	const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
	const tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
		return new bootstrap.Tooltip(tooltipTriggerEl)
	})


	const $ = (sel) => document.querySelector(sel);
	const $$ = (sel) => Array.from(document.querySelectorAll(sel));

	const pageSize = 10;

	const rowsAll = () => $$("#projectTbody tr.projectRow");
	const rowsVisible = () => rowsAll().filter((tr) => tr.dataset.filtered !== "1");

	const ui = {
		title: $("#filterTitle"),
		priority: $("#filterPriority"),
		assigneeText: $("#filterAssigneeText"),
		assigneeValue: $("#filterAssigneeValue"),

		// 담당자
		assigneeSelect: $(".manager select"),

		// 날짜 필터
		dateFrom: $("#filterDateFrom"),
		dateTo: $("#filterDateTo"),

		btnApply: $("#btnApplyFilters"),
		btnReset: $("#btnResetFilters"),
		btnAssigneeModal: $("#btnOpenAssigneeModal"),

		creatorModalEl: $("#creatorSelectModal"),
		creatorModalList: $("#creatorModalList"),
		creatorModalSearch: $("#creatorModalSearch"),

		pagination: $("#projectPagination"),
		pageInfo: $("#projectPageInfo"),
	};

	const STATUS_LABEL = {
		OD1: "진행",
		OD2: "삭제",
		OD3: "종료",
	};

	let currentPage = 1;

	const creatorModal = new bootstrap.Modal(ui.creatorModalEl);

	// 유저 모달(관리자) 캐시
	let userCache = [];

	function rowData(tr) {
		const cells = tr.querySelectorAll("td");
		return {
			number: cells[0]?.textContent.trim() || "",
			projectName: cells[1]?.textContent.trim() || "",
			createdOn: cells[2]?.textContent.trim() || "",
			managerName: cells[3]?.textContent.trim() || "",
			managerPhone: cells[4]?.textContent.trim() || "",
			managerEmail: cells[5]?.textContent.trim() || "",
			status: cells[6]?.textContent.trim() || "",
		};
	}

	// 유저 캐시 로드
	async function ensureUserCache() {
		if (userCache.length > 0) return true;

		const res = await fetch("/api/users/modal/assignees", {
			headers: { Accept: "application/json", 'X-Requested-With': 'XMLHttpRequest' },
		});

		if (!res.ok) {
			showToast("사용자 목록을 불러오지 못했습니다.");
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
		ui.creatorModalSearch.value = "";

		const ok = await ensureUserCache();
		if (!ok) return;

		renderUserModalList(ui.creatorModalList, userCache, (picked) => {
			ui.assigneeText.value = picked.name;
			ui.assigneeValue.value = picked.code;
			creatorModal.hide();
		});

		creatorModal.show();
	}

	// 관리자 모달 검색
	function bindUserModalSearch() {
		ui.creatorModalSearch.addEventListener("input", async () => {
			const ok = await ensureUserCache();
			if (!ok) return;

			const q = ui.creatorModalSearch.value.trim().toLowerCase();
			const filtered = userCache.filter((u) =>
				String(u.name).toLowerCase().includes(q)
			);

			renderUserModalList(ui.creatorModalList, filtered, (picked) => {
				ui.assigneeText.value = picked.name;
				ui.assigneeValue.value = picked.code;
				creatorModal.hide();
			});
		});
	}

	function applyFilters() {
		const t = ui.title.value.trim().toLowerCase();
		const prCode = ui.priority.value.trim();
		const prLabel = (prCode && prCode !== "all") ? STATUS_LABEL[prCode] : "";

		// 1. 담당자 필터 값 (Select의 textContent 혹은 value)
		const selectedManager = ui.assigneeSelect.options[ui.assigneeSelect.selectedIndex]?.text || "";
		const isManagerSelected = ui.assigneeSelect.value !== "";

		// 2. 날짜 필터 값
		const dateFrom = ui.dateFrom.value; // YYYY-MM-DD
		const dateTo = ui.dateTo.value;

		rowsAll().forEach((tr) => {
			const d = rowData(tr);
			let ok = true;

			// 프로젝트명 검색
			if (t && !d.projectName.toLowerCase().includes(t)) ok = false;

			// 상태 검색
			if (prLabel && d.status !== prLabel) ok = false;

			// 담당자(관리자) 검색: 선택된 경우에만 비교
			if (isManagerSelected && d.managerName !== selectedManager) ok = false;

			// 등록일 범위 검색
			if (dateFrom || dateTo) {
				const rowDate = d.createdOn; // "YYYY-MM-DD"
				if (dateFrom && rowDate < dateFrom) ok = false;
				if (dateTo && rowDate > dateTo) ok = false;
			}

			tr.dataset.filtered = ok ? "0" : "1";
		});

		currentPage = 1;
		renderPage();
	}

	function resetFilters() {
		ui.title.value = "";
		ui.priority.value = "all";
		// 담당자 및 날짜 필터 초기화
		if (ui.assigneeSelect) ui.assigneeSelect.selectedIndex = 0;
		ui.dateFrom.value = "";
		ui.dateTo.value = "";

		rowsAll().forEach((tr) => (tr.dataset.filtered = "0"));
		currentPage = 1;
		renderPage();
	}

	function renderPagination(totalPages) {
		ui.pagination.innerHTML = "";
		if (totalPages <= 1) return;

		const makeItem = (label, page, disabled, active) => {
			const li = document.createElement("li");
			li.className = "page-item";
			if (disabled) li.classList.add("disabled");
			if (active) li.classList.add("active");

			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "page-link";
			btn.textContent = label;
			btn.addEventListener("click", () => {
				if (disabled) return;
				currentPage = page;
				renderPage();
			});

			li.appendChild(btn);
			return li;
		};

		ui.pagination.appendChild(
			makeItem("이전", Math.max(1, currentPage - 1), currentPage === 1, false)
		);

		for (let p = 1; p <= totalPages; p++) {
			ui.pagination.appendChild(makeItem(String(p), p, false, p === currentPage));
		}

		ui.pagination.appendChild(
			makeItem("다음", Math.min(totalPages, currentPage + 1), currentPage === totalPages, false)
		);
	}

	function renderPage() {
		const visible = rowsVisible();
		const total = visible.length;
		const totalPages = Math.max(1, Math.ceil(total / pageSize));

		if (currentPage > totalPages) currentPage = totalPages;

		const start = (currentPage - 1) * pageSize;
		const end = start + pageSize;

		rowsAll().forEach((tr) => {
			tr.style.display = "none";
		});

		visible.slice(start, end).forEach((tr) => {
			tr.style.display = "";
		});

		renderPagination(totalPages);

		if (ui.pageInfo) {
			const from = total === 0 ? 0 : start + 1;
			const to = Math.min(end, total);
			ui.pageInfo.textContent = `${from}-${to} / ${total}`;
		}
	}

	// 이벤트 바인딩
	ui.btnApply.addEventListener("click", applyFilters);
	ui.btnReset.addEventListener("click", resetFilters);
	ui.btnAssigneeModal.addEventListener("click", openAssigneeModal);

	bindUserModalSearch();

	// 행 상태에 따른 스타일 업데이트
	function updateRowStyle(tr) {
		const d = rowData(tr);
		if (d.status === "종료") {
			tr.classList.add("project-row-finished");
		} else {
			tr.classList.remove("project-row-finished");
		}
	}

	// 초기 로드 시 모든 행에 스타일 적용
	rowsAll().forEach(tr => updateRowStyle(tr));

	// 프로젝트 행 클릭 이벤트 (상세 페이지 이동)
	$("#projectTbody").addEventListener("click", async (e) => {
		const btn = e.target.closest("button");
		const row = e.target.closest("tr.projectRow");

		if (!row) return;

		// 버튼 클릭이 아닌 경우 상세 페이지로 이동
		if (!btn) {
			const projectCode = row.dataset.projectCode;
			if (projectCode) {
				location.href = `/project/overview/${projectCode}`;
			}
			return;
		}

		// 기존 버튼 클릭 로직 (삭제, 종료)
		const projectCode = row.dataset.projectCode;
		const projectName = rowData(row).projectName;

		// 1. 삭제 버튼 클릭
		if (btn.classList.contains("btn-danger")) {
			const isConfirmed = await showConfirm(`"${projectName}" 프로젝트를 삭제하시겠습니까?`);
			if (!isConfirmed) return;

			try {
				const response = await fetch(`/api/projects/${projectCode}/delete`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-Requested-With': 'XMLHttpRequest'
					}
				});
				if (response.status === 403) {
					showToast('권한이 없습니다.', true);
					return;
				}
				const result = await response.json();

				if (result.success) {
					showToast(result.message);
					row.dataset.filtered = "1";
					row.style.display = "none";
					renderPage();
				} else {
					showToast(result.message);
				}
			} catch (error) {
				console.error('삭제 오류:', error);
				showToast('삭제 처리 중 오류가 발생했습니다.');
			}
		}

		// 2. 종료 버튼 클릭
		if (btn.classList.contains("btn-success")) {
			const isConfirmed = await showConfirm(`"${projectName}" 프로젝트를 종료 처리하시겠습니까?`);
			if (!isConfirmed) return;
			try {
				const response = await fetch(`/api/projects/${projectCode}/modify`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-Requested-With': 'XMLHttpRequest'
					}
				});
				if (response.status === 403) {
					showToast('권한이 없습니다.', true);
					return;
				}
				const result = await response.json();

				if (result.success) {
					showToast(result.message);
					const statusCell = row.querySelectorAll("td")[6];
					if (statusCell) statusCell.textContent = "종료";
					updateRowStyle(row);
				} else {
					showToast(result.message);
				}
			} catch (error) {
				console.error('종료 오류:', error);
				showToast('종료 처리 중 오류가 발생했습니다.');
			}
		}
	});
	// 초기 화면
	$$("#projectTbody tr.projectRow").forEach(tr => {
		const d = rowData(tr);
		if (d.status === "삭제") {
			tr.dataset.filtered = "1";
		} else {
			// 초기 로드 시 진행(OD1,OD3) 상태만 노출
			tr.dataset.filtered = (d.status === STATUS_LABEL["OD1"] || d.status === STATUS_LABEL["OD3"]) ? "0" : "1";
		}
		updateRowStyle(tr);
	});
	// 초기 렌더링 수행
	renderPage();
})();
