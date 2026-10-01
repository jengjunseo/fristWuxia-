// 사건은 모두 고유한 장면과 선택으로 작성했습니다. 효과는 game.js가 상태에 적용합니다.
const followUpAliases = {
  "innkeeper-remembers":"night-porridge", "merchant-discount":"market-haggle", "performer-rumor":"performer-secret",
  "guard-trust":"guard-badge", "disciple-tea-follow":"rival-challenge", "mentor-notes":"manual-trial",
  "rival-return":"rival-duel", "guard-escort":"escort-delay", "doctor-herb":"herb-gather",
  "prisoner-repay":"stockade-question", "shrine-path":"pass-marker", "garden-remedy":"medicine-lesson",
  "roadblock-reward":"escort-delay", "stockade-return":"bandit-prisoner", "rival-joins":"rival-duel",
  "breath-training":"breath-rhythm", "sword-practice":"manual-trial", "footwork-drill":"pressure-test",
  "qi-safe-practice":"breath-rhythm", "sect-branch":"manual-trial", "medicine-notes":"clinic-garden",
  "manual-study":"sword-stance"
};
const E = (id, title, location, category, intro, npc, choices, requirements = {}, followUp = null, repeat = false) => ({
  id, title, location, category, intro, npc, requirements, repeat, cooldown: repeat ? 1 : 0, followUp:followUpAliases[followUp]||followUp,
  choices: choices.map(([label, hint, result, effects]) => ({ label, hint, result, effects }))
});

