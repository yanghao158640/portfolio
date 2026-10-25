import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import ts from 'typescript';
const js=ts.transpile(readFileSync('data/index.ts','utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
const {projects,stats}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
assert.equal(new Set(projects.map(p=>p.id)).size,projects.length);assert.deepEqual(projects.slice(0,2).map(p=>p.category),['环境工程','AI应用']);assert.equal(stats.find(s=>s.label==='在线可访问作品').value,String(projects.length));
for(const p of projects){assert.ok(existsSync('public'+p.img),p.img);assert.equal(new URL(p.link).protocol,'https:')}
for(const name of ['out/index.html','out/resume.html']){
 const html=readFileSync(name,'utf8');
 for(const p of projects.slice(0,2))assert.ok(html.includes(p.link),`Missing link: ${p.link} in ${name}`);
 for(const match of html.matchAll(/(?:src|href)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)){
  if(match[1]==='/resume')continue;
  assert.ok(existsSync('out'+match[1]),'Missing static file: '+match[1]);
 }
}
assert.ok(existsSync('out/.nojekyll'));assert.ok(existsSync('out/resume/yangyuhao-resume.pdf'));
console.log('Portfolio checks passed: correct featured categories, unique projects, automatic counts, real screenshots, both project links in web/print resume, local static assets and PDF.');
