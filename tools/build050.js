/* Levelbau 0.5.0.

   Ablauf je Level:
   1. Lehr-Situationen aus den Themen-Pools ziehen.
   2. Dealerkarten suchen, bis das gewuenschte Rundenergebnis herauskommt.
      Wiederholen, bis perfektes Spiel deutlich im Plus endet.
   3. Fehlertoleranz K aus der Levellaenge ableiten.
   4. Das Ziel so hoch setzen, wie es gerade noch die Zusage haelt:
      "mit bis zu K Fehlern erreichen mindestens 90 Prozent der Laeufe das Ziel."
      Das ist keine gesetzte Zahl, sondern das Ergebnis einer Simulation ueber
      das realistische Fehlermodell (E10).

   Fester Seed. Der Lauf ist reproduzierbar. */
const {playRound}=require('./engine');
const {passRate,countDecisions}=require('./mistakes');
const {POOLS,PLAN}=require('./design');
const fs=require('fs');

function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const POOL=['A','2','3','4','5','6','7','8','9','10','10','10','10'];
const FILL=['7','5','9','4','8','6','10','3','9','5','7','6','8','4','10','2','9','7','5','8'];
const RUNS=1200, MINPASS=0.90;

function search(spot,want,bet,bank,rng){
  for(let t=0;t<80000;t++){
    const tail=[];
    for(let i=0;i<10;i++)tail.push(POOL[Math.floor(rng()*POOL.length)]);
    const cards=[...spot,...tail,...FILL];
    let res;
    try{res=playRound({bet,cards},bank)}catch(e){continue}
    if(res.natural||!res.trace.length)continue;
    const out=res.net>0?'win':(res.net<0?'lose':'push');
    if(out!==want)continue;
    return{cards,res};
  }
  return null;
}

const rng=mulberry(20260902);
const built=[];
console.log('='.repeat(82));
console.log('LEVELBAU 0.5.0 — Ziel = hoechster Wert, der noch 90 % bei K Fehlern haelt');
console.log('='.repeat(82));

for(const pl of PLAN){
  const pools=pl.themes.map(t=>POOLS[t].slice());
  pools.forEach(p=>{for(let i=p.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[p[i],p[j]]=[p[j],p[i]]}});
  const spots=[];let ti=0;
  while(spots.length<pl.hands){const p=pools[ti++%pools.length];if(p.length)spots.push(p.pop())}

  /* Es werden mehrere Mischungen aus gewonnenen und verlorenen Haenden gebaut.
     Fuer jede wird ausgerechnet, welches Ziel noch die Zusage haelt und wie
     viele Fehler es vertraegt. Genommen wird die Mischung mit der hoechsten
     Toleranz — bei Gleichstand die mit dem hoeheren Ziel. Verlierende Haende
     bleiben ausdruecklich drin: richtiges Spiel verliert regelmaessig, und
     genau das soll der Spieler erleben (E7). */
  let rounds=null,traces=null,perfect=0,target=0,K=0;
  const cands=[];
  for(let loseEvery=3;loseEvery<=9;loseEvery++){
    let bank=pl.start;const rs=[],ts=[];let okAll=true;
    for(let i=0;i<spots.length;i++){
      const want=((i%loseEvery)===loseEvery-1)?'lose':'win';
      const hit=search(spots[i],want,pl.bet,bank,rng)||search(spots[i],'win',pl.bet,bank,rng)
               ||search(spots[i],'lose',pl.bet,bank,rng);
      if(!hit){okAll=false;break}
      rs.push(hit.cards.join(','));ts.push(hit.res);bank=hit.res.bank;
    }
    if(!okAll||bank<=pl.start)continue;

    /* Die Zusage ist ueber alle Level dieselbe: rund ein Viertel der
       Entscheidungen darf danebengehen. Daraus ergibt sich die Zielhoehe —
       je hoeher das Ziel, desto weniger Fehler traegt es. Gesucht wird das
       hoechste Ziel, das die Zusage noch haelt. Die Schwierigkeit kommt aus
       dem Inhalt der Level, nicht aus einer haerteren Toleranz. */
    const dec0=countDecisions(rs,pl.bet,pl.start);
    let wantK=Math.max(3,Math.round(dec0*0.25));
    let bestT=0,bestK=0;
    while(wantK>=3&&!bestT){
      for(let cand=bank;cand>=pl.start+100;cand-=50){
        if(passRate(rs,pl.bet,pl.start,cand,wantK,RUNS,90000+pl.id)>=MINPASS){bestT=cand;bestK=wantK;break}
      }
      if(!bestT)wantK--;
    }
    /* Mindestens ein Fuenftel der Haende muss auch bei richtigem Spiel
       verloren gehen. Ein Level, in dem korrektes Spiel immer gewinnt,
       bringt genau das Falsche bei (E7). */
    const loses=ts.filter(r=>r.net<0).length;
    const enough = loses/rs.length >= 0.2;
    cands.push({K:bestK,target:bestT,rounds:rs,traces:ts,perfect:bank,loses,enough});
  }
  /* Erst die Mischungen mit genug verlorenen Haenden, dann nach Toleranz und
     Zielhoehe sortiert. Faellt keine durch, wird die Bedingung gelockert und
     das im Bericht vermerkt. */
  const rank=a=>[a.K,a.target];
  let pick=cands.filter(c=>c.enough&&c.K>=3).sort((a,b)=>rank(b)[0]-rank(a)[0]||rank(b)[1]-rank(a)[1])[0];
  let relaxed=false;
  if(!pick){pick=cands.filter(c=>c.K>=3).sort((a,b)=>rank(b)[0]-rank(a)[0]||rank(b)[1]-rank(a)[1])[0];relaxed=!!pick}
  if(!pick){console.error('L'+pl.id+': keine Mischung mit mindestens 3 Fehlern Toleranz');process.exit(1)}
  ({K,target,rounds,traces,perfect}=pick);

  const rates=[];
  for(let k=0;k<=K+2;k++)rates.push(Math.round(passRate(rounds,pl.bet,pl.start,target,k,RUNS,91000+pl.id)*100));
  const dec=countDecisions(rounds,pl.bet,pl.start);
  const keys=new Set();traces.forEach(r=>r.trace.forEach(x=>keys.add(x.key)));
  const wins=traces.filter(r=>r.net>0).length,loses=traces.filter(r=>r.net<0).length;

  console.log(`\nLEVEL ${String(pl.id).padStart(2)}  ${pl.hands} Haende, ${dec} Entscheidungen  Start $${pl.start}`);
  console.log(`   perfekt $${perfect}  |  ZIEL $${target}  |  Puffer $${perfect-target}  |  Toleranz ${K} Fehler`);
  console.log(`   Ziel erreicht bei 0..${K+2} Fehlern: ${rates.map((r,i)=>i+':'+r+'%').join('  ')}`);
  console.log(`   ${wins} gewonnene / ${loses} verlorene Haende${relaxed?'   [Anteil verlorener Haende unter 20 % — vermerkt]':''}  ·  trainiert: ${[...keys].sort().join(', ')}`);

  built.push({id:pl.id,start:pl.start,bet:pl.bet,target,perfect,tolerance:K,
              decisions:dec,rates,rounds});
}
fs.writeFileSync('levels050.json',JSON.stringify(built,null,1));
console.log('\nGeschrieben: levels050.json');