export const events = [
  // 생활 / 일상 12
  E("inn-bowl", "빈 그릇의 값", "inn", "생활", "객잔 주인은 밥값이 모자란 네 사정을 듣고 잠시 생각한다. 설거지 한 번이면 은전 두 닢은 받을 수 있단다.", "innkeeper", [
    ["소매를 걷고 설거지한다", "은전 +2 · 주인과 신뢰", "주인은 따뜻한 물과 밥 한 그릇을 내준다. 손은 불었지만 속이 든든하다.", {coin:2,hp:5,trust:{innkeeper:1}}],
    ["사정을 솔직히 털어놓는다", "은전 +1 · 다음에 갚기로", "주인은 한숨을 쉬면서도 죽값만 받는다. 외상 장부에 네 이름이 적힌다.", {coin:1,flags:{innDebt:true},trust:{innkeeper:1}}]
  ], {}, "innkeeper-remembers"),
  E("market-haggle", "말 한마디의 흥정", "market", "생활", "노점의 약초 꾸러미에 값이 적혀 있지 않다. 장사꾼은 네 얼굴을 살핀다.", "merchant", [
    ["시세를 먼저 물어본다", "은전 +1", "다른 노점 두 곳의 값을 비교한 덕에 바가지를 피했다. 장사꾼도 네 태도를 인정한다.", {coin:1,trust:{merchant:1}}],
    ["필요한 사정을 말하고 부탁한다", "우정 · 소문 한 조각", "아픈 사람을 보러 간다는 말에 장사꾼은 약초 한 줌을 얹어 준다.", {item:"elixir-herb-bundle",trust:{merchant:1},flags:{herbGift:true}}]
  ], {}, "merchant-discount"),
  E("rain-guide", "빗속의 길손", "market", "생활", "갑작스러운 소나기. 짐을 잔뜩 든 아주머니가 처마 밑으로 가지 못하고 서 있다.", "innkeeper", [
    ["짐 한쪽을 들어 준다", "체력 +4 · 소문 +1", "장터 끝까지 짐을 옮겨 드렸다. 아주머니는 객잔이 따뜻하다고 귀띔한다.", {hp:4,flags:{helpedTraveler:true},trust:{innkeeper:1}}],
    ["비 피할 처마를 알려 드린다", "은전 +1", "고마워한 아주머니가 마른 보자기 속에서 동전을 꺼내 준다.", {coin:1,trust:{merchant:1}}]
  ]),
  E("herb-gather", "약초 바구니", "forest", "생활", "숲 가장자리에는 밟히지 않은 약초가 보인다. 의원이 찾던 종류와 비슷하다.", "physician", [
    ["뿌리째 캐지 않고 조금만 딴다", "약초 영약 1개", "뿌리를 남겨 둔 덕에 약초가 다시 자랄 터다. 의원은 좋은 채집이라며 고개를 끄덕인다.", {item:"elixir-herb-bundle",trust:{physician:1}}],
    ["잎을 살펴 채집법을 배운다", "내공 +4 · 수첩에 기록", "쓴 향이 손끝에 남는다. 함부로 삼키지 말라는 의원의 말을 기억했다.", {qi:4,learnGlossary:["영약"],trust:{physician:1}}]
  ]),
  E("street-song", "저잣거리의 노랫가락", "market", "생활", "피리 소리가 사람들을 멈춰 세운다. 연주자는 마지막 곡을 앞두고 동전을 모은다.", "performer", [
    ["박자를 맞춰 손뼉 친다", "은전 +1 · 공연자 호감", "박자가 엉망이어도 사람들은 웃었다. 공연자는 네게 피리 가락 하나를 가르쳐 준다.", {coin:1,trust:{performer:1},flags:{sharedMusic:true}}],
    ["관객이 흘린 동전을 주워 건넨다", "인물 기록 · 신뢰", "공연자는 돈보다 네 정직함을 기억하겠다고 한다.", {trust:{performer:2},flags:{returnedCoin:true}}]
  ], {}, "performer-rumor"),
  E("lost-parcel", "주인을 잃은 꾸러미", "escort", "생활", "표국 마당에 작은 꾸러미 하나가 놓여 있다. 끈에는 비에 번진 주소가 남았다.", "escort-guard", [
    ["표국에 맡겨 주인을 찾는다", "표사와 신뢰 +1", "꾸러미는 무사히 주인에게 돌아갔다. 표사는 네 이름을 기억해 둔다.", {trust:{guard:1},flags:{parcelReturned:true}}],
    ["주소를 따라 직접 전한다", "은전 +2", "먼 길을 돌아 아이의 집까지 꾸러미를 전했다. 어머니가 작은 삯을 건넨다.", {coin:2,trust:{guard:1}}]
  ], {stage:1}, "guard-trust"),
  E("kitchen-fire", "솥 밑의 불씨", "inn", "생활", "부엌 아궁이의 불이 꺼져 가는데 주인은 손님 응대에 묶여 있다.", "innkeeper", [
    ["장작을 잘게 패서 넣는다", "체력 +3 · 은전 +1", "불이 살아나자 구수한 냄새가 객잔 안으로 퍼졌다.", {hp:3,coin:1,trust:{innkeeper:1}}],
    ["불씨를 살릴 바람길을 만든다", "내공 +3", "무작정 부채질하지 않고 아궁이 문을 조절하자 불이 안정됐다.", {qi:3,learnGlossary:["내공"]}]
  ]),
  E("salt-peddler", "소금 장수의 저울", "market", "생활", "저울추가 한쪽으로 기울어 있다. 장사꾼은 모른 척하지만 손님은 망설인다.", "merchant", [
    ["저울을 바로잡으라고 조용히 말한다", "장터 평판 +1", "장사꾼은 저울추를 고치고 값을 다시 받았다. 손님은 안심하고 떠난다.", {trust:{merchant:1},flags:{fairWeight:true}}],
    ["손님에게 다른 노점을 소개한다", "은전 +1", "손님은 덕분에 제값에 소금을 샀다며 동전 한 닢을 보탰다.", {coin:1,flags:{fairWeight:true}}]
  ]),
  E("woodpile", "수련장 장작더미", "sect", "생활", "수련장 한쪽에 장작이 흐트러져 있다. 어린 제자들이 정리하느라 진땀을 뺀다.", "disciple", [
    ["무거운 장작부터 쌓는다", "체력 +4 · 동문 호감", "낮은 곳부터 쌓으라는 사부의 말이 떠올랐다. 장작더미가 단단해졌다.", {hp:4,trust:{disciple:1}}],
    ["아이들과 순서를 정한다", "관계 기록 · 경험", "혼자 들기보다 차례를 정하니 일이 빨라졌다. 제자들은 함께 웃는다.", {exp:2,trust:{disciple:1},flags:{teamwork:true}}]
  ], {stage:2}),
  E("night-porridge", "밤참 한 그릇", "inn", "생활", "늦은 밤, 객잔 주인이 남은 죽을 데워 준다. 하루를 쉬어 갈 수 있겠다.", "innkeeper", [
    ["죽을 먹고 푹 쉰다", "체력과 내공 회복 · 하루 경과", "따뜻한 죽을 먹고 잠들었다. 새벽에는 몸이 한결 가벼워졌다.", {rest:true,trust:{innkeeper:1}}],
    ["내일 쓸 돈을 아껴 조금만 먹는다", "내공 +5 · 하루 경과", "절반만 먹고 남은 돈을 챙겼다. 조용히 호흡을 고르니 기운이 모인다.", {qi:5,day:1}]
  ], {}, null, true),
  E("lamp-oil", "골목의 꺼진 등불", "alley", "생활", "골목의 등잔에 기름이 떨어졌다. 어둠에 발을 헛디딜 아이가 보인다.", "performer", [
    ["등잔에 기름을 채운다", "골목 소문 +1", "등불이 켜졌다. 골목 사람들은 밤길이 조금 덜 무서워졌다고 한다.", {coin:-1,trust:{performer:1},flags:{alleyLamp:true}}],
    ["사람들을 큰길로 안내한다", "인물 신뢰 +1", "아이와 상인을 큰길까지 데려다줬다. 공연자는 네가 먼저 살핀 걸 기억한다.", {trust:{performer:1,innkeeper:1}}]
  ]),
  E("escort-knot", "표물의 매듭", "escort", "생활", "무거운 짐을 묶은 밧줄이 느슨하다. 표사는 출발 전에 매듭을 확인하고 있다.", "escort-guard", [
    ["매듭을 다시 묶어 본다", "표물 안전 · 은전 +1", "처음엔 서툴렀지만 표사의 손을 따라 하자 짐이 단단히 고정됐다.", {coin:1,trust:{guard:1},flags:{secureKnot:true}}],
    ["표사에게 매듭법을 배운다", "수첩 기록 · 경험", "가장 짧은 매듭도 풀리지 않게 잡아당기는 법을 익혔다.", {exp:2,learnGlossary:["표국"],trust:{guard:1}}]
  ], {stage:1}),

  // 인연 / 은원 10
  E("disciple-tea", "차에 든 소금", "sect", "인연", "동문이 차를 내왔는데 한 모금 마신 사부의 눈썹이 꿈틀한다. 소금통이 설탕통 옆에 놓여 있다.", "disciple", [
    ["웃으며 물을 새로 끓인다", "동문 호감 +2", "동문은 민망해하면서도 다음엔 네가 알려 달라고 한다.", {trust:{disciple:2},flags:{teaMixup:true}}],
    ["사부에게 맛이 독특하다고 둘러댄다", "사부와 신뢰 +1", "사부는 찻잔을 내려놓고 네 재치를 모른 척 웃었다.", {trust:{mentor:1},flags:{teaCover:true}}]
  ], {stage:2}, "disciple-tea-follow"),
  E("mentor-errand", "사부의 심부름", "sect", "인연", "사부는 약초 꾸러미를 의원에게 전해 달라고 부탁한다. 값비싼 물건이니 함부로 다루지 말라 한다.", "mentor", [
    ["품에 넣어 직접 전한다", "사부 신뢰 +1 · 약초", "약초를 무사히 건넸다. 의원은 사부가 제자를 잘 골랐다고 말한다.", {item:"elixir-herb-bundle",trust:{mentor:1,physician:1}}],
    ["표국의 봉인을 빌려 안전히 보낸다", "표사 신뢰 +1", "표국의 표찰을 붙여 보내니 약초는 다음 날 무사히 도착했다.", {trust:{guard:1,mentor:1},flags:{usedEscort:true}}]
  ], {stage:2}, "mentor-notes"),
  E("rival-challenge", "붉은 옷의 도전", "sect", "인연", "경쟁자는 수련장에 사람들을 모으고 겨뤄 보자고 한다. 승부보다 네 태도를 보는 눈치다.", "rival", [
    ["규칙부터 정하고 겨룬다", "경험 +3 · 경쟁자 존중", "서로 다치지 않는 선에서 짧게 겨뤘다. 경쟁자는 제대로 인사한다.", {exp:3,trust:{rival:1},flags:{rivalRules:true}}],
    ["사람들 앞에서 정중히 사양한다", "은원 없이 물러남", "실력을 겨루는 때는 따로 있다. 경쟁자는 아쉽다는 듯 웃고 다음을 기약했다.", {trust:{rival:1},flags:{rivalDeferred:true}}]
  ], {stage:2}, "rival-return"),
  E("guard-badge", "잃어버린 표사패", "escort", "인연", "표사는 허리춤의 표사패가 사라진 걸 알아차렸다. 패를 잃으면 일을 맡기 어렵단다.", "escort-guard", [
    ["마지막으로 짐을 둔 곳을 함께 찾는다", "표사 신뢰 +2", "짐 아래에서 표사패를 찾았다. 표사는 네게 호송 일을 부탁해도 되겠다고 한다.", {trust:{guard:2},flags:{guardBadgeFound:true}}],
    ["분실 사실을 표국에 먼저 알린다", "정직한 기록", "숨기지 않고 알린 덕에 표사패는 빠르게 효력을 정지했다.", {trust:{guard:1},flags:{guardBadgeReported:true}}]
  ], {stage:1}, "guard-escort"),
  E("doctor-fee", "의원의 진료비", "clinic", "인연", "의원은 다친 행인의 상처를 살핀다. 환자는 고맙지만 치료비가 모자라 망설인다.", "physician", [
    ["진료비 일부를 보탠다", "체력 +8 · 의원 신뢰", "의원은 붕대를 감아 준 뒤 네 상처까지 살펴 줬다.", {coin:-2,hp:8,trust:{physician:2}}],
    ["약초를 구해 오겠다고 약속한다", "후속 약초 사건 열림", "의원은 약속을 믿고 치료를 먼저 마쳤다.", {hp:5,flags:{doctorHerbPromise:true},trust:{physician:1}}]
  ], {stage:2}, "doctor-herb"),
  E("merchant-ledger", "상인의 외상 장부", "market", "인연", "장사꾼이 오래된 외상 장부를 펼친다. 누군가 빚을 갚았는데 이름이 번져 있다.", "merchant", [
    ["장부에 증인 이름을 덧붙인다", "신뢰 +1 · 다음 흥정", "누가 얼마를 갚았는지 함께 적었다. 장사꾼은 장부를 덮으며 고맙다 한다.", {trust:{merchant:2},flags:{witnessedDebt:true}}],
    ["외상 값 일부를 대신 낸다", "은원 변화", "네 몫을 내어 장부 한 줄을 지웠다. 상인은 빚을 잊지 않겠다고 한다.", {coin:-2,trust:{merchant:2},flags:{paidDebt:true}}]
  ]),
  E("performer-secret", "피리 속의 쪽지", "market", "인연", "공연자의 피리에서 접힌 쪽지가 나온다. 사람들 앞에서 읽기에는 사적인 내용 같다.", "performer", [
    ["쪽지를 돌려주고 묻지 않는다", "비밀을 지킴 · 신뢰 +2", "공연자는 쪽지를 품에 넣고, 네게만 장터의 뒷소문을 들려준다.", {trust:{performer:2},flags:{keptSecret:true},rumor:1}],
    ["잃어버린 주인을 같이 찾는다", "인물 기록 · 단서", "쪽지는 누이를 찾는다는 짧은 부탁이었다. 공연자는 네게 고맙다고 인사한다.", {trust:{performer:1},flags:{helpedFamily:true}}]
  ]),
  E("inn-register", "객잔의 이름 석 자", "inn", "인연", "주인은 투숙객 장부를 정리하다 네 이름을 어떻게 적을지 묻는다. 아직 강호에서 쓸 이름이 없다.", "innkeeper", [
    ["본명 그대로 적어 달라고 한다", "주인과 신뢰 +1", "장부 한 귀퉁이에 네 이름이 남았다. 주인은 고향 이야기를 궁금해한다.", {trust:{innkeeper:1},flags:{innNameRecorded:true}}],
    ["먼 훗날의 별호를 상상해 본다", "경험 +1 · 기분 전환", "주인은 그 별호는 너무 길다며 웃고, 네게 죽 한 그릇을 보탠다.", {exp:1,hp:3,trust:{innkeeper:1},flags:{innNickname:true}}]
  ]),
  E("wanderer-chess", "길손의 바둑돌", "forest", "인연", "숲 정자에서 백발의 길손이 홀로 바둑을 둔다. 바둑을 모르겠다면 돌을 놓는 법부터 알려 주겠단다.", "wandering-master", [
    ["모른다고 말하고 한 수 배운다", "내공 +5 · 수첩 기록", "길손은 이기는 법보다 한 수 쉬는 때를 먼저 알려 준다.", {qi:5,learnGlossary:["고수"],trust:{master:1}}],
    ["돌의 모양을 살펴 추측해 본다", "경험 +2", "한 번의 실수 끝에 길목을 둘러싸는 법을 알아냈다. 길손은 웃으며 고개를 끄덕인다.", {exp:2,trust:{master:1}}]
  ], {stage:1}),
  E("bandit-prisoner", "산채의 포로", "stockade", "인연", "산채 구석에 붙잡힌 짐꾼이 있다. 두목은 그가 훔쳤다고 하지만 말이 앞뒤가 맞지 않는다.", "bandit-master", [
    ["짐꾼에게 먼저 차분히 묻는다", "사실을 들음 · 은원 변화", "짐꾼은 도적들이 먼저 짐을 빼앗았다고 털어놓는다. 두목은 네 판단을 지켜본다.", {flags:{heardPrisoner:true},trust:{bandit:1}}],
    ["표국의 표찰을 보여 주며 풀어 달라 한다", "표사 이름값", "표국은 약한 자를 짐으로 삼지 않는다는 말에 두목은 한발 물러선다.", {trust:{guard:1},flags:{freedPrisoner:true}}]
  ], {stage:2}, "prisoner-repay"),

  // 탐험 / 기연 10
  E("shrine-stone", "산길의 낡은 비석", "forest", "탐험", "이끼 낀 비석에 길을 잃은 사람을 돕자는 글이 새겨져 있다. 아랫부분에는 누군가 새긴 자국도 있다.", "wandering-master", [
    ["비석을 닦아 글을 읽는다", "강호 수첩에 기록", "오래된 글은 길 안내였다. 누군가 고맙다는 짧은 말을 그 아래 남겼다.", {learnGlossary:["기연"],flags:{readShrine:true},exp:2}],
    ["비석 주위를 살펴 새긴 자국을 찾는다", "은전 +2", "돌 뒤 작은 틈에서 길손이 두고 간 동전 두 닢을 찾았다.", {coin:2,flags:{shrineCache:true}}]
  ], {stage:1}, "shrine-path"),
  E("cave-markings", "동굴 벽의 발자국", "forest", "탐험", "숲 바위틈 안쪽에 얕은 동굴이 있다. 벽의 긁힌 자국은 짐승이 남긴 것 같지 않다.", "wandering-master", [
    ["바닥의 먼지부터 살핀다", "내공 +4 · 조심성", "사람 발자국은 안쪽이 아니라 밖으로 향한다. 위험을 피한 흔적일지 모른다.", {qi:4,flags:{caveTracks:true},learnGlossary:["경지"]}],
    ["횃불을 들고 입구만 살핀다", "영약 획득", "깊이 들어가지 않고도 마른 풀에 덮인 작은 약병을 발견했다.", {item:"elixir-red-herb",flags:{caveBottle:true}}]
  ], {stage:1}),
  E("old-scabbard", "비에 젖은 검집", "alley", "탐험", "담벼락 아래 낡은 검집이 버려져 있다. 안에는 칼날 없이 이름만 희미하게 새겨졌다.", "rival", [
    ["주인을 찾아 표국에 맡긴다", "은전 +1 · 신뢰", "검집을 넘겨받은 표사는 유실물 장부에 자세히 기록했다.", {coin:1,trust:{guard:1},flags:{scabbardRecorded:true}}],
    ["새김을 종이에 옮겨 적는다", "다음 사건 단서", "세 글자 중 하나는 산길 표식과 닮았다. 종이에 옮겨 두었다.", {exp:1,flags:{scabbardClue:true}}]
  ]),
  E("bitter-root", "쓴맛 나는 약초", "forest", "탐험", "잎맥이 독특한 풀을 발견했다. 의원에게 가져가면 쓸모가 있는지 확인해 줄 수 있다.", "physician", [
    ["잎과 뿌리를 따로 담는다", "약초 꾸러미 +1", "서로 섞이지 않게 담아 의원에게 건넸다. 다음에는 직접 약으로 쓸 수 있겠다.", {item:"elixir-herb-bundle",trust:{physician:1}}],
    ["맛을 보지 않고 생김새만 기록한다", "경험 +2 · 안전", "무엇인지 모를 풀은 먹지 않는 편이 낫다는 간단한 교훈을 적어 둔다.", {exp:2,flags:{rootSketch:true}}]
  ], {stage:1}),
  E("market-well", "우물가의 동전", "market", "탐험", "오래된 우물에 동전이 하나 반짝인다. 우물 안쪽은 어둡고 깊다.", "merchant", [
    ["긴 집게로 동전만 건진다", "은전 +1", "허리를 묶고 긴 집게를 내려 동전만 건졌다. 우물은 그대로 깨끗하다.", {coin:1,flags:{cleanWell:true}}],
    ["우물가의 아이들에게 위험을 알려 준다", "인물 신뢰 +1", "아이들은 고개를 끄덕이고 우물에서 멀어졌다. 장사꾼은 네가 잘 살폈다고 한다.", {trust:{merchant:1},flags:{wellWarning:true}}]
  ]),
  E("paper-boat", "강물 위 종이배", "market", "탐험", "도랑물 위로 종이배가 떠내려간다. 배 안에는 목적지를 적은 작은 쪽지가 접혀 있다.", "performer", [
    ["배를 건져 아이에게 돌려준다", "관계 변화 · 은전 +1", "쪽지는 아이의 소원이었다. 배를 돌려주자 아이는 다음 배도 꼭 띄우겠다며 웃는다.", {coin:1,trust:{performer:1},flags:{boatReturned:true}}],
    ["쪽지를 읽고 주소를 기억해 둔다", "소문 기록", "쪽지에는 뒷골목에서 기다리겠다는 약속이 적혀 있었다.", {rumor:1,flags:{boatMessage:true}}]
  ]),
  E("sect-bell", "수련장의 저녁 종", "sect", "탐험", "저녁 종의 울림이 산등성이까지 퍼진다. 종각 계단에는 발자국이 여러 겹 남았다.", "mentor", [
    ["종소리를 세며 호흡을 맞춘다", "내공 +6", "일곱 번 울리는 동안 숨을 고르니 들뜬 마음이 가라앉는다.", {qi:6,learnGlossary:["문파"],trust:{mentor:1}}],
    ["계단의 닳은 부분을 살핀다", "경험 +2 · 옛길", "가장 많이 닳은 계단은 종각 뒤쪽 작은 길로 이어졌다.", {exp:2,flags:{bellPath:true}}]
  ], {stage:2}),
  E("pass-marker", "고갯마루의 표식", "escort", "탐험", "고갯마루의 나무에 표국 표식이 새겨져 있다. 비바람에도 지워지지 않게 홈을 냈다.", "escort-guard", [
    ["표식의 뜻을 표사에게 묻는다", "길 찾기 기록", "표식은 다음 쉼터까지 남은 거리를 알려 준다. 표사는 실제로 걷는 법을 가르친다.", {trust:{guard:1},learnGlossary:["표국"],flags:{passSign:true}}],
    ["새 표식 하나를 더 남긴다", "후속 길 안내", "뒤따를 사람이 헤매지 않도록 물가 쪽에 화살표를 얕게 새겼다.", {exp:1,flags:{leftTrail:true}}]
  ], {stage:1}),
  E("abandoned-ferry", "사공 없는 나룻배", "forest", "탐험", "강가에 매인 나룻배가 흔들린다. 건너편에 젖은 보따리 하나가 놓여 있다.", "escort-guard", [
    ["줄을 단단히 묶고 사공을 기다린다", "은전 +1 · 안전", "급히 건너지 않고 배를 묶어 두었다. 사공은 돌아와 네게 동전 한 닢을 준다.", {coin:1,trust:{guard:1}}],
    ["표국의 안내를 확인하러 간다", "단서 보존", "강을 건너는 길은 위쪽 다리라는 표식을 확인했다. 보따리는 주인을 기다리기로 했다.", {flags:{ferrySafe:true},exp:1}]
  ], {stage:1}),
  E("clinic-garden", "의원 뒤뜰의 새싹", "clinic", "탐험", "마른 약초 사이로 새싹 하나가 고개를 들었다. 의원은 밟히지 않게 작은 울타리를 부탁한다.", "physician", [
    ["대나무 울타리를 세운다", "의원 신뢰 +1", "햇볕이 드는 쪽을 열어 두고 울타리를 세웠다. 새싹은 무사히 자랄 듯하다.", {trust:{physician:1},flags:{gardenFence:true}}],
    ["물 주는 시간을 적어 둔다", "회복 영약 +1", "의원은 네 기록을 보고 조제한 작은 약환을 건넨다.", {item:"elixir-healing-pill",trust:{physician:1}}]
  ], {stage:2}, "garden-remedy"),

  // 다툼 / 갈등 10
  E("market-thugs", "노점 앞 시비", "market", "갈등", "잡배 둘이 노점 주인에게 자릿세를 내라며 으름장을 놓는다. 주인은 장사를 접을지 망설인다.", "merchant", [
    ["주변 상인과 함께 관아에 알린다", "위험을 낮춤 · 장터 신뢰", "사람들이 함께 나서자 잡배는 물러났다. 힘으로 맞서지 않아도 소동은 끝났다.", {trust:{merchant:2},flags:{marketThugsReported:true}}],
    ["잡배에게 당장 물러나라고 한다", "전투 연습 · 경험 +2", "큰소리 대신 노점 주인의 증언을 먼저 들이밀었다. 잡배는 투덜대며 떠났다.", {exp:2,trust:{merchant:1},flags:{marketThugsBluffed:true}}]
  ]),
  E("roadblock", "호송길의 바리케이드", "escort", "갈등", "수레가 쓰러진 나무에 막혔다. 숲 가장자리에서 누군가 지켜보지만 모습을 드러내지 않는다.", "escort-guard", [
    ["사람들을 안전한 곳으로 옮기고 나무를 치운다", "체력 -2 · 표사 신뢰", "먼저 다친 사람을 살피고 함께 나무를 옮겼다. 숲의 그림자는 끝내 나타나지 않았다.", {hp:-2,trust:{guard:2},flags:{roadblockCleared:true}}],
    ["숲의 사람과 대화해 통행료를 흥정한다", "은전 +2 · 갈등 완화", "배고픈 나무꾼들이라는 사실을 알고 표사와 먹을 것을 나눠 줬다.", {coin:2,trust:{guard:1},flags:{roadblockPeace:true}}]
  ], {stage:1}, "roadblock-reward"),
  E("stockade-parley", "산채의 협상", "stockade", "갈등", "산채 문 앞에서 도적들이 통행료를 요구한다. 두목은 무기를 들기보다 네 말을 듣는 눈치다.", "bandit-master", [
    ["쌀과 통행로를 맞바꾸자고 제안한다", "은전 +1 · 충돌 없이 통과", "굶주림이 원인임을 알아챈 표사는 식량을 나눠 주고 통행로 약속을 받았다.", {coin:1,trust:{bandit:1,guard:1},flags:{banditPact:true}}],
    ["약한 사람을 괴롭히지 말라고 맞선다", "은원 분명 · 경험 +2", "두목은 네 용기를 인정하지만 물러서지는 않는다. 뒤에 다시 만나자며 길을 내준다.", {exp:2,trust:{bandit:-1},flags:{banditWarned:true}}]
  ], {stage:2}, "stockade-return"),
  E("sparring-ring", "비무장의 순서", "sect", "갈등", "수련생 둘이 차례를 두고 말다툼한다. 한 사람은 먼저 왔다 하고 다른 사람은 다친 동문을 돌봤다고 한다.", "mentor", [
    ["각자 한 번씩 양보해 순서를 정한다", "문파 신뢰 +1", "먼저 온 사람은 짧게 수련하고, 다친 동문이 이어서 자리를 썼다.", {trust:{mentor:1,disciple:1},flags:{ringOrderFair:true}}],
    ["사부에게 판단을 맡기고 기록을 돕는다", "수련 경험 +2", "사부는 제자들에게 서로의 사정을 다시 묻게 했다. 기록은 네가 맡았다.", {exp:2,trust:{mentor:1}}]
  ], {stage:2}),
  E("forest-traveler", "숲길의 다친 나그네", "forest", "갈등", "옆구리를 다친 나그네가 쉬고 있다. 멀리서 발소리가 들리지만 쫓는 사람인지 걱정하는 사람인지는 모른다.", "physician", [
    ["상처를 눌러 지혈하고 의원을 부른다", "체력 +6 · 안전하게 해결", "쫓아온 사람은 잃어버린 동료를 찾던 표사였다. 둘은 서로를 알아보고 안도한다.", {hp:6,trust:{physician:1,guard:1},flags:{rescuedTraveler:true}}],
    ["나그네가 먼저 상황을 설명하게 한다", "단서 획득 · 경험", "도망친 것이 아니라 도움을 청하러 가던 길이었다. 표식이 길을 잘못 들게 했다.", {exp:2,flags:{travelerStory:true}}]
  ], {stage:1}),
  E("alley-protection", "골목의 보호비", "alley", "갈등", "잡배가 노점 아이에게 보호비를 요구한다. 아이는 겁먹었지만 장터 상인들이 지켜보고 있다.", "performer", [
    ["상인들과 함께 증언하겠다고 한다", "싸움 회피 · 관계 변화", "목격자가 여럿이라는 말에 잡배는 달아났다. 아이는 공연자에게 고맙다고 인사한다.", {trust:{performer:1,merchant:1},flags:{protectionStopped:true}}],
    ["아이에게 도움을 청할 어른을 알려 준다", "골목 안전 기록", "아이를 혼자 두지 않고 객잔까지 데려다주었다. 주인은 앞으로 살펴보겠다고 한다.", {trust:{innkeeper:1},flags:{childSafe:true}}]
  ]),
  E("merchant-contract", "세 장의 거래 문서", "market", "갈등", "장사꾼과 짐꾼이 운송 값을 두고 언성을 높인다. 문서에는 서로 다른 숫자가 적혀 있다.", "merchant", [
    ["두 문서를 나란히 놓고 차이를 찾는다", "거래 신뢰 +1 · 은전", "날짜가 다른 견적서였다. 둘은 착오를 인정하고 새 문서를 쓰기로 했다.", {coin:2,trust:{merchant:1,guard:1},flags:{contractClarified:true}}],
    ["짐꾼의 일을 먼저 끝내고 나중에 정산한다", "갈등 보류 · 평판", "짐은 제때 떠났고, 당사자들은 객잔에서 다시 계산하기로 했다.", {trust:{guard:1},flags:{contractDeferred:true}}]
  ]),
  E("stockade-question", "두목에게 묻는 질문", "stockade", "갈등", "산채 두목은 사람들 앞에서 네게 무엇을 찾는지 묻는다. 숨길 이유는 없어 보인다.", "bandit-master", [
    ["표물 장부를 찾는다고 밝힌다", "협상 여지 · 단서", "두목은 장부가 없다고 답하며 표국 쪽에서 잘못 셌을 수 있다고 말한다.", {trust:{bandit:1},flags:{truthfulAtStockade:true}}],
    ["먼저 그의 사정을 들어 본다", "산채 사정 이해", "도적들은 겨울을 날 식량을 찾고 있었다. 두목은 사람답게 묻는 건 오랜만이라 한다.", {trust:{bandit:2},flags:{heardBandits:true}}]
  ], {stage:2}),
  E("escort-delay", "호송의 지연", "escort", "갈등", "호송대가 늦게 출발해 손님이 불안해한다. 표사는 발목을 삔 말부터 살펴보자고 한다.", "escort-guard", [
    ["말을 쉬게 하고 손님에게 이유를 알린다", "신뢰 +1 · 지연 감수", "출발은 늦었지만 말이 회복돼 안전하게 도착했다. 손님은 설명을 듣고 안심한다.", {trust:{guard:1},flags:{horseRested:true}}],
    ["빈 수레를 나눠 짐을 옮긴다", "체력 -3 · 시간 절약", "수레 한 대에 짐을 나눠 실었다. 모두 조금 지쳤지만 길을 이어 갈 수 있었다.", {hp:-3,trust:{guard:1},flags:{loadShared:true}}]
  ], {stage:1}),
  E("rival-duel", "경쟁자의 재도전", "sect", "갈등", "붉은 옷의 경쟁자가 이번에는 사람이 없는 수련장으로 널 부른다. 한 번만 맞대 보자고 한다.", "rival", [
    ["배운 기본 동작으로 짧게 겨룬다", "경험 +3 · 경쟁 관계 진전", "서로의 허점을 하나씩 짚어 주고 검을 거뒀다. 경쟁자는 다음엔 더 나아지겠다며 웃는다.", {exp:3,trust:{rival:2},flags:{rivalSparred:true}}],
    ["겨루기 대신 함께 수련하자고 한다", "내공 +4 · 동료 가능성", "경쟁자는 잠시 생각한 뒤 검을 내려놓고 발놀림부터 같이 맞춰 본다.", {qi:4,trust:{rival:2},flags:{rivalTrainedTogether:true}}]
  ], {stage:2}, "rival-joins"),

  // 성장 / 문파 / 수련 8
  E("breath-rhythm", "숨이 먼저 흔들릴 때", "clinic", "성장", "의원은 상처가 없는데도 숨을 너무 급히 쉬면 힘이 빨리 빠진다고 알려 준다.", "physician", [
    ["셋을 세며 천천히 숨을 내쉰다", "내공 +6 · 회복", "호흡을 고르자 어깨의 힘이 풀렸다. 내공은 억지로 쥐어짜는 힘이 아니란다.", {qi:6,learnGlossary:["내공"],trust:{physician:1}}],
    ["걷는 속도와 호흡을 함께 맞춘다", "체력 +5 · 경공 기초", "한 걸음마다 숨을 맞추니 오래 걸어도 덜 지쳤다.", {hp:5,learn:"lightness",trust:{physician:1}}]
  ], {stage:2}, "breath-training"),
  E("sword-stance", "검을 쥐는 첫 자세", "sect", "성장", "사부는 검을 세게 휘두르기 전에 발을 어디에 놓는지가 중요하다고 한다.", "mentor", [
    ["두 발을 어깨 넓이로 놓고 천천히 익힌다", "기초 검식 습득", "검끝이 덜 흔들린다. 사부는 기본 검식부터 차근차근 배우라 한다.", {learn:"sword",exp:2,trust:{mentor:1}}],
    ["동문을 거울 삼아 자세를 따라 한다", "검식 · 동문 호감", "서로의 자세를 바로잡아 주며 기초 검식을 익혔다.", {learn:"sword",trust:{disciple:1},exp:1}]
  ], {stage:2}, "sword-practice"),
  E("footwork", "돌아서는 발놀림", "forest", "성장", "숲길에 드러난 뿌리를 밟지 않으려면 한 발을 옮긴 뒤 중심을 다시 잡아야 한다.", "wandering-master", [
    ["낮은 돌을 돌아 천천히 걷는다", "경공 습득 · 체력 +2", "큰 걸음보다 가벼운 방향 전환이 안전하다는 걸 배웠다.", {learn:"lightness",hp:2,trust:{master:1}}],
    ["사부가 알려 준 검 자세를 떠올린다", "공격 +1", "발끝의 방향을 바꾸자 몸 전체가 자연스럽게 돌았다.", {atk:1,exp:1}]
  ], {stage:1}, "footwork-drill"),
  E("pressure-test", "사부의 세 걸음 시험", "sect", "성장", "사부가 세 걸음 안에 수련장 끝에 닿아 보라고 한다. 빨리 가는 시험은 아니라고 덧붙인다.", "mentor", [
    ["무게를 낮추고 흔들리지 않게 걷는다", "내공 +5 · 사부 신뢰", "세 걸음은 한 번도 서두르지 않았다. 사부는 그 점을 높이 본다.", {qi:5,trust:{mentor:2},flags:{passedSteps:true}}],
    ["발놀림을 바꾸며 길을 살핀다", "경공 경험 +2", "가장 짧은 길보다 발이 걸리지 않는 길을 골랐다.", {exp:2,learn:"lightness",flags:{passedSteps:true}}]
  ], {stage:2}),
  E("qi-mistake", "기운을 너무 세게", "clinic", "성장", "수련 뒤 손끝이 저리고 숨이 가쁘다. 의원은 더 힘을 주기 전에 잠깐 멈추라고 한다.", "physician", [
    ["손을 풀고 물을 마신다", "내공 +4 · 안전", "억지로 기운을 돌리지 않고 쉬자 손끝의 저림이 풀렸다.", {qi:4,trust:{physician:1},learnGlossary:["무공"]}],
    ["어디서부터 무리했는지 기록한다", "수첩 기록 · 경험", "너무 많은 힘을 한 번에 쓰려 했다는 걸 적었다. 다음 수련은 나누어 하기로 했다.", {exp:2,flags:{qiLesson:true}}]
  ], {stage:2}, "qi-safe-practice"),
  E("choose-sect", "문파의 문 앞에서", "sect", "성장", "사부는 억지로 제자를 붙잡지 않겠다며 네 생각을 묻는다. 문파는 무공을 함께 배우는 집단이란다.", "mentor", [
    ["청운문에서 검을 배운다", "청운문 노선 · 검식", "사부는 정식으로 제자를 받아들이고 기초 검식을 가르친다.", {sect:"청운문",learn:"sword",trust:{mentor:2},flags:{joinedSect:true}}],
    ["자유 수련자로 남아 권법을 익힌다", "자유 노선 · 권법", "문파 밖에서 배운다고 강호인이 아닌 것은 아니란다. 사부는 기본 권법을 보여 준다.", {sect:"방외객",learn:"fist",trust:{mentor:1},flags:{independentPath:true}}]
  ], {stage:2}, "sect-branch"),
  E("medicine-lesson", "영약을 쓰는 법", "clinic", "성장", "의원은 작은 환약을 보여 주며 상처가 났을 때 가방에서 꺼내 먹으면 된다고 설명한다.", "physician", [
    ["회복환을 받아 사용법을 익힌다", "회복환 +1 · 체력 +5", "환약을 한 알 먹었다. 즉시 상처가 조금 아물었다.", {item:"elixir-healing-pill",hp:5,learnGlossary:["영약"],trust:{physician:1}}],
    ["약병의 표식을 노트에 그린다", "강호 수첩에 기록", "색과 냄새만으로 약을 구별할 수는 없다고 적고 이름표를 확인했다.", {learnGlossary:["영약"],flags:{medicineLabel:true}}]
  ], {stage:2}, "medicine-notes"),
  E("manual-trial", "낡은 무공 비급", "sect", "성장", "수련장 창고에서 기본 검식 그림이 그려진 낡은 책을 찾았다. 먼저 사부에게 보여 드리는 편이 좋겠다.", "mentor", [
    ["사부에게 출처부터 확인한다", "검식 습득 · 신뢰", "사부는 오래된 입문서라며 위험한 대목은 없다고 확인해 준다.", {learn:"sword",trust:{mentor:1},exp:2}],
    ["그림의 동작부터 천천히 따라 한다", "검식 습득 · 내공 +2", "검을 휘두르지 않고 그림을 따라 발부터 움직였다. 서두르지 않아 다치지 않았다.", {learn:"sword",qi:2}]
  ], {stage:2}, "manual-study"),

  // 핵심 30분 이야기: 장부 사건 → 사부의 특훈 → 중간 고수 → 천하제일 결투
  E("case-ledger", "사라진 표물 장부", "alley", "사건", "골목에서 처음 맞닥뜨린 잡배의 주머니에 표국 표식이 묻은 종이가 있었다. 장부 한 권이 사라져 표사들이 곤란한 처지란다.", "escort-guard", [
    ["종이를 표사에게 건네고 함께 살핀다", "첫 단서를 확보한다", "종이에는 숲길 나루터의 날짜가 적혀 있다. 표사는 네 판단을 믿고 다음 조사를 부탁한다.", {mainStage:1,flags:{ledgerClue:true},trust:{guard:1},rumor:1}],
    ["잡배가 다니던 길을 먼저 확인한다", "은전 -1 · 첫 단서를 확보한다", "골목 사람들에게 물어 나루터 쪽 길을 확인했다. 돈은 들었지만 괜한 의심을 막았다.", {coin:-1,mainStage:1,flags:{ledgerClue:true,askedAlley:true},exp:1}]
  ], {mainStage:0}, "case-courier"),
  E("case-courier", "안개 속의 호송", "forest", "사건", "나루터로 향하는 표사와 만났다. 사라진 장부가 잘못된 호송 날짜를 알려 주었고, 누군가 일부러 길을 바꾸려 한 듯하다.", "escort-guard", [
    ["표사의 신호를 따라 안전한 샛길을 간다", "호송대와 신뢰", "샛길 표식을 따라가자 수상한 매복을 피했다. 멀리 산채 쪽에서 불빛이 보인다.", {mainStage:2,flags:{courierSafe:true},trust:{guard:2},item:"elixir-qi-pill"}],
    ["짐꾼과 상의해 일정을 공개한다", "사람들을 지키고 단서 확보", "숨기던 일정을 모두 확인하자 혼란이 풀렸다. 짐꾼 한 명이 산채의 길을 알려 준다.", {mainStage:2,flags:{courierSafe:true,openSchedule:true},trust:{merchant:1},coin:2}]
  ], {mainStage:1}, "case-mountain"),
  E("case-mountain", "산채 앞의 마지막 선택", "stockade", "사건", "장부를 숨긴 이는 산채의 두목이 아니었다. 굶주린 마을을 돕던 짐꾼이 거래에 휘말려 장부를 감췄다. 두목은 진실을 밝히자고 손을 내민다.", "bandit-master", [
    ["표국과 산채가 함께 진실을 밝힌다", "동료의 신뢰", "두목은 네가 약한 이들의 사정을 먼저 살폈다는 말을 들었다며, 장부를 노린 검객의 이름을 털어놓는다.", {mainStage:3,flags:{peacefulEnding:true},trust:{bandit:2,guard:1}}],
    ["장부를 되찾고 통행 약속을 맺는다", "산채의 협조", "서로의 약속을 글로 남겼다. 산채는 장부를 노린 검객의 뒤를 추적하겠다고 나선다.", {mainStage:3,flags:{peacefulEnding:true,settledWithoutFight:true},trust:{bandit:1,guard:1},coin:3}]
  ], {mainStage:2}, "story-epilogue"),
  E("story-epilogue", "강호에 남은 이름", "inn", "사건", "사건은 끝났지만 네가 택한 길을 기억하는 사람이 생겼다. 객잔 주인은 이제 어디로 갈지 묻는다.", "innkeeper", [
    ["청운문 사부에게 다시 배움을 청한다", "특훈 · 사부와 검식", "사부는 네가 싸움에서 읽어 낸 상대의 버릇이 드문 재능이라고 말한다. 오래된 비급의 호흡법을 빌려 마지막 수련을 돕겠다고 한다.", {mainStage:4,sect:"청운문",flags:{ending:"sect",mentorTraining:true},trust:{mentor:1}}],
    ["표국과 산채의 도움으로 특훈한다", "특훈 · 동료와 실전", "표사와 산채 두목은 네가 사람의 움직임을 먼저 읽는다고 말한다. 사부는 그 감각을 무공으로 다듬을 수 있도록 함께 수련하자고 한다.", {mainStage:4,flags:{ending:"road",allyTraining:true},trust:{guard:1,bandit:1},coin:2}]
  ], {mainStage:3}),
  E("story-training", "비급의 첫 호흡", "sect", "성장", "사부는 낡은 비급을 펼친다. 기운을 억지로 키우는 비결이 아니라, 상대의 어깨와 발을 보고 다음 움직임을 읽는 법이 적혀 있다. 그날부터 날이 밝으면 검을 들고, 해가 지면 호흡을 고른다. 계절이 바뀔 무렵, 사부가 마침내 고개를 끄덕인다.", "mentor", [
    ["목검으로 기초 검식을 익힌다", "검식 · 공격력 상승", "발을 먼저 놓고 칼끝은 마지막에 움직인다. 목검이 허공을 가르자 어깨 힘이 빠지고 시야가 넓어졌다.", {mainStage:5,day:90,learn:"sword",atk:2,def:1,qi:5,maxHp:6,hp:6,exp:3,item:"elixir-healing-pill",flags:{learnedReadIntent:true,trainingStyle:"sword"},trust:{mentor:1}}],
    ["호흡과 보법으로 틈을 읽는다", "경공 · 내공과 방어 상승", "숨을 들이쉬고 내쉬는 사이 발을 반 걸음 비켰다. 사부는 네가 상대의 기세를 읽었다며 호흡법과 경공의 기초를 전수한다.", {mainStage:5,day:90,learn:"lightness",atk:1,def:2,qi:7,maxHp:7,hp:7,exp:3,item:"elixir-healing-pill",flags:{learnedReadIntent:true,trainingStyle:"footwork"},trust:{mentor:1}}]
  ], {mainStage:4}),
  E("story-midboss", "흰 옷 검객의 시험", "forest", "사건", "산길을 막아선 검객은 장부를 노린 자를 추적하던 운해 검성의 제자다. 그는 네가 비급을 익혔다는 말을 듣고 칼끝을 겨눈다. 이번에는 상대의 발과 어깨를 읽어, 배운 동작을 직접 시험할 차례다.", "midboss", [
    ["검객의 오른발을 읽고 먼저 파고든다", "첫 공격 피해 +3", "상대의 검끝보다 어깨가 먼저 움직이는 것을 보았다. 배운 첫 동작으로 간격을 좁히며 정면 승부에 나선다.", {mainStage:6,flags:{midbossDefeated:true,midbossRead:"early"},exp:3,qi:4,trust:{mentor:1},combat:"midboss"}],
    ["공격을 받아 내고 빈틈을 기다린다", "첫 피격 감소 · 내공 +3", "흰 옷 검객은 높은 곳에서 검을 내려치려 한다. 호흡을 가라앉히고, 방어 자세로 그의 기술을 받아낼 준비를 한다.", {mainStage:6,flags:{midbossDefeated:true,midbossRead:"guard"},exp:3,qi:6,trust:{mentor:1},combat:"midboss"}]
  ], {mainStage:5}, "story-final"),
  E("story-final", "천하제일 비무대", "sect", "사건", "장부 사건을 지켜본 운해 검성이 구름 위 대련장으로 너를 부른다. 그는 수십 년간 천하제일인의 자리를 지켜 온 검성이다. 사부는 오래된 비급이 마지막 초식을 숨긴 까닭은 가장 강한 검이 아니라 지키려는 마음을 시험하기 위해서라고 알려 준다.", "grandmaster", [
    ["배운 호흡으로 검성의 첫 동작을 읽는다", "첫 공격 피해 +3", "검성은 단숨에 거리를 좁힌다. 목검으로 익힌 호흡을 떠올리고, 그의 검보다 먼저 움직이는 어깨를 읽는다.", {mainStage:7,flags:{finalApproach:"read"},trust:{mentor:1},combat:"final"}],
    ["동료들이 만든 틈을 믿고 정면으로 간다", "첫 피격 감소 · 내공 +3", "표사와 산채 동료들이 대련장 끝에서 네 이름을 부른다. 혼자 강해지는 길이 아니라고 답하며 검성의 정면을 향한다.", {mainStage:7,flags:{finalApproach:"allies"},trust:{guard:1,bandit:1},combat:"final"}]
  ], {mainStage:6})
];

