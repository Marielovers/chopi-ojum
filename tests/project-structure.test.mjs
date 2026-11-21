import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const root=new URL('../',import.meta.url).pathname;
const at=(...p)=>join(root,...p);
const read=(...p)=>readFileSync(at(...p),'utf8');

test('CSS hand rule closes the drop-shadow function and selector block',()=>{
 const css=read('src','styles.css');
 const hand=css.match(/#hand-sprite\{([^\n]+)\}/);
 assert.ok(hand,'hand-sprite selector was left open');
 assert.match(hand[1],/filter:drop-shadow\([^)]*\)/);
 assert.doesNotMatch(hand[1],/drop-shadow\([^)]*\}/);
});

test('all twenty food icons, both backdrops, bed, hand and table are included',()=>{
 const logic=read('src','game-logic.mjs');
 const drinks=logic.match(/export const DRINKS = \[([^\]]+)\]/)?.[1].match(/'[^']+'/g)?.map(x=>x.slice(1,-1))??[];
 const snacks=logic.match(/export const SNACKS = \[([^\]]+)\]/)?.[1].match(/'[^']+'/g)?.map(x=>x.slice(1,-1))??[];
 assert.equal(drinks.length,10);assert.equal(snacks.length,10);
 for(const id of [...drinks,...snacks]) assert.ok(existsSync(at('public','assets','food',id+'.png')),`Missing ${id}.png`);
 for(const name of ['tavern.webp','forest.webp','table.png','hand.png','bed.png'])assert.ok(existsSync(at('public','assets',name)),`Missing ${name}`);
 for(const id of ['model1','model2']){
  const m=JSON.parse(read('public','assets','models',id,'model3.json'));
  for(const ref of [m.FileReferences.Moc,...(m.FileReferences.Textures||[])])assert.ok(existsSync(at('public','assets','models',id,ref)),`Missing ${id} ${ref}`);
 }
});

test('Vite base-aware asset references for GitHub Pages',()=>{
 const js=read('src','main.js'),live2d=read('src','live2d.js');
 assert.match(js,/import\.meta\.env\.BASE_URL/);
 assert.match(live2d,/import\.meta\.env\.BASE_URL/);
 assert.doesNotMatch(js,/['"`]\/assets\//);
 assert.doesNotMatch(live2d,/['"`]\/assets\//);
 assert.match(read('index.html'),/%BASE_URL%assets\/tavern\.webp/);
});
