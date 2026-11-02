import {readFile, readdir, lstat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, dirname, relative, sep} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

// Initial package checks only. Full JSON Schema validation is a later task.
const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFile(resolve(root, path), 'utf8');
const json = async path => JSON.parse(await read(path));
const tracked = [];
async function walk(dir) {
  for (const entry of await readdir(dir, {withFileTypes:true})) {
    if (['.git','node_modules','output','local'].includes(entry.name)) continue;
    const file = resolve(dir, entry.name);
    assert(!(await lstat(file)).isSymbolicLink(), 'No symlinks in public package');
    if (entry.isDirectory()) await walk(file);
    else tracked.push(relative(root,file).split(sep).join('/'));
  }
}
await walk(root);
function unique(rows, key='id') {
  assert.equal(new Set(rows.map(row=>row[key])).size, rows.length, `Duplicate ${key}`);
}
const manifest = await json('plugin.json');
assert.equal(manifest.$schema,'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');
assert.equal(manifest.name,'html-plan-ja');
assert.equal(manifest.version,(await json('package.json')).version);
assert(manifest.extensions['com.openai'].interface.shortDescription.length<=30);
const skill = await read('skills/html-plan-ja/SKILL.md');
assert(/^---\r?\nname: html-plan-ja\r?\ndescription: .+\r?\n---/.test(skill));
const plan = await json('examples/plan.json');
const response = await json('examples/response.json');
const planSchema = await json('schemas/plan.schema.json');
const responseSchema = await json('schemas/response.schema.json');
for (const [value,schema] of [[plan,planSchema],[response,responseSchema]]) {
  for (const key of schema.required) assert(Object.hasOwn(value,key),`Missing ${key}`);
  for (const key of Object.keys(value)) assert(Object.hasOwn(schema.properties,key),`Unknown ${key}`);
  assert.equal(value.schemaVersion,schema.properties.schemaVersion.const);
}
unique(plan.sources); unique(plan.claims); unique(plan.decisions); unique(response.answers,'decisionId');
assert.equal(plan.visibility,'synthetic-public');
for (const source of plan.sources) {
  assert(!source.path.includes('\\')&&!source.path.includes(':')&&!source.path.startsWith('/'));
  assert(!source.path.split('/').includes('..'));
  assert.equal(source.sha256,createHash('sha256').update(await read(source.path)).digest('hex'));
}
for (const claim of plan.claims) {
  for (const id of claim.sourceIds) assert(plan.sources.some(s=>s.id===id));
  if (claim.parentId!==null) assert(plan.claims.some(c=>c.id===claim.parentId));
}
for (const decision of plan.decisions) {
  assert(plan.claims.some(c=>c.id===decision.claimId)); unique(decision.options);
  assert(decision.options.length>=2&&decision.options.length<=5);
}
assert.equal(response.projectId,plan.projectId); assert.equal(response.planId,plan.planId);
assert.equal(response.planRevision,plan.revision);
assert.equal(response.answers.length,plan.decisions.length);
for (const answer of response.answers) {
  assert(plan.decisions.some(d=>d.id===answer.decisionId));
  assert.equal(answer.status,'unanswered'); assert.equal(answer.optionId,null); assert.equal(answer.reviewedAt,null);
}
let localLinks=0;
for (const path of tracked) {
  const content = await read(path);
  if (path.endsWith('.json')) JSON.parse(content);
  assert(!/[A-Za-z]:[\\/]Users[\\/]/i.test(content),`Personal absolute path: ${path}`);
  assert(!/github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(content),`Possible credential: ${path}`);
  if (path.endsWith('.md')) for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target=match[1]; if (/^https?:\/\//.test(target)||target.startsWith('#')) continue;
    const absolute=resolve(dirname(resolve(root,path)),target.split('#')[0]);
    const rel=relative(root,absolute);
    assert(!rel.startsWith('..')&&!rel.includes(':'),`Escaping link: ${path}`);
    assert((await lstat(absolute)).isFile(),`Missing link: ${path} -> ${target}`); localLinks++;
  }
}
const html=await read('preview/index.html');
assert(!/<script\b|https?:\/\//i.test(html),'Preview must have no script or external resource');
assert(/lang="ja"/.test(html)&&/prefers-color-scheme:dark/.test(html));
assert(!/\bchecked\b/.test(html),'Preview must not imply a default answer');
console.log(JSON.stringify({ok:true,files:tracked.length,localLinks,fixtureSourceHashVerified:true,scope:'static package and synthetic fixture checks; runtime and host installation not tested'},null,2));
