import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {FEED_SECONDS,FLIGHT_DISTANCE_SCALE,launchVelocity,distanceFor,flightPosition} from '../src/game-logic.mjs';
const base=fileURLToPath(new URL('../',import.meta.url));
const read=(...name)=>readFileSync(join(base,...name),'utf8');

test('the user-customized 60-second feeding round is still preserved',()=>{
 assert.equal(FEED_SECONDS,60);
 assert.match(read('index.html'),/id="feed-timer">60</);
});
test('horizontal range is exactly one-tenth for the same score and angle',()=>{
 assert.equal(FLIGHT_DISTANCE_SCALE,0.1);
 for(const score of [0,10,50,100,400])for(const angle of [8,25,45,70]){
  const priorVelocity=9+Math.sqrt(score)*5.6;
  const nowVelocity=launchVelocity(score);
  assert.ok(Math.abs(nowVelocity / priorVelocity - Math.sqrt(0.1)) < 1e-12);
  const originalDistance=priorVelocity**2*Math.sin(2*angle*Math.PI/180)/9.8;
  const newDistance=distanceFor(score,angle);
  assert.ok(Math.abs(newDistance/originalDistance-0.1)<1e-12, `${score} ${angle}: ${newDistance}`);
  const flightTime=2*nowVelocity*Math.sin(angle*Math.PI/180)/9.8;
  assert.ok(Math.abs(flightPosition(flightTime,nowVelocity,angle).x-newDistance)<1e-9);
 }
});
test('ranking default player name is Chopy, not Chopy fan',()=>{
 const html=read('index.html');
 assert.match(html,/id="player-name"[^>]+value="쵸피"/);
 assert.doesNotMatch(html,/value="쵸피팬"/);
});
test('all user supplied sound files are bundled by Vite',()=>{
 const basePath=join(base,'src','assets','audio');
 for(const f of ['BGM_Crayon.ogg','Voice_ChopI_Eat1.wav',
  'Voice_ChopI_Hmm1.wav','Voice_ChopI_Hmm2.wav','Voice_ChopI_Hmm3.wav',
  'Voice_ChopI_Joy2.wav','Voice_ChopI_Joy3.wav','Voice_ChopI_Joy5.wav']){
   assert.ok(existsSync(join(basePath,f)),f);
 }
 const a=read('src','audio.js');
 assert.match(a,/import\.meta\.glob\('\.\/assets\/audio\/Voice_ChopI_\*\.wav'/);
 assert.match(a,/BGM_VOLUME=0\.5/);
 assert.match(a,/phase==='hidden'/);
 assert.match(a,/_shout/);
 assert.match(a,/_joy/);
 assert.match(a,/_pleasure/);
});
test('game events trigger their intended voice groups, without BGM playing hidden',()=>{
 const main=read('src','main.js');
 assert.match(main,/function eat\(item\)[^\n]*playGameVoice\('eat'\)/);
 assert.match(main,/function launch\(\)[^\n]*playGameVoice\('shout'\)/);
 assert.match(main,/function land\(\)[^\n]*playGameVoice\('result'\)/);
 assert.match(main,/function startDrag\([\s\S]*?playGameVoice\('hmm'\)/);
 assert.match(main,/setGameAudioPhase\(next\)/);
 assert.match(main,/soundSettingChanged\(\)/);
});
