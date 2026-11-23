"use strict";

// Each image is an original top-down ground material in the exact coordinates
// of the scene. The banks, sandbars and trails continue across the nine cells.
globalThis.GroundSurfaces=(()=>{
  const size=240,cache=new Map();
  const clamp=n=>Math.max(0,Math.min(1,n));
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*clamp(t));
  const hash=(i,j)=>{const n=Math.imul(i+137,1597334677)^Math.imul(j+391,3812015801);return ((Math.imul(n^(n>>>16),2246822519)>>>0)/4294967296);};
  const fade=x=>x*x*(3-2*x);
  function field(x,y,k){
    const u=x*k+24.73,v=y*k+37.26,i=Math.floor(u),j=Math.floor(v),a=fade(u-i),b=fade(v-j);
    return (1-a)*((1-b)*hash(i,j)+b*hash(i,j+1))+a*((1-b)*hash(i+1,j)+b*hash(i+1,j+1));
  }
  const water=(x,y)=>Math.sin(21*x+4.6*y+2*Math.sin(y*8))*.52+Math.sin(10*y-3*x+1.4*Math.cos(x*8))*.48;
  function get(id){
    if(cache.has(id))return cache.get(id);
    const canvas=document.createElement("canvas");canvas.width=canvas.height=size;
    const ctx=canvas.getContext("2d"),img=ctx.createImageData(size,size);
    for(let j=0;j<size;j++)for(let i=0;i<size;i++){
      const x=3*(i+.5)/size-1.5,y=1.5-3*(j+.5)/size;
      const f=field(x,y,2.0)*.48+field(x,y,5.1)*.32+field(x,y,12.5)*.20;
      const fine=field(x,y,31),salt=hash(i,j),vein=water(x,y);
      let c;
      if(id==="autumn"||id==="lake"){
        const autumn=id==="autumn",shore=GroundValley.surface(id,x,y);
        const greenery=autumn?mix([89,101,57],[161,144,76],f):mix([55,86,61],[129,130,75],f);
        const sand=autumn?[167,145,98]:[195,158,109];
        const wet=autumn?mix([55,99,94],[106,158,139],f):mix([51,110,127],[99,158,156],f);
        c=shore>=0?mix(sand,greenery,shore*9):mix(sand,wet,-shore*(autumn?18:11));
        if(shore<-.04){
          const bands=Math.sin((x*.40+y)*40+5*field(x,y,2));
          c=mix(c,autumn?[166,188,151]:[237,191,124],(bands>.82&&fine>.58?.43:0));
          if(!autumn)c=mix(c,[228,185,125],.25*Math.exp(-3*(x+.20-y*.40)**2));
        }else if(autumn){
          const path=.07*Math.sin(y*4)-.47+.34*Math.max(0,-y);
          c=mix(c,[166,131,87],clamp(1-Math.abs(x-path)/.11)*.69);
          if(salt>.94&&fine>.52)c=mix(c,[213,133,60],.58);
        }
      }else if(id==="reef"){
        const lane=Math.exp(-1.9*(y-x*.40+.03)**2);
        c=mix(mix([46,112,113],[105,151,126],f),mix([171,170,115],[235,212,148],f),.16+.73*lane);
        if(vein>.78)c=mix(c,[238,225,165],.49);
      }else if(id==="root"){
        c=mix([45,74,68],[129,123,79],f*.9+.08*Math.sin(x*3+y*4));
        if(vein>.84)c=mix(c,[160,157,104],.34);
      }else if(id==="marsh"){
        c=mix([33,66,72],[91,135,119],.87*f+.1*Math.sin(y*4+x*2));
        c=mix(c,[152,176,145],.17*Math.exp(-3*(x+.3-y*.63)**2));
        if(fine>.63&&Math.sin(y*57+x*.75+field(x,y,3)*3)>.72)c=mix(c,[163,187,163],.37);
      }else{
        c=mix([27,55,79],[69,117,119],f);
        if(vein>.77)c=mix(c,[106,168,158],.29);
      }
      const grit=(salt-.5)*10+(fine-.5)*12;
      const k=(j*size+i)*4;
      for(let h=0;h<3;h++)img.data[k+h]=c[h]+grit;
      img.data[k+3]=255;
    }
    ctx.putImageData(img,0,0);cache.set(id,canvas);return canvas;
  }
  return {get};
})();
