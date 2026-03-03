/* =========================================================
   main - /static/js/main/main.js
   ========================================================= */

/* =========================
   Skeleton toggle
   ========================= */
function setLoading(cardId, on) {
	const el = document.getElementById(cardId);
	if (!el) return;
	el.classList.toggle("is-loading", !!on);
}

/* =========================
   Google Chart (Donut) - AJAX
   ========================= */
google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(() => {
	// 구글차트 로더 준비된 시점에 AJAX로 데이터 받아 그리기
	loadDonutChart();
});

let donutChart, donutData;

// ✅ Donut single-slice workaround (더미 슬라이스)
const DONUT_DUMMY_LABEL = "__DUMMY__";
const DONUT_DUMMY_VALUE = 0.0001;

// ✅ Donut legend 고정(진행/종료 항상 표시)
const DONUT_FIXED_LABELS = ["진행", "종료"];

async function loadDonutChart() {
	const chartEl = document.getElementById("donutchart");
	if (!chartEl) return;

	setLoading("cardDonut", true);

	try {
		const res = await fetch(`/api/main/statusCnt?_ts=${Date.now()}`, {
			headers: { Accept: "application/json" },
			cache: "no-store",
		});

		const list = res.ok ? await res.json() : [];
		if (!list || list.length === 0) {
			chartEl.innerHTML =
				"<div class='text-muted text-center py-5'>표시할 데이터가 없습니다.</div>";
			return;
		}

		// =========================
		// ✅ 1) API 결과를 Map으로 정규화
		// =========================
		const cntMap = new Map(); // key: 라벨, val: 숫자
		(list || []).forEach((item) => {
			const value = Number(item.codeNameCnt ?? item.CODE_NAME_CNT ?? 0);
			const name = String(item.codeName ?? item.CODE_NAME ?? "").trim();
			if (!name) return;
			cntMap.set(name, (cntMap.get(name) || 0) + value);
		});

		// =========================
		// ✅ 2) 진행/종료는 항상 존재하도록 보정(없으면 0으로)
		// =========================
		const normalized = DONUT_FIXED_LABELS.map((label) => ({
			codeName: label,
			codeNameCnt: Number(cntMap.get(label) || 0),
		}));

		// ✅ fixed legend 숫자 업데이트(진행/종료)
		const elProg = document.getElementById("lgCntProgress");
		const elDone = document.getElementById("lgCntDone");
		
		const progCnt = Number(normalized.find(x => x.codeName === "진행")?.codeNameCnt ?? 0);
		const doneCnt = Number(normalized.find(x => x.codeName === "종료")?.codeNameCnt ?? 0);

		if (elProg) elProg.textContent = `${progCnt}개`;
		if (elDone) elDone.textContent = `${doneCnt}개`;

		// =========================
		// ✅ 3) legend를 2개 유지하면서도
		//    종료가 0일 때 차트에 "쪼끄만 흔적"만 남기기 위해 더미값 주입
		//    (legend는 라벨이 있으면 보이고, slice는 거의 안 보임)
		// =========================
		let hasInjectedTinyForZero = false;
		const adjusted = normalized.map((row) => {
			if (row.codeName === "종료" && row.codeNameCnt === 0) {
				hasInjectedTinyForZero = true;
				return { ...row, codeNameCnt: DONUT_DUMMY_VALUE };
			}
			return row;
		});

		// =========================
		// ✅ 4) DataTable 생성
		// =========================
		donutData = new google.visualization.DataTable();
		donutData.addColumn("string", "상태");
		donutData.addColumn("number", "개수");
		donutData.addColumn({ type: "string", role: "tooltip" });

		adjusted.forEach((row) => {
			const name = row.codeName;
			const value = Number(row.codeNameCnt || 0);

			// ✅ 종료가 0이라 더미값 넣은 경우, 툴팁/표시는 "0개"로
			if (hasInjectedTinyForZero && name === "종료") {
				donutData.addRow([name, value, `${name}: 0개`]);
				return;
			}

			donutData.addRow([name, value, `${name}: ${Math.trunc(value)}개`]);
		});

		// =========================
		// ✅ 5) 차트 그리기
		// =========================
		donutChart = new google.visualization.PieChart(chartEl);
		drawDonutChart({ zeroDoneShownAsTiny: hasInjectedTinyForZero });

		let t;
		window.addEventListener("resize", () => {
			clearTimeout(t);
			t = setTimeout(() => drawDonutChart({ zeroDoneShownAsTiny: hasInjectedTinyForZero }), 120);
		});
	} catch (e) {
		console.error("[donut] load error:", e);
		chartEl.innerHTML =
			"<div class='text-muted text-center py-5'>차트를 불러오지 못했습니다.</div>";
	} finally {
		setLoading("cardDonut", false);
	}
}

