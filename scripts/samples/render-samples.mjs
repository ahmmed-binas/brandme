// Renders the original sample imagery used in template previews into public/samples.
// Everything is drawn from code (no stock photos), so it is ours to ship.
//   node scripts/samples/render-samples.mjs [name-filter]
// Needs Playwright's Chromium (PLAYWRIGHT_BROWSERS_PATH or CHROMIUM_PATH) and sharp.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { moreCanvasLib, moreCanvasScenes, moreFonts, moreHtml } from "./scenes-more.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = path.join(root, "public/samples");
// Fonts are inlined as data URLs: a page set with setContent cannot load file:// fonts.
const font = (pkg, file) => path.join(root, "node_modules", pkg, "files", file);
const FONTS = {
  "Instrument Serif": font("@fontsource/instrument-serif", "instrument-serif-latin-400-normal.woff2"),
  "Instrument Serif Italic": font("@fontsource/instrument-serif", "instrument-serif-latin-400-italic.woff2"),
  Grotesk: font("@fontsource-variable/space-grotesk", "space-grotesk-latin-wght-normal.woff2"),
  Anton: font("@fontsource/anton", "anton-latin-400-normal.woff2"),
  Unbounded: font("@fontsource-variable/unbounded", "unbounded-latin-wght-normal.woff2"),
  Fraunces: font("@fontsource-variable/fraunces", "fraunces-latin-full-normal.woff2"),
  Mono: font("@fontsource/ibm-plex-mono", "ibm-plex-mono-latin-400-normal.woff2"),
  Bowlby: font("@fontsource/bowlby-one", "bowlby-one-latin-400-normal.woff2"),
  Inter: font("@fontsource-variable/inter-tight", "inter-tight-latin-wght-normal.woff2"),
  Bodoni: font("@fontsource-variable/bodoni-moda", "bodoni-moda-latin-wght-normal.woff2"),
};
Object.assign(FONTS, moreFonts(font));
const fontFaces = (await Promise.all(Object.entries(FONTS).map(async ([family, file]) => `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${(await readFile(file)).toString("base64")}) format("woff2");font-weight:100 900;font-display:block}`))).join("");

