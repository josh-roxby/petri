import React, { useState, useEffect } from "react";

const AFF   = ['#a3dd28','#1fcc79','#ff5533','#44aaff','#cc66ff'];
const mono  = "'Space Mono',monospace";
const chakra= "'Chakra Petch',sans-serif";
const DISH  = 264;

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

const easeOut = t => 1 - Math.pow(1-t,3);
const easeIn  = t => t*t*t;

const NODES = [
  {id:1,x:140,y:178,r:17,aff:0,state:'stable',   parent:null},
  {id:2,x:88, y:126,r:13,aff:1,state:'alive',    parent:1},
  {id:3,x:196,y:122,r:15,aff:2,state:'volatile', parent:1},
  {id:4,x:50, y:68, r:11,aff:3,state:'stable',   parent:2},
  {id:5,x:126,y:54, r:14,aff:4,state:'alive',    parent:2},
  {id:6,x:232,y:58, r:9, aff:0,state:'scar',     parent:3},
  {id:7,x:36, y:18, r:8, aff:3,state:'harvested',parent:4},
];

// ── ANIMATION DEFINITIONS ─────────────────────────────────────────────
const ANIM_DEFS = {
  // TIER 1
  S1: { label:'Stable · Pulse Ring',        tier:1, dur:60,  nodeId:2 },
  S2: { label:'Stable · Crystallise',        tier:1, dur:80,  nodeId:4 },
  S3: { label:'Stable · Edge Ripple',        tier:1, dur:70,  nodeId:2 },
  V1: { label:'Volatile · Erratic Jitter',   tier:1, dur:100, nodeId:3 },
  C1: { label:'Collapse · Shockwave',        tier:1, dur:55,  nodeId:3 },
  H1: { label:'Harvest · Particle Burst',    tier:1, dur:55,  nodeId:4 },
  SH1:{ label:'Shipment · Dissolve',         tier:1, dur:50,  nodeId:null },
  // TIER 2
  X1: { label:'XP · Porthole Breathe',       tier:2, dur:90,  nodeId:null },
  F1: { label:'Full Stable · Green Glow',    tier:2, dur:90,  nodeId:null },
  F2: { label:'Full Stable · Cascade',       tier:2, dur:90,  nodeId:null },
  D1: { label:'Discovery · Affinity Burst',  tier:2, dur:55,  nodeId:5 },
  D2: { label:'Discovery · NEW Chip',        tier:2, dur:55,  nodeId:5 },
  // TIER 3
  T1: { label:'Stabilise Micro',             tier:3, dur:28,  nodeId:2 },
  T2: { label:'Catalyse Spark',              tier:3, dur:40,  nodeId:2 },
  T3: { label:'Contain Frost',               tier:3, dur:55,  nodeId:5 },
  T4: { label:'Discard Burn',                tier:3, dur:50,  nodeId:3 },
  T5: { label:'Store Sale Flash',            tier:3, dur:35,  nodeId:null },
  T6: { label:'Skill Unlock',                tier:3, dur:40,  nodeId:null },
};

