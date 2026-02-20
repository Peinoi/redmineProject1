// ============================================
// projectinfo.js (프로젝트 상세/수정)
// ============================================

// CKEditor 인스턴스
let editorInstance;

// 서버 데이터
const users = window.serverData?.users || [];
const roles = window.serverData?.roles || [];
const groups = window.serverData?.groups || [];

// 변경 추적
const changes = {
	members: [], // { action: "add|delete|keep", mappCode, userCode, roleCode }
	groups: [],  // { action: "add|delete|keep", grProCode, grCode, roleCode }
};

// ============================================
// 1. 페이지 로드 시 초기화
// ============================================
document.addEventListener('DOMContentLoaded', function() {
	initializeCKEditor();
	initializeEventListeners();
	initializeTabNavigation();
	initializeChanges();

	// 상태 라디오 버튼 비활성화
	disableStatusRadios();

	// 종료 상태 체크 및 수정 불가 처리
	checkProjectStatus();

	// 기존 테이블 버튼에 이벤트 등록
	attachMemberTableEvents();
});

// ============================================
// 2. CKEditor 초기화
// ============================================
function initializeCKEditor() {
	const checkEditor = setInterval(() => {
		if (window.ckEditor) {
			editorInstance = window.ckEditor;

			// 글자 수 제한 (1000자)
			editorInstance.model.document.on('change:data', () => {
				const data = editorInstance.getData();
				const textOnly = data.replace(/<[^>]*>/g, '');

				if (textOnly.length > 1000) {
					alert('프로젝트 설명은 1000자를 초과할 수 없습니다.');
					editorInstance.execute('undo');
				}
			});

			clearInterval(checkEditor);
		}
	}, 100);

	setTimeout(() => {
		clearInterval(checkEditor);
		if (!editorInstance) {
			console.error('CKEditor 초기화 시간 초과');
		}
	}, 5000);
}

// ============================================
// 3. 이벤트 리스너 초기화
// ============================================
function initializeEventListeners() {
	const projectNameInput = document.getElementById('projectName');
	if (projectNameInput) {
		projectNameInput.addEventListener('input', validateProjectName);
	}

	const addMemberBtn = document.getElementById('btnAddMember');
	if (addMemberBtn) {
		addMemberBtn.addEventListener('click', openMemberModal);
	}

	const saveBtn = document.getElementById('btnSave');
	if (saveBtn) {
		saveBtn.addEventListener('click', handleFormSubmit);
	}

	const searchInput = document.getElementById('creatorModalSearch');
	if (searchInput) {
		searchInput.addEventListener('input', handleModalSearch);
	}

	const searchInputGroup = document.getElementById('groupModalSearch');
	if (searchInputGroup) {
		searchInputGroup.addEventListener('input', handleModalSearchGroup);
	}
}

// ============================================
// 4. 상태 라디오 버튼 비활성화
// ============================================
function disableStatusRadios() {
	const statusRadios = document.querySelectorAll('input[name="statusRadio"]');
	statusRadios.forEach(radio => {
		radio.disabled = true;
	});
}

// ============================================
// 4-2. 프로젝트 종료 상태 체크 및 수정 불가 처리
// ============================================
function checkProjectStatus() {
	const statusOD3 = document.getElementById('statusOD3');

	// 종료 상태(OD3)인 경우
	if (statusOD3 && statusOD3.checked) {
		// 프로젝트명 입력 비활성화
		const projectNameInput = document.getElementById('projectName');
		if (projectNameInput) {
			projectNameInput.disabled = true;
		}

		// 에디터 비활성화 (CKEditor가 로드된 후에 실행되도록 대기)
		const waitForEditor = setInterval(() => {
			if (editorInstance) {
				editorInstance.enableReadOnlyMode('readonly-mode');
				clearInterval(waitForEditor);
			}
		}, 100);

		// 구성원 추가 버튼 비활성화
		const btnAddMember = document.getElementById('btnAddMember');
		if (btnAddMember) {
			btnAddMember.disabled = true;
			btnAddMember.classList.add('disabled');
		}

		// 저장 버튼 비활성화
		const btnSave = document.getElementById('btnSave');
		if (btnSave) {
			btnSave.disabled = true;
			btnSave.classList.add('disabled');
		}

		// 모든 수정/삭제 버튼 비활성화
		document.querySelectorAll('.btn-edit-role, .btn-delete-member').forEach(btn => {
			btn.disabled = true;
			btn.classList.add('disabled');
		});

		// 안내 메시지 표시
		const container = document.getElementById('container');
		if (container) {
			const alertDiv = document.createElement('div');
			alertDiv.className = 'alert alert-warning alert-dismissible fade show mt-3';
			alertDiv.innerHTML = `
				<i class="fas fa-info-circle me-2"></i>
				<strong>종료된 프로젝트입니다.</strong> 수정이 불가능합니다.
				<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
			`;
			const pageTitle = container.querySelector('.x-page-title');
			if (pageTitle) {
				pageTitle.after(alertDiv);
			}
		}
	}
}