/* ---------- Canvas helpers, executed in the page ---------- */
const canvasLib = String.raw`
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function noise1(r,n){const v=[];for(let i=0;i<=n;i++)v.push(r());return x=>{const i=Math.floor(x),f=x-i,a=v[i%n],b=v[(i+1)%n],u=f*f*(3-2*f);return a+(b-a)*u}}
function ridge(r,oct=5){const ns=[];for(let o=0;o<oct;o++)ns.push(noise1(r,64));return x=>{let s=0,a=1,f=1,t=0;for(const n of ns){s+=n(x*f)*a;t+=a;a*=.5;f*=2.1}return s/t}}
function grain(c,amount=18,seed=7){const g=c.getContext('2d'),{width:w,height:h}=c,d=g.getImageData(0,0,w,h),r=rng(seed);for(let i=0;i<d.data.length;i+=4){const n=(r()-.5)*amount;d.data[i]+=n;d.data[i+1]+=n;d.data[i+2]+=n}g.putImageData(d,0,0)}
function lerp(a,b,t){return a+(b-a)*t}
function mix(c1,c2,t){const p=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];const a=p(c1),b=p(c2);return 'rgb('+a.map((v,i)=>Math.round(lerp(v,b[i],t))).join(',')+')'}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;document.body.appendChild(c);return c}
function vignette(g,w,h,s=.55){const v=g.createRadialGradient(w/2,h/2,Math.min(w,h)*.3,w/2,h/2,Math.max(w,h)*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,'+s+')');g.fillStyle=v;g.fillRect(0,0,w,h)}

// Layered ridgelines receding into haze: mountains, hills, dunes.
function landscape(o){const w=o.w||1600,h=o.h||1067,c=canvas(w,h),g=c.getContext('2d'),r=rng(o.seed);
 const sky=g.createLinearGradient(0,0,0,h*o.horizon);o.sky.forEach((col,i)=>sky.addColorStop(i/(o.sky.length-1),col));g.fillStyle=sky;g.fillRect(0,0,w,h);
 if(o.sun){const[sx,sy,sr,col]=o.sun;const glow=g.createRadialGradient(sx*w,sy*h,0,sx*w,sy*h,sr*w*6);glow.addColorStop(0,col);glow.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=glow;g.fillRect(0,0,w,h);g.fillStyle=col;g.beginPath();g.arc(sx*w,sy*h,sr*w,0,7);g.fill()}
 const layers=o.layers.length;o.layers.forEach((col,li)=>{const f=ridge(r,o.smooth?3:6),base=h*(o.horizon+li*(o.spread||.07)),amp=h*(o.amp||.18)*(1-li/(layers+2)*.6);
  g.save();if(li<layers-1&&o.haze)g.filter='blur('+Math.max(0,(layers-li-2))*o.haze+'px)';g.beginPath();g.moveTo(0,h);for(let x=0;x<=w;x+=4){const y=base-(o.smooth?Math.pow(f(x/w*(2+li)),1.6):f(x/w*(3+li*1.5)))*amp;g.lineTo(x,y)}g.lineTo(w,h);g.closePath();g.fillStyle=col;g.fill();g.restore();
  if(o.fog&&li<layers-1){const fg=g.createLinearGradient(0,base-amp*.4,0,base+h*.06);fg.addColorStop(0,'rgba(255,255,255,0)');fg.addColorStop(1,o.fog);g.fillStyle=fg;g.fillRect(0,base-amp*.4,w,amp*.4+h*.06)}});
 if(o.trees){g.fillStyle=o.trees;for(let i=0;i<o.treeCount;i++){const x=r()*w,th=h*(.04+r()*.09),y=h*(o.treeLine||.82)+r()*h*.1;g.beginPath();g.moveTo(x,y-th);g.lineTo(x-th*.22,y);g.lineTo(x+th*.22,y);g.fill()}}
 if(o.reeds){g.strokeStyle=o.reeds;for(let i=0;i<260;i++){const x=r()*w,len=h*(.12+r()*.3),bend=(r()-.5)*60;g.lineWidth=1+r()*1.8;g.beginPath();g.moveTo(x,h);g.quadraticCurveTo(x+bend*.3,h-len*.6,x+bend,h-len);g.stroke()}}
 vignette(g,w,h,o.vignette??.35);grain(c,o.grain??16,o.seed);return c}

// Sea horizon with reflection streaks.
function sea(o){const w=1600,h=1067,c=canvas(w,h),g=c.getContext('2d'),r=rng(o.seed),hz=h*o.horizon;
 const sky=g.createLinearGradient(0,0,0,hz);o.sky.forEach((col,i)=>sky.addColorStop(i/(o.sky.length-1),col));g.fillStyle=sky;g.fillRect(0,0,w,hz);
 const water=g.createLinearGradient(0,hz,0,h);o.water.forEach((col,i)=>water.addColorStop(i/(o.water.length-1),col));g.fillStyle=water;g.fillRect(0,hz,w,h-hz);
 if(o.sun){g.fillStyle=o.sun;g.beginPath();g.arc(w*o.sunX,hz-h*.02,w*.018,0,7);g.fill()}
 for(let i=0;i<900;i++){const y=hz+Math.pow(r(),1.6)*(h-hz),spread=(y-hz)/(h-hz),x=w*o.sunX+(r()-.5)*w*(.05+spread*.5);g.fillStyle='rgba(255,240,220,'+(.05+.25*(1-spread))*r()+')';g.fillRect(x,y,8+r()*80*spread,1+spread*2)}
 if(o.cloud){g.save();g.filter='blur(30px)';g.fillStyle=o.cloud;for(let i=0;i<9;i++){g.beginPath();g.ellipse(r()*w,hz*(.25+r()*.5),200+r()*300,20+r()*30,0,0,7);g.fill()}g.restore()}
 vignette(g,w,h,.3);grain(c,14,o.seed);return c}

// Night city: out-of-focus lights.
function bokeh(o){const w=1600,h=1067,c=canvas(w,h),g=c.getContext('2d'),r=rng(o.seed);const bg=g.createLinearGradient(0,0,0,h);bg.addColorStop(0,o.bg[0]);bg.addColorStop(1,o.bg[1]);g.fillStyle=bg;g.fillRect(0,0,w,h);
 g.globalCompositeOperation='lighter';for(let i=0;i<o.count;i++){const x=r()*w,y=h*(.25+r()*.6),rad=8+Math.pow(r(),2)*o.size,col=o.colors[Math.floor(r()*o.colors.length)];const gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,col.replace('A',.5*r()+.15));gr.addColorStop(.85,col.replace('A',.25*r()+.08));gr.addColorStop(1,col.replace('A',0));g.fillStyle=gr;g.beginPath();g.arc(x,y,rad,0,7);g.fill()}
 g.globalCompositeOperation='source-over';vignette(g,w,h,.6);grain(c,20,o.seed);return c}

// Soft-edged colour-field painting on canvas texture.
function colorField(o){const w=1200,h=1500,c=canvas(w,h),g=c.getContext('2d'),r=rng(o.seed);g.fillStyle=o.ground;g.fillRect(0,0,w,h);
 o.blocks.forEach(([y0,y1,col])=>{g.save();g.filter='blur(14px)';g.fillStyle=col;for(let k=0;k<5;k++){g.globalAlpha=.45;g.fillRect(w*.09+(r()-.5)*14,h*y0+(r()-.5)*14,w*.82+(r()-.5)*20,h*(y1-y0)+(r()-.5)*20)}g.restore()});
 g.globalAlpha=.06;for(let y=0;y<h;y+=3){g.fillStyle=r()>.5?'#000':'#fff';g.fillRect(0,y,w,1)}for(let x=0;x<w;x+=3){g.fillStyle=r()>.5?'#000':'#fff';g.fillRect(x,0,1,h)}g.globalAlpha=1;grain(c,22,o.seed);return c}

// Bauhaus-like geometric composition on cream stock.
function geometric(o){const w=1200,h=1500,c=canvas(w,h),g=c.getContext('2d'),r=rng(o.seed);g.fillStyle=o.ground;g.fillRect(0,0,w,h);
 const P=o.colors;g.fillStyle=P[0];g.beginPath();g.arc(w*.62,h*.34,w*.26,0,7);g.fill();g.fillStyle=P[1];g.fillRect(w*.12,h*.48,w*.44,h*.36);
 g.fillStyle=P[2];g.beginPath();g.arc(w*.56,h*.84,w*.2,Math.PI,0);g.fill();g.strokeStyle=P[3];g.lineWidth=14;g.beginPath();g.moveTo(w*.08,h*.2);g.lineTo(w*.9,h*.62);g.stroke();
 g.fillStyle=P[3];g.fillRect(w*.74,h*.62,w*.1,h*.24);g.beginPath();g.arc(w*.24,h*.24,w*.06,0,7);g.fill();
 for(let i=0;i<4000;i++){g.fillStyle='rgba(60,40,20,'+r()*.06+')';g.fillRect(r()*w,r()*h,1.5,1.5)}grain(c,26,o.seed);return c}

// Ink wash: feathered dark pools on paper.
function inkWash(o){const w=1200,h=1500,c=canvas(w,h),g=c.getContext('2d'),r=rng(o.seed);g.fillStyle=o.paper;g.fillRect(0,0,w,h);
 for(let layer=0;layer<3;layer++){g.save();g.filter='blur('+(30-layer*10)+'px)';g.fillStyle=o.ink.replace('A',.25+layer*.18);for(let i=0;i<o.pools;i++){const x=w*(.25+r()*.5),y=h*(.15+r()*.7);g.beginPath();g.ellipse(x,y,w*(.04+r()*.18)/(layer+1),h*(.03+r()*.1)/(layer+1),r()*3,0,7);g.fill()}g.restore()}
 g.strokeStyle=o.ink.replace('A',.85);g.lineCap='round';for(let s=0;s<o.strokes;s++){let x=w*(.2+r()*.6),y=h*(.1+r()*.3);g.lineWidth=2+r()*7;g.beginPath();g.moveTo(x,y);for(let k=0;k<40;k++){x+=(r()-.5)*24;y+=r()*26;g.lineTo(x,y)}g.stroke()}
 for(let i=0;i<9000;i++){g.fillStyle='rgba(120,100,70,'+r()*.05+')';g.fillRect(r()*w,r()*h,2,2)}grain(c,18,o.seed);return c}

// Two-ink risograph print with halftone and misregistration.
function riso(o){const w=1200,h=1500,c=canvas(w,h),g=c.getContext('2d'),r=rng(o.seed);g.fillStyle=o.paper;g.fillRect(0,0,w,h);g.globalCompositeOperation='multiply';
 const shape=(col,dx,dy,fn)=>{g.save();g.translate(dx,dy);g.fillStyle=col;fn();g.restore()};
 shape(o.inks[0],0,0,()=>{g.beginPath();g.arc(w*.42,h*.38,w*.3,0,7);g.fill();g.fillRect(w*.1,h*.7,w*.8,h*.14)});
 shape(o.inks[1],9,-6,()=>{g.beginPath();g.moveTo(w*.2,h*.9);g.lineTo(w*.62,h*.18);g.lineTo(w*.92,h*.9);g.fill();g.beginPath();g.arc(w*.72,h*.3,w*.1,0,7);g.fill()});
 g.globalCompositeOperation='source-over';for(let y=0;y<h;y+=9)for(let x=0;x<w;x+=9){const d=r();if(d>.82){g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.arc(x,y,2.4,0,7);g.fill()}}grain(c,30,o.seed);return c}

// Interior: a room with a window throwing light.
function interior(o){const w=1600,h=1067,c=canvas(w,h),g=c.getContext('2d'),r=rng(o.seed);g.fillStyle=o.wall;g.fillRect(0,0,w,h);
 const floorY=h*.68;const fl=g.createLinearGradient(0,floorY,0,h);fl.addColorStop(0,o.floor[0]);fl.addColorStop(1,o.floor[1]);g.fillStyle=fl;g.fillRect(0,floorY,w,h-floorY);
 for(let i=0;i<14;i++){g.strokeStyle='rgba(0,0,0,.05)';g.beginPath();g.moveTo(0,floorY+i*i*2.2);g.lineTo(w,floorY+i*i*2.2);g.stroke()}
 g.save();g.filter='blur(6px)';g.fillStyle='rgba(255,246,220,.55)';g.beginPath();g.moveTo(w*.18,h*.12);g.lineTo(w*.38,h*.12);g.lineTo(w*.72,h);g.lineTo(w*.34,h);g.fill();g.restore();
 g.fillStyle=o.window;g.fillRect(w*.18,h*.12,w*.2,h*.42);g.fillStyle=o.wall;g.fillRect(w*.278,h*.12,w*.006,h*.42);g.fillRect(w*.18,h*.32,w*.2,h*.006);
 g.fillStyle=o.object;g.fillRect(w*.56,h*.5,w*.26,h*.2);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(w*.56,h*.69,w*.26,h*.02);g.fillStyle=o.accent;g.beginPath();g.arc(w*.66,h*.44,w*.05,Math.PI,0);g.fill();g.fillRect(w*.655,h*.44,w*.01,h*.06);
 vignette(g,w,h,.45);grain(c,14,o.seed);return c}

// Film still: letterboxed, graded, a lone figure.
function still(o){const w=1600,h=670,c=canvas(w,h),g=c.getContext('2d'),r=rng(o.seed);const sky=g.createLinearGradient(0,0,0,h);o.grade.forEach((col,i)=>sky.addColorStop(i/(o.grade.length-1),col));g.fillStyle=sky;g.fillRect(0,0,w,h);
 const f=ridge(r,4);g.fillStyle=o.ground;g.beginPath();g.moveTo(0,h);for(let x=0;x<=w;x+=4)g.lineTo(x,h*o.horizon-f(x/w*3)*h*.08);g.lineTo(w,h);g.fill();
 if(o.light){g.save();g.filter='blur(40px)';g.fillStyle=o.light;g.beginPath();g.arc(w*o.lightX,h*.55,h*.25,0,7);g.fill();g.restore()}
 const fx=w*o.figure,fy=h*o.horizon+4;g.fillStyle=o.ground;g.beginPath();g.ellipse(fx,fy-h*.2,h*.018,h*.025,0,0,7);g.fill();g.fillRect(fx-h*.02,fy-h*.18,h*.04,h*.13);g.fillRect(fx-h*.016,fy-h*.06,h*.012,h*.06);g.fillRect(fx+h*.004,fy-h*.06,h*.012,h*.06);
 vignette(g,w,h,.55);grain(c,26,o.seed);return c}
`;

