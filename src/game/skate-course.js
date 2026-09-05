import * as pc from 'playcanvas';
// Five short lines, each with room to approach, turn and escape into the centre.
// These are fictional temporary skate pieces, separate from approved landmarks.
export function buildSkateCourse(app,world){
 const root=new pc.Entity('Last Light · temporary skate lines');app.root.addChild(root);
 function mat(hex){const m=new pc.StandardMaterial();m.diffuse=new pc.Color(...hex.match(/../g).map(v=>parseInt(v,16)/255));m.gloss=.3;m.update();return m;}
 const concrete=mat('7c918c'),trim=mat('d8f87d'),steel=mat('a6bdb4'),dark=mat('253a36');
 const rails=[],banks=[],obstacles=[];
 function box(name,x,y,z,w,h,d,m){const e=new pc.Entity(name);e.addComponent('render',{type:'box',material:m,castShadows:false});e.setPosition(x,world.terrainAt(x,z)+y,z);e.setLocalScale(w,h,d);root.addChild(e);return e;}
 const lines=[{x:-2.7,z:66,name:'Big Joe line'},{x:2.7,z:169,name:'Cherry slide'},{x:-2.7,z:282,name:'Bank transfer'},{x:2.7,z:404,name:'College cut'},{x:-3.0,z:460,name:'City Hall finish'}];
 for(const line of lines){
  const {x,z,name}=line,rail={x,z0:z-3,z1:z+3,height:.62,name};rails.push(rail);
  const top=box(name+' rail',x,.62,z,.11,.11,6,steel);const rise=world.terrainAt(x,z+3)-world.terrainAt(x,z-3);top.setEulerAngles(-Math.atan2(rise,6)*180/Math.PI,0,0);
  for(const zz of [z-2.6,z+2.6]){box(name+' support',x,.3,zz,.085,.6,.085,dark);box(name+' foot',x,.045,zz,.5,.09,.25,dark);}
  for(let zz=z-3;zz<=z+3;zz+=.45)obstacles.push({x,z:zz,r:.11});
  const b={x:-x,z:z+9,width:2.0,length:4.8,height:.55,name};banks.push(b);
  // Match each mesh vertex to the same terrain + triangular height support used
  // by the skater. Intermediate slices keep the DEM slope under the bank.
  const vertices=[],indices=[];for(let i=0;i<=12;i++){const zz=b.z-b.length/2+b.length*i/12,hh=b.height*(1-Math.abs(i/6-1));for(const xx of [b.x-b.width/2,b.x+b.width/2])vertices.push(xx,world.terrainAt(xx,zz)+hh+.025,zz);}
  for(let i=0;i<12;i++){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
  const mesh=pc.createMesh(app.graphicsDevice,vertices,{indices,normals:pc.calculateNormals(vertices,indices)}),e=new pc.Entity(name+' two-way bank');e.addComponent('render',{meshInstances:[new pc.MeshInstance(mesh,concrete)]});root.addChild(e);
  box(name+' lip',b.x,b.height+.025,b.z,b.width,.045,.08,trim);
  for(let zz=b.z-b.length/2+.45;zz<b.z+b.length/2;zz+=.6)for(const xx of [b.x-.6,b.x,b.x+.6])obstacles.push({x:xx,z:zz,r:.32});
  // Direction markers identify playable lines without modifying street art.
  for(const zz of [z-6,z+6])box(name+' approach marker',x,.02,zz,.6,.025,.14,trim);
 }
 function support(x,z){for(const b of banks){if(Math.abs(x-b.x)<b.width/2&&Math.abs(z-b.z)<b.length/2)return{height:b.height*(1-Math.abs(z-b.z)/(b.length/2)),name:b.name};}return{height:0,name:''};}
 return{root,rails,banks,obstacles,support};
}
export function buildRider(app){
 const root=new pc.Entity('Skating survivor');app.root.addChild(root);const body=new pc.Entity('Rider');root.addChild(body);const board=new pc.Entity('Board');root.addChild(board);
 function mat(hex){const m=new pc.StandardMaterial();m.diffuse=new pc.Color(...hex.match(/../g).map(v=>parseInt(v,16)/255));m.gloss=.2;m.update();return m;}
 const jacket=mat('d2e079'),pants=mat('263c42'),skin=mat('bc9670'),grip=mat('233934'),wood=mat('cc9b63'),wheel=mat('dae1c9');
 function part(p,name,x,y,z,w,h,d,m,type='box'){const e=new pc.Entity(name);e.addComponent('render',{type,material:m,castShadows:false});e.setLocalPosition(x,y,z);e.setLocalScale(w,h,d);p.addChild(e);return e;}
 part(board,'maple deck',0,.14,0,.24,.055,.86,wood);part(board,'grip tape',0,.17,0,.225,.012,.80,grip);
 for(const z of [-.28,.28]){part(board,'truck',0,.09,z,.27,.035,.05,pants);for(const x of [-.145,.145]){const w=part(board,'wheel',x,.07,z,.085,.055,.085,wheel,'cylinder');w.setLocalEulerAngles(0,0,90);}}
 part(body,'jacket',0,1.18,0,.48,.62,.29,jacket);part(body,'hood',0,1.48,.07,.31,.16,.26,jacket);part(body,'head',0,1.69,0,.32,.38,.30,skin,'sphere');part(body,'beanie',0,1.86,.02,.34,.17,.32,grip,'sphere');
 for(const side of [-1,1]){part(body,'leg',side*.14,.63,side*.17,.18,.51,.22,pants);part(body,'shoe',side*.14,.31,side*.17,.26,.12,.24,grip);const arm=part(body,'arm',side*.36,1.14,0,.16,.52,.18,jacket);arm.setLocalEulerAngles(0,0,side*30);part(body,'hand',side*.46,.94,0,.13,.15,.16,skin);}
 root.enabled=false;return{root,body,board};
}