// ============================================
// 5. 기존 데이터를 changes에 초기화
// ============================================
function initializeChanges() {
	const tbody = document.getElementById('projectTbody');
	const rows = tbody.querySelectorAll('tr');

	rows.forEach((tr) => {
		const type = tr.dataset.type;
		if (type === "member") {
			changes.members.push({
				action: "keep",
				mappCode: parseInt(tr.dataset.mappCode),
				userCode: parseInt(tr.dataset.userCode),
				roleCode: parseInt(tr.dataset.roleCode),
			});
		} else if (type === "group") {
			changes.groups.push({
				action: "keep",
				grProCode: parseInt(tr.dataset.grProCode),
				grCode: parseInt(tr.dataset.grCode),
				roleCode: parseInt(tr.dataset.roleCode),
			});
		}
	});
}

// ============================================
// 6. 프로젝트명 유효성 검사
// ============================================
function validateProjectName(event) {
	const input = event.target;
	const regExp = /[^\wㄱ-ㅎ가-힣]/g;
	const filtered = value.replace(regExp, '');

	if (value !== filtered) {
		input.value = filtered;
		showValidationMessage(input, '특수문자는 사용할 수 없습니다.');
		return false;
	}

	if (filtered.length > 0 && filtered.length < 5) {
		showValidationMessage(input, '프로젝트명은 5글자 이상이어야 합니다.');
		return false;
	}

	if (filtered.length > 50) {
		input.value = filtered.substring(0, 50);
		showValidationMessage(input, '프로젝트명은 50자를 초과할 수 없습니다.');
		return false;
	}

	hideValidationMessage(input);
	return true;
}

// ============================================
// 7. 유효성 검사 메시지 표시/숨김
// ============================================
function showValidationMessage(input, message) {
	hideValidationMessage(input);
	const errorDiv = document.createElement('div');
	errorDiv.className = 'invalid-feedback d-block';
	errorDiv.textContent = message;
	input.classList.add('is-invalid');
	input.parentElement.appendChild(errorDiv);
}

function hideValidationMessage(input) {
	input.classList.remove('is-invalid');
	const errorDiv = input.parentElement.querySelector('.invalid-feedback');
	if (errorDiv) {
		errorDiv.remove();
	}
}

// ============================================
// 8. 구성원 추가 모달 열기
// ============================================
function openMemberModal() {
	// 이미 추가된 사용자 제외 (삭제되지 않은 것만)
	const existingUserCodes = changes.members
		.filter(m => m.action !== "delete")
		.map(m => m.userCode);

	const availableUsers = users.filter(user =>
		!existingUserCodes.includes(user.userCode)
	);

	// 이미 추가된 그룹 제외 (삭제되지 않은 것만)
	const existingGroupCodes = changes.groups
		.filter(g => g.action !== "delete")
		.map(g => g.grCode);

	const availableGroups = groups.filter(group =>
		!existingGroupCodes.includes(group.groupCode)
	);

	displayUserList(availableUsers, roles);
	displayGroupList(availableGroups, roles);

	// 추가 버튼 이벤트 설정
	setupAddMembersButton();

	const modal = new bootstrap.Modal(document.getElementById('creatorSelectModal'));
	modal.show();
}

