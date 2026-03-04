// search.js
document.addEventListener("DOMContentLoaded", () => {
	const ui = {
		// 검색용
		filterProjectText: document.getElementById("filterProjectText"),
		filterProjectValue: document.getElementById("filterProjectValue"),
		btnProjectModal: document.getElementById("btnOpenProjectModal"),

		filterFolderText: document.getElementById("filterFolderText"),
		filterFolderValue: document.getElementById("filterFolderValue"),
		btnFolderModal: document.getElementById("btnOpenFolderModal"),

		// 업로드용
		uploadProjectValue: document.getElementById("uploadProjectValue"),
		uploadFolderText: document.getElementById("uploadFolderText"),
		uploadFolderValue: document.getElementById("uploadFolderCode"),
		btnUploadFolderModal: document.getElementById("btnOpenFolderModalFromUpload"),  // ← 추가

		uploadFiles: document.getElementById("uploadFiles"),                            // ← 추가
		filePreviewList: document.getElementById("filePreviewList"),                    // ← 추가

		// 공통 모달
		projectModalEl: document.getElementById("projectSelectModal"),
		projectModalList: document.getElementById("projectModalList"),
		projectModalSearch: document.getElementById("projectModalSearch"),

		folderModalEl: document.getElementById("folderSelectModal"),
		folderModalSearch: document.getElementById("folderModalSearch"),

		// 등록자(사원) 검색 관련 추가
		filterCreatorText: document.getElementById("filterCreatorText"),
		filterCreatorValue: document.getElementById("filterCreatorValue"),
		btnCreatorModal: document.getElementById("btnOpenCreatorModal"),
		creatorModalEl: document.getElementById("creatorSelectModal"),
		creatorModalTree: document.getElementById("creatorModalTree"), // html의 ID와 일치
		creatorModalSearch: document.getElementById("creatorModalSearch")
	};

	if (ui.uploadFiles) {
		ui.uploadFiles.style.opacity = "0.6";
		ui.uploadFiles.style.cursor = "not-allowed";
	}

	// form submit 방지
	document.getElementById("filterForm")?.addEventListener("submit", e => e.preventDefault());

	let currentFolderContext = "filter";

	let creatorCache = []; // 검색용 데이터 캐시

	// ================= 등록자(사원) 선택 모달 로직 =================
	let allUsers = []; // 검색을 위한 전체 사용자 저장용

	// ================= 등록자(사원) 선택 모달 로직 =================

	const fromInput = document.getElementById("filterCreatedFrom");
	const toInput = document.getElementById("filterCreatedTo");

	if (fromInput && toInput) {
		// 1. 시작일이 변경될 때마다 종료일의 min 속성을 업데이트
		fromInput.addEventListener("change", function() {
			const selectedDate = this.value; // yyyy-mm-dd 형식

			if (selectedDate) {
				// 종료일의 최소 선택 가능 날짜를 시작일로 고정
				toInput.min = selectedDate;

				// 만약 기존에 입력된 종료일이 새로운 시작일보다 이전이라면 종료일 초기화
				if (toInput.value && toInput.value < selectedDate) {
					toInput.value = selectedDate;
					// 선택적으로 경고창이나 토스트를 띄울 수 있습니다.
					// showToast("종료일은 시작일보다 빠를 수 없습니다.");
				}
			} else {
				// 시작일이 지워지면 종료일의 min 제한도 해제
				toInput.removeAttribute("min");
			}
		});

		// 2. 반대로 종료일을 먼저 선택했을 때 시작일의 max를 제한하고 싶다면 (선택사항)
		toInput.addEventListener("change", function() {
			if (this.value) {
				fromInput.max = this.value;
			} else {
				fromInput.removeAttribute("max");
			}
		});
	}

	// 1. 모달 열기 및 데이터 패치
	ui.btnCreatorModal?.addEventListener("click", async () => {
		try {
			if (!creatorCache.length) {
				const res = await fetch("/api/users/modal/creators");
				creatorCache = await res.json();
			}

			// 현재 선택된 프로젝트/상태로 필터링
			const selectedProjectCode = ui.filterProjectValue?.value || "";
			const selectedStatus = document.getElementById("filterProjectStatus")?.value || "";

			// 1. 프로젝트 상태로 필터링 (projectCache 활용)
			let filtered = creatorCache;

			if (selectedStatus) {
				await ensureProjectCache();
				const allowedCodes = projectCache
					.filter(p => String(p.status) === String(selectedStatus))
					.map(p => String(p.code));

				filtered = filtered.filter(p =>
					allowedCodes.includes(String(p.projectCode))
				);
			}

			// 2. 선택된 프로젝트로 필터링
			if (selectedProjectCode) {
				filtered = filtered.filter(p =>
					String(p.projectCode) === String(selectedProjectCode)
				);
			}

			renderCreatorTree(filtered);

			const modal = new bootstrap.Modal(ui.creatorModalEl);
			modal.show();
		} catch (e) {
			console.error("등록자 목록 로드 실패:", e);
			showToast("등록자 목록을 불러올 수 없습니다.");
		}
	});

	// 2. 트리 구조 렌더링 함수
	function renderCreatorTree(data) {
		if (!ui.creatorModalTree) return;
		ui.creatorModalTree.innerHTML = "";

		if (!data || data.length === 0) {
			ui.creatorModalTree.innerHTML = '<div class="p-4 text-center text-muted">결과가 없습니다.</div>';
			return;
		}

		data.forEach(project => {
			const groupWrapper = document.createElement("div");
			groupWrapper.className = "type-project-group";

			const header = document.createElement("div");
			header.className = "type-project-header";
			header.textContent = project.projectName;

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

			const ul = document.createElement("ul");

			if (project.children && project.children.length > 0) {
				project.children.forEach(user => {
					const li = document.createElement("li");
					const btn = document.createElement("div");
					btn.className = "type-item";
					btn.textContent = user.userName;

					btn.addEventListener("click", (e) => {
						e.stopPropagation();
						ui.filterCreatorText.value = user.userName;
						ui.filterCreatorValue.value = user.userCode;

						const modal = bootstrap.Modal.getInstance(ui.creatorModalEl);
						modal.hide();
					});

					li.appendChild(btn);
					ul.appendChild(li);
				});
			} else {
				const empty = document.createElement("li");
				empty.className = "text-muted small p-2";
				empty.textContent = "참여 사원 없음";
				ul.appendChild(empty);
			}

			content.appendChild(ul);
			groupWrapper.appendChild(header);
			groupWrapper.appendChild(content);
			ui.creatorModalTree.appendChild(groupWrapper);
		});
	}

	// 3. 모달 내 실시간 검색
	ui.creatorModalSearch?.addEventListener("input", (e) => {
		const q = e.target.value.toLowerCase().trim();

		const selectedProjectCode = ui.filterProjectValue?.value || "";
		const selectedStatus = document.getElementById("filterProjectStatus")?.value || "";

		let filtered = creatorCache;

		if (selectedStatus) {
			const allowedCodes = projectCache
				.filter(p => String(p.status) === String(selectedStatus))
				.map(p => String(p.code));
			filtered = filtered.filter(p => allowedCodes.includes(String(p.projectCode)));
		}

		if (selectedProjectCode) {
			filtered = filtered.filter(p =>
				String(p.projectCode) === String(selectedProjectCode)
			);
		}

		if (q) {
			filtered = filtered.map(proj => {
				const matchedUsers = (proj.children || []).filter(u =>
					u.userName.toLowerCase().includes(q)
				);
				if (matchedUsers.length === 0) return null;
				return { ...proj, children: matchedUsers };
			}).filter(Boolean);
		}

		renderCreatorTree(filtered);
	});

	// ===== context별 selectedFolderPath =====
	let selectedFolderPath = {
		filter: [],  // 검색용
		upload: []   // 문서등록용
	};

	// 서버에서 내려온 folderCode가 있으면 경로 복원
	const initFolderCode = ui.filterFolderValue?.value;
	if (initFolderCode) {
		ensureFolderCache().then(() => {
			const treeData = buildFolderTreeForJS(folderCache);
			selectedFolderPath.filter = findFolderPath(treeData, initFolderCode);
		});
	}

	// 필요하면 트리 전체 초기화
	const folderTreeEl = document.getElementById("folderModalTree");
	if (folderTreeEl) folderTreeEl.innerHTML = "";



	// ================= Cache =================
	let projectCache = [];
	let folderCache = null;

	const ensureProjectCache = async () => {
		if (projectCache.length) return true;
		try {
			const res = await fetch("/api/projects/modal", { headers: { Accept: "application/json" } });
			if (res.status === 403) {
				showToast('권한이 없습니다.');
				return;
			}
			if (!res.ok) throw new Error("프로젝트 목록을 불러오지 못했습니다.");
			projectCache = (await res.json()).map(p => ({ code: String(p.projectCode), name: p.projectName, status: p.projectStatusCode }));
			return true;
		} catch (e) {
			showToast(e.message);
			return false;
		}
	};

	const ensureFolderCache = async () => {
		if (folderCache) return true;
		try {
			const res = await fetch("/api/folders/modal", { headers: { Accept: "application/json" } });
			if (!res.ok) throw new Error("폴더 목록을 불러오지 못했습니다.");
			folderCache = await res.json();
			return true;
		} catch (e) {
			showToast(e.message);
			return false;
		}
	};

	// ================= Breadcrumb =================
	const renderBreadcrumb = (context) => {
		const el = document.getElementById("folderBreadcrumb");
		if (!el) return;
		const path = selectedFolderPath[context] || [];

		if (!path.length) {
			el.innerHTML = "";
			el.style.display = "none";
			return;
		}

		el.style.display = "flex";

		el.innerHTML = path.map((item, i) => {
			const isLast = i === path.length - 1;
			const icon = item.type === "project" ? "🗂️" : "📁";
			return `
	            <span 
	                class="bc-item ${isLast ? "bc-item--active" : "bc-item--link"}" 
	                data-code="${item.code}" 
	                data-type="${item.type}"
	                title="${item.name}"
	            >${icon} ${item.name}</span>
	            ${!isLast ? `<span class="bc-sep">›</span>` : ""}
	        `;
		}).join("");

		el.querySelectorAll(".bc-item").forEach(span => {
			span.addEventListener("click", onBreadcrumbClick);
		});
	};

	const onBreadcrumbClick = (e) => {
		const code = e.target.dataset.code;
		const type = e.target.dataset.type;
		const context = currentFolderContext;
		let fullPath = selectedFolderPath[context] || [];
		if (!fullPath.length) return;

		const idx = fullPath.findIndex(p => String(p.code) === String(code));
		if (idx === -1) return;

		const newPath = fullPath.slice(0, idx + 1);
		selectedFolderPath[context] = newPath;

		const treeData = buildFolderTreeForJS(folderCache);
		const selectedProjectCode = context === "filter"
			? ui.filterProjectValue?.value || ""
			: ui.uploadProjectValue?.value || "";
		const filteredTreeData = selectedProjectCode
			? treeData.filter(p => String(p.code) === String(selectedProjectCode))
			: treeData;

		renderFolderTree(filteredTreeData, document.getElementById("folderModalTree"));

		// 🔥 프로젝트 클릭이면 트리만 초기화, 폴더 열기 생략
		if (type !== "project") {
			openAndSelectFolder(newPath);
		}

		renderBreadcrumb(context);
	};

	// 트리에서 폴더 클릭 시 → 생성폼이 열려있으면 "상위 폴더"로 세팅
	// createNode의 click 이벤트에 아래 분기 추가
	const handleFolderClick = (folder, e, context) => {
		e.stopPropagation();

		if (folderCreateForm && folderCreateForm.style.display !== "none") {
			// 생성폼에 (프로젝트명 > 폴더명 형태) 세팅
			newFolderParentText.value = `${folder.projectName || ""} > ${folder.name}`;
			newFolderParentCode.value = folder.code;
			newFolderProjectCode.value = folder.projectCode;
			newFolderName.focus();
			return;
		}

		// 선택 경로 저장
		const treeData = buildFolderTreeForJS(folderCache);
		selectedFolderPath[currentFolderContext] =
			findFolderPath(treeData, folder.code);

		renderBreadcrumb(currentFolderContext);

		if (context === "filter") {
			ui.filterFolderText.value = folder.name;
			ui.filterFolderValue.value = folder.code;

			// 폴더 선택 시 해당 프로젝트도 자동 세팅
			if (folder.projectCode) {
				ui.filterProjectValue.value = folder.projectCode;
				// 프로젝트명 표시 (캐시에서 찾기)
				const project = projectCache.find(p => String(p.code) === String(folder.projectCode));
				if (project) ui.filterProjectText.value = project.name;
				else ui.filterProjectText.value = folder.projectName || "";
			}
		} else if (context === "upload") {
			// 업로드 모달에서는 검색 선택 무시
			ui.uploadFolderText.value = folder.name;
			ui.uploadFolderValue.value = folder.code;
			ui.uploadProjectValue.value = folder.projectCode || "";

			ui.uploadFiles.style.opacity = "1";
			ui.uploadFiles.style.cursor = "pointer";

			const hint = document.getElementById("uploadProjectHint");
			const hintText = document.getElementById("uploadProjectText");
			if (hint && hintText) {
				hintText.textContent = folder.projectName || folder.projectCode;
				hint.style.display = "block";
			}
		}

		folderModal?.hide();

		if (context === "upload" && uploadModal) {
			setTimeout(() => uploadModal.show(), 300);
		}
	};

	// ================= 폴더 모달 열기 =================
	const openFolderModal = async (context = "filter") => {
		// 모달 열 때 항상 트리 상태 초기화
		document.querySelectorAll(".folder-item.selected")
			.forEach(el => el.classList.remove("selected"));

		document.querySelectorAll(".folder-toggle")
			.forEach(el => el.textContent = "▶");

		document.querySelectorAll("#folderModalTree ul")
			.forEach(ul => ul.style.display = "none");

		if (!folderModal) return;
		currentFolderContext = context;
		if (ui.folderModalSearch) ui.folderModalSearch.value = "";

		const folderCreateSection = document.getElementById("folderCreateSection");
		if (folderCreateSection) {
			folderCreateSection.style.display = context === "upload" ? "" : "none";
		}

		if (context === "filter" && folderCreateForm) {
			btnCancelFolderCreate?.click();
		}

		const ok = await ensureFolderCache();
		if (!ok) return;

		const okProject = await ensureProjectCache();
		if (!okProject) return;

		const treeData = buildFolderTreeForJS(folderCache);
		let filteredTreeData = treeData;

		if (context === "filter") {
			const selectedStatus = document.getElementById("filterProjectStatus")?.value || "";
			const selectedProjectCode = ui.filterProjectValue?.value || "";

			// 상태 필터
			if (selectedStatus) {
				const allowedProjectCodes = projectCache
					.filter(p => String(p.status) === String(selectedStatus))
					.map(p => String(p.code));
				filteredTreeData = filteredTreeData.filter(p =>
					allowedProjectCodes.includes(String(p.code))
				);
			}

			// 프로젝트 선택 필터
			if (selectedProjectCode) {
				filteredTreeData = filteredTreeData.filter(p =>
					String(p.code) === String(selectedProjectCode)
				);
			}
		} else if (context === "upload") {
			// 1순위: uploadProjectValue (이미 세팅된 경우)
			const uploadProjectCode = ui.uploadProjectValue?.value || "";

			// 2순위: 검색 필터의 프로젝트 선택
			const filterProjectCode = ui.filterProjectValue?.value || "";

			// 3순위: 검색 필터의 프로젝트 상태
			const filterStatus = document.getElementById("filterProjectStatus")?.value || "";

			if (uploadProjectCode) {
				filteredTreeData = filteredTreeData.filter(p =>
					String(p.code) === String(uploadProjectCode)
				);
			} else if (filterProjectCode) {
				filteredTreeData = filteredTreeData.filter(p =>
					String(p.code) === String(filterProjectCode)
				);
			} else if (filterStatus) {
				const allowedCodes = projectCache
					.filter(p => String(p.status) === String(filterStatus))
					.map(p => String(p.code));
				filteredTreeData = filteredTreeData.filter(p =>
					allowedCodes.includes(String(p.code))
				);
			}
		}

		renderFolderTree(filteredTreeData, document.getElementById("folderModalTree"));

		// 이전 선택 폴더 열기 (context별)
		const path = selectedFolderPath[context];
		if (path.length) {
			openAndSelectFolder(path);
		}

		if (context === "upload" && uploadModal) {
			uploadModal.hide();
			setTimeout(() => folderModal.show(), 300);
		} else {
			folderModal.show();
		}
	};

	// ================= 파일 미리보기 =================
	const FILE_MAX_SIZE = 50 * 1024 * 1024; // 50MB
	const ALLOWED_EXTS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "jpeg", "png", "gif", "zip", "txt"];

	const EXT_ICON = {
		pdf: "📄", doc: "📝", docx: "📝",
		xls: "📊", xlsx: "📊",
		ppt: "📋", pptx: "📋",
		jpg: "🖼️", jpeg: "🖼️", png: "🖼️", gif: "🖼️",
		zip: "🗜️", txt: "📃"
	};

	const formatBytes = (bytes) => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
	};

	// DataTransfer로 실제 파일 목록을 관리 (삭제 지원)
	let managedFiles = new DataTransfer();

	const renderFilePreview = () => {
		const list = ui.filePreviewList;
		if (!list) return;
		list.innerHTML = "";

		// ↓ reverse()로 최신 파일이 상단에 오도록
		Array.from(managedFiles.files).reverse().forEach((file, idx) => {
			// 삭제 시 원본 인덱스가 필요하므로 실제 idx를 역산
			const originalIdx = managedFiles.files.length - 1 - idx;

			const ext = file.name.substring(file.name.lastIndexOf(".") + 1).toLowerCase();
			const isError = file.size > FILE_MAX_SIZE || !ALLOWED_EXTS.includes(ext);
			const errorMsg = file.size > FILE_MAX_SIZE
				? "파일 크기 초과 (최대 50MB)"
				: !ALLOWED_EXTS.includes(ext)
					? "허용되지 않는 파일 형식"
					: "";

			const li = document.createElement("li");
			li.className = `file-preview-item${isError ? " is-error" : ""}`;
			li.innerHTML = `
	            <span class="file-icon">${EXT_ICON[ext] || "📎"}</span>
	            <span class="file-info">
	                <div class="file-name" title="${file.name}">${file.name}</div>
	                <div class="file-meta">${formatBytes(file.size)}${errorMsg ? " · ⚠️ " + errorMsg : ""}</div>
	            </span>
	            <button type="button" class="btn-remove-file" data-idx="${originalIdx}" title="삭제">×</button>`;
			list.appendChild(li);
		});

		// 삭제 버튼 이벤트
		list.querySelectorAll(".btn-remove-file").forEach(btn => {
			btn.addEventListener("click", (e) => {
				const removeIdx = parseInt(e.currentTarget.dataset.idx);
				const newDt = new DataTransfer();
				Array.from(managedFiles.files).forEach((f, i) => {
					if (i !== removeIdx) newDt.items.add(f);
				});
				managedFiles = newDt;
				ui.uploadFiles.files = managedFiles.files;
				renderFilePreview();
			});
		});
	};

	ui.uploadFiles?.addEventListener("change", (e) => {
		// 기존 파일에 새 파일 추가 (중복 제거)
		const existingNames = new Set(Array.from(managedFiles.files).map(f => f.name));
		Array.from(e.target.files).forEach(f => {
			const ext = f.name.split(".").pop().toLowerCase();
			const isValid =
				f.size <= FILE_MAX_SIZE &&
				ALLOWED_EXTS.includes(ext);

			if (!existingNames.has(f.name) && isValid) {
				managedFiles.items.add(f);
			}
		});
		ui.uploadFiles.files = managedFiles.files;
		renderFilePreview();
	});

	// 업로드 모달 닫힐 때 파일 목록 초기화
	const uploadModalEl = document.getElementById("docUploadModal");
	uploadModalEl?.addEventListener("hidden.bs.modal", () => {
		managedFiles = new DataTransfer();
		if (ui.uploadFiles) {
			ui.uploadFiles.value = "";
			ui.uploadFiles.style.opacity = "0.6"; // 다시 흐리게
			ui.uploadFiles.style.cursor = "not-allowed";
		}
		if (ui.filePreviewList) ui.filePreviewList.innerHTML = "";
		if (ui.uploadProjectText) ui.uploadProjectText.value = "";
		if (ui.uploadProjectValue) ui.uploadProjectValue.value = "";
		if (ui.uploadFolderText) ui.uploadFolderText.value = "";
		if (ui.uploadFolderValue) ui.uploadFolderValue.value = "";
	});

	ui.uploadFiles?.addEventListener("click", (e) => {
		// 폴더 값이 비어있다면 (사용자가 폴더를 선택하지 않았다면)
		if (!ui.uploadFolderValue.value) {
			e.preventDefault(); // 중요: 파일 선택창(윈도우 탐색기)이 뜨는 걸 막음
			showToast("저장 폴더를 먼저 선택해야 파일을 올릴 수 있습니다.");
			return; // 여기서 종료
		}
		// 폴더가 있으면 아무것도 막지 않으므로 파일 창이 정상적으로 뜹니다.
	});

	// ================= Modal 인스턴스 =================
	const projectModal = ui.projectModalEl ? new bootstrap.Modal(ui.projectModalEl) : null;
	const folderModal = ui.folderModalEl ? new bootstrap.Modal(ui.folderModalEl) : null;
	const uploadModal = uploadModalEl ? new bootstrap.Modal(uploadModalEl) : null;

	// ================= 프로젝트 모달 =================
	const renderListButtons = (listEl, items, onPick) => {
		if (!listEl) return;
		listEl.innerHTML = "";
		if (!items.length) {
			listEl.innerHTML = `<div class="text-muted p-2">결과가 없습니다.</div>`;
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

	const openProjectModal = async () => {
		if (!projectModal) return;
		ui.projectModalSearch.value = "";

		const ok = await ensureProjectCache();
		if (!ok) return;

		renderListButtons(ui.projectModalList, projectCache, (picked) => {
			ui.filterProjectText.value = picked.name;
			ui.filterProjectValue.value = picked.code;
			projectModal.hide();
		});

		projectModal.show();
	};

	ui.projectModalSearch?.addEventListener("input", async () => {
		const ok = await ensureProjectCache();
		if (!ok) return;
		const q = ui.projectModalSearch.value.trim().toLowerCase();
		const filtered = projectCache.filter(p => p.name.toLowerCase().includes(q));
		renderListButtons(ui.projectModalList, filtered, (picked) => {
			ui.filterProjectText.value = picked.name;
			ui.filterProjectValue.value = picked.code;
			projectModal?.hide();
		});
	});

	// ================= 폴더 트리 =================
	const buildFolderTreeForJS = (cacheData) => {
		const projects = cacheData.projects || [];
		const folders = cacheData.folders || [];

		const convertFolder = (folder) => ({
			code: String(folder.folderCode),
			name: folder.folderName,
			projectCode: String(folder.projectCode),
			projectName: folder.projectName,
			children: (folder.children || []).map(c => convertFolder(c))
		});

		// 프로젝트별 루트 폴더 그룹화
		const foldersByProject = {};
		folders.forEach(folder => {
			const pCode = String(folder.projectCode);
			if (!foldersByProject[pCode]) foldersByProject[pCode] = [];
			foldersByProject[pCode].push(convertFolder(folder));
			// 서버에서 이미 트리로 내려오므로 루트만 담으면 됨
			// headerFolderCode가 null인 것 = 루트 (서버 buildFolderTree가 이미 처리)
		});

		// 모든 프로젝트 포함 (폴더 없어도 빈 배열로)
		return projects.map(p => ({
			code: String(p.projectCode),
			name: p.projectName,
			children: foldersByProject[String(p.projectCode)] || []
		}));
	};

	// ================= 폴더 경로 계산 =================
	const findFolderPath = (treeData, folderCode) => {
		for (const project of treeData) {
			const path = findInNodes(project.children || [], folderCode);
			if (path) {
				return [
					{ name: project.name, code: project.code, type: "project" },
					...path
				];
			}
		}
		return [];
	};

	const findInNodes = (nodes, folderCode, trail = []) => {
		for (const node of nodes) {
			const newTrail = [
				...trail,
				{ name: node.name, code: node.code, type: "folder" }
			];

			if (String(node.code) === String(folderCode)) {
				return newTrail;
			}

			if (node.children?.length) {
				const result = findInNodes(node.children, folderCode, newTrail);
				if (result) return result;
			}
		}
		return null;
	};

	// ================= 트리 펼치기 =================
	const openAndSelectFolder = (path) => {
		if (!Array.isArray(path) || !path.length) return;

		// 🔥 0️⃣ 기존 선택/열림 초기화
		document.querySelectorAll(".folder-item.selected")
			.forEach(el => el.classList.remove("selected"));

		document.querySelectorAll(".folder-project-content")
			.forEach(el => el.style.display = "none");

		document.querySelectorAll(".folder-project-header")
			.forEach(el => el.classList.remove("active"));

		// 🔥 1️⃣ 프로젝트 먼저 정확히 열기
		const projectNode = path.find(p => p.type === "project");

		if (projectNode) {
			const header = document.querySelector(
				`.folder-project-header[data-project-code="${projectNode.code}"]`
			);

			if (header) {
				header.classList.add("active");

				const content = header.nextElementSibling;
				if (content) content.style.display = "block";
			} else {
				console.warn("❌ 프로젝트 header 못 찾음:", projectNode.code);
			}
		}

		// 🔥 2️⃣ 폴더 조상 전체 열기
		path.forEach(node => {
			if (node.type !== "folder") return;

			const nameEl = document.querySelector(
				`.folder-name[data-folder-code="${node.code}"]`
			);

			if (!nameEl) {
				console.warn("❌ DOM에 폴더 없음:", node.code);
				return;
			}

			let li = nameEl.closest("li");

			while (li) {
				const parentUl = li.parentElement;

				if (parentUl && parentUl.tagName === "UL") {
					parentUl.style.display = "block";

					const parentLi = parentUl.closest("li");
					if (parentLi) {
						const toggle = parentLi.querySelector(":scope > .folder-item .folder-toggle");
						if (toggle) toggle.textContent = "▼";
					}
				}

				li = parentUl?.closest("li");
			}

			// 현재 노드 화살표
			const toggle = nameEl.closest("li")
				?.querySelector(":scope > .folder-item .folder-toggle");

			if (toggle) toggle.textContent = "▼";
		});

		// 🔥 3️⃣ 마지막 선택 표시
		const last = path[path.length - 1];

		if (last?.type === "folder") {
			const lastEl = document.querySelector(
				`.folder-name[data-folder-code="${last.code}"]`
			);

			if (lastEl) {
				lastEl.closest(".folder-item")?.classList.add("selected");
				lastEl.scrollIntoView({ block: "nearest" });
			}
		}
	};

	const renderFolderTree = (items, container) => {
		if (!container) return;
		container.innerHTML = "";

		if (!items || items.length === 0) {
			container.innerHTML = '<div class="p-4 text-center text-muted">결과가 없습니다.</div>';
			return;
		}

		const createNode = (folder, depth = 0) => {
			const li = document.createElement("li");
			const hasChildren = folder.children?.length > 0;

			const div = document.createElement("div");
			div.className = "folder-item";
			div.dataset.depth = depth;

			div.dataset.code = folder.code;
			div.dataset.type = folder.type || "folder";

			// 앞쪽 화살표만
			if (hasChildren) {
				const toggle = document.createElement("span");
				toggle.className = "folder-toggle";
				toggle.textContent = "▶";
				toggle.addEventListener("click", (e) => {
					e.stopPropagation();
					const childUl = li.querySelector(":scope > ul");
					const isOpen = childUl.style.display !== "none";
					childUl.style.display = isOpen ? "none" : "block";
					toggle.textContent = isOpen ? "▶" : "▼";
				});
				div.appendChild(toggle);
			} else {
				// 자식 없으면 그냥 빈 공간(spacer)만
				const spacer = document.createElement("span");
				spacer.className = "folder-toggle-spacer";
				div.appendChild(spacer);
			}

			const nameSpan = document.createElement("span");
			nameSpan.className = "folder-name";
			nameSpan.textContent = folder.name;
			nameSpan.dataset.folderCode = folder.code;

			nameSpan.addEventListener("click", (e) => {
				e.stopPropagation();
				handleFolderClick(folder, e, currentFolderContext);
			});

			div.appendChild(nameSpan);

			// 폴더 삭제 버튼 (upload context에서만 표시)
			const delBtn = document.createElement("button");
			delBtn.type = "button";
			delBtn.className = "btn btn-sm btn-danger ms-2 btn-folder-delete";
			delBtn.innerHTML = '<i class="fas fa-trash"></i>';
			delBtn.dataset.folderCode = folder.code;
			delBtn.dataset.folderName = folder.name;
			delBtn.addEventListener("click", async (e) => {
				e.stopPropagation();
				const isConfirmed = await window.showConfirm(
					`'${folder.name}' 폴더를 삭제하시겠습니까?\n비어있는 폴더만 삭제 가능합니다.`
				);

				if (!isConfirmed) return;
				try {
					const res = await fetch(`/api/folders/delete/${folder.code}?projectCode=${folder.projectCode}`, { method: "DELETE" });
					const data = await res.json();
					if (res.status === 403) {
						showToast('권한이 없습니다.');
						return;
					}
					if (res.status === 400) {
						showToast('.');
						return;
					}
					if (!res.ok) {
						showToast(data.message);
						return;
					}
					// 캐시 초기화 후 트리 갱신
					folderCache = null;
					await ensureFolderCache();
					const treeData = buildFolderTreeForJS(folderCache);
					const selectedProjectCode = currentFolderContext === "upload"
						? ui.uploadProjectValue?.value
						: ui.filterProjectValue?.value;
					const filtered = selectedProjectCode
						? treeData.filter(p => String(p.code) === String(selectedProjectCode))
						: treeData;
					renderFolderTree(filtered, document.getElementById("folderModalTree"));
				} catch (e) {
					showToast("서버 오류가 발생했습니다.");
				}
			});
			div.appendChild(delBtn);

			li.appendChild(div);

			// 자식 노드 ul
			if (hasChildren) {
				const ul = document.createElement("ul");
				ul.style.display = "none";

				// 화살표 초기 상태
				const toggleEl = div.querySelector(".folder-toggle");
				if (toggleEl) toggleEl.textContent = "▶";

				folder.children.forEach(c => ul.appendChild(createNode(c, depth + 1)));
				li.appendChild(ul);
			}

			return li;
		};

		const isSingleProject = items.length === 1;

		items.forEach(p => {
			const groupWrapper = document.createElement("div");
			groupWrapper.className = "folder-project-group";

			const projHeader = document.createElement("div");
			projHeader.className = "folder-project-header";
			projHeader.textContent = p.name;
			projHeader.dataset.projectCode = p.code;

			const contentWrapper = document.createElement("div");
			contentWrapper.className = "folder-project-content";
			contentWrapper.style.display = "none";

			// 프로젝트가 1개면 자동 펼침
			contentWrapper.style.display = isSingleProject ? "block" : "none";
			if (isSingleProject) {
				projHeader.classList.add("active");
			}

			projHeader.addEventListener("click", () => {
				const isOpen = contentWrapper.style.display === "block";
				document.querySelectorAll(".folder-project-content").forEach(el => el.style.display = "none");
				document.querySelectorAll(".folder-project-header").forEach(el => el.classList.remove("active"));
				if (!isOpen) {
					contentWrapper.style.display = "block";
					projHeader.classList.add("active");
				}

				// 새 폴더 생성 폼이 열려있으면 프로젝트 루트로 세팅
				if (folderCreateForm && folderCreateForm.style.display !== "none") {
					if (newFolderProjectCode) newFolderProjectCode.value = p.code;
					if (newFolderParentCode) newFolderParentCode.value = "";  // 상위폴더 없음 = 루트
					if (newFolderParentText) newFolderParentText.value = `${p.name} (프로젝트)`;
					projHeader.style.outline = "2px solid #4a90d9";
					setTimeout(() => projHeader.style.outline = "", 1000);
				}
			});

			if (p.children?.length > 0) {
				const rootUl = document.createElement("ul");
				p.children.forEach(t => rootUl.appendChild(createNode(t)));
				contentWrapper.appendChild(rootUl);
			} else {
				const empty = document.createElement("div");
				empty.className = "p-2 text-muted small";
				empty.textContent = "폴더가 없습니다.";
				contentWrapper.appendChild(empty);
			}

			groupWrapper.appendChild(projHeader);
			groupWrapper.appendChild(contentWrapper);
			container.appendChild(groupWrapper);
		});
	};

	ui.folderModalSearch?.addEventListener("input", async () => {
		const ok = await ensureFolderCache();
		if (!ok) return;
		const q = ui.folderModalSearch.value.trim().toLowerCase();
		const treeData = buildFolderTreeForJS(folderCache);

		const selectedProjectCode = currentFolderContext === "filter"
			? ui.filterProjectValue?.value || ""
			: ui.uploadProjectValue?.value || "";

		const projectFiltered = selectedProjectCode
			? treeData.filter(p => String(p.code) === String(selectedProjectCode))
			: treeData;

		if (!q) {
			renderFolderTree(projectFiltered, document.getElementById("folderModalTree"));
			return;
		}

		const searchInTree = (nodes) => nodes
			.map(node => {
				const match = node.name.toLowerCase().includes(q);
				const childMatches = searchInTree(node.children || []);
				if (match || childMatches.length > 0) return { ...node, children: childMatches };
				return null;
			})
			.filter(Boolean);

		const filteredFolders = projectFiltered
			.map(proj => ({ ...proj, children: searchInTree(proj.children || []) }))
			.filter(proj => proj.children.length > 0);

		renderFolderTree(filteredFolders, document.getElementById("folderModalTree"));
	});

	// ================= 버튼 이벤트 바인딩 =================
	ui.btnProjectModal?.addEventListener("click", () => openProjectModal("filter"));
	ui.btnFolderModal?.addEventListener("click", () => openFolderModal("filter"));
	ui.btnUploadFolderModal?.addEventListener("click", () => openFolderModal("upload")); // ← 추가

	// ================= 문서 등록 버튼 =================
	document.getElementById("btnDocsCreate")?.addEventListener("click", () => {
		// 🔥 업로드는 항상 초기 상태
		selectedFolderPath.upload = [];

		if (ui.uploadFolderText) ui.uploadFolderText.value = "";
		if (ui.uploadFolderValue) ui.uploadFolderValue.value = "";

		// currentProject가 있으면 업로드 프로젝트 자동 세팅
		if (window.currentProject?.projectCode) {
			ui.uploadProjectValue.value = String(window.currentProject.projectCode);
		}

		renderBreadcrumb("upload");

		uploadModal?.show();
	});

	// ================= 폴더 생성 =================
	const folderCreateForm = document.getElementById("folderCreateForm");
	const btnToggleFolderCreate = document.getElementById("btnToggleFolderCreate");
	const btnCancelFolderCreate = document.getElementById("btnCancelFolderCreate");
	const btnConfirmFolderCreate = document.getElementById("btnConfirmFolderCreate");
	const newFolderParentText = document.getElementById("newFolderParentText");
	const newFolderParentCode = document.getElementById("newFolderParentCode");
	const newFolderProjectCode = document.getElementById("newFolderProjectCode");
	const newFolderName = document.getElementById("newFolderName");

	// 토글
	btnToggleFolderCreate?.addEventListener("click", () => {
		const isHidden = folderCreateForm.style.display === "none";
		folderCreateForm.style.display = isHidden ? "block" : "none";
		btnToggleFolderCreate.classList.toggle("btn-outline-primary", !isHidden);
		btnToggleFolderCreate.classList.toggle("btn-primary", isHidden);
		if (isHidden) newFolderName.focus();
	});

	// 취소
	btnCancelFolderCreate?.addEventListener("click", () => {
		folderCreateForm.style.display = "none";
		btnToggleFolderCreate.classList.replace("btn-primary", "btn-outline-primary");
		newFolderName.value = "";
		newFolderParentText.value = "";
		newFolderParentCode.value = "";
		newFolderProjectCode.value = "";
	});

	uploadModalEl?.addEventListener("hidden.bs.modal", () => {
		managedFiles = new DataTransfer();
		if (ui.uploadFiles) ui.uploadFiles.value = "";
		if (ui.filePreviewList) ui.filePreviewList.innerHTML = "";
		if (ui.uploadFolderText) ui.uploadFolderText.value = "";
		if (ui.uploadFolderValue) ui.uploadFolderValue.value = "";
		if (ui.uploadProjectValue) ui.uploadProjectValue.value = "";

		// 힌트 초기화
		const hint = document.getElementById("uploadProjectHint");
		if (hint) hint.style.display = "none";
	});

	// 폴더 생성 확인
	btnConfirmFolderCreate?.addEventListener("click", async () => {
		const name = newFolderName.value.trim();
		if (!name) {
			showToast("폴더명을 입력해주세요.");
			newFolderName.focus();
			return;
		}

		// 프로젝트는 상위 폴더에서 자동 추출, 없으면 현재 컨텍스트 프로젝트
		const projectCode = newFolderProjectCode.value
			|| (currentFolderContext === "upload" ? ui.uploadProjectValue?.value : ui.filterProjectValue?.value);

		if (!projectCode) {
			showToast("프로젝트를 먼저 선택하거나 상위 폴더를 선택해주세요.");
			return;
		}

		try {
			const res = await fetch("/api/folders", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					folderName: name,
					headerFolderCode: newFolderParentCode.value ? parseInt(newFolderParentCode.value) : null,
					projectCode: projectCode
				})
			});

			if (res.status === 403) {
				showToast('권한이 없습니다.');
				return;
			}

			if (!res.ok) throw new Error("폴더 생성에 실패했습니다.");

			showToast(`'${name}' 폴더가 생성되었습니다.`);

			// 캐시 초기화 후 트리 갱신
			folderCache = null;
			btnCancelFolderCreate.click(); // 폼 닫기

			await ensureFolderCache();
			const treeData = buildFolderTreeForJS(folderCache);
			const selectedProjectCode = currentFolderContext === "filter"
				? ui.filterProjectValue?.value
				: ui.uploadProjectValue?.value;
			const filtered = selectedProjectCode
				? treeData.filter(p => String(p.code) === String(selectedProjectCode))
				: treeData;
			renderFolderTree(filtered, document.getElementById("folderModalTree"));

		} catch (e) {
			showToast(e.message);
		}
	});

	document.getElementById("btnSubmitUpload")?.addEventListener("click", async () => {
		// 유효성 검사
		if (!ui.uploadFolderValue?.value) {
			showToast("저장 폴더를 선택해주세요.");
			return;
		}
		if (managedFiles.files.length === 0) {
			showToast("파일을 선택해주세요.");
			return;
		}

		const hasError = Array.from(managedFiles.files).some(f => {
			const ext = f.name.split(".").pop().toLowerCase();
			return f.size > FILE_MAX_SIZE || !ALLOWED_EXTS.includes(ext);
		});
		if (hasError) {
			showToast("업로드 불가한 파일이 있습니다. 제거 후 다시 시도하세요.");
			return;
		}

		// FormData 구성
		const formData = new FormData();
		formData.append("folderCode", ui.uploadFolderValue.value);
		formData.append("projectCode", ui.uploadProjectValue.value);
		Array.from(managedFiles.files).forEach(f => formData.append("files", f));

		try {
			const res = await fetch("/docsUpload", {
				method: "POST",
				headers: { "Accept": "application/json" },
				body: formData
			});

			if (res.status === 403) {
				showToast("등록 권한이 없습니다.");
				return;
			}

			if (!res.ok) {
				showToast("업로드 중 오류가 발생했습니다.");
				return;
			}

			// 성공
			bootstrap.Modal.getInstance(document.getElementById("docUploadModal"))?.hide();
			showToast("업로드가 완료되었습니다.");
			if (window.docsReload) window.docsReload({});

		} catch (e) {
			showToast("서버 오류가 발생했습니다.");
		}
	});
	// ================= 초기화 버튼 =================
	document.getElementById("btnResetFilters")?.addEventListener("click", () => {
		if (ui.filterProjectText) ui.filterProjectText.value = "";
		if (ui.filterProjectValue) ui.filterProjectValue.value = "";
		if (ui.filterFolderText) ui.filterFolderText.value = "";
		if (ui.filterFolderValue) ui.filterFolderValue.value = "";
		if (ui.filterCreatorText) ui.filterCreatorText.value = "";
		if (ui.filterCreatorValue) ui.filterCreatorValue.value = "";

		document.getElementById("filterCreatorText").value = "";
		document.getElementById("filterCreatorValue").value = "";
		document.getElementById("filterFile").value = "";
		document.getElementById("filterFileType").value = "";
		document.getElementById("filterProjectStatus").value = "OD1";
		document.getElementById("filterCreatedFrom").value = "";
		document.getElementById("filterCreatedTo").value = "";
		document.getElementById("filterFileType").value = "";

		selectedFolderPath.filter = [];
		renderBreadcrumb("filter");
		if (window.docsReload) window.docsReload({});
	});

	// 조회 버튼
	document.getElementById("btnApplyFilters")?.addEventListener("click", () => {
		const filters = {
			projectCode: ui.filterProjectValue?.value || "",
			projectStatusName: document.getElementById("filterProjectStatus")?.value || "",
			folderCode: ui.filterFolderValue?.value || "",
			fileName: document.getElementById("filterFile")?.value || "",
			createdCode: document.getElementById("filterCreatorValue")?.value || "",
			fileType: document.getElementById("filterFileType")?.value || "",
			createdFrom: document.getElementById("filterCreatedFrom")?.value || "",
			createdTo: document.getElementById("filterCreatedTo")?.value || "",
		};
		if (window.docsReload) window.docsReload(filters);
	});
});