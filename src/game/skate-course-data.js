// Temporary skate installations; no approved environment geometry is changed.
export const SKATE_LINES=[
 {x:-2.7,z:66,name:'Big Joe line'}, {x:2.7,z:169,name:'Cherry slide'},
 {x:-2.7,z:282,name:'Bank transfer'}, {x:2.7,z:404,name:'College cut'},
 {x:-3,z:460,name:'City Hall finish'}
];
// Extra grind rails between the lines (no bank behind them), plus the real street
// benches: their seats are rideable at seat height. Bench positions mirror the
// approved street-props layout; no world geometry is added or moved.
export const EXTRA_RAILS=[
 {x:2.7,z:100,length:8,name:'Pharmacy rail'}, {x:-2.7,z:145,length:10,name:'Cherry crossing rail'},
 {x:2.7,z:250,length:12,name:'Bank Street long rail'}, {x:-2.7,z:320,length:8,name:'Bookstore rail'},
 {x:2.7,z:371,length:8,name:'College crossing rail'}, {x:-2.7,z:440,length:8,name:'City Hall rail'}
];
export const BENCHES=[[-7.8,35],[7.8,62],[-7.8,101],[7.8,162],[-7.8,185],[7.8,212],[-7.8,280],[7.8,307],[-7.8,330],[7.8,399],[7.8,470]];
export function createCourseData(){
 const rails=[...SKATE_LINES.map((l,i)=>({x:l.x,z0:l.z-4,z1:l.z+4,height:i===2?.7:.55,name:l.name})),
  ...EXTRA_RAILS.map(r=>({x:r.x,z0:r.z-r.length/2,z1:r.z+r.length/2,height:.55,name:r.name})),
  ...BENCHES.map(([x,z],i)=>({x,z0:z-.95,z1:z+.95,height:.5,name:`Bench ${i+1}`,bench:true}))];
 const banks=SKATE_LINES.map(l=>({x:-l.x,z:l.z+11,width:3,length:8,height:1.15,name:l.name+' bank',kind:'bank'}));
 const halfpipes=[{x:-2.6,z:215,width:4.6,length:18,height:2.35,flat:5,name:'Cherry halfpipe',kind:'halfpipe'},{x:2.4,z:345,width:4.6,length:18,height:2.35,flat:5,name:'College halfpipe',kind:'halfpipe'}];
 const features=[...banks,...halfpipes];
 function heightAt(b,z){const d=Math.abs(z-b.z);if(b.kind==='bank')return .06+b.height*Math.max(0,1-d/(b.length/2));const run=(b.length-b.flat)/2,t=Math.max(0,(d-b.flat/2)/run);return .06+b.height*(1-Math.sqrt(Math.max(0,1-t*t)));}
 function support(x,z){for(const b of features)if(Math.abs(x-b.x)<=b.width/2&&Math.abs(z-b.z)<=b.length/2)return{height:heightAt(b,z),name:b.name,kind:b.kind,feature:b};return{height:0,name:'',kind:'street',feature:null};}
 return{rails,banks,halfpipes,features,heightAt,support};
}
