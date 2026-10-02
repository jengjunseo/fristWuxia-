# 2.0 새 삽화 제작 기록

2026-10-01, Codex 내장 Image Gen으로 프로젝트를 위해 새로 생성했습니다. 외부 사진이나 만화의 인물을 참조하지 않았습니다. PNG 원본에서 종횡비를 유지해 최대 1920×1080 WebP로 압축했습니다.

- `assets/vn/office.webp`: 야근 중인 평범한 회사원, 현대 사무실.
- `assets/vn/crossing.webp`: 비 오는 횡단보도와 트럭, 충돌 직전.
- `assets/vn/awakening.webp`: 강호에서 깨어난 주인공과 노인 만복.
- `assets/vn/mountain.webp`: 산과 강, 타이틀과 수련 장면.
- `assets/vn/caravan.webp`: 안개 낀 숲의 양곡 호송대.
- `assets/vn/duel.webp`: 구름 위 비무대의 마지막 승부.
- `assets/vn/alley.webp`: 목검을 든 주인공과 골목의 강도.

아이콘은 `icons.js`에 작성한 SVG 선화입니다. 검·방패·경공·내공·보따리·지도·두루마리·인물·인장·음악·메뉴·퇴각을 구분합니다. 기존 아이템·인물 아틀라스와 전투 전신 에셋은 가방·인물 메뉴와 전투에 사용합니다.

## 생성 프롬프트

### office

Use case: illustration-story. Production background CG for a Korean wuxia reincarnation visual novel. Premium hand-painted anime/manhwa illustration, crisp expressive linework with rich painterly scenery, cinematic layered light, indigo night shadows, warm copper highlights and restrained crimson. Wide 16:9 composition, 1920x1080 feel, visually detailed but lower quarter kept simple for dialogue overlay. No text, letters, captions, logos, watermarks, or UI. Same protagonist: ordinary Korean male office worker aged 28, short messy black hair, slim average build, tired dark eyes, angular gentle face. Scene: late-night modern Korean office, fluorescent lights mostly switched off, rows of monitors and glass windows looking across Seoul, rain trails on glass. The protagonist wearing white shirt, loose dark tie, dark trousers sits at a desk in right third, staring tiredly at an unreadable monitor. Paper coffee cup and small desktop clock, no legible screen text. Mood mundane exhausted solitude, quiet before an accident. Wide, cinematic storytelling.

### crossing

Use case: illustration-story. Production background CG for a Korean wuxia reincarnation visual novel. Premium hand-painted anime/manhwa illustration, crisp expressive linework with rich painterly scenery, cinematic layered light, indigo night shadows, warm copper highlights and restrained crimson. Wide 16:9 composition, 1920x1080 feel, visually detailed but lower quarter kept simple for dialogue overlay. No text, letters, captions, logos, watermarks, or UI. Same protagonist: ordinary Korean male office worker aged 28, short messy black hair, slim average build, tired dark eyes, angular gentle face. Scene: rain-soaked modern Seoul street at night outside office towers. Protagonist in white shirt loose dark tie dark trousers carrying a black shoulder bag, caught mid-step on zebra crossing in right third, surprised as a delivery box truck approaches from left, bright headlights flare in rain. Head-on danger implied moments before impact, NO impact depiction, NO injuries, NO blood, NO graphic violence. Dynamic diagonal headlights, flying umbrella, motion blur in environment but face legible. Wide cinematic CG.

### awakening

Use case: illustration-story. Production background CG for a Korean wuxia reincarnation visual novel. Premium hand-painted anime/manhwa illustration, crisp expressive linework with rich painterly scenery, cinematic layered light, indigo night shadows, warm copper highlights and restrained crimson. Wide 16:9 composition, 1920x1080 feel, visually detailed but lower quarter kept simple for dialogue overlay. No text, letters, captions, logos, watermarks, or UI. Same protagonist: ordinary Korean male office worker aged 28, short messy black hair, slim average build, tired dark eyes, angular gentle face. Scene: after reincarnation, protagonist now wearing worn charcoal-blue ancient Chinese traveler robes, no modern suit, sits dazed on stone pathway beside a river in an ancient Chinese market village at dawn. Very elderly kind man with long silver beard, white topknot, plain dark layered robes, wooden cane crouches beside him and offers hand. Misty mountains, wooden rooftops, red lanterns, first sunlight through willow tree. Young man and elder in right half; world opens to left. Gentle bewilderment after modern accident. Wide cinematic CG.

### mountain

