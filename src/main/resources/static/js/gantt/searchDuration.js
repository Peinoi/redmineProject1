// 전역 변수 초기화
window.ganttRange = null;

function calcDateRange() {
    const months = Number(document.getElementById("rangeMonths").value);
    const year = Number(document.getElementById("baseYear").value);
    const month = Number(document.getElementById("baseMonth").value) - 1;

    const start = new Date(year, month, 1);
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);

    return { start, end };
}

// 날짜를 select에 반영
function updateDateSelectors(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    document.getElementById("baseYear").value = year;
    document.getElementById("baseMonth").value = month;
}

// 간트차트 기간 적용
function applyDateRange(start, end) {
    if (typeof gantt === "undefined") return;

    window.ganttRange = { start, end };

    gantt.showDate(start);

}

// 이전/다음 기간 이동
function navigateGantt(direction) {
    const months = Number(document.getElementById("rangeMonths").value);
    let currentStart;

    // 현재 설정된 시작일 가져오기
    if (window.ganttRange) {
        currentStart = new Date(window.ganttRange.start);
    } else {
        const year = Number(document.getElementById("baseYear").value);
        const month = Number(document.getElementById("baseMonth").value) - 1;
        currentStart = new Date(year, month, 1);
    }

    // 개월 수만큼 이동
    if (direction === 'prev') {
        currentStart.setMonth(currentStart.getMonth() - months);
    } else if (direction === 'next') {
        currentStart.setMonth(currentStart.getMonth() + months);
    }

    // 종료일 계산
    const currentEnd = new Date(currentStart);
    currentEnd.setMonth(currentEnd.getMonth() + months);

    // select 업데이트
    updateDateSelectors(currentStart);

    // 간트차트 적용
    applyDateRange(currentStart, currentEnd);
}

// DOMContentLoaded 사용
document.addEventListener("DOMContentLoaded", () => {
    const btnApply = document.getElementById("btnApplyDuration");
    const btnReset = document.getElementById("btnResetDuration");
    const btnPrev = document.getElementById("btnGanttPrev");
    const btnNext = document.getElementById("btnGanttNext");

    // 조회 버튼
    if (btnApply) {
        btnApply.addEventListener("click", (e) => {
            e.preventDefault();

            if (typeof gantt === "undefined") {
                return;
            }

            const range = calcDateRange();
            applyDateRange(range.start, range.end);
        });
    }

    // 초기화 버튼
    if (btnReset) {
        btnReset.addEventListener("click", (e) => {
            e.preventDefault();

            if (typeof gantt === "undefined") {
                return;
            }

            window.ganttRange = null;

            const today = new Date();
            const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            const endDate = new Date(today.getFullYear(), today.getMonth() + 6, 0);

            gantt.config.start_date = startDate;
            gantt.config.end_date = endDate;

            // 입력 필드 초기화
            document.getElementById("rangeMonths").value = 6;
            updateDateSelectors(today);

            gantt.render();
        });
    }

    // 이전 버튼
    if (btnPrev) {
        btnPrev.addEventListener("click", (e) => {
            e.preventDefault();
            navigateGantt('prev');
        });
    }

    // 다음 버튼
    if (btnNext) {
        btnNext.addEventListener("click", (e) => {
            e.preventDefault();
            navigateGantt('next');
        });
    }
});