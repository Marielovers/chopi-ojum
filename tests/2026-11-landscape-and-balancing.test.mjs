import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {collect,newRound,selectFood,SNACK_SPAWN_CHANCE,POWER_GAIN_PER_PIXEL,advanceFoodX,foodCompletelyOffLeft,FEED_SECONDS} from '../src/game-logic.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test("preserves the user's 60-second customization",()=>assert.equal(FEED_SECONDS,60));
test('snack penalizes 3x: -30, not -10',()=>{
 let round=newRound();
 for(let i=0;i<5;i++)round=collect(round,'water').round;
 assert.equal(round.urine,70); // 5 drinks +10 each, one +20 combo
 round=collect(round,'cookie').round;
 assert.equal(round.urine,40);
 assert.equal(round.combo,0);
});
test('snack spawn probability is exactly one third of former 25%',()=>{
 assert.equal(SNACK_SPAWN_CHANCE,1/12);
 const random=(first)=>{let calls=0;return ()=>calls++===0?first:.1;};
 assert.equal(selectFood(random(.80)),'water');
 assert.equal(selectFood(random(.94)),'cookie');
 let count=0;
 for(let i=0;i<1200;i++)if(selectFood(random((i+.5)/1200))==='cookie')count++;
 assert.ok(count>=99&&count<=101,`snack count ${count}`);
});
test('hidden power is twenty times slower',()=>assert.equal(POWER_GAIN_PER_PIXEL,.0017/20));
test('uneaten food moves across the model to the actual left screen edge',()=>{
 // Even after passing character x=0.46*w, food must continue moving.
 assert.equal(advanceFoodX(420,100,.5),370);
 assert.equal(advanceFoodX(50,100,.8),-30);
 assert.equal(foodCompletelyOffLeft(370,72),false); // past model, still on screen
 assert.equal(foodCompletelyOffLeft(0,72),false);   // its center reached left edge
 assert.equal(foodCompletelyOffLeft(-35,72),false); // a sliver still visible
 assert.equal(foodCompletelyOffLeft(-37,72),true);  // now fully out of frame
 const js=read('src/main.js');
 assert.match(js,/item\.x=advanceFoodX\(item\.x,item\.vx,dt\)/);
 assert.match(js,/foodCompletelyOffLeft\(item\.x,spriteSize\)/);
 assert.doesNotMatch(js,/lastStationaryX|clampFoodX|item\.x<w\*\.41-80/);
});
test('hidden scene only has one return button; touch hit areas still handled',()=>{
 const html=read('index.html');
 const hidden=html.split('<section id="hidden-screen"')[1].split('</section>')[0];
 assert.match(hidden,/id="hidden-back"/);
 assert.doesNotMatch(hidden,/(hidden-power|area-menu|area-menu-btn|hidden-restart|hidden-leave|hidden-hint|class="hud)/);
 const js=read('src/main.js');
 assert.match(js,/getAreaFromPoint\(e\)/);
 assert.doesNotMatch(js, /\$\('hidden-power'\)/);
});
test('mobile portrait overlay and pause, landscape UI CSS',()=>{
 const html=read('index.html'),js=read('src/main.js'),css=read('src/styles.css');
 assert.match(html,/id="rotate-overlay"/);
 assert.match(js,/portraitBlocked\(\)/);
 assert.match(js,/if\(!portraitBlocked\(\)\&\&!document\.hidden\)/);
 assert.match(css,/@media \(orientation:portrait\) and \(pointer:coarse\)/);
 assert.match(css, /max-height:540px/);
});
