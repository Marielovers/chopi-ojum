import {readFile, access} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
let failures=0;
for (const id of ['model1','model2']){
  const folder=resolve(`public/assets/models/${id}`);
  try {
    const json=JSON.parse(await readFile(resolve(folder,'model3.json'),'utf8'));
    for(const asset of [json.FileReferences.Moc,...(json.FileReferences.Textures??[])]){
      await access(resolve(folder,asset));
    }
    const buffer=await readFile(resolve(folder,json.FileReferences.Moc));
    if(buffer.toString('ascii',0,4)!=='MOC3')throw Error('MOC3 header missing');
    const v=buffer.readUInt8(4);
    console.log(`${id}: 원본 .moc3 버전 ${v} / ${json.FileReferences.Textures.length} 텍스처 / 필수 파일 확인`);
    if(v>6)throw Error(`지원 검증되지 않은 MOC3 버전: ${v}`);
  }catch(err){failures++;console.error(`${id}:`,err.message);}
}
if(failures)process.exitCode=1;
