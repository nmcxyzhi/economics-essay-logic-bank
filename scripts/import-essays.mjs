import {readFileSync,writeFileSync,renameSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateBank} from '../model.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const [input,...flags]=process.argv.slice(2);
if(!input || flags.some(f=>!['--apply','--replace-existing'].includes(f))){
 console.error('Usage: node scripts/import-essays.mjs batch.json [--apply] [--replace-existing]');process.exit(1);
}
const target=resolve(root,'data/essay-bank.json');
const current=JSON.parse(readFileSync(target));
const incoming=JSON.parse(readFileSync(resolve(input)));
validateBank(incoming);
if(!incoming.essays.length) throw new Error('No incoming essays.');
const merged=structuredClone(current);
let added=0,replaced=0;
for(const e of incoming.essays){
 const index=merged.essays.findIndex(x=>x.id===e.id);
 if(index>=0){
  if(!flags.includes('--replace-existing')) throw new Error(`Existing ID: ${e.id}. A revision requires --replace-existing.`);
  merged.essays[index]=e;replaced++;
 }else{merged.essays.push(e);added++;}
}
if(incoming.units) merged.units=[...new Set([...(merged.units||[]),...incoming.units])];
validateBank(merged);
for(const e of merged.essays) for(const s of e.sections) for(const p of s.diagrams) if(!existsSync(resolve(root,'.'+p))) throw new Error(`Missing diagram: ${p}`);
if(flags.includes('--apply')){
 const temp=target+'.tmp';writeFileSync(temp,JSON.stringify(merged,null,2)+'\n');renameSync(temp,target);
}
console.log(`${flags.includes('--apply')?'Imported':'Dry run OK'}: ${added} added, ${replaced} replaced. Economics content preserved verbatim.`);
