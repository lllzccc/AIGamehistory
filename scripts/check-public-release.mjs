import {execFileSync} from 'node:child_process';
import {readdirSync,readFileSync,statSync,existsSync} from 'node:fs';
import path from 'node:path';
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const privatePath=/(^|\/)(?:\.env(?:\..*)?|\.knowledge-data|\.internal-dist|\.astro-knowledge|output|deploy|__pycache__)(?:\/|$)|\.(?:sqlite3?|db)(?:-(?:shm|wal))?$|\.(?:pem|key)$|^server(?:\/|\.mjs$)|^docs\/internal-knowledge\.md$|^DEPLOYMENT\.md$|^src\/(?:pages\/knowledge\.astro|components\/(?:InternalPeople|Knowledge)|lib\/knowledge)|^scripts\/knowledge-/i;
const bad=files.filter(f=>privatePath.test(f));
if(bad.length)throw new Error('Private paths in public Git index: '+bad.join(', '));
if(!process.argv.includes('--source-only')){
 if(!existsSync('dist/index.html'))throw new Error('Build the public site before checking dist');
 const walk=d=>readdirSync(d).flatMap(n=>{const p=path.join(d,n);return statSync(p).isDirectory()?walk(p):[p]});
 const leaks=[];for(const f of walk('dist')){
  if(privatePath.test(f.slice(5).replaceAll('\\','/')))leaks.push(f);
  if(/\.(?:html|js|json|map|css|txt)$/.test(f)&&/\/api\/knowledge|内部知识库|InternalPeople|KnowledgePanel|[A-Z]:[\\/]AIProjects|[A-Z]:[\\/]Users[\\/]/i.test(readFileSync(f,'utf8')))leaks.push(f);
 }
 if(leaks.length)throw new Error('Internal endpoints, labels or local paths in public output: '+[...new Set(leaks)].join(', '));
}
console.log('Public release boundary verified: no private paths or internal knowledge payloads.');
