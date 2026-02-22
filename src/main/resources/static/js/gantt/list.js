// /js/gantt/list.js
/**
 * Gantt Chart Module
 * 담당 기능: 데이터 필터링, 트리 구조 변환, 컬러 피커 에디터, 차트 렌더링
 */
(() => {
    /* ========================================================================
       1. Gantt 기본 환경 설정 (Constants & Config)
       ======================================================================== */
    const GANTT_CONFIG = {
        date_format: "%Y-%m-%d %H:%i",
        task_date: "%Y년 %m월 %d일",
        locale: "kr"
    };

    const STATUS_COLORS = {
        '신규': '#90b8ff', '진행': '#ffe27a', '해결': '#a78bfa',
        '반려': '#f8a1d1', '완료': '#8fe6a2'
    };

    const PRIORITY_COLORS = {
        '긴급': '#D97B7B',
        '높음': '#FFB266',
        '보통': '#5AB2FF',
        '낮음': '#69B87C'
    };

    gantt.eachTask(t => {
        if (!t.start_date || !t.end_date) {
            console.log("날짜 없음:", t);
        }
    });

    gantt.templates.task_text = function(start, end, task) {
        if (task.rowType === "PROJECT") {
            return `${task.text} (${task.actualProg ?? 0}%)`;
        }
        if (task.rowType === "TYPE") {
            return `${task.text} (${task.typeActualProg ?? 0}%)`;
        }
        if (task.rowType === "ISSUE") {
            return `${task.text} (${Math.round((task.progress || 0) * 100)}%)`;
        }
        return task.text;
    };

// 그리드 컬럼 정의
const mainGridConfig = {
    columns: [
        { name: "text", tree: true, width: "*", min_width: 200, label: "작업명" },
        {
            name: "priority",
            label: "우선순위",
            align: "center",
            width: 70,
            template: (t) => {
                if (!t.priority) return '';

                const isOverdue = t.end_date && t.end_date < new Date()
                    && t.status !== '완료' && t.status !== '해결';

                // 마감기한 초과면 무조건 빨간색
                const color = isOverdue
                    ? '#dc2626'
                    : (PRIORITY_COLORS[t.priority] || '#374151');

                return `<span style="color:${color}; font-weight:700;">${t.priority}</span>`;
            }
        },
        {
            name: "status",
            label: "상태",
            align: "center",
            width: 70,
            template: (t) => {
                if (!t.status) return '';

                const isOverdue =
                    t.end_date &&
                    t.end_date < new Date() &&
                    t.status !== '완료' &&
                    t.status !== '해결';

                const color = isOverdue
                    ? '#dc2626'
                    : (STATUS_COLORS[t.status] || '#374151');

                return `<span style="color:${color}; font-weight:700;">${t.status}</span>`;
            }
        },
        {
            name: "progress", label: "진척도", align: "center", width: 150, min_width: 150,
            template: (t) => {
                // 프로젝트인 경우 actualProg(planProg) 표시
                if (t.type === gantt.config.types.project) {
                    return `${t.actualProg}% (예상: ${t.planProg}%)`;
                } else if (t.isTypeNode) {
                    return `${t.typeActualProg}%`;
                }
                // 일반 task/issue는 progress 표시
                return `${Math.round((t.progress || 0) * 100)}%`;
            }
        },
        {
            name: "start_date", label: "시작일", align: "center", width: 110, min_width: 110,
            template: (t) => {
                // ISSUE 상태가 "신규"이거나 TYPE 노드인 경우 시작일 빈칸
                if (t.rowType === "ISSUE" && t.status === "신규") {
                    return "";
                }
                return DateUtils.getYYYYMMDD(t.start_date);
            }
        },
        { name: "end_date", label: "종료일", align: "center", width: 110, min_width: 110 },
        { name: "assigneeName", label: "작업자", align: "center", width: 80 },
        //{ name: "add", width: 44 }
    ]
};

// 레이아웃 구성
gantt.config.layout = {
    css: "gantt_container",
    rows: [
        {
            cols: [
                { view: "grid", group: "grids", width: "*", min_width: 600, config: mainGridConfig, scrollY: "scrollVer" },
                { resizer: true, width: 1 },
                { view: "timeline", id: "timeline", scrollX: "scrollHor", scrollY: "scrollVer" },
                { view: "scrollbar", id: "scrollVer" }
            ]
        },
        { view: "scrollbar", id: "scrollHor" }
    ]
};

// 타임라인 스케일 구성
gantt.config.scales = [
    {
        unit: "month",
        step: 1,
        format: function(date) {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            return `${year}년 ${month}월`;
        },
    },
    { unit: "day", step: 1, format: "%d, %D" }
];

gantt.i18n.setLocale(GANTT_CONFIG.locale);
gantt.config.date_format = GANTT_CONFIG.date_format;
gantt.config.task_date = GANTT_CONFIG.task_date;
gantt.config.server_utc = false;

gantt.config.autosize = false;
gantt.config.grid_resize = true;
gantt.config.keep_grid_width = false;
gantt.config.fit_tasks = false;
gantt.config.min_column_width = 50;

// 오늘 기준 6개월 범위 설정
const today = new Date();

// 모달 완전히 비활성화
gantt.config.details_on_dblclick = false;
gantt.config.details_on_create = false;

gantt.config.autosize = false;
gantt.config.grid_resize = true;
gantt.config.keep_grid_width = false;

gantt.templates.grid_row_class = function(start, end, task) {
    if (task.rowType !== 'ISSUE') return '';

    // 마감기한 초과 체크 (완료/해결 제외)
    const isOverdue = task.end_date && task.end_date < new Date()
        && task.status !== '완료' && task.status !== '해결';

    if (isOverdue) return 'row-overdue';

    const priorityMap = {
        '긴급': 'row-priority-now',
        '높음': 'row-priority-high',
        '보통': 'row-priority-medium',
        '낮음': 'row-priority-low'
    };
    return priorityMap[task.priority] || '';
};

// 우선순위별 타임라인 스타일 클래스 매핑
gantt.templates.task_class = (start, end, task) => {
    const classes = [];

    // ✅ PROJECT 먼저 처리
    if (task.rowType === "PROJECT") {
        classes.push("gantt_project");
        classes.push("issue-clickable");
        return classes.join(" ");
    }

    // ✅ TYPE 처리
    if (task.isTypeNode) {
        classes.push("type-node");
        return classes.join(" ");
    }

    // ✅ ISSUE 처리
    if (task.rowType === "ISSUE") {
        classes.push("issue-clickable");

        const isOverdue =
            end && end < new Date() &&
            task.status !== '완료' &&
            task.status !== '해결';

        if (isOverdue) {
            classes.push("overdue-task");
            return classes.join(" ");
        }

        const priorityMap = {
            "긴급": "priority-now",
            "높음": "priority-high",
            "보통": "priority-medium",
            "낮음": "priority-low"
        };

        if (task.priority && priorityMap[task.priority]) {
            classes.push(priorityMap[task.priority]);
        }
    }

    return classes.join(" ");
};

// 마우스 호버 시 툴팁 표시
gantt.templates.tooltip_text = function(start, end, task) {

    // PROJECT 툴팁
    if (task.rowType === "PROJECT") {
        return `
		        <div style="width:220px; font-size:12px; line-height:1.55;">
		            <div style="font-weight:700; margin-bottom:6px;">🗂️ ${task.text}</div>
		            <div style="display:grid; grid-template-columns:80px 1fr; row-gap:2px;">
		                <div>📅 시작일</div><div>${DateUtils.getYYYYMMDD(task.start_date)}</div>
		                <div>📅 종료일</div><div>${DateUtils.getYYYYMMDD(task.end_date)}</div>
		                <div>📈 실제 진척도</div><div>${task.actualProg ?? 0}%</div>
		                <div>📊 예상 진척도</div><div>${task.planProg ?? 0}%</div>
						<div>👤 등록자</div><div>${task.projectCreatorName ?? '-'}</div>
		            </div>
		        </div>`;
    }

    // TYPE 툴팁
    if (task.rowType === "TYPE") {
        return `
		        <div style="width:220px; font-size:12px; line-height:1.55;">
		            <div style="font-weight:700; margin-bottom:6px;">📂 ${task.text}</div>
		            <div style="display:grid; grid-template-columns:80px 1fr; row-gap:2px;">
		                <div>📅 시작일</div><div>${DateUtils.getYYYYMMDD(task.start_date)}</div>
		                <div>📅 종료일</div><div>${DateUtils.getYYYYMMDD(task.end_date)}</div>
		                <div>📈 진척도</div><div>${task.typeActualProg ?? 0}%</div>
		            </div>
		        </div>`;
    }

    // ISSUE 툴팁
    if (task.rowType !== "ISSUE") return null;

    const isOverdue =
        task.end_date &&
        task.end_date < new Date() &&
        task.status !== '완료' &&
        task.status !== '해결';

    const startStr = task.status === '신규' ? '-' : DateUtils.getYYYYMMDD(task.start_date);
    const endStr = task.end_date ? DateUtils.getYYYYMMDD(task.end_date) : '-';

    const typeChain = [task.parTypeName, task.typeName]
        .filter(Boolean)
        .join(' > ');

    return `
		    <div style="
		        width:260px;
		        line-height:1.55;
		        font-size:12px;
		        white-space:normal;
		        word-break:break-word;
		    ">
	        <div style="font-weight:700; margin-bottom:6px;">
	            ${task.title}
	        </div>

	        <div style="display:grid; grid-template-columns:90px 1fr; row-gap:2px;">
	            <div>🗂️ 프로젝트</div><div>${task.projectName ?? '-'}</div>
	            <div>📂 유형</div><div>${typeChain || '-'}</div>
	            <div>📌 작업번호</div><div>${task.issueCode ?? '-'}</div>
				<div>🚦 상태</div>
				<div style="color:${STATUS_COLORS[task.status] || '#e2e8f0'}; font-weight:700;">
				    ${task.status ?? '-'}
				</div>
				<div>⚡ 우선순위</div>
				<div style="color:${PRIORITY_COLORS[task.priority] || '#e2e8f0'}; font-weight:700;">
				    ${task.priority ?? '-'}
				</div>
	            <div>📈 진행률</div><div>${Math.round((task.progress || 0) * 100)}%</div>
	            <div>📅 시작일</div><div>${startStr}</div>
	            <div>📅 종료일</div>
	            <div style="color:${isOverdue ? '#ff6b6b' : 'inherit'}">
	                ${endStr}${isOverdue ? ' (초과)' : ''}
	            </div>
	            <div>👤 담당자</div><div>${task.assigneeName ?? '-'}</div>
	        </div>
	    </div>
	    `;
};

// 기본 툴팁 활성화
gantt.config.tooltip_enable = true;
gantt.config.tooltip_timeout = 30; // 툴팁 표시 딜레이 (밀리초)
gantt.config.tooltip_offset_x = 12;
gantt.config.tooltip_offset_y = 18;

/* ========================================================================
   2. 유틸리티 및 필터 로직 (Business Logic)
   ======================================================================== */
// data: 전체 Gantt 데이터
// filters: { title, type, projectCode, status, priority, assigneeCode, creatorCode, createdAt, dueAt }
const getFilteredDataWithHierarchy = (data, filters) => {
    const title = filters.title?.trim()?.toLowerCase();
    const tCode = filters.type?.trim() || "";
    const pCode = filters.projectCode?.trim() || "";

    // 1. 선택한 유형의 모든 하위 유형 코드 수집
    let typeCodesSet = new Set();
    if (tCode) {
        // 모든 TYPE 데이터에서 부모-자식 관계 파악
        const typeMap = {};
        data.filter(d => d.rowType === "TYPE").forEach(t => {
            typeMap[t.typeCode] = t;
        });

        // 재귀적으로 하위 유형 찾기
        const getAllChildTypes = (parentCode) => {
            const codes = new Set([parentCode]);
            const findChildren = (code) => {
                Object.values(typeMap).forEach(type => {
                    if (type.parTypeCode && String(type.parTypeCode) === String(code)) {
                        codes.add(String(type.typeCode));
                        findChildren(String(type.typeCode));
                    }
                });
            };
            findChildren(parentCode);
            return codes;
        };

        typeCodesSet = getAllChildTypes(tCode);
    }

    // 2. ISSUE 필터링
    const filteredIssues = data.filter(item => {
        if (item.rowType !== "ISSUE") return false;
        let ok = true;
        // 프로젝트
        if (pCode && String(item.projectCode) !== String(pCode)) {
            ok = false;
        }

        // 일감
        if (title && !(item.title || "").toLowerCase().includes(title)) {
            ok = false;
        }

        // 유형 (하위 포함)
        if (tCode && !typeCodesSet.has(String(item.typeCode))) {
            ok = false;
        }

        // 상태
        if (filters.status && item.issueStatus !== filters.status) {
            ok = false;
        }

        // 우선순위
        if (filters.priority && item.priority !== filters.priority) {
            ok = false;
        }

        // 담당자 코드
        if (filters.assigneeCode &&
            String(item.assigneeCode) !== String(filters.assigneeCode)) {
            ok = false;
        }

        // 등록자 코드
        if (filters.creatorCode &&
            String(item.creatorCode) !== String(filters.creatorCode)) {
            ok = false;
        }

        // 등록일
        if (filters.createdAt) {
            const created = toValidDate(item.createdOn);
            const filterDate = toValidDate(filters.createdAt);

            if (!created || !filterDate ||
                created.toDateString() !== filterDate.toDateString()) {
                ok = false;
            }
        }

        // 마감기한
        if (filters.dueAt) {
            const end = toValidDate(item.issueEndDate);
            const filterDate = toValidDate(filters.dueAt);

            if (!end || !filterDate ||
                end.toDateString() !== filterDate.toDateString()) {
                ok = false;
            }
        }

        return ok;
    });

    // ISSUE map
    const issueMap = {};
    filteredIssues.forEach(i => issueMap[i.issueCode] = i);

    // 3. TYPE map
    const typeMap = {};
    data.filter(d => d.rowType === "TYPE").forEach(t => {
        typeMap[String(t.typeCode)] = t;  // ← String()으로 감싸기
    });

    // 4. 필터링된 이슈가 속한 TYPE만 (상위 TYPE 포함) 수집
    const validTypes = new Set();

    const hasAnyFilter = pCode || title || tCode || filters.status ||
        filters.priority || filters.assigneeCode ||
        filters.creatorCode || filters.createdAt || filters.dueAt;

    if (hasAnyFilter) {
        // 필터링된 이슈가 속한 TYPE과 그 상위 TYPE 포함
        filteredIssues.forEach(issue => {
            let type = typeMap[String(issue.typeCode)];
            while (type) {
                validTypes.add(type.typeCode);
                if (!type.parTypeCode) break;
                type = typeMap[String(type.parTypeCode)];
            }
        });

        // 유형 필터 선택 시
        if (tCode) {
            // 선택한 TYPE + 하위 TYPE 추가
            typeCodesSet.forEach(code => {
                const type = typeMap[String(code)];
                if (type) validTypes.add(type.typeCode);
            });

            // 상위 TYPE 체인 추가 (렌더링을 위해 필수)
            typeCodesSet.forEach(code => {
                let type = typeMap[String(code)];
                while (type && type.parTypeCode) {
                    const parentType = typeMap[String(type.parTypeCode)];
                    if (parentType) validTypes.add(parentType.typeCode);
                    type = parentType;
                }
            });

            // 형제 TYPE 제거: validTypes 중 typeCodesSet에도 없고 상위 체인도 아닌 것 제거
            // → validTypes에서 "선택한 TYPE의 자손도 아니고 조상도 아닌" TYPE 제거
            const ancestorTypes = new Set();
            typeCodesSet.forEach(code => {
                let type = typeMap[String(code)];
                while (type && type.parTypeCode) {
                    const parentType = typeMap[String(type.parTypeCode)];
                    if (parentType) ancestorTypes.add(String(parentType.typeCode));
                    type = parentType;
                }
            });

            // validTypes 재구성: 선택한 TYPE의 자손 + 조상만 남기고 형제 제거
            for (const typeCode of [...validTypes]) {
                const isDescendant = typeCodesSet.has(String(typeCode));
                const isAncestor = ancestorTypes.has(String(typeCode));
                if (!isDescendant && !isAncestor) {
                    validTypes.delete(typeCode);
                }
            }
        }

    } else {
        // 필터가 없을 때: 모든 TYPE 표시 (기존 동작 유지)
        data.filter(d => d.rowType === "TYPE").forEach(type => {
            validTypes.add(type.typeCode);
        });
    }

    // 5. PROJECT 체크
    const validProjects = new Set();
    data.filter(d => d.rowType === "PROJECT").forEach(p => {
        const hasValidIssue = data.some(item =>
            item.rowType === "ISSUE" && issueMap[item.issueCode] && item.projectCode === p.projectCode
        );

        if (tCode) {
            // 유형 필터: typeCodesSet에 속한 TYPE이 이 프로젝트 소속인지 확인
            const hasMatchedType = data.some(item =>
                item.rowType === "TYPE" &&
                typeCodesSet.has(String(item.typeCode)) &&
                item.projectCode === p.projectCode
            );
            if (hasMatchedType || hasValidIssue) validProjects.add(p.projectCode);
        } else {
            const hasValidType = data.some(item =>
                item.rowType === "TYPE" && validTypes.has(item.typeCode) && item.projectCode === p.projectCode
            );
            if (hasValidIssue || hasValidType) validProjects.add(p.projectCode);
        }
    });

    // 6. 최종 필터링
    const filteredData = data.filter(item => {
        if (item.rowType === "ISSUE") return !!issueMap[item.issueCode];
        if (item.rowType === "TYPE") return validTypes.has(item.typeCode);
        if (item.rowType === "PROJECT") return validProjects.has(item.projectCode);
        return false;
    });

    return filteredData;
};

/* ========================================================================
   3. 데이터 변환 로직 (Data Transformation)
   ======================================================================== */
/* ========================================================================
   날짜 선택 유틸 (rowType 기준)
   ======================================================================== */
function toValidDate(value) {
    if (!value) return null;

    // YYYY-MM-DD 직접 파싱
    const parts = value.split("-");
    if (parts.length === 3) {
        return new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2]),
            12, 0, 0
        );
    }

    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

