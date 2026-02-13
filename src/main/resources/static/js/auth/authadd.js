// ============================================
//  전체 선택
// ============================================
function setupSelectAll() {
	const authTypes = [
		{ allId: 'readSelectAll', itemClass: 'rd_rol' },
		{ allId: 'writeSelectAll', itemClass: 'wr_rol' },
		{ allId: 'modifySelectAll', itemClass: 'md_rol' },
		{ allId: 'deleteSelectAll', itemClass: 'del_rol' }
	];

	authTypes.forEach(auth => {
		const selectAllCheckbox = document.getElementById(auth.allId);
		const itemCheckboxes = document.querySelectorAll(`.${auth.itemClass}`);

		if (!selectAllCheckbox) return;

		// 1. 헤더 체크박스 클릭 시 전체 선택/해제
		selectAllCheckbox.addEventListener('change', function() {
			itemCheckboxes.forEach(checkbox => {
				checkbox.checked = this.checked;
			});
		});

		// 2. 개별 체크박스 클릭 
		itemCheckboxes.forEach(checkbox => {
			checkbox.addEventListener('change', function() {
				const allChecked = Array.from(itemCheckboxes).every(cb => cb.checked);
				const someChecked = Array.from(itemCheckboxes).some(cb => cb.checked);

				selectAllCheckbox.checked = allChecked;
				// 하나라도 체크되어 있지만 전체는 아닐 때 '-' 표시
				selectAllCheckbox.indeterminate = someChecked && !allChecked;
			});
		});
	});

	// ============================================
	//  가로(행) 전체 선택 처리
	// ============================================
	const rowCheckboxes = document.querySelectorAll('.row-check');

	rowCheckboxes.forEach(rowHeader => {
		rowHeader.addEventListener('change', function() {
			const parentRow = this.closest('tr');
			const rowItems = parentRow.querySelectorAll('input[type="checkbox"]:not(.row-check)');

			rowItems.forEach(item => {
				item.checked = this.checked;
				item.dispatchEvent(new Event('change'));
			});
		});
	});

	// ============================================
	//  표 전체 선택
	// ============================================
	const masterCheck = document.querySelector('.all-check');
	// 테이블 모든 체크박스들 선택
	const allTableChecks = document.querySelectorAll('#projectTbody input[type="checkbox"]');
	// 헤더에 있는 체크박스들
	const columnHeadChecks = document.querySelectorAll('thead input[type="checkbox"]:not(.all-check)');

	if (masterCheck) {
		masterCheck.addEventListener('change', function() {
			const isChecked = this.checked;

			allTableChecks.forEach(cb => {
				cb.checked = isChecked;
				cb.dispatchEvent(new Event('change'));
			});

			columnHeadChecks.forEach(cb => {
				cb.checked = isChecked;
				cb.indeterminate = false; // '-' 표시 초기화
			});
		});
	}
}


function registerRole() {
	// 1. 입력값 가져오기
	const roleName = document.getElementById('roleName').value.trim();
	const explanation = document.getElementById('explanation').value.trim();
	const adminCheck = document.getElementById('adminCheck').checked;

	// 2. 유효성 검사
	if (!roleName) {
		alert('역할명을 입력해주세요.');
		return;
	}

	// 3. 권한 데이터 수집
	const permissions = [];
	const rows = document.querySelectorAll('#projectTbody tr');

	rows.forEach(row => {
		const category = row.cells[0].textContent.trim();
		const rdRol = row.querySelector('.rd_rol').checked ? 'Y' : 'N';
		const wrRol = row.querySelector('.wr_rol').checked ? 'Y' : 'N';
		const moRol = row.querySelector('.md_rol').checked ? 'Y' : 'N';
		const delRol = row.querySelector('.del_rol').checked ? 'Y' : 'N';

		permissions.push({
			category: category,
			rdRol: rdRol,
			wrRol: wrRol,
			moRol: moRol,
			delRol: delRol
		});
	});

	// 4. 서버로 전송할 데이터 구성
	const requestData = {
		roleName: roleName,
		explanation: explanation,
		adminCk: adminCheck ? 'Y' : 'N',
		permissions: permissions
	};

	// 5. AJAX 요청
	fetch('/api/auth/register', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(requestData)
	})
		.then(response => response.json())
		.then(data => {
			if (data.success) {
				alert(data.message);
				window.location.href = '/auth'; // 역할 목록 페이지로 이동
			} else {
				alert(data.message);
			}
		})
		.catch(error => {
			console.error('Error:', error);
			alert('역할 등록 중 오류가 발생했습니다.');
		});
}

// ============================================
// 페이지 로드 시 초기화
// ============================================
document.addEventListener('DOMContentLoaded', function() {
	setupSelectAll();

	// 권한 등록 버튼에 이벤트 리스너 추가
	const registerButton = document.querySelector('#registerRoleBtn');
	if (registerButton) {
		registerButton.onclick = function(e) {
			e.preventDefault();
			registerRole();
		};
	}
});