// ============================================
// 9. 모달에 사용자 목록 표시
// ============================================
function displayUserList(users, roles) {
	const memberListContainer = document.getElementById('memberSelectList');
	memberListContainer.innerHTML = '';

	if (users.length === 0) {
		memberListContainer.innerHTML = `
			<tr>
				<td colspan="2" class="text-center text-muted py-3">
					추가 가능한 구성원이 없습니다.
				</td>
			</tr>
		`;
		return;
	}

	users.forEach(user => {
		const row = document.createElement('tr');
		row.innerHTML = `
			<td>
				<div class="form-check">
					<input class="form-check-input member-checkbox" type="checkbox" 
						   value="${user.userCode}" 
						   id="member${user.userCode}"
						   data-user-name="${user.name}" 
						   data-user-email="${user.email || ''}">
				</div>
			</td>
			<td>
				<label class="form-check-label w-100" for="member${user.userCode}" style="cursor: pointer;">
					${user.name}${user.email ? ' (' + user.email + ')' : ''}
				</label>
			</td>
		`;
		memberListContainer.appendChild(row);
	});

	setupSelectAllMembers();
	displayRoleList(roles);
}

// ============================================
// 10. 모달에 그룹 목록 표시
// ============================================
function displayGroupList(groups, roles) {
	const groupListContainer = document.getElementById('groupSelectList');

	if (!groupListContainer) return;

	groupListContainer.innerHTML = '';

	if (!groups || groups.length === 0) {
		groupListContainer.innerHTML = `
            <tr>
                <td colspan="2" class="text-center text-muted py-3">
                    추가 가능한 그룹이 없습니다.
                </td>
            </tr>
        `;
		return;
	}

	groups.forEach(group => {
		const row = document.createElement('tr');
		row.innerHTML = `
            <td>
                <div class="form-check">
                    <input class="form-check-input group-checkbox" type="checkbox" 
                           value="${group.groupCode}" 
                           id="group${group.groupCode}"
                           data-group-name="${group.grName}">
                </div>
            </td>
            <td>
                <label class="form-check-label w-100" for="group${group.groupCode}" style="cursor: pointer;">
                    ${group.grName}
                </label>
            </td>
        `;
		groupListContainer.appendChild(row);
	});

	setupSelectAllGroup();
	displayRoleList(roles);
}

// ============================================
// 11. 전체 선택 기능 (구성원)
// ============================================
function setupSelectAllMembers() {
	const selectAllCheckbox = document.getElementById('selectAllMembers');
	if (!selectAllCheckbox) return;

	const memberCheckboxes = document.querySelectorAll('.member-checkbox');

	// 기존 이벤트 제거 후 재등록
	const newSelectAll = selectAllCheckbox.cloneNode(true);
	selectAllCheckbox.parentNode.replaceChild(newSelectAll, selectAllCheckbox);

	newSelectAll.addEventListener('change', function() {
		memberCheckboxes.forEach(checkbox => {
			checkbox.checked = this.checked;
		});
	});

	memberCheckboxes.forEach(checkbox => {
		checkbox.addEventListener('change', function() {
			const allChecked = Array.from(memberCheckboxes).every(cb => cb.checked);
			const someChecked = Array.from(memberCheckboxes).some(cb => cb.checked);

			newSelectAll.checked = allChecked;
			newSelectAll.indeterminate = someChecked && !allChecked;
		});
	});
}

// ============================================
// 12. 전체 선택 기능 (그룹)
// ============================================
function setupSelectAllGroup() {
	const selectAllCheckbox = document.getElementById('selectAllgroup');
	if (!selectAllCheckbox) return;

	const groupCheckboxes = document.querySelectorAll('.group-checkbox');

	// 기존 이벤트 제거 후 재등록
	const newSelectAll = selectAllCheckbox.cloneNode(true);
	selectAllCheckbox.parentNode.replaceChild(newSelectAll, selectAllCheckbox);

	newSelectAll.addEventListener('change', function() {
		groupCheckboxes.forEach(checkbox => {
			checkbox.checked = this.checked;
		});
	});

	groupCheckboxes.forEach(checkbox => {
		checkbox.addEventListener('change', function() {
			const allChecked = Array.from(groupCheckboxes).every(cb => cb.checked);
			const someChecked = Array.from(groupCheckboxes).some(cb => cb.checked);

			newSelectAll.checked = allChecked;
			newSelectAll.indeterminate = someChecked && !allChecked;
		});
	});
}

