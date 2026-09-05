import test from 'node:test';
import assert from 'node:assert/strict';
import {createNavigation,waveConfig,raySphere} from '../src/game/navigation.js';
import {createSkater,popSkater,updateSkater} from '../src/game/skate.js';
const world={obstacles:[{x:0,z:12,r:1.8}],walkBoundsAt:z=>({minX:z<20?-5:-3,maxX:5})};
const makeNav=()=>createNavigation(world,{minX:-5,maxX:5,minZ:0,maxZ:35});
test('Enemy routes around a large street obstacle and reaches target without clipping',()=>{const nav=makeNav(),p={x:0,z:5};nav.update(0,19);for(let i=0;i<1500;i++){const d=nav.direction(p.x,p.z,0,19),n=Math.hypot(d.x,d.z);if(n<.15)break;nav.move(p,d.x/n*.045,d.z/n*.045);assert(nav.clear(p.x,p.z));}assert(Math.hypot(p.x,p.z-19)<.8,JSON.stringify(p));});
test('Player collision uses swept movement and building envelope',()=>{const nav=makeNav(),p={x:0,z:5};nav.move(p,0,20);assert(p.z<10);nav.move(p,-100,0);assert(p.x>-5);assert(!nav.clear(-4,25));});
test('Nav field connects all sides of a furniture obstacle',()=>{const nav=makeNav();nav.update(0,28);for(const x of [-3,0,3])assert(nav.reachable(x,5));assert(!nav.lineClear(0,5,0,19));assert(nav.lineClear(3,5,3,19));});
test('Hitscan finds forward targets and ignores behind and off-axis targets',()=>{const o={x:0,y:1.7,z:0},d={x:0,y:0,z:-1};assert.equal(raySphere(o,d,{x:0,y:1.7,z:-10},.25),9.75);assert.equal(raySphere(o,d,{x:0,y:1.7,z:10},.25),Infinity);assert.equal(raySphere(o,d,{x:2,y:1.7,z:-10},.25),Infinity);});
const freeNav={move(p,dx,dz){p.x+=dx;p.z+=dz;return p;}};
const flatCourse={rails:[],support:()=>({height:0,name:''})};
const neutral={forward:0,steer:0,charge:false,look:0};
function tick(s,t,input=neutral,course=flatCourse,nav=freeNav){for(let i=0;i<Math.round(t*90);i++)updateSkater(s,1/90,input,nav,()=>0,course);}
test('Skate pushes, brakes and reverses at compact street speeds',()=>{const s=createSkater();s.active=true;tick(s,3,{...neutral,forward:1});assert(s.speed>=8&&s.speed<=11.5);assert(s.z<-15);tick(s,1,{...neutral,forward:-1});assert(s.speed<1);});
test('Kickflip lands, pays score once, and does not remain airborne',()=>{const s=createSkater();s.active=true;popSkater(s,'kickflip');tick(s,2);const land=s.events.filter(e=>e.type==='land');assert.equal(land.length,1);assert(land[0].name.includes('Kickflip'));assert(land[0].points>100);assert.equal(s.state,'ride');assert.equal(s.y,0);});
test('Charged ollie has more hang time than a tap',()=>{const a=createSkater(),b=createSkater();a.active=b.active=true;popSkater(a);b.charge=.45;popSkater(b);tick(a,.45);tick(b,.45);assert(b.y>a.y+.8);});
test('Rail catches a descending aligned skater and releases off the end',()=>{const s=createSkater();Object.assign(s,{active:true,x:0,z:2,y:.85,vy:-1,state:'air',speed:5});const course={...flatCourse,rails:[{x:0,z0:-2,z1:3,height:.62,name:'Test rail'}]};tick(s,.1,neutral,course);assert.equal(s.state,'grind');tick(s,3,neutral,course);assert(s.events.some(e=>e.type==='grindStart'));assert(s.events.some(e=>e.type==='land'&&e.name.includes('50–50')));assert.equal(s.state,'ride');});
test('Fast obstacle impact stops the board and loses unbanked trick points',()=>{const s=createSkater();Object.assign(s,{active:true,x:0,z:9,speed:8,pending:100,combo:['Kickflip']});const nav=makeNav();s.yaw=Math.PI;tick(s,.2,neutral,flatCourse,nav);assert(s.events.some(e=>e.type==='bail'));assert.equal(s.pending,0);assert(nav.clear(s.x,s.z,.3));});
