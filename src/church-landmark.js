import * as pc from 'playcanvas';

// Provisional tier anchors, metres above the church-front ground. See
// research/church-metric-review/README.md: video600/620s + summer photograph,
// and VCGI2023 DSM. They are not surveyed heights. The broad nave ridge is
// ~87.675m NAVD88 minus ~71.43m front ground;16.4m allows registration uncertainty.
// DSM39.63m is a sampled spire surface, not the thin weather-vane endpoint.
// Keep entry geometry at its observed scale; no uniform scaling of the root.
export const CHURCH_HEIGHT_ESTIMATES = Object.freeze({
  naveEave:12.5, naveRidge:16.4, brickCap:20.5, belfryCap:27,
  lanternCap:32, coneTip:41, vaneTip:45
});

// Meeting House: observed features from walking footage 650–750s; footprint from
// city GIS. Height and unobserved rear details remain estimates. North is -Z.
// z is the foremost brick face of the square tower, not the building centroid.
export function buildChurch(app, { x = 0, z = -43.3 } = {}) {
  const H=CHURCH_HEIGHT_ESTIMATES;
  const root = new pc.Entity('First Unitarian Universalist Meeting House');
  app.root.addChild(root); root.setLocalPosition(x, 0, z);
  const hex = h => new pc.Color(...h.match(/\w\w/g).map(v => parseInt(v, 16) / 255));
  function material(name, color, gloss = .08) {
    const m = new pc.StandardMaterial(); m.name = name; m.diffuse = hex(color);
    m.gloss = gloss; m.specular = new pc.Color(.15, .15, .15); m.update(); return m;
  }
  function texture(draw, w=512, h=512) {
    const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
    const t=new pc.Texture(app.graphicsDevice,{mipmaps:true,anisotropy:8});t.setSource(c);return t;
  }
  let seed=1816;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const brick=material('Church weathered red brick','ffffff');
  brick.diffuseMap=texture((c,w,h)=>{
    c.fillStyle='#8c7865';c.fillRect(0,0,w,h);
    for(let row=0;row<16;row++)for(let col=-1;col<8;col++){
      const n=rand()*36;c.fillStyle=`rgb(${120+n},${61+n*.62},${42+n*.5})`;
      c.fillRect(col*64+(row%2)*32+1,row*32+1,62,30);
      c.fillStyle='rgba(24,16,12,.09)';for(let j=0;j<12;j++)c.fillRect(col*64+(row%2)*32+rand()*62,row*32+rand()*29,5,1);
    }
  });brick.update();
  const white=material('Church painted ivory wood','e9e5d6');
  const inset=material('Paint recesses','c0c1b4');
  const stone=material('Meeting house gray stone','9a9c94');
  const slate=material('Meeting house slate roof','4e5854');
  const green=material('Weathered green spire','75846a',.2);
  const iron=material('Wrought iron','242b28',.15);
  const glass=material('Old blue gray glass','546d73',.48);
  const amber=material('Lantern glazing','ddc590',.2);
  const gold=material('Weather vane and clock gold','b5a068',.33);
  const recess=material('Door seams','777c70');
  function entity(name,mesh,m,parent=root){const e=new pc.Entity(name);e.addComponent('render',{meshInstances:[new pc.MeshInstance(mesh,m)],castShadows:true,receiveShadows:true});parent.addChild(e);return e;}
  function mesh(name,verts,indices,m,uvs,parent=root){return entity(name,pc.createMesh(app.graphicsDevice,verts,{indices,normals:pc.calculateNormals(verts,indices),...(uvs?{uvs}: {})}),m,parent);}
  function box(name,cx,cy,cz,w,h,d,m,parent=root){
    // Physical brick UV size prevents the same brick count on walls and pilasters.
    const v=[],u=[],idx=[];
    const faces=[[[ -1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],w,h],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1],w,h],[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1],d,h],[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1],d,h],[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],w,d],[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],w,d]];
    for(const f of faces){const n=v.length/3;for(let i=0;i<4;i++)v.push(cx+f[i][0]*w/2,cy+f[i][1]*h/2,cz+f[i][2]*d/2);u.push(0,0,f[4]/1.92,0,f[4]/1.92,f[5]/1.04,0,f[5]/1.04);idx.push(n,n+1,n+2,n,n+2,n+3);}
    return mesh(name,v,idx,m,u,parent);
  }
  function primitive(name,type,cx,cy,cz,w,h,d,m,parent=root){const e=new pc.Entity(name);e.addComponent('render',{type,material:m,castShadows:true,receiveShadows:true});parent.addChild(e);e.setLocalPosition(cx,cy,cz);e.setLocalScale(w,h,d);return e;}
  function beam(name,a,b,r,m,parent=root){const av=new pc.Vec3(...a),bv=new pc.Vec3(...b),mid=av.clone().add(bv).mulScalar(.5);const e=primitive(name,'cylinder',mid.x,mid.y,mid.z,r,av.distance(bv),r,m,parent);const dir=bv.clone().sub(av).normalize();e.setLocalRotation(new pc.Quat().setFromDirections(pc.Vec3.UP,dir));return e;}
  function archBand(name,cx,base,cz,w,h,thick,m,parent=root,depth=.12){
    // A real curved molding, with an empty arch interior. Front face is +Z.
    const r=w/2,cy=base+h-r,v=[],ind=[],segments=24;
    for(let i=0;i<=segments;i++){const a=i*Math.PI/segments;for(const rr of [r,r-thick])for(const zz of [cz-depth/2,cz+depth/2])v.push(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,zz);}
    for(let i=0;i<segments;i++){const a=i*4,b=a+4;ind.push(a,a+1,b+1,a,b+1,b,a+2,b+2,b+3,a+2,b+3,a+3,a+1,a+3,b+3,a+1,b+3,b+1,a,b,a+2,a+2,b,b+2);}
    mesh(name+' curved crown',v,ind,m,undefined,parent);
    for(const side of [-1,1])box(name+' jamb',cx+side*(r-thick/2),base+(h-r)/2,cz,thick,h-r,depth,m,parent);
  }
  function archFill(name,cx,base,cz,w,h,m,parent=root){
    const r=w/2,cy=base+h-r,semicircle=Math.abs(h-r)<1e-8;
    // A semicircular fanlight has no straight jamb. Start its fan at the
    // baseline midpoint to avoid duplicate corner vertices and NaN normals.
    const v=semicircle?[cx,base,cz]:[cx-r,base,cz,cx+r,base,cz];
    for(let i=0;i<=24;i++){const a=i*Math.PI/24;v.push(cx+Math.cos(a)*r,cy+Math.sin(a)*r,cz);}
    const idx=[];for(let i=1;i<v.length/3-1;i++)idx.push(0,i,i+1);
    return mesh(name,v,idx,m,undefined,parent);
  }
  function archedWindow(name,cx,base,cz,w,h,parent=root,gridCols=6,gridRows=10){
    archFill(name+' glazing',cx,base,cz,w,h,glass,parent);
    archBand(name+' frame',cx,base-.08,cz+.035,w+.18,h+.18,.12,white,parent);
    const r=w/2,spring=base+h-r;
    for(let col=1;col<gridCols;col++){const xx=cx-w/2+w*col/gridCols;const top=spring+Math.sqrt(Math.max(0,r*r-(xx-cx)*(xx-cx)));box(name+' vertical glazing bar',xx,(base+top)/2,cz+.075,.023,top-base,.035,white,parent);}
    for(let row=1;row<gridRows;row++){const yy=base+h*row/gridRows;const half=yy>spring?Math.sqrt(Math.max(0,r*r-(yy-spring)**2)):r;box(name+' horizontal glazing bar',cx,yy,cz+.075,half*2,.023,.035,white,parent);}
    box(name+' projecting sill',cx,base-.09,cz+.05,w+.3,.16,.28,white,parent);
  }
  function squareWindow(name,cx,cy,cz,w,h,parent=root){box(name+' white frame',cx,cy,cz,w+.16,h+.16,.12,white,parent);box(name+' glazing',cx,cy,cz+.075,w,h,.03,glass,parent);for(let a=1;a<4;a++)box(name+' vertical bar',cx-w/2+w*a/4,cy,cz+.105,.035,h,.04,white,parent);for(let a=1;a<4;a++)box(name+' horizontal bar',cx,cy-h/2+h*a/4,cz+.105,w,.035,.04,white,parent);}
  function paneledDoors(name,cx,base,cz,w,h,parent=root,panelColumns=2){
    box(name+' door recess',cx,base+h/2,cz,w+.08,h+.08,.11,recess,parent);
    for(let side of [-1,1]){const dx=cx+side*w/4;box(name+' leaf',dx,base+h/2,cz+.075,w/2-.025,h,.085,white,parent);
      for(let row=0;row<3;row++)for(let col=0;col<panelColumns;col++){const px=dx+(col-(panelColumns-1)/2)*w*.21,py=base+h*(.18+row*.32),pw=panelColumns===1?w*.35:w*.18,ph=h*.25;box(name+' panel shadow',px,py,cz+.128,pw+.035,ph+.035,.025,inset,parent);box(name+' raised panel',px,py,cz+.151,pw,ph,.035,white,parent);}
      box(name+' handle',cx+side*.095,base+h*.43,cz+.2,.035,.22,.055,iron,parent);
    }
  }
  function octagon(name,base,h,r,m,topR=r){let v=[],idx=[];for(let i=0;i<8;i++){let a=Math.PI/8+i*Math.PI/4;v.push(Math.sin(a)*r,base,-3+Math.cos(a)*r,Math.sin(a)*topR,base+h,-3+Math.cos(a)*topR);}for(let i=0;i<8;i++){let a=i*2,b=((i+1)%8)*2;idx.push(a,b,b+1,a,b+1,a+1);}v.push(0,base,-3,0,base+h,-3);for(let i=0;i<8;i++){let a=i*2,b=((i+1)%8)*2;idx.push(16,b,a,17,a+1,b+1);}return mesh(name,v,idx,m);}
  function cornice(name,y,w,d,zz){for(const [dy,extra,hh] of [[0,0,.18],[.17,.14,.11],[.29,.30,.16]])box(name,0,y+dy,zz,w+extra,hh,d+extra,white);}

  // The GIS maximum facade width is about 17.4m. Main body recedes behind tower.
  box('Main gray foundation',0,.50,-18.3,17.2,1,28,stone);
  box('Brick nave',0,(1+H.naveEave-.4)/2,-18.3,17.2,H.naveEave-1.4,28,brick);
  // Rear mass occupies the remaining GIS footprint; only minimally resolved here.
  box('Unobserved rear extension',0,4.2,-36.8,13.8,8.4,9,brick);
  box('Rear slate roof',0,8.5,-36.8,14.1,.25,9.3,slate);
  const roofV=[-8.85,H.naveEave,-32.55,8.85,H.naveEave,-32.55,0,H.naveRidge,-32.55,-8.85,H.naveEave,-4.05,8.85,H.naveEave,-4.05,0,H.naveRidge,-4.05];
  mesh('Main slate gable roof',roofV,[0,2,1,0,3,5,0,5,2,1,2,5,1,5,4],slate);
  // Front brick pediment remains visible either side of the projecting tower.
  mesh('Brick front pediment',[-8.6,H.naveEave-.3,-4.19,8.6,H.naveEave-.3,-4.19,0,H.naveRidge-.3,-4.19],[0,1,2],brick,[0,0,8.96,0,4.48,4.52]);
  for(const side of [-1,1])beam('White raking gable molding',[side*8.7,H.naveEave,-4.06],[0,H.naveRidge-.1,-4.06],.19,white);
  cornice('Nave white cornice',H.naveEave-.5,17.6,28.3,-18.3);
  for(const side of [-1,1]){box('Front corner brick pilaster',side*8.29,(.85+H.naveEave-.45)/2,-4.15,.44,H.naveEave-1.3,.28,brick);box('Corner pilaster capital',side*8.29,H.naveEave-.8,-4.05,.72,.25,.46,white);}
  box('Square projecting clock tower',0,(H.brickCap-.08)/2,-3.05,6.3,H.brickCap-.08,6.1,brick);
  for(const side of [-1,1])box('Tower subtle brick corner pier',side*2.92,(.4+H.brickCap-.3)/2,.04,.28,H.brickCap-.7,.10,brick);
  for(const [yy,ww,hh] of [[H.naveEave-.6,6.48,.18],[H.naveEave-.3,6.56,.22],[H.brickCap-.75,6.7,.28],[H.brickCap-.38,6.85,.26],[H.brickCap-.08,7,.19]])box('Tower horizontal white course',0,yy,-3.05,ww,hh,6.1+(ww-6.3),white);
  // Front stone steps, central landing and two independent raised side landings.
  for(let i=0;i<6;i++){const h=.18*(i+1),depth=3.7-i*.46;box('Front broad stair '+i,0,h/2,depth/2+.08,5.1,h,depth,stone);}
  box('Central entry stone threshold',0,1.16,.25,2.75,.13,.5,stone);
  paneledDoors('Central rectangular double entry',0,1.21,.07,2.35,3.35);
  for(const side of [-1,1]){box('Fluted entry pilaster',side*1.37,2.97,.22,.24,3.7,.22,white);for(let q=-2;q<=2;q++)box('Pilaster flute',side*1.37+q*.036,2.96,.338,.012,3.32,.018,inset);box('Entry pilaster capital',side*1.37,4.72,.24,.4,.17,.31,white);}
  box('Door entablature',0,4.86,.22,3.12,.25,.36,white);box('Door projecting crown',0,5.05,.26,3.28,.14,.46,white);
  // 690/710s: a narrow white belt crosses the tower at the window's arch
  // spring, stopping at its projecting surround. It was missing entirely.
  for(const side of [-1,1])box('Tower window spring belt',side*2.29,9.90,.075,1.72,.15,.15,white);
  archedWindow('Tall central tower window',0,6.10,.08,2.5,5.05,root,8,15);
  box('Central window apron',0,5.63,.18,2.62,.78,.21,white);
  for(let i=-4;i<=4;i++)box('Apron vertical recessed panel',i*.265,5.66,.303,.11,.51,.035,inset);
  for(const side of [-1,1]){
    const xx=side*5.8,front=-4.04;
    box('Side entrance landing',xx,.82,front+.50,3.2,1.64,1.28,stone);
    // 710/725s: each side entry has two panel columns overall, not four.
    paneledDoors('Side fanlight entry',xx,1.64,front,2.0,2.9,root,1);
    archFill('Side entry fanlight glass',xx,4.64,front+.09,2.0,1.0,glass);
    archBand('Side entrance arched molding',xx,1.55,front+.15,2.43,4.20,.20,white,root,.20);
    box('Fanlight sill transom',xx,4.58,front+.20,2.5,.17,.29,white);
    for(let i=0;i<=8;i++){const a=i*Math.PI/8;beam('Fanlight radial glazing bar',[xx,4.64,front+.15],[xx+Math.cos(a)*.96,4.64+Math.sin(a)*.96,front+.15],.028,white);}
    // 725s: the radial fanlight bars intersect a smaller semicircular ring.
    for(let i=0;i<16;i++){const a=i*Math.PI/16,b=(i+1)*Math.PI/16;beam('Fanlight inner ring',[xx+Math.cos(a)*.43,4.64+Math.sin(a)*.43,front+.16],[xx+Math.cos(b)*.43,4.64+Math.sin(b)*.43,front+.16],.028,white);}
    squareWindow('Small square window above side door',xx,7.05,front+.04,1.18,1.18);
    for(const sx of [-1,1]){const rx=xx+sx*1.38;beam('Side landing railing top',[rx,2.62,front-.10],[rx,2.62,front+1.15],.04,iron);for(let j=0;j<6;j++)beam('Side landing railing vertical',[rx,1.64,front+j*.23],[rx,2.62,front+j*.23],.027,iron);}
    // 700/725/735s show a full iron barrier across each raised landing,
    // not just the two short side returns used in the first model.
    const railFront=front+1.15;
    for(const yy of [1.82,2.40,2.62])beam('Side landing front horizontal rail',[xx-1.38,yy,railFront],[xx+1.38,yy,railFront],.035,iron);
    for(let j=0;j<=12;j++)beam('Side landing front upright',[xx-1.38+j*2.76/12,1.64,railFront],[xx-1.38+j*2.76/12,2.62,railFront],.032,iron);
    for(const edge of [-1,1]){box('Side landing front square post',xx+edge*1.38,2.18,railFront,.08,1.08,.08,iron);primitive('Side landing post finial','sphere',xx+edge*1.38,2.77,railFront,.12,.12,.12,iron);}
    beam('Front steps outer handrail',[side*2.4,.78,3.6],[side*2.4,1.88,.42],.055,iron);
    for(const [zz,yy]of [[3.5,.75],[.5,1.83]])beam('Front handrail post',[side*2.4,.15,zz],[side*2.4,yy,zz],.06,iron);
  }
  // 700/710s: two inner rails frame a clear central approach. The earlier
  // single rail on x=0 incorrectly divided the middle of the double doorway.
  for(const side of [-1,1]){const railX=side*1.13;beam('Inner steps handrail',[railX,.78,3.6],[railX,1.9,.45],.055,iron);for(const [zz,yy]of [[3.5,.78],[.45,1.9]])beam('Inner handrail support',[railX,.16,zz],[railX,yy,zz],.055,iron);}
  // Paired modest lanterns, with suspended handles and glass bodies.
  for(const side of [-1,1]){const xx=side*2.36;beam('Lantern wall arm',[xx,5.15,.12],[xx,5.15,.66],.08,iron);box('Entry lantern warm glass',xx,4.83,.63,.32,.52,.28,amber);box('Lantern base',xx,4.53,.63,.42,.09,.38,iron);primitive('Lantern cap','cone',xx,5.15,.63,.52,.25,.47,iron);for(let a of [-1,1])for(let b of [-1,1])box('Lantern corner frame',xx+a*.16,4.82,.63+b*.14,.024,.53,.024,iron);}
  // Long side elevations have rectangular multipane sash windows, not repeated
  // giant arched front windows. Each is in its own rotated local frame.
  for(const side of [-1,1])for(const zz of [-9,-14.3,-19.6,-24.9,-30.2]){
    const p=new pc.Entity('Side sash-window assembly');root.addChild(p);p.setLocalPosition(side*8.65,0,zz);p.setLocalEulerAngles(0,side*90,0);
    squareWindow('Lower side sash',0,4.8,0,1.35,2.1,p);squareWindow('Upper side sash',0,9.15,0,1.35,2.1,p);
  }
  // Clock texture only: the architectural trim remains geometry.
  const clock=material('Roman numeral tower clock','ffffff');clock.diffuseMap=texture((c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#b4a578';c.beginPath();c.arc(w/2,h/2,w*.495,0,Math.PI*2);c.fill();c.fillStyle='#27302a';c.beginPath();c.arc(w/2,h/2,w*.475,0,Math.PI*2);c.fill();c.fillStyle='#c1b080';c.textAlign='center';c.textBaseline='middle';c.font='38px Georgia';const roman=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];for(let i=0;i<12;i++){const a=i*Math.PI/6;c.fillText(roman[i],w/2+Math.sin(a)*w*.36,h/2-Math.cos(a)*h*.36);}c.strokeStyle='#caba83';c.lineWidth=9;c.lineCap='round';c.beginPath();c.moveTo(w/2,h/2);c.lineTo(w*.38,h*.30);c.moveTo(w/2,h/2);c.lineTo(w*.61,h*.18);c.stroke();c.beginPath();c.arc(w/2,h/2,10,0,7);c.fill();});clock.opacityMap=clock.diffuseMap;clock.opacityMapChannel='a';clock.alphaTest=.5;clock.cull=pc.CULLFACE_NONE;clock.update();
  function imagePlane(name,cx,cy,cz,w,h,m,yaw=0){const e=primitive(name,'plane',cx,cy,cz,w,1,h,m);e.setLocalEulerAngles(90,yaw,0);return e;}
  const clockY=H.brickCap-3.2;
  imagePlane('South Roman clock',0,clockY,.13,2.55,2.55,clock);imagePlane('East Roman clock',3.23,clockY,-3.05,2.55,2.55,clock,90);imagePlane('West Roman clock',-3.23,clockY,-3.05,2.55,2.55,clock,-90);
  box('Small tower date plaque',0,H.brickCap-6.1,.1,1.03,.31,.08,white);
  // Eight-sided open lower belfry: arches have no black solid filler behind them.
  octagon('Belfry octagonal base',H.brickCap,.55,3.14,white);
  octagon('Open belfry floor',H.brickCap+.56,.20,2.95,white);
  const radius=2.78,apothem=radius*Math.cos(Math.PI/8),faceWidth=2*radius*Math.sin(Math.PI/8);
  for(let face=0;face<8;face++){
    const angle=face*Math.PI/4,p=new pc.Entity('Open belfry arch face');root.addChild(p);p.setLocalPosition(Math.sin(angle)*apothem,0,-3+Math.cos(angle)*apothem);p.setLocalEulerAngles(0,face*45,0);
    // Arch spans from floor to spring/crown with sculpted arched white molding.
    const opening=faceWidth-.35,base=H.brickCap+.76,height=H.belfryCap-.85-base;
    archBand('Open belfry arch',0,base,0,opening,height,.16,white,p,.19);
    for(const s of [-1,1])box('Belfry face pier',s*(faceWidth/2-.10),base+height/2,0,.23,height+.10,.30,white,p);
    box('Belfry upper spandrel',0,H.belfryCap-.64,0,faceWidth,.42,.23,white,p);
    for(let j=-2;j<=2;j++){box('Belfry base baluster',j*.34,base+.31,.08,.065,.72,.065,white,p);}box('Belfry small railing',0,base+.67,.08,opening,.08,.09,white,p);
  }
  for(const [yy,rr,hh] of [[H.belfryCap-.72,3.0,.22],[H.belfryCap-.45,3.17,.22],[H.belfryCap-.19,3.06,.20]])octagon('Open belfry cornice',yy,hh,rr,white);
  octagon('Upper lantern ivory body',H.belfryCap,H.lanternCap-H.belfryCap-.4,2.25,white);
  for(let face=0;face<8;face++){
    const angle=face*Math.PI/4,p=new pc.Entity('Upper lantern arched window face');root.addChild(p);p.setLocalPosition(Math.sin(angle)*2.09,0,-3+Math.cos(angle)*2.09);p.setLocalEulerAngles(0,face*45,0);
    archedWindow('Upper belfry gridded opening',0,H.belfryCap+.45,.015,1.16,H.lanternCap-H.belfryCap-1.4,p,6,15);
    for(const s of [-1,1])box('Upper lantern corner pilaster',s*.77,(H.belfryCap+H.lanternCap-.4)/2,.05,.15,H.lanternCap-H.belfryCap-.65,.13,white,p);
  }
  for(const [yy,rr,hh]of [[H.lanternCap-.75,2.4,.23],[H.lanternCap-.45,2.56,.24],[H.lanternCap-.19,2.38,.19]])octagon('Upper lantern cap',yy,hh,rr,white);
  octagon('Tapered green spire',H.lanternCap,H.coneTip-H.lanternCap,2.2,green,.025);
  primitive('Spire finial','sphere',0,H.coneTip+.12,-3,.23,.23,.23,gold);beam('Weather vane vertical',[0,H.coneTip+.05,-3],[0,H.vaneTip,-3],.065,gold);
  beam('Weather vane east-west',[-.7,H.vaneTip-1.1,-3],[.7,H.vaneTip-1.1,-3],.04,gold);beam('Weather vane north-south',[0,H.vaneTip-1.25,-3.65],[0,H.vaneTip-1.25,-2.35],.04,gold);
  primitive('Weather vane arrowhead','cone',.72,H.vaneTip-1.1,-3,.23,.45,.12,gold).setLocalEulerAngles(0,0,-90);
  root.tags.add('landmark','reference-modeled','meeting-house');
  return root;
}
