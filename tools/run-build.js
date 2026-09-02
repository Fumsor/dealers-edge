const {build}=require('./build-levels');
const {DESIGN}=require('./design');
const fs=require('fs');
const L=build(DESIGN);
console.log('='.repeat(76));
console.log('LEVELBAU — Ziele aus perfektem Spiel der Engine');
console.log('='.repeat(76));
for(const l of L){
  console.log(`\nLEVEL ${l.id}  Start $${l.start}  ->  ZIEL $${l.target}   (${l.net>=0?'+':''}$${l.net})`);
  l.traces.forEach((r,i)=>{
    const acts=r.trace.map(t=>t.action).join(' ');
    const hands=r.hands.map(h=>h.cards.map(c=>c.r).join('')+':'+h.result).join(' | ');
    console.log(`   R${i+1}  ${acts.padEnd(22)} ${hands.padEnd(34)} D:${r.dealer.map(c=>c.r).join(' ').padEnd(12)} ${r.net>=0?'+':''}${r.net}`);
  });
  const keys=new Set(); l.traces.forEach(r=>r.trace.forEach(t=>keys.add(t.key)));
  console.log(`   trainiert: ${[...keys].sort().join(', ')}`);
}
fs.writeFileSync('levels.built.json',JSON.stringify(L.map(l=>({id:l.id,key:l.key,start:l.start,bet:l.bet,target:l.target,rounds:l.rounds.map(r=>r.cards)})),null,1));
console.log('\nGeschrieben: levels.built.json');
