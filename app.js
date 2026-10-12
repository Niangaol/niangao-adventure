/* Pixel adventure controller. Public portfolio data contains no private source paths. */
'use strict';
(() => {
const photos=[
  {
    "path": "assets/photos/westlake-ducks.webp",
    "title": "湖面游鸭",
    "series": "西湖风光",
    "date": "2024-01-27",
    "width": 1600,
    "height": 1066,
    "alt": "水鸭游过浅金色湖面，远处游船与岸边建筑虚化。"
  },
  {
    "path": "assets/photos/westlake-woodland.webp",
    "title": "林间小径",
    "series": "西湖风光",
    "date": "2024-01-27",
    "width": 1067,
    "height": 1600,
    "alt": "高树与深绿枝叶围住弯曲石径，路灯和树林形成纵深。"
  },
  {
    "path": "assets/photos/xixi-bamboo.webp",
    "title": "竹林幽径",
    "series": "西溪湿地",
    "date": "2024-02-05",
    "width": 1066,
    "height": 1600,
    "alt": "虚化竹叶围住落叶小径，小径伸入层层绿色竹林。"
  },
  {
    "path": "assets/photos/xixi-flight.webp",
    "title": "掠水飞鸭",
    "series": "西溪湿地",
    "date": "2024-02-05",
    "width": 1600,
    "height": 1067,
    "alt": "野鸭展开翅膀低掠水面，水中映出飞鸟与树木倒影。"
  },
  {
    "path": "assets/photos/fireworks-trails.webp",
    "title": "金色焰迹",
    "series": "烟花",
    "date": "2024",
    "width": 1600,
    "height": 1066,
    "alt": "红色焰头拖着金色火星斜向升起，黑色背景衬出轨迹。"
  },
  {
    "path": "assets/photos/slow-shutter-street.webp",
    "title": "街头流光",
    "series": "慢门",
    "date": "2024-03-31",
    "width": 1067,
    "height": 1600,
    "alt": "清晰绿色路牌与红色灯光相映，车流形成光晕，远处行人为虚化背影。"
  },
  {
    "path": "assets/photos/shanghai-window.webp",
    "title": "窗隙飞鸟",
    "series": "上海旅游",
    "date": "2024",
    "width": 1600,
    "height": 1067,
    "alt": "透过虚化圆形前景望向屋檐与蓝天，飞鸟掠过下方。"
  },
  {
    "path": "assets/photos/yunqi-leaves.webp",
    "title": "绿叶石坊",
    "series": "云栖竹径",
    "date": "2026-08-13",
    "width": 1600,
    "height": 900,
    "alt": "阳光照亮青绿叶片，石牌坊与树林在后方柔和展开。"
  },
  {
    "path": "assets/photos/chaoshan-clouds.webp",
    "title": "海天积云",
    "series": "潮汕",
    "date": "2024-07-13",
    "width": 1600,
    "height": 1008,
    "alt": "白色积云横过蓝色天空，下方是海面与细长远岸城市轮廓。"
  },
  {
    "path": "assets/photos/chaoshan-lighthouse.webp",
    "title": "红塔蓝海",
    "series": "潮汕",
    "date": "2024-07-13",
    "width": 1067,
    "height": 1600,
    "alt": "鲜红灯塔立在黄色海堤上，蓝色海水、白云与远桥构成背景。"
  }
];
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const chapters=[['冒险开场','start','好奇心小岛'],['角色档案','profile','一个还在学的人'],['项目工坊','work','AI 帮忙，我兜底'],['宝可梦研究所','pokemon','把爱好写成工具'],['游戏背包','games','我的快乐补给'],['摄影小径','photography','看见世界的另一面'],['成长任务','growth','还没有通关'],['组队营地','camp','下一关，一起打']];
const scenes=chapters.map(c=>document.getElementById(c[1]));
const prefers=matchMedia('(prefers-reduced-motion: reduce)');
const colorScheme=matchMedia('(prefers-color-scheme: dark)');
const nightMode=()=>colorScheme.matches;
let motion=!prefers.matches,current=0,moving=false,queued=null,run=null,booting=true,photoIndex=0,largeIsPhoto=true,ambientRAF=0,ambientLast=0,sound=false,audio;
let sequence=null,sequenceKey='',seqCounter=0;
const canvasWorld=$('#worldCanvas'),campCanvas=$('#campCanvas');
function beep(kind=0){if(!sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume();const t=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.type='square';o.frequency.setValueAtTime([330,440,660][kind%3],t);g.gain.setValueAtTime(.018,t);g.gain.exponentialRampToValueAtTime(.001,t+.09);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.1);}catch{sound=false;}}
function stopAmbient(){cancelAnimationFrame(ambientRAF);ambientRAF=0;}
function drawAmbient(t){if(booting||document.hidden||!motion){stopAmbient();return;}if(t-ambientLast>70){ambientLast=t;if(!sequence||sequenceKey!=='hero'){if(current===0)PixelWorld.draw(canvasWorld,t/1000,{playerX:innerWidth<740?215:155,camera:true,night:nightMode()});if(current===7)PixelWorld.draw(campCanvas,t/1000,{dusk:true,playerX:215,playerY:190});}}ambientRAF=requestAnimationFrame(drawAmbient);}
function updateAmbient(){stopAmbient();if(motion&&!booting&&!document.hidden&&(current===0||current===7))ambientRAF=requestAnimationFrame(drawAmbient);else{PixelWorld.draw(canvasWorld,0,{playerX:innerWidth<740?215:155,camera:true,night:nightMode()});PixelWorld.draw(campCanvas,0,{dusk:true,playerX:215,playerY:190});}}
PixelWorld.portrait($('#portraitCanvas'));PixelWorld.draw(canvasWorld,0,{playerX:innerWidth<740?215:155,camera:true,night:nightMode()});PixelWorld.draw(campCanvas,0,{dusk:true,playerX:215,playerY:190});
colorScheme.addEventListener('change',()=>{updateAmbient();});
function stopSequence(){if(!sequence)return;const old=sequence;sequence=null;sequenceKey='';cancelAnimationFrame(old.raf);old.animations.forEach(a=>a.cancel());old.cleanup?.();}
function startSequence(key,duration,steps,render,finish,cleanup){stopSequence();if(!motion){steps.forEach(s=>s.fn());render?.(duration,1);finish?.();cleanup?.();return null;}const id=++seqCounter;const s={id,key,duration,elapsed:0,last:performance.now(),fired:new Set(),paused:false,raf:0,animations:[],cleanup};sequence=s;sequenceKey=key;
 function frame(now){if(sequence!==s)return;if(!s.paused&&!document.hidden){s.elapsed=Math.min(duration,s.elapsed+Math.min(80,now-s.last));for(let i=0;i<steps.length;i++)if(s.elapsed>=steps[i].at&&!s.fired.has(i)){s.fired.add(i);steps[i].fn();}render?.(s.elapsed,s.elapsed/duration);if(s.elapsed>=duration){sequence=null;sequenceKey='';s.animations.forEach(a=>a.cancel());finish?.();cleanup?.();return;}}s.last=now;s.raf=requestAnimationFrame(frame);}s.raf=requestAnimationFrame(frame);return s;}
function togglePause(key,button,resumeLabel){if(sequence&&sequenceKey===key){sequence.paused=!sequence.paused;button.textContent=sequence.paused?'继续播放':'暂停播放';return true;}return false;}
function setMotion(value){motion=value;document.body.classList.toggle('low-motion',!motion);$('#motionToggle').textContent='动画：'+(motion?'开':'关');$('#motionToggle').setAttribute('aria-pressed',String(motion));if(!motion){stopSequence();resetFilmButtons();finishTransition();stopEggFX();if(booting)finishBoot();$('#photoCaption').textContent='动画已关闭，可以自由切换照片。';}updateAmbient();}
$('#motionToggle').addEventListener('click',()=>setMotion(!motion));prefers.addEventListener('change',e=>setMotion(!e.matches));document.body.classList.toggle('low-motion',!motion);$('#motionToggle').textContent='动画：'+(motion?'开':'关');$('#motionToggle').setAttribute('aria-pressed',String(motion));$('#soundToggle').addEventListener('click',()=>{sound=!sound;$('#soundToggle').textContent='声音：'+(sound?'开':'关');$('#soundToggle').setAttribute('aria-pressed',String(sound));beep();});
// Chapter navigation uses real paired scenes, not fullscreen masking curtains.
chapters.forEach((c,i)=>{const n=document.createElement('button');n.textContent=c[0];n.dataset.go=i;$('#navTrack').append(n);const m=document.createElement('button');m.innerHTML='<span>'+String(i).padStart(2,'0')+'</span><div>'+c[0]+'<small>'+c[2]+'</small></div>';m.dataset.go=i;$('#mapLevels').append(m);const dot=document.createElement('i');$('#hudRoute').append(dot);});
function sceneUI(i){$('#levelNumber').textContent=String(i).padStart(2,'0');$('#levelName').textContent=chapters[i][0];$('#levelCount').textContent='第 '+(i+1)+' / '+chapters.length+' 关';$('#prevLevel').disabled=i===0;$('#nextLevel').disabled=i===chapters.length-1;$$('#navTrack button').forEach((b,j)=>{if(j===i){b.setAttribute('aria-current','page');b.scrollIntoView({block:'nearest',inline:'nearest'});}else b.removeAttribute('aria-current');});$$('#mapLevels button').forEach((b,j)=>b.classList.toggle('selected',i===j));$$('#hudRoute i').forEach((b,j)=>b.classList.toggle('on',j<=i));window.dispatchEvent(new CustomEvent('adventure:chapter',{detail:{index:i}}));}
function settledScene(i){current=i;scenes.forEach((s,j)=>{s.hidden=i!==j;s.classList.toggle('active',j===i);s.classList.remove('moving');s.inert=i!==j;s.style.removeProperty('z-index');});sceneUI(i);updateAmbient();}
const effects=[
 {name:'沿着小径',out:[{transform:'translateY(0)'},{transform:'translateY(-100%)'}],in:[{transform:'translateY(100%)'},{transform:'translateY(0)'}]},
 {name:'推入工坊',out:[{transform:'translateX(0) scale(1)',opacity:1},{transform:'translateX(-18%) scale(.84)',opacity:0}],in:[{transform:'translateX(22%) scale(1.06)',opacity:0},{transform:'translateX(0) scale(1)',opacity:1}]},
 {name:'卡带翻页',out:[{transform:'translateX(0) rotateY(0deg)',opacity:1},{transform:'translateX(-72%) rotateY(-58deg)',opacity:0}],in:[{transform:'translateX(72%) rotateY(58deg)',opacity:0},{transform:'translateX(0) rotateY(0deg)',opacity:1}]},
 {name:'弧线换轨',out:[{transform:'translate(0,0) rotate(0deg)',opacity:1},{transform:'translate(-80%,-25%) rotate(-14deg)',opacity:0}],in:[{transform:'translate(78%,27%) rotate(14deg)',opacity:0},{transform:'translate(0,0) rotate(0deg)',opacity:1}]},
 {name:'相册推镜',out:[{transform:'translateX(0) scale(1)',opacity:1},{transform:'translateX(-10%) scale(.88)',opacity:1,offset:.25},{transform:'translateX(-100%) scale(.88)',opacity:1}],in:[{transform:'translateX(100%) scale(.88)',opacity:1},{transform:'translateX(10%) scale(.88)',opacity:1,offset:.75},{transform:'translateX(0) scale(1)',opacity:1}]},
 {name:'翻到下一页',out:[{transform:'translateY(0) rotateX(0deg)',opacity:1},{transform:'translateY(-50%) rotateX(18deg)',opacity:0}],in:[{transform:'translateY(55%) rotateX(-18deg)',opacity:0},{transform:'translateY(0) rotateX(0deg)',opacity:1}]}
];
function reverseFrames(frames){return frames.map((f,i)=>({...f,offset:1-(f.offset??i/(frames.length-1))})).reverse();}
function finishTransition(){if(!run)return;const r=run;run=null;clearTimeout(r.timeout);settledScene(r.to);r.animations.forEach(a=>a.cancel());$('#transitionMarker').classList.remove('visible');moving=false;if(r.focus){const h=scenes[current].querySelector('h1,h2');h.tabIndex=-1;h.focus({preventScroll:true});}if(queued!==null){const q=queued;queued=null;requestAnimationFrame(()=>go(q));}}
function go(i,instant=false){if(!Number.isInteger(i)||i<0||i>=scenes.length||booting)return;if(moving){queued=i;return;}if(i===current)return;stopSequence();resetFilmButtons();beep(1);if(!motion||instant){if(i>current)scenes[i].scrollTop=0;settledScene(i);return;}const from=current,old=scenes[from],next=scenes[i],forward=i>from,e=effects[Math.min(from,i)%effects.length],duration=innerWidth<740?720:950;next.hidden=false;if(forward)next.scrollTop=0;[old,next].forEach(s=>{s.classList.add('moving');s.inert=true;});next.classList.add('active');old.style.zIndex=forward?1:2;next.style.zIndex=forward?2:1;moving=true;sceneUI(i);const marker=$('#transitionMarker');$('#transitionName').textContent=chapters[i][0];marker.classList.add('visible');const opts={duration,easing:'cubic-bezier(.65,0,.25,1)',fill:'both'};const r={to:i,animations:[],focus:old.contains(document.activeElement),timeout:0};run=r;try{r.animations.push(old.animate(forward?e.out:reverseFrames(e.in),opts),next.animate(forward?e.in:reverseFrames(e.out),opts),marker.animate([{transform:'translate('+innerWidth*.18+'px,'+innerHeight*.33+'px)',opacity:0},{transform:'translate('+innerWidth*.42+'px,'+innerHeight*.2+'px)',opacity:1,offset:.5},{transform:'translate('+innerWidth*.68+'px,'+innerHeight*.33+'px)',opacity:0}],opts));const done=()=>{if(run===r)finishTransition();};r.timeout=setTimeout(done,duration+500);Promise.all(r.animations.slice(0,2).map(a=>a.finished)).then(done,done);}catch{finishTransition();}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(!b)return;e.preventDefault();if($('#mapDialog').open)$('#mapDialog').close();go(Number(b.dataset.go));});$('#prevLevel').addEventListener('click',()=>go(current-1));$('#nextLevel').addEventListener('click',()=>go(current+1));let wheelAccum=0,wheelLast=0,wheelGate=0;
$('#viewport').addEventListener('wheel',e=>{if(booting||document.querySelector('dialog[open]')||e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;if(moving){e.preventDefault();return;}const s=scenes[current],down=e.deltaY>0,edge=down?s.scrollTop+s.clientHeight>=s.scrollHeight-2:s.scrollTop<=1;if(!edge){wheelAccum=0;return;}e.preventDefault();const now=performance.now();if(now-wheelLast>200)wheelAccum=0;wheelLast=now;wheelAccum+=e.deltaY;if(now-wheelGate<1200||Math.abs(wheelAccum)<70)return;wheelGate=now;wheelAccum=0;go(current+(down?1:-1));},{passive:false});
addEventListener('resize',()=>{if(moving)finishTransition();});
function openDialog(id){stopSequence();resetFilmButtons();const d=document.getElementById(id);if(!d.open)d.showModal();beep();}
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.close).close()));$$('dialog').forEach(d=>d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))d.close();}));$('#mapOpen').addEventListener('click',()=>openDialog('mapDialog'));
// A single cancellable timeline per user-triggered presentation, pausable at any beat.
// PokemonData lab: three demo stages sharing one sequencer. All values are illustrative placeholders.
const dexPattern=['..1....1..','.11....11.','.11111111.','.12211221.','.12211221.','.11111111.','1113311111','1113311111','.11111111.','.11.11.11.'],dexColor={'1':'#7fa973','2':'#253e43','3':'#fff4d7'},dexStats=[['生命',108,'#e06c56'],['攻击',130,'#e8a33d'],['防御',95,'#e8d33d'],['特攻',80,'#6a9ad0'],['特防',85,'#6ab56a'],['速度',102,'#d06a9a']];
const labDemos={dex:{time:8000,end:'图鉴工具：一句话进去，一条数据出来。'},damage:{time:12000,end:'工具接住问题，再把结果翻译成能读的数字。'},speed:{time:8000,end:'先后手不是感觉，是比出来的。'}},labOrder=['dex','damage','speed'];
let labDemo='dex',labRoll=0,labChained=false;
function resetFilmButtons(){$('#heroFilm').innerHTML='播放冒险序章 <small>18 秒</small>';$('#projectPlay').innerHTML=(project==='trace'?'播放记录流程':project==='agents'?'播放分工流程':'播放情报流水线')+' <small>12 秒</small>';$('#labPlay').innerHTML='播放演示 <small id="labTime">'+Math.round(labDemos[labDemo].time/1000)+' 秒</small>';$('#photoFilm').innerHTML='播放风光短片 <small>30 秒</small>';$('#heroStory .story-stop').hidden=true;$('#photoOpen').classList.remove('framing');}
$('#heroFilm').addEventListener('click',()=>{if(togglePause('hero',$('#heroFilm')))return;$('#heroFilm').textContent='暂停播放';$('#heroStory .story-stop').hidden=false;const steps=[{at:0,fn:()=>$('#heroDialogue').textContent='我叫李念，朋友叫我年糕。这个角色，还没有满级。'},{at:4500,fn:()=>{$('#heroDialogue').textContent='从三年 Python 到项目工坊：AI 帮忙，但决定和收尾是自己的。';beep(1);}},{at:9000,fn:()=>{$('#heroDialogue').textContent='离开工坊，带着相机到湖边。摄影，是另一种探索。';beep(2);}},{at:13500,fn:()=>$('#heroDialogue').textContent='游戏给我快乐，代码给我好奇。下一关，想和同频的人一起打。'}];startSequence('hero',18000,steps,(t)=>{let x;if(t<5000)x=110+t/5000*210;else if(t<9000)x=320;else if(t<13500)x=320-(t-9000)/4500*105;else x=215+(t-13500)/4500*185;PixelWorld.draw(canvasWorld,t/1000,{playerX:x,walking:t<5000||(t>9000&&t<13500)||t>13500,camera:t>=9000&&t<=13500,label:t>=5000&&t<9000?'CODE':t>=11000&&t<13500?'CLICK':null,flash:t>11000&&t<11500?.28*(1-(t-11000)/500):0,night:nightMode()});},()=>{$('#heroDialogue').textContent='序章结束。选一个关卡，继续探索我的项目、游戏和摄影。';resetFilmButtons();},()=>{$('#heroStory .story-stop').hidden=true;});});$('#heroStory .story-stop').addEventListener('click',()=>{stopSequence();resetFilmButtons();});
let project='trace';const projectContent={trace:{type:'Windows / 本地优先',name:'VibeTrace',description:'Windows 本地使用监控：记录前台窗口时长、浏览器历史，再在日报仪表盘中回看。数据留在本机。从 UsageMonitor 继续迭代，发布在 GitHub。',visual:'<div class="terminal-heading">记录视图 / 示意，不含真实使用数据</div><div class="trace-bars">'+[32,64,40,83,55,91,68,49,76,58].map((h,i)=>'<i style="--height:'+h+'%"></i>').join('')+'</div><div class="trace-axis"><span>前台窗口 → 使用时长 → 日报</span><span>本地优先</span></div>',link:'https://github.com/Niangaol/VibeTrace'},agents:{type:'TypeScript / 多 Agent 编排',name:'多 Agent 流水线',description:'把内容生产拆成选题、生成、审核、渲染，交给多个 Agent 分工。LLM 输出不稳，所以加上测试和失败兜底：它跑偏时，程序得拦得住。',visual:'<div class="terminal-heading">流水线 / 演示模式</div><div class="agent-pipeline"><div class="agent-step">选题<small>收敛方向</small></div><div class="agent-step">生成<small>形成内容</small></div><div class="agent-step">审核<small>检查输出</small></div><div class="agent-step">渲染<small>完成交付</small></div></div><div class="package" aria-hidden="true"></div><div class="trace-axis"><span>分工明确 · 测试 · 失败兜底</span><span>流程示意</span></div>'},safetrace:{type:'TypeScript / 多 Agent 情报系统',name:'SafeTrace',description:'智能体驱动的 AI 安全知识情报系统：从 CISA KEV、NVD 等源采集漏洞情报，去重归并、过质量闸门，再做富化和向量索引；问答线把意图理解、混合检索和带出处的答案接起来。团队项目，我负责问答线、编排和模型网关。',visual:'<div class="terminal-heading">情报雷达 / 演示模式</div><div class="intel-radar" data-stage="0"><div class="radar-scope" aria-hidden="true"><div class="radar-grid"></div><div class="radar-rings"></div><div class="radar-sweep"></div><i class="radar-signal" style="--x:24%;--y:32%;--d:0s"></i><i class="radar-signal" style="--x:37%;--y:20%;--d:.16s"></i><i class="radar-signal" style="--x:63%;--y:28%;--d:.32s"></i><i class="radar-signal" style="--x:47%;--y:55%;--d:.48s"></i><i class="radar-signal radar-noise" style="--x:71%;--y:63%;--d:.64s"></i><i class="radar-signal radar-noise" style="--x:29%;--y:68%;--d:.8s"></i><div class="radar-core">KEV</div><div class="radar-badges"><span>CVSS 9.1</span><span>EPSS 97%</span></div><div class="radar-stack"><i></i><i></i><i></i></div></div><div class="radar-side"><ol class="radar-log"><li>扫描 7 类情报源</li><li>同一漏洞的四套编号，归并成一条</li><li>脏数据进隔离区，不进知识库</li><li>挂上 CVSS / EPSS 与修复建议</li><li>写入知识底座，可被检索</li><li>问一句，给出带出处的答案</li></ol><div class="radar-answer"><p class="radar-query">Ollama 未授权访问，影响我们哪些服务？</p><p class="radar-cite">出处：NVD · CISA KEV · 修复建议</p></div></div></div><div class="trace-axis"><span>采集 → 质检 → 隔离 → 富化 → 入库问答</span><span>流程示意</span></div>',link:'https://github.com/Niangaol/safetrace'}};
function selectProject(key){stopSequence();project=key;const p=projectContent[key];$('#projectType').textContent=p.type;$('#projectName').textContent=p.name;$('#projectDescription').textContent=p.description;$('#projectVisual').innerHTML=p.visual;const projectLink=$('#projectLink');if(p.link){projectLink.href=p.link;projectLink.hidden=false;}else projectLink.hidden=true;$$('[data-project]').forEach(b=>{const on=b.dataset.project===key;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});resetFilmButtons();$('#projectCaption').textContent='选择项目，看看它在解决什么问题。';}
$$('[data-project]').forEach(b=>b.addEventListener('click',()=>selectProject(b.dataset.project)));selectProject('trace');
$('#projectPlay').addEventListener('click',()=>{if(togglePause('project',$('#projectPlay')))return;$('#projectPlay').textContent='暂停播放';const copy=project==='trace'?['先记录当前使用的窗口。','把零散记录整理成使用时长。','在日报视图里回看一天的使用。','数据留在自己的电脑里，工具服务于自己。']:project==='agents'?['先确定一个明确的内容方向。','生成 Agent 只负责形成内容。','审核环节检查不稳定的 LLM 输出。','审核通过，再渲染成最终产物。']:['从多个漏洞库采集最新情报。','同一漏洞的四套编号，归并成一条。','脏数据进隔离区，不进知识库。','补上 CVSS、EPSS 与修复建议。','问一句，给出带出处的答案。'];const beat=copy.length>4?2400:3000;const steps=copy.map((text,i)=>({at:i*beat,fn:()=>{$('#projectCaption').textContent=text;beep(i);$$('.agent-step').forEach((n,j)=>n.classList.toggle('lit',i===j));const radar=$('#projectVisual .intel-radar');if(radar)radar.dataset.stage=String(i);}}));startSequence('project',beat*copy.length,steps,(t,p)=>{if(project==='agents'){const pack=$('.package');if(pack){pack.style.opacity='1';pack.style.transform='translateX('+(Math.min(p,.96)*($('#projectVisual').clientWidth-80))+'px)';}}else{$$('.trace-bars i').forEach((n,i)=>{n.style.transform='scaleY('+Math.min(1,Math.max(.1,t/1600-i*.08))+')';n.style.transformOrigin='bottom';});}},()=>{$('#projectCaption').textContent='演示结束。原理示意不代表实时运行结果。';resetFilmButtons();},()=>{const pack=$('.package');if(pack)pack.style.opacity='0';$$('.trace-bars i').forEach(n=>{n.style.removeProperty('transform');n.style.removeProperty('transform-origin');});});});
$('#dexSprite').replaceChildren(...dexPattern.flatMap((row,r)=>[...row].map(ch=>{const i=document.createElement('i');i.style.setProperty('--r',String(r));i.style.setProperty('--c',dexColor[ch]||'transparent');return i;})));
$('#dexStats').replaceChildren(...dexStats.map(([n,v,c],i)=>{const d=document.createElement('div');d.innerHTML='<span>'+n+'</span><i style="--v:'+(v/160)+';--c:'+c+';--i:'+i+'"></i><b>'+v+'</b>';return d;}));
function labStage(key){return $('.lab-stage[data-demo="'+key+'"]');}
function labReset(){labOrder.forEach(k=>labStage(k).classList.remove('play','done'));$$('.dmg-tools span').forEach(s=>s.classList.remove('hit'));$('#dmgQuery').textContent='';$('#dmgNum').textContent='0';clearInterval(labRoll);labRoll=0;}
function setLabDemo(key,silent){stopSequence();labReset();labDemo=key;$$('.lab-stage').forEach(s=>s.hidden=s.dataset.demo!==key);$$('[data-tool]').forEach(b=>{const on=b.dataset.tool===key;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});resetFilmButtons();$('#labCaption').textContent='选一个工具，看它怎么跑起来。';if(!silent)beep(0);}
function labScanTool(i){$$('.dmg-tools span').forEach((s,j)=>s.classList.toggle('hit',j===i));}
function labRollNum(){clearInterval(labRoll);if(!motion){$('#dmgNum').textContent='97.5';return;}let v=0;labRoll=setInterval(()=>{v=Math.min(97.5,v+1.9+Math.random()*2.4);$('#dmgNum').textContent=v.toFixed(1);if(v>=97.5){clearInterval(labRoll);labRoll=0;}},60);}
function playLab(key,onDone){stopSequence();labReset();const stage=labStage(key);void stage.offsetWidth;stage.classList.add('play');const cfg=labDemos[key],query='呆呆王打烈咬陆鲨，冰冻之光能打多少？';
 let steps;
 if(key==='dex')steps=[{at:0,fn:()=>$('#labCaption').textContent='扫一下这只精灵：属性、种族值、特性。'},{at:1500,fn:()=>{$('#labCaption').textContent='种族值六项，按固定色排下来。';beep(1);}},{at:4600,fn:()=>{$('#labCaption').textContent='Agent 选图鉴工具，不是凭印象答。';beep(2);}}];
 else if(key==='damage')steps=[{at:0,fn:()=>$('#labCaption').textContent='先收到一句大白话问题。'},...query.split('').map((ch,i)=>({at:150+i*95,fn:()=>$('#dmgQuery').textContent+=ch})),{at:2300,fn:()=>{$('#labCaption').textContent='拆出攻击方、招式、防守方三个参数。';beep(1);}},{at:3600,fn:()=>{labScanTool(0);$('#labCaption').textContent='11 个工具里，挑一个对的。';}},{at:4150,fn:()=>labScanTool(1)},{at:4700,fn:()=>labScanTool(2)},{at:5250,fn:()=>{labScanTool(3);$('#labCaption').textContent='锁定「伤害计算」，把参数交给它。';beep(2);}},{at:6400,fn:()=>{stage.classList.add('done');$('#labCaption').textContent='伤害条在长，数字在滚。';labRollNum();}}];
 else steps=[{at:0,fn:()=>$('#labCaption').textContent='两只精灵，谁先出手？'},{at:1200,fn:()=>{$('#labCaption').textContent='速度条一起跑，快的先到。';beep(1);}},{at:2900,fn:()=>{stage.classList.add('done');$('#labCaption').textContent='102 对 91，烈咬陆鲨先手。';beep(2);}},{at:5200,fn:()=>$('#labCaption').textContent='先后手不是感觉，是比出来的。'}];
 startSequence('lab',cfg.time,steps,null,()=>{$('#labCaption').textContent=cfg.end;resetFilmButtons();onDone?.();},()=>{clearInterval(labRoll);labRoll=0;});}
