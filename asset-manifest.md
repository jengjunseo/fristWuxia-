# 리마스터 자산 매니페스트

배포용 파일은 `assets/remaster/`, 생성 PNG 원본은 `assets/remaster/source/`에 있다. 생성 도구가 만든 배경 크기와 배포 크기를 구분해 적었다. 주요 리마스터 자산은 실제 런타임 코드에서 사용한다.

## 전용 배경

| 장면 | PC 배포 파일 | 모바일 배포 파일 | 생성 원본 | 실제 사용처 |
|---|---|---|---|---|
| 골목 | `assets/remaster/alley-wide.webp` · 1920×1080 | `assets/remaster/alley-mobile.webp` · 1080×1920 | 각 1672×941 / 941×1672 PNG | 장터 첫 위협·골목 탐험 배경 |
| 수련장 | `assets/remaster/training-wide.webp` · 1920×1080 | `assets/remaster/training-mobile.webp` · 1080×1920 | 각 1672×941 / 941×1672 PNG | 청운문 수련장 장면 |
| 최종 대련장 | `assets/remaster/final-wide.webp` · 1920×1080 | `assets/remaster/final-mobile.webp` · 1080×1920 | 각 1672×941 / 941×1672 PNG | 최종전과 천하제일인 엔딩 배경 |
| 북쪽 장터 | `assets/market-hero.png` · 1672×941 | 전용 세로 자산 없음 | 기존 생성 PNG | 시작 화면/장터 배경. 세로에서는 CSS `cover` 크롭 |

배경 PNG의 배포본은 지정 픽셀로 고품질 리사이즈한 것이지 네이티브 크기로 생성한 것이 아니다. 용량은 WebP 변환 결과를 기준으로 각각 alley PC/mobile 약 489/454 KB, training 약 619/581 KB, final 약 454/416 KB다.

## 전신 캐릭터

| 인물 | WebP 파일 | 원본과 배포 픽셀 | 사용처 |
|---|---|---|---|
| 나그네 | `assets/remaster/traveler-standing.webp` | 투명 PNG → WebP, 1024×1536 | 첫 골목 컷신/전투 |
| 강도 | `assets/remaster/bandit-standing.webp` | 투명 PNG → WebP, 1024×1536 | 첫 골목 컷신/전투 |
| 사부 청허 | `assets/remaster/mentor-standing.webp` | 투명 PNG → WebP, 1024×1536 | 비급 수련 장면 |
| 흰 옷 검객 | `assets/remaster/midboss-standing.webp` | 투명 PNG → WebP, 1024×1536 | 중간 결투 대면/전투 |
| 운해 검성 | `assets/remaster/grandmaster-standing.webp` | 투명 PNG → WebP, 1024×1536 | 최종 대면/전투/엔딩 |

원본 전신 PNG는 모두 `assets/remaster/source/`에 보존했다. 공격/피격 시 전신 애니메이션 변형을 위한 별도 포즈 파일은 없고, 전투 CSS 애니메이션을 사용한다.

## 기존 자산 유지

| 경로 | 크기 | 역할 |
|---|---:|---|
| `assets/locations-atlas.png` | 1448×1086 | 객잔·숲·표국·산채·의원 등 기존 지도/장소 아틀라스 |
| `assets/portraits-atlas.png` | 프로젝트 기존 생성 아틀라스 | 전용 전신이 없는 NPC 초상 |
| `assets/items-atlas.png` | 프로젝트 기존 생성 아틀라스 | 무기·영약 UI와 보상 카드 아이콘 |
| `assets/weapon-extras-atlas.png` | 프로젝트 기존 생성 아틀라스 | 추가 무기 아이콘 |
| `assets/market-hero.png` | 1672×941 | 북쪽 장터/시작 화면의 기존 생성 배경 |

새 독립 무기/영약 획득 일러스트는 없다. 인벤토리와 보상에는 기존 아이템 아틀라스의 타일을 계속 쓴다. 모든 기존 이미지/타일의 상세 좌표는 `assets/manifest.json`, 생성 프롬프트는 `ASSET_PROMPTS.md` 참고.
