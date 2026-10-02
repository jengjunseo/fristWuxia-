import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {MUSIC} from '../music.js';
import {journey} from '../journey.js';

test('production build contains its module graph, local font licenses and media',async()=>{
  const root=fileURLToPath(new URL('../',import.meta.url));
  await import('../scripts/build.mjs');
  const html=await readFile(path.join(root,'dist/index.html'),'utf8');
  assert.ok(!html.includes('fonts.googleapis.com'));
  assert.ok(html.includes('app.css'));
  for(const file of ['boot.js','game.js','events.js','save-state.js','storage.js','narrative.js','resources.js','app.css','assets/fonts/OFL.txt','assets/fonts/GowunBatang-Regular.woff2','assets/fonts/GowunBatang-Bold.woff2','assets/seal.svg','assets/remaster/traveler-standing.webp','assets/remaster/final-wide.webp','assets/remaster/final-mobile.webp'])assert.ok((await stat(path.join(root,'dist',file))).size>0,file);
  for(const file of ['boot.js','game.js','save-state.js']){
    const code=await readFile(path.join(root,'dist',file),'utf8');
    for(const match of code.matchAll(/(?:from|import\()\s*["'](\.\/[^"']+)/g))await stat(path.join(root,'dist',match[1].split('?')[0]));
  }
  for(const file of ['prologue.js','icons.js','music.js','ASSET_PROVENANCE.md',...['office','crossing','awakening','mountain','caravan','duel','alley'].map(name=>'assets/vn/'+name+'.webp'),...MUSIC.map(track=>'assets/music/'+track.file)])assert.ok((await stat(path.join(root,'dist',file))).size>0,file);
  for(const file of ['assets/portrait-traveler.png','assets/asianoriental2.ogg','assets/remaster/samurai-final-dizi.mp3','assets/remaster/samurai-battle.mp3'])await assert.rejects(stat(path.join(root,'dist',file)));
  const runtime=html+await readFile(path.join(root,'dist/game.js'),'utf8');
  for(const phrase of ['무림 초보의 모험기','한 번 누르면 문장 완성','선택으로 쓰는 무협','세 번의 승부','이야기의 끝에서 당신의 선택'])assert.ok(!runtime.includes(phrase),phrase);
  assert.ok(!/asianoriental2|samurai-/.test(runtime));
  for(const file of ['journey.js',...new Set(journey.map(scene=>'assets/vn/'+scene.art+'.webp')),'assets/vn/alley-stage.webp','assets/vn/practice-stage.webp','assets/vn/traveler-novice.webp','assets/vn/soyeon-standing.webp'])assert.ok((await stat(path.join(root,'dist',file))).size>0,file);
});