const transformToGanttFormat = (data) => {
    const tasks = [];
    const links = [];

    const typeMap = {};
    data.forEach(r => {
        if (r.rowType === 'TYPE') {
            typeMap[r.typeCode] = {
                typeName: r.typeName,
                parTypeName: r.parTypeName
            };
        }
    });

    data.forEach(item => {
        const id = item.nodeId;
        const parent = item.parentId ? item.parentId : 0;

        // =========================
        // PROJECT
        // =========================
        if (item.rowType === "PROJECT") {
            const start = toValidDate(item.createdOn) || gantt.config.start_date;
            const end =
                toValidDate(item.projectEndDate) ||
                toValidDate(item.completedOn) ||
                gantt.config.end_date; // ✅ 기본값을 범위 끝으로

            if (!start || !end) {
                return;
            }

            tasks.push({
                id: id,
                text: item.projectName,
                start_date: start,
                end_date: end,
                type: gantt.config.types.project,
                parent: 0,
                open: true,
                progress: (item.actualProg || 0) / 100,
                actualProg: item.actualProg || 0,
                planProg: item.planProg || 0,
                rowType: "PROJECT",
                projectCode: item.projectCode,
                projectCreatorName: item.projectCreatorName
            });
        }

        // =========================
        // TYPE
        // =========================
        else if (item.rowType === "TYPE") {
            let start = toValidDate(item.startAt);
            let end = toValidDate(item.endAt);

            if (!start && !end) {
                start = gantt.config.start_date;
                end = gantt.config.end_date;
            }
            if (!start) start = new Date(end);
            if (!end) end = new Date(start);

            tasks.push({
                id: id,
                text: item.typeName,
                start_date: start,
                end_date: end,
                type: gantt.config.types.task,
                parent: parent,
                open: true,
                isTypeNode: true,
                progress: (item.typeActualProg || 0) / 100,
                typeActualProg: item.typeActualProg || 0,
                typePlanProg: item.typePlanProg || 0,
                rowType: "TYPE",
                typeCode: item.typeCode,
                parTypeCode: item.parTypeCode
            });

            // PROJECT → TYPE 링크 생성
            if (parent && parent !== 0) {
                links.push({
                    id: `LINK_${parent}_${id}`,
                    source: parent,
                    target: id,
                    type: "1" // finish-to-start
                });
            }
        }

        // =========================
        // ISSUE
        // =========================
        else if (item.rowType === "ISSUE") {
            let start = toValidDate(item.issueStartDate);
            let end = toValidDate(item.issueEndDate);

            if (!start && !end) {
                start = new Date();
                end = new Date();
            }
            if (!start && end) start = new Date(end);
            if (start && !end) end = new Date(start);

            const typeInfo = typeMap[item.typeCode] || {};

            tasks.push({
                id: id,
                text: item.title,
                title: item.title,
                start_date: start,
                end_date: end,
                progress: (item.progress || 0) / 100,
                priority: item.priority,
                status: item.issueStatus,
                assigneeName: item.assigneeName,
                parent: parent,
                type: gantt.config.types.task,
                rowType: "ISSUE",
                issueCode: item.issueCode,
                typeCode: item.typeCode,
                projectName: item.projectName,
                typeName: typeInfo.typeName,
                parTypeName: typeInfo.parTypeName
            });

            // TYPE → ISSUE 링크 생성
            if (parent && parent !== 0) {
                links.push({
                    id: `LINK_${parent}_${id}`,
                    source: parent,
                    target: id,
                    type: "1"
                });
            }

        }
    });

    return { data: tasks, links };
};

