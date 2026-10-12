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
  let raf = 0, last = 0, width = 0, height = 0, dpr = 1, particles = [];
  let frames = 0;
  const colors = ['#fff4d7','#e8af66','#bfd398','#75afb5'];
  function resizeCanvas() {
    const rect = viewport.getBoundingClientRect();
    width = Math.round(rect.width); height = Math.round(rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr));
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (ctx) ctx.imageSmoothingEnabled = false;
    const count = window.innerWidth <= 740 ? 30 : 70;
    particles = Array.from({length:count}, (_, i) => ({x:i%3===0 ? Math.random()*width : i%2 ? 3+Math.random()*8 : width-11+Math.random()*8,y:Math.random()*height,phase:Math.random()*Math.PI*2,speed:2+Math.random()*5,size:i%7===0?3:2,kind:i%17===0?'beam':i%9===0?'star':'firefly',color:colors[i%colors.length]}));
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
        // Very slow breathing, not a strobe. Sparse beam remains inside the same clip.
        ctx.globalAlpha = .16 + .28*(1+Math.sin(now/2800+p.phase))/2;
        ctx.fillStyle = p.color;
        if (p.kind === 'beam') { ctx.globalAlpha *= .45; ctx.fillRect(x,y,2,32); ctx.fillRect(x-2,y+8,6,12); }
        else { ctx.fillRect(x,y,p.size,p.size); if(p.kind==='star'){ctx.fillRect(x-2,y+1,6,1);ctx.fillRect(x+1,y-2,1,6);} }
      });
      ctx.restore();
      // Hard safety mask. Padding includes image shadows, rotated hero frame and nearby text.
      const protectedNodes = scene?.querySelectorAll('img,p,h1,h2,h3,h4,button,a,dl,li,figcaption,.pixel-panel,.hero-copy,.world-label,.camp-copy,.agent-layout,.agent-terminal,.story-box,.photo-viewer,.photo-thumbnails') || [];
      protectedNodes.forEach(node => {
        const box = node.getBoundingClientRect();
        if (box.width && box.height) ctx.clearRect(Math.floor(box.left-base.left)-10,Math.floor(box.top-base.top)-10,Math.ceil(box.width)+20,Math.ceil(box.height)+20);
      });
    }
    raf = requestAnimationFrame(frame);
  }
  function syncCanvas() {
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
    get state() { return {raf:!!raf,particles:particles.length,dpr,frames,loops:loops.map(({key,enabled,phase,visited})=>({key,enabled,phase,visited}))}; }
  };
  resizeCanvas(); reconcile();
})();
