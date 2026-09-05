// Metres, radians, +x east / +z south. Physics stays independent of rendering.
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
export const SKATE={gravity:17,minPop:5.2,maxPop:9.4,charge:.45,flipTime:.43,maxSpeed:11.5,grip:7};
export function createSkater(){return{active:false,x:0,z:0,y:0,yaw:0,speed:0,vx:null,vz:null,vy:0,state:'ride',charge:0,charging:false,airTime:0,flip:null,flipTime:0,spin:0,grind:null,grindTime:0,grindCooldown:0,combo:[],pending:0,stun:0,flow:0,slope:0,events:[],totalTricks:0};}
function velocity(s){if(s.vx===null||s.vz===null){s.vx=-Math.sin(s.yaw)*s.speed;s.vz=-Math.cos(s.yaw)*s.speed;}}
function grindScore(s){if(s.grind){s.combo.push(s.grind.rail.name+' 50–50');s.pending+=100+s.grindTime*80;s.grind=null;s.grindTime=0;}}
function beginAir(s,vy,name){s.state='air';s.vy=vy;s.airTime=0;s.spin=0;s.slope=0;if(name){s.combo.push(name);s.pending+=65;}s.events.push({type:'pop'});}
export function popSkater(s,kind='ollie'){
 if(!s.active||s.stun>0)return;velocity(s);
 if(s.state==='air'){if(kind!=='ollie'&&!s.flip&&s.airTime<1.3){s.flip=kind;s.flipTime=0;}return;}
 grindScore(s);beginAir(s,SKATE.minPop+clamp(s.charge/SKATE.charge,0,1)*(SKATE.maxPop-SKATE.minPop));s.charge=0;s.charging=false;s.grindCooldown=.25;s.flip=kind==='ollie'?null:kind;s.flipTime=0;s.combo.push('Ollie');s.pending+=25;
}
function bail(s){s.combo=[];s.pending=0;s.stun=.5;s.flow=0;s.events.push({type:'bail'});}
function land(s){
 const travel=Math.atan2(-s.vx,-s.vz),error=Math.min(Math.abs(angle(s.yaw-travel)),Math.abs(angle(s.yaw-travel-Math.PI)));
 if((s.flip&&s.flipTime<.30)||(Math.hypot(s.vx,s.vz)>3&&error>.72)){bail(s);s.speed*=.4;s.vx*=.4;s.vz*=.4;}
 else{const turns=Math.floor((Math.abs(s.spin)+.20)/Math.PI);if(turns){s.combo.push(`${turns*180}°`);s.pending+=turns===1?80:turns*130;}
  if(s.combo.length){const points=Math.round(s.pending*Math.min(4,s.combo.length));s.events.push({type:'land',name:s.combo.filter((n,i,a)=>n!=='Ollie'||a.length===1).join(' + '),points});s.totalTricks++;s.flow=Math.min(1,s.flow+.2);}}
 s.speed=-(s.vx*Math.sin(s.yaw)+s.vz*Math.cos(s.yaw));s.combo=[];s.pending=0;s.flip=null;s.spin=0;s.vy=0;s.state='ride';s.grind=null;s.grindTime=0;
}
export function updateSkater(s,dt,input,nav,terrainAt,course){
 if(!s.active||dt<=0)return;velocity(s);s.stun=Math.max(0,s.stun-dt);s.grindCooldown=Math.max(0,s.grindCooldown-dt);s.flow=Math.max(0,s.flow-dt*.025);
 const count=Math.ceil(dt*120),h=dt/count;
 for(let k=0;k<count;k++){
  const old=course.support(s.x,s.z),ground=terrainAt(s.x,s.z)+old.height;
  if(s.stun<=0){
   if(s.state!=='grind'){const turn=-input.steer*(s.state==='air'?5.2:2.8-clamp(Math.abs(s.speed)/12,0,1)*1.0)*h-(input.look||0)/count;s.yaw+=turn;if(s.state==='air')s.spin+=turn;}
   if(s.state==='ride'){
    if(input.forward>.1)s.speed+=input.forward*7*h;
    else if(input.forward<-.1){if(s.speed>0)s.speed=Math.max(0,s.speed-13*h);else s.speed=Math.max(-2.5,s.speed-4*h);}
    else s.speed=Math.sign(s.speed)*Math.max(0,Math.abs(s.speed)-.24*h);
    // Gravity along a curved transition: pump downhill, lose speed uphill.
    const dz=.08,gz=(course.support(s.x,s.z+dz).height-course.support(s.x,s.z-dz).height)/(dz*2);
    if(old.kind==='halfpipe')s.speed+=Math.cos(s.yaw)*gz*SKATE.gravity/Math.sqrt(1+gz*gz)*h;
    s.speed=clamp(s.speed,-SKATE.maxSpeed-1,SKATE.maxSpeed+s.flow*1.8);
    const grip=1-Math.exp(-SKATE.grip*h);s.vx+=(-Math.sin(s.yaw)*s.speed-s.vx)*grip;s.vz+=(-Math.cos(s.yaw)*s.speed/(old.kind==='halfpipe'?Math.sqrt(1+gz*gz):1)-s.vz)*grip;
   }
  }else{s.speed*=Math.exp(-7*h);s.vx*=Math.exp(-7*h);s.vz*=Math.exp(-7*h);}
  if(input.charge&&s.state!=='air'){s.charging=true;s.charge=Math.min(SKATE.charge,s.charge+h);}else if(s.charging)popSkater(s);
  if(s.state==='grind'){
   const g=s.grind;s.z+=g.dir*Math.max(3.3,Math.abs(s.speed))*h;s.x=g.rail.x;s.y=terrainAt(s.x,s.z)+g.rail.height;s.grindTime+=h;s.speed=Math.max(3,Math.abs(s.speed)-h*.35);s.yaw=g.dir<0?0:Math.PI;s.vx=0;s.vz=g.dir*s.speed;
   if(s.z<g.rail.z0||s.z>g.rail.z1){grindScore(s);beginAir(s,1.6);s.grindCooldown=.6;s.events.push({type:'grindEnd'});}continue;
  }
  const ox=s.x,oz=s.z,dx=s.vx*h,dz=s.vz*h;nav.move(s,dx,dz,.3);
  let support=course.support(s.x,s.z),floor=terrainAt(s.x,s.z)+support.height;
  // Vertical edges cannot teleport the rider onto the side of a tall ramp.
  if(support.feature!==old.feature&&floor>Math.max(s.y,ground)+.27){s.x=ox;s.z=oz;support=old;floor=ground;}
  const moved=Math.hypot(s.x-ox,s.z-oz),expected=Math.hypot(dx,dz);
  if(expected>.015&&moved<expected*.3){if(Math.abs(s.speed)>5.8&&s.stun<=0)bail(s);s.speed*=.7;s.vx*=.7;s.vz*=.7;}
  if(s.state==='ride'){
   const rise=floor-ground;s.slope=moved>.001?Math.atan2(rise,moved)*Math.sign(s.speed):s.slope*.95;s.y=floor;
   if(old.kind==='halfpipe'&&old.feature&&Math.abs(s.z-old.feature.z)>old.feature.length/2-.12&&Math.abs(s.speed)>4&&(s.z-old.feature.z)*s.vz>0){const side=Math.sign(s.z-old.feature.z);s.y=terrainAt(s.x,s.z)+old.feature.height+.03;s.vz=-side*1.25;beginAir(s,Math.max(5.5,Math.abs(s.speed)*.9),old.name+' air');}
   else if(old.kind==='bank'&&old.height>.55&&support.height<old.height&&Math.abs(s.speed)>4&&!s.charging){s.y=ground+.025;beginAir(s,4.3+Math.abs(s.speed)*.18,old.name+' transfer');}
  }else{
   s.airTime+=h;s.vy-=SKATE.gravity*h;s.y+=s.vy*h;
   // Preserve travel momentum in the air. Board rotation affects landing, not flight.
   if(s.flip){s.flipTime+=h;if(s.flipTime>=SKATE.flipTime){s.combo.push(s.flip==='kickflip'?'Kickflip':s.flip==='heelflip'?'Heelflip':'Pop shove-it');s.pending+=s.flip==='shove'?85:110;s.flip=null;s.flipTime=0;}}
   if(s.vy<0&&s.y-floor<.8&&Math.abs(input.steer)<.15&&Math.hypot(s.vx,s.vz)>2){const travel=Math.atan2(-s.vx,-s.vz),a=angle(travel-s.yaw),b=angle(travel+Math.PI-s.yaw),fix=Math.abs(a)<Math.abs(b)?a:b;if(Math.abs(fix)<1)s.yaw+=clamp(fix,-6*h,6*h);}
   if(s.vy<=1&&s.grindCooldown<=0&&Math.hypot(s.vx,s.vz)>2)for(const rail of course.rails){if(Math.abs(s.x-rail.x)<.62&&s.z>rail.z0-.3&&s.z<rail.z1+.3&&Math.abs(s.y-terrainAt(s.x,s.z)-rail.height)<.4&&Math.abs(Math.sin(s.yaw))<.5&&Math.abs(s.vx)<Math.abs(s.vz)*.6){s.grind={rail,dir:s.vz<0?-1:1};s.state='grind';s.grindTime=0;s.flip=null;s.x=rail.x;s.events.push({type:'grindStart',name:rail.name});break;}}
   if(s.state==='air'&&s.y<=floor&&s.vy<0){s.y=floor;land(s);}
  }
 }
}
