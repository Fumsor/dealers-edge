/* Spielt die Karriere gegen den TATSAECHLICHEN Code aus index.html.
   Die Datei wird geladen, DOM und Audio werden durch Attrappen ersetzt,
   danach wird jedes Level auf drei Arten durchgespielt:
     A) perfekt                      -> muss das Ziel exakt treffen
     B) ein Fehler, mit Joker geheilt -> muss das Ziel ebenfalls treffen
     C) drei Fehler ohne Joker        -> darf das Ziel verfehlen duerfen
   Damit wird nicht die Kopie der Engine geprueft, sondern die ausgelieferte Datei.
*/
const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('/home/claude/app/index.html','utf8');
const js=html.match(/<script>\s*"use strict";([\s\S]*?)<\/script>\s*<\/body>/)[1];

function mkEl(){
  const el={_html:'',_txt:'',classList:{_s:new Set(),add(){},remove(){},toggle(){},contains(){return false}},
    style:{setProperty(){},},dataset:{},disabled:false,
    get innerHTML(){return this._html},set innerHTML(v){this._html=v},
    get textContent(){return this._txt},set textContent(v){this._txt=v},
    setAttribute(){},getAttribute(){return null},appendChild(){},removeChild(){},
    getBoundingClientRect(){return{left:0,top:0,width:10,height:10}},
    scrollIntoView(){},addEventListener(){},remove(){},offsetWidth:1,querySelector(){return mkEl()}};
  return el;
}
const els={};
const document={
  getElementById(id){return els[id]||(els[id]=mkEl())},
  querySelector(){return mkEl()}, querySelectorAll(){return []},
  createElement(){return mkEl()}, addEventListener(){},
  documentElement:{style:{setProperty(){}},lang:'de'},
  body:{appendChild(){},style:{}}
};
const sandbox={
  window:{innerWidth:393,innerHeight:852,addEventListener(){},matchMedia:()=>({matches:false}),
          crypto:null,storage:null,location:{href:''},navigator:{}},
  document, console, setTimeout:(f)=>0, clearTimeout(){}, setInterval(){}, requestAnimationFrame:()=>0, cancelAnimationFrame(){},
  navigator:{serviceWorker:null,userAgent:'node',standalone:false},
  AudioContext:undefined, webkitAudioContext:undefined,
  performance:{now:()=>Date.now()}, Math, JSON, Date, parseInt, parseFloat, isNaN, Number, String, Array, Object, Set, Map, Promise, Error
};
sandbox.globalThis=sandbox; sandbox.window.document=document;
vm.createContext(sandbox);
// Boot-IIFE abschneiden, wir starten selbst
// const/let landen nicht auf dem Sandbox-Objekt -> ausdruecklich herausreichen
const exportLine='\nglobalThis.__X={S,CAREER,strategy,bestLegal,opts,act,deal,toBetting,insurance,'+
  'careerStart,careerUseJoker,careerAcceptMistake,setLang,evalHand,openCareer,buildCareerSheet,'+
  'careerFinish,redeemCoins,RULES,APP_VERSION};\n';
vm.runInContext(js.replace(/\(async function boot\(\)\{[\s\S]*?\}\)\(\);/,'')+exportLine,sandbox,{filename:'index.html'});
const X=sandbox.__X;

const S=X.S, CAREER=X.CAREER;
X.setLang('de');

function playLevel(idx,plan){
  S.careerData={coins:0,done:{}};
  // alle Level freischalten fuer den Test
  CAREER.forEach(l=>{if(l.id<CAREER[idx].id)S.careerData.done[l.id]={stars:3}});
  X.careerStart(idx);
  let mistakesMade=0, guard=0;
  while(S.career.running && guard++<400){
    if(S.phase==='bet'){ X.deal(); continue; }
    if(S.phase==='player'){
      const h=S.hands[S.active], o=X.opts(h);
      const adv=X.strategy(h.cards,S.dealer[0].v,o);
      let a=X.bestLegal(adv.chain,o);
      if(plan.errorsAt && plan.errorsAt.includes(mistakesMade) && plan.wrongLeft>0){
        const alt=['HIT','STAND'].find(x=>x!==a);
        if(alt){a=alt; plan.wrongLeft--;}
      }
      X.act(a);
      continue;
    }
    if(S.phase==='mistake'){
      mistakesMade++;
      if(plan.useJoker && S.career.jokers>0) X.careerUseJoker();
      else X.careerAcceptMistake();
      continue;
    }
    if(S.phase==='insurance'){ X.insurance(false); continue; }
    if(S.phase==='settled'){ X.toBetting(); continue; }
    break;
  }
  return {bank:S.bank,target:S.career.target,jokers:S.career.jokers,errors:S.career.errors,
          coins:S.careerData.coins,done:Object.keys(S.careerData.done).length,mistakesMade};
}

console.log('='.repeat(78));
console.log('KARRIERE — gespielt gegen den Code aus index.html');
console.log('='.repeat(78));
let fail=0;
for(let i=0;i<CAREER.length;i++){
  const lv=CAREER[i];
  const A=playLevel(i,{errorsAt:[],wrongLeft:0,useJoker:false});
  const okA=A.bank===lv.target;
  const B=playLevel(i,{errorsAt:[0],wrongLeft:1,useJoker:true});
  const okB=B.bank===lv.target && B.jokers===1;
  const C=playLevel(i,{errorsAt:[0,1,2],wrongLeft:3,useJoker:false});
  const passC = C.bank>=lv.target && C.errors===0;
  const okC = !passC;
  const D=playLevel(i,{errorsAt:[0,1],wrongLeft:2,useJoker:true});
  const okD = D.bank===lv.target && D.errors===0 && D.jokers===0 && D.coins>0;
  if(!okA||!okB||!okC||!okD)fail++;
  console.log(`L${String(lv.id).padStart(2)} Ziel $${String(lv.target).padEnd(5)}`+
    `| perfekt $${String(A.bank).padEnd(5)}${okA?'OK':'XX'} `+
    `| 1 Fehler+Joker $${String(B.bank).padEnd(5)}${okB?'OK':'XX'} `+
    `| 2 Fehler+2 Joker $${String(D.bank).padEnd(5)}${okD?'OK':'XX'} `+
    `| 3 Fehler ohne Joker: Kapital $${String(C.bank).padEnd(5)} Fehler ${C.errors} -> ${okC?'durchgefallen OK':'BESTANDEN XX'}`);
}
console.log('='.repeat(78));
console.log(fail?`FEHLGESCHLAGEN: ${fail} Level`
 :'Alle 10 Level: perfektes Spiel trifft das Ziel exakt, Joker heilen Fehler,\nund kein Level laesst sich mit unkorrigierten Fehlern bestehen.');
