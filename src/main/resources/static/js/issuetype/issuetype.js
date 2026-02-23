// ============================================
// issuetype.js
// ============================================

(() => {
	const $ = (s) => document.querySelector(s);
	const $$ = (s) => Array.from(document.querySelectorAll(s));

	const pageSize = 10;
	let page = 1;

	let projectCache = [];
	let typeCache = [];
	let allTypes = [];

	// ============================================
	// UI 요소
	// ============================================
	const ui = {
		// 테이블
		tbody: $("#typeTbody"),
		pagination: $("#typePagination"),
		pageInfo: $("#issueTypePageInfo"),

		// 필터
		filterTitle: $("#filterTitle"),
		filterProjectText: $("#filterProjectText"),
		filterProjectValue: $("#filterProjectValue"),
		filterTypeText: $("#filterTypeText"),
		filterTypeValue: $("#filterTypeValue"),
		filterDateType: $("#filterDateType"),
		filterDateFrom: $("#filterDateFrom"),
		filterDateTo: $("#filterDateTo"),
		btnApply: $("#btnApplyFilters"),
		btnReset: $("#btnResetFilters"),
		btnOpenProjectModal: $("#btnOpenProjectModal"),
		btnOpenTypeModal: $("#btnOpenTypeModal"),

		// 등록 버튼
		btnRegister: $("#btnRegisterType"),

		// 등록/수정 모달
		typeFormModal: $("#typeFormModal"),
		typeFormModalTitle: $("#typeFormModalTitle"),
		modalTypeCode: $("#modalTypeCode"),
		modalTypeName: $("#modalTypeName"),
		modalStartAt: $("#modalStartAt"),
		modalEndAt: $("#modalEndAt"),
		btnSaveType: $("#btnSaveType"),
		projectSelectWrap: $("#projectSelectWrap"),
		projectSelectBox: $("#projectSelectBox"),
		dateOverlapAlert: $("#dateOverlapAlert"),
		dateOverlapMsg: $("#dateOverlapMsg"),

		// 상위 유형 선택 (등록/수정 모달 내)
		modalParTypeText: $("#modalParTypeText"),
		modalParTypeValue: $("#modalParTypeValue"),
		btnOpenModalTypeModal: $("#btnOpenModalTypeModal"),
		btnClearModalType: $("#btnClearModalType"),
		topLevelBadge: $("#topLevelBadge"),

		// 필터 - 프로젝트 모달
		projectSelectModal: $("#projectSelectModal"),
		projectModalSearch: $("#projectModalSearch"),
		projectModalList: $("#projectModalList"),

		// 필터 - 유형 모달
		typeSelectModal: $("#typeSelectModal"),
		typeModalSearch: $("#typeModalSearch"),
		typeModalTree: $("#typeModalTree"),

		// 등록/수정 - 상위유형 모달
		modalTypeSelectModal: $("#modalTypeSelectModal"),
		modalTypeModalSearch: $("#modalTypeModalSearch"),
		modalTypeModalTree: $("#modalTypeModalTree"),
	};

	if (!ui.tbody) return;

	// ============================================
	// 전체 타입 데이터 초기화 (기간 겹침 체크용)
	// ============================================
	const initAllTypes = () => {
		allTypes = [];
		$$("tr.typeRow").forEach((tr) => {
			const d = tr.dataset;
			allTypes.push({
				typeCode: parseInt(d.typecode),
				projectCode: parseInt(d.projectcode),
				startAt: d.startat || "",
				endAt: d.endat || "",
			});
		});
	};
	initAllTypes();

	// ============================================
	// 최상위 뱃지 업데이트
	// ============================================
	const updateTopLevelBadge = () => {
		if (!ui.topLevelBadge) return;
		const hasParType = (ui.modalParTypeValue?.value || "").trim() !== "";
		ui.topLevelBadge.style.display = hasParType ? "none" : "block";
	};

	// ============================================
	// 행 헬퍼
	// ============================================
	const rows = () => $$("tr.typeRow");
	const visibleRows = () => rows().filter((tr) => tr.dataset.filtered !== "1");

	// ============================================
	// 페이지네이션 렌더
	// ============================================
	const renderPagination = (totalPages) => {
		ui.pagination.innerHTML = "";
		if (totalPages <= 1) return;

		const addBtn = (label, nextPage, disabled, active) => {
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
				page = nextPage;
				render();
			});

			li.appendChild(btn);
			ui.pagination.appendChild(li);
		};

		addBtn("이전", Math.max(1, page - 1), page === 1, false);
		for (let p = 1; p <= totalPages; p++)
			addBtn(String(p), p, false, p === page);
		addBtn("다음", Math.min(totalPages, page + 1), page === totalPages, false);
	};

	// ============================================
	// 테이블 렌더
	// ============================================
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
	};

	// ============================================
	// 필터 적용
	// ============================================
	const applyFilters = () => {
		const titleQ = (ui.filterTitle?.value || "").trim().toLowerCase();
		const pCode = (ui.filterProjectValue?.value || "").trim();
		const pName = (ui.filterProjectText?.value || "").trim();
		const tCode = (ui.filterTypeValue?.value || "").trim();
		const dateType = ui.filterDateType?.value || "start";
		const from = ui.filterDateFrom?.value || "";
		const to = ui.filterDateTo?.value || "";

		rows().forEach((tr) => {
			const d = tr.dataset;
			const typeName = (d.typename || "").toLowerCase();
			const projectCode = (d.projectcode || "").trim();
			const projectName = (d.projectname || "").trim();
			const typeCode = (d.typecode || "").trim();
			const startAt = (d.startat || "").trim().slice(0, 10);
			const endAt = (d.endat || "").trim().slice(0, 10);

			let ok = true;

			if (titleQ) ok = ok && typeName.includes(titleQ);
			if (pCode) ok = ok && (projectCode === pCode || (!projectCode && projectName === pName));
			if (tCode) ok = ok && typeCode === tCode;

			if (from || to) {
				const target = dateType === "start" ? startAt : endAt;
				if (from) ok = ok && target >= from;
				if (to) ok = ok && target <= to;
			}

			tr.dataset.filtered = ok ? "0" : "1";
		});

		page = 1;
		render();
	};

	// ============================================
	// 토스트 메시지
	// ============================================
	const showToast = (message, isError = false) => {
		const toastId = "commonToast";
		let toastEl = document.getElementById(toastId);

		if (!toastEl) {
			toastEl = document.createElement("div");
			toastEl.id = toastId;
			toastEl.setAttribute("role", "alert");
			toastEl.setAttribute("aria-live", "assertive");
			toastEl.setAttribute("aria-atomic", "true");
			toastEl.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:1080;";
			toastEl.innerHTML = `
				<div class="d-flex">
					<div class="toast-body" id="commonToastBody"></div>
					<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
				</div>`;
			document.body.appendChild(toastEl);
		}

		const bodyEl = document.getElementById("commonToastBody");
		if (bodyEl) bodyEl.textContent = message;
		toastEl.className = `toast align-items-center border-0 ${isError ? "text-bg-danger" : "text-bg-dark"}`;
		bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2500 }).show();
	};

	// ============================================
	// 리스트 버튼 렌더 (프로젝트 모달용)
	// ============================================
	const renderListButtons = (listEl, items, onPick) => {
		if (!listEl) return;
		listEl.innerHTML = "";

		if (!items.length) {
			listEl.innerHTML = '<div class="text-muted p-2">결과가 없습니다.</div>';
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

	// ============================================
	// 프로젝트 캐시 로드
	// ============================================
	const ensureProjectCache = async () => {
		if (projectCache.length > 0) return true;

		const res = await fetch("/api/projects/modal", {
			headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
		});
		if (!res.ok) { showToast("프로젝트 목록을 불러오지 못했습니다.", true); return false; }

		const data = await res.json();
		projectCache = data.map((p) => ({
			code: String(p.projectCode),
			name: p.projectName,
			day: p.createdOn,
		}));
		return true;
	};

	// ============================================
	// 유형 캐시 로드
	// ============================================
	const ensureTypeCache = async () => {
		if (typeCache.length > 0) return true;

		const res = await fetch("/api/types/modal", {
			headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
		});
		if (!res.ok) { showToast("유형 목록을 불러오지 못했습니다.", true); return false; }

		typeCache = await res.json();
		return true;
	};

	// ============================================
	// 유형 트리 빌드
	// ============================================
	const buildTypeTreeForJS = (serverData, filterProjectCode = null) => {
		const projectMap = {};

		const convertType = (type, pCode, pName) => ({
			code: String(type.typeCode),
			name: type.typeName,
			projectCode: pCode,
			projectName: pName,
			children: (type.children || []).map((c) => convertType(c, pCode, pName)),
		});

		(serverData || []).forEach((type) => {
			const pCode = String(type.projectCode);
			const pName = type.projectName || "기타 프로젝트";

			if (filterProjectCode && pCode !== String(filterProjectCode)) return;

			if (!projectMap[pCode])
				projectMap[pCode] = { code: pCode, name: pName, children: [] };

			if (!type.parTypeCode)
				projectMap[pCode].children.push(convertType(type, pCode, pName));
		});

		return Object.values(projectMap).filter((p) => p.children.length > 0);
	};

	// ============================================
	// 유형 트리 렌더
	// ============================================
	const renderTypeTree = (items, container, onPick) => {
		if (!container) return;
		container.innerHTML = "";

		if (!items || items.length === 0) {
			container.innerHTML = '<div class="p-4 text-center text-muted">결과가 없습니다.</div>';
			return;
		}

		const createNode = (type) => {
			const li = document.createElement("li");
			const div = document.createElement("div");
			div.className = "type-item";
			div.textContent = type.name;
			div.addEventListener("click", (e) => { e.stopPropagation(); onPick(type); });
			li.appendChild(div);

			if (type.children && type.children.length > 0) {
				const ul = document.createElement("ul");
				type.children.forEach((c) => ul.appendChild(createNode(c)));
				li.appendChild(ul);
			}
			return li;
		};

		items.forEach((p) => {
			const groupWrapper = document.createElement("div");
			groupWrapper.className = "type-project-group";

			const projHeader = document.createElement("div");
			projHeader.className = "type-project-header";
			projHeader.textContent = p.name;

			const contentWrapper = document.createElement("div");
			contentWrapper.className = "type-project-content";
			contentWrapper.style.display = "none";

			projHeader.addEventListener("click", () => {
				const isOpen = contentWrapper.style.display === "block";
				document.querySelectorAll(".type-project-content")
					.forEach((el) => (el.style.display = "none"));
				document.querySelectorAll(".type-project-header")
					.forEach((el) => el.classList.remove("active"));
				if (!isOpen) {
					contentWrapper.style.display = "block";
					projHeader.classList.add("active");
				}
			});

			if (p.children && p.children.length > 0) {
				const rootUl = document.createElement("ul");
				p.children.forEach((t) => rootUl.appendChild(createNode(t)));
				contentWrapper.appendChild(rootUl);
			}

			groupWrapper.appendChild(projHeader);
			groupWrapper.appendChild(contentWrapper);
			container.appendChild(groupWrapper);
		});
	};

	// ============================================
	// 유형 트리 검색 필터
	// ============================================
	const searchInTypeTree = (nodes, q) =>
		(nodes || [])
			.map((node) => {
				const hit = (node.name || "").toLowerCase().includes(q);
				const children = searchInTypeTree(node.children || [], q);
				if (hit || children.length > 0) return { ...node, children };
				return null;
			})
			.filter(Boolean);

	// ============================================
	// 필터 - 프로젝트 모달
	// ============================================
	const filterProjectModal = ui.projectSelectModal
		? new bootstrap.Modal(ui.projectSelectModal) : null;

	const openFilterProjectModal = async () => {
		if (!filterProjectModal) return;
		ui.projectModalSearch.value = "";
		const ok = await ensureProjectCache();
		if (!ok) return;

		renderListButtons(ui.projectModalList, projectCache, (picked) => {
			ui.filterProjectText.value = picked.name;
			ui.filterProjectValue.value = picked.code;
			filterProjectModal.hide();
		});
		filterProjectModal.show();
	};

	ui.projectModalSearch?.addEventListener("input", async () => {
		await ensureProjectCache();
		const q = ui.projectModalSearch.value.trim().toLowerCase();
		const list = projectCache.filter((p) => p.name.toLowerCase().includes(q));
		renderListButtons(ui.projectModalList, list, (picked) => {
			ui.filterProjectText.value = picked.name;
			ui.filterProjectValue.value = picked.code;
			filterProjectModal?.hide();
		});
	});

	// ============================================
	// 필터 - 유형 모달
	// ============================================
	const filterTypeModal = ui.typeSelectModal
		? new bootstrap.Modal(ui.typeSelectModal) : null;

	const openFilterTypeModal = async () => {
		if (!filterTypeModal) return;
		if (ui.typeModalSearch) ui.typeModalSearch.value = "";
		const ok = await ensureTypeCache();
		if (!ok) return;

		const pCode = (ui.filterProjectValue?.value || "").trim();
		const treeData = buildTypeTreeForJS(typeCache, pCode || null);

		renderTypeTree(treeData, ui.typeModalTree, (picked) => {
			ui.filterTypeText.value = picked.name;
			ui.filterTypeValue.value = picked.code;
			filterTypeModal.hide();
		});
		filterTypeModal.show();
	};

	ui.typeModalSearch?.addEventListener("input", async () => {
		await ensureTypeCache();
		const q = ui.typeModalSearch.value.trim().toLowerCase();
		const pCode = (ui.filterProjectValue?.value || "").trim();
		const treeData = buildTypeTreeForJS(typeCache, pCode || null);

		const filtered = q
			? treeData.map((proj) => ({
				...proj,
				children: searchInTypeTree(proj.children || [], q),
			})).filter((proj) => proj.children.length > 0)
			: treeData;

		renderTypeTree(filtered, ui.typeModalTree, (picked) => {
			ui.filterTypeText.value = picked.name;
			ui.filterTypeValue.value = picked.code;
			filterTypeModal?.hide();
		});
	});

	// ============================================
	// 등록/수정 모달 - 상위유형 모달
	// ============================================
	const modalTypeModalInstance = ui.modalTypeSelectModal
		? new bootstrap.Modal(ui.modalTypeSelectModal) : null;

	// 자기 자신 및 하위 노드 전체 제거 (수정 시 순환 방지)
	const filterSelfFromTree = (nodes, excludeCode) => {
		if (!excludeCode) return nodes;
		return nodes
			.filter((n) => String(n.code) !== String(excludeCode))
			.map((n) => ({ ...n, children: filterSelfFromTree(n.children || [], excludeCode) }));
	};

	const openModalTypeModal = async () => {
		if (!modalTypeModalInstance) return;
		if (ui.modalTypeModalSearch) ui.modalTypeModalSearch.value = "";
		const ok = await ensureTypeCache();
		if (!ok) return;

		const pCode = (ui.projectSelectBox?.value || "").trim();
		const editCode = (ui.modalTypeCode?.value || "").trim();
		const treeData = buildTypeTreeForJS(typeCache, pCode || null);

		const safeTree = treeData.map((p) => ({
			...p,
			children: filterSelfFromTree(p.children || [], editCode),
		}));

		renderTypeTree(safeTree, ui.modalTypeModalTree, (picked) => {
			ui.modalParTypeText.value = picked.name;
			ui.modalParTypeValue.value = picked.code;
			updateTopLevelBadge();
			modalTypeModalInstance.hide();
		});

		modalTypeModalInstance.show();
	};

	ui.modalTypeModalSearch?.addEventListener("input", async () => {
		await ensureTypeCache();
		const q = ui.modalTypeModalSearch.value.trim().toLowerCase();
		const pCode = (ui.projectSelectBox?.value || "").trim();
		const editCode = (ui.modalTypeCode?.value || "").trim();
		const treeData = buildTypeTreeForJS(typeCache, pCode || null);

		const safeTree = treeData.map((p) => ({
			...p,
			children: filterSelfFromTree(p.children || [], editCode),
		}));

		const filtered = q
			? safeTree.map((proj) => ({
				...proj,
				children: searchInTypeTree(proj.children || [], q),
			})).filter((proj) => proj.children.length > 0)
			: safeTree;

		renderTypeTree(filtered, ui.modalTypeModalTree, (picked) => {
			ui.modalParTypeText.value = picked.name;
			ui.modalParTypeValue.value = picked.code;
			updateTopLevelBadge();
			modalTypeModalInstance?.hide();
		});
	});

	// 상위유형 초기화 → 최상위로 변경
	ui.btnClearModalType?.addEventListener("click", () => {
		ui.modalParTypeText.value = "";
		ui.modalParTypeValue.value = "";
		updateTopLevelBadge();
	});

	// ============================================
	// 폼용 프로젝트 셀렉트 채우기
	// ============================================
	const fillProjectSelect = async () => {
		const ok = await ensureProjectCache();
		if (!ok) return;

		ui.projectSelectBox.innerHTML = '<option value="">-- 프로젝트 선택 --</option>';
		projectCache.forEach((p) => {
			const option = document.createElement("option");
			option.value = p.code;
			const dateDisplay = p.day ? `(${p.day.substring(0, 10)})` : "";
			option.textContent = `${p.name || "이름 없음"} ${dateDisplay}`;
			ui.projectSelectBox.appendChild(option);
		});
	};

	// 프로젝트 변경 시 상위유형·날짜 초기화
	ui.projectSelectBox?.addEventListener("change", () => {
		ui.modalStartAt.value = "";
		ui.modalEndAt.value = "";
		ui.modalParTypeText.value = "";
		ui.modalParTypeValue.value = "";
		ui.dateOverlapAlert.style.display = "none";
		typeCache = []; // 프로젝트 바뀌면 유형 캐시 무효화
		updateTopLevelBadge();
		clearFieldError(ui.projectSelectBox, "projectError");
	});

	// ============================================
	// 기간 겹침 체크
	// ============================================
	const checkOverlap = (projectCode, startAt, endAt, excludeTypeCode = null) => {
		if (!startAt || !endAt) return null;

		const targets = allTypes.filter(
			(t) =>
				t.projectCode === parseInt(projectCode) &&
				(excludeTypeCode === null || t.typeCode !== parseInt(excludeTypeCode)) &&
				t.startAt && t.endAt
		);

		for (const t of targets) {
			if (!(t.endAt < startAt || t.startAt > endAt))
				return `${t.startAt} ~ ${t.endAt} 기간과 겹칩니다.`;
		}
		return null;
	};

	const checkDatesOnChange = () => {
		const pCode = ui.projectSelectBox?.value;
		const tCode = ui.modalTypeCode?.value || null;
		const start = ui.modalStartAt?.value;
		const end = ui.modalEndAt?.value;

		if (!pCode || !start || !end) {
			ui.dateOverlapAlert.style.display = "none";
			return;
		}
		if (start > end) {
			ui.dateOverlapAlert.style.display = "block";
			ui.dateOverlapMsg.textContent = "시작일은 종료일보다 이전이어야 합니다.";
			return;
		}

		const msg = checkOverlap(pCode, start, end, tCode);
		if (msg) {
			ui.dateOverlapAlert.style.display = "block";
			ui.dateOverlapMsg.textContent = "해당 프로젝트의 다른 유형과 기간이 겹칩니다: " + msg;
		} else {
			ui.dateOverlapAlert.style.display = "none";
		}
	};

	ui.modalStartAt?.addEventListener("change", checkDatesOnChange);
	ui.modalEndAt?.addEventListener("change", checkDatesOnChange);

	// ============================================
	// 유효성 검사 헬퍼
	// ============================================
	const setFieldError = (el, errorId, msg) => {
		el?.classList.add("is-invalid");
		const errEl = document.getElementById(errorId);
		if (errEl) { errEl.textContent = msg; errEl.style.display = "block"; }
	};

	const clearFieldError = (el, errorId) => {
		el?.classList.remove("is-invalid");
		const errEl = document.getElementById(errorId);
		if (errEl) { errEl.textContent = ""; errEl.style.display = "none"; }
	};

	const clearAllErrors = () => {
		["modalTypeName", "projectSelectBox", "modalStartAt", "modalEndAt"].forEach(
			(id) => document.getElementById(id)?.classList.remove("is-invalid")
		);
		["typeNameError", "projectError", "startAtError", "endAtError"].forEach((id) => {
			const el = document.getElementById(id);
			if (el) { el.textContent = ""; el.style.display = "none"; }
		});
		ui.dateOverlapAlert.style.display = "none";
	};

	// ============================================
	// 등록 모달 열기
	// ============================================
	const typeFormModalInstance = ui.typeFormModal
		? new bootstrap.Modal(ui.typeFormModal) : null;

	const openRegisterModal = async () => {
		clearAllErrors();
		await fillProjectSelect();

		ui.modalTypeCode.value = "";
		ui.modalTypeName.value = "";
		ui.modalStartAt.value = "";
		ui.modalEndAt.value = "";
		ui.projectSelectBox.value = "";
		ui.modalParTypeText.value = "";
		ui.modalParTypeValue.value = "";
		ui.projectSelectWrap.style.display = "";
		ui.typeFormModalTitle.innerHTML =
			'<i class="fas fa-plus me-2"></i>일감 유형 등록';

		updateTopLevelBadge(); // 처음엔 값 없으니 최상위 뱃지 표시
		typeFormModalInstance?.show();
	};

	// ============================================
	// 수정 모달 열기
	// ============================================
	const openEditModal = async (tr) => {
		clearAllErrors();
		await fillProjectSelect();
		const d = tr.dataset;

		ui.modalTypeCode.value = d.typecode || "";
		ui.modalTypeName.value = d.typename || "";
		ui.modalStartAt.value = d.startat || "";
		ui.modalEndAt.value = d.endat || "";
		ui.projectSelectBox.value = d.projectcode || "";
		ui.modalParTypeText.value = d.partypename || "";
		ui.modalParTypeValue.value = d.partypecode || "";
		ui.typeFormModalTitle.innerHTML =
			'<i class="fas fa-pen me-2"></i>일감 유형 수정';

		updateTopLevelBadge();
		typeFormModalInstance?.show();
	};

	// ============================================
	// 등록/수정 저장
	// ============================================
	const saveType = async () => {
		clearAllErrors();

		const typeCode = ui.modalTypeCode.value || null;
		const typeName = ui.modalTypeName.value.trim();
		const projectCode = ui.projectSelectBox.value;
		const startAt = ui.modalStartAt.value;
		const endAt = ui.modalEndAt.value;
		const parTypeCode = ui.modalParTypeValue.value || null; // null = 최상위

		let hasError = false;

		if (!typeName) {
			setFieldError(ui.modalTypeName, "typeNameError", "유형명을 입력하세요.");
			hasError = true;
		}
		if (!projectCode) {
			setFieldError(ui.projectSelectBox, "projectError", "프로젝트를 선택하세요.");
			hasError = true;
		}
		if (!startAt) {
			setFieldError(ui.modalStartAt, "startAtError", "시작일을 선택하세요.");
			hasError = true;
		}
		if (!endAt) {
			setFieldError(ui.modalEndAt, "endAtError", "종료일을 선택하세요.");
			hasError = true;
		}
		if (startAt && endAt && startAt > endAt) {
			setFieldError(ui.modalEndAt, "endAtError", "종료일은 시작일 이후여야 합니다.");
			hasError = true;
		}
		if (hasError) return;

		const overlapMsg = checkOverlap(projectCode, startAt, endAt, typeCode);
		if (overlapMsg) {
			ui.dateOverlapAlert.style.display = "block";
			ui.dateOverlapMsg.textContent = "해당 프로젝트의 다른 유형과 기간이 겹칩니다: " + overlapMsg;
			return;
		}

		const isEdit = !!typeCode;
		const url = isEdit
			? `/api/issuetype/${typeCode}/update`
			: "/api/issuetype/register";

		const body = {
			typeName,
			startAt,
			endAt,
			parTypeCode: parTypeCode ? parseInt(parTypeCode) : null,
		};
		if (!isEdit) body.projectCode = parseInt(projectCode);

		try {
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
				body: JSON.stringify(body),
			});
			if (res.status === 403) { showToast("권한이 없습니다.", true); return; }

			const data = await res.json();
			if (data.success) {
				showToast(data.message);
				typeFormModalInstance?.hide();
				setTimeout(() => location.reload(), 600);
			} else {
				showToast(data.message || "저장에 실패했습니다.", true);
			}
		} catch (e) {
			showToast("서버 오류가 발생했습니다.", true);
		}
	};

	// ============================================
	// 삭제
	// ============================================
	const deleteType = async (typeCode, typeName) => {
		if (!confirm(`"${typeName}" 유형을 삭제하시겠습니까?`)) return;

		try {
			const res = await fetch(`/api/issuetype/${typeCode}/delete`, {
				method: "POST",
				headers: { "X-Requested-With": "XMLHttpRequest" },
			});
			if (res.status === 403) { showToast("권한이 없습니다.", true); return; }

			const data = await res.json();
			if (data.success) {
				showToast(data.message);
				setTimeout(() => location.reload(), 600);
			} else {
				showToast(data.message || "삭제에 실패했습니다.", true);
			}
		} catch (e) {
			showToast("서버 오류가 발생했습니다.", true);
		}
	};

	// ============================================
	// 이벤트 바인딩
	// ============================================
	ui.btnApply?.addEventListener("click", applyFilters);

	ui.btnReset?.addEventListener("click", () => {
		ui.filterTitle.value = "";
		ui.filterProjectText.value = "";
		ui.filterProjectValue.value = "";
		ui.filterTypeText.value = "";
		ui.filterTypeValue.value = "";
		ui.filterDateType.value = "start";
		ui.filterDateFrom.value = "";
		ui.filterDateTo.value = "";
		rows().forEach((tr) => (tr.dataset.filtered = "0"));
		page = 1;
		render();
	});

	ui.btnOpenProjectModal?.addEventListener("click", openFilterProjectModal);
	ui.btnOpenTypeModal?.addEventListener("click", openFilterTypeModal);
	ui.btnRegister?.addEventListener("click", openRegisterModal);
	ui.btnOpenModalTypeModal?.addEventListener("click", openModalTypeModal);
	ui.btnSaveType?.addEventListener("click", saveType);

	ui.typeFormModal?.addEventListener("hidden.bs.modal", () => {
		ui.projectSelectBox.disabled = false;
	});

	ui.tbody.addEventListener("click", (e) => {
		const editBtn = e.target.closest(".edit-btn");
		const deleteBtn = e.target.closest(".delete-btn");
		const tr = e.target.closest("tr.typeRow");
		if (!tr) return;
		if (editBtn) { openEditModal(tr); return; }
		if (deleteBtn) { deleteType(tr.dataset.typecode, tr.dataset.typename); }
	});

	[ui.filterTitle, ui.filterDateFrom, ui.filterDateTo,
	ui.filterProjectText, ui.filterTypeText].forEach(
		(el) => el?.addEventListener("keydown", (e) => {
			if (e.key === "Enter") e.preventDefault();
		})
	);

	// ============================================
	// 초기 렌더
	// ============================================
	rows().forEach((tr) => (tr.dataset.filtered = "0"));
	render();
})();