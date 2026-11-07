'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- Music: starts at page load; if the browser blocks sound, it plays muted and unmutes on the very first touch ---------- */
const song=$('#song'),muteBtn=$('#mute');let muted=false,pending=false,actx=null;
song.volume=.7;
function unlock(){
  actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();
  if(pending){pending=false;song.muted=muted;song.play().catch(()=>{})}
  else if(song.paused&&!muted)song.play().catch(()=>{});
}
const EV=['pointerdown','touchstart','touchend','click','keydown'];
EV.forEach(e=>addEventListener(e,unlock,{passive:true}));
const enter=$('#enter'),hideEnter=()=>enter.classList.add('gone');
song.play().then(hideEnter).catch(()=>{song.muted=true;pending=true;song.play().catch(()=>{})});
['pointerdown','touchend','click'].forEach(e=>enter.addEventListener(e,()=>{unlock();song.muted=muted;song.play().catch(()=>{});hideEnter()}));
enter.addEventListener('keydown',()=>{unlock();song.play().catch(()=>{});hideEnter()});
muteBtn.onclick=()=>{unlock();muted=!muted;song.muted=muted;pending=false;muteBtn.textContent=muted?'🔇':'🔊';muteBtn.setAttribute('aria-pressed',muted);muteBtn.setAttribute('aria-label',muted?'Unmute music':'Mute music')};
function snd(type){
  if(muted||!actx)return;const t=actx.currentTime,len={boom:.8,fizz:1.2,pop:.25,whistle:.9}[type]||.4;
  const buf=actx.createBuffer(1,actx.sampleRate*len,actx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,type==='fizz'?.6:3);
  const s=actx.createBufferSource();s.buffer=buf;const f=actx.createBiquadFilter();f.type=type==='boom'?'lowpass':'highpass';f.frequency.value=type==='boom'?400:3000;
  const g=actx.createGain();g.gain.value=.25;s.connect(f).connect(g).connect(actx.destination);s.start(t);
}

/* ---------- Particles ---------- */
const cv=$('#fx'),cx=cv.getContext('2d');let W,H,parts=[];
function size(){const r=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*r;cv.height=H*r;cx.setTransform(r,0,0,r,0,0)}
addEventListener('resize',size);size();
const GOLD=['#ffd45a','#ffe9a0','#ffb23a','#fff6d0'],BR=['#ff3d8b','#ffd45a','#7be0ff','#b46bff','#6dff9a','#ff7a3a'];
const P=(x,y,vx,vy,life,color,sz=2,g=.06,drag=.985,trail=false)=>parts.push({x,y,vx,vy,life,max:life,color,sz,g,drag,trail});
const glow=(x,y)=>parts.push({flash:1,x,y,life:10,max:10});
function burst(x,y,cols,n=80,sp=5){cols=cols||[BR[Math.random()*6|0],'#ffe9a0'];
  for(let i=0;i<n;i++){const a=Math.PI*2*i/n,v=sp*(.5+Math.random()*.6);P(x,y,Math.cos(a)*v,Math.sin(a)*v,55+Math.random()*30,cols[i%cols.length],2.2,.05,.97,true)}glow(x,y);snd('boom')}
function sparkle(x,y,n=6){for(let i=0;i<n;i++)P(x+(Math.random()-.5)*30,y+(Math.random()-.5)*30,(Math.random()-.5)*1.2,-Math.random()*1.5,40+Math.random()*30,GOLD[i%4],1.6,-.01,1)}
function rocketUp(x0,y0,ty,done){let x=x0,y=y0;const tx=x0+(Math.random()-.5)*120;
  const t=setInterval(()=>{y-=11;x+=(tx-x)*.03;for(let i=0;i<3;i++)P(x,y+16,Math.random()-.5,2+Math.random(),22,i?'#ffb23a':'#fff',2,.02,.96);
    if(y<=ty){clearInterval(t);burst(x,y,[BR[Math.random()*6|0],'#ffe9a0',BR[Math.random()*6|0]],120,5.5);done&&done()}},20)}
