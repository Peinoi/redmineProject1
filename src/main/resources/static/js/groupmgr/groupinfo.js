// ============================================
// groupinfo.js
// ============================================

let memberChanges = [];  // { grMemCode, userCode, userName, email, action }
let projectChanges = []; // { grProCode, projectCode, projectName,roleCode, roleName, action }

document.addEventListener('DOMContentLoaded', function() {
	// DOM에서 초기 데이터 읽기
	document.querySelectorAll('#memberTbody tr.memberRow').forEach(row => {
		memberChanges.push({
			grMemCode: parseInt(row.dataset.grMemCode),
			userCode: parseInt(row.dataset.userCode),
			userName: row.querySelector('.user-link')?.textContent.trim() || '',
			email: row.cells[1]?.textContent.trim() || '',
			action: 'keep'
		});
	});
	document.querySelectorAll('#projectTbody tr.projectRow').forEach(row => {
		const status = row.dataset.status; // HTML에서 th:data-status="${proj.status}" 형태로 전달받음

		if (status === 'OD3') {
			// 1. 종료된 프로젝트는 회색 배경 처리 (Bootstrap 클래스 또는 inline style)
			row.classList.add('table-secondary', 'text-muted');

			// 2. 수정/삭제 버튼 영역을 비우거나 숨김
			const actionCells = row.querySelectorAll('td button');
			actionCells.forEach(btn => btn.remove());
		}
		projectChanges.push({
			grProCode: parseInt(row.dataset.grProCode),
			projectCode: parseInt(row.dataset.projectCode),
			projectName: row.querySelector('a')?.textContent.trim() || '',
			roleCode: parseInt(row.dataset.roleCode),
			roleName: row.cells[1]?.textContent.trim() || '',
			action: 'keep'
		});
	});

	initializeEventListeners();
});

function initializeEventListeners() {
	document.getElementById('btnAddMember').addEventListener('click', openMemberModal);
	document.getElementById('btnAddProject').addEventListener('click', openProjectModal);
	document.getElementById('btnSubmit').addEventListener('click', handleFormSubmit);

	document.getElementById('memberModalSearch').addEventListener('input', e =>
		filterModal(e, '#memberModalList'));
	document.getElementById('projectModalSearch').addEventListener('input', e =>
		filterModal(e, '#projectModalList'));

	// 기존 구성원 삭제
	document.querySelectorAll('.btn-remove-member').forEach(btn => {
		btn.addEventListener('click', function() {
			markMemberDelete(parseInt(this.dataset.grMemCode), this.closest('tr'));
		});
	});

	document.querySelectorAll('#memberTbody tr.memberRow').forEach(row => {
		row.style.cursor = 'pointer'; // JS에서 직접 부여 가능
		row.onclick = function() {
			location.href = `/users/${this.dataset.userCode}`;
		};

		// 기존 행 안의 삭제 버튼이나 링크에도 전파 방지가 되어 있는지 확인 필요
		const link = row.querySelector('.user-link');
		if (link) link.onclick = (e) => e.stopPropagation();

		const delBtn = row.querySelector('.btn-remove-member');
		if (delBtn) delBtn.onclick = (e) => e.stopPropagation();
	});

	// 기존 프로젝트 수정/삭제
	document.querySelectorAll('.btn-remove-project').forEach(btn => {
		btn.addEventListener('click', function() {
			markProjectDelete(parseInt(this.dataset.grProCode), this.closest('tr'));
		});
	});
	document.querySelectorAll('.btn-edit-project').forEach(btn => {
		btn.addEventListener('click', function() {
			openEditExistingProject(parseInt(this.dataset.grProCode), parseInt(this.dataset.roleCode));
		});
	});
}

function filterModal(e, selector) {
	const kw = e.target.value.toLowerCase();
	document.querySelectorAll(selector + ' tr').forEach(row => {
		row.style.display = row.textContent.toLowerCase().includes(kw) ? '' : 'none';
	});
}

// ============================================
// 구성원 처리
// ============================================
function markMemberDelete(grMemCode, row) {
	if (!confirm('해당 구성원을 삭제하시겠습니까?')) return;
	const item = memberChanges.find(m => m.grMemCode === grMemCode);
	if (item) item.action = 'delete';
	row.remove();
	updateMemberCount();
	checkEmptyMember();
}

