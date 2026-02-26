(() => {
	const $ = (sel) => document.querySelector(sel);
	const $$ = (sel) => Array.from(document.querySelectorAll(sel));

	const pageSize = 10;

	const rowsAll = () => $$("#projectTbody tr.projectRow");
	const rowsVisible = () => rowsAll().filter((tr) => tr.dataset.filtered !== "1");

	const ui = {
		title: $("#filterTitle"),
		btnApply: $("#btnApplyFilters"),
		btnReset: $("#btnResetFilters"),
		pagination: $("#projectPagination"),
		pageInfo: $("#projectPageInfo"),
	};

	let currentPage = 1;

	// 행 데이터 추출
	function rowData(tr) {
		const cells = tr.querySelectorAll("td");
		return {
			number: cells[0]?.textContent.trim() || "",
			code: cells[1]?.textContent.trim() || "",
			roleName: cells[2]?.textContent.trim() || "",
			explanation: cells[3]?.textContent.trim() || "",
		};
	}

	// 필터 적용
	function applyFilters() {
		const roleName = ui.title.value.trim().toLowerCase();

		rowsAll().forEach((tr) => {
			const d = rowData(tr);
			let ok = true;

			if (roleName && !d.roleName.toLowerCase().includes(roleName)) {
				ok = false;
			}

			tr.dataset.filtered = ok ? "0" : "1";
		});

		currentPage = 1;
		renderPage();
	}

	// 필터 초기화
	function resetFilters() {
		ui.title.value = "";
		rowsAll().forEach((tr) => (tr.dataset.filtered = "0"));
		currentPage = 1;
		renderPage();
	}

	// 페이지네이션 렌더링
	function renderPagination(totalPages) {
		ui.pagination.innerHTML = "";
		if (totalPages <= 1) return;

		const makeItem = (label, page, disabled, active) => {
			const li = document.createElement("li");
			li.className = "page-item";
			if (disabled) li.classList.add("disabled");
			if (active) li.classList.add("active");

			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "page-link";
			btn.textContent = label;
			btn.addEventListener("click", () => {
				if (disabled) return;
				currentPage = page;
				renderPage();
			});

			li.appendChild(btn);
			return li;
		};

		ui.pagination.appendChild(
			makeItem("이전", Math.max(1, currentPage - 1), currentPage === 1, false)
		);

		for (let p = 1; p <= totalPages; p++) {
			ui.pagination.appendChild(makeItem(String(p), p, false, p === currentPage));
		}

		ui.pagination.appendChild(
			makeItem("다음", Math.min(totalPages, currentPage + 1), currentPage === totalPages, false)
		);
	}

	// 페이지 렌더링
	function renderPage() {
		const visible = rowsVisible();
		const total = visible.length;
		const totalPages = Math.max(1, Math.ceil(total / pageSize));

		if (currentPage > totalPages) currentPage = totalPages;

		const start = (currentPage - 1) * pageSize;
		const end = start + pageSize;

		rowsAll().forEach((tr) => {
			tr.style.display = "none";
		});

		visible.slice(start, end).forEach((tr) => {
			tr.style.display = "";
		});

		renderPagination(totalPages);

		if (ui.pageInfo) {
			const from = total === 0 ? 0 : start + 1;
			const to = Math.min(end, total);
			ui.pageInfo.textContent = `${from}-${to} / ${total}`;
		}
	}
	// 삭제 버튼 이벤트
	$("#projectTbody").addEventListener("click", async (e) => {
		const btn = e.target.closest("button");
		if (!btn || !btn.classList.contains("delete-btn")) return;

		const row = btn.closest("tr");
		const roleCode = rowData(row).code;
		const roleName = rowData(row).roleName;

		if (!confirm(`"${roleName}" 역할을 삭제하시겠습니까?`)) return;

		try {
			const response = await fetch(`/api/auth/${roleCode}/delete`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Requested-With': 'XMLHttpRequest'
				}
			});


			// 리다이렉트 여부 확인
			if (response.redirected) {
				alert('권한이 없습니다.');
				return;
			}

			// 403 상태 코드 확인
			if (response.status === 403) {
				alert('권한이 없습니다.');
				return;
			}

			// Content-Type 확인 (JSON이 아니면 에러)
			const contentType = response.headers.get("content-type");
			if (!contentType || !contentType.includes("application/json")) {
				alert('삭제 권한이 없습니다.');
				return;
			}

			const result = await response.json();

			if (result.success) {
				alert(result.message);
				// 화면에서 제거
				row.dataset.filtered = "1";
				row.style.display = "none";
				renderPage();
			} else {
				alert(result.message); // "삭제 권한이 없습니다." 메시지 표시
			}
		} catch (error) {
			console.error('삭제 오류:', error);
			alert('삭제 처리 중 오류가 발생했습니다.');
		}
	});


	// 저장 버튼 이벤트
	document.querySelector("#projectTbody").addEventListener("click", async (e) => {
		const btn = e.target.closest("button");
		if (!btn || !btn.classList.contains("save-btn")) return;

		const row = btn.closest("tr");

		const roleCode = row.cells[1].innerText;
		const roleName = row.cells[2].innerText;

		// 체크박스 상태 확인 (Y/N 결정)
		const adminCkBox = row.querySelector('input[name="adminck"]');
		const adminCk = adminCkBox.checked ? 'Y' : 'N';

		if (!confirm(`"${roleName}"의 마스터 권한을 변경하시겠습니까?`)) return;

		try {
			const response = await fetch(`/api/auth/${adminCk}/${roleCode}/adminmodify`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Requested-With': 'XMLHttpRequest'
				}
			});

			// 리다이렉트 여부 확인
			if (response.redirected) {
				alert('권한이 없습니다.');
				return;
			}

			// 403 상태 코드 확인
			if (response.status === 403) {
				alert('권한이 없습니다.');
				return;
			}

			// Content-Type 확인 (JSON이 아니면 에러)
			const contentType = response.headers.get("content-type");
			if (!contentType || !contentType.includes("application/json")) {
				alert('삭제 권한이 없습니다.');
				return;
			}

			const result = await response.json();

			// 컨트롤러가 int(성공 시 1)를 반환하므로 숫자로 체크
			if (result > 0) {
				alert("권한 수정이 완료되었습니다.");
				// 성공 후 별도의 페이지 이동이 없다면 현재 상태 유지
			} else {
				alert("권한 수정에 실패했습니다.");
			}
		} catch (error) {
			console.error('수정 오류:', error);
			alert('처리 중 오류가 발생했습니다.');
		}
	});

	// 권한 상세페이지
	$("#projectTbody").addEventListener("click", (e) => {
	    const btn = e.target.closest("button");
	    if (!btn || !btn.classList.contains("auth-btn")) return;

	    const row = btn.closest("tr");
	    const roleCode = rowData(row).code;

	    location.href = `/authInfo?roleCode=${roleCode}`;
	});
	

	// 이벤트 바인딩
	ui.btnApply.addEventListener("click", applyFilters);
	ui.btnReset.addEventListener("click", resetFilters);

	// 초기 화면 설정
	rowsAll().forEach((tr) => {
		tr.dataset.filtered = "0";
	});



	// 초기 렌더링
	renderPage();
})();
