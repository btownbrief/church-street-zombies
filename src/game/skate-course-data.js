// Temporary skate installations; no approved environment geometry is changed.
export const SKATE_LINES=[
 {x:-2.7,z:66,name:'Big Joe line'}, {x:2.7,z:169,name:'Cherry slide'},
 {x:-2.7,z:282,name:'Bank transfer'}, {x:2.7,z:404,name:'College cut'},
 {x:-3,z:460,name:'City Hall finish'}
];
export function createCourseData(){
 const rails=SKATE_LINES.map((l,i)=>({x:l.x,z0:l.z-4,z1:l.z+4,height:i===2?.85:.66,name:l.name}));
 const banks=SKATE_LINES.map(l=>({x:-l.x,z:l.z+11,width:3,length:8,height:1.15,name:l.name+' bank',kind:'bank'}));
 const halfpipes=[{x:-2.6,z:215,width:4.6,length:18,height:2.35,flat:5,name:'Cherry halfpipe',kind:'halfpipe'},{x:2.4,z:345,width:4.6,length:18,height:2.35,flat:5,name:'College halfpipe',kind:'halfpipe'}];
 const features=[...banks,...halfpipes];
 function heightAt(b,z){const d=Math.abs(z-b.z);if(b.kind==='bank')return .06+b.height*Math.max(0,1-d/(b.length/2));const run=(b.length-b.flat)/2,t=Math.max(0,(d-b.flat/2)/run);return .06+b.height*(1-Math.sqrt(Math.max(0,1-t*t)));}
 function support(x,z){for(const b of features)if(Math.abs(x-b.x)<=b.width/2&&Math.abs(z-b.z)<=b.length/2)return{height:heightAt(b,z),name:b.name,kind:b.kind,feature:b};return{height:0,name:'',kind:'street',feature:null};}
 return{rails,banks,halfpipes,features,heightAt,support};
}
