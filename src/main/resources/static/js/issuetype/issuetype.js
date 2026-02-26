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

	// flatpickr 인스턴스
	let fpStart = null;
	let fpEnd = null;

	// ============================================
	// UI 요소
	// ============================================
	const ui = {
		tbody: $("#typeTbody"),
		pagination: $("#typePagination"),
		pageInfo: $("#issueTypePageInfo"),

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

		btnRegister: $("#btnRegisterType"),

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

		modalParTypeText: $("#modalParTypeText"),
		modalParTypeValue: $("#modalParTypeValue"),
		btnOpenModalTypeModal: $("#btnOpenModalTypeModal"),
		btnClearModalType: $("#btnClearModalType"),
		topLevelBadge: $("#topLevelBadge"),

		projectSelectModal: $("#projectSelectModal"),
		projectModalSearch: $("#projectModalSearch"),
		projectModalList: $("#projectModalList"),

		typeSelectModal: $("#typeSelectModal"),
		typeModalSearch: $("#typeModalSearch"),
		typeModalTree: $("#typeModalTree"),

		modalTypeSelectModal: $("#modalTypeSelectModal"),
		modalTypeModalSearch: $("#modalTypeModalSearch"),
		modalTypeModalTree: $("#modalTypeModalTree"),

		issueListModal: $("#issueListModal"),
		modalIssueTbody: $("#modalIssueTbody"),
		infoProjectBadge: $("#infoProjectBadge"),
		infoTypePath: $("#infoTypePath"),
	};

	if (!ui.tbody) return;

	// ============================================
	// flatpickr 로드 여부
	// ============================================
	const isFlatpickrLoaded = () => typeof flatpickr !== "undefined";

	// ============================================
	// 전체 타입 데이터 초기화
	// ============================================
	const initAllTypes = () => {
		allTypes = [];
		$$("tr.typeRow").forEach((tr) => {
			const d = tr.dataset;
			allTypes.push({
				typeCode: parseInt(d.typecode),
				projectCode: parseInt(d.projectcode),
				parTypeCode: d.partypecode ? parseInt(d.partypecode) : null,
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
	// 날짜 유틸
	// ============================================
	const parseDate = (s) => s ? new Date(s + "T00:00:00") : null;
	const fmtDate = (d) => {
		if (!d) return "";
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const dd = String(d.getDate()).padStart(2, "0");
		return `${y}-${m}-${dd}`;
	};

	// ============================================
	// 사용 중인 날짜 목록 생성
	// (rangeStart~rangeEnd 사이에서 usedRanges와 겹치는 날짜)
	// ============================================
	const buildDisabledDates = (rangeStart, rangeEnd, usedRanges) => {
		const disabled = [];
		if (!rangeStart || !rangeEnd) return disabled;

		const s = parseDate(rangeStart);
		const e = parseDate(rangeEnd);

		usedRanges.forEach((r) => {
			const rs = parseDate(r.startAt);
			const re = parseDate(r.endAt);
			if (!rs || !re) return;

			const overlapStart = rs > s ? rs : s;
			const overlapEnd = re < e ? re : e;

			if (overlapStart <= overlapEnd) {
				const cur = new Date(overlapStart);
				while (cur <= overlapEnd) {
					disabled.push(fmtDate(new Date(cur)));
					cur.setDate(cur.getDate() + 1);
				}
			}
		});

		return disabled;
	};

	// ============================================
	// flatpickr 초기화
	// ============================================
	const initFlatpickr = ({ minDate = null, maxDate = null, disabled = [], startVal = null, endVal = null } = {}) => {
		// 기존 인스턴스 제거
		if (fpStart) { fpStart.destroy(); fpStart = null; }
		if (fpEnd) { fpEnd.destroy(); fpEnd = null; }

		if (!isFlatpickrLoaded()) {
			// flatpickr 없으면 네이티브 min/max 로 대체
			if (minDate) { ui.modalStartAt.min = minDate; ui.modalEndAt.min = minDate; }
			else { ui.modalStartAt.removeAttribute("min"); ui.modalEndAt.removeAttribute("min"); }
			if (maxDate) { ui.modalStartAt.max = maxDate; ui.modalEndAt.max = maxDate; }
			else { ui.modalStartAt.removeAttribute("max"); ui.modalEndAt.removeAttribute("max"); }
			return;
		}

		const commonOpts = {
			dateFormat: "Y-m-d",
			locale: "ko",
			minDate: minDate || null,
			maxDate: maxDate || null,
			disable: disabled,
			allowInput: false,
			disableMobile: true,
		};

		fpStart = flatpickr(ui.modalStartAt, {
			...commonOpts,
			defaultDate: startVal || null,
			onChange([selectedDate]) {
				if (fpEnd) {
					fpEnd.set("minDate", selectedDate || minDate || null);
					if (fpEnd.selectedDates[0] && fpEnd.selectedDates[0] < selectedDate) {
						fpEnd.clear();
						ui.modalEndAt.value = "";
					}
				}
				checkDatesOnChange();
			},
		});

		fpEnd = flatpickr(ui.modalEndAt, {
			...commonOpts,
			minDate: startVal ? parseDate(startVal) : (minDate || null),
			defaultDate: endVal || null,
			onChange() { checkDatesOnChange(); },
		});
	};

	// ============================================
	// 날짜 범위 안내 메시지
	// ============================================
	const updateDateRangeHint = (msg) => {
		const hintEl = document.getElementById("dateRangeHint");
		const hintMsgEl = document.getElementById("dateRangeHintMsg");
		if (!hintEl) return;
		if (msg) {
			hintMsgEl.textContent = msg;
			hintEl.style.display = "block";
		} else {
			hintEl.style.display = "none";
			hintMsgEl.textContent = "";
		}
	};

	// ============================================
	// 현재 선택 상태에 따라 달력 제한 재계산 & 적용
	// ============================================
	const refreshDatePicker = () => {
		const projectCode = ui.projectSelectBox?.value ? parseInt(ui.projectSelectBox.value) : null;
		const parTypeCode = ui.modalParTypeValue?.value ? parseInt(ui.modalParTypeValue.value) : null;
		const editTypeCode = ui.modalTypeCode?.value ? parseInt(ui.modalTypeCode.value) : null;
		const currentStart = ui.modalStartAt?.value || null;
		const currentEnd = ui.modalEndAt?.value || null;

		if (!projectCode) {
			// 프로젝트 미선택 → 제한 없음
			updateDateRangeHint(null);
			initFlatpickr({ startVal: currentStart, endVal: currentEnd });
			return;
		}

		if (!parTypeCode) {
			// ─ 최상위 유형 ─
			// 같은 프로젝트의 다른 최상위 유형들이 사용 중인 날짜 disabled
			const usedRanges = allTypes.filter(
				(t) => t.projectCode === projectCode && t.parTypeCode === null && t.typeCode !== editTypeCode
			);
			const disabledDates = [];
			usedRanges.forEach((r) => {
				if (!r.startAt || !r.endAt) return;
				const s = parseDate(r.startAt);
				const e = parseDate(r.endAt);
				const cur = new Date(s);
				while (cur <= e) { disabledDates.push(fmtDate(new Date(cur))); cur.setDate(cur.getDate() + 1); }
			});

			updateDateRangeHint(
				disabledDates.length > 0
					? "다른 최상위 유형과 겹치는 날짜는 선택할 수 없습니다."
					: null
			);
			initFlatpickr({ disabled: disabledDates, startVal: currentStart, endVal: currentEnd });

		} else {
			// ─ 하위 유형 ─
			// 부모 유형의 기간 안에서만 선택 가능
			const parentType = allTypes.find((t) => t.typeCode === parTypeCode && t.projectCode === projectCode);
			if (!parentType) {
				updateDateRangeHint(null);
				initFlatpickr({ startVal: currentStart, endVal: currentEnd });
				return;
			}

			const parentStart = parentType.startAt;
			const parentEnd = parentType.endAt;

			// 같은 부모를 가진 형제 유형들이 사용 중인 날짜 disabled
			const siblingRanges = allTypes.filter(
				(t) => t.projectCode === projectCode && t.parTypeCode === parTypeCode && t.typeCode !== editTypeCode
			);
			const disabledDates = buildDisabledDates(parentStart, parentEnd, siblingRanges);

			updateDateRangeHint(
				`상위 유형 "${ui.modalParTypeText.value}" 의 기간 내에서만 선택할 수 있습니다. (${parentStart} ~ ${parentEnd})`
			);
			initFlatpickr({
				minDate: parentStart,
				maxDate: parentEnd,
				disabled: disabledDates,
				startVal: currentStart,
				endVal: currentEnd,
			});
		}
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
			btn.type = "button"; btn.className = "page-link"; btn.textContent = label;
			btn.addEventListener("click", () => { if (disabled) return; page = nextPage; render(); });
			li.appendChild(btn);
			ui.pagination.appendChild(li);
		};

		addBtn("이전", Math.max(1, page - 1), page === 1, false);
		for (let p = 1; p <= totalPages; p++) addBtn(String(p), p, false, p === page);
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
			const typeCode = (d.typecode || "").trim();           // 현재 행의 유형 코드
			const parTypeCode = (d.partypecode || "").trim();     // 현재 행의 상위 유형 코드 (추가)FF
			const startAt = (d.startat || "").trim().slice(0, 10);
			const endAt = (d.endat || "").trim().slice(0, 10);

			let ok = true;
			if (titleQ) ok = ok && typeName.includes(titleQ);
			if (pCode) ok = ok && (projectCode === pCode || (!projectCode && projectName === pName));
			// 선택한 코드(tCode)가 현재 행의 코드와 같거나, 현재 행의 부모 코드와 같으면 통과
			if (tCode) {
				if (!(typeCode === tCode || parTypeCode === tCode)) {
					ok = false;
				}
			}
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
		let toastEl = document.getElementById("commonToast");
		if (!toastEl) {
			toastEl = document.createElement("div");
			toastEl.id = "commonToast";
			toastEl.setAttribute("role", "alert");
			toastEl.setAttribute("aria-live", "assertive");
			toastEl.setAttribute("aria-atomic", "true");
			toastEl.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:9999;";
			toastEl.innerHTML = `<div class="d-flex"><div class="toast-body" id="commonToastBody"></div>
				<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
			document.body.appendChild(toastEl);
		}
		const bodyEl = document.getElementById("commonToastBody");
		if (bodyEl) bodyEl.textContent = message;
		toastEl.className = `toast align-items-center border-0 ${isError ? "text-bg-danger" : "text-bg-dark"}`;
		bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2500 }).show();
	};

	// ============================================
	// 리스트 버튼 렌더
	// ============================================
	const renderListButtons = (listEl, items, onPick) => {
		if (!listEl) return;
		listEl.innerHTML = "";
		if (!items.length) { listEl.innerHTML = '<div class="text-muted p-2">결과가 없습니다.</div>'; return; }
		items.forEach((it) => {
			const btn = document.createElement("button");
			btn.type = "button"; btn.className = "list-group-item list-group-item-action";
			btn.textContent = it.name;
			btn.addEventListener("click", () => onPick(it));
			listEl.appendChild(btn);
		});
	};

	// ============================================
	// 캐시 로드
	// ============================================
	const ensureProjectCache = async () => {
		if (projectCache.length > 0) return true;
		const res = await fetch("/api/projects/modal", { headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" } });
		if (!res.ok) { showToast("프로젝트 목록을 불러오지 못했습니다.", true); return false; }
		const data = await res.json();
		projectCache = data.map((p) => ({ code: String(p.projectCode), name: p.projectName, day: p.createdOn }));
		return true;
	};

	const ensureTypeCache = async () => {
		if (typeCache.length > 0) return true;
		const res = await fetch("/api/types/modal", { headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" } });
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
			code: String(type.typeCode), name: type.typeName, projectCode: pCode, projectName: pName,
			children: (type.children || []).map((c) => convertType(c, pCode, pName)),
		});
		(serverData || []).forEach((type) => {
			const pCode = String(type.projectCode);
			const pName = type.projectName || "기타 프로젝트";
			if (filterProjectCode && pCode !== String(filterProjectCode)) return;
			if (!projectMap[pCode]) projectMap[pCode] = { code: pCode, name: pName, children: [] };
			if (!type.parTypeCode) projectMap[pCode].children.push(convertType(type, pCode, pName));
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
			div.className = "type-item"; div.textContent = type.name;
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
			projHeader.className = "type-project-header"; projHeader.textContent = p.name;
			const contentWrapper = document.createElement("div");
			contentWrapper.className = "type-project-content"; contentWrapper.style.display = "none";
			projHeader.addEventListener("click", () => {
				const isOpen = contentWrapper.style.display === "block";
				document.querySelectorAll(".type-project-content").forEach((el) => (el.style.display = "none"));
				document.querySelectorAll(".type-project-header").forEach((el) => el.classList.remove("active"));
				if (!isOpen) { contentWrapper.style.display = "block"; projHeader.classList.add("active"); }
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
	// 유형 트리 검색
	// ============================================
	const searchInTypeTree = (nodes, q) =>
		(nodes || []).map((node) => {
			const hit = (node.name || "").toLowerCase().includes(q);
			const children = searchInTypeTree(node.children || [], q);
			if (hit || children.length > 0) return { ...node, children };
			return null;
		}).filter(Boolean);

	// ============================================
	// 필터 - 프로젝트 모달
	// ============================================
	const filterProjectModal = ui.projectSelectModal ? new bootstrap.Modal(ui.projectSelectModal) : null;

	const openFilterProjectModal = async () => {
		if (!filterProjectModal) return;
		ui.projectModalSearch.value = "";
		if (!await ensureProjectCache()) return;
		renderListButtons(ui.projectModalList, projectCache, (picked) => {
			ui.filterProjectText.value = picked.name; ui.filterProjectValue.value = picked.code;
			filterProjectModal.hide();
		});
		filterProjectModal.show();
	};

	ui.projectModalSearch?.addEventListener("input", async () => {
		await ensureProjectCache();
		const q = ui.projectModalSearch.value.trim().toLowerCase();
		renderListButtons(ui.projectModalList, projectCache.filter((p) => p.name.toLowerCase().includes(q)), (picked) => {
			ui.filterProjectText.value = picked.name; ui.filterProjectValue.value = picked.code;
			filterProjectModal?.hide();
		});
	});

	// ============================================
	// 필터 - 유형 모달
	// ============================================
	const filterTypeModal = ui.typeSelectModal ? new bootstrap.Modal(ui.typeSelectModal) : null;

	const openFilterTypeModal = async () => {
		if (!filterTypeModal) return;
		if (ui.typeModalSearch) ui.typeModalSearch.value = "";
		if (!await ensureTypeCache()) return;
		const pCode = (ui.filterProjectValue?.value || "").trim();
		renderTypeTree(buildTypeTreeForJS(typeCache, pCode || null), ui.typeModalTree, (picked) => {
			ui.filterTypeText.value = picked.name; ui.filterTypeValue.value = picked.code;
			filterTypeModal.hide();
		});
		filterTypeModal.show();
	};

	ui.typeModalSearch?.addEventListener("input", async () => {
		await ensureTypeCache();
		const q = ui.typeModalSearch.value.trim().toLowerCase();
		const pCode = (ui.filterProjectValue?.value || "").trim();
		const treeData = buildTypeTreeForJS(typeCache, pCode || null);
		const filtered = q ? treeData.map((proj) => ({ ...proj, children: searchInTypeTree(proj.children || [], q) })).filter((p) => p.children.length > 0) : treeData;
		renderTypeTree(filtered, ui.typeModalTree, (picked) => {
			ui.filterTypeText.value = picked.name; ui.filterTypeValue.value = picked.code;
			filterTypeModal?.hide();
		});
	});

	// ============================================
	// 등록/수정 모달 - 상위유형 모달
	// ============================================
	const modalTypeModalInstance = ui.modalTypeSelectModal ? new bootstrap.Modal(ui.modalTypeSelectModal) : null;

	const filterSelfFromTree = (nodes, excludeCode) => {
		if (!excludeCode) return nodes;
		return nodes
			.filter((n) => String(n.code) !== String(excludeCode))
			.map((n) => ({ ...n, children: filterSelfFromTree(n.children || [], excludeCode) }));
	};

	const openModalTypeModal = async () => {
		if (!modalTypeModalInstance) return;
		if (ui.modalTypeModalSearch) ui.modalTypeModalSearch.value = "";
		if (!await ensureTypeCache()) return;

		const pCode = (ui.projectSelectBox?.value || "").trim();
		const editCode = (ui.modalTypeCode?.value || "").trim();
		const safeTree = buildTypeTreeForJS(typeCache, pCode || null)
			.map((p) => ({ ...p, children: filterSelfFromTree(p.children || [], editCode) }));

		renderTypeTree(safeTree, ui.modalTypeModalTree, (picked) => {
			ui.modalParTypeText.value = picked.name;
			ui.modalParTypeValue.value = picked.code;
			// 상위유형 변경 → 날짜 초기화 후 달력 재설정
			ui.modalStartAt.value = "";
			ui.modalEndAt.value = "";
			if (fpStart) fpStart.clear();
			if (fpEnd) fpEnd.clear();
			updateTopLevelBadge();
			refreshDatePicker();
			modalTypeModalInstance.hide();
		});
		modalTypeModalInstance.show();
	};

	ui.modalTypeModalSearch?.addEventListener("input", async () => {
		await ensureTypeCache();
		const q = ui.modalTypeModalSearch.value.trim().toLowerCase();
		const pCode = (ui.projectSelectBox?.value || "").trim();
		const editCode = (ui.modalTypeCode?.value || "").trim();
		const safeTree = buildTypeTreeForJS(typeCache, pCode || null)
			.map((p) => ({ ...p, children: filterSelfFromTree(p.children || [], editCode) }));
		const filtered = q ? safeTree.map((proj) => ({ ...proj, children: searchInTypeTree(proj.children || [], q) })).filter((p) => p.children.length > 0) : safeTree;
		renderTypeTree(filtered, ui.modalTypeModalTree, (picked) => {
			ui.modalParTypeText.value = picked.name;
			ui.modalParTypeValue.value = picked.code;
			ui.modalStartAt.value = ""; ui.modalEndAt.value = "";
			if (fpStart) fpStart.clear(); if (fpEnd) fpEnd.clear();
			updateTopLevelBadge();
			refreshDatePicker();
			modalTypeModalInstance?.hide();
		});
	});

	// 상위유형 초기화
	ui.btnClearModalType?.addEventListener("click", () => {
		ui.modalParTypeText.value = "";
		ui.modalParTypeValue.value = "";
		ui.modalStartAt.value = "";
		ui.modalEndAt.value = "";
		if (fpStart) fpStart.clear();
		if (fpEnd) fpEnd.clear();
		updateTopLevelBadge();
		refreshDatePicker();
	});

	// ============================================
	// 폼용 프로젝트 셀렉트
	// ============================================
	const fillProjectSelect = async () => {
		if (!await ensureProjectCache()) return;
		ui.projectSelectBox.innerHTML = '<option value="">-- 프로젝트 선택 --</option>';
		projectCache.forEach((p) => {
			const option = document.createElement("option");
			option.value = p.code;
			option.textContent = `${p.name || "이름 없음"} ${p.day ? "(" + p.day.substring(0, 10) + ")" : ""}`;
			ui.projectSelectBox.appendChild(option);
		});
	};

	// 프로젝트 변경 → 모두 초기화 + 달력 재설정
	ui.projectSelectBox?.addEventListener("change", () => {
		ui.modalStartAt.value = "";
		ui.modalEndAt.value = "";
		ui.modalParTypeText.value = "";
		ui.modalParTypeValue.value = "";
		ui.dateOverlapAlert.style.display = "none";
		if (fpStart) fpStart.clear();
		if (fpEnd) fpEnd.clear();
		typeCache = [];
		updateTopLevelBadge();
		refreshDatePicker();
		clearFieldError(ui.projectSelectBox, "projectError");
	});

	// ============================================
	// 기간 겹침 체크 (저장 전 최종 검증)
	// - 최상위 유형: 같은 프로젝트의 다른 최상위 유형과만 비교
	// - 하위 유형:   같은 부모를 가진 형제 유형과만 비교
	// ============================================
	const checkOverlap = (projectCode, startAt, endAt, excludeTypeCode = null, parTypeCode = null) => {
		if (!startAt || !endAt) return null;

		const pCode = parseInt(projectCode);
		const exCode = excludeTypeCode ? parseInt(excludeTypeCode) : null;

		let targets;
		if (!parTypeCode) {
			// 최상위 유형: 같은 프로젝트의 다른 최상위 유형들과 비교
			targets = allTypes.filter(
				(t) =>
					t.projectCode === pCode &&
					t.parTypeCode === null &&
					(exCode === null || t.typeCode !== exCode) &&
					t.startAt && t.endAt
			);
		} else {
			// 하위 유형: 같은 부모의 형제 유형들과만 비교
			const parCode = parseInt(parTypeCode);
			targets = allTypes.filter(
				(t) =>
					t.projectCode === pCode &&
					t.parTypeCode === parCode &&
					(exCode === null || t.typeCode !== exCode) &&
					t.startAt && t.endAt
			);
		}

		for (const t of targets) {
			if (!(t.endAt < startAt || t.startAt > endAt))
				return `${t.startAt} ~ ${t.endAt} 기간과 겹칩니다.`;
		}
		return null;
	};

	const checkDatesOnChange = () => {
		const pCode = ui.projectSelectBox?.value;
		const tCode = ui.modalTypeCode?.value || null;
		const parTCode = ui.modalParTypeValue?.value || null; // ← 상위유형 전달
		const start = ui.modalStartAt?.value;
		const end = ui.modalEndAt?.value;

		if (!pCode || !start || !end) { ui.dateOverlapAlert.style.display = "none"; return; }

		if (start > end) {
			ui.dateOverlapAlert.style.display = "block";
			ui.dateOverlapMsg.textContent = "시작일은 종료일보다 이전이어야 합니다.";
			return;
		}

		const msg = checkOverlap(pCode, start, end, tCode, parTCode);
		if (msg) {
			ui.dateOverlapAlert.style.display = "block";
			ui.dateOverlapMsg.textContent = "기간이 겹칩니다: " + msg;
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
		["modalTypeName", "projectSelectBox", "modalStartAt", "modalEndAt"]
			.forEach((id) => document.getElementById(id)?.classList.remove("is-invalid"));
		["typeNameError", "projectError", "startAtError", "endAtError"].forEach((id) => {
			const el = document.getElementById(id);
			if (el) { el.textContent = ""; el.style.display = "none"; }
		});
		ui.dateOverlapAlert.style.display = "none";
	};

	// ============================================
	// 등록 모달 열기
	// ============================================
	const typeFormModalInstance = ui.typeFormModal ? new bootstrap.Modal(ui.typeFormModal) : null;

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
		ui.typeFormModalTitle.innerHTML = '<i class="fas fa-plus me-2"></i>일감 유형 등록';
		updateTopLevelBadge();
		typeFormModalInstance?.show();
		// DOM 렌더 후 flatpickr 초기화 (제한 없음)
		setTimeout(() => initFlatpickr({}), 150);
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
		ui.typeFormModalTitle.innerHTML = '<i class="fas fa-pen me-2"></i>일감 유형 수정';
		updateTopLevelBadge();
		typeFormModalInstance?.show();
		// DOM 렌더 후 기존 값 유지한 채로 달력 제한 적용
		setTimeout(() => refreshDatePicker(), 150);
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
		const parTypeCode = ui.modalParTypeValue.value || null;

		let hasError = false;
		if (!typeName) { setFieldError(ui.modalTypeName, "typeNameError", "유형명을 입력하세요."); hasError = true; }
		if (!projectCode) { setFieldError(ui.projectSelectBox, "projectError", "프로젝트를 선택하세요."); hasError = true; }
		if (!startAt) { setFieldError(ui.modalStartAt, "startAtError", "시작일을 선택하세요."); hasError = true; }
		if (!endAt) { setFieldError(ui.modalEndAt, "endAtError", "종료일을 선택하세요."); hasError = true; }
		if (startAt && endAt && startAt > endAt) {
			setFieldError(ui.modalEndAt, "endAtError", "종료일은 시작일 이후여야 합니다.");
			hasError = true;
		}
		if (hasError) return;

		const overlapMsg = checkOverlap(projectCode, startAt, endAt, typeCode, parTypeCode);
		if (overlapMsg) {
			ui.dateOverlapAlert.style.display = "block";
			ui.dateOverlapMsg.textContent = "기간이 겹칩니다: " + overlapMsg;
			return;
		}

		const isEdit = !!typeCode;
		const url = isEdit ? `/api/issuetype/${typeCode}/update` : "/api/issuetype/register";
		const body = {
			typeName,
			startAt,
			endAt,
			projectCode: parseInt(projectCode),
			parTypeCode: parTypeCode ? parseInt(parTypeCode) : null,
		};

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
		} catch (e) { showToast("서버 오류가 발생했습니다.", true); }
	};

	// ============================================
	// 삭제
	// ============================================
	const deleteType = async (typeCode, typeName) => {
		if (!confirm(`"${typeName}" 유형을 삭제하시겠습니까?`)) return;
		try {
			const res = await fetch(`/api/issuetype/${typeCode}/delete`, { method: "POST", headers: { "X-Requested-With": "XMLHttpRequest" } });
			if (res.status === 403) { showToast("권한이 없습니다.", true); return; }
			const data = await res.json();
			if (data.success) { showToast(data.message); setTimeout(() => location.reload(), 600); }
			else showToast(data.message || "삭제에 실패했습니다.", true);
		} catch (e) { showToast("서버 오류가 발생했습니다.", true); }
	};

	// 모달 닫힐 때 flatpickr 정리
	ui.typeFormModal?.addEventListener("hidden.bs.modal", () => {
		ui.projectSelectBox.disabled = false;
		if (fpStart) { fpStart.destroy(); fpStart = null; }
		if (fpEnd) { fpEnd.destroy(); fpEnd = null; }
	});
	// ============================================
	// 일감 리스트
	// ============================================
	const loadIssueList = async (typeCode) => {
		// 로딩 표시
		ui.modalIssueTbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>데이터를 불러오는 중...</td></tr>';

		try {
			const res = await fetch(`/api/issuetype/${typeCode}/issueType`);
			if (!res.ok) throw new Error("Network response was not ok");

			const data = await res.json();
			ui.modalIssueTbody.innerHTML = ""; // 초기화

			if (data && data.length > 0) {
				data.forEach((issue, index) => {
					// 우선순위별 뱃지 색상 (필요에 따라 조건 수정)
					let badgeColor = '#6c757d'; // 기본색 (회색)
					if (issue.codeName === '긴급') badgeColor = '#D97B7B';
					else if (issue.codeName === '높음') badgeColor = '#FFB266';
					else if (issue.codeName === '보통') badgeColor = '#5AB2FF';
					else if (issue.codeName === '낮음') badgeColor = '#69B87C';
					const row = `
	                    <tr>
	                        <td class="text-center">${index + 1}</td>
	                        <td class="fw-bold">${issue.title}</td>
							<td class="text-center">
								<span class="badge" style="background-color: ${badgeColor}; color: #fff;">${issue.codeName}</span>
							</td>
							<td> <button type="button"  class="btn btn-primary issue-info-btn" data-issue-code="${issue.issueCode}">
								<i class="fa-solid fa-magnifying-glass"></i> 상세 </button> </td>
	                        <td class="text-center">${issue.name || '<span class="text-muted">미지정</span>'}</td>
	                        <td>
	                            <div class="d-flex align-items-center gap-2">
	                                <div class="progress flex-grow-1" style="height: 8px;">
	                                    <div class="progress-bar bg-success" role="progressbar" style="width: ${issue.progress}%"></div>
	                                </div>
	                                <span class="small fw-bold" style="min-width: 35px;">${issue.progress}%</span>
	                            </div>
	                        </td>
	                    </tr>`;
					ui.modalIssueTbody.insertAdjacentHTML('beforeend', row);
				});
			} else {
				ui.modalIssueTbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-muted">등록된 일감이 없습니다.</td></tr>';
			}
		} catch (e) {
			console.error(e);
			ui.modalIssueTbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger">데이터 로드 중 오류가 발생했습니다.</td></tr>';
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

	ui.tbody.addEventListener("click", (e) => {
		const editBtn = e.target.closest(".edit-btn"); // 수정
		const deleteBtn = e.target.closest(".delete-btn"); // 삭제
		const listBtn = e.target.closest(".issueList-btn"); // 모달 일감 리스트
		const tr = e.target.closest("tr.typeRow");

		if (!tr) return;
		if (editBtn) { openEditModal(tr); return; }
		if (deleteBtn) { deleteType(tr.dataset.typecode, tr.dataset.typename); }
		if (listBtn) {
			const d = tr.dataset;
			// 1. 행 데이터 모달 상단 정보 세팅
			ui.infoProjectBadge.textContent = d.projectname + " / ";
			ui.infoTypePath.textContent = d.typename;

			// 2. 모달 열기
			const modalInstance = bootstrap.Modal.getOrCreateInstance(ui.issueListModal);
			modalInstance.show();

			// 3. API 데이터 호출
			loadIssueList(d.typecode);
		}

	});
	ui.modalIssueTbody.addEventListener("click", (e) => {
		const detailBtn = e.target.closest(".issue-info-btn"); // 일감 상세 이동
		if (detailBtn) {
			const issueCode = detailBtn.dataset.issueCode;
			if (issueCode) {
				location.href = `/issueInfo?issueCode=${encodeURIComponent(issueCode)}`;
			}
		}
	});

	[ui.filterTitle, ui.filterDateFrom, ui.filterDateTo, ui.filterProjectText, ui.filterTypeText]
		.forEach((el) => el?.addEventListener("keydown", (e) => { if (e.key === "Enter") e.preventDefault(); }));

	// ============================================
	// 초기 렌더
	// ============================================
	rows().forEach((tr) => (tr.dataset.filtered = "0"));
	render();
})();