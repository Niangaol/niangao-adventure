/* Original pixel scenery. Small native canvas, integer coordinates, no external art. */
'use strict';
window.PixelWorld = (() => {
  const C={sky:'#b6d9dd',cloud:'#edf2dc',far:'#9bbcbb',mount:'#80a5a2',water:'#75afb5',waterLight:'#bad7c9',deep:'#528e9c',grass:'#8ba969',grassLight:'#bfd398',grassDark:'#5f865d',path:'#d6c79b',wood:'#826748',roof:'#b77555',roofDark:'#895745',ink:'#253e43',cream:'#fff4d7',skin:'#dfb48a',shirt:'#547d70',gold:'#e8af66'};
  let ctx;
  const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  function poly(points,c){ctx.fillStyle=c;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
  function cloud(x,y,s=1){r(x,y,30*s,8*s,C.cloud);r(x+5*s,y-5*s,9*s,5*s,C.cloud);r(x+12*s,y-9*s,10*s,9*s,C.cloud);r(x+22*s,y-3*s,7*s,5*s,C.cloud);}
  function pine(x,y,s=1){r(x-2*s,y,4*s,15*s,C.wood);for(let k=0;k<4;k++){const w=8+k*5;r(x-w*s/2,y-30*s+k*8*s,w*s,8*s,k%2?C.grassDark:'#527968');}r(x-3*s,y-30*s,6*s,5*s,'#739b75');}
  function tree(x,y,s=1){r(x-3*s,y,6*s,16*s,C.wood);r(x-15*s,y-23*s,30*s,22*s,C.grassDark);r(x-11*s,y-30*s,23*s,10*s,C.grassDark);r(x-13*s,y-24*s,14*s,8*s,C.grassLight);r(x-6*s,y-28*s,14*s,6*s,C.grassLight);r(x+8*s,y-18*s,6*s,9*s,'#4b735b');}
  function hut(x,y,label='code'){r(x,y,42,29,C.wood);r(x+3,y+3,36,25,'#dfca9b');r(x-5,y-6,52,7,C.roofDark);r(x,y-13,42,7,C.roof);r(x+5,y-18,32,5,C.roof);r(x+10,y-21,22,3,C.roof);r(x+15,y+9,11,20,C.ink);r(x+30,y+7,8,8,C.ink);r(x+31,y+8,6,6,'#9dccbd');r(x+4,y+7,8,8,C.ink);r(x+5,y+8,6,6,'#a9d1be');r(x+18,y+12,5,13,'#5f827b');r(x+19,y+12,2,2,C.cream);if(label==='code'){r(x+8,y-6,26,9,C.ink);r(x+12,y-4,3,2,C.cream);r(x+11,y-2,3,2,C.cream);r(x+13,y,3,2,C.cream);r(x+26,y-4,3,2,C.cream);r(x+27,y-2,3,2,C.cream);r(x+25,y,3,2,C.cream);}else{r(x+10,y-6,22,9,C.ink);r(x+15,y-4,12,5,C.cream);r(x+19,y-5,4,2,C.cream);r(x+19,y-2,4,3,C.ink);}}
  function player(x,y,t=0,walking=false,camera=false){const f=walking?Math.floor(t*5)%2:0;x=Math.round(x);y=Math.round(y);r(x-5,y+22,13,3,'#728c65');r(x-2,y,8,3,'#5c483a');r(x-4,y+3,12,4,'#5c483a');r(x-2,y+7,9,7,C.skin);r(x+5,y+8,2,2,C.ink);r(x-2,y+14,9,7,C.shirt);r(x-4,y+15,2,5,C.skin);r(x+7,y+15,2,4,C.skin);r(x-1,y+21,3,3+(f?1:0),C.ink);r(x+4,y+21,3,3+(f?0:1),C.ink);r(x-1,y+14,3,3,'#9ab590');if(camera){r(x+5,y+12,7,5,C.ink);r(x+7,y+11,3,2,C.ink);r(x+8,y+13,2,2,C.cream);}}
  function flowers(t,dusk=false){for(let i=0;i<48;i++){const x=(i*37+11)%480,y=200+(i*13)%34;const col=dusk?'#c6ae72':i%4===0?'#b87964':i%3===0?'#fff4d7':'#c5d896';r(x,y,2,3,col);r(x-1,y+3,4,1,C.grassDark);if(i%8===0)r(x+2,y-3+Math.floor(Math.sin(t+i)*1),1,1,C.gold);}}
  function atmosphere(t,dusk){
    // Layered rectangular bloom and ripples stay inside the original pixel landscape.
    const breath=.5+.5*Math.sin(t*.45);
    for(const [x,y,color] of [[343,178,'#e8af66'],[418,182,'#dce9b2']]){ctx.globalAlpha=.04+breath*.05;r(x-28,y-23,56,46,color);ctx.globalAlpha=.08+breath*.05;r(x-19,y-16,38,32,color);ctx.globalAlpha=.16+breath*.08;r(x-8,y-6,16,12,color);}ctx.globalAlpha=1;
    for(let i=0;i<16;i++){const x=20+(i*43)%440,y=137+(i*17)%46,a=.2+.3*(1+Math.sin(t*.7+i))/2;ctx.globalAlpha=a;r(x,y,5+i%3,1,dusk?'#d7c48b':'#ecf5d5');if(i%4===0){r(x+3,y-2,1,5,'#ecf5d5');}}ctx.globalAlpha=1;
    if(dusk){for(let i=0;i<14;i++){const x=(i*31+10)%470,y=22+(i*19)%55;ctx.globalAlpha=.14+.24*(1+Math.sin(t*.5+i))/2;r(x,y,1,1,'#fff4d7');}ctx.globalAlpha=1;}
  }
  function scenery(t,options={}){const dusk=options.dusk;let sky=dusk?'#9dbab6':C.sky;r(0,0,480,240,sky);cloud(30+(t*1.1)%15,35,1.5);cloud(188-(t*.65)%20,22,1);cloud(382+(t*.5)%12,46,1.7);r(dusk?391:424,25,14,14,dusk?'#fff0b6':'#f6e6af');r(dusk?391:424,22,10,3,dusk?'#fff0b6':'#f6e6af');
    // Stepped ridgelines deliberately follow the pixel grid.
    for(let x=0;x<480;x+=8){let h=24+Math.sin(x*.018)*14+Math.cos(x*.041)*10;r(x,103-h,8,75+h,C.far);}
    for(let x=0;x<480;x+=6){let h=20+Math.sin(x*.017+2)*14+Math.sin(x*.029)*8;r(x,119-h,6,59+h,C.mount);}
    r(0,127,480,70,dusk?'#67979f':C.water);r(0,125,480,3,'#a6c9bb');
    for(let i=0;i<25;i++){let x=(i*53+11+Math.sin(t*.55+i)*4)%480,y=133+(i*7)%58;r(x,y,14+(i%4)*6,1,i%3===0?C.waterLight:C.deep);}
    // Shore/island silhouette and path.
    r(0,194,480,46,C.grassDark);for(let x=0;x<480;x+=10){const y=185+Math.round(Math.sin(x*.034)*4);r(x,y,10,55,C.grass);r(x,y,10,3,C.grassLight);}poly([[0,224],[101,208],[184,216],[266,195],[340,194],[397,215],[480,206],[480,222],[395,229],[339,205],[269,207],[184,228],[103,221],[0,237]],C.path);
    hut(321,164,'code');hut(400,167,'camera');pine(292,173,1.1);tree(59,179,1.2);pine(35,186,.9);pine(103,188,.85);tree(449,183,.8);pine(462,168,.8);r(271,183,18,6,'#6f8480');r(275,179,9,4,'#9cb0a0');r(361,181,19,7,C.grassDark);r(364,178,11,5,C.grassLight);
    const boatX=186+Math.sin(t*.16)*22;poly([[boatX,158],[boatX+19,158],[boatX+16,162],[boatX+3,162]],C.wood);r(boatX+9,146,1,12,C.wood);poly([[boatX+10,146],[boatX+17,155],[boatX+10,155]],C.cream);r(boatX+3,165,15,1,C.waterLight);flowers(t,dusk);
    atmosphere(t,dusk);
    if(dusk){for(let i=0;i<18;i++){const x=(i*43+30)%480,y=151+(i*11)%56,a=(Math.sin(t*1.7+i)+1)/2;ctx.globalAlpha=.25+a*.75;r(x,y+Math.sin(t+i)*3,1,1,C.gold);}ctx.globalAlpha=1;}
    const x=options.playerX??155,y=options.playerY??184;player(x,y,t,options.walking,options.camera);
    if(options.flash){ctx.globalAlpha=Math.min(.45,options.flash);r(0,0,480,240,C.cream);ctx.globalAlpha=1;}
    if(options.label){r(x-15,y-14,41,10,C.cream);r(x-2,y-5,5,4,C.cream);ctx.fillStyle=C.ink;ctx.font='7px monospace';ctx.fillText(options.label,x-11,y-7);}
  }
  function draw(canvas,t,options={}){if(!canvas)return;ctx=canvas.getContext('2d');ctx.save();ctx.imageSmoothingEnabled=false;ctx.setTransform(canvas.width/480,0,0,canvas.height/240,0,0);scenery(t,options);ctx.restore();}
  function portrait(canvas,t=0){if(!canvas)return;ctx=canvas.getContext('2d');ctx.save();ctx.setTransform(canvas.width/120,0,0,canvas.height/100,0,0);r(0,0,120,100,C.sky);cloud(8,19,1);cloud(82,29,.8);r(0,76,120,24,C.grass);r(0,76,120,4,C.grassLight);ctx.translate(50,33);ctx.scale(2.2,2.2);player(0,0,t,false,true);ctx.restore();}
  return {draw,portrait};
})();