function openMemberModal() {
	const users = window.serverData?.users || [];
	const activeCodes = memberChanges.filter(m => m.action !== 'delete').map(m => m.userCode);
	const available = users.filter(u => !activeCodes.includes(parseInt(u.userCode)));

	const tbody = document.getElementById('memberModalList');
	tbody.innerHTML = '';
	if (!available.length) {
		tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">추가 가능한 구성원이 없습니다.</td></tr>`;
	} else {
		available.forEach(u => {
			const tr = document.createElement('tr');
			tr.innerHTML = `
                <td><div class="form-check">
                    <input class="form-check-input member-checkbox" type="checkbox"
                           value="${u.userCode}" id="mcheck_${u.userCode}"
                           data-user-name="${u.name}" data-user-email="${u.email || ''}">
                </div></td>
                <td><label class="form-check-label w-100" for="mcheck_${u.userCode}" style="cursor:pointer;">${u.name}</label></td>
                <td>${u.email || ''}</td>`;
			tbody.appendChild(tr);
		});
	}

	setupSelectAll('selectAllMembers', '.member-checkbox');
	const modal = new bootstrap.Modal(document.getElementById('memberSelectModal'));
	modal.show();
	rebindBtn('btnAddSelectedMembers', addSelectedMembers);
}

function addSelectedMembers() {
	const checked = document.querySelectorAll('.member-checkbox:checked');
	if (!checked.length) { alert('추가할 구성원을 선택해주세요.'); return; }

	removeEmptyRow('noMemberRow');
	const tbody = document.getElementById('memberTbody');

	checked.forEach(cb => {
		const userCode = parseInt(cb.value);
		memberChanges.push({ grMemCode: null, userCode, userName: cb.dataset.userName, email: cb.dataset.userEmail, action: 'add' });

		const tr = document.createElement('tr');
		tr.className = 'memberRow';
		tr.dataset.userCode = userCode;
		// 행(tr) 전체에 클릭 이벤트 추가 (상세 페이지 이동)
		tr.onclick = function() {
			location.href = `/users/${this.dataset.userCode}`;
			console.log(this.dataset.userCode);
		};

		tr.innerHTML = `
		    <td>
		        ${cb.dataset.userName}
		    </td>
		    <td>${cb.dataset.userEmail || ''}</td>
		    <td>
		        <button type="button" class="btn btn-danger btn-sm" 
		                onclick="event.stopPropagation(); removeNewMember(this, ${userCode})">
		            <i class="fa-solid fa-minus me-1"></i>삭제
		        </button>
		    </td>`;
		tbody.appendChild(tr);
	});

	updateMemberCount();
	bootstrap.Modal.getInstance(document.getElementById('memberSelectModal')).hide();
	alert(`${checked.length}명의 구성원이 추가되었습니다.`);
}

function removeNewMember(btn, userCode) {
	if (!confirm('해당 구성원을 삭제하시겠습니까?')) return;
	const idx = memberChanges.findLastIndex(m => m.userCode === userCode && m.action === 'add');
	if (idx !== -1) memberChanges.splice(idx, 1);
	btn.closest('tr').remove();
	updateMemberCount();
	checkEmptyMember();
}

function updateMemberCount() {
	const active = memberChanges.filter(m => m.action !== 'delete').length;
	const badge = document.getElementById('memberCount');
	if (badge) badge.textContent = active;
}

function checkEmptyMember() {
	const tbody = document.getElementById('memberTbody');
	if (!tbody.querySelectorAll('tr').length) {
		tbody.innerHTML = `<tr id="noMemberRow"><td colspan="3" class="text-center text-muted">추가된 구성원이 없습니다.</td></tr>`;
	}
}

// ============================================
// 프로젝트 처리
// ============================================
function markProjectDelete(grProCode, row) {
	if (!confirm('해당 프로젝트를 삭제하시겠습니까?')) return;
	const item = projectChanges.find(p => p.grProCode === grProCode);
	if (item) item.action = 'delete';
	row.remove();
	checkEmptyProject();
}

function openEditExistingProject(grProCode, currentRoleCode) {
	const roles = window.serverData?.roles || [];
	const options = roles.map(r =>
		`<option value="${r.roleCode}" ${r.roleCode === currentRoleCode ? 'selected' : ''}>${r.roleName}</option>`
	).join('');

	showEditModal(options, (roleCode, roleName) => {
		const item = projectChanges.find(p => p.grProCode === grProCode);
		if (item) { item.roleCode = parseInt(roleCode); item.roleName = roleName; }
		const row = document.querySelector(`tr.projectRow[data-gr-pro-code="${grProCode}"]`);
		if (row) { row.cells[1].textContent = roleName; row.dataset.roleCode = roleCode; }
	});
}

