import { events, locationData, npcs, itemData } from "./events.js?v=3";

import { normalizeSave } from "./save-state.js";
import { readSave, writeSave, BACKUP_KEY, SLOT_KEY } from "./storage.js";
import { chapterDialogue, endingLetters } from "./narrative.js";
import { preloadImage, warmScene, warmCharacters } from "./resources.js";

const SAVE_KEY = "jianghu-first-steps-save-v1";
const MUSIC_KEY = "jianghu-first-steps-music-v1";
const AUDIO_KEY = "jianghu-first-steps-audio-v1";
const SETTINGS_KEY = "jianghu-first-steps-settings-v1";
const QA_MODE = new URLSearchParams(window.location?.search || '').has('qa');
let preferences = {guide:true, largeText:false, textSpeed:24, reducedMotion:false};
try { const p=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'); for(const k of ['guide','largeText','reducedMotion'])if(typeof p[k]==='boolean')preferences[k]=p[k];if([0,24,45].includes(p.textSpeed))preferences.textSpeed=p.textSpeed; } catch {}
const writerId = Date.now().toString(36) + Math.random().toString(36).slice(2);
let observedSave = null, storageConflict = false, importGeneration = 0;
try { observedSave=localStorage.getItem(SAVE_KEY); } catch {}
let typingFrame=null, finishTyping=null, inputAfter=0;
let lastCombatFocus=null;
const TERMS = {
  "강호": "무공을 익힌 사람들과 여러 문파, 표국, 장사꾼이 어울려 살아가는 세상.",
  "무공": "몸을 단련해 싸우거나 몸을 지키는 기술. 처음엔 기본 동작부터 배운다.",
  "내공": "몸속의 기운을 천천히 단련한 힘. 무공 기술을 쓸 때 보탬이 된다.",
  "표국": "돈을 받고 사람과 물건을 안전하게 호위해 주는 곳.",
  "문파": "비슷한 무공을 배우는 사람들이 규칙과 사부를 두고 함께 수련하는 집단.",
  "경지": "오래 수련하며 익힌 수준. 높은 숫자를 외우기보다 조금씩 성장한다고 생각하면 된다.",
  "영약": "회복이나 수련을 도와주는 귀한 약. 가방에서 골라 사용한다.",
  "기연": "우연히 만난 사람이나 발견한 기회가 큰 도움으로 이어지는 일.",
  "고수": "오랜 경험과 수련으로 실력이 뛰어난 무림인.",
  "은전": "이 세계에서 물건을 사거나 밥값을 낼 때 쓰는 돈.",
  "비무": "실력을 겨루는 연습 대련. 다치지 않도록 규칙을 정하고 할 수 있다.",
  "호송": "사람이나 짐을 목적지까지 안전하게 데려다주는 일."
};
const eventGlyph = {"생활":"日","인연":"緣","탐험":"山","갈등":"事","성장":"修","사건":"案"};

let state = null;
let toastTimer = null;
let shopFilter = "all";
let musicEnabled = true;
try { musicEnabled = localStorage.getItem(MUSIC_KEY) !== "off"; } catch {}
const mainBgm = document.getElementById("mainBgm");
mainBgm.loop = true;
mainBgm.volume = 0;
let musicPlaying = false;
let musicStarting = false;
let audioSettings = { master:0.8, bgm: 0.28, sfx: 0.62 };
try { const settings=JSON.parse(localStorage.getItem(AUDIO_KEY)||"{}"); for(const key of ["master","bgm","sfx"]) if(Number.isFinite(settings[key]))audioSettings[key]=Math.max(0,Math.min(1,settings[key])); } catch {}
const battleBgm = new Audio("assets/remaster/samurai-battle.mp3");
const trainingBgm = new Audio("assets/remaster/samurai-final-erhu.mp3");
const finalBgm = new Audio("assets/remaster/samurai-final-base.mp3");
battleBgm.loop = trainingBgm.loop = finalBgm.loop = true;
battleBgm.preload = trainingBgm.preload = finalBgm.preload = "none";
let activeCue = null;
let fadeTimer = null;
let audioContext = null;
let effectsBus=null, lastEffectAt=0;
function activeTracks() { return [mainBgm, battleBgm, trainingBgm, finalBgm]; }
function crossfadeCue(cue) {
  const target = cue === "battle" ? battleBgm : cue === "training" ? trainingBgm : cue === "final" ? finalBgm : mainBgm;
  if (activeCue === target && !target.paused) return;
  activeCue = target;
  if (!musicEnabled || document.hidden) return;
  clearInterval(fadeTimer);
  const tracks = activeTracks();
  if (target.paused) target.volume = 0;
  try { target.play().catch(() => {}); } catch {}
  const from = tracks.map((track) => ({track, start: track.volume}));
  const began = performance.now(), duration = 760;
  fadeTimer = setInterval(() => {
    const t = Math.min(1, (performance.now() - began) / duration);
    from.forEach(({track,start}) => {
      track.volume = Math.max(0, Math.min(1, (track === target ? start + (audioSettings.master*audioSettings.bgm - start) * t : start * (1-t))));
      if (t === 1 && track !== target) track.pause();
    });
    if (t === 1) clearInterval(fadeTimer);
  }, 40);
  musicPlaying = true;
}
function setBgmCue(cue) { crossfadeCue(cue); }
function stopAllMusic() { clearInterval(fadeTimer); activeTracks().forEach((track) => { track.pause(); track.volume = 0; }); musicPlaying = false; }
function playSfx(name) {
  if (!audioSettings.sfx || !audioSettings.master || document.hidden) return;
  const stamp=performance.now();if(name==='click'&&stamp-lastEffectAt<65)return;lastEffectAt=stamp;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
    const ctx=audioContext, now=ctx.currentTime, gain=ctx.createGain(), osc=ctx.createOscillator();
    if(!effectsBus){effectsBus=ctx.createDynamicsCompressor();effectsBus.threshold.value=-16;effectsBus.ratio.value=8;effectsBus.connect(ctx.destination);}
    const presets={click:[540,720,.045,"sine"],draw:[260,740,.26,"sawtooth"],slash:[820,180,.19,"triangle"],impact:[115,62,.24,"sawtooth"],block:[430,250,.18,"triangle"],dodge:[300,980,.2,"sine"],skill:[240,920,.42,"sine"],reward:[520,1040,.32,"sine"],victory:[392,784,.75,"triangle"],dialog:[460,520,.07,"sine"]};
    const [a,b,dur,wave]=presets[name]||presets.click;
    osc.type=wave;osc.frequency.setValueAtTime(a,now);osc.frequency.exponentialRampToValueAtTime(Math.max(40,b),now+dur);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(Math.max(.002,audioSettings.master*audioSettings.sfx*.13),now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+dur);
    osc.connect(gain);gain.connect(effectsBus);osc.start(now);osc.stop(now+dur+.01);osc.onended=()=>{osc.disconnect();gain.disconnect();};
    if(name==="impact"||name==="block"){
      const length=Math.floor(ctx.sampleRate*.12), buffer=ctx.createBuffer(1,length,ctx.sampleRate), data=buffer.getChannelData(0);
      for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
      const hit=ctx.createBufferSource(), filter=ctx.createBiquadFilter(), thump=ctx.createGain();
      hit.buffer=buffer;filter.type="lowpass";filter.frequency.value=name==="block"?900:1350;
      thump.gain.setValueAtTime(audioSettings.master*audioSettings.sfx*.2,now);thump.gain.exponentialRampToValueAtTime(.0001,now+.12);
      hit.connect(filter);filter.connect(thump);thump.connect(effectsBus);hit.start(now);hit.onended=()=>{hit.disconnect();filter.disconnect();thump.disconnect();};
    }
  } catch {}
}

function syncMusicButton() {
  const button = document.getElementById("musicToggle");
  if (!button) return;
  button.setAttribute("aria-pressed", String(musicEnabled));
  button.setAttribute("aria-label", musicEnabled ? "배경 음악 끄기" : "배경 음악 켜기");
  button.title = musicEnabled ? "배경 음악 끄기" : "배경 음악 켜기";
  button.textContent = musicEnabled ? "♫" : "♪";
  button.classList.toggle("music-off", !musicEnabled);
}
async function startMusic() {
  if (!musicEnabled || document.hidden || musicStarting || (musicPlaying && activeCue && !activeCue.paused)) return;
  musicStarting = true;
  try {
    const target = activeCue || mainBgm;
    activeCue = target;
    target.volume = audioSettings.master*audioSettings.bgm;
    await target.play();
    musicPlaying = true;
  }
  catch { /* A later user gesture can retry if the browser blocks playback. */ }
  finally { musicStarting = false; }
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
function instrumental(word) {
  const last=word.charCodeAt(word.length-1)-0xac00;
  return word+(last>=0&&last<=11171&&last%28!==0&&last%28!==8?'으로':'로');
}
function storedSave() {
  try{return readSave(localStorage,SAVE_KEY,normalizeSave,makeInitial('나그네')) || readSave(localStorage,BACKUP_KEY,normalizeSave,makeInitial('나그네'));}catch{return null;}
}
function makeInitial(name) {
  return {
    version: 1, started: true, name: name || "나그네", location: "market", hp: 42, maxHp: 42, qi: 18, maxQi: 18,
    coin: 0, exp: 0, bonusAtk: 0, bonusDef: 0, gear: {weapon:null,armor:null}, items: {}, skills: [], sect: "아직 정하지 않음",
    mainStage: 0, flags: {}, trust: {}, rumors: 0, clues: [], done: [], lastDay: {}, day: 1,
    discoveredTerms: ["강호","무공","내공"], history: [], activeEventId: null, tutorial: "intro", combat: null,
    pendingCombatChoice: null, injury: null, guide: preferences.guide, largeText: preferences.largeText, visited: ["market"], dialogueStep:0,
    log: [{title:"낯선 장터", text:"정신을 차리니 낯선 장터였다. 가진 돈은 없고 배는 고프다.", day:1}]
  };
}
function save() {
  if (!state || storageConflict) return false;
  try {
    if(localStorage.getItem(SAVE_KEY)!==observedSave){storageConflict=true;showStorageConflict();return false;}
    const written=writeSave(localStorage,SAVE_KEY,state,normalizeSave,makeInitial('나그네'),{writer:writerId});
    observedSave=JSON.stringify(written);state.savedAt=written.savedAt;state.writer=writerId;
    const chip = document.getElementById("saveStatus");
    if (chip) { chip.innerHTML='<i></i> 저장됨';chip.classList.remove('save-error');chip.classList.add("saved"); }
    return true;
  } catch {
    const chip=document.getElementById('saveStatus');if(chip){chip.innerHTML='<i></i> 저장 안 됨';chip.classList.add('save-error');}
    showToast("자동 저장에 실패했습니다. 저장 메뉴에서 여정을 백업해 주세요.");return false;
  }
}
function savePreferences(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(preferences));}catch{showToast('설정을 보관할 수 없습니다. 현재 실행에는 적용됩니다.');}}
function showStorageConflict(){showModal(`${panelTitle('다른 창에서 여정이 진행됐습니다','이 창의 자동 저장을 멈췄습니다. 이어갈 기록을 직접 선택해 주세요.')}<div class="save-options"><button class="save-option" data-action="reload-latest"><strong>최신 저장으로 이어 하기</strong><small>다른 창이 저장한 여정 불러오기</small></button><button class="save-option" data-action="export"><strong>이 창의 여정 백업</strong><small>현재 화면의 진행을 파일로 보관</small></button></div>`);}
function showToast(message) {
  const node = document.getElementById("toast");
  node.textContent = message;
  node.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("visible"), 2200);
}
function trustOf(id) { return Number(state?.trust?.[id] || 0); }
function npcRecord(id) {
  if(id==="midboss")return {id:"midboss",name:"흰 옷 검객",role:"운해 검성의 제자",portrait:3,hello:"네가 배운 것을 여기서 증명해 보라."};
  if(id==="grandmaster")return {id:"grandmaster",name:"운해 검성",role:"천하제일의 검객",portrait:9,hello:"강호의 마지막 이름을 가릴 때다."};
  const alias={"escort-guard":"guard","wandering-master":"master","bandit-master":"bandit"}[id]||id;
  return npcs.find((person)=>person.id===alias);
}
function relationshipLine(person) {
  if (!person || !state) return "";
  const last=person.name.charCodeAt(person.name.length-1)-0xac00;
  const particle=last>=0&&last<=11171&&last%28!==0?"은":"는";
  const subject=`${person.name}${particle}`;
  const score=trustOf(person.id);
  if (score >= 2) return `${subject} 너를 알아보고 지난번에 나눈 이야기를 먼저 꺼낸다.`;
  if (score > 0) return `${subject} 네 얼굴을 기억한 듯 편하게 말을 건넨다.`;
  if (score < 0) return `${subject} 아직 너를 경계하며 거리를 둔다.`;
  return "";
}
function itemPrice(id) {
  const base=itemData[id]?.price||0;
  return Math.max(1,base-(trustOf("merchant")>=2?1:0));
}
function stats() {
  const weapon = state?.gear?.weapon ? itemData[state.gear.weapon] : null;
  const armor = state?.gear?.armor ? itemData[state.gear.armor] : null;
  return { atk: 5 + (weapon?.atk || 0) + state.bonusAtk + Math.floor(state.exp/10), def: 1 + (weapon?.def || 0) + (armor?.def || 0) + state.bonusDef };
}
function stageName() {
  return ["강호의 첫날","사라진 표물","안개 속 호송","산채의 진실","비급 수련","흰 옷 검객","천하제일 비무","천하제일인"][Math.min(state?.mainStage || 0, 7)];
}
function questInfo() {
  if(state.tutorial!=="free")return {title:state.tutorial==="intro"?"첫 끼니 마련하기":state.tutorial==="reward"?"첫 보상 고르기":"골목에서 무사히 빠져나오기",body:"눈앞의 이야기를 따라 첫걸음을 내딛자.",loc:state.location,eid:null,step:0};
  if (state.mainStage === 0) return {title:"사라진 표물 장부", body:"골목에서 본 표국 표식의 종이를 표사에게 보여 주자. 첫 단서를 찾을 수 있다.", loc:"alley", eid:"case-ledger", step:1};
  if (state.mainStage === 1) return {title:"안개 속의 호송", body:"종이에 적힌 날짜와 나루터를 확인하러 숲길로 가자.", loc:"forest", eid:"case-courier", step:2};
  if (state.mainStage === 2) return {title:"산채 앞의 마지막 선택", body:"호송대의 단서를 따라 산채로 가서 장부가 사라진 까닭을 밝혀 보자.", loc:"stockade", eid:"case-mountain", step:3};
  if (state.mainStage === 3) return {title:"객잔으로 돌아가기", body:"사건은 마무리됐다. 객잔 주인에게 앞으로의 길을 이야기하자.", loc:"inn", eid:"story-epilogue", step:4};
  if (state.mainStage === 4) return {title:"비급의 첫 호흡", body:"청운문 수련장에 가서 사부와 첫 무공을 직접 익히자.", loc:"sect", eid:"story-training", step:5};
  if (state.mainStage === 5) return {title:"흰 옷 검객의 시험", body:"수련을 마쳤다. 숲길을 막아선 검객과 실력을 겨루자.", loc:"forest", eid:"story-midboss", step:6};
  if (state.mainStage === 6) return {title:"천하제일 비무대", body:"산길의 검객이 길을 열었다. 청운문 대련장에서 검성과 마지막 승부를 벌이자.", loc:"sect", eid:"story-final", step:7};
  return {title:"천하제일인", body:"강호가 네 이름을 기억한다. 여정을 다시 살피거나 새롭게 시작할 수 있다.", loc:state.location, eid:null, step:7};
}
function isLocationOpen(id) {
  const loc = locationData[id];
  return Boolean(loc.open || state.mainStage >= (loc.stage || 99));
}
function moveTo(id, {force=false, openEvent=null}={}) {
  if(state.combat || state.injury || state.tutorial!=="free") {showToast("지금 장면을 마친 뒤 이동할 수 있어요.");return;}
  if (!locationData[id]) return;
  if (!force && !isLocationOpen(id)) { showToast(`이곳은 여정 ${locationData[id].stage}단계부터 갈 수 있어요.`); return; }
  if (state.location !== id) {
    state.day += 1;
    state.location = id;
    if (!state.visited.includes(id)) state.visited.push(id);
    state.log.unshift({title:`${locationData[id].name}에 도착`,text:`${locationData[id].hint}을 살펴보기로 했다.`,day:state.day});
  }
  state.activeEventId = openEvent;
  state.dialogueStep=0;
  setBgmCue(state.mainStage>=6&&id==="sect"?"final":id==="sect"&&state.mainStage>=4?"training":"ambient");
  save(); closeModal(); render();
}
function availableEvent(ev) {
  const req = ev.requirements || {};
  if (req.stage != null && state.mainStage < req.stage) return false;
  if (req.mainStage != null && state.mainStage !== req.mainStage) return false;
  if (req.flags && req.flags.some((f) => !state.flags[f])) return false;
  if (!ev.repeat && state.done.includes(ev.id)) return false;
  if (ev.repeat && state.lastDay[ev.id] != null && state.day - state.lastDay[ev.id] < ev.cooldown) return false;
  return true;
}
function addLog(title, text) {
  state.log.unshift({title, text, day:state.day});
  state.log = state.log.slice(0, 50);
}
function grantItem(id, amount=1) {
  if (!itemData[id]) return;
  state.items[id] = (state.items[id] || 0) + amount;
}
function applyEffects(effects={}) {
  if (effects.maxHp) state.maxHp += effects.maxHp;
  if (effects.maxQi) state.maxQi += effects.maxQi;
  if (effects.coin) state.coin = Math.max(0, state.coin + effects.coin);
  if (effects.hp) state.hp = Math.max(1, Math.min(state.maxHp, state.hp + effects.hp));
  if (effects.qi) state.qi = Math.max(0, Math.min(state.maxQi, state.qi + effects.qi));
  if (effects.exp) state.exp += effects.exp;
  if (effects.atk) state.bonusAtk += effects.atk;
  if (effects.def) state.bonusDef += effects.def;
  if (effects.item) grantItem(effects.item, 1);
  if (effects.items) Object.entries(effects.items).forEach(([id,count])=>grantItem(id,count));
  if (effects.learn && !state.skills.includes(effects.learn)) state.skills.push(effects.learn);
  if (effects.sect) state.sect = effects.sect;
  if (effects.mainStage != null) state.mainStage = effects.mainStage;
  if (effects.trust) Object.entries(effects.trust).forEach(([id, delta]) => { state.trust[id] = (state.trust[id] || 0) + delta; });
  if (effects.flags) Object.assign(state.flags, effects.flags);
  if (effects.rumor) state.rumors += effects.rumor;
  if (effects.learnGlossary) effects.learnGlossary.forEach(learnTerm);
  if (effects.day) state.day += effects.day;
  if (effects.rest) { state.hp = state.maxHp; state.qi = state.maxQi; state.day += 1; }
}
function learnTerm(term) { if (TERMS[term] && !state.discoveredTerms.includes(term)) state.discoveredTerms.push(term); }
function applyChoice(ev, choice) {
  if(!choice || state.combat || !availableEvent(ev))return;
  if(choice.effects.coin<0 && state.coin < -choice.effects.coin){showToast("은전이 모자랍니다. 다른 행동을 골라 주세요.");return;}
  if (choice.effects.combat) {
    state.pendingCombatChoice = {eventId:ev.id, choice:ev.choices.indexOf(choice)};
    state.activeEventId = null;
    startCombat(choice.effects.combat);
    return;
  }
  const effects = {...choice.effects}; delete effects.combat;
  applyEffects(effects);
  finishEvent(ev, choice);
}
function finishEvent(ev, choice) {
  if (!ev.repeat && !state.done.includes(ev.id)) state.done.push(ev.id);
  if (ev.repeat) state.lastDay[ev.id] = state.day;
  state.activeEventId = null;
  addLog(ev.title, choice.result);
  state.result={title:ev.title,text:choice.result,reward:effectSummary(choice.effects)};
  if (ev.followUp) {
    const follow = events.find((candidate) => candidate.id === ev.followUp);
    if (follow && availableEvent(follow)) addLog("이어지는 소문", `${follow.title}에 관한 이야기가 들린다.`);
  }
  save(); render();
}

