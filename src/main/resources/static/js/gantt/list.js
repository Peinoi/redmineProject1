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
				template: (t) => {
					// 프로젝트인 경우 actualProg 표시
					if (t.type === gantt.config.types.project && t.actualProg !== undefined) {
						return `${t.actualProg}%`;
					}
					// 일반 task/issue는 progress 표시
					return `${Math.round((t.progress || 0) * 100)}%`;
				}
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
		// TYPE 노드인 경우
		if (task.isTypeNode) {
			return "type-node";
		}

		// ISSUE 노드인 경우 우선순위별 클래스
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
			const { projectCode, title, status, priority, assigneeCode, issueStartDateFrom, issueStartDateTo, issueEndDate } = filters;

			if (projectCode && String(item.projectCode) !== String(projectCode)) return false;
			if (title && !item.title.toLowerCase().includes(title.toLowerCase())) return false;
			if (status && item.issueStatus !== status) return false;
			if (priority && item.priority !== priority) return false;
			if (assigneeCode && String(item.assigneeCode) !== String(assigneeCode)) return false;

			// 기간 필터
			if (issueStartDateFrom || issueStartDateTo) {
				if (!DateUtils.isDateInRange(item.issueStartDate, issueStartDateFrom, issueStartDateTo)) return false;
			}
			// 마감일 필터
			if (issueEndDate && DateUtils.getYYYYMMDD(item.issueEndDate) > issueEndDate) return false;

			return true;
		});
	};

	/* ========================================================================
	   3. 데이터 변환 로직 (Data Transformation)
	   ======================================================================== */
	const transformToGanttFormat = (data) => {
		const tasks = [];
		const links = [];
		const projectSet = new Set();
		let linkId = 1;

		// 프로젝트별로 그룹화
		const projectMap = {};
		data.forEach(item => {
			if (!projectMap[item.projectCode]) projectMap[item.projectCode] = [];
			projectMap[item.projectCode].push(item);
		});

		for (const [projectCode, issues] of Object.entries(projectMap)) {
			const projectId = `project_${projectCode}`;

			// 1. 프로젝트 노드
			if (!projectSet.has(projectId)) {
				projectSet.add(projectId);

				const projectRow = issues.find(r => r.rowType === "PROJECT");

				const projectStart = DateUtils.getYYYYMMDD(projectRow?.createdOn);
				const projectEnd = DateUtils.getYYYYMMDD(projectRow?.projectEndDate);

				// start_date 없으면 gantt 전체가 죽으니 방어
				if (!projectStart || !projectEnd) {
					console.error("PROJECT DATE INVALID", projectRow);
					continue;
				}

				tasks.push({
					id: projectId,
					text: issues[0].projectName,
					start_date: projectStart,
					end_date: projectEnd,
					type: gantt.config.types.project,
					parent: 0,
					open: true,
					progress: (projectRow?.actualProg || 0) / 100,  // 프로젝트는 actualProg 사용
					actualProg: projectRow?.actualProg || 0,        // 그리드 표시용
					planProg: projectRow?.planProg || 0
				});
			}

			const typeMap = {}; // typeCode → ganttId
			const issueMap = {}; // 이슈번호 → gantt id

			// 2. TYPE 노드 먼저 전부 수집
			issues.forEach(item => {
				if (item.rowType !== "TYPE") return;

				const start = DateUtils.getYYYYMMDD(item.typeStartDate);
				const end = DateUtils.getYYYYMMDD(item.typeEndDate);

				// TYPE 날짜가 없으면 skip
				if (!start || !end) {
					console.warn("TYPE DATE MISSING", item);
					return;
				}

				const typeId = `TYPE_${item.typeCode}`;

				if (!typeMap[item.typeCode]) {
					typeMap[item.typeCode] = {
						id: typeId,
						typeCode: item.typeCode,
						parTypeCode: item.parTypeCode
					};

					tasks.push({
						id: typeId,
						text: item.typeName,
						start_date: start,
						end_date: end,
						type: gantt.config.types.task,
						parent: projectId,
						open: true,
						isTypeNode: true,
						progress: 0
					});
				}
			});

			// 3. TYPE parent 연결
			Object.values(typeMap).forEach(type => {
				let parentId = projectId;

				if (type.parTypeCode && typeMap[type.parTypeCode]) {
					parentId = typeMap[type.parTypeCode].id;
				}

				const task = tasks.find(t => t.id === type.id);
				if (task) task.parent = parentId;
			});


			// 4. 타입별 트리 생성
			issues.forEach(item => {
				if (item.rowType !== "ISSUE") return;

				const start = DateUtils.getYYYYMMDD(item.issueStartDate);
				const end = DateUtils.getYYYYMMDD(item.issueEndDate);

				// 종료일 < 시작일 → skip
				if (!start || !end || new Date(end) < new Date(start)) return;

				let parentId;

				// 상위 일감
				if (item.parIssueCode && issueMap[item.parIssueCode]) {
					parentId = issueMap[item.parIssueCode];
				} else if (item.typeCode && typeMap[item.typeCode]) { // 타입
					parentId = typeMap[item.typeCode].id;
				} else {
					parentId = projectId;
				}

				// 상위 이슈가 있으면 parentId 덮어쓰기
				const issueId = `ISSUE_${item.issueCode}`;

				// 실제 이슈 노드 추가
				tasks.push({
					id: issueId,
					text: item.title,
					start_date: start,
					end_date: end,
					duration: item.duration || 1,
					progress: (item.progress || 0) / 100,
					priority: item.priority,
					status: item.issueStatus,
					assigneeName: item.assigneeName,
					parent: parentId
				});

				issueMap[item.issueCode] = issueId;

				// 상위 이슈 링크
				if (item.parIssueCode && issueMap[item.parIssueCode]) {
					links.push({
						id: linkId++,
						source: issueMap[item.parIssueCode],
						target: issueId,
						type: "1" // FS
					});
				}
				// 상위 차입 링크(ISSUE의 parent가 TYPE인 경우)
				else if (item.typeCode && typeMap[item.typeCode]) {
					links.push({
						id: linkId++,
						source: typeMap[item.typeCode].id,
						target: issueId,
						type: "1"
					});
				}
				// 상위 PROJECT 링크 (TYPE도 없고 상위 ISSUE도 없는 경우)
				else {
					links.push({
						id: linkId++,
						source: projectId,
						target: issueId,
						type: "1"
					});
				}
			});

			// 상위 PROJECT → TYPE 링크 (TYPE 노드 추가 후)
			Object.values(typeMap).forEach(type => {
				let parentId = projectId;
				if (type.parTypeCode && typeMap[type.parTypeCode]) {
					parentId = typeMap[type.parTypeCode].id;
				}
				
				// TYPE 링크 추가
				links.push({
					id: linkId++,
					source: parentId,
					target: type.id,
					type: "1"
				});
			});
		}

		return { data: tasks, links };
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
			gantt.parse(ganttData);
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