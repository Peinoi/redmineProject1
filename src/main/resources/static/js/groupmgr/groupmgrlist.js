// ============================================
// groupmgrlist.js
// ============================================

const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let filteredRows = [];

document.addEventListener('DOMContentLoaded', function() {
	filteredRows = Array.from(document.querySelectorAll('tr.groupRow'));
	initializeEventListeners();
	renderPage(1);
});

function initializeEventListeners() {
	document.querySelectorAll('tr.groupRow').forEach(row => {
		row.addEventListener('click', function() {
			window.location.href = `/groupmgr/${this.dataset.groupCode}`;
		});
	});

	document.querySelectorAll('.btn-delete-group').forEach(btn => {
		btn.addEventListener('click', function(e) {
			e.stopPropagation();
			deleteGroup(this.dataset.groupCode);
		});
	});

	document.getElementById('btnApplyFilters').addEventListener('click', applyFilters);
	document.getElementById('btnResetFilters').addEventListener('click', function() {
		document.getElementById('filterTitle').value = '';
		filteredRows = Array.from(document.querySelectorAll('tr.groupRow'));
		renderPage(1);
	});
	document.getElementById('filterTitle').addEventListener('keydown', e => {
		if (e.key === 'Enter') applyFilters();
	});
}

function applyFilters() {
	const kw = document.getElementById('filterTitle').value.trim().toLowerCase();
	filteredRows = Array.from(document.querySelectorAll('tr.groupRow')).filter(row =>
		row.cells[1].textContent.toLowerCase().includes(kw)
	);
	renderPage(1);
}

function renderPage(page) {
	currentPage = page;
	const allRows = Array.from(document.querySelectorAll('tr.groupRow'));
	allRows.forEach(r => r.style.display = 'none');

	const pageRows = filteredRows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
	const emptyRow = document.querySelector('#groupTbody tr:not(.groupRow)');

	if (!filteredRows.length) {
		if (emptyRow) emptyRow.style.display = '';
	} else {
		if (emptyRow) emptyRow.style.display = 'none';
		pageRows.forEach(r => r.style.display = '');
	}

	const total = filteredRows.length;
	document.getElementById('groupPageInfo').textContent =
		`총 ${total}건 (${page} / ${Math.ceil(total / ITEMS_PER_PAGE) || 1} 페이지)`;
	renderPagination(total);
}

function renderPagination(total) {
	const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1;
	const ul = document.getElementById('groupPagination');
	ul.innerHTML = '';

	const mkLi = (label, page, disabled) => {
		const li = document.createElement('li');
		li.className = `page-item ${disabled ? 'disabled' : ''}`;
		li.innerHTML = `<a class="page-link" href="#">${label}</a>`;
		if (!disabled) li.addEventListener('click', e => { e.preventDefault(); renderPage(page); });
		return li;
	};

	ul.appendChild(mkLi('이전', currentPage - 1, currentPage === 1));
	for (let i = 1; i <= totalPages; i++) {
		const li = mkLi(i, i, false);
		if (i === currentPage) li.classList.add('active');
		ul.appendChild(li);
	}
	ul.appendChild(mkLi('다음', currentPage + 1, currentPage === totalPages));
}

function deleteGroup(groupCode) {
	if (!confirm('해당 그룹을 삭제하시겠습니까?')) return;

	fetch(`/api/groupmgr/${groupCode}/delete`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest'

		}
	})
		.then(res => {
			if (res.status === 403) {
				alert('권한이 없습니다.');
				return null;
			}
			return res.json();
		})
		.then(data => {
			if (!data) return;  
			if (data.success) { alert(data.message); window.location.reload(); }
			else { alert(data.message); }
		})
		.catch(() => alert('삭제 처리 중 오류가 발생했습니다.'));
}
