import * as pc from 'playcanvas';

/** Winter street furniture, in metres: x east, z south from Pearl Street.
 * Shapes referenced to the supplied aerial 003.jpg and walk-north contact sheet.
 * Four City Hall setback tree sites are measured GIS points. Main-street
 * positions remain footage estimates; this is not a complete furniture survey.
 * All static geometry is combined by material and 125 m section for culling.
 */
export function buildStreetProps(app, geo = {}) {
  const root = new pc.Entity('Church Street winter furniture');
  app.root.addChild(root);
  const obstacles = [];
  const groups = new Map();
  const terrainAt = typeof geo.terrainAt === 'function' ? geo.terrainAt : (x,z) => geo.groundAt?.(z) || 0;
  // Keep each prop rigid and upright; sample the outdoor ground at its anchor.
  let ground = 0;
  let seed = 527193;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  const mix = (a, b, t) => a + (b - a) * t;
  const materials = {};
  function material(name, hex, roughness = .8, emission = 0) {
    const m = new pc.StandardMaterial();
    m.name = name;
    const c = new pc.Color(...hex.match(/../g).map(v => parseInt(v, 16) / 255));
    m.diffuse = c;
    m.gloss = 1 - roughness;
    m.specular.set(.14, .14, .14);
    if (emission) { m.emissive = c.clone(); m.emissiveIntensity = emission; }
    m.update(); materials[name] = m; return name;
  }
  const bark = material('Winter bark umber', '51463c');
  const barkLight = material('Winter bark grey ridges', '6a5e4e');
  const twig = material('Fine winter twigs', '554b42');
  const iron = material('Blackened green painted iron', '24332e', .62);
  const dark = material('Dark openings', '151b18');
  const wood = material('Weathered timber bench slats', '71523a');
  const wood2 = material('Timber grain variation', '836449');
  const stone = material('Tree well pale cobbles', 'a59e8d');
  const gravel = material('Tree well earth', '5c5546');
  const granite = material('Rough granite boulders', '7b7871');
  const graniteLight = material('Granite light faces', '918b7d');
  const lampGlass = material('Warm lamp diffuser', 'f2e0b4', .42, .5);
  const bulb = material('Small warm winter tree bulbs', 'f6c46e', .3, 2.6);
  const rust = material('Drain grate iron', '625747');
  const recycleBlue = material('Observed blue recycling cart lids', '2872a8');

  function group(mat, z) {
    const key = `${Math.floor(z / 125)}:${mat}`;
    if (!groups.has(key)) groups.set(key, { mat, p: [], n: [], i: [] });
    return groups.get(key);
  }
  function triangle(mat, a, b, c, z = a[2], normal) {
    const g = group(mat, z), offset = g.p.length / 3;
    if (!normal) {
      const u = new pc.Vec3(b[0]-a[0], b[1]-a[1], b[2]-a[2]);
      const v = new pc.Vec3(c[0]-a[0], c[1]-a[1], c[2]-a[2]);
      normal = new pc.Vec3().cross(u, v).normalize().toArray();
    }
    g.p.push(a[0],a[1]+ground,a[2],b[0],b[1]+ground,b[2],c[0],c[1]+ground,c[2]); g.n.push(...normal, ...normal, ...normal);
    g.i.push(offset, offset+1, offset+2);
  }
  function box(mat, x, y, z, w, h, d, yaw = 0) {
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    const pts = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]
      .map(([a,b,c]) => [x+a*w*.5*cs+c*d*.5*sn, y+b*h*.5, z-a*w*.5*sn+c*d*.5*cs]);
    for (const [a,b,c,d] of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[0,1,5,4],[3,7,6,2]]) {
      triangle(mat,pts[a],pts[b],pts[c],z); triangle(mat,pts[a],pts[c],pts[d],z);
    }
  }
  // Circular rings perpendicular to the segment, tapered with analytic normals.
  function branch(mat, a, b, r0, r1, sides = 6, caps = false) {
    const dir = new pc.Vec3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
    const len = dir.length(); if (len < .00001) return;
    dir.mulScalar(1/len);
    const tangent = new pc.Vec3().cross(Math.abs(dir.y)>.94 ? pc.Vec3.RIGHT : pc.Vec3.UP,dir).normalize();
    const bitangent = new pc.Vec3().cross(dir,tangent).normalize();
    const g = group(mat,(a[2]+b[2])/2), offset = g.p.length/3;
    for (const [center,r] of [[a,r0],[b,r1]]) for(let i=0;i<sides;i++) {
      const angle=i*Math.PI*2/sides, cs=Math.cos(angle),sn=Math.sin(angle);
      const radial=tangent.clone().mulScalar(cs).add(bitangent.clone().mulScalar(sn));
      g.p.push(center[0]+radial.x*r,center[1]+radial.y*r+ground,center[2]+radial.z*r);
      const n=radial.add(dir.clone().mulScalar((r0-r1)/len)).normalize();g.n.push(n.x,n.y,n.z);
    }
    for(let i=0;i<sides;i++) {const j=(i+1)%sides;g.i.push(offset+i,offset+j,offset+sides+i,offset+j,offset+sides+j,offset+sides+i);}
    if(caps) for(let i=1;i<sides-1;i++) {
      const ring=(center,r,k)=>{const a=k*Math.PI*2/sides;return [center[0]+r*(tangent.x*Math.cos(a)+bitangent.x*Math.sin(a)),center[1]+r*(tangent.y*Math.cos(a)+bitangent.y*Math.sin(a)),center[2]+r*(tangent.z*Math.cos(a)+bitangent.z*Math.sin(a))];};
      triangle(mat,ring(a,r0,0),ring(a,r0,i+1),ring(a,r0,i),a[2],[-dir.x,-dir.y,-dir.z]);
      triangle(mat,ring(b,r1,0),ring(b,r1,i),ring(b,r1,i+1),b[2],dir.toArray());
    }
  }
  function pipe(mat, points, radius=.035, sides=6) {
    for(let i=1;i<points.length;i++)branch(mat,points[i-1],points[i],radius,radius,sides);
  }
  const cylinder = (mat,x,y,z,r,h,top=r,sides=12) => branch(mat,[x,y-h/2,z],[x,y+h/2,z],r,top,sides,true);
  function tinyBulb(x,y,z) {
    // Low-sided octahedra retain pinpoints without a light per bulb.
    const r=.03, t=[x,y+r*1.5,z], b=[x,y-r*1.5,z];
    const ring=[[x-r,y,z],[x,y,z+r],[x+r,y,z],[x,y,z-r]];
    for(let i=0;i<4;i++){triangle(bulb,t,ring[i],ring[(i+1)%4]);triangle(bulb,b,ring[(i+1)%4],ring[i]);}
  }
  function tree(x,z,index,profile={}) {
    ground=terrainAt(x,z);
    seed=(527193+index*6329)>>>0;
    const height=profile.height??(8+random()*3.6), radius=profile.radius??(.16+random()*.13);
    const spread=profile.spread??1;
    const bendX=(random()-.5)*.45, bendZ=(random()-.5)*.45;
    const fork=[x+bendX,profile.fork??(2.6+random()*.85),z+bendZ];
    branch(bark,[x,.05,z],[x+.035,1.65,z-.025],radius*1.2,radius);
    branch(bark,[x+.035,1.65,z-.025],fork,radius,radius*.78);
    branch(bark,fork,[fork[0],fork[1]+.78,fork[2]],radius*.78,radius*.22);
    for(let k=0;k<5;k++) {
      const a=k*2*Math.PI/5+random()*.28;
      branch(barkLight,[x+Math.cos(a)*radius*.75,.16,z+Math.sin(a)*radius*.75],[x+Math.cos(a)*.5,.06,z+Math.sin(a)*.5],radius*.28,.015);
    }
    function split(start, direction, len, rad, depth) {
      const end=[start[0]+direction[0]*len,start[1]+direction[1]*len,start[2]+direction[2]*len];
      branch(depth>1?bark:twig,start,end,rad,Math.max(.006,rad*.62),6);
      if(depth===0)return;
      const theta=Math.atan2(direction[2],direction[0]);
      for(let j=0;j<2;j++) {
        const a=theta+(j===0?-1:1)*(.36+random()*.54);
        const up=.40+random()*.48, horizontal=Math.sqrt(1-up*up);
        split(end,[Math.cos(a)*horizontal,up,Math.sin(a)*horizontal],len*(.56+random()*.13),rad*.57,depth-1);
      }
      if(depth>1&&random()>.44){const a=theta+1.2;split(end,[Math.cos(a)*.78,.62,Math.sin(a)*.78],len*.43,rad*.4,depth-2);}
    }
    for(let k=0;k<6;k++) {
      const a=k*Math.PI*2/6+random()*.85, up=.46+random()*.3, h=Math.sqrt(1-up*up)*spread;
      const start=[fork[0],fork[1]+random()*.6,fork[2]], len=(height-fork[1])*.52;
      split(start,[Math.cos(a)*h,up,Math.sin(a)*h],len,radius*(.45+random()*.15),4);
      // Lit main limbs are plainly visible in walk0160/0260 and aerial003.
      // Walk 1:40 / 4:20: limbs are wrapped densely, not dotted every half metre.
      if(profile.lit!==false) for(let j=1;j<=26;j++) {
        const t=j/27, turn=j*2.2, r=radius*.46;
        tinyBulb(start[0]+Math.cos(a)*h*len*t+Math.cos(turn)*r,start[1]+up*len*t+Math.sin(turn)*r,start[2]+Math.sin(a)*h*len*t);
      }
    }
    // Footage shows small cobble collars and exposed soil, not giant planters.
    if(!profile.setback) {
      const collar=radius>.26?1.05:.72;
      cylinder(gravel,x,.025,z,collar,.05,collar,16);
      for(let k=0;k<24;k++) {const a=k*Math.PI*2/24;box(stone,x+Math.cos(a)*(collar+.075),.055,z+Math.sin(a)*(collar+.075),.2,.085,.15,-a);}
    }
    if(profile.guard) {
      for(let k=0;k<10;k++){const a=k*Math.PI*2/10;branch(iron,[x+.38*Math.cos(a),.08,z+.38*Math.sin(a)],[x+.31*Math.cos(a),1.8,z+.31*Math.sin(a)],.013,.013,5);}
      for(const y of [.13,.8,1.72]) {const points=[];for(let k=0;k<=16;k++){const a=k*Math.PI*2/16;points.push([x+.35*Math.cos(a),y,z+.35*Math.sin(a)]);}pipe(iron,points,.017,5);}
    }
    for(let k=0;k<(profile.lit===false?0:110);k++) {
      const y=.28+k*.037,a=k*.77,r=radius+.018;
      tinyBulb(x+Math.cos(a)*r,y,z+Math.sin(a)*r);
    }
    obstacles.push({x,z,r:radius+.12});
  }
  // The public inventory is partial. It includes four City Hall setback sites,
  // not a comprehensive set of marketplace street trees. Never let a nonempty
  // partial inventory silently replace the rest of the street.
  const gisTrees=(geo.trees||[]).filter(t=>Array.isArray(t.position)&&Math.abs(t.position[0])<16&&t.position[1]>8&&t.position[1]<495);
  const estimatedTrees=[
    [-6.1,24],[6.35,31],[-6.15,45],[6.45,52],[-6.1,67],[6.4,78],[-6.2,91],[6.3,104],
    [-6.25,145],[6.25,153],[-6.1,168],[6.4,174],[-6.15,191],[6.25,215],[-6.25,228],[6.3,237],
    [-6.0,268],[6.1,275],[6.1,292.3],[6.1,299],[-6.15,301],[6.1,323],[-6.2,338],[6.2,358],
    [-6.15,386],[6.3,397],[-6.1,416],[6.2,421],[6.3,449],[6.2,478]
  ];
  const treeRecords=estimatedTrees.filter(([x,z])=>!gisTrees.some(t=>Math.hypot(x-t.position[0],z-t.position[1])<3)).map(position=>({position,source:'footage estimate'}));
  treeRecords.push(...gisTrees.map(t=>({...t,source:'municipal tree-site point'})));
  // Walk 11:30: mature unlit maples stand on the meeting-house lawn either side of the central path.
  for(const position of [[-13,-19],[12.5,-23],[-24,-38],[17,-47],[-10,-66],[23,-30],[-30,-58]])treeRecords.push({position,source:'walk 11:30 lawn estimate',lawn:true});
  treeRecords.forEach((t,i)=>{
    const [x,z]=t.position;
    const profile={};
    if(x<-10){Object.assign(profile,{setback:true,lit:false,height:9,radius:.23});}
    if(t.lawn){Object.assign(profile,{setback:true,lit:false,height:13+(i%3),radius:.34,spread:1.25,fork:3.4});}
    // Mature spreading specimens visibly bracket the boulders and bank.
    if(x>0&&z>=275&&z<=299)Object.assign(profile,{height:10.4,radius:.23,spread:1.2});
    if(x>0&&z===358)Object.assign(profile,{height:12,radius:.36,spread:1.15,fork:2.9});
    // The small tree outside Helly Hansen has an open metal trunk guard.
    if(x>0&&z===215)Object.assign(profile,{height:6.1,radius:.095,spread:.83,fork:2,guard:true});
    if(x>0&&z===237)Object.assign(profile,{height:7.2,radius:.13,spread:.9,guard:true});
    tree(x,z,i,profile);
  });

  function lamp(x,z,side) {
    ground=terrainAt(x,z);
    cylinder(iron,x,.09,z,.25,.18,.23); cylinder(iron,x,.34,z,.16,.36,.105);
    cylinder(iron,x,2.88,z,.076,5.2,.054,10);
    cylinder(iron,x,.62,z,.13,.08); cylinder(iron,x,4.78,z,.088,.08);
    const curve=[];
    for(let k=0;k<=14;k++){const a=Math.PI-k*Math.PI/14;curve.push([x+side*(.59+.59*Math.cos(a)),5.35+.59*Math.sin(a),z]);}
    pipe(iron,curve,.042,8);
    const headX=x+side*1.18;
    cylinder(iron,headX,5.30,z,.05,.18,.05,8);
    cylinder(iron,headX,5.15,z,.31,.22,.09,16);
    cylinder(iron,headX,5.03,z,.33,.035,.33,16);
    cylinder(lampGlass,headX,5.005,z,.265,.025,.25,12);
    obstacles.push({x,z,r:.26});
  }
  // Individual facade-relative estimates, not mirrored pairs every 30 m.
  // Uncalibrated video does not establish survey-grade lamp coordinates.
  const lampPositions=[
    [-7.7,15],[7.2,40],[-7.7,49],[7.2,87],[-7.7,112],
    [7.2,145],[-7.7,180],[7.1,207],[-7.7,228],[7.1,239],
    [-7.7,265],[7.1,276],[-7.7,310],[7.1,344],[-7.7,361],
    [-7.8,389],[6.8,401],[-7.8,424],[7.1,461],[-7.8,486]
  ];
  for(const [x,z] of lampPositions)lamp(x,z,x<0?1:-1);
  function bench(x,z,facing) {
    ground=terrainAt(x,z);
    // Bench long axis follows the street; people face into the central walkway.
    const map=(u,v,w)=>[x+facing*w,v,z+u];
    const b=(mat,u,v,w,a,h,d)=>box(mat,...map(u,v,w),d,h,a);
    for(let i=0;i<5;i++)b(i%2?wood:wood2,0,.46,-.24+i*.1,1.85,.065,.085);
    for(let i=0;i<4;i++)b(i%2?wood2:wood,0,.66+i*.105,-.33-(i*.018),1.85,.078,.055);
    for(const u of [-.72,.72]) {
      pipe(iron,[map(u,.06,-.35),map(u,.3,-.26),map(u,.43,-.19),map(u,.5,.1),map(u,.14,.27),map(u,.05,.31)],.045,8);
      pipe(iron,[map(u,.19,-.25),map(u,.49,-.28),map(u,.83,-.39),map(u,1.02,-.40)],.035,8);
      const arm=[];
      for(let j=0;j<=10;j++){const t=j/10;arm.push(map(u,.58+.12*Math.sin(t*Math.PI),mix(-.3,.27,t)));}
      pipe(iron,arm,.032,8);pipe(iron,[map(u,.48,.22),map(u,.61,.22)],.027);
      b(iron,u,.045,-.33,.17,.05,.17);b(iron,u,.045,.3,.17,.05,.17);
    }
    pipe(iron,[map(-.72,.29,-.25),map(.72,.29,-.25)],.03);
    // Three small circles approximate the long bench without blocking the aisle.
    for(const u of [-.58,0,.58])obstacles.push({x,z:z+u,r:.39});
  }
  for(const [x,z] of [[-7.8,35],[7.8,62],[-7.8,101],[7.8,162],[-7.8,185],[7.8,212],[-7.8,280],[7.8,307],[-7.8,330],[7.8,399],[7.8,470]])bench(x,z,x<0?1:-1);
  function bin(x,z) {
    ground=terrainAt(x,z);
    cylinder(dark,x,.53,z,.285,.97,.285,16);
    for(let i=0;i<18;i++){const a=i*Math.PI*2/18;box(iron,x+.31*Math.cos(a),.53,z+.31*Math.sin(a),.05,.92,.045,-a);}
    for(const y of [.12,.93])cylinder(iron,x,y,z,.335,.065,.335,20);
    cylinder(iron,x,1.025,z,.36,.16,.28,20);
    cylinder(dark,x,1.11,z,.18,.012,.18,16);
    cylinder(iron,x,.045,z,.32,.09,.32,16);obstacles.push({x,z,r:.37});
  }
  for(const [x,z] of [[-7.5,61],[7.6,95],[-7.6,154],[7.5,201],[-7.5,226],[7.5,280],[-7.4,319],[7.5,353],[7.6,457]])bin(x,z);
  // Two blue-lidded wheeled carts are visible beside the west College block
  // in walk0080. Their presence is source-era and temporary, not civic inventory.
  for(const z of [397.5,399]) {
    const x=-9.6;ground=terrainAt(x,z);
    box(iron,x,.61,z,.82,1.05,.92);box(recycleBlue,x,1.17,z,.87,.10,.99);
    for(const dz of [-.37,.37])branch(dark,[x-.43,.16,z+dz],[x-.25,.16,z+dz],.14,.14,8,true);
    obstacles.push({x,z,r:.59});
  }
  function bollard(x,z) {
    ground=terrainAt(x,z);
    cylinder(iron,x,.065,z,.14,.13,.14,12);cylinder(iron,x,.57,z,.09,.9,.075,10);
    cylinder(iron,x,1.035,z,.105,.075,.105,12);cylinder(iron,x,1.12,z,.09,.095,.045,10);
    obstacles.push({x,z,r:.145});
  }
  const crossings=geo.crossings?.map(c=>c.position[1])||[0,126.168,250.187,372.072,500.75];
  for(const [i,z] of crossings.entries()) {
    for(const edge of i===0?[9]:i===crossings.length-1?[-9]:[-8.5,8.5]) for(const x of [-5.0,-2.5,2.5,5.0])bollard(x,z+edge);
  }
  function boulder(x,z,w,h,d,n) {
    ground=terrainAt(x,z);
    seed=892+n*29;const rings=[],sectors=9;
    for(let j=0;j<=5;j++){const a=.06+j*(Math.PI-.12)/5,row=[];
      for(let i=0;i<sectors;i++){const angle=i*Math.PI*2/sectors,rr=.88+random()*.24;row.push([x+Math.sin(a)*Math.cos(angle)*w*.5*rr,.04+(Math.cos(a)+1)*h*.5,z+Math.sin(a)*Math.sin(angle)*d*.5*rr]);}rings.push(row);}
    for(let j=0;j<5;j++)for(let i=0;i<sectors;i++){const next=(i+1)%sectors,m=random()>.7?graniteLight:granite;triangle(m,rings[j][i],rings[j][next],rings[j+1][i],z);triangle(m,rings[j][next],rings[j+1][next],rings[j+1][i],z);}
    obstacles.push({x,z,r:Math.max(w,d)*.5});
  }
  // Source-visible clusters anchored to known building frontages. Coordinates
  // are facade-relative estimates; shapes are measured visually, not scans.
  boulder(6.35,351.8,1.65,.8,2.05,1);boulder(6.6,349.7,1.12,.56,1.2,2); // Northfield, walk0160: north of the central entrance, not across its approach
  boulder(6.0,286.4,1.85,1.25,2.65,3);boulder(6.2,289.0,1.23,.65,1.3,4);boulder(6.3,290.6,.85,.38,.9,5); // Free People, walk0260
  boulder(-6.8,330.1,1.5,.74,2.5,6); // Tavern, walk0180
  // Squat granite traffic blocks are visible flanking the Bank crossing.
  for(const z of [241.7,258.5])for(const x of [-6.15,6.15]) {
    ground=terrainAt(x,z);box(granite,x,.52,z,.75,1.04,.75);
    box(graniteLight,x,1.05,z,.79,.08,.79);obstacles.push({x,z,r:.56});
  }
  // Small drain grates beside the walking strips, without added floating decals.
  for(const z of [59,105,168,220,291,343,415,476])for(const x of [-5.6,5.6]) {
    ground=terrainAt(x,z);
    box(rust,x,.034,z,.44,.025,.7);
    for(let i=0;i<7;i++)box(dark,x,.049,z-.28+i*.085,.34,.01,.023);
  }
  let triangles=0;
  for(const [key,g] of groups) {
    if(!g.i.length)continue;
    const mesh=new pc.Mesh(app.graphicsDevice);mesh.setPositions(g.p);mesh.setNormals(g.n);mesh.setIndices(g.i);mesh.update(pc.PRIMITIVE_TRIANGLES);
    const entity=new pc.Entity(key);entity.addComponent('render',{meshInstances:[new pc.MeshInstance(mesh,materials[g.mat])],castShadows:g.mat!==bulb,receiveShadows:true});root.addChild(entity);
    triangles+=g.i.length/3;
  }
  root.propProvenance={
    season:'Leafless late-autumn/winter appearance visible in supplied videos',
    treePositions:'Four available City Hall setback sites from GIS; other trees are facade-relative footage estimates',
    measuredTreeCount:gisTrees.length,treeCount:treeRecords.length,treeSites:treeRecords.map(t=>({position:t.position,source:t.source,id:t.id})),
    lampCount:lampPositions.length,lampPositions:'Individual visual estimates; incomplete inventory; no mirrored-pair assumption',
    boulders:'Three source-visible clusters at Northfield, Free People and Tavern; coordinates approximate',
    lampsAndBenches:'Reference-derived shape; placement estimates pending per-object survey',
    publicArt:'Reference-informed Joe Burrell, Leap Froggers and City Hall sculptures are supplied separately by public-art.js',
    triangles,drawCalls:groups.size
  };
  return {root,obstacles};
}
