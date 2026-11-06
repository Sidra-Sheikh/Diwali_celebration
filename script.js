'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- Audio (starts only after a user click) ---------- */
let actx=null, muted=false, started=false;
const muteBtn=$('#mute'), song=$('#song');
/* Background song: plays assets/happy-diwali.mp3 (add your file). If missing, a built-in festive tune plays instead. */
let synthOn=false, synthGain=null, noteT=0, step=0;
const TUNE=[392,440,523,440,392,330,392,440,523,587,659,587,523,440,392,330];
function startSynth(){
  if(synthOn)return;synthOn=true;synthGain=actx.createGain();synthGain.gain.value=muted?0:.07;synthGain.connect(actx.destination);noteT=actx.currentTime;
  setInterval(()=>{while(noteT<actx.currentTime+.6){const o=actx.createOscillator(),g=actx.createGain();o.type='triangle';o.frequency.value=TUNE[step%16]*(step%32>=16?1:1);
    g.gain.setValueAtTime(.9,noteT);g.gain.exponentialRampToValueAtTime(.01,noteT+.45);o.connect(g).connect(synthGain);o.start(noteT);o.stop(noteT+.5);noteT+=.5;step++}},200);
}
function startMusic(){
  if(started)return;started=true;actx=actx||new (window.AudioContext||window.webkitAudioContext)();
  song.volume=.6;song.muted=muted;
  song.play().catch(()=>startSynth());
  song.addEventListener('error',startSynth);
}
let pending=false;
function kick(){
  ['pointerdown','keydown','touchstart','click'].forEach(e=>removeEventListener(e,kick));
  if(pending){pending=false;started=true;song.muted=muted;song.play().catch(()=>{})}else startMusic();
}
['pointerdown','keydown','touchstart','click'].forEach(e=>addEventListener(e,kick));
song.volume=.6;
song.play().then(()=>{started=true}).catch(()=>{song.muted=true;pending=true;song.play().catch(()=>{})});
function setMuted(m){
  muted=m;song.muted=m;if(synthGain)synthGain.gain.value=m?0:.07;
  muteBtn.textContent=m?'🔇':'🔊';muteBtn.setAttribute('aria-pressed',m);muteBtn.setAttribute('aria-label',m?'Unmute music':'Mute music');
}
muteBtn.onclick=()=>{actx=actx||new (window.AudioContext||window.webkitAudioContext)();setMuted(!muted)};
function snd(type){
  if(muted||!actx) return;
  const t=actx.currentTime, len={boom:.8,fizz:1.2,pop:.25,whistle:.9}[type]||.4;
  const buf=actx.createBuffer(1,actx.sampleRate*len,actx.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,type==='fizz'?.6:3);
  const s=actx.createBufferSource(); s.buffer=buf;
  const f=actx.createBiquadFilter(); f.type=type==='boom'?'lowpass':'highpass'; f.frequency.value=type==='boom'?400:type==='fizz'?3000:1200;
  const g=actx.createGain(); g.gain.value=.4; s.connect(f).connect(g).connect(actx.destination); s.start(t);
  if(type==='whistle'){const o=actx.createOscillator(),og=actx.createGain();o.frequency.setValueAtTime(400,t);o.frequency.exponentialRampToValueAtTime(1800,t+.9);og.gain.setValueAtTime(.08,t);og.gain.linearRampToValueAtTime(0,t+.9);o.connect(og).connect(actx.destination);o.start(t);o.stop(t+.9);}
}

