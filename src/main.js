import * as pc from 'playcanvas';
import {buildWorld} from './world.js';
import {createNavigation,waveConfig,raySphere} from './game/navigation.js';
import {createModels} from './game/models.js';
import {GameAudio} from './game/audio.js';
import {createInput} from './game/input.js';
import {createSkater,updateSkater,popSkater} from './game/skate.js';
import {buildSkateCourse,buildRider} from './game/skate-course.js';
import {enemyType,enemyStats,scoreMultiplier} from './game/encounters.js';
import {createCombatKit} from './game/combat-kit.js';
import {createYeet} from './game/yeet.js';
import {createYeetVisuals} from './game/yeet-visuals.js';
import {createRunner,runnerAction,updateRunner,runnerReward} from './game/runner.js';
import {createRunnerScene} from './game/runner-scene.js';

const $=s=>document.querySelector(s),canvas=$('#world'),clamp=pc.math.clamp;
const rad=Math.PI/180, audio=new GameAudio();
const qaMode=import.meta.env.DEV&&new URLSearchParams(location.search).has('qa');
const storageKey=qaMode?'church-street-last-light-qa-best':'church-street-last-light-best';
let app,world,nav,arenaNav,streetNav,course,rider,models,input,camera,sun,kit,yeet,yeetVisuals;
let shakeTime=0,runner=createRunner(),runnerScene,runnerReturn=null,runnerPlayed=false,runnerBest=0,runnerCoinSound=0;
const runnerStorageKey=storageKey+'-runner';
try{runnerBest=Math.max(0,Number(localStorage.getItem(runnerStorageKey))||0);}catch{}
let skate=createSkater(),lastHudSkate=null,skateCamYaw=0,skateCam={x:0,y:0,z:0,lx:0,ly:0,lz:0,dist:5.2,first:true};
// Slow-motion beats for YEET launches and dominoes. Real time keeps HUD timers honest.
let timeScale=1,slowTime=0,fovPunch=0,sprinting=false,aimStick=1;
let phase='loading',beforePause='wave',wave=0,score=0,best=0,kills=0,headshots=0,elapsed=0;
let player={x:0,z:80,health:100,maxHealth:100,stamina:100},yaw=0,pitch=0;
let zombies=[],pickups=[],corpses=[],spawned=0,spawnClock=0,waveClock=0,restClock=0,flowClock=0;
let cooldown=0,reloadTime=0,reloadDuration=0,recoil=0,flashTime=0,hurtTime=0,invulnerable=0,hitTime=0,comboTime=0,combo=0,toastTime=0,groanClock=4,footClock=0,hudClock=0;
let weapon='pistol',shotgunUnlocked=false,damageMult=1,reloadMult=1,speedMult=1,staminaMult=1;
let mags={pistol:12,shotgun:6},reserve={pistol:72,shotgun:18},capacity={pistol:12,shotgun:6};
let visitedSupplies=new Set(),targetStation=0,fps=60,frameSum=0,frameCount=0,shotCount=0,lowGraphics=false;
const stations=[{z:78,name:'BIG JOE & THE MEETING HOUSE'},{z:160,name:'CHERRY STREET'},{z:276,name:'BANK STREET'},{z:392,name:'COLLEGE STREET'},{z:460,name:'CITY HALL'}];
try{best=Math.max(0,Number(localStorage.getItem(storageKey))||0);}catch{}
$('#menu-best').textContent=String(best).padStart(5,'0');
function active(){return phase==='wave'||phase==='rest'||phase==='runner';}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');toastTime=3.2;}
function slowMo(scale,seconds){timeScale=Math.min(timeScale,scale);slowTime=Math.max(slowTime,seconds);}
function unlock(){if(document.pointerLockElement)document.exitPointerLock();input?.reset();}
function showPhase(next){phase=next;document.body.classList.toggle('playing',['wave','rest','runner','runner-result','paused','upgrade'].includes(phase));$('#menu').hidden=phase!=='menu';$('#hud').hidden=!['wave','rest','runner','runner-result','paused','upgrade'].includes(phase);$('#pause').hidden=!active();$('#touch').hidden=!active()||!input?.touch||phase==='runner';$('#runner-hud').hidden=phase!=='runner'&&!(phase==='paused'&&beforePause==='runner');$('#runner-results').hidden=phase!=='runner-result';if(phase==='runner'||phase==='runner-result'||phase==='paused'&&beforePause==='runner')$('#hud').hidden=true;$('#upgrade').hidden=phase!=='upgrade';$('#pause-screen').hidden=phase!=='paused';$('#end-screen').hidden=!['dead','won'].includes(phase);if(!active())unlock();}
function saveBest(){if(score>best){best=score;try{localStorage.setItem(storageKey,String(best));}catch{}}}
function resetRun(){
  runner=createRunner();runnerReturn=null;runnerPlayed=false;runnerScene.clear();runnerScene.entrance.enabled=runnerScene.lapPortal.enabled=false;course.root.enabled=true;document.body.classList.remove('running');rider.board.enabled=true;
  yeet.reset();kit.reset();
  skate=createSkater();rider.root.enabled=false;document.body.classList.remove('skating');timeScale=1;slowTime=0;fovPunch=0;sprinting=false;document.body.classList.remove('sprinting');
  for(const z of zombies)z.root.destroy();for(const c of corpses)c.root.destroy();for(const p of pickups)p.root.destroy();zombies=[];corpses=[];pickups=[];
  player={x:0,z:80,health:100,maxHealth:100,stamina:100};yaw=0;pitch=0;wave=score=kills=headshots=elapsed=shotCount=0;combo=comboTime=0;cooldown=reloadTime=recoil=hurtTime=invulnerable=hitTime=0;
  damageMult=reloadMult=speedMult=staminaMult=1;shotgunUnlocked=false;weapon='pistol';capacity={pistol:12,shotgun:6};mags={pistol:12,shotgun:6};reserve={pistol:72,shotgun:18};visitedSupplies=new Set();targetStation=0;models.beacon.enabled=false;input.reset();models.pistol.enabled=true;models.shotgun.enabled=false;models.gunRoot.enabled=true;nav.update(player.x,player.z);audio.init();for(const st of stations)for(const side of [-1,1])kit.place('barrel',{x:side*3.8,z:st.z+side*12,yaw:0});startWave();input.lock();
  toast(input.touch?'Left thumb moves · right thumb aims · hold FIRE':'Click to aim · hold fire · R to reload · headshots do double damage');
}
function startWave(){runnerScene.entrance.enabled=false;if(wave>=10)return finish(true);wave++;spawned=0;spawnClock=1.7;waveClock=0;flowClock=0;showPhase('wave');audio.play('wave');toast(wave===2?'WAVE 02 · Green spitters attack from range.':wave===3?'WAVE 03 · Brutes incoming. Use explosives.':`WAVE ${String(wave).padStart(2,'0')} · ${waveConfig(wave).count} incoming`);}
function changeWeapon(next){if(!active()||phase==='runner')return;if(skate.active){popSkater(skate,'shove');return;}if(!next)next=weapon==='pistol'?'shotgun':'pistol';if(next==='shotgun'&&!shotgunUnlocked){toast('Unlock the shotgun after wave 1.');return;}if(next===weapon)return;weapon=next;reloadTime=0;cooldown=.25;models.pistol.enabled=weapon==='pistol';models.shotgun.enabled=weapon==='shotgun';audio.play('ready');}
function reload(){if(phase==='runner')return;if(skate.active&&active()){popSkater(skate,'kickflip');return;}if(!active()||reloadTime>0||mags[weapon]>=capacity[weapon])return;if(reserve[weapon]<=0){toast('No reserve ammunition. Look for green supply cases.');return;}reloadDuration=(weapon==='pistol'?1.35:2.05)*reloadMult;reloadTime=reloadDuration;audio.play('reload');}
function pause(){if(active()){yeet.cancel();skate.charging=false;skate.charge=0;beforePause=phase;showPhase('paused');}else if(phase==='paused')resume();}
function resume(){if(phase!=='paused')return;audio.init();showPhase(beforePause);if(beforePause!=='runner')input.lock();}
function mute(){audio.mute(!audio.muted);$('#sound').textContent=$('#sound-pause').textContent=audio.muted?'SOUND OFF':'SOUND ON';$('#sound').setAttribute('aria-label',audio.muted?'Enable audio':'Mute audio');}
function finish(won){saveBest();showPhase(won?'won':'dead');audio.play(won?'clear':'hurt');$('#end-eyebrow').textContent=won?'MORNING COMES TO BURLINGTON':'BURLINGTON WILL REMEMBER';$('#end-title').textContent=won?'You held the street.':'The street got you.';$('#end-copy').textContent=won?'Ten waves survived. The city gets another sunrise.':'One more try. You know the way now.';$('#end-score').textContent=score.toLocaleString();$('#end-best').textContent=best.toLocaleString();$('#end-wave').textContent=wave+'/10';$('#end-detail').textContent=`${kills} zombies stopped · ${headshots} headshots · ${Math.floor(elapsed/60)}m ${Math.floor(elapsed%60)}s survived`;}
const upgrades=[
 {id:'power',symbol:'↗',title:'Stopping power',description:'+20% damage with both weapons.',apply:()=>damageMult+=.20},
 {id:'reload',symbol:'↻',title:'Quick hands',description:'Reload 18% faster. Keep the pressure on.',apply:()=>reloadMult=Math.max(.45,reloadMult*.82)},
 {id:'health',symbol:'✚',title:'Vermont tough',description:'+25 maximum health. Fully heal now.',apply:()=>{player.maxHealth+=25;player.health=player.maxHealth;}},
 {id:'capacity',symbol:'▥',title:'Extended magazines',description:'+4 pistol rounds and +2 shotgun shells per load.',apply:()=>{capacity.pistol+=4;capacity.shotgun+=2;mags={...capacity};}},
 {id:'speed',symbol:'»',title:'Second wind',description:'+10% movement speed. Sprint drains 20% slower.',apply:()=>{speedMult=Math.min(1.4,speedMult+.1);staminaMult*=.8;}},
 {id:'shotgun',symbol:'ϟ',title:'The street sweeper',description:'Unlock a pump shotgun. Devastating up close.',apply:()=>{shotgunUnlocked=true;reserve.shotgun+=24;weapon='shotgun';models.pistol.enabled=false;models.shotgun.enabled=true;}}
];
function clearWave(){
  if(wave===10){score+=1500;finish(true);return;}
  kit.replenish();score+=250+wave*25;saveBest();audio.play('clear');player.health=Math.min(player.maxHealth,player.health+25);reserve.pistol=Math.min(192,reserve.pistol+36);reserve.shotgun=Math.min(60,reserve.shotgun+12);mags={...capacity};reloadTime=0;
  $('#clear-label').textContent=`WAVE ${String(wave).padStart(2,'0')} CLEAR · +${250+wave*25} POINTS`;
  const options=upgrades.filter(u=>u.id!=='shotgun');const offset=(wave-1)%options.length;const choices=[options[offset],options[(offset+1)%options.length],options[(offset+2)%options.length]];
  if(wave>=1&&!shotgunUnlocked)choices[0]=upgrades.find(u=>u.id==='shotgun');
  $('#upgrade-cards').replaceChildren();for(const u of choices){const button=document.createElement('button');button.innerHTML=`<span class="symbol">${u.symbol}</span><strong>${u.title}</strong><p>${u.description}</p>`;button.addEventListener('click',()=>{u.apply();startRest();});$('#upgrade-cards').appendChild(button);}
  showPhase('upgrade');$('#upgrade-cards button').focus();
}
function startRest(){
  runnerPlayed=false;
  targetStation=Math.min(4,Math.floor(wave/2));const station=stations[targetStation];models.beacon.setPosition(0,world.terrainAt(0,station.z),station.z);models.beacon.enabled=true;restClock=18;showPhase('rest');input.lock();audio.play('pickup');toast(`Supplies at ${station.name.toLowerCase()}. Purple portal: bonus runner challenge.`);const n=nav.nearest(player.x+3,player.z-7);if(n>=0){const p=nav.coords(n);runnerScene.entrance.setPosition(p.x,world.terrainAt(p.x,p.z),p.z);runnerScene.entrance.enabled=true;}
}
function spawnPickup(x,z,kind){const n=nav.nearest(x,z);if(n<0)return;const p=nav.coords(n),root=models.pickup(kind);root.setPosition(p.x,world.terrainAt(p.x,p.z),p.z);pickups.push({x:p.x,z:p.z,root,kind,age:0});if(pickups.length>28)pickups.shift().root.destroy();}
function spawnZombie(){
 const cfg=waveConfig(wave);let point=null;
 for(let i=0;i<100;i++){const side=Math.random()<.5?-1:1,z=clamp(player.z+side*(22+Math.random()*19),9,488),b=world.walkBoundsAt(z),x=b.minX+1+Math.random()*(b.maxX-b.minX-2);if(Math.hypot(x-player.x,z-player.z)<20||!nav.clear(x,z,.5)||!arenaNav.reachable(x,z))continue;if(zombies.some(q=>Math.hypot(q.x-x,q.z-z)<1.6))continue;point={x,z};break;}
 if(!point)return false;
 addZombie(point,enemyType(wave));spawned++;return true;
}
function addZombie(point,type){const stats=enemyStats(type,wave),m=models.zombie(type);const z={...m,...point,...stats,type,runner:type==='runner',age:0,attack:1,stagger:0,seed:Math.random()*6.28,warning:1.05,spitClock:2+Math.random()*2,spitWindup:0};z.root.setLocalScale(stats.scale,stats.scale,stats.scale);z.root.setPosition(z.x,world.terrainAt(z.x,z.z)-1.7,z.z);zombies.push(z);return z;}

