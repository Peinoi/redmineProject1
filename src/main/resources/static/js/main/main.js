google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(initChart);

let chart, data;

function initChart() {
  const statusListCnt = window.__statusListCnt || [];

  if (!statusListCnt || statusListCnt.length === 0) {
    document.getElementById("donutchart").innerHTML =
      "<div class='text-muted text-center py-5'>표시할 데이터가 없습니다.</div>";
    return;
  }

  const reversed = [...statusListCnt].reverse();

  data = new google.visualization.DataTable();
  data.addColumn("string", "상태");
  data.addColumn("number", "개수");
  data.addColumn({ type: "string", role: "tooltip" });

  reversed.forEach((item) => {
    const value = Number(item.codeNameCnt);
    data.addRow([item.codeName, value, `${item.codeName}: ${value}개`]);
  });

  chart = new google.visualization.PieChart(document.getElementById("donutchart"));
  drawChart();

  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(drawChart, 120);
  });
}

function drawChart() {
  const el = document.getElementById("donutchart");
  const w = el.getBoundingClientRect().width;

  const options = {
    pieHole: 0.4,
    colors: ["#3b9ff6", "#a3a3a3"],
    legend: { position: "top", textStyle: { fontSize: 13 } },
    pieSliceText: "value",
    pieSliceTextStyle: { fontSize: 16, bold: true },
    chartArea: {
      left: 10,
      top: 55,
      width: Math.max(w - 20, 0),
      height: "75%"
    }
  };

  chart.draw(data, options);
}

document.addEventListener("DOMContentLoaded", () => {
  initMainNoticePaging();
});

function initMainNoticePaging() {
  // 메인 최근공지: 6개씩
  setupPager({
    itemSelector: '[data-main-recent-notice="1"] .list-group > .list-group-item',
    pagerSelector: '.block-pager[data-pager-for="MAIN_NOTICE"]',
    pageSize: 5,
    fillMode: "list"
  });
}

/* 내페이지 setupPager에서 NOTICE(list)만 쓰는 최소 버전 */
function setupPager({ itemSelector, pagerSelector, pageSize, fillMode }) {
  const pager = document.querySelector(pagerSelector);
  if (!pager) return;

  const pagesWrap = pager.querySelector(".pager-pages");
  const btnPrev = pager.querySelector(".pager-prev");
  const btnNext = pager.querySelector(".pager-next");

  const getRealItems = () =>
    Array.from(document.querySelectorAll(itemSelector)).filter(
      (el) => !el.dataset.pagerDummy
    );

  let page = 0;

  function itemsContainer() {
    const first = document.querySelector(itemSelector);
    return first ? first.parentElement : null;
  }

  const clearDummies = () => {
    const list = itemsContainer();
    if (!list) return;
    list.querySelectorAll('[data-pager-dummy="1"]').forEach((li) => li.remove());
  };

  const appendDummies = (count) => {
    if (count <= 0) return;
    const list = itemsContainer();
    if (!list) return;

    for (let i = 0; i < count; i++) {
      const li = document.createElement("li");
      li.setAttribute("data-pager-dummy", "1");
      li.className = "list-group-item pager-dummy-li";
      li.innerHTML = "&nbsp;";
      list.appendChild(li);
    }
  };

  const render = () => {
    const items = getRealItems();
    const totalPages = Math.ceil(items.length / pageSize);

    if (page > totalPages - 1) page = Math.max(totalPages - 1, 0);

    if (items.length <= pageSize) {
      pager.style.display = "none";
      clearDummies();
      items.forEach((el) => (el.style.display = ""));
      return;
    } else {
      pager.style.display = "";
    }

    const start = page * pageSize;
    const end = start + pageSize;

    clearDummies();

    items.forEach((el, idx) => {
      el.style.display = idx >= start && idx < end ? "" : "none";
    });

    const visibleCount = items.slice(start, end).length;
    appendDummies(pageSize - visibleCount);

    if (btnPrev) btnPrev.disabled = page === 0;
    if (btnNext) btnNext.disabled = page === totalPages - 1;

    if (pagesWrap) {
      pagesWrap.innerHTML = "";

      const windowSize = 7;
      let s = Math.max(0, page - Math.floor(windowSize / 2));
      let e = s + windowSize - 1;
      if (e > totalPages - 1) {
        e = totalPages - 1;
        s = Math.max(0, e - (windowSize - 1));
      }

      for (let p = s; p <= e; p++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "btn btn-sm btn-outline-secondary pager-page" +
          (p === page ? " is-active" : "");
        btn.textContent = String(p + 1);
        btn.addEventListener("click", () => {
          page = p;
          render();
        });
        pagesWrap.appendChild(btn);
      }
    }
  };

  btnPrev?.addEventListener("click", () => {
    page--;
    render();
  });

  btnNext?.addEventListener("click", () => {
    page++;
    render();
  });

  render();
}