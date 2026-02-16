# Speranza Intel 日本語版（非公式）

ARC Raiders のマップイベント通知サイトを日本語で見やすくした簡易版です。

## 構成

- `index.html` : 画面
- `styles.css` : スタイル
- `app.js` : イベント描画・カウントダウン
- `data/events.json` : サンプルイベントデータ（JST）

## 使い方

```bash
cd speranza-intel-ja
python3 -m http.server 8080
# http://localhost:8080 を開く
```

## 仕様

- JSTで「開催中 / 開始まで」を表示
- マップ/イベント名でフィルタ
- 30秒ごとに画面更新

## データ更新

`data/events.json` の `events` 配列を更新してください。

```json
{
  "id": "evt-001",
  "eventType": "NIGHT_RAID",
  "map": "STELLA_MONTIS",
  "startAt": "2026-02-16T18:30:00+09:00",
  "endAt": "2026-02-16T19:00:00+09:00"
}
```

## 補足

本家サイトの完全コピーではなく、日本語運用向けに最小機能へ再構成した v1 です。
