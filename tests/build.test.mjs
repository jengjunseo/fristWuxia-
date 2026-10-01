import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

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
  for(const file of ['assets/portrait-traveler.png','assets/remaster/samurai-final-dizi.mp3'])await assert.rejects(stat(path.join(root,'dist',file)));
});
