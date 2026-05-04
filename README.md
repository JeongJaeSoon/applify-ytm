# Applify YTM

Glassy music-player overlay for YouTube Music — synced lyrics, dynamic color from artwork.

## Stack

Svelte 5 (runes) · Tailwind v4 · Vite 8 · CRXJS 2 · Manifest V3 · Shadow DOM (CSS isolation)

## 디렉토리 구조

```
src/
  content/     # YTM 페이지에 주입되는 content script
    main.ts            # 진입점 — Shadow DOM mount + Svelte App
    sync.ts            # YTM <video> ⇄ playerState 양방향 브리지
    metadata.ts        # 곡 정보 DOM 스크레이프
    ytm-controls.ts    # play/next/prev 버튼 어댑터
    palette.ts         # 아트워크에서 dominant/accent RGB 추출
    lyrics-scraper.ts  # 가사 셸 파싱 → 균등 타임스탬프 분포
  background/
    service-worker.ts  # 툴바 액션 → applifyOn 토글 (chrome.storage.local)
  lib/
    stores.svelte.ts   # Svelte 5 룬 기반 reactive store
    types.ts           # Track / LyricLine / Palette
    format.ts          # fmtTime
  components/
    App.svelte / Stage.svelte / NowPlaying.svelte / ...
  styles/
    app.css            # 글래스/마스크/keyframes (Tailwind 외)
    tokens.css         # CSS 변수 (--bg-r/g/b, --accent-*)
  dev/
    sample-tracks.ts   # 프리뷰 픽스처
    preview.ts         # standalone 프리뷰 진입점
```

## 사용

### 개발

```bash
pnpm install
pnpm dev           # CRXJS 모드 — dist/ 를 unpacked extension 으로 로드
pnpm dev:preview   # 프리뷰 모드 — http://localhost:5180 에서 단독 페이지로 확인
```

### 익스텐션 로드 (개발 / 검증용)

1. Chrome 에서 `chrome://extensions` 열기
2. 우상단 "개발자 모드" 토글 ON
3. "압축해제된 확장 프로그램을 로드합니다" → `dist/` 선택
4. `music.youtube.com` 방문 → 우리 UI 가 YTM 위에 오버레이됨

### 빌드 / 패키징

```bash
pnpm build         # → dist/
zip -rq applify-ytm-0.1.0.zip dist/
```

### 품질 게이트

```bash
pnpm check         # svelte-check (타입 + a11y)
```

## 디자인 의도

자세한 시각/UX 의도는 `/Users/dev-soon/workspace/temp/design_pkg/applify-tm/chats/chat1.md` (디자인 핸드오프 챗 트랜스크립트) 참조.

핵심 결정:
- **다크 전용** — 색 추출이 배경 변화를 담당하므로 라이트/다크 토글 불필요
- **Noto Sans 고딕** — 다국어 가사 (한국어 / 일본어) 자연스러운 폴백
- **Split → centered 부드러운 전환** — 가사 토글 시 grid `1fr 0fr` 트랜지션
- **3-section 좌측 컬럼** — artwork (44px gap) → meta (32px gap) → controls. 아트워크 그림자가 시각적으로 아래 공간을 침범하므로 첫 갭이 더 넓음.

## 검증 리포트

`verification-report.md` 참조.
