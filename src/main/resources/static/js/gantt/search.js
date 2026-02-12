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
    // Gantt 필터 객체 만들기
    // -------------------------
    const getGanttFilters = () => {
        const sCode = ui.status?.value?.trim() || "";
        const prCode = ui.priority?.value?.trim() || "";
        const sLabel = sCode ? STATUS_LABEL[sCode] : "";
        const prLabel = prCode ? PRIORITY_LABEL[prCode] : "";

        return {
            projectCode: ui.projectValue?.value || "",
            title: ui.title?.value?.trim()?.toLowerCase() || "",
            type: ui.typeValue?.value || "",
            status: sLabel,  // 라벨로 변환
            priority: prLabel,  // 라벨로 변환
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
        const ok = await ensureProjectCache();
        if (!ok) return;
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
        const ok = await ensureUserCache();
        if (!ok) return;
        renderListButtons(listEl, userCache, (picked) => {
            if (type === "assignee") {
                ui.assigneeText.value = picked.name;
                ui.assigneeValue.value = picked.code;
            } else {
                ui.creatorText.value = picked.name;
                ui.creatorValue.value = picked.code;
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

            // 3. 프로젝트 소속 유형 리스트 생성
            if (p.children && p.children.length > 0) {
                const rootUl = document.createElement("ul");
                p.children.forEach(t => rootUl.appendChild(createNode(t)));
                groupWrapper.appendChild(rootUl);
            }

            // 최종 컨테이너에 그룹 추가
            container.appendChild(groupWrapper);
        });
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

        // Gantt 필터 적용
        if (window.ganttReload) {
            const filters = getGanttFilters();
            console.log("적용할 필터:", filters);
            window.ganttReload(filters);
        } else {
            showToast("Gantt 차트가 아직 초기화되지 않았습니다.");
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

        // Gantt 차트 초기화 (필터 없이 전체 데이터)
        if (window.ganttReload) {
            window.ganttReload({});
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
        const ok = await ensureUserCache();
        if (!ok) return;
        const q = ui.assigneeModalSearch.value.trim().toLowerCase();
        renderListButtons(
            ui.assigneeModalList,
            userCache.filter(u => u.name.toLowerCase().includes(q)),
            picked => {
                ui.assigneeText.value = picked.name;
                ui.assigneeValue.value = picked.code;
                assigneeModal?.hide();
            }
        );
    });

    ui.creatorModalSearch?.addEventListener("input", async () => {
        const ok = await ensureUserCache();
        if (!ok) return;
        const q = ui.creatorModalSearch.value.trim().toLowerCase();
        renderListButtons(
            ui.creatorModalList,
            userCache.filter(u => u.name.toLowerCase().includes(q)),
            picked => {
                ui.creatorText.value = picked.name;
                ui.creatorValue.value = picked.code;
                creatorModal?.hide();
            }
        );
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
            filteredTypes = typeCache;
        }

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