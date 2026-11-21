// All user-supplied WAV files are bundled by Vite via its asset pipeline.
// Add files named Voice_ChopI_Shout*.wav or Voice_ChopI_Pleasure*.wav
// to src/assets/audio/ and the corresponding cues will work automatically.
import bgmUrl from './assets/audio/BGM_Crayon.ogg?url';
import {isMuted} from './sfx.js';

const waveFiles=import.meta.glob('./assets/audio/Voice_ChopI_*.wav', { eager:true, query:'?url', import:'default' });
function getClips(){
 const groups={eat:[],hmm:[],result:[],shout:[]};
 for(const [name,url] of Object.entries(waveFiles)){
  const key=name.split('/').at(-1).toLowerCase();
  if(key.includes('_eat'))groups.eat.push(url);
  else if(key.includes('_hmm'))groups.hmm.push(url);
  else if(key.includes('_joy')||key.includes('_pleasure'))groups.result.push(url);
  else if(key.includes('_shout'))groups.shout.push(url);
 }
 return groups;
}
const clips=getClips();
export const BGM_VOLUME=0.5;
let bgm=null,voice=null,started=false,phase='title',queuedEats=0,activeKind=null;
function ensurePlayers(){
 if(bgm||typeof Audio==='undefined')return;
 bgm=new Audio(bgmUrl);bgm.loop=true;bgm.volume=BGM_VOLUME;bgm.preload='auto';
 voice=new Audio();voice.preload='auto';voice.volume=0.88;
 voice.addEventListener('ended',()=>{
  activeKind=null;
  if(queuedEats>0&&phase==='feed'&&!isMuted()){
   queuedEats--;startClip('eat');
  }else queuedEats=0;
 });
}
function syncMusic(){
 if(!bgm||!started)return;
 if(isMuted()||phase==='hidden'||document.hidden){bgm.pause();return;}
 bgm.volume=BGM_VOLUME;
 if(bgm.paused){const attempt=bgm.play();if(attempt&&typeof attempt.catch==='function')attempt.catch(()=>{/* autoplay restricted: retry on next gesture */});}
}
// Call from the first genuine user gesture to satisfy browser autoplay policies.
export function unlockGameAudio(){
 ensurePlayers();started=true;syncMusic();
}
export function setGameAudioPhase(next){
 const previous=phase;phase=next;
 if(next!==previous&&voice&&activeKind){voice.pause();voice.currentTime=0;activeKind=null;queuedEats=0;}
 syncMusic();
}
export function soundSettingChanged(){
 if(isMuted()&&voice){voice.pause();voice.currentTime=0;activeKind=null;queuedEats=0;}
 syncMusic();
}
function startClip(kind){
 if(isMuted()||!voice)return false;
 const urls=clips[kind]||[];
 if(!urls.length)return false;
 const chosen=urls[Math.floor(Math.random()*urls.length)];
 voice.pause();voice.currentTime=0;voice.src=chosen;voice.volume=0.88;
 activeKind=kind;
 const attempt=voice.play();
 if(attempt&&typeof attempt.catch==='function')attempt.catch(()=>{activeKind=null;});
 return true;
}
// One voice channel prevents overlapping speech. Multiple Eat events queue
// up to two additional calls so a batch of food still produces a response.
export function playGameVoice(kind){
 ensurePlayers();
 if(isMuted())return false;
 const key=(kind==='joy'||kind==='pleasure')?'result':kind;
 if(!(clips[key]||[]).length)return false;
 if(key==='eat'&&activeKind==='eat'&&voice&&!voice.paused){
  queuedEats=Math.min(2,queuedEats+1);return true;
 }
 queuedEats=0;
 return startClip(key);
}
export function pauseGameMusic(){if(bgm)bgm.pause();}
if(typeof document!=='undefined')document.addEventListener('visibilitychange',syncMusic);
