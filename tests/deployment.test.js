import test from 'node:test';
import assert from 'node:assert/strict';
import {Asset,AssetRegistry} from 'playcanvas';

test('PlayCanvas resolves preserved root-relative scenery and rider assets under the Pages slug',()=>{
 const registry=new AssetRegistry({});registry.prefix='/church-street-zombies';
 for(const url of ['/reference-textures/northfield-sign.png','/assets/skater.glb']){
  const asset=new Asset('deployed asset','texture',{url});registry.add(asset);
  assert.equal(asset.getFileUrl(),'/church-street-zombies'+url);
 }
 const remote=new Asset('external asset','texture',{url:'https://example.com/image.png'});registry.add(remote);
 assert.equal(remote.getFileUrl(),'https://example.com/image.png');
 registry.prefix='';assert.equal(registry.getByUrl('/assets/skater.glb').getFileUrl(),'/assets/skater.glb');
});
