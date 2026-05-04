# Applify YTM — Verification Report

**Build:** `dist/` 0.1.0 · **Last updated:** 2026-05-04 · **Reporter:** Claude (자동 검증)
**Repo:** https://github.com/JeongJaeSoon/applify-ytm

## 자동 검증 결과 요약

| Phase | 검증 항목 | 결과 |
|---|---|---|
| 0 | `pnpm install` | ✅ 107 packages, 2.4s |
| 0 | `pnpm run build` | ✅ 211ms, dist 34KB zip |
| 0 | `pnpm run check` (svelte-check) | ✅ 0 errors, 0 warnings |
| 0 | `dist/manifest.json` Manifest V3 유효성 | ✅ content_scripts, action, host_permissions, web_accessible_resources, lrclib.net 호스트 추가 |
| 1 | Shadow host 마운트 | ✅ `applify-shadow-host` 존재 |
| 1 | 컴포넌트 렌더링 | ✅ brand, np-grid, mini player, queue strip 모두 마운트 |
| 1 | sample track-01 데이터 표시 | ✅ "Hollow Light / The Long Distance / Aurora, Slow · 2024" |
| 1 | Lyrics 라인 수 | ✅ 21줄 (sample-tracks track-01 length 일치) |
| 1 | Noto Sans gothic 폰트 로드 | ✅ `font-family: "Noto Sans", "Noto Sans KR", "Noto Sans JP"...` |
| 1 | 재생 토글 → progress 진행 | ✅ 10초 후 `position: 0:10`, scrub fill 4.59% (= 10/218 ✓) |
| 1 | 가사 자동 스크롤 동기화 | ✅ 10초 시점 active line = "I was waiting at the edge of the morning" (t=9000) |
| 1 | Next 트랙 전환 | ✅ track-01 → track-02, 가사 라인 21→10 |
| 1 | 팔레트 cross-fade (CSS 변수 갱신) | ✅ `--bg-r,g,b = 12,60,70`, `--accent-r = 255` |
| 1 | Lyrics 토글 → split→centered collapse | ✅ `gridTemplateColumns: 568px 0px`, `maxWidth: 720px` |
| 2 | YTM `<video>` 자동 발견 + 양방향 sync | ✅ MutationObserver 후 timeupdate/play/pause/volumechange 모두 매핑 |
| 2 | rAF 60fps position ticker (synced lyrics 정확도) | ✅ play 중 `requestAnimationFrame` 폴링, paused 시 자동 정지 |
| 2 | Metadata 스크레이프 (제목/아티스트/아트워크) | ✅ 폴링 12회 × 150ms 로 collapsed-player race 해결 |
| 2 | 팔레트 추출 (background fetch 우회) | ✅ google CDN 아트워크 → `--bg-r,g,b` / `--accent-*` 갱신 |
| 2 | YTM 컨트롤 (play/prev/next/seek/volume) | ✅ DOM 클릭 어댑터 동작 |
| 2 | 셔플 / 반복 / 좋아요 sync (양방향) | ✅ click counter + private API + repeat 모드 (NONE/ALL/ONE) 직접 매핑 + like-status 속성 |
| 2 | Two-tier 가사 해상도 (YTM scrape → lrclib upgrade) | ✅ Tier 1 placeholder 즉시 표시, Tier 2 700ms × 10회 retry, `lyricsSynced` 단방향 false→true 보장 |
| 2 | LRC parser (lrclib.net) | ✅ strict GET + 검색 fallback, 같은 timestamp 중복 라인 처리 |
| 2 | Track-change 경합 차단 | ✅ `trackEpoch` 카운터 — 모든 비동기 경로에서 capture-and-compare |
| 2 | YTM 가사 placeholder UI 차별화 | ✅ untracked 모드: 작은 폰트, 차분한 색, 좌측 룰 제거, instrumental dots 숨김, 자유 스크롤 |
| 3 | Applify on/off 트랜지션 | ✅ ON→OFF: opacity 1→0, filter none→blur(8px), pointer-events none (350ms ease) |
| 3 | Extension context invalidated 가드 | ✅ `chrome.runtime?.id` alive-check, storage listener 안전 |
| 4 | 좌/우 컬럼 픽셀 정렬 | ✅ ResizeObserver → `--applify-cluster-h` 동적 갱신 → art top = wrap top, controls bottom = wrap bottom (양쪽 0px 오차) |
| 4 | Progress↔Transport 시각 결합 | ✅ Transport `margin-top: -10px` 로 timestamp 행과 약한 겹침 |
| 4 | 토글 시각 통일 (greyscale) | ✅ off=회색, on=흰색 — 액센트 색 의존 제거, 셔플 dot 우상단, repeat ALL 중앙 dot, ONE "1" 배지 |
| 4 | 한국어 lyric wrap orphan 방지 | ✅ `word-break: keep-all`, `text-wrap: balance` |
| 4 | dist zip 패키징 | ✅ `applify-ytm-0.1.0.zip` 34KB (5MB 제한 대비 0.7%) |

## 라이브 측정 (Chrome 자동화로 직접 측정)

YTM 페이지에서 `mcp__claude-in-chrome__javascript_tool` 로 Shadow DOM 측정한 결과 (창 높이 1074px 기준):

```
art:        top:185 bottom:593 height:408
controls:   top:750 bottom:869 height:119
lyrics-wrap:top:185 bottom:869 height:684   ← 동적으로 cluster (684) 와 일치
progress:   top:750 bottom:789
transport:  top:779 bottom:831              ← progress 와 -10px 겹침

artTopVsWrapTop          : 0   ✓
extrasBottomVsWrapBottom : 0   ✓
progressBottomToTransportTop : -10   ✓
```

`--applify-cluster-h: 684px` 가 `.np` 에 publish 됨 → `.lyrics-wrap` 이 동일 높이로 자동 설정.

## 빌드 산출물

```
dist/
├── manifest.json              1.19 KB
├── service-worker-loader.js   40 B
├── assets/
│   ├── main.ts.js             102 KB  ← content script (Svelte App + sync + palette + 2-tier lyrics)
│   └── service-worker.ts.js   304 B
└── icons/icon-{16,48,128}.png 68 B each (placeholder transparent PNG)
```

zip 패키지: `applify-ytm-0.1.0.zip` (34 KB, gzip 33 KB)

## 알려진 한계

- **아이콘**: 현재 1×1 투명 PNG placeholder. 배포 전에 실제 brand-mark conic-gradient 를 PNG 로 익스포트 필요.
- **Synced lyrics 가용성**: lrclib.net 에 데이터가 없는 곡은 untracked YTM placeholder 만 표시. (CC0 라이선스 데이터 한계.)
- **YTM Shuffle 상태 검출**: YTM 이 DOM 으로 셔플 상태를 노출하지 않아 클릭 카운터 + 비공식 internal `ytmusic-app.queue_.shuffleEnabled_` 폴백 사용. YTM 내부 변경 시 우리 모델이 일시적으로 어긋날 수 있음.
- **CORS**: googleusercontent 아트워크는 `crossOrigin="anonymous"` 로 직접 로드. 다른 CDN 으로 변경 시 background fetch 우회 필요.
- **YTM DOM 셀렉터**: YTM 이 클래스명을 회전시키면 `metadata.ts` / `ytm-controls.ts` / `lyrics-scraper.ts` 의 fallback chain 갱신 필요.
