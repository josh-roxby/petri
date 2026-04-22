import React, { useState, useEffect, useRef } from "react";

const AFF_COLORS = ['#a3dd28','#1fcc79','#ff5533','#44aaff','#cc66ff'];
const AFF_NAMES  = ['Organic','Enzyme','Acid','Mineral','Synthetic'];
const mono   = "'Space Mono',monospace";
const chakra = "'Chakra Petch',sans-serif";

function blobD(cx,cy,r,seed){
  const n=8,pts=Array.from({length:n},(_,i)=>{
    const a=(2*Math.PI*i/n)-Math.PI/2,noise=((seed*17*(i+1)+13)%100)/100,rad=r*(0.7+noise*0.6);
    return[cx+rad*Math.cos(a),cy+rad*Math.sin(a)];
  });
  let d=`M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for(let i=0;i<n;i++){
    const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n],t=0.38;
    const cp1x=p1[0]+(p2[0]-p0[0])*t/2,cp1y=p1[1]+(p2[1]-p0[1])*t/2;
    const cp2x=p2[0]-(p3[0]-p1[0])*t/2,cp2y=p2[1]-(p3[1]-p1[1])*t/2;
    d+=` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d+' Z';
}

// ── DATA ──────────────────────────────────────────────────────────────
const DISH_NODES = [
  {id:1,x:140,y:178,r:17,aff:0,state:'stable',   potency:72,volatility:0, purity:68,toxicity:12,chaos:25,parent:null,name:'Viridis-α'},
  {id:2,x:88, y:126,r:13,aff:1,state:'alive',    potency:55,volatility:22,purity:58,toxicity:8, chaos:32,parent:1,   name:'Lysate-β'},
  {id:3,x:196,y:122,r:15,aff:2,state:'volatile', potency:60,volatility:81,purity:44,toxicity:38,chaos:62,parent:1,   name:'Corros-γ'},
  {id:4,x:50, y:68, r:11,aff:3,state:'stable',   potency:48,volatility:0, purity:71,toxicity:6, chaos:18,parent:2,   name:'Ferric-α'},
  {id:5,x:126,y:54, r:14,aff:4,state:'alive',    potency:65,volatility:34,purity:52,toxicity:22,chaos:44,parent:2,   name:'Nullite-β'},
  {id:6,x:232,y:58, r:9, aff:0,state:'scar',     potency:0, volatility:0, purity:0, toxicity:0, chaos:0, parent:3,   name:'[COLLAPSED]'},
  {id:7,x:36, y:18, r:8, aff:3,state:'harvested',potency:0, volatility:0, purity:0, toxicity:0, chaos:0, parent:4,   name:'Ferric-α'},
];
const COMPOUNDS = [
  {id:'c1',name:'Ferric-α',      aff:3,tier:1,qty:3,potency:48,purity:71,toxicity:6, grade:'B',seed:9},
  {id:'c2',name:'Viridis Prime', aff:0,tier:2,qty:1,potency:82,purity:84,toxicity:10,grade:'A',seed:4},
  {id:'c3',name:'Lysate-β',      aff:1,tier:1,qty:2,potency:55,purity:58,toxicity:8, grade:'B',seed:7},
  {id:'c4',name:'Nullite Trace', aff:4,tier:1,qty:5,potency:40,purity:62,toxicity:18,grade:'C',seed:12},
  {id:'c5',name:'Ferric-γ',      aff:3,tier:2,qty:1,potency:74,purity:66,toxicity:14,grade:'A',seed:6},
];
const MATERIALS = [
  {id:'m1',name:'Stabiliser',      qty:6,max:8, shape:'diamond'},
  {id:'m2',name:'Basic Ingredient',qty:3,max:5, shape:'hex'},
  {id:'m3',name:'Plasm/Gel',       qty:1,max:3, shape:'nested'},
  {id:'m4',name:'Bio-Inc. Fuel',   qty:0,max:2, shape:'triangle'},
  {id:'m5',name:'Catalyst Pack',   qty:4,max:5, shape:'cross'},
  {id:'m6',name:'Antidote Vial',   qty:2,max:4, shape:'pill'},
];
const DISCOVERIES = [
  {id:'d1', name:'Viridis-α',    aff:0,tier:1,found:'3d ago',rarity:'Common'},
  {id:'d2', name:'Viridis Prime',aff:0,tier:2,found:'1d ago',rarity:'Uncommon'},
  {id:'d3', name:'Lysate-β',     aff:1,tier:1,found:'3d ago',rarity:'Common'},
  {id:'d4', name:'Lysate-Fused', aff:1,tier:2,found:'5h ago', rarity:'Rare'},
  {id:'d5', name:'Corros-γ',     aff:2,tier:1,found:'2d ago',rarity:'Common'},
  {id:'d6', name:'Ferric-α',     aff:3,tier:1,found:'4d ago',rarity:'Common'},
  {id:'d7', name:'Ferric-γ',     aff:3,tier:2,found:'1d ago',rarity:'Uncommon'},
  {id:'d8', name:'Nullite Trace', aff:4,tier:1,found:'2d ago',rarity:'Common'},
  {id:'d9', name:'???',           aff:-1,tier:2,found:null,   rarity:'Rare'},
  {id:'d10',name:'???',           aff:-1,tier:2,found:null,   rarity:'Rare'},
  {id:'d11',name:'???',           aff:-1,tier:3,found:null,   rarity:'Epic'},
  {id:'d12',name:'???',           aff:-1,tier:3,found:null,   rarity:'Epic'},
];
const SKILL_TREES = {
  harvest:{
    nodes:[
      {id:'h0',x:150,y:28, label:'Basic Harvest',   desc:'Unlock harvesting for Tier 1 compounds.',                   cost:0,  unlocked:true, active:true},
      {id:'h1',x:75, y:92, label:'Success Rate I',  desc:'+15% harvest success chance across all tiers.',             cost:20, unlocked:true, active:false},
      {id:'h2',x:225,y:92, label:'Yield Boost',     desc:'+1 to base harvest quantity per successful harvest.',       cost:20, unlocked:false,active:false},
      {id:'h3',x:35, y:160,label:'Harvest Speed',   desc:'-25% harvest cooldown timer on all harvests.',             cost:40, unlocked:false,active:false},
      {id:'h4',x:150,y:160,label:'Tier 2 Unlock',   desc:'Unlock harvesting of Tier 2 rarity compounds.',            cost:60, unlocked:false,active:false},
      {id:'h5',x:265,y:160,label:'Quality Grade',   desc:'+1 quality grade on harvests from stable nodes.',          cost:40, unlocked:false,active:false},
      {id:'h6',x:90, y:232,label:'Unstable Harvest',desc:'Harvesting unstable nodes no longer spikes volatility.',   cost:80, unlocked:false,active:false},
      {id:'h7',x:220,y:232,label:'Double Yield',    desc:'20% chance of double yield on Rare+ harvests.',            cost:80, unlocked:false,active:false},
    ],
    edges:[['h0','h1'],['h0','h2'],['h1','h3'],['h1','h4'],['h2','h4'],['h2','h5'],['h4','h6'],['h4','h7']]
  },
  funding:{
    nodes:[
      {id:'f0',x:150,y:28, label:'Market Access', desc:'Unlock the store. Buy and sell compounds.',                   cost:0,  unlocked:true, active:true},
      {id:'f1',x:75, y:92, label:'Fast Shipments',desc:'Stabiliser shipment interval −20%.',                         cost:15, unlocked:true, active:false},
      {id:'f2',x:225,y:92, label:'Sale Margin I', desc:'+10% to all compound daily sale prices.',                    cost:25, unlocked:false,active:false},
      {id:'f3',x:35, y:160,label:'Queue +2',      desc:'Shipment queue cap 3→5 per type.',                           cost:35, unlocked:false,active:false},
      {id:'f4',x:150,y:160,label:'Plasm Supply',  desc:'Unlock Plasm/Gel free shipments every 6 hrs.',              cost:55, unlocked:false,active:false},
      {id:'f5',x:265,y:160,label:'Sale Margin II',desc:'+15% additional to compound sale prices.',                   cost:45, unlocked:false,active:false},
      {id:'f6',x:90, y:232,label:'Rare Rotation', desc:'Store rotation includes 1 Rare slot daily.',                cost:75, unlocked:false,active:false},
      {id:'f7',x:220,y:232,label:'Epic Slot',     desc:'Unlock Epic tier items in Special store rotation.',         cost:100,unlocked:false,active:false},
    ],
    edges:[['f0','f1'],['f0','f2'],['f1','f3'],['f1','f4'],['f2','f4'],['f2','f5'],['f4','f6'],['f5','f7']]
  },
  tooling:{
    nodes:[
      {id:'t0',x:150,y:28, label:'Bio-Incinerator',desc:'Unlock discard tool. High collateral at low skill.',        cost:0,  unlocked:true, active:true},
      {id:'t1',x:75, y:92, label:'Precision I',    desc:'-30% chance of damaging neighbours on discard.',           cost:25, unlocked:true, active:false},
      {id:'t2',x:225,y:92, label:'Catalyse Boost', desc:'15% chance of an extra child on Catalyse.',               cost:20, unlocked:false,active:false},
      {id:'t3',x:35, y:160,label:'Precision II',   desc:'-40% more collateral. Parent nodes now protected.',        cost:50, unlocked:false,active:false},
      {id:'t4',x:150,y:160,label:'Fuel Efficiency',desc:'Incinerator fuel consumption −30%.',                       cost:45, unlocked:false,active:false},
      {id:'t5',x:265,y:160,label:'Contain Plus',   desc:'Contained nodes can still be harvested while sealed.',    cost:40, unlocked:false,active:false},
      {id:'t6',x:90, y:232,label:'Surgical Strike',desc:'Zero-collateral discard. Costs 3× fuel.',                 cost:90, unlocked:false,active:false},
      {id:'t7',x:220,y:232,label:'Cooldown −20%',  desc:'-20% cooldown on Stabilise, Catalyse, Contain.',          cost:70, unlocked:false,active:false},
    ],
    edges:[['t0','t1'],['t0','t2'],['t1','t3'],['t1','t4'],['t2','t4'],['t2','t5'],['t3','t6'],['t4','t7']]
  }
};
const STORE_BUY=[
  {id:'b1',name:'Viridis Seed', aff:0,tier:1,price:120,stock:3},
  {id:'b2',name:'Lysate Base',  aff:1,tier:1,price:95, stock:5},
  {id:'b3',name:'Ferric Salt',  aff:3,tier:1,price:80, stock:4},
  {id:'b4',name:'Nullite Trace',aff:4,tier:1,price:150,stock:2},
  {id:'b5',name:'Corrosive-A',  aff:2,tier:2,price:340,stock:1},
];
const STORE_SELL=[
  {id:'s1',name:'Ferric-α',     aff:3,tier:1,qty:3,min:90, max:140,today:118},
  {id:'s2',name:'Viridis Prime',aff:0,tier:2,qty:1,min:280,max:420,today:355},
  {id:'s3',name:'Nullite Trace',aff:4,tier:1,qty:5,min:60, max:100,today:88},
];
const STORE_SPECIAL=[
  {id:'sp1',name:'Crystalline Catalyst',price:880,timeLeft:'4h 22m',desc:'Produces 3× child nodes on next Catalyse. Single use.'},
];
const SHIPMENTS=[
  {id:'sh1',name:'Stabiliser Pack',   shape:'diamond',qty:8, cadence:'30 min',ready:true},
  {id:'sh2',name:'Basic Ingredients', shape:'hex',    qty:4, cadence:'2 hrs', ready:true},
  {id:'sh3',name:'Plasm/Gel',         shape:'nested', qty:2, cadence:'6 hrs', ready:false,timeLeft:'2h 14m'},
  {id:'sh4',name:'Catalyst Pack',     shape:'cross',  qty:3, cadence:'4 hrs', ready:false,timeLeft:'55m'},
];

