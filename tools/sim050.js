/* Spielt die Karriere gegen den Code aus index.html — mit vier Spielertypen.
   Geprueft wird die Zusage: bis zur ausgerechneten Toleranz kommt man durch. */
const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('/home/claude/app/index.html','utf8');
const js=html.match(/<script>\s*"use strict";([\s\S]*?)<\/script>\s*<\/body>/)[1];
function mkEl(){return{_html:'',_txt:'',classList:{add(){},remove(){},toggle(){},contains:()=>false},
 style:{setProperty(){}},dataset:{},disabled:false,
 get innerHTML(){return this._html},set innerHTML(v){this._html=v},
 get textContent(){return this._txt},set textContent(v){this._txt=v},
 setAttribute(){},getAttribute:()=>null,appendChild(){},removeChild(){},
 getBoundingClientRect:()=>({left:0,top:0,width:10,height:10}),
 scrollIntoView(){},addEventListener(){},remove(){},offsetWidth:1,querySelector(){return mkEl()}}}
const els={};const document={getElementById(id){return els[id]||(els[id]=mkEl())},
 querySelector:()=>mkEl(),querySelectorAll:()=>[],createElement:()=>mkEl(),addEventListener(){},
 documentElement:{style:{setProperty(){}},lang:'de'},body:{appendChild(){},style:{}}};
const sb={window:{innerWidth:393,innerHeight:852,addEventListener(){},matchMedia:()=>({matches:false}),
 crypto:null,storage:null,location:{href:''},navigator:{}},document,console,
 setTimeout:()=>0,clearTimeout(){},setInterval(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},
 navigator:{serviceWorker:null,userAgent:'node',standalone:false},performance:{now:()=>Date.now()},
 Math,JSON,Date,parseInt,parseFloat,isNaN,Number,String,Array,Object,Set,Map,Promise,Error};
sb.globalThis=sb;sb.window.document=document;vm.createContext(sb);
vm.runInContext(js.replace(/\(async function boot\(\)\{[\s\S]*?\}\)\(\);/,'')+
 '\nglobalThis.__X={S,CAREER,setLang,careerStart,deal,act,toBetting,strategy,bestLegal,opts,'+
 'careerUseJoker,careerAcceptMistake,careerCashOut,setRecBet,insurance,addChip,APP_VERSION};',sb,{filename:'index.html'});
const X=sb.__X,S=X.S; X.setLang('de');
function mb(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

function run(idx,{mistakes=0,useJoker=false,betMult=1,cashOut=false,seed=1}={}){
  const rng=mb(seed);
  S.careerData={coins:0,done:{}};
  X.CAREER.forEach(l=>{if(l.id<X.CAREER[idx].id)S.careerData.done[l.id]={stars:3}});
  X.careerStart(idx);
  let left=mistakes,guard=0,seen=0;
  const totalDec=40;
  while(S.career.running&&guard++<900){
    if(S.phase==='bet'){
      if(cashOut&&S.bank>=S.career.target&&S.career.round>0){X.careerCashOut();continue}
      const base=X.CAREER[idx].bet;
      S.bet=Math.max(5,Math.min(Math.floor(S.bank),Math.round(base*betMult/5)*5));
      X.deal();continue;
    }
    if(S.phase==='player'){
      const h=S.hands[S.active],o=X.opts(h);
      const right=X.bestLegal(X.strategy(h.cards,S.dealer[0].v,o).chain,o);
      let a=right;seen++;
      if(left>0&&rng()<left/Math.max(1,totalDec-seen+1)){
        left--;
        const legal=['HIT','STAND'].concat(o.canDouble?['DOUBLE']:[],o.canSplit?['SPLIT']:[],o.canSurrender?['SURRENDER']:[]);
        const others=legal.filter(x=>x!==right);
        if(others.length)a=others[Math.floor(rng()*others.length)];
      }
      X.act(a);continue;
    }
    if(S.phase==='mistake'){ if(useJoker&&S.career.jokers>0)X.careerUseJoker(); else X.careerAcceptMistake(); continue }
    if(S.phase==='insurance'){X.insurance(false);continue}
    if(S.phase==='settled'){X.toBetting();continue}
    break;
  }
  const c=S.career;
  return{bank:S.bank,target:c.target,errors:c.errors,coins:S.careerData.coins,
         passed:!!S.careerData.done[X.CAREER[idx].id],
         stars:S.careerData.done[X.CAREER[idx].id]?S.careerData.done[X.CAREER[idx].id].stars:0,
         handsLeft:Math.max(0,c.hands-c.round)};
}

console.log('='.repeat(92));
console.log('KARRIERE 0.5.0 — gespielt gegen den Code aus index.html');
console.log('='.repeat(92));
let fail=0;
for(let i=0;i<X.CAREER.length;i++){
  const lv=X.CAREER[i];
  const A=run(i,{mistakes:0});
  const tolRuns=[];
  for(let s=1;s<=40;s++)tolRuns.push(run(i,{mistakes:lv.tol,seed:s*77}).passed);
  const tolRate=Math.round(tolRuns.filter(Boolean).length/tolRuns.length*100);
  const J=run(i,{mistakes:lv.tol+2,useJoker:true,seed:31});
  const C=run(i,{mistakes:0,betMult:2,cashOut:true,seed:5});
  const F=run(i,{mistakes:12,seed:9});

  const okA=A.passed&&A.stars===3&&A.bank>=lv.target;
  const okT=tolRate>=85;
  const okC=C.passed&&C.handsLeft>0&&C.coins>=A.coins*0.6;
  const okF=F.coins>0;
  if(!okA||!okT||!okC||!okF)fail++;
  console.log(
   `L${String(lv.id).padStart(2)} Ziel $${String(lv.target).padEnd(5)} tol ${lv.tol} `+
   `| perfekt $${String(A.bank).padEnd(5)} ${A.stars}\u2605 ${A.coins}c ${okA?'OK':'XX'} `+
   `| ${lv.tol} Fehler: ${String(tolRate).padStart(3)}% bestanden ${okT?'OK':'XX'} `+
   `| Risiko+CashOut $${String(C.bank).padEnd(5)} ${C.handsLeft}H uebrig ${C.coins}c ${okC?'OK':'XX'} `+
   `| 12 Fehler: ${F.passed?'bestanden':'nicht bestanden'}, ${F.coins}c ${okF?'OK':'XX'}`);
}
console.log('='.repeat(92));
console.log(fail?`FEHLGESCHLAGEN: ${fail} Level`
 :'Alle 10 Level: perfektes Spiel drei Sterne, Toleranz haelt, vorzeitiges\nAbschliessen laesst Haende uebrig, und auch ein verpatzter Lauf gibt Coins.');
process.exit(fail?1:0);
