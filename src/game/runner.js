// Source-faithful Church Street Runners movement, reimplemented without Three.js.
export const RUNNER={lanes:[-2.1,0,2.1],laneSpeed:14,gravity:26,jump:8.6,slide:.62,baseSpeed:11,maxSpeed:24,acceleration:.42,lapLength:460,startZ:480};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const RUNNER_HAZARDS={
 boxes:{label:'DELIVERY BOXES',height:.8,width:.72,kind:'jump'},bike:{label:'PARKED BIKE',height:.95,width:.72,kind:'jump'},newsbox:{label:'NEWS BOX',height:.95,width:.62,kind:'jump'},cone:{label:'ROAD WORK',height:.8,width:.55,kind:'jump'},rail:{label:'SKATE RAIL',height:.72,width:.75,kind:'jump'},ramp:{label:'SKATE RAMP',height:.8,width:.8,kind:'jump'},zombie:{label:'SHAMBLER',height:1.9,width:.52,kind:'solid'},runner:{label:'SPRINTER',height:1.8,width:.5,kind:'solid'},walker:{label:'DOG WALKER',height:2.3,width:.62,kind:'solid'},shopper:{label:'SHOPPING BAGS',height:2.3,width:.62,kind:'solid'},phone:{label:'DISTRACTED WALKER',height:2.3,width:.55,kind:'solid'},mail:{label:'MAIL DELIVERY',height:2.3,width:.7,kind:'solid'},cafe:{label:'CAFÉ TABLE',height:2.7,width:.82,kind:'solid'},banner:{label:'LOW BANNER · SLIDE',height:2.7,minY:1.1,width:.9,kind:'slide'}
};
export function createRunner(random=Math.random){return{active:false,x:0,lane:1,y:0,vy:0,slide:0,flight:0,magnet:0,speed:11,distance:0,coins:0,score:0,lives:2,invulnerable:0,time:0,lap:0,z:480,rows:[],collectibles:[],nextRow:25,nextCoin:12,serial:0,events:[],random,over:false};}
export function runnerAction(s,action){if(!s.active||s.over)return;if(action==='left')s.lane=Math.max(0,s.lane-1);if(action==='right')s.lane=Math.min(2,s.lane+1);if(action==='up'&&s.y<.05&&s.flight<=0){s.vy=RUNNER.jump;s.slide=0;s.events.push({type:'jump'});}if(action==='down'&&s.flight<=0){s.slide=RUNNER.slide;if(s.y>.05)s.vy=-18;s.events.push({type:'slide'});}}
function spawnRow(s){const difficulty=(s.speed-11)/13,types=Object.keys(RUNNER_HAZARDS),first=Math.floor(s.random()*3),lanes=[first];if(s.random()<.45+difficulty*.25)lanes.push((first+1+Math.floor(s.random()*2))%3);const distance=s.nextRow;
 for(const lane of lanes){const type=types[Math.floor(s.random()*types.length)],cfg=RUNNER_HAZARDS[type];s.rows.push({id:++s.serial,lane,x:RUNNER.lanes[lane],distance,type,...cfg,passed:false});}
 s.nextRow+=20-difficulty*8+s.random()*9;
}
function spawnCoins(s){const lane=Math.floor(s.random()*3),distance=s.nextCoin;
 // A complete line stays in a lane clear of every obstacle along its length.
 if(!s.rows.some(o=>o.lane===lane&&Math.abs(o.distance-distance-5)<10)){
  const power=s.random(),kind=power<.045?'creemee':power<.09?'magnet':'coin',count=kind==='coin'?5:1;
  for(let i=0;i<count;i++)s.collectibles.push({id:++s.serial,lane,x:RUNNER.lanes[lane],distance:distance+i*2.2,kind,y:kind==='coin'?.9:1.05});
 }
 s.nextCoin+=16+s.random()*10;
}
export function updateRunner(s,dt){if(!s.active||s.over||dt<=0)return;const n=Math.ceil(dt*120),h=dt/n;
 for(let k=0;k<n&&!s.over;k++){
  s.time+=h;s.speed=Math.min(RUNNER.maxSpeed,s.speed+RUNNER.acceleration*h);const step=s.speed*h;s.distance+=step;s.score+=step;s.z=RUNNER.startZ-s.distance%RUNNER.lapLength;
  const lap=Math.floor(s.distance/RUNNER.lapLength);if(lap>s.lap){s.lap=lap;s.events.push({type:'lap',lap});}
  s.x+=clamp(RUNNER.lanes[s.lane]-s.x,-RUNNER.laneSpeed*h,RUNNER.laneSpeed*h);s.slide=Math.max(0,s.slide-h);s.invulnerable=Math.max(0,s.invulnerable-h);s.magnet=Math.max(0,s.magnet-h);
  if(s.flight>0){s.flight=Math.max(0,s.flight-h);s.y+=(3.2-s.y)*Math.min(1,h*7);s.vy=0;}else{s.vy-=RUNNER.gravity*h;s.y=Math.max(0,s.y+s.vy*h);if(s.y===0)s.vy=0;}
  // Stop generation in the final metres before each portal, leaving a fair
  // landing buffer on either side of the next block-length lap.
  while(s.nextRow<s.distance+115){const local=s.nextRow%RUNNER.lapLength;if(local>RUNNER.lapLength-15||local<18){s.nextRow+=20;continue;}spawnRow(s);}
  while(s.nextCoin<s.distance+105)spawnCoins(s);
  for(const o of s.rows){const dz=o.distance-s.distance;if(dz<-.9&&!o.passed){o.passed=true;if(Math.abs(o.x-s.x)<1.5&&Math.abs(o.x-s.x)>.65){s.score+=10;s.events.push({type:'nearMiss'});}}if(Math.abs(dz)>.65||Math.abs(s.x-o.x)>.30+o.width||s.invulnerable>0||s.flight>0)continue;
   const top=s.y+(s.slide>0?.65:1.7);if(top>(o.minY||0)&&s.y<o.height){s.lives--;s.invulnerable=2.2;s.slide=0;s.events.push({type:'hit',label:o.label,lives:s.lives});if(s.lives<=0){s.over=true;s.active=false;s.events.push({type:'over'});break;}}
  }
  for(let i=s.collectibles.length-1;i>=0;i--){const c=s.collectibles[i],dz=c.distance-s.distance,attract=s.magnet>0||s.flight>0;if(dz< -3){s.collectibles.splice(i,1);continue;}const canTake=attract?Math.abs(dz)<6:Math.abs(dz)<.7&&Math.abs(c.x-s.x)<.6&&Math.abs(c.y-(s.y+.85))<1;
   if(canTake){s.collectibles.splice(i,1);if(c.kind==='coin'){s.coins++;s.score+=3;}else if(c.kind==='magnet')s.magnet=7;else s.flight=4.5;s.events.push({type:'pickup',kind:c.kind});}
  }
  s.rows=s.rows.filter(o=>o.distance>s.distance-8);
 }
}
export function runnerReward(s){return{score:Math.min(1000,Math.floor(s.score*.15)),pistol:Math.min(60,s.coins*2),shotgun:Math.min(12,Math.floor(s.coins/3)),health:Math.min(25,Math.floor(s.coins/2))};}