// ============================================
// 13. 역할 목록 표시
// ============================================
function displayRoleList(roles) {
	const roleListContainer = document.getElementById('roleSelectList');
	roleListContainer.innerHTML = '';

	roles.forEach((role, index) => {
		const roleDiv = document.createElement('div');
		roleDiv.className = 'form-check';
		roleDiv.innerHTML = `
            <input class="form-check-input role-checkbox" type="radio" 
                   name="projectRole" 
                   value="${role.roleCode}" 
                   id="role${role.roleCode}"
                   ${index === 0 ? 'checked' : ''}>
            <label class="form-check-label" for="role${role.roleCode}">
                ${role.roleName}
            </label>
        `;
		roleListContainer.appendChild(roleDiv);
	});
}

// ============================================
// 14. 추가 버튼 이벤트 설정
// ============================================
function setupAddMembersButton() {
	const addButton = document.getElementById('btnAddSelectedMembers');
	if (!addButton) return;

	const newButton = addButton.cloneNode(true);
	addButton.parentNode.replaceChild(newButton, addButton);

	newButton.addEventListener('click', () => {
		const activeTab = document.querySelector('.tabnav .nav-link.active');
		const isGroupTab = activeTab && activeTab.getAttribute('href') === '#group';

		if (isGroupTab) {
			addSelectedGroups(roles);
		} else {
			addSelectedMembers(roles);
		}
	});
}

// ============================================
// 15. 선택한 구성원 추가
// ============================================
function addSelectedMembers(roles) {
	const checkedMembers = document.querySelectorAll('.member-checkbox:checked');
	const checkedRoles = document.querySelectorAll('.role-checkbox:checked');

	if (checkedMembers.length === 0) {
		alert('추가할 구성원을 선택해주세요.');
		return;
	}

	if (checkedRoles.length === 0) {
		alert('최소 1개 이상의 역할을 선택해주세요.');
		return;
	}

	checkedMembers.forEach(memberCheckbox => {
		checkedRoles.forEach(roleCheckbox => {
			const userCode = parseInt(memberCheckbox.value);
			const userName = memberCheckbox.dataset.userName;
			const userEmail = memberCheckbox.dataset.userEmail;
			const roleCode = parseInt(roleCheckbox.value);

			const roleObj = roles.find(r => r.roleCode == roleCode);
			const roleName = roleObj ? roleObj.roleName : '';

			// changes에 추가
			changes.members.push({
				action: "add",
				mappCode: null,
				userCode: userCode,
				roleCode: roleCode,
			});

			// 테이블에 추가
			const displayName = userEmail ? `${userName} (${userEmail})` : userName;
			addMemberRow(null, userCode, displayName, roleCode, roleName);
		});
	});

	const modal = bootstrap.Modal.getInstance(document.getElementById('creatorSelectModal'));
	modal.hide();

	alert(`${checkedMembers.length}명의 구성원이 추가되었습니다.`);
}

// ============================================
// 16. 선택한 그룹 추가
// ============================================
function addSelectedGroups(roles) {
	const checkedGroups = document.querySelectorAll('.group-checkbox:checked');
	const checkedRoles = document.querySelectorAll('.role-checkbox:checked');

	if (checkedGroups.length === 0) {
		alert('추가할 그룹을 선택해주세요.');
		return;
	}

	if (checkedRoles.length === 0) {
		alert('최소 1개 이상의 역할을 선택해주세요.');
		return;
	}

	checkedGroups.forEach(groupCheckbox => {
		checkedRoles.forEach(roleCheckbox => {
			const grCode = parseInt(groupCheckbox.value);
			const groupName = groupCheckbox.dataset.groupName;
			const roleCode = parseInt(roleCheckbox.value);

			const roleObj = roles.find(r => r.roleCode == roleCode);
			const roleName = roleObj ? roleObj.roleName : '';

			// changes에 추가
			changes.groups.push({
				action: "add",
				grProCode: null,
				grCode: grCode,
				roleCode: roleCode,
			});

			// 테이블에 추가
			addGroupRow(null, grCode, groupName, roleCode, roleName);
		});
	});

	const modal = bootstrap.Modal.getInstance(document.getElementById('creatorSelectModal'));
	modal.hide();

	alert(`${checkedGroups.length}개의 그룹이 추가되었습니다.`);
}

