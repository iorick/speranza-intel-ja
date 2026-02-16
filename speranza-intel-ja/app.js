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
  BIRD_CITY: "鳥の街",
  HUSK_GRAVEYARD: "残骸の墓場",
  HIDDEN_BUNKER: "隠しバンカー",
  LOCKED_GATE: "鍵のかかった門"
};

const els = {
  mapFilter: document.getElementById("mapFilter"),
  eventFilter: document.getElementById("eventFilter"),
  next24hOnly: document.getElementById("next24hOnly"),
  activeList: document.getElementById("activeList"),
  upcomingList: document.getElementById("upcomingList"),
  refreshBtn: document.getElementById("refreshBtn"),
  copyDiscordBtn: document.getElementById("copyDiscordBtn"),
  highlights: document.getElementById("highlights"),
  updatedAt: document.getElementById("updatedAt")
};

let state = { events: [], updatedAt: null };

const fmt = new Intl.DateTimeFormat("ja-JP", {
  month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  timeZone: "Asia/Tokyo"
});

function msToLabel(ms) {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function getNameMap(key){ return MAP_JA[key] || key; }
function getNameEvent(key){ return EVENT_JA[key] || key; }
function getMapClass(key){ return `map-${String(key || '').toLowerCase()}`; }

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

function applyTimeWindow(events, now) {
  if (!els.next24hOnly.checked) return events;
  const until = now + 24 * 60 * 60 * 1000;
  return events.filter(e => new Date(e.startAt).getTime() <= until);
}

function getNextSpecific(eventType, map, events, now) {
  return events
    .filter(e => e.eventType === eventType && e.map === map && new Date(e.startAt).getTime() > now)
    .sort((a,b)=> new Date(a.startAt)-new Date(b.startAt))[0] || null;
}

function renderHighlights(events, now) {
  const activeCount = events.filter(e => new Date(e.startAt) <= now && now < new Date(e.endAt)).length;
  const nextStellaNightRaid = getNextSpecific("NIGHT_RAID", "STELLA_MONTIS", events, now);
  const upcoming = events.filter(e => new Date(e.startAt).getTime() > now).sort((a,b)=>new Date(a.startAt)-new Date(b.startAt));

  const nextAny = upcoming[0];

  els.highlights.innerHTML = `
    <article class="highlightCard">
      <div class="kicker">現在開催中</div>
      <div class="value">${activeCount} 件</div>
    </article>
    <article class="highlightCard">
      <div class="kicker">次のステラ・モンティス夜襲</div>
      <div class="value">${nextStellaNightRaid ? `${fmt.format(new Date(nextStellaNightRaid.startAt))}（${msToLabel(new Date(nextStellaNightRaid.startAt).getTime() - now)}後）` : "予定なし"}</div>
    </article>
    <article class="highlightCard">
      <div class="kicker">次のイベント</div>
      <div class="value">${nextAny ? `${getNameEvent(nextAny.eventType)} / ${getNameMap(nextAny.map)}` : "予定なし"}</div>
    </article>
  `;
}

function render() {
  const now = Date.now();
  const filtered = applyTimeWindow(state.events.filter(matchesFilter), now);

  const active = filtered.filter(e => new Date(e.startAt).getTime() <= now && now < new Date(e.endAt).getTime());
  const upcoming = filtered.filter(e => new Date(e.startAt).getTime() > now).sort((a,b)=> new Date(a.startAt)-new Date(b.startAt));

  renderHighlights(filtered, now);

  els.activeList.innerHTML = active.length ? active.map(e => {
    const end = new Date(e.endAt).getTime();
    return `<article class="card activeCard ${getMapClass(e.map)}">
      <div class="badge active">開催中</div>
      <h3>${getNameEvent(e.eventType)} / ${getNameMap(e.map)}</h3>
      <div class="meta">終了まで: <span class="countdown">${msToLabel(end - now)}</span></div>
      <div class="meta">終了: ${fmt.format(new Date(e.endAt))}</div>
    </article>`;
  }).join("") : `<div class="empty">現在開催中のイベントはありません。</div>`;

  els.upcomingList.innerHTML = upcoming.length ? upcoming.map(e => {
    const start = new Date(e.startAt).getTime();
    return `<article class="card ${getMapClass(e.map)}">
      <div class="badge upcoming">開催予定</div>
      <h3>${getNameEvent(e.eventType)} / ${getNameMap(e.map)}</h3>
      <div class="meta">開始まで: <span class="countdown">${msToLabel(start - now)}</span></div>
      <div class="meta">開始: ${fmt.format(new Date(e.startAt))}</div>
    </article>`;
  }).join("") : `<div class="empty">直近の予定はありません。</div>`;

  els.updatedAt.textContent = state.updatedAt ? `最終更新: ${fmt.format(new Date(state.updatedAt))} JST` : "";
}

function copyDiscordText() {
  const now = Date.now();
  const upcoming = state.events
    .filter(matchesFilter)
    .filter(e => new Date(e.startAt).getTime() > now)
    .sort((a,b)=> new Date(a.startAt)-new Date(b.startAt))
    .slice(0, 5);

  const lines = ["【ARCイベント速報/JST】"];
  for (const e of upcoming) {
    lines.push(`- ${getNameEvent(e.eventType)} / ${getNameMap(e.map)}: ${fmt.format(new Date(e.startAt))}`);
  }
  const text = lines.join("\n");
  navigator.clipboard.writeText(text).then(() => {
    els.copyDiscordBtn.textContent = "コピー済み";
    setTimeout(() => (els.copyDiscordBtn.textContent = "Discord通知文をコピー"), 1500);
  });
}

async function loadEvents() {
  const res = await fetch("./data/events.json", { cache: "no-store" });
  const json = await res.json();
  state.events = json.events || [];
  state.updatedAt = json.updatedAt || new Date().toISOString();
  buildFilters(state.events);
  render();
}

els.refreshBtn.addEventListener("click", loadEvents);
els.copyDiscordBtn.addEventListener("click", copyDiscordText);
els.mapFilter.addEventListener("change", render);
els.eventFilter.addEventListener("change", render);
els.next24hOnly.addEventListener("change", render);

loadEvents();
setInterval(render, 1000);
