import * as pc from 'playcanvas';
import geography from './data/geography.json';
import frontages from './data/frontages.json';
import profile from './data/grade.json';
import terrainGrid from '../research/terrain/dem-grid-2m.json';
import {createTerrain} from './terrain.js';
import {buildArchitecture} from './architecture.js';
import {buildStreetProps} from './street-props.js';
import {buildChurch} from './church-landmark.js';
import {buildSouthLandmarks} from './south-landmarks.js';
import {buildWhimInfill} from './whim-infill.js';
import {buildPublicArt} from './public-art.js';

export function groundAt(z){const pts=profile.points;let i=pts.findIndex(p=>p.z>=z);if(i<0)i=pts.length-1;if(i===0)return pts[0].elevationM-69.682;const a=pts[i-1],b=pts[i],t=Math.min(1,Math.max(0,(z-a.z)/(b.z-a.z)));return a.elevationM+(b.elevationM-a.elevationM)*t-69.682;}
const terrain=createTerrain(terrainGrid,groundAt,{profileZ:profile.points.map(p=>p.z)});
export const terrainAt=terrain.terrainAt;
export function buildWorld(app){
 const geo={...geography,groundAt,terrainAt},root=new pc.Entity('Church Street · Pearl to Main');app.root.addChild(root);
 let seed=104;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 function material(name,hex){const m=new pc.StandardMaterial();m.name=name;m.diffuse=new pc.Color(...hex.match(/../g).map(v=>parseInt(v,16)/255));m.gloss=.13;m.specular.set(.1,.1,.1);m.update();return m;}
 function texture(draw,size=1024){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new pc.Texture(app.graphicsDevice,{mipmaps:true,anisotropy:16});t.setSource(c);t.addressU=t.addressV=pc.ADDRESS_REPEAT;return t;}
 const paving=material('Weathered Church Street running-bond brick','ffffff');paving.diffuseMap=texture((c,s)=>{c.fillStyle='#958579';c.fillRect(0,0,s,s);for(let y=0;y<32;y++)for(let x=-1;x<16;x++){let v=rnd()*44;const sx=x*64+(y%2)*32,sy=y*32;c.fillStyle=`rgb(${118+v},${74+v*.92},${60+v*.9})`;c.fillRect(sx+1,sy+1,62,30);c.fillStyle='#e8c7a426';c.fillRect(sx+2,sy+2,60,1);c.fillStyle='#1e1c1b25';c.fillRect(sx+2,sy+29,60,2);}for(let i=0;i<55000;i++){c.fillStyle=rnd()>.5?'#e0c8ad20':'#292b2d25';c.fillRect(rnd()*s,rnd()*s,1+rnd()*2,1);}});paving.update();
 const stone=material('Pale granite bands','bab6a9'),asphalt=material('Cross street asphalt','62696b'),lawn=material('Dormant church lawn','89815a'),path=material('Concrete church approach','b9b8a8'),iron=material('Iron boundary fence','252d2a'),yellow=material('Yellow road paint','c6ac58');
 lawn.diffuseMap=texture((c,s)=>{c.fillStyle='#999';c.fillRect(0,0,s,s);for(let i=0;i<35000;i++){c.fillStyle=['#858575','#b0a684','#666b50'][i%3];c.fillRect(rnd()*s,rnd()*s,2,rnd()*6);}},512);lawn.update();
 function mesh(name,verts,idx,uv,m){const mm=pc.createMesh(app.graphicsDevice,verts,{indices:idx,normals:pc.calculateNormals(verts,idx),uvs:uv});const e=new pc.Entity(name);e.addComponent('render',{meshInstances:[new pc.MeshInstance(mm,m)]});root.addChild(e);return e;}
 function drapedMesh(name,polygon,m,offset,scale){const {positions,indices,uvs}=terrain.drapePolygon(polygon,{offset,scale});return mesh(name,positions,indices,uvs,m);}
 function surface(name,x0,x1,z0,z1,m,offset=0,scale=3.2){return drapedMesh(name,[[x0,z0],[x1,z0],[x1,z1],[x0,z1]],m,offset,scale);}
 function stripe(name,a,b,width,m=stone,offset=.025){const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);if(!l)return;const ox=-dz/l*width/2,oz=dx/l*width/2;return drapedMesh(name,[[a[0]+ox,a[1]+oz],[a[0]-ox,a[1]-oz],[b[0]-ox,b[1]-oz],[b[0]+ox,b[1]+oz]],m,offset,3.2);}
 function box(name,x,y,z,w,h,d,m){const e=new pc.Entity(name);e.addComponent('render',{type:'box',material:m});e.setPosition(x,y+terrainAt(x,z),z);e.setLocalScale(w,h,d);root.addChild(e);return e;}
 surface('Context ground',-150,150,-115,560,path,-.3,12);
 surface('Four-block brick pedestrian street',-11.35,9.35,8,492,paving,0);
 surface('City Hall forecourt',-18.1,-10.4,431,488,paving,.006);
 surface('Observed courtyard north of glazed infill',9.3,20,198.85,202.02,paving,.006);
 surface('Meeting house lawn',-39,35,-105,-9,lawn,.01,15);
 surface('Church central concrete path',-2.8,1.6,-44,-8,path,.045,4);
 for(let x of [-4.2,3.1])surface('Longitudinal pale granite strip',x-.07,x+.07,8,492,stone,.018);
 for(let z=11;z<491;z+=3.8){if(geo.crossings.some(c=>Math.abs(c.position[1]-z)<8))continue;stripe('Fine transverse paver line',[-11.2,z],[9.2,z],.048,stone,.021);}
 // No repeated diagonal granite diamonds: walking frames 01:00 and 02:40 show transverse bands here.
 for(const {name,position:[,z]} of geo.crossings){const major=name==='Pearl Street'||name==='Main Street',w=major?16:15;
  surface(name+' road',-145,145,z-w/2,z+w/2,asphalt,.036,6);
  if(!major){surface(name+' raised brick crossing',-11.4,9.4,z-w/2,z+w/2,paving,.049);for(let zz of [z-w/2,z+w/2])stripe('Crossing granite threshold',[-12,zz],[10,zz],.45,stone,.06);}else{for(let xx=-4;xx<3.7;xx+=1.0)surface('Zebra crossing',xx,xx+.48,z-6,z+6,stone,.055,1);for(let zz of [z-.12,z+.12])stripe('Road center yellow line',[-145,zz],[-7,zz],.08,yellow,.055);}
  for(let side of [-1,1])for(let zz of [z-w/2-.1,z+w/2+.1])stripe('Cross street curb',[side<0?-145:10,zz],[side<0?-12:145,zz],.34,stone,.17);
 }
 for(let side of [-1,1]){let xa=side<0?-36:2.5,xb=side<0?-3.6:31;for(let x=xa;x<xb;x+=.25)box('Church lawn iron picket',x,.58,-10,.025,1.12,.025,iron);for(let y of [.2,.85])for(let x=xa;x<xb;x+=.25){const end=Math.min(x+.25,xb),mid=(x+end)/2,dy=terrainAt(end,-10)-terrainAt(x,-10),rail=box('Church fence horizontal rail',mid,y,-10,Math.hypot(end-x,dy),.035,.04,iron);rail.setEulerAngles(0,0,Math.atan2(dy,end-x)*180/Math.PI);}}
 for(let z of [40,83,156,196,226,278,319,351,403,465]){const e=new pc.Entity('Cast iron utility cover');e.addComponent('render',{type:'cylinder',material:iron,castShadows:false});e.setPosition(-1.2,terrainAt(-1.2,z)+.026,z);e.setLocalScale(.76,.018,.76);root.addChild(e);for(let k=-2;k<=2;k++){const scoring=box('Utility cover scoring',-1.2,.038,z+k*.09,.6,.005,.014,stone);scoring.setPosition(-1.2,terrainAt(-1.2,z)+.038,z+k*.09);}}
 const architecture=buildArchitecture(app,geo,frontages),props=buildStreetProps(app,geo),church=buildChurch(app,{x:-.65,z:-43.257}),south=buildSouthLandmarks(app,geo);church.setLocalPosition(-.65,groundAt(-43.257),-43.257);
 const infill=buildWhimInfill(app,{groundY:groundAt(204.06)});
 const art=buildPublicArt(app,geo);
 const roots=[root,architecture.root,props.root,church,south,infill,art.root];const group=app.batcher.addGroup('Church Street static detail',false,65);for(const r of roots)for(const c of r.findComponents('render'))c.batchGroupId=group.id;app.batcher.generate([group.id]);
 const walkBoundsAt=z=>{let minX=-10.7,maxX=8.7;for(const f of frontages){if(z<f.frontZStart-.4||z>f.frontZEnd+.4||f.footprintId===5302)continue;if(f.side==='west')minX=Math.max(minX,f.frontX+.45);else maxX=Math.min(maxX,f.frontX-.45-(f.footprintId===5331?1.1:0));}if(z>435&&z<485)minX=-17.35;return{minX,maxX};};
 return {roots,geo,groundAt,terrainAt,terrainProvenance:terrain.provenance,ready:architecture.ready,walkBoundsAt,obstacles:[...props.obstacles,...art.obstacles],buildings:architecture.modeled,bounds:{minX:-10.7,maxX:8.7,minZ:-39,maxZ:507},landmarks:[{name:'Meeting house',z:-43.3},{name:'Masonic Temple & Richardson',z:25},{name:'Cherry Street',z:126.168},{name:'Bank Street',z:250.187},{name:'College Street',z:372.072},{name:'City Hall',z:460},{name:'Main Street',z:500.75}]};
}
