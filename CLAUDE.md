# UNBRIK — 작업 인수인계 (4.0 개발 중, 2026-10-10)

이 파일은 새 세션이 이어서 작업하도록 남긴 것입니다. **작업 전에 끝까지 읽고, 디자인 작업이면 아래 "디자인 작업 전에 볼 것"을 먼저 여십시오.**

## 0. 링크 (모두 사용자 소유 아티팩트, Artifact 도구 `read`로 엶)

| 무엇 | 링크 | 쓰임 |
|---|---|---|
| UNBRIK 4.0 기획서 (Docs) | https://claude.ai/artifact/5ozeH5NWTB9BTQ9nq5yhnY | 모든 결정의 기준. 특히 "섬 비주얼"(표·실루엣·**피할 것**), "디자인 방향"(관측소), "바다와 해안", "디자인 메모: 가라앉은 지형", "확정" 목록 |
| 4.0 개발 빌드 | https://claude.ai/artifact/LovxWagJxq8hr8qAmcDmKE | 새 빌드는 여기에 올림 (현재 v29) |
| 3.1 게임 | https://claude.ai/artifact/TuZxhvLHqJ9a3mRM1ypCJg | **건드리지 않음** |
| 프로젝트 관측소 시안 | https://claude.ai/artifact/PBtEijVXvp1rnQsVn781py | 관측소 레퍼런스 |
| AXIOM 섬 1 시안 | https://claude.ai/artifact/YNUECihdQqg9SYhExtM9gQ | 섬 표현 레퍼런스 |
| 저장소 | https://github.com/J8ZF/unbrik, 브랜치 `claude-4.0` | `main`은 건드리지 않음. 커밋하면 푸시 |

관측소 쪽 원문 요청·레퍼런스 이미지·반려 시안은 `docs/observatory-handoff/`(HANDOFF.md, requests/, ref/, rejected/)에 있습니다.

## 1. 사용자와 일하는 법

- 한국어 **존댓말**. 사용자는 음성 입력을 많이 써서 단어가 잘못 인식돼 옵니다 — 문맥으로 읽습니다.
- **확정된 것은 건드리지 않습니다**: 이름·표기(예: UPGRADE TREE, 섬 이름), 이미 승인된 디자인, 섬 1 그림(바이트 단위로 동일하게 유지). 게임 안 문구는 짧게, 이름은 지어내지 않습니다.
- 하지만 **요청받은 것은 프로젝트 맥락으로 끝까지 채웁니다.** "토끼를 만들어라"는 토끼 모양만 만들라는 게 아니라, 이 게임의 언어·이 섬의 색·기획서 원칙대로 만들라는 뜻입니다. 이전 세션 후반에는 이 둘을 혼동해 말씀을 글자 그대로만 구현하다가 크게 지적받았습니다(예: "섬이 바위 위에 있다" → 섬 둘레에 균일한 바위 띠 — 기획서 "피할 것"에 그대로 적힌 실수).
- 무엇을 추론해서 넣었는지는 보고에 한 줄씩 적어, 사용자가 바로 되돌릴 수 있게 합니다.
- 결과는 **스크린샷을 찍어 기준 작업물(섬 1, 하늘섬, 관측소) 옆에 놓고** 아래 디자인 원칙으로 확인한 뒤 올립니다. "검사 통과"는 확인이 아닙니다.
- 보고는 짧게, 결론 먼저. 아티팩트 링크는 붙이지 않아도 카드로 보입니다.

## 2. 디자인 원칙 (사용자가 여러 번 강조한 것)