function sprite(file, index, cols, rows, className="item-sprite", alt="") {
  const col = index % cols, row = Math.floor(index / cols);
  return `<div class="${className}" aria-hidden="true"><img src="assets/${file}" alt="${esc(alt)}" loading="lazy" style="width:${cols*100}%;height:${rows*100}%;left:${-col*100}%;top:${-row*100}%"></div>`;
}
function locSprite(id, className="location-art") {
  const index = locationData[id].image, col = index % 4, row = Math.floor(index / 4);
  return `<div class="${className}" role="img" aria-label="${esc(locationData[id].name)} 풍경"><img src="assets/locations-atlas.png" alt="" loading="lazy" style="left:${-col*100}%;top:${-row*100}%"></div>`;
}
function portrait(id, className="portrait-crop") {
  const person = npcs.find((p) => p.id === id) || npcs[0];
  const col = person.portrait % 5, row = Math.floor(person.portrait / 5);
  return `<div class="${className}" role="img" aria-label="${esc(person.name)} 초상"><img src="assets/portraits-atlas.png" alt="" loading="lazy" style="left:${-col*100}%;top:${-row*100}%"></div>`;
}
function itemSprite(id, className="item-sprite") {
  const item = itemData[id];
  return item ? sprite(item.atlas||"items-atlas.png", item.sprite, item.cols||4, item.rows||4, className, item.name) : `<div class="${className}"></div>`;
}
function renderStart() {
  const saved = storedSave();
  document.getElementById("quickNav").hidden = true;
  document.getElementById("app").innerHTML = `
    <section class="welcome" aria-label="강호 첫걸음 게임 시작">
      <div class="welcome-content">
        <div class="eyebrow">一飯之恩 · 밥 한 끼에서 시작된 인연</div>
        <h1>강호<br><span>첫걸음</span></h1>
        <p class="welcome-lead">주머니는 비었고, 손에는 목검 하나.<br>검보다 먼저 사람을 살피는 당신의 선택이<br>강호에 새로운 이름을 남깁니다.</p>
        <div class="welcome-meta"><span class="tag">선택으로 쓰는 무협</span><span class="tag">세 번의 승부</span><span class="tag">하나의 완결된 여정</span></div>
        <div class="button-row">
          ${saved?.started ? `<button class="btn btn-primary" data-action="continue">이어 하기 <span aria-hidden="true">→</span></button>` : ''}
          <button class="btn ${saved?'btn-quiet':'btn-primary'}" data-action="new-game">새 여정 시작 ${saved?'':'→'}</button>
        </div>
        ${saved?`<p class="continue-caption">${esc(saved.name)} · ${esc(locationData[saved.location].name)} · ${saved.day}일째</p>`:''}
        <div class="title-links"><button data-action="settings">설정</button><button data-action="save-panel">저장 관리</button><button data-panel="about">게임 안내 · 크레딧</button></div>
      </div>
      <div class="title-art" aria-hidden="true"><div class="title-moon"></div><span class="title-calligraphy">江<br>湖<br>初<br>行</span><img src="assets/remaster/traveler-standing.webp" alt="" width="1024" height="1536"><span class="title-seal">첫<br>걸음</span></div>
      <div class="welcome-foot">강호 첫걸음 · 이야기의 끝에서 당신의 선택을 기억합니다</div>
    </section>
    <p class="title-note">진행은 이 브라우저에 자동 저장됩니다 · 마우스 또는 키보드로 플레이</p>`;
}
function renderSidebar() {
  const st = stats(), weapon = state.gear.weapon ? itemData[state.gear.weapon] : null, armor = state.gear.armor ? itemData[state.gear.armor] : null;
  const quest = questInfo();
  const hpPct = Math.max(0, Math.min(100, state.hp/state.maxHp*100));
  const qiPct = Math.max(0, Math.min(100, state.qi/state.maxQi*100));
  const expPct = Math.min(100, (state.exp%10)*10);
  return `<aside class="sidebar">
    <section class="panel player-card">
      <div class="player-top"><h2 class="player-name">${esc(state.name)}</h2><span class="rank-chip">${state.mainStage<2?"강호 새내기":state.mainStage<4?"초급 무림인":"강호의 벗"}</span></div>
      <p class="player-sub">${esc(state.sect)} · ${stageName()}</p>
      <div class="stat-line"><span>체력 · 몸의 상태</span><span class="stat-number">${state.hp} / ${state.maxHp}</span></div><div class="meter"><span style="width:${hpPct}%"></span></div>
      <div class="stat-line"><span>내공 · 기술에 쓰는 힘</span><span class="stat-number">${state.qi} / ${state.maxQi}</span></div><div class="meter qi"><span style="width:${qiPct}%"></span></div>
      <div class="side-rule"></div>
      <div class="side-grid"><div class="side-stat"><small>은전 · 가진 돈</small><strong>${state.coin} 냥</strong></div><div class="side-stat"><small>공격 · 방어</small><strong>${st.atk} / ${st.def}</strong></div></div>
      ${weapon ? `<div class="equipped-row">${itemSprite(state.gear.weapon,"mini-sprite")}<div><strong>${esc(weapon.name)}</strong><small>장착 무기 · 공격 +${weapon.atk||0}</small></div></div>` : `<div class="equipped-row"><div class="mini-sprite"></div><div><strong>맨손</strong><small>장착한 무기가 없습니다</small></div></div>`}
      ${armor ? `<div class="equipped-row">${itemSprite(state.gear.armor,"mini-sprite")}<div><strong>${esc(armor.name)}</strong><small>장착 방어구 · 방어 +${armor.def||0}</small></div></div>` : ""}
      <div class="stat-line"><span>수련 ${Math.floor(state.exp/10)+1}단 · 공격 보너스 +${Math.floor(state.exp/10)}</span><span class="stat-number">${state.exp%10} / 10</span></div><div class="meter exp"><span style="width:${expPct}%"></span></div>
    </section>
    <section class="panel goal-card"><span class="goal-label">현재 목표 · ${quest.step}/7</span><h3>${esc(quest.title)}</h3><p>${esc(quest.body)}</p><div class="progress-track">${[0,1,2,3,4,5,6].map((n)=>`<span class="${state.mainStage>n?"done":""}"></span>`).join("")}</div><button class="btn btn-small btn-light" style="margin-top:12px" data-action="quest">목표로 이동 <span aria-hidden="true">→</span></button></section>
    <section class="panel side-shortcuts"><button data-panel="map">지도</button><button data-panel="inventory">가방</button><button data-panel="glossary">수첩</button><button data-panel="people">인물</button></section>
  </aside>`;
}
function renderGameFrame(content, {hero=false}={}) {
  const loc = locationData[state.location];
  const art = hero ? `<div class="location-art hero-art" role="img" aria-label="해 질 무렵 장터 풍경"></div>` : locSprite(state.location);
  const visited = state.visited.length;
  return `<div class="game-layout ${state.largeText?"large-text":""}"><details class="journey-drawer"><summary><span class="drawer-health">♥ ${state.hp}/${state.maxHp} · 氣 ${state.qi}/${state.maxQi}</span><span class="drawer-goal">${esc(questInfo().title)}</span><span class="drawer-caret">＋</span></summary>${renderSidebar()}</details><section class="main-column">
    <div class="panel location-banner">${art}<div class="location-copy"><div class="location-kicker">CURRENT LOCATION · ${String(loc.image+1).padStart(2,"0")}</div><h2>${esc(loc.name)}</h2><p>${esc(loc.hint)}. ${hero?"처음 만난 이곳에는 낯선 말과 익숙한 밥 냄새가 함께 있다.":"사람들의 표정과 길목을 천천히 살펴본다."}</p><div class="location-meta"><span class="soft-tag">${visited} / 8곳 방문</span><span class="soft-tag">${state.rumors}개의 소문</span><span class="soft-tag">${state.discoveredTerms.length}개 용어 수첩</span></div></div></div>
    <div class="chapter-strip"><strong>${esc(stageName())}</strong><span class="date-label">${state.day}일째</span></div>
    ${content}
  </section></div>`;
}
function eventCard(ev, quest=false) {
  const person = npcRecord(ev.npc);
  return `<button class="event-card ${quest?"quest-card":""}" data-action="open-event" data-event="${esc(ev.id)}"><span class="event-mark">${eventGlyph[ev.category]||"事"}</span><span><strong>${esc(ev.title)}</strong><small>${esc(person?.name||"강호 사람")} · ${esc(ev.category)}</small></span><span class="event-arrow">›</span></button>`;
}
function questEvent() { const q=questInfo(); return q.eid ? events.find((e)=>e.id===q.eid) : null; }
function renderEventScene(ev) {
  const beats=chapterDialogue[ev.id];
  if(beats && (state.dialogueStep||0)<beats.length)return renderChapterDialogue(ev,beats);
  const person = npcRecord(ev.npc);
  const standing = ev.npc === "bandit-master" ? "bandit-standing" : ev.npc === "mentor" ? "mentor-standing" : ev.npc === "midboss" ? "midboss-standing" : ev.npc === "grandmaster" ? "grandmaster-standing" : null;
  const figure = standing ? `<img class="event-standing" src="assets/remaster/${standing}.webp" alt="${esc(person?.name||"강호 사람")} 전신 모습">` : "";
  const intro = `<div class="scene-heading"><div><h2>${esc(ev.title)}</h2><p>${esc(person?.name||"누군가")} · ${esc(person?.role||"강호 사람")}</p></div><span class="scene-badge">${esc(ev.category)}</span></div>
    ${figure?`<div class="event-portrait-stage">${figure}<span>${esc(person?.name||"")}</span></div>`:""}
    <div class="story-box">${person&&!beats?`<p><strong>${esc(person.name)}:</strong> ${esc(person.hello)} ${esc(relationshipLine(person))}</p>`:""}<p>${esc(ev.intro)}</p></div>
    <div class="event-actions">${ev.choices.map((c,i)=>`<button class="choice-button" data-action="choose-event" data-index="${i}" ${c.effects.coin<0&&state.coin < -c.effects.coin?"disabled":""}><span class="choice-num">0${i+1}</span><span class="choice-title">${esc(c.label)}</span>${state.guide?`<span class="choice-hint">${esc(c.hint)}</span>`:""}</button>`).join("")}</div>
    <div class="scene-foot"><small>선택에 따라 돈, 체력, 인물의 신뢰와 다음 사건이 달라질 수 있어요.</small><button class="btn btn-small" data-action="leave-event">잠시 뒤에 보기</button></div>`;
  return `<section class="panel scene-card event-scene ${figure?"has-standing":""}">${intro}</section>`;
}
function renderChapterDialogue(ev,beats) {
  const step=Math.min(beats.length-1,state.dialogueStep||0), [speaker,text]=beats[step];
  const person=npcRecord(ev.npc), figure={mentor:'mentor',midboss:'midboss',grandmaster:'grandmaster','bandit-master':'bandit'}[ev.npc];
  return `<section class="panel chapter-dialogue"><div class="scene-heading"><div><p>여정 ${questInfo().step} · ${step+1} / ${beats.length}</p><h2>${esc(ev.title)}</h2></div><button class="btn btn-small" data-action="skip-dialogue">선택으로 건너뛰기</button></div><div class="chapter-stage">${figure?`<img class="chapter-figure" src="assets/remaster/${figure}-standing.webp" width="1024" height="1536" alt="${esc(person.name)}">`:portrait(person?.id,'chapter-portrait')}<div class="chapter-stage-caption">${esc(locationData[state.location].name)}<small>${esc(person?.role||'강호의 이야기')}</small></div></div><div class="chapter-speech"><span class="speaker-name">${esc(speaker==='나'?state.name:speaker)}</span><p class="dialogue-text" data-typewriter>${esc(text)}</p><div class="dialogue-footer"><small>한 번 누르면 문장 완성 · 다시 누르면 다음 대사</small><button class="btn btn-primary" data-action="advance-dialogue">${step===beats.length-1?'선택하기':'다음'} →</button></div></div></section>`;
}
function advanceDialogue(){
  if(finishTyping){finishTyping();return;}if(performance.now()<inputAfter)return;
  const beats=chapterDialogue[state?.activeEventId];if(!beats)return;
  state.dialogueStep=Math.min(beats.length,(state.dialogueStep||0)+1);inputAfter=performance.now()+160;playSfx('dialog');save();render();
}
function areaNarrative(id) {
  const text = {
    market:"노점마다 낯선 물건과 익숙한 음식 냄새가 섞여 있다. 필요한 게 있으면 천천히 물어봐도 된다.",
    inn:"주인장은 손님이 무협을 모른다고 놀리지 않는다. 밥값이나 잠자리부터 차근차근 알려 준다.",
    alley:"큰길에서 한 걸음 벗어난 골목. 서두르지 않으면 지나친 발자국과 사람들의 속말을 들을 수 있다.",
    forest:"숲길 표식은 길을 잃은 사람을 돕기 위해 남긴 흔적이다. 낯선 풀은 함부로 맛보지 않는 편이 좋다.",
    escort:"표국은 짐과 사람을 호위한다. 약속한 목적지까지 안전하게 도착하면 의뢰가 끝난다.",
    stockade:"산채를 지키는 사람들도 저마다 사정이 있다. 대화를 먼저 건네면 칼을 뽑지 않고 풀리는 일도 있다.",
    clinic:"의원은 먼저 상태를 묻고 약을 확인한다. 체력은 몸의 상태, 내공은 무공에 쓰는 힘이다.",
    sect:"문파는 무공을 함께 배우는 사람들의 모임이다. 가입하지 않고 자유 수련자로 남아도 괜찮다."
  };
  return text[id] || "낯선 장소를 천천히 살펴본다.";
}

