#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const SOURCE_URL = "https://speranzaintel.com/";
const OUT_PATH = path.resolve(process.cwd(), "data/events.json");

function toKey(text = "") {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/ /g, "_");
}

function isoFromMs(ms) {
  return new Date(Number(ms)).toISOString();
}

function normalizeToCurrentCycle(startMsRaw, endMsRaw, nowMs) {
  const dayMs = 24 * 60 * 60 * 1000;
  const anchorStart = Number(startMsRaw);
  const anchorEnd = Number(endMsRaw);
  const duration = Math.max(1, anchorEnd - anchorStart);

  let k = Math.floor((nowMs - anchorStart) / dayMs);
  if (nowMs < anchorStart) k = 0;

  let start = anchorStart + k * dayMs;
  let end = start + duration;

  // keep an active window if currently active; otherwise move to next window
  if (nowMs >= end) {
    start += dayMs;
    end += dayMs;
  }

  return { start, end };
}

function extractAttr(block, name) {
  const re = new RegExp(`${name}="([^"]+)"`);
  const m = block.match(re);
  return m ? m[1] : null;
}

function extractText(block, re) {
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

async function main() {
  const res = await fetch(SOURCE_URL, {
    headers: {
      "user-agent": "Mozilla/5.0 (OpenClaw sync script)",
      accept: "text/html,application/xhtml+xml"
    }
  });

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const cardBlocks = html.match(/<div class="event-card[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g) || [];

  const seen = new Set();
  const events = [];

  const nowMs = Date.now();

  for (const block of cardBlocks) {
    const idRaw = extractAttr(block, "data-id");
    const startMsRaw = extractAttr(block, "data-start-ms");
    const endMsRaw = extractAttr(block, "data-end-ms");
    const mapRaw = extractAttr(block, "data-map") || extractText(block, /<p[^>]*>([^<]+)<\/p>/i);
    const eventRaw = extractText(block, /<h4[^>]*>([^<]+)<\/h4>/i);

    if (!idRaw || !startMsRaw || !endMsRaw || !mapRaw || !eventRaw) continue;

    const { start, end } = normalizeToCurrentCycle(startMsRaw, endMsRaw, nowMs);
    const map = toKey(mapRaw);
    const eventType = toKey(eventRaw);

    // dedupe by logical slot so repeated DOM rows collapse
    const key = [eventType, map, start, end].join("|");
    if (seen.has(key)) continue;
    seen.add(key);

    events.push({
      id: `speranza-${idRaw}-${start}`,
      eventType,
      map,
      startAt: isoFromMs(start),
      endAt: isoFromMs(end)
    });
  }

  events.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

  const out = {
    updatedAt: new Date().toISOString(),
    source: SOURCE_URL,
    count: events.length,
    events
  };

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(out, null, 2) + "\n", "utf8");

  console.log(`Synced ${events.length} events to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error("sync-from-speranza failed:", err.message);
  process.exit(1);
});
