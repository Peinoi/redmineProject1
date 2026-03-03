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

	const PRIORITY_BADGE = {
		'긴급': 'danger',
		'높음': 'warning',
		'보통': 'primary',
		'낮음': 'success'
	};

	const STATUS_BADGE = {
		'신규': 'primary',
		'진행': 'warning',
		'해결': 'info',
		'반려': 'secondary',
		'완료': 'success'
	};

	const ISSUE_PRIORITY_COLORS = {
		"긴급": "#D97B7B",
		"높음": "#FFB266",
		"보통": "#5AB2FF",
		"낮음": "#69B87C"
	};

	const isOverdueTask = (task) => {
		const todayMidnight = new Date();
		todayMidnight.setHours(0, 0, 0, 0);
		return task.originalEnd && task.originalEnd < todayMidnight
			&& task.status !== '완료' && task.status !== '해결';
	};

	gantt.templates.task_text = function(start, end, task) {
		if (task.rowType === "PROJECT") {
			return `${task.text}(${task.actualProg ?? 0}%)`;
		}
		if (task.rowType === "TYPE") {
			return `${task.text}(${task.typeActualProg ?? 0}%)`;
		}
		if (task.rowType === "ISSUE") {
			return `${task.text}(${Math.round((task.progress || 0) * 100)}%)`;
		}
		return task.text;
	};

	// 그리드 컬럼 정의
	const mainGridConfig = {
		columns: [
			{
				name: "text",
				tree: true,
				width: "*",
				min_width: 200,
				label: "작업명",
				template: function(task) {
					let cls = "";
					if (task.rowType === "PROJECT") cls = "gantt_project issue-clickable";
					if (task.rowType === "TYPE") cls = "type-node";
					if (task.rowType === "ISSUE") cls = "issue-clickable";

					return `<span class="${cls}">${task.text}</span>`;
				}
			},
			{
				name: "priority",
				label: "우선순위",
				align: "center",
				width: 70,
				template: (t) => {
					if (!t.priority) return '';

					const isOverdue = isOverdueTask(t);

					const map = {
						'긴급': 'danger',
						'높음': 'warning',
						'보통': 'primary',
						'낮음': 'success'
					};

					const color = isOverdue ? 'danger' : (map[t.priority] || 'secondary');

					return `
				        <span class="badge rounded-pill bg-${color}-subtle text-${color} fw-semibold px-2 py-1" style="font-size: 14px;">
				            ${t.priority}
				        </span>
				    `;
				}
			},
			{
				name: "status",
				label: "상태",
				align: "center",
				width: 70,
				template: (t) => {
					if (!t.status) return '';

					const isOverdue = isOverdueTask(t);

					const map = {
						'신규': 'primary',
						'진행': 'warning',
						'해결': 'info',
						'반려': 'secondary',
						'완료': 'success'
					};

					const color = isOverdue ? 'danger' : (map[t.status] || 'secondary');

					return `
				        <span class="badge rounded-pill bg-${color}-subtle text-${color} fw-semibold px-2 py-1" style="font-size: 14px;">
				            ${t.status}
				        </span>
				    `;
				}
			},
			{
				name: "textProgress", label: "진척도", align: "center", width: 150, min_width: 150,
				template: (t) => {
					return t.textProgress || (Math.round((t.progress || 0) * 100) + "%");
				}
			},
			{
				name: "start_date", label: "시작일", align: "center", width: 110, min_width: 110,
				template: (t) => {
					if (t.rowType === "ISSUE" && t.status === "신규") {
						return "";
					}
					return DateUtils.getYYYYMMDD(t.start_date);
				}
			},
			{
				name: "end_date",
				label: "종료일",
				align: "center",
				width: 110,
				min_width: 110,
				template: (t) => {
					const d = t.originalEnd || t.end_date;
					return d ? DateUtils.getYYYYMMDD(d) : '';
				}
			},
			{
				name: "assigneeName",
				label: "담당자",
				align: "center",
				width: 80,
				template: (t) => {
					if (!t.assigneeName || !t.assigneeCode) return '-';

					const isOverdue = isOverdueTask(t);

					const color = isOverdue ? '#dc2626' : '#374151';

					return `
					   <span class="assignee-cell">
				           <a href="/users/${t.assigneeCode}"
				              class="user-link text-decoration-none" style="color: ${color};">
				              ${t.assigneeName}
				           </a>
					   <span>
			       `;
				}
			},
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

	const today = new Date();

	gantt.config.details_on_dblclick = false;
	gantt.config.details_on_create = false;

	gantt.templates.grid_row_class = function(start, end, task) {
		if (task.rowType !== 'ISSUE') return '';
		const isOverdue = isOverdueTask(task);
		if (isOverdue) return 'row-overdue';
	};

	// task_class: 커서/클릭용 클래스만 (색상은 color 필드로)
	gantt.templates.task_class = (start, end, task) => {
		const classes = [];

		if (task.rowType === "PROJECT") {
			classes.push("gantt_project");
			classes.push("issue-clickable");
			return classes.join(" ");
		}

		if (task.isTypeNode) {
			classes.push("type-node");
			return classes.join(" ");
		}

		if (task.rowType === "ISSUE") {
			classes.push("issue-clickable");

			const isOverdue = isOverdueTask(task);

			if (isOverdue) {
				classes.push("overdue-task");
			}
		}

		return classes.join(" ");
	};

	// 마우스 호버 시 툴팁 표시
	gantt.templates.tooltip_text = function(start, end, task) {

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

		if (task.rowType !== "ISSUE") return null;

		const isOverdue = isOverdueTask(task);

		const startStr = task.status === '신규' ? '-' : DateUtils.getYYYYMMDD(task.start_date);
		const endStr = task.originalEnd
			? DateUtils.getYYYYMMDD(task.originalEnd)
			: (task.end_date ? DateUtils.getYYYYMMDD(task.end_date) : '-');

		const typeChain = [task.parTypeName, task.typeName]
			.filter(Boolean)
			.join(' > ');

		return `
		    <div style="width:260px; line-height:1.55; font-size:12px; white-space:normal; word-break:break-word;">
	        <div style="font-weight:700; margin-bottom:6px;">📋 ${task.title}</div>
	        <div style="display:grid; grid-template-columns:90px 1fr; row-gap:2px;">
	            <div>🗂️ 프로젝트</div><div>${task.projectName ?? '-'}</div>
	            <div>📂 유형</div><div>${typeChain || '-'}</div>
	            <div>📌 작업번호</div><div>${task.issueCode ?? '-'}</div>
				<div>⚡ 우선순위</div>
				<div style="color:${isOverdue ? '#ff6b6b' : (PRIORITY_COLORS[task.priority] || '#e2e8f0')};">
				    ${task.priority ?? '-'}
				</div>
				<div>🚦 상태</div>
				<div style="color:${isOverdue ? '#ff6b6b' : (STATUS_COLORS[task.status] || '#e2e8f0')};">
				    ${task.status ?? '-'}
				</div>
	            <div>📈 진척도</div><div>${Math.round((task.progress || 0) * 100)}%</div>
	            <div>📅 시작일</div><div>${startStr}</div>
	            <div>📅 종료일</div>
	            <div style="color:${isOverdue ? '#ff6b6b' : 'inherit'}">
	                ${endStr}${isOverdue ? ' (초과)' : ''}
	            </div>
	            <div>👤 담당자</div><div>${task.assigneeName ?? '-'}</div>
				<div>👤 등록자</div><div>${task.createdByName ?? '-'}</div>
	        </div>
	    </div>`;
	};

	gantt.config.tooltip_enable = true;
	gantt.config.tooltip_timeout = 30;
	gantt.config.tooltip_offset_x = 12;
	gantt.config.tooltip_offset_y = 18;

	/* ========================================================================
	   2. 유틸리티 및 필터 로직 (Business Logic)
	   ======================================================================== */
	const getFilteredDataWithHierarchy = (data, filters) => {
		const title = filters.title?.trim()?.toLowerCase() || "";
		const tCode = filters.type != null ? String(filters.type).trim() : "";
		const pCode = filters.projectCode != null ? String(filters.projectCode).trim() : "";

		let typeCodesSet = new Set();
		if (tCode) {
			const typeMap = {};
			data.filter(d => d.rowType === "TYPE").forEach(t => {
				typeMap[t.typeCode] = t;
			});

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

		const filteredIssues = data.filter(item => {
			if (item.rowType !== "ISSUE") return false;
			let ok = true;
			if (pCode && String(item.projectCode) !== String(pCode)) ok = false;
			if (filters.projectStatus && item.projectStatusName !== filters.projectStatus) ok = false;
			if (title && !(item.title || "").toLowerCase().includes(title)) ok = false;
			if (tCode && !typeCodesSet.has(String(item.typeCode))) ok = false;
			if (filters.status && item.issueStatus !== filters.status) ok = false;
			if (filters.priority && item.priority !== filters.priority) ok = false;
			if (filters.assigneeCode && String(item.assigneeCode) !== String(filters.assigneeCode)) ok = false;
			if (filters.createdByCode && String(item.createdByCode) !== String(filters.createdByCode)) ok = false;

			if (filters.createdAt) {
				const created = toValidDate(item.createdOn);
				const filterDate = toValidDate(filters.createdAt);
				if (!created || !filterDate || created.toDateString() !== filterDate.toDateString()) ok = false;
			}

			if (filters.dueAt) {
				const end = toValidDate(item.issueEndDate);
				const filterDate = toValidDate(filters.dueAt);
				if (!end || !filterDate || end.toDateString() !== filterDate.toDateString()) ok = false;
			}

			return ok;
		});

		const issueMap = {};
		filteredIssues.forEach(i => issueMap[i.issueCode] = i);

		const typeMap = {};
		data.filter(d => d.rowType === "TYPE").forEach(t => {
			typeMap[String(t.typeCode)] = t;
		});

		const validTypes = new Set();

		const hasAnyFilter = pCode || filters.projectStatus || title || tCode || filters.status ||
			filters.priority || filters.assigneeCode ||
			filters.createdByCode || filters.createdAt || filters.dueAt;

		if (hasAnyFilter) {
			filteredIssues.forEach(issue => {
				let type = typeMap[String(issue.typeCode)];
				while (type) {
					validTypes.add(type.typeCode);
					if (!type.parTypeCode) break;
					type = typeMap[String(type.parTypeCode)];
				}
			});

			if (tCode) {
				typeCodesSet.forEach(code => {
					const type = typeMap[String(code)];
					if (type) validTypes.add(type.typeCode);
				});

				typeCodesSet.forEach(code => {
					let type = typeMap[String(code)];
					while (type && type.parTypeCode) {
						const parentType = typeMap[String(type.parTypeCode)];
						if (parentType) validTypes.add(parentType.typeCode);
						type = parentType;
					}
				});

				const ancestorTypes = new Set();
				typeCodesSet.forEach(code => {
					let type = typeMap[String(code)];
					while (type && type.parTypeCode) {
						const parentType = typeMap[String(type.parTypeCode)];
						if (parentType) ancestorTypes.add(String(parentType.typeCode));
						type = parentType;
					}
				});

				for (const typeCode of [...validTypes]) {
					const isDescendant = typeCodesSet.has(String(typeCode));
					const isAncestor = ancestorTypes.has(String(typeCode));
					if (!isDescendant && !isAncestor) {
						validTypes.delete(typeCode);
					}
				}
			}

		} else {
			data.filter(d => d.rowType === "TYPE").forEach(type => {
				validTypes.add(type.typeCode);
			});
		}

		const validProjects = new Set();
		data.filter(d => d.rowType === "PROJECT").forEach(p => {
			const hasValidIssue = data.some(item =>
				item.rowType === "ISSUE" && issueMap[item.issueCode] && item.projectCode === p.projectCode
			);

			if (tCode) {
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
	function toValidDate(value) {
		if (!value) return null;
		const parts = value.split("-");
		if (parts.length === 3) {
			return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
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
				typeMap[String(r.typeCode)] = {
					typeName: r.typeName,
					parTypeName: r.parTypeName
				};
			}
		});

		data.forEach(item => {
			const id = item.nodeId;
			const parent = item.parentId ? item.parentId : 0;

			if (item.rowType === "PROJECT") {
				const start = toValidDate(item.createdOn) || gantt.config.start_date;
				const end =
					toValidDate(item.projectEndDate) ||
					toValidDate(item.completedOn) ||
					gantt.config.end_date;

				if (!start || !end) return;

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
					projectCreatorName: item.projectCreatorName,
					exportText: item.projectName,
					color: "#9CA3AF",
					textProgress: (item.actualProg || 0) + "% (예상: " + (item.planProg || 0) + "%)",
				});
			}

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
					parTypeCode: item.parTypeCode,
					exportText: item.typeName,
					color: "#64748B",
					textProgress: (item.typeActualProg || 0) + "%",
				});

				if (parent && parent !== 0) {
					links.push({
						id: `LINK_${parent}_${id}`,
						source: parent,
						target: id,
						type: "1"
					});
				}
			}

			else if (item.rowType === "ISSUE") {
				let start = toValidDate(item.issueStartDate);
				let end = toValidDate(item.issueEndDate);

				const originalEnd = toValidDate(item.issueEndDate);

				const todayMidnight = new Date();
				todayMidnight.setHours(0, 0, 0, 0);
				const isOverdue = originalEnd && originalEnd < todayMidnight
					&& item.issueStatus !== '완료' && item.issueStatus !== '해결';

				if (!start && !end) { start = new Date(); end = new Date(); }
				if (!start && end) start = new Date(end);
				if (start && !end) end = new Date(start);

				let displayEnd = new Date(end);
				if (start && end && start.toDateString() === end.toDateString()) {
					displayEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1, 0, 0, 0);
				}

				const typeInfo = typeMap[String(item.typeCode)] || { typeName: '-', parTypeName: null };
				const taskColor = isOverdue
					? "#dc2626"
					: (ISSUE_PRIORITY_COLORS[item.priority] || "#5AB2FF");

				tasks.push({
					id: id,
					text: item.title,
					title: item.title,
					start_date: start,
					end_date: displayEnd,
					originalEnd: originalEnd,
					progress: (item.progress || 0) / 100,
					priority: item.priority,
					status: item.issueStatus,
					assigneeCode: item.assigneeCode,
					assigneeName: item.assigneeName,
					createdByName: item.createdByName,
					parent: parent,
					type: gantt.config.types.task,
					rowType: "ISSUE",
					issueCode: item.issueCode,
					typeCode: item.typeCode,
					projectName: item.projectName,
					projectStatus: item.projectStatus,
					projectStatusName: item.projectStatusName,
					typeName: typeInfo.typeName,
					parTypeName: typeInfo.parTypeName,
					exportText: item.title,
					color: taskColor,
					textProgress: Math.round(item.progress || 0) + "%",
				});

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

	// 엑셀 - 계층구조 포함
	window.exportExcel = function() {
		const rows = [["작업명", "우선순위", "상태", "진척도", "시작일", "종료일", "담당자"]];

		gantt.eachTask(function(task) {
			const level = gantt.calculateTaskLevel(task);
			const indent = "  ".repeat(level);

			let start = "";
			if (!(task.rowType === "ISSUE" && task.status === "신규")) {
				start = task.start_date ? DateUtils.getYYYYMMDD(task.start_date) : "";
			}
			const end = task.end_date ? DateUtils.getYYYYMMDD(task.end_date) : "";

			rows.push([
				indent + task.text,
				task.priority || "",
				task.status || "",
				task.textProgress || "",
				start,
				end,
				task.assigneeName || ""
			]);
		});

		const ws = XLSX.utils.aoa_to_sheet(rows);
		ws['!cols'] = [
			{ wch: 40 }, { wch: 10 }, { wch: 10 },
			{ wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }
		];

		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "간트차트");
		XLSX.writeFile(wb, "gantt.xlsx");
	};

	// PDF 다운로드
	window.exportPDF = function() {
		gantt.exportToPDF({
			name: "gantt.pdf",
			locale: "kr",
		});
	};

	/* ========================================================================
	   4. 실행부 및 API 연결 (Executions)
	   ======================================================================== */
	let cachedRawData = null;

	const fData = async (filters = {}) => {
		const spinner = document.getElementById("ganttLoadingSpinner");
		const emptyEl = document.getElementById("ganttEmptyState");
		const ganttEl = document.getElementById("e7eGantt");

		if (spinner) spinner.style.display = "flex";

		try {
			if (!cachedRawData) {
				const response = await fetch("/ganttData");
				if (!response.ok) throw new Error("서버 응답 에러");
				cachedRawData = await response.json();
			}

			const filtered = getFilteredDataWithHierarchy(cachedRawData.tasks, filters);
			const ganttData = transformToGanttFormat(filtered);

			gantt.clearAll();

			if (!ganttData.data || ganttData.data.length === 0) {
				if (emptyEl) emptyEl.style.display = "flex";
				if (ganttEl) ganttEl.style.visibility = "hidden";
			} else {
				if (emptyEl) emptyEl.style.display = "none";
				if (ganttEl) ganttEl.style.visibility = "visible";

				// parse 전에 날짜 범위를 먼저 강제 고정
				if (window.ganttRange?.start && window.ganttRange?.end) {
					gantt.config.start_date = new Date(window.ganttRange.start);
					gantt.config.end_date = new Date(window.ganttRange.end);
				} else {
					const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);
					const defaultEnd = new Date(defaultStart);
					defaultEnd.setMonth(defaultEnd.getMonth() + 6);
					gantt.config.start_date = defaultStart;
					gantt.config.end_date = defaultEnd;
				}

				gantt.config.fit_tasks = false;

				try {
					gantt.parse(ganttData);
				} catch (parseError) {
					console.error("Gantt Parse Error:", parseError);
				}

				const rangeStart = window.ganttRange?.start ?? new Date(today.getFullYear(), today.getMonth(), 1);
				gantt.showDate(rangeStart);
			}
		} catch (e) {
			console.error("Gantt 데이터 조회 실패:", e);
		} finally {
			setTimeout(() => {
				if (spinner) spinner.style.setProperty("display", "none", "important");
			}, 500);
		}
	};

	window.ganttReload = fData;

	const initApp = () => {
		window.addEventListener("load", () => {
			gantt.plugins({
				tooltip: true,
				export_api: true
			});

			gantt.config.show_links = true;
			gantt.config.tooltip_offset_x = 10;
			gantt.config.tooltip_offset_y = 30;

			gantt.init("e7eGantt");

			gantt.config.readonly = false;        // 전체 readonly는 유지
			gantt.config.drag_move = false;       // 바 드래그 이동 비활성화
			gantt.config.drag_resize = false;     // 바 크기 조절 비활성화
			gantt.config.drag_progress = false;   // 진척도 드래그 비활성화
			gantt.config.drag_links = false;      // 화살표(링크) 드래그 비활성화
			gantt.config.drag_timeline = false;   // 타임라인 스크롤 드래그 비활성화

			const ro = new ResizeObserver(() => {
				gantt.setSizes();
				gantt.render();
			});

			const ganttEl = document.querySelector("#e7eGantt");
			if (ganttEl) ro.observe(ganttEl);

			gantt.config.open_tree_initially = true;

			// 링크 클릭 차단
			gantt.attachEvent("onLinkClick", function(id, e) {
				return false;
			});

			// 링크 더블클릭 차단 (삭제 모달 방지)
			gantt.attachEvent("onLinkDblClick", function(id, e) {
				return false;
			});

			gantt.attachEvent("onTaskDblClick", function(id, e) {
				if (e.target && e.target.closest("a")) return true;

				const task = gantt.getTask(id);

				if (e.target && e.target.classList.contains("gantt_tree_icon")) return true;

				if (task.rowType === "PROJECT" && task.projectCode) {
					window.location.href = `/project/overview/${task.projectCode}`;
					return false;
				}

				if (task.rowType === "ISSUE" && task.issueCode) {
					window.location.href = `/issueInfo?issueCode=${task.issueCode}`;
					return false;
				}

				return true;
			});

			gantt.setSizes();

			//fData({});
		});

		window.addEventListener("resize", () => {
			gantt.setSizes();
			gantt.render();
		});
	};

	initApp();

})();