Use case: illustration-story. Production background CG for a Korean wuxia reincarnation visual novel. Premium hand-painted anime/manhwa illustration, crisp expressive linework with rich painterly scenery, cinematic layered light, indigo night shadows, warm copper highlights and restrained crimson. Wide 16:9 composition, 1920x1080 feel, visually detailed but lower quarter kept simple for dialogue overlay. No text, letters, captions, logos, watermarks, or UI. Same protagonist: ordinary Korean male office worker aged 28, short messy black hair, slim average build, tired dark eyes, angular gentle face. Scene: magnificent wuxia title illustration, young protagonist in charcoal-blue travel robes stands on mountain precipice right third, seen three-quarter back with black hair tied partly up and a plain sheathed straight jian at waist, looking toward immense floating-seeming cloud mountains, distant ancient temple roof and waterfalls, dramatic red dusk behind storm-blue peaks. No modern clothes. Wind pulls sleeves and red sash. Left half restrained mist and dark mountain silhouette for large game title, no written title. Epic solemn journey, premium richly painted landscape.

### caravan

Use case: illustration-story. Production background CG for a Korean wuxia reincarnation visual novel. Premium hand-painted anime/manhwa illustration, crisp expressive linework with rich painterly scenery, cinematic layered light, indigo night shadows, warm copper highlights and restrained crimson. Wide 16:9 composition, 1920x1080 feel, visually detailed but lower quarter kept simple for dialogue overlay. No text, letters, captions, logos, watermarks, or UI. Same protagonist: ordinary Korean male office worker aged 28, short messy black hair, slim average build, tired dark eyes, angular gentle face. Scene: ancient Chinese grain caravan crossing a narrow wooded mountain pass in thick blue early morning fog, wooden carts with rice sacks, lantern-lit oxen, guards in slate robes and bamboo hats, protagonist charcoal-blue robe at front with hand lifted to stop wagon, traces of mysterious figures in forest far away. Layered depth, high atmospheric detail, warm amber lantern contrast. No text. Narrative CG for missing transport ledger chapter.

### duel

Use case: illustration-story. Production background CG for a Korean wuxia reincarnation visual novel. Premium hand-painted anime/manhwa illustration, crisp expressive linework with rich painterly scenery, cinematic layered light, indigo night shadows, warm copper highlights and restrained crimson. Wide 16:9 composition, 1920x1080 feel, visually detailed but lower quarter kept simple for dialogue overlay. No text, letters, captions, logos, watermarks, or UI. Same protagonist: ordinary Korean male office worker aged 28, short messy black hair, slim average build, tired dark eyes, angular gentle face. Scene: climactic wuxia duel on a vast circular stone arena atop mountains above clouds at dusk. Protagonist charcoal-blue robes and red sash in right third, poised with plain straight jian, facing elderly grandmaster in white flowing robes and long silver hair left third. Vast distance between them, sweeping wind, scattered maple leaves, crimson sky slit over indigo clouds. Elegant restrained swordsmanship, no injuries or blood. Dramatic polished painterly anime action CG.

### alley

Create a brand new premium 16:9 widescreen cinematic illustration for a Korean wuxia visual novel, painterly hand drawn anime/manhwa style, not 3D. Nighttime confrontation in a narrow ancient Chinese market alley, wet stone pavement reflecting red lanterns, richly detailed dark indigo tiled roofs and warm copper light. On the LEFT stands the protagonist: a 28 year old Korean man, short black tousled hair, handsome but ordinary face, charcoal travel robes with a muted crimson sash, cautiously holding a simple wooden practice sword. On the RIGHT stands a rugged intimidating black-haired bandit in rough dark robes holding a steel dao sword. Clear opposing silhouettes, elegant painterly brushstrokes, cinematic depth, sharp detailed environment. Palette midnight indigo, vermilion, muted copper. Leave the bottom quarter without important faces or details for dialogue UI. No text, no typography, no logos, no interface. Image should feel like an expensive narrative game CG.


## 2.1 · 2026-10-03

내장 image_gen으로 생활·조력자 CG 9개, 인물 없는 전투 배경 3개, 투명 전신 2개를 새로 제작했습니다. 총 14개 최종 에셋을 assets/vn/에 포함했습니다. clinic, soup, homesick, market, chores, practice, porter, companions, homecoming, alley-stage, practice-stage, road, traveler-novice, soyeon-standing입니다.

WebP 변환은 quality 90이며 투명 전신의 알파를 보존했습니다. 동행 CG는 최종적으로 porter의 도강을 외형 참조로 재생성했습니다. 각 프롬프트와 파일 경로는 [2.1 제작 기록](ASSET_PROMPTS_2.1.md)에 기록했습니다. 음악 10곡과 그 라이선스는 2.0과 같습니다.
