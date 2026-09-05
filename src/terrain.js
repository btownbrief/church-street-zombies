// Outdoor DEM surface only. Architectural floors retain the separate 1D grade.
// Each cell uses the x1,z0 → x0,z1 diagonal, shared by sampling and draping.
const cross = (a,b,p) => (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
const smooth = t => { t=Math.max(0,Math.min(1,t));return t*t*(3-2*t); };

export function createTerrain(grid, groundAt, {datum=69.682, minZ=-100, maxZ=502, blendWidth=4, profileZ=[]}={}) {
  const {xStart,xStep,xCount,zStart,zStep,zCount,elevationsM,flags}=grid;
  const maxX=xStart+xStep*(xCount-1), sourceMaxZ=zStart+zStep*(zCount-1);
  if (!(xStep>0 && zStep>0 && blendWidth>0) || minZ<zStart || maxZ>sourceMaxZ) throw new Error('Invalid terrain coverage');
  // These are blended node heights, not a second bilinear surface. Null samples
  // fall back to the established longitudinal grade; footprint flag4 is valid
  // bare earth but must never be interpreted as a measured building floor.
  const heights=elevationsM.map((row,j)=>row.map((value,i)=>{
    const x=xStart+i*xStep,z=zStart+j*zStep,base=groundAt(z);
    if (!Number.isFinite(value) || ((flags?.[j]?.[i]||0)&3)) return base;
    const weight=smooth(Math.min(x-xStart,maxX-x)/blendWidth)*smooth(Math.min(z-minZ,maxZ-z)/blendWidth);
    return base+weight*(value-datum-base);
  }));
  function terrainAt(x,z) {
    if (x<=xStart || x>=maxX || z<=minZ || z>=maxZ) return groundAt(z);
    const gx=(x-xStart)/xStep,gz=(z-zStart)/zStep;
    const i=Math.min(xCount-2,Math.floor(gx)),j=Math.min(zCount-2,Math.floor(gz)),u=gx-i,v=gz-j;
    const a=heights[j][i],b=heights[j][i+1],c=heights[j+1][i],d=heights[j+1][i+1];
    return u+v<=1 ? a+(b-a)*u+(c-a)*v : d+(c-d)*(1-u)+(b-d)*(1-v);
  }
  const xKnots=Array.from({length:xCount},(_,i)=>xStart+i*xStep);
  const zKnots=[...new Set([...Array.from({length:zCount},(_,j)=>zStart+j*zStep),...profileZ,minZ,maxZ])].sort((a,b)=>a-b);
  // Extra profile knots inside a measured cell would require a common partition
  // in the sampler too. The supplied grade/grid both use the same 2m alignment.
  if (profileZ.some(z=>z>minZ && z<maxZ && Math.abs((z-zStart)/zStep-Math.round((z-zStart)/zStep))>1e-8)) throw new Error('Terrain and grade knots must align within DEM coverage');
  const knotsIn=(knots,a,b)=>[a,...knots.filter(v=>v>a+1e-9&&v<b-1e-9),b];
  function clip(subject,triangle) {
    let out=subject;
    for(let k=0;k<3&&out.length;k++) {
      const a=triangle[k],b=triangle[(k+1)%3],input=out;out=[];
      let previous=input[input.length-1],dp=cross(a,b,previous);
      for(const current of input) {
        const dc=cross(a,b,current),inside=dc>=-1e-10,wasInside=dp>=-1e-10;
        if(inside!==wasInside) {
          const t=dp/(dp-dc);
          out.push([previous[0]+t*(current[0]-previous[0]),previous[1]+t*(current[1]-previous[1])]);
        }
        if(inside)out.push(current);
        previous=current;dp=dc;
      }
    }
    return out;
  }
  // Clip the entire convex paving/marking polygon to EVERY common terrain
  // triangle it crosses. Merely sampling its corner heights bridges creases.
  function drapePolygon(polygon,{offset=0,scale=3.2}={}) {
    if(polygon.length<3)throw new Error('Terrain drape requires a convex polygon');
    let area=0;for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length];area+=a[0]*b[1]-b[0]*a[1];}
    const subject=area<0?[...polygon].reverse():polygon;
    const xs=knotsIn(xKnots,Math.min(...subject.map(p=>p[0])),Math.max(...subject.map(p=>p[0])));
    const zs=knotsIn(zKnots,Math.min(...subject.map(p=>p[1])),Math.max(...subject.map(p=>p[1])));
    const positions=[],indices=[],uvs=[],vertices=new Map();
    function vertex([x,z]) {
      const key=`${Math.round(x*1e9)},${Math.round(z*1e9)}`;
      if(vertices.has(key))return vertices.get(key);
      const n=positions.length/3;vertices.set(key,n);positions.push(x,terrainAt(x,z)+offset,z);uvs.push(x/scale,z/scale);return n;
    }
    for(let j=0;j<zs.length-1;j++)for(let i=0;i<xs.length-1;i++) {
      const x0=xs[i],x1=xs[i+1],z0=zs[j],z1=zs[j+1];
      // Clip against the ORIGINAL cell diagonal, even if the polygon's bounds
      // truncate this cell. A fresh diagonal across the truncated rectangle
      // would silently disagree with the terrain sampler.
      const cx0=x0>=xStart&&x0<maxX?xStart+Math.floor((x0-xStart+1e-9)/xStep)*xStep:x0;
      const cx1=x1>xStart&&x1<=maxX?Math.min(maxX,cx0+xStep):x1;
      const cz0=z0>=zStart&&z0<sourceMaxZ?zStart+Math.floor((z0-zStart+1e-9)/zStep)*zStep:z0;
      const cz1=z1>zStart&&z1<=sourceMaxZ?Math.min(sourceMaxZ,cz0+zStep):z1;
      for(const triangle of [[[cx0,cz0],[cx1,cz0],[cx0,cz1]],[[cx1,cz0],[cx1,cz1],[cx0,cz1]]]) {
        const points=clip(subject,triangle);
        for(let k=1;k<points.length-1;k++) {
          if(Math.abs(cross(points[0],points[k],points[k+1]))<1e-10)continue;
          // Counterclockwise XZ projects to a downward Y normal, so reverse.
          indices.push(vertex(points[0]),vertex(points[k+1]),vertex(points[k]));
        }
      }
    }
    return {positions,indices,uvs};
  }
  return {terrainAt,drapePolygon,coverage:{minX:xStart,maxX,minZ,maxZ,blendWidth},provenance:{source:grid.metadata,datum,interpolation:'Piecewise planar; diagonal x1,z0 to x0,z1',edgeTreatment:`${blendWidth}m smooth node blend to existing 1D grade; null/invalid nodes use 1D grade`,buildingFloors:'Not derived from this surface'}};
}
