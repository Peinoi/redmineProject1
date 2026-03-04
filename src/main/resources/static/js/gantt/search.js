// /js/gantt/search.js
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
		projectStatus: $("#filterProjectStatus"),
		status: $("#filterStatus"),
		title: $("#filterTitle"),
		priority: $("#filterPriority"),
		assigneeText: $("#filterAssigneeText"),
		assigneeValue: $("#filterAssigneeValue"),
		creatorText: $("#filterCreatorText"),
		creatorValue: $("#filterCreatorValue"),
		//createdAt: $("#filterCreatedAt"),
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
		assigneeModalList: $("#assigneeModalTree"),
		creatorModalList: $("#creatorModalTree"),

		projectModalSearch: $("#projectModalSearch"),
		assigneeModalSearch: $("#assigneeModalSearch"),
		creatorModalSearch: $("#creatorModalSearch"),
		typeModalSearch: $("#typeModalSearch"),

		btnCreate: $("#btnIssueCreate"),
	};

	// form submit 자체 방지
	ui.filterForm?.addEventListener("submit", (e) => e.preventDefault());

	// -------------------------
	// 유틸 함수
	// -------------------------
	const PROJECT_STATUS_LABEL = {
		OD1: "진행",
		OD2: "삭제",
		OD3: "종료",
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

	const restoreEl = (el) => {
		const st = MOVED.get(el);
		if (!st) return;

		const { parent, nextSibling } = st;
		if (nextSibling && nextSibling.parentNode === parent)
			parent.insertBefore(el, nextSibling);
		else parent.appendChild(el);

		el.style.position = "";
		el.style.left = "";
		el.style.top = "";
		el.style.zIndex = "";
		el.style.display = "";
		el.style.visibility = "";
		el.style.opacity = "";

		MOVED.delete(el);
	};

	const closeSubmenus = (except = null) => {
		$$(".issue-submenu-menu.show").forEach((m) => {
			if (m === except) return;
			m.classList.remove("show");
			restoreEl(m);
		});
	};

	const closeAll = () => {
		$$('.issue-dropdown [data-bs-toggle="dropdown"]').forEach((btn) => {
			const inst = bootstrap.Dropdown.getInstance(btn);
			if (inst) inst.hide();
		});
		closeSubmenus(null);
	};

	const closeMenusHard = () => {
		closeAll();
		$$(".issue-dropdown-menu.show").forEach((m) => {
			m.classList.remove("show");
			restoreEl(m);
		});
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
	let assigneeCache = [];
	let creatorCache = [];
	let typeCache = [];

	const ensureProjectCache = async () => {
		if (projectCache.length) return true;
		const res = await fetch("/api/projects/modal", { headers: { Accept: "application/json" } });
		if (!res.ok) { showToast("프로젝트 목록을 불러오지 못했습니다."); return false; }
		projectCache = (await res.json()).map(p => ({ code: String(p.projectCode), name: p.projectName }));
		return true;
	};

	const ensureAssigneeCache = async () => {
		if (assigneeCache.length) return true;

		const res = await fetch("/api/users/modal/assignees");
		if (!res.ok) { showToast("담당자 목록을 불러오지 못했습니다."); return false; }

		assigneeCache = await res.json();
		return true;
	};

	const ensureCreatorCache = async () => {
		if (creatorCache.length) return true;

		const res = await fetch("/api/users/modal/creators");
		if (!res.ok) { showToast("등록자 목록을 불러오지 못했습니다."); return false; }

		creatorCache = await res.json();
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
	// Gantt 필터 객체 만들기
	// -------------------------
	const getGanttFilters = () => {
		const psCode = ui.projectStatus?.value?.trim() || "";
		const sCode = ui.status?.value?.trim() || "";
		const prCode = ui.priority?.value?.trim() || "";
		const psLabel = psCode ? PROJECT_STATUS_LABEL[psCode] : "";
		const sLabel = sCode ? STATUS_LABEL[sCode] : "";
		const prLabel = prCode ? PRIORITY_LABEL[prCode] : "";
		const duration = window.ganttRange || null;
		const projectCode =
			window.currentProject?.projectCode ||
			ui.projectValue?.value ||
			"";

		return {
			projectCode: String(window.currentProject?.projectCode || ui.projectValue?.value || ""),
			projectName: ui.projectText?.value || "",
			projectStatus: psLabel,
			projectStatusCode: psCode,
			title: ui.title?.value?.trim()?.toLowerCase() || "",
			type: ui.typeValue?.value || "",
			typeName: ui.typeText?.value || "",
			status: sLabel,  // 라벨로 변환
			priority: prLabel,  // 라벨로 변환
			assigneeCode: ui.assigneeValue?.value || "",
			assigneeName: ui.assigneeText?.value || "",
			createdByCode: ui.creatorValue?.value || "",
			creatorName: ui.creatorText?.value || "",
			//createdAt: ui.createdAt?.value || "",
			dueAt: ui.dueAt?.value || "",
			durationStart: duration?.start || null,
			durationEnd: duration?.end || null
		};
	};

	window.getGanttFilters = getGanttFilters;

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
		const ok = await ensureProjectCache();
		if (!ok) return;
		renderListButtons(ui.projectModalList, projectCache, (picked) => {
			ui.projectText.value = picked.name;
			ui.projectValue.value = picked.code;

			// 프로젝트 변경 시 유형/담당자/등록자 초기화
			ui.typeText.value = "";
			ui.typeValue.value = "";
			ui.assigneeText.value = "";
			ui.assigneeValue.value = "";
			ui.creatorText.value = "";
			ui.creatorValue.value = "";

			projectModal.hide();
		});
		projectModal.show();
	};

	const openUserModal = async (type) => {
		let cache;
		let modal;
		let listEl;
		let searchEl;

		if (type === "assignee") {
			modal = assigneeModal;
			listEl = ui.assigneeModalList;
			searchEl = ui.assigneeModalSearch;

			const ok = await ensureAssigneeCache();
			if (!ok) return;

			cache = assigneeCache;

		} else if (type === "creator") {
			modal = creatorModal;
			listEl = ui.creatorModalList;
			searchEl = ui.creatorModalSearch;

			const ok = await ensureCreatorCache();
			if (!ok) return;

			cache = creatorCache;
		}

		// 검색어 초기화
		if (searchEl) searchEl.value = "";

		// ↓ 프로젝트 선택 시 해당 프로젝트만 필터링
		const selectedProjectCode = ui.projectValue?.value || "";
		const filteredCache = selectedProjectCode
			? cache.filter(p => String(p.projectCode) === String(selectedProjectCode))
			: cache;

		renderUserTree(filteredCache, listEl, (picked, projectCode) => {
			if (type === "assignee") {
				ui.assigneeText.value = picked.userName;
				ui.assigneeValue.value = picked.userCode;
			} else {
				ui.creatorText.value = picked.userName;
				ui.creatorValue.value = picked.userCode;
			}

			// 프로젝트 미선택 상태면 자동 설정
			if (!ui.projectValue?.value && projectCode) {
				ui.projectValue.value = projectCode;
				// 프로젝트명도 표시
				const projectName = filteredCache.find(p => String(p.projectCode) === String(projectCode))?.projectName || "";
				ui.projectText.value = projectName;
			}

			modal.hide();
		});

		modal.show();
	};

	const renderTypeTree = (items, container) => {
		if (!container) return;
		container.innerHTML = "";

		// 하위 노드(유형)를 생성하는 재귀 함수
		const createNode = (type, level = 0) => {
			const li = document.createElement("li");
			const div = document.createElement("div");

			// [수정] list-group-item 클래스를 제거하여 부트스트랩 스타일 간섭 차단
			div.className = "type-item";
			div.textContent = type.name;

			// 클릭 이벤트
			div.addEventListener("click", (e) => {
				e.stopPropagation();
				ui.typeText.value = type.name;
				ui.typeValue.value = type.code;
				// 유형의 프로젝트 코드/명 자동 설정
				if (type.projectCode && type.projectName) {
					ui.projectValue.value = type.projectCode;
					ui.projectText.value = type.projectName;
				}
				if (typeModal) typeModal.hide();
			});

			li.appendChild(div);

			// 자식 유형이 있는 경우 재귀 호출
			if (type.children && type.children.length > 0) {
				const ul = document.createElement("ul");
				type.children.forEach(c => ul.appendChild(createNode(c, level + 1)));
				li.appendChild(ul);
			}

			return li;
		};

		// 데이터가 없을 때
		if (!items || items.length === 0) {
			container.innerHTML = '<div class="p-4 text-center text-muted">결과가 없습니다.</div>';
			return;
		}

		// 프로젝트별로 루프를 돌며 렌더링
		items.forEach(p => {
			// 1. 프로젝트 그룹 래퍼 생성 (이 div가 테두리와 라운딩을 담당)
			const groupWrapper = document.createElement("div");
			groupWrapper.className = "type-project-group";

			// 2. 프로젝트 헤더 생성
			const projHeader = document.createElement("div");
			projHeader.className = "type-project-header";
			projHeader.textContent = p.name;
			groupWrapper.appendChild(projHeader);

			// 아코디언용 content wrapper
			const contentWrapper = document.createElement("div");
			contentWrapper.className = "type-project-content";
			contentWrapper.style.display = "none"; // 기본 닫힘

			// 클릭 이벤트 (아코디언)
			projHeader.addEventListener("click", () => {
				const isOpen = contentWrapper.style.display === "block";

				// 다른 프로젝트 닫기 (한 번에 하나만 열리게)
				document.querySelectorAll(".type-project-content").forEach(el => {
					el.style.display = "none";
				});

				document.querySelectorAll(".type-project-header").forEach(el => {
					el.classList.remove("active");
				});

				if (!isOpen) {
					contentWrapper.style.display = "block";
					projHeader.classList.add("active");
				} else {
					contentWrapper.style.display = "none";
					projHeader.classList.remove("active");
				}
			});

			// 3. 프로젝트 소속 유형 리스트 생성
			if (p.children && p.children.length > 0) {
				const rootUl = document.createElement("ul");
				p.children.forEach(t => rootUl.appendChild(createNode(t)));
				contentWrapper.appendChild(rootUl);
			}

			// 최종 컨테이너에 그룹 추가
			groupWrapper.appendChild(contentWrapper);
			container.appendChild(groupWrapper);
		});
	};

	const renderUserTree = (projects, container, pickHandler) => {
		if (!container) return;
		container.innerHTML = "";

		if (!projects || projects.length === 0) {
			container.innerHTML =
				'<div class="p-4 text-center text-muted">결과가 없습니다.</div>';
			return;
		}

		projects.forEach(p => {
			// ===== 프로젝트 그룹 =====
			const groupWrapper = document.createElement("div");
			groupWrapper.className = "type-project-group";

			const header = document.createElement("div");
			header.className = "type-project-header";
			header.textContent = p.projectName;

			const content = document.createElement("div");
			content.className = "type-project-content";
			content.style.display = "none";

			// 아코디언
			header.addEventListener("click", () => {
				const isOpen = content.style.display === "block";

				document.querySelectorAll(".type-project-content")
					.forEach(el => el.style.display = "none");

				document.querySelectorAll(".type-project-header")
					.forEach(el => el.classList.remove("active"));

				if (!isOpen) {
					content.style.display = "block";
					header.classList.add("active");
				}
			});

			// ===== 사용자 목록 =====
			const ul = document.createElement("ul");

			(p.children || []).forEach(u => {
				const li = document.createElement("li");
				const btn = document.createElement("div");

				btn.className = "type-item";
				btn.textContent = u.userName;

				btn.addEventListener("click", (e) => {
					e.stopPropagation();
					pickHandler(u, p.projectCode);
				});

				li.appendChild(btn);
				ul.appendChild(li);
			});

			content.appendChild(ul);
			groupWrapper.appendChild(header);
			groupWrapper.appendChild(content);
			container.appendChild(groupWrapper);
		});
	};

	const filterUserTree = (projects, keyword) => {
		if (!keyword || !keyword.trim()) {
			return projects; // 검색어 없으면 전체
		}

		const q = keyword.trim().toLowerCase();
		const result = [];

		projects.forEach(p => {
			// 프로젝트 안에서 keyword에 맞는 사용자만 필터링
			const matchedUsers = (p.children || []).filter(u => {
				const name = (u.userName || "").toLowerCase().trim();
				return name.includes(q);
			});

			// 검색 결과가 하나도 없으면 프로젝트 제외
			if (matchedUsers.length > 0) {
				result.push({
					projectName: p.projectName,
					projectCode: p.projectCode,
					children: matchedUsers
				});
			}
		});

		return result;
	};

	const buildTypeTreeForJS = (serverData) => {
		const projectMap = {};

		// 재귀적으로 유형을 변환하는 함수
		const convertType = (type, projectCode, projectName) => {
			return {
				code: String(type.typeCode),
				name: type.typeName,
				projectCode: projectCode,
				projectName: projectName,
				children: (type.children || []).map(child => convertType(child, projectCode, projectName))
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
				projectMap[pCode].children.push(convertType(type, pCode, pName));
			}
		});

		return Object.values(projectMap).filter(p => p.children.length > 0);
	};

	const openTypeModal = async () => {
		if (!typeModal) return;
		ui.typeModalSearch && (ui.typeModalSearch.value = "");
		const ok = await ensureTypeCache();
		if (!ok) return;

		const selectedProjectCode = ui.projectValue?.value || "";
		const treeData = buildTypeTreeForJS(typeCache);

		// 프로젝트 선택 시 해당 프로젝트 유형만 필터링
		const filteredTreeData = selectedProjectCode
			? treeData.filter(p => String(p.code) === String(selectedProjectCode))
			: treeData;

		renderTypeTree(filteredTreeData, document.getElementById("typeModalTree"));
		typeModal.show();
	};

	// -------------------------
	// 이벤트 바인딩
	// -------------------------
	// 일감등록
	ui.btnCreate?.addEventListener("click", () => {
		closeMenusHard();
		location.href = "/issueInsert";
	});

	// 초기화
	ui.btnReset?.addEventListener("click", (e) => {
		e.preventDefault();

		ui.projectText.value = "";
		ui.projectValue.value = "";
		ui.projectStatus.value = "";
		ui.title.value = "";
		ui.typeText.value = "";
		ui.typeValue.value = "";
		ui.status.value = "";
		ui.priority.value = "";
		ui.assigneeText.value = "";
		ui.assigneeValue.value = "";
		ui.creatorText.value = "";
		ui.creatorValue.value = "";
		//ui.createdAt.value = "";
		ui.dueAt.value = "";

		// Gantt 차트 초기화 (필터 없이 전체 데이터)
		if (window.ganttReload) {
			window.ganttReload({  // {} 대신 명시적으로
				projectCode: "", projectStatus: "", title: "",
				type: "", status: "", priority: "",
				assigneeCode: "", createdByCode: "", /*createdAt: "",*/ dueAt: ""
			});
		}

		// Calendar 초기화
		// 빈 객체({})를 보내 필터를 풀고, true를 보내 캐시를 비워 서버 데이터를 새로 받아옵니다.
		if (window.calendarReload) {
			window.calendarReload({}, true);
		}
		if (window.calendarInstance) {
			window.calendarInstance.today(); // 오늘 날짜로 이동
		}

		showToast("검색 조건과 데이터가 초기화되었습니다.");
	});

	// 조회
	ui.btnApply?.addEventListener("click", (e) => {
		e.preventDefault();

		const filters = getGanttFilters();

		// Gantt 필터 적용
		if (window.ganttReload) {
			//console.log("적용할 필터:", filters);
			window.ganttReload(filters);
		}

		// Calendar
		if (window.calendarReload) {
			window.calendarReload(filters);
		}
	});

	ui.btnProjectModal?.addEventListener("click", openProjectModal);
	ui.btnAssigneeModal?.addEventListener("click", () => openUserModal("assignee"));
	ui.btnCreatorModal?.addEventListener("click", () => openUserModal("creator"));
	ui.btnTypeModal?.addEventListener("click", openTypeModal);

	ui.projectModalSearch?.addEventListener("input", async () => {
		const ok = await ensureProjectCache();
		if (!ok) return;
		const q = ui.projectModalSearch.value.trim().toLowerCase();
		renderListButtons(
			ui.projectModalList,
			projectCache.filter(p => p.name.toLowerCase().includes(q)),
			picked => {
				ui.projectText.value = picked.name;
				ui.projectValue.value = picked.code;
				projectModal?.hide();
			}
		);
	});

	ui.assigneeModalSearch?.addEventListener("input", async () => {
		const ok = await ensureAssigneeCache();
		if (!ok) return;

		const q = ui.assigneeModalSearch.value.trim().toLowerCase();
		const selectedProjectCode = ui.projectValue?.value || "";

		const projectFiltered = selectedProjectCode
			? assigneeCache.filter(p => String(p.projectCode) === String(selectedProjectCode))
			: assigneeCache;

		const filtered = filterUserTree(projectFiltered, q);

		renderUserTree(filtered, ui.assigneeModalList, (picked) => {
			ui.assigneeText.value = picked.userName;
			ui.assigneeValue.value = picked.userCode;
			assigneeModal?.hide();
		});

	});

	ui.creatorModalSearch?.addEventListener("input", async () => {
		const ok = await ensureCreatorCache();
		if (!ok) return;

		const q = ui.creatorModalSearch.value.trim().toLowerCase();
		const selectedProjectCode = ui.projectValue?.value || "";

		const projectFiltered = selectedProjectCode
			? creatorCache.filter(p => String(p.projectCode) === String(selectedProjectCode))
			: creatorCache;

		const filtered = filterUserTree(projectFiltered, q);

		renderUserTree(filtered, ui.creatorModalList, (picked) => {
			ui.creatorText.value = picked.userName;
			ui.creatorValue.value = picked.userCode;
			creatorModal?.hide();
		});
	});

	ui.typeModalSearch?.addEventListener("input", async () => {
		const ok = await ensureTypeCache();
		if (!ok) return;

		const q = ui.typeModalSearch.value.trim().toLowerCase();
		// 프로젝트 필터 먼저 적용
		const treeData = buildTypeTreeForJS(typeCache);
		const selectedProjectCode = ui.projectValue?.value || "";

		const projectFiltered = selectedProjectCode
			? treeData.filter(p => String(p.code) === String(selectedProjectCode))
			: treeData;

		let filteredTypes;
		if (q) {
			const searchInTree = (types) => {
				return types
					.map(type => {
						const nameMatch = type.typeName.toLowerCase().includes(q);
						const childMatches = type.children ? searchInTree(type.children) : [];

						if (nameMatch || childMatches.length > 0) {
							return { ...type, children: childMatches };
						}
						return null;
					})
					.filter(Boolean);
			};

			// 프로젝트별로 필터 적용
			filteredTypes = projectFiltered.map(proj => ({
				...proj,
				children: searchInTree(proj.children || [])
			})).filter(proj => (proj.children || []).length > 0);
		} else {
			filteredTypes = projectFiltered;
		}

		renderTypeTree(filteredTypes, document.getElementById("typeModalTree"));
	});

	document.addEventListener("DOMContentLoaded", () => {
		const toggleBtn = document.getElementById("btnToggleSearch");
		const wrapper = document.getElementById("searchConditionWrapper");

		if (toggleBtn && wrapper) {
			wrapper.addEventListener("shown.bs.collapse", () => {
				toggleBtn.textContent = "검색조건 닫기";
			});

			wrapper.addEventListener("hidden.bs.collapse", () => {
				toggleBtn.textContent = "검색조건 열기";
			});
		}

		// 세션 프로젝트 자동 세팅
		if (window.currentProject && window.currentProject.projectCode) {
			ui.projectValue.value = window.currentProject.projectCode;
			ui.projectText.value = window.currentProject.projectName;
		}

		// 🔥 무조건 한 번만 실행
		if (window.ganttReload) {
			window.ganttReload(getGanttFilters());
		}

		if (window.calendarReload) {
			window.calendarReload(getGanttFilters());
		}

	});

})();