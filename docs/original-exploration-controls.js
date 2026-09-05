import * as pc from 'playcanvas';
import {buildWorld} from './world.js';

const canvas = document.querySelector('#world');
const $ = selector => document.querySelector(selector);
const loading = $('#loading');
function showError(error) {
  loading.classList.remove('done');
  loading.classList.add('error');
  $('#load-message').textContent = 'The street could not load: ' + (error?.message || error);
  console.error(error);
}
try {
  const app = new pc.Application(canvas, {graphicsDeviceOptions:{antialias:true,alpha:false,powerPreference:'high-performance'}});
  app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
  window.addEventListener('resize',()=>app.resizeCanvas());
  app.scene.ambientLight = new pc.Color(.57,.61,.65);
  app.scene.exposure = 1;
  app.scene.fog.type = 'linear';
  app.scene.fog.color = new pc.Color(.70,.78,.82);
  app.scene.fog.start = 300;
  app.scene.fog.end = 900;
  const sun = new pc.Entity('Clear afternoon sun');
  sun.addComponent('light',{type:'directional',color:new pc.Color(1,.95,.86),intensity:1.5,castShadows:true,shadowDistance:170,shadowResolution:2048,shadowBias:.16,normalOffsetBias:.045,numCascades:4});
  sun.setEulerAngles(42,-62,0);app.root.addChild(sun);
  const fill = new pc.Entity('Cool sky illumination');
  fill.addComponent('light',{type:'directional',color:new pc.Color(.68,.79,.94),intensity:.35});
  fill.setEulerAngles(70,120,0);app.root.addChild(fill);
  const camera = new pc.Entity('Street exploration camera');
  camera.addComponent('camera',{clearColor:new pc.Color(.64,.77,.85),fov:64,farClip:1000,nearClip:.075,toneMapping:pc.TONEMAP_ACES,gammaCorrection:pc.GAMMA_SRGB});
  app.root.addChild(camera);
  const environment = buildWorld(app);
  environment.ready.catch(showError);
  // A restrained depth-based contact pass; keep mobile and explicit fallback light.
  let cameraFrame = null;
  if (typeof pc.CameraFrame === 'function' && !window.matchMedia('(pointer: coarse)').matches && new URLSearchParams(location.search).get('ssao') !== '0') {
    cameraFrame = new pc.CameraFrame(app, camera.camera);
    cameraFrame.rendering.toneMapping = pc.TONEMAP_ACES;
    cameraFrame.rendering.samples = 4;
    cameraFrame.ssao.type = pc.SSAOTYPE_COMBINE;
    cameraFrame.ssao.intensity = .35;
    cameraFrame.ssao.power = 1.4;
    cameraFrame.ssao.radius = .7;
    cameraFrame.ssao.scale = .5;
    cameraFrame.ssao.samples = 12;
    cameraFrame.update();
  }
  const groundAt = environment.groundAt || (()=>0);
  const terrainAt = environment.terrainAt || ((x,z)=>groundAt(z));
  const bounds = environment.bounds || {minX:-9.4,maxX:7.5,minZ:-39,maxZ:507};
  const obstacles = environment.obstacles || [];
  const streetLength = environment.geo?.streetLength || 500.75;
  const eyeHeight = 1.72;
  const position = new pc.Vec3(0,terrainAt(0,90)+eyeHeight,90);
  let yaw=0, pitch=3, overview=false, touring=false, activeView='', drag=null;
  let frames=0, frameTime=0, mapTime=0, toastTimer;
  let savedWalk = {x:0,z:90,yaw:0,pitch:3};
  const keys = new Set();
  const info = $('#info');
  const jumpViews = {
    church:{z:25,yaw:0,pitch:9,label:'Pearl Street · looking toward the meeting house'},
    cherry:{z:140,yaw:0,pitch:3,label:'Cherry Street'},
    bank:{z:265,yaw:0,pitch:3,label:'Bank Street'},
    college:{z:385,yaw:0,pitch:3,label:'College Street'},
    cityhall:{z:460.32,yaw:90,pitch:7,label:'City Hall · looking west'}
  };
  function toast(message) {
    $('#toast').textContent=message;$('#toast').classList.add('show');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3300);
  }
  function syncButtons() {
    document.querySelectorAll('[data-view]').forEach(button=>{
      const selected=!overview&&button.dataset.view===activeView;
      button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
    });
    $('#overview').classList.toggle('active',overview);
    $('#overview').setAttribute('aria-pressed',String(overview));
    $('#overview').textContent=overview?'↓ Back to street':'↗ Overview';
    $('#tour').classList.toggle('active',touring);
    $('#tour').setAttribute('aria-pressed',String(touring));
    $('#tour').textContent=touring?'Ⅱ Pause tour':'▷ Walk the whole street';
    $('#mode-label').textContent=overview?'ABOVE THE STREET':touring?'GUIDED WALK':'ON FOOT';
    $('#map').classList.toggle('overview-mode',overview);
  }
  function stopTour() { touring=false;syncButtons(); }
  function updateCamera() {camera.setPosition(position);camera.setEulerAngles(pitch,yaw,0);}
  function updateMap() {
    const pct=pc.math.clamp(position.z/streetLength*100,0,100);
    $('#position-marker').style.top=pct+'%';
    $('#position-marker').style.setProperty('--heading',yaw+'deg');
    $('#position-marker').setAttribute('aria-label',Math.round(position.z)+' metres south of Pearl Street');
    const z=position.z;
    $('#location-label').textContent=overview?'Pearl to Main · all four blocks':z<0?'The meeting house':z<126?'Pearl → Cherry':z<250?'Cherry → Bank':z<372?'Bank → College':z<493?'College → Main':'Main Street';
    $('#distance').textContent=overview?'501 m':Math.round(pc.math.clamp(z,0,streetLength))+' m from Pearl';
    $('#tour-progress').style.width=(touring?pc.math.clamp((490-z)/480*100,0,100):0)+'%';
  }
  function walkAt(x,z,newYaw=0,newPitch=3) {
    overview=false;keys.clear();position.set(x,terrainAt(x,z)+eyeHeight,z);yaw=newYaw;pitch=newPitch;
    sun.light.shadowDistance=170;app.scene.fog.start=300;app.scene.fog.end=900;updateCamera();syncButtons();updateMap();
  }
  function jump(view) {
    const target=jumpViews[view];if(!target)return;
    touring=false;activeView=view;walkAt(0,target.z,target.yaw,target.pitch);toast(target.label);
  }
  function reset() {touring=false;activeView='';walkAt(0,90,0,3);}
  function toggleOverview() {
    stopTour();keys.clear();
    if(overview){walkAt(savedWalk.x,savedWalk.z,savedWalk.yaw,savedWalk.pitch);return;}
    savedWalk={x:position.x,z:position.z,yaw,pitch};overview=true;activeView='';
    position.set(230,235,505);camera.setPosition(position);camera.lookAt(-1,1,219);
    const angles=camera.getEulerAngles();yaw=angles.y;pitch=angles.x;
    sun.light.shadowDistance=330;app.scene.fog.start=850;app.scene.fog.end=1500;syncButtons();updateMap();
    toast('All four blocks. Drag to look; WASD moves the aerial camera.');
  }
  function toggleTour() {
    if(touring){stopTour();return;}
    activeView='';walkAt(-.5,490,0,3);touring=true;syncButtons();
    toast('Main to Pearl, in about 50 seconds. Drag to look around.');
  }
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>jump(button.dataset.view)));
  $('#overview').addEventListener('click',toggleOverview);
  $('#reset').addEventListener('click',reset);
  $('#tour').addEventListener('click',toggleTour);
  $('.wordmark').addEventListener('click',event=>{event.preventDefault();reset();});
  $('#about').addEventListener('click',()=>{keys.clear();info.showModal();});
  info.querySelector('.close').addEventListener('click',()=>info.close());
  info.addEventListener('click',event=>{
    if(event.target!==info)return;const r=info.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)info.close();
  });
  const moveCodes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'];
  window.addEventListener('keydown',event=>{
    if(info.open||event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement)return;
    if(moveCodes.includes(event.code)){event.preventDefault();keys.add(event.code);}
    if(event.code==='KeyR')reset();
    if(event.code==='Escape')stopTour();
  });
  window.addEventListener('keyup',event=>keys.delete(event.code));
  const releaseKeys=()=>{keys.clear();drag=null;};
  window.addEventListener('blur',releaseKeys);
  document.addEventListener('visibilitychange',releaseKeys);
  canvas.style.cursor='grab';
  canvas.addEventListener('pointerdown',event=>{
    if(info.open)return;canvas.setPointerCapture(event.pointerId);
    drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.style.cursor='grabbing';
  });
  canvas.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    yaw-=(event.clientX-drag.x)*.16;pitch=pc.math.clamp(pitch-(event.clientY-drag.y)*.13,-82,80);
    drag.x=event.clientX;drag.y=event.clientY;
  });
  const endDrag=()=>{drag=null;canvas.style.cursor='grab';};
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,endDrag);
  document.querySelectorAll('[data-key]').forEach(button=>{
    button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);keys.add(button.dataset.key);button.classList.add('pressed');});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{keys.delete(button.dataset.key);button.classList.remove('pressed');});
  });
  function blocked(x,z) {return obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.24);}
  app.on('update',dt=>{
    cameraFrame?.update();
    const realDt=dt;dt=Math.min(dt,.055);
    if(!info.open){
      const forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
      const strafe=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
      if(forward||strafe){
        if(touring)stopTour();
        if(activeView){activeView='';syncButtons();}
        const boost=keys.has('ShiftLeft')||keys.has('ShiftRight');
        const speed=(overview?(boost?65:32):(boost?10:4.2))*dt/Math.max(1,Math.hypot(forward,strafe));
        const r=yaw*Math.PI/180;
        let nx=position.x+(-Math.sin(r)*forward+Math.cos(r)*strafe)*speed;
        let nz=position.z+(-Math.cos(r)*forward-Math.sin(r)*strafe)*speed;
        if(overview){position.x=pc.math.clamp(nx,-250,250);position.z=pc.math.clamp(nz,-150,650);}
        else{
          nz=pc.math.clamp(nz,bounds.minZ,bounds.maxZ);
          const walkBounds=environment.walkBoundsAt?.(nz)||bounds;
          nx=pc.math.clamp(nx,walkBounds.minX,walkBounds.maxX);
          if(!blocked(nx,position.z))position.x=nx;
          if(!blocked(position.x,nz))position.z=nz;
        }
      }
      if(touring){
        position.x=-.5;position.z=Math.max(10,position.z-dt*10);
        if(position.z<=10){stopTour();yaw=0;pitch=18;toast('Pearl Street. The full length of Church Street, behind you.');}
      }
      if(!overview)position.y=terrainAt(position.x,position.z)+eyeHeight;
      updateCamera();
    }
    frames++;frameTime+=realDt;mapTime+=realDt;
    if(mapTime>.1){updateMap();mapTime=0;}
    if(frameTime>=1){$('#fps').textContent=Math.round(frames/frameTime)+' fps';frames=0;frameTime=0;}
  });
  app.once('frameend',()=>loading.classList.add('done'));
  reset();app.start();
}catch(error){showError(error);}
