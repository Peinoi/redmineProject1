document.addEventListener("DOMContentLoaded", function() {
	const backBtn = document.getElementById("btnBackUserPage");
	if (!backBtn) return;

	backBtn.addEventListener("click", function(e) {
		e.preventDefault();

		if (history.length > 1) {
			history.back();
		} else {
			window.location.href = "/G2main";
		}
	});
});

// ✅ 사용자페이지 작업현황: 조회 버튼을 AJAX로 처리(페이지 전체 새로고침 방지)
document.addEventListener(
	"submit",
	async (e) => {
		const form = e.target;
		if (!form) return;

		// ✅ 작업현황 기간 조회 form만 가로채기
		if (!form.classList.contains("user-worklog-range")) return;

		e.preventDefault();
		e.stopPropagation();

		const card = form.closest('[data-user-worklog-card="1"]');
		if (!card) return;

		const select = form.querySelector('select[name="days"]');
		const days = select ? select.value : "7";

		// form action 그대로 사용 ( /users/{userCode} )
		const action = form.getAttribute("action") || window.location.pathname;
		const url = new URL(window.location.href);
		url.pathname = action; // /users/{userCode}
		url.searchParams.set("days", days);

		const body = card.querySelector(".card-body");
		const oldHTML = body ? body.innerHTML : "";
		if (body) body.style.opacity = "0.6";

		try {
			const res = await fetch(url.toString(), {
				method: "GET",
				headers: { "X-Requested-With": "fetch" }
			});
			if (!res.ok) throw new Error("worklog fetch failed: " + res.status);

			const html = await res.text();
			const doc = new DOMParser().parseFromString(html, "text/html");

			// ✅ 응답 HTML에서 작업현황 카드의 card-body만 찾아 교체
			const newBody = doc.querySelector(
				'[data-user-worklog-card="1"] .card-body'
			);

			if (!body || !newBody) {
				console.warn("사용자 작업현황(card-body)을 응답 HTML에서 찾지 못함");
				return;
			}

			body.innerHTML = newBody.innerHTML;
		} catch (err) {
			console.error(err);
			if (body) body.innerHTML = oldHTML;
		} finally {
			if (body) body.style.opacity = "1";
		}
	},
	true
);