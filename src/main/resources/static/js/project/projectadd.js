// ============================================
// projectadd.js
// ============================================

// CKEditor 인스턴스
let editorInstance;

// 선택된 사용자/그룹 목록 (구성원 테이블에 추가된 항목들)
let selectedUsers = [];
let selectedGroups = [];

// ============================================
// 1. 페이지 로드 시 초기화
// ============================================
document.addEventListener('DOMContentLoaded', function() {
	initializeCKEditor();
	initializeEventListeners();
	initializeTabNavigation();
});

// ============================================
// 2. CKEditor 초기화
// ============================================
function initializeCKEditor() {
	const checkEditor = setInterval(() => {
		if (window.ckEditor) {
			editorInstance = window.ckEditor;
			// --------------------------------------------
			// 기본 양식 설정
			// --------------------------------------------
			const defaultTemplate = `
			                <p><strong>프로젝트 기간 :</strong> </p>
			                <p><strong>사용 DB :</strong> </p>
			                <p><strong>기술 스택 :</strong> </p>
			                <p><strong>상세 내용 :</strong> </p>
							<p><strong>기타 사항 :</strong> </p>
			                <hr>
			            `;

			// 에디터에 내용이 비어있을 때만 양식을 넣습니다.
			if (!editorInstance.getData()) {
				editorInstance.setData(defaultTemplate);
			}
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
	const projectNameInput = document.querySelector('[name="projectName"]');
	projectNameInput.addEventListener('input', validateProjectName);

	const addMemberBtn = document.querySelector('#btnAddMember');
	if (addMemberBtn) {
		addMemberBtn.addEventListener('click', openMemberModal);
	}

	const resetBtn = document.querySelector('#btnReset');
	if (resetBtn) {
		resetBtn.addEventListener('click', resetForm);
	}

	const submitBtn = document.querySelector('#btnSubmit');
	if (submitBtn) {
		submitBtn.addEventListener('click', handleFormSubmit);
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
// 4. 프로젝트명 유효성 검사
// ============================================
function validateProjectName(event) {
	const input = event.target;
	const value = input.value;
	const filtered = value.replace(/[^\w\sㄱ-ㅎ가-힣]/g, '').replace(/\s/g, '');

	if (value !== filtered) {
		input.value = filtered;
		showValidationMessage(input, '특수문자와 공백은 사용할 수 없습니다.');
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
// 5. 유효성 검사 메시지 표시/숨김
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
// 6. 구성원 추가 모달 열기
// ============================================
function openMemberModal() {
	const users = window.serverData?.users || [];
	const roles = window.serverData?.roles || [];
	const groups = window.serverData?.groups || [];

	const currentUserName = document.getElementById('filterWriter').value;

	// 이미 추가된 사용자 제외 (userCode 비교 수정)
	const availableUsers = users.filter(user => {
		// 현재 로그인한 사용자 제외
		if (user.name === currentUserName) {
			return false;
		}
		// 이미 추가된 사용자 제외 (String 비교로 수정)
		return !selectedUsers.some(selected =>
			String(selected.userCode) === String(user.userCode)
		);
	});

	// 이미 추가된 그룹 제외 (groupCode 비교 수정)
	const availableGroups = groups.filter(group =>
		!selectedGroups.some(selected =>
			String(selected.groupCode) === String(group.groupCode)
		)
	);

	displayUserList(availableUsers, roles);
	displayGroupList(availableGroups, roles);

	// 추가 버튼 이벤트 설정 (한 번만 호출)
	setupAddMembersButton();

	const modal = new bootstrap.Modal(document.getElementById('creatorSelectModal'));
	modal.show();
}
// ============================================
// 7. 모달에 사용자 목록 표시
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
	// 역할 목록과 추가 버튼은 displayGroupList에서도 호출되므로 여기서는 제거
	// setupAddMembersButton은 탭 전환 시마다 재설정됩니다
}

// ============================================
// 7-2. 모달에 그룹 목록 표시
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
	// 역할 목록과 추가 버튼은 displayUserList에서도 호출되므로 중복 방지
}

// ============================================
// 7-1. 전체 선택 기능 (구성원)
// ============================================
function setupSelectAllMembers() {
	const selectAllCheckbox = document.getElementById('selectAllMembers');
	const memberCheckboxes = document.querySelectorAll('.member-checkbox');

	selectAllCheckbox.addEventListener('change', function() {
		memberCheckboxes.forEach(checkbox => {
			checkbox.checked = this.checked;
		});
	});

	memberCheckboxes.forEach(checkbox => {
		checkbox.addEventListener('change', function() {
			const allChecked = Array.from(memberCheckboxes).every(cb => cb.checked);
			const someChecked = Array.from(memberCheckboxes).some(cb => cb.checked);

			selectAllCheckbox.checked = allChecked;
			selectAllCheckbox.indeterminate = someChecked && !allChecked;
		});
	});
}

// ============================================
// 7-1-2. 전체 선택 기능 (그룹)
// ============================================
function setupSelectAllGroup() {
	const selectAllCheckbox = document.getElementById('selectAllgroup');
	const groupCheckboxes = document.querySelectorAll('.group-checkbox');

	selectAllCheckbox.addEventListener('change', function() {
		groupCheckboxes.forEach(checkbox => {
			checkbox.checked = this.checked;
		});
	});

	groupCheckboxes.forEach(checkbox => {
		checkbox.addEventListener('change', function() {
			const allChecked = Array.from(groupCheckboxes).every(cb => cb.checked);
			const someChecked = Array.from(groupCheckboxes).some(cb => cb.checked);

			selectAllCheckbox.checked = allChecked;
			selectAllCheckbox.indeterminate = someChecked && !allChecked;
		});
	});
}

// ============================================
// 7-2. 역할 목록 표시
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
// 7-3. 추가 버튼 이벤트 설정
// ============================================
function setupAddMembersButton() {
	const addButton = document.getElementById('btnAddSelectedMembers');
	if (!addButton) return;

	const newButton = addButton.cloneNode(true);
	addButton.parentNode.replaceChild(newButton, addButton);

	// 탭에 따라 활성
	newButton.addEventListener('click', () => {
		const roles = window.serverData?.roles || [];
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
// 8. 선택한 구성원 추가
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

	const newUsers = [];

	checkedMembers.forEach(memberCheckbox => {
		checkedRoles.forEach(roleCheckbox => {
			const userCode = memberCheckbox.value;
			const userName = memberCheckbox.dataset.userName;
			const userEmail = memberCheckbox.dataset.userEmail;
			const roleCode = roleCheckbox.value;

			const roleObj = roles.find(r => r.roleCode == roleCode);
			const roleName = roleObj ? roleObj.roleName : '';

			newUsers.push({
				type: 'user',
				userCode: userCode,
				name: userEmail ? `${userName} (${userEmail})` : userName,
				roleCode: roleCode,
				roleName: roleName
			});
		});
	});

	if (newUsers.length > 0) {
		selectedUsers.push(...newUsers);
		updateMemberTable();

		const modal = bootstrap.Modal.getInstance(document.getElementById('creatorSelectModal'));
		modal.hide();

		alert(`${checkedMembers.length}명의 구성원이 추가되었습니다.`);
	}
}

// ============================================
// 8-2. 선택한 그룹 추가 
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

	const newGroups = [];

	checkedGroups.forEach(groupCheckbox => {
		checkedRoles.forEach(roleCheckbox => {
			const groupCode = groupCheckbox.value;
			const groupName = groupCheckbox.dataset.groupName;
			const roleCode = roleCheckbox.value;

			const roleObj = roles.find(r => r.roleCode == roleCode);
			const roleName = roleObj ? roleObj.roleName : '';

			newGroups.push({
				type: 'group',
				groupCode: groupCode,
				name: groupName,
				roleCode: roleCode,
				roleName: roleName
			});
		});
	});

	if (newGroups.length > 0) {
		selectedGroups.push(...newGroups);
		updateMemberTable();

		const modal = bootstrap.Modal.getInstance(document.getElementById('creatorSelectModal'));
		modal.hide();

		alert(`${checkedGroups.length}개의 그룹이 추가되었습니다.`);
	}
}

// ============================================
// 9. 구성원 테이블 업데이트 
// ============================================
function updateMemberTable() {
	const tbody = document.getElementById('projectTbody');
	tbody.innerHTML = '';

	// 구성원과 그룹 모두 표시
	const allItems = [...selectedUsers, ...selectedGroups];

	if (allItems.length === 0) {
		tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">추가된 구성원이 없습니다.</td></tr>';
		return;
	}

	allItems.forEach((item, globalIndex) => {
		const row = document.createElement('tr');
		row.className = 'projectRow';

		// 타입 확인 및 실제 인덱스 계산
		const isGroup = item.type === 'group';
		const actualIndex = isGroup
			? selectedGroups.indexOf(item)
			: selectedUsers.indexOf(item);
		const type = isGroup ? 'group' : 'user';
		const icon = isGroup ? '👥' : '👤';

		row.innerHTML = `
            <td>${icon} ${item.name}</td>
            <td>${item.roleName}</td>
            <td>
                <button class="btn btn-success btn-sm btn-edit-member" data-index="${actualIndex}" data-type="${type}"><i class="fa-regular fa-face-meh"></i> 수정</button>
            </td>
            <td>
                <button class="btn btn-danger btn-sm btn-remove-member" data-index="${actualIndex}" data-type="${type}"><i class="fa-solid fa-face-dizzy"></i> 삭제</button>
            </td>
        `;
		tbody.appendChild(row);
	});

	// 이벤트 리스너 등록
	attachMemberTableEvents();
}

// ============================================
// 9-1. 테이블 버튼 이벤트 리스너 등록
// ============================================
function attachMemberTableEvents() {
	// 수정 버튼
	document.querySelectorAll('.btn-edit-member').forEach(btn => {
		btn.addEventListener('click', function() {
			const index = parseInt(this.dataset.index);
			const type = this.dataset.type;
			openEditModal(index, type);
		});
	});

	// 삭제 버튼
	document.querySelectorAll('.btn-remove-member').forEach(btn => {
		btn.addEventListener('click', function() {
			const index = parseInt(this.dataset.index);
			const type = this.dataset.type;
			removeMember(index, type);
		});
	});
}
// ============================================
// 10. 구성원 수정 모달 열기
// ============================================
function openEditModal(index, type) {
	const item = type === 'group' ? selectedGroups[index] : selectedUsers[index];
	const roles = window.serverData?.roles || [];

	const roleOptions = roles.map(role => {
		const isSelected = (item.roleCode == role.roleCode) ? 'selected' : '';
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
                            <input type="text" class="form-control" value="${item.name}" readonly>
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
                        <button type="button" class="btn btn-success" onclick="saveRoleChange(${index}, '${type}')">저장</button>
                    </div>
                </div>
            </div>
        </div>
    `;

	const existingModal = document.getElementById('editMemberModal');
	if (existingModal) existingModal.remove();

	document.body.insertAdjacentHTML('beforeend', modalHtml);
	const modal = new bootstrap.Modal(document.getElementById('editMemberModal'));
	modal.show();
}

// ============================================
// 11. 구성원 권한 변경 저장
// ============================================
function saveRoleChange(index, type) {
	const roleSelect = document.getElementById('editRoleSelect');
	const newRoleCode = roleSelect.value;
	const newRoleName = roleSelect.options[roleSelect.selectedIndex].text;

	// 타입에 따라 다른 배열 업데이트
	if (type === 'group') {
		selectedGroups[index].roleCode = newRoleCode;
		selectedGroups[index].roleName = newRoleName;
	} else {
		selectedUsers[index].roleCode = newRoleCode;
		selectedUsers[index].roleName = newRoleName;
	}

	updateMemberTable();

	const modalElement = document.getElementById('editMemberModal');
	const modal = bootstrap.Modal.getInstance(modalElement);
	modal.hide();

	modalElement.addEventListener('hidden.bs.modal', function() {
		modalElement.remove();
	}, { once: true });
}

// ============================================
// 12. 구성원 삭제
// ============================================
function removeMember(index, type) {
	if (confirm(`해당 ${type === 'group' ? '그룹을' : '구성원을'} 삭제하시겠습니까?`)) {
		// 타입에 따라 다른 배열에서 삭제
		if (type === 'group') {
			selectedGroups.splice(index, 1);
		} else {
			selectedUsers.splice(index, 1);
		}
		updateMemberTable();
	}
}

// ============================================
// 13. 폼 초기화
// ============================================
function resetForm() {
	if (confirm('입력한 내용을 모두 초기화하시겠습니까?')) {
		document.querySelector('[name="projectName"]').value = '';

		if (editorInstance) {
			editorInstance.setData('');
		}

		selectedUsers = [];
		selectedGroups = [];
		updateMemberTable();

		document.getElementById('inlineRadio1').checked = true;

		document.querySelectorAll('.is-invalid').forEach(el => {
			el.classList.remove('is-invalid');
		});
		document.querySelectorAll('.invalid-feedback').forEach(el => {
			el.remove();
		});
	}
}

// ============================================
// 14. 폼 제출 처리
// ============================================
function handleFormSubmit(event) {
	event.preventDefault();

	const projectNameInput = document.querySelector('[name="projectName"]');
	const projectName = projectNameInput.value.trim();
	const userCode = document.querySelector('[name="userCode"]').value;
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

	if (!/^[\w가-힣ㄱ-ㅎ]+$/.test(projectName)) {
		alert('프로젝트명에는 특수문자와 공백을 사용할 수 없습니다.');
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


	if (selectedUsers.length === 0 && selectedGroups.length === 0) {
		alert('최소 1명 이상의 구성원 또는 1개 이상의 그룹을 추가해주세요.');
		return false;
	}

	// 등록자 본인을 관리자로 추가 (중복 체크)
	const creatorUserCode = parseInt(userCode);
	const hasCreatorAsAdmin = selectedUsers.some(user =>
		parseInt(user.userCode) === creatorUserCode && parseInt(user.roleCode) === 1
	);

	// 등록자가 관리자로 추가되지 않았다면 자동 추가
	if (!hasCreatorAsAdmin) {
		const currentUserName = document.getElementById('filterWriter').value;

		selectedUsers.unshift({
			type: 'user',
			userCode: String(creatorUserCode),
			name: currentUserName + ' (등록자)',
			roleCode: '1',  // 관리자 role_code
			roleName: '관리자'
		});
	}


	const formData = {
		projectName: projectName,
		userCode: parseInt(userCode),  // Integer로 변환
		description: description,
		status: document.querySelector('input[name="inlineRadioOptions"]:checked').value,
		projectUsers: selectedUsers.map(user => ({
			userCode: user.userCode,
			roleCode: user.roleCode
		})),
		projectGroups: selectedGroups.map(group => ({
			groupCode: group.groupCode,
			roleCode: group.roleCode
		}))
	};

	submitProject(formData);  // 주석 제거

	console.log(formData);
}

// ============================================
// 15. 프로젝트 등록 서버 요청
// ============================================
function submitProject(formData) {
	fetch('/projects', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Requested-With': 'XMLHttpRequest'
		},
		body: JSON.stringify(formData)
	})
		.then(response => response.json())
		.then(data => {
			if (data.success) {
				alert(data.message);
				window.location.href = '/projects';
			} else {
				alert(data.message);
			}
		})
		.catch(error => {
			console.error('프로젝트 등록 오류:', error);
			alert('프로젝트 등록 중 오류가 발생했습니다.');
		});
}

// ============================================
// 16. 모달 검색 기능
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

	const selectAllCheckbox = document.getElementById('selectAllMembers');
	const visibleCheckboxes = Array.from(document.querySelectorAll('.member-checkbox'))
		.filter(cb => cb.closest('tr').style.display !== 'none');

	if (visibleCheckboxes.length > 0) {
		const allChecked = visibleCheckboxes.every(cb => cb.checked);
		const someChecked = visibleCheckboxes.some(cb => cb.checked);

		selectAllCheckbox.checked = allChecked;
		selectAllCheckbox.indeterminate = someChecked && !allChecked;
	}
}

// ============================================
// 16-2. 모달 검색 기능 (그룹)
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

	const selectAllCheckbox = document.getElementById('selectAllgroup');
	const visibleCheckboxes = Array.from(document.querySelectorAll('.group-checkbox'))
		.filter(cb => cb.closest('tr').style.display !== 'none');

	if (visibleCheckboxes.length > 0) {
		const allChecked = visibleCheckboxes.every(cb => cb.checked);
		const someChecked = visibleCheckboxes.some(cb => cb.checked);

		selectAllCheckbox.checked = allChecked;
		selectAllCheckbox.indeterminate = someChecked && !allChecked;
	}
}

// ============================================
// 17. 탭 기능 (구성원/그룹)
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