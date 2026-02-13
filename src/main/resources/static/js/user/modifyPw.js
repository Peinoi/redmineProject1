// /static/js/user/modifyPw.js
// ✅ 비밀번호 변경: 공백/불일치 시 포커스 + 안내 메시지

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("modifyPwForm");
  if (!form) return;

  const alertBox = document.getElementById("pwAlert");
  const currentPw = document.getElementById("currentPw");
  const newPw = document.getElementById("newPw");
  const confirmPw = document.getElementById("confirmPw");

  function showAlert(msg) {
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.classList.remove("d-none");
  }

  function hideAlert() {
    if (!alertBox) return;
    alertBox.textContent = "";
    alertBox.classList.add("d-none");
  }

  // 입력 시작하면 안내 숨김
  [currentPw, newPw, confirmPw].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", hideAlert);
  });

  form.addEventListener("submit", (e) => {
    hideAlert();

    const cur = (currentPw?.value ?? "").trim();
    const npw = (newPw?.value ?? "").trim();
    const cpw = (confirmPw?.value ?? "").trim();

    // 현재 비밀번호 공백
    if (!cur) {
      e.preventDefault();
      showAlert("현재 비밀번호를 입력해주세요.");
      currentPw?.focus();
      return;
    }

    // 새 비밀번호 공백
    if (!npw) {
      e.preventDefault();
      showAlert("새 비밀번호를 입력해주세요.");
      newPw?.focus();
      return;
    }
	
	// 현재 비밀번호 = 새 비밀번호 금지
	if (cur === npw) {
	    e.preventDefault();
	    showAlert("새 비밀번호는 현재 비밀번호와 다르게 입력해주세요.");
	    newPw?.focus();
	    newPw?.select?.();
	    return;
	  }

    // 확인 공백
    if (!cpw) {
      e.preventDefault();
      showAlert("새 비밀번호 확인을 입력해주세요.");
      confirmPw?.focus();
      return;
    }

    // 새 비밀번호 불일치
    if (npw !== cpw) {
      e.preventDefault();
      showAlert("새 비밀번호와 확인이 일치하지 않습니다.");
      confirmPw?.focus();
      confirmPw?.select?.();
      return;
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // 1) 에러 메시지: 1초 뒤 자동 사라짐
  const errorAlert = document.querySelector(".alert-danger");
  if (errorAlert) {
    setTimeout(() => {
      errorAlert.style.transition = "opacity 0.5s ease";
      errorAlert.style.opacity = "0";
      setTimeout(() => errorAlert.remove(), 500);
    }, 1000);
  }

  // 2) 성공 시: 부트스트랩 모달 띄우고, 확인/닫기 시 내 정보로 이동
  const modalEl = document.getElementById("pwChangeSuccessModal");
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl, {
      backdrop: "static", // 바깥 클릭으로 닫히는 걸 막고 싶으면 true 대신 "static"
      keyboard: false     // ESC로 닫히는 걸 막고 싶으면 false
    });

    modal.show();

    const goMyInfo = () => {
      window.location.replace("/myInfo");
    };

    // 확인 버튼 클릭 → 이동
    const okBtn = document.getElementById("pwChangeOkBtn");
    if (okBtn) okBtn.addEventListener("click", goMyInfo);

    // X 버튼(또는 모달이 닫히는 모든 경우) → 이동
    modalEl.addEventListener("hidden.bs.modal", goMyInfo);
  }
});

