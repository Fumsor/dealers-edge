/* Levelbau.

   Vorgegeben wird pro Runde nur der Lehrinhalt: die beiden Spielerkarten und
   die Upcard des Dealers. Alles danach (Hole Card und Folgekarten) wird
   gesucht, bis eine Kartenfolge gefunden ist, die

     - beim perfekten Spiel die vorgesehene Entscheidung ausloest,
     - das gewuenschte Rundenergebnis liefert (win / lose / push),
     - kein Natural auf einer der beiden Seiten erzeugt.

   Damit ist das Ziel jedes Levels ein Rechenergebnis der Engine und keine
   gesetzte Zahl. Gesucht wird mit festem Seed, der Lauf ist reproduzierbar.
*/
const {playRound}=require('./engine');
const {bestNet}=require('./optimal');

/* deterministischer RNG, damit derselbe Aufruf dieselben Level erzeugt */
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

const POOL=['A','2','3','4','5','6','7','8','9','10','10','10','10'];
const FILL=['7','5','9','4','8','6','10','3','9','5','7','6','8','4','10','2','9','7'];

function outcomeOf(res){
  /* Ein Ergebnis pro Runde: gewonnen, verloren oder Push, ueber alle Haende summiert. */
  if(res.net>0)return 'win';
  if(res.net<0)return 'lose';
  return 'push';
}

function search(spec,bank,rng,tries){
  const [p1,p2,up]=spec.spot;
  const wantKeys=spec.keys||[];
  for(let t=0;t<tries;t++){
    const tail=[];
    for(let i=0;i<9;i++)tail.push(POOL[Math.floor(rng()*POOL.length)]);
    const cards=[p1,p2,up,...tail,...FILL];
    let res;
    try{res=playRound({bet:spec.bet,cards},bank)}catch(e){continue}
    if(res.natural)continue;
    if(!res.trace.length)continue;
    if(outcomeOf(res)!==spec.want)continue;
    const keys=res.trace.map(x=>x.key);
    if(wantKeys.length&&!wantKeys.every(k=>keys.includes(k)))continue;
    if(cards.length<24)continue;
    /* Kein Level darf einen Fehler belohnen: das richtige Spiel muss in dieser
       gestellten Runde mindestens so gut abschneiden wie jede andere legale
       Zugfolge. Sonst lernt der Spieler, dass sich Abweichen auszahlt (E7). */
    const opt=bestNet(cards,spec.bet,bank);
    if(!opt.ok)continue;
    if(res.net<opt.best)continue;
    return{cards,res,best:opt.best};
  }
  return null;
}

function build(defs){
  const rng=mulberry(20260902);
  const levels=[];
  for(const d of defs){
    let bank=d.start;
    const rounds=[];
    const traces=[];
    for(const spec of d.rounds){
      const hit=search({...spec,bet:d.bet},bank,rng,400000);
      if(!hit){
        console.error(`KEINE LOESUNG: Level ${d.id}, Spot ${spec.spot.join('/')} want=${spec.want}`);
        process.exit(1);
      }
      rounds.push({bet:d.bet,cards:hit.cards});
      traces.push(hit.res);
      bank=hit.res.bank;
    }
    levels.push({id:d.id,key:d.key,start:d.start,bet:d.bet,target:bank,
                 net:bank-d.start,rounds,traces});
  }
  return levels;
}

module.exports={build,outcomeOf};
