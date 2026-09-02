/* Extrahierte Engine aus index.html, Abschnitte 1-4, unveraendert uebernommen.
   Dazu eine Nachbildung des Spielablaufs aus Abschnitt 12 fuer die Levelpruefung. */

const RULES={decks:6,penetration:0.75,h17:false,das:true,ls:true,maxHands:4,rsa:false,bjPays:1.5,
             minBet:5,maxBet:2000,startBank:1000};

const VAL={'A':11,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':10,'Q':10,'K':10};
const SUITS=[{s:'\u2660',c:'blk'},{s:'\u2665',c:'red'},{s:'\u2666',c:'red'},{s:'\u2663',c:'blk'}];
let suitSeq=0;
function card(r){const su=SUITS[suitSeq++%4];return{r:r,v:VAL[r],s:su.s,c:su.c}}

/* ---------- 3. HAND MATH (identisch) ---------- */
function evalHand(cards){let t=0,a=0;for(const c of cards){if(c.v===11){a++;t+=11}else t+=c.v}
  while(t>21&&a>0){t-=10;a--}return{total:t,soft:a>0,bust:t>21}}
function isPairHand(c){return c.length===2&&c[0].v===c[1].v}
function isBJ(h){return h.cards.length===2&&!h.fromSplit&&evalHand(h.cards).total===21}

/* ---------- 4. BASIC STRATEGY ENGINE (identisch) ---------- */
function basePlay(total,soft,d){
  if(soft){
    if(total>=19)return{chain:['STAND'],key:total===19?'soft.19':'soft.20'};
    if(total===18){
      if(d>=3&&d<=6)return{chain:['DOUBLE','STAND'],key:'soft.18double'};
      if(d===2||d===7||d===8)return{chain:['STAND'],key:'soft.18stand'};
      return{chain:['HIT'],key:'soft.18hit'};
    }
    if(total===17)return(d>=3&&d<=6)?{chain:['DOUBLE','HIT'],key:'soft.17double'}:{chain:['HIT'],key:'soft.17hit'};
    if(total===16||total===15)return(d>=4&&d<=6)?{chain:['DOUBLE','HIT'],key:'soft.1516double'}:{chain:['HIT'],key:'soft.low'};
    if(total===14||total===13)return(d>=5&&d<=6)?{chain:['DOUBLE','HIT'],key:'soft.1314double'}:{chain:['HIT'],key:'soft.low'};
    return{chain:['HIT'],key:'soft.low'};
  }
  if(total>=17)return{chain:['STAND'],key:'hard.17plus'};
  if(total>=13)return d<=6?{chain:['STAND'],key:'hard.stiffstand'}:{chain:['HIT'],key:'hard.stiffhit'};
  if(total===12)return(d>=4&&d<=6)?{chain:['STAND'],key:'hard.12stand'}:{chain:['HIT'],key:'hard.12hit'};
  if(total===11)return d===11?{chain:['HIT'],key:'hard.11vA'}:{chain:['DOUBLE','HIT'],key:'hard.11double'};
  if(total===10)return d<=9?{chain:['DOUBLE','HIT'],key:'hard.10double'}:{chain:['HIT'],key:'hard.10hit'};
  if(total===9)return(d>=3&&d<=6)?{chain:['DOUBLE','HIT'],key:'hard.9double'}:{chain:['HIT'],key:'hard.9hit'};
  return{chain:['HIT'],key:'hard.low'};
}
function strategy(cards,d,opt){
  const ev=evalHand(cards),total=ev.total,soft=ev.soft,pair=isPairHand(cards),pv=pair?cards[0].v:0;
  if(pair&&opt.canSplit){
    switch(pv){
      case 11:return{chain:['SPLIT'],key:'pair.A'};
      case 10:break;
      case 9:if(d>=2&&d<=6||d===8||d===9)return{chain:['SPLIT'],key:'pair.9split'};break;
      case 8:return{chain:['SPLIT'],key:'pair.8'};
      case 7:if(d<=7)return{chain:['SPLIT'],key:'pair.7split'};break;
      case 6:if(d<=6)return{chain:['SPLIT'],key:'pair.6split'};break;
      case 5:break;
      case 4:if(d===5||d===6)return{chain:['SPLIT'],key:'pair.4split'};break;
      case 3:case 2:if(d<=7)return{chain:['SPLIT'],key:'pair.23split'};break;
    }
  }
  if(opt.canSurrender&&!soft){
    if(total===16&&d>=9)return{chain:['SURRENDER',...basePlay(total,soft,d).chain],key:d===9?'surr.16v9':(d===10?'surr.16v10':'surr.16vA')};
    if(total===15&&d===10)return{chain:['SURRENDER',...basePlay(total,soft,d).chain],key:'surr.15v10'};
  }
  if(pair&&opt.canSplit){
    if(pv===10)return{chain:['STAND'],key:'pair.10'};
    if(pv===9&&(d===7||d===10||d===11))return{chain:['STAND'],key:'pair.9stand'};
    if(pv===5)return{chain:basePlay(total,soft,d).chain,key:'pair.5'};
    if(pv===7)return{chain:['HIT'],key:'pair.7hit'};
    if(pv===6)return{chain:['HIT'],key:'pair.6hit'};
    if(pv===4)return{chain:['HIT'],key:'pair.4hit'};
    if(pv===3||pv===2)return{chain:['HIT'],key:'pair.23hit'};
  }
  return basePlay(total,soft,d);
}
function bestLegal(chain,o){
  for(const a of chain){
    if(a==='DOUBLE'&&!o.canDouble)continue;
    if(a==='SPLIT'&&!o.canSplit)continue;
    if(a==='SURRENDER'&&!o.canSurrender)continue;
    return a;
  }
  return 'HIT';
}

/* ============================================================================
   Nachbildung des Rundenablaufs aus Abschnitt 12.
   Reihenfolge der Ziehungen: Spieler 1, Spieler 2, Dealer-Upcard, Hole Card,
   danach in Zugreihenfolge. draw() nimmt vom Ende des Stapels, der Stapel wird
   deshalb umgedreht abgelegt.
   ========================================================================= */
function newHandObj(cards,fromSplit,bet){
  return{cards,bet:bet,done:false,doubled:false,surrendered:false,
         fromSplit:!!fromSplit,splitAces:false,needsCard:false,result:null,payout:0};
}

function playRound(round,bankIn,opts){
  opts=opts||{};
  const trace=[];
  const shoe=round.cards.map(card).reverse();
  const draw=()=>{
    if(!shoe.length)throw new Error('Stapel leer in Runde: '+round.cards.join(','));
    return shoe.pop();
  };
  let bank=bankIn;
  const bet=round.bet;
  if(bet>bank)throw new Error('Einsatz groesser als Kapital');
  bank-=bet;

  const pCards=[draw(),draw()];
  const dealer=[draw()];
  const hole=draw();
  let hands=[newHandObj(pCards,false,bet)];

  const up=dealer[0].v;
  const dealerBJ=(up===11&&hole.v===10)||(up===10&&hole.v===11);
  const playerBJ=evalHand(pCards).total===21;

  if(dealerBJ||playerBJ){
    dealer.push(hole);
    const h=hands[0];h.done=true;
    if(dealerBJ&&playerBJ){h.result='push';h.payout=h.bet;bank+=h.bet}
    else if(dealerBJ){h.result='lose';h.payout=0}
    else{h.result='bj';h.payout=h.bet*(1+RULES.bjPays);bank+=h.payout}
    return{bank,net:bank-bankIn,hands,dealer,trace,natural:true};
  }

  const optsFor=h=>{
    const two=h.cards.length===2,pair=isPairHand(h.cards);
    return{
      canDouble:two&&!h.splitAces&&bank>=h.bet,
      canSplit:two&&pair&&hands.length<RULES.maxHands&&!h.splitAces&&
               !(h.fromSplit&&h.cards[0].v===11&&!RULES.rsa)&&bank>=h.bet,
      canSurrender:RULES.ls&&two&&!h.fromSplit&&hands.length===1
    };
  };

  let active=0,guard=0;
  while(guard++<60){
    const h=hands[active];
    if(h.done){
      let i=active,moved=false;
      while(true){
        i++;
        if(i>=hands.length){moved=false;break}
        const n=hands[i];
        if(n.needsCard){n.cards.push(draw());n.needsCard=false}
        if(n.splitAces){n.done=true;continue}
        if(evalHand(n.cards).total===21){n.done=true;continue}
        if(!n.done){active=i;moved=true;break}
      }
      if(!moved)break;
      continue;
    }
    const o=optsFor(h);
    const adv=strategy(h.cards,up,o);
    const a=bestLegal(adv.chain,o);
    trace.push({cards:h.cards.map(c=>c.r).join(','),up:dealer[0].r,action:a,key:adv.key});
    if(a==='HIT'){
      h.cards.push(draw());
      const e=evalHand(h.cards);
      if(e.bust||e.total===21)h.done=true;
    }else if(a==='STAND'){h.done=true}
    else if(a==='DOUBLE'){bank-=h.bet;h.bet*=2;h.doubled=true;h.cards.push(draw());h.done=true}
    else if(a==='SURRENDER'){h.surrendered=true;h.done=true}
    else if(a==='SPLIT'){
      const moved=h.cards.pop(),isA=moved.v===11;
      bank-=h.bet;
      const nh=newHandObj([moved],true,h.bet);
      h.fromSplit=true;
      if(isA){h.splitAces=true;nh.splitAces=true}
      nh.needsCard=true;
      hands.splice(active+1,0,nh);
      h.cards.push(draw());
      if(h.splitAces||evalHand(h.cards).total===21)h.done=true;
    }
  }

  dealer.push(hole);
  const live=hands.some(h=>!h.surrendered&&!evalHand(h.cards).bust);
  if(live){
    while(true){
      const e=evalHand(dealer);
      if(e.total<17){dealer.push(draw());continue}
      if(e.total===17&&e.soft&&RULES.h17){dealer.push(draw());continue}
      break;
    }
  }
  const de=evalHand(dealer);
  for(const h of hands){
    const pe=evalHand(h.cards);let r,pay=0;
    if(h.surrendered){r='surrender';pay=h.bet/2}
    else if(pe.bust){r='lose';pay=0}
    else if(isBJ(h)&&hands.length===1){r='bj';pay=h.bet*(1+RULES.bjPays)}
    else if(de.bust||pe.total>de.total){r='win';pay=h.bet*2}
    else if(pe.total<de.total){r='lose';pay=0}
    else{r='push';pay=h.bet}
    h.result=r;h.payout=pay;bank+=pay;
  }
  return{bank,net:bank-bankIn,hands,dealer,trace,leftover:shoe.length};
}

function playLevel(level){
  let bank=level.start;
  const rounds=[];
  for(const r of level.rounds){
    const res=playRound(r,bank);
    bank=res.bank;
    rounds.push(res);
  }
  return{final:bank,net:bank-level.start,rounds};
}

module.exports={RULES,card,evalHand,isPairHand,isBJ,strategy,bestLegal,basePlay,playRound,playLevel};
