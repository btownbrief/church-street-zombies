import * as pc from 'playcanvas';

// Source-informed sculptural interpretations, not scans. Positions/dimensions
// are estimates; see research/visual-polish/statue-notes.md.
export const publicArtSites=[
  {id:'joe',name:'Big Joe Burrell · pointing with saxophone',x:6.4,z:61,yaw:75,r:.95},
  {id:'leapfrog',name:'Leap Froggers · two children',x:6.6,z:90,yaw:0,r:.95},
  {id:'deer',name:'Frank Stout deer · north of City Hall stairs',x:-15.65,z:450.3,yaw:80,r:1.1},
  {id:'bear',name:'Frank Stout seated bear and cub · south of City Hall stairs',x:-15.65,z:470.3,yaw:-85,r:1.1}
];
const palette={bronze:'76634a',bronzeLight:'a58b65',bronzeDark:'3d4035',patina:'526c5d',copper:'5e7d68',recess:'222a24',granite:'a8a69b',graniteSide:'92958b'};

export function createPublicArtGeometry(geo={}){
  const ground=geo.terrainAt||((x,z)=>geo.groundAt?.(z)||0),records=[];
  for(const site of publicArtSites){
    const groups=new Map(),a=site.yaw*Math.PI/180,cs=Math.cos(a),sn=Math.sin(a),groundY=ground(site.x,site.z);
    const transform=([x,y,z])=>[site.x+x*cs+z*sn,groundY+y,site.z-x*sn+z*cs];
    function add(mat,p,idx){let g=groups.get(mat);if(!g){g={material:mat,positions:[],indices:[]};groups.set(mat,g);}const n=g.positions.length/3;for(let i=0;i<p.length;i+=3)g.positions.push(...transform(p.slice(i,i+3)));g.indices.push(...idx.map(i=>i+n));}
    function oval(c,r,mat='bronze',tilt=0){const p=[],idx=[],rows=10,sides=16,ct=Math.cos(tilt),st=Math.sin(tilt);
      for(let j=0;j<=rows;j++)for(let i=0;i<=sides;i++){const v=j*Math.PI/rows,u=i*2*Math.PI/sides,x=r[0]*Math.sin(v)*Math.cos(u),y=r[1]*Math.cos(v),z=r[2]*Math.sin(v)*Math.sin(u);p.push(c[0]+x,c[1]+y*ct-z*st,c[2]+y*st+z*ct);}
      for(let j=0;j<rows;j++)for(let i=0;i<sides;i++){const q=j*(sides+1)+i;if(j>0)idx.push(q,q+1,q+sides+1);if(j<rows-1)idx.push(q+1,q+sides+2,q+sides+1);}add(mat,p,idx);
    }
    function tube(a,b,r0,r1=r0,mat='bronze',sides=12,caps=true){const d=b.map((v,i)=>v-a[i]),len=Math.hypot(...d);if(len<1e-8)return;d.forEach((v,i)=>d[i]=v/len);let u=Math.abs(d[1])>.9?[1,0,0]:[-d[2],0,d[0]],ul=Math.hypot(...u);u=u.map(v=>v/ul);const v=[d[1]*u[2]-d[2]*u[1],d[2]*u[0]-d[0]*u[2],d[0]*u[1]-d[1]*u[0]],p=[],idx=[];
      for(const [center,r]of[[a,r0],[b,r1]])for(let i=0;i<sides;i++){const t=i*2*Math.PI/sides;p.push(...center.map((q,k)=>q+r*(u[k]*Math.cos(t)+v[k]*Math.sin(t))));}
      for(let i=0;i<sides;i++){const n=(i+1)%sides;idx.push(i,n,i+sides,n,n+sides,i+sides);}if(caps){p.push(...a,...b);for(let i=0;i<sides;i++){const n=(i+1)%sides;idx.push(2*sides,n,i,2*sides+1,i+sides,n+sides);}}add(mat,p,idx);
    }
    function box(c,s,mat='granite'){const p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].flatMap(q=>q.map((v,i)=>c[i]+v*s[i]/2));add(mat,p,[0,3,2,0,2,1,4,5,6,4,6,7,0,4,7,0,7,3,1,2,6,1,6,5,3,7,6,3,6,2,0,1,5,0,5,4]);}
    function limb(points,radii,mat='bronze'){for(let i=1;i<points.length;i++){tube(points[i-1],points[i],radii[i-1],radii[i],mat);if(i<points.length-1)oval(points[i],[radii[i],radii[i],radii[i]],mat);}}
    function face(x,y,z,scale=1,mat='bronze'){oval([x,y,z],[.145*scale,.19*scale,.14*scale],mat);oval([x,y-.025*scale,z-.14*scale],[.042*scale,.06*scale,.055*scale],mat);for(const side of[-1,1]){oval([x+side*.063*scale,y+.025*scale,z-.127*scale],[.04*scale,.023*scale,.015*scale],'bronzeDark');oval([x+side*.064*scale,y+.024*scale,z-.139*scale],[.019*scale,.014*scale,.009*scale],mat);oval([x+side*.146*scale,y-.004*scale,z],[.025*scale,.05*scale,.037*scale],mat);}oval([x,y-.098*scale,z-.124*scale],[.05*scale,.01*scale,.018*scale],'bronzeDark');}
    function shoe(c,s=[.10,.065,.19],mat='bronzeDark'){oval(c,s,mat);}
    if(site.id==='joe'){
      const base=.27;box([0,base/2,0],[1.6,base,1.45]);box([0,base+.008,-.52],[.75,.014,.3],'bronzeDark');
      const P=(x,y,z)=>[x,y+base,z];
      for(const side of[-1,1]){limb([P(side*.16,.87,0),P(side*.17,.43,side*.035),P(side*.18,.09,-.015)],[.135,.11,.09]);shoe(P(side*.18,.075,-.07),[.115,.075,.22]);tube(P(side*.16,.83,-.11),P(side*.17,.17,-.105),.009,.007,'bronzeLight');}
      oval(P(0,1.15,.015),[.345,.45,.225]);oval(P(0,1.43,.015),[.34,.105,.205]);
      // Jacket lapels, waist seam, pocket square and shirt/tie separate the suit silhouette.
      for(const side of[-1,1]){tube(P(side*.13,1.52,-.15),P(side*.21,1.30,-.21),.065,.04,'bronzeLight');tube(P(side*.21,1.30,-.21),P(.025,1.02,-.218),.04,.025,'bronzeLight');}
      tube(P(.02,1.49,-.205),P(.02,1.17,-.244),.04,.025,'bronzeDark');box(P(.23,1.28,-.204),[.14,.035,.028],'bronzeLight');
      for(let j=0;j<3;j++)oval(P(.025,1.1-j*.12,-.23),[.016,.016,.015],'bronzeDark');
      face(0,base+1.76,-.06,1.08);oval(P(0,1.63,-.115),[.12,.06,.11],'bronzeDark');
      for(let k=0;k<12;k++){const t=k*Math.PI/6;oval(P(.13*Math.cos(t),1.88,.015+.095*Math.sin(t)),[.055,.046,.065],'bronzeDark');}
      // Right hand points out at the viewer; left hand holds the saxophone.
      limb([P(-.30,1.43,0),P(-.43,1.28,-.23),P(-.36,1.63,-.59)],[.125,.095,.078]);oval(P(-.36,1.66,-.64),[.085,.07,.105]);
      tube(P(-.37,1.70,-.69),P(-.37,1.70,-.88),.028,.022,'bronzeLight');for(let j=0;j<3;j++)oval(P(-.32+j*.018,1.635-j*.029,-.695),[.043,.027,.05]);
      limb([P(.30,1.43,0),P(.43,1.03,-.03),P(.13,1.00,-.37)],[.12,.10,.074]);oval(P(.12,1.01,-.37),[.075,.052,.10]);
      const sax=[P(0,1.70,-.228),P(.08,1.60,-.31),P(.04,1.48,-.33),P(-.18,.66,-.30),P(-.13,.54,-.38),P(.01,.58,-.46),P(.06,.76,-.49)];
      for(let j=1;j<sax.length;j++)tube(sax[j-1],sax[j],j<3?.025:.042,j<3?.03:.045,'bronzeDark');
      tube(P(-.11,.68,-.32),P(.045,1.4,-.355),.011,.011,'bronzeLight');
      for(let j=0;j<9;j++){const t=j/8;oval(P(-.12+.16*t,.72+.63*t,-.382),[.036,.018,.022],'bronzeLight');}
      // Open flared bell: separate inner ring prevents a solid ball-ended sax.
      const bellStart=P(.045,.68,-.47),bellEnd=P(.045,.80,-.62);tube(bellStart,bellEnd,.045,.145,'bronzeLight',24,false);tube(bellEnd,P(.045,.73,-.55),.137,.036,'bronzeDark',24,false);oval(P(.045,.713,-.531),[.032,.022,.032],'recess');
      for(let j=0;j<3;j++)tube(P(.17+j*.024,1.04,-.43),P(.11+j*.024,.98,-.424),.014,.012,'bronzeLight');
    }else if(site.id==='leapfrog'){
      const base=.08;box([0,.04,0],[1.25,.08,1.45],'bronzeDark');const P=(x,y,z)=>[x,y+base,z],m='copper';
      // Bent child: shirt horizontal, head down, hands braced at the knees.
      oval(P(0,.87,.09),[.24,.19,.39],m,-.16);oval(P(0,.85,.37),[.25,.18,.18],m);
      for(const side of[-1,1]){limb([P(side*.15,.83,.31),P(side*.18,.45,.17),P(side*.19,.10,.10)],[.12,.092,.07],m);shoe(P(side*.19,.08,-.01),[.115,.075,.18],m);limb([P(side*.21,.9,-.20),P(side*.26,.55,-.05),P(side*.17,.44,.12)],[.078,.065,.05],m);}
      face(0,base+.69,-.40,.94,m);oval(P(0,.78,-.40),[.153,.10,.155],'bronzeDark');
      // Vaulting girl: splayed bent legs, skirt, both palms touching the back.
      oval(P(0,1.54,-.005),[.235,.29,.16],m,.30);tube(P(0,1.38,.08),P(0,1.22,.13),.23,.35,m,20);
      for(const side of[-1,1]){limb([P(side*.16,1.31,.17),P(side*.50,1.12,.10),P(side*.63,1.18,-.14)],[.085,.072,.05],m);shoe(P(side*.66,1.18,-.24),[.095,.07,.17],m);limb([P(side*.20,1.72,-.055),P(side*.25,1.36,-.085),P(side*.23,1.045,.03)],[.071,.06,.048],m);oval(P(side*.23,1.035,.02),[.065,.025,.075],m);}
      face(0,base+1.99,-.15,.95,m);oval(P(0,2.11,-.10),[.15,.065,.14],'bronzeDark');
      for(const side of[-1,1]){const braid=[P(side*.14,2.06,-.05),P(side*.25,1.98,.10),P(side*.38,2.015,.25)];limb(braid,[.035,.035,.023],m);for(let j=0;j<4;j++)oval(P(side*(.16+j*.05),2.035-j*.012,.015+j*.06),[.038,.03,.035],m);}
      // Collars and dress seam visible in the front reference.
      for(const side of[-1,1])tube(P(side*.05,1.87,-.19),P(side*.13,1.78,-.20),.035,.025,'bronzeLight');tube(P(0,1.82,-.18),P(0,1.47,-.15),.013,.012,'bronzeDark');
    }else if(site.id==='bear'){
      const base=.75;box([0,base/2,0],[1.85,base,1.55]);box([0,base+.025,0],[1.94,.05,1.64]);const P=(x,y,z)=>[x,y+base+.05,z],m='patina';
      // Photo21: round seated haunch, forelegs down, cub sleeping over the back.
      oval(P(-.24,.61,.11),[.62,.63,.47],m);oval(P(.22,.88,-.12),[.35,.40,.36],m);oval(P(.30,1.17,-.32),[.27,.29,.24],m);
      oval(P(.31,1.08,-.52),[.16,.13,.14],m);oval(P(.31,1.12,-.637),[.09,.055,.029],'bronzeDark');
      for(const side of[-1,1]){oval(P(.30+side*.215,1.40,-.27),[.085,.085,.06],m);oval(P(.30+side*.112,1.22,-.529),[.025,.023,.016],'recess');}
      limb([P(.43,.87,-.20),P(.63,.50,-.31),P(.61,.12,-.36)],[.18,.18,.17],m);oval(P(.58,.105,-.46),[.21,.10,.22],m);
      limb([P(.05,.84,-.20),P(.02,.45,-.41),P(-.03,.12,-.44)],[.16,.14,.16],m);oval(P(-.10,.13,-.48),[.22,.13,.17],m);
      oval(P(-.42,.20,-.16),[.34,.22,.28],m);oval(P(-.48,.12,-.36),[.21,.14,.23],m);
      // Cub's low curled body and resting muzzle, not a second upright bear.
      oval(P(-.35,1.20,.13),[.30,.17,.20],m);oval(P(-.10,1.24,.10),[.145,.125,.13],m);oval(P(-.01,1.20,.015),[.11,.065,.09],m);for(const side of[-1,1])oval(P(-.12+side*.10,1.35,.08),[.043,.05,.04],m);oval(P(-.45,1.15,-.06),[.14,.07,.13],m);
      for(let j=0;j<3;j++)tube(P(.49+j*.065,.125,-.62),P(.49+j*.065,.09,-.65),.018,.011,'bronzeDark');
    }else{
      const base=.67;box([0,base/2,.25],[1.6,base,1.4]);box([0,.20,-.69],[1.6,.40,.5]);const P=(x,y,z)=>[x,y+base,z],m='patina';
      oval(P(0,1.00,.17),[.27,.37,.60],m);oval(P(0,1.19,-.20),[.255,.40,.27],m);
      limb([P(0,1.19,-.26),P(0,1.64,-.45),P(0,1.84,-.56)],[.21,.145,.12],m);oval(P(0,1.89,-.61),[.14,.18,.25],m);oval(P(0,1.81,-.85),[.10,.09,.13],m);oval(P(0,1.83,-.963),[.072,.045,.035],'bronzeDark');
      for(const side of[-1,1]){oval(P(side*.20,2.0,-.53),[.18,.065,.10],m);oval(P(side*.118,1.94,-.72),[.028,.027,.012],'recess');
        const crown=[P(side*.10,2.01,-.53),P(side*.17,2.25,-.43),P(side*.28,2.47,-.50),P(side*.34,2.64,-.57)];limb(crown,[.045,.035,.025,.009],m);
        limb([P(side*.16,2.23,-.44),P(side*.21,2.40,-.67),P(side*.23,2.51,-.72)],[.027,.02,.008],m);tube(P(side*.25,2.42,-.48),P(side*.39,2.58,-.36),.024,.008,m);
      }
      // One foreleg steps down to the lower stone, the other folds forward.
      limb([P(-.19,.97,-.19),P(-.22,.56,-.30),P(-.17,-.15,-.67)],[.10,.061,.04],m);shoe(P(-.17,-.20,-.72),[.075,.055,.12],'bronzeDark');
      limb([P(.18,.98,-.20),P(.20,.46,-.58),P(.18,.08,-.40)],[.10,.06,.04],m);shoe(P(.18,.035,-.46),[.075,.05,.12],'bronzeDark');
      for(const side of[-1,1]){limb([P(side*.18,1.0,.56),P(side*.21,.49,.67),P(side*.20,.08,.73)],[.12,.055,.035],m);shoe(P(side*.20,.04,.68),[.07,.04,.11],'bronzeDark');}
      oval(P(0,1.24,.73),[.10,.075,.19],m,-.5);
    }
    records.push({site:{...site,groundY},groups:[...groups.values()]});
  }
  return records;
}

