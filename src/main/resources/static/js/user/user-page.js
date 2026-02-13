document.addEventListener("DOMContentLoaded", function () {
  const backBtn = document.getElementById("btnBackUserPage");
  if (!backBtn) return;

  backBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const ref = document.referrer || "";
    if (!ref || history.length <= 1) {
      window.location.replace("/G2main");
      return;
    }
    history.back();
  }, true);
});
