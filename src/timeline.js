export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const ease=v=>{v=clamp(v);return v*v*(3-2*v)};
export const lerp=(a,b,p)=>a+(b-a)*p;
export const phase=(t,a,b)=>ease((t-a)/Math.max(.001,b-a));
export function frameAt(t,timeline){
 t=clamp(t,0,timeline.duration);const index=Math.max(0,timeline.chapters.findIndex(c=>t<c.end));const i=t>=timeline.duration?timeline.chapters.length-1:index;const chapter=timeline.chapters[i];
 return {t,index:i,chapter,p:clamp((t-chapter.start)/(chapter.end-chapter.start)),words:timeline.words.filter(w=>w.start>=chapter.start&&w.start<chapter.end)};
}
export function cue(frame,text,fallback){return frame.words.find(w=>w.text.includes(text))?.start??lerp(frame.chapter.start,frame.chapter.end,fallback)}
export const circle=(u,cx=1090,cy=450,r=224)=>[cx+r*Math.cos(u*2*Math.PI-Math.PI/2),cy+r*Math.sin(u*2*Math.PI-Math.PI/2)];
export function polygon(u,n=6,cx=1090,cy=450,r=224){let k=u*n;let a=Math.floor(k),p=k-a;const A=circle(a/n,cx,cy,r),B=circle((a+1)/n,cx,cy,r);return [lerp(A[0],B[0],p),lerp(A[1],B[1],p)]}
export const line=u=>[738+704*u,450];
export const wave=(u,angle=0)=>[738+704*u,450-115*Math.sin(angle-u*2*Math.PI)];
export function blend(A,B,p){return [lerp(A[0],B[0],p),lerp(A[1],B[1],p)]}
export function polygonState(f){
 const t=f.t, a=cue(f,'십이',.34), b=cue(f,'그리고',.42), c=cue(f,'구십육',.5), d=cue(f,'변이',.6);
 return t<a?{from:6,to:6,mix:0,n:6}:t<c?{from:6,to:12,mix:phase(t,a,b),n:12}:{from:12,to:96,mix:phase(t,c,d),n:96};
}
export function shapeAt(u,f){const {index:i,t,p}=f;const c=f.chapter;
 if(i===0){const r=224+28*Math.sin(phase(t,cue(f,'크기',.4),cue(f,'원은',.67))*Math.PI);return circle(u,1090,450,r)}
 if(i===1){const unroll=phase(t,cue(f,'펼치',.1),cue(f,'둘레',.2));const fold=phase(t,cue(f,'파이',.91),c.end);return blend(blend(circle(u),line(u),unroll),polygon(u),fold)}
 if(i===2){const q=polygonState(f);return blend(polygon(u,q.from),polygon(u,q.to),q.mix)}
 if(i===3){const spread=phase(t,c.start,cue(f,'일사일오구',.05)+.6);const dissolve=phase(t,cue(f,'숫자',.82),c.end);return blend(blend(circle(u),line(u),spread),wave(u),dissolve)}
 if(i===4){const angle=phase(t,c.start,cue(f,'한',.65))*Math.PI*2;return wave(u,angle)}
 const close=phase(t,cue(f,'파동',.3),cue(f,'원으로',.35)+1);return blend(wave(u),circle(u),close);
}
