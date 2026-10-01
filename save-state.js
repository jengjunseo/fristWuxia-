import {events, locationData, itemData} from './events.js?v=3';

// Both disk imports and local saves pass through the same v1-compatible boundary.
export function normalizeSave(input, initial) {
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  if (!object(input) || input.version !== 1 || input.started !== true || !Object.hasOwn(locationData, input.location)) throw new Error('Invalid save');
  const s = JSON.parse(JSON.stringify({...initial, ...input}));
  for (const key of ['hp','maxHp','qi','maxQi','coin','exp','bonusAtk','bonusDef','mainStage','day','rumors']) {
    if (!Number.isFinite(s[key]) || s[key] < 0 || s[key] > 100000 || !Number.isInteger(s[key])) throw new Error(`Invalid ${key}`);
  }
  if (s.maxHp < 1 || s.maxQi < 1 || s.mainStage > 7 || s.day < 1 || s.hp > s.maxHp || s.qi > s.maxQi) throw new Error('Invalid bounds');
  if (typeof s.name !== 'string' || typeof s.sect !== 'string') throw new Error('Invalid identity');
  s.sect=s.sect.slice(0,80);
  s.name = s.name.slice(0,12) || '나그네';
  for (const key of ['done','skills','visited','discoveredTerms','clues','history','log']) {
    if (!Array.isArray(s[key]) || s[key].length > 10000) throw new Error(`Invalid ${key}`);
  }
  if (s.done.some(v => typeof v !== 'string') || s.skills.some(v => !['sword','fist','lightness'].includes(v)) || s.discoveredTerms.some(v=>typeof v!=='string'||v.length>30) || s.log.some(v=>!object(v)||typeof v.title!=='string'||v.title.length>200||typeof v.text!=='string'||v.text.length>10000||!Number.isInteger(v.day)||v.day<1)) throw new Error('Invalid records');
  s.done = [...new Set(s.done.filter(id=>events.some(e=>e.id===id)))];
  s.skills = [...new Set(s.skills)];
  s.visited = [...new Set([...s.visited.filter(id=>Object.hasOwn(locationData,id)),s.location])];
  s.log = s.log.slice(0,50);
  s.history = []; // obsolete, never used by the game
  s.clues = s.clues.filter(v=>typeof v==='string'&&v.length<1000).slice(0,100);
  for (const key of ['gear','items','trust','flags','lastDay']) if (!object(s[key])) throw new Error(`Invalid ${key}`);
  for (const key of ['gear','items','trust','flags','lastDay']) {
    if(Object.keys(s[key]).length>200)throw new Error('Too many records');
    for(const id of Object.keys(s[key]))if(['__proto__','constructor','prototype'].includes(id))throw new Error('Invalid record key');
  }
  for(const n of Object.values(s.trust))if(!Number.isInteger(n)||Math.abs(n)>100000)throw new Error('Invalid relationship');
  for(const n of Object.values(s.lastDay))if(!Number.isInteger(n)||n<1||n>s.day)throw new Error('Invalid event date');
  for(const v of Object.values(s.flags))if(!['string','boolean','number'].includes(typeof v)||(typeof v==='string'&&v.length>200)||(typeof v==='number'&&!Number.isFinite(v)))throw new Error('Invalid flag');
  for (const [id,n] of Object.entries(s.items)) if (!Object.hasOwn(itemData,id)||!Number.isInteger(n)||n<0||n>100000) throw new Error('Invalid item');
  for (const slot of ['weapon','armor']) if(s.gear[slot] != null && itemData[s.gear[slot]]?.slot !== slot) throw new Error('Invalid equipment');
  s.gear = {weapon:s.gear.weapon??null,armor:s.gear.armor??null};
  // The original opening equipped a loaned sword without adding it to the bag.
  for (const id of Object.values(s.gear)) if(id && !s.items[id]) s.items[id]=1;
  if (!['intro','encounter','combat','reward','free'].includes(s.tutorial)) throw new Error('Invalid chapter');
  if (s.activeEventId && !events.some(e=>e.id===s.activeEventId)) s.activeEventId=null;
  if(s.activeEventId&&s.done.includes(s.activeEventId))s.activeEventId=null;
  if(s.dialogueStep!=null&&(!Number.isInteger(s.dialogueStep)||s.dialogueStep<0||s.dialogueStep>20))throw new Error('Invalid dialogue');
  if(s.prologueStep!=null&&(!Number.isInteger(s.prologueStep)||s.prologueStep<0||s.prologueStep>16))throw new Error('Invalid prologue');
  if(typeof s.nameChosen!=='boolean')throw new Error('Invalid name state');
  if(s.prologueStep!=null&&(s.tutorial!=='intro'||s.combat||s.injury||s.activeEventId||s.mainStage!==0||s.flags.prologueComplete))throw new Error('Invalid opening state');
  if(s.prologueStep>12&&!s.nameChosen)throw new Error('Missing reincarnated name');
  if(s.encounterStep!=null&&(!Number.isInteger(s.encounterStep)||s.encounterStep<0||s.encounterStep>4))throw new Error('Invalid encounter');
  if(s.tutorial==='encounter'&&s.encounterStep==null)s.encounterStep=0;
  if (s.pendingCombatChoice) {
    const p=s.pendingCombatChoice, e=events.find(e=>e.id===p.eventId);
    if(!e || !Number.isInteger(p.choice) || !e.choices[p.choice]?.effects.combat) throw new Error('Invalid pending choice');
  }
  if (s.combat) {
    const c=s.combat;
    if(!object(c)||!['intro','midboss','final'].includes(c.id)||!Array.isArray(c.logs)||c.logs.some(v=>typeof v!=='string')) throw new Error('Invalid combat');
    for(const k of ['enemyHp','enemyMax','enemyDamage','round']) if(!Number.isInteger(c[k])||c[k]<0||c[k]>100000)throw new Error('Invalid combat value');
    if(c.enemyMax<1||c.enemyHp>c.enemyMax)throw new Error('Invalid opponent');
    for(const k of ['pendingDamage','opening'])if(c[k]!=null&&(!Number.isInteger(c[k])||c[k]<0||c[k]>100000))throw new Error('Invalid strike');
    for(const k of ['guard','evade','openingGuard','turnPending','assisted'])if(c[k]!=null&&typeof c[k]!=='boolean')throw new Error('Invalid combat flag');
    if(c.pendingDamage&&!c.turnPending)throw new Error('Strike without a turn');
    c.enemy = {intro:'골목의 강도',midboss:'흰 옷 검객',final:'운해 검성'}[c.id];
    c.logs=c.logs.slice(-8).map(v=>v.slice(0,1000));
    c.feedback=typeof c.feedback==='string'?c.feedback.slice(0,1000):'';
    if(c.lastMove!=null&&!['attack','defend','dodge','skill','item'].includes(c.lastMove))throw new Error('Invalid action');
    if(c.style!=null&&!['sword','fist','lightness'].includes(c.style))throw new Error('Invalid skill');
    if(c.id!=='intro' && (!s.pendingCombatChoice || events.find(e=>e.id===s.pendingCombatChoice.eventId).choices[s.pendingCombatChoice.choice].effects.combat!==c.id)) throw new Error('Missing combat event');
    c.resolveTimer=false;
    c.turnPending=Boolean(c.turnPending);
    s.tutorial=c.id==='intro'?'combat':'free';
    s.injury=null;
    s.encounterStep=null;
  } else if(s.tutorial==='combat'&&!s.injury) s.tutorial='encounter';
  if(s.injury&&!['intro','midboss','final'].includes(s.injury))throw new Error('Invalid recovery');
  if(s.injury&&s.injury!=='intro'&&!s.pendingCombatChoice)throw new Error('Missing recovery event');
  if(!s.combat&&!s.injury)s.pendingCombatChoice=null;
  if(s.result && (!object(s.result)||typeof s.result.title!=='string'||typeof s.result.text!=='string'))s.result=null;
  if(s.result)s.result.reward=typeof s.result.reward==='string'?s.result.reward.slice(0,2000):'';
  s.savedAt=typeof s.savedAt==='string'&&Number.isFinite(Date.parse(s.savedAt))?s.savedAt:null;
  s.writer=typeof s.writer==='string'?s.writer.slice(0,100):null;
  s.guide=Boolean(s.guide); s.largeText=Boolean(s.largeText);
  return s;
}
