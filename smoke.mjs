import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync('index.html','utf8'),js=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'HTML IDs must be unique');
for(const f of ['app.js','world.js'])new vm.Script(fs.readFileSync(f,'utf8'),{filename:f});
assert.equal([...html.matchAll(/<section class="scene/g)].length,8);
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const p=match[1];if(/^(https?:|mailto:)/.test(p))continue;assert.ok(fs.existsSync(p),'Missing asset: '+p);}
assert.ok(css.includes('prefers-reduced-motion'));assert.ok(js.includes('stopSequence'));assert.ok(js.includes('reverseFrames'));
for(const [name,src] of [['index.html',html],['app.js',js],['world.js',fs.readFileSync('world.js','utf8')],['styles.css',css]]){assert.ok(!/[CD]:[\\/]|sourceAbsolutePath|photo-manifest[.]json/.test(src),'Private source path leaked in '+name);}
const photos=fs.readdirSync('assets/photos').filter(n=>n.endsWith('.webp'));assert.equal(photos.length,10);
for(const f of photos){const b=fs.readFileSync('assets/photos/'+f);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');for(let o=12;o+8<=b.length;){const name=b.toString('ascii',o,o+4);assert.ok(!['EXIF','XMP ','ICCP'].includes(name),'Unexpected photo metadata: '+f);const n=b.readUInt32LE(o+4);o+=8+n+(n%2);}}
assert.ok(fs.existsSync('assets/fonts/OFL.txt'));
console.log('PASS: syntax, 8 scenes, unique IDs, local assets, 10 photos, metadata stripping, privacy, reduced motion and font license');
