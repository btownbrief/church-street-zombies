import * as pc from 'playcanvas';
export function createModels(app,camera){
  function material(hex,emission=0){const m=new pc.StandardMaterial(),c=new pc.Color(...hex.match(/../g).map(x=>parseInt(x,16)/255));m.diffuse=c;m.gloss=.25;if(emission){m.emissive=c.clone();m.emissiveIntensity=emission;}m.update();return m;}
  const mat={skin:material('849b65'),skinFast:material('ad875e'),spitSkin:material('a3b947'),spitShirt:material('54652e'),armor:material('656576'),shirt:material('405c62'),fast:material('a44829'),pants:material('222f38'),boot:material('152221'),eyes:material('e8fc8c',2),wound:material('703d35'),gun:material('26363b'),metal:material('597074'),grip:material('111e22'),hand:material('bc9a76'),glove:material('293e39'),flash:material('ffdc87',3),ammo:material('d8f87d',1),med:material('7aebc4',1),beacon:material('bdf477',1.2)};
  function part(parent,name,type,x,y,z,sx,sy,sz,m){const e=new pc.Entity(name);e.addComponent('render',{type,material:m,castShadows:false});e.setLocalPosition(x,y,z);e.setLocalScale(sx,sy,sz);parent.addChild(e);return e;}
  function pivot(parent,name,x,y,z){const e=new pc.Entity(name);parent.addChild(e);e.setLocalPosition(x,y,z);return e;}
  function zombie(type='walker'){if(typeof type==='boolean')type=type?'runner':'walker';const runner=type==='runner',spitter=type==='spitter',brute=type==='brute',shirt=runner?mat.fast:spitter?mat.spitShirt:brute?mat.armor:mat.shirt;const root=new pc.Entity(type);app.root.addChild(root);const body=pivot(root,'Body',0,0,0),skin=runner?mat.skinFast:spitter?mat.spitSkin:mat.skin;
    part(body,'torn jacket','box',0,1.12,0,.53,.68,.3,shirt);
    part(body,'neck','cylinder',0,1.52,0,.18,.16,.18,skin);
    part(body,'head','sphere',0,1.74,-.03,.39,.46,.36,skin);
    part(body,'hair','box',0,1.94,.015,.32,.07,.25,mat.pants);
    part(body,'jaw','box',0,1.63,-.135,.26,.09,.15,skin);
    part(body,'mouth','box',0,1.655,-.211,.14,.035,.015,mat.wound);
    for(const x of [-.095,.095]){part(body,'glowing eye','box',x,1.79,-.197,.065,.037,.022,mat.eyes);}
    part(body,'torn seam','box',.17,1.18,-.159,.055,.43,.014,mat.wound);
    const legs=[],arms=[];
    for(const side of [-1,1]){const leg=pivot(body,'Leg',side*.16,.81,0);part(leg,'trouser','box',0,-.32,0,.20,.66,.24,mat.pants);part(leg,'boot','box',0,-.71,-.065,.22,.16,.36,mat.boot);legs.push(leg);const arm=pivot(body,'Arm',side*.34,1.36,0);part(arm,'sleeve','box',0,-.16,0,.18,.35,.22,shirt);part(arm,'forearm','box',0,-.42,0,.135,.24,.15,skin);part(arm,'hand','box',0,-.58,-.025,.16,.15,.16,skin);arm.setLocalEulerAngles(-50,0,side*10);arms.push(arm);}
    if(brute){part(body,'armored chest','box',0,1.2,-.18,.65,.52,.18,mat.armor);for(const x of [-.41,.41])part(body,'heavy shoulder','sphere',x,1.4,0,.4,.38,.38,mat.armor);part(body,'hazard stripe','box',0,1.2,-.28,.5,.07,.025,mat.flash);}
    if(spitter){part(body,'acid throat','sphere',0,1.48,-.12,.25,.22,.2,mat.eyes);for(const x of [-.16,.16])part(body,'swollen back sac','sphere',x,1.3,.2,.27,.36,.24,mat.spitSkin);}
    return{root,body,legs,arms};
  }
  const gunRoot=new pc.Entity('First person weapon');camera.addChild(gunRoot);gunRoot.setLocalPosition(.25,-.24,-.52);
  const pistol=new pc.Entity('9mm pistol');gunRoot.addChild(pistol);
  part(pistol,'slide','box',0,0,-.12,.11,.12,.39,mat.metal);part(pistol,'barrel','box',0,-.055,-.13,.09,.08,.39,mat.gun);const grip=part(pistol,'grip','box',0,-.13,.02,.09,.22,.12,mat.grip);grip.setLocalEulerAngles(-14,0,0);part(pistol,'front sight','box',0,.075,-.28,.02,.026,.035,mat.eyes);part(pistol,'rear sight','box',0,.072,.05,.055,.025,.035,mat.gun);part(pistol,'trigger guard','box',0,-.14,-.1,.07,.025,.12,mat.metal);
  const shotgun=new pc.Entity('Pump shotgun');gunRoot.addChild(shotgun);shotgun.enabled=false;
  const barrel=part(shotgun,'barrel','cylinder',0,.005,-.32,.072,.74,.072,mat.metal);barrel.setLocalEulerAngles(90,0,0);const mag=part(shotgun,'tube','cylinder',0,-.07,-.27,.067,.64,.067,mat.gun);mag.setLocalEulerAngles(90,0,0);part(shotgun,'receiver','box',0,-.02,.01,.12,.16,.26,mat.gun);part(shotgun,'pump','box',0,-.085,-.29,.14,.1,.19,mat.grip);part(shotgun,'stock','box',0,-.09,.2,.12,.17,.28,mat.grip);part(shotgun,'sight','box',0,.054,-.64,.018,.025,.023,mat.eyes);
  part(gunRoot,'right glove','box',.025,-.145,.035,.13,.13,.16,mat.glove);const forearm=part(gunRoot,'right forearm','box',.055,-.235,.15,.135,.17,.33,mat.hand);forearm.setLocalEulerAngles(20,-8,0);
  const flash=part(gunRoot,'muzzle flash','sphere',0,0,-.37,.15,.15,.24,mat.flash);flash.enabled=false;
  function pickup(kind){const e=new pc.Entity(kind==='med'?'First aid':'Ammo cache');app.root.addChild(e);part(e,'case','box',0,.35,0,.56,.42,.4,mat.grip);const m=kind==='med'?mat.med:mat.ammo;if(kind==='med'){part(e,'cross vertical','box',0,.58,0,.10,.02,.31,m);part(e,'cross horizontal','box',0,.59,0,.3,.02,.1,m);}else for(let i=-1;i<=1;i++)part(e,'round','box',i*.13,.59,0,.065,.035,.25,m);part(e,'glow base','cylinder',0,.04,0,.75,.025,.75,m);return e;}
  const beacon=new pc.Entity('Supply rally point');app.root.addChild(beacon);part(beacon,'supply crate','box',0,.4,0,1.1,.8,.8,mat.grip);for(const x of [-.4,.4])part(beacon,'strap','box',x,.41,0,.06,.84,.83,mat.beacon);part(beacon,'beacon stem','cylinder',0,3,0,.065,5,.065,mat.beacon);part(beacon,'beacon cap','sphere',0,5.5,0,.4,.4,.4,mat.beacon);beacon.enabled=false;
  const particles=[];
  function burst(x,y,z,head=false){for(let i=0;i<7;i++){const e=part(app.root,'impact fragment','box',x,y,z,.035,.035,.035,head?mat.eyes:mat.wound);particles.push({e,v:new pc.Vec3((Math.random()-.5)*3,Math.random()*2,(Math.random()-.5)*3),life:.2+Math.random()*.25});}}
  function tick(dt){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0){p.e.destroy();particles.splice(i,1);continue;}p.v.y-=dt*6;p.e.translate(p.v.x*dt,p.v.y*dt,p.v.z*dt);}}
  return{zombie,pickup,beacon,gunRoot,pistol,shotgun,flash,burst,tick,mat};
}
