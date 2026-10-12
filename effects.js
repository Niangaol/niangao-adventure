/* Optional, offline pixel atmosphere and presentation loops. No network or chat hooks. */
'use strict';
(() => {
  const viewport = document.getElementById('viewport');
  if (!viewport || window.__adventureEffects) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = Array.from(viewport.querySelectorAll(':scope > section.scene'));
  const getAdventure = () => window.__adventure;
  const noMotion = () => reduced.matches || document.body.classList.contains('low-motion');
  const hasDialog = () => !!document.querySelector('dialog[open]');
  const available = () => !!getAdventure() && !getAdventure().booting && !getAdventure().moving && !document.hidden && !noMotion() && !hasDialog();
  const configs = [
    {key:'hero', chapter:0, id:'heroFilm', parent:'.hero-cta'},
    {key:'project', chapter:2, id:'projectPlay', parent:'.project-foot', auto:true},
    {key:'lab', chapter:3, id:'labPlay', auto:true},
    {key:'photos', chapter:5, id:'photoFilm'}
  ];
  const loops = configs.map(config => {
    const play = document.getElementById(config.id);
    if (!play) return null;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'effects-loop';
    button.dataset.effectsLoop = config.key;
    button.setAttribute('aria-label', '循环演示：关');
    button.setAttribute('aria-pressed', 'false');
    button.textContent = '循环演示：关';
    button.title = '仅循环本章示意动画；暂停后不会自动继续';
    if (config.parent) { const host = play.closest(config.parent); host.classList.add('effects-loop-host'); host.append(button); }
    else play.after(button);
    return {...config, play, button, enabled:false, visited:false, phase:'idle', seenRunning:false, deadline:0};
  }).filter(Boolean);
  let internalClick = false, loopTimer = 0, entryTimer = 0;
  let targetChapter = getAdventure()?.cur ?? 0;
  function paintButton(loop) {
    loop.button.textContent = '循环演示：' + (loop.enabled ? '开' : '关');
    loop.button.setAttribute('aria-label', loop.button.textContent);
    loop.button.setAttribute('aria-pressed', String(loop.enabled));
    loop.button.disabled = noMotion();
  }
  function cancelLoops(stop = false) {
    const hadLoop = loops.some(loop => loop.enabled);
    loops.forEach(loop => {
      loop.enabled = false; loop.phase = 'idle'; loop.seenRunning = false; loop.deadline = 0;
      paintButton(loop);
    });
    clearTimeout(loopTimer); loopTimer = 0;
    if (stop && hadLoop) getAdventure()?.stopPresentation?.();
  }
  function start(loop, now) {
    if (!loop.enabled || !available() || getAdventure().cur !== loop.chapter) return;
    const sequence = getAdventure().sequence;
    if (sequence) {
      if (sequence.key === loop.key) { loop.seenRunning = true; loop.phase = 'running'; }
      else cancelLoops();
      return;
    }
    // Wait for the original handler's first RAF: null is not completion until seen running.
    loop.phase = 'starting'; loop.seenRunning = false; loop.deadline = now + 2500;
    internalClick = true;
    try { loop.play.click(); } finally { internalClick = false; }
    if (getAdventure().sequence?.key === loop.key) { loop.seenRunning = true; loop.phase = 'running'; }
  }
  function checkLoop() {
    loopTimer = 0;
    const loop = loops.find(item => item.enabled);
    if (!loop) return;
    if (noMotion() || hasDialog() || getAdventure()?.cur !== loop.chapter || getAdventure()?.moving) { cancelLoops(true); return; }
    if (document.hidden) return; // Visibility resumes monitoring, never a paused presentation.
    const now = performance.now(), sequence = getAdventure()?.sequence;
    if (sequence) {
      if (sequence.key !== loop.key) { cancelLoops(); return; }
      loop.seenRunning = true;
      loop.phase = sequence.paused ? 'paused' : 'running';
    } else if (loop.seenRunning && (loop.phase === 'running' || loop.phase === 'paused')) {
      // An unexpected stop while paused must never be interpreted as a completed film.
      if (loop.phase === 'paused') { cancelLoops(); return; }
      loop.phase = 'waiting'; loop.deadline = now + 1000;
    } else if (loop.phase === 'starting' && now >= loop.deadline) {
      cancelLoops(); return;
    } else if (loop.phase === 'waiting' && now >= loop.deadline) start(loop, now);
    scheduleLoop();
  }
  function scheduleLoop() {
    if (!loopTimer && !document.hidden && loops.some(loop => loop.enabled)) loopTimer = setTimeout(checkLoop, 100);
  }
  function enable(loop) {
    if (!available() || getAdventure().cur !== loop.chapter) return;
    cancelLoops(); loop.enabled = true; loop.visited = true; paintButton(loop);
    start(loop, performance.now()); scheduleLoop();
  }
  loops.forEach(loop => loop.button.addEventListener('click', () => {
    loop.visited = true;
    if (loop.enabled) cancelLoops(true); else enable(loop);
  }));
  function enterChapter() {
    entryTimer = 0;
    if (!available() || getAdventure().cur !== targetChapter) return;
    const loop = loops.find(item => item.chapter === targetChapter);
    if (!loop || loop.visited) return;
    loop.visited = true; // Mark before starting: duplicate transition events cannot undo user choice.
    if (loop.auto) enable(loop);
  }
  function reconcile() {
    loops.forEach(paintButton);
    if (noMotion() || hasDialog()) {
      cancelLoops(true);
      // A first visit with motion off consumes the auto-start, so restoring motion stays quiet.
      const loop = loops.find(item => item.chapter === targetChapter);
      if (loop && getAdventure()?.cur === targetChapter && !getAdventure()?.moving) loop.visited = true;
    }
    enterChapter(); syncCanvas();
  }
  window.addEventListener('adventure:chapter', event => {
    const index = event.detail?.index;
    if (!Number.isInteger(index)) return;
    if (index !== targetChapter) { cancelLoops(); targetChapter = index; }
    clearTimeout(entryTimer);
    // Landing's sceneUI event precedes moving=false; defer without using an animation RAF.
    entryTimer = setTimeout(reconcile, 0);
  });
  document.addEventListener('click', event => {
    if (internalClick || !(event.target instanceof Element)) return;
    if (event.target.closest('.effects-loop')) return;
    const cancel = event.target.closest('[data-project],[data-tool],[data-stop],#photoThumbnails button,#photoPrev,#photoNext,#imagePrev,#imageNext');
    if (cancel) { cancelLoops(); return; }
    // User Play/Pause is retained verbatim; a pause never receives an automatic click.
    const play = loops.find(loop => event.target.closest('#' + loop.id));
    if (play?.enabled) scheduleLoop();
  }, true);

  const canvas = document.createElement('canvas');
  canvas.className = 'effects-canvas'; canvas.id = 'effectsCanvas';
  canvas.setAttribute('aria-hidden', 'true');
  viewport.append(canvas);
  const ctx = canvas.getContext('2d');
  let raf = 0, last = 0, width = 0, height = 0, dpr = 1, particles = [], sweeps = [], meteors = [];
  let frames = 0;
  let infoParticles = [], infoBurst = null, infoChapter = 0, infoFrames = 0;
  const infoPalettes=[[],['#50877e','#bc874a','#789aa3'],['#4c9691','#bf884b','#62866e'],['#b8754f','#598f7a','#739a9d'],['#ab8151','#5a9c88','#7095a5'],['#5b8a7c','#bd9660','#7898a0'],['#618569','#ab8a55','#65939a'],['#519b86','#c39350','#628b93']];
  function seedInfo(){
    const count=innerWidth<=740?40:90;
    infoParticles=Array.from({length:count},(_,i)=>({x:(i*79.71+17)%Math.max(1,width),y:(i*47.39+31)%Math.max(1,height),size:i%7===0?7:i%3===0?4:3,phase:i*.89,speed:8+i%7*2,kind:i%5===0?'cross':i%4===0?'beam':'dust'}));
  }
  function drawInfoPage(now,dt,base,scene){
    const chapter=getAdventure().cur,palette=infoPalettes[chapter]||infoPalettes[1];
    infoFrames++;
    if(infoChapter!==chapter){infoChapter=chapter;const stamp=scene?.querySelector('.chapter-stamp'),r=stamp?.getBoundingClientRect();infoBurst={at:now,x:r?r.left-base.left+r.width*.5:width*.85,y:r?r.top-base.top+r.height*.5:height*.15};}
    ctx.save();ctx.imageSmoothingEnabled=false;
    // The full information-page area is available. Foreground text and images are cleared below.
    infoParticles.forEach((p,i)=>{p.y=(p.y-p.speed*dt+height)%Math.max(1,height);const x=Math.round(p.x+Math.sin(now/1500+p.phase)*13),y=Math.round(p.y),s=p.size;ctx.globalAlpha=.34+.25*(1+Math.sin(now/2200+p.phase))/2;ctx.fillStyle=palette[i%palette.length];
      if(p.kind==='cross'){ctx.fillRect(x-5,y,12,3);ctx.fillRect(x,y-5,3,12);ctx.globalAlpha*=.35;ctx.fillRect(x-2,y-2,7,7);}
      else if(p.kind==='beam'){for(let k=0;k<6;k++){ctx.globalAlpha=.42-k*.055;ctx.fillRect(x+k*5,y+k*9,4,7);}}
      else{ctx.fillRect(x,y,s,s);ctx.globalAlpha*=.3;ctx.fillRect(x+3,y+7,s-1,3);ctx.fillRect(x+5,y+14,2,2);}
    });
    // Stepped scanning rays: no blur, smooth ribbon, gradients or background recoloring.
    for(let ray=0;ray<3;ray++){const sx=(now*.016+ray*width*.34)%(width+160)-80;ctx.fillStyle=palette[ray%3];for(let k=0;k<Math.ceil(height/22);k++){ctx.globalAlpha=.12+(k%4===0?.08:0);ctx.fillRect(Math.round(sx+k*7),k*22,5,18);ctx.globalAlpha=.07;ctx.fillRect(Math.round(sx+k*7+6),k*22,10,3);}}
    // Pixel packets orbit card outlines, not the original first-scene landscape.
    const panels=scene?.querySelectorAll('.pixel-panel,.intro-block,.favorite-list article')||[];
    panels.forEach((node,n)=>{const r=node.getBoundingClientRect();if(!r.width||r.bottom<base.top||r.top>base.bottom)return;const l=r.left-base.left-5,t=r.top-base.top-5,w=r.width+10,h=r.height+10,total=2*(w+h);for(let j=0;j<3;j++){const q=(now*.045+n*80+j*total/3)%total;let x,y;if(q<w){x=l+q;y=t;}else if(q<w+h){x=l+w;y=t+q-w;}else if(q<2*w+h){x=l+2*w+h-q;y=t+h;}else{x=l;y=t+total-q;}ctx.globalAlpha=.75;ctx.fillStyle=palette[(n+j)%3];ctx.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,6,6);ctx.globalAlpha=.3;ctx.fillRect(Math.round(x/2)*2-5,Math.round(y/2)*2,3,3);}});
    if(infoBurst){const age=(now-infoBurst.at)/900;if(age<1){for(let i=0;i<34;i++){const a=i*2.39996,d=age*(55+i%6*14),x=infoBurst.x+Math.cos(a)*d,y=infoBurst.y+Math.sin(a)*d;ctx.globalAlpha=(1-age)*.8;ctx.fillStyle=palette[i%3];ctx.fillRect(Math.round(x),Math.round(y),i%3===0?5:3,3);}}else infoBurst=null;}
    ctx.restore();ctx.globalAlpha=1;
    const protectedNodes=scene?.querySelectorAll('img,canvas,p,h1,h2,h3,h4,button,a,dl,li,figcaption,label,textarea,input,dt,dd,small,[role="status"],[role="log"],.agent-terminal,.photo-main,.story-box,#photoThumbnails,.chapter-stamp,.project-header,.terminal-heading,.trace-axis,.tool-flow,.inventory-mini,.tech-line,.item-code,.location-tag')||[];
    protectedNodes.forEach(node=>{const r=node.getBoundingClientRect();if(r.width&&r.height)ctx.clearRect(Math.floor(r.left-base.left)-4,Math.floor(r.top-base.top)-4,Math.ceil(r.width)+8,Math.ceil(r.height)+8);});
  }
  const colors = ['#fff4d7','#e8af66','#bfd398','#75afb5'];
  function resizeCanvas() {
    const rect = viewport.getBoundingClientRect();
    width = Math.round(rect.width); height = Math.round(rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr));
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (ctx) ctx.imageSmoothingEnabled = false;
    const count = window.innerWidth <= 740 ? 60 : 150;
    particles = Array.from({length:count}, (_, i) => ({x:i%3===0 ? Math.random()*width : i%2 ? 3+Math.random()*8 : width-11+Math.random()*8,y:Math.random()*height,phase:Math.random()*Math.PI*2,speed:2+Math.random()*5,size:i%7===0?3:2,kind:i%8===0?'beam':i%6===0?'star':'firefly',color:colors[i%colors.length]}));
    sweeps = [{x:Math.random()*width, v:width/24}, {x:-width*Math.random()*.4, v:width/31}];
    meteors = [];
    seedInfo();
  }
  function stopCanvas() {
    cancelAnimationFrame(raf); raf = 0; last = 0;
    ctx?.clearRect(0, 0, width, height);
    viewport.classList.remove('effects-live');
  }
  function frame(now) {
    raf = 0;
    if (!available()) { stopCanvas(); return; }
    if (now - last >= 1000 / 30) {
      const dt = last ? Math.min(.1, (now-last)/1000) : 0;
      last = now; frames++;
      ctx.clearRect(0, 0, width, height);
      const base = viewport.getBoundingClientRect(), scene = scenes[getAdventure().cur];
      if(getAdventure().cur>0){drawInfoPage(now,dt,base,scene);}else{
      infoChapter=0;
      ctx.save(); ctx.beginPath();
      // Empty outer margins, plus the landscape floor. No full-screen veil.
      const edge = window.innerWidth <= 740 ? 12 : 22;
      ctx.rect(0,0,edge,height); ctx.rect(width-edge,0,edge,height);
      const world = scene?.querySelector('.hero-world,.camp-scene');
      if (world) { const box=world.getBoundingClientRect(); ctx.rect(box.left-base.left,box.top-base.top+box.height*.66,box.width,box.height*.34); }
      ctx.clip();
      particles.forEach(p => {
        p.y = (p.y - p.speed*dt + height) % Math.max(1,height);
        const x = Math.round(p.x + Math.sin(now/2400+p.phase)*5), y = Math.round(p.y);
        // Very slow breathing, not a strobe.
        ctx.globalAlpha = .22 + .32*(1+Math.sin(now/2800+p.phase))/2;
        ctx.fillStyle = p.color;
        if (p.kind === 'beam') {
          ctx.globalAlpha *= .5;
          for (let step = 0; step < 5; step++) ctx.fillRect(x + step*3, y + step*8, 2, 10);
          ctx.fillRect(x - 2, y + 12, 6, 12);
        }
        else { ctx.fillRect(x,y,p.size,p.size); if(p.kind==='star'){ctx.fillRect(x-2,y+1,6,1);ctx.fillRect(x+1,y-2,1,6);ctx.fillRect(x-1,y-1,3,3);} }
      });
      // Slow diagonal light sweeps; the content mask clears them over text or photos.
      sweeps.forEach(s => {
        s.x += s.v*dt;
        if (s.x > width*1.25) s.x = -width*.4;
        for (let band = 0; band < 5; band++) { ctx.globalAlpha = .055 - band*.008; ctx.fillRect(Math.round(s.x + band*9), 0, 7, height); }
      });
      // Occasional pixel meteor across the top band.
      if (meteors.length < 2 && Math.random() < .01) meteors.push({x:Math.random()*width*.6, y:8+Math.random()*height*.22, vx:3+Math.random()*2.4, vy:1.1+Math.random()*.9, life:1});
      for (let i = meteors.length-1; i >= 0; i--) {
        const m = meteors[i]; m.x += m.vx; m.y += m.vy; m.life -= .018;
        if (m.life <= 0 || m.x > width + 40) { meteors.splice(i,1); continue; }
        ctx.fillStyle = '#fff4d7';
        for (let tail = 0; tail < 7; tail++) { ctx.globalAlpha = m.life*.85*(1-tail*.14); ctx.fillRect(Math.round(m.x - tail*4), Math.round(m.y - tail*1.5), 2, 2); }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      // Hard safety mask. Padding includes image shadows, rotated hero frame and nearby text.
      const protectedNodes = scene?.querySelectorAll('img,p,h1,h2,h3,h4,button,a,dl,li,figcaption,.pixel-panel,.hero-copy,.world-label,.camp-copy,.agent-layout,.agent-terminal,.story-box,.photo-viewer,.photo-thumbnails') || [];
      protectedNodes.forEach(node => {
        const box = node.getBoundingClientRect();
        if (box.width && box.height) ctx.clearRect(Math.floor(box.left-base.left)-10,Math.floor(box.top-base.top)-10,Math.ceil(box.width)+20,Math.ceil(box.height)+20);
      });
      }
    }
    raf = requestAnimationFrame(frame);
  }
  function syncCanvas() {
    viewport.classList.toggle('effects-information',Boolean(getAdventure()&&getAdventure().cur>0));
    if (!ctx || !available()) { stopCanvas(); return; }
    if (!raf) { viewport.classList.add('effects-live'); raf = requestAnimationFrame(frame); }
  }
  // Local observers only: no mutation observer of chat content or message styling.
  const observer = new MutationObserver(reconcile);
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  document.querySelectorAll('dialog').forEach(dialog => observer.observe(dialog,{attributes:true,attributeFilter:['open']}));
  const boot = document.getElementById('boot');
  if (boot) observer.observe(boot,{attributes:true,attributeFilter:['hidden']});
  scenes.forEach(scene => observer.observe(scene,{attributes:true,attributeFilter:['hidden']}));
  window.addEventListener('resize', () => { resizeCanvas(); syncCanvas(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopCanvas(); clearTimeout(loopTimer); loopTimer = 0; }
    else { reconcile(); scheduleLoop(); }
  });
  reduced.addEventListener('change', reconcile);
  window.addEventListener('pagehide', () => { cancelLoops(); stopCanvas(); clearTimeout(entryTimer); });
  // Ornament classes are scoped; never attach them to the chat message stream.
  document.querySelectorAll('.project-select').forEach(node => node.classList.add('effects-cartridge'));
  document.querySelectorAll('.project-visual').forEach(node => node.classList.add('effects-parcel-stage'));
  document.querySelectorAll('.photo-viewer').forEach(node => node.classList.add('effects-photo-frame'));
  document.querySelectorAll('.sequence-caption').forEach(node => node.classList.add('effects-caption'));
  window.__adventureEffects = {
    stop: () => { cancelLoops(true); stopCanvas(); },
    get state() { return {raf:!!raf,particles:particles.length,dpr,frames,information:{active:(getAdventure()?.cur||0)>0,particles:infoParticles.length,frames:infoFrames,burst:Boolean(infoBurst),version:'info-pixel-1'},loops:loops.map(({key,enabled,phase,visited})=>({key,enabled,phase,visited}))}; }
  };
  resizeCanvas(); reconcile();
})();
