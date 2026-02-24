// /js/docs/insert.js 
document.addEventListener("DOMContentLoaded", function() {
	console.log("insert.js loaded");
	const backBtn = document.getElementById("btnBack");
	console.log("backBtn:", backBtn);
	if (!backBtn) return;

	backBtn.addEventListener("click", function(e) {
		e.preventDefault();
		console.log("backBtn clicked");

		if (history.length > 1) {
			history.back();
		} else {
			window.location.href = "/G2main";
		}
	});
});