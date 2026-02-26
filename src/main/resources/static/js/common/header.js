// /static/js/common/header.js

document.addEventListener("DOMContentLoaded", () => {
	const btn = document.getElementById("btnClearFixedProject");
	if (!btn) return;

	// 헤더 프로젝트 x눌렀을때
	btn.addEventListener("click", async (e) => {
		e.preventDefault();
		e.stopPropagation();

		try {
			const res = await fetch("/header/fixed-project/clear", {
				method: "POST",
				headers: { "X-Requested-With": "fetch" }
			});

			if (!res.ok) {
				console.warn("고정 프로젝트 해제 실패:", res.status);
				return;
			}

			window.location.reload();
		} catch (err) {
			console.error(err);
		}
	});
});