- 위에서 내려다본 평면. 그림자·입체 흉내·로우폴리(면마다 명암 나눈 각진 도형) 금지.
- 이 게임의 "그림자"는 **층을 가르는 반투명 검정 테두리**입니다(폭 약 44, 불투명도 .5). 라인아트가 아닙니다. 하늘섬·관측소 도시·상층 링 실루엣 둘레에 씁니다.
- **색의 차이는 눈에 보여야 합니다.** 흰색에도 여러 겹, 회색에도 여러 색. 애매하게 조금씩 다른 톤은 의미가 없습니다. 꽉 찬 도형을 겹치고 양각·음각으로 디테일을 올리는 '아이콘화'. 트러스·X자 뼈대 금지.
- 정보량은 세밀한 디테일이 아니라 **실루엣 겹침**으로. 같은 작은 도형을 반복해 뿌리지 않습니다(환공포증·성능). 적고 크고 상징적인 오브젝트("시각화·기호화").
- **물속은 깊을수록 어둡고 투명하게** — 바다에 녹아들 만큼. 물에 잠긴 지형은 산이 잠긴 것처럼 바깥으로 갈수록 작아지고 깊어집니다. 관측소의 수중 구조물도 같은 규칙(위는 연한 회색, 물속 끝은 바다색 가까이).
- 섬 둘레를 같은 두께로 두르는 모래·바위·흰 선 금지. **큰 바위는 해안 일부 구간을 이루며 섬 윤곽 자체를 바꿉니다**(밝기가 분명히 다른 사각형을 크기·각도 제각각으로 겹침).
- 도는 부품은 이웃끼리 반대 방향으로.
- 섬마다 다른 섬과 구분되는 표현을 씁니다(섬 2 하와이, 섬 3 판타지 가을 숲 등).
- **생성기로 뿌리지 않습니다.** 사용자 지시: "알고리즘 생성기 만들어서 쉽게 할 생각 마세요, SVG 깎는 장인이라 생각하고 직접 하세요." 해저 등고선·암초·부속 섬·파편은 좌표를 하나하나 손으로 놓습니다(`seabed.mjs`, `satellites.mjs`). 작업 도면은 `node scripts/islands/sheet.mjs`로 뽑아 격자 좌표를 보며 그립니다. 사용자가 준 그림은 눈대중으로 옮기지 말고 픽셀을 재서 맞춥니다.
- **바다** (사용자가 여섯 번 넘게 요청한 것): 위에서 본 지도라 물속 높낮이가 비쳐야 함. 섬들을 이은 경계 A 안쪽은 아주 살짝 어두운 푸른색, 바깥은 검정. 섬 모양을 따르는 해저 등고선은 굉장히 반투명하게. 암초는 섬 1 근처 옅은 도형보다 살짝 진하고 섬 3 바깥 바위보다 연하게(화면에서 잰 값: 옅은 도형 Δ≈6–15, 암초 중·상단 Δ≈16–25, 섬 3 바위 Δ≈15–60). 색으로 꽉 채우거나 도형으로 도배하면 안 됨. 각 섬 둘레에는 작은 부속 섬·암초 파편이 세트로 있어야 하고, 나중에 환생 뒤 열리는 업그레이드를 그 부속 섬에서 연구함(카드 하나가 들어갈 크기).

## 3. 섬 상태

| 섬 | 테마 | 상태 |
|---|---|---|
| 1 | AXIOM 기본 | 확정. 그림 변경 금지 |
| 2 | 하와이(열대) | 라군, 갈색 현무암 화산(용암 흐름·테두리), 큰 꽃(분홍·빨강·노랑·흰색), 식물 세 크기, 선베드·파라솔. 랜드마크: 초가 마을, 현무암 판석 받침, 노드가 물에 잠긴 수영장 |
| 3 | 단풍(판타지 가을 숲) | v26 검토 대기. 동쪽 조각 22.5° 회전, 분홍빛 빨강 단풍·청록 덤불은 반투명 블롭을 사슬로 겹침(단풍은 조각 중심, 덤불은 가장자리), 자작나무 군락·쓰러진 자작나무, 흙빛 해안(유목 없음), 청회색 바위가 조각 왼쪽 위 해안을 이루고 물속으로 세 단계 가라앉음. 랜드마크는 관측소 언어(흰 2톤 + 청동 지붕): 도서관·물레방아·정자 |
| 4 | 고대 유적지(사막, 룬석) | 초안. 기획서 기준으로 다시 볼 것 |
| 5 | 이끼 낀 포스트 아포칼립스 도시 | 초안. 기획서 기준으로 다시 볼 것 |

## 4. 남은 일

- **바다·부속 섬**: 섬 1만 됨(v29, 사용자 검토 대기) — 등고선 3단 + 부속 섬 3개(북서·동·남서) + 암초. 검토가 끝나면 섬 2–5도 같은 방식으로 손으로 그림. 그 전까지 섬 2–5는 해안의 얕은 물 띠만 있음.

- 섬 3 v26 사용자 검토 반영. 이어서 섬 2·4·5를 기획서·하늘섬 기준으로 점검.
- 선택형(A/B) 노드 UI(쌍을 함께 표시, 고르지 않은 쪽 흐리게), 섬 2 선택형 쌍.
- 섬 4·5 콘텐츠 목록(약 300노드 이름·아이콘·효과) → 표로 먼저 보여 드리고 확정 뒤 배치. 휴양지 지도. 밸런스(섬 3 끝 약 2시간, 전체 약 15시간).
- **저장(클라우드)은 지금 하지 않음**: 시스템을 다 완성한 뒤 맨 마지막에 구글 계정 연동 + 프로필과 함께. 그 전까지는 아티팩트 뷰어가 브라우저 저장을 막는 날 데이터가 날아갈 수 있음 — 아래 명령으로 만렙 세이브를 만들어 드림.

## 5. 기술 메모

