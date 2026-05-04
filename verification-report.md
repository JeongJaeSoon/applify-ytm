# Applify YTM — Verification Report

**Build:** `dist/` 0.1.0 · **Date:** 2026-05-04 · **Reporter:** Claude (자동 검증)

## 자동 검증 결과 요약

| Phase | 검증 항목 | 결과 |
|---|---|---|
| 0 | `pnpm install` | ✅ 107 packages, 2.4s |
| 0 | `pnpm run build` | ✅ 168ms, dist 30KB zip |
| 0 | `pnpm run check` (svelte-check) | ✅ 0 errors, 0 warnings (204 files) |
| 0 | `dist/manifest.json` Manifest V3 유효성 | ✅ content_scripts, action, host_permissions, web_accessible_resources 모두 정상 |
| 1 | Shadow host 마운트 | ✅ `.applify-host` 존재 |
| 1 | 컴포넌트 렌더링 (brand, np grid, mini player, queue strip) | ✅ 모두 마운트 |
| 1 | sample track-01 데이터 표시 | ✅ "Hollow Light / The Long Distance / Aurora, Slow · 2024" |
| 1 | Lyrics 라인 수 | ✅ 21줄 (sample-tracks track-01 length 일치) |
| 1 | Noto Sans gothic 폰트 로드 | ✅ `font-family: "Noto Sans", "Noto Sans KR", "Noto Sans JP"...` |
| 1 | 재생 토글 → progress 진행 | ✅ 10초 후 `position: 0:10`, scrub fill 4.59% (= 10/218 ✓) |
| 1 | 가사 자동 스크롤 동기화 | ✅ 10초 시점 active line = "I was waiting at the edge of the morning" (t=9000) |
| 1 | Next 트랙 전환 | ✅ track-01 → track-02 ("Subtropic / Marina Reyes / Off-Season · 2023"), 가사 라인 21→10 |
| 1 | 팔레트 cross-fade (CSS 변수 갱신) | ✅ `--bg-r,g,b = 12,60,70`, `--accent-r = 255` (track-02 palette 정확 일치) |
| 1 | Lyrics 토글 → split→centered collapse | ✅ `gridTemplateColumns: 568px 0px`, `maxWidth: 720px` |
| 3 | Applify on/off 트랜지션 | ✅ ON→OFF: opacity 1→0, filter none→blur(8px), pointer-events none (350ms ease) |
| 4 | dist zip 패키징 | ✅ `applify-ytm-0.1.0.zip` 30KB (5MB 제한 대비 0.6%) |

## 미완료 검증 (사용자 협조 필요)

다음 항목은 **실제 YouTube Music 페이지에서의 라이브 검증**이 필요하며, Chrome 익스텐션을 한 번 로드한 후 자동으로 진행됩니다.

### 사용자 1회 액션
1. Chrome 에서 `chrome://extensions` 열기
2. 우상단 **"개발자 모드"** 토글 ON
3. **"압축해제된 확장 프로그램을 로드합니다"** 클릭
4. `/Users/dev-soon/workspace/temp/applify-ytm/dist/` 디렉토리 선택
5. 익스텐션이 로드되면 알려주세요. 이후 다음을 자동 검증합니다:
   - `music.youtube.com` 방문 → Shadow host 마운트, 콘솔에 `[Applify] mounted`
   - 곡 재생 → `playerState.position` 이 YTM `<video>.currentTime` 와 ±100ms 이내 동기화 (1초 간격 5회)
   - 곡 메타데이터(제목/아티스트/앨범) DOM 스크레이프 정확도
   - 우리 transport 버튼 클릭 → YTM 의 `<video>.src` 가 변경됨
   - 아트워크 → palette CSS 변수 자동 추출
   - 곡 사이의 SPA 네비게이션 시 재바인딩
   - 광고 재생 시 "Ad playing" 토스트
   - 툴바 액션 클릭 → Applify on/off 토글

## 빌드 산출물

```
dist/
├── manifest.json              1.16 KB
├── service-worker-loader.js   40 B
├── assets/
│   ├── main.ts.js             84 KB  ← content script (Svelte App + sync engine + palette + lyrics)
│   └── service-worker.ts.js   304 B
└── icons/icon-{16,48,128}.png 68 B each (placeholder transparent PNG)
```

zip 패키지: `applify-ytm-0.1.0.zip` (30 KB)

## 알려진 한계

- **아이콘**: 현재 1×1 투명 PNG placeholder. 배포 전에 실제 brand-mark conic-gradient 를 PNG 로 익스포트 필요.
- **Synced lyrics**: YTM 은 timed lyrics 데이터를 DOM 으로 노출하지 않으므로, 본 구현은 정적 가사를 곡 길이에 균등 분포시킴. 실제 timed sync 가 필요하면 YouTube InnerTube API 호출이 별도로 필요 (Phase 5+).
- **CORS**: googleusercontent 아트워크는 `crossOrigin="anonymous"` 로 직접 로드 가능. 다른 CDN 으로 변경 시 background fetch 우회 필요.
- **YTM DOM 셀렉터**: YTM 이 클래스명을 회전시키면 `metadata.ts` / `ytm-controls.ts` 의 fallback chain 갱신 필요.
