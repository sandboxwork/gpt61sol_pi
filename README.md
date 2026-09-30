# π — A motion study

HTML, CSS, SVG, Canvas, ES modules만 사용한 16:9 한국어 모션그래픽. 생성된 Fish Audio 음성(62.46초)과 실제 단어 타임스탬프가 포함되어 있어 API 호출 없이 바로 감상할 수 있습니다.

## 실행

Node.js 22 이상. 외부 npm 패키지가 필요하지 않습니다.

```sh
npm run build
npm run dev
```

브라우저에서 http://localhost:4173 을 엽니다. `file://`로 직접 열면 JSON 및 ES module 접근이 제한되므로 HTTP 서버를 사용하세요.

## 음성 다시 생성

```sh
cp .env.example .env
# .env에서 FISH_API_KEY 설정
npm run generate
npm test
npm run build
```

키는 로컬 생성 스크립트의 환경 변수에서만 읽습니다. `.env`는 Git 및 배포/다운로드 산출물에 포함되지 않습니다. 브라우저에는 키가 전달되지 않습니다. `FISH_REFERENCE_ID`를 지정하면 원하는 한국어 보이스 모델로 전체 내레이션을 재생성할 수 있습니다. 기본 모델은 `s2.1-pro`이며, 음성 ID는 `1dbd0d4b31694369b9b4c9eca6e8f24a`입니다. 내레이션은 `src/narration.json`에서 수정합니다.

## Fish Audio API

2026-09-30 공식 OpenAPI 확인: https://docs.fish.audio/api-reference/openapi.json

- `POST https://api.fish.audio/v1/tts/stream/with-timestamp`
- `Authorization: Bearer $FISH_API_KEY`, `model: s2.1-pro`
- `format: pcm`, `sample_rate: 44100`
- SSE의 모든 `audio_base64`는 도착 순서대로 합칩니다.
- `alignment`는 `chunk_seq`별 누적 스냅샷으로 교체합니다.
- 절대 발화 시간 = 발화 파일의 PCM 샘플 오프셋 + `chunk_audio_offset_sec` + `segment.start/end`.
- 각 발화를 생성한 후 정확한 샘플 수로 이어 붙여 하나의 PCM WAV를 만듭니다. MP3 인코더 지연이나 여러 audio 요소 사이의 전환 오차를 피합니다.
- 정렬 응답이 없는 경우 장면 경계는 실제 PCM 샘플 길이로 기록됩니다. 현재 포함된 결과는 6장면 모두 실제 API 타임스탬프입니다.
- 인증/잔액/서버 오류, timeout, 빈 오디오, 손상된 PCM을 오류로 처리합니다. 실패하면 기존 결과를 덮어쓰지 않습니다.

## 타임라인

`audio.currentTime`만 master clock으로 사용합니다. `requestAnimationFrame`은 화면을 다시 그리는 용도이며 자체 시계로 사용하지 않습니다. 모든 위치·알파·텍스트·mask·회전·파동·입자는 현재 음성 시각의 순수 함수입니다. setTimeout, CSS animation, CSS transition, 누적 physics 및 독립 시계는 없습니다. pause/seek/replay 후 바로 동일한 프레임을 재구성합니다. 단어 타임스탬프에서 '펼치', '십이각형', '구십육각형', '일사일오구', '높이', '원으로' 등의 의미 단서를 찾아 모션 구간을 계산합니다.

`src/timeline.js`: 순수 타임라인/기하 함수.
`src/app.js`: SVG morph, Canvas, 단어 강조 자막, 플레이어 이벤트.
`public/media/timeline.json`: 191개 실제 발화 구간 및 6장면.
`public/media/narration.wav`: 한국어 내레이션, 44.1kHz/16bit/mono.

## 플레이어

재생/일시정지, Replay, Progress seek, 6장면 바로 이동, 자막, 음소거, Fullscreen. Space: 재생, ←/→: 5초 이동, R: Replay, C: 자막, M: 음소거, F: Fullscreen. 모바일에서는 16:9 화면과 3열 장면 목록으로 구성합니다. Fullscreen API 미지원 브라우저에서는 상태 메시지를 표시합니다.

## 검증

```sh
npm test
```

WAV 실제 샘플 길이와 타임라인 일치, 실제 타임스탬프 범위, 역방향 seek/replay 결정성, 모든 장면 경계에서 morph 연속성을 검사합니다. JavaScript 문법 및 build 검사도 수행했습니다. 이 환경에서는 브라우저 시각 QA를 수행하지 못했습니다.

## 배포

`dist/`를 정적 호스팅에 업로드하세요. build는 `src`와 `public`만 복사합니다. 키와 생성 스크립트는 배포 파일에 포함되지 않습니다. 기존 내레이션을 재생할 때 API 비용은 발생하지 않습니다.

### GitHub Pages

- 사이트: https://sandboxwork.github.io/gpt61sol_pi/
- 저장소: https://github.com/sandboxwork/gpt61sol_pi
- `main` 브랜치에 push하면 `.github/workflows/pages.yml`이 Node.js 24에서 테스트와 빌드를 실행하고 `dist/`를 배포합니다.
- 저장소의 **Settings → Pages → Build and deployment → Source**는 **GitHub Actions**를 사용합니다.
- **Actions → Deploy to GitHub Pages → Run workflow**로 수동 재배포할 수 있습니다.

외부 npm 의존성이 없어 설치 단계는 필요하지 않습니다. 배포는 GitHub Actions의 기본 토큰을 사용하므로 PAT나 Fish Audio API 키를 저장소 Secrets에 등록할 필요가 없습니다. HTML, JavaScript 및 음성 파일은 상대 경로로 연결되어 `/gpt61sol_pi/`에서도 동작합니다.
