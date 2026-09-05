// Horde pacing: a short readable warning, then overlapping groups. Weak enemies
// make crowd clearing fast; specials introduce choices rather than inflated HP.
export function waveConfig(n){return{count:24+(n-1)*9,interval:Math.max(.28,.76-n*.04),batch:n<3?2:3,maxAlive:Math.min(52,22+n*3),runnerChance:n<2?.12:Math.min(.40,.18+n*.025),health:52+Math.min(12,n*1.3),speed:2.7+Math.min(.65,n*.07)};}
export function enemyType(wave,random=Math.random){let r=random();const brute=wave>=3?.11:0,spitter=wave>=2?.13:0;if(r<brute)return'brute';r-=brute;if(r<spitter)return'spitter';r-=spitter;if(r<waveConfig(wave).runnerChance)return'runner';return'walker';}
export function enemyStats(type,wave){const c=waveConfig(wave);return{walker:{health:c.health,speed:c.speed,scale:1,damage:12},runner:{health:42+wave,speed:5.6+Math.min(.8,wave*.08),scale:.94,damage:10},brute:{health:240+wave*8,speed:2.6+wave*.025,scale:1.28,damage:24},spitter:{health:68+wave*2,speed:3.2,scale:1.02,damage:10}}[type];}
export function explosionDamage(distance,radius,maximum){return distance>=radius?0:maximum*(.35+.65*(1-distance/radius));}
export function scoreMultiplier(streak){return Math.min(8,1+Math.floor(streak/5));}
