import * as pc from 'playcanvas';
import {createCourseData} from './skate-course-data.js';
export function buildSkateCourse(app,world){
 const root=new pc.Entity('Last Light · temporary skate lines');app.root.addChild(root);
 function mat(hex){const m=new pc.StandardMaterial();m.diffuse=new pc.Color(...hex.match(/../g).map(v=>parseInt(v,16)/255));m.gloss=.25;m.update();return m;}
 const concrete=mat('8d9994'),plywood=mat('ae8d61'),trim=mat('d8f87d'),steel=mat('b8c6c4'),dark=mat('344943');
 // Panel seams, subtle grain and flush screw heads give the temporary wood
 // transitions scale without adding geometry or draw calls.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');ctx.fillStyle='#b2966f';ctx.fillRect(0,0,512,512);
 let seed=31;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<1300;i++){ctx.strokeStyle=`rgba(${random()>.5?'62,40,21':'235,217,181'},${.02+random()*.055})`;ctx.lineWidth=.4+random()*1.1;const x=random()*512,y=random()*512;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+random()*5,y+30,x-random()*7,y+90,x+random()*4,y+160);ctx.stroke();}
 ctx.strokeStyle='#4e413958';ctx.lineWidth=2;ctx.strokeRect(1,1,510,510);ctx.fillStyle='#524c43';for(const x of [10,502])for(const y of [12,128,256,384,500]){ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}
 const texture=new pc.Texture(app.graphicsDevice,{width:512,height:512,mipmaps:true});texture.setSource(canvas);texture.addressU=texture.addressV=pc.ADDRESS_REPEAT;plywood.diffuse=new pc.Color(1,1,1);plywood.diffuseMap=texture;plywood.update();
 const data=createCourseData(),obstacles=[];
 const boxes=[];
 function box(name,x,y,z,w,h,d,m){const b={name,x,y:world.terrainAt(x,z)+y,z,w,h,d,m,angles:[0,0,0]};boxes.push(b);return{setEulerAngles:(...angles)=>b.angles=angles};}
 function flushBoxes(){const cube=new pc.BoxGeometry(),groups=new Map(),v=new pc.Vec3(),q=new pc.Quat();for(const b of boxes){if(!groups.has(b.m))groups.set(b.m,{positions:[],indices:[]});const g=groups.get(b.m),base=g.positions.length/3;q.setFromEulerAngles(...b.angles);for(let i=0;i<cube.positions.length;i+=3){v.set(cube.positions[i]*b.w,cube.positions[i+1]*b.h,cube.positions[i+2]*b.d);q.transformVector(v,v);g.positions.push(v.x+b.x,v.y+b.y,v.z+b.z);}g.indices.push(...cube.indices.map(i=>i+base));}
  for(const [material,g]of groups){const mesh=pc.createMesh(app.graphicsDevice,g.positions,{indices:g.indices,normals:pc.calculateNormals(g.positions,g.indices)}),e=new pc.Entity('Merged skate installation details');e.addComponent('render',{meshInstances:[new pc.MeshInstance(mesh,material)],castShadows:false});root.addChild(e);}}

 for(const rail of data.rails){const z=(rail.z0+rail.z1)/2,length=rail.z1-rail.z0;const top=box(rail.name+' grind rail',rail.x,rail.height,z,.11,.11,length,steel);top.setEulerAngles(-Math.atan2(world.terrainAt(rail.x,rail.z1)-world.terrainAt(rail.x,rail.z0),length)*180/Math.PI,0,0);
  for(const zz of [rail.z0+.4,z,rail.z1-.4]){box(rail.name+' leg',rail.x,rail.height/2,zz,.085,rail.height,.085,dark);box(rail.name+' foot',rail.x,.045,zz,.5,.09,.25,dark);}
  for(let zz=rail.z0;zz<=rail.z1;zz+=.45)obstacles.push({x:rail.x,z:zz,r:.11});
  for(const zz of [rail.z0-3,rail.z1+3])box(rail.name+' approach stripe',rail.x,.018,zz,.7,.025,.15,trim);
 }
 for(const b of data.features){
  const vertices=[],indices=[],uvs=[],slices=b.kind==='halfpipe'?72:32,columns=Math.ceil(b.width/.25);
  // Surface, side walls and end walls use the exact collision height function.
  let arc=0,previousHeight=0;for(let i=0;i<=slices;i++){const z=b.z-b.length/2+b.length*i/slices,h=data.heightAt(b,z);if(i)arc+=Math.hypot(b.length/slices,h-previousHeight);previousHeight=h;for(let j=0;j<=columns;j++){const x=b.x-b.width/2+b.width*j/columns;vertices.push(x,world.terrainAt(x,z)+h+.022,z);uvs.push((x-b.x)/1.22,arc/2.44);}}
  for(let i=0;i<slices;i++)for(let j=0;j<columns;j++){const a=i*(columns+1)+j,n=a+columns+1;indices.push(a,n,a+1,a+1,n,n+1);}
  const mesh=pc.createMesh(app.graphicsDevice,vertices,{indices,uvs,normals:pc.calculateNormals(vertices,indices)}),e=new pc.Entity(b.name+' rideable surface');e.addComponent('render',{meshInstances:[new pc.MeshInstance(mesh,b.kind==='halfpipe'?plywood:concrete)]});root.addChild(e);
  for(const sign of [-1,1])for(let i=0;i<slices;i++){const z=b.z-b.length/2+b.length*(i+.5)/slices,h=data.heightAt(b,z);if(h>.025)box(b.name+' side panel',b.x+sign*b.width/2,h/2,z,.035,h,b.length/slices+.01,dark);}
  const lips=b.kind==='halfpipe'?[b.z-b.length/2,b.z+b.length/2]:[b.z];
  for(const z of lips)box(b.name+' coping',b.x,b.height+.10,z,b.width+.1,.08,.11,steel);
  if(b.kind==='halfpipe')for(const z of lips){box(b.name+' deck',b.x,b.height+.02,z+(z<b.z?-.4:.4),b.width,.14,.8,plywood);for(const x of [b.x-b.width/2,b.x+b.width/2])box(b.name+' deck support',x,b.height/2,z,.08,b.height,.08,dark);}
  for(let z=b.z-b.length/2+.25;z<b.z+b.length/2;z+=.55)if(data.heightAt(b,z)>.16)for(let x=b.x-b.width/2+.2;x<b.x+b.width/2;x+=.5)obstacles.push({x,z,r:.27});
  for(const x of [b.x-b.width/2-.15,b.x+b.width/2+.15])box(b.name+' entrance stripe',x,.022,b.z,.1,.025,b.kind==='halfpipe'?b.flat:1,trim);
 }
 flushBoxes();return{root,...data,obstacles};
}
export async function buildRider(app){
 const asset=await new Promise((resolve,reject)=>app.assets.loadFromUrl('/assets/skater.glb','container',(error,asset)=>error?reject(error):resolve(asset)));
 const root=asset.resource.instantiateRenderEntity();root.name='Skating survivor';app.root.addChild(root);const body=root.findByName('RiderBody'),board=root.findByName('Skateboard');
 if(!body||!board)throw new Error('Skater asset is missing its rider or board hierarchy');
 for(const render of root.findComponents('render'))render.castShadows=false;
 const morphs=body.findComponents('render').flatMap(r=>r.meshInstances).map(m=>m.morphInstance).filter(Boolean);
 function pose(crouch,push,runPhase=0,runner=false,slide=0){for(const m of morphs){m.setWeight('Crouch',crouch);m.setWeight('Push',push);m.setWeight('RunLeft',Math.max(0,runPhase));m.setWeight('RunRight',Math.max(0,-runPhase));m.setWeight('RunnerFacing',runner?1:0);m.setWeight('Slide',slide);}}
 root.enabled=false;return{root,body,board,pose,morphCount:morphs.length,poses:[...new Set(morphs.flatMap(m=>m.morph.targets.map(t=>t.name)))]};
}
