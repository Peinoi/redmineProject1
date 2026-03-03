// /static/js/main/issuesStatus.js
(() => {
	const $ = (s) => document.querySelector(s);

	const screen = $(".isssta-screen");
	if (!screen) return;

	const projectCode = screen.dataset.projectCode;
	if (!projectCode) return;

	const STATUS_LABEL = {
		"": "전체",
		OB1: "신규",
		OB2: "진행",
		OB3: "해결",
		OB4: "반려",
		OB5: "완료",
	};

	// 관리자/비관리자 패널 구분
	const adminTbody = $("#pickedIssueTbody");
	const adminLabel = $("#pickedFilterLabel");

	const userTbody = $("#pickedIssueTbodyUser");
	const userLabel = $("#pickedFilterLabelUser");

	/* =========================
	   Tooltip helpers (Main과 동일 컨셉)
	   ========================= */
	const hasBS = !!(window.bootstrap && bootstrap.Tooltip);

	const escapeHtml = (s) =>
		String(s)
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#039;");

	function buildTooltipHTML(mainText) {
		// 메인처럼 HTML로 통일(여긴 뱃지 필요 없음)
		return `<div>${escapeHtml(mainText || "")}</div>`;
	}

	// ✅ 말줄임인 경우에만 툴팁 적용
	function applyEllipsisTooltips(root = document) {
		if (!hasBS) return;

		// 말줄임 대상:
		// 1) 상단 Assignee/내현황 테이블: 유저명(a.user-link)
		// 2) 상태별 목록: 2번째 컬럼(일감명)
		// 3) Top5: 제목 컬럼(2번째)
		const targets = root.querySelectorAll(
			[
				"#issStaTable a.user-link",
				"#pickedIssueTable td:nth-child(2)",
				"#pickedIssueTableUser td:nth-child(2)",
				"#top5Table td:nth-child(2)",
			].join(",")
		);

		targets.forEach((el) => {
			// display:none 상태면 측정 불가
			if (el.offsetParent === null) return;

			const text = (el.textContent || "").trim();
			if (!text) return;

			// ✅ 실제 말줄임 여부 체크 (scrollWidth > clientWidth)
			const isTruncated = el.scrollWidth > el.clientWidth;

			// 기존 툴팁 인스턴스 정리
			const inst = bootstrap.Tooltip.getInstance(el);
			if (inst) inst.dispose();

			if (!isTruncated) {
				// 말줄임 아니면 속성 제거
				el.removeAttribute("data-bs-toggle");
				el.removeAttribute("data-bs-placement");
				el.removeAttribute("data-bs-title");
				el.removeAttribute("data-bs-html");
				return;
			}

			// 말줄임이면 툴팁 부착
			el.setAttribute("data-bs-toggle", "tooltip");
			el.setAttribute("data-bs-placement", "top");
			el.setAttribute("data-bs-html", "true");
			el.setAttribute("data-bs-title", buildTooltipHTML(text));

			new bootstrap.Tooltip(el, {
				trigger: "hover",
				container: "body",
				html: true,
			});
		});
	}

	// 처음 진입 시 1회 적용(서버 렌더 영역: issStaTable/top5Table)
	document.addEventListener("DOMContentLoaded", () => {
		requestAnimationFrame(() => applyEllipsisTooltips(document));
	});

	const goIssue = (issueCode) => {
		if (!issueCode) return;
		window.location.href = `/issueInfo?issueCode=${encodeURIComponent(issueCode)}`;
	};

	// ✅ tbody에 행을 그리되:
	// - 링크 제거
	// - 일감명 가운데 정렬
	// - 행 전체 클릭 시 이동(data-issue-code)
	// + ✅ 렌더 후 말줄임 툴팁 재적용
	const renderRows = (tbody, items) => {
		if (!tbody) return;

		tbody.innerHTML = "";
		if (!items || items.length === 0) {
			const tr = document.createElement("tr");
			tr.innerHTML = `<td colspan="5" class="text-muted py-3">표시할 데이터가 없습니다.</td>`;
			tbody.appendChild(tr);

			// 더미/빈 데이터일 때도 기존 툴팁 정리 목적상 한번
			requestAnimationFrame(() => applyEllipsisTooltips(tbody));
			return;
		}

		items.forEach((it, idx) => {
			const tr = document.createElement("tr");
			tr.classList.add("issue-row");
			tr.dataset.issueCode = it.issueCode || "";

			const due = it.dueAt ? String(it.dueAt).slice(0, 10) : "-";
			const pri = it.priorityName || "-";
			const sta = it.statusName || "-";

			tr.innerHTML = `
        <td>${idx + 1}</td>
        <td class="issue-title-cell">
          ${escapeHtml(it.title || "(제목없음)")}
        </td>
        <td>${escapeHtml(sta)}</td>
        <td>${escapeHtml(pri)}</td>
        <td>${escapeHtml(due)}</td>
      `;

			tr.addEventListener("click", () => {
				const sel = window.getSelection?.();
				if (sel && String(sel).trim().length > 0) return;
				goIssue(tr.dataset.issueCode);
			});

			tbody.appendChild(tr);
		});

		// ✅ AJAX 렌더 이후에 “보이는 행들” 기준으로 말줄임 체크/툴팁 재적용
		requestAnimationFrame(() => applyEllipsisTooltips(tbody));
	};

	const fetchIssues = async ({ assigneeCode, statusId }) => {
		const url =
			`/api/main/issuesStatus/picked` +
			`?projectCode=${encodeURIComponent(projectCode)}` +
			`&assigneeCode=${encodeURIComponent(assigneeCode || "")}` +
			`&statusId=${encodeURIComponent(statusId || "")}` +
			`&limit=50`;

		const res = await fetch(url, { headers: { Accept: "application/json" } });
		if (!res.ok) throw new Error("목록을 불러오지 못했습니다.");
		return res.json();
	};

	const setLabel = (labelEl, assigneeName, statusId) => {
		if (!labelEl) return;
		const statusText = STATUS_LABEL[statusId || ""] || "전체";
		labelEl.textContent = assigneeName
			? `${assigneeName} · ${statusText}`
			: `${statusText}`;
	};

	// ✅ Top5: 행 클릭 이동
	const bindTop5RowClicks = () => {
		const top5Table = $("#top5Table");
		if (!top5Table) return;

		top5Table.addEventListener("click", (e) => {
			const tr = e.target.closest("tbody tr.issue-row");
			if (!tr) return;

			const sel = window.getSelection?.();
			if (sel && String(sel).trim().length > 0) return;

			goIssue(tr.dataset.issueCode);
		});

		// Top5도 말줄임 툴팁 대상이 있으니 초기 1회 보정
		requestAnimationFrame(() => applyEllipsisTooltips(top5Table));
	};
	bindTop5RowClicks();

	/* =========================
	   Back button: 이전 페이지로
	   - 이전 페이지가 /users/{userCode}면 history -2
	   - 그 외 history.back()
	   - 불가 시 /G2main fallback
	   ========================= */
	const bindBackButton = () => {
		const btn = document.getElementById("btnBack");
		if (!btn) return;

		btn.addEventListener("click", () => {
			const ref = document.referrer || "";

			// 같은 오리진 referrer만 신뢰(외부 사이트에서 넘어온 경우는 fallback/back 처리)
			const sameOrigin = ref.startsWith(window.location.origin);

			// /users/{숫자} 패턴이면 두 번 뒤로
			const isUserPageRef =
				sameOrigin && /\/users\/\d+(?:\?.*)?$/.test(new URL(ref).pathname);

			// 히스토리 없을 때 대비 (직접 진입/새 탭 등)
			const canGoBack = window.history.length > 1;

			try {
				if (canGoBack) {
					if (isUserPageRef) window.history.go(-2);
					else window.history.back();
				} else {
					window.location.href = "/G2main";
				}
			} catch (e) {
				window.location.href = "/G2main";
			}
		});
	};

	bindBackButton();

	// 클릭: 숫자 버튼
	document.addEventListener("click", async (e) => {
		const btn = e.target.closest(".count-btn");
		if (!btn) return;

		const assigneeCode = btn.dataset.assignee || "";
		const statusId = btn.dataset.status || "";

		// 담당자명은 같은 행의 이름 링크에서 뽑기
		const tr = btn.closest("tr");
		let assigneeName = "";
		if (tr) {
			const nameEl = tr.querySelector("td a.user-link");
			if (nameEl) assigneeName = (nameEl.textContent || "").trim();
		}

		try {
			// 로딩 표시
			if (adminTbody) renderRows(adminTbody, []);
			if (userTbody) renderRows(userTbody, []);

			if (adminLabel) adminLabel.textContent = "불러오는 중...";
			if (userLabel) userLabel.textContent = "불러오는 중...";

			const list = await fetchIssues({ assigneeCode, statusId });

			if (adminTbody) {
				setLabel(adminLabel, assigneeName, statusId);
				renderRows(adminTbody, list);
			} else if (userTbody) {
				setLabel(userLabel, "", statusId);
				renderRows(userTbody, list);
			}
		} catch (err) {
			const msg = err?.message || "오류가 발생했습니다.";
			if (adminLabel) adminLabel.textContent = msg;
			if (userLabel) userLabel.textContent = msg;
		}
	});
})();