function effectSummary(fx={}) {
  const bits=[];
  if(fx.coin)bits.push(`은전 ${fx.coin>0?"+":""}${fx.coin}`);
  if(fx.item)bits.push(`${itemData[fx.item]?.name||"물품"} 획득`);
  if(fx.learn)bits.push(({sword:"기초 검식",fist:"기초 권법",lightness:"가벼운 발놀림"}[fx.learn]||"새 무공")+" 습득");
  if(fx.exp)bits.push(`수련 경험 +${fx.exp}`);
  if(fx.items)Object.entries(fx.items).forEach(([id,n])=>bits.push(`${itemData[id]?.name||id} ×${n}`));
  if(fx.day)bits.push(`${fx.day}일의 수련`);
  if(fx.atk)bits.push(`공격 +${fx.atk}`);
  if(fx.def)bits.push(`방어 +${fx.def}`);
  if(fx.trust)bits.push("인물 관계 변화");
  if(fx.hp||fx.qi||fx.rest)bits.push("몸과 호흡의 변화");
  return bits.join(" · ");
}
function renderResult() {
  const r=state.result,q=questInfo();
  return renderGameFrame(`<section class="panel scene-card result-scene"><div class="scene-heading"><div><p>선택의 결과</p><h2>${esc(r.title)}</h2></div><span class="scene-badge">여정에 기록됨</span></div><div class="story-box"><p>${esc(r.text)}</p></div>${r.reward?`<p class="result-reward">${esc(r.reward)}</p>`:""}<div class="result-next"><p>${state.mainStage>=7?"당신의 이름이 강호에 울려 퍼진다.":`다음 이야기 · ${esc(q.title)}`}</p><button class="btn btn-primary" data-action="${state.mainStage>=7?"continue-result":"quest"}">${state.mainStage>=7?"결말 보기":"이야기 계속"} →</button>${state.mainStage<7?`<button class="btn" data-action="continue-result">이곳을 더 둘러보기</button>`:""}</div></section>`);
}

