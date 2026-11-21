// Opt-in download from the official Live2D hosting endpoint only.
// Review Live2D's Proprietary Software License Agreement before using Core.
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const remote='https://cubism.live2d.com/sdk-web/core/06/live2dcubismcore.min.js';
const dest=resolve('public/vendor/live2dcubismcore.min.js');
try{
  console.log('공식 Cubism Core 다운로드:',remote);
  const response=await fetch(remote,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error(`HTTP ${response.status}`);
  const content=await response.text();
  if(content.length<10000||/^\s*<(!doctype|html)/i.test(content))throw Error('공식 Core 자바스크립트가 아닌 응답');
  await mkdir(resolve('public/vendor'),{recursive:true});
  await writeFile(dest,content,'utf8');
  console.log('완료:',dest);
}catch(error){
  console.error('Core 자동 설치 실패:',error.message);
  console.error('공식 SDK에서 파일을 내려받아 직접 public/vendor/live2dcubismcore.min.js 에 복사해 주세요.');
  process.exitCode=1;
}
