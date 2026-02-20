// ============================================
// issuetype.js
// ============================================

(() => {
	const $ = (s) => document.querySelector(s);
	const $$ = (s) => Array.from(document.querySelectorAll(s));

	const pageSize = 10;
	let page = 1;

	// 프로젝트 캐시
	let projectCache = [];

	// 서버 rows에서 초기화한 전체 타입 데이터 (기간 겹침 체크용)
	let allTypes = [];

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
		filterDateType: $("#filterDateType"),
		filterDateFrom: $("#filterDateFrom"),
		filterDateTo: $("#filterDateTo"),

		btnApply: $("#btnApplyFilters"),
		btnReset: $("#btnResetFilters"),
		btnRegister: $("#btnRegisterType"),
		btnOpenProjectModal: $("#btnOpenProjectModal"),

		// 등록/수정 모달
		typeFormModal: $("#typeFormModal"),
		typeFormModalTitle: $("#typeFormModalTitle"),
		modalTypeCode: $("#modalTypeCode"),
		modalTypeName: $("#modalTypeName"),
		//modalProjectText: $("#modalProjectText"),
		modalProjectValue: $("#modalProjectValue"),
		modalStartAt: $("#modalStartAt"),
		modalEndAt: $("#modalEndAt"),
		btnSaveType: $("#btnSaveType"),
		btnModalOpenProject: $("#btnModalOpenProject"),
		projectSelectWrap: $("#projectSelectWrap"),
		dateOverlapAlert: $("#dateOverlapAlert"),
		dateOverlapMsg: $("#dateOverlapMsg"),

		// 필터용 프로젝트 모달
		projectSelectModal: $("#projectSelectModal"),
		projectModalSearch: $("#projectModalSearch"),
		projectModalList: $("#projectModalList"),

		// 폼용 프로젝트 셀렉트
		projectSelectBox: $("#projectSelectBox"),
		projectSelectWrap: $("#projectSelectWrap"),

		// 폼용 프로젝트 모달
		/*projectSelectModal2: $("#projectSelectModal2"),
		projectModalSearch2: $("#projectModalSearch2"),
		projectModalList2: $("#projectModalList2"),*/
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
		const dateType = ui.filterDateType?.value || "start";
		const from = ui.filterDateFrom?.value || "";
		const to = ui.filterDateTo?.value || "";

		rows().forEach((tr) => {
			const d = tr.dataset;
			const typeName = (d.typename || "").toLowerCase();
			const projectCode = (d.projectcode || "").trim();
			const projectName = (d.projectname || "").trim();
			const startAt = (d.startat || "").trim().slice(0, 10);
			const endAt = (d.endat || "").trim().slice(0, 10);

			let ok = true;

			if (titleQ) ok = ok && typeName.includes(titleQ);
			if (pCode)
				ok =
					ok &&
					(projectCode === pCode || (!projectCode && projectName === pName));

			// 기간 기준(시작일/종료일)에 따라 해당 날짜가 from~to 범위인지 체크
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
			toastEl.style.cssText =
				"position:fixed;right:16px;bottom:16px;z-index:1080;";
			toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body" id="commonToastBody"></div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>`;
			document.body.appendChild(toastEl);
		}

		const bodyEl = document.getElementById("commonToastBody");
		if (bodyEl) bodyEl.textContent = message;
		toastEl.className = `toast align-items-center border-0 ${isError ? "text-bg-danger" : "text-bg-dark"
			}`;

		bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2500 }).show();
	};

	// ============================================
	// 프로젝트 모달 리스트 렌더
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
			headers: { Accept: "application/json",'X-Requested-With': 'XMLHttpRequest' },
		});

		if (!res.ok) {
			showToast("프로젝트 목록을 불러오지 못했습니다.", true);
			return false;
		}

		const data = await res.json();
		projectCache = data.map((p) => ({
			code: String(p.projectCode),
			name: p.projectName,
			day: p.createdOn,
		}));
		//console.log(data);

		return true;
	};

	// ============================================
	// 필터용 프로젝트 모달 열기
	// ============================================
	const filterProjectModal = ui.projectSelectModal
		? new bootstrap.Modal(ui.projectSelectModal)
		: null;

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

	// ============================================
	// 폼용 프로젝트 모달 열기
	// ============================================
	// 셀렉트 버전
	// 셀렉트 박스에 프로젝트 목록을 채우는 함수
	const fillProjectSelect = async () => {
		const ok = await ensureProjectCache(); // 기존에 작성하신 캐시 로드 함수 활용
		if (!ok) return;

		// 초기화 (첫 번째 옵션 제외)
		ui.projectSelectBox.innerHTML = '<option value="">-- 프로젝트 선택 --</option>';

		projectCache.forEach(p => {
			const option = document.createElement("option");
			option.value = p.code;
			const dateDisplay = p.day ? `(${p.day.substring(0, 10)})` : "";
			option.textContent = `${p.name || '이름 없음'} ${dateDisplay}`;
			ui.projectSelectBox.appendChild(option);
		});
	};

	/*	const formProjectModal = ui.projectSelectModal2
			? new bootstrap.Modal(ui.projectSelectModal2)
			: null;
	
		const openFormProjectModal = async () => {
			if (!formProjectModal) return;
	
			ui.projectModalSearch2.value = "";
			const ok = await ensureProjectCache();
			if (!ok) return;
	
			renderListButtons(ui.projectModalList2, projectCache, (picked) => {
				//ui.modalProjectText.value = picked.name;
				ui.modalProjectValue.value = picked.code;
				// 프로젝트 변경 시 날짜 및 경고 초기화
				ui.modalStartAt.value = "";
				ui.modalEndAt.value = "";
				ui.dateOverlapAlert.style.display = "none";
				clearFieldError(ui.modalProjectText, "projectError");
				formProjectModal.hide();
			});
	
			formProjectModal.show();
		};
	*/
	// ============================================
	// 필터 프로젝트 모달 검색
	// ============================================
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
	// 폼 프로젝트 모달 검색
	// ============================================
	ui.projectModalSearch2?.addEventListener("input", async () => {
		await ensureProjectCache();
		const q = ui.projectModalSearch2.value.trim().toLowerCase();
		const list = projectCache.filter((p) => p.name.toLowerCase().includes(q));

		renderListButtons(ui.projectModalList2, list, (picked) => {
			ui.modalProjectText.value = picked.name;
			ui.modalProjectValue.value = picked.code;
			ui.modalStartAt.value = "";
			ui.modalEndAt.value = "";
			ui.dateOverlapAlert.style.display = "none";
			formProjectModal?.hide();
		});
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
				t.startAt &&
				t.endAt
		);

		for (const t of targets) {
			if (!(t.endAt < startAt || t.startAt > endAt)) {
				return `${t.startAt} ~ ${t.endAt} 기간과 겹칩니다.`;
			}
		}

		return null;
	};

	// ============================================
	// 날짜 변경 시 실시간 겹침 체크
	// ============================================
	const checkDatesOnChange = () => {
		//const pCode = ui.modalProjectValue?.value;
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
			ui.dateOverlapMsg.textContent =
				"해당 프로젝트의 다른 유형과 기간이 겹칩니다: " + msg;
		} else {
			ui.dateOverlapAlert.style.display = "none";
		}
	};
	ui.projectSelectBox?.addEventListener("change", () => {
		ui.modalStartAt.value = "";
		ui.modalEndAt.value = "";
		ui.dateOverlapAlert.style.display = "none";
		clearFieldError(ui.projectSelectBox, "projectError");
	});
	ui.modalStartAt?.addEventListener("change", checkDatesOnChange);
	ui.modalEndAt?.addEventListener("change", checkDatesOnChange);

	// ============================================
	// 유효성 검사 - 에러 표시
	// ============================================
	const setFieldError = (el, errorId, msg) => {
		el?.classList.add("is-invalid");
		const errEl = document.getElementById(errorId);
		if (errEl) {
			errEl.textContent = msg;
			errEl.style.display = "block";
		}
	};

	// ============================================
	// 유효성 검사 - 에러 초기화
	// ============================================
	const clearFieldError = (el, errorId) => {
		el?.classList.remove("is-invalid");
		const errEl = document.getElementById(errorId);
		if (errEl) {
			errEl.textContent = "";
			errEl.style.display = "none";
		}
	};

	// ============================================
	// 모달 에러 전체 초기화
	// ============================================
	const clearAllErrors = () => {
		["modalTypeName", "projectSelectBox", "modalStartAt", "modalEndAt"].forEach(
			(id) => document.getElementById(id)?.classList.remove("is-invalid")
		);
		["typeNameError", "projectError", "startAtError", "endAtError"].forEach(
			(id) => {
				const el = document.getElementById(id);
				if (el) {
					el.textContent = "";
					el.style.display = "none";
				}
			}
		);
		ui.dateOverlapAlert.style.display = "none";
	};

	// ============================================
	// 등록 모달 열기
	// ============================================
	const typeFormModalInstance = ui.typeFormModal
		? new bootstrap.Modal(ui.typeFormModal)
		: null;

	const openRegisterModal = async () => {
		clearAllErrors();
		await fillProjectSelect();
		ui.modalTypeCode.value = "";
		ui.modalTypeName.value = "";
		//ui.modalProjectText.value = "";
		//ui.modalProjectValue.value = "";
		ui.modalStartAt.value = "";
		ui.modalEndAt.value = "";
		ui.projectSelectBox.value = ""; // 셀렉트 박스 초기화
		ui.typeFormModalTitle.innerHTML =
			'<i class="fas fa-plus me-2"></i>일감 유형 등록';

		// 등록 시 프로젝트 선택 활성화
		//ui.btnModalOpenProject.style.display = "";
		ui.projectSelectWrap.style.display = "";

		typeFormModalInstance?.show();
	};

	// ============================================
	// 수정 모달 열기
	// ============================================
	const openEditModal = async (tr) => {
		clearAllErrors();
		await fillProjectSelect();
		const d = tr.dataset;

		ui.modalTypeCode.value = d.typecode;
		ui.modalTypeName.value = d.typename || "";
		//ui.modalProjectText.value = d.projectname || "";
		//ui.modalProjectValue.value = d.projectcode || "";
		ui.modalStartAt.value = d.startat || "";
		ui.modalEndAt.value = d.endat || "";
		ui.projectSelectBox.value = d.projectcode || "";
		ui.typeFormModalTitle.innerHTML =
			'<i class="fas fa-pen me-2"></i>일감 유형 수정';

		// 수정 시 프로젝트 고정
		//ui.btnModalOpenProject.style.display = "none";
		typeFormModalInstance?.show();
	};

	// ============================================
	// 등록/수정 저장
	// ============================================
	const saveType = async () => {
		clearAllErrors();

		const typeCode = ui.modalTypeCode.value || null;
		const typeName = ui.modalTypeName.value.trim();
		//	const projectCode = ui.modalProjectValue.value.trim();
		const projectCode = ui.projectSelectBox.value;
		const startAt = ui.modalStartAt.value;
		const endAt = ui.modalEndAt.value;

		let hasError = false;

		if (!typeName) {
			setFieldError(ui.modalTypeName, "typeNameError", "유형명을 입력하세요.");
			hasError = true;
		}
		if (!projectCode) {
			setFieldError(ui.projectSelectBox, "projectError", "프로젝트를 선택하세요.");
			hasError = true;
		}
		/*	if (!typeCode && !projectCode) {
				setFieldError(ui.modalProjectText, "projectError", "프로젝트를 선택하세요.");
				hasError = true;
			}*/
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

		// 저장 전 최종 기간 겹침 체크
		const overlapMsg = checkOverlap(projectCode, startAt, endAt, typeCode);
		if (overlapMsg) {
			ui.dateOverlapAlert.style.display = "block";
			ui.dateOverlapMsg.textContent =
				"해당 프로젝트의 다른 유형과 기간이 겹칩니다: " + overlapMsg;
			return;
		}

		const isEdit = !!typeCode;
		const url = isEdit
			? `/api/issuetype/${typeCode}/update`
			: "/api/issuetype/register";

		const body = { typeName, startAt, endAt };
		if (!isEdit) body.projectCode = parseInt(projectCode);

		try {
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json",'X-Requested-With': 'XMLHttpRequest' },
				body: JSON.stringify(body),
			});
			if (res.status === 403) {
			    showToast('권한이 없습니다.', true);
			    return;
			}
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
	// 삭제 (소프트 딜리트)
	// ============================================
	const deleteType = async (typeCode, typeName) => {
		if (!confirm(`"${typeName}" 유형을 삭제하시겠습니까?`)) return;

		try {
			const res = await fetch(`/api/issuetype/${typeCode}/delete`, {
				method: "POST",
				headers:{'X-Requested-With': 'XMLHttpRequest'},
			});
			if (res.status === 403) {
			    showToast('권한이 없습니다.', true);
			    return;
			}
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
		ui.filterDateType.value = "start";
		ui.filterDateFrom.value = "";
		ui.filterDateTo.value = "";
		rows().forEach((tr) => (tr.dataset.filtered = "0"));
		page = 1;
		render();
	});

	ui.btnOpenProjectModal?.addEventListener("click", openFilterProjectModal);
	ui.btnRegister?.addEventListener("click", openRegisterModal);
	ui.btnModalOpenProject?.addEventListener("click", openFormProjectModal);
	ui.btnSaveType?.addEventListener("click", saveType);
	ui.typeFormModal?.addEventListener("hidden.bs.modal", () => {
		ui.projectSelectBox.disabled = false;
	});
	// 테이블 수정/삭제 버튼 이벤트 (이벤트 위임)
	ui.tbody.addEventListener("click", (e) => {
		const editBtn = e.target.closest(".edit-btn");
		const deleteBtn = e.target.closest(".delete-btn");
		const tr = e.target.closest("tr.typeRow");

		if (!tr) return;

		if (editBtn) {
			openEditModal(tr);
			return;
		}
		if (deleteBtn) {
			deleteType(tr.dataset.typecode, tr.dataset.typename);
		}
	});

	// Enter 키 페이지 이동 방지
	[ui.filterTitle, ui.filterDateFrom, ui.filterDateTo, ui.filterProjectText].forEach(
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