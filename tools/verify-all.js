/* Gesamtverifikation gegen die ausgelieferte index.html.
   Prueft die vier Pruefungen aus STATUS.md, soweit sie ohne Browser laufen,
   plus die Karriere-Freischaltkette und die Coins. */
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
 navigator:{serviceWorker:null,userAgent:'node',standalone:false},
 performance:{now:()=>Date.now()},Math,JSON,Date,parseInt,parseFloat,isNaN,Number,String,Array,Object,Set,Map,Promise,Error};
sb.globalThis=sb;sb.window.document=document;vm.createContext(sb);
vm.runInContext(js.replace(/\(async function boot\(\)\{[\s\S]*?\}\)\(\);/,'')+
 '\nglobalThis.__X={S,CAREER,strategy,bestLegal,basePlay,evalHand,isPairHand,dealerDist,actionEVs,'+
 'setLang,careerStart,careerUseJoker,careerAcceptMistake,act,deal,toBetting,opts,APP_VERSION,'+
 'buildShoe,RULES,careerUnlocked,buildCareerSheet,openCareer,UI,unseenProbs,freshShoe,IDX};',sb,{filename:'index.html'});
const X=sb.__X;X.setLang('de');
let fail=0;const ok=(c,m)=>{console.log((c?'  OK   ':'  XX   ')+m);if(!c)fail++};

console.log('\n1. STRATEGIETABELLE — 310 Zellen gegen die Praeferenzkettenlogik');
{ // Jede Zelle muss eine legale, nicht leere Kette liefern
  let cells=0,bad=0;
  const mk=v=>({r:v===11?'A':String(v),v,s:'x',c:'blk'});
  for(let d=2;d<=11;d++){
    for(let t=5;t<=20;t++){ // harte Haende
      const a=Math.max(2,t-10),b=t-a; if(b<2||b>10)continue;
      const o={canDouble:true,canSplit:false,canSurrender:true};
      const r=X.strategy([mk(a),mk(b)],d,o);cells++;
      if(!r.chain.length||!r.key)bad++;
    }
    for(let x=2;x<=10;x++){ // weiche Haende
      const o={canDouble:true,canSplit:false,canSurrender:true};
      const r=X.strategy([mk(11),mk(x)],d,o);cells++;
      if(!r.chain.length||!r.key)bad++;
    }
    for(let p=2;p<=11;p++){ // Paare
      const o={canDouble:true,canSplit:true,canSurrender:true};
      const r=X.strategy([mk(p),mk(p)],d,o);cells++;
      if(!r.chain.length||!r.key)bad++;
    }
  }
  ok(bad===0,`${cells} Zellen geprueft, ${bad} ohne gueltige Kette`);
}

console.log('\n2. PRAEFERENZKETTEN — Rueckfall bei drei und mehr Karten (E2)');
{ let bad=0,n=0;
  const mk=v=>({r:v===11?'A':String(v),v,s:'x',c:'blk'});
  for(let d=2;d<=11;d++)for(let t=5;t<=20;t++){
    const a=Math.max(2,t-10),b=t-a;if(b<2||b>10)continue;
    const chain=X.strategy([mk(a),mk(b)],d,{canDouble:true,canSplit:false,canSurrender:true}).chain;
    const legal=X.bestLegal(chain,{canDouble:false,canSplit:false,canSurrender:false});
    n++; if(legal!=='HIT'&&legal!=='STAND')bad++;
  }
  ok(bad===0,`${n} Ketten: Rueckfall immer auf HIT oder STAND, ${bad} Ausreisser`);
}

console.log('\n3. DEALER-VERTEILUNG — Summe der Wahrscheinlichkeiten');
{ let bad=0; const rows=[];
  X.freshShoe();
  const p=X.unseenProbs();
  for(let up=2;up<=11;up++){
    const d=X.dealerDist(X.IDX(up),p);
    const s=Object.values(d).reduce((a,b)=>a+b,0);
    if(Math.abs(s-1)>1e-9)bad++;
    rows.push(`${up===11?'A':up}: bust ${(d.b*100).toFixed(2)}%`);
  }
  ok(bad===0,`10 Upcards, Summe je exakt 1.0, ${bad} Abweichungen`);
  console.log('         '+rows.join('  '));
}

console.log('\n4. KARRIERE — Ziele, Freischaltung, Coins');
{ const S=X.S,C=X.CAREER;
  ok(C.length===10,`${C.length} Level vorhanden`);
  ok(C.every(l=>l.target>l.start),'jedes Ziel liegt ueber dem Startkapital');
  ok(C.every(l=>l.rounds.every(r=>r.split(',').length>=24)),'jeder Rundenstapel hat mindestens 24 Karten');
  S.careerData={coins:0,done:{}};
  ok(X.careerUnlocked(0)===true,'Level 1 ist offen');
  ok(X.careerUnlocked(1)===false,'Level 2 ist zu, solange Level 1 offen ist');
  S.careerData.done[1]={stars:3};
  ok(X.careerUnlocked(1)===true,'Level 2 oeffnet nach Level 1');
  ok(X.careerUnlocked(9)===false,'Level 10 bleibt zu');
}

console.log('\n5. ZWEISPRACHIGKEIT — jeder Schluessel in beiden Sprachen (E9)');
{ const de=Object.keys(X.UI.de),en=Object.keys(X.UI.en);
  const missEn=de.filter(k=>!(k in X.UI.en));
  const missDe=en.filter(k=>!(k in X.UI.de));
  ok(missEn.length===0,`${de.length} Schluessel, fehlend in EN: ${missEn.join(', ')||'keine'}`);
  ok(missDe.length===0,`${en.length} Schluessel, fehlend in DE: ${missDe.join(', ')||'keine'}`);
  ok(X.UI.de.careerNames.length===10&&X.UI.en.careerNames.length===10,'10 Levelnamen je Sprache');
  ok(X.UI.de.careerHints.length===10&&X.UI.en.careerHints.length===10,'10 Levelhinweise je Sprache');
}

console.log('\n6. VERSION');
ok(X.APP_VERSION==='0.5.0',`APP_VERSION = ${X.APP_VERSION}`);
ok(fs.readFileSync('/home/claude/app/sw.js','utf8').includes("'dealers-edge-0.5.0'"),'Cache-Name des Service Workers passt zur Version');

console.log('\n'+'='.repeat(70));
console.log(fail?`${fail} PRUEFUNG(EN) FEHLGESCHLAGEN`:'Alle Pruefungen bestanden.');
process.exit(fail?1:0);