/* ========================================================================
   4. 실행부 및 API 연결 (Executions)
   ======================================================================== */
const fData = async (filters = {}) => {
    try {
        const response = await fetch("/ganttData");
        const rawData = await response.json();

        const filtered = getFilteredDataWithHierarchy(rawData, filters);

        gantt.clearAll();

        const rangeStart = window.ganttRange?.start
            ?? new Date(today.getFullYear(), today.getMonth(), 1);
        const rangeEnd = window.ganttRange?.end
            ?? new Date(today.getFullYear(), today.getMonth() + 6, 0);

        const ganttData = transformToGanttFormat(filtered);

        // ✅ 빈 데이터 처리
        const emptyEl = document.getElementById("ganttEmptyState");
        const ganttEl = document.getElementById("e7eGantt");

        if (!ganttData.data || ganttData.data.length === 0) {
            if (emptyEl) emptyEl.style.display = "flex";
            if (ganttEl) ganttEl.style.visibility = "hidden";
            return;
        } else {
            if (emptyEl) emptyEl.style.display = "none";
            if (ganttEl) ganttEl.style.visibility = "visible";
        }

        gantt.parse(ganttData);

        gantt.showDate(rangeStart);

        setTimeout(() => {
            gantt.eachTask(function(task) {
                gantt.open(task.id);
            });
        }, 100);
    } catch (e) {
        console.error("Gantt 데이터 조회 실패:", e);
    }
};