// ── GEOMETRIC ICONS ───────────────────────────────────────────────────
function GeomIcon({shape,size=28,opacity=0.65}){
  const s=size,h=s/2,q=s/4;
  const b={stroke:'white',strokeWidth:1.5,fill:'none',strokeLinecap:'square',strokeLinejoin:'miter'};
  return(
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{display:'block',flexShrink:0,opacity}}>
      {shape==='diamond' &&<polygon points={`${h},${q*.55} ${s-q*.55},${h} ${h},${s-q*.55} ${q*.55},${h}`} {...b}/>}
      {shape==='hex'     &&<polygon points={[0,1,2,3,4,5].map(i=>{const a=(Math.PI/3)*i-Math.PI/6;return`${(h+h*.72*Math.cos(a)).toFixed(1)},${(h+h*.72*Math.sin(a)).toFixed(1)}`;}).join(' ')} {...b}/>}
      {shape==='nested'  &&<><rect x={q*.4} y={q*.4} width={h*1.6} height={h*1.6} rx={1.5} {...b}/><rect x={q*1.1} y={q*1.1} width={h*.6} height={h*.6} rx={1} fill="white" stroke="none" opacity={.5}/></>}
      {shape==='triangle'&&<polygon points={`${h},${q*.5} ${s-q*.5},${s-q*.55} ${q*.5},${s-q*.55}`} {...b}/>}
      {shape==='cross'   &&<><line x1={h} y1={q*.55} x2={h} y2={s-q*.55} {...b}/><line x1={q*.55} y1={h} x2={s-q*.55} y2={h} {...b}/></>}
      {shape==='pill'    &&<rect x={q*.7} y={q*.32} width={h*.85} height={h*1.35} rx={h*.42} {...b}/>}
    </svg>
  );
}

