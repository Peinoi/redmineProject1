/* =========================================================
   main - /static/js/main/main.js
   ========================================================= */

/* =========================
   Google Chart (Donut)
   ========================= */
google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(initChart);

let chart, data;

function initChart() {
	const statusListCnt = window.__statusListCnt || [];
	const chartEl = document.getElementById("donutchart");
	if (!chartEl) return;

	if (!statusListCnt || statusListCnt.length === 0) {
		chartEl.innerHTML =
			"<div class='text-muted text-center py-5'>표시할 데이터가 없습니다.</div>";
		return;
	}

	const reversed = [...statusListCnt].reverse();

	data = new google.visualization.DataTable();
	data.addColumn("string", "상태");
	data.addColumn("number", "개수");
	data.addColumn({ type: "string", role: "tooltip" });

	reversed.forEach((item) => {
		const value = Number(item.codeNameCnt);
		data.addRow([item.codeName, value, `${item.codeName}: ${value}개`]);
	});

	chart = new google.visualization.PieChart(chartEl);
	drawChart();

	let t;
	window.addEventListener("resize", () => {
		clearTimeout(t);
		t = setTimeout(drawChart, 120);
	});
}

function drawChart() {
	if (!chart || !data) return;

	const el = document.getElementById("donutchart");
	if (!el) return;

	const w = el.getBoundingClientRect().width;

	chart.draw(data, {
		pieHole: 0.4,
		colors: ["#3b9ff6", "#a3a3a3"],
		legend: { position: "top", textStyle: { fontSize: 13 } },
		pieSliceText: "value",
		pieSliceTextStyle: { fontSize: 16, bold: true },
		chartArea: {
			left: 10,
			top: 55,
			width: Math.max(w - 20, 0),
			height: "75%",
		},
	});
}

/* =========================
   Tooltip helpers
   ========================= */
