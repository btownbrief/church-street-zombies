// Compact-street skating inspired by Church Street Skate's ride / air / grind
// states and charged-pop controls. Reimplemented for this PlayCanvas world.
// Metres, radians, +x east / +z south. No renderer or DOM dependencies.
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function createSkater(){return{active:false,x:0,z:0,y:0,yaw:0,speed:0,vy:0,state:'ride',charge:0,charging:false,airTime:0,flip:null,flipTime:0,spin:0,grind:null,grindTime:0,grindCooldown:0,combo:[],pending:0,stun:0,flow:0,events:[],totalTricks:0};}
export function popSkater(s,kind='ollie'){
 if(!s.active||s.stun>0)return;
 if(s.state==='air'){if(kind!=='ollie'&&!s.flip&&s.airTime<.65){s.flip=kind;s.flipTime=0;}return;}
 s.vy=5.5+clamp(s.charge/.45,0,1)*2.2;s.charge=0;s.charging=false;s.state='air';s.airTime=0;s.grind=null;s.grindCooldown=.25;s.flip=kind==='ollie'?null:kind;s.flipTime=0;s.combo.push('Ollie');s.pending+=25;s.events.push({type:'pop'});
}
function land(s){
 if(s.flip&&s.flipTime<.30){s.combo=[];s.pending=0;s.stun=.5;s.flow=0;s.events.push({type:'bail'});}
 else if(s.combo.length){const points=Math.round(s.pending*Math.min(4,s.combo.length));s.events.push({type:'land',name:s.combo.filter((n,i,a)=>n!=='Ollie'||a.length===1).join(' + '),points});s.totalTricks++;s.flow=Math.min(1,s.flow+.2);}
 s.combo=[];s.pending=0;s.flip=null;s.spin=0;s.vy=0;s.state='ride';s.grind=null;s.grindTime=0;
}
export function updateSkater(s,dt,input,nav,terrainAt,course){
 if(!s.active)return;s.stun=Math.max(0,s.stun-dt);s.grindCooldown=Math.max(0,s.grindCooldown-dt);s.flow=Math.max(0,s.flow-dt*.025);
 const n=Math.ceil(dt/(1/90)),sub=dt/n;
 for(let k=0;k<n;k++){
 const oldSupport=course.support(s.x,s.z),ground=terrainAt(s.x,s.z)+oldSupport.height;
 if(s.stun<=0){if(s.state!=='grind')s.yaw-=input.steer*(s.state==='air'?1.1:2.7)*sub;s.yaw-=input.look*sub/dt;
 if(s.state==='ride'){if(input.forward>.1)s.speed+=input.forward*6.2*sub;else if(input.forward<-.1)s.speed=Math.max(-2.5,s.speed+input.forward*12*sub);else s.speed*=Math.exp(-.8*sub);s.speed=clamp(s.speed,-2.5,9+s.flow*1.3);}}
 else s.speed*=Math.exp(-7*sub);
 if(input.charge&&s.state!=='air'){s.charging=true;s.charge=Math.min(.45,s.charge+sub);}else if(s.charging){popSkater(s);}
 if(s.state==='grind'){
  const g=s.grind;s.z+=g.dir*Math.max(3.3,Math.abs(s.speed))*sub;s.x=g.rail.x;s.y=terrainAt(s.x,s.z)+g.rail.height;s.grindTime+=sub;s.speed=Math.max(3,s.speed-sub*.35);
  s.yaw=g.dir<0?0:Math.PI;
  if(s.z<g.rail.z0||s.z>g.rail.z1){s.combo.push(g.rail.name+' 50–50');s.pending+=100+s.grindTime*80;s.grind=null;s.state='air';s.vy=1.6;s.airTime=0;s.grindCooldown=.6;s.events.push({type:'grindEnd'});}
  continue;
 }
 const dx=-Math.sin(s.yaw)*s.speed*sub,dz=-Math.cos(s.yaw)*s.speed*sub,ox=s.x,oz=s.z;nav.move(s,dx,dz,.3);const travelled=Math.hypot(s.x-ox,s.z-oz),expected=Math.hypot(dx,dz);
 if(expected>.015&&travelled<expected*.3){if(Math.abs(s.speed)>5.8&&s.stun<=0){s.events.push({type:'bail'});s.combo=[];s.pending=0;s.stun=.5;s.flow=0;}s.speed*=.7;}
 const support=course.support(s.x,s.z),floor=terrainAt(s.x,s.z)+support.height;
 if(s.state==='ride'){
  s.y=floor;
  // Pop naturally off the outgoing shoulder of each low, two-way bank.
  if(oldSupport.height>.28&&support.height<oldSupport.height&&Math.abs(s.speed)>4&&!s.charging){s.state='air';s.y=ground+.025;s.vy=3.4+Math.abs(s.speed)*.14;s.airTime=0;s.combo.push(oldSupport.name+' transfer');s.pending+=65;s.events.push({type:'pop'});}
 }else{
  s.airTime+=sub;s.vy-=15*sub;s.y+=s.vy*sub;
  if(s.flip){s.flipTime+=sub;if(s.flipTime>=.43){const name=s.flip==='kickflip'?'Kickflip':s.flip==='heelflip'?'Heelflip':'Pop shove-it';s.combo.push(name);s.pending+=s.flip==='shove'?85:110;s.flip=null;s.flipTime=0;}}
  if(s.vy<=1&&s.grindCooldown<=0&&Math.abs(s.speed)>2){for(const rail of course.rails){if(Math.abs(s.x-rail.x)<.62&&s.z>rail.z0-.3&&s.z<rail.z1+.3&&Math.abs(s.y-terrainAt(s.x,s.z)-rail.height)<.45&&Math.abs(Math.sin(s.yaw))<.5){s.grind={rail,dir:Math.cos(s.yaw)>0?-1:1};s.state='grind';s.grindTime=0;s.flip=null;s.x=rail.x;s.events.push({type:'grindStart',name:rail.name});break;}}}
  if(s.state==='air'&&s.y<=floor&&s.vy<0){s.y=floor;land(s);}
 }
 }
}
