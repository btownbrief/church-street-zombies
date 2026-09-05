import * as pc from 'playcanvas';
import {selectYeetTarget,launchVelocity,YEET} from './yeet.js';
export function createYeetVisuals(app,world,hooks){
 const material=new pc.StandardMaterial();material.diffuse=new pc.Color(1,.78,.32);material.emissive=new pc.Color(.7,.42,.08);material.emissiveIntensity=1.2;material.update();
 const marker=new pc.Entity('Yeet target brackets');app.root.addChild(marker);
 function mesh(root,name,type,scale){const e=new pc.Entity(name);e.addComponent('render',{type,material,castShadows:false});e.setLocalScale(...scale);root.addChild(e);return e;}
 for(const x of [-.32,.32]){const e=mesh(marker,'Target bracket','box',[.04,.28,.04]);e.setLocalPosition(x,0,0);}
 const dots=Array.from({length:15},()=>mesh(app.root,'Yeet trajectory','sphere',[.07,.07,.07]));
 function update(yeet,enabled){for(const d of dots)d.enabled=false;marker.enabled=false;if(!enabled||yeet.cooldown>0)return;
  const target=yeet.target||selectYeetTarget(hooks.enemies(),hooks.player(),hooks.direction(),hooks.visible);if(!target)return;marker.enabled=true;marker.setPosition(target.x,world.terrainAt(target.x,target.z)+(target.kind==='barrel'?1.5:2.15*(target.scale||1)),target.z);marker.setEulerAngles(0,hooks.yaw(),0);
  if(!yeet.held)return;const v=launchVelocity(hooks.direction(),yeet.power);let x=target.x,y=world.terrainAt(x,target.z)+.3,z=target.z,vy=v.y,index=0;
  // Same gravity, loft and collision envelope as the body simulation.
  for(let step=0;step<90&&index<dots.length;step++){vy-=YEET.gravity*.025;x+=v.x*.025;y+=vy*.025;z+=v.z*.025;if(!hooks.clear(x,z)||y<=world.terrainAt(x,z)+.06)break;if(step%4===0){const dot=dots[index++];dot.enabled=true;dot.setPosition(x,y+.8,z);}}
 }
 return{update};
}
