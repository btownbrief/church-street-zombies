import * as pc from 'playcanvas';
import {buildWorld} from './world.js';

const status=document.querySelector('#status');
const details=document.querySelector('#details');
const button=document.querySelector('#export');
try {
  const canvas=document.querySelector('#export-preview');
  const app=new pc.Application(canvas,{graphicsDeviceOptions:{antialias:true,alpha:false}});
  app.graphicsDevice.maxPixelRatio=1;
  app.scene.ambientLight=new pc.Color(.64,.69,.74);
  const camera=new pc.Entity('Export preview camera');
  camera.addComponent('camera',{clearColor:new pc.Color(.7,.79,.84),fov:56,nearClip:.1,farClip:1400,toneMapping:pc.TONEMAP_ACES});
  camera.setPosition(215,260,530);camera.lookAt(-1,2,235);app.root.addChild(camera);
  const sun=new pc.Entity('Export preview daylight');sun.addComponent('light',{type:'directional',color:new pc.Color(1,.96,.88),intensity:1.6});sun.setEulerAngles(48,-60,0);app.root.addChild(sun);
  const environment=buildWorld(app);
  const assetRoot=new pc.Entity('Burlington Church Street — Pearl to Main');app.root.addChild(assetRoot);
  // Export the original model hierarchy, not generated static batching copies.
  const batchIds=new Set();
  for(const root of environment.roots)for(const render of root.findComponents('render'))if(render.batchGroupId>=0)batchIds.add(render.batchGroupId);
  for(const id of batchIds)app.batcher.removeGroup(id);
  for(const root of environment.roots){
    assetRoot.addChild(root);
    for(const render of root.findComponents('render')){
      render.batchGroupId=-1;render.enabled=true;
      for(const instance of render.meshInstances)instance.visible=true;
    }
  }
  const renders=assetRoot.findComponents('render');
  const meshes=new Set(),materials=new Set();
  let meshInstances=0;
  for(const render of renders)for(const instance of render.meshInstances){meshes.add(instance.mesh);materials.add(instance.material);meshInstances++;}
  const inventory={scope:'Pearl Street to Main Street, including meeting house and civic landmarks',units:'metres',axes:'PlayCanvas/glTF Y up; X east; Z south',streetLengthMetres:environment.geo.streetLength,rootSections:environment.roots.length,renderComponents:renders.length,meshInstances,uniqueMeshes:meshes.size,materials:materials.size,quality:'GIS footprints and grade, video-referenced facade geometry; above-ground dimensions and hidden details estimated'};
  details.textContent=JSON.stringify(inventory,null,2);
  const exporter=new pc.GltfExporter();
  await environment.ready;
  button.disabled=false;status.textContent='Ready. Geometry and textures will be embedded in the downloaded GLB.';
  button.addEventListener('click',async()=>{
    button.disabled=true;status.textContent='Exporting geometry and embedded textures…';
    try {
      const data=await exporter.build(assetRoot,{maxTextureSize:1024,stripUnusedAttributes:true});
      const blob=new Blob([data],{type:'model/gltf-binary'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='church-street-full.glb';document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      status.textContent=`Export complete: ${(data.byteLength/1024/1024).toFixed(1)} MB GLB. Check your Downloads folder.`;
      details.textContent=JSON.stringify({...inventory,exportedAt:new Date().toISOString(),bytes:data.byteLength},null,2);
    }catch(error){status.textContent='Export failed: '+error.message;console.error(error);}
    finally {button.disabled=false;}
  });
  app.start();
}catch(error){status.textContent='Export setup failed: '+error.message;console.error(error);}
