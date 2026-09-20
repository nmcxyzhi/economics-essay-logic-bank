import { validateBank, recallUnits, catalog, toViewEssay, sectionGroups } from './model.js';
import { loadPersonalNoteRecord, savePersonalNote, loadCloudPersonalNote, saveCloudPersonalNote } from './personal-notes.js';
let bank, essays = [], units = [];

let notesStorage;
try { notesStorage = window.localStorage; } catch { notesStorage = null; }
let pendingNoteSave = null;

const app = document.querySelector('#app');
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  document.querySelector('#main')?.focus();
});

const state = { practice: false, hidePoints: false, revealed: 0, essay: null };
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const paths = {
  book: '<path d="M12 5C9 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 1v16"/>',
  grid: '<rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><rect x="15" y="15" width="6" height="6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
  chart: '<path d="M4 20V14M10 20V9M16 20V4M22 20H2"/>',
  people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2"/>',
  merge: '<circle cx="8" cy="12" r="7"/><circle cx="16" cy="12" r="7"/>',
  tag: '<path d="M3 3h8l10 10-8 8L3 11Z"/><circle cx="7.5" cy="7.5" r=".5"/>',
  scale: '<path d="M12 3v18M6 21h12M3 7h18M6 7l-4 8h8L6 7ZM18 7l-4 8h8l-4-8Z"/>',
  person: '<circle cx="12" cy="6" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
  leaf: '<path d="M20 3C7 2 2 9 6 16c7 4 14-1 14-13ZM3 22 15 10"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  file: '<path d="M14 2H5v20h14V7l-5-5v5h5M8 12h8M8 16h8"/>',
  search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  reset: '<path d="M3 10a9 9 0 1 1 1 7M3 3v7h7"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;
const unitLink = unit => `#/unit/${encodeURIComponent(unit)}`;
const topicLink = (unit, topic) => `#/topic/${encodeURIComponent(unit)}/${encodeURIComponent(topic)}`;
const essayLink = id => `#/essay/${id}`;
const marks = e => `<span class="marks" lang="en">${e.marks} MARKS</span>`;

function noteCloudError(error) {
  return error?.code === 'cloud-not-configured'
    ? '已保存到本地（云端尚未配置）'
    : '已保存到本地，云端稍后重试';
}

async function commitPersonalNote() {
  if (!pendingNoteSave) return;
  const { essayId, value, updatedAt, status, timer } = pendingNoteSave;
  pendingNoteSave = null;
  if (timer) clearTimeout(timer);
  const saved = savePersonalNote(notesStorage, essayId, value, updatedAt);
  if (!saved) {
    if (status?.isConnected) status.textContent = '无法保存，请检查浏览器存储设置';
    return;
  }
  if (status?.isConnected) status.textContent = '正在上传到云端…';
  try {
    await saveCloudPersonalNote(essayId, value, updatedAt);
    if (status?.isConnected) status.textContent = '已保存到云端';
  } catch (error) {
    if (status?.isConnected) status.textContent = noteCloudError(error);
  }
}

function queuePersonalNoteSave(essayId, value, status) {
  if (pendingNoteSave?.timer) clearTimeout(pendingNoteSave.timer);
  pendingNoteSave = { essayId, value, updatedAt: Date.now(), status };
  pendingNoteSave.timer = setTimeout(commitPersonalNote, 350);
}

async function syncPersonalNote(essay, noteInput, status) {
  if (!noteInput?.isConnected) return;
  const requestedValue = noteInput.value;
  const requestedRecord = loadPersonalNoteRecord(notesStorage, essay.id);
  if (status.isConnected) status.textContent = '正在检查云端…';
  let cloud;
  try {
    cloud = await loadCloudPersonalNote(essay.id);
  } catch (error) {
    if (status.isConnected) status.textContent = noteCloudError(error);
    return;
  }
  if (!noteInput.isConnected) return;

  const currentRecord = loadPersonalNoteRecord(notesStorage, essay.id);
  const localChanged = noteInput.value !== requestedValue || currentRecord.updatedAt !== requestedRecord.updatedAt;
  if (localChanged) {
    const updatedAt = currentRecord.updatedAt || Date.now();
    if (!currentRecord.updatedAt) savePersonalNote(notesStorage, essay.id, noteInput.value, updatedAt);
    if (status.isConnected) status.textContent = '正在上传到云端…';
    try {
      await saveCloudPersonalNote(essay.id, noteInput.value, updatedAt);
      if (status.isConnected) status.textContent = '已保存到云端';
    } catch (error) {
      if (status.isConnected) status.textContent = noteCloudError(error);
    }
    return;
  }

  // Notes created before cloud sync had no timestamp. Preserve their content and seed the cloud copy.
  if (currentRecord.value && !currentRecord.updatedAt) {
    const updatedAt = Date.now();
    savePersonalNote(notesStorage, essay.id, currentRecord.value, updatedAt);
    if (status.isConnected) status.textContent = '正在上传本地笔记…';
    try {
      await saveCloudPersonalNote(essay.id, currentRecord.value, updatedAt);
      if (status.isConnected) status.textContent = '已保存到云端';
    } catch (error) {
      if (status.isConnected) status.textContent = noteCloudError(error);
    }
    return;
  }

  if (cloud.found && cloud.updatedAt > currentRecord.updatedAt) {
    noteInput.value = cloud.value;
    resizePersonalNote(noteInput);
    savePersonalNote(notesStorage, essay.id, cloud.value, cloud.updatedAt);
    if (status.isConnected) status.textContent = '已从云端同步';
    return;
  }

  if (currentRecord.value && (!cloud.found || currentRecord.updatedAt > cloud.updatedAt)) {
    if (status.isConnected) status.textContent = '正在上传到云端…';
    try {
      await saveCloudPersonalNote(essay.id, currentRecord.value, currentRecord.updatedAt || Date.now());
      if (status.isConnected) status.textContent = '已保存到云端';
    } catch (error) {
      if (status.isConnected) status.textContent = noteCloudError(error);
    }
    return;
  }

  if (status.isConnected) status.textContent = cloud.found ? '已同步云端' : '云端已就绪';
}

function resizePersonalNote(textarea) {
  textarea.style.height = 'auto';
  const height = Math.min(Math.max(textarea.scrollHeight, 180), 520);
  textarea.style.height = `${height}px`;
  textarea.style.overflowY = textarea.scrollHeight > height ? 'auto' : 'hidden';
}

function shell(content, selected = '', wide = false) {
  app.innerHTML = `<header class="mobile-header"><a class="mobile-brand" href="#/">${icon('book')} Essay Logic Bank</a><button class="icon-button" id="menu-toggle" aria-label="打开章节导航" aria-expanded="false" aria-controls="sidebar">${icon('menu')}</button></header>
  <aside class="sidebar" id="sidebar"><a class="brand" href="#/">${icon('book')}<span>Economics<small>Essay Logic Bank</small></span></a>
  <nav aria-label="章节导航"><a class="nav-all ${!selected ? 'active' : ''}" ${!selected ? 'aria-current="page"' : ''} href="#/">${icon('grid')}<span>全部章节</span><span class="nav-count">${essays.length}</span></a>
  <p class="nav-caption">按章节浏览 · ${units.length} 个章节</p>
  ${units.map(u => `<a class="nav-topic ${selected === u.name ? 'active' : ''}" ${selected === u.name ? 'aria-current="page"' : ''} href="${unitLink(u.name)}"><span class="unit-nav-number">${String(u.number).padStart(2,'0')}</span><span lang="en">${esc(u.name)}</span><span class="nav-count">${u.count}</span></a>`).join('')}</nav>
  <div class="sidebar-footer" lang="en">Edexcel IAL · Unit 3</div></aside>
  <main id="main" class="main ${wide ? 'reading-main' : ''}" tabindex="-1">${content}<footer class="page-footer"><span>让每一步推导，都有迹可循。</span><span>Economics Essay Logic Bank</span></footer></main>`;
  document.querySelector('#menu-toggle').addEventListener('click', e => {
    const open = document.body.classList.toggle('menu-open');
    e.currentTarget.setAttribute('aria-expanded', String(open));
    e.currentTarget.setAttribute('aria-label', open ? '关闭章节导航' : '打开章节导航');
  });
}

function questionRows(items) {
  return items.map((e,i)=>`<a class="question-row" href="${essayLink(e.id)}"><span class="row-index">${String(i+1).padStart(2,'0')}</span><div><h2 lang="en">${esc(e.essayTitle)}</h2><p>${e.source.session ? `<span lang="en">${esc(e.source.session)} · </span>` : ''}<span lang="en">${esc(e.questionNumber || '')}</span>${e.status==='partial'?'<span class="partial-badge">原文待补全</span>':''}</p></div>${marks(e)}${icon('arrow')}</a>`).join('');
}

function renderLibrary(unitName, topicName) {
  const unit = units.find(u=>u.name===unitName);
  if (unitName && !unit || topicName && !unit?.topics.includes(topicName)) return renderMissing();
  const entries = essays.filter(e=>(!unitName || e.unit===unitName)&&(!topicName || e.topic===topicName));
  const currentName = topicName || unitName;
  document.title = `${currentName ? currentName+' · ' : ''}Economics Essay Logic Bank`;
  const crumbs = `<a href="#/">题库</a><span>/</span>${unit ? topicName ? `<a lang="en" href="${unitLink(unitName)}">${esc(unitName)}</a><span>/</span><span lang="en">${esc(topicName)}</span>` : `<span lang="en">${esc(unitName)}</span>` : '<span>全部章节</span>'}`;
  const cards = !unit ? units.map(u=>({name:u.name,url:unitLink(u.name),count:u.count,meta:`${u.topics.length} 个知识点`,number:u.number})) : unit.topics.map((name,i)=>({name,url:topicLink(unitName,name),count:essays.filter(e=>e.unit===unitName&&e.topic===name).length,number:i+1}));
  shell(`<div class="topline"><div class="breadcrumb">${crumbs}</div><span class="reading-motto">阅读 · 理解 · 回忆</span></div>
  <header class="library-heading">${currentName ? `<a class="back-link" href="${topicName ? unitLink(unitName) : '#/'}">${icon('back')} ${topicName ? '返回章节' : '返回全部章节'}</a><h1 class="topic-heading" lang="en">${esc(currentName)}</h1><p>${topicName ? `${entries.length} 篇 Essay · 选择标题，阅读全文` : `${unit.topics.length} 个知识点 · ${unit.count} 篇 Essay`}</p>` : `<h1 lang="en">Economics Essay<br><em>Logic Bank.</em></h1><p>把经济学逻辑，整理成自己的思路。</p><span class="library-count">${units.length} 个章节 · ${essays.length} 篇 Essay</span>`}</header>
  ${!topicName ? `<section class="topic-grid ${unit ? '' : 'unit-grid'}" aria-label="${unit ? '知识点' : '课程章节'}">${cards.map(c=>`<a class="topic-card" href="${c.url}"><span class="topic-index">${String(c.number).padStart(2,'0')}</span><h2 lang="en">${esc(c.name)}</h2><div class="topic-meta"><span>${c.count} 篇 Essay${c.meta ? ` · ${c.meta}` : ''}</span>${icon('arrow')}</div></a>`).join('')}</section>` : ''}
  ${unit && !unit.count ? '<section class="empty-state"><h2>这个章节暂未收录 Essay</h2><p>新内容导入后，对应的知识点会自动显示。</p></section>' : ''}
  ${topicName ? `<section class="question-list" aria-label="文章标题"><div class="list-toolbar"><h2>全部文章 <span class="muted">${entries.length}</span></h2><label class="search-box">${icon('search')}<input id="question-search" type="search" placeholder="搜索标题或关键词" aria-label="搜索标题或关键词"></label></div><div id="question-results">${questionRows(entries)}</div><p id="search-status" class="muted" role="status"></p></section>` : ''}`, unitName);
  document.querySelector('#question-search')?.addEventListener('input', event=>{
    const q=event.target.value.trim().toLowerCase();
    const filtered=entries.filter(e=>[e.essayTitle,e.question,...e.blocks.flatMap(b=>[b.point,...b.chain])].join(' ').toLowerCase().includes(q));
    document.querySelector('#question-results').innerHTML=questionRows(filtered);
    document.querySelector('#search-status').textContent=filtered.length ? `找到 ${filtered.length} 篇文章` : '没有匹配的文章，试试其他关键词。';
  });
}

function blockCard(block) {
  const label = `${block.type}${block.group}`;
  if (block.missing) return `<article class="logic-card missing-block" id="${block.id}" aria-labelledby="${block.id}-title"><div class="card-label"><h3 id="${block.id}-title" lang="en">${label}</h3><span>原文待补全</span></div><div class="card-content"><p class="muted">原文件未提供这一模块，补充原文后会更新到这里。</p></div></article>`;
  return `<article class="logic-card ${block.type.toLowerCase()}" id="${block.id}" aria-labelledby="${block.id}-title"><div class="card-label"><h3 id="${block.id}-title" lang="en">${label}</h3><span>${block.type === 'KAA' ? '分析' : block.type === 'EVA' ? '评价' : '权衡'}</span>${block.summary ? `<p class="card-summary" lang="en">${esc(block.summary)}</p>` : ''}</div>
  <div class="card-content"><p class="point" lang="en" data-unit="${block.id}:point">${esc(block.point)}</p><ol class="logic-chain" lang="en">${block.chain.map((step, i) => `<li data-unit="${block.id}:chain:${i}">${i ? '<span class="chain-arrow" aria-hidden="true">→</span>' : '<span class="chain-start" aria-hidden="true"></span>'}<span>${esc(step)}</span></li>`).join('')}</ol>
  ${(block.diagrams || []).map((d, i) => `<figure data-unit="${block.id}:diagram:${i}"><a href="${esc(d.src)}" target="_blank" rel="noopener" aria-label="查看原图"> <img src="${esc(d.src)}" alt="${esc(d.alt)}" loading="lazy"></a>${d.caption ? `<figcaption lang="en">${esc(d.caption)}</figcaption>` : ''}<span class="diagram-hint">点击查看原图</span></figure>`).join('')}
  ${block.matrix ? `<figure class="matrix-figure" data-unit="${block.id}:matrix"><figcaption lang="en">${esc(block.matrix.caption)}</figcaption><table lang="en"><thead><tr>${block.matrix.headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${block.matrix.rows.map(row => `<tr>${row.map((cell, i) => i ? `<td>${esc(cell)}</td>` : `<th scope="row">${esc(cell)}</th>`).join('')}</tr>`).join('')}</tbody></table><span class="diagram-hint">保留原文表格及收益数值</span></figure>` : ''}
  <p class="recall-placeholder" data-placeholder="${block.id}" hidden>试着回忆这部分的逻辑链…</p></div></article>`;
}

function renderEssay(id) {
  const essay = essays.find(e => e.id === id);
  if (!essay) return renderMissing();
  state.essay = essay;
  state.practice = false;
  state.hidePoints = false;
  state.revealed = 0;
  const topic = { name: essay.topic };
  const groups = sectionGroups(essay);
  const savedNote = loadPersonalNoteRecord(notesStorage, essay.id);
  const initialNoteStatus = savedNote.ok ? '正在检查云端…' : '当前浏览器无法保存';
  document.title = `${essay.essayTitle} · Essay Logic Bank`;
  shell(`<div class="topline"><div class="breadcrumb"><a href="#/">题库</a><span>/</span><a lang="en" href="${unitLink(essay.unit)}">${esc(essay.unit)}</a><span>/</span><a lang="en" href="${topicLink(essay.unit, essay.topic)}">${esc(topic.name)}</a><span>/</span><span>阅读全文</span></div><a class="back-link" href="${topicLink(essay.unit, essay.topic)}">${icon('back')} 返回</a></div>
  ${essay.contentNote ? `<div class="content-notice"><strong>原文待补全</strong><p>${esc(essay.contentNote)}</p></div>` : ''}
  <header class="essay-heading"><div class="essay-meta"><span lang="en">${esc(essay.topic)}</span>${marks(essay)}<span class="muted">${esc([essay.source.session,essay.questionNumber].filter(Boolean).join(' · '))}</span></div><h1 lang="en">${esc(essay.essayTitle)}</h1><div class="question-block"><span lang="en">Question</span><p lang="en">${esc(essay.question)}</p></div><div class="essay-subline"><span>${essay.status==='partial' ? `已收录 ${essay.blocks.filter(b=>!b.missing).length} / ${essay.blocks.length} 个模块` : `${essay.blocks.length} 个模块 · ${groups.length} 组论证`}</span><button class="button primary" id="practice-toggle">练习模式 ${icon('arrow')}</button></div></header>
  <div class="practice-panel" id="practice-panel" hidden><div><h2>先回忆，再展开</h2><p>沿着论证顺序，每次显示一个步骤。</p></div><label class="switch-label"><input id="hide-points" type="checkbox">同时隐藏观点句</label></div>
  <div class="essay-layout"><div class="essay-body">${groups.map(({group,blocks},i)=>`<section class="argument-group" aria-labelledby="group-${i}"><div class="group-heading"><span class="group-number">${String(group).padStart(2,'0')}</span><h2 id="group-${i}">第 ${group} 组论证</h2><span class="group-sequence" lang="en">${blocks.map(b=>b.type).join(' → ')}</span></div>${blocks.map(blockCard).join('')}</section>`).join('')}</div>
  <aside class="essay-outline" aria-label="本篇结构"><p>本篇结构</p>${groups.map(({group,blocks})=>`<div class="outline-group"><span>第 ${group} 组</span>${blocks.map(b=>`<button class="outline-link" data-scroll="${b.id}" lang="en"><i class="dot ${b.type.toLowerCase()}"></i>${b.type}${b.group}</button>`).join('')}</div>`).join('')}<p class="outline-note" id="outline-note">全部展开<br>向下滚动，连贯复习</p></aside></div>
  <section class="personal-note" aria-labelledby="personal-note-title"><div class="personal-note-heading"><div><span class="personal-note-kicker" lang="en">Personal Notes</span><h2 id="personal-note-title">我的背诵段落</h2></div><span class="personal-note-status" id="personal-note-status" role="status" aria-live="polite">${initialNoteStatus}</span></div><p class="personal-note-help">把考试中可以直接使用的重点句或段落粘贴到这里。内容会自动保存到云端，并保留当前浏览器的一份本地缓存。</p><label class="personal-note-label" for="personal-note-input">重点句或段落</label><textarea id="personal-note-input" lang="en" rows="6" spellcheck="true" placeholder="在这里粘贴你想背诵的英文句子或段落…">${esc(savedNote.value)}</textarea></section>
  <div class="essay-end"><span>${icon('check')} ${essay.status==='partial' ? '已提供的原文已整理完毕，缺失部分待补充' : '本篇论证到这里结束'}</span><div><a class="text-link" href="${topicLink(essay.unit,essay.topic)}">返回文章列表 ${icon('arrow')}</a></div></div>
  <div class="practice-dock" id="practice-dock" hidden><div class="recall-progress"><span id="progress-text" role="status" aria-live="polite"></span><progress id="progress-bar" value="0" max="1" aria-label="回忆进度"></progress></div><button class="button quiet" id="reset">${icon('reset')} 重置</button><button class="button secondary" id="show-all">显示全部</button><button class="button primary" id="show-next">显示下一步 ${icon('arrow')}</button></div>`, essay.unit, true);
  document.querySelector('#practice-toggle').addEventListener('click', () => {
    state.practice = !state.practice;
    state.revealed = 0;
    updatePractice();
  });
  document.querySelector('#hide-points').addEventListener('change', event => {
    state.hidePoints = event.target.checked;
    state.revealed = 0;
    updatePractice();
  });
  document.querySelector('#show-next').addEventListener('click', () => {
    const unit = recallUnits(essay, state.hidePoints)[state.revealed];
    if (!unit) return;
    state.revealed++;
    updatePractice();
    const el = [...document.querySelectorAll('[data-unit]')].find(el => el.dataset.unit === unit.key);
    const rect = el.getBoundingClientRect();
    if (rect.top < 70 || rect.bottom > window.innerHeight - 130) el.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  document.querySelector('#show-all').addEventListener('click', () => {
    state.revealed = recallUnits(essay, state.hidePoints).length;
    updatePractice();
  });
  document.querySelector('#reset').addEventListener('click', () => {
    state.revealed = 0;
    updatePractice();
    document.querySelector('.essay-heading').scrollIntoView({ block: 'start' });
  });
  document.querySelectorAll('[data-scroll]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.scroll).scrollIntoView({ block: 'start' })));
  const noteInput = document.querySelector('#personal-note-input');
  const noteStatus = document.querySelector('#personal-note-status');
  resizePersonalNote(noteInput);
  noteInput.addEventListener('input', event => {
    resizePersonalNote(event.currentTarget);
    noteStatus.textContent = '正在保存…';
    queuePersonalNoteSave(essay.id, event.currentTarget.value, noteStatus);
  });
  noteInput.addEventListener('blur', commitPersonalNote);
  syncPersonalNote(essay, noteInput, noteStatus);
}

function updatePractice() {
  const units = recallUnits(state.essay, state.hidePoints);
  const unitKeys = new Set(units.map(u => u.key));
  const visible = new Set(units.slice(0, state.revealed).map(u => u.key));
  document.body.classList.toggle('is-practicing', state.practice);
  document.querySelector('#practice-panel').hidden = !state.practice;
  document.querySelector('#practice-dock').hidden = !state.practice;
  document.querySelector('#practice-toggle').innerHTML = state.practice ? `${icon('book')} 返回正常模式` : `练习模式 ${icon('arrow')}`;
  document.querySelector('#outline-note').innerHTML = state.practice ? '练习模式<br>先回忆，再逐步核对' : '全部展开<br>向下滚动，连贯复习';
  document.querySelectorAll('[data-unit]').forEach(el => {
    el.hidden = state.practice && unitKeys.has(el.dataset.unit) && !visible.has(el.dataset.unit);
  });
  state.essay.blocks.forEach(block => {
    if (block.missing) return;
    const hasHidden = units.some(u => u.block === block.id && !visible.has(u.key));
    document.querySelector(`[data-placeholder="${block.id}"]`).hidden = !state.practice || !hasHidden;
  });
  document.querySelector('#progress-text').textContent = state.revealed === units.length ? '全部显示 · 再看一遍，检查遗漏' : `已显示 ${state.revealed} / ${units.length} 步`;
  document.querySelector('#progress-bar').max = units.length;
  document.querySelector('#progress-bar').value = state.revealed;
  document.querySelector('#show-next').disabled = state.revealed >= units.length;
  document.querySelector('#show-all').disabled = state.revealed >= units.length;
}

function renderMissing() {
  document.title = '未找到页面 · Essay Logic Bank';
  shell('<section class="empty-state missing"><h1>没有找到这个页面</h1><p>题目链接可能已更改，请回到题库继续浏览。</p><a class="button primary" href="#/">返回全部章节</a></section>');
}

function route() {
  commitPersonalNote();
  document.body.classList.remove('menu-open', 'is-practicing');
  let parts;
  try { parts=location.hash.replace(/^#\/?/,'').split('/').map(decodeURIComponent); } catch { renderMissing(); return; }
  if (!parts[0]) renderLibrary();
  else if (parts[0] === 'unit' && parts[1]) renderLibrary(parts[1]);
  else if (parts[0] === 'topic' && parts[1] && parts[2]) renderLibrary(parts[1],parts[2]);
  else if (parts[0] === 'essay' && parts[1]) renderEssay(parts[1]);
  else renderMissing();
  window.scrollTo(0, 0);
  document.querySelector('#main').focus({ preventScroll: true });
}

try {
  const response=await fetch('./data/essay-bank.json');
  if (!response.ok) throw new Error(`题库加载失败: ${response.status}`);
  bank=await response.json();
  validateBank(bank,{requireUnits:true});
  units=catalog(bank);
  essays=bank.essays.map(toViewEssay);
  route();
  window.addEventListener('hashchange', route);
  window.addEventListener('pagehide', commitPersonalNote);
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) document.querySelector('#menu-toggle').click();
  });
} catch (error) {
  console.error(error);
  app.innerHTML = '<main class="load-error"><h1>题库暂时无法加载</h1><p>题目数据需要核对，请稍后重试。</p></main>';
}
