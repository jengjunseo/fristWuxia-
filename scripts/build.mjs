import {mkdir,copyFile,readdir,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(path.resolve('.')!==root)throw new Error('Run the build from the game repository');
const output=path.resolve(root,'dist');
if(path.dirname(output)!==root||path.basename(output)!=='dist')throw new Error('Unsafe build path');
await rm(output,{recursive:true,force:true});
const files=['boot.js','game.js','events.js','save-state.js','storage.js','narrative.js','resources.js','prologue.js','music.js','icons.js','CREDITS.md','ASSET_PROVENANCE.md'];
await mkdir('dist',{recursive:true});
for(const file of files)await copyFile(file,path.join('dist',file));
await copyFile('vn.css','dist/app.css');
const html=(await readFile('index.html','utf8')).replace(/  <link rel="stylesheet"[^\n]*\n/g,'').replace('</head>','  <link rel="stylesheet" href="app.css?v=2.0.0">\n</head>');
await writeFile('dist/index.html',html);
async function assets(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(['portrait-traveler.png','asianoriental2.ogg'].includes(entry.name)||entry.name.startsWith('samurai-'))continue;
  if(entry.isDirectory()){if(!/source|original/.test(entry.name))await assets(file);continue;}
  if(!/\.(png|webp|ogg|mp3|svg|ttf|woff2)$/.test(file)&&file.split(path.sep).join('/')!=='assets/fonts/OFL.txt')continue;
  await mkdir(path.dirname(path.join('dist',file)),{recursive:true});await copyFile(file,path.join('dist',file));
}}
await assets('assets');
console.log('강호 첫걸음 2.0 정적 배포본: dist/');
