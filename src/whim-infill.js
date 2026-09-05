import * as pc from 'playcanvas';

// Observed form: walk 378/380s + aerial 12.5/13.5s. This is a fitted
// interpretation of the glass extension, not a surveyed replacement footprint.
export const whimInfillEvidence = {
  source: 'walk 378/380s; aerial 12.5/13.5s',
  gisRearPart: 5099,
  estimatedBounds: { minX: 9.4, maxX: 28.08, minZ: 202.03, maxZ: 206.09 },
  approximateRoofHeight: [4.65, 6.6],
  confidence: 'Observed lean-to glazing and adjacency; forward extent and height estimated',
};

export function buildWhimInfill(app, { groundY = 0, showVideoEraSign = true } = {}) {
  const root = new pc.Entity('Observed glazed infill beside 66–78 Church');
  root.tags.add('architecture', 'reference-modeled', 'estimated-extension-5099');
  // Local X runs north to south; local +Z points west toward Church Street.
  // Keep the 3.17m courtyard north of this part open.
  root.setLocalPosition(9.4, groundY, 204.06);
  root.setLocalEulerAngles(0, -90, 0);
  app.root.addChild(root);
  const width = 4.06, depth = 18.68;
  const color = h => new pc.Color(...h.match(/../g).map(v => parseInt(v, 16) / 255));
  function mat(name, hex, gloss = .2) {
    const m = new pc.StandardMaterial(); m.name = name; m.diffuse = color(hex);
    m.gloss = gloss; m.specular = new pc.Color(.16,.16,.16); m.update(); return m;
  }
  const frame = mat('Whim dark metal framing', '353b38');
  const glass = mat('Observed infill subdued glazing', '869b9b', .65);
  const lowerGlass = mat('Observed infill dark display glazing', '394947', .55);
  const awning = mat('Whim brown sloping awning', '504039');
  const base = mat('Infill neutral sill and unobserved rear', '928b7d');
  const sill = mat('Infill pale threshold', 'c2bcb0');
  const vtx = (name, vertices, indices, material, uvs) => {
    const mesh = pc.createMesh(app.graphicsDevice, vertices, {
      indices, normals: pc.calculateNormals(vertices, indices), ...(uvs ? { uvs } : {}),
    });
    const e = new pc.Entity(name);
    e.addComponent('render', { meshInstances: [new pc.MeshInstance(mesh, material)], castShadows: true, receiveShadows: true });
    root.addChild(e); return e;
  };
  function box(name,x,y,z,w,h,d,material) {
    const e = new pc.Entity(name); e.addComponent('render', { type:'box', material, castShadows:true, receiveShadows:true });
    e.setLocalPosition(x,y,z); e.setLocalScale(w,h,d); root.addChild(e); return e;
  }
  function beam(name, a, b, thickness, material = frame) {
    const av = new pc.Vec3(...a), bv = new pc.Vec3(...b);
    const mid = av.clone().add(bv).mulScalar(.5);
    const e = box(name,mid.x,mid.y,mid.z,thickness,av.distance(bv),thickness,material);
    e.setLocalRotation(new pc.Quat().setFromDirections(pc.Vec3.UP,bv.sub(av).normalize()));
    return e;
  }
  // Front profile is lower at the courtyard/north edge, turning into the
  // sloped glass roof against the taller southern neighbor. No second floor.
  // The street view has a rounded glazed shoulder at the low north edge.
  // Smooth that shoulder into the long sloping plane without changing its bounds.
  const bend=.32, shoulderTop=5.17, low=4.65, high=6.6;
  const controlY=shoulderTop-bend*(high-shoulderTop)/(width-bend);
  const profile=Array.from({length:9},(_,i)=>{const t=i/8;return[-width/2+bend*t*t,(1-t)**2*low+2*(1-t)*t*controlY+t*t*shoulderTop];});
  profile.push([width/2,high]);
  for(let j=0;j<profile.length-1;j++){
    const [a,ya] = profile[j], [b,yb] = profile[j+1];
    vtx('Continuous glazed lean-to roof', [a,ya,0,b,yb,0,b,yb,-depth,a,ya,-depth], [0,1,2,0,2,3], glass);
  }
  // Aerial 13.5s shows a regularly divided long roof. Exact bar count is not
  // resolved; eleven divisions approximate the visible rhythm over its depth.
  for(let k=0;k<=11;k++){
    const z = -depth*k/11;
    for(let j=0;j<profile.length-1;j++)beam('Glazed roof transverse frame',[profile[j][0],profile[j][1]+.035,z],[profile[j+1][0],profile[j+1][1]+.035,z],.055);
  }
  const heightAt = u => {
    let j = profile.findIndex(p=>p[0]>=u); if(j<=0)return profile[0][1];
    const a=profile[j-1],b=profile[j];return a[1]+(b[1]-a[1])*(u-a[0])/(b[0]-a[0]);
  };
  for(let k=0;k<=4;k++){
    const u=-width/2+width*k/4, h=heightAt(u);
    beam('Glazed roof longitudinal frame',[u,h+.04,0],[u,h+.04,-depth],.05);
  }
  // Low rear wall only: GIS records the rear portion, but rear opening details
  // are unobserved. This avoids inventing a tall building behind the glass.
  box('Unresolved low rear part of GIS 5099',0,2.15,-depth+4.05,width,4.3,8.1,base);
  box('North low glazing curb',-width/2,.28,-depth/2,.12,.56,depth,sill);
  // Neutral side glass keeps the volume legible without fabricated interiors.
  vtx('North side glazing',[-width/2,.56,0,-width/2,.56,-10.58,-width/2,4.65,-10.58,-width/2,4.65,0],[0,2,1,0,3,2],glass);
  for(let k=0;k<=6;k++)beam('North side metal post',[-width/2,.35,-10.58*k/6],[-width/2,4.65,-10.58*k/6],.06);
  box('Front pale threshold',0,.11,.10,width,.22,.38,sill);
  box('Front dark display',0,1.76,-.025,width-.12,3.30,.06,lowerGlass);
  for(const u of [-width/2,-.55,.60,width/2])box('Front glazing upright',u,1.82,.04,.075,3.58,.10,frame);
  box('Front door lower rail',.025,.22,.065,1.16,.10,.12,frame);
  box('Front door upper rail',.025,2.78,.065,1.16,.085,.12,frame);
  box('Front door handle',.46,1.3,.13,.03,.36,.04,sill);
  // Front clerestory follows the observed sloped profile; it is not a row of
  // generic upper-floor windows or a flat masonry parapet.
  const verts=[-width/2,4.02,.025,width/2,4.02,.025,...profile.slice().reverse().flatMap(([u,h])=>[u,h,.025])];
  const indices=[];for(let i=1;i<verts.length/3-1;i++)indices.push(0,i,i+1);
  vtx('Front clerestory glazing',verts,indices,glass);
  for(const u of [-width/2,-1.02,0,1.02,width/2])beam('Front clerestory mullion',[u,4.02,.065],[u,heightAt(u),.065],.065);
  box('Front clerestory transom',0,4.48,.07,width,.06,.08,frame);
  // Sloping opaque awning bridges shop glazing and the upper glass; the sign
  // band is reproduced as observed text, not a claim about present occupancy.
  awning.cull=pc.CULLFACE_NONE;awning.update();
  vtx('Brown sloping awning',[-width/2,4.05,.02,width/2,4.05,.02,width/2,3.12,.95,-width/2,3.12,.95],[0,2,1,0,3,2],awning);
  box('Awning lower edge',0,3.10,.95,width,.10,.09,frame);
  if(showVideoEraSign){
    const c=document.createElement('canvas');c.width=1024;c.height=160;
    const ctx=c.getContext('2d');ctx.fillStyle='#eeeae0';ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle='#343538';ctx.font='italic 140px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('whim',512,81);
    const t=new pc.Texture(app.graphicsDevice,{mipmaps:true});t.setSource(c);
    const m=mat('Video-era whim sign interpretation','ffffff');m.diffuseMap=t;m.update();
    vtx('Whim pale sign band',[-width*.46,3.70,.38,width*.46,3.70,.38,width*.46,3.36,.72,-width*.46,3.36,.72],[0,2,1,0,3,2],m,[0,0,1,0,1,1,0,1]);
  }
  root.whimEvidence = whimInfillEvidence;
  return root;
}
