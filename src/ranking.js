const STORE_KEY='chopy-local-ranking-v1';
const settings={
 apiKey:import.meta.env.VITE_FIREBASE_API_KEY,
 authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
 projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,
 appId:import.meta.env.VITE_FIREBASE_APP_ID,
 storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
 messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};
export const onlineConfigured=Boolean(settings.apiKey&&settings.projectId&&settings.appId);
let dbPromise;
async function getDB(){
 if(!onlineConfigured)return null;
 if(!dbPromise)dbPromise=(async()=>{
  const {initializeApp}=await import('firebase/app');
  const {getFirestore}=await import('firebase/firestore');
  return getFirestore(initializeApp(settings));
 })();
 return dbPromise;
}
function getLocal(){try{return JSON.parse(localStorage.getItem(STORE_KEY)||'[]')}catch{return []}}
export async function saveScore(name,meters){
 const safeName=String(name||'익명').trim().slice(0,12)||'익명';
 const value=Math.round(Math.max(0,Math.min(10000,Number(meters)||0))*10)/10;
 if(onlineConfigured){
  const db=await getDB(),{addDoc,collection,serverTimestamp}=await import('firebase/firestore');
  await addDoc(collection(db,'chopy_scores'),{name:safeName,meters:value,createdAt:serverTimestamp(),version:1});
  return 'online';
 }
 const list=[...getLocal(),{name:safeName,meters:value,createdAt:Date.now()}].sort((a,b)=>b.meters-a.meters).slice(0,100);
 localStorage.setItem(STORE_KEY,JSON.stringify(list));return 'local';
}
export async function fetchRanking(){
 if(onlineConfigured){
  const db=await getDB(),{getDocs,query,collection,orderBy,limit}=await import('firebase/firestore');
  const s=await getDocs(query(collection(db,'chopy_scores'),orderBy('meters','desc'),limit(30)));
  return {mode:'online',scores:s.docs.map(d=>d.data())};
 }
 return {mode:'local',scores:getLocal().slice(0,30)};
}