// ── SHARED ────────────────────────────────────────────────────────────
function Grid(){
  return <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:1,backgroundImage:`linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)`,backgroundSize:'28px 28px',opacity:.28}}/>;
}
function AffBadge({aff}){
  if(aff<0) return <span style={{color:'rgba(255,255,255,0.2)',fontSize:7.5,fontFamily:mono}}>???</span>;
  const c=AFF_COLORS[aff];
  return <span style={{display:'inline-block',padding:'2px 7px',borderRadius:8,background:c+'18',border:`1px solid ${c}44`,color:c,fontSize:7.5,fontFamily:chakra,letterSpacing:.4}}>{AFF_NAMES[aff]}</span>;
}
function BlobIcon({aff,r=18,seed=7}){
  const c=aff>=0?AFF_COLORS[aff]:'rgba(255,255,255,0.15)',s=r+10;
  return(
    <svg width={s*2} height={s*2} viewBox={`0 0 ${s*2} ${s*2}`} style={{display:'block',flexShrink:0}}>
      <path d={blobD(s,s,r+4,seed+2)} fill={c+'0a'} stroke="none"/>
      <path d={blobD(s,s,r,seed)} fill={c+'22'} stroke={c} strokeWidth="1.2"/>
      <circle cx={s} cy={s} r={r*.36} fill={c} opacity=".65"/>
      <circle cx={s} cy={s} r={r*.12} fill="white" opacity=".45"/>
    </svg>
  );
}
function Pill({children,active,onClick}){
  return <button onClick={onClick} style={{padding:'6px 14px',borderRadius:20,border:`1px solid ${active?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.09)'}`,background:active?'rgba(255,255,255,0.08)':'transparent',color:active?'#fff':'rgba(255,255,255,0.35)',fontSize:9,fontFamily:mono,letterSpacing:.5,cursor:'pointer',whiteSpace:'nowrap'}}>{children}</button>;
}

// ── NODE MODAL — centred, 60% width ───────────────────────────────────
const STATE_COLOR={stable:'#1fcc79',alive:'rgba(255,255,255,0.5)',volatile:'#ff5533',scar:'rgba(255,255,255,0.22)',harvested:'rgba(255,255,255,0.28)'};

