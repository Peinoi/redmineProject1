
// -------------------------
// 토스트
// -------------------------
const showToast = (message) => {
	const toastId = "commonToast";
	let toastEl = document.getElementById(toastId);

	if (!toastEl) {
		toastEl = document.createElement("div");
		toastEl.id = toastId;
		toastEl.className = "toast align-items-center text-bg-dark border-0";
		toastEl.setAttribute("role", "alert");
		toastEl.setAttribute("aria-live", "assertive");
		toastEl.setAttribute("aria-atomic", "true");
		toastEl.style.position = "fixed";
		toastEl.style.right = "16px";
		toastEl.style.bottom = "16px";
		toastEl.style.zIndex = "1080";
		toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body" id="commonToastBody"></div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      `;
		document.body.appendChild(toastEl);
	}

	const bodyEl = document.getElementById("commonToastBody");
	if (bodyEl) bodyEl.textContent = message;

	bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 1800 }).show();
};

// -------------------------
// 공통 Confirm 함수 (안전 버전)
// -------------------------
const showConfirm = (message) => {
    return new Promise((resolve) => {

        const modalEl = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOkBtn');

		messageEl.style.whiteSpace = "pre-line";
		messageEl.textContent = message;  // 그대로 유지

        const modal = new bootstrap.Modal(modalEl);

        let isConfirmed = false; // 상태값 추가

        // 확인 버튼 클릭
        okBtn.onclick = () => {
            isConfirmed = true;
            modal.hide();
        };

        // 모달 완전히 닫혔을 때 처리
        modalEl.addEventListener('hidden.bs.modal', () => {
            resolve(isConfirmed);
        }, { once: true });

        modal.show();
    });
};

window.showToast = showToast;
window.showConfirm = showConfirm;