import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=(path)=>readFileSync(new URL(path,root),'utf8');
test('both supplied moc files need Cubism Core that supports moc3 v6',()=>{
  for(const id of ['model1','model2']){
    const m=JSON.parse(read(`public/assets/models/${id}/model3.json`));
    const b=readFileSync(new URL(`public/assets/models/${id}/${m.FileReferences.Moc}`,root));
    assert.equal(b.toString('ascii',0,4),'MOC3');assert.equal(b.readUInt8(4),6);
  }
});
test('renderer migrated away from Cubism4-only pixi-live2d-display',()=>{
  const pkg=JSON.parse(read('package.json'));
  assert.equal(pkg.dependencies['@laplace.live/pixijs-live2d'],'0.6.1');
  assert.match(pkg.dependencies['pixi.js'],/^\^8\./);
  assert.equal(pkg.dependencies['pixi-live2d-display'],undefined);
  const s=read('src/live2d.js');
  assert.match(s,/await import\('@laplace\.live\/pixijs-live2d'\)/);
  assert.match(s,/await app\.init\(/);
  assert.match(s,/Live2DCubismCore/);
});
test('versioned public Firebase web config is deployed while local .env is gitignored',()=>{
  const env=read('.env.production');
  assert.match(env,/VITE_FIREBASE_PROJECT_ID=exit-bol/);
  assert.match(env,/VITE_FIREBASE_AUTH_DOMAIN=exit-bol\.firebaseapp\.com/);
  assert.match(read('.gitignore'),/^\.env$/m);
});
test('merged Firestore rules preserve old collections and add chopy_scores',()=>{
  const rules=read('firestore.rules');
  for(const collection of ['characters/{charId}','system/ending_stats','system/h_ending_stats','dualcore_ranking/{docId}','chopy_scores/{scoreId}']){
    assert.ok(rules.includes(`match /${collection}`),collection);
  }
  assert.match(read('src/ranking.js'),/chopy_scores/);
});
