let ctx=null,muted=false;
export function toggleMute(){muted=!muted;return muted;}
function audio(){if(muted)return null;try{ctx ||= new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();return ctx;}catch{return null;}}
function tone(frequency=440,duration=.12,type='sine',volume=.065,delay=0){
  const c=audio();if(!c)return;let t=c.currentTime+delay;
  const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(frequency,t);
  g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(volume,t+.015);
  g.gain.exponentialRampToValueAtTime(.001,t+duration);
  o.connect(g).connect(c.destination);o.start(t);o.stop(t+duration+.015);
}
export function sfx(name){
  if(name==='eat'){tone(520,.09,'sine');tone(785,.12,'sine',.052,.075);}
  if(name==='snack')tone(175,.22,'triangle');
  if(name==='bonus'){tone(620,.14,'sine');tone(850,.19,'sine',.06,.11);}
  if(name==='aim')tone(720,.15,'triangle');
  if(name==='launch'){tone(190,.34,'sawtooth',.045);tone(340,.24,'sine',.05,.1);}
  if(name==='land'){tone(130,.35,'triangle',.085);}
  if(name==='crash'){
    const c=audio();if(!c)return;const length=Math.floor(c.sampleRate*.83);
    const buffer=c.createBuffer(1,length,c.sampleRate);const data=buffer.getChannelData(0);
    for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/length*6);
    const src=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
    src.buffer=buffer;filter.type='lowpass';filter.frequency.value=650;
    gain.gain.value=.24;src.connect(filter).connect(gain).connect(c.destination);src.start();
    tone(85,.48,'sawtooth',.14,.08);tone(65,.48,'triangle',.15,.28);
  }
}