function drawDonutChart({ zeroDoneShownAsTiny = false } = {}) {
	if (!donutChart || !donutData) return;

	const el = document.getElementById("donutchart");
	if (!el) return;

	const w = el.getBoundingClientRect().width;

	// 종료(2번째)가 0이면 tiny 슬라이스가 아주 얇게 보일 수 있음
	// → 파이 조각은 거의 티 안 나게 아주 연한 회색으로만 처리(legend는 우리가 직접 만듦)
	const slices = zeroDoneShownAsTiny
		? { 1: { color: "#f3f4f6", textStyle: { color: "transparent" } } }
		: {};

	donutChart.draw(donutData, {
		pieHole: 0.4,
		colors: ["#3b9ff6", "#9ca3af"],

		// ✅ 구글 legend 끄고, HTML 고정 legend 사용
		legend: "none",

		pieSliceText: "value",
		pieSliceTextStyle: { fontSize: 16, bold: true },

		sliceVisibilityThreshold: 0,
		slices,

		chartArea: {
			left: 10,
			top: 10,          // ✅ legend가 없어졌으니 top 여백 줄임
			width: Math.max(w - 20, 0),
			height: "85%",
		},
	});
}

/* =========================
   Today Progress Rate - AJAX
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
	loadTodayProgressRate();
});

async function loadTodayProgressRate() {
	const valueEl = document.getElementById("todayProgressRateValue");
	const barEl = document.getElementById("todayProgressRateBar");
	if (!valueEl || !barEl) return;

	setLoading("cardProgress", true);   // ✅ ON

	try {
		const res = await fetch(`/api/main/todayProgressRate?_ts=${Date.now()}`, {
			headers: { Accept: "application/json" },
			cache: "no-store",
		});

		const json = res.ok ? await res.json() : { ok: false, rate: 0 };
		const rate = clampInt(json?.rate, 0, 100);

		valueEl.textContent = String(rate);
		barEl.style.width = `${rate}%`;
		barEl.setAttribute("aria-valuenow", String(rate));
	} catch (e) {
		console.error("[progress] load error:", e);
		valueEl.textContent = "0";
		barEl.style.width = "0%";
		barEl.setAttribute("aria-valuenow", "0");
	} finally {
		setLoading("cardProgress", false); // ✅ OFF
	}
}

function clampInt(v, min, max) {
	const n = Number(v);
	if (Number.isNaN(n)) return min;
	return Math.max(min, Math.min(max, Math.trunc(n)));
}

/* =========================
   Tooltip helpers
   ========================= */