function sightClear(origin,direction,t){const end={x:origin.x+direction.x*t,z:origin.z+direction.z*t};return arenaNav.lineClear(origin.x,origin.z,end.x,end.z,.02);}
function fire(){
 if(!active()||phase==='runner'||skate.active||yeet.held||cooldown>0||reloadTime>0)return;
 if(mags[weapon]<=0){audio.play('empty');cooldown=.25;reload();return;}
 mags[weapon]--;shotCount++;cooldown=weapon==='pistol'?.16:.62;recoil=weapon==='pistol'?.07:.16;flashTime=.055;audio.play(weapon);
 const origin=camera.getPosition().clone(),base=camera.forward.clone();
 // Touch assistance bends a shot only slightly, to a visible target near the
 // reticle. It never auto-fires, sees through furniture, or changes mouse aim.
 if(input.touch){let selected=null,bestDot=.992;for(const z of zombies){if(z.warning>0)continue;for(const height of [1.74,1.2]){const center=new pc.Vec3(z.x,world.terrainAt(z.x,z.z)+height*(z.scale||1),z.z),dir=center.sub(origin),dist=dir.length();dir.normalize();const dot=dir.dot(base);if(dist<32&&dot>bestDot&&sightClear(origin,dir,dist)){bestDot=dot;selected=dir;}}}if(selected)base.lerp(base,selected,.75).normalize();}
 const pellets=weapon==='pistol'?1:10;let didHit=false,didHead=false,killCount=0;const damage=new Map(),equipmentDamage=new Map();
 for(let i=0;i<pellets;i++){const dir=base.clone();if(pellets>1){dir.add(camera.right.clone().mulScalar((Math.random()-.5)*.085));dir.add(camera.up.clone().mulScalar((Math.random()-.5)*.075));dir.normalize();}let closest=weapon==='pistol'?75:43,hit=null,head=false;const equipment=kit.raycast(origin,dir,closest);if(equipment&&sightClear(origin,dir,equipment.distance))closest=equipment.distance;
  for(const z of zombies){if(z.warning>0)continue;const y=z.flight?z.root.getPosition().y:world.terrainAt(z.x,z.z),scale=z.scale||1,headT=raySphere(origin,dir,{x:z.x,y:y+1.74*scale,z:z.z-.03},.25*scale);let t=Infinity;for(const cy of [.55,.95,1.26])t=Math.min(t,raySphere(origin,dir,{x:z.x,y:y+cy*scale,z:z.z},.34*scale));const isHead=headT<t;t=Math.min(t,headT);if(t<closest&&sightClear(origin,dir,t)){closest=t;hit=z;head=isHead;}}
  if(hit){didHit=true;didHead||=head;const falloff=weapon==='shotgun'?clamp(1-(closest-9)/36,.3,1):1,amount=(weapon==='pistol'?38:15)*damageMult*(head?2.15:1)*falloff;const d=damage.get(hit)||{amount:0,head:false};d.amount+=amount;d.head||=head;damage.set(hit,d);models.burst(origin.x+dir.x*closest,origin.y+dir.y*closest,origin.z+dir.z*closest,head);}else if(equipment&&closest===equipment.distance){equipmentDamage.set(equipment.item,(equipmentDamage.get(equipment.item)||0)+(weapon==='pistol'?38:15));didHit=true;}
 }
 for(const[o,amount]of equipmentDamage)kit.hit(o,amount);
 for(const[z,d]of damage){if(!zombies.includes(z))continue;z.health-=d.amount;z.stagger=.16;z.body.setLocalEulerAngles(-7,0,4);if(z.health<=0){killCount++;kill(z,d.head);}}
 if(didHit){audio.play(didHead?'head':'hit');hitTime=.18;$('#hitmarker').style.color=didHead?'#ffdc83':'#d8f87d';$('#combat-text').textContent=killCount?(didHead?'HEADSHOT':'STOPPED')+` +${killCount*(didHead?150:100)}`:(didHead?'HEADSHOT':'HIT');}
 pitch=clamp(pitch+(weapon==='pistol'?.65:1.45),-74,74);
 if(mags[weapon]===0&&reserve[weapon]>0)setTimeout(()=>{if(active()&&mags[weapon]===0)reload();},300);
}
function kill(z,head){
 const index=zombies.indexOf(z);if(index<0)return;zombies.splice(index,1);kills++;if(head)headshots++;combo=comboTime>0?combo+1:1;comboTime=5;score+=(head?150:100)*scoreMultiplier(combo);audio.play('kill');corpses.push({root:z.root,time:0,y:z.root.getPosition().y,yaw:z.root.getEulerAngles().y});if(corpses.length>16)corpses.shift().root.destroy();
 if(kills%3===0)spawnPickup(z.x,z.z,'ammo');else if(kills%7===0||player.health<40&&Math.random()<.3)spawnPickup(z.x,z.z,'med');
}
function yeetTargets(){return [...zombies,...kit.items.filter(o=>o.kind==='barrel')];}
function yeetVisible(x,z,ex,ez,target){if(target?.kind==='barrel'){const d=Math.hypot(ex-x,ez-z)||1;ex-=(ex-x)/d*.46;ez-=(ez-z)/d*.46;}return nav.lineClear(x,z,ex,ez,.05);}
function damageEnemy(z,amount){if(!zombies.includes(z))return;z.health-=amount;z.stagger=Math.max(z.stagger,.18);models.burst(z.x,world.terrainAt(z.x,z.z)+1.1,z.z,false);if(z.health<=0)kill(z,false);hitTime=.18;}
function equipmentAction(kind){if(!active()||phase==='runner'||skate.active)return;if(kind==='grenade')kit.throwGrenade(camera.getPosition(),camera.forward);else kit.place(kind);}
function hurt(amount){if(invulnerable>0||!active())return;player.health=Math.max(0,player.health-amount);hurtTime=.45;invulnerable=.75;audio.play('hurt');if(navigator.vibrate&&input.touch)navigator.vibrate(35);if(player.health<=0)finish(false);}
function toggleSkate(){
 if(!active()||phase==='runner')return;yeet.cancel();
 if(skate.active){
  if(skate.state==='air'){toast('Land first, then hop off.');return;}
  const n=nav.nearest(player.x,player.z);if(n<0)return;const safe=nav.coords(n);player.x=safe.x;player.z=safe.z;yaw=skate.yaw/rad;pitch=0;skate.active=false;rider.root.enabled=false;models.gunRoot.enabled=true;cooldown=.25;toast('ON FOOT · Weapons ready');
 }else{
  skate=createSkater();skate.active=true;skate.x=player.x;skate.z=player.z;skate.y=world.terrainAt(player.x,player.z);skate.yaw=yaw*rad;skateCamYaw=skate.yaw;skateCam.first=true;reloadTime=0;rider.root.enabled=true;models.gunRoot.enabled=false;toast(input.touch?'SKATING · Hold OLLIE, release to pop · FLIP auto-pops':'SKATING · W push · S brake · A/D carve · Space ollie · J/K/L tricks');
 }
 input.reset();document.body.classList.toggle('skating',skate.active);updateHud();
}
function updateSkatePlayer(dt){
 const forward=(input.keys.has('KeyW')||input.keys.has('ArrowUp')?1:0)-(input.keys.has('KeyS')||input.keys.has('ArrowDown')?1:0)+input.stickY;
 const steer=(input.keys.has('KeyD')||input.keys.has('ArrowRight')?1:0)-(input.keys.has('KeyA')||input.keys.has('ArrowLeft')?1:0)+input.stickX;
 updateSkater(skate,dt,{forward:clamp(forward,-1,1),steer:clamp(steer,-1,1),charge:input.fire||input.keys.has('Space'),look:input.mx*rad},streetNav,world.terrainAt,course);input.mx=input.my=0;
 player.x=skate.x;player.z=skate.z;yaw=skate.yaw/rad;pitch=0;player.stamina=Math.min(100,player.stamina+dt*18);
 for(const e of skate.events){if(e.type==='pop'){audio.hiss(.08,.15,1100);audio.tone(180,280,.10,.12);if(e.vy>8)fovPunch=Math.max(fovPunch,3);}if(e.type==='push')audio.hiss(.06,.1,700);if(e.type==='backflip'){audio.tone(220,440,.16,.12);toast('BACKFLIP · Land it flat');}if(e.type==='land'){score+=e.points;reserve.pistol=Math.min(192,reserve.pistol+3);audio.play('pickup');toast(`${e.name.toUpperCase()} +${e.points} · +3 ROUNDS`);shakeTime=Math.max(shakeTime,Math.min(.4,e.airTime*.2));}if(e.type==='touchdown')audio.hiss(.05,.08,500);if(e.type==='bail'){audio.play('hurt');shakeTime=Math.max(shakeTime,.5);toast(e.why==='sideways'?'SLAMMED · Land along your line':e.why==='flip'?'CAUGHT THE BOARD LATE · Combo lost':'SCRAPED IT · Combo lost. Keep rolling.');}if(e.type==='grindStart'){audio.hiss(.35,.12,2200);toast(e.name.toUpperCase()+' · 50–50 GRIND');}}
 skate.events=[];
 // Rider: lean into carves, tuck for a charge, a whole-body backflip, and a board that
 // flips or shoves under the feet.
 const y=skate.y,flipT=skate.backflip?clamp(skate.backflip.t/.62,0,1):0;rider.root.setPosition(skate.x,y,skate.z);rider.root.setEulerAngles(skate.slope/rad-flipT*360,yaw,-skate.lean*14);rider.body.setLocalPosition(0,skate.state==='air'?.09:0,0);rider.body.setLocalEulerAngles(0,0,0);rider.pose(clamp(skate.charge/.45+(skate.state==='air'?.35:0),0,1),skate.state==='ride'?skate.pushAnim*Math.sin(Math.min(1,skate.pushAnim)*Math.PI):0);rider.board.setLocalEulerAngles(skate.state==='air'?Math.sin(skate.airTime*7)*7:0,skate.flip==='shove'?skate.flipTime/.42*360:0,skate.flip&&skate.flip!=='shove'?skate.flipTime/.42*360*(skate.flip==='heelflip'?-1:1):0);
 // Camera ported from Church Street Skate: behind the direction of travel, further back
 // and wider at speed, soft vertical follow in the air so big airs stay in frame.
 const sp=Math.hypot(skate.vx||0,skate.vz||0),air=skate.state==='air';
 const travel=sp>1.2?Math.atan2(-skate.vx,-skate.vz):(Math.abs(Math.atan2(Math.sin(skate.yaw-skateCamYaw),Math.cos(skate.yaw-skateCamYaw)))<Math.PI/2?skate.yaw:skate.yaw+Math.PI);
 const yawRate=air?1.8:clamp(2+sp*.35,2,6);skateCamYaw+=Math.atan2(Math.sin(travel-skateCamYaw),Math.cos(travel-skateCamYaw))*(skateCam.first?1:1-Math.exp(-yawRate*dt));
 const dist=5.2+clamp(sp-6,0,14)*.22,height=2.1+(air?.3:0);
 const desiredX=skate.x+Math.sin(skateCamYaw)*dist,desiredZ=skate.z+Math.cos(skateCamYaw)*dist;
 let t=1,cameraFloor=y+.5;for(let k=.1;k<=1;k+=.1){const x=skate.x+(desiredX-skate.x)*k,z=skate.z+(desiredZ-skate.z)*k;if(!streetNav.clear(x,z,.12))break;t=k;cameraFloor=Math.max(cameraFloor,world.terrainAt(x,z)+course.support(x,z).height+.6);}
 skateCam.dist=skateCam.first?t*dist:skateCam.dist+(t*dist-skateCam.dist)*(1-Math.exp(-(t<1?14:3)*dt));
 const px=skate.x+Math.sin(skateCamYaw)*skateCam.dist,pz=skate.z+Math.cos(skateCamYaw)*skateCam.dist,py=Math.max(y+height*(skateCam.dist/dist)+.3,world.terrainAt(px,pz)+1,cameraFloor);
 const kxz=skateCam.first?1:1-Math.exp(-8*dt),ky=skateCam.first?1:1-Math.exp(-(air?4:9)*dt);
 skateCam.x+=(px-skateCam.x)*kxz;skateCam.z+=(pz-skateCam.z)*kxz;skateCam.y+=(py-skateCam.y)*ky;
 const la=2.4+sp*.12,lx=skate.x-Math.sin(skateCamYaw)*la,ly=y+.9+(air?.4:0),lz=skate.z-Math.cos(skateCamYaw)*la,kl=skateCam.first?1:1-Math.exp(-10*dt),kly=skateCam.first?1:1-Math.exp(-6*dt);
 skateCam.lx+=(lx-skateCam.lx)*kl;skateCam.ly+=(ly-skateCam.ly)*kly;skateCam.lz+=(lz-skateCam.lz)*kl;skateCam.first=false;
 camera.setPosition(skateCam.x,skateCam.y,skateCam.z);camera.lookAt(skateCam.lx,skateCam.ly,skateCam.lz);camera.rotateLocal(0,0,-skate.lean*2.5);
 camera.camera.fov=pc.math.lerp(camera.camera.fov,(input.touch?70:66)+clamp(sp-5,0,18)*1.2+fovPunch,dt*5);
}
function updatePlayer(dt){
 if(skate.active){updateSkatePlayer(dt);return;}

 let f=(input.keys.has('KeyW')||input.keys.has('ArrowUp')?1:0)-(input.keys.has('KeyS')||input.keys.has('ArrowDown')?1:0)+input.stickY;
 let s=(input.keys.has('KeyD')||input.keys.has('ArrowRight')?1:0)-(input.keys.has('KeyA')||input.keys.has('ArrowLeft')?1:0)+input.stickX;
 const magnitude=Math.hypot(f,s);if(magnitude>1){f/=magnitude;s/=magnitude;}yaw-=input.mx;pitch=clamp(pitch-input.my,-74,74);input.mx=input.my=0;
 // Sticky aim on touch: the reticle slows while it crosses a visible zombie, so a fast
 // swipe can stop on a target. Mouse aim is never touched.
 aimStick=1;if(input.touch){const origin=camera.getPosition(),base=camera.forward;for(const z of zombies){if(z.warning>0)continue;const dx=z.x-origin.x,dy=world.terrainAt(z.x,z.z)+1.2*(z.scale||1)-origin.y,dz=z.z-origin.z,d=Math.hypot(dx,dy,dz);if(d>30)continue;const dot=(dx*base.x+dy*base.y+dz*base.z)/d;if(dot>.985&&sightClear(origin,{x:dx/d,y:dy/d,z:dz/d},d)){aimStick=.5;break;}}}
 // Sprint: push the stick most of the way forward, or hold Shift. Stamina lasts about
 // ten seconds and needs a short breather once it empties.
 const wantSprint=(input.keys.has('ShiftLeft')||input.keys.has('ShiftRight')||input.stickY>.7)&&f>.2&&!input.fire&&reloadTime<=0;
 const sprint=wantSprint&&(sprinting?player.stamina>0:player.stamina>15);
 if(sprint&&magnitude>.1)player.stamina=Math.max(0,player.stamina-dt*10*staminaMult);else player.stamina=Math.min(100,player.stamina+dt*(wantSprint?14:26));
 if(sprint!==sprinting){sprinting=sprint;document.body.classList.toggle('sprinting',sprint);}
 const speed=(sprint?7.6:4.6)*speedMult,angle=yaw*rad;
 nav.move(player,(-Math.sin(angle)*f+Math.cos(angle)*s)*speed*dt,(-Math.cos(angle)*f-Math.sin(angle)*s)*speed*dt,.28);
 const moving=magnitude>.1;footClock-=dt;if(moving&&footClock<=0){audio.play('foot');footClock=sprint?.3:.43;}
 const bob=moving?Math.sin(elapsed*(sprint?15:10))*(sprint?.045:.025):0;camera.setPosition(player.x,world.terrainAt(player.x,player.z)+1.72+bob,player.z);camera.setEulerAngles(pitch,yaw,sprint?Math.sin(elapsed*7.5)*.6:0);
 camera.camera.fov=pc.math.lerp(camera.camera.fov,(input.touch?76:70)+(sprint?7:0)+fovPunch,dt*6);
 if(input.fire)fire();
 const reloadDip=reloadTime>0?Math.sin((1-reloadTime/reloadDuration)*Math.PI)*.27:0;
 const gunScale=input.touch?(innerWidth<innerHeight?.7:.9):1;models.gunRoot.setLocalScale(gunScale,gunScale,gunScale);
 models.gunRoot.setLocalPosition(input.touch?(innerWidth<innerHeight?.11:.21):.25,-.24-reloadDip+Math.sin(elapsed*9)*.007*(moving?1:0),-.52+recoil);
 models.gunRoot.setLocalEulerAngles(recoil*100,-reloadDip*90,reloadDip*50);
 models.flash.enabled=flashTime>0;models.flash.setLocalPosition(0,0,weapon==='pistol'?-.37:-.72);models.flash.setLocalScale(weapon==='pistol'?.11:.25,weapon==='pistol'?.11:.22,.25);
}
function updateZombies(dt){
 flowClock-=dt;if(flowClock<=0){nav.update(player.x,player.z);arenaNav.update(player.x,player.z);flowClock=.45;}
 for(const z of zombies){if(z.flight)continue;z.age+=dt;z.attack-=dt;z.stagger=Math.max(0,z.stagger-dt);if(z.warning>0){z.warning-=dt;z.root.setPosition(z.x,world.terrainAt(z.x,z.z)-Math.max(0,z.warning)/1.05*1.7,z.z);continue;}
 const dx=player.x-z.x,dz=player.z-z.z,dist=Math.hypot(dx,dz);z.root.setEulerAngles(0,Math.atan2(-dx,-dz)/rad,0);
 const wall=kit.items.find(o=>{const dx=z.x-o.x,dz=z.z-o.z;return o.kind==='barricade'?Math.abs(dx*Math.cos(o.yaw)-dz*Math.sin(o.yaw))<1.45&&Math.abs(dx*Math.sin(o.yaw)+dz*Math.cos(o.yaw))<1.05:Math.hypot(dx,dz)<1.15;});
 if(wall&&z.attack<=0){kit.hit(wall,z.type==='brute'?85:28);z.attack=.75;}
 z.spitClock-=dt;if(z.type==='spitter'&&dist<22&&dist>4&&arenaNav.lineClear(z.x,z.z,player.x,player.z,.08)){
  if(z.spitWindup>0){z.spitWindup-=dt;if(z.spitWindup<=0){kit.spit(z,player);z.spitClock=3.3;}}
  else if(z.spitClock<=0){z.spitWindup=.7;audio.play('spitWarning');}
 }else z.spitWindup=0;
 if(dist>1.18&&!(z.type==='spitter'&&dist>6&&dist<13&&arenaNav.lineClear(z.x,z.z,player.x,player.z,.08))){const routing=nav.reachable(z.x,z.z)?nav:arenaNav,d=routing.direction(z.x,z.z,player.x,player.z),len=Math.hypot(d.x,d.z);let vx=len>.02?d.x/len:0,vz=len>.02?d.z/len:0;
   for(const other of zombies){if(other===z||other.warning>0||other.flight)continue;const ox=z.x-other.x,oz=z.z-other.z,l=Math.hypot(ox,oz);if(l>.001&&l<.85){vx+=ox/l*(.85-l)*1.4;vz+=oz/l*(.85-l)*1.4;}}
   const v=Math.hypot(vx,vz);if(v>1){vx/=v;vz/=v;}const speed=z.speed*(z.stagger>0?.22:1);nav.move(z,vx*speed*dt,vz*speed*dt);
 }else if(dist<=1.18&&z.attack<=0&&(!skate.active||skate.y-world.terrainAt(player.x,player.z)<1.1)&&nav.lineClear(z.x,z.z,player.x,player.z,.04)){hurt(z.damage);z.attack=1.05;}
 z.root.setPosition(z.x,world.terrainAt(z.x,z.z),z.z);const pace=z.age*(z.runner?10:6)+z.seed,walk=dist>1.18;z.legs[0].setLocalEulerAngles(walk?Math.sin(pace)*28:0,0,0);z.legs[1].setLocalEulerAngles(walk?-Math.sin(pace)*28:0,0,0);z.arms[0].setLocalEulerAngles((z.spitWindup>0?-115:-60)+Math.sin(pace)*12,0,-8);z.arms[1].setLocalEulerAngles(-65-Math.sin(pace)*12,0,8);z.body.setLocalPosition(0,Math.sin(pace*2)*.025,0);if(!z.stagger)z.body.setLocalEulerAngles(dist<1.7?-12:0,0,Math.sin(pace)*2);
 }
 groanClock-=dt;if(groanClock<=0){const near=zombies.reduce((n,z)=>Math.min(n,Math.hypot(z.x-player.x,z.z-player.z)),50);if(near<24)audio.play('growl',1-near/30);groanClock=2+Math.random()*3;}
 for(let i=corpses.length-1;i>=0;i--){const c=corpses[i];c.time+=dt;c.root.setEulerAngles(-Math.min(88,c.time*260),c.yaw,0);if(c.time>1.8){const p=c.root.getPosition();c.root.setPosition(p.x,c.y-(c.time-1.8),p.z);}if(c.time>3.3){c.root.destroy();corpses.splice(i,1);}}
}
function updatePickups(dt){for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];p.age+=dt;p.root.setLocalEulerAngles(0,p.age*35,0);p.root.setPosition(p.x,world.terrainAt(p.x,p.z)+Math.sin(p.age*3)*.09,p.z);if(Math.hypot(p.x-player.x,p.z-player.z)<1.5){if(p.kind==='med'){player.health=Math.min(player.maxHealth,player.health+30);toast('+30 HEALTH');}else{reserve.pistol=Math.min(192,reserve.pistol+18);reserve.shotgun=Math.min(60,reserve.shotgun+6);toast('+18 ROUNDS · +6 SHELLS');}audio.play('pickup');p.root.destroy();pickups.splice(i,1);}}
 if(models.beacon.enabled){const st=stations[targetStation],d=Math.hypot(player.x,player.z-st.z);if(d<2.5&&!visitedSupplies.has(targetStation)){visitedSupplies.add(targetStation);reserve.pistol=Math.min(192,reserve.pistol+36);reserve.shotgun=Math.min(60,reserve.shotgun+12);player.health=player.maxHealth;score+=300;audio.play('pickup');toast('RALLY BONUS +300 · Fully healed · Supplies collected');models.beacon.enabled=false;}}
 // Emergency ammunition keeps a missed pickup from ending an otherwise viable run.
 if(mags.pistol+reserve.pistol===0&&(!shotgunUnlocked||mags.shotgun+reserve.shotgun===0)&&!pickups.some(p=>p.kind==='ammo'&&Math.hypot(p.x-player.x,p.z-player.z)<12)){const n=nav.nearest(player.x+2,player.z+3);if(n>=0){const p=nav.coords(n);spawnPickup(p.x,p.z,'ammo');toast('EMERGENCY AMMO · Green case nearby');}}
}
function enterRunner(){
 if(phase!=='rest'||runnerPlayed)return;const p=runnerScene.entrance.getPosition();if(Math.hypot(player.x-p.x,player.z-p.z)>3){toast('Follow the purple portal, then press E or tap ENTER.');return;}
 if(skate.active&&skate.state==='air'){toast('Land before entering the portal.');return;}
 runnerReturn={player:{...player},yaw,pitch,restClock,beacon:models.beacon.enabled,skating:skate.active};runnerPlayed=true;runner=createRunner();runner.active=true;yeet.cancel();input.reset();unlock();
 for(const o of [...zombies,...corpses,...pickups,...kit.items,...kit.projectiles])o.root.enabled=false;
 course.root.enabled=false;models.beacon.enabled=models.gunRoot.enabled=false;runnerScene.entrance.enabled=false;runnerScene.root.enabled=runnerScene.lapPortal.enabled=true;rider.root.enabled=true;rider.board.enabled=false;document.body.classList.add('running');document.body.classList.remove('skating');showPhase('runner');audio.play('pickup');toast('CHURCH ST RUNNERS · Three lanes · Two chances · Swipe to dodge');updateRunnerFrame(.001);
}
function finishRunner(){if(phase!=='runner')return;runner.active=false;const earned=runnerReward(runner);runnerBest=Math.max(runnerBest,Math.floor(runner.score));try{localStorage.setItem(runnerStorageKey,String(runnerBest));}catch{}$('#runner-result-title').textContent=runner.over?'Caught on Church Street.':'Run banked.';$('#runner-result-detail').textContent=`${Math.floor(runner.distance)}m · ${runner.coins} coins · ${Math.floor(runner.score)} runner points · Best ${runnerBest}`;$('#runner-reward').textContent=`+${earned.score} survival score · +${earned.pistol} rounds · +${earned.shotgun} shells · +${earned.health} health`;showPhase('runner-result');audio.play(runner.over?'hurt':'clear');}
function returnFromRunner(){if(!runnerReturn)return;const earned=runnerReward(runner),saved=runnerReturn;runnerReturn=null;runnerScene.clear();runnerScene.lapPortal.enabled=false;course.root.enabled=true;player={...saved.player};yaw=saved.yaw;pitch=saved.pitch;restClock=Math.max(8,saved.restClock);score+=earned.score;reserve.pistol=Math.min(192,reserve.pistol+earned.pistol);reserve.shotgun=Math.min(60,reserve.shotgun+earned.shotgun);player.health=Math.min(player.maxHealth,player.health+earned.health);saveBest();
 for(const o of [...zombies,...corpses,...pickups,...kit.items,...kit.projectiles])o.root.enabled=true;
 models.beacon.enabled=saved.beacon;document.body.classList.remove('running');rider.board.enabled=true;skate.active=false;rider.root.enabled=false;models.gunRoot.enabled=true;input.reset();showPhase('rest');if(saved.skating)toggleSkate();else input.lock();nav.update(player.x,player.z);arenaNav.update(player.x,player.z);updateHud();toast('BACK ON CHURCH STREET · Runner supplies banked');}
