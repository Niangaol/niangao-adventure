import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync('index.html','utf8'),js=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'HTML IDs must be unique');
for(const f of ['app.js','world.js','effects.js','agent-chat.js','agent-config.js'])new vm.Script(fs.readFileSync(f,'utf8'),{filename:f});
assert.equal([...html.matchAll(/<section class="scene/g)].length,8);
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const p=match[1].split(/[?#]/)[0];if(/^(https?:|mailto:)/.test(p))continue;assert.ok(fs.existsSync(p),'Missing asset: '+p);}
assert.ok(css.includes('prefers-reduced-motion'));assert.ok(js.includes('stopSequence'));assert.ok(js.includes('reverseFrames'));
for(const [name,src] of [['index.html',html],['app.js',js],['world.js',fs.readFileSync('world.js','utf8')],['styles.css',css]]){assert.ok(!/[CD]:[\\/]|sourceAbsolutePath|photo-manifest[.]json/.test(src),'Private source path leaked in '+name);}
const photos=fs.readdirSync('assets/photos').filter(n=>n.endsWith('.webp'));assert.equal(photos.length,10);
for(const folder of ['thumb','480','960'])assert.equal(fs.readdirSync('assets/photos/'+folder).filter(n=>n.endsWith('.webp')).length,10,'Missing responsive photo variants');
const publicWebps=photos.map(f=>'assets/photos/'+f).concat(['thumb','480','960'].flatMap(folder=>photos.map(f=>'assets/photos/'+folder+'/'+f)),['assets/game-tiers.webp','assets/game-tiers-preview.webp']);
assert.ok(photos.reduce((sum,f)=>sum+fs.statSync('assets/photos/thumb/'+f).size,0)<80000,'Thumbnail payload must remain small');
assert.ok(js.includes("photoVariant(p,'thumb')"),'Thumbnails must not fetch the large files');
assert.ok(!html.includes('src="assets/game-tiers.png"'),'Page must load compressed game chart');
for(const f of publicWebps){const b=fs.readFileSync(f);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');for(let o=12;o+8<=b.length;){const name=b.toString('ascii',o,o+4);assert.ok(!['EXIF','XMP ','ICCP'].includes(name),'Unexpected photo metadata: '+f);const n=b.readUInt32LE(o+4);o+=8+n+(n%2);}}
assert.ok(fs.existsSync('assets/fonts/OFL.txt'));
const fx=fs.readFileSync('effects.css','utf8');
assert.ok(fx.includes('#viewport.effects-information>.effects-canvas{z-index:0}'),'Information effects must be on the background plane');
assert.ok(fx.includes('#viewport.effects-information>.scene:not(#start){z-index:1;background:transparent}'),'Whole foreground scene must stack above its particles, excluding the first scene');
assert.ok(fx.includes('#viewport.effects-information>.scene.moving{background:#e6edd8}'),'Moving pages must keep an opaque surface');
console.log('PASS: syntax, 8 scenes, unique IDs, local assets, 10 photos, metadata stripping, privacy, reduced motion and font license');
