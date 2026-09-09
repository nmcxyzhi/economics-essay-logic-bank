import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateBank,catalog,toViewEssay,recallUnits,sectionGroups} from '../model.js';
const bank=JSON.parse(readFileSync(new URL('../data/essay-bank.json',import.meta.url)));
test('new Units and topics appear from Essay data; empty topics are never manufactured',()=>{
 const fixture=structuredClone(bank);
 fixture.essays.push({...structuredClone(bank.essays[0]),id:'test-new-unit',unit:'Test Unit',topic:'Test Topic'});
 validateBank(fixture);
 const result=catalog(fixture);
 assert.equal(result.at(-1).name,'Test Unit');
 assert.deepEqual(result.at(-1).topics,['Test Topic']);
 for(const u of result) for(const topic of u.topics) assert.ok(fixture.essays.some(e=>e.unit===u.name&&e.topic===topic));
});
test('section order and count follow JSON, including a third group',()=>{
 const fixture=structuredClone(bank);
 const e=fixture.essays[0];
 e.sections=[e.sections[1],e.sections[0],{...e.sections[0],type:'KAA3'}];
 validateBank(fixture);
 const view=toViewEssay(e);
 assert.deepEqual(view.blocks.map(b=>b.type+b.group),['EVA1','KAA1','KAA3']);
 assert.deepEqual(sectionGroups(view).map(g=>g.group),[1,3]);
});
test('recall includes real diagrams and matrix and skips missing slots',()=>{
 const withImage=toViewEssay(bank.essays.find(e=>e.sections.some(s=>s.diagrams.length)));
 assert.ok(recallUnits(withImage,false).some(u=>u.kind==='diagram'));
 const withMatrix=toViewEssay(bank.essays.find(e=>e.sections.some(s=>s.matrix)));
 assert.equal(recallUnits(withMatrix,false).filter(u=>u.kind==='matrix').length,1);
 const partial=toViewEssay(bank.essays.find(e=>e.status==='partial'));
 assert.ok(recallUnits(partial,true).every(u=>!partial.blocks.find(b=>b.id===u.block).missing));
 assert.equal(recallUnits(withImage,true).length-recallUnits(withImage,false).length,withImage.blocks.length);
});
test('malformed IDs, duplicate sections, mark conflicts and unsafe image paths fail',()=>{
 for(const change of [e=>e.id='../wrong',e=>e.sections.push(e.sections[0]),e=>{e.questionNumber='Q7(e)';e.marks=20},e=>e.sections[0].diagrams=['/diagrams/../../secret.png']]){
  const fixture=structuredClone(bank);change(fixture.essays[0]);assert.throws(()=>validateBank(fixture));
 }
});
