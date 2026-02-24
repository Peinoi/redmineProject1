// /js/docs/modal.js
document.addEventListener("DOMContentLoaded", () => {
	const ui = {
		projectText: document.getElementById("filterProjectText"),
		projectValue: document.getElementById("filterProjectValue"),
		btnProjectModal: document.getElementById("btnOpenProjectModal"),
		projectModalEl: document.getElementById("projectSelectModal"),
		projectModalList: document.getElementById("projectModalList"),
		projectModalSearch: document.getElementById("projectModalSearch")
	};

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
		const t = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 1800 });
		t.show();
	};

	let projectCache = [];

	const ensureProjectCache = async () => {
		if (projectCache.length) return true;
		try {
			const res = await fetch("/api/projects/modal", { headers: { Accept: "application/json" } });
			if (!res.ok) throw new Error("프로젝트 목록을 불러오지 못했습니다.");
			projectCache = (await res.json()).map(p => ({ code: String(p.projectCode), name: p.projectName }));
			return true;
		} catch (e) {
			showToast(e.message);
			return false;
		}
	};

	const renderListButtons = (listEl, items, onPick) => {
		if (!listEl) return;
		listEl.innerHTML = "";
		if (!items.length) {
			listEl.innerHTML = `<div class="text-muted">결과가 없습니다.</div>`;
			return;
		}
		items.forEach((it) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "list-group-item list-group-item-action";
			btn.textContent = it.name;
			btn.addEventListener("click", () => onPick(it));
			listEl.appendChild(btn);
		});
	};

	const projectModal = ui.projectModalEl ? new bootstrap.Modal(ui.projectModalEl) : null;

	const openProjectModal = async () => {
		if (!projectModal) return;
		ui.projectModalSearch.value = "";
		const ok = await ensureProjectCache();
		if (!ok) return;
		renderListButtons(ui.projectModalList, projectCache, (picked) => {
			ui.projectText.value = picked.name;
			ui.projectValue.value = picked.code;
			projectModal.hide();
		});
		projectModal.show();
	};

	ui.btnProjectModal?.addEventListener("click", openProjectModal);

	ui.projectModalSearch?.addEventListener("input", async () => {
		const ok = await ensureProjectCache();
		if (!ok) return;
		const q = ui.projectModalSearch.value.trim().toLowerCase();
		renderListButtons(ui.projectModalList, projectCache.filter(p => p.name.toLowerCase().includes(q)), (picked) => {
			ui.projectText.value = picked.name;
			ui.projectValue.value = picked.code;
			projectModal?.hide();
		});
	});
});