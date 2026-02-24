// ============================================
// groupadd.js
// ============================================

let selectedMembers = [];   // { userCode, userName, email }
let selectedProjects = [];  // { projectCode, projectName, roleCode, roleName }

document.addEventListener('DOMContentLoaded', function() {
	initializeEventListeners();
});

function initializeEventListeners() {
	document.getElementById('btnAddMember').addEventListener('click', openMemberModal);
	document.getElementById('btnAddProject').addEventListener('click', openProjectModal);
	document.getElementById('btnReset').addEventListener('click', resetForm);
	document.getElementById('btnSubmit').addEventListener('click', handleFormSubmit);
	document.getElementById('memberModalSearch').addEventListener('input', e => filterModal(e, '#memberModalList'));
	document.getElementById('projectModalSearch').addEventListener('input', e => filterModal(e, '#projectModalList'));
}

// ============================================
// 공통: 모달 검색 필터
// ============================================
function filterModal(e, selector) {
	const kw = e.target.value.toLowerCase();
	document.querySelectorAll(selector + ' tr').forEach(row => {
		row.style.display = row.textContent.toLowerCase().includes(kw) ? '' : 'none';
	});
}

// ============================================
// 구성원 모달
// ============================================
function openMemberModal() {
	const users = window.serverData?.users || [];
	const available = users.filter(u =>
		!selectedMembers.some(m => String(m.userCode) === String(u.userCode))
	);
	renderMemberModalList(available);
	setupSelectAll('selectAllMembers', '.member-checkbox');

	const modal = new bootstrap.Modal(document.getElementById('memberSelectModal'));
	modal.show();

	rebindBtn('btnAddSelectedMembers', addSelectedMembers);
}

