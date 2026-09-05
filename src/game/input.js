export function createInput(canvas, actions){
  const keys=new Set(),coarse=matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>1;
  const state={keys,touch:coarse,fire:false,mx:0,my:0,sensitivity:1,drag:null,stickId:null,stickX:0,stickY:0};
  const $=s=>document.querySelector(s);
  const capture=(element,id)=>{try{element.setPointerCapture(id);}catch{/* Synthetic or expired pointer: release still works through window listeners. */}};
  function setTouch(value){state.touch=value;document.body.classList.toggle('touch-mode',value);$('#touch-setting').checked=value;$('#touch').hidden=!value||!actions.active();actions.graphics?.();}
  state.setTouch=setTouch;setTouch(coarse);
  function reset(){keys.clear();state.fire=false;actions.yeetCancel?.();state.drag=null;state.stickId=null;state.stickX=state.stickY=state.mx=state.my=0;$('#stick').style.transform='';}
  state.reset=reset;
  function look(dx,dy,mobile=false){state.mx+=dx*(mobile?.20:.13)*state.sensitivity;state.my+=dy*(mobile?.17:.11)*state.sensitivity;}
  window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='KeyQ')actions.yeetStart();if(e.code==='KeyG')actions.equipment('grenade');if(e.code==='KeyV')actions.equipment('barricade');if(e.code==='KeyT')actions.equipment('barrel');if(e.code==='KeyB')actions.skate();if(e.code==='KeyJ')actions.trick('kickflip');if(e.code==='KeyK')actions.trick('heelflip');if(e.code==='KeyL')actions.trick('shove');if(e.code==='KeyR')actions.reload();if(e.code==='Digit1')actions.weapon('pistol');if(e.code==='Digit2')actions.weapon('shotgun');if(e.code==='KeyE')actions.continue();if(e.code==='KeyP'||e.code==='Escape'&&actions.active())actions.pause();if(e.code==='KeyM')actions.mute();});
  window.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='KeyQ')actions.yeetEnd();});
  window.addEventListener('blur',()=>{reset();actions.blur();});document.addEventListener('visibilitychange',()=>{if(document.hidden){reset();actions.blur();}});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  state.lock=()=>{if(state.touch)return;try{const result=canvas.requestPointerLock?.();result?.catch(()=>actions.lockFailed());}catch{actions.lockFailed();}};
  canvas.addEventListener('pointerdown',e=>{if(!actions.active())return;if(e.pointerType==='touch'){setTouch(true);return;}if(e.button===0){if(document.pointerLockElement===canvas)state.fire=true;else{state.fire=true;state.lock();state.drag={id:e.pointerId,x:e.clientX,y:e.clientY};capture(canvas,e.pointerId);}}});
  window.addEventListener('pointermove',e=>{if(!actions.active())return;if(document.pointerLockElement===canvas)look(e.movementX,e.movementY);else if(state.drag?.id===e.pointerId){look(e.clientX-state.drag.x,e.clientY-state.drag.y);state.drag.x=e.clientX;state.drag.y=e.clientY;}});
  window.addEventListener('pointerup',e=>{if(e.pointerType!=='touch'){state.fire=false;state.drag=null;}});
  document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement){reset();actions.unlocked();}});
  document.addEventListener('pointerlockerror',()=>actions.lockFailed());
  const stick=$('#joystick');
  function updateStick(e){const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dy),scale=Math.min(1,45/(len||1));state.stickX=dx*scale/45;state.stickY=-dy*scale/45;$('#stick').style.transform=`translate(${dx*scale}px,${dy*scale}px)`;}
  stick.addEventListener('pointerdown',e=>{e.preventDefault();state.stickId=e.pointerId;capture(stick,e.pointerId);updateStick(e);});
  stick.addEventListener('pointermove',e=>{if(state.stickId===e.pointerId)updateStick(e);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,e=>{if(state.stickId===e.pointerId){state.stickId=null;state.stickX=state.stickY=0;$('#stick').style.transform='';}});
  let lookId=null,lx=0,ly=0;
  const zone=$('#look-zone');zone.addEventListener('pointerdown',e=>{e.preventDefault();lookId=e.pointerId;lx=e.clientX;ly=e.clientY;capture(zone,e.pointerId);});zone.addEventListener('pointermove',e=>{if(lookId===e.pointerId){look(e.clientX-lx,e.clientY-ly,true);lx=e.clientX;ly=e.clientY;}});for(const ev of ['pointerup','pointercancel','lostpointercapture'])zone.addEventListener(ev,()=>lookId=null);
  let fireId=null,fx=0,fy=0;const fire=$('#touch-fire');fire.addEventListener('pointerdown',e=>{e.preventDefault();fireId=e.pointerId;fx=e.clientX;fy=e.clientY;state.fire=true;capture(fire,e.pointerId);});fire.addEventListener('pointermove',e=>{if(fireId===e.pointerId){look(e.clientX-fx,e.clientY-fy,true);fx=e.clientX;fy=e.clientY;}});for(const ev of ['pointerup','pointercancel','lostpointercapture'])fire.addEventListener(ev,()=>{state.fire=false;fireId=null;});
  let yeetId=null,yx=0,yy=0;const yeetButton=$('#touch-yeet');
  yeetButton.addEventListener('pointerdown',e=>{e.preventDefault();yeetId=e.pointerId;yx=e.clientX;yy=e.clientY;capture(yeetButton,e.pointerId);actions.yeetStart();});
  yeetButton.addEventListener('pointermove',e=>{if(yeetId===e.pointerId){look(e.clientX-yx,e.clientY-yy,true);yx=e.clientX;yy=e.clientY;}});
  yeetButton.addEventListener('pointerup',e=>{if(yeetId===e.pointerId){yeetId=null;actions.yeetEnd();}});
  for(const ev of ['pointercancel','lostpointercapture'])yeetButton.addEventListener(ev,()=>{if(yeetId!==null){yeetId=null;actions.yeetCancel();}});
  for(const kind of ['grenade','barricade','barrel'])$('#equip-'+kind).addEventListener('pointerdown',e=>{e.preventDefault();actions.equipment(kind);});
  $('#touch-reload').addEventListener('pointerdown',e=>{e.preventDefault();actions.reload();});$('#touch-swap').addEventListener('pointerdown',e=>{e.preventDefault();actions.weapon();});
  for(const id of ['#sensitivity','#pause-sensitivity'])$(id).addEventListener('input',e=>{state.sensitivity=+e.target.value;$('#sensitivity').value=$('#pause-sensitivity').value=state.sensitivity;});
  $('#touch-setting').addEventListener('change',e=>setTouch(e.target.checked));
  return state;
}
