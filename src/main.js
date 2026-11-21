import './styles.css';
import {FEED_SECONDS,FOOD_SPAWN_INTERVAL,HAND_SWEEP_DURATION,SNACKS,FOOD_LABELS,clamp,advanceFoodX,foodCompletelyOffLeft,POWER_GAIN_PER_PIXEL,newRound,collect,selectFood,angleValue,launchVelocity,flightPosition,makeSprayParticles,sweepIntersects,sweepLocalX,handMirrorsAt,hiddenRules,AREA_LABELS} from './game-logic.mjs';
import {Live2DStage} from './live2d.js';
import {saveScore,fetchRanking} from './ranking.js';
import {sfx,toggleMute} from './sfx.js';
const $=id=>document.getElementById(id),scene=$('scene');
const live=new Live2DStage(scene,$('live2d-canvas'),$('fallback-char'),$('live2d-status'));
const screens={title:$('title-screen'),feed:$('feed-screen'),shoot:$('shoot-screen'),hidden:$('hidden-screen')};
const foodLayer=$('food-layer'),hand=$('hand-sprite');
const scenery=$('landscape-canvas'),stream=$('stream-canvas');
const cBg=scenery.getContext('2d'),cStream=stream.getContext('2d');
const ASSET_BASE=import.meta.env.BASE_URL+'assets/';
$('title-screen').style.backgroundImage=`url("${ASSET_BASE}tavern.webp")`;
$('hidden-screen').querySelector('.hidden-bg').style.backgroundImage=
 `linear-gradient(180deg,rgba(29,14,61,.86),rgba(54,31,83,.72)),url("${ASSET_BASE}forest.webp")`;
