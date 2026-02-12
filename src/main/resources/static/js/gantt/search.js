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
			rowType: (d.rowType || "").trim(),
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
			parentTypeCode: (d.parentTypeCode || "").trim(),
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
		if (!res.ok) {
			showToast("유형 목록을 불러오지 못했습니다.");
			return false;
		}

		// 서버에서 받은 원본 데이터를 그대로 저장 (이미 트리 구조)
		typeCache = await res.json();
		return true;
	};

	// -------------------------
	// 필터 적용
	// -------------------------
	// 유형의 모든 하위 코드를 재귀적으로 수집하는 함수
	const getAllChildTypeCodes = (typeCode, typeList) => {
		const codes = new Set([typeCode]);

		const findChildren = (parentCode) => {
			typeList.forEach(type => {
				if (type.parTypeCode && String(type.parTypeCode) === String(parentCode)) {
					const childCode = String(type.typeCode);
					codes.add(childCode);
					findChildren(childCode); // 재귀적으로 하위 유형 찾기
				}
			});
		};

		findChildren(typeCode);
		return codes;
	};

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

		// 선택한 유형의 모든 하위 유형 코드 수집
		const typeCodesSet = tCode ? getAllChildTypeCodes(tCode, typeCache) : new Set();

		const issueMatches = new Set(); // 매칭된 ISSUE 코드 저장
		const typeMatches = new Set(); // 매칭된 TYPE 코드 저장

		rows().forEach((tr) => {
			const d = getRow(tr);
			let ok = true;

			// ISSUE 행 필터링
			if (d.rowType === "ISSUE") {
				if (pCode) ok = ok && (d.projectCode ? d.projectCode === pCode : d.project === pName);
				if (title) ok = ok && (d.title || "").toLowerCase().includes(title);
				if (tCode) ok = ok && typeCodesSet.has(d.typeCode);
				if (sLabel) ok = ok && d.status === sLabel;
				if (prLabel) ok = ok && d.priority === prLabel;
				if (aCode) ok = ok && d.assigneeCode === aCode;
				if (cCode) ok = ok && d.creatorCode === cCode;
				ok = ok && sameDay(d.created, created);
				ok = ok && sameDay(d.due, due);

				if (ok) {
					issueMatches.add(d.issueCode);
				}
			}
			// TYPE 행 필터링 - 유형 필터가 적용된 경우 해당 유형과 하위 유형만 표시
			else if (d.rowType === "TYPE") {
				if (pCode) ok = ok && d.projectCode === pCode;
				if (tCode) ok = ok && typeCodesSet.has(d.typeCode);

				if (ok) {
					typeMatches.add(d.typeCode);
				}
			}
			// PROJECT 행 필터링
			else if (d.rowType === "PROJECT") {
				if (pCode) ok = ok && d.projectCode === pCode;
			}

			tr.dataset.filtered = ok ? "0" : "1";
			tr.style.display = ok ? "" : "none";
		});

		// PROJECT/TYPE 행의 최종 표시 여부 결정
		rows().forEach((tr) => {
			const d = getRow(tr);

			if (d.rowType === "TYPE") {
				// 자신이 매칭되었거나, 하위에 매칭된 ISSUE가 있으면 표시
				const selfMatched = typeMatches.has(d.typeCode);
				const hasChildIssue = rows().some((childTr) => {
					const c = getRow(childTr);
					return c.rowType === "ISSUE" &&
						c.parentTypeCode === d.typeCode &&
						issueMatches.has(c.issueCode);
				});

				const ok = selfMatched || hasChildIssue;
				tr.dataset.filtered = ok ? "0" : "1";
				tr.style.display = ok ? "" : "none";
			}
			else if (d.rowType === "PROJECT") {
				// 하위에 표시할 TYPE이나 ISSUE가 있으면 표시
				const hasVisibleChild = rows().some((childTr) => {
					const c = getRow(childTr);
					return c.projectCode === d.projectCode &&
						(c.rowType === "TYPE" || c.rowType === "ISSUE") &&
						childTr.dataset.filtered === "0";
				});

				const ok = hasVisibleChild;
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

	const renderTypeTree = (items, container) => {
		if (!container) return;
		container.innerHTML = "";

		// 최상위 ul 생성
		const rootUl = document.createElement("ul");
		rootUl.style.listStyleType = "none";
		rootUl.style.paddingLeft = "0";

		items.forEach(proj => {
			const projLi = document.createElement("li");
			projLi.style.marginBottom = "10px";

			const projLabel = document.createElement("div");
			projLabel.textContent = proj.name;
			projLabel.style.fontWeight = "bold";
			projLabel.style.fontSize = "1.1em";
			projLabel.style.color = "#0d6efd";
			projLabel.style.marginBottom = "5px";
			projLi.appendChild(projLabel);

			if (proj.children && proj.children.length > 0) {
				const projUl = document.createElement("ul");
				projUl.style.listStyleType = "none";
				projUl.style.paddingLeft = "20px";

				const appendType = (type) => {
					const li = document.createElement("li");
					li.style.marginTop = "5px";

					const typeLabel = document.createElement("div");
					typeLabel.textContent = type.name;
					typeLabel.style.cursor = "pointer";
					typeLabel.style.padding = "5px 10px";
					typeLabel.style.borderRadius = "4px";
					typeLabel.style.transition = "background-color 0.2s";

					// 호버 효과
					typeLabel.addEventListener("mouseenter", () => {
						typeLabel.style.backgroundColor = "#e7f3ff";
					});
					typeLabel.addEventListener("mouseleave", () => {
						typeLabel.style.backgroundColor = "";
					});

					// 클릭 이벤트
					typeLabel.addEventListener("click", (e) => {
						e.stopPropagation(); // 이벤트 버블링 방지
						ui.typeText.value = type.name;
						ui.typeValue.value = type.code;
						typeModal?.hide();
					});

					li.appendChild(typeLabel);

					// 자식 유형이 있으면 재귀적으로 추가
					if (type.children && type.children.length > 0) {
						const childUl = document.createElement("ul");
						childUl.style.listStyleType = "none";
						childUl.style.paddingLeft = "20px";
						childUl.style.borderLeft = "2px solid #dee2e6";
						childUl.style.marginTop = "5px";

						type.children.forEach(c => {
							childUl.appendChild(appendType(c));
						});
						li.appendChild(childUl);
					}

					return li;
				};

				proj.children.forEach(t => projUl.appendChild(appendType(t)));
				projLi.appendChild(projUl);
			}

			rootUl.appendChild(projLi);
		});

		container.appendChild(rootUl);
	};

	const buildTypeTreeForJS = (serverData) => {
		const projectMap = {};

		// 재귀적으로 유형을 변환하는 함수
		const convertType = (type) => {
			return {
				code: String(type.typeCode),
				name: type.typeName,
				children: (type.children || []).map(child => convertType(child))
			};
		};

		// 서버 데이터를 프로젝트별로 그룹화
		serverData.forEach(type => {
			const pCode = String(type.projectCode);
			const pName = type.projectName || "기타 프로젝트";

			if (!projectMap[pCode]) {
				projectMap[pCode] = {
					code: pCode,
					name: pName,
					children: []
				};
			}

			// 최상위 유형만 추가 (parTypeCode가 null인 것)
			if (!type.parTypeCode) {
				projectMap[pCode].children.push(convertType(type));
			}
		});

		return Object.values(projectMap).filter(p => p.children.length > 0);
	};

	const openTypeModal = async () => {
		if (!typeModal) return;
		ui.typeModalSearch && (ui.typeModalSearch.value = "");
		const ok = await ensureTypeCache();
		if (!ok) return;

		// typeCache를 트리 구조로 변환
		const treeData = buildTypeTreeForJS(typeCache);
		renderTypeTree(treeData, document.getElementById("typeModalTree"));
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
		const ok = await ensureTypeCache();
		if (!ok) return;

		const q = ui.typeModalSearch.value.trim().toLowerCase();
		let filteredTypes;

		if (q) {
			// 검색어가 있을 때: 재귀적으로 검색
			const searchInTree = (types) => {
				const results = [];
				types.forEach(type => {
					const nameMatch = type.typeName.toLowerCase().includes(q);
					const childMatches = type.children && type.children.length > 0
						? searchInTree(type.children)
						: [];

					if (nameMatch || childMatches.length > 0) {
						// 매칭되면 자식도 포함해서 추가
						results.push({
							...type,
							children: childMatches.length > 0 ? childMatches : type.children
						});
					}
				});
				return results;
			};

			filteredTypes = searchInTree(typeCache);
		} else {
			// 검색어가 없으면: 전체 표시
			filteredTypes = typeCache;
		}

		// 트리 구조로 재생성
		const treeData = buildTypeTreeForJS(filteredTypes);
		renderTypeTree(treeData, document.getElementById("typeModalTree"));
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