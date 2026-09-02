/* Erschoepfende Baumsuche ueber ALLE legalen Zugfolgen einer gestellten Runde.
   Liefert das bestmoegliche Nettoergebnis. Wird gebraucht, um sicherzustellen,
   dass in keinem Level ein Fehler besser abschneidet als das richtige Spiel. */
const {evalHand,isPairHand,RULES}=require('./engine');
const VAL={'A':11,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10};
const mk=r=>({r,v:VAL[r],s:'x',c:'blk'});

function bestNet(cards,bet,bankIn){
  const full=cards.map(mk).reverse();
  const p=[full.pop(),full.pop()], up=full.pop(), hole=full.pop();
  let best=-Infinity, ok=true;
  const up_v=up.v;
  const dealerBJ=(up_v===11&&hole.v===10)||(up_v===10&&hole.v===11);
  const playerBJ=evalHand(p).total===21;
  if(dealerBJ||playerBJ)return{best:0,natural:true,ok:true};

  function settleAll(hands,shoe){
    const d=[up,hole];
    const live=hands.some(x=>!x.surrendered&&!evalHand(x.cards).bust);
    const sh=shoe.slice();
    if(live){let g=0;while(g++<15){const e=evalHand(d);
      if(e.total<17){if(!sh.length){ok=false;return null}d.push(sh.pop());continue}
      if(e.total===17&&e.soft&&RULES.h17){if(!sh.length){ok=false;return null}d.push(sh.pop());continue}
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
    return net;
  }
  function rec(shoe,bank,hands,active,depth){
    if(depth>40)return;
    const h=hands[active];
    if(!h||h.done){
      let i=active,sh=shoe.slice(),hs=hands.map(x=>({...x,cards:x.cards.slice()})),moved=false;
      while(true){
        i++; if(i>=hs.length)break;
        const n=hs[i];
        if(n.needsCard){if(!sh.length){ok=false;return}n.cards.push(sh.pop());n.needsCard=false}
        if(n.splitAces){n.done=true;continue}
        if(evalHand(n.cards).total===21){n.done=true;continue}
        if(!n.done){moved=true;break}
      }
      if(moved)return rec(sh,bank,hs,i,depth+1);
      const net=settleAll(hs,sh); if(net!==null&&net>best)best=net; return;
    }
    const two=h.cards.length===2,pair=isPairHand(h.cards);
    const o={canDouble:two&&!h.splitAces&&bank>=h.bet,
             canSplit:two&&pair&&hands.length<RULES.maxHands&&!h.splitAces&&
                      !(h.fromSplit&&h.cards[0].v===11&&!RULES.rsa)&&bank>=h.bet,
             canSurrender:RULES.ls&&two&&!h.fromSplit&&hands.length===1};
    const acts=['HIT','STAND'];
    if(o.canDouble)acts.push('DOUBLE');
    if(o.canSplit)acts.push('SPLIT');
    if(o.canSurrender)acts.push('SURRENDER');
    for(const a of acts){
      const sh=shoe.slice(), hs=hands.map(x=>({...x,cards:x.cards.slice()}));
      let bk=bank, hh=hs[active];
      if(a==='HIT'){if(!sh.length){ok=false;return}hh.cards.push(sh.pop());
        const e=evalHand(hh.cards);if(e.bust||e.total===21)hh.done=true}
      else if(a==='STAND')hh.done=true;
      else if(a==='DOUBLE'){bk-=hh.bet;hh.bet*=2;if(!sh.length){ok=false;return}hh.cards.push(sh.pop());hh.done=true}
      else if(a==='SURRENDER'){hh.surrendered=true;hh.done=true}
      else if(a==='SPLIT'){
        const mv=hh.cards.pop(),isA=mv.v===11;bk-=hh.bet;
        hs.splice(active+1,0,{cards:[mv],bet:hh.bet,done:false,doubled:false,surrendered:false,
                              fromSplit:true,splitAces:isA,needsCard:true});
        hh.fromSplit=true; if(isA)hh.splitAces=true;
        if(!sh.length){ok=false;return}hh.cards.push(sh.pop());
        if(hh.splitAces||evalHand(hh.cards).total===21)hh.done=true;
      }
      rec(sh,bk,hs,active,depth+1);
    }
  }
  rec(full,bankIn-bet,[{cards:p,bet,done:false,doubled:false,surrendered:false,
                        fromSplit:false,splitAces:false,needsCard:false}],0,0);
  return{best,natural:false,ok};
}
module.exports={bestNet};