$('hidden-screen').querySelector('.hidden-bg').style.backgroundPosition='center';
$('hidden-screen').querySelector('.hidden-bg').style.backgroundSize='cover';
const forest=new Image();forest.src=ASSET_BASE+'forest.webp';
const rules=hiddenRules();
let phase='title',lastFrame=0,round=newRound(),foodItems=[],feedRemain=FEED_SECONDS,spawnElapsed=0;
let serial=0,fallTime=0,noticeTimeout=0,toastTimeout=0,mouthTime=0;
let sweep=null;
let shoot={phase:'prepare',clock:0,angle:45,windup:0,elapsed:0,velocity:0,points:[],cameraPx:0,meters:0,particles:[]};
let hiddenPointer=null,settles=new Map();
let cachedWidth=0,cachedHeight=0,dpr=1;
function viewport(){return {w:scene.clientWidth,h:scene.clientHeight};}
function laneYs(){const {h}=viewport();return [h*.57,h*.64,h*.71,h*.78];}
function mode(next){phase=next;scene.className='scene is-'+next;Object.entries(screens).forEach(([key,el])=>el.hidden=key!==next);live.show(next);$('sound-btn').hidden=next==='hidden';}
function toast(message){const node=$('toast');node.textContent=message;node.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>node.classList.remove('show'),2300);}
function notice(message){const node=$('feed-notice');node.textContent=message;clearTimeout(noticeTimeout);noticeTimeout=setTimeout(()=>node.textContent='',1100);}
function updateFeedHUD(){ $('urine-count').textContent=round.urine; $('alcohol-count').textContent=`${round.alcohol}/10`; $('combo-count').textContent=round.combo; $('feed-timer').textContent=Math.max(0,Math.ceil(feedRemain)); }
function resetFood(){ foodItems.forEach(item=>item.el.remove());foodItems=[]; round=newRound();feedRemain=FEED_SECONDS;spawnElapsed=0;serial=0;fallTime=0;sweep=null; live.clearParams('model1');live.applyFall(0);$('fall-caption').hidden=true; hand.style.opacity='0';live.setFeedPulse(0);$('feed-next').disabled=false; updateFeedHUD(); }
function beginFeed(){resetFood();mode('feed');}
function spawnFood(){ const {w}=viewport(); const lanes=laneYs(); const lane=Math.floor(Math.random()*lanes.length); const type=selectFood(),el=document.createElement('img'); el.src=`${ASSET_BASE}food/${type}.png`;el.alt=FOOD_LABELS[type];el.draggable=false; el.className='food-item'; const item={id:serial++,lane,type,el,x:w+80+Math.random()*130,y:lanes[lane]+(Math.random()-.5)*14,vx:80+Math.random()*37,pushing:false,pushAge:0,fromX:0,fromY:0}; foodLayer.appendChild(el);foodItems.push(item); }
function startSweep(clientX){
 if(phase!=='feed'||fallTime>0||sweep)return;
 const {w,h}=viewport();
 const x=sweepLocalX(clientX,scene.getBoundingClientRect().left,w);
 // Flip the arm at the left side, keeping the palm aligned to the tap point
 // while the rest of the arm extends INTO the screen instead of off-screen.
 hand.classList.toggle('from-left',handMirrorsAt(x,w));
 sweep={x,progress:0,duration:HAND_SWEEP_DURATION,bottomY:h+95,topY:h*.50,caught:new Set()};
 hand.style.opacity='1';hand.style.left=x+'px';hand.style.top=sweep.bottomY+'px';
 sfx('eat');
}
function pushFood(item){ if(item.pushing||fallTime>0)return; item.pushing=true;item.pushAge=0;item.fromX=item.x;item.fromY=item.y; item.el.classList.add('is-pushed'); }
function eat(item){ const outcome=collect(round,item.type);round=outcome.round; updateFeedHUD(); live.set('ParamMouthOpenY',1,'model1');mouthTime=.52; if(outcome.alcohol){ live.set('ParamCheek',Math.min(1,round.alcohol*.1),'model1'); if(round.alcohol>=3)live.set('rmhighlight',1,'model1'); if(round.alcohol>=6)live.set('eyewhite',1,'model1'); notice(`🍷 술 ${round.alcohol}/10!`); }else if(outcome.bonus){sfx('bonus');notice(`🔥 연속 보너스 +${outcome.bonus}!`);} else if(SNACKS.includes(item.type)){sfx('snack');notice('🍪 간식 -30');} if(outcome.hidden){ fallTime=.001;$('feed-next').disabled=true; $('fall-caption').hidden=false;sfx('crash'); } }
function tickFeed(dt){
 if(fallTime>0){ fallTime+=dt; live.applyFall(clamp(fallTime/1.25,0,1)); if(fallTime>2.1)beginHidden(); return; }
 feedRemain=Math.max(0,feedRemain-dt); spawnElapsed+=dt; if(spawnElapsed>FOOD_SPAWN_INTERVAL&&foodItems.length<12){spawnElapsed=0;spawnFood();}
 const {w,h}=viewport(); const targetX=w*.46,targetY=h*.45;
 if(sweep){
  const before=clamp(sweep.progress,0,1);
  sweep.progress+=dt/sweep.duration;
  const after=clamp(sweep.progress,0,1);
  const oldY=sweep.bottomY+(sweep.topY-sweep.bottomY)*before;
  const currentY=sweep.bottomY+(sweep.topY-sweep.bottomY)*after;
  hand.style.left=sweep.x+'px';hand.style.top=currentY+'px';
  // One upwards sweep can catch MULTIPLE items on any crossed row.
  const reachX=clamp(w*.11,65,145);
  for(const item of foodItems){
   if(item.pushing||sweep.caught.has(item.id))continue;
   // The same hit test is used on either side of the model; foods at
   // negative x remain catchable while any part of the sprite is visible.
   if(sweepIntersects(item,sweep.x,oldY,currentY,reachX,42)){
    sweep.caught.add(item.id);
    pushFood(item);
   }
  }
  if(after>=1){sweep=null;hand.style.opacity='0';}
 }
 // Uncollected food keeps travelling across the ENTIRE screen, including past
 // the character. Only food caught by the hand is removed at the eating point.
 for(const item of [...foodItems]){
   if(item.pushing){ item.pushAge+=dt; const p=clamp(item.pushAge/.46,0,1),ease=1-(1-p)**3; item.x=item.fromX+(targetX-item.fromX)*ease; item.y=item.fromY+(targetY-item.fromY)*ease; item.el.style.transform=`translate(-50%,-50%) scale(${1-.35*ease}) rotate(${-15*ease}deg)`; if(p===1){item.el.remove();foodItems.splice(foodItems.indexOf(item),1);eat(item);} }
   else{
    item.x=advanceFoodX(item.x,item.vx,dt);
    // Remove only after the ENTIRE icon passes beyond the left edge (x < 0).
    // No clamping or queueing at the character or at the screen boundary.
    const spriteSize=item.el.getBoundingClientRect().width || (w<=620?72:clamp(w*.08,61,112));
    if(foodCompletelyOffLeft(item.x,spriteSize)){
     item.el.remove();foodItems.splice(foodItems.indexOf(item),1);continue;
    }
   }
   item.el.style.left=item.x+'px';item.el.style.top=item.y+'px';
 }
 mouthTime=Math.max(0,mouthTime-dt);live.setFeedPulse(mouthTime>0?Math.sin(Math.PI*(1-mouthTime/.52)):0); if(mouthTime>0)live.set('ParamMouthOpenY',clamp(mouthTime/.52,0,1),'model1'); else live.set('ParamMouthOpenY',0,'model1');
 updateFeedHUD(); if(feedRemain<=0)beginShoot();
}

