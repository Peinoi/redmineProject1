// ============================================
// projectadd.js
// ============================================

// CKEditor 인스턴스
let editorInstance;

// 선택된 사용자 목록 (구성원 테이블에 추가된 사용자들)
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
	// ckeditor5.js에서 이미 초기화되므로 전역 변수만 확인
	// CKEditor가 초기화될 때까지 대기
	const checkEditor = setInterval(() => {
		if (window.ckEditor) {
			editorInstance = window.ckEditor;

			// 글자 수 제한 (1000자)
			editorInstance.model.document.on('change:data', () => {
				const data = editorInstance.getData();
				const textOnly = data.replace(/<[^>]*>/g, '');

				if (textOnly.length > 1000) {
					alert('프로젝트 설명은 1000자를 초과할 수 없습니다.');
					// 마지막 변경 취소
					editorInstance.execute('undo');
				}
			});

			clearInterval(checkEditor);
		}
	}, 100);

	// 5초 후에도 초기화되지 않으면 타임아웃
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
	// 프로젝트명 실시간 유효성 검사
	const projectNameInput = document.querySelector('[name="projectName"]');
	projectNameInput.addEventListener('input', validateProjectName);

	// 구성원 추가 버튼 (ID 수정: btnSubmit -> btnAddMember)
	const addMemberBtn = document.querySelector('#btnAddMember');
	if (addMemberBtn) {
		addMemberBtn.addEventListener('click', openMemberModal);
	}

	// 초기화 버튼
	const resetBtn = document.querySelector('#btnReset');
	if (resetBtn) {
		resetBtn.addEventListener('click', resetForm);
	}

	// 폼 제출 (실제 제출 버튼 ID는 btnSubmit)
	const submitBtn = document.querySelector('#btnSubmit');
	if (submitBtn) {
		submitBtn.addEventListener('click', handleFormSubmit);
	}

	// 모달 검색 기능
	const searchInput = document.getElementById('creatorModalSearch');
	if (searchInput) {
		searchInput.addEventListener('input', handleModalSearch);
	}
}

// ============================================
// 4. 프로젝트명 유효성 검사
// ============================================
function validateProjectName(event) {
	const input = event.target;
	const value = input.value;

	// 특수문자, 공백 제거 (한글, 영문, 숫자만 허용)
	const filtered = value.replace(/[^\w\sㄱ-ㅎ가-힣]/g, '').replace(/\s/g, '');

	if (value !== filtered) {
		input.value = filtered;
		showValidationMessage(input, '특수문자와 공백은 사용할 수 없습니다.');
		return false;
	}

	// 길이 검사 (5~50자)
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
	// 기존 메시지 제거
	hideValidationMessage(input);

	// 새 메시지 추가
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
	// 서버에서 전달받은 데이터 사용
	const users = window.serverData?.users || [];
	const roles = window.serverData?.roles || [];
	const groups = window.serverData?.groups || [];

	// 현재 로그인한 사용자 정보 (세션에서)
	const currentUserName = document.getElementById('filterWriter').value;

	// 자기 자신과 이미 추가된 사용자 제외
	const availableUsers = users.filter(user =>
		user.name !== currentUserName &&
		!selectedUsers.some(selected => selected.userCode === user.userCode)
	);

	const availableGroups = groups.filter(group =>
		!selectedGroups.some(selected => selected.groupCode === group.groupCode)
	);
	displayUserList(availableUsers, roles);
	displayGroupList(availableGroups, roles);
	// Bootstrap 모달 열기
	const modal = new bootstrap.Modal(document.getElementById('creatorSelectModal'));
	modal.show();
}