(function loop(){cx.clearRect(0,0,W,H);cx.globalCompositeOperation='lighter';parts=parts.filter(p=>p.life>0);
  for(const p of parts){p.life--;
    if(p.flash){const g=cx.createRadialGradient(p.x,p.y,0,p.x,p.y,110);g.addColorStop(0,`rgba(255,220,150,${p.life/p.max*.4})`);g.addColorStop(1,'rgba(255,220,150,0)');cx.fillStyle=g;cx.fillRect(p.x-110,p.y-110,220,220);continue}
    p.vx*=p.drag;p.vy=p.vy*p.drag+p.g;p.x+=p.vx;p.y+=p.vy;cx.globalAlpha=Math.max(p.life/p.max,0);cx.fillStyle=cx.strokeStyle=p.color;
    if(p.trail){cx.lineWidth=p.sz;cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(p.x-p.vx*2.5,p.y-p.vy*2.5);cx.stroke()}else{cx.beginPath();cx.arc(p.x,p.y,p.sz,0,7);cx.fill()}}
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over';requestAnimationFrame(loop)})();
const center=el=>{const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};

/* ---------- Opening: sky full of rockets + typewriter ---------- */
for(let i=0;i<9;i++)setTimeout(()=>{snd('whistle');rocketUp(W*(.1+.8*Math.random()),H+10,H*(.1+.3*Math.random()))},300+i*550);
setInterval(()=>{if(Math.random()<.7)rocketUp(W*(.1+.8*Math.random()),H+10,H*(.1+.35*Math.random()))},3200);
async function type(el,caret,text,d){if(caret)caret.style.display='inline-block';for(const ch of text){el.textContent+=ch;await sleep(d+Math.random()*60)}if(caret)caret.style.display='none'}
(async()=>{await sleep(500);await type($('#t1'),$('#c1'),'Happy Diwali',120);await sleep(200);await type($('#t2'),null,'Sidra Sheikh',100);
  const[x,y]=center($('#t1'));for(let i=0;i<12;i++)setTimeout(()=>sparkle(x+(Math.random()-.5)*W*.6,y+(Math.random()-.5)*50,8),i*120)})();

/* ---------- Diyas ---------- */
let lit=0;
for(let i=0;i<2;i++){const w=document.createElement('div');w.className='dw';
  w.innerHTML=`<div class="diya c${i}"><i class="wick"></i><i class="flame"></i></div><button class="act" aria-label="Light diya ${i+1}">🪔 Light</button>`;
  const b=$('button',w),d=$('.diya',w);
  b.onclick=()=>{if(d.classList.contains('lit'))return;unlock();d.classList.add('lit');b.textContent='✨ Lit';b.disabled=true;lit++;snd('pop');
    const[x,y]=center(d);for(let k=0;k<8;k++)setTimeout(()=>sparkle(x,y-20,5),k*100);
    if(lit===2){$('#beauty').hidden=false;burst(W/2,H*.3,GOLD,90,5)}};
  $('#tray').append(w)}

/* ---------- Crackers ---------- */
const C={
 anar(el){const[x,y]=center($('i',el));let n=0;const t=setInterval(()=>{for(let i=0;i<14;i++)P(x,y-24,(Math.random()-.5)*3,-6-Math.random()*5,70,GOLD[i%4],2,.15,.99);if(++n>40)clearInterval(t)},40);snd('fizz')},
 chakri(el){const ic=$('i',el),[x,y]=center(ic);ic.classList.add('spin');let a=0,n=0;const t=setInterval(()=>{a+=.5;for(let k=0;k<3;k++){const aa=a+k*2.1;P(x+Math.cos(aa)*26,y+Math.sin(aa)*12,Math.cos(aa+1.6)*3,Math.sin(aa+1.6)*3-1,40,k%2?'#ffd45a':'#ff7a3a',2,.05,.97,true)}if(++n>110){clearInterval(t);ic.classList.remove('spin')}},25);snd('fizz')},
 phul(el){const[x,y]=center($('i',el));let n=0;const t=setInterval(()=>{[-12,0,12].forEach(o=>{for(let i=0;i<6;i++){const a=-Math.PI/2+(Math.random()-.5)*2.4,v=2+Math.random()*4;P(x+o*1.5,y-28,Math.cos(a)*v,Math.sin(a)*v,25+Math.random()*20,i%2?'#fff6d0':'#ffc45a',1.6,.12,.96)}});if(++n>70)clearInterval(t)},35);snd('fizz')},
 rocket(el){const ic=$('i',el),[x,y]=center(ic);ic.classList.add('fly');snd('whistle');rocketUp(x,y,H*(.1+Math.random()*.2),()=>ic.classList.remove('fly'))},
 sky(){for(let i=0;i<5;i++)setTimeout(()=>burst(W*(.1+Math.random()*.8),H*(.1+Math.random()*.3),null,90,5),i*350)}
};
$$('#crackers button').forEach(b=>b.onclick=()=>{unlock();C[b.dataset.c](b.closest('.ck'))});