function beginShoot(){ if(phase!=='feed')return; foodItems.forEach(item=>item.el.remove());foodItems=[]; shoot={phase:'prepare',clock:0,angle:45,windup:0,elapsed:0,velocity:launchVelocity(round.urine),points:[],cameraPx:0,meters:0,particles:[]}; mode('shoot'); live.clearParams('model2');live.set('cloth',0,'model2');live.set('angle',0,'model2'); $('launch-power').textContent=round.urine; $('flight-distance').textContent='0.0';$('aim-button').disabled=true; $('aim-ui').hidden=false;$('shoot-result').hidden=true;$('flight-stamp').hidden=true; $('aim-title').textContent='발사 준비 중…';$('aim-instruction').textContent='바늘이 위아래로 움직일 때 정지시키세요.'; live.moveForCamera(0); }
function lockAngle(){ if(phase!=='shoot'||shoot.phase!=='aim')return; shoot.phase='windup';shoot.windup=0;sfx('aim'); $('aim-button').disabled=true; $('aim-title').textContent=`${shoot.angle.toFixed(0)}° 고정!`; $('aim-instruction').textContent='쵸피가 자세를 잡는 중…'; }
function launch(){ shoot.phase='flying';shoot.elapsed=0;shoot.points=[];shoot.cameraPx=0;shoot.particles=makeSprayParticles(shoot.angle,shoot.velocity,round.urine); $('aim-ui').hidden=true;$('flight-stamp').hidden=false; setTimeout(()=>$('flight-stamp').hidden=true,700); sfx('launch'); }
function land(){ if(shoot.phase!=='settling')return; shoot.phase='done';sfx('land');shoot.meters=Math.round(shoot.meters*10)/10; $('result-meters').textContent=shoot.meters.toFixed(1)+'m'; $('result-comment').textContent=shoot.meters>110?'분수처럼 쏟아진 전설적인 발사!':shoot.meters>55?'시원하게 멀리 퍼져 나갔어요!':'다음엔 음료를 더 모아보세요!'; $('record-feedback').textContent='';$('record-btn').disabled=false;$('shoot-result').hidden=false; }
function tickShoot(dt){ shoot.clock+=dt; if(shoot.phase==='prepare'){ const t=clamp(shoot.clock/1.4,0,1);live.set('cloth',t,'model2'); if(t>=1){shoot.phase='aim';$('aim-title').textContent='각도를 맞춰보세요!';$('aim-button').disabled=false;} } if(shoot.phase==='aim')shoot.angle=angleValue(shoot.clock); if(shoot.phase==='windup'){ shoot.windup+=dt;live.set('angle',clamp(shoot.windup/1.25,0,1),'model2'); if(shoot.windup>=1.4)launch(); } $('angle-arm').style.transform=`translateX(-50%) rotate(${-shoot.angle}deg)`; $('angle-number').textContent=shoot.angle.toFixed(1)+'°'; if(shoot.phase==='flying'){
  shoot.elapsed+=dt;
  const pos=flightPosition(shoot.elapsed,shoot.velocity,shoot.angle);
  shoot.meters=pos.x;
  const {w}=viewport(),ppm=Math.max(11,w/55);
  shoot.cameraPx=Math.max(0,pos.x*ppm-w*.57);
  $('flight-distance').textContent=shoot.meters.toFixed(1);
  live.moveForCamera(shoot.cameraPx);
  if(pos.y<=0&&shoot.elapsed>.18){shoot.phase='settling';shoot.settleTime=0;}
 }
 if(shoot.phase==='settling'){
  shoot.elapsed+=dt;
  shoot.settleTime+=dt;
  if(shoot.settleTime>=1.05)land();
 }
 drawForest();drawStream(); }