$$('[data-tool]').forEach(b=>b.addEventListener('click',()=>setLabDemo(b.dataset.tool)));
$('#labPlay').addEventListener('click',()=>{if(togglePause('lab',$('#labPlay')))return;$('#labPlay').textContent='暂停播放';playLab(labDemo);});
$('#labAll').addEventListener('click',()=>{if(labChained){labChained=false;stopSequence();resetFilmButtons();$('#labAll').innerHTML='连续播放 <small>28 秒</small>';$('#labCaption').textContent='连续播放已停止，可以单个看。';return;}labChained=true;$('#labAll').textContent='停止播放';const queue=labOrder.slice();const step=()=>{if(!labChained)return;if(!queue.length){labChained=false;$('#labAll').innerHTML='连续播放 <small>28 秒</small>';$('#labCaption').textContent='三个工具都过了一遍：图鉴、伤害、速度线。';return;}const key=queue.shift();setLabDemo(key,true);playLab(key,()=>setTimeout(step,800));};step();});
setLabDemo('dex',true);
// Photography: only optimized public files; never expose the audit manifest or EXIF.
function photoVariant(p,size){return p.path.replace('assets/photos/','assets/photos/'+size+'/');}
function setPreview(img,p,sizes){img.decoding='async';img.sizes=sizes;img.srcset=photoVariant(p,480)+' 480w, '+photoVariant(p,960)+' 960w';img.src=photoVariant(p,480);img.alt=p.alt;}
photos.forEach((p,i)=>{const b=document.createElement('button');b.setAttribute('aria-label','查看摄影作品：'+p.title);b.setAttribute('aria-pressed','false');const img=document.createElement('img');img.width=160;img.height=160;img.loading='lazy';img.decoding='async';img.src=photoVariant(p,'thumb');img.alt=p.alt;const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');b.append(img,n);b.addEventListener('click',()=>{stopSequence();resetFilmButtons();setPhoto(i);});$('#photoThumbnails').append(b);});
$('#heroPhoto').fetchPriority='high';setPreview($('#heroPhoto'),photos[7],'(max-width:740px) 160px, 260px');
function setPhoto(i,cinematic=false){photoIndex=(i+photos.length)%photos.length;const p=photos[photoIndex];const img=$('#mainPhoto');img.loading='lazy';setPreview(img,p,'(max-width:740px) calc(100vw - 48px), (max-width:1100px) 58vw, 62vw');$('#photoName').textContent=p.title;$('#photoSeries').textContent=p.series+' / '+p.date;$('#photoCount').textContent=String(photoIndex+1).padStart(2,'0')+' / '+photos.length;$$('#photoThumbnails button').forEach((b,j)=>b.setAttribute('aria-pressed',String(j===photoIndex)));$('.photo-error').hidden=true;if(cinematic&&motion){$('#photoOpen').classList.remove('flash');void $('#photoOpen').offsetWidth;$('#photoOpen').classList.add('flash');beep(2);}}
$('#mainPhoto').addEventListener('error',()=>$('.photo-error').hidden=false);$('#mainPhoto').addEventListener('load',()=>$('.photo-error').hidden=true);setPhoto(0);
function startLargeImageLoad(){$('#largeImageLoading').hidden=false;$('#largeImageLoading span').textContent='正在加载高清图片……';$('#largeImageLoading').classList.remove('failed');}$('#largeImage').addEventListener('load',()=>$('#largeImageLoading').hidden=true);$('#largeImage').addEventListener('error',()=>{$('#largeImageLoading').classList.add('failed');$('#largeImageLoading span').textContent='图片加载失败，请关闭后重试。';});
function showLargePhoto(i){startLargeImageLoad();photoIndex=(i+photos.length)%photos.length;setPhoto(photoIndex);const p=photos[photoIndex];largeIsPhoto=true;$('#largeImage').decoding='async';$('#largeImage').loading='eager';$('#largeImage').src=p.path+'?v=fast-images-1';$('#largeImage').alt=p.alt;$('#imageTitle').textContent=p.title;$('#imageCaption').textContent=p.series+' / '+p.date+' · 摄影：李念';$('.image-nav').hidden=false;}
$('#photoOpen').addEventListener('click',()=>{showLargePhoto(photoIndex);openDialog('imageDialog');});$('#heroPhotoOpen').addEventListener('click',()=>{showLargePhoto(7);openDialog('imageDialog');});function showChart(){startLargeImageLoad();largeIsPhoto=false;$('#largeImage').decoding='async';$('#largeImage').src='assets/game-tiers.webp';$('#largeImage').alt='李念的任天堂个人游戏与主机喜好排序表';$('#imageTitle').textContent='我的游戏生涯个人喜好表';$('#imageCaption').textContent='个人偏好排序，不是客观游戏评分。游戏封面及相关标识属于各自权利方。';$('.image-nav').hidden=true;openDialog('imageDialog');}$('#gameChartOpen').addEventListener('click',showChart);$('#gameChartZoom').addEventListener('click',showChart);$('#imagePrev').addEventListener('click',()=>showLargePhoto(photoIndex-1));$('#imageNext').addEventListener('click',()=>showLargePhoto(photoIndex+1));$('#photoPrev').addEventListener('click',()=>{stopSequence();resetFilmButtons();setPhoto(photoIndex-1);});$('#photoNext').addEventListener('click',()=>{stopSequence();resetFilmButtons();setPhoto(photoIndex+1);});
$('#photoFilm').addEventListener('click',()=>{if(togglePause('photos',$('#photoFilm')))return;$('#photoFilm').textContent='暂停播放';const order=[0,3,7,8,9,4],texts=['从湖面开始，先看光落在水上的样子。','让飞鸟把静止的一刻，变成有动作的记忆。','走进绿色里，把喧闹留在镜头之外。','换一个更远的视野：天空、海面与远岸。','一座红塔，让蓝色的海有了自己的落点。','最后，把一点夜色和焰迹留在这一卷里。'];const steps=order.map((i,j)=>({at:j*5000,fn:()=>{setPhoto(i,true);$('#photoCaption').textContent=texts[j];$('#photoOpen').classList.add('framing');}}));startSequence('photos',30000,steps,(t,p)=>{$('#photoProgress').style.transform='scaleX('+p+')';if(motion){const local=(t%5000)/5000;$('#mainPhoto').style.transform='scale('+(1.03-local*.03)+')';}},()=>{$('#photoCaption').textContent='短片放映结束。其余作品留在相册里，欢迎继续翻。';resetFilmButtons();},()=>{$('#mainPhoto').style.removeProperty('transform');$('#photoOpen').classList.remove('framing');});});
// Presenter notes match all eight levels, and the suggested durations total 15 minutes.
const notes=[['开场 · 1 分钟','报姓名、外号、学校和专业。','今天介绍做过的东西，也介绍游戏与摄影。'],['档案 · 1.5 分钟','三年 Python 的积累，不吹天赋。','AI 帮忙，但想法、决定和收尾是自己的。'],['工坊 · 4 分钟','VibeTrace：本地记录与日报，数据留在本机。','多 Agent：选题、生成、审核、渲染；重点讲测试和兜底。','SafeTrace：安全情报流水线，我负责问答线、编排和模型网关。','界面是原理示意，可以另外打开真实项目。'],['研究所 · 2 分钟','PokemonData：图鉴、伤害、速度线与 11 个 Agent 工具。','讲爱好怎样变成全栈练习，不编造实时对战数据。'],['背包 · 1 分钟','快速展示个人喜好表。','喜欢探索、动作和任天堂，也喜欢 GBA 的像素画面。'],['摄影 · 2 分钟','放慢，留时间看两三张作品。','可播放风光短片，讲自己为什么喜欢摄影。'],['成长 · 2 分钟','算法、C++、线代都是正在学的方向。','20 分钟先自己想，再看题解，关掉重写。'],['营地 · 1.5 分钟','为什么加入 AI Vibe：真在用、有做过的东西、找同频。','答不上来的回去学；最后可以打开收服彩蛋。']];let noteIndex=0,timerStart=0,timerRemaining=900,timerInterval=0;
function noteRender(){$('#noteChapter').textContent=notes[noteIndex][0];$('#talkNotes').replaceChildren(...notes[noteIndex].slice(1).map(t=>{const n=document.createElement('li');n.textContent=t;return n;}));}
function timerRender(){const secs=Math.max(0,Math.ceil(timerRemaining));$('#talkTimer').textContent=String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');}
$('#presenterOpen').addEventListener('click',()=>{noteIndex=current;noteRender();openDialog('presenterDialog');});$('#notePrev').addEventListener('click',()=>{noteIndex=(noteIndex+7)%8;noteRender();});$('#noteNext').addEventListener('click',()=>{noteIndex=(noteIndex+1)%8;noteRender();});$('#timerToggle').addEventListener('click',()=>{if(timerInterval){clearInterval(timerInterval);timerInterval=0;$('#timerToggle').textContent='继续计时';}else{let last=performance.now();timerInterval=setInterval(()=>{const now=performance.now();timerRemaining=Math.max(0,timerRemaining-(now-last)/1000);last=now;timerRender();if(!timerRemaining){clearInterval(timerInterval);timerInterval=0;$('#timerToggle').textContent='计时结束';}},250);$('#timerToggle').textContent='暂停计时';}});$('#timerReset').addEventListener('click',()=>{clearInterval(timerInterval);timerInterval=0;timerRemaining=900;timerRender();$('#timerToggle').textContent='开始计时';});noteRender();timerRender();
// Pixel easter egg: finite particles, cancellable capture, modal focus managed by native dialog.
let eggRAF=0,eggParts=[],eggMode='idle',eggLast=0,eggReadyTimer=0,eggBorn=0;const eggCanvas=$('#eggCanvas'),eggCtx=eggCanvas.getContext('2d');
function stopEggFX(){cancelAnimationFrame(eggRAF);eggRAF=0;eggParts=[];eggCtx.clearRect(0,0,480,320);}
function burst(n,centerX=240,centerY=137){for(let i=0;i<n&&eggParts.length<160;i++){const a=Math.random()*Math.PI*2,s=1.3+Math.random()*3.4;eggParts.push({x:centerX,y:centerY,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1.7,life:1,r:1+Math.random()*2,color:i%4===0?'#e8af66':i%3===0?'#fff4d7':'#a4cd8d'});}}
function eggFrame(t){if(!$('#eggDialog').open||!motion||document.hidden){stopEggFX();return;}const dt=Math.min(2,(t-eggLast)/16.7||1);eggLast=t;eggCtx.clearRect(0,0,480,320);if(eggMode==='idle'&&eggParts.length<35&&Math.random()<.25){burst(1,240+Math.sin(t/700)*80,135+Math.cos(t/500)*65);}for(let i=eggParts.length-1;i>=0;i--){const p=eggParts[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(eggMode==='captured'?.045:0)*dt;p.life-=.006*dt;if(p.life<=0){eggParts.splice(i,1);continue;}eggCtx.globalAlpha=Math.min(1,p.life*1.4);eggCtx.fillStyle=p.color;const s=Math.ceil(p.r);eggCtx.fillRect(Math.round(p.x),Math.round(p.y),s*3,s);eggCtx.fillRect(Math.round(p.x)+s,Math.round(p.y)-s,s,s*3);}eggCtx.globalAlpha=1;if(eggMode==='captured'&&eggParts.length===0){eggRAF=0;return;}eggRAF=requestAnimationFrame(eggFrame);}
function startEggFX(){if(!motion||eggRAF)return;eggLast=performance.now();eggRAF=requestAnimationFrame(eggFrame);}
function openEgg(){if(booting)return;openDialog('eggDialog');clearTimeout(eggReadyTimer);stopEggFX();const d=$('#eggDialog');d.classList.remove('captured','ready','arrive');$('#eggTitle').textContent='年糕出现了！';$('#eggSubtitle').textContent='谢谢你探索到最后。';$('#captureEgg').textContent='收服它';eggMode='idle';void d.offsetWidth;if(motion){d.classList.add('arrive');burst(26);startEggFX();eggReadyTimer=setTimeout(()=>{if(d.open&&!d.classList.contains('captured'))d.classList.add('ready');},1150);}else d.classList.add('ready');}
$('#eggDialog').addEventListener('close',()=>{clearTimeout(eggReadyTimer);stopEggFX();$('#eggDialog').classList.remove('captured','arrive','ready');});$('#captureEgg').addEventListener('click',()=>{const d=$('#eggDialog');if(d.classList.contains('captured')){d.close();return;}clearTimeout(eggReadyTimer);d.classList.remove('ready');d.classList.add('captured');$('#eggTitle').textContent='收服成功！';$('#eggSubtitle').textContent='年糕加入队伍了。下一关，继续一起打。';$('#captureEgg').textContent='关闭';eggMode='captured';burst(120);startEggFX();beep(2);});$('#eggEntrance').addEventListener('click',openEgg);let clicks=0,lastClick=0;$('#nickEgg').addEventListener('click',()=>{const t=performance.now();clicks=t-lastClick<700?clicks+1:1;lastClick=t;if(clicks===3){clicks=0;getSelection()?.removeAllRanges();openEgg();}});
// Real image readiness is independent of the opening film and its frame rate.
const bootStart=performance.now(),bootDuration=innerWidth<740?6200:7800;
let bootRAF=0,bootElapsed=0,bootBeat=-1,bootCheck=0;
const bootBeats=[[0,'存档读取','我叫李念，朋友叫我年糕。'],[1500,'角色出发','装备：好奇心。状态：还在学习。'],[3000,'路过工坊','写代码，是把想法变成能运行的东西。'],[4500,'走到湖边','带着相机，换一双眼睛看世界。'],[6000,'准备组队','游戏、摄影和项目，都想找同频的人聊聊。']];
// Warm compressed display variants, not the larger files reserved for the zoom dialog.
const bootURLs=[...new Set([...photos.flatMap(p=>['thumb',480,960].map(size=>photoVariant(p,size))),...$$('img[src]').map(img=>img.getAttribute('src')).filter(Boolean)])];
const imageLoad={total:bootURLs.length,loaded:0,failed:0,settled:0,timedOut:false};
function renderImageProgress(){const percent=Math.floor(imageLoad.settled/imageLoad.total*100);$('#bootProgress').style.transform='scaleX('+percent/100+')';$('#bootMeter').setAttribute('aria-valuenow',String(percent));$('#bootLoadStatus').textContent=imageLoad.settled<imageLoad.total?'图片 '+percent+'% · '+imageLoad.settled+'/'+imageLoad.total:imageLoad.failed?'图片检查完成 · '+imageLoad.failed+' 张稍后重试':'图片已就绪 · 100%';}
let bootQueue=0;
async function loadBootImage(){while(bootQueue<bootURLs.length){const url=bootURLs[bootQueue++];const ok=await new Promise(resolve=>{const img=new Image();img.decoding='async';img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src=url;});imageLoad.settled++;if(ok)imageLoad.loaded++;else imageLoad.failed++;if(booting)renderImageProgress();}}
function finishBoot(){if(!booting)return;booting=false;clearInterval(bootCheck);cancelAnimationFrame(bootRAF);bootRAF=0;$('#boot').classList.add('exiting');$('.console').inert=false;setTimeout(()=>{$('#boot').hidden=true;if(document.activeElement===$('#skipBoot'))$('#heroTitle').focus({preventScroll:true});},motion?650:0);updateAmbient();}
function checkBoot(){if(!booting)return;const elapsed=performance.now()-bootStart;if(elapsed>=9500){imageLoad.timedOut=imageLoad.settled<imageLoad.total;finishBoot();}else if(imageLoad.settled===imageLoad.total&&elapsed>=(motion?bootDuration:1000))finishBoot();}
function bootFrame(){if(!booting)return;bootElapsed=performance.now()-bootStart;checkBoot();if(!booting)return;if(!document.hidden){const b=bootBeats.reduce((acc,v,i)=>bootElapsed>=v[0]?i:acc,0);if(b!==bootBeat){bootBeat=b;$('#bootBeat').textContent=bootBeats[b][1];$('#bootLine').textContent=bootBeats[b][2];}if(motion){let x=bootElapsed<4500?90+bootElapsed/4500*225:315-(Math.min(bootElapsed-4500,2500)/2500)*105;PixelWorld.draw($('#bootCanvas'),bootElapsed/1000,{playerX:x,walking:bootElapsed<7000,camera:bootElapsed>=4500,label:bootElapsed>3000&&bootElapsed<4300?'CODE':bootElapsed>5900&&bootElapsed<6600?'CLICK':null,flash:bootElapsed>6000&&bootElapsed<6400?.22*(1-(bootElapsed-6000)/400):0,night:nightMode()});}}bootRAF=requestAnimationFrame(bootFrame);}
$('#heroTitle').tabIndex=-1;$('#skipBoot').addEventListener('click',finishBoot);$('#skipBoot').focus({preventScroll:true});renderImageProgress();
for(let i=0;i<4;i++)loadBootImage();
bootCheck=setInterval(checkBoot,150);setTimeout(finishBoot,9500);bootRAF=requestAnimationFrame(bootFrame);
// Keep modal keyboard actions out of scene navigation. Original Konami trigger retained.
const konami=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];let kp=0;
addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,select,[contenteditable]'))return;if(booting){if(['Enter','Escape',' '].includes(e.key)){e.preventDefault();finishBoot();}return;}if(e.key.toLowerCase()===konami[kp].toLowerCase()){kp++;if(kp===konami.length){kp=0;openEgg();e.preventDefault();return;}}else kp=e.key==='ArrowUp'?1:0;const modal=document.querySelector('dialog[open]');if(modal){if(modal.id==='presenterDialog'&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();noteIndex=(noteIndex+(e.key==='ArrowRight'?1:7))%8;noteRender();}else if(modal.id==='imageDialog'&&largeIsPhoto&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();showLargePhoto(photoIndex+(e.key==='ArrowRight'?1:-1));}return;}if(e.key.toLowerCase()==='p'){e.preventDefault();noteIndex=current;noteRender();openDialog('presenterDialog');return;}if(moving){if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))e.preventDefault();return;}if(e.target.closest('button,a')&&e.key===' ')return;const s=scenes[current];if(e.key==='ArrowRight'){e.preventDefault();go(current+1);}else if(e.key==='ArrowLeft'){e.preventDefault();go(current-1);}else if(['ArrowDown','PageDown'].includes(e.key)){e.preventDefault();if(s.scrollTop+s.clientHeight<s.scrollHeight-2)s.scrollBy({top:e.key==='PageDown'?s.clientHeight*.8:80,behavior:motion?'smooth':'auto'});else go(current+1);}else if(['ArrowUp','PageUp'].includes(e.key)){e.preventDefault();if(s.scrollTop>2)s.scrollBy({top:e.key==='PageUp'?-s.clientHeight*.8:-80,behavior:motion?'smooth':'auto'});else go(current-1);}else if(e.key==='Home'){e.preventDefault();go(0);}else if(e.key==='End'){e.preventDefault();go(7);}});
addEventListener('visibilitychange',()=>{if(document.hidden){stopAmbient();stopEggFX();}else{updateAmbient();if($('#eggDialog').open)startEggFX();}});
settledScene(0);
window.__adventure={go,openEgg,finishBoot,setMotion,stopPresentation(){stopSequence();resetFilmButtons();},get cur(){return current;},get moving(){return moving;},get booting(){return booting;},get imageLoad(){return {...imageLoad};},get sequence(){return sequence?{key:sequenceKey,elapsed:sequence.elapsed,paused:sequence.paused}:null;},get fx(){return {egg:!!eggRAF,particles:eggParts.length,ambient:!!ambientRAF};},get photos(){return photos;}};
})();
