import * as pc from 'playcanvas';

// GIS footprints 5398 and 5379; visible detail checked against supplied walking/drone footage.
// Heights, hidden rear detail and small ornaments are modeled estimates, not survey measurements.
export function buildSouthLandmarks(app, geo = {}) {
  const root = new pc.Entity('City Hall and Ethan Allen firehouse'); app.root.addChild(root);
  const ground = typeof geo.groundAt === 'function' ? geo.groundAt : () => 0;
  const rgb = s => new pc.Color(...s.match(/\w\w/g).map(x=>parseInt(x,16)/255));
  function material(name,hex,gloss=.12){const m=new pc.StandardMaterial();m.name=name;m.diffuse=rgb(hex);m.gloss=gloss;m.specular=new pc.Color(.15,.15,.15);m.update();return m;}
  const white=material('City Hall aged limestone','d3ccbb'), pale=material('City Hall painted wood','ece8da'), base=material('City Hall granite basement','a6aaa7'), red=material('Civic red brick','984f43'), firebrick=material('Firehouse burnt red brick','874738'), dark=material('Recessed civic window glass','294047',.35), sash=material('Window sash warm ivory','d0d5c9'), green=material('Firehouse green trim','38564f'), slate=material('Civic roof slate','647674'), iron=material('Stair balustrade iron','242d2c'), gold=material('City Hall gilded cupola','b9a465',.45);
  const brickCanvas=document.createElement('canvas');brickCanvas.width=512;brickCanvas.height=512;const c=brickCanvas.getContext('2d');c.fillStyle='#bdad97';c.fillRect(0,0,512,512);let seed=5398;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};for(let y=0;y<32;y++)for(let x=-1;x<8;x++){const q=random()*30;c.fillStyle=`rgb(${130+q},${61+q*.65},${47+q*.5})`;c.fillRect(x*64+(y%2)*32+1,y*16+1,62,14);}const tex=new pc.Texture(app.graphicsDevice,{mipmaps:true,anisotropy:8});tex.setSource(brickCanvas);tex.addressU=tex.addressV=pc.ADDRESS_REPEAT;for(const m of [red,firebrick]){m.diffuseMap=tex;m.diffuse=rgb('ffffff');m.diffuseMapTiling.set(m===red?24:6,6);m.update();}
  function shape(parent,name,type,x,y,z,w,h,d,m){const e=new pc.Entity(name);e.addComponent('render',{type,material:m});e.setLocalPosition(x,y,z);e.setLocalScale(w,h,d);parent.addChild(e);return e;}
  const box=(p,n,x,y,z,w,h,d,m)=>shape(p,n,'box',x,y,z,w,h,d,m);
  function mesh(p,n,v,ind,m){const e=new pc.Entity(n);const me=pc.createMesh(app.graphicsDevice,v,{indices:ind,normals:pc.calculateNormals(v,ind)});e.addComponent('render',{meshInstances:[new pc.MeshInstance(me,m)]});p.addChild(e);return e;}
  function arch(p,n,x,y,z,w,h,m,depth=.08){const r=w/2,bottom=y-h/2,cy=y+h/2-r,v=[x-r,bottom,z,x+r,bottom,z];for(let i=0;i<=24;i++){let a=i*Math.PI/24;v.push(x+r*Math.cos(a),cy+r*Math.sin(a),z);}const ix=[];for(let i=1;i<v.length/3-1;i++)ix.push(0,i,i+1);return mesh(p,n,v,ix,m);}
  function arcBand(p,n,x,y,z,r,thick,m){const v=[],ix=[];for(let i=0;i<=32;i++){let a=i*Math.PI/32;v.push(x+Math.cos(a)*r,y+Math.sin(a)*r,z,x+Math.cos(a)*(r+thick),y+Math.sin(a)*(r+thick),z);}for(let i=0;i<32;i++){let a=i*2;ix.push(a,a+1,a+2,a+1,a+3,a+2);}return mesh(p,n,v,ix,m);}
  function bar(p,n,a,b,r,m){const va=new pc.Vec3(...a),vb=new pc.Vec3(...b);const mid=va.clone().add(vb).mulScalar(.5);const e=shape(p,n,'cylinder',mid.x,mid.y,mid.z,r,va.distance(vb),r,m);e.setLocalRotation(new pc.Quat().setFromDirections(pc.Vec3.UP,vb.sub(va).normalize()));return e;}
  function window(p,x,y,z,w=1.5,h=3.2,arched=false){box(p,'Civic window stone surround',x,y,z,w+.28,h+.3,.16,white);if(arched){arch(p,'Dark arched window',x,y,z+.1,w,h,dark);arcBand(p,'Arched window hood',x,y+h/2-w/2,z+.14,w/2,.15,white);}else box(p,'Civic recessed glass',x,y,z+.1,w,h,.04,dark);for(let j=1;j<4;j++)box(p,'Window vertical sash',x-w/2+j*w/4,y,z+.14,.035,h,.05,sash);for(let j=1;j<6;j++)box(p,'Window horizontal sash',x,y-h/2+j*h/6,z+.15,w,.036,.05,sash);box(p,'Window sill',x,y-h/2-.12,z+.09,w+.43,.17,.32,white);}
  function textPanel(p,n,text,x,y,z,w,h,m=white,ink='#424b45'){const ca=document.createElement('canvas');ca.width=1024;ca.height=128;const ctx=ca.getContext('2d');ctx.fillStyle='#d5cebd';ctx.fillRect(0,0,1024,128);ctx.fillStyle=ink;ctx.font='48px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';if(h>w){ctx.font='bold 100px sans-serif';ctx.fillText(text,512,72,980);}else ctx.fillText(text,512,64,980);const t=new pc.Texture(app.graphicsDevice,{mipmaps:true});t.setSource(ca);const mt=m.clone();mt.diffuse=rgb('ffffff');mt.diffuseMap=t;mt.update();const e=box(p,n,x,y,z,w,h,.08,mt);return e;}
  function hip(p,name,x,y,z,w,d,h,m){return mesh(p,name,[x-w/2,y,z-d/2,x+w/2,y,z-d/2,x+w/2,y,z+d/2,x-w/2,y,z+d/2,x-w/2+Math.min(w,d)*.3,y+h,z,x+w/2-Math.min(w,d)*.3,y+h,z],[0,4,1,1,4,5,1,5,2,2,5,3,3,5,4,3,4,0],m);}
  function civic(name,frontX,z){const e=new pc.Entity(name);e.setLocalPosition(frontX,ground(z),z);e.setLocalEulerAngles(0,90,0);root.addChild(e);return e;}

  const hall=civic('Burlington City Hall · 149 Church Street',-17.85,460.32);
  box(hall,'Granite basement',0,1.55,-10.5,50.9,3.1,21,base);box(hall,'Brick civic hall',0,9.2,-10.5,50.9,12.2,21,red);
  for(let y of [3.1,14.35,14.65,15.02,15.34])box(hall,'Continuous classical entablature',0,y,-10.5,51.5,y===14.65?.42:.2,21.7,white);
  for(let u=-23.4;u<=23.5;u+=3.9){if(Math.abs(u)<.2)continue;window(hall,u,5.6,.11,1.62,3.55);window(hall,u,11.12,.11,1.65,3.48);box(hall,'Recessed masonry panel beneath upstairs window',u,8.65,.11,1.48,.62,.13,white);window(hall,u,1.45,.12,1.7,1.45);}
  for(let u=-25.35;u<=25.4;u+=3.9){box(hall,'Full-height fluted pilaster',u,8.72,.27,.68,10.6,.48,white);box(hall,'Pilaster plinth',u,3.5,.39,1.02,.52,.62,white);box(hall,'Pilaster capital block',u,14.03,.41,1.07,.43,.7,white);for(let f=-2;f<=2;f++)box(hall,'Pilaster flute',u+f*.115,8.85,.54,.037,9.35,.024,base);for(let j=-1;j<=1;j++)shape(hall,'Capital leaf', 'sphere',u+j*.3,13.75,.59,.26,.5,.14,white);for(let j of [-1,1])shape(hall,'Capital volute','sphere',u+j*.38,14,.62,.28,.27,.16,white);}
  // High central doorway and semicircular fanlight, observed in walk-north/0000.jpg.
  arch(hall,'Central doorway recess',0,7.54,.58,3.4,8.8,dark);arcBand(hall,'Stone doorway arch',0,10.24,.72,1.7,.32,white);
  for(let u of [-1.96,1.96]){box(hall,'Door surround pilaster',u,6.4,.7,.35,6.4,.47,white);box(hall,'Door pilaster foot',u,3.36,.8,.6,.36,.65,white);}
  box(hall,'Double civic entrance',0,5.23,.78,2.4,4.03,.1,pale);for(let u of [-.62,.62])for(let y of [4.3,5.6,6.5])box(hall,'Door recessed panel',u,y,.85,.95,.63,.08,white);box(hall,'Door center seam',0,5.3,.89,.035,4,.035,base);
  for(let i=0;i<=8;i++){let a=i*Math.PI/8;bar(hall,'Fanlight radial glazing',[0,10.24,.8],[Math.cos(a)*1.61,10.24+Math.sin(a)*1.61,.8],.043,pale);}box(hall,'Door pediment cornice',0,7.45,.92,3.6,.23,.5,white);mesh(hall,'Door broken triangular pediment',[-1.8,7.6,1,0,8.4,1,1.8,7.6,1],[0,1,2],white);textPanel(hall,'City Hall inscription','CITY HALL',0,7.14,.96,2.4,.3);
  // Crest and restrained swags over the arch.
  shape(hall,'City seal shield','sphere',0,13.22,.76,.9,1.5,.23,white);shape(hall,'City seal gilt inset','sphere',0,13.25,.91,.48,.78,.05,gold);for(let side of [-1,1])for(let i=0;i<8;i++){const u=side*(.7+i*.18);shape(hall,'Stone garland','sphere',u,13.26-.4*Math.sin(i/7*Math.PI),.74,.22,.22,.16,white);}
  // Raised central landing with two returning stair flights, not one broad stair ramp.
  box(hall,'Entry landing masonry',0,1.6,1.93,5.35,3.2,3.8,base);
  const steps=15;for(let side of [-1,1])for(let i=0;i<steps;i++){const h=(i+1)*3.2/steps,u=side*(7.66-i*.35);box(hall,'Granite return stair',u,h/2,2.1,.36,h,3.4,white);const top=h+1.04;bar(hall,'Stair railing baluster',[u,h,3.85],[u,top,3.85],.045,iron);if(i<steps-1)bar(hall,'Sloping stair handrail',[u,top,3.85],[u-side*.35,top+3.2/steps,3.85],.065,iron);}
  for(let u=-2.6;u<2.7;u+=.24)bar(hall,'Landing iron picket',[u,3.2,3.84],[u,4.28,3.84],.045,iron);bar(hall,'Landing top rail',[-2.65,4.3,3.84],[2.65,4.3,3.84],.075,iron);
  hip(hall,'City Hall broad slate hip',0,15.4,-10.5,51.6,21.8,4.8,slate);
  // Roof clock tower and open lantern visible above the Main Street sightline.
  box(hall,'White clock tower',0,21.5,-10.5,6.2,7,6.2,pale);for(let y of [18.3,24.6,25])box(hall,'Clock tower moulding',0,y,-10.5,6.6,.26,6.6,white);
  const clockCanvas=document.createElement('canvas');clockCanvas.width=256;clockCanvas.height=256;const cc=clockCanvas.getContext('2d');cc.fillStyle='#e3dfd2';cc.fillRect(0,0,256,256);cc.strokeStyle='#39433f';cc.lineWidth=6;cc.beginPath();cc.arc(128,128,111,0,Math.PI*2);cc.stroke();cc.textAlign='center';cc.textBaseline='middle';cc.fillStyle='#39433f';cc.font='22px Georgia';for(let i=1;i<=12;i++){const a=i*Math.PI/6;cc.fillText(String(i),128+Math.sin(a)*88,128-Math.cos(a)*88);}cc.lineWidth=7;cc.beginPath();cc.moveTo(128,128);cc.lineTo(86,96);cc.moveTo(128,128);cc.lineTo(140,57);cc.stroke();const ct=new pc.Texture(app.graphicsDevice,{mipmaps:true});ct.setSource(clockCanvas);const cm=pale.clone();cm.diffuseMap=ct;cm.update();for(let a=0;a<4;a++){const g=new pc.Entity('Civic clock face');g.setLocalPosition(0,22.2,-10.5);g.setLocalEulerAngles(0,a*90,0);hall.addChild(g);box(g,'Roman clock',0,0,3.14,2.62,2.62,.04,cm);}
  box(hall,'Lantern deep openings',0,27.15,-10.5,3.75,4.3,3.75,dark);for(let x of [-2.04,2.04])for(let z of [-12.54,-8.46]){box(hall,'White lantern pier',x,27.15,z,.43,4.6,.43,pale);}for(let y of [25,29.3])box(hall,'Lantern entablature',0,y,-10.5,4.85,.38,4.85,pale);shape(hall,'Upper octagonal lantern','cylinder',0,31,-10.5,2.8,3.2,2.8,pale);shape(hall,'Gilded cupola','sphere',0,33,-10.5,3.25,2.3,3.25,gold);shape(hall,'Cupola finial','cone',0,34.7,-10.5,.3,1.4,.3,gold);

  const fire=civic('Ethan Allen Firehouse · BCA Center',-9.87,424.27);
  box(fire,'Firehouse masonry volume',0,6.6,-14.7,10.74,13.2,29.5,firebrick);box(fire,'Ground-floor stone piers backing',0,2,-.05,10.9,4,.2,base);
  for(let u of [-3.55,0,3.55]){box(fire,'Gallery glass doors',u,2.02,.11,2.94,3.7,.08,dark);for(let j of [-.76,.76])box(fire,'Gallery door stiles',u+j,2.03,.2,.055,3.7,.055,green);box(fire,'Gallery door transom',u,2.98,.2,2.94,.07,.05,green);}
  for(let u of [-5.04,-1.76,1.76,5.04]){box(fire,'Firehouse rusticated stone pier',u,2,.3,.48,4,.65,white);for(let y=.3;y<4;y+=.5)box(fire,'Rustication joint',u,y,.65,.51,.045,.04,base);}
  textPanel(fire,'Historic fire company inscription','ETHAN ALLEN ENGINE CO. No. 4',0,4.28,.34,10.7,.7);
  for(let y of [4.7,8.95,12.72,13.1])box(fire,'Firehouse masonry string course',0,y,.14,10.98,.2,.42,white);
  for(let u of [-3.5,0,3.5]){window(fire,u,6.75,.17,2.28,3.66,true);window(fire,u,10.83,.17,1.92,3.2,true);}
  for(let u=-5.15;u<5.25;u+=.5)box(fire,'Corbelled brick cornice',u,12.5,.31,.21,.45,.38,firebrick);
  hip(fire,'Firehouse hipped slate roof',0,13.35,-14.7,11.3,29.95,4.1,slate);
  // Rear square hose-drying tower: published height85ft/25.9m.
  box(fire,'Square brick hose tower',0,17,-23.9,4.85,14.7,4.85,firebrick);for(let y of [19.5,20.1,24.5])box(fire,'Hose tower corbel course',0,y,-23.9,5.18,.24,5.18,white);
  for(let a=0;a<4;a++){const g=new pc.Entity('Hose tower opening side');g.setLocalPosition(0,0,-23.9);g.setLocalEulerAngles(0,a*90,0);fire.addChild(g);arch(g,'Tower arched louver recess',0,22.48,2.47,2.6,3.75,dark);arcBand(g,'Tower arch surround',0,23.05,2.51,1.3,.27,green);for(let y=21.3;y<23.4;y+=.18)box(g,'Louver slat',0,y,2.56,2.38,.09,.1,green);}
  hip(fire,'Hose tower pyramid roof',0,24.55,-23.9,5.8,5.8,2.0,slate);
  for(let u of [-3.3,3.3])textPanel(fire,'BCA banner','BCA',u,8.75,.83,1.05,3.5,white,'#253e3a');
  root.landmarkMetadata=[{footprintId:5398,name:'Burlington City Hall',groundY:ground(460.32),source:'User walking video close-ups; city GIS footprint; roof from aerial video',accuracy:'Footprint anchored; dimensions above ground and ornament interpreted.'},{footprintId:5379,name:'Ethan Allen Firehouse',groundY:ground(424.27),source:'City GIS; user aerial and street video; official historic tour height85ft',accuracy:'Footprint anchored; front details and roof estimated from imagery.'}];
  return root;
}
