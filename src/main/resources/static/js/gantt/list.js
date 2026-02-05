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

    // 그리드 컬럼 정의
    const mainGridConfig = {
        columns: [
            { name: "text", tree: true, width: 200, label: "작업명" },
            { name: "priority", label: "우선순위", align: "center", width: 70 },
            { name: "status", label: "상태", align: "center", width: 70 },
            {
                name: "progress", label: "진척도", align: "center", width: 60,
                template: (t) => `${Math.round((t.progress || 0) * 100)}%`
            },
            { name: "start_date", label: "시작일", align: "center", width: 110 },
            { name: "end_date", label: "종료일", align: "center", width: 110 },
            { name: "assigneeName", label: "작업자", align: "center", width: 80 },
            { name: "add", width: 44 }
        ]
    };

    // 레이아웃 구성
    gantt.config.layout = {
        css: "gantt_container",
        rows: [
            {
                cols: [
                    { view: "grid", group: "grids", config: mainGridConfig, scrollY: "scrollVer" },
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
        { unit: "month", step: 1, format: "%Y-%m" },
        { unit: "day", step: 1, format: "%d, %D" }
    ];

    gantt.i18n.setLocale(GANTT_CONFIG.locale);
    gantt.config.date_format = GANTT_CONFIG.date_format;
    gantt.config.task_date = GANTT_CONFIG.task_date;

    // 우선순위별 스타일 클래스 매핑
    gantt.templates.task_class = (start, end, task) => {
        const priorityMap = { "긴급": "priority-now", "높음": "priority-high", "보통": "priority-medium", "낮음": "priority-low" };
        return priorityMap[task.priority] || "";
    };

    /* ========================================================================
       2. 유틸리티 및 필터 로직 (Business Logic)
       ======================================================================== */
    const DateUtils = {
        // ISO 문자열에서 YYYY-MM-DD만 추출
        getYYYYMMDD: (d) => d?.split('T')[0] || "",

        // 일감 시작일이 지정된 범위 내에 있는지 검사
        isDateInRange: (issueStartStr, from, to) => {
            const target = DateUtils.getYYYYMMDD(issueStartStr);
            if (!target) return false;
            if (from && to) return target >= from && target <= to;
            if (from) return target >= from;
            if (to) return target <= to;
            return true;
        }
    };

    /**
     * @param {Array} data 원본 데이터
     * @param {Object} filters 검색 조건 객체
     * @returns {Array} 필터링된 데이터
     */
    const getFilteredData = (data, filters) => {
        return data.filter(item => {
            const { projectCode, title, status, priority, assigneeCode, startDateFrom, startDateTo, endDate } = filters;

            if (projectCode && String(item.projectCode) !== String(projectCode)) return false;
            if (title && !item.title.toLowerCase().includes(title.toLowerCase())) return false;
            if (status && item.issueStatus !== status) return false;
            if (priority && item.priority !== priority) return false;
            if (assigneeCode && String(item.assigneeCode) !== String(assigneeCode)) return false;

            // 기간 필터
            if (startDateFrom || startDateTo) {
                if (!DateUtils.isDateInRange(item.issueStartDate, startDateFrom, startDateTo)) return false;
            }
            // 마감일 필터
            if (endDate && DateUtils.getYYYYMMDD(item.issueEndDate) > endDate) return false;

            return true;
        });
    };

    /* ========================================================================
       3. 데이터 변환 로직 (Data Transformation)
       ======================================================================== */
    const transformToGanttFormat = (filteredData) => {
        const projectMap = new Map();

        // 1. 프로젝트 단위로 그룹화
        filteredData.forEach(item => {
            if (!projectMap.has(item.projectCode)) {
                projectMap.set(item.projectCode, {
                    name: item.projectName,
                    progress: item.projectProgress,
                    issues: []
                });
            }
            projectMap.get(item.projectCode).issues.push(item);
        });

        const finalData = [];

        // 2. 부모-자식 트리 구조 생성
        projectMap.forEach((project, code) => {
            let pStart = Infinity;
            let pEnd = -Infinity;

            const childTasks = project.issues.map(item => {
                const s = DateUtils.getYYYYMMDD(item.issueStartDate);
                const e = DateUtils.getYYYYMMDD(item.issueEndDate);

                // 부모 프로젝트의 전체 기간 자동 계산을 위한 최소/최대값 갱신
                if (s) pStart = Math.min(pStart, new Date(s));
                if (e) pEnd = Math.max(pEnd, new Date(e));

                return {
                    id: item.issueCode,
                    text: item.title,
                    start_date: s ? new Date(s) : null,
                    end_date: e ? new Date(e) : null,
                    duration: item.duration || 1,
                    progress: (item.progress || 0) / 100,
                    priority: item.priority,
                    status: item.issueStatus,
                    assigneeName: item.assigneeName,
                    user: item.assigneeCode || "0",
                    parent: `project_${code}`
                };
            });

            // 부모 프로젝트 데이터 구성
            const parentNode = {
                id: `project_${code}`,
                text: project.name,
                start_date: isFinite(pStart) ? new Date(pStart) : null,
                end_date: isFinite(pEnd) ? new Date(pEnd) : null,
                progress: (project.progress || 0) / 100,
                parent: 0,
                open: true,
                type: gantt.config.types.project
            };

            finalData.push(parentNode, ...childTasks);
        });

        return finalData;
    };

    /* ========================================================================
       4. 실행부 및 API 연결 (Executions)
       ======================================================================== */
    const fData = async (filters = {}) => {
        try {
            const response = await fetch("/ganttData");
            const rawData = await response.json();

            const filtered = getFilteredData(rawData, filters);
            const ganttData = transformToGanttFormat(filtered);

            gantt.clearAll();
            gantt.parse({ data: ganttData, links: [] });
        } catch (e) {
            console.error("Gantt 데이터 조회 실패:", e);
        }
    };

    // 전역 노출
    window.ganttReload = fData;

    // 초기 실행 환경 조성
    const initApp = () => {
        // 검색 폼 HTML 로드
        fetch('search.html')
            .then(res => res.text())
            .then(html => document.getElementById('search').innerHTML = html);

        // 간트 초기화
        window.addEventListener("load", () => {
            gantt.init("e7eGantt");
            gantt.setSizes();
            fData();
        });

        window.addEventListener("resize", () => gantt.setSizes());
    };

    initApp();

})();