/* ---------- HTML scenes (UI, covers, posters, drawings, charts) ---------- */
const html = {};
const ui = (title, accent, body) => `<div style="width:1600px;height:1000px;background:#eef0f3;padding:56px;font-family:Inter;box-sizing:border-box">
 <div style="height:100%;border-radius:18px;background:#fff;box-shadow:0 30px 80px rgba(20,30,50,.18);overflow:hidden;display:grid;grid-template-columns:230px 1fr">
  <aside style="background:#0f1420;color:#9aa3b5;padding:28px 22px;font-size:15px;line-height:2.4"><div style="color:#fff;font-weight:700;font-size:19px;margin-bottom:26px"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${accent};margin-right:10px"></span>${title}</div>${["Overview", "Activity", "Accounts", "Reports", "Settings"].map((item, i) => `<div style="${i === 0 ? `color:#fff;background:rgba(255,255,255,.07);margin:0 -10px;padding:0 10px;border-radius:8px` : ""}">${item}</div>`).join("")}</aside>
  <main style="padding:36px 40px;color:#141824">${body}</main></div></div>`;
const spark = (seed, color, w = 520, h = 150) => { let s = seed; const pts = Array.from({ length: 30 }, (_, i) => { s = (s * 9301 + 49297) % 233280; return [i * (w / 29), h - 20 - (s / 233280) * (h * .55) - i * (h * .012)]; }); return `<svg width="${w}" height="${h}"><path d="M${pts.map((p) => p.join(",")).join(" L")}" fill="none" stroke="${color}" stroke-width="3"/><path d="M${pts.map((p) => p.join(",")).join(" L")} L${w},${h} L0,${h}Z" fill="${color}" opacity=".08"/></svg>`; };
html["ui-ledger"] = ui("Ledgerline", "#2f6bff", `<div style="display:flex;justify-content:space-between;align-items:end"><div><div style="font-size:14px;color:#6b7385">Cash position · March</div><div style="font-size:46px;font-weight:700;letter-spacing:-.02em;margin-top:6px">$1,284,920</div></div><div style="font-size:14px;padding:10px 16px;border:1px solid #dfe3ea;border-radius:10px">Export</div></div>
 <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin:30px 0">${[["Runway", "19.4 mo"], ["Burn", "$66.2k"], ["Collected", "94%"]].map(([k, v]) => `<div style="border:1px solid #e6e9ef;border-radius:14px;padding:18px"><div style="font-size:13px;color:#6b7385">${k}</div><div style="font-size:26px;font-weight:650;margin-top:6px">${v}</div></div>`).join("")}</div>
 <div style="border:1px solid #e6e9ef;border-radius:14px;padding:20px">${spark(11, "#2f6bff", 1150, 330)}</div>`);
