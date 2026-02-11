/**
 * 공통 Module
 * 담당 기능: 날짜 포맷
 */

const DateUtils = {
	// ISO 문자열에서 YYYY-MM-DD만 추출
	//getYYYYMMDD: (d) => d?.split('T')[0] || "",
	getYYYYMMDD: (d) => {
		if (!d) return "";
		if (typeof d === "string") return d.split("T")[0];
		if (typeof d === "date") {
			const date = new Date(d);

			const yyyy = date.getFullYear();
			const mm = String(date.getMonth() + 1).padStart(2, "0");
			const dd = String(date.getDate()).padStart(2, "0");

			return `${yyyy}-${mm}-${dd}`;
		}
		return d.toISOString().split("T")[0];
	},


	// 일감 시작일이 지정된 범위 내에 있는지 검사
	isDateInRange: (issueStartStr, from, to) => {
		const target = DateUtils.getYYYYMMDD(issueStartStr);
		if (!target) return false;
		if (from && to) return target >= from && target <= to;
		if (from) return target >= from;
		if (to) return target <= to;
		return true;
	}
};
