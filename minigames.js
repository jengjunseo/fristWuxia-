import {propArt,activityDetails,activityTableau} from './minigame-art.js';
// Scene activities are deterministic so a saved board restores without reshuffling.
const timing=(after,title,instruction,verb,success,target=3)=>({type:'timing',after,title,instruction,verb,success,target,low:36,high:64});
const memory=(after,title,instruction,labels,success)=>({type:'memory',after,title,instruction,labels,success});
const sequence=(after,title,instruction,steps,success)=>({type:'sequence',after,title,instruction,steps,success});
const count=(after,title,instruction,groups,success)=>({type:'count',after,title,instruction,groups,success});
const sort=(after,title,instruction,bins,tokens,success)=>({type:'sort',after,title,instruction,bins,tokens,success});
const route=(after,title,instruction,blocked,stops,success)=>({type:'route',after,title,instruction,blocked,stops,success,width:5,start:0,end:24});
export const minigames = {
  'first-meal':timing(3,'떨리는 숟가락','숟가락이 따뜻한 구간에 들어오면 한 술 드세요. 세 술을 천천히 넘기면 됩니다.','한 술 먹기','만복: 그래, 그렇게 천천히 드시오.'),
  'first-clinic':memory(2,'류 의원의 약재함','류 의원이 꺼낸 약재를 같은 것끼리 찾아 주세요. 두 봉지를 열어 모양과 이름을 확인하세요.',['감초','박하','당귀','쑥'],'류 의원: 헷갈리면 이름을 확인하면 되네. 잘 찾았어.'),
  'first-night':timing(6,'잠들기 전의 숨','물 한 모금을 마시고 숨을 고릅니다. 표시가 가운데에 왔을 때 세 번 천천히 내쉬세요.','숨 내쉬기','어깨가 조금 내려갔다. 오늘은 눈을 감아 보기로 했다.'),
  'first-market':{type:'pay',after:6,title:'소금값 두 닢',instruction:'소금은 두 닢입니다. 주머니에서 동전을 골라 정확히 두 닢을 건네세요.',wallet:[1,1,1,1,1],price:2,success:'백란: 두 닢, 맞아. 나머지 세 닢은 잘 챙겨.'},
  'first-work':sort(6,'깨지지 않게 정리하기','그릇을 고른 뒤 놓을 곳을 누르세요. 그릇은 선반에, 천은 빨래통에 넣습니다.',['그릇 선반','빨래통'],[['밥그릇',0],['젖은 천',1],['찻잔',0],['수건',1],['국그릇',0],['행주',1]],'만복: 오늘은 안 깨뜨렸군. 손부터 말리고 오시오.'),
  'first-escort':sequence(0,'조여진 매듭','도강이 알려 준 순서로 매듭을 풉니다. 먼저 동작을 익힌 뒤 기억해서 이어 보세요.',['고리 밀기','끈 느슨하게','고리 밀기','끝 빼기'],'도강: 됐소. 힘으로 당기는 것보다 낫지 않소?'),
  'first-lesson':sequence(5,'발 · 숨 · 손','소연을 따라 자세를 잡습니다. 먼저 순서를 익힌 뒤 한 동작씩 이어 보세요.',['발 놓기','숨 내쉬기','손 풀기','발 놓기','숨 내쉬기','손 풀기'],'소연: 이제 발이 안 꼬이네요. 잠깐 쉬어요.'),
  'sore-morning':timing(5,'연고를 천천히','연고를 너무 세게 문지르지 않습니다. 표시가 가운데에 왔을 때 가볍게 펴 바르세요.','살살 바르기','류 의원: 그 정도면 됐네. 오늘은 무리하지 말고.'),
  'small-errand':route(3,'큰길을 따라','다리와 파란 차양을 지나 큰길 입구까지 갑니다. 옆 칸으로만 움직이고, 표시된 곳을 모두 지나세요.',[1,3,6,8,11,13,16,18],[{cell:10,name:'다리'},{cell:12,name:'파란 차양'},{cell:23,name:'큰길'}],'백란의 말대로 큰길 입구까지 왔다.'),
  'after-danger':sequence(4,'손바닥의 작은 상처','류 의원의 말을 따라 상처를 돌봅니다. 순서를 틀리면 해당 단계부터 다시 해 보세요.',['물로 씻기','천으로 닦기','약 바르기','붕대 감기'],'류 의원: 이제 손을 펴 보게. 오늘은 검을 놓아도 돼.'),
  'tell-soyeon':memory(6,'집에서 보던 것들','소연에게 집 이야기를 들려줍니다. 같은 기억 두 장을 찾아 한 쌍으로 놓으세요.',['버스','엘리베이터','휴대전화','전등'],'소연: 이름은 어렵지만… 그곳 이야기를 더 듣고 싶어요.'),
  'second-work':count(2,'스무 자루 확인','마당의 쌀 자루와 콩 자루를 따로 셉니다. 종류마다 실제 개수를 적어 확인하세요.',[{name:'쌀',amount:12,glyph:'米'},{name:'콩',amount:8,glyph:'豆'}],'도강: 열둘과 여덟, 스무 자루. 이번에는 맞소.'),
  'ledger':count(3,'장부와 마당','매듭이 풀린 자루를 따로 표시하려고 합니다. 묶인 자루와 풀린 자루를 각각 세어 주세요.',[{name:'묶인 자루',amount:6,glyph:'結'},{name:'풀린 자루',amount:3,glyph:'解'}],'도강: 풀린 세 자루부터 확인합시다. 수량을 적어 두겠소.'),
  'first-road':route(5,'표국의 길 표시','나무에 새긴 표시를 따라 쉼터로 갑니다. 표식 셋을 지나야 도강과 합류할 수 있습니다.',[4,6,8,11,13,16,18],[{cell:2,name:'두 줄'},{cell:12,name:'발자국'},{cell:22,name:'쉼터 앞'}],'도강: 잘 따라왔소. 저기서 짐을 내려놓고 쉬지.'),
  'rain-shelter':timing(6,'젖은 장작의 불씨','불씨가 살아날 때 맞춰 부채질하세요. 너무 이르거나 늦으면 쉬었다 다시 해 봅니다.','부채질하기','소연: 붙었어요! 물 올려도 되겠어요.'),
  'grain-account':count(6,'나눠 받은 쌀','창고 몫과 마을 몫을 구분해 기록합니다. 색과 글자를 보고 두 종류의 자루를 세세요.',[{name:'창고 몫',amount:8,glyph:'倉'},{name:'마을 몫',amount:2,glyph:'村'}],'도강: 창고 쪽 여덟, 마을 쪽 두 자루는 여기 적었소. 나머지도 함께 확인하지.'),
  'come-back':sort(1,'남겨 둔 저녁','따뜻한 음식은 식탁으로, 씻을 그릇은 개수대로 옮겨 주세요. 물건을 누르고 놓을 곳을 고릅니다.',['식탁','개수대'],[['따뜻한 밥',0],['빈 그릇',1],['국',0],['쓴 숟가락',1],['차',0],['빈 찻잔',1]],'만복: 정리는 그만해도 되오. 이제 앉아서 드시오.'),
  'practice-again':sequence(6,'몸에 남기는 자세','발을 놓고, 손을 풀고, 물러섭니다. 두 번 같은 순서를 이어 보세요.',['발 놓기','손 풀기','한 발 뒤로','발 놓기','손 풀기','한 발 뒤로'],'청허: 좋다. 이제 목검을 내려놓아라.'),
  'one-stroke':timing(4,'검끝을 옆으로','소연의 목검이 가운데로 왔을 때 검끝을 밀어냅니다. 크게 휘두르지 않고 네 번 맞춰 보세요.','검끝 밀기','소연: 마지막 건 제대로 닿았어요. 손에 힘 덜 줬죠?',4),
  'after-practice':memory(3,'둘이 챙기는 수련 도구','수련이 끝났습니다. 같은 도구끼리 짝을 찾아 정리하세요.',['목검','허리끈','수건','물통'],'소연: 다 챙겼네요. 오늘은 밥부터 먹어요.'),
  'first-delivery':sort(6,'출발 전 꾸러미','도강은 쌀과 장부, 소연은 약과 붕대, 나는 떡과 물을 챙깁니다. 꾸러미를 골라 담당자에게 건네세요.',['도강 · 쌀 / 장부','소연 · 약 / 붕대','나 · 떡 / 물'],[['쌀',0],['약',1],['떡',2],['장부',0],['물',2],['붕대',1]],'도강: 다 챙겼소. 이제 함께 갑시다.'),
  'homecoming':memory(7,'다시 제자리로','빌린 물건들을 같은 자리의 표식과 맞춰 돌려놓습니다. 마지막 정리를 마치고 쉬세요.',['약그릇','목검','보자기','물통'],'만복: 다 돌려놓았군. 오늘 할 일은 끝이오.')
};

