document.addEventListener("DOMContentLoaded", () => {
  const issueCode = new URLSearchParams(location.search).get("issueCode");

  document.getElementById("btnBack")?.addEventListener("click", () => history.back());

  document.getElementById("btnEdit")?.addEventListener("click", () => {
    if (!issueCode) return alert("issueCode 없음");
    location.href = `/issueEdit?issueCode=${issueCode}`;
  });

  document.getElementById("btnDelete")?.addEventListener("click", () => {
    if (!issueCode) return alert("issueCode 없음");
    if (!confirm("정말 삭제할까요?")) return;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/issueDelete";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "issueCodes";
    input.value = issueCode;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  });
});
