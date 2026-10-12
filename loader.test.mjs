import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
const boot=source.slice(source.indexOf('// Real image readiness'),source.indexOf('// Keep modal keyboard'));
function harness(motion=true){
 const nodes=new Map(),pending=[],intervals=[],timeouts=[];let now=0;
 const node=s=>{if(!nodes.has(s))nodes.set(s,{style:{},hidden:false,inert:false,classList:{add(){}},setAttribute(k,v){this[k]=v;},addEventListener(){},focus(){}});return nodes.get(s);};
 const sandbox={performance:{now:()=>now},innerWidth:390,booting:true,motion,photos:[{path:'assets/photos/test.webp'}],photoVariant:(p,size)=>p.path.replace('photos/','photos/'+size+'/'),$:node,$$:()=>[],document:{hidden:false,activeElement:null},PixelWorld:{draw(){}},nightMode:()=>false,updateAmbient(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},clearInterval(){},setInterval:fn=>{intervals.push(fn);return intervals.length;},setTimeout:fn=>{timeouts.push(fn);return timeouts.length;},Image:class{set src(url){this.url=url;pending.push(this);}}};
 vm.createContext(sandbox);vm.runInContext(boot,sandbox);
 return {node,pending,sandbox,state:()=>JSON.parse(vm.runInContext('JSON.stringify(imageLoad)',sandbox)),advance:t=>{now=t;for(const fn of intervals)fn();},flush:()=>{for(const fn of timeouts)fn();}};
}
test('progress is real and does not depend on animation frames',async()=>{const h=harness();assert.equal(h.node('#bootMeter')['aria-valuenow'],'0');h.pending.shift().onload();await Promise.resolve();assert.equal(h.state().loaded,1);assert.equal(h.node('#bootMeter')['aria-valuenow'],'33');assert.equal(h.sandbox.booting,true);});
test('one failed image does not prevent entry or claim all images loaded',async()=>{const h=harness();h.pending.shift().onerror();for(const img of h.pending.splice(0))img.onload();await Promise.resolve();assert.equal(h.state().failed,1);assert.match(h.node('#bootLoadStatus').textContent,/稍后重试/);h.advance(6200);assert.equal(h.sandbox.booting,false);});
test('stalled network times out without faking 100 percent',()=>{const h=harness();h.advance(9500);assert.equal(h.sandbox.booting,false);assert.equal(h.state().timedOut,true);assert.equal(h.node('#bootMeter')['aria-valuenow'],'0');});
test('skip opens immediately and background images may still settle',async()=>{const h=harness();vm.runInContext('finishBoot()',h.sandbox);assert.equal(h.sandbox.booting,false);h.pending.shift().onload();await Promise.resolve();assert.equal(h.state().loaded,1);});
test('reduced motion still waits briefly for actual images',async()=>{const h=harness(false);for(const img of h.pending.splice(0))img.onload();await Promise.resolve();h.advance(999);assert.equal(h.sandbox.booting,true);h.advance(1000);assert.equal(h.sandbox.booting,false);});
test('pure CSS safety exit remains enabled with reduced motion',()=>{assert.match(fs.readFileSync(new URL('./styles.css',import.meta.url),'utf8'),/#boot{animation:boot-css-fallback 0s 12s forwards!important}/);});
