document.addEventListener("DOMContentLoaded", () => {

	const rows = document.querySelectorAll(".doc-row");
	const tbody = document.getElementById("docsTableBody");

	if (rows.length) {
		const fragment = document.createDocumentFragment();
		const renderedFolders = new Set(); // 중복 폴더 방지

		rows.forEach(row => {
			const rowType = row.dataset.rowType;
			const projectCode = row.dataset.projectCode;
			const projectName = row.dataset.projectName;
			const fileCode = row.dataset.fileCode;
			const fileName = row.dataset.fileName;
			const folderPath = (row.dataset.folderPath || "").replace(/^ > /, '').trim();
			const folderDepth = parseInt(row.dataset.folderDepth) || 0;
			const sizeBytes = parseInt(row.dataset.size) || 0;
			const uploadedAt = row.dataset.uploadedAt || "";
			const uploader = row.dataset.uploader || "";

			if (rowType === "PROJECT") {
				const tr = document.createElement("tr");
				tr.className = "row-project";
				tr.dataset.projectCode = projectCode;
				tr.style.cursor = "pointer";
				tr.innerHTML = `
                    <td colspan="6" class="fw-bold py-2">
                        <span class="project-toggle me-2">▼</span>
                        🗂️ ${projectName}
                    </td>`;
				tr.addEventListener("click", () => toggleRows(projectCode));
				fragment.appendChild(tr);

			} else if (rowType === "FOLDER") {
				const folderKey = projectCode + ":" + folderPath;
				if (renderedFolders.has(folderKey)) return; // 중복이면 스킵
				renderedFolders.add(folderKey);

				const tr = document.createElement("tr");
				tr.className = "row-folder";
				tr.dataset.projectCode = projectCode;
				const indentPx = folderDepth * 24;
				// 폴더명만 (전체경로에서 마지막 부분만)
				const folderName = folderPath.split(" > ").pop();
				tr.innerHTML = `
                    <td colspan="6" style="padding-left:${indentPx + 16}px;">
                        📁 ${folderName}
                    </td>`;
				fragment.appendChild(tr);

			} else if (rowType === "FILE") {
				const tr = document.createElement("tr");
				tr.className = "row-file";
				tr.dataset.projectCode = projectCode;

				const sizeKb = sizeBytes >= 1024 * 1024
					? (sizeBytes / 1024 / 1024).toFixed(1) + " MB"
					: (sizeBytes / 1024).toFixed(1) + " KB";

				const ext = (fileName || "").split(".").pop().toLowerCase();
				const extIcons = {
					pdf: "📄", doc: "📝", docx: "📝",
					xls: "📊", xlsx: "📊", ppt: "📋", pptx: "📋",
					jpg: "🖼️", jpeg: "🖼️", png: "🖼️", gif: "🖼️",
					zip: "🗜️", txt: "📃"
				};
				const icon = extIcons[ext] || "📎";
				const indentPx = (folderDepth + 1) * 24;

				tr.innerHTML = `
                    <td style="padding-left:${indentPx + 16}px;">
                        ${icon} ${fileName}
                    </td>
                    <td>${sizeKb}</td>
                    <td>
                        <a href="/docsDownload?fileCode=${fileCode}" class="btn btn-sm btn-primary">
                            <i class="fas fa-download"></i>
                        </a>
                    </td>
                    <td>${uploadedAt}</td>
                    <td>${uploader}</td>
                    <td>
                        <button type="button" class="btn btn-sm btn-danger btn-delete"
                            data-file-code="${fileCode}"
                            data-file-name="${fileName}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>`;
				fragment.appendChild(tr);
			}
		});

		rows.forEach(r => r.remove());
		tbody.appendChild(fragment);

		// 삭제 버튼
		tbody.querySelectorAll(".btn-delete").forEach(btn => {
			btn.addEventListener("click", async () => {
				const fileCode = btn.dataset.fileCode;
				const fileName = btn.dataset.fileName;
				if (!confirm(`'${fileName}' 파일을 삭제하시겠습니까?`)) return;
				try {
					const res = await fetch(`/api/docs/${fileCode}`, { method: "DELETE" });
					if (!res.ok) throw new Error("삭제 실패");
					btn.closest("tr").remove();
				} catch (e) {
					alert(e.message);
				}
			});
		});
	}

	document.getElementById("btnResetFilters")?.addEventListener("click", () => {
		window.location.href = "/docs";
	});
});

function toggleRows(projectCode) {
	const childRows = document.querySelectorAll(
		`.row-folder[data-project-code="${projectCode}"],
         .row-file[data-project-code="${projectCode}"]`
	);
	const header = document.querySelector(`.row-project[data-project-code="${projectCode}"]`);
	const toggle = header?.querySelector(".project-toggle");

	const isVisible = childRows[0]?.style.display !== "none";
	childRows.forEach(r => r.style.display = isVisible ? "none" : "");
	if (toggle) toggle.textContent = isVisible ? "▶" : "▼";
}