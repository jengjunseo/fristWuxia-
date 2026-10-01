# AI 이미지 제작 기록 — 《강호 첫걸음》

이미지 생성은 내장 `image_gen` 도구로 진행했다. 외부 이미지나 기존 작품의 그림은 쓰지 않았다. 게임은 아래 아틀라스의 각 칸을 CSS sprite crop으로 표시하므로, 인물·장소·아이템을 서로 다른 그림으로 보여 준다. 파일별 사용 위치와 타일 좌표는 `assets/manifest.json`에 있다.

## 공통 스타일 프롬프트

> Original beginner-friendly wuxia text RPG assets. Refined traditional Chinese ink-and-light-watercolor game illustration, restrained muted mineral pigments, delicate brush texture and soft paper grain, readable shapes at small display sizes, historically plausible classical Chinese clothing and architecture, inviting and calm rather than threatening. Original designs only; no existing franchise characters, no external references, no lettering, no logo, no watermark.

## 생성한 원본 파일

| 파일 | 내용 | 실제 생성 |
|---|---|---|
| `assets/locations-atlas.png` | 4×2 장소 그림 8칸 | 예 |
| `assets/portraits-atlas.png` | 5×2 주요 NPC 초상 10칸 | 예 |
| `assets/items-atlas.png` | 4×4 무기·영약 그림 14칸과 빈 칸 2개 | 예 |
| `assets/weapon-extras-atlas.png` | 추가 무기 아이콘 2칸 | 예 |
| `assets/market-hero.png` | 장터 가로 배경 | 예 |
| `assets/portrait-traveler.png` | 이름 입력형 주인공 초상 | 예 |

총 6개의 생성 PNG에 게임에서 사용하는 서로 다른 AI 그림 36개가 들어 있다: 장소 8, 주요 인물 10, 주인공 1, 무기 8, 방어구 2, 영약 6, 장터 히어로 1. 타일을 36개의 개별 PNG 파일로 잘라 복제하지 않고, 브라우저에서 원본 생성 시트의 타일만 표시한다.

## 타일별 명세

모든 장소는 `locations-atlas.png`에 4열×2행, 인물은 `portraits-atlas.png`에 5열×2행, 아이템은 `items-atlas.png`에 4열×4행으로 생성했다. 각 행은 왼쪽에서 오른쪽 순서다.

### 장소 — `locations-atlas.png`

생성 프롬프트: “Create exactly eight equal landscape panels in a clean 4×2 grid, separated by plain ivory gutters; consistent Chinese ink and light watercolor. (1) lively welcoming ancient market at late afternoon; (2) warm wooden inn interior; (3) rain-wet old-town alley; (4) forest trail, small shrine and mist; (5) escort agency courtyard with wagons; (6) readable mountain stockade above a river; (7) medicine clinic courtyard with herb racks; (8) martial sect training courtyard, pines and distant peak. No focal portraits or text.”

| asset-id | 칸 | 게임 사용 위치 | 개별 장면 명세 |
|---|---:|---|---|
| `loc-market` | 1행 1열 | 북쪽 장터 지도·장면 | 해질녘 장터, 노점과 기와지붕 |
| `loc-inn` | 1행 2열 | 솔바람 객잔 지도·장면 | 나무 객잔 내부, 등불과 식탁 |
| `loc-alley` | 1행 3열 | 낡은 뒷골목 지도·장면 | 비에 젖은 옛 골목과 반사된 등불 |
| `loc-forest` | 1행 4열 | 청석 숲길 지도·장면 | 작은 사당과 산안개가 있는 숲길 |
| `loc-escort` | 2행 1열 | 백운 표국 지도·장면 | 마차와 표기가 놓인 표국 마당 |
| `loc-stockade` | 2행 2열 | 검은솔 산채 지도·장면 | 강 위 산비탈의 산채와 망루 |
| `loc-clinic` | 2행 3열 | 혜민 의원 지도·장면 | 약초 선반이 있는 조용한 의원 뜰 |
| `loc-sect` | 2행 4열 | 청운문 지도·장면 | 소나무와 산을 배경으로 한 수련장 |

### 주요 인물 — `portraits-atlas.png`

생성 프롬프트: “Create ten distinct centered chest-up portraits in a clean 5×2 grid with clear ivory gutters; same ink-and-watercolor wuxia art style; faces and props safely inside each tile. Row 1: (1) kind middle-aged innkeeper in green-brown apron; (2) stern older swordsman mentor in indigo; (3) cheerful young female disciple with red ribbon; (4) proud young rival in dark red; (5) calm traveling escort guard in weathered blue. Row 2: (6) gentle teal-robed physician with herb sprig; (7) sharp merchant woman in ochre with coins; (8) playful flute street performer in green; (9) gaunt non-graphic bandit chief with scar and patched brown clothes; (10) enigmatic white-haired wandering master in plain white. No lettering.”

