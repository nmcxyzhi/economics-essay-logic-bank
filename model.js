export const COURSE_STRUCTURE = Object.freeze({
  'Types and Sizes of Businesses': Object.freeze([
    'Business Objectives',
    'Mergers',
    'Demergers'
  ]),
  'Revenue, Costs and Profits': Object.freeze([
    'Shutdown',
    'Profit'
  ]),
  'Market Structures and Contestability': Object.freeze([
    'Market Concentration',
    'Oligopoly',
    'Monopoly',
    'Monopsony',
    'Price and Non-Price Competition',
    'Barriers to Entry',
    'Price Discrimination',
    'Natural Monopoly'
  ]),
  'Labour Markets': Object.freeze([
    'Supply of Labour',
    'Wage Differences'
  ]),
  'Government Intervention': Object.freeze([])
});

const COURSE_UNITS = Object.keys(COURSE_STRUCTURE);

export function validateBank(bank,{requireUnits=false,requireSummaries=false}={}) {
  if (bank.schemaVersion !== 1 || !Array.isArray(bank.essays)) throw new Error('数据版本或 essays 格式不正确');
  if (bank.units && (!Array.isArray(bank.units) || bank.units.some(u => typeof u !== 'string' || !u.trim()) || new Set(bank.units).size !== bank.units.length)) throw new Error('units 必须为不重复的章节名称');
  if (requireUnits && !bank.units) throw new Error('正式题库必须声明全部五个 units');
  if (bank.units && JSON.stringify(bank.units) !== JSON.stringify(COURSE_UNITS)) throw new Error('units 必须严格匹配 Edexcel IAL Economics Unit 3 教材目录及顺序');
  const ids = new Set();
  for (const e of bank.essays) {
    if (typeof e.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.id) || ids.has(e.id)) throw new Error('Essay ID 格式不正确或重复');
    ids.add(e.id);
    for (const field of ['unit','topic','essayTitle','question']) if (typeof e[field] !== 'string' || !e[field].trim()) throw new Error(`${e.id}: ${field} 不能为空`);
    if (!COURSE_STRUCTURE[e.unit]) throw new Error(`${e.id}: unit 不在 Unit 3 教材目录中`);
    if (!COURSE_STRUCTURE[e.unit].includes(e.topic)) throw new Error(`${e.id}: topic 不属于 ${e.unit} 当前已确认的 Knowledge Points`);
    if (![14,20].includes(e.marks)) throw new Error(`${e.id}: 分值应为 14 或 20`);
    if (e.questionNumber !== null && typeof e.questionNumber !== 'string') throw new Error(`${e.id}: questionNumber 应为字符串或 null`);
    const number = /^Q(7|8|9|10)(?:\([a-z]\)|[a-z])?$/i.exec(e.questionNumber || '')?.[1];
    if (number && e.marks !== (number === '7' ? 14 : 20)) throw new Error(`${e.id}: 题号与分值冲突`);
    if (!Array.isArray(e.sections) || !e.sections.length) throw new Error(`${e.id}: sections 不能为空`);
    const types = new Set();
    for (const s of e.sections) {
      if (!/^(KAA|EVA|Weighing)[1-9][0-9]*$/.test(s.type) || types.has(s.type)) throw new Error(`${e.id}: section type 格式不正确或重复`);
      types.add(s.type);
      if (typeof s.point !== 'string' || !Array.isArray(s.logic) || s.logic.some(x => typeof x !== 'string' || !x.trim()) || !Array.isArray(s.diagrams)) throw new Error(`${e.id}/${s.type}: point、logic 或 diagrams 格式不正确`);
      const hasSummary=Object.hasOwn(s,'summary');
      if(hasSummary && typeof s.summary!=='string') throw new Error(`${e.id}/${s.type}: summary 必须为字符串`);
      if (s.missing) {
        if (e.status !== 'partial' || !e.contentNote || s.point || s.logic.length || s.diagrams.length || s.matrix || (hasSummary && s.summary)) throw new Error(`${e.id}: 缺失模块须留空并明确标注`);
      } else {
        if (!s.point.trim() || !s.logic.length) throw new Error(`${e.id}/${s.type}: 已提供模块不可为空`);
        if(requireSummaries && !hasSummary) throw new Error(`${e.id}/${s.type}: 新导入模块必须提供 summary`);
        if(hasSummary){
          const words=s.summary.trim().split(/\s+/).filter(Boolean).length;
          if(!s.summary.trim() || words<3 || words>8) throw new Error(`${e.id}/${s.type}: summary 应为 3–8 个英文单词`);
        }
      }
      for (const d of s.diagrams) {
        if (typeof d !== 'string' || !/^\/diagrams\/[a-z0-9][a-z0-9._-]*\.(png|jpe?g|webp|svg)$/i.test(d)) throw new Error(`${e.id}: 图片路径须为 /diagrams/文件名`);
      }
      if (s.matrix) {
        const m=s.matrix;
        if (typeof m.caption !== 'string' || !Array.isArray(m.headers) || !m.headers.length || m.headers.some(x=>typeof x!=='string') || !Array.isArray(m.rows) || !m.rows.length || m.rows.some(r=>!Array.isArray(r)||r.length!==m.headers.length||r.some(x=>typeof x!=='string'))) throw new Error(`${e.id}: matrix 表格结构不正确`);
      }
    }
  }
}

export function catalog(bank) {
  return bank.units.map((name,i)=>({
    id:name, name, number:i+1, count:bank.essays.filter(e=>e.unit===name).length,
    topics:COURSE_STRUCTURE[name].filter(topic=>bank.essays.some(e=>e.unit===name&&e.topic===topic))
  }));
}

export function toViewEssay(e) {
  return {...e, source:e.source || {}, blocks:e.sections.map(s=>{
    const [,type,group] = /^(KAA|EVA|Weighing)([1-9][0-9]*)$/.exec(s.type);
    return {...s,summary:s.summary || '',id:s.type.toLowerCase(),type,group:Number(group),chain:s.logic,
      diagrams:s.diagrams.map(src=>({...s.diagramDetails?.[src],src,alt:s.diagramDetails?.[src]?.alt || `${s.type} diagram`}))};
  })};
}

export function recallUnits(essay,hidePoints) {
  return essay.blocks.filter(b=>!b.missing).flatMap(b=>[
    ...(hidePoints?[{key:`${b.id}:point`,block:b.id,kind:'point'}]:[]),
    ...b.chain.map((_,i)=>({key:`${b.id}:chain:${i}`,block:b.id,kind:'chain'})),
    ...b.diagrams.map((_,i)=>({key:`${b.id}:diagram:${i}`,block:b.id,kind:'diagram'})),
    ...(b.matrix?[{key:`${b.id}:matrix`,block:b.id,kind:'matrix'}]:[])
  ]);
}

export function sectionGroups(essay) {
  // Consecutive groups preserve the supplied section order exactly.
  return essay.blocks.reduce((runs,b)=>{
    if (runs.at(-1)?.group===b.group) runs.at(-1).blocks.push(b);
    else runs.push({group:b.group,blocks:[b]});
    return runs;
  },[]);
}
