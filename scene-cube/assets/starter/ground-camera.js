"use strict";

// A view stores yaw, pitch, scale, bank and the world-space look-at point.
// Camera up follows the featured face normal in each low-angle portrait.
globalThis.GroundCamera=(()=>{
  const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=v=>{const m=Math.hypot(...v);return v.map(n=>n/m)};
  function axes([yaw,pitch,zoom,bank=0]){
    const s=Math.sin(yaw),c=Math.cos(yaw),a=Math.sin(pitch),b=Math.cos(pitch);
    const eye=[s*b,a,c*b],east=[c,0,-s],north=[-s*a,b,-c*a];
    const co=Math.cos(bank),si=Math.sin(bank);
    return {eye,right:east.map((v,i)=>co*v+si*north[i]),up:north.map((v,i)=>co*v-si*east[i])};
  }
  function pack(eye,up,zoom,focus){
    const yaw=Math.atan2(eye[0],eye[2]),pitch=Math.asin(Math.max(-1,Math.min(1,eye[1])));
    const plain=axes([yaw,pitch,zoom]);
    const bank=Math.atan2(-dot(up,plain.right),dot(up,plain.up));
    return [yaw,pitch,zoom,bank,...focus];
  }
  function habitat(face,azimuth,altitude,zoom,focusHeight=1.68,x=0,y=0){
    const frame=CubeState.faces[face];
    const h=altitude*Math.PI/180, a=azimuth*Math.PI/180;
    const eye=frame.normal.map((v,i)=>v*Math.sin(h)+Math.cos(h)*(Math.sin(a)*frame.right[i]-Math.cos(a)*frame.up[i]));
    const right=norm(cross(frame.normal,eye)),up=cross(eye,right);
    const focus=frame.normal.map((v,i)=>v*focusHeight+frame.right[i]*x+frame.up[i]*y);
    return pack(eye,up,zoom,focus);
  }
  // Blend orientation by the shortest rotation in 3D, including camera bank.
  function quaternion({right:r,up:u,eye:e}){
    const trace=r[0]+u[1]+e[2];
    if(trace>0){const k=2*Math.sqrt(1+trace);return [(u[2]-e[1])/k,(e[0]-r[2])/k,(r[1]-u[0])/k,k/4];}
    if(r[0]>u[1]&&r[0]>e[2]){const k=2*Math.sqrt(1+r[0]-u[1]-e[2]);return [k/4,(r[1]+u[0])/k,(e[0]+r[2])/k,(u[2]-e[1])/k];}
    if(u[1]>e[2]){const k=2*Math.sqrt(1+u[1]-r[0]-e[2]);return [(r[1]+u[0])/k,k/4,(u[2]+e[1])/k,(e[0]-r[2])/k];}
    const k=2*Math.sqrt(1+e[2]-r[0]-u[1]);return [(e[0]+r[2])/k,(u[2]+e[1])/k,k/4,(r[1]-u[0])/k];
  }
  function between(a,b,t){
    if(t<=0)return a.slice();if(t>=1)return b.slice();
    const first=quaternion(axes(a)),last=quaternion(axes(b));
    let cosine=dot(first,last);
    if(cosine<0){cosine=-cosine;for(let k=0;k<4;k++)last[k]*=-1;}
    const angle=Math.acos(Math.min(1,cosine));
    const coeff=v=>angle<.002?v:Math.sin(angle*v)/Math.sin(angle);
    const [x,y,z,w]=norm(first.map((v,i)=>v*coeff(1-t)+last[i]*coeff(t)));
    const eye=[2*(x*z+y*w),2*(y*z-x*w),1-2*(x*x+y*y)];
    const up=[2*(x*y-z*w),1-2*(x*x+z*z),2*(y*z+x*w)];
    return pack(eye,up,a[2]+(b[2]-a[2])*t,[4,5,6].map(i=>a[i]+(b[i]-a[i])*t));
  }
  return {axes,habitat,between};
})();
