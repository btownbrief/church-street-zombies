import bpy, math, os
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def xyz(p): return (p[0],-p[2],p[1])
def material(name,hex,rough=.8,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=tuple(int(hex[i:i+2],16)/255 for i in (0,2,4))+(1,);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=m.diffuse_color;n.inputs['Roughness'].default_value=rough;n.inputs['Metallic'].default_value=metal;return m
cloth=material('Deep spruce cotton hoodie','30494c');seam=material('Raised cotton seams','3f5b5c');lining=material('Hood lining','202f33');pants=material('Washed charcoal denim','30363b');denim=material('Denim seams','465052');skin=material('Warm skin','b88b6b',.65);hair=material('Cropped dark hair','302b26');sole=material('Worn offwhite rubber','c9c6b8');shoe=material('Suede skate shoes','443e38');lace=material('Cotton laces','d9d6c9');accent=material('Ochre label','c49b5b');black=material('Grip tape','202a29',1);wood=material('Maple deck ply','b89461');steel=material('Brushed trucks','8d9696',.4,.65)
def empty(name,parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=parent;return o
root=empty('SkaterAsset');body=empty('RiderBody',root);board=empty('Skateboard',root)
def finish(o,name,m,parent):
 o.name=name;o.data.materials.append(m);o.parent=parent
 for f in o.data.polygons:f.use_smooth=True
 return o
def ell(name,p,s,m,parent=body):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=xyz(p));o=bpy.context.object;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,m,parent)
def box(name,p,s,m,bevel=.025,parent=body):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);b=o.modifiers.new('Soft sewn edges','BEVEL');b.width=bevel;b.segments=3;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=b.name);o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return finish(o,name,m,parent)
def segment(name,a,b,r1,r2,m,parent=body,depth=1):
 av,bv=Vector(xyz(a)),Vector(xyz(b));d=bv-av;bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=r1,radius2=r2,depth=d.length,location=(av+bv)/2);o=bpy.context.object;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();bev=o.modifiers.new('Cloth rounding','BEVEL');bev.width=min(r1,r2)*.4;bev.segments=3;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=bev.name);return finish(o,name,m,parent)
def line(name,pts,r,m,parent=body):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=2;curve.bevel_depth=r;curve.bevel_resolution=2;poly=curve.splines.new('POLY');poly.points.add(len(pts)-1)
 for v,p in zip(poly.points,pts):v.co=(*xyz(p),1)
 bpy.ops.object.select_all(action='DESELECT')
 o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);o.parent=parent;o.data.materials.append(m);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False);return o
# Tailored torso: human proportions, shoulders along the board; chest faces left.
rings=[(.91,.14,.20),(1.00,.155,.205),(1.12,.18,.235),(1.30,.175,.25),(1.38,.145,.205)]
verts=[];faces=[]
for y,rx,rz in rings:
 for i in range(24):a=i*2*math.pi/24;verts.append(xyz((rx*math.cos(a)-.04,y,rz*math.sin(a))))
for j in range(len(rings)-1):
 for i in range(24):a=j*24+i;b=j*24+(i+1)%24;faces.append((a,b,b+24,a+24))
faces.extend([tuple(range(23,-1,-1)),tuple(range(96,120))]);mesh=bpy.data.meshes.new('Hoodie tailored mesh');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('Hoodie',mesh);bpy.context.collection.objects.link(o);finish(o,'Hoodie',cloth,body);sub=o.modifiers.new('Smooth cloth','SUBSURF');sub.levels=1;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=sub.name)
ell('Hood folded down',(.09,1.35,.015),(.10,.075,.14),cloth);ell('Hood opening',(.07,1.40,0),(.075,.025,.09),lining)
line('Ribbed hem',[(.125*math.cos(i*math.pi/16)-.04,.96,.20*math.sin(i*math.pi/16)) for i in range(33)],.014,seam)
line('Pocket seam',[(-.199,1.07,-.135),(-.219,1.015,-.09),(-.219,1.015,.10),(-.199,1.07,.14)],.005,seam)
for z in [-.065,.065]:line('Hood drawstring',[(-.16,1.36,z),(-.224,1.25,z*.9),(-.213,1.18,z)],.003,lace)
box('Small hem patch',(-.18,1.005,.14),(.016,.038,.05),accent,.003)
# Bent knees; shoes point across the board instead of down its length.
for sign in [-1,1]:
 z=sign*.255;hip=(-.015,.97,sign*.15);knee=(-.145,.58,z);ankle=(.005,.255,z)
 segment('Denim upper leg',hip,knee,.117,.097,pants);ell('Soft denim knee',knee,(.103,.109,.10),pants);segment('Denim lower leg',knee,ankle,.098,.064,pants)
 line('Outside denim seam',[(hip[0]+.08,hip[1],hip[2]+sign*.075),(knee[0]+.055,knee[1],knee[2]+sign*.075),(ankle[0]+.04,ankle[1],ankle[2]+sign*.05)],.004,denim)
 box('Rubber sole',(-.065,.193,z),(.30,.055,.135),sole,.027);box('Suede upper',(-.065,.245,z),(.28,.10,.128),shoe,.042)
 for x in [-.10,-.07,-.04]:line('Shoelaces',[(x,.302,z-.035),(x-.012,.308,z+.035)],.003,lace)
 # Relaxed asymmetrical arms facing the nose of the board.
 shoulder=(-.055,1.31,sign*.23);elbow=(-.22,1.04,sign*.34);wrist=(-.32,.95,sign*.28)
 segment('Hoodie sleeve',shoulder,elbow,.098,.075,cloth);ell('Elbow crease',elbow,(.073,.075,.075),cloth);segment('Lower sleeve',elbow,wrist,.075,.047,cloth);ell('Cuff',wrist,(.054,.048,.05),lining)
 hand=(wrist[0]-.055,wrist[1]-.028,wrist[2]);ell('Hand',hand,(.068,.045,.05),skin)
 for k in range(3):ell('Finger',(hand[0]-.038,hand[1]-.013,hand[2]+(k-1)*.022),(.031,.015,.012),skin)
