const sys = document.querySelector("#sysBtn").addEventListener('change', (event) => {

	const isChecked = event.target.checked;
	const userCode = event.target.dataset.usercode;
	const sys = event.target.dataset.sysck;
	const sysCk = isChecked ? 'Y' : 'N';

	if (userCode == 1) {
		alert("최초 admin 계정은 관리자권한을 변경 불가능합니다.");
		event.target.checked = !isChecked; // 상태 복구
		return;
	}

	if (sys == "N") {
		alert("관리자 권한은 관리자만 변경 가능합니다.");
		event.target.checked = !isChecked; // 상태 복구
		return;
	}



	if (!confirm("관리자 권한을 변경하시겠습니까?")) {
		event.target.checked = !isChecked; // 상태 복구
		return;
	}

	// 서버로 데이터 전송
	fetch('/usersysupdate', {
		method: 'POST',
		headers: { "Content-Type": "application/json", 'X-Requested-With': 'XMLHttpRequest' },
		body: JSON.stringify({ userCode: parseInt(userCode), sysCk: sysCk }),
	})
		.then(response => {
			console.log(response);
			if (response.status === 403) {
				alert('권한이 없습니다.');
				return null;
			}
			return response.text();
		})
		.then(data => {
			if (!data) return;
			if (data === "success") {

				let storageUser = JSON.parse(sessionStorage.getItem("user"));

				if (storageUser) {
					storageUser.sysCk = sysCk;

					sessionStorage.setItem("user", JSON.stringify(storageUser));

					//console.log("브라우저 세션 스토리지 갱신 완료:", storageUser.sysCk);
				}

				alert("권한이 변경되었습니다.");
			} else {
				alert("변경 실패");
				event.target.checked = !isChecked;
			}
		})
		.catch(err => {
			console.error(err);
			event.target.checked = !isChecked;
		});
});