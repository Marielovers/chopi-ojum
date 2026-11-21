// Apply user values at the Live2D internal-model update boundary, after
// motion/physics and before coreModel.update() snapshots drawable vertices.
export function getRawParameters(core) {
  return core?._model?.parameters ?? core?.parameters ?? null;
}
export function actualParameterIndex(core, id) {
  const raw = getRawParameters(core);
  if (!raw?.ids) return -1;
  const count = Number.isFinite(raw.count) ? raw.count : raw.ids.length;
  for (let i = 0; i < count; i++) {
    if (raw.ids[i] === id) return i;
  }
  return -1;
}
export function parameterRange(core, id) {
  const raw=getRawParameters(core), index=actualParameterIndex(core,id);
  if(index<0)return null;
  const min=raw.minimumValues?.[index],max=raw.maximumValues?.[index];
  return Number.isFinite(min)&&Number.isFinite(max)?{min,max}:null;
}
export function applyDrivenParameters(core, values) {
  const raw=getRawParameters(core);
  if(!raw)return 0;
  let applied=0;
  for(const [id,value] of values){
    if(!Number.isFinite(value)) continue;
    const index=actualParameterIndex(core,id);
    if(index<0)continue;
    const min=raw.minimumValues?.[index]??-Infinity;
    const max=raw.maximumValues?.[index]??Infinity;
    const next=Math.max(min,Math.min(max,value));
    if(typeof core.setParameterValueByIndex==='function')core.setParameterValueByIndex(index,next);
    else if(raw.values)raw.values[index]=next;
    else continue;
    applied++;
  }
  return applied;
}
// The internal model emits this event immediately before its own core.update().
// Installing a Pixi ticker callback (after render) would be overwritten next frame.
export function bindParameterDriver(internal,callback){
  if(typeof internal?.on==='function'){
    internal.on('beforeModelUpdate',callback);
    return 'beforeModelUpdate';
  }
  // Minimal fallback for other compatible renderers with update() but no emitter.
  if(typeof internal?.update==='function'){
    const original=internal.update;
    internal.update=function(...args){
      // Fallback is less precise; prefer the event path above.
      callback();
      return original.apply(this,args);
    };
    return 'update-wrapper';
  }
  return 'unavailable';
}
