import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const path=p=>new URL('../'+p,import.meta.url);
const read=p=>readFileSync(path(p),'utf8');
test('Actions deploy works on main, builds and publishes dist',()=>{
 const yaml=read('.github/workflows/deploy.yml');
 for(const fragment of ['branches: [main]','workflow_dispatch:',"node-version: '24'",'npm ci','npm test','npm run build','actions/deploy-pages@v4'])assert.ok(yaml.includes(fragment),fragment);
 assert.ok(yaml.includes('path: ./dist'));
});
test('Firebase public client configuration is included for GitHub build',()=>{
 const env=read('.env.production');
 for(const key of ['API_KEY','AUTH_DOMAIN','PROJECT_ID','APP_ID'])assert.ok(env.includes('VITE_FIREBASE_'+key+'='));
 assert.ok(env.includes('exit-bol'));
 assert.ok(read('.gitignore').split(/\s+/).includes('.env'));
});
test('models and locally supplied Core are available as static public assets',()=>{
 for(const p of ['public/vendor/live2dcubismcore.min.js','public/assets/models/model1/model3.json','public/assets/models/model2/model3.json','public/.nojekyll'])assert.ok(existsSync(path(p)),p);
 assert.ok(read('vite.config.js').includes("base: './'"));
});