export const locationData = {
  market: {name:"북쪽 장터", image:0, hint:"사람과 소문이 모이는 곳", open:true},
  inn: {name:"솔바람 객잔", image:1, hint:"밥 한 끼와 잠자리를 얻는 곳", open:true},
  alley: {name:"낡은 뒷골목", image:2, hint:"작은 사건과 비밀이 머무는 길", open:true},
  forest: {name:"청석 숲길", image:3, hint:"약초와 산길 표식이 있는 숲", stage:1},
  escort: {name:"백운 표국", image:4, hint:"사람과 물건을 호위하는 곳", stage:1},
  stockade: {name:"검은솔 산채", image:5, hint:"산길을 지키는 이들의 근거지", stage:2},
  clinic: {name:"혜민 의원", image:6, hint:"상처를 치료하고 약을 짓는 곳", stage:2},
  sect: {name:"청운문 수련장", image:7, hint:"무공을 배우는 문파의 마당", stage:2}
};

export const locationPositions = ["0% 0%","33.33% 0%","66.67% 0%","100% 0%","0% 100%","33.33% 100%","66.67% 100%","100% 100%"];

export const npcs = [
  {id:"innkeeper",name:"주인장 만복",role:"솔바람 객잔 주인",portrait:0,hello:"밥값부터 걱정 말게. 일손을 보태면 마음 편히 먹을 수 있어."},
  {id:"mentor",name:"사부 청허",role:"청운문의 검객",portrait:1,hello:"급히 휘두른 검보다 먼저 살펴본 발걸음이 오래 남는다."},
  {id:"disciple",name:"소연",role:"장난기 많은 동문",portrait:2,hello:"처음이라고 겁먹을 것 없어. 나도 첫날엔 차에 소금을 넣었는걸."},
  {id:"rival",name:"진우",role:"붉은 옷의 경쟁자",portrait:3,hello:"다음엔 제대로 겨뤄 보자. 네가 배운 걸 보여 줘."},
  {id:"guard",name:"표사 도강",role:"백운 표국의 표사",portrait:4,hello:"표국은 물건과 사람을 안전하게 호위하는 곳이오."},
  {id:"physician",name:"의원 류씨",role:"혜민 의원의 의원",portrait:5,hello:"상처부터 보여 주게. 약이 무엇인지는 내가 살펴보지."},
  {id:"merchant",name:"장사꾼 백란",role:"장터의 약초 상인",portrait:6,hello:"물건도 사람도 값을 알아야 손해를 보지 않는 법이지."},
  {id:"performer",name:"피리꾼 아루",role:"장터의 거리 공연자",portrait:7,hello:"소문은 귀를 열면 들리고, 비밀은 입을 닫아야 지킬 수 있어."},
  {id:"bandit",name:"산채 두목 곽철",role:"검은솔 산채의 우두머리",portrait:8,hello:"내 말을 듣기 전에 칼부터 뽑지는 말게. 사정이란 게 있으니까."},
  {id:"master",name:"백발의 길손",role:"이름을 숨긴 고수",portrait:9,hello:"모르는 것은 부끄럽지 않네. 묻지 않은 채 안다고 여기는 게 문제지."}
];

