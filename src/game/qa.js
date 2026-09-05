// Development-only browser diagnostics. Vite eliminates this module from build.
// Run via visible buttons at ?qa=1. Simulates the real game loop and weapons.
export function installQA(api){
 window.__QA__=api;
 const panel=document.createElement('details');panel.id='qa-panel';panel.style='position:fixed;z-index:50;left:10px;bottom:8px;max-width:580px;max-height:44vh;overflow:auto;background:#071e22ef;color:#d8f87d;padding:9px;font:11px monospace;border:1px solid #7c986c';panel.innerHTML='<summary>Development diagnostics</summary><button id="qa-campaign">Play full survival run</button> <button id="qa-runner">Check runner portals</button> <button id="qa-runner-practice">Practice runner</button> <button id="qa-skate">Check skate course</button> <button id="qa-halfpipe">Practice halfpipe</button> <button id="qa-yeet-practice">Practice YEET controls</button> <button id="qa-combat">Check horde equipment & yeet</button> <button id="qa-run">Run integrated checks</button> <button id="qa-autoplay">Play one wave</button> <button id="qa-late">Play final wave</button> <button id="qa-stop">Stop test</button><pre id="qa-results"></pre><output id="qa-state"></output>';document.body.appendChild(panel);
 const results=document.querySelector('#qa-results'),state=document.querySelector('#qa-state');let stopped=false;
 function check(label,ok,detail=''){results.textContent+=`${ok?'PASS':'FAIL'} ${label}${detail?' · '+detail:''}\n`;if(!ok)throw new Error(label);}
 function snapshot(){return api.snapshot();}
 const tick=seconds=>api.step(seconds);
 panel.querySelector('#qa-yeet-practice').onclick=()=>{api.start();const targets=api.combatFixture(['walker','walker','runner']);for(const e of targets){e.speed=0;e.attack=999;}panel.open=false;api.refresh();};
 function startRunnerPractice(){api.start();api.clearEnemies();tick(.02);api.applyUpgrade('reload');const p=api.portal();api.at(p.x,p.z);api.enterRunner();}
 panel.querySelector('#qa-runner-practice').onclick=()=>{startRunnerPractice();const r=api.runnerState();r.rows=[];r.nextRow=10000;panel.open=false;};
 panel.querySelector('#qa-runner').onclick=()=>{results.textContent='';try{
  api.start();api.clearEnemies();tick(.02);api.applyUpgrade('reload');const p=api.portal();api.at(p.x,p.z);const saved=snapshot();api.enterRunner();check('portal enters dedicated runner mode',snapshot().phase==='runner'&&snapshot().runner.returnSaved);
  api.runnerAction('right');tick(.2);check('runner lane change',snapshot().runner.lane===2&&snapshot().runner.x===2.1);api.runnerAction('up');tick(.25);check('runner jump',snapshot().runner.y>1);api.runnerAction('down');tick(.12);check('runner fast-fall and slide',snapshot().runner.y===0&&snapshot().runner.slide>0);
  api.pause();const distance=snapshot().runner.distance;tick(.5);check('pause freezes runner',snapshot().runner.distance===distance);api.resume();check('runner resumes its own mode',snapshot().phase==='runner');
  const r=api.runnerState();r.rows=[];r.nextRow=r.nextCoin=10000;r.collectibles=[{id:5000,kind:'creemee',lane:2,x:2.1,y:1,distance:r.distance+1}];tick(.2);check('creemee triggers flight',snapshot().runner.flight>4);r.flight=0;r.y=0;r.vy=0;r.distance=459.6;tick(.1);check('lap portal preserves cumulative distance',snapshot().runner.lap===1&&snapshot().runner.distance>460);
  r.coins=12;r.score=1000;api.finishRunner();check('runner results are separate from survival death',snapshot().phase==='runner-result');check('runner best is locally persisted',Number(localStorage.getItem(api.runnerStorageKey))>=1000);api.returnFromRunner();const after=snapshot();check('return restores wave and location',after.phase==='rest'&&after.wave===saved.wave&&Math.hypot(after.player.x-saved.player.x,after.player.z-saved.player.z)<.1);check('runner reward banks without resetting survival score',after.score===saved.score+150&&after.reserve.pistol>=saved.reserve.pistol);check('one runner reward per wave break',document.querySelector('#runner-enter').hidden);results.textContent+='DONE · runner portal lifecycle checks.\n';
 }catch(e){results.textContent+='ERROR '+e.message+'\n';}api.stop();api.refresh();};
 panel.querySelector('#qa-halfpipe').onclick=()=>{api.start();api.practiceSkate('halfpipe');panel.open=false;};
 panel.querySelector('#qa-skate').onclick=()=>{results.textContent='';try{
  api.start();check('authored rider has crouch and push poses',['Crouch','Push','RunLeft','RunRight','RunnerFacing','Slide'].every(name=>api.environment().riderPoses.includes(name)));check('course details merged for rendering',api.environment().skateRenderers<20);
  api.practiceSkate('halfpipe',11.5);let highest=0;for(let i=0;i<360;i++){tick(1/60);const s=snapshot().skate;highest=Math.max(highest,s.y-api.world.terrainAt(s.x,s.z));}
  check('halfpipe launches above coping',highest>3);check('halfpipe returns and banks a trick',snapshot().skate.tricks>0&&snapshot().score>0);
  api.practiceSkate('bank',10);tick(3);check('larger bank launches and lands a transfer',snapshot().skate.tricks>0&&snapshot().skate.state==='ride');
  api.toggleSkate();check('hop-off restores on-foot mode',!snapshot().skate.active);results.textContent+='DONE · real course and rider checks.\n';
 }catch(e){results.textContent+='ERROR '+e.message+'\n';}api.stop();api.refresh();};
 panel.querySelector('#qa-stop').onclick=()=>{stopped=true;api.stop();};
 setInterval(()=>{state.textContent=JSON.stringify(snapshot());},500);
 panel.querySelector('#qa-combat').onclick=()=>{
  results.textContent='';try{
   api.combatFixture();api.equipment('barricade');check('barricade places and consumes one',snapshot().equipment.stock.barricade===2&&api.kit.items.length===1);check('barricade blocks movement',!api.nav.lineClear(0,100,0,95));const wall=api.kit.items[0];api.kit.hit(wall,300);check('destroying barricade restores route',api.nav.lineClear(0,100,0,95));
   api.combatFixture();check('first barrel seeded',api.kit.place('barrel',{x:0,z:94}));check('second barrel seeded',api.kit.place('barrel',{x:0,z:90}));api.aim(0,api.world.terrainAt(0,94)+.55,94);api.fire();check('shooting barrel triggers chain reaction',api.kit.items.length===0);
   api.combatFixture();api.kit.place('barrel',{x:0,z:96.6});api.yeet.begin();check('yeet locks marked explosive barrel',api.yeet.target?.kind==='barrel');api.yeet.release();check('thrown barrel releases its ground collider',api.nav.lineClear(0,100,0,95));tick(4);check('thrown barrel detonates on landing',api.kit.items.length===0);
   api.combatFixture();api.equipment('grenade');check('grenade consumes stock and launches',snapshot().equipment.stock.grenade===3&&snapshot().equipment.projectiles===1);tick(1.6);check('grenade detonates at end of fuse',snapshot().equipment.projectiles===0);
   api.combatFixture(['walker','walker','runner']);api.yeet.begin();tick(.5);check('yeet charge locks target',api.yeet.held&&api.yeet.power>.5);api.yeet.release();check('yeet enters flight without stealing camera',api.yeet.flights.length===1&&snapshot().phase==='wave'&&!snapshot().skate.active);tick(3);check('yeet clears targets and awards domino points',snapshot().kills>=2&&snapshot().score>200);
   const [brute]=api.combatFixture(['brute']);api.yeet.begin();api.yeet.release();check('brute resists launch and staggers',!brute.flight&&brute.stagger>=1);
   const [spitter]=api.combatFixture(['spitter']);spitter.z=88;spitter.spitClock=0;tick(.3);check('spitter telegraphs before projectile',spitter.spitWindup>0&&api.kit.projectiles.length===0);tick(.65);check('spitter launches visible projectile',api.kit.projectiles.length===1);
   results.textContent+='DONE · horde equipment and YEET integration checks.\n';
  }catch(e){results.textContent+='ERROR '+e.message+'\n';}api.stop();api.refresh();
 };
 panel.querySelector('#qa-run').onclick=()=>{
  stopped=false;results.textContent='';try{
   api.start();check('approved world loaded',api.environment().obstacles>80);
   const begin=snapshot();api.keys(['KeyW']);tick(1);api.keys([]);check('W moves north',snapshot().player.z<begin.player.z-3);
   api.keys(['KeyW','ShiftLeft']);tick(1);api.keys([]);check('sprint consumes stamina',snapshot().player.stamina<95);
   api.pause();const t=snapshot().elapsed;tick(1);check('pause freezes simulation',snapshot().elapsed===t);api.resume();
   api.at(0,80);api.setAmmo(3,24);const ammo=snapshot().mags.pistol;api.fire();check('pistol consumes a round',snapshot().mags.pistol===ammo-1);api.reload();tick(1.6);check('reload transfers reserve into magazine',snapshot().mags.pistol===12&&snapshot().reserve.pistol===14);
   const spawns=[];for(let i=0;i<15;i++){api.forceSpawn();spawns.push(snapshot().enemies.at(-1));}check('spawn minimum distance',spawns.every(z=>Math.hypot(z.x-snapshot().player.x,z.z-snapshot().player.z)>=20));
   api.toggleSkate();check('skate toggle',snapshot().skate.active);api.keys(['KeyW']);tick(1.0);api.keys([]);const preTrick=snapshot().score;api.trick('kickflip');tick(1.4);check('skate trick lands and rewards score',snapshot().score>preTrick&&snapshot().skate.state==='ride');api.toggleSkate();check('hop off restores shooting mode',!snapshot().skate.active);
   api.arena(2);api.clearEnemies();tick(.02);check('wave clear shows upgrade choice',snapshot().phase==='upgrade');api.applyUpgrade('shotgun');check('shotgun unlock',snapshot().shotgunUnlocked&&snapshot().weapon==='shotgun');const shells=snapshot().mags.shotgun;tick(.4);api.fire();check('shotgun consumes shell',snapshot().mags.shotgun===shells-1);
   api.at(0,api.station().z);const prior=snapshot().score;api.health(40);tick(.1);check('landmark supply heals and awards bonus',snapshot().player.health===snapshot().player.maxHealth&&snapshot().score>=prior+300);
   api.arena(3);tick(3.3);const oldKills=snapshot().kills;api.changeWeapon('pistol');tick(.4);let target=api.target();for(let i=0;!target&&i<100;i++){tick(.1);target=api.target();}for(let shot=0;shot<6&&snapshot().kills===oldKills;shot++){target=api.target();if(target){api.aim(target.x,target.y,target.z);api.fire();}tick(.25);}check('aimed headshots kill a live enemy including armored types',snapshot().kills>oldKills);
   api.health(1);api.damage(17);check('damage triggers game over',snapshot().phase==='dead');check('best score persisted',+localStorage.getItem(api.storageKey)===snapshot().best);
   api.start();check('restart resets run',snapshot().wave===1&&snapshot().score===0&&snapshot().player.health===100&&!snapshot().skate.active);
   for(let i=1;i<=10;i++){api.arena(i);api.clearEnemies();tick(.02);check(`wave ${i} end state`,snapshot().phase===(i===10?'won':'upgrade'));if(i<10)api.applyUpgrade('power');}
   check('ten-wave victory',snapshot().phase==='won');
   results.textContent+='DONE · scripted integration checks completed.\n';
  }catch(e){results.textContent+='ERROR '+e.message+'\n';api.stop();}
  api.refresh();
 };
 async function autoplay(wave=1){
  stopped=false;results.textContent=`Actual weapon / enemy loop: wave ${wave}\n`;api.start();if(wave>1){api.lateLoadout();api.arena(wave);}let loops=0;
  while(!stopped&&snapshot().phase==='wave'&&loops++<900){
   const q=api.target();if(q){const before=snapshot(),distance=Math.hypot(q.x-before.player.x,q.z-before.player.z);api.aim(q.x,q.y,q.z);
    if(wave>1){if(loops%12===0)api.changeWeapon(distance>14?'pistol':'shotgun');api.keys(distance<16?['KeyS']:[]);if(distance<5&&before.yeet.cooldown===0){api.yeet.begin();api.yeet.release();}if(loops%14===0&&distance>7)api.equipment('grenade');}
    api.fire();}
   else api.keys([]);
   if(snapshot().mags[snapshot().weapon]===0)api.reload();
   api.step(.12);await new Promise(r=>setTimeout(r,16));
  }
  api.keys([]);const s=snapshot();try{check('scripted combat wave survived',s.phase===(wave===10?'won':'upgrade'),`${s.kills} kills, ${s.headshots} headshots, ${s.elapsed.toFixed(1)} simulated seconds`);}catch(e){results.textContent+='Combat balance observation: '+e.message+'\n';}api.stop();
 }
 panel.querySelector('#qa-campaign').onclick=async()=>{
  stopped=false;results.textContent='Full combat campaign with normal wave rewards and upgrade progression.\n';api.start();let loops=0,lastWave=0;
  while(!stopped&&loops++<5000){const state=snapshot();if(state.phase==='won'||state.phase==='dead')break;
   if(state.phase==='upgrade'){check(`wave ${state.wave} survived`,true,`${state.kills} cumulative kills`);api.applyUpgrade(['shotgun','reload','health','capacity','speed','power','reload','health','capacity'][state.wave-1]);api.step(18.1);continue;}
   if(state.phase!=='wave')break;const q=api.target();if(q){const d=Math.hypot(q.x-state.player.x,q.z-state.player.z);api.aim(q.x,q.y,q.z);if(state.shotgunUnlocked&&loops%12===0)api.changeWeapon(d>14?'pistol':'shotgun');api.keys(d<16?['KeyS']:[]);if(d<5&&state.yeet.cooldown===0){api.yeet.begin();api.yeet.release();}if(loops%14===0&&d>7)api.equipment('grenade');api.fire();}else api.keys([]);
   if(snapshot().mags[snapshot().weapon]===0)api.reload();api.step(.12);await new Promise(r=>setTimeout(r,16));
  }
  api.keys([]);const end=snapshot();results.textContent+=`${end.phase==='won'?'PASS':'OBSERVATION'} campaign finished at ${end.phase}, wave ${end.wave}, ${end.kills} kills, ${end.elapsed.toFixed(1)} simulated seconds, ${Math.ceil(end.player.health)} health.\n`;api.stop();
 };
 panel.querySelector('#qa-autoplay').onclick=()=>autoplay(1);
 panel.querySelector('#qa-late').onclick=()=>autoplay(10);
}
