import test from 'node:test';
import assert from 'node:assert/strict';
import {actualParameterIndex,applyDrivenParameters,bindParameterDriver,parameterRange} from '../src/parameter-driver.mjs';
function rig(){
  const raw={ids:['ParamMouthOpenY','lock2','angle'],count:3,minimumValues:[0,0,0],maximumValues:[1,2,1],values:[0,0,0]};
  const core={_model:{parameters:raw},getParameterIndex:()=>500,setParameterValueByIndex(i,value){raw.values[i]=value;}};
  return {core,raw};
}
test('finds actual core parameter index, not synthetic missing-param indices',()=>{
 const {core}=rig();assert.equal(actualParameterIndex(core,'lock2'),1);assert.equal(actualParameterIndex(core,'wrong'),-1);assert.deepEqual(parameterRange(core,'lock2'),{min:0,max:2});
});
test('clamps, writes true model values, skips unknown parameters',()=>{
 const {core,raw}=rig();const n=applyDrivenParameters(core,new Map([['ParamMouthOpenY',.7],['lock2',99],['bad',10]]));
 assert.equal(n,2);assert.deepEqual(raw.values,[.7,2,0]);
});
test('attaches the parameter callback at beforeModelUpdate instead of render-ticker',()=>{
 const events=[];const model={on(event,cb){events.push({event,cb})}};
 assert.equal(bindParameterDriver(model,()=>events.push('called')),'beforeModelUpdate');
 assert.equal(events[0].event,'beforeModelUpdate');events[0].cb();assert.equal(events[1],'called');
});