function escapeHtml(str) {
	return String(str)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
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
	// 1) 일감현황 프로젝트 칸: span.proj-name 안 텍스트만 사용
	const issueProjName = el.querySelector(".proj-name");
	if (issueProjName) return (issueProjName.textContent || "").trim();

	// 2) 나머지(최근공지 등): 그대로 텍스트 사용
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
			"#mainIssueTable td:nth-child(2)",     // 일감현황 프로젝트 칸
			"#mainNoticeTable td.notice-td-proj",  // 최근공지 프로젝트 칸
			"#mainNoticeTable .notice-td-title"    // 최근공지 제목(span)
		].join(",")
	);

	targets.forEach((el) => {
		if (el.offsetParent === null) return;

		const text = getPureTextForTooltip(el);
		if (!text) return;

		const isTruncated = el.scrollWidth > el.clientWidth;

		// 기존 인스턴스 정리
		const inst = bootstrap.Tooltip.getInstance(el);
		if (inst) inst.dispose();

		if (!isTruncated) {
			el.removeAttribute("data-bs-toggle");
			el.removeAttribute("data-bs-placement");
			el.removeAttribute("data-bs-title");
			el.removeAttribute("data-bs-html");
			return;
		}

		// ✅ 뱃지 포함 여부(일감현황 프로젝트 칸에서만)
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
			// 필요 시:
			// sanitize: false,
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
	const modal = (modalEl && window.bootstrap?.Modal) ? new bootstrap.Modal(modalEl) : null;

	const deleteModalEl = document.getElementById("memoDeleteConfirmModal");
	const deleteModal = (deleteModalEl && window.bootstrap?.Modal) ? new bootstrap.Modal(deleteModalEl) : null;
	
	const dateLabel = document.getElementById("memoModalDateLabel");
	const contentEl = document.getElementById("memoContent");
	const btnSave = document.getElementById("btnMemoSave");
	const btnDelete = document.getElementById("btnMemoDelete");
	const btnDeleteConfirm = document.getElementById("btnMemoDeleteConfirm");
	const dowLabel = document.getElementById("memoModalDowLabel");

	const hasBS = !!(window.bootstrap && bootstrap.Tooltip);

	let cur = new Date();
	cur = new Date(cur.getFullYear(), cur.getMonth(), 1);

	// dateStr -> content
	let memoMap = new Map();
	let openDateStr = null;

	function pad2(n) { return String(n).padStart(2, "0"); }
	function ymd(d) {
		return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
	}
	function ym(d) {
		return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
	}

	function escapeHtml(str) {
		return String(str ?? "")
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#039;");
	}

	// 툴팁 HTML + 줄바꿈 처리(이모지 OK)
	function buildMemoTooltipHTML(dateStr, content) {
		const safe = escapeHtml(content).replaceAll("\n", "<br/>");
		return `
      <div style="min-width:180px; max-width:280px;">
        <div style="font-weight:900; margin-bottom:6px;">${escapeHtml(dateStr)}</div>
        <div style="font-size:12px; line-height:1.35;">${safe}</div>
      </div>
    `.trim();
	}

	async function loadMonth() {
		const month = ym(cur);
		labelEl.textContent = month;

		const res = await fetch(`/api/main/memos?month=${encodeURIComponent(month)}&_ts=${Date.now()}`, {
			headers: { "Accept": "application/json" },
			cache: "no-store"
		});

		const list = res.ok ? await res.json() : [];
		console.log("[memos]", list);
		memoMap = new Map();

		(list || []).forEach((m) => {
			const key = (m.memoDate || "").trim(); // ✅ 서버가 "YYYY-MM-DD"로 내려주는 전제
			if (key) memoMap.set(key, m.content || "");
		});

		render();
	}

	function clearTooltips(root) {
		if (!hasBS) return;
		root.querySelectorAll("[data-bs-toggle='tooltip']").forEach((el) => {
			const inst = bootstrap.Tooltip.getInstance(el);
			if (inst) inst.dispose();
			el.removeAttribute("data-bs-toggle");
			el.removeAttribute("data-bs-title");
			el.removeAttribute("data-bs-html");
		});
	}

	function applyTooltip(el, dateStr, content) {
		if (!hasBS) return;

		const html = buildMemoTooltipHTML(dateStr, content);

		el.setAttribute("data-bs-toggle", "tooltip");
		el.setAttribute("data-bs-placement", "top");
		el.setAttribute("data-bs-html", "true");
		el.setAttribute("data-bs-title", html);

		new bootstrap.Tooltip(el, {
			trigger: "hover",
			container: "body",
			html: true
		});
	}

	function render() {
		clearAllMemoTooltips(); // (유령툴팁/점 방지)
		calEl.innerHTML = "";

		const root = document.createElement("div");

		// 요일
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
		start.setDate(first.getDate() - first.getDay()); // 일요일 시작

		const days = 42; // 6주 고정
		for (let i = 0; i < days; i++) {
			const d = new Date(start);
			d.setDate(start.getDate() + i);

			const cell = document.createElement("div");
			cell.className = "memo-cal-cell";

			const inMonth = (d.getMonth() === cur.getMonth());
			if (!inMonth) cell.classList.add("is-out");

			const dateStr = ymd(d);
			const memo = memoMap.get(dateStr);

			if (memo && memo.trim().length > 0) {
				cell.classList.add("has-memo");
				const dot = document.createElement("div");
				dot.className = "memo-cal-dot";
				cell.appendChild(dot);
				applyTooltip(cell, dateStr, memo);
			}

			const day = document.createElement("div");
			day.className = "memo-cal-day";
			day.textContent = String(d.getDate());
			cell.appendChild(day);

			cell.addEventListener("click", () => {
				if (!modal) return;

				// 이번달 밖이면 그 달로 이동
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
				"Accept": "application/json"
			},
			body: JSON.stringify({ date: dateStr, content }),
			cache: "no-store"
		});

		if (!res.ok) return;

		openDateStr = dateStr; // ✅ 동기화
		await loadMonth();
		btnDelete.style.display = (memoMap.get(dateStr) || "").trim() ? "" : "none";
		modal?.hide(); // ✅ 저장 후 메모 모달 닫기
	}

	async function deleteCurrent() {
		const dateStr = (openDateStr || dateLabel.textContent || "").trim();
		if (!dateStr) return;

		const res = await fetch(`/api/main/memos?date=${encodeURIComponent(dateStr)}&_ts=${Date.now()}`, {
			method: "DELETE",
			headers: { "Accept": "application/json" },
			cache: "no-store"
		});

		if (!res.ok) return;

		openDateStr = dateStr; // ✅ 동기화
		await loadMonth();
		contentEl.value = "";
		btnDelete.style.display = "none";
		modal?.hide(); // ✅ 저장 후 메모 모달 닫기
	}

	function clearAllMemoTooltips() {
		if (!hasBS) return;

		// 1) 달력 셀에 붙은 bootstrap tooltip 인스턴스 제거
		document.querySelectorAll("#memoCalendar [data-bs-toggle='tooltip']").forEach((el) => {
			const inst = bootstrap.Tooltip.getInstance(el);
			if (inst) inst.dispose();
		});

		// 2) body에 남아있는 tooltip DOM 강제 제거(유령 방지)
		document.querySelectorAll(".tooltip").forEach((t) => t.remove());
	}
	
	function dowKorean(dateStr){ // "YYYY-MM-DD"
	  const [y,m,d] = (dateStr || "").split("-").map(Number);
	  const dt = new Date(y, (m||1)-1, d||1);
	  const arr = ["일","월","화","수","목","금","토"];
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
	  // 메모가 없는 상태면 그냥 무시
	  const dateStr = (openDateStr || dateLabel.textContent || "").trim();
	  const memo = memoMap.get(dateStr) || "";
	  if (!dateStr || !memo.trim()) return;

	  if (!deleteModal) return;

	  deleteModal.show();
	});
	
	btnDeleteConfirm?.addEventListener("click", async () => {
	  await deleteCurrent();         // ✅ 실제 삭제
	  deleteModal?.hide();           // ✅ confirm 모달 닫기
	});

	modalEl?.addEventListener("hidden.bs.modal", () => {
		openDateStr = null;
	});

	loadMonth();
}