import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateBank} from './model.js';
const bank=JSON.parse(readFileSync(new URL('./data/essay-bank.json',import.meta.url)));
validateBank(bank);
let images=0;
for(const e of bank.essays) for(const s of e.sections) for(const path of s.diagrams){
 const file=new URL('.'+path,import.meta.url);
 if(!existsSync(file)) throw new Error(`Missing diagram: ${path}`);
 const expected=s.diagramDetails?.[path]?.sha256;
 if(expected && createHash('sha256').update(readFileSync(file)).digest('hex')!==expected) throw new Error(`Diagram differs from source: ${path}`);
 images++;
}
console.log(`Validated ${bank.essays.length} essays, ${images} source diagrams; section order is data-driven.`);