function renderFreeScene() {
  if(state.result)return renderResult();
  if (state.activeEventId) {
    const ev = events.find((candidate)=>candidate.id===state.activeEventId);
    if (ev) return renderGameFrame(renderEventScene(ev));
    state.activeEventId = null;
  }
  // Goal buttons open main scenes with a persistent activeEventId.
  const main = state.mainStage < 7 ? questEvent() : null;
  const candidates = events.filter((ev)=>ev.location===state.location && availableEvent(ev) && ev.id!==main?.id && !["case-ledger","case-courier","case-mountain","story-epilogue"].includes(ev.id));
  const visible = candidates.slice(0,4);
  const selectedQuestHere = main && main.location === state.location && availableEvent(main);
  const sideChoices = `
    <div class="scene-heading"><div><h2>${state.mainStage===4?"강호를 둘러보다":"주변을 살펴보다"}</h2><p>무엇을 할지 고르세요. 사건은 이곳에 머무는 동안 기다립니다.</p></div><span class="scene-badge">${locationData[state.location].name}</span></div>
    <div class="story-box"><p>${esc(areaNarrative(state.location))}</p>${state.guide?`<p>선택지 아래의 짧은 안내를 보고 마음에 드는 행동을 고르면 됩니다. 패배해도 이야기는 계속돼요.</p>`:""}</div>
    <div class="scene-foot"><small>${selectedQuestHere?"이곳에서 현재 목표를 진행할 수 있어요.":"지도의 다른 장소에서도 새로운 사람과 사건을 만날 수 있어요."}</small><div class="button-row"><button class="btn btn-small" data-panel="map">지도</button>${["market","inn"].includes(state.location)?`<button class="btn btn-small" data-panel="shop">가게 둘러보기</button>`:""}${state.location==="inn"?`<button class="btn btn-small" data-action="rest">하루 쉬기</button>`:""}</div></div>`;
  const cards = `${visible.map((ev)=>eventCard(ev)).join("")}${candidates.length>4?`<details class="more-events"><summary>다른 이야기 ${candidates.length-4}개 더 보기</summary>${candidates.slice(4).map(ev=>eventCard(ev)).join("")}</details>`:""}`;
  const deck = `<section class="panel event-deck"><div class="deck-header"><div><h3>이곳의 다른 이야기</h3><p>새 사건은 직접 골라 시작할 수 있어요.</p></div><span class="deck-count">${candidates.length}건 확인</span></div><div class="event-list">${cards||`<div class="empty-events">지금 눈에 띄는 일은 없다.<br>다른 장소를 둘러보거나 하루 쉬었다가 다시 살펴보자.</div>`}</div></section>`;
  return renderGameFrame(`<section class="next-quest"><div><small>다음 여정 · ${questInfo().step}/7</small><h2>${esc(questInfo().title)}</h2><p>${esc(questInfo().body)}</p></div><button class="btn btn-primary" data-action="quest">이야기 계속 →</button></section><section class="panel scene-card explore-card">${sideChoices}</section>${deck}`);
}
function renderIntro() {
  const choices = [
    {label:"객잔 주방 일을 거들고 밥을 얻는다",hint:"체력 조금 회복 · 은전 3닢",coin:3,hp:4,trust:{innkeeper:1},result:"설거지와 장작 나르기를 거들었다. 주인은 따뜻한 밥과 은전 세 닢을 건넸다."},
    {label:"장터를 둘러보며 필요한 것을 묻는다",hint:"은전 2닢 · 상인과 인사",coin:2,trust:{merchant:1},rumors:1,result:"장터의 길을 익히고 은전 두 닢을 받았다. 상인은 작은 소동이 날 수 있다고 귀띔했다."},
    {label:"객잔 앞 수상한 소문을 따라간다",hint:"은전 1닢 · 소문 한 조각",coin:1,rumors:1,flags:{heardFirstRumor:true},result:"사람들이 골목에서 시비가 있었다고 말했다. 길을 알려 준 아이가 은전 한 닢을 건넸다."}
  ];
  const content = `<section class="panel scene-card opening-scene"><div class="scene-heading"><div><h2>첫 끼니를 어떻게 마련할까?</h2><p>북쪽 장터 · 솔바람 객잔 앞</p></div><span class="scene-badge">여정의 시작</span></div>
    <div class="story-box"><p>낯선 장터에서 눈을 떴다. 무림인들이 살아가는 세상, <strong>강호</strong>. 주머니는 비었고 배가 고프다.</p><p>객잔 주인이 손짓한다. “일손을 보태면 따뜻한 밥을 주지.” 그때, 뒷골목에서 다투는 소리가 들린다.</p></div>
    <div class="event-actions">${choices.map((c,i)=>`<button class="choice-button" data-action="opening-choice" data-index="${i}"><span class="choice-num">0${i+1}</span><span class="choice-title">${esc(c.label)}</span>${state.guide?`<span class="choice-hint">${esc(c.hint)}</span>`:""}</button>`).join("")}</div>
    <div class="scene-foot"><small>첫 선택은 작은 보상으로 이어집니다. 전투에서 지더라도 이야기는 계속돼요.</small><button class="btn btn-small" data-panel="glossary">용어 보기</button></div>
  </section>`;
  return renderGameFrame(content,{hero:true});
}
function isHeavy(c) { return c.round % (c.id==="final"?2:3)===(c.id==="final"?1:2); }
function combatSpec(id) {
  if(id==="midboss")return {name:"흰 옷 검객",role:"운해 검성의 제자",hp:32,damage:8,figure:"midboss-standing",intro:"검객의 발이 먼저 움직인다. 세 번째 차례에는 큰 내려베기가 온다."};
  if(id==="final")return {name:"운해 검성",role:"천하제일인",hp:42,damage:9,figure:"grandmaster-standing",intro:"검성의 검은 빠르다. 마지막 승부에서는 자세와 호흡을 읽어라."};
  return {name:"골목의 강도",role:"장터 뒷골목에서 길을 막은 사내",hp:22,damage:5,figure:"bandit-standing",intro:"공격으로 빈틈을 노려라. 방어하면 내공(기술에 쓰는 힘)이 3 회복된다."};
}
function startCombat(id) {
  lastCombatFocus=null;
  const spec = combatSpec(id);
  state.result=null;
  state.encounterStep=null;
  state.combat = {id,enemy:spec.name,enemyHp:spec.hp,enemyMax:spec.hp,enemyDamage:spec.damage,round:0,guard:false,evade:false,turnPending:false,logs:[spec.intro],feedback:spec.intro};
  state.injury = null;
  const prep=state.pendingCombatChoice;
  if(prep && id!=="intro"){
    if(prep.choice===0){state.combat.opening=3;state.combat.feedback="움직임을 먼저 읽었다. 첫 공격 피해 +3.";}
    else {state.combat.openingGuard=true;state.combat.feedback="호흡을 맞췄다. 첫 피격을 줄이고 내공을 3 회복했다.";state.qi=Math.min(state.maxQi,state.qi+3);}
  }
  if (id === "intro") { state.tutorial = "combat"; setBgmCue("battle"); }
  else setBgmCue(id==="final"?"final":"battle");
  playSfx("draw");
  save(); render();
}
function scheduleCombat(combat, action, delay) {
  setTimeout(()=>{if(state?.combat!==combat)return;if(document.hidden||!document.getElementById('modalBackdrop').hidden||storageConflict){scheduleCombat(combat,action,120);return;}action();},delay);
}
function battleLog(text) {
  if (!state.combat) return;
  state.combat.logs.push(text);
  state.combat.logs = state.combat.logs.slice(-8);
}
function renderCombat() {
  const c=state.combat,spec=combatSpec(c.id),st=stats(),playerPct=state.hp/state.maxHp*100,enemyPct=c.enemyHp/c.enemyMax*100;
  const style=state.skills.includes(c.style)?c.style:state.skills[0];
  const skillName={sword:'기초 검식',fist:'기초 권법',lightness:'가벼운 발놀림'}[style]||'기술 없음';
  const skillPreview=style?(state.qi<8?'내공 부족 · 방어로 +3':{sword:'내공 8 · 피해 +7',fist:'내공 8 · 피해 +5 / 방어',lightness:'내공 8 · 피해 +3 / 회피'}[style]):'수련 후 사용 가능';
  const heavy=isHeavy(c);
  const disabled=c.turnPending?"disabled":"";
  const content=`<section class="combat-shell combat-screen ${c.turnPending?"combat-resolving":""}">
    <div class="combat-title"><div><span>DUEL · ${c.round+1} 번째 공방</span><h2>${c.id==="intro"?"골목의 첫 승부":c.id==="midboss"?"흰 옷 검객의 시험":"천하제일 비무"}</h2></div><span class="scene-badge">${c.round+1} / 무공 겨루기</span></div>
    <div class="battlefield ${c.turnPending&&["attack","skill"].includes(c.lastMove)?"player-strike":""}">
      <div class="fighter fighter-player"><img class="battle-figure" src="assets/remaster/traveler-standing.webp" alt="${esc(state.name)}"><div class="fighter-name">${esc(state.name)} <small>나그네</small></div></div>
      <div class="battle-vs">VS</div>
      <div class="fighter fighter-enemy ${c.damageFloat?"enemy-stagger":""}"><img class="battle-figure" src="assets/remaster/${spec.figure}.webp" alt="${esc(c.enemy)}">${c.damageFloat?`<span class="damage-number">${c.damageFloat}</span>`:""}<div class="fighter-name">${esc(c.enemy)} <small>${esc(spec.role)}</small></div></div>
      <div class="combat-hud"><div><div class="hud-label">체력 ${state.hp} / ${state.maxHp}</div><div class="battle-meter"><span class="health-fill" style="width:${playerPct}%"></span></div><small>내공 ${state.qi} / ${state.maxQi}<span class="battle-stats"> · 공격 ${st.atk} · 방어 ${st.def}</span></small></div><div><div class="hud-label">상대 ${c.enemyHp} / ${c.enemyMax}</div><div class="battle-meter"><span class="enemy-fill" style="width:${enemyPct}%"></span></div></div></div>
      <div class="enemy-intent ${heavy?"intent-heavy":""}"><span>${heavy?"⚠ 강공 예고":"상대의 다음 수"}</span><strong>${heavy?"큰 내려베기 · 방어 또는 회피 권장":"간격을 좁히고 공격할 준비를 합니다"}</strong></div>
      ${c.feedback?`<div class="combat-callout" role="status" aria-live="polite">${esc(c.feedback)}</div>`:""}
      ${c.turnPending?`<div class="turn-shade" role="status">공방이 이어집니다…</div>`:""}
    </div>
    <div class="combat-console"><div class="combat-console-head"><div><strong>무엇을 하시겠습니까?</strong><small>한 차례에 하나의 행동을 고르세요.</small></div><span>차례 ${c.round+1}</span></div>
      ${state.skills.length>1?`<label class="combat-style">사용할 무공 <select data-combat-style aria-label="사용할 무공" ${disabled}>${state.skills.map(s=>`<option value="${s}" ${s===style?'selected':''}>${{sword:'기초 검식',fist:'기초 권법',lightness:'가벼운 발놀림'}[s]}</option>`).join('')}</select></label>`:''}
      <div class="combat-actions">
        <button class="combat-action action-primary" data-action="combat-move" data-move="attack" ${disabled}><span>⚔</span><strong>기본 공격</strong><small>피해 ${st.atk+(c.opening||0)}+</small></button>
        <button class="combat-action ${heavy?'recommended-action':''}" data-action="combat-move" data-move="defend" ${disabled}><span>◈</span><strong>방어</strong><small>내공 +3 · 피해 감소</small></button>
        <button class="combat-action" data-action="combat-move" data-move="dodge" ${disabled||state.qi<2?"disabled":""}><span>〰</span><strong>회피</strong><small>내공 −2 · 반격 +3</small></button>
        <button class="combat-action" data-action="combat-move" data-move="skill" ${disabled||!state.skills.length||state.qi<8?"disabled":""}><span>✦</span><strong>${esc(skillName)}</strong><small>${esc(skillPreview)}</small></button>
        <button class="combat-action" data-action="combat-items" ${disabled}><span>囊</span><strong>회복 물품</strong><small>가방에서 선택</small></button>
        <button class="combat-action" data-action="combat-move" data-move="flee" ${disabled}><span>↗</span><strong>물러서기</strong><small>정비 후 다시 도전</small></button>
      </div><p class="combat-tip">${c.id==="intro"?"상대의 어깨가 먼저 움직입니다. 눈을 보고 다음 수를 골라 보세요.":"상대가 크게 칼을 들 때 방어하거나 회피하면 피해를 줄일 수 있습니다."}</p>
    </div>
  </section>`;
  if(c.turnPending&&!c.resolveTimer){c.resolveTimer=true;scheduleCombat(c,resolvePendingStrike,450);}
  return renderGameFrame(content);
}
function renderInjury() {
  const intro=state.injury==="intro";
  const text=intro?"주인장과 표사가 골목의 소동을 말렸다. 다친 곳을 치료받고 다시 도전하거나, 이 도움을 받아 첫 보상으로 이어갈 수 있다.":"사부가 승부를 멈추고 네 어깨를 받쳐 준다. 숨을 고르고 다시 겨루거나, 조언을 들으며 한 번 더 도전할 수 있다.";
  const content=`<section class="panel scene-card"><div class="scene-heading"><div><h2>잠시 숨을 고르자</h2><p>패배는 끝이 아닙니다. 치료하고 다시 선택할 수 있어요.</p></div><span class="scene-badge">회복과 재도전</span></div><div class="story-box"><p>${text}</p><p>체력과 내공이 회복됩니다. 선택한 보상과 수첩, 다른 사건은 사라지지 않아요.</p></div><div class="event-actions"><button class="choice-button" data-action="retry"><span class="choice-num">01</span><span class="choice-title">치료받고 바로 재도전</span>${state.guide?`<span class="choice-hint">체력·내공 회복 · 전투 다시 시작</span>`:""}</button><button class="choice-button" data-action="accept-help"><span class="choice-num">02</span><span class="choice-title">${intro?"도움을 받아 골목을 벗어난다":"사부의 조언을 듣고 다시 도전한다"}</span>${state.guide?`<span class="choice-hint">${intro?"치료 후 첫 보상으로":"모두 회복 · 상대의 위력 감소"}</span>`:""}</button></div></section>`;
  return renderGameFrame(content);
}
function renderReward() {
  const content=`<section class="panel scene-card"><div class="scene-heading"><div><h2>첫 보상을 고르자</h2><p>장터 소동은 끝났다. 주인장과 사부가 작은 답례를 내놓는다.</p></div><span class="scene-badge">첫 보상</span></div><div class="story-box"><p>잡배는 달아났고, 당신은 무사하다. 주인은 잘 버텼다며 네가 원하는 걸 하나 고르라고 한다.</p><p>무기는 전투에서 힘을 더하고, 무공을 배우면 내공을 써서 강한 기술을 쓸 수 있다. 검식은 강한 일격, 권법은 공격과 방어, 발놀림은 공격과 회피를 함께 펼친다.</p></div><div class="reward-grid">
    <button class="reward-option" data-action="reward" data-reward="weapon">${itemSprite("weapon-iron-jian","reward-art")}<strong>무명 철검</strong><small>공격력 +3 · 바로 장착<br>목검보다 한 단계 높은 무기</small></button>
    <button class="reward-option" data-action="reward" data-reward="gauntlet">${itemSprite("weapon-iron-gauntlets","reward-art")}<strong>철권 보호대</strong><small>공격력 +2 · 방어력 +1<br>권법에 어울리는 장비</small></button>
    <button class="reward-option" data-action="reward" data-reward="manual">${itemSprite("weapon-jade-jian","reward-art")}<strong>기초 검식 한 수</strong><small>전투에서 내공 8을 써 강하게 공격</small></button>
    </div><div class="scene-foot"><small>무엇을 골라도 주요 이야기는 계속 진행됩니다.</small></div></section>`;
  return renderGameFrame(content);
}
function renderEnding() {
  const path=state.flags.finalApproach==="allies"?"동료의 믿음을 등에 업고":"비급으로 익힌 호흡을 따라";
  const bond=state.trust.bandit>0||state.trust.guard>1?"길 위에서 맺은 인연은 대련장 끝에서도 너를 지켜보았다.":"사부가 가르친 첫 자세와 스스로의 판단을 끝까지 밀고 나갔다.";
  const content=`<section class="panel scene-card final-ending"><div class="ending-heading"><span>THE NAME OF JIANGHU</span><h2>천하제일인</h2><p>${esc(state.name)} · 새로운 강호의 이름</p></div><div class="ending-stage"><img src="assets/remaster/traveler-standing.webp" alt="천하제일인이 된 ${esc(state.name)}"><div class="ending-seal">天下<br>第一</div></div><div class="story-box ending-copy"><p>구름 위 대련장에 검성이 천천히 검을 거둔다. ${esc(path)} 마지막 초식을 넘어섰다.</p><p>${esc(bond)} 사람들은 저마다 살아갈 길을 찾았고, 강호는 이제 네 이름을 기억한다.</p><p>${state.flags.assisted?"사부의 조언을 빌렸지만 마지막 한 수는 네 손으로 완성했다. ":""}첫날엔 밥값도, 내공도 몰랐다. 그때 골목에서 쥐었던 목검 한 자루가 오늘의 너를 만들었다.</p></div><div class="ending-stats"><span>${state.day}일의 강호행</span><span>${state.done.length}개의 사건 해결</span><span>${state.visited.length}곳 방문</span><span>${state.skills.length}개의 무공</span></div><details class="ending-letters"><summary>강호에서 도착한 편지</summary>${endingLetters(state).map(([name,text])=>`<article><strong>${esc(name)}</strong><p>${esc(text)}</p></article>`).join("")}</details><div class="ending-actions"><button class="btn btn-primary" data-action="log">여정의 기록 보기</button><button class="btn btn-light" data-action="new-game">새로운 여정</button></div><p class="ending-foot">一劍江湖 · 한 자루의 목검으로 시작한 강호행</p></section>`;
  return renderGameFrame(content);
}
function startTypewriter(){
  if(typingFrame!=null)cancelAnimationFrame(typingFrame);typingFrame=null;finishTyping=null;
  const node=document.querySelector('#app [data-typewriter]');
  if(!node||!preferences.textSpeed||preferences.reducedMotion||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const text=node.textContent,letters=Array.from(text),started=performance.now();
  node.innerHTML=`<span class="tw-full">${esc(text)}</span><span class="tw-visible" aria-hidden="true"></span>`;
  const visible=node.querySelector('.tw-visible');
  finishTyping=()=>{if(typingFrame!=null)cancelAnimationFrame(typingFrame);node.textContent=text;typingFrame=null;finishTyping=null;inputAfter=performance.now()+100;};
  const tick=()=>{if(!node.isConnected){finishTyping=null;return;}const count=Math.min(letters.length,Math.floor((performance.now()-started)/preferences.textSpeed));visible.textContent=letters.slice(0,count).join('');if(count>=letters.length){finishTyping();return;}typingFrame=requestAnimationFrame(tick);};
  typingFrame=requestAnimationFrame(tick);
}
function stageMarkup(root,markup){
  const actors=[...root.querySelectorAll('img.standing-figure,img.battle-figure,img.event-standing,img.chapter-figure')];
  root.innerHTML=markup;
  for(const next of root.querySelectorAll('img.standing-figure,img.battle-figure,img.event-standing,img.chapter-figure')){
    const previous=actors.find(img=>img.getAttribute('src')===next.getAttribute('src')&&img.className===next.className);
    if(previous)next.replaceWith(previous);
  }
}
function render() {
  const root=document.getElementById("app"), nav=document.getElementById("quickNav");
  const sceneKey=!state?"welcome":state.combat?`combat-${state.combat.id}`:state.injury?`injury-${state.injury}`:state.result?`result-${state.result.title}`:state.activeEventId?`${state.activeEventId}-${state.dialogueStep||0}`:`${state.tutorial}-${state.mainStage}-${state.location}-${state.encounterStep??""}`;
  const previousScene=root.dataset.scene,changed=previousScene!==sceneKey, active=document.activeElement;
  if(active?.dataset?.move)lastCombatFocus=active.dataset.move;
  const focusMove=state?.combat?lastCombatFocus:null;
  const styleFocus=active?.hasAttribute?.('data-combat-style');
  const drawerOpen=root.querySelector('.journey-drawer')?.open;
  root.dataset.scene=sceneKey;
  document.body.classList.toggle("large-text",preferences.largeText);
  document.body.classList.toggle('reduce-motion',preferences.reducedMotion);
  document.body.dataset.scene=state?.combat?"combat":state?.tutorial||"welcome";
  document.getElementById('saveStatus').hidden=!state;
  renderBackdrop();
  let markup;
  if (!state?.combat && (state?.tutorial === "encounter" || state?.encounterStep != null)) {
    nav.hidden = true;
    markup=renderEncounter();
  } else if (!state) { renderStart(); }
  else {
    nav.hidden=Boolean(state.combat);
    if (state.tutorial==="intro") markup=renderIntro();
    else if (state.injury) markup=renderInjury();
    else if (state.tutorial==="combat" || state.combat) markup=renderCombat();
    else if (state.tutorial==="reward") markup=renderReward();
    else if (state.result) markup=renderResult();
    else if (state.mainStage>=7) markup=renderEnding();
    else markup=renderFreeScene();
  }
  if(markup)stageMarkup(root,markup);
  if(drawerOpen&&!changed){const drawer=root.querySelector('.journey-drawer');if(drawer)drawer.open=true;}
  if(!changed&&document.getElementById('modalBackdrop').hidden){if(styleFocus)root.querySelector('[data-combat-style]')?.focus({preventScroll:true});else if(focusMove)root.querySelector(`[data-move="${focusMove}"]:not(:disabled)`)?.focus({preventScroll:true});}
  if(changed)requestAnimationFrame(()=>{
    if(root.dataset.scene!==sceneKey)return;
    if(!(state?.activeEventId&&previousScene?.startsWith(state.activeEventId+'-'))&&!(state?.tutorial==='encounter'&&previousScene?.startsWith('encounter-')))window.scrollTo({top:0,behavior:'instant'});
    if(document.getElementById('modalBackdrop').hidden){const focus=root.querySelector('[data-action="advance-dialogue"],[data-action="advance-encounter"],h2,h1');if(focus){if(focus.tagName!=='BUTTON')focus.tabIndex=-1;focus.focus({preventScroll:true});}}
    startTypewriter();
  });
}

function renderBackdrop() {
  const host = document.getElementById("worldBackdrop");
  if (!host) return;
  const locationId = state?.location || "market";
  const portraitMode = window.matchMedia?.("(max-aspect-ratio: 3/4)").matches;
  const isFinal = state?.combat?.id === "final" || (state?.mainStage >= 6 && locationId === "sect");
  const backdropKey=`${locationId}-${isFinal}-${portraitMode}`;
  if(host.dataset.scene===backdropKey){const tile=host.querySelector('.world-scene-window');if(tile){const width=Math.max(window.innerWidth,window.innerHeight*2/3);tile.style.width=width+'px';tile.style.height=width*1.5+'px';}return;}
  host.dataset.scene=backdropKey;
  const sceneArt = isFinal
    ? (portraitMode ? "assets/remaster/final-mobile.webp" : "assets/remaster/final-wide.webp")
    : locationId === "sect"
      ? (portraitMode ? "assets/remaster/training-mobile.webp" : "assets/remaster/training-wide.webp")
    : locationId === "alley"
      ? (portraitMode ? "assets/remaster/alley-mobile.webp" : "assets/remaster/alley-wide.webp")
      : locationId === "market"
        ? "assets/market-hero.png"
      : null;
  if (sceneArt) {
    const apply=()=>{if(host.dataset.scene===backdropKey)host.innerHTML=`<div class="world-hero-image" style="background-image:url('${sceneArt}')"></div><div class="world-scrim"></div>`;};
    if(typeof Image!=='undefined')preloadImage(sceneArt).then(apply);else apply();
    return;
  }
  const index = locationData[locationId]?.image ?? 0;
  const col = index % 4, row = Math.floor(index / 4);
  const tileWidth = Math.max(window.innerWidth, window.innerHeight * 2 / 3);
  const tileHeight = tileWidth * 1.5;
  host.innerHTML = `<div class="world-scene-window" style="width:${tileWidth}px;height:${tileHeight}px"><img src="assets/locations-atlas.png" alt="" style="left:${-col*100}%;top:${-row*100}%"></div><div class="world-scrim"></div>`;
}

function renderEncounter() {
  const step = Math.min(4, Math.max(0, Number(state.encounterStep) || 0));
  const lines = [
    {speaker:"나레이션", text:`${state.log.find(entry=>entry.title==="첫 선택")?.text||"장터를 뒤로하고 골목에 들어섰다."} 골목을 돌아서는 순간, 어둠 속 사내가 앞을 막는다.`},
    {speaker:"강도", text:"잠깐. 이 골목을 지나려면 가진 것을 내놔."},
    {speaker:state.name, text:"물러날 길이 없다. 저 사람이 검을 드는 순간을 보자."},
    {speaker:"나레이션", text:"객잔 주인이 급히 쥐여 준 목검을 허리춤에서 꺼내 든다. 목검은 수련에 쓰는 나무 검이다. 가볍지만, 손에 익히면 사람을 지킬 수 있다."},
    {speaker:"강도", text:"목검 하나로 날 상대하겠다고? 좋아, 어디 한번 덤벼 봐!"}
  ];
  const line = lines[step];
  return `<section class="encounter-screen" aria-live="polite">
    <div class="cinematic-kicker"><span>ACT I · 북쪽 장터 뒷골목</span><span>${step+1} / ${lines.length}</span></div>
    <div class="encounter-stage">
      <img class="standing-figure protagonist-figure ${step===0?"enter-left":""}" src="assets/remaster/traveler-standing.webp" alt="목검을 든 ${esc(state.name)}">
      <img class="standing-figure bandit-figure ${step===0?"enter-right":""}" src="assets/remaster/bandit-standing.webp" alt="길을 막아선 강도">
      <span class="scene-caption">장터의 불빛이 골목 끝으로 멀어진다</span>
      ${step===1||step===4?`<div class="speech-burst">${step===1?"흥":"!"}</div>`:""}
    </div>
    <div class="dialogue-panel encounter-dialogue">
      <div class="speaker-name">${esc(line.speaker)}</div>
      <p class="dialogue-text" data-typewriter>${esc(line.text)}</p>
      <button class="btn btn-primary dialogue-advance" data-action="advance-encounter">${step===lines.length-1?"전투 시작":"다음"} <span aria-hidden="true">→</span></button>
    </div>
  </section>`;
}

function openingChoice(index) {
  if(state.tutorial!=="intro")return;
  const options=[
    {coin:3,hp:4,trust:{innkeeper:1},text:"설거지와 장작 나르기를 거들었다. 주인은 따뜻한 밥과 은전 세 닢을 건넸다."},
    {coin:2,trust:{merchant:1},rumor:1,text:"장터의 길을 익히고 은전 두 닢을 받았다. 상인은 작은 소동이 날 수 있다고 귀띔했다."},
    {coin:1,rumor:1,flags:{heardFirstRumor:true},text:"골목의 소문을 들었다. 도움을 청한 아이가 은전 한 닢을 건넸다."}
  ];
  const picked=options[index]; if(!picked)return;
  applyEffects(picked); learnTerm("표국");
  addLog("첫 선택",picked.text);
  state.location="alley";
  if(!state.visited.includes("alley"))state.visited.push("alley");
  state.day+=1;
  grantItem("weapon-practice-sword");
  state.gear.weapon="weapon-practice-sword";
  state.tutorial="encounter";
  state.encounterStep=0;
  state.combat=null;
  setBgmCue("ambient");
  save();render();
}
function advanceEncounter() {
  if(state.tutorial!=="encounter")return;
  if(finishTyping){finishTyping();return;}if(performance.now()<inputAfter)return;inputAfter=performance.now()+160;
  const last=4;
  if(Number(state.encounterStep)<last) { state.encounterStep=Number(state.encounterStep)+1; playSfx("dialog"); save(); render(); return; }
  state.encounterStep=null;
  startCombat("intro");
  battleLog("목검을 든 초심자와 골목의 강도가 마주 섰다. 한 번에 하나씩 행동해 보자.");
  save();render();
}
function winCombat() {
  const id=state.combat.id;
  if(state.combat.assisted)state.flags.assisted=true;
  addLog(id==="intro"?"골목 소동을 막았다":id==="midboss"?"흰 옷 검객을 물리쳤다":"검성과의 비무에서 승리했다.",id==="intro"?"상대의 움직임을 살피고 싸움을 끝냈다.":id==="midboss"?"발과 어깨를 읽고 배운 동작으로 검객의 기세를 꺾었다.":"배운 호흡과 곁에서 응원한 이들의 마음으로 검성의 마지막 초식을 넘어섰다.");
  state.coin+=id==="intro"?2:id==="midboss"?4:8;
  state.combat=null;
  if(id==="intro") { state.tutorial="reward"; state.injury=null; setBgmCue("ambient"); }
  else {
    const pending=state.pendingCombatChoice;
    state.pendingCombatChoice=null;
    const ev=pending && events.find((e)=>e.id===pending.eventId);
    const choice=ev?.choices[pending.choice];
    if(ev&&choice) {
      const fx={...choice.effects}; delete fx.combat; applyEffects(fx);
      setBgmCue(id==="final"?"training":"ambient");
      if(id==="final"){state.flags.titleEarned=true;playSfx("victory");}else playSfx("reward");
      finishEvent(ev,{...choice,result:id==="final"?"검성은 검을 거두고 네게 천하제일인의 자리를 내어 주었다. 강호의 사람들은 각자의 길을 걸어온 너를 새 이름으로 기억한다.":"흰 옷 검객이 칼을 거둔다. ‘눈앞의 칼보다 사람을 먼저 보는군.’ 그는 운해 검성의 초대장을 건네고 길을 비켜 준다."}); return;
    }
  }
  if(id==="final"){state.mainStage=7;state.flags.titleEarned=true;setBgmCue("final");playSfx("victory");}else playSfx("reward");
  save(); render();
}
function loseCombat(reason="") {
  const id=state.combat?.id || state.injury || "intro";
  addLog("잠시 물러나다",reason||"상대의 움직임이 생각보다 빨랐다. 주변 사람이 치료를 돕는다.");
  state.combat=null; state.injury=id; state.hp=1; setBgmCue("ambient"); save(); render();
}
function completeCombatAction() {
  const c=state?.combat;if(!c||!c.turnPending)return;
  c.resolveTimer=false;c.turnPending=false;
  if(c.enemyHp<=0){winCombat();return;}
  const heavy=isHeavy(c), st=stats();
  if(c.evade){c.feedback="상대의 칼끝을 반 걸음 비켜냈다. 회피 성공!";battleLog(c.feedback);playSfx("dodge");}
  else {
    let incoming=c.enemyDamage+(heavy?3:0)-st.def-((c.guard||c.openingGuard)?(heavy?7:5):0);
    incoming=Math.max(heavy?2:1,incoming);
    state.hp=Math.max(0,state.hp-incoming);
    c.feedback=c.guard?`공격을 받아냈다. 체력 -${incoming}.`:`공격이 스쳤다. 체력 -${incoming}.`;
    battleLog(c.feedback);playSfx(c.guard?"block":"impact");
  }
  c.guard=false;c.evade=false;c.openingGuard=false;c.damageFloat=null;c.round+=1;
  if(state.hp<=0){loseCombat();return;}
  save();render();
}
function resolvePendingStrike() {
  const c=state?.combat;if(!c||!c.turnPending)return;
  if(c.pendingDamage){
    const damage=c.pendingDamage;c.pendingDamage=0;
    c.enemyHp=Math.max(0,c.enemyHp-damage);
    c.damageFloat=`-${damage}`;
    c.feedback=`${c.id==="intro"?"강도":c.enemy}에게 ${damage}의 피해를 입혔다!`;
    battleLog(c.feedback);playSfx("impact");save();render();
    scheduleCombat(c,completeCombatAction,520);
    return;
  }
  completeCombatAction();
}
function combatMove(move) {
  if(!state?.combat||state.combat.turnPending)return;
  const c=state.combat, st=stats();
  if(move==="flee") { loseCombat("전투에서 물러나 몸을 추슬렀다. 다시 도전하거나 도움을 받을 수 있다."); return; }
  if(move==="attack") {
    const damage=st.atk + (c.round%2===0?1:0)+(c.opening||0); c.opening=0;
    c.pendingDamage=damage; c.feedback=`${instrumental(state.gear.weapon?itemData[state.gear.weapon].name:"주먹")} 빈틈을 파고들었다!`; battleLog(c.feedback);playSfx("slash");
  } else if(move==="defend") {
    c.guard=true; state.qi=Math.min(state.maxQi,state.qi+3); c.feedback="자세를 낮춰 공격을 받아낼 준비를 했다. 내공 +3."; battleLog(c.feedback);
  } else if(move==="dodge") {
    if(state.qi<2)return; state.qi-=2; c.opening=3; c.evade=true;c.feedback="상대의 눈과 어깨를 살피며 옆으로 몸을 낮췄다.";battleLog(c.feedback);playSfx("dodge");
  } else if(move==="skill") {
    if(!state.skills.length||state.qi<8)return;
    const style=state.skills.includes(c.style)?c.style:state.skills[0];
    state.qi-=8; const damage=st.atk+({sword:7,fist:5,lightness:3}[style]||7)+(c.opening||0); c.opening=0;
    if(style==='fist')c.guard=true;if(style==='lightness')c.evade=true;
    c.pendingDamage=damage;
    const description={sword:'기초 검식으로 검끝을 비껴쳤다',fist:'기초 권법으로 빈틈을 찌르고 자세를 지켰다',lightness:'가벼운 발놀림으로 뒤를 잡아 반격을 피한다'}[style];
    c.feedback=`${description}!`;battleLog(c.feedback);playSfx("skill");
  } else return;
  c.turnPending=true;c.resolveTimer=true;
  c.lastMove=move;
  if(move==="attack"||move==="skill") {
    document.querySelector(".battlefield")?.classList.add("player-strike");
  }
  save();render();
  scheduleCombat(c,resolvePendingStrike,move==="attack"||move==="skill"?260:420);
}
function retryCombat() {
  const id=state.injury==="final"?"final":state.injury==="midboss"?"midboss":"intro";
  state.hp=state.maxHp;state.qi=state.maxQi;state.injury=null;
  startCombat(id);
}
function acceptHelp() {
  if(state.injury==="intro") {
    state.injury=null;state.hp=state.maxHp;state.qi=state.maxQi;state.tutorial="reward";setBgmCue("ambient");
    state.coin+=1; addLog("도움을 받아 다시 일어나다","주인장과 표사가 싸움을 말려 주었다. 걱정 말라며 작은 보상도 보탰다.");
    save();render();return;
  }
  const id=state.injury;
  if(!["midboss","final"].includes(id))return;
  state.hp=state.maxHp;state.qi=state.maxQi;state.injury=null;
  startCombat(id);
  state.combat.enemyDamage=Math.max(3,state.combat.enemyDamage-3);
  state.combat.assisted=true;
  state.combat.feedback="사부의 조언으로 상대의 힘을 흘려낸다. 이번 승부는 받는 피해가 줄어든다.";
  save();render();
}
function chooseReward(type) {
  if(state.tutorial!=="reward"||!["weapon","gauntlet","manual"].includes(type))return;
  if(type==="weapon"){grantItem("weapon-iron-jian");state.gear.weapon="weapon-iron-jian";}
  if(type==="gauntlet"){grantItem("weapon-iron-gauntlets");state.gear.weapon="weapon-iron-gauntlets";}
  if(type==="manual"){state.skills.push("sword");learnTerm("무공");}
  state.flags.firstReward=type;
  playSfx("reward");
  state.tutorial="free";state.mainStage=0;
  addLog("첫 보상",type==="weapon"?"무명 철검을 받아 장착했다.":type==="gauntlet"?"철권 보호대를 받아 장착했다.":"사부에게 기초 검식을 배웠다.");
  save();render();
}

let modalReturnFocus=null;
function showModal(html) {
  finishTyping?.();
  const modalFocus=document.activeElement?.dataset?.action;
  if(document.getElementById("modalBackdrop").hidden)modalReturnFocus=document.activeElement;
  document.getElementById("modalContent").innerHTML=html;
  document.getElementById("modalBackdrop").hidden=false;
  document.getElementById("modal").scrollTop=0;
  document.getElementById("modalContent").querySelector("h2")?.setAttribute("id","modalTitle");
  document.getElementById("app").inert=true;
  document.querySelector(".topbar").inert=true;
  document.getElementById("quickNav").inert=true;
  document.body.classList.add('modal-open');
  (modalFocus&&document.getElementById('modalContent').querySelector(`[data-action="${modalFocus}"]`)||document.getElementById("modalClose")).focus();
}
function closeModal() { const wasOpen=!document.getElementById('modalBackdrop').hidden;document.getElementById("modalBackdrop").hidden=true;document.body.classList.remove('modal-open');document.getElementById("app").inert=false;document.querySelector(".topbar").inert=false;document.getElementById("quickNav").inert=false;if(wasOpen){if(modalReturnFocus?.isConnected)modalReturnFocus.focus({preventScroll:true});else document.getElementById('menuButton').focus();}document.getElementById("modal").classList.remove("developer-tools-modal"); }
function panelTitle(title,subtitle="") { return `<h2 class="modal-title">${title}</h2>${subtitle?`<p class="modal-subtitle">${subtitle}</p>`:""}`; }
function showMap() {
  const tiles=Object.entries(locationData).map(([id,loc])=>{
    const unlocked=isLocationOpen(id),col=loc.image%4,row=Math.floor(loc.image/4);
    return `<button class="map-place" data-action="travel" data-location="${id}" ${unlocked?"":"disabled"}>${locSprite(id,"map-thumb")}<span><strong>${esc(loc.name)}</strong><small>${esc(loc.hint)}</small>${unlocked?"":`<small class="map-lock">여정 ${loc.stage}단계에서 열림</small>`}</span></button>`;
  }).join("");
  showModal(`${panelTitle("강호 지도","방문할 곳을 고르세요. 잠긴 곳은 메인 사건을 진행하면 열립니다.")}<div class="map-grid">${tiles}</div><div class="modal-rule"></div><p class="subtle">현재 ${state.visited.length}곳 방문 · 이동하면 하루가 지납니다.</p>`);
}
function showInventory() {
  const owned=Object.entries(state.items).filter(([,count])=>count>0);
  const equipped=new Set([state.gear.weapon,state.gear.armor].filter(Boolean));
  const rows=owned.map(([id,count])=>{
    const item=itemData[id];if(!item)return "";
    const useful=item.type==="medicine"&&((item.hp&&state.hp<state.maxHp)||(item.qi&&state.qi<state.maxQi));
    const button=item.type==="medicine"?`<button data-action="use-item" data-item="${id}" ${useful?"":"disabled"}>사용 ×${count}</button>`:`<button data-action="equip-item" data-item="${id}">${equipped.has(id)?"장착 중":"장착"}</button>`;
    return `<div class="inventory-item">${itemSprite(id)}<div class="inventory-copy"><strong>${esc(item.name)} ×${count}</strong><p>${esc(item.desc)}</p><small>${item.type==="medicine"?"영약 · 가방에서 사용":"장비 · 전투 능력에 반영"}</small></div><div class="inventory-actions">${button}</div></div>`;
  }).join("");
  showModal(`${panelTitle("가방",`은전 ${state.coin}냥 · 사용 가능한 물건은 ${owned.reduce((sum,[,n])=>sum+n,0)}개입니다.`)}<div class="inventory-list">${rows||`<div class="inventory-empty">가방이 비어 있다.<br>사건의 보상, 장터의 가게에서 무기와 영약을 얻을 수 있다.</div>`}</div>`);
}
function showGlossary() {
  const entries=state?state.discoveredTerms:Object.keys(TERMS).slice(0,3);
  showModal(`${panelTitle("강호 수첩","실제로 만난 말부터 기록됩니다. 뜻을 외우지 않아도 이야기를 진행할 수 있어요.")}<div class="glossary-list">${entries.map(term=>`<article class="glossary-entry"><strong>${esc(term)}</strong><p>${esc(TERMS[term])}</p></article>`).join("")}</div><div class="modal-rule"></div><p class="subtle">발견한 용어 ${entries.length} / ${Object.keys(TERMS).length}</p>`);
}
function showPeople() {
  showModal(`${panelTitle("강호의 인물", "관계는 선택을 통해 달라집니다. 기억해 둔 이야기는 이후 대사에 반영됩니다.")}<div class="npc-list">${npcs.map(p=>`<article class="npc-card">${portrait(p.id)}<div><strong>${esc(p.name)}</strong><small>${esc(p.role)}</small><p>${esc(p.hello)}</p><small class="${trustOf(p.id)>0?"good":trustOf(p.id)<0?"bad":""}">관계 기록 ${trustOf(p.id)>0?`+${trustOf(p.id)}`:trustOf(p.id)}</small></div></article>`).join("")}</div>`);
}
function showShop() {
  const goods=Object.entries(itemData).filter(([id,item])=>{
    if(shopFilter==="weapon")return item.type!=="medicine";
    if(shopFilter==="medicine")return item.type==="medicine";
    return true;
  });
  const list=goods.map(([id,item])=>`<div class="inventory-item">${itemSprite(id)}<div class="inventory-copy"><strong>${esc(item.name)}</strong><p>${esc(item.desc)}</p><small>보유 ${state.items[id]||0}개</small></div><div class="inventory-actions"><span class="shop-price">${itemPrice(id)}냥</span><button data-action="buy" data-item="${id}" ${state.coin<itemPrice(id)?"disabled":""}>구매</button></div></div>`).join("");
  showModal(`${panelTitle("장터의 물건",`장사꾼과 객잔에서 살 수 있습니다. 가진 돈: ${state.coin}냥`)}<div class="shop-tabs"><button data-action="shop-filter" data-filter="all" class="${shopFilter==="all"?"active":""}">모두</button><button data-action="shop-filter" data-filter="weapon" class="${shopFilter==="weapon"?"active":""}">무기·방어구</button><button data-action="shop-filter" data-filter="medicine" class="${shopFilter==="medicine"?"active":""}">영약</button></div><div class="inventory-list">${list}</div>`);
}
function exportSave() {
  exportData=JSON.parse(JSON.stringify(state||storedSave()));if(!exportData)return;
  showModal(`${panelTitle("여정 백업", "저장 파일을 내려받아 다른 브라우저의 ‘저장 파일 가져오기’에서 열 수 있습니다.")}<button class="btn btn-primary" data-action="download-save">백업 파일 다운로드</button><details class="backup-text"><summary>다운로드가 안 되면 저장 내용 직접 복사</summary><p>아래 내용을 복사해 .json 파일로 보관해 주세요.</p><textarea id="saveBackup" aria-label="저장 데이터" readonly>${esc(JSON.stringify(exportData,null,2))}</textarea><button class="btn btn-small" data-action="select-backup">저장 내용 전체 선택</button></details>`);
}
function downloadSave() {
  const blob=new Blob([JSON.stringify(exportData,null,2)],{type:"application/json"});
  const link=document.createElement("a"),url=URL.createObjectURL(blob);
  link.href=url;link.download=`gangho-save-${new Date().toISOString().slice(0,10)}.json`;
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  showToast("다운로드를 요청했습니다. 브라우저의 다운로드 목록을 확인해 주세요.");
}
function formatSave(record){return record ? esc(record.name)+' · '+esc(locationData[record.location].name)+' · '+record.day+'일째'+(record.savedAt?' · '+new Date(record.savedAt).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Seoul'}):'') : '비어 있는 기록';}
function slotRecord(key){try{return readSave(localStorage,key,normalizeSave,makeInitial('나그네'));}catch{return null;}}
function showSavePanel() {
  const auto=storedSave(), previous=slotRecord(BACKUP_KEY), departure=slotRecord(SLOT_KEY+'departure'), beforeLoad=slotRecord(SLOT_KEY+'before-load');
  showModal(`${panelTitle('여정 보관함','자동 저장과 별개로 세 개의 기록을 보관할 수 있습니다. 불러오기 전 현재 여정을 백업할 수 있어요.')}<div class="save-slot auto-slot"><div><strong>자동 저장</strong><small>${formatSave(auto)}</small></div>${auto?'<button class="btn btn-small" data-load-key="'+SAVE_KEY+'">불러오기</button>':''}</div><div class="save-slots">${[1,2,3].map(n=>{const record=slotRecord(SLOT_KEY+n);return `<article class="save-slot"><div><strong>기록 ${n}</strong><small>${formatSave(record)}</small></div><div class="button-row">${state?`<button class="btn btn-small" data-slot-save="${n}">${record?'덮어쓰기':'저장'}</button>`:''}${record?`<button class="btn btn-small" data-load-key="${SLOT_KEY+n}">불러오기</button>`:''}</div></article>`}).join('')}</div><details class="recovery-records"><summary>이전 여정 복구</summary>${previous?`<button class="save-option" data-load-key="${BACKUP_KEY}"><strong>직전 자동 저장</strong><small>${formatSave(previous)}</small></button>`:''}${departure?`<button class="save-option" data-load-key="${SLOT_KEY+'departure'}"><strong>새 여정 시작 전 기록</strong><small>${formatSave(departure)}</small></button>`:''}${beforeLoad?`<button class="save-option" data-load-key="${SLOT_KEY+'before-load'}"><strong>불러오기 전 기록</strong><small>${formatSave(beforeLoad)}</small></button>`:''}${!previous&&!departure&&!beforeLoad?'<p>복구할 기록이 없습니다.</p>':''}</details><div class="save-options">${state?'<button class="save-option" data-action="manual-save"><strong>지금 자동 저장</strong><small>현재 여정 보관</small></button>':''}${state||auto?'<button class="save-option" data-action="export"><strong>백업 파일 내보내기</strong><small>다른 브라우저로 옮길 JSON</small></button>':''}<button class="save-option" data-action="import-prompt"><strong>저장 파일 가져오기</strong><small>이전 버전의 기록도 불러올 수 있어요</small></button>${state?'<button class="save-option" data-action="log"><strong>여정 기록</strong><small>선택과 사건을 돌아보기</small></button>':''}</div><input type="file" id="importFile" accept=".json,application/json" hidden>`);
}
let pendingLoad=null, exportData=null;
function confirmLoad() {
  if(!pendingLoad)return;
  if(state)try{writeSave(localStorage,SLOT_KEY+'before-load',state,normalizeSave,makeInitial('나그네'));}
  catch{showToast('현재 여정을 보관하지 못했습니다. 파일로 백업한 뒤 다시 불러와 주세요.');return;}
  const data=pendingLoad;pendingLoad=null;resumeGame(data);if(save())showToast('여정을 불러왔습니다.');
}
function reviewLoad(record){
  if(!record){showToast('읽을 수 없는 기록입니다. 다른 기록이나 백업 파일을 선택해 주세요.');return;}
  pendingLoad=record;
  showModal(`${panelTitle('이 여정으로 이어갈까요?',formatSave(record))}<div class="story-box"><p>불러오면 자동 저장이 이 기록으로 바뀝니다. 현재 플레이는 불러오기 직전 복구 기록에 보관됩니다.</p></div><div class="button-row" style="margin-top:20px"><button class="btn btn-primary" data-action="confirm-load">이 여정 불러오기</button><button class="btn" data-action="save-panel">돌아가기</button></div>`);
}
function resumeGame(data){
  importGeneration++;state=data;state.guide=preferences.guide;state.largeText=preferences.largeText;
  storageConflict=false;try{observedSave=localStorage.getItem(SAVE_KEY);}catch{}
  activeCue=null;setBgmCue(state.combat?.id==='final'?'final':state.combat?'battle':state.mainStage>=7?'training':state.location==='sect'&&state.mainStage>=4?'training':'ambient');
  closeModal();render();
}
function saveSlot(n,confirmed=false){
  if(!state||![1,2,3].includes(n))return;
  if(slotRecord(SLOT_KEY+n)&&!confirmed){showModal(`${panelTitle('기록 '+n+'을 덮어쓸까요?',formatSave(slotRecord(SLOT_KEY+n)))}<p>현재 여정을 이 자리에 보관합니다.</p><div class="button-row"><button class="btn btn-primary" data-confirm-slot="${n}">현재 여정 저장</button><button class="btn" data-action="save-panel">돌아가기</button></div>`);return;}
  try{writeSave(localStorage,SLOT_KEY+n,state,normalizeSave,makeInitial('나그네'));showSavePanel();showToast('기록 '+n+'에 여정을 보관했습니다.');}catch{showToast('기록을 저장하지 못했습니다. 파일 내보내기를 이용해 주세요.');}
}
function showLog() {
  showModal(`${panelTitle("여정 기록", "최근에 일어난 선택과 결과입니다.")}<div class="log-list">${state.log.map(item=>`<article class="log-entry"><small>${item.day}일째 · ${esc(item.title)}</small><p>${esc(item.text)}</p></article>`).join("")}</div>`);
}
function showSettings() {
  const speed=preferences.textSpeed;
  showModal(`${panelTitle('설정', '읽기와 소리를 편안한 속도로 맞추세요. 설정은 새 여정에도 유지됩니다.')}<div class="settings-row"><span><strong>선택지 도움말</strong><br><small>행동의 예상 결과 표시</small></span><button class="switch ${preferences.guide?'on':''}" data-action="toggle-guide" role="switch" aria-checked="${preferences.guide}" aria-label="선택지 도움말"><span></span></button></div><div class="settings-row"><span><strong>큰 글씨</strong><br><small>본문과 선택지 확대</small></span><button class="switch ${preferences.largeText?'on':''}" data-action="toggle-text" role="switch" aria-checked="${preferences.largeText}" aria-label="큰 글씨"><span></span></button></div><div class="settings-row"><span><strong>움직임 줄이기</strong><br><small>화면 전환과 전투 애니메이션 감소</small></span><button class="switch ${preferences.reducedMotion?'on':''}" data-action="toggle-motion" role="switch" aria-checked="${preferences.reducedMotion}" aria-label="움직임 줄이기"><span></span></button></div><label class="reading-speed"><strong>대사 표시 속도</strong><select data-setting="textSpeed" aria-label="대사 표시 속도"><option value="24" ${speed===24?'selected':''}>보통</option><option value="45" ${speed===45?'selected':''}>느리게</option><option value="0" ${speed===0?'selected':''}>바로 표시</option></select></label>${[['master','전체 음량'],['bgm','배경 음악'],['sfx','효과음']].map(([key,label])=>`<label class="audio-slider"><span>${label} <b>${Math.round(audioSettings[key]*100)}%</b></span><input type="range" min="0" max="100" value="${Math.round(audioSettings[key]*100)}" data-audio="${key}" aria-label="${label}"></label>`).join('')}<div class="button-row"><button class="btn btn-small" data-action="test-sound">효과음 들어 보기</button><button class="btn btn-small" data-action="fullscreen">전체 화면 전환</button></div><p class="settings-help">대사: Enter / Space · 전투: 숫자 1–6 · 메뉴 닫기: Esc<br>탭을 벗어나거나 메뉴를 열면 전투의 진행이 잠시 멈춥니다.</p>`);
}
function showAbout() {
  showModal(`${panelTitle("게임 안내", "낯선 말은 처음 나올 때만 쉽게 설명합니다.")}<div class="glossary-list"><article class="glossary-entry"><strong>무엇을 하면 되나요?</strong><p>장소를 둘러보고 사건을 고른 뒤, 두세 가지 행동 중 하나를 선택합니다. 선택에 따라 돈, 체력, 인물의 신뢰가 달라질 수 있습니다.</p></article><article class="glossary-entry"><strong>전투가 걱정돼요.</strong><p>공격은 피해를 주고, 방어는 다음 피해를 줄이며, 회피는 내공 2를 쓰고 다음 공격에 힘을 더합니다. 패배해도 치료와 재도전이 가능합니다.</p></article><article class="glossary-entry"><strong>저장은 어디에 되나요?</strong><p>진행 상태는 현재 브라우저에 자동 저장됩니다. 저장 메뉴에서 백업 파일로 내보내거나 다시 불러올 수 있습니다.</p></article><article class="glossary-entry"><strong>무협 단어가 어려워요.</strong><p>상단의 물음표 또는 아래 수첩 버튼을 눌러 이미 만난 용어를 언제든 확인하세요.</p></article><article class="glossary-entry"><strong>음악 크레딧</strong><p>Asianoriental2 — Tozan (CC0). Samurai Nights — Majadroid / Maik Hoffmann (CC-BY 4.0). 원곡의 전투·Qin·ErHu 레이어를 편집해 사용했습니다. <a href="CREDITS.md" target="_blank" rel="noopener">출처와 라이선스</a></p></article></div>`);
}
function showMenu() {
  if(!state) {
    showModal(`${panelTitle("게임 메뉴", "게임을 시작하거나 화면 샘플을 확인하세요.")}<div class="save-options"><button class="save-option" data-action="new-game"><strong>새 여정 시작</strong><small>이름을 정하고 강호에 들어갑니다.</small></button>${QA_MODE?`<button class="save-option" data-action="developer-tools"><strong>화면 검수 도구</strong><small>여정에 영향을 주지 않는 화면 미리보기</small></button>`:""}<button class="save-option" data-panel="about"><strong>게임 안내</strong><small>기본 진행과 저장 방법을 확인합니다.</small></button></div>`);
    return;
  }
  showModal(`${panelTitle("여정 메뉴", "계속 플레이하거나 기록을 확인하세요.")}<div class="save-options"><button class="save-option" data-action="return"><strong>이야기로 돌아가기</strong><small>현재 장면에서 계속 플레이</small></button><button class="save-option" data-panel="map"><strong>지도</strong><small>방문 가능한 장소 확인</small></button><button class="save-option" data-action="log"><strong>여정 기록</strong><small>지금까지의 사건과 선택</small></button><button class="save-option" data-action="save-panel"><strong>저장 관리</strong><small>수동 저장·내보내기·가져오기</small></button><button class="save-option" data-action="settings"><strong>설정</strong><small>읽기·움직임·소리·전체 화면</small></button>${QA_MODE?`<button class="save-option" data-action="developer-tools"><strong>화면 검수 도구</strong><small>여정에 영향을 주지 않는 화면 미리보기</small></button>`:""}<button class="save-option" data-action="title"><strong>타이틀로 돌아가기</strong><small>현재 여정을 저장하고 처음 화면으로</small></button><button class="save-option" data-panel="about"><strong>게임 안내 · 크레딧</strong><small>조작과 음악 출처</small></button></div>`);
}

const developerPreviews = [
  ["opening","첫 선택"],["encounter","골목 대면"],["dialogue","인물 대화"],["explore","탐험"],["combat","전투"],
  ["injury","패배·도움"],["reward","보상"],["map","지도"],["inventory","가방"],["glossary","수첩"],
  ["people","인물"],["shop","장터"],["settings","설정"],["save","저장"],["ending","엔딩"]
];
function developerSampleState(kind) {
  const sample=makeInitial("나그네");
  sample.tutorial="free";sample.location="market";sample.hp=34;sample.maxHp=48;sample.qi=12;sample.maxQi=18;
  sample.coin=7;sample.exp=6;sample.mainStage=0;sample.sect="청운문";sample.gear.weapon="weapon-practice-sword";
  sample.items={"weapon-practice-sword":1,"elixir-healing-pill":1,"elixir-qi-pill":1};sample.skills=["sword"];
  sample.trust={mentor:1,guard:1,bandit:1,innkeeper:1,merchant:1};sample.rumors=2;sample.visited=["market","alley","inn"];
  sample.log=[{title:"강도와의 첫 승부",text:"목검으로 골목의 소동을 막았다.",day:2},{title:"첫 보상",text:"무명 철검을 받아 장착했다.",day:2}];
  if(kind==="opening")sample.tutorial="intro";
  if(kind==="encounter"){sample.location="alley";sample.tutorial="encounter";sample.encounterStep=1;}
  if(kind==="dialogue"){sample.location="sect";sample.mainStage=4;sample.trust.mentor=2;}
  if(kind==="explore"){sample.location="market";sample.mainStage=0;}
  if(kind==="combat"){
    sample.location="alley";sample.combat={id:"intro",enemy:"골목의 강도",enemyHp:12,enemyMax:22,enemyDamage:4,round:2,guard:false,evade:false,turnPending:false,logs:["강도가 칼을 치켜든다."],feedback:"큰 내려베기를 예고했다."};
  }
  if(kind==="injury"){sample.location="alley";sample.injury="intro";}
  if(kind==="reward"){sample.location="alley";sample.tutorial="reward";}
  if(kind==="ending"){
    sample.location="sect";sample.mainStage=7;sample.flags={finalApproach:"allies",titleEarned:true};
    sample.trust={mentor:2,guard:2,bandit:2,innkeeper:1};sample.day=8;
  }
  return sample;
}
function developerUtilitySample(kind) {
  if(kind==="map")return `<div class="dev-utility-grid map-grid">${Object.entries(locationData).map(([id,loc])=>`<article class="map-place">${locSprite(id,"map-thumb")}<span><strong>${esc(loc.name)}</strong><small>${esc(loc.hint)}</small></span></article>`).join("")}</div>`;
  if(kind==="inventory")return `<div class="inventory-list"><div class="inventory-item">${itemSprite("weapon-practice-sword")}<div class="inventory-copy"><strong>단단한 목검 ×1</strong><p>초보 수련용 검. 공격력이 2 오른다.</p><small>장비 · 장착 상태</small></div><div class="inventory-actions"><button disabled>장착 중</button></div></div><div class="inventory-item">${itemSprite("elixir-healing-pill")}<div class="inventory-copy"><strong>회복환 ×1</strong><p>체력 14와 내공 4를 회복한다.</p><small>영약 · 가방에서 사용</small></div><div class="inventory-actions"><button disabled>사용</button></div></div></div>`;
  if(kind==="glossary")return `<div class="glossary-list">${["강호","무공","내공","비무"].map(term=>`<article class="glossary-entry"><strong>${term}</strong><p>${esc(TERMS[term])}</p></article>`).join("")}</div>`;
  if(kind==="people")return `<div class="npc-list">${npcs.slice(1,5).map(person=>`<article class="npc-card">${portrait(person.id)}<div><strong>${esc(person.name)}</strong><small>${esc(person.role)}</small><p>${esc(person.hello)}</p><small class="good">관계 기록 +1</small></div></article>`).join("")}</div>`;
  if(kind==="shop")return `<div class="shop-tabs"><button class="active" disabled>모두</button><button disabled>무기·방어구</button><button disabled>영약</button></div><div class="inventory-list">${["weapon-practice-sword","weapon-iron-gauntlets","elixir-healing-pill"].map(id=>{const item=itemData[id];return `<div class="inventory-item">${itemSprite(id)}<div class="inventory-copy"><strong>${esc(item.name)}</strong><p>${esc(item.desc)}</p><small>보유 1개</small></div><div class="inventory-actions"><span class="shop-price">${item.price}냥</span><button disabled>구매</button></div></div>`}).join("")}</div>`;
  if(kind==="settings")return `<div class="settings-row"><span><strong>선택지 도움말</strong><br><small class="subtle">버튼에 예상 결과를 표시합니다.</small></span><button class="switch on" disabled><span></span></button></div><div class="settings-row"><span><strong>큰 글씨</strong><br><small class="subtle">이야기와 선택지를 크게 표시합니다.</small></span><button class="switch" disabled><span></span></button></div><label class="audio-slider"><span>배경 음악 <b>28%</b></span><input type="range" value="28" disabled></label><label class="audio-slider"><span>효과음 <b>62%</b></span><input type="range" value="62" disabled></label>`;
  if(kind==="save")return `<div class="save-options">${[["지금 수동 저장","현재 여정을 저장"],["저장 파일 내보내기","다른 브라우저로 옮길 백업"],["저장 파일 가져오기","백업 JSON 불러오기"],["여정 기록 보기","선택과 결과 확인"]].map(([title,desc])=>`<div class="save-option"><strong>${title}</strong><small>${desc}</small></div>`).join("")}</div><p class="dev-note">자동 저장은 이 브라우저의 여정 상태를 보존합니다.</p>`;
  return "";
}
function developerSampleMarkup(kind) {
  const previous=state;
  state=developerSampleState(kind);
  let markup="";
  try {
    if(kind==="opening")markup=renderIntro();
    else if(kind==="encounter")markup=renderEncounter();
    else if(kind==="dialogue")markup=renderGameFrame(renderEventScene(events.find(ev=>ev.id==="story-training")));
    else if(kind==="explore")markup=renderFreeScene();
    else if(kind==="combat")markup=renderCombat();
    else if(kind==="injury")markup=renderInjury();
    else if(kind==="reward")markup=renderReward();
    else if(kind==="ending")markup=renderEnding();
    else markup=developerUtilitySample(kind);
  } finally { state=previous; }
  return markup
    .replace(/<button\b(?![^>]*\bdisabled(?:\s|=|>))([^>]*)>/gi,"<button$1 disabled>")
    .replace(/<input\b(?![^>]*\bdisabled(?:\s|=|>))([^>]*)>/gi,"<input$1 disabled>");
}
function showDeveloperTools(active="opening") {
  const selected=developerPreviews.some(([id])=>id===active)?active:"opening";
  const tabs=developerPreviews.map(([id,label])=>`<button class="dev-preview-tab ${selected===id?"active":""}" data-dev-preview="${id}" aria-pressed="${selected===id}">${label}</button>`).join("");
  const activeLabel=developerPreviews.find(([id])=>id===selected)?.[1]||"샘플";
  showModal(`${panelTitle("개발자용 툴","화면 샘플을 골라 세부 UI를 확인하세요. 미리보기 버튼은 동작하지 않으며 실제 여정/저장 데이터는 바뀌지 않습니다.")}<nav class="dev-preview-tabs" aria-label="게임 기능 샘플">${tabs}</nav><div class="dev-preview-label">${activeLabel} · 샘플 화면</div><div class="dev-preview-stage dev-preview-${selected}" id="devPreviewStage">${developerSampleMarkup(selected)}</div>`);
  document.getElementById("modal").classList.add("developer-tools-modal");
}
function showPanel(panel) {
  if(state?.combat && ["map","shop","inventory"].includes(panel)){showToast("승부 중입니다. 회복 물품은 전투 버튼에서 골라 주세요.");return;}
  if(panel==="map")return state?showMap():showAbout();
  if(panel==="inventory")return state?showInventory():showAbout();
  if(panel==="glossary")return showGlossary();
  if(panel==="people")return state?showPeople():showAbout();
  if(panel==="shop")return state?showShop():showAbout();
  if(panel==="save")return state?showSavePanel():showAbout();
  if(panel==="about")return showAbout();
  if(panel==="menu")return showMenu();
}
function useItem(id, inCombat=false) {
  if(state.combat?.turnPending)return;
  if(state.combat)inCombat=true;
  const item=itemData[id];if(!item||!state.items[id])return;
  if(item.type!=="medicine") { showToast("가방에서 장비를 골라 장착해 주세요.");return; }
  const useful=(item.hp&&state.hp<state.maxHp)||(item.qi&&state.qi<state.maxQi);
  if(!useful){showToast("이 물품으로 회복할 체력이나 내공이 없습니다.");return;}
  state.items[id]-=1;
  state.hp=Math.min(state.maxHp,state.hp+(item.hp||0));state.qi=Math.min(state.maxQi,state.qi+(item.qi||0));
  addLog(`${item.name} 사용`,item.desc);
  if(inCombat){closeModal();const c=state.combat;if(c){c.feedback=`${item.name}을 사용해 몸을 추슬렀다.`;c.lastMove="item";c.turnPending=true;c.resolveTimer=true;battleLog(c.feedback);}save();render();scheduleCombat(c,resolvePendingStrike,420);return;}
  save();showToast(`${item.name}을 사용했습니다.`);showInventory();
}
function equipItem(id) {
  if(state.combat){showToast("장비는 승부를 마친 뒤 바꿀 수 있어요.");return;}
  const item=itemData[id];if(!item||!state.items[id])return;
  if(item.slot==="weapon")state.gear.weapon=id;else if(item.slot==="armor")state.gear.armor=id;
  save();showToast(`${item.name}을 장착했습니다.`);showInventory();render();
}
function buyItem(id) {
  const item=itemData[id];if(!item)return;
  const price=itemPrice(id);
  if(state.coin<price){showToast("은전이 모자랍니다.");return;}
  state.coin-=price;grantItem(id);addLog(`${item.name} 구매`,`${price}냥을 내고 ${item.name}을 샀다.`);save();showToast(`${item.name}을 샀습니다.`);showShop();render();
}
function restAtInn() {
  if(state.combat||state.injury||state.tutorial!=="free")return;
  if(state.location!=="inn"){showToast("객잔으로 이동하면 쉴 수 있어요.");return;}
  state.hp=state.maxHp;state.qi=state.maxQi;state.day+=1;addLog("객잔에서 쉬다","따뜻한 밥을 먹고 잠들었다. 체력과 내공이 모두 회복됐다.");save();showToast("푹 쉬었습니다. 체력과 내공이 회복됐어요.");render();
}
function newGame() {
  showModal(`${panelTitle("이름을 정해 주세요", (state||storedSave())?"새 여정을 시작하면 이전 여정은 복구 기록에 보관됩니다. 중요한 기록은 저장 관리에서 파일로도 백업해 주세요.":"이름은 게임 안에서만 사용됩니다. 기본 이름으로 시작해도 괜찮아요.")}<form id="newGameForm"><label for="heroName" class="modal-subtitle">강호에서 불릴 이름</label><input id="heroName" maxlength="12" autocomplete="off" placeholder="나그네" style="width:100%;padding:12px;border:1px solid #ccb995;background:#fffdf6;color:#29372f"><div class="button-row" style="margin-top:14px"><button class="btn btn-primary" type="submit">이 이름으로 시작</button><button class="btn" type="button" data-action="start-default">이름 없이 시작</button></div></form>`);
  setTimeout(()=>document.getElementById("heroName")?.focus(),0);
}
function beginGame(name) {
  importGeneration++;const old=state||storedSave();
  if(old)try{writeSave(localStorage,SLOT_KEY+'departure',old,normalizeSave,makeInitial('나그네'));}catch{showToast('이전 여정을 복구 기록으로 보관하지 못했습니다. 파일로 먼저 백업해 주세요.');return;}
  storageConflict=false;try{observedSave=localStorage.getItem(SAVE_KEY);}catch{}
  state=makeInitial(name.trim().slice(0,12)||'나그네');setBgmCue('ambient');closeModal();save();render();
}
function setQuestTarget() {
  if(state.combat||state.injury||state.tutorial!=="free")return;
  state.result=null;
  const q=questInfo();
  if(q.eid) moveTo(q.loc,{openEvent:q.eid});
  else if(state.location!==q.loc) moveTo(q.loc);else showToast("이곳의 사건을 모두 확인했어요. 다른 장소를 둘러보세요.");
}
function importFile(file) {
  if(!file)return;
  if(file.size>1000000){showToast('저장 파일이 너무 큽니다 (최대 1MB).');return;}
  const generation=++importGeneration,reader=new FileReader();
  reader.onload=()=>{
    if(generation!==importGeneration)return;
    try{reviewLoad(normalizeSave(JSON.parse(reader.result),makeInitial('나그네')));}
    catch{showToast('이 게임의 저장 파일이 아니거나 파일이 손상됐습니다. 현재 여정은 그대로 유지됩니다.');}
  };
  reader.onerror=()=>showToast('파일을 읽지 못했습니다. 다른 백업을 선택해 주세요.');reader.readAsText(file);
}
document.addEventListener("click",(event)=>{
  const slot=event.target.closest('[data-slot-save],[data-confirm-slot],[data-load-key]');
  if(slot){if(slot.dataset.loadKey)reviewLoad(slot.dataset.loadKey===SAVE_KEY?storedSave():slotRecord(slot.dataset.loadKey));else saveSlot(Number(slot.dataset.slotSave||slot.dataset.confirmSlot),Boolean(slot.dataset.confirmSlot));return;}
  const developerRoot=event.target.closest("#modalContent");
  if(developerRoot&&document.getElementById("modal")?.classList.contains("developer-tools-modal")){
    const preview=event.target.closest("[data-dev-preview]");
    if(preview)return showDeveloperTools(preview.dataset.devPreview);
    if(event.target.closest("#devPreviewStage"))return;
  }
  const panel=event.target.closest("[data-panel]");
  if(panel){event.preventDefault();showPanel(panel.dataset.panel);return;}
  const button=event.target.closest("[data-action]");if(!button)return;
  if(button.disabled)return;
  const action=button.dataset.action;
  if(storageConflict&&!['reload-latest','confirm-load','export','download-save','select-backup','save-panel','settings','return','title'].includes(action)){showStorageConflict();return;}
  if(action==='reload-latest'){const data=storedSave();if(data)resumeGame(data);return;}
  if(action==='confirm-load'){confirmLoad();return;}
  if(action==='advance-dialogue')return advanceDialogue();
  if(action==='skip-dialogue'){const beats=chapterDialogue[state?.activeEventId];if(beats){state.dialogueStep=beats.length;save();render();}return;}
  if(action==='toggle-motion'){preferences.reducedMotion=!preferences.reducedMotion;savePreferences();render();showSettings();return;}
  if(action==='test-sound'){playSfx('reward');return;}
  if(action==='fullscreen'){if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>showToast('전체 화면을 종료하지 못했습니다.'));else document.documentElement.requestFullscreen?.().catch(()=>showToast('이 브라우저에서는 전체 화면을 사용할 수 없습니다.'));return;}
  if(action==='title'){if(state&&!storageConflict&&!save())return;state=null;storageConflict=false;importGeneration++;closeModal();setBgmCue('ambient');render();return;}
  if(action==="continue-result"){state.result=null;save();render();return;}
  if(action==="new-game")return newGame();
  if(action==="continue"){const data=storedSave();if(data)resumeGame(data);return;}
  if(action==="start-default")return beginGame("");
  if(action==="opening-choice")return openingChoice(Number(button.dataset.index));
  if(action==="advance-encounter")return advanceEncounter();
  if(action==="choose-event") {const ev=events.find((e)=>e.id===state.activeEventId);if(ev)return applyChoice(ev,ev.choices[Number(button.dataset.index)]);return;}
  if(action==="open-event") {const ev=events.find(e=>e.id===button.dataset.event);if(!state.combat&&ev&&availableEvent(ev)){state.result=null;state.activeEventId=ev.id;state.dialogueStep=0;save();render();}return;}
  if(action==="leave-event"){state.activeEventId=null;save();render();return;}
  if(action==="combat-move")return combatMove(button.dataset.move);
  if(action==="combat-items") {
    if(!state.combat||state.combat.turnPending)return;
    const owned=Object.entries(state.items).filter(([id,count])=>count>0&&itemData[id]?.type==="medicine");
    showModal(`${panelTitle("전투 중 사용할 물품", "영약은 한 차례를 사용합니다. 상대의 공격에는 주의하세요.")}<div class="inventory-list">${owned.map(([id,count])=>{const item=itemData[id],useful=(item.hp&&state.hp<state.maxHp)||(item.qi&&state.qi<state.maxQi);return `<div class="inventory-item">${itemSprite(id)}<div class="inventory-copy"><strong>${esc(item.name)} ×${count}</strong><p>${esc(item.desc)}</p></div><div class="inventory-actions"><button data-action="use-combat-item" data-item="${id}" ${useful?"":"disabled"}>사용</button></div></div>`;}).join("")||`<div class="inventory-empty">사용할 회복약이 없습니다. 나중에 가방이나 장터에서 구할 수 있어요.</div>`}</div>`);return;
  }
  if(action==="use-combat-item")return useItem(button.dataset.item,true);
  if(action==="retry")return retryCombat();
  if(action==="accept-help")return acceptHelp();
  if(action==="reward")return chooseReward(button.dataset.reward);
  if(action==="quest")return setQuestTarget();
  if(action==="travel")return moveTo(button.dataset.location);
  if(action==="equip-item")return equipItem(button.dataset.item);
  if(action==="use-item")return useItem(button.dataset.item);
  if(action==="buy")return buyItem(button.dataset.item);
  if(action==="rest")return restAtInn();
  if(action==="shop-filter"){shopFilter=button.dataset.filter;return showShop();}
  if(action==="manual-save"){if(save())showToast("현재 여정을 저장했습니다.");return;}
  if(action==="export")return exportSave();
  if(action==="download-save")return downloadSave();
  if(action==="select-backup"){document.getElementById("saveBackup")?.select();return;}
  if(action==="import-prompt")return document.getElementById("importFile")?.click();
  if(action==="log")return showLog();
  if(action==="settings")return showSettings();
  if(action==="toggle-guide"){preferences.guide=!preferences.guide;if(state){state.guide=preferences.guide;save();}savePreferences();render();return showSettings();}
  if(action==="toggle-text"){preferences.largeText=!preferences.largeText;if(state){state.largeText=preferences.largeText;save();}savePreferences();render();return showSettings();}
  if(action==="save-panel")return showSavePanel();
  if(action==="developer-tools")return showDeveloperTools();
  if(action==="return"){closeModal();return;}
});

document.getElementById("modalClose").addEventListener("click",closeModal);
document.getElementById("musicToggle").addEventListener("click",()=>{
  musicEnabled = !musicEnabled;
  try { localStorage.setItem(MUSIC_KEY, musicEnabled ? "on" : "off"); } catch {}
  if (musicEnabled) startMusic();
  else stopAllMusic();
  syncMusicButton();
});
document.addEventListener("click",(event)=>{
  if (!event.target.closest("#musicToggle")) startMusic();
  const button=event.target.closest("button"); if(button&&!button.disabled&&!button.closest("#devPreviewStage")&&!button.matches("[data-action=combat-move],[data-action=advance-encounter],[data-action=reward]"))playSfx("click");
},{capture:true});
window.addEventListener("resize",renderBackdrop);
document.getElementById("modalBackdrop").addEventListener("click",(event)=>{if(event.target.id==="modalBackdrop")closeModal();});
document.getElementById("menuButton").addEventListener("click",()=>showPanel("menu"));
document.getElementById("brandHome").addEventListener("click",(event)=>{event.preventDefault();if(state){showMenu();}else renderStart();});
document.getElementById("modalContent").addEventListener("submit",(event)=>{
  if(event.target.id==="newGameForm"){event.preventDefault();beginGame(document.getElementById("heroName").value);}
});
document.getElementById("modalContent").addEventListener("change",(event)=>{
  if(event.target.id==="importFile")importFile(event.target.files?.[0]);
  if(event.target.dataset.setting==='textSpeed'){preferences.textSpeed=Number(event.target.value);savePreferences();}
});
document.getElementById('app').addEventListener('change',event=>{if(event.target.matches('[data-combat-style]')&&state?.combat&&!state.combat.turnPending&&state.skills.includes(event.target.value)){state.combat.style=event.target.value;save();render();}});
document.getElementById("modalContent").addEventListener("input",(event)=>{
  const control=event.target.closest("[data-audio]");if(!control)return;
  const amount=Number(control.value)/100;
  audioSettings[control.dataset.audio]=amount;
  try{localStorage.setItem(AUDIO_KEY,JSON.stringify(audioSettings));}catch{}
  if(control.dataset.audio==='bgm'||control.dataset.audio==='master'){clearInterval(fadeTimer);activeTracks().forEach((track)=>{if(track===activeCue&&!track.paused)track.volume=audioSettings.master*audioSettings.bgm;else{track.pause();track.volume=0;}});}
  const label=control.closest("label")?.querySelector("b");if(label)label.textContent=`${control.value}%`;
});
document.addEventListener("keydown",(event)=>{
  if(event.key==="Tab"&&!document.getElementById("modalBackdrop").hidden){
    const nodes=[...document.getElementById("modal").querySelectorAll('button:not(:disabled),a[href],input:not([hidden]),textarea,summary')].filter(n=>n.getClientRects().length);
    const first=nodes[0],last=nodes.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
  if(event.key==="Escape"&&!document.getElementById("modalBackdrop").hidden){closeModal();return;}
  if(storageConflict)return;
  if(event.target.closest("input,textarea,select")||!document.getElementById("modalBackdrop").hidden)return;
  if(event.repeat)return;
  if(state?.tutorial==='encounter'&&['Enter',' '].includes(event.key)&&!event.target.closest('button')){event.preventDefault();advanceEncounter();return;}
  if(state?.activeEventId&&chapterDialogue[state.activeEventId]&&(state.dialogueStep||0)<chapterDialogue[state.activeEventId].length&&['Enter',' '].includes(event.key)&&!event.target.closest('button')){event.preventDefault();advanceDialogue();return;}
  if(!state?.combat||state.combat.turnPending)return;
  const moves={"1":"attack","2":"defend","3":"dodge","4":"skill","6":"flee"};
  if(moves[event.key])combatMove(moves[event.key]);
  else if(event.key==="5"){const owned=Object.entries(state.items).some(([id,count])=>count>0&&itemData[id]?.type==="medicine");if(owned)document.querySelector('[data-action="combat-items"]')?.click();}
});

state=null;
activeCue=mainBgm;
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopAllMusic();finishTyping?.();}else if(musicEnabled)startMusic();});
window.addEventListener('storage',(event)=>{if(event.key===SAVE_KEY&&state&&event.newValue!==observedSave){storageConflict=true;showStorageConflict();}});
document.body.classList.remove('booting');document.querySelector('.topbar').inert=false;
syncMusicButton();render();
if(typeof Image!=='undefined'){warmCharacters();for(const src of ['assets/portraits-atlas.png','assets/items-atlas.png','assets/weapon-extras-atlas.png'])preloadImage(src);for(const loc of ['market','alley','sect','forest'])warmScene(loc,window.matchMedia('(max-aspect-ratio:3/4)').matches);}