html["ui-transit"] = `<div style="width:1600px;height:1000px;background:#d8e3dc;display:flex;gap:60px;align-items:center;justify-content:center;font-family:Inter">${[0, 1, 2].map((n) => `<div style="width:330px;height:690px;border-radius:46px;background:#111;padding:12px;box-shadow:0 40px 80px rgba(0,0,0,.25);transform:translateY(${n === 1 ? -30 : 20}px)"><div style="height:100%;border-radius:36px;background:${n === 1 ? "#f6f3ea" : "#fff"};overflow:hidden;position:relative">
 <svg width="306" height="${n === 0 ? 420 : 300}" style="display:block;background:#eef1ec">${Array.from({ length: 9 }, (_, i) => `<path d="M${-20 + i * 40},${40 + i * 30} C ${80 + i * 10},${120 - i * 5} ${150},${200 + i * 8} ${330},${60 + i * 25}" stroke="${["#e4572e", "#2a9d8f", "#264653", "#e9c46a"][i % 4]}" stroke-width="${i % 3 === 0 ? 6 : 3}" fill="none"/>`).join("")}<circle cx="150" cy="170" r="9" fill="#111"/><circle cx="150" cy="170" r="22" fill="#111" opacity=".12"/></svg>
 <div style="padding:20px"><div style="font-size:12px;letter-spacing:.12em;color:#6b6b6b">${["NEXT TRAIN", "YOUR ROUTE", "SAVED"][n]}</div><div style="font-size:30px;font-weight:700;margin:6px 0 14px;letter-spacing:-.02em">${["4 min", "Line 7 → 12", "Home · Work"][n]}</div>${[1, 2, 3].map((k) => `<div style="display:flex;justify-content:space-between;padding:11px 0;border-top:1px solid #e5e2da;font-size:14px"><span>Stop ${k + n * 3}</span><span style="color:#6b6b6b">${k * 3 + n} min</span></div>`).join("")}</div></div></div>`).join("")}</div>`;
html["ui-terminal"] = `<div style="width:1600px;height:1000px;background:radial-gradient(circle at 30% 20%,#2a2f3a,#0c0e12);display:grid;place-items:center;font-family:Mono"><div style="width:1240px;border-radius:14px;background:#0f1115;box-shadow:0 40px 100px rgba(0,0,0,.6);overflow:hidden;border:1px solid #2a2e36">
 <div style="height:42px;background:#181b21;display:flex;align-items:center;gap:9px;padding:0 16px">${["#ff5f57", "#febc2e", "#28c840"].map((c) => `<span style="width:13px;height:13px;border-radius:50%;background:${c}"></span>`).join("")}<span style="margin-left:auto;margin-right:auto;color:#7d8590;font-size:14px">pgtrace — zsh</span></div>
 <pre style="margin:0;padding:30px 34px;color:#c9d1d9;font-size:19px;line-height:1.65;font-family:Mono">$ <span style="color:#79c0ff">pgtrace</span> watch --db orders --slow 40ms
<span style="color:#7d8590">▸ attached to orders@10.0.4.12 (pg 16.2)</span>

  <span style="color:#ffa657">QUERY</span>                                   <span style="color:#7d8590">CALLS   P95     PLAN</span>
  select * from line_items where ord…   1,204   <span style="color:#ff7b72">212ms</span>   Seq Scan
  update carts set touched_at = now…      880    61ms   Index Scan
  select sku, qty from stock where …      4,512    44ms   Bitmap Heap

<span style="color:#3fb950">✓ suggestion</span> create index concurrently on line_items (order_id);
  <span style="color:#7d8590">estimated p95 after: 9ms  (−96%)</span>

$ <span style="background:#c9d1d9;color:#0f1115"> </span></pre></div></div>`;
html["ui-health"] = `<div style="width:1600px;height:1000px;background:#f2e9df;font-family:Inter;position:relative;overflow:hidden"><div style="position:absolute;left:120px;top:110px;font-family:'Instrument Serif';font-size:120px;line-height:.9;color:#3b2a20">Breathe,<br/><i style="font-family:'Instrument Serif Italic'">then begin.</i></div>
 ${[0, 1].map((n) => `<div style="position:absolute;right:${140 + n * 330}px;top:${150 + n * 70}px;width:300px;height:620px;border-radius:44px;background:${n ? "#3b2a20" : "#fffaf3"};box-shadow:0 30px 70px rgba(59,42,32,.25);padding:34px 26px;color:${n ? "#f2e9df" : "#3b2a20"}"><div style="font-size:13px;letter-spacing:.14em;opacity:.6">${n ? "TONIGHT" : "TODAY"}</div><div style="font-family:'Instrument Serif';font-size:44px;line-height:1;margin:12px 0 26px">${n ? "Wind down" : "Morning check-in"}</div><div style="width:200px;height:200px;margin:0 auto;border-radius:50%;background:radial-gradient(circle,${n ? "#c98b5e" : "#e8b89a"},transparent 70%)"></div><div style="margin-top:30px;font-size:15px;line-height:1.6;opacity:.75">${n ? "Seven minutes of slow breathing before sleep." : "How rested do you feel? Tap a word."}</div></div>`).join("")}</div>`;
