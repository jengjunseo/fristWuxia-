import {activityFor,activityAction,timingRange} from '../minigames.js';
export function solveActivity(input){
  let s=structuredClone(input);const c=activityFor(s.id);
  const act=(task,value)=>{s=activityAction(s,task,value);};
  if(c.type==='timing')while(!s.cleared){const z=timingRange(s);act('hit',(z.low+z.high)/2);}
  if(c.type==='sequence'){act('begin');while(!s.cleared)act('step',c.steps[s.progress]);}
  if(c.type==='memory')for(let pair=0;pair<c.labels.length;pair++)if(!s.matched.some(i=>s.deck[i]===pair)){s.deck.forEach((p,i)=>{if(p===pair)act('card',i);});}
  if(c.type==='pay'){for(let i=0;i<c.price;i++)act('coin',i);act('pay');}
  if(c.type==='count'){c.groups.forEach((g,i)=>act('answer',[i,g.amount]));act('check');}
  if(c.type==='sort')c.tokens.forEach((t,i)=>{if(!s.placed.includes(i)){act('token',i);act('bin',t[1]);}});
  if(c.type==='route')for(const goal of [...c.stops.map(v=>v.cell),c.end]){
    const queue=[[s.position]],seen=new Set([s.position]);let found;
    while(queue.length){const path=queue.shift(),p=path.at(-1);if(p===goal){found=path;break;}for(const v of [p-5,p+5,p-1,p+1])if(v>=0&&v<25&&!c.blocked.includes(v)&&!seen.has(v)&&Math.abs(p%5-v%5)+Math.abs(Math.floor(p/5)-Math.floor(v/5))===1){seen.add(v);queue.push([...path,v]);}}
    if(!found)throw new Error('Unreachable activity '+s.id);found.slice(1).forEach(v=>act('cell',v));
  }
  if(!s.cleared)throw new Error('Activity failed '+s.id);
  return s;
}
