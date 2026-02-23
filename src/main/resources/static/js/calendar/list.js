// /js/calendar/list.js
(() => {

	let holidays = [];

	let holidaySet = new Set();

	function buildHolidaySet() {
		holidaySet = new Set(
			holidays
				.filter(h => h.useYn === 'Y')
				.map(h => DateUtils.getYYYYMMDD(h.dt))
		);
	}

	// 툴팁 엘리먼트 생성 (한 번만)
	const tooltip = document.createElement('div');
	tooltip.id = 'calendarTooltip';
	tooltip.style.cssText = `
	    display: none;
	    position: fixed;
	    z-index: 9999;
	    background: #1e1e2e;
	    color: #e2e8f0;
	    border-radius: 10px;
	    padding: 12px 16px;
	    font-size: 0.8rem;
	    line-height: 1.7;
	    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
	    pointer-events: none;
	    min-width: 180px;
	    border: 1px solid rgba(255,255,255,0.08);
	`;
	document.body.appendChild(tooltip);

	document.addEventListener('DOMContentLoaded', async function() {

		const calendarEl = document.getElementById('calendar');
		if (!calendarEl) return;

		try {
			const res = await fetch('/holidayData');
			holidays = await res.json();
			buildHolidaySet();
		} catch (err) {
			console.error('공휴일 데이터 로드 실패', err);
		}

		let currentFilters = {};

		function moveTooltip(e) {
			const t = document.getElementById('calendarTooltip');
			const offset = 14;
			let x = e.clientX + offset;
			let y = e.clientY + offset;

			// 화면 밖으로 나가지 않게
			if (x + 220 > window.innerWidth) x = e.clientX - 220;
			if (y + 200 > window.innerHeight) y = e.clientY - 200;

			t.style.left = x + 'px';
			t.style.top = y + 'px';
		}

		const calendar = new FullCalendar.Calendar(calendarEl, {
			themeSystem: 'bootstrap5',
			initialView: 'dayGridMonth',
			locale: 'ko',
			contentHeight: 'auto',
			dayMaxEvents: 3,
			fixedWeekCount: false,
			handleWindowResize: true,
			expandRows: true,

			headerToolbar: {
				left: 'prevYear,prev,next,nextYear today',
				center: 'title',
				right: 'dayGridMonth,dayGridWeek,timeGridDay'
			},

			// 오늘 강조
			nowIndicator: true,

			eventMouseEnter(info) {
				const p = info.event.extendedProps;
				const e = info.event;

				const statusColors = {
					'신규': '#90b8ff', '진행': '#ffe27a', '해결': '#a78bfa',
					'반려': '#f8a1d1', '완료': '#8fe6a2'
				};

				// 유형 계층 구성
				const typeChain = [p.parTypeName, p.typeName]
					.filter(Boolean)
					.join(' > ');

				const priorityColors = {
					'긴급': '#D97B7B',
					'높음': '#FFB266',
					'보통': '#5AB2FF',
					'낮음': '#69B87C'
				};

				// issueCode로 원본 데이터 매핑 (events map에서 extendedProps로 저장)
				tooltip.innerHTML = `
			        <div style="font-weight:700; font-size:0.85rem; margin-bottom:6px; color:#fff;">
			            ${p.title}
			        </div>
			        <div style="width:100%; height:1px; background:rgba(255,255,255,0.1); margin-bottom:8px;"></div>
					<div>🗂️ 프로젝트 : <b>${p.projectName ?? '-'}</b></div>
					<div>📂 유형 : <b>${typeChain || '-'}</b></div>
			        <div>📌 작업번호 : <b>${p.issueCode ?? '-'}</b></div>
			        <div>🚦 상태 : <b style="color:${statusColors[p.issueStatus] ?? '#e2e8f0'}">${p.issueStatus ?? '-'}</b></div>
			        <div>⚡ 우선순위 : <b style="color:${priorityColors[p.priority] ?? '#e2e8f0'}">${p.priority ?? '-'}</b></div>
			        <div>📈 진행률 : <b>${p.progress != null ? p.progress + '%' : '-'}</b></div>
			        <div>📅 시작일 : <b>${p.issueStartDate ?? '-'}</b></div>
			        <div>📅 종료일 : <b>${p.issueEndDate ?? '-'}</b></div>
			        <div>👤 담당자 : <b>${p.assigneeName ?? '-'}</b></div>
			    `;
				tooltip.style.display = 'block';

				// 마우스 위치 추적
				info.el.addEventListener('mousemove', moveTooltip);
			},

			eventMouseLeave(info) {
				tooltip.style.display = 'none';
				info.el.removeEventListener('mousemove', moveTooltip);
			},

			datesSet() {
				setTimeout(() => {
					calendarEl.querySelectorAll('.fc-daygrid-day').forEach(el => {
						const date = el.getAttribute('data-date');
						const link = el.querySelector('a.fc-daygrid-day-number');
						if (!link) return;

						link.style.textDecoration = 'none';  // 밑줄 제거

						const isSunday = new Date(date).getDay() === 0;
						const isHolidayDate = holidaySet.has(date);

						if (isHolidayDate || isSunday) {
							link.style.color = '#e53e3e';
						} else {
							link.style.color = '#111827';
						}

					});

					// 요일 헤더 밑줄 제거 + 색상
					calendarEl.querySelectorAll('.fc-col-header-cell').forEach(el => {
						const a = el.querySelector('a');
						if (!a) return;

						a.style.textDecoration = 'none';

						// 일요일 컬럼인지 확인 (fc-day-sun 클래스)
						if (el.classList.contains('fc-day-sun')) {
							a.style.color = '#e53e3e';
							a.style.fontWeight = '700';
						} else {
							a.style.color = '#212529';  // Bootstrap 기본 텍스트 색
							a.style.fontWeight = '';
						}
					});

				}, 0);
			},

			titleFormat(dateInfo) {
				return `${dateInfo.date.year}년 ${dateInfo.date.month + 1}월`;
			},

			events(fetchInfo, successCallback, failureCallback) {

				fetch("/calendarData")
					.then(res => res.json())
					.then(data => {

						// TYPE 맵 구성: typeCode → {typeName, parTypeName}
						const typeMap = {};
						data.filter(r => r.rowType === 'TYPE').forEach(r => {
							typeMap[r.typeCode] = {
								typeName: r.typeName,
								parTypeName: r.parTypeName
							};
						});

						const events = data
							.filter(r => r.rowType === "ISSUE")
							.filter(r => {
								if (currentFilters.projectCode &&
									String(r.projectCode) !== String(currentFilters.projectCode)) return false;
								if (currentFilters.title &&
									!r.title?.toLowerCase().includes(currentFilters.title)) return false;
								if (currentFilters.type &&
									String(r.typeCode) !== String(currentFilters.type)) return false;
								if (currentFilters.status &&
									r.issueStatus !== currentFilters.status) return false;
								if (currentFilters.priority &&
									r.priority !== currentFilters.priority) return false;
								if (currentFilters.assigneeCode &&
									String(r.assigneeCode) !== String(currentFilters.assigneeCode)) return false;
								if (currentFilters.creatorCode &&
									String(r.creatorCode) !== String(currentFilters.creatorCode)) return false;
								return true;
							})
							.map(r => {
								// typeCode로 유형명 조회
								const typeInfo = typeMap[r.typeCode] || {};

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

								return {
									id: r.nodeId,
									title: `${r.title}(${progressText})`,
									start: r.issueStartDate || r.startedAt,
									end: addOneDay(endDate),
									allDay: true,
									textColor: '#111827',
									backgroundColor: color,
									borderColor: color,
									classNames: ['calendar-event'],
									extendedProps: {
										title: r.title,
										issueCode: r.issueCode,
										issueStatus: r.issueStatus,
										priority: r.priority,
										progress: r.progress,
										issueStartDate: r.issueStartDate,
										issueEndDate: r.issueEndDate,
										assigneeName: r.assigneeName,
										projectName: r.projectName,
										typeName: typeInfo.typeName,
										parTypeName: typeInfo.parTypeName,
									}
								};
							});

						successCallback(events);
					})
					.catch(err => failureCallback(err));
			},

			eventClick(info) {
				const issueCode =
					info.event.extendedProps.issueCode ||
					info.event.id?.replace('ISSUE_', '');

				if (!issueCode) return;
				window.location.href = `/issueInfo?issueCode=${issueCode}`;
			}
		});

		calendar.render();

		setTimeout(() => {
			const header = calendarEl.querySelector('.fc-header-toolbar');
			const legend = document.getElementById('calendarLegend');

			if (header && legend) {
				header.insertAdjacentElement('afterend', legend);
			}
			
			calendar.updateSize();
		}, 200);

		window.addEventListener('resize', () => {
			calendar.updateSize();
		});

		// 부모 크기 변하면 자동 재계산
		const resizeObserver = new ResizeObserver(() => {
			calendar.updateSize();
		});
		resizeObserver.observe(calendarEl.parentElement);

		const observer = new MutationObserver(() => {
			calendarEl.querySelectorAll('.fc-more-link').forEach(el => {
				el.style.textDecoration = 'none';
				el.style.color = '#6b7280';
				el.style.fontSize = '0.75rem';
				el.style.fontWeight = '600';

				const parent = el.closest('.fc-daygrid-day-bottom');
				if (parent) {
					parent.style.display = 'flex';
					parent.style.justifyContent = 'flex-end';  // 오른쪽 정렬
					parent.style.marginTop = '4px'; // 여백 조절
				}
			});
		});

		observer.observe(calendarEl, { childList: true, subtree: true });

		// 범례 (Bootstrap)
		document.getElementById("calendarLegend").innerHTML = `
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

		window.calendarReload = (filters = {}) => {
			currentFilters = filters || {};
			calendar.refetchEvents();
		};
	});

})();
