// The approved world owns the geometry and walk envelope. Both players and
// enemies use this same collision layer; the flow field routes around furniture.
export function createNavigation(world, {step=.7,minX=-18,maxX=9,minZ=8,maxZ=489,radius=.36}={}) {
  const width=Math.ceil((maxX-minX)/step)+1,height=Math.ceil((maxZ-minZ)/step)+1;
  const open=new Uint8Array(width*height),distance=new Int32Array(width*height),queue=new Int32Array(width*height);
  let dynamic=[];const bins=new Map();
  for(const o of world.obstacles){for(let k=Math.floor((o.z-o.r-1)/4);k<=Math.floor((o.z+o.r+1)/4);k++){if(!bins.has(k))bins.set(k,[]);bins.get(k).push(o);}}
  function clear(x,z,r=radius){
    if(z<minZ+r||z>maxZ-r)return false;
    const b=world.walkBoundsAt(z);
    if(x<b.minX+r||x>b.maxX-r)return false;
    return !(bins.get(Math.floor(z/4))||[]).some(o=>(x-o.x)**2+(z-o.z)**2<(o.r+r)**2)&&!dynamic.some(o=>(x-o.x)**2+(z-o.z)**2<(o.r+r)**2);
  }
  const coords=i=>({x:minX+(i%width)*step,z:minZ+Math.floor(i/width)*step});
  const index=(x,z)=>Math.max(0,Math.min(height-1,Math.round((z-minZ)/step)))*width+Math.max(0,Math.min(width-1,Math.round((x-minX)/step)));
  for(let i=0;i<open.length;i++){const p=coords(i);open[i]=clear(p.x,p.z,radius+.06)?1:0;}
  function nearest(x,z){const base=index(x,z);if(open[base])return base;const cx=base%width,cz=Math.floor(base/width);let best=-1,d=Infinity;for(let r=1;r<9&&best<0;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){const xx=cx+dx,zz=cz+dz,i=zz*width+xx;if(xx<0||xx>=width||zz<0||zz>=height||!open[i])continue;const p=coords(i),dd=(p.x-x)**2+(p.z-z)**2;if(dd<d){d=dd;best=i;}}return best;}
  let target=-1;
  function update(x,z){target=nearest(x,z);distance.fill(-1);if(target<0)return;let head=0,tail=0;queue[tail++]=target;distance[target]=0;while(head<tail){const i=queue[head++],xx=i%width;for(const n of [xx?i-1:-1,xx<width-1?i+1:-1,i-width,i+width])if(n>=0&&n<open.length&&open[n]&&distance[n]<0){distance[n]=distance[i]+1;queue[tail++]=n;}}}
  function lineClear(ax,az,bx,bz,r=radius){const n=Math.ceil(Math.hypot(bx-ax,bz-az)/.25);for(let k=1;k<=n;k++)if(!clear(ax+(bx-ax)*k/n,az+(bz-az)*k/n,r))return false;return true;}
  function direction(x,z,tx,tz){
    if(Math.hypot(tx-x,tz-z)<14&&lineClear(x,z,tx,tz))return{x:tx-x,z:tz-z};
    const i=nearest(x,z);if(i<0||distance[i]<0)return{x:0,z:0};
    let best=i;const xx=i%width;
    for(const n of [xx?i-1:-1,xx<width-1?i+1:-1,i-width,i+width])if(n>=0&&n<open.length&&distance[n]>=0&&distance[n]<distance[best])best=n;
    const p=coords(best);
    // Move to the current cell first if a corner blocks the next cell.
    if(!lineClear(x,z,p.x,p.z,radius)){const q=coords(i);return{x:q.x-x,z:q.z-z};}
    return{x:p.x-x,z:p.z-z};
  }
  function move(p,dx,dz,r=radius){const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.16));for(let i=0;i<count;i++){if(clear(p.x+dx/count,p.z,r))p.x+=dx/count;if(clear(p.x,p.z+dz/count,r))p.z+=dz/count;}return p;}
  function reachable(x,z){const i=nearest(x,z);return i>=0&&distance[i]>=0;}
  function setDynamic(items){dynamic=items;for(let i=0;i<open.length;i++){const p=coords(i);open[i]=clear(p.x,p.z,radius+.06)?1:0;}}
  return{setDynamic,clear,lineClear,move,update,direction,reachable,nearest,coords,distance,open,width,height,step};
}
export {waveConfig} from './encounters.js';
export function raySphere(origin,direction,center,radius){const x=origin.x-center.x,y=origin.y-center.y,z=origin.z-center.z,b=x*direction.x+y*direction.y+z*direction.z,c=x*x+y*y+z*z-radius*radius,d=b*b-c;if(d<0)return Infinity;const t=-b-Math.sqrt(d);return t>=0?t:Infinity;}