html["brand-identity"] = `<div style="width:1600px;height:1000px;background:#efe9dc;display:grid;grid-template-columns:1fr 1fr;font-family:Grotesk">
 <div style="background:#14321f;color:#e9f0d8;display:grid;place-items:center"><div style="text-align:center"><svg width="220" height="220" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="#e9f0d8" stroke-width="3"/><path d="M50 14 C 30 40, 30 60, 50 86 C 70 60, 70 40, 50 14Z" fill="#e9f0d8"/></svg><div style="font-size:78px;font-weight:700;letter-spacing:-.04em;margin-top:24px">Fernhouse</div><div style="letter-spacing:.4em;font-size:16px;opacity:.7">NURSERY · EST. 1987</div></div></div>
 <div style="display:grid;grid-template-rows:1fr 1fr"><div style="display:grid;grid-template-columns:repeat(4,1fr)">${["#14321f", "#7aa35a", "#e9f0d8", "#d9622b"].map((c) => `<div style="background:${c};display:flex;align-items:end;padding:18px;font-size:14px;color:${c === "#e9f0d8" ? "#14321f" : "#fff"}">${c}</div>`).join("")}</div>
 <div style="padding:50px;color:#14321f"><div style="font-size:16px;letter-spacing:.2em">TYPE</div><div style="font-size:120px;font-weight:700;letter-spacing:-.05em;line-height:1">Aa Gg</div><div style="font-size:22px;margin-top:12px;opacity:.7">Grown slowly, sold kindly.</div></div></div></div>`;
const cover = (bg, fg, title, author, art) => `<div style="width:1000px;height:1500px;background:${bg};color:${fg};position:relative;overflow:hidden;font-family:Fraunces">${art}<div style="position:absolute;left:80px;right:80px;bottom:110px"><div style="font-size:120px;line-height:.92;letter-spacing:-.03em">${title}</div><div style="margin-top:40px;font-family:Grotesk;letter-spacing:.3em;font-size:22px">${author}</div></div></div>`;
html["cover-salt"] = cover("#e7dccb", "#1c2b3a", "The Salt<br/>Years", "ESSAYS · AMARA OSEI", `<div style="position:absolute;left:80px;top:90px;width:840px;height:700px;background:repeating-linear-gradient(0deg,#1c2b3a 0 3px,transparent 3px 22px);opacity:.85;clip-path:circle(42% at 50% 50%)"></div>`);
html["cover-night"] = cover("#141414", "#f1e3c8", "Night<br/>Shift", "A NOVEL · AMARA OSEI", `<div style="position:absolute;right:-120px;top:120px;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#f1e3c8,#b8562b 60%,transparent 61%)"></div>`);
html["cover-quarterly"] = cover("#c94f2c", "#fbeee4", "Field<br/><i>Notes</i>", "THE HARBOUR QUARTERLY · Nº 14", `<div style="position:absolute;inset:80px 80px auto;height:620px;border:3px solid #fbeee4;display:grid;place-items:center;font-size:200px;font-family:Fraunces">Nº 14</div>`);
const poster = (bg, fg, big, small, extra = "") => `<div style="width:1200px;height:1500px;background:${bg};color:${fg};position:relative;overflow:hidden;font-family:Anton">${extra}<div style="position:absolute;left:70px;right:70px;bottom:80px;font-size:250px;line-height:.82;text-transform:uppercase">${big}</div><div style="position:absolute;left:74px;top:70px;font-family:Grotesk;font-size:24px;letter-spacing:.2em">${small}</div></div>`;
html["poster-run"] = poster("#d7ff3a", "#101010", "Run<br/>your<br/>city", "NORTHLINE × CITY MARATHON 2025", `<div style="position:absolute;right:-200px;top:-150px;width:900px;height:900px;border-radius:50%;border:60px solid #101010"></div>`);
html["poster-oat"] = poster("#f4efe6", "#3a2618", "Oat<br/>milk<br/>era", "OATLY-ISH · OOH CAMPAIGN", `<div style="position:absolute;right:80px;top:180px;width:420px;height:620px;background:#3a2618;border-radius:200px 200px 20px 20px"></div>`);
html["poster-bank"] = poster("#1b2bd6", "#ffffff", "Money,<br/>minus<br/>jargon", "CLEARBANK · LAUNCH CAMPAIGN", `<div style="position:absolute;left:70px;top:150px;font-family:Grotesk;font-size:540px;line-height:1;opacity:.14">£</div>`);
html["poster-gig"] = `<div style="width:1200px;height:1600px;background:#f2e3c6;color:#d0341f;font-family:Bowlby;position:relative;overflow:hidden"><div style="position:absolute;inset:60px;border:8px solid #d0341f"></div><div style="position:absolute;top:120px;width:100%;text-align:center;font-size:250px;line-height:.85">LOW<br/>TIDE</div><div style="position:absolute;top:720px;width:100%;text-align:center;font-family:Grotesk;font-weight:700;font-size:44px;letter-spacing:.3em;color:#1d1d1b">SPRING TOUR</div><div style="position:absolute;bottom:130px;width:100%;text-align:center;font-family:Grotesk;font-size:34px;line-height:1.7;color:#1d1d1b">LISBON · PORTO · MADRID<br/>BERLIN · LEIPZIG · PRAGUE</div><div style="position:absolute;left:50%;top:850px;transform:translateX(-50%);width:300px;height:300px;border-radius:50%;background:#d0341f"></div></div>`;
const album = (bg, art, title) => `<div style="width:1200px;height:1200px;background:${bg};position:relative;overflow:hidden;font-family:Grotesk">${art}<div style="position:absolute;left:60px;bottom:50px;font-size:34px;letter-spacing:.25em;color:rgba(255,255,255,.85)">${title}</div></div>`;
html["album-tide"] = album("#0d2a3a", `<div style="position:absolute;inset:0;background:repeating-radial-gradient(circle at 70% 30%,#e8c07a 0 2px,transparent 3px 26px)"></div>`, "LOW TIDE — SALT");
html["album-glass"] = album("#e6e1d8", `<div style="position:absolute;left:300px;top:200px;width:600px;height:800px;background:linear-gradient(135deg,#ff6b4a,#7b2cbf);border-radius:300px 300px 0 0;filter:blur(2px)"></div>`, "GLASSHOUSE");
html["album-field"] = album("#1d1d1b", `<svg width="1200" height="1200" style="position:absolute">${Array.from({ length: 40 }, (_, i) => `<line x1="0" y1="${i * 30}" x2="1200" y2="${i * 30 + Math.sin(i) * 120}" stroke="#d9d4c7" stroke-width="2" opacity="${.15 + (i % 5) * .15}"/>`).join("")}</svg>`, "FIELD RECORDINGS");
html["album-sun"] = album("#f0b429", `<div style="position:absolute;left:150px;top:150px;width:900px;height:900px;border-radius:50%;background:#c2410c"></div><div style="position:absolute;left:0;right:0;top:640px;height:560px;background:#1e3a5f"></div>`, "SUNROOM SESSIONS");
const plan = String.raw`<svg width="1600" height="1100" viewBox="0 0 1600 1100" style="background:#f6f4ee;font-family:Mono" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="h" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="#1a1a1a" stroke-width="1.2"/></pattern></defs>
<g stroke="#1a1a1a" fill="none"><rect x="200" y="180" width="1000" height="640" stroke-width="16" fill="url(#h)" fill-opacity=".0"/>
<path d="M200 180 h1000 v640 h-1000z" stroke-width="18"/><path d="M620 180 v300 M620 560 v260 M200 500 h260 M540 500 h80 M900 180 v220 M900 480 v340" stroke-width="10"/>
<path d="M460 500 a80 80 0 0 1 80 -80" stroke-width="2"/><path d="M620 480 a80 80 0 0 1 80 80" stroke-width="2"/><path d="M900 400 a80 80 0 0 0 -80 80" stroke-width="2"/>
<g stroke-width="2"><rect x="960" y="560" width="180" height="200"/><circle cx="1050" cy="660" r="56"/><rect x="250" y="560" width="260" height="120"/><rect x="700" y="230" width="150" height="90"/><path d="M680 640 h180 M680 700 h180 M680 760 h180"/></g>
<path d="M200 900 h1000 M200 890 v20 M1200 890 v20 M620 890 v20 M900 890 v20" stroke-width="1.5"/></g>
<g font-size="20" fill="#1a1a1a"><text x="380" y="360">LIVING</text><text x="720" y="380">KITCHEN</text><text x="1000" y="330">STUDY</text><text x="300" y="740">BATH</text><text x="700" y="610">STAIR</text><text x="990" y="790">BED</text><text x="380" y="935">4 200</text><text x="740" y="935">2 800</text><text x="1030" y="935">3 000</text></g>
<g transform="translate(1270 820)"><rect width="300" height="230" fill="none" stroke="#1a1a1a" stroke-width="2"/><text x="20" y="44" font-size="22" fill="#1a1a1a">HOUSE ON A SLOPE</text><text x="20" y="84" font-size="16" fill="#555">GROUND FLOOR PLAN</text><text x="20" y="120" font-size="16" fill="#555">SCALE 1:100</text><text x="20" y="200" font-size="40" fill="#1a1a1a">A-101</text></g>
<g transform="translate(1380 220)"><circle r="44" fill="none" stroke="#1a1a1a" stroke-width="2"/><path d="M0 -44 L14 10 L0 0 L-14 10Z" fill="#1a1a1a"/><text x="-8" y="-56" font-size="20" fill="#1a1a1a">N</text></g></svg>`;
html["arch-plan"] = plan;
html["arch-section"] = String.raw`<svg width="1600" height="1100" viewBox="0 0 1600 1100" style="background:#efe7d8" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#2b2620"><path d="M80 820 C 400 800, 700 700, 1520 560" stroke-width="3"/><path d="M80 860 C 400 840, 700 740, 1520 600" stroke-width="1" stroke-dasharray="6 6"/>
<path d="M360 790 v-360 h520 l120 -120 h300 v300" stroke-width="12"/><path d="M360 600 h640 M760 430 v360" stroke-width="6"/><path d="M1000 310 v380 l300 -120" stroke-width="6"/>
${Array.from({ length: 14 }, (_, i) => `<path d="M${400 + i * 24} 600 l20 -26" stroke-width="2"/>`).join("")}<circle cx="1320" cy="230" r="60" stroke-width="2"/>${Array.from({ length: 8 }, (_, i) => `<line x1="1320" y1="230" x2="${1320 + Math.cos(i * .8) * 110}" y2="${230 + Math.sin(i * .8) * 110}" stroke-width="1"/>`).join("")}
<path d="M420 430 L760 790" stroke="#b5562a" stroke-width="2" stroke-dasharray="10 8"/></g><text x="90" y="1040" font-family="Mono" font-size="22" fill="#2b2620">SECTION A–A · SUN PATH, 21 JUNE · 1:200</text></svg>`;
html["arch-model"] = `<div style="width:1600px;height:1067px;background:linear-gradient(#cfd5d8,#eef0ef);display:grid;place-items:center"><div style="position:relative;width:900px;height:600px;transform:perspective(1600px) rotateX(55deg) rotateZ(-32deg)">${[[0, 0, 500, 300, 160], [520, 0, 380, 300, 260], [0, 320, 900, 280, 80]].map(([x, y, w, h, z]) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:#f4f1ea;box-shadow:${Array.from({ length: Math.round(z / 8) }, (_, i) => `${i + 1}px ${i + 1}px 0 #d9d3c7`).join(",")},${z / 2}px ${z / 2}px 60px rgba(0,0,0,.25)"></div>`).join("")}</div></div>`;
const chart = (title, body) => `<div style="width:1600px;height:1000px;background:#fbfaf7;font-family:Inter;padding:70px 80px;box-sizing:border-box;color:#191919"><div style="font-size:16px;letter-spacing:.16em;color:#8a8a8a">FIGURE</div><div style="font-family:Fraunces;font-size:54px;letter-spacing:-.02em;margin:8px 0 40px">${title}</div>${body}</div>`;
html["chart-scatter"] = chart("Delivery delay vs. distance, 41k orders", `<svg width="1440" height="680"><g stroke="#dcd8cf">${[0, 1, 2, 3, 4].map((i) => `<line x1="60" x2="1420" y1="${40 + i * 150}" y2="${40 + i * 150}"/>`).join("")}</g>${Array.from({ length: 900 }, (_, i) => { const x = 70 + ((i * 7919) % 1340); const y = 640 - (x - 70) * .32 - ((i * 104729) % 260); return `<circle cx="${x}" cy="${Math.max(50, y)}" r="3" fill="${i % 9 === 0 ? "#d1495b" : "#30638e"}" opacity=".55"/>`; }).join("")}<path d="M70 640 L1410 210" stroke="#191919" stroke-width="3"/></svg>`);
html["chart-bars"] = chart("Churn by onboarding path", `<div style="display:flex;align-items:end;gap:46px;height:600px;border-bottom:2px solid #191919">${[62, 48, 31, 22, 14, 9].map((v, i) => `<div style="flex:1;text-align:center"><div style="font-size:24px;margin-bottom:10px">${v}%</div><div style="height:${v * 8}px;background:${i === 4 ? "#d1495b" : "#30638e"}"></div><div style="font-size:16px;color:#6a6a6a;margin-top:14px">Path ${String.fromCharCode(65 + i)}</div></div>`).join("")}</div>`);
html["chart-lines"] = chart("Forecast vs. actual demand, weekly", `<svg width="1440" height="660">${[0, 1, 2].map((k) => { let y = 400; const d = Array.from({ length: 60 }, (_, i) => { y += Math.sin(i * .4 + k) * 22 - (k === 0 ? 2.2 : 1.6); return `${20 + i * 24},${y}`; }).join(" L"); return `<path d="M${d}" fill="none" stroke="${["#191919", "#30638e", "#d1495b"][k]}" stroke-width="${k ? 3 : 2}" ${k === 2 ? 'stroke-dasharray="10 8"' : ""}/>`; }).join("")}</svg>`);
html["chart-umap"] = chart("UMAP of 180,000 embryonic cells, E6.5–E8.5", `<svg width="1440" height="680">${[["#30638e", 380, 330], ["#d1495b", 760, 220], ["#edae49", 1080, 380], ["#00798c", 560, 520], ["#66a182", 980, 560]].map(([colour, cx, cy], k) => Array.from({ length: 420 }, (_, i) => { const a = (i * 2.399) % 6.283, r = Math.sqrt((i * 7919 % 1000) / 1000) * (90 + k * 12); return `<circle cx="${cx + Math.cos(a) * r * 1.4}" cy="${cy + Math.sin(a) * r * .8}" r="2.6" fill="${colour}" opacity=".55"/>`; }).join("")).join("")}<path d="M380 330 C 520 300, 620 240, 760 220 S 1000 300, 1080 380" fill="none" stroke="#191919" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/></svg>`);
html["chart-trajectory"] = chart("Posterior pseudotime with 90% credible bands", `<svg width="1440" height="660"><path d="M40 560 C 300 540, 500 420, 760 300 S 1200 120, 1400 100 L1400 190 C 1200 220, 1000 330, 760 400 S 300 600, 40 620Z" fill="#30638e" opacity=".14"/><path d="M40 590 C 300 570, 500 450, 760 350 S 1200 160, 1400 145" fill="none" stroke="#30638e" stroke-width="4"/>${Array.from({ length: 160 }, (_, i) => { const x = 40 + i * 8.5; const y = 590 - (x - 40) * .33 + Math.sin(i * 1.7) * 38; return `<circle cx="${x}" cy="${y}" r="3" fill="#d1495b" opacity=".6"/>`; }).join("")}</svg>`);
html["slide-deck"] = `<div style="width:1600px;height:1000px;background:#111;display:grid;place-items:center;font-family:Grotesk"><div style="width:1360px;height:765px;background:#f5f1e8;padding:70px;box-sizing:border-box;position:relative"><div style="font-size:18px;letter-spacing:.2em;color:#888">Q3 REVIEW · 04 / 18</div><div style="font-family:Fraunces;font-size:110px;line-height:.95;letter-spacing:-.03em;margin-top:40px;color:#151515">Retention is<br/>the <i style="color:#c2410c">growth</i> plan.</div><div style="position:absolute;right:70px;bottom:70px;font-size:160px;font-weight:700;color:#c2410c">+38%</div></div></div>`;
html["calm-water"] = `<div style="width:1600px;height:1067px;background:radial-gradient(ellipse at 50% 40%,#d9e4dc,#9fb7aa 60%,#6f8f80);position:relative;overflow:hidden">${Array.from({ length: 14 }, (_, i) => `<div style="position:absolute;left:50%;top:48%;width:${120 + i * 120}px;height:${50 + i * 50}px;transform:translate(-50%,-50%);border-radius:50%;border:${i % 3 ? 1 : 2}px solid rgba(255,255,255,${.5 - i * .03})"></div>`).join("")}</div>`;

/* ---------- Scene list ---------- */
const canvasScenes = {
  "photo-ridges": `landscape({seed:3,horizon:.42,sky:['#e9d8c4','#f3e6d6','#d9c7b8'],layers:['#b9a99f','#9a8a86','#7a6c70','#544b56','#2f2a35'],haze:3,fog:'rgba(240,226,210,.55)',sun:[.7,.3,.022,'rgba(255,236,210,.95)'],amp:.2})`,
  "photo-bluehour": `landscape({seed:9,horizon:.5,sky:['#1d2b4a','#43557a','#a7a3b8'],layers:['#5b6584','#3f4866','#2b3149','#171b2b'],haze:4,fog:'rgba(170,170,200,.35)',amp:.16})`,
  "photo-dunes": `landscape({seed:21,horizon:.45,sky:['#f2c49b','#f7dcc0','#f0e0cc'],layers:['#e0a878','#cf8d5e','#b97448','#8e5233'],smooth:true,spread:.12,amp:.22,sun:[.25,.33,.03,'rgba(255,245,225,.9)'],vignette:.3})`,
  "photo-forest": `landscape({seed:5,horizon:.55,sky:['#dfe4e2','#eef0ee'],layers:['#c7cfcc','#aeb8b5','#e9eceb'],haze:5,amp:.1,trees:'#2c3a37',treeCount:340,treeLine:.78,vignette:.25,grain:20})`,
  "photo-reeds": `landscape({seed:14,horizon:.62,sky:['#f1e9dc','#e9dccb'],layers:['#cdbfae','#b9a894'],amp:.06,reeds:'rgba(70,58,40,.75)',vignette:.3})`,
  "photo-sea": `sea({seed:2,horizon:.52,sky:['#dfe6ea','#f2efe8','#f6e2c9'],water:['#a9b9c0','#6f8792','#3f5560'],sunX:.62,sun:'rgba(255,240,215,.95)',cloud:'rgba(255,255,255,.45)'})`,
  "photo-harbour": `sea({seed:8,horizon:.58,sky:['#0f1a2e','#2b3b5e','#c9876b'],water:['#3a4256','#1d2335','#0b0f1a'],sunX:.35,sun:'rgba(255,190,140,.9)'})`,
  "photo-city": `bokeh({seed:4,bg:['#06070c','#151826'],count:220,size:90,colors:['rgba(255,170,90,A)','rgba(255,220,160,A)','rgba(120,170,255,A)','rgba(255,90,110,A)']})`,
  "art-field-red": `colorField({seed:1,ground:'#5a1d1a',blocks:[[.08,.42,'#c2452d'],[.48,.9,'#2a0e10']]})`,
  "art-field-blue": `colorField({seed:6,ground:'#1e2c3d',blocks:[[.07,.55,'#3d6d8f'],[.6,.92,'#c9b38a']]})`,
  "art-geometric": `geometric({seed:2,ground:'#efe6d2',colors:['#d1462f','#1f3f8f','#e7b12d','#1b1b1b']})`,
  "art-geometric-2": `geometric({seed:11,ground:'#e8e2d4',colors:['#2d6a4f','#e76f51','#264653','#1b1b1b']})`,
  "art-ink": `inkWash({seed:3,paper:'#f1ebdf',ink:'rgba(24,22,30,A)',pools:9,strokes:5})`,
  "art-ink-2": `inkWash({seed:19,paper:'#ece4d4',ink:'rgba(34,48,70,A)',pools:12,strokes:3})`,
  "art-riso": `riso({seed:4,paper:'#f3eee3',inks:['#ff48b0','#0078bf']})`,
  "art-riso-2": `riso({seed:12,paper:'#f6f0e4',inks:['#ffe800','#00a95c']})`,
  "interior-oak": `interior({seed:2,wall:'#e8e0d2',floor:['#b88b5e','#8c6440'],window:'#f8f3e6',object:'#5c6b5a',accent:'#d6a35c'})`,
  "interior-stone": `interior({seed:5,wall:'#d8d3cb',floor:['#a8a39a','#7d786f'],window:'#f3f1ec',object:'#2f2d2a',accent:'#b0532c'})`,
  "still-dunes": `still({seed:3,grade:['#14303a','#2f6b6f','#d9a066'],ground:'#111316',horizon:.72,figure:.62,light:'rgba(255,170,90,.5)',lightX:.3})`,
  "still-snow": `still({seed:7,grade:['#cfd8de','#e8ecee','#f6f7f7'],ground:'#2a2d33',horizon:.66,figure:.3})`,
  "still-night": `still({seed:12,grade:['#05070d','#14213d','#3a2e5f'],ground:'#020203',horizon:.78,figure:.5,light:'rgba(120,160,255,.45)',lightX:.5})`,
};
Object.assign(canvasScenes, moreCanvasScenes);
Object.assign(html, moreHtml);
const sizes = { ui: [1600, 1000], cover: [1000, 1500], poster: [1200, 1500], album: [1200, 1200], arch: [1600, 1100], chart: [1600, 1000], slide: [1600, 1000], brand: [1600, 1000], calm: [1600, 1067] };

const filter = process.argv[2];
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage({ deviceScaleFactor: 1 });
const save = async (name, png, width) => {
  await sharp(png).resize({ width: Math.min(width, 1600), withoutEnlargement: true }).webp({ quality: 74 }).toFile(path.join(out, `${name}.webp`));
  console.log("✓", name);
};

for (const [name, call] of Object.entries(canvasScenes)) {
  if (filter && !name.includes(filter)) continue;
  await page.setContent(`<html><body style="margin:0;background:#000"><script>${canvasLib}${moreCanvasLib}</script></body></html>`);
  const data = await page.evaluate(`(()=>{const c=${call};return c.toDataURL('image/png')})()`);
  const buffer = Buffer.from(data.split(",")[1], "base64");
  await save(name, buffer, 1600);
}
for (const [name, markup] of Object.entries(html)) {
  if (filter && !name.includes(filter)) continue;
  const [w, h] = sizes[name.split("-")[0]] ?? [1600, 1000];
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><head><style>${fontFaces} body{margin:0} *{box-sizing:border-box}</style></head><body>${markup}</body></html>`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await save(name, await page.screenshot({ clip: { x: 0, y: 0, width: w, height: h } }), w);
}
await browser.close();