function updateRunnerFrame(dt){
 updateRunner(runner,dt);runnerCoinSound-=dt;for(const event of runner.events){if(event.type==='pickup'){if(event.kind!=='coin'||runnerCoinSound<=0){audio.play('pickup');runnerCoinSound=.12;}if(event.kind==='creemee')toast('MAPLE SUGAR RUSH · Fly over obstacles!');if(event.kind==='magnet')toast('COIN MAGNET · 7 SECONDS');}else if(event.type==='hit'){audio.play('hurt');toast(`${event.label} · ${event.lives?'One chance left!':'Run over'}`);}else if(event.type==='jump')audio.tone(190,360,.12,.12);else if(event.type==='slide')audio.hiss(.18,.12,800);else if(event.type==='lap'){audio.play('wave');toast(`PORTAL LAP ${event.lap+1} · Keep running!`);}}
 runner.events=[];runnerScene.update(runner);const ground=world.terrainAt(runner.x,runner.z);rider.root.enabled=runner.invulnerable<=0||Math.floor(runner.time*12)%2===0;rider.root.setPosition(runner.x,ground+runner.y-.17,runner.z);rider.root.setEulerAngles(0,0,0);rider.body.setLocalPosition(0,0,0);rider.body.setLocalEulerAngles(0,-90,0);rider.pose(0,0,runner.y>.1?0:Math.sin(runner.time*runner.speed*.8),true,runner.slide>0?1:0);
 camera.setPosition(runner.x*.28,world.terrainAt(0,runner.z+5)+3.5+runner.y*.12,runner.z+5.6);camera.lookAt(runner.x*.3,ground+1.1,runner.z-8);camera.camera.fov=76;
 $('#runner-distance').textContent=Math.floor(runner.distance)+'m';$('#runner-coins').textContent=runner.coins;$('#runner-lives').textContent=runner.lives===2?'● ●':'● ○';$('#runner-points').textContent=Math.floor(runner.score).toLocaleString();$('#runner-power').textContent=runner.flight>0?`CREEMEE FLIGHT ${runner.flight.toFixed(1)}s`:runner.magnet>0?`COIN MAGNET ${runner.magnet.toFixed(1)}s`:`LAP ${runner.lap+1} · ${Math.round(runner.speed*3.6)} KM/H`;
 $('#damage').style.opacity=runner.invulnerable>1.8?.35:0;if(runner.over)finishRunner();
}
function continueAction(){if(phase!=='rest')return;const p=runnerScene.entrance.getPosition();if(runnerScene.entrance.enabled&&Math.hypot(player.x-p.x,player.z-p.z)<3)enterRunner();else startWave();}
function updateHud(){
 const portal=runnerScene.entrance.getPosition(),portalDistance=Math.hypot(player.x-portal.x,player.z-portal.z);$('#runner-enter').hidden=phase!=='rest'||runnerPlayed;$('#runner-enter').textContent=portalDistance<3?'ENTER RUNNER PORTAL · E':`RUNNER PORTAL · ${Math.round(portalDistance)}m`;
 $('#equipment-counts').textContent=`GRENADES ${kit.stock.grenade} · WALLS ${kit.stock.barricade} · BARRELS ${kit.stock.barrel}`;$('#count-grenade').textContent=kit.stock.grenade;$('#count-barricade').textContent=kit.stock.barricade;$('#count-barrel').textContent=kit.stock.barrel;
 $('#yeet-meter').hidden=skate.active||(input.touch&&!yeet.held&&yeet.cooldown<=0);$('#yeet-label').textContent=yeet.held?'RELEASE AT THE PEAK':yeet.cooldown>0?`YEET ${yeet.cooldown.toFixed(1)}s`:input.touch?'HOLD YEET · RELEASE TO LAUNCH':'HOLD Q · RELEASE TO YEET';$('#yeet-fill').style.width=(yeet.held?yeet.power*100:yeet.cooldown>0?(1-yeet.cooldown/2.6)*100:100)+'%';
 if(lastHudSkate!==`${skate.active}:${input.touch}`){lastHudSkate=`${skate.active}:${input.touch}`;
 $('#mode-switch').textContent=(skate.active?'HOP OFF':'SKATE')+(input.touch?'':' · B');
 $('#touch-fire').innerHTML=skate.active?'↑<span>OLLIE</span>':'◎<span>FIRE</span>';
 $('#touch-fire').setAttribute('aria-label',skate.active?'Hold to charge ollie, release to jump':'Hold to fire');
 $('#touch-reload').innerHTML=skate.active?'⟳<span>FLIP</span>':'↻<span>RELOAD</span>';
 $('#touch-reload').setAttribute('aria-label',skate.active?'Kickflip':'Reload');
 $('#touch-swap').innerHTML=skate.active?'⤾<span>SHOVE</span>':'⇄<span>WEAPON</span>';
 $('#touch-swap').setAttribute('aria-label',skate.active?'Pop shove-it':'Switch weapon');
 }
 $('#skate-status').textContent=skate.active?`${Math.round(Math.abs(skate.speed)*3.6)} KM/H · ${skate.state==='grind'?'50–50 GRIND':skate.state==='air'?'AIRBORNE':'PUSH · CARVE · POP'}`:'';

 $('#health').textContent=Math.ceil(player.health);$('#health-bar').style.width=player.health/player.maxHealth*100+'%';$('#health-bar').style.background=player.health<35?'#ff7759':'#d8f87d';$('#stamina-bar').style.width=player.stamina+'%';$('#wave').textContent=String(wave).padStart(2,'0');$('#score').textContent=String(score).padStart(5,'0');$('#ammo').textContent=mags[weapon];$('#reserve').textContent=reserve[weapon];$('#weapon-name').textContent=weapon==='pistol'?'9MM · PISTOL':'12 GAUGE · STREET SWEEPER';$('#weapon-hint').textContent=reloadTime>0?'RELOADING…':shotgunUnlocked?(input.touch?'TAP ⇄ TO SWITCH':'1 PISTOL · 2 SHOTGUN'):(input.touch?'SHOTGUN: AFTER WAVE 1':'R RELOAD · SHOTGUN: AFTER WAVE 1');$('#reload-bar').style.width=reloadTime>0?(1-reloadTime/reloadDuration)*100+'%':'0%';$('#combo').textContent=combo>1&&comboTime>0?`${combo} IN A ROW · ×${scoreMultiplier(combo)}` :'';
 const z=player.z;$('#location').textContent=z<115?'MEETING HOUSE · BIG JOE':z<230?'CHERRY STREET':z<365?'BANK STREET':z<435?'COLLEGE STREET':'CITY HALL · MAIN STREET';
 if(phase==='rest'){const st=stations[targetStation],d=Math.round(Math.hypot(player.x,player.z-st.z));$('#objective-title').textContent=`NEXT WAVE IN ${Math.ceil(restClock)}s`;$('#objective-detail').textContent=`${st.name} · ${d}m ${st.z>player.z?'SOUTH ↓':'NORTH ↑'} · ${input.touch?'Tap here':'E'} to start now`;$('#remaining').textContent='A little room to breathe.';}else{$('#objective-title').textContent=wave===10?'LAST STAND · HOLD UNTIL DAWN':'HOLD THE STREET';$('#objective-detail').textContent=wave<3?'YEET close targets · grenades clear crowds · shoot red barrels':'Orange = sprinter · green = spitter · heavy = brute';$('#remaining').textContent=`${zombies.length+Math.max(0,waveConfig(wave||1).count-spawned)} remaining`;}drawRadar();
}
function drawRadar(){const c=$('#radar').getContext('2d');c.clearRect(0,0,150,150);c.fillStyle='#0b2628bb';c.beginPath();c.arc(75,75,73,0,Math.PI*2);c.fill();c.save();c.beginPath();c.arc(75,75,70,0,Math.PI*2);c.clip();c.strokeStyle='#a1c29435';for(const r of [35,70]){c.beginPath();c.arc(75,75,r,0,Math.PI*2);c.stroke();}c.strokeStyle='#d8f87d2a';c.beginPath();c.moveTo(75,75);c.lineTo(30,0);c.moveTo(75,75);c.lineTo(120,0);c.stroke();const a=yaw*rad,plot=(x,z)=>{const dx=x-player.x,dz=z-player.z;return{x:75+(dx*Math.cos(a)-dz*Math.sin(a))*1.7,y:75+(dx*Math.sin(a)+dz*Math.cos(a))*1.7};};for(const z of zombies){const p=plot(z.x,z.z);c.fillStyle=z.warning>0?'#f5d988':z.runner?'#ff8559':'#d8f87d';c.beginPath();c.arc(p.x,p.y,z.warning>0?5:3,0,Math.PI*2);c.fill();}for(const p of pickups){const q=plot(p.x,p.z);c.fillStyle='#68e4cc';c.fillRect(q.x-2,q.y-2,4,4);}if(models.beacon.enabled){const p=plot(0,stations[targetStation].z);c.fillStyle='#fff';c.fillRect(p.x-4,p.y-4,8,8);}c.fillStyle='#fff';c.beginPath();c.moveTo(75,68);c.lineTo(71,80);c.lineTo(79,80);c.fill();c.restore();
 const near=zombies.filter(z=>z.warning<=0&&Math.hypot(z.x-player.x,z.z-player.z)<9);$('#threats').replaceChildren();for(const z of near.slice(0,10)){const a=Math.atan2(z.x-player.x,-(z.z-player.z))+yaw*rad,e=document.createElement('i');e.className='threat';e.style.transform=`translate(${Math.sin(a)*85-4}px,${-Math.cos(a)*85-4}px) rotate(${a/rad}deg)`;$('#threats').appendChild(e);}
}
function graphics(){if(!app)return;const low=lowGraphics||input?.touch;app.graphicsDevice.maxPixelRatio=low?1:Math.min(devicePixelRatio||1,1.5);sun.light.castShadows=!low;app.resizeCanvas();}
async function init(){
 try{
 app=new pc.Application(canvas,{graphicsDeviceOptions:{antialias:true,alpha:false,powerPreference:'high-performance'}});// Prefix root-relative runtime assets without editing the preserved world modules.
 app.assets.prefix=import.meta.env.BASE_URL.replace(/\/$/,'');app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);app.setCanvasResolution(pc.RESOLUTION_AUTO);app.graphicsDevice.maxPixelRatio=Math.min(devicePixelRatio||1,1.5);
 app.scene.ambientLight=new pc.Color(.52,.59,.57);app.scene.exposure=1.05;app.scene.fog.type='linear';app.scene.fog.color=new pc.Color(.38,.49,.49);app.scene.fog.start=95;app.scene.fog.end=390;
 sun=new pc.Entity('Last light over Burlington');sun.addComponent('light',{type:'directional',color:new pc.Color(1,.81,.57),intensity:1.5,castShadows:true,shadowDistance:80,shadowResolution:1024,shadowBias:.16,normalOffsetBias:.06,numCascades:2});sun.setEulerAngles(24,-62,0);app.root.addChild(sun);
 const fill=new pc.Entity('Evening sky');fill.addComponent('light',{type:'directional',color:new pc.Color(.54,.75,.86),intensity:.45});fill.setEulerAngles(65,120,0);app.root.addChild(fill);
 camera=new pc.Entity('Survivor camera');camera.addComponent('camera',{clearColor:new pc.Color(.38,.49,.49),fov:70,farClip:640,nearClip:.045,toneMapping:pc.TONEMAP_ACES,gammaCorrection:pc.GAMMA_SRGB});app.root.addChild(camera);
 world=buildWorld(app);await world.ready;runnerScene=createRunnerScene(app,world);course=buildSkateCourse(app,world);streetNav=createNavigation(world);const arenaWorld={...world,obstacles:[...world.obstacles,...course.obstacles]};arenaNav=createNavigation(arenaWorld);nav=createNavigation(arenaWorld);models=createModels(app,camera);rider=await buildRider(app);
 kit=createCombatKit(app,world,nav,{dynamic:items=>streetNav.setDynamic(items),player:()=>player,yaw:()=>yaw*rad,enemies:()=>zombies,toast,sound:audio,shake:n=>shakeTime=Math.max(shakeTime,n),damageEnemy,blastClear:(x,z,ex,ez)=>arenaNav.lineClear(x,z,ex,ez,.02),hurt,baseClear:(x,z)=>arenaNav.clear(x,z,.12)});
 yeet=createYeet({player:()=>player,enemies:yeetTargets,direction:()=>camera.forward,visible:yeetVisible,launched:e=>{if(e.kind==='barrel')kit.refresh();},launch:(e,power)=>{slowMo(.4,.18);shakeTime=Math.max(shakeTime,.35+power*.3);fovPunch=Math.max(fovPunch,4+power*4);if(navigator.vibrate&&input.touch)navigator.vibrate(20);},impact:(e,f)=>{if(e.kind==='barrel')return;const bonus=Math.round(f.distance*12)+(f.hits?f.hits*60:0);if(bonus>0){score+=bonus;toast(`YEET · ${Math.round(f.distance)}M${f.hits?` · ${f.hits} BOWLED`:''} · +${bonus}`);}},clear:(x,z)=>arenaNav.clear(x,z,.22),floor:world.terrainAt,toast,sound:n=>audio.play(n),damage:(e,n)=>e.kind==='barrel'?kit.hit(e,n):damageEnemy(e,n),domino:n=>{score+=75;toast(`DOMINO ×${n} · +75`);if(n>=2)slowMo(.3,.3);},pose:(e,f)=>{e.root.setPosition(f.x,f.y,f.z);e.root.setEulerAngles(f.age*310,(e.seed||0)/rad+f.age*160,Math.sin(f.age*6)*35);e.legs?.forEach((l,i)=>l.setLocalEulerAngles(Math.sin(f.age*9+i*2)*65,0,i?20:-20));e.arms?.forEach((a,i)=>a.setLocalEulerAngles(-130+Math.sin(f.age*10+i)*40,0,i?55:-55));}});
 yeetVisuals=createYeetVisuals(app,world,{enemies:yeetTargets,player:()=>player,direction:()=>camera.forward,yaw:()=>yaw,visible:yeetVisible,clear:(x,z)=>arenaNav.clear(x,z,.22)});
 arenaNav.update(player.x,player.z);
 input=createInput(canvas,{active,runnerActive:()=>phase==='runner',runnerAction:action=>runnerAction(runner,action),equipment:equipmentAction,yeetStart:()=>{if(active()&&!skate.active)yeet.begin();},yeetEnd:()=>{if(active())yeet.release();},yeetCancel:()=>yeet.cancel(),reload,weapon:changeWeapon,pause,mute,skate:toggleSkate,trick:kind=>{if(active()&&skate.active)popSkater(skate,kind);},continue:continueAction,blur:()=>{if(active())pause();},unlocked:()=>{if(active()&&phase!=='runner'&&!input.touch)pause();},lockFailed:()=>toast('Mouse capture unavailable: drag to aim and hold the mouse button to fire.'),graphics,lookScale:()=>skate.active?1:aimStick});
 lowGraphics=input.touch;$('#low-setting').checked=lowGraphics;$('#low-setting').addEventListener('change',e=>{lowGraphics=e.target.checked;graphics();});graphics();window.addEventListener('resize',()=>app.resizeCanvas());
 $('#mode-switch').onclick=toggleSkate;$('#runner-enter').onclick=enterRunner;$('#runner-exit').onclick=finishRunner;$('#runner-return').onclick=returnFromRunner;
 $('#start').onclick=$('#restart').onclick=$('#restart-pause').onclick=resetRun;$('#pause').onclick=pause;$('#resume').onclick=resume;$('#sound').onclick=$('#sound-pause').onclick=mute;$('#back-menu').onclick=()=>{showPhase('menu');$('#menu-best').textContent=String(best).padStart(5,'0');};$('#objective').style.pointerEvents='auto';$('#objective').onclick=()=>{if(phase==='rest')startWave();};
 const updateFrame=rawDt=>{
 let dt=Math.min(rawDt,.05);frameSum+=rawDt;frameCount++;if(frameSum>1){fps=frameCount/frameSum;frameCount=frameSum=0;}
 if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('#toast').classList.remove('show');}
 if(slowTime>0){slowTime-=dt;if(slowTime<=0)timeScale=1;}fovPunch=Math.max(0,fovPunch-rawDt*18);
 if(phase==='runner'){updateRunnerFrame(dt);return;}
 if(phase==='menu'){models.gunRoot.enabled=false;rider.root.enabled=false;camera.setPosition(1.3,world.terrainAt(1.3,80)+1.75,80);camera.setEulerAngles(3,Math.sin(performance.now()*.000055)*5-5,0);return;}
 yeetVisuals.update(yeet,active()&&!skate.active);
 if(!active())return;
 dt*=timeScale;elapsed+=dt;cooldown=Math.max(0,cooldown-dt);recoil=Math.max(0,recoil-dt*.65);flashTime-=dt;hurtTime=Math.max(0,hurtTime-dt);invulnerable-=dt;hitTime=Math.max(0,hitTime-dt);comboTime-=dt;
 if(reloadTime>0){reloadTime-=dt;if(reloadTime<=0){const amount=Math.min(capacity[weapon]-mags[weapon],reserve[weapon]);mags[weapon]+=amount;reserve[weapon]-=amount;audio.play('ready');}}
 updatePlayer(dt);if(!active())return;yeet.update(dt);kit.update(dt);if(!active())return;updateZombies(dt);if(!active())return;updatePickups(dt);models.tick(dt);if(shakeTime>0){shakeTime=Math.max(0,shakeTime-dt);camera.translateLocal((Math.random()-.5)*shakeTime*.13,(Math.random()-.5)*shakeTime*.1,0);}
 $('#damage').style.opacity=hurtTime*.9+(player.health<30?.1:0);$('#hitmarker').style.opacity=hitTime>0?1:0;if(hitTime<=0)$('#combat-text').textContent='';
 if(phase==='wave'){waveClock+=dt;spawnClock-=dt;const cfg=waveConfig(wave);if(spawned<cfg.count&&spawnClock<=0&&zombies.length<cfg.maxAlive){let added=0;for(let i=0;i<cfg.batch&&spawned<cfg.count&&zombies.length<cfg.maxAlive;i++)if(spawnZombie())added++;spawnClock=added?cfg.interval:.5;}if(spawned===cfg.count&&zombies.length===0)clearWave();}
 else if(phase==='rest'){restClock-=dt;if(restClock<=0)startWave();}
 hudClock-=dt;if(hudClock<=0){updateHud();hudClock=.1;}
 };
 app.on('update',updateFrame);
 app.start();showPhase('menu');$('#loading').hidden=true;
 // Read-only telemetry for reproducible browser verification; no gameplay cheats.
 window.__LAST_LIGHT__={snapshot:()=>({phase,wave,score,best,kills,headshots,elapsed,weapon,shotgunUnlocked,player:{...player},mags:{...mags},reserve:{...reserve},spawned,enemies:zombies.map(z=>({x:z.x,z:z.z,health:z.health,runner:z.runner,warning:z.warning,type:z.type,speed:z.speed,flight:!!z.flight})),runner:{active:runner.active,distance:runner.distance,score:runner.score,coins:runner.coins,lives:runner.lives,y:runner.y,x:runner.x,lane:runner.lane,slide:runner.slide,flight:runner.flight,magnet:runner.magnet,lap:runner.lap,over:runner.over,returnSaved:!!runnerReturn},equipment:{stock:kit.stock,items:kit.items.map(o=>({kind:o.kind,x:o.x,z:o.z,health:o.health})),projectiles:kit.projectiles.length},yeet:{held:yeet.held,power:yeet.power,cooldown:yeet.cooldown,flights:yeet.flights.length},pickups:pickups.map(p=>({x:p.x,z:p.z,kind:p.kind})),fps,shotCount,touch:input.touch,yaw,pitch,skate:{active:skate.active,state:skate.state,speed:skate.speed,y:skate.y,tricks:skate.totalTricks,x:skate.x,z:skate.z,vx:skate.vx,vz:skate.vz}}),environment:()=>({landmarks:world.landmarks,obstacles:world.obstacles.length,roots:world.roots.map(r=>r.name),navigableCells:nav.open.reduce((a,b)=>a+b,0),riderMorphs:rider.morphCount,riderPoses:rider.poses,skateRenderers:course.root.findComponents('render').length})};
 if(import.meta.env.DEV&&new URLSearchParams(location.search).has('qa')){
  const {installQA}=await import('./game/qa.js');
  installQA({storageKey,runnerStorageKey,snapshot:window.__LAST_LIGHT__.snapshot,environment:window.__LAST_LIGHT__.environment,step:seconds=>{for(let i=0;i<Math.ceil(seconds*60);i++)updateFrame(1/60);},
   start:()=>{input.setTouch(true);resetRun();},enterRunner,finishRunner,returnFromRunner,runnerAction:action=>runnerAction(runner,action),runnerState:()=>runner,portal:()=>runnerScene.entrance.getPosition().clone(),equipment:equipmentAction,kit,yeet,pause,resume,toggleSkate,trick:kind=>popSkater(skate,kind),fire,reload,changeWeapon,
   aim:(x,y,z)=>{const dx=x-player.x,dy=y-(world.terrainAt(player.x,player.z)+1.72),dz=z-player.z;yaw=Math.atan2(-dx,-dz)/rad;pitch=Math.atan2(dy,Math.hypot(dx,dz))/rad;updatePlayer(.001);},
   target:()=>{const q=zombies.filter(z=>z.warning<=0&&nav.lineClear(player.x,player.z,z.x,z.z,.02)).sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z))[0];return q?{x:q.x,y:world.terrainAt(q.x,q.z)+1.74*(q.scale||1),z:q.z,health:q.health}:null;},
   keys:(codes)=>{input.keys.clear();for(const code of codes)input.keys.add(code);},
   at:(x,z,heading=0)=>{const n=nav.nearest(x,z);const p=nav.coords(n);player.x=p.x;player.z=p.z;yaw=heading;pitch=0;nav.update(p.x,p.z);arenaNav.update(p.x,p.z);updatePlayer(.001);},
   health:n=>player.health=n,damage:hurt,forceSpawn:spawnZombie,
   combatFixture:(types=[])=>{resetRun();kit.reset();for(const z of zombies)z.root.destroy();zombies=[];spawnClock=1000;player.x=0;player.z=100;yaw=pitch=0;nav.update(0,100);arenaNav.update(0,100);updatePlayer(.001);return types.map((type,i)=>{const z=addZombie({x:0,z:97-i*1.5},type);z.warning=0;z.root.setPosition(z.x,world.terrainAt(z.x,z.z),z.z);return z;});},
   practiceSkate:(kind='halfpipe',speed=0)=>{resetRun();kit.reset();spawnClock=1000;const f=kind==='halfpipe'?course.halfpipes[0]:course.banks[0];player.x=f.x;player.z=f.z+(kind==='halfpipe'?0:7);yaw=0;nav.update(player.x,player.z);arenaNav.update(player.x,player.z);toggleSkate();skate.speed=speed;skate.vx=0;skate.vz=-speed;updateSkatePlayer(.001);},
   lateLoadout:()=>{for(const id of ['shotgun','reload','health','capacity','speed','power','reload','health','capacity']){upgrades.find(u=>u.id===id).apply();kit.replenish();}reserve.pistol=192;reserve.shotgun=60;mags={...capacity};},
   arena:n=>{wave=n-1;for(const z of zombies)z.root.destroy();zombies=[];startWave();},
   clearEnemies:()=>{for(const z of [...zombies])kill(z,false);spawned=waveConfig(wave).count;},
   setAmmo:(mag,stock)=>{mags[weapon]=mag;reserve[weapon]=stock;},
   station:()=>stations[targetStation],nav,course,world,refresh:updateHud,
   applyUpgrade:id=>{upgrades.find(u=>u.id===id).apply();startRest();},
   stop:()=>{input.keys.clear();if(active())pause();}
  });
 }
 }catch(error){console.error(error);$('#loading').hidden=false;$('#load-message').textContent='The game could not load: '+error.message;}
}
init();
