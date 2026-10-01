import {mkdir,copyFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const files=['index.html','style.css','beta.css','game.js','events.js','save-state.js','CREDITS.md'];
await mkdir('dist',{recursive:true});
for(const file of files)await copyFile(file,path.join('dist',file));
async function assets(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()){if(!/source|original/.test(entry.name))await assets(file);continue;}
  if(!/\.(png|webp|ogg|mp3)$/.test(file))continue;
  await mkdir(path.dirname(path.join('dist',file)),{recursive:true});await copyFile(file,path.join('dist',file));
}}
await assets('assets');
console.log('Static beta built in dist/');
