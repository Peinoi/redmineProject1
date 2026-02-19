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

	// 그리드 컬럼 정의
	const mainGridConfig = {
		columns: [
			{ name: "text", tree: true, width: "*", min_width: 200, label: "작업명" },
			{ name: "priority", label: "우선순위", align: "center", width: 70 },
			{ name: "status", label: "상태", align: "center", width: 70 },
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
	gantt.config.min_column_width = 40;

	// 오늘 기준 6개월 범위 설정
	const today = new Date();
	const startDate = new Date(today.getFullYear(), today.getMonth(), 1);  // 이번 달 1일
	const endDate = new Date(today.getFullYear(), today.getMonth() + 6, 0);  // 6개월 후 마지막 날

	gantt.config.start_date = startDate;
	gantt.config.end_date = endDate;

	// 모달 완전히 비활성화
	gantt.config.details_on_dblclick = false;
	gantt.config.details_on_create = false;

	gantt.config.autosize = false;
	gantt.config.grid_resize = true;
	gantt.config.keep_grid_width = false;


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

		data.forEach(item => {
			const id = item.nodeId;
			const parent = item.parentId ? item.parentId : 0;

			// =========================
			// PROJECT
			// =========================
			if (item.rowType === "PROJECT") {
				const start = toValidDate(item.createdOn);
				const end =
					toValidDate(item.projectEndDate) ||
					toValidDate(item.completedOn) ||
					start;

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
					projectCode: item.projectCode
				});
			}

			// =========================
			// TYPE
			// =========================
			else if (item.rowType === "TYPE") {
				let start = toValidDate(item.startAt);
				let end = toValidDate(item.endAt);

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
					typeCode: item.typeCode
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
			const ganttData = transformToGanttFormat(filtered);

			gantt.clearAll();
			gantt.parse(ganttData);

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

			// 간트 기간 필터링
			/*gantt.attachEvent("onBeforeTaskDisplay", function(id, task) {
				if (!window.ganttRange) return true;
	
				return (
					task.end_date >= window.ganttRange.start &&
					task.start_date <= window.ganttRange.end
				);
			});*/

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

		window.addEventListener("resize", () => {
			gantt.setSizes()
			gantt.render();
		});
	};

	initApp();

})();