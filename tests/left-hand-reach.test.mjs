import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sweepLocalX,handMirrorsAt,sweepIntersects,foodCompletelyOffLeft} from '../src/game-logic.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('the sweep can start at the exact left edge, no 5% restriction',()=>{
  assert.equal(sweepLocalX(0,0,900),0);
  assert.equal(sweepLocalX(5,0,900),5);
  assert.equal(sweepLocalX(125,100,900),25); // scene offset correction
  assert.equal(sweepLocalX(-5,0,900),0);
  assert.equal(sweepLocalX(980,0,900),900);
});

test('arm mirrors only near left edge so it remains visible',()=>{
  assert.equal(handMirrorsAt(0,900),true);
  assert.equal(handMirrorsAt(90,900),true);
  assert.equal(handMirrorsAt(400,900),false);
  const css=read('src/styles.css');
  assert.match(css,/#hand-sprite\.from-left\{transform:translate\(-14%,-50%\) scaleX\(-1\)\}/);
  const code=read('src/main.js');
  assert.match(code,/hand\.classList\.toggle\('from-left',handMirrorsAt\(x,w\)\)/);
});

test('food partly visible at negative x can still be swept from left',()=>{
  const food={x:-20,y:650};
  assert.equal(foodCompletelyOffLeft(food.x,72),false);
  assert.equal(sweepIntersects(food,0,810,620,75,42),true);
  assert.equal(sweepIntersects({x:350,y:650},0,810,620,75,42),false);
});

test('left and right clicks are handled by the same sweep and preserve rules',()=>{
  const code=read('src/main.js');
  assert.match(code,/startSweep\(e\.clientX\)/);
  assert.match(code,/sweepLocalX\(clientX,scene\.getBoundingClientRect\(\)\.left,w\)/);
  assert.match(code,/sweepIntersects\(item,sweep\.x,oldY,currentY,reachX,42\)/);
  assert.match(read('index.html'),/화면 왼쪽이나 오른쪽/);
});