| asset-id | 칸 | 게임 사용 인물 | 개별 인물 명세 |
|---|---:|---|---|
| `npc-innkeeper` | 1행 1열 | 만복 | 앞치마를 두른 친절한 중년 객잔 주인 |
| `npc-mentor` | 1행 2열 | 청허 | 남색 도포를 입은 무뚝뚝한 노검객 |
| `npc-disciple` | 1행 3열 | 소연 | 붉은 머리끈을 맨 활달한 젊은 동문 |
| `npc-rival` | 1행 4열 | 진우 | 어두운 붉은 옷의 자부심 강한 경쟁자 |
| `npc-escort` | 1행 5열 | 도강 | 낡은 푸른 옷을 입은 차분한 표사 |
| `npc-physician` | 2행 1열 | 류씨 의원 | 약초를 든 청록색 옷차림의 의원 |
| `npc-merchant` | 2행 2열 | 백란 | 동전을 살피는 황토색 옷의 상인 |
| `npc-performer` | 2행 3열 | 아루 | 피리를 든 장난기 많은 거리 공연자 |
| `npc-bandit` | 2행 4열 | 곽철 | 흉터와 해진 옷이 있는 산채 두목 |
| `npc-wanderer` | 2행 5열 | 백발의 길손 | 소박한 흰옷의 수수께끼 같은 고수 |
| `player-traveler` | 단독 이미지 | 커스텀 이름 주인공 | 창백한 청회색 여행복의 젊은 초심자 |

### 무기 6종·방어구 2종·영약 6종 — `items-atlas.png`

생성 프롬프트: “Create exactly 16 individual centered icon cells in a clean 4×4 grid on warm ivory, generous safe margins, no labels. Row 1: straight beginner iron jian, jade-inlaid refined jian, wooden practice sword, cloth-wrapped iron gauntlets. Row 2: green bamboo staff, dark curved saber, leather bracer, travel cloak. Row 3: red herbal medicine bottle, blue porcelain qi pill bottle, golden ginseng root, pale green healing pill in a dish. Row 4: tied herb bundle, amber antidote vial, two blank ivory cells. Each item isolated, readable small, in traditional Chinese ink and watercolor style.”

| asset-id | 칸 | 게임 사용 위치 | 게임 효과 |
|---|---:|---|---|
| `weapon-iron-jian` | 1행 1열 | 장비·가게 | 공격 +3 |
| `weapon-jade-jian` | 1행 2열 | 장비·가게 | 공격 +5 |
| `weapon-practice-sword` | 1행 3열 | 첫 보상·장비·가게 | 공격 +2 |
| `weapon-iron-gauntlets` | 1행 4열 | 첫 보상·장비·가게 | 공격 +2, 방어 +1 |
| `weapon-bamboo-staff` | 2행 1열 | 장비·가게 | 공격 +3 |
| `weapon-curved-saber` | 2행 2열 | 장비·가게 | 공격 +4 |
| `armor-leather-bracer` | 2행 3열 | 방어구·가게 | 방어 +2 |
| `armor-travel-cloak` | 2행 4열 | 방어구·가게 | 방어 +1 |
| `elixir-red-herb` | 3행 1열 | 가방·가게 | 체력 +18 |
| `elixir-qi-pill` | 3행 2열 | 가방·가게 | 내공 +14 |
| `elixir-ginseng` | 3행 3열 | 가방·가게 | 체력 +24 |
| `elixir-healing-pill` | 3행 4열 | 가방·가게·의원 | 체력 +14, 내공 +4 |
| `elixir-herb-bundle` | 4행 1열 | 가방·사건 보상·가게 | 체력 +10 |
| `elixir-antidote` | 4행 2열 | 가방·가게 | 체력 +10, 내공 +8 |

### 별도 배경과 주인공

- `market-hero.png`: “Wide cinematic late-afternoon ancient Chinese market street, welcoming stalls, warm lanterns, distant mountains, ink-and-light-watercolor, quiet first-adventure mood, calm foreground for UI overlay, no focal portrait, no text.” 시작 화면과 첫 장면에 사용한다.
- `portrait-traveler.png`: “Chest-up portrait of a gender-neutral young adult newcomer in a plain pale blue-gray travel robe, practically tied black hair, curious slightly bewildered expression, approachable and resilient, muted Chinese ink-and-watercolor style, ivory background, centered, no weapons or lettering.” 전투 화면의 주인공 초상으로 사용한다.

### 추가 무기 — `weapon-extras-atlas.png`

생성 프롬프트: “Create two isolated original wuxia weapon icons in two equal square ivory panels side-by-side, in the same Chinese ink-and-watercolor style. Left: a matched set of three slim leaf-shaped iron throwing darts bound with dark blue silk cord and a red tassel. Right: one long traditional spear with a dark green bamboo shaft, steel leaf head and pale silk tassel. Distinguish the small throwing weapons from the single long spear. No hands, lettering or watermark.”

| asset-id | 칸 | 아이템 | 게임 효과 |
|---|---:|---|---|
| `weapon-flying-darts` | 1행 1열 | 비엽 투척침 | 공격 +2 |
| `weapon-long-spear` | 1행 2열 | 청죽 장창 | 공격 +4 |

실제 사용 현황은 `assets/manifest.json`에서 확인할 수 있다. 이 매니페스트는 각 타일의 `asset-id`, 용도, 원본 경로, 생성 여부, 행·열 좌표를 기록한다.
