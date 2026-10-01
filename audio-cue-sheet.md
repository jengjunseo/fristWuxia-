# 오디오 큐 시트 — 《강호 첫걸음》

## 장면별 BGM

| 장면/ID | 실제 소스 | 재생/전환 |
|---|---|---|
| `ambient` — 시작·장터·일반 탐험·보상 후 | `assets/asianoriental2.ogg` — Tozan, CC0 1.0 | 첫 사용자 동작 뒤 재생. 안전 지역과 대화 후 기본 테마 |
| `battle` — 첫 강도전·중간 검객전 | `assets/remaster/samurai-battle.mp3` — Samurai Nights 전체 전투 곡 | 위협 컷신이 끝난 뒤 전투 시작. 두 일반 전투가 같은 큐를 공유 |
| `training` — 청운문 수련장 | `assets/remaster/samurai-final-erhu.mp3` — Samurai Nights ErHu 레이어 | 수련장 진입 시 전환 |
| `final` — 최종 대련장·엔딩 | `assets/remaster/samurai-final-base.mp3` — Samurai Nights Qin 레이어 | 최종 지역 진입과 결투 뒤 엔딩에 유지 |

큐 변경은 760ms 페이드다. 브라우저 자동재생 정책을 따르므로 첫 사용자 입력에서 재생을 시도하며 실패해도 게임 입력은 계속된다. 사용자는 상단 음표 버튼으로 BGM을 끌 수 있다. 별도 환경음·전용 중간보스 테마·별도 엔딩곡은 아직 없다. 최종 승리 뒤 음악을 끊고 정적을 삽입하는 연출도 아직 없다.

## 효과음

효과음은 외부 파일 대신 실제 Web Audio 합성으로 만든다. 유효 버튼에는 클릭/대화 진행음, 골목 컷신 진행에는 대사 진행음, 발검·공격·피격·방어·회피·무공·보상·최종 승리에 각각 다른 파형/음높이/길이를 연결했다. 피격/방어는 짧은 필터 잡음 타격음을 함께 합성한다. 피해/위험은 텍스트로도 제공한다.

현재 대사음은 문장 진행 버튼마다 한 번 재생한다. 글자 출력 중의 문자별 비프나 인물별 목소리, 별도 타이핑 스킵 기능은 없다. 배경음과 효과음만 분리 조절하며, 환경음/대사음/UI·전투음/마스터 개별 슬라이더는 구현되지 않았다.

## 출처 및 라이선스

- `Asianoriental2` — Tozan, OpenGameArt, CC0 1.0. [원본 페이지](https://opengameart.org/content/asianoriental2)
- `Samurai Nights` — Majadroid (Maik Hoffmann), OpenGameArt. 원 페이지에 CC-BY 4.0, CC-BY 3.0, OGA-BY 3.0이 선택 가능한 라이선스로 표시되어 있어 CC-BY 4.0 조건으로 사용하며 출처를 남긴다. 배포된 원본 zip 및 루프 파일은 `assets/remaster/samurai-nights-source.zip`, `assets/remaster/samurai-nights-source/`에 둔다. 게임 사용본은 전체 전투 데모, Qin, ErHu다. Dizi 레이어 파일은 있지만 현재 재생에 사용하지 않는다. [원본/라이선스 페이지](https://opengameart.org/content/samurai-nights)
- 제작자 표기: “Samurai Nights” by Majadroid (Maik Hoffmann), licensed CC-BY 4.0. 음악을 잘라/루프로 배치해 사용했다.

## 음량 저장

사용자 설정은 브라우저 `jianghu-first-steps-audio-v1`에 저장한다. 초기 기본값은 BGM 28%, 효과음 62%다. 기존 브라우저 저장 데이터는 초기화하지 않는다.
