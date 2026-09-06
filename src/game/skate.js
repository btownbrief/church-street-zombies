// Metres, radians, +x east / +z south. Physics stays independent of rendering.
// Feel is tuned to match Church Street Skate: impulse pushes, big charged air that
// scales with speed, stick-driven spins that ramp up, a landing assist that finishes a
// rotation for you, and a backflip on a fresh press of back while airborne.
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
export const SKATE={gravity:17,minPop:4.6,maxPop:11.5,charge:.45,railSnapX:.8,railSnapY:.5,railMagnet:1.2,flipTime:.42,maxSpeed:14,flowSpeed:5,grip:7,
 pushImpulse:4.2,pushInterval:.42,spinRate:6.5,spinResponse:14,landAssistHeight:1.4,landAssistRate:6,landTolerance:.6,landToleranceBigAir:.35,backflipTime:.62};
export function createSkater(){return{active:false,x:0,z:0,y:0,yaw:0,speed:0,vx:null,vz:null,vy:0,state:'ride',charge:0,charging:false,airTime:0,flip:null,flipTime:0,spin:0,spinVel:0,grind:null,grindTime:0,grindCooldown:0,combo:[],pending:0,stun:0,flow:0,slope:0,events:[],totalTricks:0,pushTimer:0,pushAnim:0,backflip:null,backHeld:false,lean:0};}
function velocity(s){if(s.vx===null||s.vz===null){s.vx=-Math.sin(s.yaw)*s.speed;s.vz=-Math.cos(s.yaw)*s.speed;}}
function grindScore(s){if(s.grind){s.combo.push(s.grind.rail.name+' 50–50');s.pending+=100+s.grindTime*80;s.grind=null;s.grindTime=0;}}
function beginAir(s,vy,name){s.state='air';s.vy=vy;s.airTime=0;s.spin=0;s.spinVel=0;s.slope=0;s.backflip=null;if(name){s.combo.push(name);s.pending+=65;}s.events.push({type:'pop',vy});}
// Rolling fast loads the tail harder: +30% pop at the speed cap, like the skate game.
function popSpeed(s,vy){return vy*(1+.3*clamp(Math.hypot(s.vx,s.vz)/SKATE.maxSpeed,0,1));}
export function popSkater(s,kind='ollie'){
 if(!s.active||s.stun>0)return;velocity(s);
 if(s.state==='air'){if(kind!=='ollie'&&!s.flip&&s.airTime<1.3){s.flip=kind;s.flipTime=0;}return;}
 // A quick tap is a small hop (eased charge curve); a full hold is the big pop.
 grindScore(s);beginAir(s,popSpeed(s,SKATE.minPop+clamp(s.charge/SKATE.charge,0,1)**2*(SKATE.maxPop-SKATE.minPop)));s.charge=0;s.charging=false;s.grindCooldown=.25;s.flip=kind==='ollie'?null:kind;s.flipTime=0;s.combo.push('Ollie');s.pending+=25;
}
function bail(s,why='obstacle'){s.combo=[];s.pending=0;s.stun=.5;s.flow=0;s.backflip=null;s.events.push({type:'bail',why});}
function land(s){
 const travel=Math.atan2(-s.vx,-s.vz),error=Math.min(Math.abs(angle(s.yaw-travel)),Math.abs(angle(s.yaw-travel-Math.PI)));
 // Big airs earn a little landing slack; sideways is still a slam.
 const tolerance=SKATE.landTolerance*(1+SKATE.landToleranceBigAir*clamp((s.airTime-.8)/1.2,0,1));
 const under=(s.flip&&s.flipTime<SKATE.flipTime*.72)||(s.backflip&&s.backflip.t<SKATE.backflipTime*.8);
 if(under||(Math.hypot(s.vx,s.vz)>3&&error>tolerance)){bail(s,under?'flip':'sideways');s.speed*=.4;s.vx*=.4;s.vz*=.4;}
 else{const turns=Math.floor((Math.abs(s.spin)+.20)/Math.PI);if(turns){s.combo.push(`${turns*180}°`);s.pending+=turns===1?80:turns===2?260:turns*300;}
  if(s.airTime>1.1){s.combo.push('Big air');s.pending+=50;}
  if(s.combo.length){const points=Math.round(s.pending*Math.min(4,s.combo.length));s.events.push({type:'land',name:s.combo.filter((n,i,a)=>n!=='Ollie'||a.length===1).join(' + '),points,airTime:s.airTime});s.totalTricks++;s.flow=Math.min(1,s.flow+.2);}}
 s.speed=-(s.vx*Math.sin(s.yaw)+s.vz*Math.cos(s.yaw));s.combo=[];s.pending=0;s.flip=null;s.backflip=null;s.spin=0;s.spinVel=0;s.vy=0;s.state='ride';s.grind=null;s.grindTime=0;s.events.push({type:'touchdown'});
}
export function updateSkater(s,dt,input,nav,terrainAt,course){
 if(!s.active||dt<=0)return;velocity(s);s.stun=Math.max(0,s.stun-dt);s.grindCooldown=Math.max(0,s.grindCooldown-dt);s.flow=Math.max(0,s.flow-dt*.025);s.pushTimer=Math.max(0,s.pushTimer-dt);s.pushAnim=Math.max(0,s.pushAnim-dt*2.2);
 const count=Math.ceil(dt*120),h=dt/count;
 for(let k=0;k<count;k++){
  const old=course.support(s.x,s.z),ground=terrainAt(s.x,s.z)+old.height;
  if(s.stun<=0){
   if(s.state==='air'){
    // Spins chase the stick instead of snapping, so a flick starts a rotation that keeps
    // going and a release lets it settle. Mouse look adds directly.
    const want=-input.steer*SKATE.spinRate;s.spinVel+=(want-s.spinVel)*(1-Math.exp(-SKATE.spinResponse*h));
    const turn=s.spinVel*h-(input.look||0)/count;s.yaw+=turn;s.spin+=turn;
    const backNow=input.forward<-.5;
    if(backNow&&!s.backHeld&&!s.backflip&&s.airTime>.08){s.backflip={t:0};s.events.push({type:'backflip'});}
    s.backHeld=backNow;
    if(s.backflip){s.backflip.t+=h;if(s.backflip.t>=SKATE.backflipTime&&!s.backflip.done){s.backflip.done=true;s.combo.push('Backflip');s.pending+=420;}}
   }else if(s.state!=='grind'){s.spinVel=0;const turn=-input.steer*(2.8-clamp(Math.abs(s.speed)/12,0,1)*1.1)*h-(input.look||0)/count;s.yaw+=turn;}
   if(s.state==='ride'){
    s.backHeld=input.forward<-.5;
    const maxPush=SKATE.maxSpeed+s.flow*SKATE.flowSpeed;
    if(input.forward>.3&&!s.charging){
     // W pushes in the direction of travel: rolling fakie keeps rolling fakie.
     const dir=s.speed<-.5?-1:1,eff=s.speed*dir;
     if(s.pushTimer<=0&&eff<maxPush){const scale=clamp(1-eff/maxPush,.15,1)*input.forward;s.speed+=dir*SKATE.pushImpulse*(.5+.7*scale);s.pushTimer=SKATE.pushInterval;s.pushAnim=1;s.events.push({type:'push'});}
    }
    else if(input.forward<-.3){if(s.speed>.6)s.speed=Math.max(0,s.speed-13*h);else s.speed=Math.max(-4.4,s.speed-4.4*h);}
    s.speed=Math.sign(s.speed)*Math.max(0,Math.abs(s.speed)-(s.charging?.08:.24)*h);
    // Gravity along a curved transition: pump downhill, lose speed uphill.
    const dz=.08,gz=(course.support(s.x,s.z+dz).height-course.support(s.x,s.z-dz).height)/(dz*2);
    if(old.kind==='halfpipe')s.speed+=Math.cos(s.yaw)*gz*SKATE.gravity*(s.charging?1.5:1)/Math.sqrt(1+gz*gz)*h;
    s.speed=clamp(s.speed,-maxPush-1,maxPush);
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
  if(expected>.015&&moved<expected*.3){if(Math.abs(s.speed)>5.8&&s.stun<=0)bail(s,'wall');s.speed*=.7;s.vx*=.7;s.vz*=.7;}
  if(s.state==='ride'){
   const rise=floor-ground;s.slope=moved>.001?Math.atan2(rise,moved)*Math.sign(s.speed):s.slope*.95;s.y=floor;
   if(old.kind==='halfpipe'&&old.feature&&Math.abs(s.z-old.feature.z)>old.feature.length/2-.12&&Math.abs(s.speed)>4&&(s.z-old.feature.z)*s.vz>0){const side=Math.sign(s.z-old.feature.z);s.y=terrainAt(s.x,s.z)+old.feature.height+.03;s.vz=-side*1.25;beginAir(s,Math.max(6,Math.abs(s.speed)*1.05),old.name+' air');}
   else if(old.kind==='bank'&&old.height>.55&&support.height<old.height&&Math.abs(s.speed)>4&&!s.charging){s.y=ground+.025;beginAir(s,4.5+Math.abs(s.speed)*.3,old.name+' transfer');}
  }else{
   s.airTime+=h;s.vy-=SKATE.gravity*h;s.y+=s.vy*h;
   // Preserve travel momentum in the air. Board rotation affects landing, not flight.
   if(s.flip){s.flipTime+=h;if(s.flipTime>=SKATE.flipTime){s.combo.push(s.flip==='kickflip'?'Kickflip':s.flip==='heelflip'?'Heelflip':'Pop shove-it');s.pending+=s.flip==='shove'?85:110;s.flip=null;s.flipTime=0;}}
   // Landing assist: in the last metre and a half the board finishes its rotation toward
   // the travel axis (either end). Holding steer means you still mean it, so it backs off.
   if(s.vy<0&&s.y-floor<SKATE.landAssistHeight&&Math.hypot(s.vx,s.vz)>1){const travel=Math.atan2(-s.vx,-s.vz),a=angle(travel-s.yaw),b=angle(travel+Math.PI-s.yaw),fix=Math.abs(a)<Math.abs(b)?a:b,rate=Math.abs(input.steer)>.3?2.5:SKATE.landAssistRate;const step=clamp(fix,-rate*h,rate*h);s.yaw+=step;s.spin+=step;}
   // Rails pull the board in: within about a metre sideways the flight drifts onto the
   // rail line, and the catch window covers both the rising and falling side of a hop.
   if(s.grindCooldown<=0&&Math.hypot(s.vx,s.vz)>2&&Math.abs(Math.sin(s.yaw))<.5)for(const rail of course.rails){const off=rail.x-s.x;if(Math.abs(off)<SKATE.railMagnet&&Math.abs(off)>.02&&s.z>rail.z0-1.5&&s.z<rail.z1+.3&&s.y-terrainAt(s.x,s.z)>rail.height-.6){s.x+=clamp(off,-2.6*h,2.6*h);}}
   if(s.vy<=2&&s.grindCooldown<=0&&Math.hypot(s.vx,s.vz)>2)for(const rail of course.rails){if(Math.abs(s.x-rail.x)<SKATE.railSnapX&&s.z>rail.z0-.3&&s.z<rail.z1+.3&&Math.abs(s.y-terrainAt(s.x,s.z)-rail.height)<SKATE.railSnapY&&Math.abs(Math.sin(s.yaw))<.5&&Math.abs(s.vx)<Math.abs(s.vz)*.6){s.grind={rail,dir:s.vz<0?-1:1};s.state='grind';s.grindTime=0;s.flip=null;s.backflip=null;s.x=rail.x;s.events.push({type:'grindStart',name:rail.name});break;}}
   if(s.state==='air'&&s.y<=floor&&s.vy<0){s.y=floor;land(s);}
  }
 }
 s.lean+=((s.state==='air'?.3:1)*input.steer*clamp(Math.abs(s.speed)/6,.2,1)-s.lean)*(1-Math.exp(-8*dt));
}