function openProjectModal() {
	const projects = window.serverData?.projects || [];
	const roles = window.serverData?.roles || [];
	const activeCodes = projectChanges.filter(p => p.action !== 'delete').map(p => p.projectCode);
	const available = projects.filter(p => !activeCodes.includes(parseInt(p.projectCode)));

	const tbody = document.getElementById('projectModalList');
	tbody.innerHTML = '';
	if (!available.length) {
		tbody.innerHTML = `<tr><td colspan="2" class="text-center text-muted py-3">추가 가능한 프로젝트가 없습니다.</td></tr>`;
	} else {
		available.forEach(p => {
			const tr = document.createElement('tr');
			tr.innerHTML = `
                <td><div class="form-check">
                    <input class="form-check-input project-checkbox" type="checkbox"
                           value="${p.projectCode}" id="pcheck_${p.projectCode}"
                           data-project-name="${p.projectName}">
                </div></td>
                <td><label class="form-check-label w-100" for="pcheck_${p.projectCode}" style="cursor:pointer;">${p.projectName}</label></td>`;
			tbody.appendChild(tr);
		});
	}

	renderRoleList('projectRoleList', roles, 'proj-role-radio');
	setupSelectAll('selectAllProjects', '.project-checkbox');

	const modal = new bootstrap.Modal(document.getElementById('projectSelectModal'));
	modal.show();
	rebindBtn('btnAddSelectedProjects', addSelectedProjects);
}

function addSelectedProjects() {
	const checkedProjs = document.querySelectorAll('.project-checkbox:checked');
	const checkedRole = document.querySelector('.proj-role-radio:checked');
	if (!checkedProjs.length) { alert('추가할 프로젝트를 선택해주세요.'); return; }
	if (!checkedRole) { alert('역할을 선택해주세요.'); return; }

	const roles = window.serverData?.roles || [];
	const roleObj = roles.find(r => String(r.roleCode) === checkedRole.value);

	removeEmptyRow('noProjectRow');
	const tbody = document.getElementById('projectTbody');

	checkedProjs.forEach(cb => {
		const projectCode = parseInt(cb.value);
		const roleCode = parseInt(checkedRole.value);
		const roleName = roleObj ? roleObj.roleName : '';
		projectChanges.push({ grProCode: null, projectCode, projectName: cb.dataset.projectName, roleCode, roleName, action: 'add' });

		const tr = document.createElement('tr');
		tr.className = 'projectRow';
		if (status === 'OD3') {
			tr.classList.add('table-secondary', 'text-muted');
			
			tr.innerHTML = `
		                <td><a href="/project/${projectCode}" class="text-decoration-none text-muted">${cb.dataset.projectName}</a></td>
		                <td class="role-name-cell">${roleName}</td>
		                <td>-</td>
		                <td>-</td>`;
		} else {
			tr.innerHTML = `
		                <td><a href="/project/${projectCode}" class="text-decoration-none">${cb.dataset.projectName}</a></td>
		                <td class="role-name-cell">${roleName}</td>
		                <td><button type="button" class="btn btn-success btn-sm" onclick="openEditNewProject(this, ${projectCode})">수정</button></td>
		                <td><button type="button" class="btn btn-danger btn-sm" onclick="removeNewProject(this, ${projectCode})">삭제</button></td>`;
		}
		tbody.appendChild(tr);
	});

	bootstrap.Modal.getInstance(document.getElementById('projectSelectModal')).hide();
	alert(`${checkedProjs.length}개의 프로젝트가 추가되었습니다.`);
}

function openEditNewProject(btn, projectCode) {
	const roles = window.serverData?.roles || [];
	const row = btn.closest('tr');
	const currentRoleCode = parseInt(row.dataset.roleCode);
	const options = roles.map(r =>
		`<option value="${r.roleCode}" ${r.roleCode === currentRoleCode ? 'selected' : ''}>${r.roleName}</option>`
	).join('');

	showEditModal(options, (roleCode, roleName) => {
		const item = projectChanges.findLast(p => p.projectCode === projectCode && p.action === 'add');
		if (item) { item.roleCode = parseInt(roleCode); item.roleName = roleName; }
		row.cells[1].textContent = roleName;
		row.dataset.roleCode = roleCode;
	});
}

