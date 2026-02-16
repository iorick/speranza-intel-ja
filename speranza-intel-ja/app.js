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
  LOCKED_GATE: "鍵のかかった門",
  LAUNCH_TOWER_LOOT: "発射塔の物資",
  PROSPECTING_PROBES: "探査プローブ"
};

const els = {
  activeList: document.getElementById("activeList"),
  upcomingList: document.getElementById("upcomingList"),
  updatedAt: document.getElementById("updatedAt")
};

let state = { events: [], updatedAt: null };

const fmt = new Intl.DateTimeFormat("ja-JP", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Tokyo"
});

function msToLabel(ms) {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function getNameMap(key) {
  return MAP_JA[key] || key;
}
function getNameEvent(key) {
  return EVENT_JA[key] || key;
}
function getMapClass(key) {
  return `map-${String(key || "").toLowerCase()}`;
}
function getEventClass(key) {
  return `event-${String(key || "").toLowerCase()}`;
}

function render() {
  const now = Date.now();
  const events = state.events;

  const active = events.filter(
    (e) => new Date(e.startAt).getTime() <= now && now < new Date(e.endAt).getTime()
  );
  const upcoming = events
    .filter((e) => new Date(e.startAt).getTime() > now)
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

  els.activeList.innerHTML = active.length
    ? active
        .map((e) => {
          const end = new Date(e.endAt).getTime();
          return `<article class="card activeCard ${getMapClass(e.map)} ${getEventClass(e.eventType)}">
      <div class="badge active">開催中</div>
      <h3>${getNameEvent(e.eventType)} / ${getNameMap(e.map)}</h3>
      <div class="meta">終了まで: <span class="countdown">${msToLabel(end - now)}</span></div>
      <div class="meta">終了: ${fmt.format(new Date(e.endAt))}</div>
    </article>`;
        })
        .join("")
    : `<div class="empty">現在開催中のイベントはありません。</div>`;

  els.upcomingList.innerHTML = upcoming.length
    ? upcoming
        .map((e) => {
          const start = new Date(e.startAt).getTime();
          return `<article class="card ${getMapClass(e.map)} ${getEventClass(e.eventType)}">
      <div class="badge upcoming">開催予定</div>
      <h3>${getNameEvent(e.eventType)} / ${getNameMap(e.map)}</h3>
      <div class="meta">開始まで: <span class="countdown">${msToLabel(start - now)}</span></div>
      <div class="meta">開始: ${fmt.format(new Date(e.startAt))}</div>
    </article>`;
        })
        .join("")
    : `<div class="empty">直近の予定はありません。</div>`;

  els.updatedAt.textContent = state.updatedAt
    ? `最終更新: ${fmt.format(new Date(state.updatedAt))} JST`
    : "";
}

async function loadEvents() {
  const res = await fetch("./data/events.json", { cache: "no-store" });
  const json = await res.json();
  state.events = json.events || [];
  state.updatedAt = json.updatedAt || new Date().toISOString();
  render();
}

loadEvents();
setInterval(render, 1000);