function NodeModal({node, onClose}){
  const ref  = useRef(null);
  const c    = AFF_COLORS[node.aff];
  const isLive = !['scar','harvested'].includes(node.state);

  // close on outside click
  useEffect(()=>{
    const h = e => { if(ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  },[onClose]);

  // action buttons — white chrome, colored dot only
  const ACTIONS=[
    {label:'Catalyse', dot:'#f5c842',   disabled:!isLive},
    {label:'Harvest',  dot:'#1fcc79',  disabled:['scar','harvested'].includes(node.state)},
    {label:'Contain',  dot:'#44aaff',  disabled:!isLive},
    {label:'Discard',  dot:'#ff5533',  disabled:node.state==='scar'},
  ];

  // volatility color — only stat that gets color treatment
  const volColor = node.volatility===0 ? '#1fcc79'
    : node.volatility < 30 ? 'rgba(180,220,100,0.8)'
    : node.volatility < 60 ? 'rgba(255,200,50,0.85)'
    : '#ff5533';

  return(
    <div style={{
      position:'absolute',inset:0,zIndex:60,
      display:'flex',alignItems:'center',justifyContent:'center',
      background:'rgba(0,0,0,0.55)',
      backdropFilter:'blur(2px)',
    }}>
      <div ref={ref} style={{
        width:'60%',
        background:'rgba(6,6,6,0.99)',
        border:'1.5px solid rgba(255,255,255,0.18)',
        borderRadius:16,
        overflow:'hidden',
        boxShadow:`0 24px 64px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.05)`,
      }}>
        {/* top accent bar — affinity color, only decorative element */}
        <div style={{height:3,background:`linear-gradient(90deg,${c},${c}44)`}}/>

        <div style={{padding:'14px 14px 16px'}}>

          {/* ── HEADER ── */}
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                {/* affinity dot — only color in the header */}
                <div style={{width:7,height:7,borderRadius:'50%',background:c,boxShadow:`0 0 8px ${c}`,flexShrink:0}}/>
                <span style={{color:'#fff',fontSize:10,fontFamily:mono,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{node.name}</span>
              </div>
              <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                {/* affinity chip — color allowed */}
                <AffBadge aff={node.aff}/>
                {/* state — white/grey only */}
                <span style={{color:'rgba(255,255,255,0.38)',fontSize:7,fontFamily:chakra,letterSpacing:.6,textTransform:'uppercase'}}>{node.state}</span>
              </div>
            </div>
            <button onClick={onClose} style={{width:22,height:22,borderRadius:11,border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:'rgba(255,255,255,0.35)',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginLeft:8}}>×</button>
          </div>

          {/* compound ID strip — grey */}
          <div style={{padding:'5px 8px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:7,marginBottom:12}}>
            <span style={{color:'rgba(255,255,255,0.2)',fontSize:6.5,fontFamily:mono,letterSpacing:.5}}>ID </span>
            <span style={{color:'rgba(255,255,255,0.45)',fontSize:6.5,fontFamily:mono}}>{`AFF-${node.aff}-${String(node.id).padStart(3,'0')}-T1`}</span>
          </div>

          {/* ── STAT GRID 2×2 ── */}
          {isLive&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5,marginBottom:12}}>
              {[
                {l:'POTENCY',    v:node.potency,    barC:'rgba(255,255,255,0.3)',  valC:'rgba(255,255,255,0.75)'},
                {l:'VOLATILITY', v:node.volatility,  barC:volColor,                valC:volColor},
                {l:'PURITY',     v:node.purity,      barC:'rgba(255,255,255,0.3)',  valC:'rgba(255,255,255,0.75)'},
                {l:'CHAOS',      v:node.chaos,        barC:'rgba(255,255,255,0.22)', valC:'rgba(255,255,255,0.55)'},
              ].map(({l,v,barC,valC})=>(
                <div key={l} style={{padding:'8px 9px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9}}>
                  <div style={{color:'rgba(255,255,255,0.25)',fontSize:6,fontFamily:mono,letterSpacing:.5,marginBottom:4}}>{l}</div>
                  <div style={{width:'100%',height:2,background:'rgba(255,255,255,0.06)',borderRadius:1,marginBottom:5}}>
                    <div style={{width:`${v}%`,height:'100%',background:barC,borderRadius:1}}/>
                  </div>
                  <div style={{color:valC,fontSize:13,fontFamily:mono,fontWeight:700,lineHeight:1}}>{v}</div>
                </div>
              ))}
            </div>
          )}

          {/* scar / harvested notice */}
          {!isLive&&(
            <div style={{padding:'12px',background:'rgba(255,255,255,0.02)',borderRadius:9,marginBottom:12,textAlign:'center'}}>
              <span style={{color:'rgba(255,255,255,0.25)',fontSize:9,fontFamily:mono}}>
                {node.state==='scar'?'— branch collapsed —':'— already harvested —'}
              </span>
            </div>
          )}

          {/* ── ACTION GRID 2×2 — white chrome, colored dot ── */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5,marginBottom:5}}>
            {ACTIONS.map(a=>(
              <button key={a.label} disabled={a.disabled} style={{
                padding:'9px 6px',
                border:`1px solid ${a.disabled?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.14)'}`,
                borderRadius:9,
                background:a.disabled?'transparent':'rgba(255,255,255,0.04)',
                color:a.disabled?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.7)',
                fontSize:8.5,fontFamily:chakra,letterSpacing:.3,
                cursor:a.disabled?'default':'pointer',
                textAlign:'center',
                display:'flex',alignItems:'center',justifyContent:'center',gap:5,
              }}>
                <span style={{
                  width:5,height:5,borderRadius:'50%',flexShrink:0,display:'inline-block',
                  background:a.disabled?'rgba(255,255,255,0.1)':a.dot,
                  boxShadow:a.disabled?'none':`0 0 5px ${a.dot}88`,
                }}/>
                {a.label}
              </button>
            ))}
          </div>

          {/* ── STABILISE — full width primary, white ── */}
          <button disabled={!isLive||node.volatility===0} style={{
            width:'100%',padding:'11px',
            border:`1px solid ${(!isLive||node.volatility===0)?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.4)'}`,
            borderRadius:9,
            background:(!isLive||node.volatility===0)?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.1)',
            color:(!isLive||node.volatility===0)?'rgba(255,255,255,0.2)':'#ffffff',
            fontSize:9.5,fontFamily:chakra,fontWeight:600,letterSpacing:1,
            cursor:(!isLive||node.volatility===0)?'default':'pointer',
            textAlign:'center',
            display:'flex',alignItems:'center',justifyContent:'center',gap:7,
          }}>
            {(!isLive||node.volatility===0) ? null : (
              <span style={{width:5,height:5,borderRadius:'50%',background:'#fff',boxShadow:'0 0 6px rgba(255,255,255,0.6)',display:'inline-block',flexShrink:0}}/>
            )}
            STABILISE
          </button>

        </div>
      </div>
    </div>
  );
}

// ── PETRI DISH ────────────────────────────────────────────────────────
const DISH=264;
function PetriDish({tick,onNodeTap}){
  const pulse=0.3+Math.sin(tick*.09)*.12;
  return(
    <svg viewBox="0 0 280 210" width="100%" height="100%" style={{cursor:'default'}}>
      {DISH_NODES.filter(n=>n.parent).map(n=>{
        const p=DISH_NODES.find(x=>x.id===n.parent),scar=n.state==='scar';
        const mx=(n.x+p.x)/2+(((n.id*9+p.id*7)%24)-12)*.7,my=(n.y+p.y)/2+(((n.id*11+p.id*5)%20)-10)*.7;
        return <path key={`e${n.id}`} d={`M ${p.x},${p.y} Q ${mx},${my} ${n.x},${n.y}`} fill="none" stroke={scar?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.13)'} strokeWidth={scar?.5:1.1} strokeLinecap="round"/>;
      })}
      {DISH_NODES.map((n,ni)=>{
        const c=AFF_COLORS[n.aff],vol=n.state==='volatile',scar=n.state==='scar',harv=n.state==='harvested',stable=n.state==='stable';
        const jx=vol?(tick%2===0?1.7:-1.7):0,jy=vol?(tick%3===0?1.1:-1):0,bs=n.id*13+ni*7;
        const p1=0.12+Math.sin(tick*.08+ni)*.07;
        return(
          <g key={n.id} transform={`translate(${jx},${jy})`} onClick={()=>onNodeTap(n)} style={{cursor:'pointer'}}>
            {!scar&&!harv&&<path d={blobD(n.x,n.y,n.r+16,bs+8)} fill={c+'06'} stroke="none"/>}
            {!scar&&!harv&&<path d={blobD(n.x,n.y,n.r+9, bs+6)} fill={c+'09'} stroke="none"/>}
            {!scar&&!harv&&<path d={blobD(n.x,n.y,n.r+4, bs+4)} fill="none" stroke={c} strokeWidth=".3" opacity={stable?p1*1.5:p1}/>}
            {stable&&<path d={blobD(n.x,n.y,n.r+11,bs+2)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth=".5" opacity={pulse*1.2}/>}
            {vol&&<path d={blobD(n.x,n.y,n.r+6,bs+5)} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1" opacity={0.4+Math.sin(tick*.45)*.35}/>}
            {!scar&&!harv&&<path d={blobD(n.x,n.y,n.r+1,bs+1)} fill={c+'10'} stroke="none"/>}
            <path d={blobD(n.x,n.y,n.r,bs)} fill={scar?'rgba(20,20,20,.85)':harv?'transparent':c+'25'} stroke={scar?'rgba(255,255,255,0.07)':harv?c+'44':c} strokeWidth={scar?.5:harv?.8:1.5} strokeDasharray={harv?'4,3':undefined} opacity={scar?.35:1}/>
            {!scar&&!harv&&<circle cx={n.x} cy={n.y} r={n.r*.4} fill={c} opacity={vol?0.35+Math.sin(tick*.4)*.38:stable?.72:.55}/>}
            {!scar&&!harv&&<circle cx={n.x} cy={n.y} r={n.r*.13} fill="white" opacity={stable?.5:.2}/>}
            {scar&&<text x={n.x} y={n.y+4} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="9">×</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ── PETRI SWITCHER ────────────────────────────────────────────────────
const PETRI_DISHES=[
  {id:1,name:'Dish Alpha',nodes:7,stable:2,volatile:1,active:true},
  {id:2,name:'Dish Beta', nodes:4,stable:4,volatile:0,active:false},
  {id:3,name:'Dish Gamma',nodes:0,stable:0,volatile:0,active:false,empty:true},
];
function PetriSwitcher({onClose}){
  return(
    <div style={{position:'absolute',inset:0,zIndex:60,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',background:'#0d0d0d',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:20}}>
        <div style={{color:'#fff',fontSize:12,fontFamily:mono,fontWeight:700,marginBottom:4}}>Select Dish</div>
        <div style={{color:'rgba(255,255,255,0.3)',fontSize:8,fontFamily:mono,marginBottom:18}}>3 slots · next at LVL 12</div>
        {PETRI_DISHES.map(d=>(
          <div key={d.id} onClick={onClose} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 14px',marginBottom:8,borderRadius:12,border:`1px solid ${d.active?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.07)'}`,background:d.active?'rgba(255,255,255,0.05)':'transparent',cursor:'pointer'}}>
            <div style={{width:44,height:44,borderRadius:'50%',border:'1.5px solid rgba(255,255,255,0.1)',background:'rgba(10,10,10,0.9)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              {d.empty?<span style={{color:'rgba(255,255,255,0.15)',fontSize:18}}>+</span>:
                <svg viewBox="0 0 44 44" width="40" height="40">
                  {[0,1,2].map(i=><path key={i} d={blobD(14+i*8,22+Math.sin(i)*5,4+i*.5,i*7+3)} fill={AFF_COLORS[i]} opacity=".55"/>)}
                </svg>}
            </div>
            <div style={{flex:1}}>
              <div style={{color:d.empty?'rgba(255,255,255,0.25)':'#fff',fontSize:11,fontFamily:mono,marginBottom:3}}>{d.name}</div>
              {!d.empty&&<div style={{display:'flex',gap:10}}>
                <span style={{color:'rgba(255,255,255,0.35)',fontSize:7.5,fontFamily:mono}}>{d.nodes} nodes</span>
                {d.volatile>0&&<span style={{color:'#ff5533',fontSize:7.5,fontFamily:mono}}>{d.volatile} volatile</span>}
                {d.stable>0&&<span style={{color:'#1fcc79',fontSize:7.5,fontFamily:mono}}>{d.stable} stable</span>}
              </div>}
            </div>
            {d.active&&<span style={{width:6,height:6,borderRadius:'50%',background:'#1fcc79',boxShadow:'0 0 8px #1fcc7988',display:'block',flexShrink:0}}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── LAB SCREEN ────────────────────────────────────────────────────────
function LabScreen({tick,onNodeTap,onPetriSwitch}){
  const wave=Math.sin(tick*.05)*2.5;
  return(
    <div style={{flex:1,position:'relative',overflow:'hidden'}}>

      {/* ambient particles */}
      {Array.from({length:6},(_,i)=>(
        <div key={i} style={{position:'absolute',width:1.5,height:1.5,borderRadius:'50%',background:'rgba(255,255,255,0.45)',left:(10+i*15)+'%',top:(14+Math.sin(tick*.03+i)*12)+'%',opacity:.1+Math.sin(tick*.04+i)*.09,pointerEvents:'none',zIndex:1}}/>
      ))}

      {/* top overlay bar — dish switcher + level */}
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:10,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 16px'}}>
        <button onClick={onPetriSwitch} style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',cursor:'pointer',color:'rgba(255,255,255,0.5)',fontFamily:mono,fontSize:8,letterSpacing:.5}}>
          ☰ Dish Alpha
        </button>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{color:'rgba(255,255,255,0.25)',fontSize:8,fontFamily:mono}}>LVL 4</span>
          <div style={{width:48,height:2,background:'rgba(255,255,255,0.07)',borderRadius:1}}><div style={{width:'68%',height:'100%',background:'rgba(255,255,255,0.3)',borderRadius:1}}/></div>
        </div>
      </div>

      {/* shipment card — top left overlay */}
      <div style={{position:'absolute',top:40,left:16,zIndex:10,padding:'7px 11px',background:'rgba(10,10,10,0.95)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,cursor:'pointer'}}>
        <div style={{color:'rgba(255,255,255,0.25)',fontSize:6.5,fontFamily:mono,letterSpacing:.5,marginBottom:2}}>INCOMING</div>
        <div style={{color:'rgba(255,255,255,0.7)',fontSize:8,fontFamily:mono}}>× 8 Stabiliser</div>
        <div style={{color:'rgba(255,255,255,0.3)',fontSize:6.5,fontFamily:mono,textAlign:'right',marginTop:2}}>COLLECT ▸</div>
      </div>

      {/* ── DISH — absolutely centred in the available space ── */}
      <div style={{
        position:'absolute',
        top:'50%', left:'50%',
        transform:'translate(-50%, -50%)',
        zIndex:2,
      }}>
        {/* porthole */}
        <div style={{position:'relative',width:DISH,height:DISH}}>
          <div style={{position:'absolute',inset:-9,borderRadius:'50%',border:'3px solid rgba(255,255,255,0.07)',boxShadow:'0 0 40px rgba(255,255,255,0.02),inset 0 0 30px rgba(0,0,0,0.6)'}}/>
          <div style={{position:'absolute',inset:-4,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.06)'}}/>
          {[0,90,180,270].map(deg=>(
            <div key={deg} style={{position:'absolute',top:'50%',left:'50%',width:6,height:6,borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.16)',transform:`rotate(${deg}deg) translateX(137px) translateY(-3px)`,transformOrigin:'0 3px'}}/>
          ))}
          <svg style={{position:'absolute',top:-18,left:0,width:'100%',overflow:'visible'}} viewBox={`0 0 ${DISH} 10`} preserveAspectRatio="none">
            <path d={`M0,${5+wave} Q${DISH*.25},${2+wave} ${DISH*.5},${5+wave} Q${DISH*.75},${8+wave} ${DISH},${5+wave}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
          </svg>
          <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'radial-gradient(ellipse,rgba(12,12,12,.85) 0%,rgba(4,4,4,.95) 100%)',border:'1px solid rgba(255,255,255,0.04)',overflow:'hidden'}}>
            <PetriDish tick={tick} onNodeTap={onNodeTap}/>
          </div>
        </div>

        {/* dish stats — sits just below the porthole, moves with it */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginTop:14}}>
          {['DISH 01','7 NODES','42% STABLE'].map((l,i)=>(
            <React.Fragment key={i}>
              {i>0&&<div style={{width:1,height:10,background:'rgba(255,255,255,0.1)'}}/>}
              <span style={{color:'rgba(255,255,255,0.2)',fontSize:7.5,fontFamily:mono}}>{l}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

    </div>
  );
}

// ── INVENTORY ─────────────────────────────────────────────────────────
function InventoryScreen(){
  const [tab,setTab]=useState('compounds');
  return(
    <div style={{height:'100%',display:'flex',flexDirection:'column',padding:'16px 16px 0',overflowY:'auto'}}>
      <div style={{color:'#fff',fontSize:14,fontFamily:mono,fontWeight:700,marginBottom:4}}>Inventory</div>
      <div style={{color:'rgba(255,255,255,0.3)',fontSize:8,fontFamily:mono,marginBottom:14}}>4,280 credits</div>
      <div style={{display:'flex',gap:6,marginBottom:18}}>
        <Pill active={tab==='compounds'} onClick={()=>setTab('compounds')}>Compounds</Pill>
        <Pill active={tab==='materials'} onClick={()=>setTab('materials')}>Materials</Pill>
      </div>
      {tab==='compounds'&&(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {COMPOUNDS.map(c=>(
            <div key={c.id} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 14px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12}}>
              <BlobIcon aff={c.aff} r={16} seed={c.seed}/>
              <div style={{flex:1}}>
                <div style={{color:'#fff',fontSize:10.5,fontFamily:mono,marginBottom:4}}>{c.name}</div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}><AffBadge aff={c.aff}/><span style={{color:'rgba(255,255,255,0.25)',fontSize:7,fontFamily:mono}}>T{c.tier}</span><span style={{color:'rgba(255,255,255,0.25)',fontSize:7,fontFamily:mono}}>Grade {c.grade}</span></div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{color:'#fff',fontSize:12,fontFamily:mono,fontWeight:700}}>×{c.qty}</div>
                <div style={{color:'rgba(255,255,255,0.3)',fontSize:7,fontFamily:mono}}>POT {c.potency}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab==='materials'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {MATERIALS.map(m=>(
            <div key={m.id} style={{padding:'14px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <GeomIcon shape={m.shape} size={28} opacity={m.qty===0?.2:.65}/>
                <span style={{color:m.qty===0?'rgba(255,255,255,0.2)':'#fff',fontSize:16,fontFamily:mono,fontWeight:700}}>{m.qty}</span>
              </div>
              <div style={{color:m.qty===0?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.55)',fontSize:9,fontFamily:mono,marginBottom:8}}>{m.name}</div>
              <div style={{width:'100%',height:2,background:'rgba(255,255,255,0.07)',borderRadius:1}}><div style={{width:`${(m.qty/m.max)*100}%`,height:'100%',background:'rgba(255,255,255,0.3)',borderRadius:1}}/></div>
              <div style={{color:'rgba(255,255,255,0.2)',fontSize:7,fontFamily:mono,marginTop:3}}>{m.qty}/{m.max}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SHIPMENTS ─────────────────────────────────────────────────────────
function ShipmentsScreen(){
  const [collected,setCollected]=useState({});
  return(
    <div style={{height:'100%',display:'flex',flexDirection:'column',padding:'16px 16px 0',overflowY:'auto'}}>
      <div style={{color:'#fff',fontSize:14,fontFamily:mono,fontWeight:700,marginBottom:4}}>Shipments</div>
      <div style={{color:'rgba(255,255,255,0.3)',fontSize:8,fontFamily:mono,marginBottom:18}}>Free supply · queue cap: 3</div>
      <div style={{color:'rgba(255,255,255,0.22)',fontSize:7.5,fontFamily:mono,letterSpacing:1.5,marginBottom:10}}>PENDING</div>
      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
        {SHIPMENTS.map(s=>{
          const done=collected[s.id];
          return(
            <div key={s.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px',background:done?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.04)',border:`1px solid ${done?'rgba(255,255,255,0.05)':s.ready?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.07)'}`,borderRadius:14}}>
              <div style={{width:44,height:44,borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <GeomIcon shape={s.shape} size={26} opacity={done?.2:.58}/>
              </div>
              <div style={{flex:1}}>
                <div style={{color:done?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.8)',fontSize:10.5,fontFamily:mono,marginBottom:3}}>{s.name}</div>
                <div style={{display:'flex',gap:8}}>
                  <span style={{color:'rgba(255,255,255,0.25)',fontSize:7.5,fontFamily:mono}}>×{s.qty}</span>
                  <span style={{color:'rgba(255,255,255,0.2)',fontSize:7.5,fontFamily:mono}}>every {s.cadence}</span>
                </div>
              </div>
              {done?<span style={{color:'#1fcc79',fontSize:8,fontFamily:mono}}>✓ done</span>
                :s.ready?<button onClick={()=>setCollected(p=>({...p,[s.id]:true}))} style={{padding:'7px 16px',borderRadius:10,border:'1px solid rgba(255,255,255,0.25)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:8.5,fontFamily:mono,cursor:'pointer',whiteSpace:'nowrap'}}>Collect</button>
                :<span style={{color:'rgba(255,255,255,0.35)',fontSize:8,fontFamily:mono}}>{s.timeLeft}</span>}
            </div>
          );
        })}
      </div>
      <div style={{color:'rgba(255,255,255,0.22)',fontSize:7.5,fontFamily:mono,letterSpacing:1.5,marginBottom:10}}>UPGRADES</div>
      <div style={{padding:'14px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12}}>
        <div style={{color:'rgba(255,255,255,0.4)',fontSize:9,fontFamily:mono,marginBottom:10}}>Unlock faster cadence via Funding skill tree</div>
        <div style={{display:'flex',gap:6}}>
          {[['Fast Shipments','−20% interval','15 XP'],['Queue +2','Cap 3→5','35 XP']].map(([t,d,x])=>(
            <div key={t} style={{flex:1,padding:'8px',background:'rgba(255,255,255,0.04)',borderRadius:8,border:'1px solid rgba(255,255,255,0.06)'}}>
              <div style={{color:'rgba(255,255,255,0.35)',fontSize:7,fontFamily:mono,marginBottom:2}}>{t}</div>
              <div style={{color:'rgba(255,255,255,0.6)',fontSize:8.5,fontFamily:mono}}>{d}</div>
              <div style={{color:'rgba(255,255,255,0.22)',fontSize:7,fontFamily:mono,marginTop:2}}>{x}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── DISCOVERIES ────────────────────────────────────────────────────────
function DiscoveriesScreen(){
  const [sel,setSel]=useState(null);
  const rC={Common:'rgba(255,255,255,0.4)',Uncommon:'#a3dd28',Rare:'#44aaff',Epic:'#cc66ff','???':'rgba(255,255,255,0.15)'};
  return(
    <div style={{height:'100%',display:'flex',flexDirection:'column',padding:'16px 16px 0',overflowY:'auto'}}>
      <div style={{color:'#fff',fontSize:14,fontFamily:mono,fontWeight:700,marginBottom:4}}>Discoveries</div>
      <div style={{color:'rgba(255,255,255,0.3)',fontSize:8,fontFamily:mono,marginBottom:8}}>8 / 12 found</div>
      <div style={{width:'100%',height:3,background:'rgba(255,255,255,0.07)',borderRadius:2,marginBottom:20}}><div style={{width:'66%',height:'100%',background:'rgba(255,255,255,0.3)',borderRadius:2}}/></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
        {DISCOVERIES.map(d=>{
          const known=d.aff>=0,active=sel?.id===d.id;
          return(
            <div key={d.id} onClick={()=>setSel(active?null:d)} style={{padding:'12px 8px',background:active?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.03)',border:`1px solid ${active?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.07)'}`,borderRadius:12,cursor:'pointer',textAlign:'center'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:6}}>
                {known?<BlobIcon aff={d.aff} r={13} seed={parseInt(d.id.slice(1))*3}/>:
                  <div style={{width:34,height:34,borderRadius:'50%',border:'1px dashed rgba(255,255,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{color:'rgba(255,255,255,0.15)',fontSize:14}}>?</span></div>}
              </div>
              <div style={{color:known?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.2)',fontSize:8,fontFamily:mono,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
              <div style={{color:rC[d.rarity],fontSize:7,fontFamily:mono}}>{d.rarity}</div>
            </div>
          );
        })}
      </div>
      {sel&&sel.aff>=0&&(
        <div style={{marginTop:16,padding:'16px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14}}>
          <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
            <BlobIcon aff={sel.aff} r={20} seed={parseInt(sel.id.slice(1))*3}/>
            <div>
              <div style={{color:'#fff',fontSize:12,fontFamily:mono,fontWeight:700,marginBottom:3}}>{sel.name}</div>
              <div style={{display:'flex',gap:8}}><AffBadge aff={sel.aff}/><span style={{color:rC[sel.rarity],fontSize:8,fontFamily:mono}}>{sel.rarity}</span></div>
            </div>
          </div>
          <div style={{display:'flex',gap:16}}>
            {[['TIER',`Tier ${sel.tier}`],['FOUND',sel.found],['ID',`AFF-${sel.aff}-${sel.id.slice(1).padStart(3,'0')}`]].map(([l,v])=>(
              <div key={l}>
                <div style={{color:'rgba(255,255,255,0.3)',fontSize:7,fontFamily:mono,marginBottom:2}}>{l}</div>
                <div style={{color:l==='ID'?AFF_COLORS[sel.aff]:'rgba(255,255,255,0.65)',fontSize:9,fontFamily:mono}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SKILLS ────────────────────────────────────────────────────────────
function SkillsScreen(){
  const [tab,setTab]=useState('harvest');
  const [detail,setDetail]=useState(null);
  const tree=SKILL_TREES[tab];
  return(
    <div style={{height:'100%',display:'flex',flexDirection:'column',padding:'16px 16px 0',overflowY:'auto'}}>
      <div style={{color:'#fff',fontSize:14,fontFamily:mono,fontWeight:700,marginBottom:4}}>Skill Trees</div>
      <div style={{color:'rgba(255,255,255,0.3)',fontSize:8,fontFamily:mono,marginBottom:14}}>Earn XP through activity</div>
      <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
        {[['harvest','⚗ Harvest'],['funding','◈ Funding'],['tooling','⚙ Tooling']].map(([k,l])=>(
          <Pill key={k} active={tab===k} onClick={()=>{setTab(k);setDetail(null);}}>{l}</Pill>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
        <span style={{color:'rgba(255,255,255,0.3)',fontSize:8,fontFamily:mono,width:55}}>{tab.slice(0,4).toUpperCase()} XP</span>
        <div style={{flex:1,height:3,background:'rgba(255,255,255,0.07)',borderRadius:2}}><div style={{width:'32%',height:'100%',background:'rgba(255,255,255,0.35)',borderRadius:2}}/></div>
        <span style={{color:'rgba(255,255,255,0.3)',fontSize:8,fontFamily:mono}}>32/100</span>
      </div>
      <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:10,marginBottom:14}}>
        <svg viewBox="0 0 300 272" width="100%" style={{display:'block'}}>
          {['T1','T2','T3','T4'].map((l,i)=>(
            <text key={l} x={4} y={28+i*68} fontSize="7" fill="rgba(255,255,255,0.14)" fontFamily="Space Mono">{l}</text>
          ))}
          {tree.edges.map(([a,b])=>{
            const n1=tree.nodes.find(n=>n.id===a),n2=tree.nodes.find(n=>n.id===b);
            return <line key={a+b} x1={n1.x+50} y1={n1.y} x2={n2.x+50} y2={n2.y} stroke={n1.unlocked?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.07)'} strokeWidth="1" strokeDasharray={n1.unlocked?undefined:'3,4'}/>;
          })}
          {tree.nodes.map(n=>{
            const sel=detail?.id===n.id,nx=n.x+50;
            return(
              <g key={n.id} onClick={()=>setDetail(sel?null:n)} style={{cursor:'pointer'}}>
                {sel&&<circle cx={nx} cy={n.y} r={16} fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.28)" strokeWidth="1"/>}
                {n.active&&<circle cx={nx} cy={n.y} r={16} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth=".5"/>}
                <circle cx={nx} cy={n.y} r={11} fill={n.active?'rgba(255,255,255,0.14)':n.unlocked?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.02)'} stroke={n.active?'#fff':n.unlocked?'rgba(255,255,255,0.5)':'rgba(255,255,255,0.14)'} strokeWidth={n.active?1.5:1}/>
                {n.active&&<circle cx={nx} cy={n.y} r={4} fill="white" opacity=".65"/>}
                {n.unlocked&&!n.active&&<circle cx={nx} cy={n.y} r={3} fill="rgba(255,255,255,0.4)"/>}
                {!n.unlocked&&<text x={nx} y={n.y+3.5} textAnchor="middle" fill="rgba(255,255,255,0.1)" fontSize="9">⬡</text>}
                <text x={nx} y={n.y+26} textAnchor="middle" fill={n.unlocked?'rgba(255,255,255,0.5)':'rgba(255,255,255,0.18)'} fontSize="6.5" fontFamily="Space Mono">{n.label.split(' ').slice(0,2).join(' ')}</text>
              </g>
            );
          })}
        </svg>
      </div>
      {detail&&(
        <div style={{padding:'14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
            <div style={{color:'#fff',fontSize:11,fontFamily:mono,fontWeight:700}}>{detail.label}</div>
            <span style={{color:detail.active?'#1fcc79':detail.unlocked?'rgba(255,255,255,0.5)':'rgba(255,255,255,0.25)',fontSize:7.5,fontFamily:mono}}>{detail.active?'ACTIVE':detail.unlocked?'UNLOCKED':'LOCKED'}</span>
          </div>
          <div style={{color:'rgba(255,255,255,0.45)',fontSize:9,fontFamily:mono,lineHeight:1.6,marginBottom:12}}>{detail.desc}</div>
          {detail.cost>0&&!detail.active&&(
            <button style={{width:'100%',padding:'9px',borderRadius:10,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.06)',color:detail.unlocked?'#fff':'rgba(255,255,255,0.3)',fontSize:9,fontFamily:mono,cursor:'pointer'}}>
              {detail.unlocked?`Activate · ${detail.cost} XP`:`Locked · ${detail.cost} XP`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── STORE ──────────────────────────────────────────────────────────────
function StoreOverlay({onClose}){
  const [tab,setTab]=useState('buy');
  return(
    <div style={{position:'absolute',inset:0,zIndex:55,background:'rgba(0,0,0,0.55)',display:'flex',flexDirection:'column',justifyContent:'flex-end'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#0d0d0d',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'24px 24px 0 0',maxHeight:'78%',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'16px 20px 0',flexShrink:0}}>
          <div style={{width:32,height:3,background:'rgba(255,255,255,0.15)',borderRadius:2,margin:'0 auto 14px'}}/>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div>
              <div style={{color:'#fff',fontSize:14,fontFamily:mono,fontWeight:700}}>Store</div>
              <div style={{color:'rgba(255,255,255,0.3)',fontSize:8,fontFamily:mono}}>Prices reset daily · 4,280 ◈</div>
            </div>
            <button onClick={onClose} style={{width:28,height:28,borderRadius:14,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.4)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
          </div>
          <div style={{display:'flex',gap:6,marginBottom:12}}>
            {[['buy','Buy'],['sell','Sell'],['special','Special ✦']].map(([k,l])=>(
              <Pill key={k} active={tab===k} onClick={()=>setTab(k)}>{l}</Pill>
            ))}
          </div>
        </div>
        <div style={{overflowY:'auto',padding:'4px 20px 32px'}}>
          {tab==='buy'&&STORE_BUY.map(item=>(
            <div key={item.id} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <BlobIcon aff={item.aff} r={14} seed={item.id.charCodeAt(1)*3}/>
              <div style={{flex:1}}>
                <div style={{color:'rgba(255,255,255,0.8)',fontSize:10,fontFamily:mono,marginBottom:3}}>{item.name}</div>
                <div style={{display:'flex',gap:8}}><AffBadge aff={item.aff}/><span style={{color:'rgba(255,255,255,0.25)',fontSize:7,fontFamily:mono}}>T{item.tier} · ×{item.stock}</span></div>
              </div>
              <button style={{padding:'7px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.06)',color:'#fff',fontSize:9,fontFamily:mono,cursor:'pointer'}}>{item.price} ◈</button>
            </div>
          ))}
          {tab==='sell'&&STORE_SELL.map(item=>(
            <div key={item.id} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <BlobIcon aff={item.aff} r={14} seed={item.id.charCodeAt(1)*5}/>
              <div style={{flex:1}}>
                <div style={{color:'rgba(255,255,255,0.8)',fontSize:10,fontFamily:mono,marginBottom:3}}>{item.name}</div>
                <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:5}}><AffBadge aff={item.aff}/><span style={{color:'rgba(255,255,255,0.25)',fontSize:7,fontFamily:mono}}>×{item.qty}</span></div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{color:'rgba(255,255,255,0.2)',fontSize:7,fontFamily:mono}}>{item.min}–{item.max}</span>
                  <div style={{flex:1,height:2,background:'rgba(255,255,255,0.07)',borderRadius:1,position:'relative'}}>
                    <div style={{position:'absolute',left:`${((item.today-item.min)/(item.max-item.min))*100}%`,top:-2,width:6,height:6,borderRadius:3,background:'rgba(255,255,255,0.5)',transform:'translateX(-50%)'}}/>
                  </div>
                  <span style={{color:'rgba(255,255,255,0.6)',fontSize:9,fontFamily:mono,fontWeight:700}}>{item.today}</span>
                </div>
              </div>
              <button style={{padding:'7px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.06)',color:'#fff',fontSize:9,fontFamily:mono,cursor:'pointer'}}>Sell</button>
            </div>
          ))}
          {tab==='special'&&(
            <>
              {STORE_SPECIAL.map(item=>(
                <div key={item.id} style={{padding:'16px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:14,marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{color:'#fff',fontSize:12,fontFamily:mono,fontWeight:700}}>{item.name}</div>
                    <span style={{color:'rgba(255,200,50,0.7)',fontSize:8,fontFamily:mono}}>⏱ {item.timeLeft}</span>
                  </div>
                  <div style={{color:'rgba(255,255,255,0.45)',fontSize:9,fontFamily:mono,lineHeight:1.6,marginBottom:14}}>{item.desc}</div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{color:'rgba(255,255,255,0.3)',fontSize:7,fontFamily:mono}}>LIMITED · 1 AVAILABLE</span>
                    <button style={{padding:'9px 20px',borderRadius:10,border:'1px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.08)',color:'#fff',fontSize:10,fontFamily:mono,fontWeight:700,cursor:'pointer'}}>{item.price} ◈</button>
                  </div>
                </div>
              ))}
              <div style={{padding:'14px',background:'rgba(255,255,255,0.02)',border:'1px dashed rgba(255,255,255,0.08)',borderRadius:14,textAlign:'center'}}>
                <div style={{color:'rgba(255,255,255,0.2)',fontSize:9,fontFamily:mono,marginBottom:4}}>Next offer in</div>
                <div style={{color:'rgba(255,255,255,0.5)',fontSize:14,fontFamily:mono}}>19h 38m</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── NAV & HEADER ──────────────────────────────────────────────────────
function NavPill({active,onChange}){
  const items=[{id:'inventory',ic:'◈',lb:'Inventory'},{id:'shipments',ic:'▣',lb:'Shipments'},{id:'lab',ic:'◉',lb:null,primary:true},{id:'discoveries',ic:'◎',lb:'Discover'},{id:'skills',ic:'⬡',lb:'Skills'}];
  return(
    <div style={{position:'absolute',bottom:20,left:'50%',transform:'translateX(-50%)',width:286,height:52,background:'rgba(10,10,10,0.97)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:26,display:'flex',alignItems:'center',justifyContent:'space-around',padding:'0 8px',boxShadow:'0 8px 40px rgba(0,0,0,0.9)',zIndex:30}}>
      {items.map(item=>(
        <div key={item.id} onClick={()=>onChange(item.id)} style={item.primary?{width:40,height:40,borderRadius:20,background:'#fff',boxShadow:'0 0 20px rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}:{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'4px 2px',cursor:'pointer'}}>
          <span style={{fontSize:item.primary?17:13,color:item.primary?'#060606':(active===item.id?'rgba(255,255,255,0.85)':'rgba(255,255,255,0.26)'),lineHeight:1}}>{item.ic}</span>
          {!item.primary&&<span style={{fontSize:6,color:active===item.id?'rgba(255,255,255,0.55)':'rgba(255,255,255,0.18)',fontFamily:mono,letterSpacing:.2}}>{item.lb}</span>}
        </div>
      ))}
    </div>
  );
}
function AppHeader({onStore,headerTick}){
  const wave=Math.sin(headerTick*.05)*2;
  return(
    <div style={{height:56,position:'relative',zIndex:20,display:'flex',alignItems:'center',padding:'0 20px',justifyContent:'space-between',flexShrink:0}}>
      <svg style={{position:'absolute',bottom:0,left:0,right:0}} viewBox="0 0 400 8" preserveAspectRatio="none">
        <path d={`M0,${4+wave} Q100,${1+wave} 200,${4+wave} Q300,${7+wave} 400,${4+wave}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      </svg>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{color:'#fff',fontFamily:mono,fontSize:14,fontWeight:700,letterSpacing:3}}>PETRI</span>
        <div style={{width:1,height:14,background:'rgba(255,255,255,0.14)'}}/>
        <span style={{color:'rgba(255,255,255,0.28)',fontFamily:mono,fontSize:7,letterSpacing:1}}>LAB</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <div style={{width:5,height:5,borderRadius:'50%',background:'rgba(255,255,255,0.6)',boxShadow:'0 0 6px rgba(255,255,255,0.25)'}}/>
          <span style={{color:'rgba(255,255,255,0.5)',fontFamily:mono,fontSize:9}}>4,280</span>
        </div>
        <button onClick={onStore} style={{padding:'4px 10px',borderRadius:12,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.55)',fontSize:8,fontFamily:mono,letterSpacing:.5,cursor:'pointer'}}>STORE</button>
        <span style={{color:'rgba(255,255,255,0.22)',fontSize:13,cursor:'pointer'}}>⚙</span>
      </div>
    </div>
  );
}

// ── APP ────────────────────────────────────────────────────────────────
export default function PetriPrototype(){
  const [screen,setScreen]           = useState('lab');
  const [nodeModal,setNodeModal]     = useState(null);
  const [storeOpen,setStoreOpen]     = useState(false);
  const [petriSwitcher,setPetriSwitcher] = useState(false);
  const [tick,setTick]               = useState(0);

  useEffect(()=>{
    const id=setInterval(()=>setTick(t=>t+1),160);
    return()=>clearInterval(id);
  },[]);

  return(
    <div style={{height:'100vh',background:'#0a0a0a',display:'flex',justifyContent:'center',alignItems:'flex-start',overflow:'hidden'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;500;600&family=Space+Mono:wght@400;700&display=swap');*{box-sizing:border-box;}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}`}</style>

      {/* phone shell — fixed height, nothing overflows */}
      <div style={{width:'100%',maxWidth:420,height:'100vh',background:'#060606',position:'relative',display:'flex',flexDirection:'column',overflow:'hidden',fontFamily:chakra}}>
        <Grid/>
        <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0,background:'radial-gradient(ellipse at 50% 30%,rgba(255,255,255,0.012) 0%,transparent 65%)'}}/>

        {/* HEADER — fixed, never moves */}
        <AppHeader onStore={()=>setStoreOpen(true)} headerTick={tick}/>

        {/* CONTENT AREA — fills remaining space, overflow hidden so screens can't push nav */}
        <div style={{flex:1,display:'flex',flexDirection:'column',position:'relative',zIndex:2,overflow:'hidden',paddingBottom:80}}>
          {screen==='lab'        && <LabScreen tick={tick} onNodeTap={n=>setNodeModal(p=>p?.id===n.id?null:n)} onPetriSwitch={()=>setPetriSwitcher(true)}/>}
          {screen==='inventory'  && <InventoryScreen/>}
          {screen==='shipments'  && <ShipmentsScreen/>}
          {screen==='discoveries'&& <DiscoveriesScreen/>}
          {screen==='skills'     && <SkillsScreen/>}
        </div>

        {/* NAV — always pinned at bottom */}
        <NavPill active={screen} onChange={s=>{setScreen(s);setNodeModal(null);}}/>

        {nodeModal     && <NodeModal node={nodeModal} onClose={()=>setNodeModal(null)}/>}
        {petriSwitcher && <PetriSwitcher onClose={()=>setPetriSwitcher(false)}/>}
        {storeOpen     && <StoreOverlay  onClose={()=>setStoreOpen(false)}/>}
      </div>
    </div>
  );
}
