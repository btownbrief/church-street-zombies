// Street Yeet's short-range lock, sweeping charge and look-directed loft,
// adapted to continuous combat. Simulation is renderer-independent.
export const YEET={range:6.5,halfSweep:.5,cooldown:1.6,gravity:18,minPower:.45};
// A tap already throws hard; holding sweeps to the peak and back, so timing still pays.
export function chargeAt(seconds){const t=(seconds/YEET.halfSweep)%2;return YEET.minPower+(1-YEET.minPower)*(t<1?t:2-t);}
export function launchVelocity(direction,power){const y=Math.max(-.1,direction.y)+.34,n=Math.hypot(direction.x,y,direction.z)||1,speed=14+34*Math.max(YEET.minPower,power);return{x:direction.x/n*speed,y:y/n*speed,z:direction.z/n*speed};}
export function selectYeetTarget(enemies,origin,direction,visible){let best=null,value=Infinity;for(const e of enemies){if(e.warning>0||e.flight||e.health<=0)continue;const dx=e.x-origin.x,dz=e.z-origin.z,d=Math.hypot(dx,dz),dot=(dx*direction.x+dz*direction.z)/(d||1);if(d>YEET.range||dot<.4||!visible(origin.x,origin.z,e.x,e.z,e))continue;const rank=d-dot*2.2;if(rank<value){value=rank;best=e;}}return best;}
export function createYeet(hooks){
 let held=false,target=null,time=0,cooldown=0;const flights=[];
 function cancel(){held=false;target=null;time=0;}
 function reset(){cancel();cooldown=0;flights.length=0;}
 function begin(){if(held||cooldown>0)return;const p=hooks.player();target=selectYeetTarget(hooks.enemies(),p,hooks.direction(),hooks.visible);if(!target){hooks.toast('YEET · Aim at a zombie or red barrel within 6 metres');return;}held=true;time=0;hooks.sound('ready');}
 function release(){if(!held)return;held=false;const e=target;target=null;const p=hooks.player(),power=chargeAt(time);if(!hooks.enemies().includes(e)||e.flight||Math.hypot(e.x-p.x,e.z-p.z)>YEET.range+1||!hooks.visible(p.x,p.z,e.x,e.z,e)){hooks.toast('YEET · Target out of reach');return;}
  cooldown=YEET.cooldown;
  if(e.type==='brute'){e.stagger=1.1;hooks.damage(e,25+power*35);hooks.toast('TOO HEAVY · Brute staggered');hooks.sound('hit');return;}
  const v=launchVelocity(hooks.direction(),power);e.flight=true;hooks.launched?.(e);flights.push({enemy:e,x:e.x,y:hooks.floor(e.x,e.z)+.3,z:e.z,x0:e.x,z0:e.z,vx:v.x,vy:v.y,vz:v.z,age:0,hits:new Set(),power});hooks.launch?.(e,power);hooks.sound('yeet');hooks.toast(e.kind==='barrel'?'BARREL YEET! · Explodes on impact':'YEET! · Bowl through the horde');
 }
 function update(dt){cooldown=Math.max(0,cooldown-dt);if(held)time+=dt;
  for(let i=flights.length-1;i>=0;i--){const f=flights[i],e=f.enemy;if(!hooks.enemies().includes(e)){flights.splice(i,1);continue;}f.age+=dt;let impact=false;
   // Substeps prevent a high-power body from tunnelling through a target.
   const steps=Math.max(1,Math.ceil(Math.hypot(f.vx,f.vy,f.vz)*dt/.18)),h=dt/steps;
   for(let j=0;j<steps&&!impact;j++){const nx=f.x+f.vx*h,nz=f.z+f.vz*h;f.vy-=YEET.gravity*h;f.y+=f.vy*h;
    if(!hooks.clear(nx,nz)){impact=true;break;}f.x=nx;f.z=nz;e.x=nx;e.z=nz;
    for(const other of [...hooks.enemies()]){if(other===e||other.flight||other.warning>0||f.hits.has(other))continue;if(Math.hypot(other.x-f.x,other.z-f.z)<.8&&Math.abs(f.y+.8-(hooks.floor(other.x,other.z)+1))<1.15){f.hits.add(other);other.stagger=.8;hooks.damage(other,85+f.power*85);hooks.domino(f.hits.size);hooks.sound('hit');f.vx*=.82;f.vz*=.82;if(e.kind==='barrel'){impact=true;break;}}}
    if(f.y<=hooks.floor(f.x,f.z)+.06&&f.age>.15)impact=true;
   }
   if(!hooks.enemies().includes(e)){flights.splice(i,1);continue;}hooks.pose(e,f);if(impact||f.age>4){e.flight=false;const distance=Math.hypot(f.x-f.x0,f.z-f.z0);hooks.impact?.(e,{distance,hits:f.hits.size,power:f.power});hooks.damage(e,1000);flights.splice(i,1);}
  }
 }
 return{begin,release,cancel,reset,update,get held(){return held;},get target(){return target;},get power(){return held?chargeAt(time):0;},get cooldown(){return cooldown;},get flights(){return flights;}};
}
