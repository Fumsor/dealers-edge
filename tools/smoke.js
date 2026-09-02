/* Rauchtest: bootet die App wie im Browser und klickt die neuen Wege durch. */
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
let store={};
const sb={window:{innerWidth:393,innerHeight:852,addEventListener(){},matchMedia:()=>({matches:false}),
 crypto:null,location:{href:''},navigator:{},
 storage:{async get(k){return store[k]?{value:store[k]}:null},async set(k,v){store[k]=v;return{}}}},
 document,console,setTimeout:(f)=>{try{f&&f()}catch(e){}return 0},clearTimeout(){},setInterval(){},
 requestAnimationFrame:()=>0,cancelAnimationFrame(){},
 navigator:{serviceWorker:null,userAgent:'node',standalone:false},
 performance:{now:()=>Date.now()},Math,JSON,Date,parseInt,parseFloat,isNaN,Number,String,Array,Object,Set,Map,Promise,Error};
sb.globalThis=sb;sb.window.document=document;vm.createContext(sb);
vm.runInContext(js+'\nglobalThis.__X={S,CAREER,setLang,chooseMode,showStartScreen,openCareer,'+
 'careerStart,deal,act,toBetting,strategy,bestLegal,opts,openSheet,closeSheets,buildMenu,'+
 'redeemCoins,render,resetAll,careerAcceptMistake,careerUseJoker,rebuy};',sb,{filename:'index.html'});
const X=sb.__X,S=X.S;
let fail=0;const ok=(c,m)=>{console.log((c?'  OK   ':'  XX   ')+m);if(!c)fail++};

ok(S.gameMode===null,'nach dem Start ist kein Modus gesetzt, der Startbildschirm ist sichtbar');

X.chooseMode('training');
ok(S.gameMode==='training'&&S.bank===1000,'Training startet mit frischem Stapel');
S.bank=3; X.toBetting();
ok(S.bank===1000&&S.phase==='bet','Training fuellt still auf statt in die Pleite zu laufen');
S.bank=555; sb.save && sb.save();

X.chooseMode('endless');
ok(S.gameMode==='endless'&&S.bank===1000,'Endless setzt die eigene Bankroll fort, unbeeindruckt vom Training');
S.bank=3; X.toBetting();
ok(S.phase==='broke','Endless laeuft in die Pleite, wie es soll');
X.rebuy(); ok(S.bank===1003&&S.stats.rebuys===1,'Rebuy funktioniert und wird gezaehlt');

X.openCareer();
ok(S.gameMode==='career','Karriere waehlbar');
ok(document.getElementById('cvBody').innerHTML.includes('LEVEL')||
   document.getElementById('cvBody').innerHTML.length>200,'Levelliste wird aufgebaut');

X.careerStart(0);
ok(S.career.running&&S.bet===50&&S.phase==='bet','Level 1 startet mit festem Einsatz');
ok(S.shoe.length>=24,'Rundenstapel gesetzt');
let g=0;
while(S.career.running&&g++<300){
  if(S.phase==='bet'){X.deal();continue}
  if(S.phase==='player'){const h=S.hands[S.active],o=X.opts(h);
    X.act(X.bestLegal(X.strategy(h.cards,S.dealer[0].v,o).chain,o));continue}
  if(S.phase==='mistake'){X.careerUseJoker();continue}
  if(S.phase==='settled'){X.toBetting();continue}
  break;
}
ok(!S.career.running&&S.bank>=X.CAREER[0].target,`Level 1 perfekt durchgespielt: $${S.bank} >= Ziel $${X.CAREER[0].target}`);
ok(S.careerData.done[1]&&S.careerData.done[1].stars===3,'drei Sterne ohne Jokereinsatz');
const gotCoins=S.careerData.coins;
ok(gotCoins>0,`Coins gutgeschrieben: ${gotCoins}`);

X.chooseMode('endless');
const before=S.bank; X.redeemCoins();
ok(S.bank===before+gotCoins&&S.careerData.coins===0,'Coins lassen sich in Endless einloesen');

X.setLang('en');
ok(S.lang==='en','Sprachumschaltung laeuft ohne Fehler');
X.openCareer(); X.setLang('de');
['sheetCoach','sheetStats','sheetAch','sheetMenu','sheetChart','sheetMath','sheetTut','sheetInstall','sheetCareer']
  .forEach(id=>{try{X.openSheet(id)}catch(e){ok(false,'Sheet '+id+' wirft: '+e.message)}});
X.closeSheets();
ok(true,'alle neun Bottom Sheets lassen sich oeffnen');

X.resetAll();
ok(S.careerData.coins===0&&Object.keys(S.careerData.done).length===0,'Zuruecksetzen leert auch die Karriere');

console.log('\n'+(fail?`${fail} FEHLER`:'Rauchtest bestanden.'));
process.exit(fail?1:0);
