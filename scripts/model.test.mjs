import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COURSE_STRUCTURE,validateBank,catalog,toViewEssay,recallUnits,sectionGroups} from '../model.js';
const bank=JSON.parse(readFileSync(new URL('../data/essay-bank.json',import.meta.url)));
test('catalog keeps the exact five Unit order and shows only populated Knowledge Points',()=>{
 validateBank(bank,{requireUnits:true});
 const result=catalog(bank);
 assert.deepEqual(result.map(u=>u.name),Object.keys(COURSE_STRUCTURE));
 for(const u of result) for(const topic of u.topics) {
  assert.ok(COURSE_STRUCTURE[u.name].includes(topic));
  assert.ok(bank.essays.some(e=>e.unit===u.name&&e.topic===topic));
 }
 assert.deepEqual(result.find(u=>u.name==='Labour Markets').topics,[]);
 assert.deepEqual(result.find(u=>u.name==='Government Intervention').topics,[]);
});
test('validation rejects Units and Knowledge Points outside the confirmed essay-bank structure',()=>{
 const wrongUnit=structuredClone(bank);
 wrongUnit.essays[0].unit='Business Objectives';
 assert.throws(()=>validateBank(wrongUnit),/unit 不在/);
 const wrongTopic=structuredClone(bank);
 wrongTopic.essays[0].topic='Perfect Competition';
 assert.throws(()=>validateBank(wrongTopic),/topic 不属于/);
 const wrongOrder=structuredClone(bank);
 wrongOrder.units.reverse();
 assert.throws(()=>validateBank(wrongOrder,{requireUnits:true}),/教材目录及顺序/);
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
 assert.ok(recallUnits(withImage,true).every(u=>u.kind!=='summary'));
});
test('summaries cover current sections, stay visible metadata, and remain legacy-compatible',()=>{
 const normal=bank.essays.flatMap(e=>e.sections).filter(s=>!s.missing);
 const missing=bank.essays.flatMap(e=>e.sections).filter(s=>s.missing);
 assert.equal(normal.length,63);
 assert.ok(normal.every(s=>typeof s.summary==='string'&&s.summary.trim()&&s.summary.trim().split(/\s+/).length>=3&&s.summary.trim().split(/\s+/).length<=8));
 assert.ok(missing.every(s=>s.summary===''));
 const legacy=structuredClone(bank);
 delete legacy.essays[0].sections[0].summary;
 validateBank(legacy,{requireUnits:true});
 assert.equal(toViewEssay(legacy.essays[0]).blocks[0].summary,'');
 assert.throws(()=>validateBank(legacy,{requireUnits:true,requireSummaries:true}),/必须提供 summary/);
 const template=JSON.parse(readFileSync(new URL('../essay-import-template.json',import.meta.url)));
 assert.ok(template.essays[0].sections.every(s=>Object.hasOwn(s,'summary')));
});
test('malformed IDs, duplicate sections, mark conflicts and unsafe image paths fail',()=>{
 for(const change of [e=>e.id='../wrong',e=>e.sections.push(e.sections[0]),e=>{e.questionNumber='Q7(e)';e.marks=20},e=>e.sections[0].diagrams=['/diagrams/../../secret.png']]){
  const fixture=structuredClone(bank);change(fixture.essays[0]);assert.throws(()=>validateBank(fixture));
 }
});
