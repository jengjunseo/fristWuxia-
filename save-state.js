import {events, locationData, itemData} from './events.js?v=3';

// Both disk imports and local saves pass through the same v1-compatible boundary.
export function normalizeSave(input, initial) {
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  if (!object(input) || input.version !== 1 || input.started !== true || !Object.hasOwn(locationData, input.location)) throw new Error('Invalid save');
  const s = {...initial, ...input};
  for (const key of ['hp','maxHp','qi','maxQi','coin','exp','bonusAtk','bonusDef','mainStage','day','rumors']) {
    if (!Number.isFinite(s[key]) || s[key] < 0 || s[key] > 100000 || !Number.isInteger(s[key])) throw new Error(`Invalid ${key}`);
  }
  if (s.maxHp < 1 || s.maxQi < 1 || s.mainStage > 7 || s.day < 1 || s.hp > s.maxHp || s.qi > s.maxQi) throw new Error('Invalid bounds');
  if (typeof s.name !== 'string' || typeof s.sect !== 'string') throw new Error('Invalid identity');
  s.name = s.name.slice(0,12) || '나그네';
  for (const key of ['done','skills','visited','discoveredTerms','clues','history','log']) {
    if (!Array.isArray(s[key]) || s[key].length > 10000) throw new Error(`Invalid ${key}`);
  }
  if (s.done.some(v => typeof v !== 'string') || s.skills.some(v => !['sword','fist','lightness'].includes(v)) || s.discoveredTerms.some(v=>typeof v!=='string') || s.log.some(v=>!object(v)||typeof v.title!=='string'||typeof v.text!=='string'||!Number.isFinite(v.day))) throw new Error('Invalid records');
  for (const key of ['gear','items','trust','flags','lastDay']) if (!object(s[key])) throw new Error(`Invalid ${key}`);
  for (const [id,n] of Object.entries(s.items)) if (!Object.hasOwn(itemData,id)||!Number.isInteger(n)||n<0||n>100000) throw new Error('Invalid item');
  for (const slot of ['weapon','armor']) if(s.gear[slot] != null && itemData[s.gear[slot]]?.slot !== slot) throw new Error('Invalid equipment');
  s.gear = {weapon:null,armor:null,...s.gear};
  // The original opening equipped a loaned sword without adding it to the bag.
  for (const id of Object.values(s.gear)) if(id && !s.items[id]) s.items[id]=1;
  if (!['intro','encounter','combat','reward','free'].includes(s.tutorial)) throw new Error('Invalid chapter');
  if (s.activeEventId && !events.some(e=>e.id===s.activeEventId)) s.activeEventId=null;
  if (s.pendingCombatChoice) {
    const p=s.pendingCombatChoice, e=events.find(e=>e.id===p.eventId);
    if(!e || !Number.isInteger(p.choice) || !e.choices[p.choice]?.effects.combat) throw new Error('Invalid pending choice');
  }
  if (s.combat) {
    const c=s.combat;
    if(!object(c)||!['intro','midboss','final'].includes(c.id)||!Array.isArray(c.logs)||c.logs.some(v=>typeof v!=='string')) throw new Error('Invalid combat');
    for(const k of ['enemyHp','enemyMax','enemyDamage','round']) if(!Number.isFinite(c[k])||c[k]<0||c[k]>100000)throw new Error('Invalid combat value');
    if(c.enemyMax<1||c.enemyHp>c.enemyMax)throw new Error('Invalid opponent');
    if(c.pendingDamage!=null&&(!Number.isFinite(c.pendingDamage)||c.pendingDamage<0))throw new Error('Invalid strike');
    if(c.id!=='intro' && (!s.pendingCombatChoice || events.find(e=>e.id===s.pendingCombatChoice.eventId).choices[s.pendingCombatChoice.choice].effects.combat!==c.id)) throw new Error('Missing combat event');
    c.resolveTimer=false;
    c.turnPending=Boolean(c.turnPending);
    s.tutorial=c.id==='intro'?'combat':'free';
    s.injury=null;
    s.encounterStep=null;
  } else if(s.tutorial==='combat'&&!s.injury) s.tutorial='encounter';
  if(s.injury&&!['intro','midboss','final'].includes(s.injury))throw new Error('Invalid recovery');
  if(s.result && (!object(s.result)||typeof s.result.title!=='string'||typeof s.result.text!=='string'))s.result=null;
  s.guide=Boolean(s.guide); s.largeText=Boolean(s.largeText);
  return s;
}