export function activityFor(id){return Object.hasOwn(minigames,id)?minigames[id]:null;}
function shuffle(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=(i*7+3)%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function createActivity(id){
  const c=activityFor(id);if(!c)throw new Error('Unknown activity');
  return {id,type:c.type,cleared:false,progress:0,moves:0,mistakes:0,message:'',manual:false,ready:c.type!=='sequence',hint:false,value:0,selected:[],matched:[],answers:c.groups?.map(()=>0)||[],placed:[],position:c.start??0,visited:c.type==='route'?[c.start]:[],deck:c.labels?shuffle(c.labels.flatMap((_,i)=>[i,i])):[]};
}
export function activityGoal(c){return c.target||c.steps?.length||c.labels?.length||c.tokens?.length||c.stops?.length||1;}
export function timingRange(s){const zones=[[36,64],[22,50],[54,82],[32,58]];const zone=zones[s.progress%zones.length];return {low:zone[0],high:zone[1]};}
export function activityAction(current, action, value){
  const c=activityFor(current?.id);if(!c||current.cleared)return current;
  const s=structuredClone(current);const goal=activityGoal(c);
  const wrong=message=>{s.mistakes++;s.message=message;};
  if(action==='begin'&&c.type==='sequence'){s.ready=true;s.hint=false;s.message='배운 순서대로 한 동작씩 이어 주세요.';return s;}
  if(action==='hint'&&['sequence','memory'].includes(c.type)){s.hint=!s.hint;return s;}
  if(action==='manual'&&c.type==='timing'){s.manual=!s.manual;s.value=0;s.message='';return s;}
  if(action==='position'&&c.type==='timing'&&s.manual&&Number.isFinite(value)){s.value=Math.max(0,Math.min(100,value));return s;}
  if(action==='hit'&&c.type==='timing'&&Number.isFinite(value)){
    const zone=timingRange(s);s.moves++;if(value>=zone.low&&value<=zone.high){s.progress++;s.message='좋아요. 다음에는 밝은 구간의 위치가 달라집니다.';}else wrong(value<zone.low?'조금 일렀습니다. 밝은 구간까지 기다려 주세요.':'조금 늦었습니다. 다음에 밝은 구간을 지날 때 해 보세요.');
  }
  if(action==='step'&&c.type==='sequence'&&s.ready&&c.steps.includes(value)){
    s.moves++;if(value===c.steps[s.progress]){s.progress++;s.message='좋아요. 다음 동작을 이어 주세요.';}else wrong('순서가 달라요. 밝아진 동작부터 다시 해 보세요.');
  }
  if(action==='card'&&c.type==='memory'&&Number.isInteger(value)&&value>=0&&value<s.deck.length&&!s.matched.includes(value)){
    s.hint=false;
    if(s.selected.length===2)s.selected=[];if(s.selected.includes(value))return current;
    s.selected.push(value);s.moves++;
    if(s.selected.length===2){const [a,b]=s.selected;if(s.deck[a]===s.deck[b]){s.matched.push(a,b);s.selected=[];s.progress++;s.message='한 쌍을 찾았습니다.';}else wrong('서로 다른 물건입니다. 모양과 이름을 기억하고 다른 칸을 열어 보세요.');}
  }
  if(action==='coin'&&c.type==='pay'&&Number.isInteger(value)&&value>=0&&value<c.wallet.length){s.selected=s.selected.includes(value)?s.selected.filter(i=>i!==value):[...s.selected,value];s.message='';}
  if(action==='pay'&&c.type==='pay'){s.moves++;if(s.selected.reduce((sum,i)=>sum+c.wallet[i],0)===c.price){s.progress=1;}else wrong('건넬 금액이 맞지 않습니다. 동전을 더하거나 빼 보세요.');}
  if(action==='answer'&&c.type==='count'&&Array.isArray(value)&&Number.isInteger(value[0])&&value[0]>=0&&value[0]<c.groups.length&&Number.isInteger(value[1])){s.answers[value[0]]=Math.max(0,Math.min(30,value[1]));s.message='';}
  if(action==='tally'&&c.type==='count'&&Number.isInteger(value)){
    const tokens=shuffle(c.groups.flatMap((g,i)=>Array.from({length:g.amount},()=>i)));if(value<0||value>=tokens.length)return current;
    const removing=s.selected.includes(value);s.selected=removing?s.selected.filter(i=>i!==value):[...s.selected,value];s.answers[tokens[value]]=Math.max(0,s.answers[tokens[value]]+(removing?-1:1));s.message=removing?'표시를 지웠습니다.':'이 자루는 셌습니다.';
  }
  if(action==='check'&&c.type==='count'){s.moves++;if(c.groups.every((g,i)=>g.amount===s.answers[i]))s.progress=1;else wrong('수량이 다릅니다. 색과 글자를 보고 한 종류씩 다시 세어 보세요.');}
  if(action==='token'&&c.type==='sort'&&Number.isInteger(value)&&value>=0&&value<c.tokens.length&&!s.placed.includes(value)){s.selected=[value];s.message='';}
  if(action==='bin'&&c.type==='sort'&&Number.isInteger(value)&&value>=0&&value<c.bins.length&&s.selected.length===1){s.moves++;const token=s.selected[0];if(c.tokens[token][1]===value){s.placed.push(token);s.selected=[];s.progress++;s.message='제자리에 놓았습니다.';}else wrong('그곳에 놓을 물건이 아닙니다. 놓을 곳의 이름을 확인해 주세요.');}
  if(action==='cell'&&c.type==='route'&&Number.isInteger(value)&&value>=0&&value<25&&!c.blocked.includes(value)){
    const dx=Math.abs(value%c.width-s.position%c.width),dy=Math.abs(Math.floor(value/c.width)-Math.floor(s.position/c.width));
    if(dx+dy!==1)return current;s.position=value;s.moves++;if(!s.visited.includes(value))s.visited.push(value);
    s.progress=c.stops.filter(stop=>s.visited.includes(stop.cell)).length;s.message=value===c.end&&s.progress<goal?'아직 지나지 않은 표식이 있습니다. 돌아가 확인하세요.':'';
  }
  s.cleared=s.progress===goal&&(c.type!=='route'||s.position===c.end);
  if(s.cleared)s.message=c.success;
  return JSON.stringify(s)===JSON.stringify(current)?current:s;
}

// Validate game boards independently of story saves; reject forged completions.
export function normalizeActivity(input,chapterId){
  if(input==null)return null;
  const c=activityFor(chapterId);if(!c||typeof input!=='object'||Array.isArray(input)||input.id!==chapterId||input.type!==c.type)throw new Error('Invalid activity scene');
  const base=createActivity(chapterId),s=structuredClone(input);
  for(const k of ['cleared','manual','ready','hint'])if(typeof s[k]!=='boolean')throw new Error('Invalid activity flag');
  for(const k of ['progress','moves','mistakes','value','position'])if(!Number.isInteger(s[k])||s[k]<0||s[k]>(['moves','mistakes'].includes(k)?100000:k==='value'?100:k==='position'?24:activityGoal(c)))throw new Error('Invalid activity value');
  for(const k of ['selected','matched','answers','placed','visited','deck'])if(!Array.isArray(s[k])||s[k].length>30||s[k].some(v=>!Number.isInteger(v)||v<0||v>30))throw new Error('Invalid activity board');
  for(const k of ['selected','matched','placed','visited'])if(new Set(s[k]).size!==s[k].length)throw new Error('Duplicate activity value');
  let complete=false;
  if(c.type==='memory'){
    if(JSON.stringify(s.deck)!==JSON.stringify(base.deck)||s.selected.length>2||[...s.selected,...s.matched].some(v=>v>=s.deck.length)||s.selected.some(v=>s.matched.includes(v))||s.matched.length%2)throw new Error('Invalid memory board');
    for(let i=0;i<s.matched.length;i+=2)if(s.deck[s.matched[i]]!==s.deck[s.matched[i+1]])throw new Error('Invalid pair');
    if(s.progress!==s.matched.length/2)throw new Error('Invalid memory progress');complete=s.matched.length===s.deck.length;
  }else if(c.type==='sort'){
    if(s.selected.length>1||[...s.selected,...s.placed].some(v=>v>=c.tokens.length)||s.selected.some(v=>s.placed.includes(v))||s.progress!==s.placed.length)throw new Error('Invalid sorted board');complete=s.placed.length===c.tokens.length;
  }else if(c.type==='pay'){
    if(s.selected.some(v=>v>=c.wallet.length))throw new Error('Invalid coins');complete=s.progress===1&&s.selected.reduce((n,i)=>n+c.wallet[i],0)===c.price;
  }else if(c.type==='count'){
    if(s.answers.length!==c.groups.length||s.selected.some(i=>i>=c.groups.reduce((n,g)=>n+g.amount,0)))throw new Error('Invalid count board');complete=s.progress===1&&c.groups.every((g,i)=>s.answers[i]===g.amount);
  }else if(c.type==='route'){
    if(!s.visited.includes(c.start)||!s.visited.includes(s.position)||s.visited.some(v=>v>=25||c.blocked.includes(v))||s.progress!==c.stops.filter(stop=>s.visited.includes(stop.cell)).length)throw new Error('Invalid route');
    const connected=new Set([c.start]);for(let pass=0;pass<25;pass++)for(const v of s.visited)if([...connected].some(p=>Math.abs(v%5-p%5)+Math.abs(Math.floor(v/5)-Math.floor(p/5))===1))connected.add(v);
    if(connected.size!==s.visited.length)throw new Error('Disconnected route');complete=s.progress===activityGoal(c)&&s.position===c.end;
  }else complete=s.progress===activityGoal(c);
  if(s.mistakes>s.moves||s.moves<s.progress||(c.type==='sequence'&&s.progress&&!s.ready))throw new Error('Invalid activity attempts');
  if(s.cleared!==complete)throw new Error('Invalid activity completion');
  s.message=typeof s.message==='string'?s.message.slice(0,300):'';
  return Object.fromEntries(Object.keys(base).map(k=>[k,s[k]]));
}

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(action,value,label,attrs='')=>`<button type="button" data-action="activity" data-task="${action}" data-value="${esc(value)}" ${attrs}>${label}</button>`;
export function renderActivity(s,{icon,reducedMotion=false}={}){
  const c=activityFor(s.id),goal=activityGoal(c);const art=icon||(()=>'<span>◇</span>');
  const [helper,advice,materials]=activityDetails[s.id];
  let board='';
  if(s.cleared)board=`<div class="mg-clear"><div class="mg-clear-seal">${art('seal')}</div><h3>해냈습니다</h3><p>${esc(c.success)}</p><div class="mg-result-stats"><span>시도 ${s.moves}번</span><span>실수 ${s.mistakes}번</span></div><button class="btn btn-primary" data-action="activity-continue">이야기 계속 →</button></div>`;
  else if(c.type==='timing'){
    const manual=s.manual||reducedMotion;
    const zone=timingRange(s);
    board=`<div class="mg-timing"><p class="mg-round">${s.progress+1}번째 · ${esc(c.verb)}</p><div class="mg-track" role="img" aria-label="밝은 구간에서 맞추기"><span class="mg-zone" style="left:${zone.low}%;width:${zone.high-zone.low}%"></span><span class="mg-needle ${manual?'manual':''}" style="${manual?'left:'+s.value+'%':''}"></span></div><div class="mg-timing-labels"><span>0</span><span>밝은 구간에서 누르기</span><span>100</span></div>${manual?`<label class="mg-slider">위치 조절<input type="range" min="0" max="100" step="1" value="${s.value}" data-activity-slider aria-label="위치 조절"></label>`:''}${btn('hit','',esc(c.verb),'class="mg-primary"')}${btn('manual','',manual?'자동 움직임':'천천히 조작','class="mg-subtle" '+(reducedMotion?'disabled':''))}</div>`;
  }else if(c.type==='memory')board=`<div class="mg-memory">${s.deck.map((pair,i)=>{const open=s.hint||s.selected.includes(i)||s.matched.includes(i);return btn('card',i,open?`${propArt(c.labels[pair])}<strong>${esc(c.labels[pair])}</strong>`:`<span class="mg-card-back">${s.id==='first-clinic'?'藥':s.id==='tell-soyeon'?'憶':'物'}</span><small>${i+1}</small>`,`class="mg-card ${open?'open':''} ${s.matched.includes(i)?'matched':''}" aria-label="${i+1}번 ${open?esc(c.labels[pair]):(s.id==='first-clinic'?'봉지 열기':'카드 뒤집기')}" ${s.matched.includes(i)?'disabled':''}`);}).join('')}</div>${btn('hint','',s.hint?'다시 덮기':'모양 다시 살펴보기','class="mg-subtle"')}`;
  else if(c.type==='sequence')board=`<p class="mg-round">${!s.ready?'순서를 먼저 익혀 주세요':s.hint?'순서 다시 살펴보기':(s.progress+1)+'번째 동작'}</p><ol class="mg-steps">${c.steps.map((v,i)=>`<li class="${i<s.progress?'done':i===s.progress?'current':''}"><span>${i<s.progress?'✓':i+1}</span>${!s.ready||s.hint||i<s.progress?esc(v):'…'}</li>`).join('')}</ol>${!s.ready?btn('begin','', '기억했어요 · 시작하기 →','class="mg-primary"'):`<div class="mg-options">${shuffle([...new Set(c.steps)]).map(v=>btn('step',v,`${art('wind')}<strong>${esc(v)}</strong>`,'class="mg-option"')).join('')}</div>${btn('hint','',s.hint?'순서 가리기':'순서 다시 살펴보기','class="mg-subtle"')}`}`;
  else if(c.type==='pay')board=`<div class="mg-price">값 <strong>${c.price}닢</strong><span>건넬 돈 <b>${s.selected.reduce((n,i)=>n+c.wallet[i],0)}닢</b></span></div><div class="mg-wallet">${c.wallet.map((n,i)=>btn('coin',i,`<span class="mg-coin">${n}</span><small>${n}닢</small>`,`class="${s.selected.includes(i)?'selected':''}" aria-label="${i+1}번 동전 ${n}닢" aria-pressed="${s.selected.includes(i)}"`)).join('')}</div>${btn('pay','',`돈 건네기 ${art('arrow')}`,'class="mg-primary"')}`;
  else if(c.type==='count'){
    const tokens=shuffle(c.groups.flatMap((g,i)=>Array.from({length:g.amount},()=>i)));
    board=`<div class="mg-cargo">${tokens.map((i,index)=>btn('tally',index,`${propArt(c.groups[i].name)}<span class="mg-sack-label">${c.groups[i].glyph}</span>${s.selected.includes(index)?'<b>✓</b>':''}`,`class="mg-sack sack-${i} ${s.selected.includes(index)?'counted':''}" aria-label="${index+1}번 ${esc(c.groups[i].name.replace(/ 자루$/,'') )} 자루" aria-pressed="${s.selected.includes(index)}"`)).join('')}</div><p class="mg-count-help">자루를 눌러 세거나 아래 장부에 직접 적으세요. 다시 누르면 표시를 지웁니다.</p><div class="mg-counters">${c.groups.map((g,i)=>`<label><span class="sack-${i}">${g.glyph} ${esc(g.name)}</span><input type="number" min="0" max="30" step="1" value="${s.answers[i]}" data-activity-count="${i}" aria-label="${esc(g.name)} 개수"></label>`).join('')}</div>${btn('check','',`장부 확인 ${art('scroll')}`,'class="mg-primary"')}`;
  }else if(c.type==='sort')board=`<div class="mg-tokens">${c.tokens.map(([name],i)=>btn('token',i,`${propArt(name)}<strong>${esc(name)}</strong>`,`class="mg-token ${s.selected.includes(i)?'selected':''} ${s.placed.includes(i)?'placed':''}" aria-pressed="${s.selected.includes(i)}" ${s.placed.includes(i)?'disabled':''}`)).join('')}</div><div class="mg-bins">${c.bins.map((name,i)=>btn('bin',i,`<span>${esc(name)}</span><div class="mg-bin-slots">${c.tokens.map(([label,bin],index)=>bin===i?`<i class="${s.placed.includes(index)?'occupied':''}">${s.placed.includes(index)?propArt(label):'＋'}</i>`:'').join('')}</div>`,'class="mg-bin" '+(!s.selected.length?'disabled':''))).join('')}</div>`;
  else if(c.type==='route')board=`<div class="mg-route-legend">${c.stops.map(stop=>`<span class="${s.visited.includes(stop.cell)?'done':''}">${s.visited.includes(stop.cell)?'✓':'◇'} ${esc(stop.name)}</span>`).join('')}</div><div class="mg-map">${Array.from({length:25},(_,i)=>{const stop=c.stops.find(v=>v.cell===i),blocked=c.blocked.includes(i),adjacent=Math.abs(i%5-s.position%5)+Math.abs(Math.floor(i/5)-Math.floor(s.position/5))===1;const label=blocked?'담장':i===s.position?'내 위치':i===c.end?'도착':stop?.name||'길';return btn('cell',i,i===s.position?art('people'):blocked?'':i===c.end?'도착':stop?esc(stop.name):s.visited.includes(i)?'·':'',`class="mg-cell ${blocked?'wall':''} ${i===s.position?'here':''} ${stop?'landmark':''} ${adjacent&&!blocked?'reachable':''}" aria-label="${Math.floor(i/5)+1}행 ${i%5+1}열 ${label}" ${!adjacent||blocked?'disabled':''}`);}).join('')}</div><p class="mg-map-help">빛나는 옆 칸을 누르거나 방향키로 이동하세요.</p>`;
  return `<section class="mg-panel mg-type-${c.type}" aria-label="${esc(c.title)} 미니게임"><aside class="mg-atmosphere">${activityTableau(s)}<div class="mg-advice"><strong>${esc(helper)}</strong><p>${esc(advice)}</p></div><p class="mg-materials">${esc(materials)}</p><div class="mg-attempts"><span>시도 ${s.moves}</span><span>실수 ${s.mistakes}</span></div></aside><div class="mg-play"><header><span class="mg-eyebrow">${esc({timing:'타이밍',memory:'짝맞추기',sequence:'동작 순서',pay:'동전 계산',count:'수량 확인',sort:'물건 정리',route:'길 찾기'}[c.type])}</span><h2>${esc(c.title)}</h2><p>${esc(c.instruction.replaceAll('가운데로','밝은 구간으로').replaceAll('가운데','밝은 구간'))}</p></header>${!s.cleared?`<div class="mg-progress" aria-label="진행 ${s.progress} / ${goal}">${Array.from({length:goal},(_,i)=>`<i class="${i<s.progress?'filled':''}"></i>`).join('')}<span>${s.progress} / ${goal}</span></div>`:''}<div class="mg-board">${board}</div>${!s.cleared?`<p class="mg-feedback ${s.message?'has-message':''}" role="status">${esc(s.message||'')}</p><footer><button data-action="activity-restart">처음부터 다시 해보기</button></footer>`:''}</div></section>`;
}