function removeNewProject(btn, projectCode) {
	if (!confirm('해당 프로젝트를 삭제하시겠습니까?')) return;
	const idx = projectChanges.findLastIndex(p => p.projectCode === projectCode && p.action === 'add');
	if (idx !== -1) projectChanges.splice(idx, 1);
	btn.closest('tr').remove();
	checkEmptyProject();
}

function checkEmptyProject() {
	const tbody = document.getElementById('projectTbody');
	if (!tbody.querySelectorAll('tr').length) {
		tbody.innerHTML = `<tr id="noProjectRow"><td colspan="4" class="text-center text-muted">추가된 프로젝트가 없습니다.</td></tr>`;
	}
}

// ============================================
// 공통 유틸
// ============================================
function renderRoleList(containerId, roles, radioName) {
	const container = document.getElementById(containerId);
	container.innerHTML = '';
	roles.forEach((role, i) => {
		const div = document.createElement('div');
		div.className = 'form-check';
		div.innerHTML = `
            <input class="form-check-input ${radioName}" type="radio"
                   name="${radioName}" value="${role.roleCode}"
                   id="${radioName}_${role.roleCode}" ${i === 0 ? 'checked' : ''}>
            <label class="form-check-label" for="${radioName}_${role.roleCode}">${role.roleName}</label>`;
		container.appendChild(div);
	});
}

function setupSelectAll(selectAllId, checkboxSelector) {
	const el = document.getElementById(selectAllId);
	const newEl = el.cloneNode(true);
	el.parentNode.replaceChild(newEl, el);
	newEl.checked = false;
	newEl.addEventListener('change', function() {
		document.querySelectorAll(checkboxSelector).forEach(cb => cb.checked = this.checked);
	});
}

function rebindBtn(btnId, handler) {
	const btn = document.getElementById(btnId);
	const newBtn = btn.cloneNode(true);
	btn.parentNode.replaceChild(newBtn, btn);
	newBtn.addEventListener('click', handler);
}

function removeEmptyRow(rowId) {
	const row = document.getElementById(rowId);
	if (row) row.remove();
}

function showEditModal(roleOptions, onSave) {
	const existing = document.getElementById('editRoleModal');
	if (existing) existing.remove();

	document.body.insertAdjacentHTML('beforeend', `
        <div class="modal fade" id="editRoleModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">권한 수정</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <label class="form-label fw-bold">권한 <span class="text-danger">*</span></label>
                        <select class="form-select" id="editRoleSelect">${roleOptions}</select>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                        <button type="button" class="btn btn-success" id="btnSaveRole">저장</button>
                    </div>
                </div>
            </div>
        </div>`);

	const modal = new bootstrap.Modal(document.getElementById('editRoleModal'));
	modal.show();
	document.getElementById('btnSaveRole').addEventListener('click', () => {
		const sel = document.getElementById('editRoleSelect');
		onSave(sel.value, sel.options[sel.selectedIndex].text);
		modal.hide();
		document.getElementById('editRoleModal').addEventListener('hidden.bs.modal', e => e.target.remove(), { once: true });
	});
}

// ============================================
// 폼 제출
// ============================================
function handleFormSubmit() {
	const grName = document.getElementById('grName').value.trim();
	if (!grName) { alert('그룹명을 입력해주세요.'); document.getElementById('grName').focus(); return; }
	if (grName.length < 2) { alert('그룹명은 2글자 이상이어야 합니다.'); return; }
	if (grName.length > 50) { alert('그룹명은 50자를 초과할 수 없습니다.'); return; }

	const description = document.getElementById('description').value.trim();
	if (description.length > 500) { alert('그룹 설명은 500자를 초과할 수 없습니다.'); return; }

	const groupCode = window.serverData?.groupCode;

	fetch(`/groupmgr/${groupCode}/update`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
		body: JSON.stringify({
			grName,
			description,
			groupUsers: memberChanges.map(m => ({
				grMemCode: m.grMemCode,
				userCode: m.userCode,
				action: m.action
			})),
			groupProjects: projectChanges.map(p => ({
				grProCode: p.grProCode,
				projectCode: p.projectCode,
				roleCode: p.roleCode,
				action: p.action
			}))
		})
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
		.catch(() => alert('수정 처리 중 오류가 발생했습니다.'));
}
