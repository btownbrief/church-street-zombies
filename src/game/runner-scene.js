import * as pc from 'playcanvas';
import {RUNNER} from './runner.js';
export function createRunnerScene(app,world){
 const root=new pc.Entity('Portal run · Burlington street life');app.root.addChild(root);root.enabled=false;const visuals=new Map(),pool=new Map();
 function mat(hex,glow=0){const m=new pc.StandardMaterial();m.diffuse=new pc.Color(...hex.match(/../g).map(v=>parseInt(v,16)/255));m.gloss=.25;if(glow){m.emissive=m.diffuse.clone();m.emissiveIntensity=glow;}m.update();return m;}
 const wood=mat('ad865d'),paper=mat('e9e4cd'),blue=mat('537789'),green=mat('91aa50'),orange=mat('c56836'),dark=mat('283e40'),skin=mat('b18b70'),steel=mat('8caaa9'),purple=mat('ac7be1',1.1),gold=mat('e9c66f',.6),cream=mat('efdbb3'),red=mat('b65349');
 function part(parent,type,p,s,m,angles){const e=new pc.Entity('Runner detail');e.addComponent('render',{type,material:m,castShadows:false});parent.addChild(e);e.setLocalPosition(...p);e.setLocalScale(...s);if(angles)e.setLocalEulerAngles(...angles);return e;}
 const box=(r,p,s,m,a)=>part(r,'box',p,s,m,a),ball=(r,p,s,m)=>part(r,'sphere',p,s,m),cyl=(r,p,s,m,a)=>part(r,'cylinder',p,s,m,a);
 function textSign(parent,label,w=1.6,h=.38){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#243f43';ctx.fillRect(0,0,512,128);ctx.fillStyle='#e5edd0';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 40px Arial';ctx.fillText(label,256,64,490);const tex=new pc.Texture(app.graphicsDevice,{width:512,height:128});tex.setSource(c);const material=mat('ffffff');material.diffuseMap=tex;material.emissiveMap=tex;material.emissive=new pc.Color(.3,.3,.3);material.cull=pc.CULLFACE_NONE;material.update();const e=part(parent,'plane',[0,1.82,0],[w,1,h],material,[90,0,0]);return e;}
 function human(r,kind){const jacket=kind==='mail'?blue:kind==='shopper'?red:kind==='phone'?orange:kind==='zombie'?green:kind==='runner'?orange:blue;
  ball(r,[0,1.87,0],[.42,.48,.4],kind==='zombie'||kind==='runner'?green:skin);part(r,'capsule',[0,1.24,0],[.58,.85,.37],jacket);for(const side of [-1,1]){part(r,'capsule',[side*.17,.56,0],[.22,.93,.24],dark);box(r,[side*.18,.1,.09],[.25,.17,.4],dark);part(r,'capsule',[side*.37,1.25,.06],[.19,.68,.19],jacket);ball(r,[side*.38,.96,.08],[.15,.18,.16],skin);}
  if(kind==='phone'){box(r,[.32,1.33,.27],[.13,.22,.035],dark);ball(r,[.32,1.24,.26],[.15,.17,.15],skin);}
  if(kind==='shopper')for(const side of [-1,1]){box(r,[side*.54,.72,.1],[.27,.43,.25],side<0?paper:orange);box(r,[side*.54,.98,.1],[.10,.15,.035],dark);}
  if(kind==='mail'){box(r,[.4,1.03,0],[.34,.50,.24],blue);box(r,[.42,1.10,.15],[.21,.08,.02],paper);box(r,[0,2.10,.06],[.43,.075,.5],blue);}
  if(kind==='walker'){const dog=new pc.Entity('Leashed dog');r.addChild(dog);dog.setLocalPosition(.72,0,.22);ball(dog,[0,.31,0],[.26,.30,.6],wood);ball(dog,[0,.52,.23],[.24,.25,.25],wood);for(const x of [-.08,.08])for(const z of [-.18,.18])box(dog,[x,.13,z],[.06,.26,.07],dark);box(r,[.56,.65,.1],[.035,.7,.035],dark,[0,0,-30]);}
  if(kind==='zombie'||kind==='runner')for(const x of [-.09,.09])ball(r,[x,1.91,.197],[.06,.035,.025],gold);
 }
 function make(kind){const r=new pc.Entity(kind);root.addChild(r);
  if(['walker','phone','shopper','mail','zombie','runner'].includes(kind))human(r,kind);
  else if(kind==='boxes'){box(r,[-.23,.32,0],[.65,.64,.7],wood);box(r,[.32,.41,.06],[.5,.82,.58],paper);for(const x of [-.23,.32])box(r,[x,.67,0],[.08,.035,.62],paper);}
  else if(kind==='bike'){for(const x of [-.5,.5]){cyl(r,[x,.34,0],[.64,.055,.64],dark,[90,0,0]);cyl(r,[x,.34,.035],[.49,.025,.49],steel,[90,0,0]);}box(r,[0,.51,0],[.8,.07,.07],blue,[0,0,22]);box(r,[.28,.71,0],[.06,.57,.06],steel,[0,0,-16]);box(r,[-.22,.81,0],[.28,.08,.2],dark);box(r,[.41,.98,0],[.3,.055,.055],steel);}
  else if(kind==='newsbox'){box(r,[0,.45,0],[.65,.9,.55],blue);box(r,[0,.60,.285],[.49,.34,.02],paper);textSign(r,'LOCAL NEWS',.62,.16).setLocalPosition(0,.87,.29);}
  else if(kind==='cone'){part(r,'cone',[0,.43,0],[.7,.85,.7],orange);box(r,[0,.04,0],[.9,.08,.9],dark);cyl(r,[0,.40,0],[.39,.14,.39],paper);}
  else if(kind==='rail'){box(r,[0,.72,0],[1.5,.12,.12],steel);for(const x of [-.57,.57])box(r,[x,.35,0],[.1,.7,.1],dark);}
  else if(kind==='ramp'){box(r,[0,.39,0],[1.55,.12,1.45],wood,[28,0,0]);for(const x of [-.65,.65])box(r,[x,.26,-.35],[.1,.52,.55],dark);}
  else if(kind==='cafe'){cyl(r,[0,.89,0],[1.35,.1,1.35],wood);cyl(r,[0,1.38,0],[.08,2.76,.08],dark);part(r,'cone',[0,2.53,0],[1.75,.5,1.75],red);for(const x of [-.7,.7])box(r,[x,.5,.25],[.33,.12,.33],dark);}
  else if(kind==='banner'){for(const x of [-.97,.97])box(r,[x,1.4,0],[.08,2.8,.1],steel);box(r,[0,1.83,0],[1.88,1.38,.12],purple);textSign(r,'SLIDE UNDER',1.7,.36).setLocalPosition(0,1.83,.071);}
  else if(kind==='coin'){cyl(r,[0,0,0],[.36,.055,.36],gold,[90,0,0]);box(r,[0,0,.035],[.055,.23,.035],paper);}
  else if(kind==='creemee'){part(r,'cone',[0,-.1,0],[.23,.4,.23],wood,[180,0,0]);for(let i=0;i<3;i++)ball(r,[0,.11+i*.13,0],[.32-i*.065,.20,.32-i*.065],cream);}
  else if(kind==='magnet'){for(const x of [-.15,.15])box(r,[x,0,0],[.12,.4,.14],red);box(r,[0,-.19,0],[.42,.12,.14],red);for(const x of [-.15,.15])box(r,[x,.17,0],[.12,.1,.14],paper);}
  return r;
 }
 function acquire(kind){const list=pool.get(kind)||[],r=list.pop()||make(kind);pool.set(kind,list);r.enabled=true;return r;}
 function release(id,v){v.root.enabled=false;if(!pool.has(v.kind))pool.set(v.kind,[]);pool.get(v.kind).push(v.root);visuals.delete(id);}
 function update(s){const live=new Set(),lap=Math.floor(s.distance/RUNNER.lapLength);for(const o of [...s.rows,...s.collectibles]){if(Math.floor(o.distance/RUNNER.lapLength)!==lap)continue;live.add(o.id);const kind=o.type||o.kind;let v=visuals.get(o.id);if(!v){v={kind,root:acquire(kind)};visuals.set(o.id,v);}const z=RUNNER.startZ-o.distance%RUNNER.lapLength,y=world.terrainAt(o.x,z)+(o.y||0);v.root.setPosition(o.x,y,z);v.root.setEulerAngles(0,o.kind?s.time*80:0,0);}
  for(const [id,v]of visuals)if(!live.has(id))release(id,v);
 }
 function clear(){for(const [id,v]of visuals)release(id,v);root.enabled=false;}
 // A ring built from few segments; portals are separate from approved scenery.
 function portal(label){const p=new pc.Entity(label);app.root.addChild(p);for(let i=0;i<24;i++){const a=i*Math.PI/12;box(p,[Math.cos(a)*1.3,1.6+Math.sin(a)*1.5,0],[.22,.28,.16],purple,[0,0,a*180/Math.PI-90]);}textSign(p,label,2.5,.42).setLocalPosition(0,3.42,0);return p;}
 const laneMaterial=mat('d9c2fa');laneMaterial.opacity=.35;laneMaterial.blendType=pc.BLEND_NORMAL;laneMaterial.depthWrite=false;laneMaterial.update();const vp=[],vi=[];
 for(const x of [-3.15,-1.05,1.05,3.15])for(let z=22;z<478;z+=3.2){const a=vp.length/3;for(const [xx,zz]of [[x-.025,z],[x+.025,z],[x-.025,z+1.1],[x+.025,z+1.1]])vp.push(xx,world.terrainAt(xx,zz)+.075,zz);vi.push(a,a+2,a+1,a+1,a+2,a+3);}
 const laneMesh=pc.createMesh(app.graphicsDevice,vp,{indices:vi,normals:pc.calculateNormals(vp,vi)}),laneGuides=new pc.Entity('Three runner lanes');laneGuides.addComponent('render',{meshInstances:[new pc.MeshInstance(laneMesh,laneMaterial)],castShadows:false});root.addChild(laneGuides);
 const entrance=portal('CHURCH ST RUNNERS'),lapPortal=portal('NEXT LAP');entrance.enabled=lapPortal.enabled=false;
 lapPortal.setPosition(0,world.terrainAt(0,20),20);
 return{root,entrance,lapPortal,update,clear};
}