```sh
# 섬 그림 빌드 (dist/islands.js, dist/island-art.js, dist/observatory-art.js)
node scripts/islands/build-art.mjs           # 캐시된 지오메트리·트리 사용
node scripts/islands/build-art.mjs --geom    # 지오메트리 다시 (python3 + OpenCV)
node scripts/islands/build-art.mjs --tree    # 섬 2+ 노드 트리 다시 키움 (islandN.tree.json 삭제와 같음)

# 검사 10종 (전부 통과해야 함)
for c in check layout-check ui-check effects-check offline-check prestige-check balance-check motion-check notification-check weather-check; do node $c.mjs >/dev/null && echo "$c ok" || echo "$c FAIL"; done

# 로컬 서버 (명령 사이에 죽으면 다시)
cd dist && setsid nohup python3 -m http.server 8765 >/dev/null 2>&1 < /dev/null &

# 단일 파일 번들 → 개발 빌드 아티팩트에 publish
node scripts/bundle-single.mjs dist <scratchpad>/unbrik-4.0-dev.html

# 만렙 세이브 (설정 → SAVE DATA → 가져오기)
node -e "import('./dist/data.js').then(d=>{const s=d.defaultState();s.settings.purchaseCheat=true;for(const n of d.NODES)if(!d.choiceTaken(s,n))s.levels[n.id]=n.max;s.currencies.money='1e300';s.currencies.coin='1e300';s.savedAt=Date.now();d.validateSave(JSON.parse(JSON.stringify(s)));require('fs').writeFileSync('unbrik-save-max.json',JSON.stringify(s));})"
```

- 파이프라인: `scripts/islands/islandN.mjs`(DESIGN: outline·cracks·scale·origin·rotate·rockZones·sandBands·beach·terrain·tree·landmarks·extras) → `design.mjs loadDesign`(배율, split.py로 조각 자르기, 조각 회전) → `treegen.mjs`(노드 배치, islandN.tree.json 캐시) → `geom.py`(래스터로 모래·바위·해안선·물결·수심·가라앉은 바위, islandN.geom.json) → `themes.mjs`(섬별 팔레트·장식; 장식 항목 7번째 값 `'core'|'edge'`로 조각 중심/가장자리 지정) → `buildings.mjs`(랜드마크 KINDS·FOOTPRINT, 카드 위에 그리는 부분은 OVER) → `build-art.mjs`.
- 바다 바닥: `scripts/islands/seabed.mjs`(손으로 그린 BASIN·섬별 shelf/reefs/shallow, TONE) → `ISLAND_ART.seabed` → `island-view.js drawBed`(그림 층 아래의 화면 크기 캔버스, 카메라나 열린 섬이 바뀔 때만 다시 그림). 바닥이 그려진 섬은 그림에서 얕은 물 띠를 빼고 그 띠를 바닥 층의 옅은 막으로 그림. 예전 far/mid 띠는 모든 섬 그림에서 뺌(그리드 톤용 depth 데이터는 유지). 떠다니는 삼각형은 불투명 검정 대신 옅은 밝은 막.
- 부속 섬: `scripts/islands/satellites.mjs`(섬별 land·terrain·rockZones core·sandBands·fragments, 월드 좌표) → geom.py로 따로 추적(`islandN.sat.geom.json`, 입력이 바뀌면 자동으로 다시) → 섬마다 작은 그림 하나씩(`pictures[].sat`), 본섬과 함께 열림. 본섬 그림은 건드리지 않음.
- rockZones 옵션: `sunken:n`이면 가장 큰 블록들이 섬 바깥쪽으로 n단계 가라앉음(테마 `sunken` 색·불투명도). 테마 `rockRim:true`면 바위 덩어리에 검정 테두리.
- 게임: `dist/app.js`(UI), `dist/data.js`(상태·경제·저장), `dist/island-view.js`(섬 그림 타일·바다 캔버스·컷신 공개), `dist/observatory-view.js`, `dist/style.css`, `dist/index.html`. 섬은 이전 섬 마지막 노드를 사면 컷신과 함께 열림.
- 관측소 중앙(v28, 사용자 덧칠 그림을 픽셀로 재서 맞춤 — 눈대중으로 옮기지 말고 그림을 받으면 재서 확인할 것): 눈은 팔각형 세 단(검정 테 → 남색 단 → 검정 우물)이고 단 경계를 끊긴 링 둘이 반대로 돎(`index.html`의 `hubRingA/B`, `animateHub`가 dash offset을 옮김). 산책로 사이 여덟 칸 한가운데(반지름 300)에 검은 판 하나와 불 하나(그림은 `observatory.mjs`의 `deck()`), 불은 캔버스(`observatory-view.js deckLights`)가 그림 — 평소 하늘색, 환생 가능이면 분홍(`islandView.setReady`), 4.2초 주기로 천천히 깜빡임(애니메이션을 끄면 켜진 채 고정). 분홍 사각형 배지는 없앰. 칸마다 작은 블록·짧은 불을 더 넣었다가 요청에 없던 것이라 뺐음 — 그림에 없는 요소를 덧붙이지 말 것. 상단바 워드마크는 UNBRIK만, 글자 높이를 로고에 맞춤(`1cap` 단위; 설정의 UPGRADE TREE는 그대로).
- 확대 3단: 60% 이상이면 카드 위 이끼가 옅어짐, 9% 아래면 노드·링크를 숨기고 섬 제목을 섬 위/아래에 고정 크기로(설정 "축소 시 섬만 표시"). 자세히 보기(눈 버튼)는 인터페이스를 모두 숨김.
- 커밋 메시지는 한국어, 끝에 세션이 알려 주는 attribution 줄.