// ============================================
// 17. 테이블에 구성원 행 추가
// ============================================
function addMemberRow(mappCode, userCode, userName, roleCode, roleName) {
	const tbody = document.getElementById('projectTbody');
	const row = document.createElement('tr');

	row.dataset.type = "member";
	row.dataset.mappCode = mappCode || "";
	row.dataset.userCode = userCode;
	row.dataset.roleCode = roleCode;

	row.innerHTML = `
		<td>👤 ${userName}</td>
		<td>${roleName}</td>
		<td>
			<button type="button" class="btn btn-success btn-sm btn-edit-role">
				<i class="fa-regular fa-face-meh"></i> 수정
			</button>
		</td>
		<td>
			<button type="button" class="btn btn-danger btn-sm btn-delete-member">
				<i class="fa-solid fa-face-dizzy"></i> 삭제
			</button>
		</td>
	`;

	tbody.appendChild(row);
	attachMemberTableEvents();
}

// ============================================
// 18. 테이블에 그룹 행 추가
// ============================================
function addGroupRow(grProCode, grCode, grName, roleCode, roleName) {
	const tbody = document.getElementById('projectTbody');
	const row = document.createElement('tr');

	row.dataset.type = "group";
	row.dataset.grProCode = grProCode || "";
	row.dataset.grCode = grCode;
	row.dataset.roleCode = roleCode;

	row.innerHTML = `
		<td>👥 ${grName}</td>
		<td>${roleName}</td>
		<td>
			<button type="button" class="btn btn-success btn-sm btn-edit-role">
				<i class="fa-regular fa-face-meh"></i> 수정
			</button>
		</td>
		<td>
			<button type="button" class="btn btn-danger btn-sm btn-delete-member">
				<i class="fa-solid fa-face-dizzy"></i> 삭제
			</button>
		</td>
	`;

	tbody.appendChild(row);
	attachMemberTableEvents();
}

// ============================================
// 19. 테이블 버튼 이벤트 리스너 등록 ⭐ 수정됨
// ============================================
function attachMemberTableEvents() {
	// 수정 버튼 - HTML의 btn-edit-role 클래스 사용
	document.querySelectorAll('.btn-edit-role').forEach(btn => {
		btn.addEventListener('click', function(e) {
			e.stopPropagation();
			const row = this.closest('tr');
			const type = row.dataset.type;
			openEditModal(row, type);
		});
	});

	// 삭제 버튼
	document.querySelectorAll('.btn-delete-member').forEach(btn => {
		btn.addEventListener('click', function(e) {
			e.stopPropagation();
			const row = this.closest('tr');
			const type = row.dataset.type;
			removeMember(row, type);
		});
	});
}

// ============================================
// 20. 구성원 수정 모달 열기
// ============================================
function openEditModal(row, type) {
	const currentRoleCode = parseInt(row.dataset.roleCode);
	const currentName = row.querySelector('td:first-child').textContent;

	const roleOptions = roles.map(role => {
		const isSelected = (currentRoleCode == role.roleCode) ? 'selected' : '';
		return `<option value="${role.roleCode}" ${isSelected}>${role.roleName}</option>`;
	}).join('');

	const modalHtml = `
        <div class="modal fade" id="editMemberModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${type === 'group' ? '그룹' : '구성원'} 권한 수정</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold">${type === 'group' ? '그룹명' : '구성원'}</label>
                            <input type="text" class="form-control" value="${currentName}" readonly>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">권한 <span class="text-danger">*</span></label>
                            <select class="form-select" id="editRoleSelect">
                                ${roleOptions}
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                        <button type="button" class="btn btn-success" id="btnSaveRoleChange">
							<i class="fas fa-check me-1"></i>저장
						</button>
                    </div>
                </div>
            </div>
        </div>
    `;

	const existingModal = document.getElementById('editMemberModal');
	if (existingModal) existingModal.remove();

	document.body.insertAdjacentHTML('beforeend', modalHtml);
	const modal = new bootstrap.Modal(document.getElementById('editMemberModal'));

	// 저장 버튼 이벤트
	document.getElementById('btnSaveRoleChange').addEventListener('click', function() {
		saveRoleChange(row, type, modal);
	});

	modal.show();
}

