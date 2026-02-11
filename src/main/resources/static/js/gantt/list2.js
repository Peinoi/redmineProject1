// list.js
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
				name: "progress", label: "진척도", align: "center", width: 150,
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
				name: "start_date", label: "시작일", align: "center", width: 110,
				template: (t) => {
					// 일감 상태가 "신규"일때 빈칸으로 표시
					if (t.status === "신규") {
						return "";
					}
					return DateUtils.getYYYYMMDD(t.start_date);
				}
			},
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

	// 오늘 기준 6개월 범위 설정
	const today = new Date();
	const startDate = new Date(today.getFullYear(), today.getMonth(), 1);  // 이번 달 1일
	const endDate = new Date(today.getFullYear(), today.getMonth() + 6, 0);  // 6개월 후 마지막 날

	gantt.config.start_date = startDate;
	gantt.config.end_date = endDate;

	// 모달 완전히 비활성화
	gantt.config.details_on_dblclick = false;
	gantt.config.details_on_create = false;

	// 우선순위별 스타일 클래스 매핑
	gantt.templates.task_class = (start, end, task) => {
		if (task.isTypeNode) {
			return "type-node";
		}

		const classes = [];
		// ISSUE는 클릭 가능 표시
		if (task.rowType === "ISSUE") {
			classes.push("issue-clickable");
		}

		// 우선순위 클래스 추가
		const priorityMap = { "긴급": "priority-now", "높음": "priority-high", "보통": "priority-medium", "낮음": "priority-low" };
		if (task.priority && priorityMap[task.priority]) {
			classes.push(priorityMap[task.priority]);
		}

		return classes.join(" ");
	};

	// 마우스 호버 시 툴팁 표시
	gantt.templates.tooltip_text = function(start, end, task) {
		// ISSUE만 툴팁 표시
		if (task.rowType === "ISSUE") {
			return `
					작업번호 : ${task.issueCode}<br>
					작업명 : ${task.title}<br>
					시작일 : ${task.status === "신규" ? "" : DateUtils.getYYYYMMDD(task.start_date)}<br>
					종료일 : ${DateUtils.getYYYYMMDD(task.end_date)}<br>
					진행률 : ${Math.round((task.progress || 0) * 100)}%<br>
					우선순위 : ${task.priority || "-"}<br>
					상태 : ${task.status || "-"}
					        `;
		}
		return null;
	};

	// 기본 툴팁 활성화
	gantt.config.tooltip_enable = true;
	gantt.config.tooltip_timeout = 30; // 툴팁 표시 딜레이 (밀리초)

	/* ========================================================================
	   2. 유틸리티 및 필터 로직 (Business Logic)
	   ======================================================================== */
	const getFilteredData = (data, filters) => {
		return data.filter(item => {
			const { projectCode, title, status, priority, assigneeCode, issueStartDateFrom, issueStartDateTo } = filters;

			// 프로젝트
			if (item.rowType === "PROJECT") {
				// 프로젝트 코드 필터만 적용
				if (projectCode && String(item.projectCode) !== String(projectCode)) return false;
				return true;
			}

			// TYPE도 항상 포함 (필터 적용 안함)
			if (item.rowType === "TYPE") {
				// 프로젝트 코드 필터만 적용
				if (projectCode && String(item.projectCode) !== String(projectCode)) return false;
				return true;
			}

			// 이하 ISSUE에만 필터 적용
			if (projectCode && String(item.projectCode) !== String(projectCode)) return false;
			if (title && !item.title.toLowerCase().includes(title.toLowerCase())) return false;

			if (status) {
				if (item.rowType === "ISSUE") {
					if (item.issueStatus !== status) return false;
				}
			}

			if (priority && item.priority !== priority) return false;
			if (assigneeCode && String(item.assigneeCode) !== String(assigneeCode)) return false;

			// 기간 필터
			if (issueStartDateFrom || issueStartDateTo) {
				if (!DateUtils.isDateInRange(item.issueStartDate, issueStartDateFrom, issueStartDateTo)) return false;
			}

			return true;
		});
	};

	/* ========================================================================
	   3. 데이터 변환 로직 (Data Transformation)
	   ======================================================================== */
	/* ========================================================================
	   날짜 선택 유틸 (rowType 기준)
	   ======================================================================== */
	function getStartDate(item) {
		if (item.rowType === "ISSUE") return item.issueStartDate;
		if (item.rowType === "TYPE") return item.typeStartDate;
		if (item.rowType === "PROJECT") return item.createdOn;
		return null;
	}

	function getEndDate(item) {
		if (item.rowType === "ISSUE") return item.issueEndDate;
		if (item.rowType === "TYPE") return item.typeEndDate;
		if (item.rowType === "PROJECT") return item.projectEndDate;
		return null;
	}

	function toValidDate(value) {
		if (!value) return null;
		const d = new Date(value);
		return isNaN(d.getTime()) ? null : d;
	}


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

				const projectStart = toValidDate(projectRow?.createdOn);
				const projectEnd =
					toValidDate(projectRow?.projectEndDate)
					|| toValidDate(projectRow?.completedOn)
					|| projectStart;

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
					planProg: projectRow?.planProg || 0,
					rowType: "PROJECT",
					projectCode: projectCode
				});
			}

			const typeMap = {}; // typeCode → ganttId
			const issueMap = {}; // 이슈번호 → gantt id

			// 2. TYPE 노드 먼저 전부 수집
			issues.forEach(item => {
				if (item.rowType !== "TYPE") return;

				const start = toValidDate(item.typeStartDate);
				const end = toValidDate(item.typeEndDate);

				// TYPE 날짜가 없으면 skip
				if (!start || !end) {
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
						progress: (item.typeActualProg || 0) / 100,  // 타입은 typeActualProg 사용
						typeActualProg: item.typeActualProg || 0,
						typePlanProg: item.typePlanProg || 0
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

				const start = toValidDate(item.issueStartDate);
				const end = toValidDate(item.issueEndDate);

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
					text: `${item.title}`,
					title: item.title,  // 원본 title 저장
					start_date: start,
					end_date: end,
					duration: item.duration || 1,
					progress: (item.progress || 0) / 100,
					priority: item.priority,
					status: item.issueStatus,
					assigneeName: item.assigneeName,
					parent: parentId,
					rowType: "ISSUE",
					issueCode: item.issueCode
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
		// 간트 초기화
		window.addEventListener("load", () => {
			// gantt.init() 전에 툴팁 설정
			gantt.plugins({
				tooltip: true
			});

			gantt.config.tooltip_offset_x = 10;
			gantt.config.tooltip_offset_y = 30;

			gantt.init("e7eGantt");

			// 간트 기간 필터링
			gantt.attachEvent("onBeforeTaskDisplay", function(id, task) {
				if (!window.ganttRange) return true;

				return (
					task.end_date >= window.ganttRange.start &&
					task.start_date <= window.ganttRange.end
				);
			});

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
					window.location.href = `/projectInfo?projectCode=${task.projectCode}`;
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

		window.addEventListener("resize", () => gantt.setSizes());
	};

	initApp();

})();