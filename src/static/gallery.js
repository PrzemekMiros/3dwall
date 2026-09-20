import * as T from './three.module.min.js';
import { Reflector } from './Reflector.js';
import Lenis from './lenis.mjs';
import { smoothStep } from './motion.js?v=scroll-detail-pass';
import titleOutlines from './title-outlines.js';
import contactOutlines from './contact-outlines.js?v=kontakt-title';

const canvas=document.querySelector('#gallery');
let renderer;
try { renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'}); }
catch(e){document.querySelector('#loading').textContent='Włącz przyspieszenie sprzętowe w przeglądarce, aby wyświetlić galerię 3D.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);
// PCFShadowMap respects shadow.radius; PCFSoftShadowMap ignores it.
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
const wallColor='#cecece';
const sideWallColor='#cecece';
const ceilingColor='#94908b';
const scene=new T.Scene();scene.background=new T.Color(wallColor);scene.fog=new T.Fog(wallColor,35,100);
const camera=new T.PerspectiveCamera(43,innerWidth/innerHeight,.1,150);
const H=5.4,END=98.5;
const white=new T.MeshStandardMaterial({color:wallColor,roughness:.87});
const side=new T.MeshStandardMaterial({color:sideWallColor,roughness:.86});
const coral=new T.MeshStandardMaterial({color:'#f06a5a',roughness:.45});
const dark=new T.MeshStandardMaterial({color:'#262726',roughness:.55});
scene.add(new T.HemisphereLight('#ffffff','#d4d1cb',1.85));
const sun=new T.DirectionalLight('#fffdfb',2.35);sun.position.set(4.8,11,7);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-16;sun.shadow.camera.right=16;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;sun.shadow.camera.near=.5;sun.shadow.camera.far=40;sun.shadow.bias=-.0002;sun.shadow.normalBias=.014;sun.shadow.radius=7;
scene.add(sun,sun.target);
function box(w,h,d,x,y,z,mat=white,shadow=true){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;scene.add(m);return m;}
function wall(a,b,z=0){box(b-a,H,.35,(a+b)/2,H/2,z-.175);box(b-a,.07,.05,(a+b)/2,.07,z+.025,new T.MeshStandardMaterial({color:sideWallColor}),false);}
function alcove(a,b,depth){wall(a,b,-depth);box(.32,H,depth,a,H/2,-depth/2,side);box(.32,H,depth,b,H/2,-depth/2,side);box(b-a,.25,depth,(a+b)/2,H-.05,-depth/2);}
wall(-14,6.1);alcove(6.1,10.3,3.6);wall(10.3,36.5);alcove(35,42,3);wall(42,47.5);alcove(47.5,51.5,3);wall(51.5,76);alcove(76,83,3.5);wall(83,89);alcove(89,93,3.4);wall(93,106);

function lightShaftTexture(){
 const c=document.createElement('canvas');c.width=256;c.height=1024;
 const ctx=c.getContext('2d');ctx.clearRect(0,0,256,1024);
 for(let i=0;i<34;i++){
  const t=i/33;
  ctx.globalAlpha=(1-Math.abs(t-.5)*1.55)*.045;
  ctx.fillStyle='#ffffff';
  ctx.beginPath();
  ctx.moveTo(108+i*1.8,0);ctx.lineTo(188+i*1.1,0);ctx.lineTo(115+i*.45,1024);ctx.lineTo(18+i*.6,1024);
  ctx.closePath();ctx.fill();
 }
 ctx.globalAlpha=.12;
 const fade=ctx.createLinearGradient(0,0,0,1024);fade.addColorStop(0,'rgba(255,255,255,.8)');fade.addColorStop(.55,'rgba(255,255,255,.48)');fade.addColorStop(1,'rgba(255,255,255,0)');
 ctx.fillStyle=fade;ctx.globalCompositeOperation='source-in';ctx.fillRect(0,0,256,1024);
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 return texture;
}
// Broad plaster bays with recessed luminous slots and soft wall spill, matching the reference ceiling.
const ceilingMat=new T.MeshBasicMaterial({color:ceilingColor});
const slotSideMat=new T.MeshStandardMaterial({color:'#e7e7e3',roughness:.9});
const slotMat=new T.MeshBasicMaterial({color:'#fffefa'});
const shaftMat=new T.MeshBasicMaterial({map:lightShaftTexture(),transparent:true,opacity:.38,depthWrite:false,blending:T.AdditiveBlending});
for(let x=-16;x<116;x+=3.9){
 box(2.62,.42,21,x,H+.21,3.2,ceilingMat);
 box(1.28,.04,21.4,x+1.95,H+.49,3.2,slotMat,false);
 box(.065,.18,21.2,x+1.325,H+.34,3.2,slotSideMat,false);
 box(.065,.18,21.2,x+2.575,H+.34,3.2,slotSideMat,false);
 const shaft=new T.Mesh(new T.PlaneGeometry(2.35,H),shaftMat.clone());
 shaft.position.set(x+1.58,H/2,.028);shaft.renderOrder=1;scene.add(shaft);
}
box(.4,H,18,-14,H/2,3,side);

let seed=92;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
// A real raster wood texture, fine relief and softly blurred planar reflections.
const wood=new T.TextureLoader().load('./oak-floor.jpg');wood.colorSpace=T.SRGBColorSpace;
wood.wrapS=wood.wrapT=T.RepeatWrapping;wood.repeat.set(28,4.4);wood.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
const floor=new T.Mesh(new T.PlaneGeometry(140,22),new T.MeshStandardMaterial({map:wood,bumpMap:wood,bumpScale:.012,color:'#d0c4ac',roughness:.36,metalness:0}));floor.rotation.x=-Math.PI/2;floor.position.set(46,0,3);floor.receiveShadow=true;scene.add(floor);
const mirror=new Reflector(new T.PlaneGeometry(140,22),{clipBias:.003,textureWidth:Math.min(innerWidth,1200),textureHeight:Math.min(innerHeight,800),color:0xcac5ba,multisample:2});
mirror.rotation.x=-Math.PI/2;mirror.position.set(46,.008,3);mirror.material.transparent=true;mirror.material.depthWrite=false;
mirror.material.fragmentShader=mirror.material.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec2 uv=vUv.xy/vUv.w;
 vec4 base=texture2D(tDiffuse,uv)*0.24;
 for(int i=-1;i<=1;i++){for(int j=-1;j<=1;j++){if(i!=0||j!=0)base+=texture2D(tDiffuse,uv+vec2(float(i)*0.0015,float(j)*0.003))*0.095;}}
`).replace('vec4( blendOverlay( base.rgb, color ), 1.0 )','vec4( blendOverlay( base.rgb, color ), 0.23 )');scene.add(mirror);

const clickable=[];const scrollCueImage=new Image();const scrollCueReady=new Promise((resolve,reject)=>{scrollCueImage.onload=resolve;scrollCueImage.onerror=reject;scrollCueImage.src='./scroll-down.svg';});const fontReady=Promise.all([document.fonts.load('700 60px GalleryCondensed'),document.fonts.load('400 60px GalleryCondensed'),document.fonts.load('400 24px GalleryBody'),document.fonts.load('500 30px GalleryHand')]);await Promise.all([fontReady,scrollCueReady]);
function surface(w,h,draw,x,y,z=.018){const c=document.createElement('canvas');c.width=Math.round(w*210);c.height=Math.round(h*210);const ctx=c.getContext('2d');ctx.scale(210,210);draw(ctx);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tex,transparent:true,roughness:.95,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));m.position.set(x,y,z);m.receiveShadow=true;scene.add(m);return m;}
function text(ctx,s,x,y,size=.3,color='#171615',bold=false){ctx.fillStyle=color;ctx.font=`${bold?'700':'400'} ${size}px GalleryCondensed, Arial, sans-serif`;ctx.fillText(s,x,y,ctx.canvas.width/210-x-.06);}
function wrap(ctx,s,x,y,width,size=.16){ctx.font=`400 ${size}px GalleryBody, Arial`;ctx.fillStyle='#242220';let line='';for(const word of s.split(' ')){if(ctx.measureText(line+word).width>width){ctx.fillText(line,x,y);y+=size*1.5;line='';}line+=word+' ';}ctx.fillText(line,x,y);return y;}
function button(ctx,label,x,y,w=1.1,outline=false){ctx.fillStyle='#101010';if(outline){ctx.lineWidth=.014;ctx.strokeStyle='#383838';ctx.strokeRect(x,y,w,.34);}else ctx.fillRect(x,y,w,.34);ctx.font='400 .135px GalleryBody, Arial';ctx.fillStyle=outline?'#222':'#fff';ctx.fillText(label,x+.1,y+.22);}
function makeAction(x,y,w,label,handler,z=.04){const m=new T.Mesh(new T.PlaneGeometry(w,.4),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));m.position.set(x,y,z);m.userData={label,handler};scene.add(m);clickable.push(m);}
// Lenis normalizes input; one velocity-continuous spring drives the camera for all navigation.
function moveTo(x){const top=(x/END)*(document.documentElement.scrollHeight-innerHeight);if(lenis){if(!document.querySelector('dialog[open]'))lenis.start();lenis.scrollTo(top,{immediate:true});}else scrollTo({top,behavior:'instant'});}
function details(title,copy){const d=document.querySelector('#details');d.querySelector('h2').textContent=title;d.querySelector('p').textContent=copy;d.showModal();}

// Solid, bevelled wall lettering: front faces, deeper coral sides and real cast shadows.
const titleFront=new T.MeshStandardMaterial({color:'#f06a5a',roughness:.38,metalness:0});
const titleSides=new T.MeshStandardMaterial({color:'#cf4938',roughness:.53,metalness:0});
const titleLayout=[{x:-4.35,y:3.63,width:7.2},{x:-5.05,y:2.45,width:8.45},{x:-4.35,y:1.27,width:5.1}];
titleOutlines.forEach((line,index)=>{
 const path=new T.ShapePath();
 for(const [command,...points] of line.commands){
  if(command==='closePath')path.currentPath.closePath();else path[command](...points);
 }
 const geometry=new T.ExtrudeGeometry(path.toShapes(false),{depth:.24,steps:1,bevelEnabled:true,bevelThickness:.013,bevelSize:.008,bevelSegments:2,curveSegments:6});
 geometry.computeBoundingBox();
 const bounds=geometry.boundingBox;
 const layout=titleLayout[index];
 geometry.translate(-bounds.min.x,-bounds.min.y,0);
 const mesh=new T.Mesh(geometry,[titleFront,titleSides]);
 mesh.scale.set(layout.width/(bounds.max.x-bounds.min.x),.99/(bounds.max.y-bounds.min.y),1);
 mesh.position.set(layout.x,layout.y,.045);
 mesh.castShadow=true;mesh.receiveShadow=true;mesh.name=line.text;scene.add(mesh);
});

// Intro copy and scroll cue are part of the first wall and move with the scene.
surface(11.6,5.1,c=>{
 c.save();c.translate(6.95,3.28);c.rotate(-.025);c.font='500 .25px GalleryHand';c.fillStyle='#242322';
 for(const [i,line] of ['Od strategii, przez design,','po wdrożenie i wsparcie. Sprawnie,','solidnie i z myślą o wynikach.'].entries())c.fillText(line,0,i*.27,2.8);
 c.restore();button(c,'Zobacz realizacje',6.95,4.07,1.65);
 c.drawImage(scrollCueImage,10.08,3.15,1.14,1.03);
 c.font='400 .15px GalleryBody';c.fillStyle='#242322';c.textAlign='center';c.fillText('Przewiń, aby odkryć',10.65,4.34,1.8);c.restore();
},0,2.7);
makeAction(1.975,1.01,1.65,'Zobacz realizacje',()=>moveTo(54));
makeAction(4.85,1.08,1.8,'Przewiń w bok',()=>moveTo(16.8));
surface(4.5,4.7,c=>{text(c,'Standard wykonania',.35,1.75,.44);wrap(c,'Wykorzystuję technologie, które gwarantują szybkość i bezpieczeństwo, dbając o każdy detal.',.35,2.3,3.8,.19);button(c,'Poznaj ofertę',.35,3.26,1.4);},13.25,2.7);
makeAction(12.05,1.02,1.4,'Poznaj ofertę',()=>moveTo(32.4));
const serviceTitles=["Responsywność", "Wydajność", "Bezpieczeństwo", "Solidne rozwiązania", "Od strategii do wdrożenia", "Stała współpraca"];const serviceCopies=["Układ dopasowany do telefonu i tabletu, bez kompromisów w czytelności.", "Szybkie ładowanie i lekki front, który nie blokuje treści.", "Pewne wdrożenie, certyfikaty SSL i aktualne standardy bezpieczeństwa.", "Stabilne integracje i czysty kod gotowy pod dalszy rozwój Twojego biznesu.", "Kompleksowo prowadzę od strategii, przez design, po wdrożenie i wsparcie. Sprawnie, solidnie i z myślą o wynikach.", "Stała komunikacja, jasne etapy i pełna opieka od briefu po wsparcie po wdrożeniu."];
serviceTitles.forEach((s,i)=>{const x=17.2+i*3.45;surface(3.35,4.7,c=>{text(c,'0'+(i+1),.1,1.1,.2);text(c,s,.1,1.7,.34);wrap(c,serviceCopies[i],.1,2.3,3.02,.17);},x,2.7);makeAction(x-.9,1.14,1.05,s,()=>details(s,serviceCopies[i]));});

function pedestal(x,z){box(1.25,.12,1.1,x,.06,z);box(1.06,1.2,.92,x,.7,z);box(1.3,.12,1.13,x,1.35,z);}
pedestal(10.7,-1.9);surface(1.5,1.7,c=>text(c,'pm',.02,1.25,1.0,'#f06a5a',true),10.7,2.55,-1.8);
function plant(x,z,height=2.1){const pot=new T.Mesh(new T.CylinderGeometry(.24,.19,.5,24),new T.MeshStandardMaterial({color:'#ddd8cb',roughness:.55}));pot.position.set(x,.45,z);pot.castShadow=true;scene.add(pot);const trunk=box(.04,height*.65,.04,x,height*.37+.5,z,new T.MeshStandardMaterial({color:'#756541'}));const leafMat=new T.MeshStandardMaterial({color:'#547e2b',side:T.DoubleSide,roughness:.75});for(let i=0;i<20;i++){const a=i*2.4,base=.9+rand()*height*.48;const reach=.33+rand()*.3;const pts=[];for(let j=0;j<=8;j++){let t=j/8;pts.push(new T.Vector3(x+Math.cos(a)*reach*t,base+Math.sin(t*Math.PI*.8)*.6,z+Math.sin(a)*reach*t));}const g=new T.BufferGeometry(),vs=[],uv=[];for(let j=0;j<pts.length;j++){const width=Math.sin(j/8*Math.PI)*.055;const p=pts[j];vs.push(p.x+Math.sin(a)*width,p.y,p.z-Math.cos(a)*width,p.x-Math.sin(a)*width,p.y,p.z+Math.cos(a)*width);uv.push(0,j/8,1,j/8);}const indices=[];for(let j=0;j<8;j++){let q=j*2;indices.push(q,q+1,q+2,q+1,q+3,q+2);}g.setAttribute('position',new T.Float32BufferAttribute(vs,3));g.setIndex(indices);g.computeVertexNormals();const leaf=new T.Mesh(g,leafMat);leaf.castShadow=true;scene.add(leaf);}for(const dx of [-.2,.2])for(const dz of [-.2,.2])box(.025,.45,.025,x+dx,.23,z+dz,new T.MeshStandardMaterial({color:'#8d5941'}));}
plant(10.05,-2.55,1.8);plant(12.2,-2.5,2.45);plant(48.15,-2,2);plant(50.8,-2.5,2.4);plant(92.4,-2.5,2.1);
// Black wall sconces with warm up/down illumination in the alcoves.
const sconcePositions=[];
const sconceLights=Array.from({length:4},()=>{const light=new T.SpotLight('#fff3da',7,3.4,.48,.8,1.3);scene.add(light,light.target);return light;});
for(const [a,b,d] of [[6.1,10.3,3.6],[35,42,3],[47.5,51.5,3],[76,83,3.5],[89,93,3.4]]){
 for(const x of [a+.55,b-.55]){
  box(.16,.36,.13,x,4.05,-d+.17,dark);
  for(const sign of [-1,1]){
   box(.115,.016,.09,x,4.05+sign*.185,-d+.19,slotMat,false);
   sconcePositions.push({x,d,sign});
  }
 }
}
const loader=new T.TextureLoader();
function picture(url,x,y,z,w,h){
 const tex=loader.load(url);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const trim=new T.MeshStandardMaterial({color:'#dedfda',roughness:.42,metalness:.28});
 box(w+.14,h+.14,.10,x,y,z-.04,trim);
 box(w+.04,h+.04,.04,x,y,z+.025,white);
 const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tex,roughness:.72,metalness:0}));
 mesh.position.set(x,y,z+.052);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
}
surface(5.5,2.8,c=>{text(c,'40+',1.5,1.45,1.5,'#f06a5a',true);wrap(c,'Pomogłem już ponad 40 firmom zbudować silną obecność w sieci, zwiększyć zasięgi i zrealizować cele.',.4,2,4.7,.21);},38.5,2.9,-2.79);
surface(4.8,4.7,c=>{text(c,'Wybrane realizacje',.35,1.5,.49);wrap(c,'Od stron wizytówek po zaawansowane portale i systemy ecommerce łączące estetykę z funkcjonalnością.',.35,2.1,4,.19);button(c,'Zobacz realizacje',.35,3.78,1.65);},44.75,2.7);
makeAction(43.57,1.1,1.65,'Zobacz realizacje',()=>moveTo(54));
const projects=[['Portal kobiet biznesu',55,'business',2022,'Portal internetowy'],['Dystrybutor rur',62.6,'ecotech',2021,'Strona firmowa'],['Obiekt hotelowy',70.2,'moment',2024,'Strona obiektu hotelowego']];
projects.forEach(([title,x,file,year,category])=>{
 picture('./'+file+'.jpg',x-1.3,2.72,.10,3.5,3.30);
 surface(2.8,4.1,c=>{text(c,title,.08,1.05,.43);text(c,category,.08,1.95,.22);text(c,String(year),.08,2.35,.22);button(c,'Zobacz projekt  ›',.08,3.15,1.65,true);},x+2.1,2.65);
 makeAction(x+1.605,1.38,1.65,'Zobacz projekt',()=>{location.href='https://przemekmiros.pl/realizacje/';});
});
surface(6.2,2,c=>{text(c,'SPRAWNIE. SOLIDNIE.',.3,.8,.65,'#f06a5a',true);text(c,'Z MYŚLĄ O WYNIKACH.',.3,1.5,.65,'#f06a5a',true);},79.5,3.4,-3.29);
const table=box(4.1,.12,1.7,79.5,1.15,-1.7,new T.MeshStandardMaterial({color:'#466745',roughness:.65}));for(const x of [78,81])for(const z of [-2.3,-1.1]){const leg=box(.12,1.2,.12,x,.58,z,new T.MeshStandardMaterial({color:'#603c29'}));leg.rotation.z=x<79?.25:-.25;}
surface(5.4,4.6,c=>{text(c,'O mnie',.4,1.2,.6);wrap(c,'Tworzę strony www skupione na wynikach biznesowych. Kompleksowo prowadzę od strategii, przez design, po wdrożenie i wsparcie.',.4,1.85,4.5,.2);button(c,'Porozmawiajmy',.4,3.15,1.65,true);},86,2.7);
makeAction(84.525,1.03,1.65,'Porozmawiajmy',()=>moveTo(98.5));
pedestal(91,-2);const globe=new T.Mesh(new T.SphereGeometry(.55,40,24),new T.MeshStandardMaterial({color:'#71a8bd',roughness:.38}));globe.position.set(91,2.05,-2);globe.castShadow=true;scene.add(globe);
// The closing wall pairs sculpted lettering with a real, editable HTML form.
contactOutlines.forEach((line,index)=>{
 const path=new T.ShapePath();for(const [cmd,...points] of line.commands){if(cmd==='closePath')path.currentPath.closePath();else path[cmd](...points);}
 const geometry=new T.ExtrudeGeometry(path.toShapes(false),{depth:.24,steps:1,bevelEnabled:true,bevelThickness:.013,bevelSize:.008,bevelSegments:2,curveSegments:6});
 geometry.computeBoundingBox();const bounds=geometry.boundingBox;const width=bounds.max.x-bounds.min.x;const height=bounds.max.y-bounds.min.y;
 geometry.translate(-bounds.min.x,-bounds.min.y,0);
 const mesh=new T.Mesh(geometry,[titleFront,titleSides]);mesh.scale.set(3.9/width,1.08/height,1);mesh.position.set(93.55,2.2,.045);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
});
const contactForm=document.querySelector('#wall-contact');
contactForm.addEventListener('submit',event=>{
 event.preventDefault();if(!contactForm.reportValidity())return;
 const fields=new FormData(contactForm);
 const body=`Imię: ${fields.get('name')}\nE-mail: ${fields.get('email')}\n\n${fields.get('message')}`;
 location.href='mailto:kontakt@przemekmiros.pl?subject='+encodeURIComponent('Zapytanie o stronę — '+fields.get('name'))+'&body='+encodeURIComponent(body);
 document.querySelector('#contact-status').textContent='Dokończ wysyłkę w programie pocztowym. Jeśli się nie otworzył, napisz na kontakt@przemekmiros.pl.';
});
const formCorners=[new T.Vector3(),new T.Vector3(),new T.Vector3()];
function positionContactForm(x){
 const mobile=innerWidth<760;
 const visible=mobile?x>96:x>93;
 contactForm.hidden=!visible;contactForm.inert=!visible;if(!visible)return;
 if(mobile){contactForm.style.transform='';return;}
 const coords=[[99.1,4.55,.06],[103.45,4.55,.06],[99.1,.48,.06]];
 const points=coords.map((v,i)=>{const p=formCorners[i].set(...v).project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};});
 const [a,b,c]=points;
 contactForm.style.transform=`matrix(${(b.x-a.x)/560},${(b.y-a.y)/560},${(c.x-a.x)/590},${(c.y-a.y)/590},${a.x},${a.y})`;
}

const motionPreference=matchMedia('(prefers-reduced-motion:reduce)');
let reduced=motionPreference.matches;
let lenis;
function configureScroll(){
 lenis?.destroy();
 lenis=new Lenis({lerp:.1,smoothWheel:true,syncTouch:false,wheelMultiplier:2,autoRaf:false,respectReducedMotion:false,prevent:node=>Boolean(node.closest?.('dialog, #wall-contact'))});
 if(document.querySelector('dialog[open]'))lenis?.stop();
}
configureScroll();
motionPreference.addEventListener('change',()=>{reduced=motionPreference.matches;configureScroll();});
const dialogObserver=new MutationObserver(()=>{if(document.querySelector('dialog[open]'))lenis?.stop();else lenis?.start();});
document.querySelectorAll('dialog').forEach(dialog=>dialogObserver.observe(dialog,{attributes:true,attributeFilter:['open']}));
const scrollMotion={value:Math.max(0,Math.min(1,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight))),velocity:0};
let progress=scrollMotion.value,pointerX=0,pointerY=0,softPointerX=0,softPointerY=0,last=performance.now();
function resize(){camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<760?57:43;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
resize();addEventListener('resize',resize);
const raycaster=new T.Raycaster(),mouse=new T.Vector2();function hit(e){mouse.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);raycaster.setFromCamera(mouse,camera);return raycaster.intersectObjects(clickable)[0];}
canvas.addEventListener('pointermove',e=>{pointerX=e.clientX/innerWidth-.5;pointerY=e.clientY/innerHeight-.5;canvas.style.cursor=hit(e)?'pointer':'auto';});
canvas.addEventListener('click',e=>{const h=hit(e);if(h)h.object.userData.handler();});
addEventListener('keydown',e=>{
 if(document.querySelector('dialog[open]')||e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
 const step={ArrowRight:700,ArrowLeft:-700,ArrowDown:140,ArrowUp:-140,PageDown:innerHeight*.85,PageUp:-innerHeight*.85};
 let target;
 const current=lenis?lenis.targetScroll:scrollY;
 if(e.key in step)target=current+step[e.key];
 else if(e.key==='Home')target=0;
 else if(e.key==='End')target=document.documentElement.scrollHeight-innerHeight;
 else if(e.code==='Space'&&!e.target.closest?.('button,a'))target=current+(e.shiftKey?-1:1)*innerHeight*.85;
 else return;
 e.preventDefault();if(lenis)lenis.scrollTo(target,{immediate:true});else scrollTo({top:target,behavior:'instant'});
});
document.querySelector('.sq').onclick=()=>document.querySelector('#navigation').showModal();document.querySelectorAll('dialog .close').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelectorAll('[data-position]').forEach(b=>b.onclick=()=>{b.closest('dialog').close();moveTo(Number(b.dataset.position));});document.querySelector('.hire').onclick=()=>moveTo(98.5);document.querySelector('.logo').onclick=e=>{e.preventDefault();moveTo(0)};
function animate(now){const dt=Math.min((now-last)/1000,.05);last=now;lenis?.raf(now);const scrollTarget=Math.max(0,Math.min(1,(lenis?lenis.targetScroll:scrollY)/Math.max(1,document.documentElement.scrollHeight-innerHeight)));progress=Math.max(0,Math.min(1,smoothStep(scrollMotion,scrollTarget,dt,false)));softPointerX=T.MathUtils.lerp(softPointerX,pointerX,1-Math.exp(-dt*5));softPointerY=T.MathUtils.lerp(softPointerY,pointerY,1-Math.exp(-dt*5));const x=progress*END;const nearby=sconcePositions.slice().sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x));sconceLights.forEach((light,i)=>{const p=nearby[i];light.position.set(p.x,4.05+p.sign*.2,-p.d+.22);light.target.position.set(p.x,4.05+p.sign*1.3,-p.d+.02);light.target.updateMatrixWorld();light.intensity=7*(1-T.MathUtils.smoothstep(Math.abs(p.x-x),6,11));});const sway=reduced?0:softPointerX*.045;camera.position.set(x+sway,2.77-(reduced?0:softPointerY*.02),8.8);camera.lookAt(x+.1,2.65,0);camera.updateMatrixWorld();positionContactForm(x);sun.position.set(x+4.8,11,7);sun.target.position.set(x,0,-2);sun.target.updateMatrixWorld();renderer.render(scene,camera);requestAnimationFrame(animate);}
document.querySelector('#loading').hidden=true;requestAnimationFrame(animate);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();document.querySelector('#loading').hidden=false;document.querySelector('#loading').textContent='Przerwano renderowanie 3D. Odśwież stronę, aby kontynuować.';});