// ============================================
// 7. 모달에 사용자 목록 표시
// ============================================
function displayUserList(users, roles) {
	// 구성원 목록 표시
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

	// 구성원 목록 생성
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

	// 전체 선택 기능
	setupSelectAllMembers();

	// 역할 목록 표시
	displayRoleList(roles);

	// 추가 버튼 이벤트
	setupAddMembersButton(roles);
}
// ============================================
// 7. 모달에 사용자 목록 표시(그룹)
// ============================================
function displayGroupList(groups, roles) {
	const groupListContainer = document.getElementById('groupSelectList');
	/*console.log(groups);*/
	if (!groupListContainer) return;

	// 1. 기존 리스트 비우기 (중복 방지)
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

	// 2. 그룹 목록 생성
	groups.forEach(group => {
		const row = document.createElement('tr');
		// GroupVO의 필드명: groupCode, grName 확인
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

	// 전체 선택 기능
	setupSelectAllMembers();

	// 역할 목록 표시
	displayRoleList(roles);

	// 추가 버튼 이벤트
	setupAddMembersButton(roles);
}
// ============================================
// 7-1. 전체 선택 기능
// ============================================
function setupSelectAllMembers() {
	const selectAllCheckbox = document.getElementById('selectAllMembers');
	const memberCheckboxes = document.querySelectorAll('.member-checkbox');

	// 전체 선택 체크박스 클릭 시
	selectAllCheckbox.addEventListener('change', function() {
		memberCheckboxes.forEach(checkbox => {
			checkbox.checked = this.checked;
		});
	});

	// 개별 체크박스 클릭 시 전체 선택 상태 업데이트
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
function setupAddMembersButton(roles) {
	const addButton = document.getElementById('btnAddSelectedMembers');

	// 기존 이벤트 리스너 제거를 위해 새 버튼으로 교체
	const newButton = addButton.cloneNode(true);
	addButton.parentNode.replaceChild(newButton, addButton);

	newButton.addEventListener('click', () => addSelectedMembers(roles));
}

// ============================================
// 8. 선택한 구성원 추가
// ============================================
function addSelectedMembers(roles) {
	const checkedMembers = document.querySelectorAll('.member-checkbox:checked');
	const checkedRoles = document.querySelectorAll('.role-checkbox:checked');

	// 유효성 검사
	if (checkedMembers.length === 0) {
		alert('추가할 구성원을 선택해주세요.');
		return;
	}

	if (checkedRoles.length === 0) {
		alert('최소 1개 이상의 역할을 선택해주세요.');
		return;
	}

	const newUsers = [];

	// 선택된 구성원과 역할 조합
	checkedMembers.forEach(memberCheckbox => {
		checkedRoles.forEach(roleCheckbox => {
			const userCode = memberCheckbox.value;
			const userName = memberCheckbox.dataset.userName;
			const userEmail = memberCheckbox.dataset.userEmail;
			const roleCode = roleCheckbox.value;

			// 역할명 찾기
			const roleObj = roles.find(r => r.roleCode == roleCode);
			const roleName = roleObj ? roleObj.roleName : '';

			newUsers.push({
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

		// 모달 닫기
		const modal = bootstrap.Modal.getInstance(document.getElementById('creatorSelectModal'));
		modal.hide();

		// 성공 메시지
		alert(`${checkedMembers.length}명의 구성원이 추가되었습니다.`);
	}
}



// ============================================
// 9. 구성원 테이블 업데이트
// ============================================
function updateMemberTable() {
	const tbody = document.getElementById('projectTbody');
	tbody.innerHTML = '';

	if (selectedUsers.length === 0) {
		tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">추가된 구성원이 없습니다.</td></tr>';
		return;
	}

	selectedUsers.forEach((user, index) => {
		const row = document.createElement('tr');
		row.className = 'projectRow';
		row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.roleName}</td>
            <td>
                <button class="btn btn-success btn-sm" onclick="openEditModal(${index})">수정</button>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removeMember(${index})">삭제</button>
            </td>
        `;
		tbody.appendChild(row);
	});
}

// ============================================
// 10. 구성원 수정 모달 열기
// ============================================

function openEditModal(index) {
	const user = selectedUsers[index];

	// 서버에서 넘어온 역할 목록 가져오기 (없을 경우 대비해 빈 배열 처리)
	const roles = window.serverData && window.serverData.roles ? window.serverData.roles : [];

	// 역할 목록을 <option> 태그로 변환
	const roleOptions = roles.map(role => {
		// user.roleCode와 role.roleCode 비교 (숫자/문자열 타입 다를 수 있으므로 == 사용)
		const isSelected = (user.roleCode == role.roleCode) ? 'selected' : '';
		return `<option value="${role.roleCode}" ${isSelected}>${role.roleName}</option>`;
	}).join('');

	const modalHtml = `
        <div class="modal fade" id="editMemberModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">구성원 권한 수정</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold">구성원</label>
                            <input type="text" class="form-control" value="${user.name}" readonly>
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
                        <button type="button" class="btn btn-success" onclick="saveRoleChange(${index})">저장</button>
                    </div>
                </div>
            </div>
        </div>
    `;

	// 기존 모달 제거 
	const existingModal = document.getElementById('editMemberModal');
	if (existingModal) existingModal.remove();

	document.body.insertAdjacentHTML('beforeend', modalHtml);
	const modal = new bootstrap.Modal(document.getElementById('editMemberModal'));
	modal.show();
}

// ============================================
// 11. 구성원 권한 변경 저장
// ============================================
function saveRoleChange(index) {
	const roleSelect = document.getElementById('editRoleSelect');
	const newRoleCode = roleSelect.value; // roleCode
	const newRoleName = roleSelect.options[roleSelect.selectedIndex].text; // roleName

	// 데이터 업데이트
	selectedUsers[index].roleCode = newRoleCode;
	selectedUsers[index].roleName = newRoleName;

	// 테이블 갱신
	updateMemberTable();

	// 모달 닫기 및 제거
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
function removeMember(index) {
	if (confirm('해당 구성원을 삭제하시겠습니까?')) {
		selectedUsers.splice(index, 1);
		updateMemberTable();
	}
}

// ============================================
// 13. 폼 초기화
// ============================================
function resetForm() {
	if (confirm('입력한 내용을 모두 초기화하시겠습니까?')) {
		// 프로젝트명 초기화
		document.querySelector('[name="projectName"]').value = '';

		// CKEditor 초기화
		if (editorInstance) {
			editorInstance.setData('');
		}

		// 구성원 목록 초기화
		selectedUsers = [];
		updateMemberTable();

		// 상태 라디오 버튼 초기화 (진행으로 설정)
		document.getElementById('inlineRadio1').checked = true;

		// 유효성 검사 메시지 제거
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

	// 1. 프로젝트명 검사
	const projectNameInput = document.querySelector('[name="projectName"]');
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

	// 특수문자, 공백 검사
	if (!/^[\w가-힣ㄱ-ㅎ]+$/.test(projectName)) {
		alert('프로젝트명에는 특수문자와 공백을 사용할 수 없습니다.');
		projectNameInput.focus();
		return false;
	}

	// 2. 프로젝트 설명 검사
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

	// 3. 구성원 검사
	if (selectedUsers.length === 0) {
		alert('최소 1명 이상의 구성원을 추가해주세요.');
		return false;
	}

	// 4. 데이터 수집
	const formData = {
		projectName: projectName,
		description: description,
		status: document.querySelector('input[name="inlineRadioOptions"]:checked').value,
		projectUsers: selectedUsers.map(user => ({
			userCode: user.userCode,
			roleCode: user.roleCode
		}))
	};

	// 5. 서버로 전송
	submitProject(formData);
}

// ============================================
// 15. 프로젝트 등록 서버 요청
// ============================================
function submitProject(formData) {
	fetch('/projects', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(formData)
	})
		.then(response => {
			if (response.ok) {
				return response.json();
			}
			throw new Error('프로젝트 등록 실패');
		})
		.then(data => {
			alert('프로젝트가 정상적으로 등록되었습니다.');
			// 프로젝트 대시보드로 이동
			window.location.href = `/projects/${data.identifier}/dashboard`;
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

	// 검색 후 전체 선택 체크박스 상태 업데이트
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
// 17. 탭 기능 (구성원/그룹)
// ============================================
function initializeTabNavigation() {
	const tabLinks = document.querySelectorAll('.tabnav a');
	const tabContents = document.querySelectorAll('.tabcontent > div');

	// 첫 번째 탭 활성화
	if (tabLinks.length > 0) {
		tabLinks[0].parentElement.classList.add('active');
	}
	if (tabContents.length > 0) {
		tabContents[0].style.display = 'block';

	}

	tabLinks.forEach(link => {
		link.addEventListener('click', function(e) {
			e.preventDefault();

			// 모든 탭 콘텐츠 숨기기
			tabContents.forEach(content => {
				content.style.display = 'none';
			});

			// 모든 탭 링크 비활성화
			tabLinks.forEach(l => {
				l.parentElement.classList.remove('active');
			});

			// 선택한 탭 활성화
			this.parentElement.classList.add('active');
			const targetId = this.getAttribute('href').substring(1);
			const targetElement = document.getElementById(targetId);
			if (targetElement) {
				targetElement.style.display = 'block';
			}
		});
	});
}