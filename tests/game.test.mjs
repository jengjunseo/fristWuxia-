import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import * as data from '../events.js';
import {normalizeSave} from '../save-state.js';
import {readSave,writeSave,BACKUP_KEY,SLOT_KEY} from '../storage.js';
import {chapterDialogue,endingLetters} from '../narrative.js';
import {prologue,sceneIllustrations} from '../prologue.js';
import {MUSIC} from '../music.js';
import {icon} from '../icons.js';
import {journey,currentChapter,legacyStorySteps} from '../journey.js';
import {activityFor,createActivity,activityAction,renderActivity} from '../minigames.js';
import {solveActivity} from './activity-helper.mjs';

const source=(await readFile(new URL('../game.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'');
function game() {
  const nodes=new Map(),tasks=[],store=new Map();
  const node=()=>({innerHTML:'',hidden:true,dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},querySelector(){return null},querySelectorAll(){return []},focus(){},style:{},inert:false});
  const get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};
  const audio=()=>({paused:true,volume:0,play(){this.paused=false;return Promise.resolve()},pause(){this.paused=true}});
  Object.assign(get('mainBgm'),audio());
  const ctx=vm.createContext({...data,normalizeSave,readSave,writeSave,BACKUP_KEY,SLOT_KEY,chapterDialogue,endingLetters,prologue,sceneIllustrations,MUSIC,icon,journey,currentChapter,legacyStorySteps,activityFor,createActivity,activityAction,renderActivity,solveActivity,structuredClone,preloadImage:()=>Promise.resolve(true),URLSearchParams,console,performance,Audio:function(){return audio()},localStorage:{getItem(k){return store.get(k)||null},setItem(k,v){store.set(k,v)}},document:{getElementById:get,querySelector:selector=>selector.includes("[data-typewriter]")?null:get(selector),querySelectorAll(){return []},addEventListener(){},body:node()},window:{matchMedia(){return {matches:false}},addEventListener(){},innerWidth:1600,innerHeight:900,scrollTo(){}},setTimeout(fn){tasks.push(fn);return tasks.length},clearTimeout(){},setInterval(){return 1},clearInterval(){},requestAnimationFrame(){},cancelAnimationFrame(){}});
  vm.runInContext(source,ctx);
  const run=s=>vm.runInContext(s,ctx);
  run('state=makeInitial("검수");');
  return {run,tasks,flush(){for(let i=0;tasks.length&&i<100;i++)tasks.shift()();},get(){return JSON.parse(run('JSON.stringify(state)'))}};
}
test('all 57 events have valid references, choices and effects',()=>{
  assert.equal(data.events.length,57);
  assert.equal(new Set(data.events.map(e=>e.id)).size,57);
  for(const e of data.events){assert.ok(data.locationData[e.location]);assert.ok(e.choices.length>=2);if(e.followUp)assert.ok(data.events.some(v=>v.id===e.followUp),e.followUp);for(const c of e.choices){assert.ok(c.label&&c.result);if(c.effects.item)assert.ok(data.itemData[c.effects.item]);}}
});
test('all opening choices and rewards lead to a playable complete ending',()=>{
  for(let opening=0;opening<3;opening++)for(const reward of ['weapon','gauntlet','manual']){
    const g=game();g.run(`openingChoice(${opening});for(let i=0;i<5;i++){inputAfter=0;advanceEncounter();}`);
    while(g.get().combat){g.run('combatMove("attack")');g.flush();}
    assert.equal(g.get().tutorial,'reward');
    g.run(`chooseReward("${reward}")`);
    for(const id of ['case-ledger','case-courier','case-mountain','story-epilogue','story-training','story-midboss','story-final']){
      g.run(`setQuestTarget();applyChoice(events.find(e=>e.id==="${id}"),events.find(e=>e.id==="${id}").choices[0]);`);
      for(let i=0;g.get().combat&&i<40;i++){
        g.run('combatMove(state.skills.length&&state.qi>=8?"skill":isHeavy(state.combat)&&state.qi>=2?"dodge":"attack")');g.flush();
        if(g.get().injury)g.run('acceptHelp()');
      }
      assert.equal(g.get().combat,null,id);
    }
    assert.equal(g.get().mainStage,7);assert.ok(g.get().flags.titleEarned);assert.ok(g.get().hp>0);
  }
});
test('travel, goals and equipment cannot bypass a combat turn; medicine consumes it',()=>{
  const g=game();g.run('openingChoice(0);startCombat("intro");grantItem("elixir-healing-pill");state.hp=20;');
  g.run('moveTo("inn");setQuestTarget();equipItem("weapon-iron-jian");');
  assert.equal(g.get().location,'alley');assert.equal(g.get().combat.id,'intro');
  g.run('useItem("elixir-healing-pill")');assert.ok(g.get().combat.turnPending);
  g.flush();assert.equal(g.get().combat.round,1);assert.equal(g.get().items['elixir-healing-pill'],0);assert.equal(g.get().hp,30);
});
test('stale timers cannot attack a replacement combat or new game',()=>{
  const g=game();g.run('startCombat("intro");combatMove("attack");state=makeInitial("다시");startCombat("intro");');g.flush();
  assert.equal(g.get().combat.enemyHp,22);assert.equal(g.get().hp,42);
});
test('defend restores qi, dodge costs qi and creates a counter opening',()=>{
  const g=game();g.run('startCombat("intro");state.qi=8;combatMove("defend")');g.flush();assert.equal(g.get().qi,11);
  const hp=g.get().hp;g.run('combatMove("dodge")');g.flush();assert.equal(g.get().qi,9);assert.equal(g.get().hp,hp);assert.equal(g.get().combat.opening,3);
});
test('rapid input applies only one action and reward',()=>{
  const g=game();g.run('openingChoice(0);openingChoice(0);startCombat("intro");combatMove("attack");combatMove("attack");');g.flush();assert.equal(g.get().combat.round,1);assert.equal(g.get().combat.enemyHp,14);
  g.run('state.combat=null;state.tutorial="reward";chooseReward("weapon");chooseReward("weapon")');assert.equal(g.get().items['weapon-iron-jian'],1);
});
test('v1 save restores in-flight damage exactly once and fills optional defaults',()=>{
  const g=game();g.run('openingChoice(0);startCombat("intro");combatMove("attack")');
  const saved=g.get();g.run('state=normalizeSave('+JSON.stringify(saved)+',makeInitial("검수"));render();');g.flush();assert.equal(g.get().combat.enemyHp,14);assert.equal(g.get().combat.round,1);
  const old=g.get();delete old.visited;delete old.discoveredTerms;delete old.gear.armor;
  const restored=normalizeSave(old,g.run('makeInitial("검수")'));assert.ok(Array.isArray(restored.visited));assert.equal(restored.gear.armor,null);
});
test('invalid save types and malformed combat rejected before replacing state',()=>{
  const g=game(),base=g.get();
  for(const patch of [{hp:'42'},{maxHp:0},{mainStage:8},{skills:{}},{done:null},{items:{bad:1}},{log:[null]},{combat:{id:'final'}},{gear:{weapon:'elixir-qi-pill'}}])assert.throws(()=>normalizeSave({...base,...patch},base));
});
test('help retries the final duel without granting an unearned ending',()=>{
  const g=game();g.run('state.tutorial="free";state.mainStage=6;state.pendingCombatChoice={eventId:"story-final",choice:1};startCombat("final");loseCombat();acceptHelp();');
  assert.equal(g.get().mainStage,6);assert.equal(g.get().combat.id,'final');assert.equal(g.get().combat.enemyDamage,6);assert.equal(g.get().hp,g.get().maxHp);
});
test('all developer previews leave the player save untouched',()=>{
  const g=game(),before=g.get();
  g.run('for(const [kind] of developerPreviews)developerSampleMarkup(kind)');assert.deepEqual(g.get(),before);
});
test('restore after damage has landed does not apply the same strike twice',()=>{
  const g=game();g.run('startCombat("intro");combatMove("attack");resolvePendingStrike();');
  const saved=g.get(),hp=saved.combat.enemyHp;g.run('state=normalizeSave('+JSON.stringify(saved)+',makeInitial("검수"));render();');g.flush();
  assert.equal(g.get().combat.enemyHp,hp);assert.equal(g.get().combat.round,1);
});
test('all event branches apply and render without errors',()=>{
  for(const e of data.events)for(let i=0;i<e.choices.length;i++){
    const g=game();g.run(`state.tutorial="free";state.mainStage=${e.requirements.mainStage??e.requirements.stage??6};state.location="${e.location}";state.coin=100;state.flags=${JSON.stringify(Object.fromEntries((e.requirements.flags||[]).map(f=>[f,true])))};`);
    g.run(`const ev=events.find(e=>e.id==="${e.id}");state.activeEventId=ev.id;renderEventScene(ev);applyChoice(ev,ev.choices[${i}]);`);
    assert.ok(Number.isFinite(g.get().hp),e.id);assert.ok(g.get().combat || g.get().done.includes(e.id) || g.get().lastDay[e.id] != null,e.id);
  }
});
test('autosave retains a recoverable previous record and slots stay independent',()=>{
  const g=game();g.run('state.tutorial="free";state.coin=2;save();saveSlot(1);state.coin=8;save();');
  assert.equal(g.run('slotRecord(BACKUP_KEY).coin'),2);
  assert.equal(g.run('slotRecord(SLOT_KEY+1).coin'),2);
  assert.equal(g.run('storedSave().coin'),8);
  g.run('localStorage.setItem(SAVE_KEY,"broken JSON")');
  assert.equal(g.run('storedSave().coin'),2);
});
test('quota failure returns false and preserves the last valid autosave',()=>{
  const g=game();g.run('save();state.coin=9;localStorage.setItem=()=>{throw new Error("QuotaExceededError")};');
  assert.equal(g.run('save()'),false);
  assert.equal(g.run('storedSave().coin'),0);
});
test('foreign writes stop this window before overwriting the newer record',()=>{
  const g=game();g.run('save();const other={...state,coin:19};localStorage.setItem(SAVE_KEY,JSON.stringify(other));state.coin=3;');
  assert.equal(g.run('save()'),false);assert.equal(g.run('storageConflict'),true);
  assert.equal(g.run('storedSave().coin'),19);
});
test('nested corrupted fields and dialogue positions are rejected; normalization is pure',()=>{
  const g=game(),base=g.get();
  for(const patch of [{trust:{mentor:'2'}},{flags:{bad:{deep:true}}},{lastDay:{bad:-1}},{encounterStep:'4'},{dialogueStep:99}])assert.throws(()=>normalizeSave({...base,...patch},base));
  const legacy={...base,gear:{weapon:'weapon-practice-sword'},items:{}};
  const before=JSON.stringify(legacy);normalizeSave(legacy,base);assert.equal(JSON.stringify(legacy),before);
  const extraGear=normalizeSave({...base,gear:{weapon:null,armor:null,extra:{bad:true}}},base);
  assert.deepEqual(extraGear.gear,{weapon:null,armor:null});assert.deepEqual(extraGear.items,{});
});
test('a menu pauses a pending combat turn and closing it resolves exactly once',()=>{
  const g=game();g.run('startCombat("intro");combatMove("attack");document.getElementById("modalBackdrop").hidden=false;');
  g.tasks.shift()();assert.equal(g.get().combat.enemyHp,22);assert.equal(g.get().combat.round,0);
  g.run('document.getElementById("modalBackdrop").hidden=true');g.flush();assert.equal(g.get().combat.enemyHp,16);assert.equal(g.get().combat.round,1);
});
test('loading archives unsaved in-memory progress and aborts if preservation fails',()=>{
  const g=game();g.run('pendingLoad=makeInitial("불러올 기록");state.name="현재 기록";state.coin=17;confirmLoad();');
  assert.equal(g.get().name,'불러올 기록');assert.equal(g.run('JSON.parse(localStorage.getItem(SLOT_KEY+"before-load")).coin'),17);
  const broken=game();broken.run('pendingLoad=makeInitial("불러올 기록");state.name="현재 기록";localStorage.setItem=()=>{throw new Error("full")};confirmLoad();');
  assert.equal(broken.get().name,'현재 기록');
});
test('fist and lightness are distinct attack-defense and attack-evasion techniques',()=>{
  const fist=game();fist.run('state.skills=["sword","fist"];startCombat("intro");state.combat.style="fist";combatMove("skill");');fist.flush();
  assert.equal(fist.get().combat.enemyHp,12);assert.equal(fist.get().hp,41);assert.equal(fist.get().qi,10);
  const feet=game();feet.run('state.skills=["sword","lightness"];startCombat("intro");state.combat.style="lightness";combatMove("skill");');feet.flush();
  assert.equal(feet.get().combat.enemyHp,14);assert.equal(feet.get().hp,42);assert.equal(feet.get().qi,10);
});
test('new journey archives the previous playthrough and resets its timers',()=>{
  const g=game();g.run('state.coin=17;save();beginGame("새벽");');
  assert.equal(g.run('slotRecord(SLOT_KEY+"departure").coin'),17);
  assert.equal(g.get().name,'나');assert.equal(g.get().coin,0);assert.equal(g.get().prologueStep,0);assert.equal(g.get().nameChosen,false);
});
test('modern opening precedes reincarnation and only the elder can ask for a name',()=>{
  const g=game();g.run('beginGame("");openingChoice(0);chooseReincarnationName("성급한 이름");');
  assert.equal(g.get().prologueStep,0);assert.equal(g.get().name,'나');assert.equal(g.get().coin,0);
  assert.match(g.run('renderPrologue()'),/office.webp/);assert.ok(!g.run('renderPrologue()').includes('reincarnationNameForm'));
  for(let step=0;step<12;step++){assert.equal(g.get().prologueStep,step);g.run('inputAfter=0;advancePrologue();');}
  assert.equal(g.get().prologueStep,12);assert.equal(prologue[12].text,'공의 이름은 무엇이요?');
  assert.match(g.run('renderPrologue()'),/reincarnationNameForm/);g.run('inputAfter=0;advancePrologue();chooseReincarnationName("   ");');assert.equal(g.get().prologueStep,12);
  g.run('chooseReincarnationName("  청명  ");');assert.equal(g.get().name,'청명');assert.equal(g.get().nameChosen,true);assert.equal(g.get().prologueStep,13);
  assert.match(g.run('renderPrologue()'),/청명 공이라/);
  for(let step=13;step<prologue.length;step++)g.run('inputAfter=0;advancePrologue();');
  assert.equal(g.get().prologueStep,null);assert.ok(g.get().flags.prologueComplete);assert.equal(g.get().tutorial,'free');assert.equal(g.get().storyStep,0);g.run('openingChoice(0);');assert.equal(g.get().storyStep,0);assert.equal(g.get().tutorial,'free');
});
test('opening saves resume at the same line including the unanswered name question',()=>{
  for(const step of [0,3,6,8,12,13,16]){
    const g=game();g.run(`beginGame("");state.prologueStep=${step};state.nameChosen=${step>12};`);
    const saved=normalizeSave(g.get(),g.run('makeInitial("검수")'));g.run('resumeGame('+JSON.stringify(saved)+')');
    assert.equal(g.get().prologueStep,step);assert.equal(g.run('sceneMusic()'),prologue[step].cue);
  }
  const g=game();g.run('beginGame("")');const saved=g.get(),initial=g.run('makeInitial("검수")');
  for(const patch of [{prologueStep:-1},{prologueStep:17},{prologueStep:1.5},{prologueStep:13,nameChosen:false},{nameChosen:'yes'},{prologueStep:2,mainStage:4},{prologueStep:2,tutorial:'free'}])assert.throws(()=>normalizeSave({...saved,...patch},initial));
});
test('a click finishes a typing sentence before advancing the story',()=>{
  const g=game();g.run('beginGame("");var completed=0;finishTyping=()=>{completed++;finishTyping=null;};inputAfter=0;advancePrologue();');
  assert.equal(g.run('completed'),1);assert.equal(g.get().prologueStep,0);g.run('inputAfter=0;advancePrologue();');assert.equal(g.get().prologueStep,1);
});
test('music follows the scene and crossfades before pausing the previous track',()=>{
  const g=game();g.run('var musicClock=0;performance={now:()=>musicClock};var fadeTick;setInterval=fn=>{fadeTick=fn;return 1;};state=null;stopAllMusic();crossfadeCue("title");musicClock=1100;fadeTick();crossfadeCue("office");musicClock=1650;fadeTick();');
  assert.ok(g.run('musicTracks.title.volume>0&&musicTracks.office.volume>0'));
  g.run('musicClock=2200;fadeTick();');assert.ok(g.run('musicTracks.title.paused&&!musicTracks.office.paused'));
  assert.equal(g.run('musicTracks.office.volume'),g.run('musicVolume()'));
  g.run('crossfadeCue("silence");');assert.ok(g.run('activeTracks().every(track=>track.paused&&track.volume===0)'));
  for(const [code,cue] of [['state=makeInitial("검수");state.tutorial="free";state.location="market"','market'],['state.location="sect"','training'],['state.activeEventId="case-ledger"','mystery'],['state.activeEventId=null;state.combat={id:"intro"}','battle'],['state.combat={id:"final"}','final'],['state.combat=null;state.mainStage=7','ending']]){g.run(code);assert.equal(g.run('sceneMusic()'),cue);}
});
test('every main-story choice combination can finish with each training style',()=>{
  const ids=['case-ledger','case-courier','case-mountain','story-epilogue','story-training','story-midboss','story-final'];
  for(let route=0;route<128;route++){
    const g=game();g.run('state.tutorial="reward";chooseReward("manual");state.coin=3;');
    for(let n=0;n<ids.length;n++){
      g.run(`setQuestTarget();state.dialogueStep=chapterDialogue["${ids[n]}"].length;var chapter=events.find(e=>e.id==="${ids[n]}");applyChoice(chapter,chapter.choices[${(route>>n)&1}]);`);
      for(let turn=0;g.get().combat&&turn<30;turn++){
        g.run('combatMove(state.skills.length&&state.qi>=8?"skill":isHeavy(state.combat)&&state.qi>=2?"dodge":"attack")');g.flush();
        if(g.get().injury)g.run('acceptHelp()');
      }
      assert.equal(g.get().combat,null,ids[n]+' route '+route);
    }
    assert.equal(g.get().mainStage,7);assert.ok(g.get().flags.titleEarned);
    assert.equal(normalizeSave(g.get(),g.run('makeInitial("검수")')).mainStage,7);
  }
});

test('the linear journey plays every chapter in order and ends as a beginner',()=>{
  const g=game();g.run('beginGame("");');
  while(g.get().prologueStep!=null){
    if(prologue[g.get().prologueStep].nameEntry)g.run('chooseReincarnationName("새벽");');
    else g.run('inputAfter=0;advancePrologue();');
  }
  for(let step=0;step<journey.length;step++){
    assert.equal(g.get().storyStep,step);
    for(let line=0;g.get().storyStep===step&&!g.get().combat&&line<30;line++){
      if(g.get().minigame)g.run('state.minigame=solveActivity(state.minigame);continueActivity();');
      else g.run('inputAfter=0;advanceStory();');
    }
    for(let round=0;g.get().combat&&round<8;round++){g.run('combatMove("defend")');g.flush();}
    assert.equal(g.get().injury,null,journey[step].id);
    assert.equal(g.get().storyStep,step+1,journey[step].id);
    assert.ok(g.get().done.includes(journey[step].id));
    const saved=normalizeSave(g.get(),g.run('makeInitial("검수")'));
    assert.equal(saved.storyStep,step+1);
  }
  assert.ok(g.get().flags.journeyComplete);assert.ok(!g.get().flags.titleEarned);
  assert.equal(g.get().activityCleared.length,22);
  assert.equal(g.get().skills.length,1);assert.ok(g.get().day<30);
  for(const id of ['innkeeper','physician','disciple','guard','mentor'])assert.ok(g.get().trust[id]>0,id);
  assert.match(g.run('renderStory()'),/돌아갈 곳/);
});
test('linear dialogue cannot offer exploratory choices or grant repeated chapter rewards',()=>{
  const g=game();g.run('state.storyMode=true;state.tutorial="free";state.flags.prologueComplete=true;');
  for(let step=0;step<journey.length;step++){
    g.run(`state.storyStep=${step};state.dialogueStep=0;`);
    const html=g.run('renderStory()');
    assert.ok(!/event-card|choice-button|choose-event|opening-choice|event-cg/.test(html),journey[step].id);
    assert.equal((html.match(/class="vn-art"/g)||[]).length,1);
  }
  g.run('state.storyStep=4;state.dialogueStep=currentChapter(state).lines.length-1;inputAfter=0;advanceStory();state.minigame=solveActivity(state.minigame);continueActivity();advanceStory();');
  assert.equal(g.get().storyStep,5);assert.equal(g.get().coin,2);assert.equal(g.get().dialogueStep,0);
});
test('every linear battle save resumes the current turn and continues only once',()=>{
  for(const [step,chapter] of journey.entries())if(chapter.combat){
    const g=game();g.run(`state.storyMode=true;state.tutorial="free";state.storyStep=${step};state.dialogueStep=${chapter.lines.length-1};state.storyBattle="${chapter.id}";startCombat("${chapter.combat}");combatMove("defend");`);
    const saved=normalizeSave(g.get(),g.run('makeInitial("검수")'));
    g.run('state=normalizeSave('+JSON.stringify(saved)+',makeInitial("검수"));render();');g.flush();
    assert.equal(g.get().combat.round,1);
    const target=chapter.combat==='final'?4:3;
    for(let r=1;r<target;r++){g.run('combatMove("defend")');g.flush();}
    assert.equal(g.get().combat,null);assert.equal(g.get().storyStep,step+1);
    g.flush();assert.equal(g.get().storyStep,step+1);
  }
});
test('asking for help advances every linear battle without a retry loop',()=>{
  for(const [step,chapter] of journey.entries())if(chapter.combat){
    const g=game();g.run(`state.storyMode=true;state.tutorial="free";state.storyStep=${step};state.dialogueStep=${chapter.lines.length-1};state.storyBattle="${chapter.id}";startCombat("${chapter.combat}");combatMove("flee");`);
    const saved=normalizeSave(g.get(),g.run('makeInitial("검수")'));assert.equal(saved.injury,chapter.combat);
    g.run('acceptHelp();acceptHelp();');assert.equal(g.get().storyStep,step+1);assert.equal(g.get().injury,null);assert.ok(g.get().flags.acceptedHelp);
  }
});
test('old exploration saves enter the corresponding linear chapter with their equipment intact',()=>{
  for(let stage=0;stage<8;stage++){
    const g=game();g.run(`state.mainStage=${stage};state.tutorial="free";state.coin=17;grantItem("weapon-iron-jian");state.gear.weapon="weapon-iron-jian";resumeGame(state);`);
    assert.ok(g.get().storyMode);assert.equal(g.get().coin,17);assert.equal(g.get().gear.weapon,'weapon-iron-jian');
    assert.equal(normalizeSave(g.get(),g.run('makeInitial("검수")')).storyStep,g.get().storyStep);
    assert.ok(!/event-card|choice-button/.test(g.run('renderStory()')));
  }
});
test('corrupt linear positions and mismatched battle scenes are rejected',()=>{
  const g=game();g.run('state.storyMode=true;state.tutorial="free";');const base=g.get();
  for(const patch of [{storyStep:journey.length+1},{storyStep:-1},{storyStep:1.5},{storyMode:'yes'},{dialogueStep:journey[0].lines.length},{storyBattle:journey[9].id},{injury:'final'}])assert.throws(()=>normalizeSave({...base,...patch},base));
});
test('old battle and injury saves migrate to the correct linear battle chapter',()=>{
  for(const [battle,step] of Object.entries(legacyStorySteps))for(const injured of [false,true]){
    const g=game();g.run(`state.tutorial="free";startCombat("${battle}");${injured?'state.combat=null;state.injury="'+battle+'";':''}resumeGame(state);`);
    assert.equal(g.get().storyStep,step);assert.equal(journey[step].combat,battle);
    const saved=normalizeSave(g.get(),g.run('makeInitial("검수")'));
    assert.equal(saved.storyBattle,journey[step].id);
    if(injured){g.run('acceptHelp();');assert.equal(g.get().storyStep,step+1);}
  }
});
test('a story click completes typing before moving to the next line',()=>{
  const g=game();g.run('state.storyMode=true;state.tutorial="free";var finished=0;finishTyping=()=>{finished++;finishTyping=null;};inputAfter=0;advanceStory();');
  assert.equal(g.run('finished'),1);assert.equal(g.get().dialogueStep,0);g.run('inputAfter=0;advanceStory();');assert.equal(g.get().dialogueStep,1);
});
test('all daily activities block dialogue until cleared and resume exactly once',()=>{
  for(const [step,chapter] of journey.entries())if(activityFor(chapter.id)){
    const g=game();g.run(`state.storyMode=true;state.tutorial="free";state.storyStep=${step};state.dialogueStep=${activityFor(chapter.id).after};inputAfter=0;advanceStory();`);
    assert.equal(g.get().minigame.id,chapter.id);
    g.run('continueActivity();inputAfter=0;advanceStory();completeStoryChapter();');
    assert.equal(g.get().storyStep,step);assert.equal(g.get().dialogueStep,activityFor(chapter.id).after);
    g.run('state.minigame=solveActivity(state.minigame);');
    const saved=normalizeSave(g.get(),g.run('makeInitial("검수")'));
    g.run('resumeGame('+JSON.stringify(saved)+');continueActivity();continueActivity();');
    assert.equal(g.get().dialogueStep,activityFor(chapter.id).after+1);
    assert.equal(g.get().activityCleared.filter(id=>id===chapter.id).length,1);
    assert.equal(g.get().minigame,null);
  }
});
test('old dialogue positions receive the new activity without rewinding the scene',()=>{
  const g=game();g.run('state.storyMode=true;state.tutorial="free";state.storyStep=0;state.dialogueStep=6;resumeGame(state);inputAfter=0;advanceStory();');
  assert.equal(g.get().dialogueStep,6);assert.equal(g.get().minigame.id,'first-meal');
  g.run('state.minigame=solveActivity(state.minigame);continueActivity();');assert.equal(g.get().dialogueStep,7);
});
test('partly played boards of every type round-trip through story saves and corrupt boards are rejected',()=>{
  const acts={timing:['hit',50],memory:['card',0],sequence:['begin'],pay:['coin',0],count:['tally',0],sort:['token',0],route:['cell',5]};
  for(const [step,chapter] of journey.entries())if(activityFor(chapter.id)){
    const g=game();g.run(`state.storyMode=true;state.tutorial="free";state.storyStep=${step};state.dialogueStep=${activityFor(chapter.id).after};state.minigame=createActivity("${chapter.id}");`);
    const type=g.get().minigame.type,[task,value]=acts[type];g.run('state.minigame=activityAction(state.minigame,'+JSON.stringify(task)+','+JSON.stringify(value)+');');
    const saved=normalizeSave(g.get(),g.run('makeInitial("검수")'));g.run('resumeGame('+JSON.stringify(saved)+');');
    assert.deepEqual(g.get().minigame,saved.minigame,chapter.id);
    assert.throws(()=>normalizeSave({...saved,minigame:{...saved.minigame,cleared:true}},g.run('makeInitial("검수")')));
    assert.throws(()=>normalizeSave({...saved,prologueStep:0},g.run('makeInitial("검수")')));
    assert.throws(()=>normalizeSave({...saved,activityCleared:[chapter.id]},g.run('makeInitial("검수")')));
    assert.throws(()=>normalizeSave({...saved,activityCleared:['__proto__']},g.run('makeInitial("검수")')));
  }
});