// ============================================
// 21. 구성원 권한 변경 저장
// ============================================
function saveRoleChange(row, type, modal) {
	const roleSelect = document.getElementById('editRoleSelect');
	const newRoleCode = parseInt(roleSelect.value);
	const newRoleName = roleSelect.options[roleSelect.selectedIndex].text;

	// 화면 업데이트
	row.dataset.roleCode = newRoleCode;
	row.querySelector('td:nth-child(2)').textContent = newRoleName;

	// changes 업데이트
	if (type === "member") {
		const userCode = parseInt(row.dataset.userCode);
		const mappCode = row.dataset.mappCode ? parseInt(row.dataset.mappCode) : null;

		const item = changes.members.find(
			m => m.userCode === userCode && (mappCode ? m.mappCode === mappCode : m.action === "add")
		);

		if (item) {
			item.roleCode = newRoleCode;
		}
	} else if (type === "group") {
		const grCode = parseInt(row.dataset.grCode);
		const grProCode = row.dataset.grProCode ? parseInt(row.dataset.grProCode) : null;

		const item = changes.groups.find(
			g => g.grCode === grCode && (grProCode ? g.grProCode === grProCode : g.action === "add")
		);

		if (item) {
			item.roleCode = newRoleCode;
		}
	}

	modal.hide();

	const modalElement = document.getElementById('editMemberModal');
	modalElement.addEventListener('hidden.bs.modal', function() {
		modalElement.remove();
	}, { once: true });
}

// ============================================
// 22. 구성원 삭제
// ============================================
function removeMember(row, type) {
	const name = row.querySelector('td:first-child').textContent;

	if (!confirm(`${name}을(를) 삭제하시겠습니까?`)) {
		return;
	}

	if (type === "member") {
		const mappCode = row.dataset.mappCode ? parseInt(row.dataset.mappCode) : null;
		const userCode = parseInt(row.dataset.userCode);

		const item = changes.members.find(
			m => m.userCode === userCode && (mappCode ? m.mappCode === mappCode : m.action === "add")
		);

		if (item) {
			if (item.action === "add") {
				changes.members = changes.members.filter(m => m !== item);
			} else {
				item.action = "delete";
			}
		}
	} else if (type === "group") {
		const grProCode = row.dataset.grProCode ? parseInt(row.dataset.grProCode) : null;
		const grCode = parseInt(row.dataset.grCode);

		const item = changes.groups.find(
			g => g.grCode === grCode && (grProCode ? g.grProCode === grProCode : g.action === "add")
		);

		if (item) {
			if (item.action === "add") {
				changes.groups = changes.groups.filter(g => g !== item);
			} else {
				item.action = "delete";
			}
		}
	}

	row.remove();
}

// ============================================
// 23. 폼 제출 처리
// ============================================
function handleFormSubmit(event) {
	if (event) event.preventDefault();

	const projectCodeInput = document.getElementById('projectCode');
	const projectNameInput = document.getElementById('projectName');
	const projectName = projectNameInput.value.trim();

	if (projectName === '') {
		alert('프로젝트명을 입력해주세요.');
		projectNameInput.focus();
		return false;
	}

	if (projectName.length < 5) {
		alert('프로젝트명은 5글자 이상이어야 합니다.');
		projectNameInput.focus();
		return false;
	}

	if (projectName.length > 50) {
		alert('프로젝트명은 50자를 초과할 수 없습니다.');
		projectNameInput.focus();
		return false;
	}

	if (!/^[\w가-힣ㄱ-ㅎ\s]+$/.test(projectName)) {
		alert('프로젝트명에는 특수문자를 사용할 수 없습니다.');
		projectNameInput.focus();
		return false;
	}

	if (!editorInstance) {
		alert('에디터가 초기화되지 않았습니다. 페이지를 새로고침해주세요.');
		return false;
	}

	const description = editorInstance.getData();
	const descriptionText = description.replace(/<[^>]*>/g, '').trim();

	if (descriptionText.length === 0) {
		alert('프로젝트 설명을 입력해주세요.');
		return false;
	}

	if (descriptionText.length > 1000) {
		alert('프로젝트 설명은 1000자를 초과할 수 없습니다.');
		return false;
	}

	const formData = {
		projectCode: parseInt(projectCodeInput.value),
		projectName: projectName,
		description: description,
		status: document.querySelector('input[name="statusRadio"]:checked')?.value || "OD1",
		members: changes.members,
		groups: changes.groups,
	};

	submitProject(formData);
}