export const itemData = {
  "weapon-iron-jian": {name:"무명 철검",type:"weapon",slot:"weapon",sprite:0,atk:3,price:5,desc:"균형이 잘 잡힌 곧은 검. 공격력이 3 오른다."},
  "weapon-jade-jian": {name:"청옥 장검",type:"weapon",slot:"weapon",sprite:1,atk:5,price:9,desc:"옥 장식이 박힌 검. 공격력이 5 오른다."},
  "weapon-practice-sword": {name:"단단한 목검",type:"weapon",slot:"weapon",sprite:2,atk:2,price:3,desc:"초보 수련용 목검. 공격력이 2 오른다."},
  "weapon-iron-gauntlets": {name:"철권 보호대",type:"weapon",slot:"weapon",sprite:3,atk:2,def:1,price:5,desc:"권법을 펼치기 좋다. 공격력 2, 방어력 1 상승."},
  "weapon-bamboo-staff": {name:"청죽 봉",type:"weapon",slot:"weapon",sprite:4,atk:3,price:4,desc:"가볍고 긴 대나무 봉. 공격력이 3 오른다."},
  "weapon-curved-saber": {name:"월아도",type:"weapon",slot:"weapon",sprite:5,atk:4,price:7,desc:"넓게 휘두르기 좋은 곡도. 공격력이 4 오른다."},
  "weapon-leather-bracer": {name:"가죽 팔보호대",type:"armor",slot:"armor",sprite:6,def:2,price:4,desc:"팔을 보호한다. 방어력이 2 오른다."},
  "weapon-travel-cloak": {name:"두툼한 행낭 망토",type:"armor",slot:"armor",sprite:7,def:1,price:3,desc:"두꺼운 망토. 방어력이 1 오른다."},
  "weapon-flying-darts": {name:"비엽 투척침",type:"weapon",slot:"weapon",atlas:"weapon-extras-atlas.png",cols:2,rows:1,sprite:0,atk:2,price:4,desc:"가볍게 던지는 잎 모양 쇠침. 공격력이 2 오른다."},
  "weapon-long-spear": {name:"청죽 장창",type:"weapon",slot:"weapon",atlas:"weapon-extras-atlas.png",cols:2,rows:1,sprite:1,atk:4,price:6,desc:"긴 대나무 자루의 창. 공격력이 4 오른다."},
  "elixir-red-herb": {name:"홍삼 소병",type:"medicine",sprite:8,hp:18,price:4,desc:"마시면 체력을 18 회복한다."},
  "elixir-qi-pill": {name:"청기환",type:"medicine",sprite:9,qi:14,price:4,desc:"내공을 14 회복한다."},
  "elixir-ginseng": {name:"산삼 한 뿌리",type:"medicine",sprite:10,hp:24,price:7,desc:"귀한 약재. 체력을 24 회복한다."},
  "elixir-healing-pill": {name:"회복환",type:"medicine",sprite:11,hp:14,qi:4,price:3,desc:"체력 14와 내공 4를 회복한다."},
  "elixir-herb-bundle": {name:"약초 꾸러미",type:"medicine",sprite:12,hp:10,price:2,desc:"깨끗이 씻어 쓰면 체력을 10 회복한다."},
  "elixir-antidote": {name:"호박 해독병",type:"medicine",sprite:13,hp:10,qi:8,price:6,desc:"기력을 다지고 몸을 추스른다. 체력 10, 내공 8 회복."}
};

export const spritePositions = Array.from({length:16}, (_,i) => `${(i%4)*33.3333}% ${Math.floor(i/4)*33.3333}%`);
export const portraitPositions = Array.from({length:10}, (_,i) => `${(i%5)*25}% ${Math.floor(i/5)*100}%`);
