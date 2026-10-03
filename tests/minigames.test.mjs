import {test} from 'node:test';
import assert from 'node:assert/strict';
import {journey} from '../journey.js';
import {minigames,createActivity,activityAction,normalizeActivity,renderActivity,timingRange} from '../minigames.js';
import {solveActivity} from './activity-helper.mjs';

test('every daily scene has one distinct activity and every board can be completed and restored',()=>{
  const scenes=journey.filter(c=>!c.combat);assert.equal(scenes.length,22);
  assert.equal(new Set(Object.values(minigames).map(c=>c.type)).size,7);
  for(const c of scenes){
    const spec=minigames[c.id];assert.ok(spec,c.id);assert.ok(spec.after>=0&&spec.after<c.lines.length-1,c.id);
    const board=createActivity(c.id),cleared=solveActivity(board);
    assert.equal(normalizeActivity(cleared,c.id).cleared,true,c.id);
    assert.deepEqual(normalizeActivity(JSON.parse(JSON.stringify(board)),c.id),board);
    const html=renderActivity(board);assert.ok(html.includes('mg-tableau'));assert.ok(html.includes('mg-advice'));
    assert.equal(board.cleared,false,'actions do not mutate an earlier saved board');
  }
});
test('timing windows change each round; missing keeps earlier success and is not a pass',()=>{
  let s=createActivity('first-meal');s=activityAction(s,'hit',50);assert.equal(s.progress,1);
  assert.deepEqual(timingRange(s),{low:22,high:50});s=activityAction(s,'hit',90);
  assert.equal(s.progress,1);assert.equal(s.mistakes,1);assert.ok(!s.cleared);
  s=activityAction(s,'manual');s=activityAction(s,'position',35);assert.equal(s.value,35);
  s=activityAction(s,'hit',35);s=activityAction(s,'hit',68);assert.ok(s.cleared);
  assert.equal(activityAction(s,'hit',68),s);
});
test('sequences have a rehearsal stage and a wrong move preserves the current step',()=>{
  let s=createActivity('first-escort');s=activityAction(s,'step','고리 밀기');assert.equal(s.progress,0);
  s=activityAction(s,'begin');s=activityAction(s,'step','고리 밀기');s=activityAction(s,'step','끝 빼기');
  assert.equal(s.progress,1);assert.equal(s.mistakes,1);assert.equal(s.cleared,false);
  assert.ok(solveActivity(s).cleared);
});
test('memory mismatch stays visible; duplicate and already matched cards cannot count twice',()=>{
  let s=createActivity('first-clinic');const a=0,b=s.deck.findIndex(v=>v!==s.deck[a]),pair=s.deck.findIndex((v,i)=>i!==a&&v===s.deck[a]);
  s=activityAction(s,'card',a);assert.equal(activityAction(s,'card',a),s);s=activityAction(s,'card',b);
  assert.equal(s.mistakes,1);assert.equal(s.selected.length,2);s=activityAction(s,'card',a);s=activityAction(s,'card',pair);
  assert.equal(s.progress,1);assert.equal(activityAction(s,'card',a),s);
  assert.deepEqual(normalizeActivity(s,s.id),s);
});
test('coin payment, sorting and count confirmation reject incorrect work',()=>{
  let pay=createActivity('first-market');pay=activityAction(pay,'coin',0);pay=activityAction(pay,'pay');assert.ok(!pay.cleared);assert.equal(pay.mistakes,1);
  pay=activityAction(pay,'coin',1);pay=activityAction(pay,'pay');assert.ok(pay.cleared);
  let sort=createActivity('first-delivery');sort=activityAction(sort,'token',0);sort=activityAction(sort,'bin',1);assert.equal(sort.progress,0);assert.equal(sort.selected[0],0);assert.equal(sort.mistakes,1);
  sort=activityAction(sort,'bin',0);assert.equal(sort.progress,1);
  let count=createActivity('ledger');count=activityAction(count,'check');assert.equal(count.mistakes,1);assert.ok(!count.cleared);
  count=activityAction(count,'tally',0);count=activityAction(count,'tally',0);assert.equal(count.answers.reduce((a,b)=>a+b,0),0);assert.deepEqual(normalizeActivity(count,count.id),count);
});
test('routes forbid walls and row wrapping and require every landmark before arrival',()=>{
  let s=createActivity('small-errand');assert.equal(activityAction(s,'cell',1),s);assert.equal(activityAction(s,'cell',4),s);
  const c=minigames[s.id];s.position=23;s.visited=[0,5,10,15,20,21,22,23];s.progress=2;
  s=activityAction(s,'cell',24);assert.equal(s.cleared,false);assert.ok(s.message);assert.equal(solveActivity(createActivity('small-errand')).cleared,true);
});
test('corrupt and forged game boards are rejected before replacing a save',()=>{
  const base=createActivity('first-clinic');
  for(const patch of [{id:'first-meal'},{type:'sort'},{cleared:true},{matched:[0,0]},{deck:[]},{progress:4},{moves:NaN},{selected:[50]},{ready:'yes'}])assert.throws(()=>normalizeActivity({...base,...patch},base.id));
  const route=createActivity('first-road');assert.throws(()=>normalizeActivity({...route,visited:[0,12]},route.id));
  const pay=createActivity('first-market');assert.throws(()=>normalizeActivity({...pay,progress:1,cleared:true},pay.id));
});
