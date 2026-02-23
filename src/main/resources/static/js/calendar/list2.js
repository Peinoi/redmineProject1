// /js/calendar/list.js
(() => {

    let holidays = []; // 공휴일 데이터를 저장할 배열

    // 공휴일 여부 확인
    const isHoliday = (dateStr) => {
        return holidays.some(h => h.dt === dateStr && h.useYn === 'Y');
    };

    document.addEventListener('DOMContentLoaded', async function() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        // 공휴일 데이터 가져오기
        try {
            const res = await fetch('/holidayData');
            holidays = await res.json();
        } catch (err) {
            console.error('공휴일 데이터 로드 실패', err);
        }

        let currentFilters = {};

        const headerToolbar = {
            left: 'prevYear,prev,next,nextYear today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,timeGridDay'
        };

        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: headerToolbar,
            locale: 'ko',
            contentHeight: 'auto',
            dayMaxEvents: 3,

            // 공휴일 날짜 셀에 클래스 추가
            dayCellClassNames: function(arg) {
                const dateStr = DateUtils.toLocalDateStr(arg.date);
                if (isHoliday(dateStr)) {
                    return ['fc-holiday']; // CSS에서 빨간색 스타일 적용
                }
                return [];
            },

            // 공휴일 날짜 숫자도 빨간색으로
            dayCellContent: function(arg) {
                const dateStr = DateUtils.toLocalDateStr(arg.date);
                const day = arg.date.getDate();
                if (isHoliday(dateStr)) {
                    return { html: `<span class="fc-holiday-number">${day}</span>` };
                }
                return { html: `<span>${day}</span>` };
            },

            titleFormat: function(dateInfo) {
                const year = dateInfo.date.year;
                const month = dateInfo.date.month + 1;
                return `${year}년 ${month}월`;
            },

            events: function(fetchInfo, successCallback, failureCallback) {
                fetch("/calendarData")
                    .then(res => res.json())
                    .then(data => {

                        // 유형 하위 코드 수집 (Gantt와 동일한 로직)
                        let typeCodesSet = new Set();
                        if (currentFilters.type) {
                            const typeMap = {};
                            data.filter(d => d.rowType === "TYPE").forEach(t => {
                                typeMap[t.typeCode] = t;
                            });
                            const getAllChildTypes = (parentCode) => {
                                const codes = new Set([parentCode]);
                                const findChildren = (code) => {
                                    Object.values(typeMap).forEach(type => {
                                        if (type.parTypeCode && String(type.parTypeCode) === String(code)) {
                                            codes.add(String(type.typeCode));
                                            findChildren(String(type.typeCode));
                                        }
                                    });
                                };
                                findChildren(parentCode);
                                return codes;
                            };
                            typeCodesSet = getAllChildTypes(currentFilters.type);
                        }

                        const events = data
                            .filter(r => r.rowType === "ISSUE")
                            .filter(r => {
                                // -------------------------
                                // 검색조건 필터링
                                // -------------------------
                                if (currentFilters.projectCode &&
                                    String(r.projectCode) !== String(currentFilters.projectCode)) {
                                    return false;
                                }

                                if (currentFilters.title &&
                                    !r.title?.toLowerCase().includes(currentFilters.title)) {
                                    return false;
                                }

                                if (currentFilters.type &&
                                    String(r.typeCode) !== String(currentFilters.type)) {
                                    return false;
                                }

                                if (currentFilters.status &&
                                    r.issueStatus !== currentFilters.status) {
                                    return false;
                                }

                                if (currentFilters.priority &&
                                    r.priority !== currentFilters.priority) {
                                    return false;
                                }

                                if (currentFilters.assigneeCode &&
                                    String(r.assigneeCode) !== String(currentFilters.assigneeCode)) {
                                    return false;
                                }

                                if (currentFilters.creatorCode &&
                                    String(r.creatorCode) !== String(currentFilters.creatorCode)) {
                                    return false;
                                }

                                if (currentFilters.createdAt) {
                                    const created = r.createdOn ? r.createdOn.split("T")[0] : null;
                                    if (created !== currentFilters.createdAt) return false;
                                }

                                if (currentFilters.dueAt &&
                                    r.dueAt !== currentFilters.dueAt) {
                                    return false;
                                }

                                return true;
                            })
                            .map(r => {

                                let color = '#5AB2FF';

                                if (r.issueStatus === '신규') color = '#90b8ff';
                                else if (r.issueStatus === '진행') color = '#ffe27a';
                                else if (r.issueStatus === '해결') color = '#a78bfa';
                                else if (r.issueStatus === '반려') color = '#f8a1d1';
                                else if (r.issueStatus === '완료') color = '#8fe6a2';

                                const addOneDay = (dateStr) => {
                                    if (!dateStr) return null;
                                    const d = new Date(dateStr);
                                    d.setDate(d.getDate() + 1);
                                    return d;
                                };

                                const endDate = r.issueEndDate || r.dueAt;

                                const progressText = r.progress != null ? `${r.progress}%` : '';
                                const displayTitle = `${r.title}(${progressText})`;

                                return {
                                    id: r.nodeId,
                                    title: displayTitle,
                                    start: r.issueStartDate || r.startedAt,
                                    end: addOneDay(endDate),
                                    allDay: true,

                                    backgroundColor: color,
                                    borderColor: color,

                                    extendedProps: {
                                        issueCode: r.issueCode,
                                        projectName: r.projectName,
                                        assignee: r.assigneeName,
                                        priority: r.priority,
                                        status: r.issueStatus
                                    }
                                };
                            });

                        successCallback(events);
                    })
                    .catch(err => {
                        failureCallback(err);
                    });
            },

            eventClick: function(info) {
                const issueCode =
                    info.event.extendedProps.issueCode ||
                    info.event.id?.replace('ISSUE_', '');

                if (!issueCode) return;

                window.location.href = `/issueInfo?issueCode=${issueCode}`;
            }
        });

        calendar.render();

        // 사이드바 토글시 달력 리사이즈
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            setTimeout(() => {
                calendar.updateSize();
            }, 300);
        });

        const legendHtml = `
		  <span class="d-flex align-items-center gap-1">
		    <span class="badge rounded-pill" style="background:#90b8ff;">&nbsp;</span> 신규
		  </span>
		  <span class="d-flex align-items-center gap-1">
		    <span class="badge rounded-pill" style="background:#ffe27a;">&nbsp;</span> 진행
		  </span>
		  <span class="d-flex align-items-center gap-1">
		    <span class="badge rounded-pill" style="background:#a78bfa;">&nbsp;</span> 해결
		  </span>
		  <span class="d-flex align-items-center gap-1">
		    <span class="badge rounded-pill" style="background:#f8a1d1;">&nbsp;</span> 반려
		  </span>
		  <span class="d-flex align-items-center gap-1">
		    <span class="badge rounded-pill" style="background:#8fe6a2;">&nbsp;</span> 완료
		  </span>
		`;
		
		document.getElementById("calendarLegend").innerHTML = legendHtml;
		
        // 툴바와 달력 그리드 사이에 삽입
        const viewHarness = calendarEl.querySelector(".fc-scrollgrid ");
        if (viewHarness) {
            viewHarness.insertAdjacentHTML("beforebegin", legendHtml);
        }

        window.calendarReload = (filters = {}) => {
            currentFilters = filters || {};
            calendar.refetchEvents();
        };
    });

})();
