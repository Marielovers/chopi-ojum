import {actualParameterIndex,parameterRange,applyDrivenParameters,bindParameterDriver} from './parameter-driver.mjs';
// Cubism 5.3 / .moc3 v6 integration; keep both uploaded character files unchanged.
// The game's supplied model1/model2 have the MOC3 header version 6. The old
// pixi-live2d-display (Cubism 3/4) was incompatible and has been replaced.
// The proprietary Cubism Core 6.0.1 must still be loaded from Live2D's SDK.
const CORE_LOCAL=import.meta.env.BASE_URL+'vendor/live2dcubismcore.min.js';
// The first official Core endpoint is versioned and less likely to change.
// Loading a remote Core is a convenience only; self-host it for reliable deployment.
const CORE_OFFICIAL_URLS=[
  'https://cubism.live2d.com/sdk-web/core/06/live2dcubismcore.min.js',
  'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js',
];
function loadScript(src,limit=9000){return new Promise((resolve,reject)=>{
  const script=document.createElement('script'),timer=setTimeout(()=>{script.remove();reject(new Error('Core 시간 초과'))},limit);
  script.src=src;script.async=true;
  script.onload=()=>{clearTimeout(timer);resolve();};
  script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('Core 로드 실패: '+src));};
  document.head.appendChild(script);
});}
function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
export class Live2DStage {
  constructor(scene,canvas,fallback,status){
    this.scene=scene;this.canvas=canvas;this.fallback=fallback;this.status=status;
    this.app=null;this.models={};this.active=null;this.ready=false;this.mode='title';
    this.values={model1:new Map(),model2:new Map()};
    this.baseScales={};this.feedPulse=0;this.ambientTime=0;this.paramBindings={};
    this.fallback.hidden=true;
    this.status.hidden=false;this.status.textContent='Live2D 모델 연결 중…';
  }
  async init(){
    const report=(message)=>{this.status.hidden=false;this.status.textContent=message;};
    try{
      report('Live2D Core 확인 중… (원본 모델 2개 · MOC3 v6)');
      if(!window.Live2DCubismCore){
        const sources=[CORE_LOCAL,...CORE_OFFICIAL_URLS];
        const errors=[];
        for(const [i,src] of sources.entries()){
          try{
            await loadScript(src,i===0?2500:7500);
            if(window.Live2DCubismCore)break;
            errors.push('Core 전역 변수가 등록되지 않음: '+src);
          }catch(err){errors.push(err.message);}
        }
        if(!window.Live2DCubismCore){
          console.error('[쵸피] Cubism Core 로드 결과:',errors);
          throw new Error('Cubism Core 6.0.1을 불러오지 못했습니다. npm run setup:core 실행 또는 공식 SDK의 Core/live2dcubismcore.min.js를 public/vendor/에 넣으세요.');
        }
      }
      // The underlying MOC3 files are v6, requiring the recent Cubism SDK R5.
      // Avoid the old Cubism4 wrapper from pixi-live2d-display 0.4.
      report('Live2D 5.3 호환 렌더러 준비 중…');
      const supportedMoc=window.Live2DCubismCore?.Moc?.getLatestMocVersion?.();
      if(Number.isFinite(supportedMoc)&&supportedMoc<6){
        throw new Error(`Cubism Core가 MOC3 v${supportedMoc}까지만 지원합니다. 원본 모델은 v6입니다. Core 6.0.1로 교체하세요.`);
      }
      const PIXI=await import('pixi.js');
      window.PIXI=PIXI;
      const runtime=await import('@laplace.live/pixijs-live2d');
      const {Live2DModel}=runtime;
      if(!Live2DModel)throw new Error('Live2DModel 내보내기를 찾지 못함');
      // The maintained engine registers its renderer; follow its documented API.
      if(runtime.configureCubismSDK)runtime.configureCubismSDK({memorySizeMB:32});
      if(typeof Live2DModel.registerTicker==='function')Live2DModel.registerTicker(PIXI.Ticker);
      const app=new PIXI.Application();
      await app.init({canvas:this.canvas,resizeTo:this.scene,backgroundAlpha:0,
        autoDensity:true,resolution:Math.min(2,window.devicePixelRatio||1),
        antialias:true,preference:'webgl',preferWebGLVersion:2});
      this.app=app;
      for(const id of ['model1','model2']){
        report(`실제 ${id} 불러오는 중…`);
        const url=import.meta.env.BASE_URL+`assets/models/${id}/model3.json`;
        let model;
        try{model=await Live2DModel.from(url,{autoInteract:false});}
        catch(e){throw new Error(`${id} 로드 실패: ${e?.message||e}. (파일과 Cubism Core 6.0.1 버전 확인)`);}
        app.stage.addChild(model);
        this.models[id]=model;
        // Bind once for this concrete model: values are written after physics/motions
        // and before the Cubism drawable update, rather than after Pixi has rendered.
        const binding=bindParameterDriver(model.internalModel,()=>this.applyParams(id));
        this.paramBindings[id]=binding;
        if(binding==='unavailable')console.warn(`[쵸피] ${id}: 파라미터 업데이트 이벤트를 지원하지 않습니다.`);
        console.info(`[쵸피] ${id} 파라미터 제어: ${binding}`);
      }
      this.ready=true;this.status.hidden=true;this.fallback.hidden=true;
      // Parameter hooks were attached per-model before Cubism model.update().
      window.addEventListener('resize',()=>this.layout());
      this.show(this.mode);
      console.info('[쵸피] model1/model2 로드 성공 · MOC3 v6 · PixiJS 8');
    }catch(error){
      console.error('[쵸피] 실제 Live2D 모델 표시 실패:',error);
      this.ready=false;
      report('⚠ 실제 Live2D 표시 실패: '+String(error?.message||error)+
        ' · F12 → Console에 자세한 오류가 표시됩니다.');
      this.fallback.hidden=true;
      this.show(this.mode);
    }
  }
  show(mode){
    this.mode=mode;
    const id=mode==='shoot'?'model2':(mode==='feed'||mode==='hidden')?'model1':null;
    this.active=id;
    if(this.ready){
      for(const [key,model] of Object.entries(this.models))model.visible=key===id;
      this.layout();
    }
    this.fallback.hidden=true; // never silently substitute a non-user character
    this.fallback.className='fallback-char '+mode;
  }
  clearParams(modelId){this.values[modelId]?.clear();}
  set(id,value,modelId=this.active){
    if(!modelId||!Number.isFinite(value))return;
    this.values[modelId].set(id,value);
  }
  get(id,modelId=this.active){return this.values[modelId]?.get(id)??0;}
  getCore(modelId=this.active){
    return this.models[modelId]?.internalModel?.coreModel;
  }
  parameterIndex(core,id){return actualParameterIndex(core,id);}
  getRange(id,modelId=this.active){return parameterRange(this.getCore(modelId),id);}
  limitedSet(id,value,modelId=this.active){
    const range=this.getRange(id,modelId);
    this.set(id,range?clamp(value,range.min,range.max):value,modelId);
  }
  applyParams(modelId=this.active){
    const core=this.getCore(modelId);
    if(!core||!this.ready) return 0;
    return applyDrivenParameters(core,this.values[modelId]);
  }
  // Ambient procedural animation supplies visible movement even without motion3 files.
  tickAmbient(time){
    this.ambientTime=time;
    if(this.mode==='feed'){
      this.set('ParamBreath',.5+.5*Math.sin(time*2.3),'model1');
      this.set('ParamBodyAngleX',1.5*Math.sin(time*.95),'model1');
      this.set('ParamAngleX',3*Math.sin(time*.73),'model1');
      this.set('ParamEyeLOpen',Math.sin(time*1.3)>0.985?0:1,'model1');
      this.set('ParamEyeROpen',Math.sin(time*1.3)>0.985?0:1,'model1');
    }else if(this.mode==='shoot'){
      this.set('ParamBreath',.5+.45*Math.sin(time*2.6),'model2');
    }else if(this.mode==='hidden'){
      this.set('ParamBreath',.5+.25*Math.sin(time*.95),'model1');
    }
  }
  setFeedPulse(amount){
    this.feedPulse=clamp(amount,0,1);
    if(this.ready&&this.mode==='feed'&&this.models.model1){
      const base=this.baseScales.model1;
      if(Number.isFinite(base))this.models.model1.scale.set(base*(1+.2*this.feedPulse));
    }
  }
  layout(){
    if(!this.ready)return;
    const w=this.app.screen.width,h=this.app.screen.height;
    for(const [id,model] of Object.entries(this.models)){
      model.rotation=0;model.scale.set(1);
      // In the hidden scene the upright art is viewed from above: head toward
      // the pillow, feet toward the footboard. Do not rotate sideways.
      model.anchor.set(.5,this.mode==='hidden'&&id==='model1'?.5:1);
      const naturalW=Math.max(model.width,1),naturalH=Math.max(model.height,1);
      let maxW,maxH;
      if(this.mode==='shoot'&&id==='model2'){
        maxW=Math.min(w*.39,390);maxH=h*.58;
        model.x=w*.80;model.y=h*.80;
      }else if(this.mode==='hidden'&&id==='model1'){
        maxW=Math.min(w*.30,310);maxH=h*.61;
        model.x=w*.5;model.y=h*.54;
      }else{
        maxW=Math.min(w*.40,460);maxH=h*.67;
        model.x=w*.45;model.y=h*.84;
      }
      const scale=Math.min(maxW/naturalW,maxH/naturalH);
      this.baseScales[id]=scale;
      model.scale.set(scale*(id==='model1'&&this.mode==='feed'?(1+.2*this.feedPulse):1));
    }
  }
  applyFall(amount){
    if(this.ready&&this.models.model1&&this.mode==='feed')this.models.model1.rotation=Math.PI*.5*amount;
    this.fallback.style.setProperty('--fall',`${amount*90}deg`);
  }
  moveForCamera(cameraPx){
    if(this.ready&&this.mode==='shoot')this.models.model2.x=this.app.screen.width*.80+cameraPx;
    this.fallback.style.setProperty('--camera',`${cameraPx}px`);
  }
  hitAt(clientX,clientY){
    if(!this.ready||this.mode!=='hidden')return [];
    const rect=this.canvas.getBoundingClientRect();
    const x=(clientX-rect.left)*this.app.screen.width/rect.width;
    const y=(clientY-rect.top)*this.app.screen.height/rect.height;
    try{return this.models.model1.hitTest(x,y)||[];}catch{return [];}
  }
}
