/* Realistisches Fehlermodell.

   Die Suche ueber den boesartigsten Fehler liefert unbrauchbare Ziele: sie
   nimmt an, der Spieler splittet viermal und verdoppelt jedes Mal, um maximal
   zu verlieren. So verspielt sich niemand.

   Stattdessen wird simuliert: ein Spieler, der die Strategie kennt, aber an
   k zufaelligen Stellen eine andere legale Aktion waehlt. Ueber viele Laeufe
   ergibt sich, wie oft ein solcher Spieler das Ziel noch erreicht.
   Fester Seed, der Lauf ist reproduzierbar. */
const {evalHand,isPairHand,strategy,bestLegal,RULES}=require('./engine');
const VAL={'A':11,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10};
const mk=r=>({r,v:VAL[r],s:'x',c:'blk'});
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* Eine Runde mit vorgegebener Entscheidungsfunktion. */
function runRound(cards,bet,bankIn,pick){
  const shoe=cards.map(mk).reverse();
  const draw=()=>shoe.length?shoe.pop():mk('7');
  let bank=bankIn-bet;
  const p=[draw(),draw()],dealer=[draw()],hole=draw();
  const up=dealer[0].v;
  const dBJ=(up===11&&hole.v===10)||(up===10&&hole.v===11);
  const pBJ=evalHand(p).total===21;
  if(dBJ||pBJ){
    if(dBJ&&pBJ)return{net:0,decisions:0};
    if(dBJ)return{net:-bet,decisions:0};
    return{net:bet*RULES.bjPays,decisions:0};
  }
  let hands=[{cards:p,bet,done:false,surrendered:false,fromSplit:false,splitAces:false,needsCard:false}];
  let active=0,guard=0,dec=0;
  while(guard++<60){
    const h=hands[active];
    if(h.done){
      let i=active,moved=false;
      while(true){
        i++; if(i>=hands.length)break;
        const n=hands[i];
        if(n.needsCard){n.cards.push(draw());n.needsCard=false}
        if(n.splitAces){n.done=true;continue}
        if(evalHand(n.cards).total===21){n.done=true;continue}
        if(!n.done){active=i;moved=true;break}
      }
      if(!moved)break;
      continue;
    }
    const two=h.cards.length===2,pair=isPairHand(h.cards);
    const o={canDouble:two&&!h.splitAces&&bank>=h.bet,
             canSplit:two&&pair&&hands.length<RULES.maxHands&&!h.splitAces&&
                      !(h.fromSplit&&h.cards[0].v===11&&!RULES.rsa)&&bank>=h.bet,
             canSurrender:RULES.ls&&two&&!h.fromSplit&&hands.length===1};
    const right=bestLegal(strategy(h.cards,up,o).chain,o);
    const legal=['HIT','STAND'];
    if(o.canDouble)legal.push('DOUBLE');
    if(o.canSplit)legal.push('SPLIT');
    if(o.canSurrender)legal.push('SURRENDER');
    const a=pick(right,legal); dec++;
    if(a==='HIT'){h.cards.push(draw());const e=evalHand(h.cards);if(e.bust||e.total===21)h.done=true}
    else if(a==='STAND')h.done=true;
    else if(a==='DOUBLE'){bank-=h.bet;h.bet*=2;h.cards.push(draw());h.done=true}
    else if(a==='SURRENDER'){h.surrendered=true;h.done=true}
    else if(a==='SPLIT'){
      const mv=h.cards.pop(),isA=mv.v===11;bank-=h.bet;
      hands.splice(active+1,0,{cards:[mv],bet:h.bet,done:false,surrendered:false,
                               fromSplit:true,splitAces:isA,needsCard:true});
      h.fromSplit=true;if(isA)h.splitAces=true;
      h.cards.push(draw());
      if(h.splitAces||evalHand(h.cards).total===21)h.done=true;
    }
  }
  const d=[dealer[0],hole];
  const live=hands.some(x=>!x.surrendered&&!evalHand(x.cards).bust);
  if(live){let g=0;while(g++<15){const e=evalHand(d);
    if(e.total<17){d.push(draw());continue}
    if(e.total===17&&e.soft&&RULES.h17){d.push(draw());continue}
    break}}
  const de=evalHand(d);let net=0;
  for(const h of hands){
    const pe=evalHand(h.cards);let pay=0;
    if(h.surrendered)pay=h.bet/2;
    else if(pe.bust)pay=0;
    else if(h.cards.length===2&&!h.fromSplit&&pe.total===21&&hands.length===1)pay=h.bet*(1+RULES.bjPays);
    else if(de.bust||pe.total>de.total)pay=h.bet*2;
    else if(pe.total<de.total)pay=0;
    else pay=h.bet;
    net+=pay-h.bet;
  }
  return{net,decisions:dec};
}

/* Zaehlt die Entscheidungen bei perfektem Spiel — Grundlage fuer die
   Verteilung der Fehler ueber das Level. */
function countDecisions(rounds,bet,start){
  let bank=start,n=0;
  for(const c of rounds){const r=runRound(c.split(','),bet,bank,(right)=>right);n+=r.decisions;bank+=r.net}
  return n;
}

/* Anteil der Laeufe, die das Ziel bei k zufaelligen Fehlern noch erreichen. */
function passRate(rounds,bet,start,target,k,runs,seed){
  const rng=mulberry(seed||1234);
  let pass=0;
  const totalDec=Math.max(1,countDecisions(rounds,bet,start));
  for(let r=0;r<runs;r++){
    let bank=start,left=k,seen=0;
    for(const c of rounds){
      const res=runRound(c.split(','),bet,bank,(right,legal)=>{
        seen++;
        const remaining=Math.max(1,totalDec-seen+1);
        if(left>0&&rng()<left/remaining){
          left--;
          const others=legal.filter(x=>x!==right);
          if(others.length)return others[Math.floor(rng()*others.length)];
        }
        return right;
      });
      bank+=res.net;
      if(bank<bet)break;
    }
    if(bank>=target)pass++;
  }
  return pass/runs;
}
module.exports={runRound,countDecisions,passRate};