export function buildPublicArt(app,geo={}){
  const root=new pc.Entity('Church Street public art · reference interpretations');app.root.addChild(root);
  const materials={};for(const [name,hex]of Object.entries(palette)){const m=new pc.StandardMaterial();m.name=`Public art ${name}`;m.diffuse=new pc.Color(...hex.match(/../g).map(v=>parseInt(v,16)/255));m.useMetalness=true;m.metalness=name.startsWith('granite')?0:.62;m.gloss=name.startsWith('granite')?.18:.40;m.update();materials[name]=m;}
  const records=createPublicArtGeometry(geo),obstacles=[];
  for(const {site,groups}of records){const sculpture=new pc.Entity(site.name);root.addChild(sculpture);for(const g of groups){const mesh=pc.createMesh(app.graphicsDevice,g.positions,{indices:g.indices,normals:pc.calculateNormals(g.positions,g.indices)});const e=new pc.Entity(`${site.id} ${g.material}`);e.addComponent('render',{meshInstances:[new pc.MeshInstance(mesh,materials[g.material])]});sculpture.addChild(e);}obstacles.push({x:site.x,z:site.z,r:site.r});}
  root.publicArtProvenance={source:'Existing Runner reference photos11,15,16,17,21,22; earlier game code used as a starting point only',accuracy:'Procedural visual interpretations. Site positions, dimensions, faces and rear surfaces estimated. No scanned geometry.',sites:records.map(r=>r.site)};
  return {root,obstacles};
}