segment('Neck',(-.035,1.34,0),(-.035,1.47,0),.068,.062,skin)
ell('Head',(-.065,1.575,-.025),(.107,.142,.106),skin);ell('Jaw',(-.07,1.514,-.061),(.079,.074,.070),skin)
# A fitted scalp cap: high hairline at the face, lower at the nape. No hat.
hv=[];hf=[];segments=32;rows=10
for j in range(rows+1):
 for i in range(segments):
  phi=i*2*math.pi/segments;theta=(.99+.72*(math.sin(phi)+1)/2)*j/rows
  hv.append(xyz((-.065+.110*math.sin(theta)*math.cos(phi),1.575+.145*math.cos(theta),-.025+.110*math.sin(theta)*math.sin(phi))))
for j in range(rows):
 for i in range(segments):a=j*segments+i;b=j*segments+(i+1)%segments;hf.append((a,b,b+segments,a+segments))
hm=bpy.data.meshes.new('Fitted cropped hair');hm.from_pydata(hv,[],hf);hm.update();ho=bpy.data.objects.new('Cropped hair',hm);bpy.context.collection.objects.link(ho);finish(ho,'Cropped hair',hair,body)
for side in [-1,1]:ell('Ear',(-.065+side*.108,1.572,-.013),(.02,.037,.027),skin)
ell('Nose',(-.072,1.575,-.134),(.023,.035,.026),skin)
for x in [-.112,-.031]:ell('Eye',(x,1.606,-.116),(.019,.01,.009),lining)
line('Mouth',[(-.105,1.531,-.122),(-.072,1.526,-.13),(-.039,1.531,-.122)],.0025,shoe)
# Shaped maple skateboard with upturned kicks, proper trucks and four wheels.
outline=[]
for i in range(48):a=i*math.pi/24;outline.append((.135*math.cos(a),.155+.045*abs(math.sin(a))**8,.48*math.sin(a)))
verts=[xyz((0,.155,0))]+[xyz(p) for p in outline]+[xyz((x,y-.035,z)) for x,y,z in outline];faces=[]
for i in range(48):a=1+i;b=1+(i+1)%48;faces.extend([(0,a,b),(a,a+48,b+48,b)])
mesh=bpy.data.meshes.new('Maple concave deck');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('Maple deck',mesh);bpy.context.collection.objects.link(o);finish(o,'Maple deck',wood,board)
# inset grip follows the same outline
verts=[xyz((0,.157,0))]+[xyz((x*.93,y+.002,z*.97)) for x,y,z in outline];faces=[(0,i+1,(i+1)%48+1) for i in range(48)];mesh=bpy.data.meshes.new('Grip');mesh.from_pydata(verts,[],faces);o=bpy.data.objects.new('Griptape',mesh);bpy.context.collection.objects.link(o);finish(o,'Griptape',black,board)
for z in [-.30,.30]:
 box('Truck base',(0,.11,z),(.09,.026,.075),steel,.005,board);segment('Axle',(-.15,.065,z),(.15,.065,z),.017,.017,steel,board)
 for x in [-.15,.15]:
  segment('Urethane wheel',(x-.025,.065,z),(x+.025,.065,z),.043,.043,sole,board);segment('Axle nut',(x-.028,.065,z),(x+.028,.065,z),.013,.013,steel,board)
