import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const root=new URL('../',import.meta.url).pathname;
const txt=(...p)=>readFileSync(join(root,...p),'utf8');
test('both original Live2D models are packed with moc and texture',()=>{
  for(const id of ['model1','model2']){
    const base=join(root,'public','assets','models',id);
    const config=JSON.parse(readFileSync(join(base,'model3.json'),'utf8'));
    assert.ok(existsSync(join(base,config.FileReferences.Moc)));
    for(const tex of config.FileReferences.Textures) assert.ok(existsSync(join(base,tex)));
  }
});
test('runtime uses current official Core URL and never substitutes generic character',()=>{
  const runtime=txt('src','live2d.js');
  assert.match(runtime,/sdk-web\/core\/06\/live2dcubismcore\.min\.js/);
  assert.match(runtime,/this\.fallback\.hidden=true; \/\/ never silently substitute/);
  assert.match(runtime,/Live2D 표시 실패/);
});
test('CSS does not resolve public assets through a nonexistent source folder',()=>{
  const css=txt('src','styles.css');
  assert.doesNotMatch(css,/url\(['"]?\.\.\/assets\//);
  assert.match(txt('src','main.js'),/ASSET_BASE.*tavern\.webp/);
});
