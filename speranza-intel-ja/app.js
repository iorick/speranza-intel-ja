const MAP_JA = {
  STELLA_MONTIS: "ステラ・モンティス",
  SPACEPORT: "宇宙港",
  BLUE_GATE: "ブルーゲート",
  BURIED_CITY: "埋もれた街",
  DAM: "ダム"
};

const EVENT_JA = {
  NIGHT_RAID: "夜襲",
  ELECTROMAGNETIC_STORM: "電磁嵐",
  COLD_SNAP: "寒波",
  HARVESTER: "ハーベスター",
  MATRIARCH: "マトリアーク",
  BIRD_CITY: "鳥の街"
};

const els = {
  mapFilter: document.getElementById("mapFilter"),
  eventFilter: document.getElementById("eventFilter"),
  activeList: document.getElementById("activeList"),
  upcomingList: document.getElementById("upcomingList"),
  refreshBtn: document.getElementById("refreshBtn")
};

let state = { events: [] };

const fmt = new Intl.DateTimeFormat("ja-JP", {
  month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  timeZone: "Asia/Tokyo"
});

function msToLabel(ms) {
  if (ms <= 0) return "00:00";
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h > 0 ? `${h}時間${mm}分` : `${mm}分`;
}

function getNameMap(key){ return MAP_JA[key] || key; }
function getNameEvent(key){ return EVENT_JA[key] || key; }

function buildFilters(events) {
  const maps = [...new Set(events.map(e => e.map))];
  const types = [...new Set(events.map(e => e.eventType))];

  els.mapFilter.innerHTML = `<option value="ALL">すべて</option>` + maps.map(m => `<option value="${m}">${getNameMap(m)}</option>`).join("");
  els.eventFilter.innerHTML = `<option value="ALL">すべて</option>` + types.map(t => `<option value="${t}">${getNameEvent(t)}</option>`).join("");
}

function matchesFilter(e) {
  const m = els.mapFilter.value;
  const t = els.eventFilter.value;
  return (m === "ALL" || e.map === m) && (t === "ALL" || e.eventType === t);
}

function render() {
  const now = Date.now();
  const filtered = state.events.filter(matchesFilter);

  const active = filtered.filter(e => new Date(e.startAt).getTime() <= now && now < new Date(e.endAt).getTime());
  const upcoming = filtered.filter(e => new Date(e.startAt).getTime() > now).sort((a,b)=> new Date(a.startAt)-new Date(b.startAt));

  els.activeList.innerHTML = active.length ? active.map(e => {
    const end = new Date(e.endAt).getTime();
    return `<article class="card">
      <div class="badge active">開催中</div>
      <h3>${getNameEvent(e.eventType)} / ${getNameMap(e.map)}</h3>
      <div class="meta">終了まで: ${msToLabel(end - now)}</div>
      <div class="meta">終了: ${fmt.format(new Date(e.endAt))}</div>
    </article>`;
  }).join("") : `<div class="empty">現在開催中のイベントはありません。</div>`;

  els.upcomingList.innerHTML = upcoming.length ? upcoming.map(e => {
    const start = new Date(e.startAt).getTime();
    return `<article class="card">
      <div class="badge upcoming">開催予定</div>
      <h3>${getNameEvent(e.eventType)} / ${getNameMap(e.map)}</h3>
      <div class="meta">開始まで: ${msToLabel(start - now)}</div>
      <div class="meta">開始: ${fmt.format(new Date(e.startAt))}</div>
    </article>`;
  }).join("") : `<div class="empty">直近の予定はありません。</div>`;
}

async function loadEvents() {
  const res = await fetch("./data/events.json", { cache: "no-store" });
  const json = await res.json();
  state.events = json.events || [];
  buildFilters(state.events);
  render();
}

els.refreshBtn.addEventListener("click", loadEvents);
els.mapFilter.addEventListener("change", render);
els.eventFilter.addEventListener("change", render);

loadEvents();
setInterval(render, 30_000);