function resizeCanvases(){ const {w,h}=viewport(),pixelRatio=Math.min(2,devicePixelRatio||1); if(w===cachedWidth&&h===cachedHeight&&pixelRatio===dpr)return; cachedWidth=w;cachedHeight=h;dpr=pixelRatio; for(const canvas of [scenery,stream]){canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));} }
function drawForest(){ resizeCanvases();const {w,h}=viewport();cBg.setTransform(dpr,0,0,dpr,0,0);cBg.clearRect(0,0,w,h); cBg.fillStyle='#496237';cBg.fillRect(0,0,w,h); if(!forest.complete||!forest.naturalWidth)return; const tileW=h*forest.naturalWidth/forest.naturalHeight; const shift=shoot.cameraPx%tileW,idx=Math.floor(shoot.cameraPx/tileW); for(let k=-2;k<4;k++){ const x=(k-1)*tileW+shift; cBg.save(); if(Math.abs(k-idx)%2===1){cBg.translate(x+tileW,0);cBg.scale(-1,1);cBg.drawImage(forest,0,0,tileW,h);} else cBg.drawImage(forest,x,0,tileW,h); cBg.restore(); } cBg.fillStyle='rgba(15,30,14,.06)';cBg.fillRect(0,0,w,h); }
function drawStream(){
 const {w,h}=viewport(),ctx=cStream;
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.clearRect(0,0,w,h);
 if(!['flying','settling','done'].includes(shoot.phase))return;
 const ppm=Math.max(11,w/55),startX=w*.78,baseY=h*.58,camera=shoot.cameraPx;
 // Separate droplets, emitted in a burst over time. No continuous laser path.
 for(const [index,drop] of shoot.particles.entries()){
  const t=shoot.elapsed-drop.delay;
  if(t<0)continue;
  const angleRad=drop.angle*Math.PI/180;
  const landingTime=2*drop.speed*Math.sin(angleRad)/9.8;
  if(t<=landingTime){
   const pos=flightPosition(t,drop.speed,drop.angle);
   const x=startX-pos.x*ppm+camera;
   const y=baseY-pos.y*ppm;
   if(x< -45||x>w+45||y>h+40||y< -40)continue;
   ctx.save();
   ctx.fillStyle=`rgba(255,213,76,${drop.alpha})`;
   ctx.shadowColor='rgba(255,246,158,.80)';ctx.shadowBlur=drop.size*1.15;
   ctx.beginPath();ctx.ellipse(x,y,drop.size*1.32,drop.size*.86,-.5,0,Math.PI*2);ctx.fill();
   ctx.shadowBlur=0;ctx.fillStyle='rgba(255,251,205,.68)';
   ctx.beginPath();ctx.arc(x-drop.size*.25,y-drop.size*.35,drop.size*.35,0,Math.PI*2);ctx.fill();
   ctx.restore();
  }else{
   // Short splashes when droplets strike the ground.
   const impactAge=t-landingTime;
   if(impactAge>.35)continue;
   const impactX=startX-(drop.speed*Math.cos(angleRad)*landingTime)*ppm+camera;
   const base=impactAge*ppm*2.5;
   const fade=1-impactAge/.35;
   for(let j=0;j<3;j++){
    const a=(-Math.PI*.88)+(j/2)*Math.PI*.78+(index%5)*.12;
    const x=impactX+Math.cos(a)*base*(.6+j*.24);
    const y=baseY-Math.abs(Math.sin(a))*base*.42;
    ctx.fillStyle=`rgba(255,222,112,${(drop.alpha*fade*.75).toFixed(3)})`;
    ctx.beginPath();ctx.arc(x,y,Math.max(1,drop.size*.52*fade),0,Math.PI*2);ctx.fill();
   }
  }
 }
}
function beginHidden(){
 if(phase!=='feed')return;
 foodItems.forEach(item=>item.el.remove());foodItems=[];
 mode('hidden');settles.clear();hiddenPointer=null;
 live.clearParams('model1');
 for(let i=1;i<=8;i++)live.set('lock'+i,0,'model1');
 for(const k of ['power','BX','BY','BXL','BYL','BXR','BYR','ParamAngleX','ParamAngleY'])live.set(k,0,'model1');
 live.set('ParamEyeLOpen',0,'model1');live.set('ParamEyeROpen',0,'model1');
 live.set('ParamMouthOpenY',0,'model1');
}
function getAreaFromPoint(e){
 const hits=live.hitAt(e.clientX,e.clientY);
 const priority=Object.keys(rules).filter(k=>k!=='HitArea');
 for(const id of priority)if(hits.includes(id))return id;
 return hits.includes('HitArea')?'HitArea':null;
}
function startDrag(e,name){
 const rule=rules[name];if(!rule||phase!=='hidden')return;
 if(rule.requires&&live.get(rule.requires,'model1')<1.98)return;
 e.preventDefault();settles.delete(rule.keys[0]);
 hiddenPointer={id:e.pointerId,name,startX:e.clientX,startY:e.clientY,lastX:e.clientX,lastY:e.clientY,
   initial:Object.fromEntries(rule.keys.map(k=>[k,live.get(k,'model1')]))};
}
function progressDrag(e){
 const d=hiddenPointer;if(!d||phase!=='hidden'||e.pointerId!==d.id)return;
 e.preventDefault();const rule=rules[d.name],dx=e.clientX-d.startX,dy=e.clientY-d.startY;
 if(rule.type==='power'){
   const amount=Math.hypot(e.clientX-d.lastX,e.clientY-d.lastY)*POWER_GAIN_PER_PIXEL;
   live.limitedSet('power',clamp(live.get('power','model1')+amount,0,1),'model1');
 }else if(rule.type==='spring'){
   for(const [key,motion] of [[rule.keys[0],dx],[rule.keys[1],-dy]]){
     const range=live.getRange(key,'model1');
     const sensitivity=range?(range.max-range.min)/230:key.startsWith('ParamAngle')?.19:.009;
     live.limitedSet(key,d.initial[key]+motion*sensitivity,'model1');
   }
 }else if(rule.type==='unlock'){
   const dir=rule.axis==='up'?-1:1;
   live.set(rule.keys[0],clamp(d.initial[rule.keys[0]]+dir*dy/115,0,1),'model1');
 }else if(rule.type==='hold'){
   const key=rule.keys[0],range=live.getRange(key,'model1');
   live.limitedSet(key,d.initial[key]-dy*(range?(range.max-range.min)/210:.009),'model1');
 }
 d.lastX=e.clientX;d.lastY=e.clientY;
}
function endDrag(e){
 const d=hiddenPointer;if(!d||e.pointerId!==d.id)return;
 const rule=rules[d.name],key=rule.keys[0];
 if(rule.type==='spring')for(const k of rule.keys)settles.set(k,{goal:0,rate:rule.stiffness});
 if(rule.type==='unlock'){
   const achieved=live.get(key,'model1')>0.16;
   settles.set(key,{goal:achieved?2:0,rate:7});
 }
 hiddenPointer=null;
}
function tickHidden(dt){
 for(const [key,v] of settles){
   let next=live.get(key,'model1')+(v.goal-live.get(key,'model1'))*(1-Math.exp(-dt*v.rate));
   if(Math.abs(next-v.goal)<.015){next=v.goal;settles.delete(key);}
   live.limitedSet(key,next,'model1');
 }
}
async function showRank(){ $('ranking-overlay').hidden=false;$('ranking-list').replaceChildren(); $('ranking-mode').textContent='랭킹 불러오는 중…'; try{ const result=await fetchRanking(); $('ranking-mode').textContent=result.mode==='online'?'🌐 Firebase 온라인 랭킹':'💻 현재 브라우저에 저장된 로컬 랭킹 (Firebase 미연결)'; if(!result.scores.length){const li=document.createElement('li');li.textContent='아직 기록이 없어요. 첫 기록을 남겨주세요!';$('ranking-list').appendChild(li);} for(const [i,row] of result.scores.entries()){ const li=document.createElement('li'); const name=document.createElement('span'),val=document.createElement('strong'); name.textContent=`${i+1}위 · ${String(row.name).slice(0,12)}`;val.textContent=Number(row.meters).toFixed(1)+'m'; li.append(name,val);$('ranking-list').appendChild(li); } }catch(err){console.error('Ranking load error',err);$('ranking-mode').textContent='서버 연결 실패: Firestore 설정과 보안 규칙을 확인해 주세요.';} }
async function record(){ if(phase!=='shoot'||shoot.phase!=='done')return; const btn=$('record-btn');btn.disabled=true;$('record-feedback').textContent='기록을 저장 중…'; try{ const kind=await saveScore($('player-name').value,shoot.meters); $('record-feedback').textContent=kind==='online'?'✅ 온라인 랭킹에 등록됐어요!':'✅ 로컬 랭킹에 저장됐어요. 온라인 연동은 .env 설정이 필요해요.'; }catch(err){console.error(err);$('record-feedback').textContent='❌ 저장 실패. Firebase 프로젝트와 Firestore 권한을 확인해 주세요.';btn.disabled=false;} }
function initButtons(){
 $('start-btn').addEventListener('click',beginFeed);
 $('feed-next').addEventListener('click',beginShoot);
 $('feed-screen').addEventListener('pointerdown',e=>{
   if(phase!=='feed'||portraitBlocked()||e.target.closest('button,.hud'))return;
   startSweep(e.clientX);
 });
 $('aim-button').addEventListener('click',lockAngle);
 $('shoot-screen').addEventListener('pointerdown',e=>{
   if(!portraitBlocked()&&shoot.phase==='aim'&&!e.target.closest('button')&&!e.target.closest('input')&&!$('shoot-result').contains(e.target))lockAngle();
 });
 $('record-btn').addEventListener('click',record);
 $('result-restart-btn').addEventListener('click',beginFeed);
 $('hidden-back').addEventListener('click',()=>mode('title'));
 for(const id of ['title-rank-btn','result-rank-btn'])$(id).addEventListener('click',showRank);
 $('rank-close').addEventListener('click',()=>$('ranking-overlay').hidden=true);
 $('rank-retry').addEventListener('click',showRank);
 $('ranking-overlay').addEventListener('click',e=>{if(e.target===$('ranking-overlay'))$('ranking-overlay').hidden=true;});
 $('sound-btn').addEventListener('click',()=>{$('sound-btn').textContent=toggleMute()?'♪̸':'♪';});
 $('hidden-screen').addEventListener('pointerdown',e=>{
   if(phase!=='hidden'||portraitBlocked()||e.target.closest('button'))return;
   const area=getAreaFromPoint(e);
   if(area)startDrag(e,area);
 });
 window.addEventListener('pointermove',e=>{if(!portraitBlocked())progressDrag(e);},{passive:false});
 window.addEventListener('pointerup',endDrag);
 window.addEventListener('pointercancel',endDrag);
 window.addEventListener('blur',()=>{if(hiddenPointer)endDrag({pointerId:hiddenPointer.id});});
 document.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&!$('ranking-overlay').hidden)$('ranking-overlay').hidden=true;
   else if(e.code==='Space'&&!portraitBlocked()&&phase==='shoot'&&shoot.phase==='aim'){e.preventDefault();lockAngle();}
 });
}
// Portrait mobile screens show a rotation message and freeze the game clock.
const portraitMedia=window.matchMedia('(orientation: portrait) and (pointer: coarse)');
function portraitBlocked(){return portraitMedia.matches;}
function frame(now){
 const dt=Math.min(.06,(now-lastFrame)/1000||0);lastFrame=now;
 if(!portraitBlocked()&&!document.hidden){
   if(phase==='feed')tickFeed(dt);
   if(phase==='shoot')tickShoot(dt);
   if(phase==='hidden')tickHidden(dt);
   live.tickAmbient(now/1000);
 }
 requestAnimationFrame(frame);
}
portraitMedia.addEventListener('change',()=>{
 if(portraitBlocked()){
   if(hiddenPointer)endDrag({pointerId:hiddenPointer.id});
   // Stop an unfinished hand swipe while the game is paused for rotation.
 }
});
initButtons();mode('title');requestAnimationFrame(frame);live.init();