# Fuse connected garment pieces into continuous, softly folded surfaces.
# Seams/laces stay separate so small details survive the remesh.
for garment,mat,voxel in [('Cotton garment',cloth,.009),('Denim trousers',pants,.008),('Skin',skin,.006)]:
 parts=[o for o in list(bpy.context.scene.objects) if o.type=='MESH' and len(o.data.materials)==1 and o.data.materials[0]==mat]
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name=garment
 rem=o.modifiers.new('Continuous surface','REMESH');rem.mode='VOXEL';rem.voxel_size=voxel;rem.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=rem.name)
 sm=o.modifiers.new('Relax fabric','SMOOTH');sm.factor=.9;sm.iterations=4;bpy.ops.object.modifier_apply(modifier=sm.name)
 dec=o.modifiers.new('Mobile mesh budget','DECIMATE');dec.ratio=.32;bpy.ops.object.modifier_apply(modifier=dec.name)
 for face in o.data.polygons:face.use_smooth=True
# Merge static detail by material within rider/board: few draw calls on phones.
for parent in [body,board]:
 for mat in list(bpy.data.materials):
  parts=[o for o in list(bpy.context.scene.objects) if o.type=='MESH' and o.parent==parent and len(o.data.materials)==1 and o.data.materials[0]==mat]
  if len(parts)<2:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in parts:o.select_set(True)
  bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();bpy.context.object.name=parent.name+' '+mat.name
# Authored deformation poses keep the shoes planted while knees bend and the
# rear foot steps off the deck to push. These export as named glTF morph targets.
for o in list(bpy.context.scene.objects):
 if o.type!='MESH' or o.parent!=body:continue
 bpy.context.view_layer.objects.active=o
 for mod in list(o.modifiers):
  try:bpy.ops.object.modifier_apply(modifier=mod.name)
  except RuntimeError:o.modifiers.remove(mod)
 o.shape_key_add(name='Basis');crouch=o.shape_key_add(name='Crouch');push=o.shape_key_add(name='Push');run_left=o.shape_key_add(name='RunLeft');run_right=o.shape_key_add(name='RunRight');head_turn=o.shape_key_add(name='RunnerFacing');slide=o.shape_key_add(name='Slide');matrix=o.matrix_world;inverse=matrix.inverted()
 for i,v in enumerate(o.data.vertices):
  q=matrix@v.co;x,z,y=q.x,-q.y,q.z
  knots=[(.28,0,0),(.58,-.11,-.10),(.97,-.21,-.035),(2,-.21,-.035)];dy=dx=0
  for a,b in zip(knots,knots[1:]):
   if a[0]<=y<=b[0]:t=(y-a[0])/(b[0]-a[0]);dy=a[1]+(b[1]-a[1])*t;dx=a[2]+(b[2]-a[2])*t;break
  crouch.data[i].co=inverse@Vector(xyz((x+dx,y+dy,z)))
  rear=max(0,min(1,(z-.1)/.11));leg=max(0,min(1,(.96-y)/.68));w=rear*leg
  push.data[i].co=inverse@Vector(xyz((x+.16*w,y-.145*w,z+.36*w-(.035 if y>1 else 0))))
  for sign,key in [(1,run_left),(-1,run_right)]:
   side=(1 if z>0 else -1)*sign;leg=max(0,min(1,(.97-y)/.72));arm=max(0,min(1,(abs(z)-.25)/.08)) if .82<y<1.42 else 0
   key.data[i].co=inverse@Vector(xyz((x+side*.32*leg-side*.16*arm,y+(.04+.10*max(0,side))*leg,z)))
  turn=max(0,min(1,(y-1.40)/.10))*math.pi/2;hx=x+.065;hz=z+.025
  head_turn.data[i].co=inverse@Vector(xyz((-.065+hx*math.cos(turn)+hz*math.sin(turn),y,-.025-hx*math.sin(turn)+hz*math.cos(turn))))
  sy=.20+(y-.20)*.34 if y>.20 else y;sx=x-.1*max(0,min(1,(y-.3)/.9))
  slide.data[i].co=inverse@Vector(xyz((sx,sy,z)))
# Export only assets; renderer lights/camera are not bundled.
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:o.select_set(True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/assets/source/skater.blend')
bpy.ops.export_scene.gltf(filepath=ROOT+'/public/assets/skater.glb',export_format='GLB',use_selection=True,export_apply=False)
# A studio preview for visual inspection.
bpy.ops.object.light_add(type='AREA',location=(3,-4,5));bpy.context.object.data.energy=450;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=4
bpy.ops.object.light_add(type='AREA',location=(-3,2,3));bpy.context.object.data.energy=280;bpy.context.object.data.size=3
bpy.ops.object.camera_add(location=(2.9,3.5,2.1));cam=bpy.context.object;target=Vector((0,0,.85));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.2;bpy.context.scene.camera=cam
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=800;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.world.color=(.24,.27,.28);scene.render.filepath=ROOT+'/work/renders/skater.png';bpy.ops.render.render(write_still=True)