// 전역 노출
window.ganttReload = fData;

// 초기 실행 환경 조성
const initApp = () => {
    // 간트 초기화
    window.addEventListener("load", () => {
        // gantt.init() 전에 툴팁 설정
        gantt.plugins({
            tooltip: true
        });

        gantt.config.show_links = true;

        gantt.config.tooltip_offset_x = 10;
        gantt.config.tooltip_offset_y = 30;

        gantt.init("e7eGantt");

        const ro = new ResizeObserver(() => {
            gantt.setSizes();
            gantt.render();
        });

        const ganttEl = document.querySelector("#e7eGantt");
        if (ganttEl) {
            ro.observe(ganttEl);
        }
        // 모든 태스크를 펼친 상태로 표시
        gantt.config.open_tree_initially = true;

        // PROJECT/ISSUE 클릭 시 상세페이지 이동
        gantt.attachEvent("onTaskClick", function(id, e) {
            const task = gantt.getTask(id);

            // 화살표 클릭이면 상세페이지 이동 막고 그냥 트리 열기/닫기
            if (e.target && e.target.classList.contains("gantt_tree_icon")) {
                return true; // 기본 트리 동작 허용
            }

            // 프로젝트 클릭
            if (task.rowType === "PROJECT" && task.projectCode) {
                // 상세페이지 이동
                window.location.href = `/project/overview/${task.projectCode}`;
                return false; // 기본 클릭 동작 차단
            }
            // 일감만 이동 (rowType 기준)
            else if (task.rowType === "ISSUE" && task.issueCode) {
                // 상세페이지 이동
                window.location.href = `/issueInfo?issueCode=${task.issueCode}`;
                return false; // 기본 클릭 동작 차단
            }

            return true;
        });

        gantt.setSizes();
        fData();
    });

    window.addEventListener("resize", () => {
        gantt.setSizes()
        gantt.render();
    });
};

initApp();

}) ();