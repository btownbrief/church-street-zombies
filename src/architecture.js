import * as pc from 'playcanvas';
import {catalog} from './facade-catalog.js';
import roofSurvey from './data/roof-elevations.json';

export function buildArchitecture(app,geo,frontages){
 const root=new pc.Entity('GIS footprint architecture');app.root.addChild(root);
 const referenceTextureLoads=[];
 let seed=1945;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const colors={};const rgb=h=>new pc.Color(...h.match(/../g).map(v=>parseInt(v,16)/255));
 const texture=(draw,w=512,h=512)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new pc.Texture(app.graphicsDevice,{mipmaps:true,anisotropy:8});t.setSource(c);t.addressU=t.addressV=pc.ADDRESS_REPEAT;return t;};
 function mat(hex,style='plain'){const key=hex+style;if(colors[key])return colors[key];const m=new pc.StandardMaterial();m.name=key;m.diffuse=rgb(hex);m.gloss=.18;m.specular=new pc.Color(.16,.16,.16);
  if(style==='brick'||style==='plaster'){m.diffuse=new pc.Color(1,1,1);const b=hex.match(/../g).map(v=>parseInt(v,16));m.diffuseMap=texture((c,w,h)=>{c.fillStyle=style==='brick'?'#aaa08c':'#'+hex;c.fillRect(0,0,w,h);if(style==='brick')for(let y=0;y<32;y++)for(let x=-1;x<8;x++){let v=(rnd()-.5)*28;c.fillStyle=`rgb(${b[0]+v},${b[1]+v*.8},${b[2]+v*.7})`;c.fillRect(x*64+(y%2)*32+1,y*16+1,62,14);c.fillStyle='#00000012';c.fillRect(x*64+(y%2)*32+1,y*16+13,62,2);}for(let i=0;i<25000;i++){c.fillStyle=rnd()>.5?'#ffffff0c':'#0000000c';c.fillRect(rnd()*w,rnd()*h,1+rnd()*2,1);}});}
  m.update();return colors[key]=m;
 }
 const iron=mat('292e2c'),stone=mat('c2b9a8','plaster'),roof=mat('5f645e','plaster'),tar=mat('858984','plaster'),dark=mat('1c2626'),wood=mat('5b4531');
 const glass=[];for(let k=0;k<8;k++){const m=mat(['435354','586766','596867','687773','465d64','5d6760','4e5b58','60706e'][k],'glass');m.diffuseMap=texture((c,w,h)=>{let g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#647f8d');g.addColorStop(.36,'#a6b4af');g.addColorStop(.38,'#737c76');g.addColorStop(1,'#293936');c.fillStyle=g;c.fillRect(0,0,w,h);c.fillStyle='#b4bdad55';for(let i=0;i<5;i++)c.fillRect(rnd()*w,0,6+rnd()*14,h);if(k%3===0){c.fillStyle='#c1bca47a';c.fillRect(0,0,70,h);c.fillRect(w-55,0,55,h);}c.fillStyle='#161b1e55';c.fillRect(0,h*.78,w,h*.22);});m.gloss=.7;m.specular=new pc.Color(.35,.35,.35);m.update();glass.push(m);}
 const shopGlass=mat('b6b7a0','shop');shopGlass.diffuseMap=texture((c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#26302c');g.addColorStop(.3,'#343b34');g.addColorStop(1,'#4c5147');c.fillStyle=g;c.fillRect(0,0,w,h);for(let i=0;i<12;i++){c.fillStyle=['#80664c','#727466','#a38962','#454d45'][i%4];c.fillRect(i*44,240-rnd()*90,28,160+rnd()*40);}c.fillStyle='#e3d8b0';for(let x=50;x<w;x+=125){c.beginPath();c.ellipse(x,30,12,4,0,0,7);c.fill();}c.fillStyle='#9fbbc52a';c.beginPath();c.moveTo(0,50);c.lineTo(w,180);c.lineTo(w,280);c.lineTo(0,145);c.fill();c.fillStyle='#a5b6b822';c.fillRect(0,0,w,h);});shopGlass.gloss=.68;shopGlass.update();
 function box(name,x,y,z,w,h,d,m,parent=root){const e=new pc.Entity(name);e.addComponent('render',{type:'box',material:m,castShadows:true});e.setLocalPosition(x,y,z);e.setLocalScale(w,h,d);parent.addChild(e);return e;}
 function mesh(name,p,idx,uv,m,parent=root){const mm=pc.createMesh(app.graphicsDevice,p,{indices:idx,normals:pc.calculateNormals(p,idx),uvs:uv});const e=new pc.Entity(name);e.addComponent('render',{meshInstances:[new pc.MeshInstance(mm,m)]});parent.addChild(e);return e;}
 function quad(name,w,h,m,x,y,z,parent=root){return mesh(name,[-w/2,-h/2,0,w/2,-h/2,0,w/2,h/2,0,-w/2,h/2,0],[0,1,2,0,2,3],[0,1,1,1,1,0,0,0],m,parent).setLocalPosition(x,y,z);}
 function sheet(name,pts,m,parent=root,uvscale=1){const p=pts.flat(),w=Math.hypot(pts[1][0]-pts[0][0],pts[1][2]-pts[0][2]),h=Math.hypot(...pts[2].map((v,i)=>v-pts[1][i]));return mesh(name,p,[0,1,2,0,2,3],[0,0,w/1.6*uvscale,0,w/1.6*uvscale,h/1.92*uvscale,0,h/1.92*uvscale],m,parent);}
 function beam(name,a,b,r,m,parent){const d=new pc.Vec3(...b).sub(new pc.Vec3(...a)),mid=new pc.Vec3(...a).add(new pc.Vec3(...b)).mulScalar(.5);const e=box(name,...mid.toArray(),r,r,d.length(),m,parent);e.setLocalRotation(new pc.Quat().setFromDirections(pc.Vec3.BACK,d.clone().normalize()));return e;}
 function arch(parent,x,y,w,h,trim,windowMat=glass[0],archMaterial=trim){const r=w/2,stem=h-r;let p=[x-w/2,y-h/2,0,x+w/2,y-h/2,0];for(let i=0;i<=16;i++){const a=i*Math.PI/16;p.push(x+Math.cos(a)*r,y-h/2+stem+Math.sin(a)*r,.01);}const idx=[];for(let i=1;i<p.length/3-1;i++)idx.push(0,i,i+1);const uv=[];for(let i=0;i<p.length;i+=3)uv.push((p[i]-x)/w+.5,1-((p[i+1]-y)/h+.5));mesh('Arched recessed glazing',p,idx,uv,windowMat,parent).setLocalPosition(0,0,.09);box('Arch jamb',x-r-.07,y-r/2,.08,.14,stem,.18,archMaterial,parent);box('Arch jamb',x+r+.07,y-r/2,.08,.14,stem,.18,archMaterial,parent);for(let i=0;i<15;i++){let a=(i+.5)/15*Math.PI;const e=box('Curved voussoir',x+Math.cos(a)*(r+.09),y-h/2+stem+Math.sin(a)*(r+.09),.13,.19,.25,.25,archMaterial,parent);e.setLocalEulerAngles(0,0,a*180/Math.PI-90);}box('Arch sill',x,y-h/2-.08,.13,w+.35,.16,.32,trim,parent);box('Window center mullion',x,y,.16,.055,h-.1,.06,trim,parent);box('Window transom',x,y+.12,.16,w,.065,.06,trim,parent);}
 // Flora & Fauna / Helly Hansen: wide, shallow segmental heads, not semicircles.
 // Profile follows walk300/360/378; dimensions and pane count are visual estimates.
 function arcadeWindow(parent,x,bottom,w,stem,rise,index=0){
  const spring=bottom+stem,v=[x-w/2,bottom,.10,x+w/2,bottom,.10],idx=[],uv=[];
  for(let i=0;i<=24;i++){const t=i/24,xx=x+w/2-t*w;v.push(xx,spring+rise*(1-(2*t-1)**2),.10);}
  for(let i=1;i<v.length/3-1;i++)idx.push(0,i,i+1);
  for(let i=0;i<v.length;i+=3)uv.push((v[i]-x)/w+.5,1-(v[i+1]-bottom)/(stem+rise));
  mesh('Broad shallow-arched arcade glazing',v,idx,uv,glass[index%8],parent);
  for(let i=0;i<24;i++){const u=i/24,t=(i+1)/24;beam('Dark segmental window head',[x-w/2+u*w,spring+rise*(1-(2*u-1)**2),.16],[x-w/2+t*w,spring+rise*(1-(2*t-1)**2),.16],.07,iron,parent);}
  for(let i=0;i<=4;i++){const t=i/4,h=stem+rise*(1-(2*t-1)**2);box('Arcade slender glazing mullion',x-w/2+t*w,bottom+h/2,.16,.065,h,.095,iron,parent);}
  box('Arcade window lower frame',x,bottom,.15,w+.12,.07,.10,iron,parent);
 }
 function window(parent,x,y,w,h,trim,i=0,ornate=false){box('Window shadow recess',x,y,.02,w+.19,h+.19,.12,dark,parent);quad('Reflective window panes',w,h,glass[i%8],x,y,.095,parent);for(const xx of [-w/2,w/2])box('Window casing',x+xx,y,.14,.13,h+.2,.16,trim,parent);for(const yy of [-h/2,h/2])box('Window lintel and sill',x,y+yy,.14,w+.26,.14,.25,trim,parent);box('Window sash rail',x,y,.17,w,.07,.065,trim,parent);box('Window narrow center mullion',x,y,.17,.045,h,.05,trim,parent);if(ornate){const e=box('Crowned window hood',x,y+h/2+.18,.22,w+.45,.17,.3,trim,parent);box('Hood keystone',x,y+h/2+.31,.23,.28,.25,.31,trim,parent);}}
 const textCache={};function lettering(text,bg='253931',ink='eee7d8'){const key=text+bg;if(textCache[key])return textCache[key];const m=mat('ffffff','label'+key);m.diffuseMap=texture((c,w,h)=>{c.fillStyle='#'+bg;c.fillRect(0,0,w,h);c.strokeStyle='#'+ink+'55';c.strokeRect(8,8,w-16,h-16);c.fillStyle='#'+ink;c.textAlign='center';c.textBaseline='middle';c.font=`600 ${Math.min(70,860/Math.max(1,text.length))}px Georgia`;c.fillText(text,w/2,h/2,w-30);},1024,128);m.update();return textCache[key]=m;}
 function cornice(p,width,height,trim,ornate=true){if(!ornate){box('Plain parapet coping',0,height+.08,.05,width+.06,.17,.26,trim,p);return;}for(const [yy,hh,dd]of [[0,.2,.24],[.22,.14,.42],[.38,.14,.54]])box('Projecting cornice',0,height+yy,.14,width+.18,hh,dd,trim,p);for(let x=-width/2+.3;x<width/2;x+=.6)box('Cornice dentil',x,height-.18,.18,.13,.23,.21,trim,p);}
 function canopy(p,width,y,style,color){const span=width-.35,projection=1.55;const covering=style==='fabric'?mat(color||'3a624d'):mat('9caeb0','canopy');if(style!=='fabric'){covering.opacity=.67;covering.blendType=pc.BLEND_NORMAL;covering.depthWrite=false;covering.gloss=.8;covering.update();}const panel=box('Sloped '+style+' canopy',0,y,projection/2,span,.06,projection,covering,p);panel.setLocalEulerAngles(12,0,0);for(let x=-span/2;x<=span/2+.05;x+=Math.min(2.1,span/3)){beam('Canopy rafter',[x,y+.17,.04],[x,y-.15,projection],.045,iron,p);if(style==='fabric'){for(let xx=x;xx<Math.min(x+2.1,span/2);xx+=.18){const stripe=box('Narrow woven awning stripe',xx,y+.035,projection/2,.028,.015,projection,mat('d0cbb4'),p);stripe.setLocalEulerAngles(12,0,0);}}}
  box('Canopy edge beam',0,y-.16,projection,span,.11,.08,iron,p);if(style==='fabric'){box('Fabric valance',0,y-.35,projection,span,.36,.06,covering,p);}else for(let x=-span/2+.1;x<span/2;x+=Math.max(3,span/3))box('Canopy post',x,(y-.2)/2,projection,.075,y-.2,.075,iron,p);
 }
 function polygonRoof(ring,h,m,parent){let points=ring.slice(0,-1);if(points.length<3)return;let area=points.reduce((a,p,i)=>{const q=points[(i+1)%points.length];return a+p[0]*q[1]-q[0]*p[1];},0);if(area<0)points.reverse();const active=points.map((_,i)=>i),tri=[];const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);let guard=0;while(active.length>3&&guard++<500){let cut=false;for(let j=0;j<active.length;j++){let a=active[(j+active.length-1)%active.length],b=active[j],c=active[(j+1)%active.length];if(cross(points[a],points[b],points[c])<=.00001)continue;const inside=active.some(k=>k!==a&&k!==b&&k!==c&&cross(points[a],points[b],points[k])>=0&&cross(points[b],points[c],points[k])>=0&&cross(points[c],points[a],points[k])>=0);if(inside)continue;tri.push(a,c,b);active.splice(j,1);cut=true;break;}if(!cut)break;}if(active.length===3)tri.push(active[0],active[2],active[1]);mesh('Actual footprint roof',points.flatMap(p=>[p[0],h,p[1]]),tri,points.flatMap(p=>[p[0]/8,p[1]/8]),m,parent);}
 function hip(parent,x,z,w,d,h,rise){mesh('Slated hip roof',[x-w/2,h,z-d/2,x+w/2,h,z-d/2,x+w/2,h,z+d/2,x-w/2,h,z+d/2,x,h+rise,z],[0,4,1,1,4,2,2,4,3,3,4,0],[0,0,1,0,1,1,0,1,.5,.5],roof,parent);}
 const skip=new Set([4645,5379,5398,5302,5099]);const registered=new Set();const modeled=[];
 for(const f of frontages){if(skip.has(f.footprintId)||!catalog[f.footprintId])continue;registered.add(f.footprintId);const c=catalog[f.footprintId],height=c.height,center=(f.frontZStart+f.frontZEnd)/2,base=geo.groundAt(center),p=new pc.Entity(c.name||`Church Street ${f.addressRanges.join(', ')||f.footprintId}`);p.tags.add('architecture','footprint-'+f.footprintId);p.setPosition(0,base,0);root.addChild(p);const wall=mat(c.color,c.paint?'plaster':'brick'),trim=mat(c.trim,'plaster');let rings=f.rings;
  // The old mall footprint covers now-redeveloped rear land. Only its observed frontage is modeled.
  if(f.footprintId===5027)rings=[[[f.frontX-15,f.frontZStart],[f.frontX,f.frontZStart],[f.frontX,f.frontZEnd],[f.frontX-15,f.frontZEnd],[f.frontX-15,f.frontZStart]]];
  const measuredRoof=roofSurvey.byFootprint[f.footprintId];
  const roofHeight=measuredRoof?measuredRoof.elevationM-(base+69.682):height;
  for(const ring of rings){for(let i=0;i<ring.length-1;i++){const a=ring[i],b=ring[i+1];
   const isFront=Math.abs(a[0]-f.frontX)<.3&&Math.abs(b[0]-f.frontX)<.3;
   const wallTop=measuredRoof&&!isFront?roofHeight:height;
   sheet('Municipal footprint wall',[[a[0],-.85,a[1]],[b[0],-.85,b[1]],[b[0],wallTop,b[1]],[a[0],wallTop,a[1]]],wall,p); // double sided wall for either GIS winding
   const render=p.children[p.children.length-1]?.render;if(render)render.meshInstances[0].material.cull=pc.CULLFACE_NONE;
  }polygonRoof(ring,roofHeight,tar,p);}
  const fac=new pc.Entity('Video referenced Church Street elevation');p.addChild(fac);fac.setLocalPosition(f.frontX,0,center);fac.setLocalEulerAngles(0,f.side==='west'?90:-90,0);const width=f.frontWidth,step=width/c.bays;
  box('Stone foundation course',0,.3,-.03,width,.6,.18,stone,fac);cornice(fac,width,height,trim,!['plain','modern','folded','wide-arches','akes'].includes(c.special));
  if(c.special==='plain'){box('Continuous plain upper wall border',0,height-.16,.16,width,.45,.32,trim,fac);if(f.footprintId===4884)box('Muted mauve upper wall edge',-width/2+.16,6.6,.14,.32,5.2,.28,trim,fac);}
  if(c.special==='modern'||c.special==='folded')for(let x=-width/2;x<=width/2;x+=step)box('Facade structural pier',x,height/2,.12,.2,height,.22,trim,fac);
  for(let floor=1;floor<c.floors;floor++){const groundTop=c.special==='stone-bank'?6.95:4.4,storey=(height-groundTop)/(c.floors-1),y=groundTop+.1+(floor-.5)*storey,h=Math.min(storey*.67,3),w=step*.49;
   if(c.special==='plain'){if(floor===1&&f.footprintId===4884)window(fac,width*.22,y,1.7,1.4,trim,2);continue;}
   if(f.footprintId===4918){window(fac,0,y,width-.9,storey*.85,trim,4);for(let xx=-width/2+1.2;xx<width/2-.5;xx+=1.25)box('Urban Outfitters joined glazing mullion',xx,y,.23,.07,storey*.84,.1,trim,fac);continue;}
   // Walk 01:00: two tripartite window groups, each with a horizontal transom.
   if(f.footprintId===5365){const span=(width-.85)/2,hh=storey*.7;for(let j=0;j<2;j++){const u=(j-.5)*(span+.25);box('Maven recessed window group',u,y,.07,span+.16,hh+.16,.18,iron,fac);quad('Maven upstairs glazing',span,hh,glass[j+2],u,y,.18,fac);for(const dx of [-span/2,-span/6,span/6,span/2])box('Maven tripartite metal mullion',u+dx,y,.23,.075,hh+.12,.11,trim,fac);for(const dy of [-hh/2,0,hh/2])box('Maven horizontal transom',u,y+dy,.23,span+.12,.075,.11,trim,fac);}for(let yy=4.55;yy<height;yy+=.62)box('Observed facade panel joint',0,yy,.16,width,.018,.025,mat('8e9690'),fac);continue;}
   if(c.special==='folded'){for(let j=0;j<c.bays;j++){const e=box('Folded white enamel panel',-width/2+(j+.5)*step,y,.08,step*.99,storey,.22,trim,fac);e.setLocalEulerAngles(0,j%2?8:-8,0);}continue;}
   if(f.footprintId===5106){for(let j=0;j<c.bays;j++)arcadeWindow(fac,-width/2+(j+.5)*step,4.95,step*.84,1.75,.56,j);continue;}
   if(c.special==='opera'||f.footprintId===5173)continue;
   for(let j=0;j<c.bays;j++){const x=-width/2+(j+.5)*step;let ww=w,hh=h;if(c.special==='modern'||c.special==='akes'){ww=step*.83;hh=storey*.7;}if(c.special==='masonic'){if(floor>1)arch(fac,x,y,1.35,floor===c.floors-1?1.55:2.55,trim,glass[(floor+j)%8],wall);}else if(['wide-arches','ward','bank-arches'].includes(c.special)){arch(fac,x,y,Math.min(step*.72,3.2),hh+.25,trim,glass[(floor+j)%8]);}else if(c.special!=='richardson'||Math.abs(x)<width/2-3.2)window(fac,x,y,ww,hh,trim,floor+j,['ornate','richardson'].includes(c.special));}
   if(c.special==='masonic'||c.special==='richardson'||c.special==='modern'||c.special==='opera')box('Horizontal stone belt',0,4.4+floor*storey,.11,width,.17,.23,trim,fac);
  }
  if(c.special==='opera'){const stride=width/5;for(let j=0;j<5;j++){const x=-width/2+(j+.5)*stride;arch(fac,x,12.0,stride*.79,10.0,trim,glass[j%8]);for(let u of [-stride*.135,stride*.135])box('Opera house triple window division',x+u,11.5,.24,.24,8.6,.27,wall,fac);box('Opera house spandrel',x,11.25,.2,stride*.82,1.1,.28,wall,fac);for(let u of [-stride*.44,stride*.44])box('Opera house masonry pilaster',x+u,11.5,.14,.46,13.6,.33,wall,fac);}box('Opera house green frieze',0,height-.36,.12,width,.45,.38,trim,fac);}
  if(f.footprintId===5173){const sw=width/3;for(let j=0;j<3;j++){const u=-width/2+(j+.5)*sw,body=mat(['ded3b8','a94d60','c9c8b4'][j],'plaster'),edge=mat(['bba77d','d8c293','435d50'][j]);box('Distinct 80–86 Church frontage',u,8.8,.075,sw-.08,8.8,.14,body,fac);for(let y of [6.3,10.8])for(let k=0;k<3;k++)window(fac,u+(k-1)*sw*.29,y,sw*.19,2.55,edge,k,true);box('Individual historic frontage cornice',u,13.15,.24,sw-.05,.28,.46,edge,fac);if(j===2){const bay=new pc.Entity('Weller projecting curved upper bay');fac.addChild(bay);bay.setLocalPosition(u,0,.7);for(let k=0;k<3;k++){const pane=new pc.Entity('Weller curved bay window');bay.addChild(pane);pane.setLocalPosition((k-1)*1.35,0,k===1?.3:0);pane.setLocalEulerAngles(0,(k-1)*23,0);for(let y of [6.3,10.8])window(pane,0,y,1.1,2.65,edge,k);}box('Weller projecting bay belt',u,8.55,.8,4.4,.32,1.1,edge,fac);}}}
  // Individual recessed retail bays, mullions, plinths and signage.
  const shops=Math.max(1,Math.round(width/5.5)),ss=width/shops;for(let j=0;j<shops&&c.special!=='stone-bank';j++){const x=-width/2+(j+.5)*ss;box('Shopfront outer frame',x,1.95,.07,ss-.1,3.5,.15,c.special==='leunig'?trim:iron,fac);quad('Shop interior and reflected glazing',ss-.38,2.75,shopGlass,x,2.02,.17,fac);for(let dx of [-ss*.31,ss*.31])box('Display window mullion',x+dx,2.05,.24,.065,2.82,.09,trim,fac);box('Shopfront lower panel',x,.51,.2,ss-.28,.55,.12,c.special==='richardson'?mat('88908b'):wood,fac);box('Entrance door frame',x,1.7,.22,ss*.24,2.75,.1,iron,fac);quad('Entrance glazing',ss*.24-.14,2.55,glass[j%8],x,1.72,.28,fac);box('Door handle',x+ss*.075,1.3,.37,.028,.35,.03,stone,fac);}
  if(c.shopColor){const sc=mat(c.shopColor);for(let u of [-width/2+.2,width/2-.2])box('Observed colored shop surround',u,2.1,.32,.4,4.2,.16,sc,fac);box('Observed colored shop fascia',0,4.05,.33,width,.45,.16,sc,fac);}
  if(c.signs&&c.special!=='stone-bank'&&c.special!=='colonial-bank'&&f.footprintId!==5106)for(let j=0;j<c.signs.length;j++){const text=c.signs[j],u=f.footprintId===5177?-width*.33:-width/2+(j+.5)*width/c.signs.length;quad('Observed storefront: '+text,Math.min(width/c.signs.length-.4,f.footprintId===5177?6:11),.62,lettering(text,text.includes('CVS')?'426550':text.includes('JERRY')?'265575':'253531'),u,3.87,.37,fac);}
  if(f.footprintId===5173){quad('Mooney storefront lettering',width/3-.2,.62,lettering('insomnia cookies','574560'),0,3.9,.4,fac);quad('Weller storefront lettering',width/3-.2,.62,lettering('SARATOGA OLIVE OIL','344d44'),width/3,3.9,.4,fac);}
  if(f.footprintId===5106){
   box('Arcade continuous pale storefront fascia',0,4.35,.30,width,.70,.32,mat('deddd9'),fac);
   quad('Video-era Helly Hansen black fascia',width*.39,.66,lettering('HELLY HANSEN','252725'),-width*.285,3.89,.49,fac);
   quad('Flora and Fauna storefront lettering',width*.34,.50,lettering('FLORA & FAUNA','deddd9','353b35'),width*.16,4.34,.49,fac);
   // Thin light coping sits on the existing lower flat roof and taller street parapet.
   box('Arcade thin roofline cap',0,height+.11,.05,width+.12,.13,.38,mat('c6c6bf'),fac);
  }
  if(c.lowBlueAwning){
   // Aerial 0:00: four separate solid blue awnings across the two low parcels.
   // Two per frontage is inferred; the newer walk does not resolve canopy continuity.
   const cloth=mat('294b6b'),span=width/2-.35;
   for(let j=0;j<2;j++){const u=(j-.5)*width/2;
    const panel=box('Observed blue fabric awning',u,3.95,1.0,span,.045,1.85,cloth,fac);panel.setLocalEulerAngles(28,0,0);
    box('Blue awning front valance',u,3.47,1.82,span,.22,.05,cloth,fac);
    for(const dx of [-span/2,span/2])beam('Low shop awning support',[u+dx,4.37,.18],[u+dx,3.51,1.82],.035,iron,fac);
   }
  }
  if(c.canopy&&f.footprintId!==5365)canopy(fac,width,4.15,'glass');if(c.awning&&c.special!=='colonial-bank')canopy(fac,width,4.2,'fabric',c.awning);
  if(c.special==='masonic'){const b=f.bounds;hip(p,(b.minX+b.maxX)/2,(b.minZ+b.maxZ)/2,b.maxX-b.minX+.7,b.maxZ-b.minZ+.7,height,10.5);for(let u of [-7.5,0,7.5]){box('Roof-slope dormer base',u,height+1.7,-2.8,1.5,2.4,1.7,wall,fac);const dormer=new pc.Entity('Recessed roof-slope dormer');fac.addChild(dormer);dormer.setLocalPosition(u,0,-1.9);window(dormer,0,height+1.8,.8,1.4,trim,1);}
   for(let j=0;j<5;j++)arch(fac,-width/2+(j+.5)*width/5,6.8,width/5*.69,4.4,trim,glass[j%8],wall);
   // This exposed end wall dominates the northward walk even though it is not on a crossing.
   const end=new pc.Entity('Masonic south elevation above low neighboring shops');p.addChild(end);const depth=b.maxX-b.minX;end.setLocalPosition((b.minX+b.maxX)/2,0,f.frontZEnd+.05);for(let floor=1;floor<=4;floor++){const yy=5.2+floor*3.55;for(let k=0;k<5;k++)arch(end,-depth/2+(k+.5)*depth/5,yy,1.45,floor===4?1.3:2.5,trim,glass[k%8],wall);box('Masonic south stone belt',0,yy-1.5,.1,depth,.17,.25,trim,end);}cornice(end,depth,height,trim);
  }
  if(c.special==='gable'){mesh('Warner House gable',[-width/2,height,0,width/2,height,0,0,height+3.1,0],[0,1,2],[0,0,1,0,.5,1],trim,fac);hip(p,(f.bounds.minX+f.bounds.maxX)/2,center,f.bounds.maxX-f.bounds.minX,width,height,3.1);}
  if(c.special==='ward'){box('Raised central parapet',0,height+.55,-.05,width*.3,1.2,.7,trim,fac);for(let u of [-width*.42,width*.42]){const e=new pc.Entity('Parapet finial');e.addComponent('render',{type:'sphere',material:trim});e.setLocalPosition(u,height+.52,.03);e.setLocalScale(.42,.42,.42);fac.addChild(e);}for(let u of [-width*.44,-width*.15,width*.15,width*.44])box('Art Deco vertical ornament',u,height-1,.12,.15,1.9,.16,trim,fac);}
  if(c.special==='stone-bank'){
   // Walk 02:40: TWO arched display windows flank a rectangular double-door entrance.
   box('Bank ground stone facing',0,3.35,.33,width,6.7,.12,trim,fac);
   for(let yy=.8;yy<height;yy+=.7)box('Cut-stone facade course',0,yy,.405,width,.022,.02,mat('a8a797'),fac);
   const archLayer=new pc.Entity('Bank paired arched display windows');fac.addChild(archLayer);archLayer.setLocalPosition(0,0,.43);
   for(const u of [-width/3,width/3]){arch(archLayer,u,3.5,3.0,5.2,iron,glass[3],trim);box('Bank display-window lower transom',u,2.4,.64,3,.11,.12,iron,fac);box('Bank display-window stone sill',u,.84,.64,3.35,.18,.33,trim,fac);}
   const dw=3.35;box('Bank rectangular entrance recess',0,3.08,.48,dw+.2,6.16,.12,iron,fac);quad('Bank entrance upper glazing',dw,2.3,glass[3],0,4.76,.565,fac);
   for(const u of [-dw/4,dw/4]){quad('Bank double entrance door glazing',dw/2-.1,2.75,glass[1],u,1.48,.58,fac);box('Bank door pull',u+(u<0?.47:-.47),1.38,.69,.035,.58,.04,stone,fac);}
   for(const u of [-dw/2,0,dw/2])box('Bank double-door frame',u,1.49,.65,.07,2.9,.13,iron,fac);
   const bankSign=lettering('Northfield','33434b');
   referenceTextureLoads.push(new Promise((resolve,reject)=>app.assets.loadFromUrl('/reference-textures/northfield-sign.png','texture',(error,asset)=>{if(error){reject(error);return;}bankSign.diffuseMap=asset.resource;bankSign.diffuse.set(1,1,1);bankSign.update();resolve();})));
   quad('Northfield source-video sign panel',dw,dw/(1024/336),bankSign,0,3.29,.68,fac);
   box('Bank floor cornice',0,6.82,.42,width,.28,.45,trim,fac);
  }
  if(f.footprintId===5365){
   // Separate short fabric shop awnings, not an uninterrupted glass arcade.
   for(let j=0;j<2;j++){const awning=new pc.Entity('Maven separate shop awning');fac.addChild(awning);awning.setLocalPosition((j-.5)*width/2,0,0);canopy(awning,width/2-.13,3.9,'fabric',j===1?'292f31':'a5aaa7');}
  }
  if(c.special==='akes'){const brickBase=mat('ae624c','brick'),white=mat('e5e2d1');box('Ake’s red brick ground level',0,2,.29,width,4,.13,brickBase,fac);const archLayer=new pc.Entity('Ake’s fanlight entrances');fac.addChild(archLayer);archLayer.setLocalPosition(0,0,.4);for(let u of [-width/3,0,width/3])arch(archLayer,u,1.95,1.55,3.65,white,shopGlass);}
  if(c.special==='colonial-bank'){const b=f.bounds;hip(p,(b.minX+b.maxX)/2,center,b.maxX-b.minX+.3,width+.3,height,3.8);for(let u of [-width/2+.5,width/2-.5])box('Bank white corner pilaster',u,6.0,.22,.55,11.6,.3,trim,fac);box('Bank classical entablature',0,height-.15,.25,width,.4,.6,trim,fac);const ped=new pc.Entity('College Street classical bank pediment');p.addChild(ped);ped.setLocalPosition((b.minX+b.maxX)/2,0,f.frontZStart-.12);ped.setLocalEulerAngles(0,180,0);const pw=b.maxX-b.minX;mesh('Triangular bank pediment',[-pw/2,height,0,pw/2,height,0,0,height+3.6,0],[0,1,2],[0,0,1,0,.5,1],trim,ped);
   // Walk 01:00–01:20: low brick plinth, black metal railing and tall enclosed veranda glazing.
   const projection=1.1,span=width-.45,n=12,step=span/n,frame=mat('263a35');
   box('Pascolo veranda brick plinth',0,.27,projection-.15,span,.54,.32,wall,fac);
   for(let j=0;j<n;j++){const u=-span/2+(j+.5)*step;quad('Pascolo veranda reflected glazing',step-.1,2.75,glass[j%8],u,2.62,projection,fac);box('Pascolo veranda structural post',u+step/2,2.4,projection+.08,.085,4.0,.11,frame,fac);for(let k=0;k<5;k++)box('Pascolo lower railing upright',u+(k-2)*step/5,1.1,projection+.16,.027,1.08,.03,frame,fac);}
   for(const y of [.57,1.65,4.08])box('Pascolo continuous veranda rail',0,y,projection+.16,span,.075,.1,frame,fac);
   const verandaRoof=box('Pascolo shallow glazed veranda roof',0,4.25,projection/2,span,.06,projection+.25,mat('788980'),fac);verandaRoof.setLocalEulerAngles(12,0,0);
   box('Pascolo ochre veranda fascia',0,4.15,projection+.16,span,.32,.13,mat('b17636'),fac);
   quad('Pascolo source-era fascia lettering',5.8,.28,lettering('PASCOLO ristorante','b17636','292b22'),-span*.2,4.15,projection+.24,fac);
  }
  if(c.special==='richardson'){
   // Two prominent rounded bays and varied smaller roof projections, from aerial0–3s.
   for(const u of [-width/2+1.25,width/2-1.2]){const bay=new pc.Entity('Rounded Richardson bay');fac.addChild(bay);bay.setLocalPosition(u,0,.55);for(let k=0;k<5;k++){const a=(-70+k*35)*Math.PI/180;const seg=new pc.Entity('Curved bay facet');bay.addChild(seg);seg.setLocalPosition(Math.sin(a)*1.32,0,Math.cos(a)*1.32);seg.setLocalEulerAngles(0,a*180/Math.PI,0);box('Rounded bay brick',0,11.8,-.13,1.02,13.6,.45,wall,seg);for(let y of [7.1,11.6,16])window(seg,0,y,.72,2.3,trim,k);}const cone=new pc.Entity('Patinated conical turret cap');cone.addComponent('render',{type:'cone',material:roof});cone.setLocalPosition(0,height+2.4,0);cone.setLocalScale(3.9,5,3.9);bay.addChild(cone);}
   for(let level of [7,11.4,15.8]){box('External fire escape platform',0,level,1.0,width*.73,.12,1.0,iron,fac);for(let u=-width*.36;u<width*.36;u+=.23)box('Iron balcony baluster',u,level+.52,1.48,.024,1,.024,iron,fac);box('Balcony top rail',0,level+1.04,1.48,width*.74,.055,.06,iron,fac);const start=level===11.4?5:-5;for(let j=0;j<16;j++)box('Fire escape stair tread',start+j*.2,level+j*.275,1.05,.28,.07,.8,iron,fac);beam('Sloping stair rail',[start,level+.95,1.46],[start+3,level+5.1,1.46],.04,iron,fac);}
  }
  // Side elevations visible at intersections receive windows, not blank cardboard ends.
  const northCross=geo.crossings.some(cross=>Math.abs(f.frontZStart-cross.position[1])<22),southCross=geo.crossings.some(cross=>Math.abs(f.frontZEnd-cross.position[1])<22);
  for(const [isNorth,visible]of [[true,northCross],[false,southCross]])if(visible){const b=f.bounds,z=isNorth?b.minZ:b.maxZ,depth=Math.min(30,b.maxX-b.minX),sx=f.side==='east'?f.frontX+depth/2:f.frontX-depth/2,side=new pc.Entity('Cross street elevation');p.addChild(side);side.setLocalPosition(sx,0,z+(isNorth?-.08:.08));side.setLocalEulerAngles(0,isNorth?180:0,0);
   if(c.special==='wide-arches'){const n=Math.max(3,Math.round(depth/4.7)),step=depth/n;for(let j=0;j<n;j++){const u=-depth/2+(j+.5)*step;const sideArchHeight=Math.min(2.75,roofHeight-5);if(f.footprintId===5106)arcadeWindow(side,u,4.95,step*.82,Math.max(.5,roofHeight-5.7),.45,j);else arch(side,u,4.75+sideArchHeight/2,step*.78,sideArchHeight,trim,glass[j%8]);box('Cross-street retail frame',u,1.8,.05,step-.2,3.3,.15,iron,side);quad('Cross-street retail glazing',step-.45,3.0,shopGlass,u,1.8,.16,side);}box('Continuous light sign band',0,4.35,.2,depth,.7,.2,trim,side);}else for(let y=6;y<roofHeight-1;y+=3.5)for(let xx=-depth/2+2;xx<depth/2-1;xx+=3.6)window(side,xx,y,1.45,2.25,trim,Math.round(xx+depth),c.special==='masonic');cornice(side,depth,roofHeight,trim,!['plain','modern','folded','wide-arches','akes'].includes(c.special));}
  // Small rooftop equipment is estimated, kept subordinate to observed silhouettes.
  const b=f.bounds;if(!['masonic','richardson','gable','colonial-bank'].includes(c.special))for(let k=0;k<Math.min(3,Math.floor(width/9));k++)box('Roof mechanical housing',f.frontX+(f.side==='east'?1:-1)*(5+k*3),roofHeight+.6,center+(k-1)*4,1.6,1.2,2.2,mat('a2a29a'),p);
  modeled.push({id:f.footprintId,name:c.name||f.addressRanges.join(' / ')||'Street frontage',x:f.frontX,z:center,height,roofHeight,roofElevationM:measuredRoof?.elevationM,roofEvidence:measuredRoof?'2023 DSM dominant roof plane; parapet estimated':undefined,source:c.source||'Supplied walk/aerial; detail estimates'});
 }
 // Retain surrounding GIS massing for readable cross-street views. Unobserved elevations remain simple.
 for(const f of geo.footprints){if(registered.has(f.id)||skip.has(f.id))continue;const b=f.bounds;if(Math.abs((b.minX+b.maxX)/2)>125||b.maxZ<-100||b.minZ>550)continue;const h=9+(f.id%4)*2,base=geo.groundAt((b.minZ+b.maxZ)/2),p=new pc.Entity('Context footprint '+f.id);p.setPosition(0,base,0);root.addChild(p);const m=mat(['ad7960','c5baa2','ab806a','a49e8a'][f.id%4],'brick');for(const r of f.rings){for(let i=0;i<r.length-1;i++)sheet('Context wall',[[r[i][0],-.5,r[i][1]],[r[i+1][0],-.5,r[i+1][1]],[r[i+1][0],h,r[i+1][1]],[r[i][0],h,r[i][1]]],m,p);m.cull=pc.CULLFACE_NONE;polygonRoof(r,h,roof,p);}}
 return {root,modeled,ready:Promise.all(referenceTextureLoads)};
}
