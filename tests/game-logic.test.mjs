import test from 'node:test';
import assert from 'node:assert/strict';
import {newRound,collect,angleValue,launchVelocity,flightPosition,distanceFor,hiddenRules,DRINKS,SNACKS} from '../src/game-logic.mjs';
test('10 drinks and 10 snacks available',()=>{assert.equal(DRINKS.length,10);assert.equal(SNACKS.length,10);});
test('drinks accumulate +10 and every three drinks grant +20',()=>{
 let round=newRound(),bonus=0;
 for(let i=0;i<6;i++){let o=collect(round,'water');round=o.round;bonus+=o.bonus;}
 assert.equal(round.urine,100);assert.equal(round.combo,6);assert.equal(round.bonus,40);assert.equal(bonus,40);
});
test('snack subtracts thirty and breaks combo',()=>{
 let round=newRound();for(let i=0;i<5;i++)round=collect(round,'water').round;round=collect(round,'cookie').round;
 assert.equal(round.urine,40);assert.equal(round.combo,0);
 round=collect(round,'cookie').round;assert.equal(round.urine,10);
});
test('wine and beer count toward alcohol threshold',()=>{
 let round=newRound(),hidden=false;
 for(let i=0;i<10;i++){let result=collect(round,i%2?'beer':'wine');round=result.round;hidden=result.hidden;}
 assert.equal(round.alcohol,10);assert.equal(hidden,true);
});
test('launch speed follows accumulated score',()=>{
 assert.ok(launchVelocity(10)>launchVelocity(2));assert.ok(distanceFor(10,45)>distanceFor(2,45));
});
test('angle range, trajectory and landing',()=>{
 for(let i=0;i<100;i++)assert.ok(angleValue(i/20)>=8&&angleValue(i/20)<=70);
 const v=launchVelocity(20),a=45,t=2*v*Math.sin(Math.PI/4)/9.8;
 assert.ok(Math.abs(flightPosition(t,v,a).y)<.00001);
});
test('hidden area mappings and parent lock',()=>{
 const rules=hiddenRules();assert.equal(Object.keys(rules).length,13);
 assert.equal(rules.HitArea7.requires,'lock2');assert.equal(rules.HitArea5.requires,'lock2');
 assert.equal(rules.HitArea10.keys[0],'power');
});
