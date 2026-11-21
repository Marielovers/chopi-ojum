import test from 'node:test';
import assert from 'node:assert/strict';
import {FEED_SECONDS, sweepIntersects, makeSprayParticles, flightPosition} from '../src/game-logic.mjs';

const seeded = () => { let n=42; return () => ((n=(n*1664525+1013904223)>>>0)/4294967296); };

test('food collection round respects user-edited 60 seconds',()=>{
  assert.equal(FEED_SECONDS,60);
});

test('one upward sweep collects foods from several heights',()=>{
  const x=800;
  const foods=[{x:770,y:570},{x:835,y:650},{x:795,y:740},{x:785,y:825}];
  // A sweep crossing 850 -> 490 can collect all four rows.
  const collected=foods.filter(item=>sweepIntersects(item,x,850,490,110,42));
  assert.equal(collected.length,foods.length);
  assert.equal(sweepIntersects({x:400,y:650},x,850,490,110,42),false);
  assert.equal(sweepIntersects({x:800,y:100},x,850,490,110,42),false);
});

test('fountain droplets are abundant, multi-angle and emitted across more than one second',()=>{
  const drops=makeSprayParticles(45,30,12,seeded());
  assert.ok(drops.length>=100);
  assert.ok(Math.max(...drops.map(x=>x.delay))>=1);
  assert.ok(Math.max(...drops.map(x=>x.angle))-Math.min(...drops.map(x=>x.angle))>10);
  assert.ok(Math.max(...drops.map(x=>x.speed))-Math.min(...drops.map(x=>x.speed))>5);
  for (const p of drops){
    assert.ok(p.angle>=4&&p.angle<=82);
    assert.ok(p.size>0&&p.alpha>0&&p.alpha<=1);
    const t=0.5;
    assert.ok(Number.isFinite(flightPosition(t,p.speed,p.angle).x));
  }
});

test('larger score can create denser spray within a performance cap',()=>{
 const low=makeSprayParticles(40,20,0,seeded()).length;
 const high=makeSprayParticles(40,40,120,seeded()).length;
 assert.ok(high>low);assert.ok(high<=260);
});