function renderMemberModalList(users) {
	const tbody = document.getElementById('memberModalList');
	tbody.innerHTML = '';
	if (!users.length) {
		tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">추가 가능한 구성원이 없습니다.</td></tr>`;
		return;
	}
	users.forEach(u => {
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

function addSelectedMembers() {
	const checked = document.querySelectorAll('.member-checkbox:checked');
	if (!checked.length) { alert('추가할 구성원을 선택해주세요.'); return; }

	checked.forEach(cb => {
		selectedMembers.push({ userCode: cb.value, userName: cb.dataset.userName, email: cb.dataset.userEmail });
	});
	updateMemberTable();
	bootstrap.Modal.getInstance(document.getElementById('memberSelectModal')).hide();
	alert(`${checked.length}명의 구성원이 추가되었습니다.`);
}

function updateMemberTable() {
	const tbody = document.getElementById('memberTbody');
	tbody.innerHTML = '';
	if (!selectedMembers.length) {
		tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">추가된 구성원이 없습니다.</td></tr>`;
		return;
	}
	selectedMembers.forEach((m, i) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
            <td>${m.userName}</td>
            <td>${m.email}</td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="removeMember(${i})">
                <i class="fa-solid fa-minus me-1"></i>삭제</button></td>`;
		tbody.appendChild(tr);
	});
}

function removeMember(index) {
	if (confirm('해당 구성원을 삭제하시겠습니까?')) {
		selectedMembers.splice(index, 1);
		updateMemberTable();
	}
}

// ============================================
// 프로젝트 모달
// ============================================
function openProjectModal() {
	const projects = window.serverData?.projects || [];
	const roles = window.serverData?.roles || [];
	const available = projects.filter(p =>
		!selectedProjects.some(sp => String(sp.projectCode) === String(p.projectCode))
	);
	renderProjectModalList(available);
	renderRoleList('projectRoleList', roles, 'proj-role-radio');
	setupSelectAll('selectAllProjects', '.project-checkbox');

	const modal = new bootstrap.Modal(document.getElementById('projectSelectModal'));
	modal.show();
	rebindBtn('btnAddSelectedProjects', addSelectedProjects);
}

function renderProjectModalList(projects) {
	const tbody = document.getElementById('projectModalList');
	tbody.innerHTML = '';
	if (!projects.length) {
		tbody.innerHTML = `<tr><td colspan="2" class="text-center text-muted py-3">추가 가능한 프로젝트가 없습니다.</td></tr>`;
		return;
	}
	projects.forEach(p => {
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

function addSelectedProjects() {
	const checkedProjs = document.querySelectorAll('.project-checkbox:checked');
	const checkedRole = document.querySelector('.proj-role-radio:checked');
	if (!checkedProjs.length) { alert('추가할 프로젝트를 선택해주세요.'); return; }
	if (!checkedRole) { alert('역할을 선택해주세요.'); return; }

	const roles = window.serverData?.roles || [];
	const roleObj = roles.find(r => String(r.roleCode) === checkedRole.value);

	checkedProjs.forEach(cb => {
		selectedProjects.push({
			projectCode: cb.value,
			projectName: cb.dataset.projectName,
			roleCode: checkedRole.value,
			roleName: roleObj ? roleObj.roleName : ''
		});
	});
	updateProjectTable();
	bootstrap.Modal.getInstance(document.getElementById('projectSelectModal')).hide();
	alert(`${checkedProjs.length}개의 프로젝트가 추가되었습니다.`);
}

function updateProjectTable() {
	const tbody = document.getElementById('projectTbody');
	tbody.innerHTML = '';
	if (!selectedProjects.length) {
		tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">추가된 프로젝트가 없습니다.</td></tr>`;
		return;
	}
	selectedProjects.forEach((p, i) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
            <td>${p.projectName}</td>
            <td>${p.roleName}</td>
            <td><button type="button" class="btn btn-success btn-sm" onclick="openEditModal(${i})">
               <i class="fas fa-edit me-1"></i> 수정</button></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="removeProject(${i})">
                <i class="fa-solid fa-minus me-1"></i>삭제</button></td>`;
		tbody.appendChild(tr);
	});
}

function removeProject(index) {
	if (confirm('해당 프로젝트를 삭제하시겠습니까?')) {
		selectedProjects.splice(index, 1);
		updateProjectTable();
	}
}

function openEditModal(index) {
	const proj = selectedProjects[index];
	const roles = window.serverData?.roles || [];
	const options = roles.map(r =>
		`<option value="${r.roleCode}" ${String(r.roleCode) === String(proj.roleCode) ? 'selected' : ''}>${r.roleName}</option>`
	).join('');

	showEditModal(options, (roleCode, roleName) => {
		selectedProjects[index].roleCode = roleCode;
		selectedProjects[index].roleName = roleName;
		updateProjectTable();
	});
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
// 폼 초기화 / 제출
// ============================================
function resetForm() {
	if (confirm('입력한 내용을 모두 초기화하시겠습니까?')) {
		document.querySelector('[name="grName"]').value = '';
		document.getElementById('editor').value = '';
		selectedMembers = [];
		selectedProjects = [];
		updateMemberTable();
		updateProjectTable();
	}
}

function handleFormSubmit() {
	const grName = document.querySelector('[name="grName"]').value.trim();
	if (!grName) { alert('그룹명을 입력해주세요.'); document.querySelector('[name="grName"]').focus(); return; }
	if (grName.length < 2) { alert('그룹명은 2글자 이상이어야 합니다.'); return; }
	if (grName.length > 50) { alert('그룹명은 50자를 초과할 수 없습니다.'); return; }

	const description = document.getElementById('editor').value.trim();
	if (description.length > 500) { alert('그룹 설명은 500자를 초과할 수 없습니다.'); return; }

	const formData = {
		grName,
		description,
		groupUsers: selectedMembers.map(m => ({ userCode: parseInt(m.userCode) })),
		groupProjects: selectedProjects.map(p => ({
			projectCode: parseInt(p.projectCode),
			roleCode: parseInt(p.roleCode)
		}))
	};

	fetch('/groupmgrsadd', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
		body: JSON.stringify(formData)
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
			if (data.success) { alert(data.message); window.location.href = '/groupmgrs'; }
			else { alert(data.message); }
		})
		.catch(() => alert('그룹 등록 중 오류가 발생했습니다.'));
}
