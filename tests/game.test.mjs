import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import * as data from '../events.js';
import {normalizeSave} from '../save-state.js';

const source=(await readFile(new URL('../game.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'');
function game() {
  const nodes=new Map(),tasks=[];
  const node=()=>({innerHTML:'',hidden:true,dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},querySelector(){return null},querySelectorAll(){return []},focus(){},style:{},inert:false});
  const get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};
  const audio=()=>({paused:true,volume:0,play(){this.paused=false;return Promise.resolve()},pause(){this.paused=true}});
  Object.assign(get('mainBgm'),audio());
  const ctx=vm.createContext({...data,normalizeSave,console,performance,Audio:function(){return audio()},localStorage:{getItem(){return null},setItem(){}},document:{getElementById:get,querySelector:get,addEventListener(){},body:node()},window:{matchMedia(){return {matches:false}},addEventListener(){},innerWidth:1600,innerHeight:900,scrollTo(){}},setTimeout(fn){tasks.push(fn);return tasks.length},clearTimeout(){},setInterval(){return 1},clearInterval(){},requestAnimationFrame(){}});
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
    const g=game();g.run(`openingChoice(${opening});for(let i=0;i<5;i++)advanceEncounter();`);
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
