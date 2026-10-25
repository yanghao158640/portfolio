import {resolve,join,sep} from 'node:path';
import {existsSync,readFileSync,unlinkSync,cpSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const source=resolve('out'),target=resolve(process.argv[2]||'../github-portfolio-deploy');
if(!existsSync(join(source,'index.html'))||!existsSync(join(target,'.git')))throw Error('Build out/ and clone the deployment repository first.');
const remote=execFileSync('git',['-C',target,'remote','get-url','origin'],{encoding:'utf8'}).trim();
if(!['https://github.com/yanghao158640/yanghao158640.github.io.git','git@github.com:yanghao158640/yanghao158640.github.io.git'].includes(remote))throw Error('Refusing to modify an unexpected deployment repository.');
for(const url of ['https://hsbx9017-dot.github.io/wwtp-simulator/','https://hsbx9017-dot.github.io/xianxue-yidian/'])if(!readFileSync(join(source,'index.html'),'utf8').includes(url))throw Error('Missing featured project link.');
const tracked=execFileSync('git',['-C',target,'ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
let removed=0;for(const file of tracked){
 if(file==='README.md'||existsSync(join(source,file)))continue;
 const full=resolve(target,file);if(!full.startsWith(target+sep))throw Error('Unsafe stale artifact path.');
 if(existsSync(full)){unlinkSync(full);removed++}
}
cpSync(source,target,{recursive:true});
writeFileSync(join(target,'README.md'),'# 杨豫豪 · 个人作品站\n\n在线访问：https://yanghao158640.github.io/\n\n此仓库仅保存GitHub Pages构建产物。内容和功能请在 https://github.com/yanghao158640/portfolio 维护，构建、检查后使用该源码仓库的 scripts/sync-pages.mjs 同步。不要把源码、依赖或临时导出放在这里。\n');
console.log(`Synced verified static site; removed ${removed} superseded tracked artifacts. No commit or push performed.`);
