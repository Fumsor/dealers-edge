/* Leveldesign — nur der Lehrinhalt, keine Karten des Dealers.

   spot: [Spielerkarte 1, Spielerkarte 2, Upcard des Dealers]
   keys: Strategieschluessel, die beim perfekten Spiel vorkommen muessen
   want: gewuenschtes Rundenergebnis

   Bewusst enthaelt fast jedes Level mindestens eine Runde, in der richtiges
   Spiel trotzdem verliert. Das ist der Kern von E7: Die Entscheidung ist gut
   oder schlecht, nicht das Ergebnis. Die Summe bleibt trotzdem positiv, damit
   das Ziel oberhalb des Startkapitals liegt.

   Dealer-Ass als Upcard kommt hier nicht vor — Insurance laeuft ueber einen
   eigenen Zweig und wird spaeter nachgezogen (Backlog).
*/
const DESIGN=[
{ id:1, key:'l1', start:500, bet:50,
  rounds:[
    {spot:['10','6','7'],  keys:['hard.stiffhit'],   want:'win'},
    {spot:['9','4','5'],   keys:['hard.stiffstand'], want:'win'},
    {spot:['10','3','10'], keys:['hard.stiffhit'],   want:'lose'},
    {spot:['8','5','6'],   keys:['hard.stiffstand'], want:'win'},
    {spot:['10','7','9'],  keys:['hard.17plus'],     want:'win'}
  ]},

{ id:2, key:'l2', start:500, bet:50,
  rounds:[
    {spot:['6','5','7'],  keys:['hard.11double'], want:'win'},
    {spot:['7','3','4'],  keys:['hard.10double'], want:'win'},
    {spot:['5','4','5'],  keys:['hard.9double'],  want:'win'},
    {spot:['6','5','10'], keys:['hard.11double'], want:'lose'},
    {spot:['4','6','6'],  keys:['hard.10double'], want:'win'}
  ]},

{ id:3, key:'l3', start:500, bet:50,
  rounds:[
    {spot:['A','6','5'],  keys:['soft.17double'],   want:'win'},
    {spot:['A','2','6'],  keys:['soft.1314double'], want:'win'},
    {spot:['A','4','4'],  keys:['soft.1516double'], want:'win'},
    {spot:['A','8','6'],  keys:['soft.19'],         want:'lose'},
    {spot:['A','9','7'],  keys:['soft.20'],         want:'win'}
  ]},

{ id:4, key:'l4', start:600, bet:50,
  rounds:[
    {spot:['8','8','6'],  keys:['pair.8'], want:'win'},
    {spot:['A','A','5'],  keys:['pair.A'], want:'win'},
    {spot:['8','8','10'], keys:['pair.8'], want:'lose'},
    {spot:['A','A','6'],  keys:['pair.A'], want:'win'},
    {spot:['8','8','9'],  keys:['pair.8'], want:'win'}
  ]},

{ id:5, key:'l5', start:500, bet:50,
  rounds:[
    {spot:['10','10','6'], keys:['pair.10'], want:'win'},
    {spot:['5','5','6'],   keys:['pair.5'],  want:'win'},
    {spot:['10','10','5'], keys:['pair.10'], want:'win'},
    {spot:['5','5','4'],   keys:['pair.5'],  want:'lose'},
    {spot:['10','10','9'], keys:['pair.10'], want:'win'}
  ]},

{ id:6, key:'l6', start:500, bet:50,
  rounds:[
    {spot:['A','7','9'],  keys:['soft.18hit'],   want:'win'},
    {spot:['A','7','5'],  keys:['soft.18double'], want:'win'},
    {spot:['A','7','8'],  keys:['soft.18stand'], want:'win'},
    {spot:['A','7','2'],  keys:['soft.18stand'], want:'lose'},
    {spot:['A','7','10'], keys:['soft.18hit'],   want:'win'}
  ]},

{ id:7, key:'l7', start:500, bet:50,
  rounds:[
    {spot:['10','6','10'], keys:['surr.16v10'], want:'lose'},
    {spot:['10','5','10'], keys:['surr.15v10'], want:'lose'},
    {spot:['9','7','9'],   keys:['surr.16v9'],  want:'lose'},
    {spot:['10','6','6'],  keys:['hard.stiffstand'], want:'win'},
    {spot:['10','6','2'],  keys:['hard.stiffstand'], want:'win'}
  ]},

{ id:8, key:'l8', start:700, bet:50,
  rounds:[
    {spot:['6','6','5'], keys:['pair.6split'],  want:'win'},
    {spot:['7','7','6'], keys:['pair.7split'],  want:'win'},
    {spot:['3','3','6'], keys:['pair.23split'], want:'win'},
    {spot:['2','2','5'], keys:['pair.23split'], want:'lose'},
    {spot:['4','4','5'], keys:['pair.4split'],  want:'win'}
  ]},

{ id:9, key:'l9', start:600, bet:50,
  rounds:[
    {spot:['9','9','9'],  keys:['pair.9split'], want:'win'},
    {spot:['9','9','7'],  keys:['pair.9stand'], want:'win'},
    {spot:['10','2','3'], keys:['hard.12hit'],  want:'win'},
    {spot:['10','2','4'], keys:['hard.12stand'],want:'lose'},
    {spot:['A','A','10'], keys:['pair.A'],      want:'win'}
  ]},

{ id:10, key:'l10', start:800, bet:50,
  rounds:[
    {spot:['8','8','10'], keys:['pair.8'],        want:'win'},
    {spot:['A','7','6'],  keys:['soft.18double'], want:'win'},
    {spot:['10','6','10'],keys:['surr.16v10'],    want:'lose'},
    {spot:['5','5','9'],  keys:['pair.5'],        want:'win'},
    {spot:['A','A','5'],  keys:['pair.A'],        want:'win'},
    {spot:['9','2','4'],  keys:['hard.11double'], want:'lose'},
    {spot:['7','7','6'],  keys:['pair.7split'],   want:'win'}
  ]}
];
module.exports={DESIGN};