function escapeHtml(str) {
	return String(str)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")   // ✅ 여기 dot 빠지면 JS 터짐!
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

// ✅ 뱃지는 "뒤에" 붙이기
function buildTooltipHTML({ badgeText, mainText }) {
	const safeMain = escapeHtml(mainText || "");
	if (!badgeText) return `<div>${safeMain}</div>`;

	const safeBadge = escapeHtml(badgeText);

	return `
    <div style="display:flex; align-items:center; gap:8px;">
      <span>${safeMain}</span>
      <span class="admin-badge">${safeBadge}</span>
    </div>
  `.trim();
}

// ✅ 셀 안의 뱃지 텍스트가 섞이지 않게 "순수 텍스트"만 추출
function getPureTextForTooltip(el) {
	const issueProjName = el.querySelector(".proj-name");
	if (issueProjName) return (issueProjName.textContent || "").trim();
	return (el.textContent || "").trim();
}

/* =========================
   Ellipsis Tooltip (Bootstrap로 통일 + HTML(뱃지) 지원)
   ========================= */
function applyEllipsisTooltips(root = document) {
	const hasBS = !!(window.bootstrap && bootstrap.Tooltip);
	if (!hasBS) return;

	const targets = root.querySelectorAll(
		[
			"#mainIssueTable td:nth-child(2)", // 일감현황 프로젝트 칸
			"#mainNoticeTable td.notice-td-proj", // 최근공지 프로젝트 칸
			"#mainNoticeTable .notice-td-title", // 최근공지 제목(span)
		].join(",")
	);

	targets.forEach((el) => {
		if (el.offsetParent === null) return;

		const text = getPureTextForTooltip(el);
		if (!text) return;

		const isTruncated = el.scrollWidth > el.clientWidth;

		const inst = bootstrap.Tooltip.getInstance(el);
		if (inst) inst.dispose();

		if (!isTruncated) {
			el.removeAttribute("data-bs-toggle");
			el.removeAttribute("data-bs-placement");
			el.removeAttribute("data-bs-title");
			el.removeAttribute("data-bs-html");
			return;
		}

		let badgeText = null;
		const inIssueTable = !!el.closest("#mainIssueTable");
		if (inIssueTable) {
			const hasAdminBadge = !!el.querySelector(".admin-badge");
			if (hasAdminBadge) badgeText = "관리자";
		}

		const html = buildTooltipHTML({ badgeText, mainText: text });

		el.setAttribute("data-bs-toggle", "tooltip");
		el.setAttribute("data-bs-placement", "top");
		el.setAttribute("data-bs-html", "true");
		el.setAttribute("data-bs-title", html);

		new bootstrap.Tooltip(el, {
			trigger: "hover",
			container: "body",
			html: true,
		});
	});
}

/* =========================
   Main Notice Paging
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
	initMainNoticePaging();
	requestAnimationFrame(() => applyEllipsisTooltips());
});

function initMainNoticePaging() {
	setupPager({
		itemSelector: "#mainNoticeTable tbody > tr.notice-item",
		pagerSelector: '.block-pager[data-pager-for="MAIN_NOTICE"]',
		pageSize: 5,
		dummyMode: "table",
		dummyColspan: 4,
	});
}

function setupPager({ itemSelector, pagerSelector, pageSize, dummyMode, dummyColspan }) {
	const pager = document.querySelector(pagerSelector);
	if (!pager) return;

	const pagesWrap = pager.querySelector(".pager-pages");
	const btnPrev = pager.querySelector(".pager-prev");
	const btnNext = pager.querySelector(".pager-next");

	const getRealItems = () =>
		Array.from(document.querySelectorAll(itemSelector)).filter((el) => !el.dataset.pagerDummy);

	let page = 0;

	function itemsContainer() {
		const first = document.querySelector(itemSelector);
		return first ? first.parentElement : null; // tbody
	}

	const clearDummies = () => {
		const container = itemsContainer();
		if (!container) return;
		container.querySelectorAll('[data-pager-dummy="1"]').forEach((el) => el.remove());
	};

	const appendDummies = (count) => {
		if (count <= 0) return;
		const container = itemsContainer();
		if (!container) return;

		for (let i = 0; i < count; i++) {
			const tr = document.createElement("tr");
			tr.setAttribute("data-pager-dummy", "1");
			tr.className = "pager-dummy-tr";
			tr.innerHTML = `<td colspan="${dummyColspan || 1}">&nbsp;</td>`;
			container.appendChild(tr);
		}
	};

	const render = () => {
		const items = getRealItems();
		const totalPages = Math.ceil(items.length / pageSize);

		if (page > totalPages - 1) page = Math.max(totalPages - 1, 0);

		if (items.length <= pageSize) {
			pager.style.display = "none";
			clearDummies();
			items.forEach((el) => (el.style.display = ""));
			requestAnimationFrame(() => applyEllipsisTooltips());
			return;
		} else {
			pager.style.display = "";
		}

		const start = page * pageSize;
		const end = start + pageSize;

		clearDummies();

		items.forEach((el, idx) => {
			el.style.display = idx >= start && idx < end ? "" : "none";
		});

		appendDummies(pageSize - items.slice(start, end).length);

		if (btnPrev) btnPrev.disabled = page === 0;
		if (btnNext) btnNext.disabled = page === totalPages - 1;

		pagesWrap.innerHTML = "";

		const windowSize = 7;
		let s = Math.max(0, page - Math.floor(windowSize / 2));
		let e = s + windowSize - 1;
		if (e > totalPages - 1) {
			e = totalPages - 1;
			s = Math.max(0, e - (windowSize - 1));
		}

		for (let p = s; p <= e; p++) {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className =
				"btn btn-sm btn-outline-secondary pager-page" + (p === page ? " is-active" : "");
			btn.textContent = String(p + 1);
			btn.addEventListener("click", () => {
				page = p;
				render();
			});
			pagesWrap.appendChild(btn);
		}

		requestAnimationFrame(() => applyEllipsisTooltips());
	};

	btnPrev?.addEventListener("click", () => {
		page--;
		render();
	});

	btnNext?.addEventListener("click", () => {
		page++;
		render();
	});

	render();
}

/* =========================
   Memo Calendar (Main)
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
	initMemoCalendar();
});

function initMemoCalendar() {
	const calEl = document.getElementById("memoCalendar");
	if (!calEl) return;

	const prevBtn = document.getElementById("btnMemoPrevMonth");
	const nextBtn = document.getElementById("btnMemoNextMonth");
	const labelEl = document.getElementById("memoMonthLabel");

	const modalEl = document.getElementById("memoModal");
	const modal = modalEl && window.bootstrap?.Modal ? new bootstrap.Modal(modalEl) : null;

	const deleteModalEl = document.getElementById("memoDeleteConfirmModal");
	const deleteModal =
		deleteModalEl && window.bootstrap?.Modal ? new bootstrap.Modal(deleteModalEl) : null;

	const dateLabel = document.getElementById("memoModalDateLabel");
	const contentEl = document.getElementById("memoContent");
	const btnSave = document.getElementById("btnMemoSave");
	const btnDelete = document.getElementById("btnMemoDelete");
	const btnDeleteConfirm = document.getElementById("btnMemoDeleteConfirm");
	const dowLabel = document.getElementById("memoModalDowLabel");

	const hasBS = !!(window.bootstrap && bootstrap.Tooltip);

	let cur = new Date();
	cur = new Date(cur.getFullYear(), cur.getMonth(), 1);

	let memoMap = new Map();
	let openDateStr = null;
	let holidayMap = new Map(); // key: YYYY-MM-DD, value: 휴일명

	function pad2(n) {
		return String(n).padStart(2, "0");
	}
	function ymd(d) {
		return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
	}
	function ym(d) {
		return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
	}

	function escapeHtmlMemo(str) {
		return String(str ?? "")
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#039;");
	}

	async function loadMonth() {
		setLoading("cardMemoCal", true);
		try {
			const month = ym(cur);
			labelEl.textContent = month;

			const [memoRes, holiRes] = await Promise.all([
				fetch(`/api/main/memos?month=${encodeURIComponent(month)}&_ts=${Date.now()}`, {
					headers: { Accept: "application/json" },
					cache: "no-store",
				}),
				fetch(`/api/main/holidays?month=${encodeURIComponent(month)}&_ts=${Date.now()}`, {
					headers: { Accept: "application/json" },
					cache: "no-store",
				}),
			]);

			const memoList = memoRes.ok ? await memoRes.json() : [];
			const holiList = holiRes.ok ? await holiRes.json() : [];

			memoMap = new Map();
			(memoList || []).forEach((m) => {
				const key = (m.memoDate || "").trim();
				if (key) memoMap.set(key, m.content || "");
			});

			holidayMap = new Map();
			(holiList || []).forEach((h) => {
				const key = (h.holiDate || "").trim();
				if (key) holidayMap.set(key, (h.holiName || "").trim());
			});

			render();
		} catch (e) {
			console.error("[memo/holiday] load error:", e);
			memoMap = new Map();
			holidayMap = new Map();
			render();
		} finally {
			setLoading("cardMemoCal", false);
		}
	}

	function buildMemoTooltipHTML(dateStr, memoContent, holidayName) {
		const safeDate = escapeHtmlMemo(dateStr);

		const safeHoli = escapeHtmlMemo(holidayName || "");
		const safeMemo = escapeHtmlMemo(memoContent || "").replaceAll("\n", "<br/>");

		const holiBlock = holidayName
			? `<div style="font-weight:900; color:#dc2626; margin-bottom:6px;">${safeHoli}</div>`
			: "";

		const memoBlock = (memoContent && memoContent.trim())
			? `<div style="font-size:12px; line-height:1.35;">${safeMemo}</div>`
			: `<div style="font-size:12px; color:#6b7280;">메모 없음</div>`;

		return `
	    <div style="min-width:180px; max-width:280px;">
	      <div style="font-weight:900; margin-bottom:6px;">${safeDate}</div>
	      ${holiBlock}
	      ${memoBlock}
	    </div>
	  `.trim();
	}

	function clearAllMemoTooltips() {
		if (!hasBS) return;

		document.querySelectorAll("#memoCalendar [data-bs-toggle='tooltip']").forEach((el) => {
			const inst = bootstrap.Tooltip.getInstance(el);
			if (inst) inst.dispose();
		});

		document.querySelectorAll(".tooltip").forEach((t) => t.remove());
	}

	function applyTooltip(el, dateStr, memoContent, holidayName) {
		if (!hasBS) return;

		const html = buildMemoTooltipHTML(dateStr, memoContent, holidayName);

		el.setAttribute("data-bs-toggle", "tooltip");
		el.setAttribute("data-bs-placement", "top");
		el.setAttribute("data-bs-html", "true");
		el.setAttribute("data-bs-title", html);

		new bootstrap.Tooltip(el, {
			trigger: "hover",
			container: "body",
			html: true,
		});
	}

	function render() {
		clearAllMemoTooltips();
		calEl.innerHTML = "";

		const root = document.createElement("div");

		const dow = ["일", "월", "화", "수", "목", "금", "토"];
		const dowRow = document.createElement("div");
		dowRow.className = "memo-cal-grid";
		dow.forEach((t) => {
			const d = document.createElement("div");
			d.className = "memo-cal-dow";
			d.textContent = t;
			dowRow.appendChild(d);
		});

		const grid = document.createElement("div");
		grid.className = "memo-cal-grid";

		const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
		const start = new Date(first);
		start.setDate(first.getDate() - first.getDay());

		const days = 42;
		for (let i = 0; i < days; i++) {
			const d = new Date(start);
			d.setDate(start.getDate() + i);

			const cell = document.createElement("div");
			cell.className = "memo-cal-cell";

			const inMonth = d.getMonth() === cur.getMonth();
			if (!inMonth) cell.classList.add("is-out");

			// 오늘 강조
			const today = new Date();
			if (isSameYMD(d, today)) {
				cell.classList.add("is-today");
			}

			// 주말 구분
			if (isWeekend(d)) {
				cell.classList.add(d.getDay() === 0 ? "is-sun" : "is-sat");
			}

			const dateStr = ymd(d);
			const memo = memoMap.get(dateStr);
			const holi = holidayMap.get(dateStr); // 휴일명

			// ✅ 공휴일이면 날짜 빨강
			if (holi) {
				cell.classList.add("is-holiday");
			}

			// ✅ 메모 dot + tooltip (메모/공휴일 중 하나라도 있으면 툴팁)
			if ((memo && memo.trim().length > 0) || (holi && holi.trim().length > 0)) {
				// 메모가 있으면 dot 유지
				if (memo && memo.trim().length > 0) {
					cell.classList.add("has-memo");
					const dot = document.createElement("div");
					dot.className = "memo-cal-dot";
					cell.appendChild(dot);
				}
				applyTooltip(cell, dateStr, memo || "", holi || "");
			}

			const day = document.createElement("div");
			day.className = "memo-cal-day";
			day.textContent = String(d.getDate());
			cell.appendChild(day);

			cell.addEventListener("click", () => {
				if (!modal) return;

				if (!inMonth) {
					cur = new Date(d.getFullYear(), d.getMonth(), 1);
					loadMonth();
					return;
				}

				openDateStr = dateStr;
				dateLabel.textContent = dateStr;
				if (dowLabel) dowLabel.textContent = `(${dowKorean(dateStr)})`;
				contentEl.value = memoMap.get(dateStr) || "";
				btnDelete.style.display = (memoMap.get(dateStr) || "").trim() ? "" : "none";
				modal.show();
			});

			// ✅ today / weekend 표시용 헬퍼
			function isSameYMD(a, b) {
				return a.getFullYear() === b.getFullYear()
					&& a.getMonth() === b.getMonth()
					&& a.getDate() === b.getDate();
			}

			function isWeekend(dateObj) {
				const dow = dateObj.getDay(); // 0=일, 6=토
				return dow === 0 || dow === 6;
			}

			grid.appendChild(cell);
		}

		root.appendChild(dowRow);
		root.appendChild(grid);
		calEl.appendChild(root);
	}

	async function saveCurrent() {
		const dateStr = (openDateStr || dateLabel.textContent || "").trim();
		if (!dateStr) return;

		const content = contentEl.value ?? "";

		const res = await fetch("/api/main/memos", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({ date: dateStr, content }),
			cache: "no-store",
		});

		if (!res.ok) return;

		openDateStr = dateStr;
		await loadMonth();
		btnDelete.style.display = (memoMap.get(dateStr) || "").trim() ? "" : "none";
		modal?.hide();
	}

	async function deleteCurrent() {
		const dateStr = (openDateStr || dateLabel.textContent || "").trim();
		if (!dateStr) return;

		const res = await fetch(
			`/api/main/memos?date=${encodeURIComponent(dateStr)}&_ts=${Date.now()}`,
			{
				method: "DELETE",
				headers: { Accept: "application/json" },
				cache: "no-store",
			}
		);

		if (!res.ok) return;

		openDateStr = dateStr;
		await loadMonth();
		contentEl.value = "";
		btnDelete.style.display = "none";
		modal?.hide();
	}

	function dowKorean(dateStr) {
		const [y, m, d] = (dateStr || "").split("-").map(Number);
		const dt = new Date(y, (m || 1) - 1, d || 1);
		const arr = ["일", "월", "화", "수", "목", "금", "토"];
		return arr[dt.getDay()];
	}

	prevBtn?.addEventListener("click", () => {
		cur = new Date(cur.getFullYear(), cur.getMonth() - 1, 1);
		loadMonth();
	});

	nextBtn?.addEventListener("click", () => {
		cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
		loadMonth();
	});

	btnSave?.addEventListener("click", saveCurrent);

	btnDelete?.addEventListener("click", () => {
		const dateStr = (openDateStr || dateLabel.textContent || "").trim();
		const memo = memoMap.get(dateStr) || "";
		if (!dateStr || !memo.trim()) return;
		if (!deleteModal) return;
		deleteModal.show();
	});

	btnDeleteConfirm?.addEventListener("click", async () => {
		await deleteCurrent();
		deleteModal?.hide();
	});

	modalEl?.addEventListener("hidden.bs.modal", () => {
		openDateStr = null;
	});

	loadMonth();
}