/* ---------- Particle engine ---------- */
const cv=$('#fx'), cx=cv.getContext('2d'); let W,H,parts=[];
function size(){const r=devicePixelRatio||1;W=innerWidth;H=innerHeight;cv.width=W*r;cv.height=H*r;cx.setTransform(r,0,0,r,0,0)}
addEventListener('resize',size); size();
const GOLD=['#ffd45a','#ffe9a0','#ffb23a','#fff6d0'];
const BRIGHT=['#ff3d8b','#ffd45a','#7be0ff','#b46bff','#6dff9a','#ff7a3a'];
function P(x,y,vx,vy,life,color,sz=2,g=.06,drag=.985,trail=false){parts.push({x,y,vx,vy,life,max:life,color,sz,g,drag,trail})}
function burst(x,y,color,n=90,speed=5){
  const cols=color||[BRIGHT[Math.random()*BRIGHT.length|0]];
  for(let i=0;i<n;i++){const a=Math.PI*2*i/n,v=speed*(.5+Math.random()*.6);P(x,y,Math.cos(a)*v,Math.sin(a)*v,60+Math.random()*30,cols[i%cols.length],2.2,.05,.97,true)}
  glow(x,y);snd('boom');
}
function glow(x,y){parts.push({flash:1,x,y,life:10,max:10})}
function sparkle(x,y,n=6){for(let i=0;i<n;i++)P(x+(Math.random()-.5)*30,y+(Math.random()-.5)*30,(Math.random()-.5)*1.2,-Math.random()*1.5,40+Math.random()*30,GOLD[i%4],1.6,-.01,1)}
function loop(){
  cx.clearRect(0,0,W,H); cx.globalCompositeOperation='lighter';
  parts=parts.filter(p=>p.life>0);
  for(const p of parts){
    p.life--;
    if(p.flash){const g=cx.createRadialGradient(p.x,p.y,0,p.x,p.y,120);g.addColorStop(0,`rgba(255,220,150,${p.life/p.max*.5})`);g.addColorStop(1,'rgba(255,220,150,0)');cx.fillStyle=g;cx.fillRect(p.x-120,p.y-120,240,240);continue}
    if(p.update) p.update(p);
    p.vx*=p.drag;p.vy=p.vy*p.drag+p.g;p.x+=p.vx;p.y+=p.vy;
    cx.globalAlpha=Math.max(p.life/p.max,0);cx.fillStyle=cx.strokeStyle=p.color;
    if(p.trail){cx.lineWidth=p.sz;cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(p.x-p.vx*2.5,p.y-p.vy*2.5);cx.stroke()}
    else{cx.beginPath();cx.arc(p.x,p.y,p.sz,0,7);cx.fill()}
  }
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over';requestAnimationFrame(loop)
}
loop();
const center=el=>{const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};

/* ---------- Page manager ---------- */
let cur=1,timers=[];
function go(n){
  $$('.page').forEach(p=>p.classList.remove('active'));
  $('#p'+n).classList.add('active');cur=n;
  if(n===1)intro(); if(n===3)ambient();
}
/* ---------- Page 1: typewriter ---------- */
let introRun=0;
async function type(el,caret,text,delay){
  caret.style.display='inline-block';
  for(const ch of text){el.textContent+=ch;await sleep(delay+Math.random()*60)}
  caret.style.display='none';
}
async function intro(){
  const id=++introRun;
  $('#t1').textContent='';$('#t2').textContent='';$('#c2').style.display='none';
  await sleep(700);if(id!==introRun)return;
  await type($('#t1'),$('#c1'),'Happy Diwali',130);if(id!==introRun)return;
  await sleep(300);await type($('#t2'),$('#c2'),'From Sidra Sheikh',90);if(id!==introRun)return;
  const [x,y]=center($('#t1'));
  for(let i=0;i<14;i++){setTimeout(()=>{if(id===introRun)sparkle(x+(Math.random()-.5)*W*.5,y+(Math.random()-.5)*60,8)},i*120)}
  for(let i=0;i<3;i++)setTimeout(()=>{if(id===introRun&&cur===1)burst(W*(.2+.3*i+Math.random()*.1),H*.2,GOLD,60,4)},i*500);
  await sleep(1200);if(id===introRun&&cur===1){}
}
$('#skip1').onclick=$('#start').onclick=()=>{startMusic();introRun++;go(2)};
muteBtn.addEventListener('click',()=>{});
addEventListener('pointerdown',()=>{if(actx&&actx.state==='suspended')actx.resume()},{once:false});

