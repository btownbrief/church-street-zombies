import * as pc from 'playcanvas';
import {raySphere} from './navigation.js';
import {explosionDamage} from './encounters.js';
// All ordnance is fictional game simulation; no real-world construction data.
export function createCombatKit(app,world,nav,hooks){
 const items=[],projectiles=[],effects=[];let serial=0,stock={grenade:4,barricade:3,barrel:3},throwCooldown=0;
 function mat(hex,glow=0){const m=new pc.StandardMaterial();m.diffuse=new pc.Color(...hex.match(/../g).map(v=>parseInt(v,16)/255));m.gloss=.28;if(glow){m.emissive=m.diffuse.clone();m.emissiveIntensity=glow;}m.update();return m;}
 const wood=mat('796249'),steel=mat('394b4b'),red=mat('a33d2c'),stripe=mat('ebbd58'),glow=mat('ffd27d',2),smoke=mat('595a52'),acid=mat('a7e76a',2);
 function part(root,type,p,s,m){const e=new pc.Entity('Equipment detail');e.addComponent('render',{type,material:m,castShadows:false});e.setLocalPosition(...p);e.setLocalScale(...s);root.addChild(e);return e;}
 function model(kind){const root=new pc.Entity(kind);app.root.addChild(root);if(kind==='barricade'){for(const x of [-.82,.82]){part(root,'box',[x,.48,0],[.16,.96,.2],steel);for(const z of [-.3,.3])part(root,'box',[x,.05,z],[.32,.10,.33],steel);}for(const y of [.4,.72,1.04]){part(root,'box',[0,y,0],[2.25,.21,.14],wood);for(const x of [-.75,.75])part(root,'sphere',[x,y,-.08],[.04,.04,.02],steel);}part(root,'box',[0,.73,-.08],[.65,.17,.01],stripe);}else{part(root,'cylinder',[0,.55,0],[.67,1.10,.67],red);for(const y of [.12,.92])part(root,'cylinder',[0,y,0],[.71,.07,.71],steel);part(root,'box',[0,.57,-.34],[.36,.32,.025],stripe);part(root,'box',[0,.57,-.36],[.04,.22,.02],red);}return root;}
 function colliders(){return items.flatMap(o=>o.kind==='barrel'?[{x:o.x,z:o.z,r:.36}]:[-.85,-.425,0,.425,.85].map(t=>({x:o.x+Math.cos(o.yaw)*t,z:o.z-Math.sin(o.yaw)*t,r:.25})));}
 function sync(){nav.setDynamic(colliders());const p=hooks.player();nav.update(p.x,p.z);}
 function reset(){for(const o of [...items,...projectiles,...effects])o.root.destroy();items.length=projectiles.length=effects.length=0;stock={grenade:4,barricade:3,barrel:3};throwCooldown=0;sync();}
 function replenish(){stock.grenade=Math.min(8,stock.grenade+3);stock.barricade=Math.min(7,stock.barricade+2);stock.barrel=Math.min(7,stock.barrel+2);}
 function place(kind,seed){const p=hooks.player(),yaw=seed?.yaw??hooks.yaw(),distance=kind==='barrel'?3.4:2.6,x=seed?.x??p.x-Math.sin(yaw)*distance,z=seed?.z??p.z-Math.cos(yaw)*distance;
  if(!seed&&stock[kind]<=0){hooks.toast('No '+kind+'s left. Resupply after this wave.');return false;}
  const probes=kind==='barrel'?[0]:[-1,0,1];if(!probes.every(t=>nav.clear(x+Math.cos(yaw)*t,z-Math.sin(yaw)*t,.46))||Math.hypot(x-p.x,z-p.z)<1.4||hooks.enemies().some(e=>Math.hypot(e.x-x,e.z-z)<1.3)){if(!seed)hooks.toast('Need clear street space in front of you.');return false;}
  if(items.length>=24){hooks.toast('Equipment limit reached. Clear an old piece first.');return false;}
  const root=model(kind),o={id:++serial,kind,x,z,yaw,health:kind==='barrel'?20:280,root};root.setPosition(x,world.terrainAt(x,z),z);root.setEulerAngles(0,yaw*180/Math.PI,0);items.push(o);if(!seed)stock[kind]--;sync();hooks.sound.play('reload');if(!seed)hooks.toast(kind==='barrel'?'BARREL READY · Shoot it for a chain reaction':'BARRICADE PLACED · Funnel the horde');return true;
 }
 function remove(o){const i=items.indexOf(o);if(i<0)return;items.splice(i,1);o.root.destroy();sync();}
 function explode(x,y,z,radius=7.2,power=220,owner='player'){
  hooks.sound.play('explosion');hooks.shake(.28);const root=new pc.Entity('Explosion');app.root.addChild(root);root.setPosition(x,y,z);part(root,'sphere',[0,0,0],[1,1,1],glow);effects.push({root,life:.42,total:.42,radius});
  let hits=0;
  for(const e of [...hooks.enemies()]){const d=Math.hypot(e.x-x,e.z-z);if(d<radius&&hooks.blastClear(x,z,e.x,e.z)){hits++;hooks.damageEnemy(e,explosionDamage(d,radius,power),'explosion');}}
  const p=hooks.player(),pd=Math.hypot(p.x-x,p.z-z);if(pd<radius*.48)hooks.hurt(Math.round(explosionDamage(pd,radius*.48,32)));
  // Remove barrels BEFORE recursing: each can explode only once.
  for(const o of [...items])if(Math.hypot(o.x-x,o.z-z)<radius){if(o.kind==='barrel'){const ox=o.x,oz=o.z;remove(o);explode(ox,world.terrainAt(ox,oz)+.5,oz,7.5,230,owner);}else{o.health-=120;if(o.health<=0)remove(o);}}
  for(let i=0;i<10;i++){const debris=new pc.Entity('Blast debris');app.root.addChild(debris);debris.setPosition(x,y,z);part(debris,'box',[0,0,0],[.07,.07,.07],i%2?smoke:stripe);effects.push({root:debris,life:.65,total:.65,vx:(Math.random()-.5)*10,vy:Math.random()*7,vz:(Math.random()-.5)*10});}
  if(hits>=3)hooks.toast(`CROWD CLEARED · ${hits} caught in the blast`);
 }
 function hit(o,damage){if(!items.includes(o))return;o.health-=damage;if(o.health<=0){const{x,z,kind}=o;remove(o);if(kind==='barrel')explode(x,world.terrainAt(x,z)+.55,z);else hooks.sound.hiss(.2,.25,800);}}
 function raycast(origin,dir,max){let result=null;for(const o of items){const h=o.kind==='barrel'?.58:.62,r=o.kind==='barrel'?.4:.72,t=raySphere(origin,dir,{x:o.x,y:world.terrainAt(o.x,o.z)+h,z:o.z},r);if(t<max){max=t;result={item:o,distance:t};}}return result;}
 function throwGrenade(origin,dir){if(throwCooldown>0)return;if(stock.grenade<=0){hooks.toast('No grenades left. Refill at the next wave.');return;}stock.grenade--;throwCooldown=.5;const root=new pc.Entity('Grenade');app.root.addChild(root);part(root,'sphere',[0,0,0],[.18,.22,.18],steel);part(root,'sphere',[0,.1,0],[.06,.06,.06],glow);const p={root,x:origin.x+dir.x*.7,y:origin.y,z:origin.z+dir.z*.7,vx:dir.x*13,vy:Math.max(2.7,dir.y*10+3.8),vz:dir.z*13,fuse:1.35,kind:'grenade'};projectiles.push(p);hooks.sound.play('reload');}
 function spit(e,p){const root=new pc.Entity('Spitter projectile');app.root.addChild(root);part(root,'sphere',[0,0,0],[.26,.26,.26],acid);const x=e.x,z=e.z,y=world.terrainAt(x,z)+1.5,dx=p.x-x,dy=world.terrainAt(p.x,p.z)+1.05-y,dz=p.z-z,l=Math.hypot(dx,dy,dz);projectiles.push({root,x,y,z,vx:dx/l*10,vy:dy/l*10,vz:dz/l*10,kind:'acid',fuse:4});hooks.sound.tone(320,100,.2,.1,'sawtooth');}
 function update(dt){throwCooldown=Math.max(0,throwCooldown-dt);for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.fuse-=dt;if(p.kind==='grenade')p.vy-=dt*12;
  let nx=p.x+p.vx*dt,nz=p.z+p.vz*dt;if(!hooks.baseClear(nx,nz)){if(p.kind==='acid')p.fuse=0;else{p.vx*=-.35;p.vz*=-.35;}nx=p.x;nz=p.z;}
  p.x=nx;p.z=nz;p.y+=p.vy*dt;const floor=world.terrainAt(p.x,p.z)+.13;if(p.y<floor){p.y=floor;if(p.kind==='acid')p.fuse=0;else{p.vy=Math.abs(p.vy)*.3;p.vx*=.7;p.vz*=.7;}}
  const player=hooks.player();if(p.kind==='acid'&&Math.hypot(p.x-player.x,p.z-player.z)<.62&&Math.abs(p.y-world.terrainAt(player.x,player.z)-1)<1){hooks.hurt(13);p.fuse=0;}
  if(p.kind==='acid'){const wall=items.find(o=>Math.hypot(o.x-p.x,o.z-p.z)<.8);if(wall){hit(wall,35);p.fuse=0;}}
  p.root.setPosition(p.x,p.y,p.z);p.root.rotateLocal(dt*220,dt*90,0);if(p.fuse<=0){p.root.destroy();projectiles.splice(i,1);if(p.kind==='grenade')explode(p.x,p.y,p.z);}
 }
 for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;if(e.life<=0){e.root.destroy();effects.splice(i,1);continue;}if(e.radius){const s=(1-e.life/e.total)*e.radius*1.6+.2;e.root.setLocalScale(s,s*.6,s);for(const r of e.root.findComponents('render'))r.enabled=e.life>.10;}else{e.vy-=dt*12;e.root.translate(e.vx*dt,e.vy*dt,e.vz*dt);}}
 }
 return{items,projectiles,get stock(){return stock;},reset,replenish,place,hit,raycast,throwGrenade,spit,explode,update,colliders};
}
