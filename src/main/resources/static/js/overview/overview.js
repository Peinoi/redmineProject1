// /js/overview/overview.js 
document.addEventListener("DOMContentLoaded", function() {
	const backBtn = document.getElementById("btnBack");
	if (!backBtn) return;

	backBtn.addEventListener("click", function(e) {
		e.preventDefault();

		if (history.length > 1) {
			history.back();
		} else {
			window.location.href = "/G2main";
		}
	});
});

document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('#mainIssueTable tr.click-row')
		.forEach(row => {
			row.addEventListener('click', () => {
				const url = row.getAttribute('data-url');
				if (url) {
					window.location.href = url;
				}
			});
		});
});

function loadNotices(pageNum) {
	fetch(`/project/overview/${projectCode}/notices?pageNum=${pageNum}`)
		.then(res => res.json())
		.then(data => {
			const listEl = document.getElementById('noticeList');
			const pagingEl = document.getElementById('noticePaging');

			// 목록 렌더링
			if (data.list.length === 0) {
				listEl.innerHTML = '<div class="p-3 text-muted">등록된 공지사항이 없습니다.</div>';
			} else {
				listEl.innerHTML = data.list.map(n => `
                    <a href="/noticeInfo?noticeCode=${encodeURIComponent(n.noticeCode)}" 
					   class="list-group-item list-group-item-action d-flex justify-content-between align-items-start">
                        <div class="me-2">
                            <div class="notice-title">${n.title}</div>
                            <div class="notice-meta text-muted small">
                                <span>${n.projectName}</span>
                                <span class="ms-2">${new Date(n.createdAt).toLocaleDateString('ko-KR')}</span>
                            </div>
                        </div>
                    </a>
                `).join('');
			}

			// 페이징 렌더링
			if (data.pages >= 1) {
				let html = '<ul class="pagination pagination-sm justify-content-center mb-0">';

				// 맨앞
				html += `<li class="page-item ${data.isFirstPage ? 'disabled' : ''}">
				            <a class="page-link" onclick="loadNotices(1)"><i class="fas fa-angles-left"></i></a>
				         </li>`;
				// 이전
				html += `<li class="page-item ${data.isFirstPage ? 'disabled' : ''}">
				            <a class="page-link" onclick="loadNotices(${data.pageNum - 1})"><i class="fas fa-angle-left"></i></a>
				         </li>`;

				data.navigatepageNums.forEach(num => {
					html += `<li class="page-item ${num === data.pageNum ? 'active' : ''}">
			                    <a class="page-link" onclick="loadNotices(${num})">${num}</a>
			                 </li>`;
				});

				// 다음
				html += `<li class="page-item ${data.isLastPage ? 'disabled' : ''}">
								            <a class="page-link" onclick="loadNotices(${data.pageNum + 1})"><i class="fas fa-angle-right"></i></a>
								         </li>`;
				// 맨끝
				html += `<li class="page-item ${data.isLastPage ? 'disabled' : ''}">
								            <a class="page-link" onclick="loadNotices(${data.pages})"><i class="fas fa-angles-right"></i></a>
								         </li>`;

				html += '</ul>';
				pagingEl.innerHTML = html;
			}
		});
}

// 페이지 로드시 1페이지 호출
loadNotices(1);
