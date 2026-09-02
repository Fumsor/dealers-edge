/* Fehlertoleranz — die Grundlage der Zielberechnung in 0.5.0.

   Frage: Wenn ein Spieler in einem Level hoechstens K falsche Entscheidungen
   trifft und diese Fehler die denkbar teuersten sind — wo landet er dann?

   Genau dieser Wert wird das Ziel. Damit gilt die Zusage: bis K Fehler ist das
   Level sicher zu schaffen, egal welche Fehler es waren und wie die Karten
   danach fallen. Nichts daran ist geschaetzt (E10).

   Verfahren:
   1. Pro Runde und pro Fehlerzahl m die Baumsuche ueber alle Zugfolgen, bei
      denen hoechstens m Entscheidungen von der Basic Strategy abweichen.
      Ergebnis: das schlechteste erreichbare Netto minNet[runde][m].
   2. Danach eine dynamische Programmierung ueber die Runden: wie verteilt man
      K Fehler so auf die Runden, dass am Ende am wenigsten Kapital dasteht.
      Das Kapital wird dabei mitgefuehrt, weil es ueber Double und Split
      mitentscheidet, welche Zuege ueberhaupt legal sind.
*/
const {evalHand,isPairHand,strategy,bestLegal,RULES}=require('./engine');

const VAL={'A':11,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10};
const mk=r=>({r,v:VAL[r],s:'x',c:'blk'});

/* Schlechtestes Netto der Runde mit hoechstens maxMist Abweichungen. */
function worstNet(cards,bet,bankIn,maxMist){
  const full=cards.map(mk).reverse();
  const p=[full.pop(),full.pop()],up=full.pop(),hole=full.pop();
  const upv=up.v;
  const dealerBJ=(upv===11&&hole.v===10)||(upv===10&&hole.v===11);
  const playerBJ=evalHand(p).total===21;
  if(dealerBJ||playerBJ){
    if(dealerBJ&&playerBJ)return 0;
    if(dealerBJ)return -bet;
    return bet*RULES.bjPays;
  }
  let worst=Infinity;

  function settleAll(hands,shoe){
    const d=[up,hole];
    const live=hands.some(x=>!x.surrendered&&!evalHand(x.cards).bust);
    const sh=shoe.slice();
    if(live){let g=0;while(g++<15){const e=evalHand(d);
      if(e.total<17){if(!sh.length)return null;d.push(sh.pop());continue}
      if(e.total===17&&e.soft&&RULES.h17){if(!sh.length)return null;d.push(sh.pop());continue}
      break}}
    const de=evalHand(d);let net=0;
    for(const hh of hands){
      const pe=evalHand(hh.cards);let pay=0;
      if(hh.surrendered)pay=hh.bet/2;
      else if(pe.bust)pay=0;
      else if(hh.cards.length===2&&!hh.fromSplit&&pe.total===21&&hands.length===1)pay=hh.bet*(1+RULES.bjPays);
      else if(de.bust||pe.total>de.total)pay=hh.bet*2;
      else if(pe.total<de.total)pay=0;
      else pay=hh.bet;
      net+=pay-hh.bet;
    }
    return net;
  }

  function rec(shoe,bank,hands,active,mist,depth){
    if(depth>44)return;
    const h=hands[active];
    if(!h||h.done){
      let i=active,sh=shoe.slice(),hs=hands.map(x=>({...x,cards:x.cards.slice()})),moved=false;
      while(true){
        i++; if(i>=hs.length)break;
        const n=hs[i];
        if(n.needsCard){if(!sh.length)return;n.cards.push(sh.pop());n.needsCard=false}
        if(n.splitAces){n.done=true;continue}
        if(evalHand(n.cards).total===21){n.done=true;continue}
        if(!n.done){moved=true;break}
      }
      if(moved)return rec(sh,bank,hs,i,mist,depth+1);
      const net=settleAll(hs,sh);
      if(net!==null&&net<worst)worst=net;
      return;
    }
    const two=h.cards.length===2,pair=isPairHand(h.cards);
    const o={canDouble:two&&!h.splitAces&&bank>=h.bet,
             canSplit:two&&pair&&hands.length<RULES.maxHands&&!h.splitAces&&
                      !(h.fromSplit&&h.cards[0].v===11&&!RULES.rsa)&&bank>=h.bet,
             canSurrender:RULES.ls&&two&&!h.fromSplit&&hands.length===1};
    const right=bestLegal(strategy(h.cards,upv,o).chain,o);
    const acts=['HIT','STAND'];
    if(o.canDouble)acts.push('DOUBLE');
    if(o.canSplit)acts.push('SPLIT');
    if(o.canSurrender)acts.push('SURRENDER');
    for(const a of acts){
      const cost=(a===right)?0:1;
      if(mist+cost>maxMist)continue;
      const sh=shoe.slice(),hs=hands.map(x=>({...x,cards:x.cards.slice()}));
      let bk=bank,hh=hs[active];
      if(a==='HIT'){if(!sh.length)continue;hh.cards.push(sh.pop());
        const e=evalHand(hh.cards);if(e.bust||e.total===21)hh.done=true}
      else if(a==='STAND')hh.done=true;
      else if(a==='DOUBLE'){bk-=hh.bet;hh.bet*=2;if(!sh.length)continue;hh.cards.push(sh.pop());hh.done=true}
      else if(a==='SURRENDER'){hh.surrendered=true;hh.done=true}
      else if(a==='SPLIT'){
        const mv=hh.cards.pop(),isA=mv.v===11;bk-=hh.bet;
        hs.splice(active+1,0,{cards:[mv],bet:hh.bet,done:false,doubled:false,
          surrendered:false,fromSplit:true,splitAces:isA,needsCard:true});
        hh.fromSplit=true;if(isA)hh.splitAces=true;
        if(!sh.length)continue;hh.cards.push(sh.pop());
        if(hh.splitAces||evalHand(hh.cards).total===21)hh.done=true;
      }
      rec(sh,bk,hs,active,mist+cost,depth+1);
    }
  }
  rec(full,bankIn-bet,[{cards:p,bet,done:false,doubled:false,surrendered:false,
                        fromSplit:false,splitAces:false,needsCard:false}],0,0,0);
  return worst===Infinity?-bet:worst;
}

/* Schlechtestes Endkapital des ganzen Levels bei hoechstens K Fehlern. */
function worstFinal(rounds,bet,start,K){
  const cache=new Map();
  const wn=(cards,bank,m)=>{
    const k=cards+'|'+bank+'|'+m;
    if(cache.has(k))return cache.get(k);
    const v=worstNet(cards.split(','),bet,bank,m);
    cache.set(k,v);return v;
  };
  /* Zustand: nach Runde i, mit m verbrauchten Fehlern -> kleinstes Kapital */
  let cur=new Map([['0',{m:0,bank:start}]]);
  let states=[{m:0,bank:start}];
  for(const cards of rounds){
    const next=new Map();
    for(const st of states){
      for(let use=0;use+st.m<=K;use++){
        if(st.bank<bet)continue;
        const net=wn(cards,st.bank,use);
        const nb=st.bank+net, nm=st.m+use;
        const key=nm;
        if(!next.has(key)||next.get(key)>nb)next.set(key,nb);
      }
    }
    states=[...next.entries()].map(([m,bank])=>({m:+m,bank}));
    if(!states.length)return null;
  }
  return Math.min(...states.map(s=>s.bank));
}

module.exports={worstNet,worstFinal};