/* ---------- Page 2: diyas ---------- */
const tray=$('#tray');let lit=0;
for(let i=0;i<2;i++){
  const b=document.createElement('button');b.className='diya c'+(i%4);b.setAttribute('aria-label','Diya '+(i+1)+', unlit. Press to light');
  b.innerHTML='<i class="wick"></i><i class="flame"></i>';
  b.onclick=()=>{
    if(b.classList.contains('lit'))return;
    b.classList.add('lit');b.setAttribute('aria-label','Diya '+(i+1)+', lit');lit++;
    const [x,y]=center(b);for(let k=0;k<6;k++)setTimeout(()=>sparkle(x,y-20,5),k*100);snd('pop');
    if(lit===2){$('#beauty').hidden=false;$('#next2').disabled=false;$('#next2').focus();setInterval(()=>{if(cur===2){const [a,c]=center(tray);sparkle(a+(Math.random()-.5)*W*.5,c,3)}},300)}
  };
  tray.append(b);
}
$('#next2').onclick=()=>go(3);

/* ---------- Page 3: crackers ---------- */
let used=new Set(),amb;
function ambient(){clearInterval(amb);amb=setInterval(()=>{if(cur===3&&Math.random()<.5)burst(Math.random()*W,H*(.1+Math.random()*.2),null,50,3.5)},2600)}
const C={
  anar(el){const [x,y]=center(el);let n=0;const t=setInterval(()=>{for(let i=0;i<14;i++)P(x,y-30,(Math.random()-.5)*3,-6-Math.random()*5,70,GOLD[i%4],2,.15,.99);if(++n>40)clearInterval(t)},40);snd('fizz')},
  chakri(el){const [x,y]=center(el);el.firstChild.classList.add('spin');let a=0,n=0;const t=setInterval(()=>{a+=.5;for(let k=0;k<3;k++){const aa=a+k*2.1;P(x+Math.cos(aa)*22,y+Math.sin(aa)*10,Math.cos(aa+1.6)*3,Math.sin(aa+1.6)*3-1,40,k%2?'#ffd45a':'#ff7a3a',2,.05,.97,true)}
    if(++n>110){clearInterval(t);el.firstChild.classList.remove('spin')}},25);snd('fizz')},
  phul(el){const [x,y]=center(el);let n=0;const t=setInterval(()=>{[-12,0,12].forEach(o=>{for(let i=0;i<6;i++){const a=-Math.PI/2+(Math.random()-.5)*2.4,v=2+Math.random()*4;P(x+o*2,y-35,Math.cos(a)*v,Math.sin(a)*v,25+Math.random()*20,i%2?'#fff6d0':'#ffc45a',1.6,.12,.96)}});if(++n>70)clearInterval(t)},35);snd('fizz')},
  rocket(el){const [x,y0]=center(el);el.firstChild.classList.add('fly');const ty=H*(.1+Math.random()*.2),tx=x+(Math.random()-.5)*200;let y=y0,px=x;snd('whistle');
    const t=setInterval(()=>{y-=12;px+=(tx-px)*.04;for(let i=0;i<3;i++)P(px,y+20,(Math.random()-.5),2+Math.random(),25,i?'#ffb23a':'#fff',2,.02,.96);
      if(y<=ty){clearInterval(t);burst(px,y,[BRIGHT[Math.random()*6|0],'#ffe9a0',BRIGHT[Math.random()*6|0]],140,6);el.firstChild.classList.remove('fly')}},20)},
  sky(){for(let i=0;i<5;i++)setTimeout(()=>burst(W*(.1+Math.random()*.8),H*(.08+Math.random()*.3),null,100,5+Math.random()*2),i*350)}
};
$$('#crackers button').forEach(b=>b.onclick=()=>{
  C[b.dataset.c](b);used.add(b.dataset.c);
  if(used.size>=2)$('#next3').hidden=false;
});

/* ---------- Replay ---------- */
$('#next3').onclick=()=>{
  clearInterval(amb);
  $$('.diya').forEach((d,i)=>{d.classList.remove('lit');d.setAttribute('aria-label','Diya '+(i+1)+', unlit. Press to light')});
  lit=0;$('#beauty').hidden=true;$('#next2').disabled=true;used.clear();$('#next3').hidden=true;go(1);
};
go(1);