// ── ANIMATION OVERLAY RENDERER ────────────────────────────────────────
function renderAnim(id, p, fastTick) {
  if (!id || p <= 0) return null;
  const def = ANIM_DEFS[id];
  const node = def.nodeId ? NODES.find(n => n.id === def.nodeId) : null;
  const c = node ? AFF[node.aff] : 'white';

  switch(id) {

    // ── S1: Stable — 3 staggered concentric rings ──────────────────
    case 'S1': return [0, 0.22, 0.44].map((off, i) => {
      var tp = Math.max(0, Math.min(1, (p - off) / 0.8));
      var r  = node.r + easeOut(tp) * 68;
      var op = Math.max(0, 1 - tp * 1.1) * 0.9;
      return <circle key={i} cx={node.x} cy={node.y} r={r} fill="none"
        stroke="white" strokeWidth={2 - tp * 1.5} opacity={op}/>;
    });

    // ── S2: Stable — circle overlay with diamond grid fill ─────────────
    case 'S2': {
      var build = easeOut(Math.min(1, p * 1.4));
      var fade  = Math.max(0, (p - 0.6) / 0.4);
      var op    = build * (1 - fade);
      var R     = node.r + 6;
      var gridId = `diamondGrid${node.id}`;
      var clipId = `circClip${node.id}`;
      var dSz   = 4.5; // diamond cell size
      return (
        <React.Fragment>
          <defs>
            {/* clip to circle */}
            <clipPath id={clipId}>
              <circle cx={node.x} cy={node.y} r={R}/>
            </clipPath>
            {/* 45-degree diamond grid pattern */}
            <pattern id={gridId} x="0" y="0" width={dSz} height={dSz} patternUnits="userSpaceOnUse" patternTransform={`rotate(45 ${node.x} ${node.y})`}>
              <rect width={dSz} height={dSz} fill="none" stroke="white" strokeWidth="0.35"/>
            </pattern>
          </defs>
          {/* diamond grid masked to circle */}
          <circle cx={node.x} cy={node.y} r={R}
            fill={`url(#${gridId})`} opacity={op * 0.55}
            clipPath={`url(#${clipId})`}/>
          {/* subtle fill tint */}
          <circle cx={node.x} cy={node.y} r={R}
            fill={c} opacity={op * 0.07}
            clipPath={`url(#${clipId})`}/>
          {/* outer circle ring */}
          <circle cx={node.x} cy={node.y} r={R}
            fill="none" stroke="white" strokeWidth="1.2" opacity={op * 0.55}/>
          {/* inner ring */}
          <circle cx={node.x} cy={node.y} r={R - 3}
            fill="none" stroke="white" strokeWidth="0.4" opacity={op * 0.3}/>
        </React.Fragment>
      );
    }

    // ── S3: Stable — glowing dots travel along the existing mycelium edges ──
    case 'S3': {
      var children = NODES.filter(n => n.parent === node.id);
      var parentN  = node.parent ? NODES.find(n => n.id === node.parent) : null;
      // Build edge list: flag whether target is child (travel forward) or parent (travel backward)
      var edges = children.map(function(c) { return {target: c, isChild: true}; });
      if (parentN) edges.push({target: parentN, isChild: false});

      return edges.map(function(e, i) {
        var delay = i * 0.18;
        var tp    = Math.max(0, Math.min(1, (p - delay) / 0.8));
        var et    = easeOut(tp);

        // Recreate the EXACT control point used when the edge was drawn
        // Edge formula in PetriDish: parent → child, using n=child, p=parent
        var childN  = e.isChild ? e.target : node;
        var parentE = e.isChild ? node     : e.target;
        var mx = (childN.x + parentE.x) / 2 + (((childN.id * 9 + parentE.id * 7) % 24) - 12) * 0.7;
        var my = (childN.y + parentE.y) / 2 + (((childN.id * 11 + parentE.id * 5) % 20) - 10) * 0.7;

        // Quadratic bezier parameter — always travel from `node` to target
        // If target is child: t goes 0→1 along parent→child
        // If target is parent: t goes 1→0 along parent→child (reverse)
        var bt = e.isChild ? et : 1 - et;
        var mt = 1 - bt;
        var dotX = mt*mt*parentE.x + 2*mt*bt*mx + bt*bt*childN.x;
        var dotY = mt*mt*parentE.y + 2*mt*bt*my + bt*bt*childN.y;

        var op = tp < 0.85 ? 0.9 : (1 - tp) * 6;
        return (
          <g key={i}>
            <circle cx={dotX} cy={dotY} r={3.5} fill="white" opacity={op}/>
            <circle cx={dotX} cy={dotY} r={6}   fill="white" opacity={op * 0.3}/>
          </g>
        );
      });
    }

    // ── V1: Volatile warning — wild jitter + red bleed ───────────────
    case 'V1': {
      var intensity = easeIn(Math.min(1, p * 1.3));
      var jx = intensity * 4 * (fastTick % 3 === 0 ? 1 : fastTick % 3 === 1 ? -1.5 : 0.8);
      var jy = intensity * 4 * (fastTick % 4 === 0 ? -1 : fastTick % 4 === 1 ? 1.5 : fastTick % 4 === 2 ? -0.8 : 0.5);
      var redOp = intensity * 0.25;
      var edgeFlicker = fastTick % 2 === 0 ? 0.05 : 0.35;
      var parent = NODES.find(n => n.id === node.parent);
      return (
        <g transform={`translate(${jx},${jy})`}>
          {parent && <line x1={node.x} y1={node.y} x2={parent.x} y2={parent.y}
            stroke="#ff5533" strokeWidth="1.5" opacity={edgeFlicker}/>}
          <circle cx={node.x} cy={node.y} r={node.r+12} fill="#ff5533" opacity={redOp}/>
          <circle cx={node.x} cy={node.y} r={node.r+5}
            fill="none" stroke="#ff5533" strokeWidth="1.5"
            opacity={0.3 + intensity * 0.4} strokeDasharray="3,2"
            transform={`rotate(${fastTick * 20},${node.x},${node.y})`}/>
        </g>
      );
    }

    // ── C1: Collapse — flash → shockwave ring → scar ─────────────────
    case 'C1': {
      var phase1 = p < 0.2;  // flash
      var phase2 = p >= 0.2 && p < 0.7; // shockwave
      var phase3 = p >= 0.7; // fade to scar
      var siblings = NODES.filter(n => n.parent === node.parent && n.id !== node.id);
      var swP = phase2 ? (p - 0.2) / 0.5 : 1;
      var swR = node.r + easeOut(swP) * 90;
      var swOp = phase2 ? Math.max(0, 1 - swP * 1.2) * 0.8 : 0;
      var flashOp = phase1 ? (1 - p / 0.2) * 0.9 : 0;
      var scarOp  = phase3 ? easeOut((p - 0.7) / 0.3) : 0;
      return (
        <React.Fragment>
          {/* flash */}
          <circle cx={node.x} cy={node.y} r={node.r * 2} fill="white" opacity={flashOp}/>
          {/* shockwave ring */}
          <circle cx={node.x} cy={node.y} r={swR} fill="none"
            stroke="#ff8844" strokeWidth={3 - swP * 2} opacity={swOp}/>
          <circle cx={node.x} cy={node.y} r={swR * 0.7} fill="none"
            stroke="white" strokeWidth="0.7" opacity={swOp * 0.5}/>
          {/* sibling flash red */}
          {siblings.map(s => (
            <circle key={s.id} cx={s.x} cy={s.y} r={s.r + 6}
              fill="#ff5533" opacity={phase2 ? swP < 0.4 ? swP * 0.6 : Math.max(0,(0.4-swP)*2) : 0}/>
          ))}
          {/* scar overlay */}
          <path d={blobD(node.x,node.y,node.r,node.id*13)} fill="rgba(20,20,20,0.9)" opacity={scarOp}/>
          <text x={node.x} y={node.y+4} textAnchor="middle" fill="rgba(255,255,255,0.4)"
            fontSize="10" opacity={scarOp}>×</text>
        </React.Fragment>
      );
    }

    // ── H1: Harvest — particle burst in affinity colour ──────────────
    case 'H1': {
      var NUM = 14;
      return Array.from({length:NUM}, (_,i) => {
        var angle = (i / NUM) * Math.PI * 2 + i * 0.4;
        var speed = 0.6 + (i % 3) * 0.25;
        var tp    = Math.min(1, p * speed * 1.2);
        var dist  = easeOut(tp) * (36 + (i % 4) * 14);
        var px    = node.x + dist * Math.cos(angle);
        var py    = node.y + dist * Math.sin(angle);
        var size  = (3.5 - tp * 2.5) * (1 + (i%3)*0.3);
        var op    = Math.max(0, 1 - tp * 1.1);
        return <g key={i}>
          <circle cx={px} cy={py} r={Math.max(0.3,size)} fill={c} opacity={op}/>
          <circle cx={px} cy={py} r={Math.max(0.2,size*1.6)} fill={c} opacity={op*0.25}/>
        </g>;
      }).concat(
        <circle key="flash" cx={node.x} cy={node.y} r={node.r*1.5}
          fill={c} opacity={Math.max(0, 0.6 - p * 2.5)}/>
      );
    }

    // ── SH1: Shipment — gentle shake, fade to empty, hold, then stub ──
    case 'SH1': {
      // target node: node 2 (Lysate-β, alive state)
      var n    = NODES.find(x => x.id === 2);
      var bs   = n.id * 13 + 1 * 7;
      var nc   = AFF[n.aff];

      // PHASES:
      //  0.00 – 0.35 : gentle shake + fade to opacity 0
      //  0.35 – 0.72 : empty hold (nothing visible)
      //  0.72 – 1.00 : stub fades in
      var shakePhase = p < 0.35 ? p / 0.35 : 0;
      // gentler amplitude — max 1.6px (was 4.5), falls off as opacity drops
      var jitterAmp  = shakePhase > 0 ? Math.sin(shakePhase * Math.PI) * 1.6 : 0;
      var jx = jitterAmp * (fastTick % 3 === 0 ? 1 : fastTick % 3 === 1 ? -0.7 : 0.4);
      var jy = jitterAmp * (fastTick % 4 === 0 ? -0.5 : fastTick % 4 === 1 ? 0.6 : fastTick % 4 === 2 ? -0.3 : 0.7);

      // opacity fades during shake phase, fully 0 from 0.35 onward
      var nodeOp = p < 0.35 ? 1 - (p / 0.35) : 0;
      // stub fades in only in the final 28% of the animation
      var stubOp = p > 0.72 ? Math.min(1, (p - 0.72) / 0.28) : 0;

      return (
        <React.Fragment>
          {/* fading live node with gentle shake */}
          <g transform={`translate(${jx},${jy})`} opacity={nodeOp}>
            <path d={blobD(n.x,n.y,n.r+9,bs+6)} fill={nc+'09'} stroke="none"/>
            <path d={blobD(n.x,n.y,n.r,bs)} fill={nc+'25'} stroke={nc} strokeWidth="1.5"/>
            <circle cx={n.x} cy={n.y} r={n.r*0.4} fill={nc} opacity={0.55}/>
            <circle cx={n.x} cy={n.y} r={n.r*0.13} fill="white" opacity={0.2}/>
          </g>
          {/* harvested stub fades in after the empty hold */}
          <g opacity={stubOp}>
            <path d={blobD(n.x,n.y,n.r,bs)} fill="transparent" stroke={nc+'44'} strokeWidth="0.8" strokeDasharray="4,3"/>
          </g>
        </React.Fragment>
      );
    }

    // ── X1: XP — porthole breathe (rendered as dish overlay) ─────────
    case 'X1': {
      var breathe = 0.5 + 0.5 * Math.sin(p * Math.PI * 2.5);
      var glow    = easeOut(Math.min(1, p * 2)) * breathe;
      // Ripple ring from centre outward × 2
      return (
        <React.Fragment>
          {[0, 0.35].map((off, i) => {
            var tp = Math.max(0, Math.min(1, (p - off) / 0.65));
            var r  = 20 + easeOut(tp) * 110;
            var op = Math.max(0, 1 - tp) * 0.5;
            return <circle key={i} cx={140} cy={105} r={r} fill="none"
              stroke="white" strokeWidth={2-tp} opacity={op}/>;
          })}
          {/* global screen glow */}
          <circle cx={140} cy={105} r={135} fill="white" opacity={glow * 0.04}/>
          {/* XP text rise */}
          <text x={140} y={105 - 20 - easeOut(p)*30} textAnchor="middle"
            fill="white" fontSize="11" fontFamily={mono} fontWeight="700"
            opacity={Math.min(1, p*4) * Math.max(0, 1 - (p - 0.6) / 0.4)}>
            +240 XP
          </text>
          {/* Level up flash at peak */}
          {p > 0.55 && p < 0.75 && (
            <text x={140} y={78} textAnchor="middle" fill="white"
              fontSize="9" fontFamily={chakra} letterSpacing="3"
              opacity={(p > 0.55 ? Math.min(1,(p-0.55)*7) : 0) * Math.max(0,1-(p-0.65)*7)}>
              LEVEL UP
            </text>
          )}
        </React.Fragment>
      );
    }

    // ── F1: Full stable — green fill via div overlay (see PetriDish), node rings via SVG ──
    case 'F1': {
      var buildP = Math.min(1, easeOut(p * 1.8));
      var holdP  = p > 0.55 ? Math.min(1, (p - 0.55) / 0.2) : 0;
      var fudeP  = p > 0.75 ? easeIn((p - 0.75) / 0.25) : 0;
      return (
        <React.Fragment>
          {NODES.filter(n => !['scar','harvested'].includes(n.state)).map(n => (
            <circle key={n.id} cx={n.x} cy={n.y} r={n.r + 8 + holdP * 4}
              fill="none" stroke="#1fcc79" strokeWidth="1.2"
              opacity={(buildP - fudeP) * 0.6}/>
          ))}
          {p > 0.4 && p < 0.8 && (
            <text x={140} y={170} textAnchor="middle" fill="#1fcc79"
              fontSize="8" fontFamily={mono} letterSpacing="2"
              opacity={Math.min(1,(p-0.4)*5) * Math.max(0,1-(p-0.7)*7)}>
              DISH STABLE
            </text>
          )}
        </React.Fragment>
      );
    }

    // ── F2: Full stable — wave fill via div overlay (see PetriDish), node rings via SVG ──
    case 'F2': {
      var waveX = easeOut(p) * 340 - 40;
      return (
        <React.Fragment>
          {NODES.filter(n => !['scar','harvested'].includes(n.state)).map(n => {
            var nodePassed = (n.x - (waveX - 30)) / 60;
            var lit  = Math.max(0, Math.min(1, nodePassed));
            var fade = Math.max(0, 1 - Math.max(0, nodePassed - 0.5) * 3);
            return <circle key={n.id} cx={n.x} cy={n.y} r={n.r + 6}
              fill="none" stroke="white" strokeWidth="1.5"
              opacity={easeOut(lit) * fade * 0.7}/>;
          })}
        </React.Fragment>
      );
    }

    // ── D1: Discovery — affinity starburst ───────────────────────────
    case 'D1': {
      var NUM = 12;
      return (
        <React.Fragment>
          {/* expanding ring */}
          <circle cx={node.x} cy={node.y} r={node.r + easeOut(p) * 55}
            fill="none" stroke={c} strokeWidth={2-p} opacity={Math.max(0,1-p*1.2) * 0.9}/>
          {/* rays */}
          {Array.from({length:NUM}, (_,i) => {
            var a = (i / NUM) * Math.PI * 2;
            var ep = easeOut(p);
            var r1 = node.r + 4 + ep * 10;
            var r2 = node.r + 4 + ep * (28 + (i%3)*12);
            var op = Math.max(0, 1 - p * 1.3) * 0.85;
            return <line key={i}
              x1={node.x + r1 * Math.cos(a)} y1={node.y + r1 * Math.sin(a)}
              x2={node.x + r2 * Math.cos(a)} y2={node.y + r2 * Math.sin(a)}
              stroke={c} strokeWidth="1.2" opacity={op}/>;
          })}
          {/* core flash */}
          <circle cx={node.x} cy={node.y} r={node.r * 1.8}
            fill={c} opacity={Math.max(0, 0.7 - p * 3)}/>
        </React.Fragment>
      );
    }

    // ── D2: Discovery — NEW chip rises ───────────────────────────────
    case 'D2': {
      var rise  = easeOut(Math.min(1, p * 1.6)) * 38;
      var appear= Math.min(1, p * 4);
      var vanish= Math.max(0, 1 - Math.max(0, (p - 0.55) / 0.45));
      var op    = appear * vanish;
      return (
        <React.Fragment>
          <rect x={node.x - 18} y={node.y - 22 - rise} width={36} height={14} rx={7}
            fill={c} opacity={op}/>
          <text x={node.x} y={node.y - 12 - rise} textAnchor="middle"
            fill="rgba(0,0,0,0.8)" fontSize="7.5" fontFamily={mono} fontWeight="700"
            opacity={op}>NEW</text>
          {/* affinity dot on node */}
          <circle cx={node.x} cy={node.y} r={node.r + 5} fill="none"
            stroke={c} strokeWidth="1.5" opacity={op * 0.6}/>
        </React.Fragment>
      );
    }

    // ── T1: Stabilise micro — single settle ring ─────────────────────
    case 'T1': {
      var r  = node.r + easeOut(p) * 22;
      var op = Math.max(0, 1 - p * 1.1) * 0.85;
      return <circle cx={node.x} cy={node.y} r={r} fill="none"
        stroke="white" strokeWidth={1.5 - p} opacity={op}/>;
    }

    // ── T2: Catalyse — yellow spark + child node growing ─────────────
    case 'T2': {
      var NUM = 8;
      var childP = Math.max(0, (p - 0.45) / 0.55);
      var childR = easeOut(childP) * 10;
      // child appears above the node
      var childX = node.x + 28, childY = node.y - 44;
      return (
        <React.Fragment>
          {/* sparks */}
          {Array.from({length:NUM}, (_,i) => {
            var a   = (i / NUM) * Math.PI * 2;
            var tp  = Math.min(1, p * 2.5);
            var dist= easeOut(tp) * (14 + (i%3)*8);
            var px  = node.x + dist * Math.cos(a);
            var py  = node.y + dist * Math.sin(a);
            var op  = Math.max(0, 1 - tp * 1.2) * 0.9;
            return <circle key={i} cx={px} cy={py} r={Math.max(0.3,2-tp*2)}
              fill="#f5c842" opacity={op}/>;
          })}
          {/* spark flash */}
          <circle cx={node.x} cy={node.y} r={node.r * 1.3}
            fill="#f5c842" opacity={Math.max(0, 0.5 - p * 3.5)}/>
          {/* edge to new child */}
          {childP > 0 && <line x1={node.x} y1={node.y} x2={childX} y2={childY}
            stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" opacity={easeOut(childP)}/>}
          {/* new child growing */}
          {childP > 0 && <React.Fragment>
            <path d={blobD(childX, childY, childR, 42)} fill={c+'20'} stroke={c} strokeWidth="1"/>
            <circle cx={childX} cy={childY} r={childR * 0.38} fill={c} opacity={0.6}/>
          </React.Fragment>}
        </React.Fragment>
      );
    }

    // ── T3: Contain — diamond frost grid masked to blob cell shape ────
    case 'T3': {
      var build   = easeOut(Math.min(1, p * 1.5));
      var clipId  = `frostClip${node.id}`;
      var patId   = `frostPat${node.id}`;
      var dSz     = 3.8;
      // Match the exact seed used when the cell was originally drawn
      var ni      = NODES.indexOf(node);
      var bs      = node.id * 13 + ni * 7;
      return (
        <React.Fragment>
          <defs>
            {/* clip to the blob's exact shape — same seed as base cell */}
            <clipPath id={clipId}>
              <path d={blobD(node.x, node.y, node.r, bs)}/>
            </clipPath>
            {/* diamond grid pattern */}
            <pattern id={patId} x="0" y="0" width={dSz} height={dSz}
              patternUnits="userSpaceOnUse"
              patternTransform={`rotate(45 ${node.x} ${node.y})`}>
              <rect width={dSz} height={dSz} fill="none" stroke="rgba(180,210,255,0.9)" strokeWidth="0.3"/>
            </pattern>
          </defs>
          {/* frost grid — only visible inside the blob */}
          <path d={blobD(node.x, node.y, node.r, bs)}
            fill={`url(#${patId})`} opacity={build * 0.65}
            clipPath={`url(#${clipId})`}/>
          {/* cool blue inner tint */}
          <path d={blobD(node.x, node.y, node.r, bs)}
            fill="rgba(120,160,255,0.10)" stroke="none"
            clipPath={`url(#${clipId})`} opacity={build}/>
          {/* crystal border ring — traces the cell outline */}
          <path d={blobD(node.x, node.y, node.r + 0.5, bs)}
            fill="none" stroke="rgba(140,180,255,0.8)" strokeWidth="1.4" opacity={build * 0.7}/>
          {/* freeze dot */}
          <circle cx={node.x} cy={node.y} r={node.r * 0.22}
            fill="rgba(200,220,255,0.65)" opacity={build}/>
        </React.Fragment>
      );
    }

    // ── T4: Discard burn — fire + neighbour flash ─────────────────────
    case 'T4': {
      var burnP    = Math.min(1, p * 1.4);
      var siblings = NODES.filter(n => n.parent === node.parent && n.id !== node.id);
      var NUM = 10;
      return (
        <React.Fragment>
          {/* fire particles */}
          {Array.from({length:NUM}, (_,i) => {
            var angle = -Math.PI/2 + (((i / NUM) - 0.5) * 1.2);
            var speed = 0.5 + (i%4)*0.2;
            var tp    = Math.min(1, burnP * speed * 1.5);
            var dist  = easeIn(tp) * (20 + (i%3)*10);
            var px    = node.x + dist * Math.cos(angle) * 0.7;
            var py    = node.y - dist * (0.9 + (i%3)*0.2);
            var sz    = 2.5 + (1-tp)*2;
            var clr   = i % 3 === 0 ? '#ff8844' : i%3===1 ? '#ff5533' : '#ffcc44';
            return <circle key={i} cx={px} cy={py} r={Math.max(0.2,sz*(1-tp))}
              fill={clr} opacity={Math.max(0, 1-tp * 1.2) * 0.9}/>;
          })}
          {/* node burning to scar */}
          <path d={blobD(node.x, node.y, node.r, node.id*13)}
            fill={`rgba(20,20,20,${burnP * 0.85})`} stroke={`rgba(255,80,30,${Math.max(0,1-burnP*1.4)})`}
            strokeWidth="1.5"/>
          {/* neighbour flash red */}
          {siblings.map(s => {
            var flashOp = burnP < 0.5 ? burnP * 0.4 : Math.max(0, (0.5-burnP)*0.8);
            return <circle key={s.id} cx={s.x} cy={s.y} r={s.r+5}
              fill="#ff5533" opacity={flashOp}/>;
          })}
        </React.Fragment>
      );
    }

    // ── T5: Store sale — credit counter centred in dish ──────────────
    case 'T5': {
      // centre of dish (SVG coords: 140, 105). Text rises gently.
      var rise = easeOut(p) * 20;
      // Smooth fade in (0–0.2) and fade out (0.6–1.0)
      var fadeIn  = Math.min(1, p / 0.2);
      var fadeOut = Math.max(0, 1 - (p - 0.6) / 0.4);
      var op      = fadeIn * fadeOut;
      return (
        <text x={140} y={112 - rise} textAnchor="middle"
          fill="#1fcc79" fontSize="15" fontFamily={mono} fontWeight="700"
          opacity={op}>
          +355 ◈
        </text>
      );
    }

    // ── T6: Skill unlock — centred in dish with smooth in/out ────────
    case 'T6': {
      var cx  = 140, cy = 105;
      // Fade in 0–0.15, fade out 0.7–1.0
      var fadeIn  = Math.min(1, p / 0.15);
      var fadeOut = Math.max(0, 1 - (p - 0.7) / 0.3);
      var iconOp  = fadeIn * fadeOut;
      // Expanding ring — starts at 10, grows outward, fades as it goes
      var r1   = 10 + easeOut(p) * 22;
      var op1  = Math.max(0, 1 - p * 1.1) * 0.7 * fadeIn;
      // Glow pulse through the animation
      var glow = Math.sin(p * Math.PI) * 0.5;
      return (
        <React.Fragment>
          {/* expanding ring */}
          <circle cx={cx} cy={cy} r={r1} fill="none" stroke="white" strokeWidth="1" opacity={op1}/>
          {/* skill node */}
          <circle cx={cx} cy={cy} r={9} fill={`rgba(255,255,255,${(0.12 + glow * 0.2) * iconOp})`}
            stroke="white" strokeWidth="1.4" opacity={(0.5 + glow * 0.4) * iconOp}/>
          <circle cx={cx} cy={cy} r={3.5} fill="white" opacity={(0.5 + glow * 0.4) * iconOp}/>
          {/* UNLOCKED label — centred below the icon */}
          <text x={cx} y={cy + 24} textAnchor="middle" fill="rgba(255,255,255,0.55)"
            fontSize="7" fontFamily={mono} letterSpacing="1.5" opacity={iconOp}>
            UNLOCKED
          </text>
        </React.Fragment>
      );
    }

    default: return null;
  }
}

// ── PETRI DISH + OVERLAY ──────────────────────────────────────────────
function PetriDish({tick, animId, animP, fastTick}) {
  const pulse = 0.3 + Math.sin(tick*.09)*.12;
  const animOverlay = renderAnim(animId, animP, fastTick);

  // pre-compute F1 fill opacity outside JSX
  var f1BuildP = animId==='F1' ? Math.min(1, easeOut(animP * 1.8)) : 0;
  var f1FudeP  = (animId==='F1' && animP > 0.75) ? easeIn((animP - 0.75) / 0.25) : 0;
  var f1Opacity = animId==='F1' ? (f1BuildP - f1FudeP * f1BuildP) * 0.28 : 0;

  // pre-compute F2 wave gradient outside JSX
  var f2WaveX = animId==='F2' ? easeOut(animP) * 340 - 40 : 0;
  var f2Grad  = animId==='F2'
    ? 'linear-gradient(90deg, transparent '+(f2WaveX-70)/280*100+'%, rgba(255,255,255,0.18) '+(f2WaveX-30)/280*100+'%, rgba(255,255,255,0.32) '+f2WaveX/280*100+'%, rgba(255,255,255,0.18) '+(f2WaveX+30)/280*100+'%, transparent '+(f2WaveX+70)/280*100+'%)'
    : 'none';

  // pre-compute X1 glow
  var x1GlowOp = animId==='X1' ? (0.3 + Math.sin(animP*Math.PI*3)*0.3)*0.12 : 0;

  return (
    <div style={{position:'relative',width:DISH,height:DISH}}>
      {/* outer rings */}
      <div style={{position:'absolute',inset:-9,borderRadius:'50%',border:'3px solid rgba(255,255,255,0.07)',boxShadow:'0 0 40px rgba(255,255,255,0.02),inset 0 0 30px rgba(0,0,0,0.6)'}}/>
      <div style={{position:'absolute',inset:-4,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.06)'}}/>
      {/* bolts */}
      {[0,90,180,270].map(deg=>(
        <div key={deg} style={{position:'absolute',top:'50%',left:'50%',width:6,height:6,borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.16)',transform:`rotate(${deg}deg) translateX(137px) translateY(-3px)`,transformOrigin:'0 3px'}}/>
      ))}
      {/* porthole glow overlay for X1 only */}
      {animId==='X1' && (
        <div style={{position:'absolute',inset:-20,borderRadius:'50%',background:'radial-gradient(circle, rgba(255,255,255,'+x1GlowOp+') 0%, transparent 70%)',pointerEvents:'none',zIndex:20}}/>
      )}
      {/* clipped inner dish — border-radius:50% + overflow:hidden clips everything inside to a circle */}
      <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'radial-gradient(ellipse,rgba(12,12,12,.85) 0%,rgba(4,4,4,.95) 100%)',border:'1px solid rgba(255,255,255,0.04)',overflow:'hidden'}}>
        {/* base nodes SVG */}
        <svg viewBox="0 0 280 210" width="100%" height="100%">
          {NODES.filter(n=>n.parent).map(n=>{
            const p=NODES.find(x=>x.id===n.parent),scar=n.state==='scar';
            const mx=(n.x+p.x)/2+(((n.id*9+p.id*7)%24)-12)*.7;
            const my=(n.y+p.y)/2+(((n.id*11+p.id*5)%20)-10)*.7;
            return <path key={`e${n.id}`} d={`M ${p.x},${p.y} Q ${mx},${my} ${n.x},${n.y}`}
              fill="none" stroke={scar?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.13)'}
              strokeWidth={scar?0.5:1.1} strokeLinecap="round"/>;
          })}
          {NODES.map((n,ni)=>{
            const c=AFF[n.aff],vol=n.state==='volatile',scar=n.state==='scar',harv=n.state==='harvested',stable=n.state==='stable';
            const jx=vol?(tick%2===0?1.7:-1.7):0,jy=vol?(tick%3===0?1.1:-1):0,bs=n.id*13+ni*7;
            const p1=0.12+Math.sin(tick*.08+ni)*.07;
            return(
              <g key={n.id} transform={`translate(${jx},${jy})`}>
                {!scar&&!harv&&<path d={blobD(n.x,n.y,n.r+16,bs+8)} fill={c+'06'} stroke="none"/>}
                {!scar&&!harv&&<path d={blobD(n.x,n.y,n.r+9, bs+6)} fill={c+'09'} stroke="none"/>}
                {!scar&&!harv&&<path d={blobD(n.x,n.y,n.r+4, bs+4)} fill="none" stroke={c} strokeWidth=".3" opacity={stable?p1*1.5:p1}/>}
                {stable&&<path d={blobD(n.x,n.y,n.r+11,bs+2)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth=".5" opacity={pulse*1.2}/>}
                {vol&&<path d={blobD(n.x,n.y,n.r+6, bs+5)} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1" opacity={0.4+Math.sin(tick*.45)*.35}/>}
                {!scar&&!harv&&<path d={blobD(n.x,n.y,n.r+1,bs+1)} fill={c+'10'} stroke="none"/>}
                <path d={blobD(n.x,n.y,n.r,bs)} fill={scar?'rgba(20,20,20,.85)':harv?'transparent':c+'25'} stroke={scar?'rgba(255,255,255,0.07)':harv?c+'44':c} strokeWidth={scar?0.5:harv?0.8:1.5} strokeDasharray={harv?'4,3':undefined} opacity={scar?0.35:1}/>
                {!scar&&!harv&&<circle cx={n.x} cy={n.y} r={n.r*0.4} fill={c} opacity={vol?0.35+Math.sin(tick*0.4)*0.38:stable?0.72:0.55}/>}
                {!scar&&!harv&&<circle cx={n.x} cy={n.y} r={n.r*0.13} fill="white" opacity={stable?0.5:0.2}/>}
                {scar&&<text x={n.x} y={n.y+4} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="9">×</text>}
              </g>
            );
          })}
        </svg>

        {/* F1 — full-circle green fill, clipped by parent div */}
        {animId==='F1' && (
          <div style={{position:'absolute',inset:0,background:'rgba(31,204,121,'+f1Opacity+')',pointerEvents:'none',zIndex:14}}/>
        )}

        {/* F2 — full-circle sweeping wave fill, clipped by parent div */}
        {animId==='F2' && (
          <div style={{position:'absolute',inset:0,background:f2Grad,pointerEvents:'none',zIndex:14}}/>
        )}

        {/* animation overlay SVG — node-level effects only */}
        {animOverlay && (
          <svg viewBox="0 0 280 210" width="100%" height="100%"
            style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:15}}>
            {animOverlay}
          </svg>
        )}
      </div>
    </div>
  );
}

// ── TRIGGER PANEL ─────────────────────────────────────────────────────
const TIER_COLORS = { '1':'rgba(255,255,255,0.55)', '2':'#44aaff', '3':'#a3dd28' };

function TriggerPanel({animId, animP, onTrigger}) {
  const [open, setOpen] = useState(false);
  const [activeTier, setActiveTier] = useState(1);
  const tierItems = Object.entries(ANIM_DEFS).filter(function(pair) { return pair[1].tier === activeTier; });
  const currentDef = animId ? ANIM_DEFS[animId] : null;

  return (
    <div style={{position:'absolute',top:10,right:12,zIndex:40}}>
      {/* toggle button */}
      <button onClick={()=>setOpen(o=>!o)} style={{
        width:32,height:32,borderRadius:16,
        background:open?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.06)',
        border:`1px solid ${open?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.12)'}`,
        color:'rgba(255,255,255,0.7)',fontSize:14,cursor:'pointer',
        display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:open?'0 0 12px rgba(255,255,255,0.1)':'none',
      }}>⚡</button>

      {open && (
        <div style={{
          position:'absolute',top:38,right:0,width:194,
          background:'rgba(6,6,6,0.98)',
          border:'1px solid rgba(255,255,255,0.12)',
          borderRadius:14,overflow:'hidden',
          boxShadow:'0 12px 40px rgba(0,0,0,0.9)',
        }}>
          {/* currently playing */}
          <div style={{padding:'10px 12px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{color:'rgba(255,255,255,0.25)',fontSize:6.5,fontFamily:mono,letterSpacing:1,marginBottom:4}}>NOW PLAYING</div>
            {animId ? (
              <React.Fragment>
                <div style={{color:'rgba(255,255,255,0.7)',fontSize:8,fontFamily:mono,marginBottom:5}}>{currentDef && currentDef.label}</div>
                <div style={{width:'100%',height:2,background:'rgba(255,255,255,0.07)',borderRadius:1}}>
                  <div style={{width:`${animP*100}%`,height:'100%',background:'rgba(255,255,255,0.5)',borderRadius:1,transition:'width 0.05s linear'}}/>
                </div>
              </React.Fragment>
            ) : (
              <div style={{color:'rgba(255,255,255,0.22)',fontSize:8,fontFamily:mono}}>— idle —</div>
            )}
          </div>

          {/* tier tabs */}
          <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            {[1,2,3].map(t => (
              <button key={t} onClick={()=>setActiveTier(t)} style={{
                flex:1,padding:'7px 4px',border:'none',
                background:activeTier===t?'rgba(255,255,255,0.07)':'transparent',
                color:activeTier===t?TIER_COLORS[t]:'rgba(255,255,255,0.28)',
                fontSize:8.5,fontFamily:mono,cursor:'pointer',
                borderBottom:activeTier===t?`1.5px solid ${TIER_COLORS[t]}`:'1.5px solid transparent',
              }}>T{t}</button>
            ))}
          </div>

          {/* animation buttons */}
          <div style={{maxHeight:240,overflowY:'auto',padding:'6px 8px 10px'}}>
            {tierItems.map(([id, def]) => {
              const active = animId === id;
              return (
                <button key={id} onClick={()=>onTrigger(id)} style={{
                  display:'flex',alignItems:'center',gap:7,
                  width:'100%',padding:'7px 8px',marginBottom:3,
                  background:active?'rgba(255,255,255,0.07)':'transparent',
                  border:`1px solid ${active?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.06)'}`,
                  borderRadius:8,cursor:'pointer',textAlign:'left',
                }}>
                  <span style={{color:TIER_COLORS[def.tier],fontFamily:mono,fontSize:7.5,fontWeight:700,flexShrink:0,width:24}}>{id}</span>
                  <span style={{color:active?'rgba(255,255,255,0.75)':'rgba(255,255,255,0.4)',fontSize:8,fontFamily:mono,lineHeight:1.3}}>{def.label.replace(/^[^·]+· /,'')}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── GRID ──────────────────────────────────────────────────────────────
function Grid(){
  return <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:1,backgroundImage:`linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)`,backgroundSize:'28px 28px',opacity:.28}}/>;
}

// ── APP ───────────────────────────────────────────────────────────────
export default function AnimLab() {
  const [tick, setTick]         = useState(0);
  const [fastTick, setFastTick] = useState(0);
  const [animId, setAnimId]     = useState(null);
  const [animP, setAnimP]       = useState(0);

  // game tick — 160ms
  useEffect(()=>{
    const id=setInterval(()=>setTick(t=>t+1),160);
    return()=>clearInterval(id);
  },[]);

  // animation tick — 50ms for smooth playback
  useEffect(()=>{
    const id=setInterval(()=>{
      setFastTick(t=>t+1);
      setAnimP(prev => {
        if (animId === null) return 0;
        const dur = (ANIM_DEFS[animId] && ANIM_DEFS[animId].dur) ? ANIM_DEFS[animId].dur : 50;
        const next = prev + 1/dur;
        return next >= 1 ? 0 : next; // loop for preview
      });
    },50);
    return()=>clearInterval(id);
  },[animId]);

  const triggerAnim = (id) => {
    setAnimId(id);
    setAnimP(0);
  };

  const wave = Math.sin(tick*.05)*2.5;

  return (
    <div style={{height:'100vh',background:'#0a0a0a',display:'flex',justifyContent:'center',overflow:'hidden'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;500;600&family=Space+Mono:wght@400;700&display=swap');*{box-sizing:border-box;}`}</style>
      <div style={{width:'100%',maxWidth:420,height:'100vh',background:'#060606',position:'relative',display:'flex',flexDirection:'column',overflow:'hidden',fontFamily:chakra}}>
        <Grid/>
        <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0,background:'radial-gradient(ellipse at 50% 40%,rgba(255,255,255,0.012) 0%,transparent 65%)'}}/>

        {/* HEADER */}
        <div style={{height:56,position:'relative',zIndex:20,display:'flex',alignItems:'center',padding:'0 20px',justifyContent:'space-between',flexShrink:0}}>
          <svg style={{position:'absolute',bottom:0,left:0,right:0}} viewBox="0 0 400 8" preserveAspectRatio="none">
            <path d={`M0,${4+wave} Q100,${1+wave} 200,${4+wave} Q300,${7+wave} 400,${4+wave}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
          </svg>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{color:'#fff',fontFamily:mono,fontSize:14,fontWeight:700,letterSpacing:3}}>PETRI</span>
            <div style={{width:1,height:14,background:'rgba(255,255,255,0.14)'}}/>
            <span style={{color:'rgba(255,255,255,0.28)',fontFamily:mono,fontSize:7,letterSpacing:1}}>ANIM LAB</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <div style={{width:5,height:5,borderRadius:'50%',background:'rgba(255,255,255,0.6)'}}/>
            <span style={{color:'rgba(255,255,255,0.5)',fontFamily:mono,fontSize:9}}>4,280</span>
          </div>
        </div>

        {/* CONTENT — lab screen */}
        <div style={{flex:1,position:'relative',overflow:'hidden',paddingBottom:0}}>

          {/* particles */}
          {Array.from({length:5},(_,i)=>(
            <div key={i} style={{position:'absolute',width:1.5,height:1.5,borderRadius:'50%',background:'rgba(255,255,255,0.45)',left:(10+i*18)+'%',top:(12+Math.sin(tick*.03+i)*11)+'%',opacity:.09+Math.sin(tick*.04+i)*.08,pointerEvents:'none'}}/>
          ))}

          {/* top overlay */}
          <div style={{position:'absolute',top:0,left:0,right:0,zIndex:10,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 16px'}}>
            <div style={{padding:'5px 10px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.4)',fontFamily:mono,fontSize:8}}>
              ☰ Dish Alpha
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{color:'rgba(255,255,255,0.25)',fontSize:8,fontFamily:mono}}>LVL 4</span>
              <div style={{width:48,height:2,background:'rgba(255,255,255,0.07)',borderRadius:1}}>
                <div style={{width:'68%',height:'100%',background:'rgba(255,255,255,0.3)',borderRadius:1,transition:animId==='X1'?'width 0.8s ease':'none',...(animId==='X1'?{width:`${68+animP*20}%`}:{})}}/>

              </div>
            </div>
          </div>

          {/* shipment card */}
          <div style={{position:'absolute',top:40,left:16,zIndex:10,padding:'7px 11px',background:'rgba(10,10,10,0.95)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,opacity:animId==='SH1'?Math.max(0,1-animP*2.2):1,transition:'opacity 0.1s'}}>
            <div style={{color:'rgba(255,255,255,0.25)',fontSize:6.5,fontFamily:mono,letterSpacing:.5,marginBottom:2}}>INCOMING</div>
            <div style={{color:'rgba(255,255,255,0.7)',fontSize:8,fontFamily:mono}}>× 8 Stabiliser</div>
            {animId==='SH1'&&animP>0.45&&(
              <div style={{color:'#1fcc79',fontSize:8,fontFamily:mono,marginTop:2}}>✓ collected</div>
            )}
          </div>

          {/* trigger panel */}
          <TriggerPanel animId={animId} animP={animP} onTrigger={triggerAnim}/>

          {/* DISH — absolutely centred */}
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:2}}>
            <PetriDish tick={tick} animId={animId} animP={animP} fastTick={fastTick}/>
            {/* dish stats */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginTop:14}}>
              {['DISH 01','7 NODES','42% STABLE'].map((l,i)=>(
                <React.Fragment key={i}>
                  {i>0&&<div style={{width:1,height:10,background:'rgba(255,255,255,0.1)'}}/>}
                  <span style={{color:'rgba(255,255,255,0.2)',fontSize:7.5,fontFamily:mono}}>{l}</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* animation label badge — bottom of content */}
          <div style={{position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',zIndex:15}}>
            {animId ? (
              <div style={{padding:'5px 14px',background:'rgba(6,6,6,0.95)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:20,display:'flex',alignItems:'center',gap:8}}>
                <span style={{color:TIER_COLORS[ANIM_DEFS[animId].tier],fontFamily:mono,fontSize:7.5,fontWeight:700}}>{animId}</span>
                <span style={{color:'rgba(255,255,255,0.45)',fontFamily:mono,fontSize:7.5}}>{ANIM_DEFS[animId].label}</span>
                <span style={{color:'rgba(255,255,255,0.2)',fontFamily:mono,fontSize:7}}>loops</span>
              </div>
            ) : (
              <div style={{padding:'5px 14px',background:'rgba(6,6,6,0.7)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:20}}>
                <span style={{color:'rgba(255,255,255,0.2)',fontFamily:mono,fontSize:7.5}}>tap ⚡ to preview animations</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
