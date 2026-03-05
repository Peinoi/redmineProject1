const sys = document.querySelector("#sysBtn").addEventListener('change', async (event) => {

	const isChecked = event.target.checked;
	const userCode = event.target.dataset.usercode;
	const sys = document.body.dataset.sysck;
	const sysCk = isChecked ? 'Y' : 'N';

	if (userCode == 1) {
		showToast("최초 admin 계정은 관리자권한을 변경 불가능합니다.");
		event.target.checked = !isChecked; // 상태 복구
		return;
	}

	if (sys == "N") {
		showToast("관리자 권한은 관리자만 변경 가능합니다.");
		event.target.checked = !isChecked; // 상태 복구
		return;
	}



	const isConfirmed = await showConfirm("관리자 권한을 변경하시겠습니까?");
	if (!isConfirmed) {
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
				showToast('권한이 없습니다.');
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

				showToast("권한이 변경되었습니다.");
			} else {
				showToast("변경 실패");
				event.target.checked = !isChecked;
			}
		})
		.catch(err => {
			console.error(err);
			event.target.checked = !isChecked;
		});
});














(function() {
	const form = document.getElementById("myInfoForm");
	if (!form) return;

	const emailEl = document.getElementById("email");
	const phoneEl = document.getElementById("phone");
	const alertEl = document.getElementById("myInfoAlert");

	function showAlert(msg) {
		if (!alertEl) return;
		alertEl.textContent = msg;
		alertEl.classList.remove("d-none");
	}

	function hideAlert() {
		if (!alertEl) return;
		alertEl.textContent = "";
		alertEl.classList.add("d-none");
	}

	// 숫자만 추출
	function onlyDigits(v) {
		return (v || "").replace(/\D/g, "");
	}

	// 한국 전화번호 하이픈 포맷 (010 / 02 / 0xx 대응)
	function formatPhoneKR(value) {
		const digits = onlyDigits(value);

		// 02(서울) 처리
		if (digits.startsWith("02")) {
			if (digits.length <= 2) return digits;
			if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
			if (digits.length <= 9)
				return `${digits.slice(0, 2)}-${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}`;
			return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
		}

		// 휴대폰/일반 지역번호(010, 031 등)
		if (digits.length <= 3) return digits;
		if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
		if (digits.length <= 10)
			return `${digits.slice(0, 3)}-${digits.slice(3, digits.length - 4)}-${digits.slice(-4)}`;
		return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
	}

	// 입력 중 자동 하이픈
	phoneEl?.addEventListener("input", (e) => {
		const el = e.target;
		const prev = el.value;
		const formatted = formatPhoneKR(prev);
		el.value = formatted;
	});

	// 붙여넣기/입력 시 숫자 외 제거 + 하이픈 반영
	phoneEl?.addEventListener("paste", () => {
		setTimeout(() => {
			phoneEl.value = formatPhoneKR(phoneEl.value);
		}, 0);
	});

	// 저장 버튼(폼 submit) 검증: 하나라도 공백이면 막고 포커스 + 메시지
	form.addEventListener("submit", (e) => {
		hideAlert();

		const email = (emailEl?.value || "").trim();
		const phone = (phoneEl?.value || "").trim();

		if (!email) {
			e.preventDefault();
			showAlert("이메일을 입력해주세요.");
			emailEl?.focus();
			return;
		}

		if (!phone) {
			e.preventDefault();
			showAlert("전화번호를 입력해주세요.");
			phoneEl?.focus();
			return;
		}

		// 전화번호 자리수 간단 검증
		const digits = onlyDigits(phone);
		if (digits.length < 9) {
			e.preventDefault();
			showAlert("전화번호 형식이 올바르지 않습니다.");
			phoneEl?.focus();
			return;
		}

		// 제출 직전에 공백/특수문자 섞임 방지: 전화번호는 포맷된 값 그대로 OK
		// 필요하면 digits로 DB 저장하고 싶을 때는 서버에서 처리하는 게 안전함.
	});
})();

document.addEventListener("DOMContentLoaded", function() {
	// 서버 메시지 있으면 1초 후 자동 사라짐
	const serverAlert = document.getElementById("myInfoServerAlert");
	if (serverAlert) {
		setTimeout(() => {
			serverAlert.style.transition = "opacity 0.5s ease";
			serverAlert.style.opacity = "0";
			setTimeout(() => serverAlert.remove(), 500);
		}, 1000);
	}

	// 돌아가기 버튼 (서버Alert가 없어도 항상 등록돼야 함)
	const backBtn = document.getElementById("btnBackMyInfo");
	if (!backBtn) return;

	backBtn.addEventListener(
		"click",
		(e) => {
			e.preventDefault();
			e.stopPropagation();

			const ref = document.referrer || "";
			const isFromModifyPw = ref.includes("/myInfo/modifyPw");

			if (!ref || isFromModifyPw || history.length <= 1) {
				window.location.replace("/G2main");
				return;
			}

			history.back();
		},
		true
	);
});



