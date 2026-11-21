export const FEED_SECONDS = 40;
export const FOOD_SPAWN_INTERVAL = 1.10;
export const HAND_SWEEP_DURATION = 1.86;
export const SNACK_SPAWN_CHANCE = 1 / 12; // one-third of the original 25%
export const POWER_GAIN_PER_PIXEL = 0.0017 / 20; // 20x slower in the hidden stage
// Food moves all the way across the model and the screen. No left-side clamp.
export function advanceFoodX(x, speed, elapsedSeconds){
  return x - Math.max(0,speed) * Math.max(0,elapsedSeconds);
}
// A food image is only out of view after its rightmost pixel crossed x = 0.
export function foodCompletelyOffLeft(x, spriteWidth){
  return x + Math.max(0,spriteWidth)/2 < 0;
}
export const DRINKS = ['water','orange','strawberry','lemon','blueberry','cola','tea','cocoa','wine','beer'];
export const SNACKS = ['donut','cookie','chocolate','pretzel','macaron','croissant','cupcake','popcorn','candy','chips'];
export const FOOD_LABELS = {
  water:'생수',orange:'오렌지 주스',strawberry:'딸기 셰이크',lemon:'레모네이드',blueberry:'블루베리 스무디',
  cola:'콜라',tea:'녹차',cocoa:'코코아',wine:'포도주',beer:'맥주',
  donut:'도넛',cookie:'쿠키',chocolate:'초콜릿',pretzel:'프레첼',macaron:'마카롱',
  croissant:'크루아상',cupcake:'컵케이크',popcorn:'팝콘',candy:'사탕',chips:'감자칩'
};
export const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
export function newRound(){return {urine:0,combo:0,alcohol:0,drinks:0,snacks:0,bonus:0};}
export function collect(round, type){
  const s={...round};
  const drink=DRINKS.includes(type), snack=SNACKS.includes(type);
  if(!drink&&!snack) throw new Error('Unknown food: '+type);
  if (drink) {
    s.urine += 10;s.combo++;s.drinks++;
    if(s.combo%3===0){s.urine+=20;s.bonus+=20;}
    if(type==='wine'||type==='beer')s.alcohol++;
  } else {
    s.urine=Math.max(0,s.urine-30);s.snacks++;s.combo=0;
  }
  return {round:s,bonus:drink&&s.combo%3===0?20:0,hidden:s.alcohol>=10,alcohol:drink&&(type==='beer'||type==='wine')};
}
export function selectFood(random=Math.random){
  const r=random();
  if(r < .2) return r < .1 ? 'wine':'beer';
  if(r < 1-SNACK_SPAWN_CHANCE) return DRINKS[Math.floor(random()*8)];
  return SNACKS[Math.floor(random()*SNACKS.length)];
}

// Clicks are viewport coordinates; convert to scene-local pixels so both
// the desktop and mobile left edge are tappable without a 5%-width dead zone.
export function sweepLocalX(clientX, sceneLeft, sceneWidth){
  return clamp(clientX-sceneLeft, 0, Math.max(0,sceneWidth));
}
// A mirrored hand has its palm on the left and its arm extending rightwards;
// otherwise its arm would be clipped entirely by the left screen edge.
export function handMirrorsAt(x, sceneWidth){
  return x < sceneWidth * .34;
}

// Hit test against the entire vertical path travelled by one sweep, not a single lane.
export function sweepIntersects(item, x, oldY, newY, reachX=110, padding=42){
 return Math.abs(item.x-x)<=reachX &&
   item.y>=Math.min(oldY,newY)-padding &&
   item.y<=Math.max(oldY,newY)+padding;
}

// A dense, multi-angle fountain emitted over ~1.1 seconds, rather than a beam.
// This is deterministic if callers pass a seeded random function.
export function makeSprayParticles(angle,velocity,power,random=Math.random){
 const count=Math.round(clamp(105+Math.max(0,power)*3,105,260));
 const particles=[];
 for(let i=0;i<count;i++){
  const r=()=>random();
  const delay=clamp((i/(count-1))*1.1+(r()-.5)*.045,0,1.15);
  const spread=(r()-.5)*24;
  const speed=velocity*(.74+r()*.50);
  const size=2.5+r()*5.0;
  const alpha=.58+r()*.37;
  particles.push({delay,angle:clamp(angle+spread,4,82),speed,size,alpha});
 }
 return particles;
}

export function angleValue(seconds){return 8+62*(Math.sin(seconds*2.9)+1)/2;}
export function launchVelocity(urine){return 9+Math.sqrt(Math.max(0,urine))*5.6;}
export function flightPosition(t,v,angleDeg,gravity=9.8){
  const a=angleDeg*Math.PI/180;
  return {x:v*Math.cos(a)*t,y:v*Math.sin(a)*t-gravity*t*t*.5};
}
export function distanceFor(urine,angleDeg){
  const v=launchVelocity(urine), a=angleDeg*Math.PI/180;
  return Math.max(0,v*v*Math.sin(2*a)/9.8);
}
export function hiddenRules(){return {
  HitArea10:{type:'power',keys:['power']},
  HitArea11:{type:'spring',keys:['ParamAngleX','ParamAngleY'],stiffness:9},
  HitArea12:{type:'spring',keys:['BX','BY'],stiffness:11},
  HitArea2:{type:'unlock',keys:['lock2'],axis:'up'},
  HitArea7:{type:'hold',keys:['lock8'],requires:'lock2'},
  HitArea6:{type:'unlock',keys:['lock7'],axis:'down'},
  HitArea5:{type:'hold',keys:['lock6'],requires:'lock2'},
  HitArea4:{type:'unlock',keys:['lock5'],axis:'down'},
  HitArea9:{type:'spring',keys:['BXR','BYR'],stiffness:19},
  HitArea8:{type:'spring',keys:['BXL','BYL'],stiffness:19},
  HitArea1:{type:'unlock',keys:['lock1'],axis:'up'},
  HitArea3:{type:'hold',keys:['lock4']},
  HitArea:{type:'hold',keys:['lock3']}
};}
export const AREA_LABELS={HitArea10:'power',HitArea11:'머리',HitArea12:'상체',HitArea2:'고정 2',HitArea7:'슬라이더 8',HitArea6:'고정 7',HitArea5:'슬라이더 6',HitArea4:'고정 5',HitArea9:'오른쪽',HitArea8:'왼쪽',HitArea1:'고정 1',HitArea3:'슬라이더 4',HitArea:'슬라이더 3'};
