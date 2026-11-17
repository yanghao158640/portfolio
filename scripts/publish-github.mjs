// GitHub API fallback for hosts where HTTPS Git transport is unavailable.
// Reads gh's existing login; never handles or stores credentials itself.
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync, readdirSync, unlinkSync, mkdirSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {createHash, randomUUID} from 'node:crypto';

const [target, expected, action='plan'] = process.argv.slice(2);
if (!['source','pages'].includes(target) || !/^[a-f0-9]{40}$/.test(expected || '') || !['plan','publish'].includes(action)) {
  throw Error('Usage: node scripts/publish-github.mjs source|pages <expected-main-sha> plan|publish');
}
const root=resolve('.');
const repo=`yanghao158640/${target==='source'?'portfolio':'yanghao158640.github.io'}`;
const baseDir=target==='source'?root:join(root,'out');
mkdirSync(join(root,'tmp'),{recursive:true});
mkdirSync(join(root,'output'),{recursive:true});
function api(endpoint,body,method='POST') {
  const args=['api',`repos/${repo}/${endpoint}`];
  const temp=join(root,'tmp',`github-request-${randomUUID()}.json`);
  if(body) { writeFileSync(temp,JSON.stringify(body));args.push('--method',method,'--input',temp); }
  try { return JSON.parse(execFileSync('gh',args,{encoding:'utf8',maxBuffer:40*1024*1024,stdio:['ignore','pipe','pipe']})); }
  finally { if(body) unlinkSync(temp); }
}
const head=api('git/ref/heads/main').object.sha;
if(head!==expected) throw Error(`Remote changed; review before publishing: ${head}`);
const base=api(`git/commits/${head}`).tree.sha;
const tree=api(`git/trees/${base}?recursive=1`);
if(tree.truncated) throw Error('Incomplete remote file inventory');
const remote=new Map(tree.tree.filter(x=>x.type==='blob').map(x=>[x.path,x.sha]));
function walk(folder, prefix='') {
  return readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(folder,e.name),prefix+e.name+'/'):[prefix+e.name]);
}
const sourceFiles=[
  'app/layout.tsx','app/portfolio-refinements.css','components/CreativePortfolio.tsx',
  'data/index.ts','data/films.ts','public/films/process-character.jpg',
  'public/films/process-storyboard.jpg','public/og-portfolio-202611.png',
  'public/resume/yangyuhao-portfolio.pdf','scripts/build-share-cover.py','scripts/publish-github.mjs',
];
const files=target==='source'?sourceFiles:walk(baseDir);
const changes=[];
for(const file of files) {
  if(file.split('/').some(s=>s==='..'||s==='.git') || /(?:^|\/)\.env/.test(file)) throw Error('Unexpected path');
  const content=readFileSync(join(baseDir,file));
  const sha=createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex');
  if(sha!==remote.get(file))changes.push({path:file,bytes:content.length,sha});
}
const plan={repo,head,files:changes,bytes:changes.reduce((s,x)=>s+x.bytes,0)};
writeFileSync(join(root,'output',`publish-${target}-plan.json`),JSON.stringify(plan,null,2));
console.log(JSON.stringify({repo,head,changed:changes.length,bytes:plan.bytes,paths:changes.map(x=>x.path)},null,2));
if(action==='publish' && changes.length) {
  const entries=[];
  for(const file of changes) {
    const blob=api('git/blobs',{content:readFileSync(join(baseDir,file.path)).toString('base64'),encoding:'base64'});
    if(blob.sha!==file.sha) throw Error('Uploaded content does not match local file');
    entries.push({path:file.path,mode:'100644',type:'blob',sha:blob.sha});
    console.log('Uploaded',file.path);
  }
  const nextTree=api('git/trees',{base_tree:base,tree:entries});
  const commit=api('git/commits',{message:'Add film production notes, project cases and mobile viewing improvements',tree:nextTree.sha,parents:[head]});
  if(api('git/ref/heads/main').object.sha!==head)throw Error('Remote advanced; refusing to overwrite');
  api('git/refs/heads/main',{sha:commit.sha,force:false},'PATCH');
  const result={repo,commit:commit.sha,url:`https://github.com/${repo}/commit/${commit.sha}`};
  writeFileSync(join(root,'output',`publish-${target}-result.json`),JSON.stringify(result,null,2));
  console.log('Published',JSON.stringify(result));
}