// ============================================
// 24. 프로젝트 수정 서버 요청
// ============================================
function submitProject(formData) {
	fetch(`/project/${formData.projectCode}/update`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Requested-With': 'XMLHttpRequest'
		},
		body: JSON.stringify(formData)
	})
		.then(async response => {
			console.log('수정 권한 상태 : ' + response.status)
			// 1. 상태 코드 체크
			if (response.redirected && response.url.includes('/accessDenied')) {
				alert('수정 권한이 없습니다.');
				return null;
			}

			if (response.status === 401 || response.redirected) {
				alert('로그인이 필요합니다.');
				window.location.href = '/login';
				return null;
			}

			// 2. Content-Type 체크
			const contentType = response.headers.get("content-type");
			if (!contentType || !contentType.includes("application/json")) {
				alert('서버 오류가 발생했습니다.');
				return null;
			}

			// 3. JSON 파싱
			return response.json();
		})
		.then(data => {
			if (!data) return; // null이면 종료

			if (data.success) {
				alert(data.message);
				window.location.href = '/projects';
			} else {
				alert(data.message);
			}
		})
		.catch(error => {
			console.error('프로젝트 수정 오류:', error);
			alert('프로젝트 수정 중 오류가 발생했습니다.');
		});
}

// ============================================
// 25. 모달 검색 기능
// ============================================
function handleModalSearch(event) {
	const searchTerm = event.target.value.toLowerCase();
	const tableRows = document.querySelectorAll('#memberSelectList tr');

	tableRows.forEach(row => {
		const text = row.textContent.toLowerCase();
		if (text.includes(searchTerm)) {
			row.style.display = '';
		} else {
			row.style.display = 'none';
		}
	});

	updateSelectAllState('selectAllMembers', '.member-checkbox');
}

// ============================================
// 26. 모달 검색 기능 (그룹)
// ============================================
function handleModalSearchGroup(event) {
	const searchTerm = event.target.value.toLowerCase();
	const tableRows = document.querySelectorAll('#groupSelectList tr');

	tableRows.forEach(row => {
		const text = row.textContent.toLowerCase();
		if (text.includes(searchTerm)) {
			row.style.display = '';
		} else {
			row.style.display = 'none';
		}
	});

	updateSelectAllState('selectAllgroup', '.group-checkbox');
}

// ============================================
// 27. 전체 선택 상태 업데이트
// ============================================
function updateSelectAllState(checkboxId, itemSelector) {
	const selectAllCheckbox = document.getElementById(checkboxId);
	if (!selectAllCheckbox) return;

	const visibleCheckboxes = Array.from(document.querySelectorAll(itemSelector))
		.filter(cb => cb.closest('tr').style.display !== 'none');

	if (visibleCheckboxes.length > 0) {
		const allChecked = visibleCheckboxes.every(cb => cb.checked);
		const someChecked = visibleCheckboxes.some(cb => cb.checked);

		selectAllCheckbox.checked = allChecked;
		selectAllCheckbox.indeterminate = someChecked && !allChecked;
	}
}

// ============================================
// 28. 탭 기능 (구성원/그룹)
// ============================================
function initializeTabNavigation() {
	const tabLinks = document.querySelectorAll('.tabnav a');
	const tabContents = document.querySelectorAll('.tabcontent > div');

	if (tabLinks.length > 0) {
		tabLinks[0].classList.add('active');
	}
	if (tabContents.length > 0) {
		tabContents[0].style.display = 'block';
	}

	tabLinks.forEach(link => {
		link.addEventListener('click', function(e) {
			e.preventDefault();

			tabContents.forEach(content => {
				content.style.display = 'none';
			});

			tabLinks.forEach(l => {
				l.classList.remove('active');
			});

			this.classList.add('active');
			const targetId = this.getAttribute('href').substring(1);
			const targetElement = document.getElementById(targetId);
			if (targetElement) {
				targetElement.style.display = 'block';
			}

			// 탭 전환 시 추가 버튼 이벤트 재설정
			setupAddMembersButton();
		});
	});
}