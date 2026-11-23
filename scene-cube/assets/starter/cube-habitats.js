"use strict";

((root) => {
  const scenes = [
    {id:"reef", name:"晴海珊瑚", color:"#65caec", description:"灰背礁鲨摆尾穿过一片珊瑚花园，鱼群从海扇间游出。"},
    {id:"autumn", name:"枫溪木屋", color:"#e69e69", description:"秋林围着溪谷中的小屋，烟从屋顶升起，落叶掠过溪水。"},
    {id:"lake", name:"暮色湖湾", color:"#f3c281", description:"松林扎根在湖岸，木栈桥伸向水面，船只随水轻轻起伏。"},
    {id:"marsh", name:"白鹭月汀", color:"#a6ccaa", description:"白鹭栖在月下的浅滩，荷叶与芦苇之间有萤火明灭。"},
    {id:"root", name:"琥珀沉木", color:"#e5b765", description:"金色的小虾沿着沉木拱根活动，叶片和小鱼在暗处轻轻摆动。"},
    {id:"kelp", name:"水母夜航", color:"#a8bce8", description:"水母在深水海带林中收放伞盖，触腕与气泡在不同深度漂移。"}
  ];
  const rnd = seed => {
    const n=Math.sin(seed*127.1+91.7)*43758.5453123;
    return n-Math.floor(n);
  };
  const shadeCache = new Map();
  function shade(color, factor) {
    const level=Math.round(factor*100);
    factor=level/100;
    const key=color+":"+level;
    if(!shadeCache.has(key)){
      const c=parseInt(color.slice(1),16);
      const channel=v=>Math.round(Math.min(255,v*factor)).toString(16).padStart(2,"0");
      shadeCache.set(key,"#"+channel(c>>16)+channel(c>>8&255)+channel(c&255));
    }
    return shadeCache.get(key);
  }
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=v=>{const d=Math.hypot(...v)||1;return v.map(a=>a/d);};
  function builder(staticPass) {
    const shapes=[];
    let fixed=false;
    const face=(points,color,alpha=1)=>{
      if(fixed===staticPass && points.length>=3 && alpha>.006)shapes.push({points,color,alpha});
    };
    const box=(x,y,h,sx,sy,sh,color)=>{
      if(fixed!==staticPass)return;
      const vertex=(i,j,k)=>[x+i*sx*.5,y+j*sy*.5,h+k*sh*.5];
      const ring=k=>[vertex(-1,-1,k),vertex(1,-1,k),vertex(1,1,k),vertex(-1,1,k)];
      const front=ring(1),back=ring(-1);
      face(front,shade(color,1.08));face(back,shade(color,.61));
      for(let i=0;i<4;i++){const j=(i+1)%4;face([front[i],front[j],back[j],back[i]],shade(color,[.96,.76,.70,.91][i]));}
    };
    function ell(x,y,h,rx,ry,rh,color,seed=0) {
      if(fixed!==staticPass)return;
      const bands=4,sides=8,offset=rnd(seed)*.42;
      const ring=Array.from({length:bands+1},(_,j)=>{
        const a=(j/bands-.5)*Math.PI;
        return Array.from({length:sides},(_,i)=>{
          const q=i*Math.PI*2/sides+offset;
          return [x+rx*Math.cos(a)*Math.cos(q),y+ry*Math.cos(a)*Math.sin(q),h+rh*Math.sin(a)];
        });
      });
      for(let j=0;j<bands;j++)for(let i=0;i<sides;i++){
        const k=(i+1)%sides, q=(i+.5)*Math.PI*2/sides+offset, a=((j+.5)/bands-.5)*Math.PI;
        const light=.90+.23*Math.sin(a)-.13*Math.cos(q)*Math.cos(a)-.09*Math.sin(q)*Math.cos(a);
        const p=[ring[j][i],ring[j][k],ring[j+1][k],ring[j+1][i]];
        if(!j)p.shift();else if(j===bands-1)p.pop();
        face(p,shade(color,light));
      }
    }
    function branch(a,b,r0,r1,color,sides=5) {
      if(fixed!==staticPass)return;
      const axis=unit(b.map((c,i)=>c-a[i]));
      const u=unit(cross(Math.abs(axis[2])>.85?[1,0,0]:[0,0,1],axis));
      const v=cross(axis,u);
      const rings=[[],[]];
      for(let i=0;i<sides;i++){
        const q=2*Math.PI*i/sides, radial=u.map((s,k)=>s*Math.cos(q)+v[k]*Math.sin(q));
        rings[0].push(a.map((n,k)=>n+r0*radial[k]));
        rings[1].push(b.map((n,k)=>n+r1*radial[k]));
      }
      for(let i=0;i<sides;i++){
        const j=(i+1)%sides;
        const q=2*Math.PI*(i+.5)/sides, n=u.map((s,k)=>s*Math.cos(q)+v[k]*Math.sin(q));
        face([rings[0][i],rings[1][i],rings[1][j],rings[0][j]],shade(color,.90-.13*n[0]-.10*n[1]+.22*n[2]));
      }
      if(r0>.001)face(rings[0],shade(color,.81));
      if(r1>.001)face(rings[1],shade(color,1.04));
    }
    const api={shapes,face,box,ell,branch,rnd,
      pixel(x,y,h,size,color){const r=size*.5;face([[x-r,y-r,h],[x+r,y-r,h],[x+r,y+r,h],[x-r,y+r,h]],color);},
      static(key,fn){if(staticPass){fixed=true;try{fn(api);}finally{fixed=false;}}}
    };
    return api;
  }
  const epsilon=1e-9;
  function cut(points,axis,edge,side){
    const out=[]; let last=points.at(-1);
    let was=(last[axis]-edge)*side>=-epsilon;
    for(const p of points){
      const inside=(p[axis]-edge)*side>=-epsilon;
      if(was!==inside){
        const f=(edge-last[axis])/(p[axis]-last[axis]);
        const hit=last.map((c,j)=>c+f*(p[j]-c));hit[axis]=edge;out.push(hit);
      }
      if(inside)out.push(p);
      last=p;was=inside;
    }
    return out;
  }
  function partition(shapes) {
    const tiles=Array.from({length:9},()=>[]);
    for(const s of shapes){
      let l=Infinity,r=-Infinity,b=Infinity,t=-Infinity;
      for(const p of s.points){l=Math.min(l,p[0]);r=Math.max(r,p[0]);b=Math.min(b,p[1]);t=Math.max(t,p[1]);}
      const cell=n=>Math.max(0,Math.min(2,Math.floor(n+1.5)));
      for(let i=cell(l);i<=cell(r);i++)for(let j=cell(b);j<=cell(t);j++){
        const x=i-1,y=j-1;let p=s.points;
        if(l<x-.5)p=cut(p,0,x-.5,1);
        if(p.length>=3&&r>x+.5)p=cut(p,0,x+.5,-1);
        if(p.length>=3&&b<y-.5)p=cut(p,1,y-.5,1);
        if(p.length>=3&&t>y+.5)p=cut(p,1,y+.5,-1);
        if(p.length>=3)tiles[(2-j)*3+i].push({points:p,color:s.color,alpha:s.alpha});
      }
    }
    return tiles;
  }
  const fixed=new Map();
  function model(id,t,staticPass){
    if(staticPass&&fixed.has(id))return fixed.get(id);
    const b=builder(staticPass);
    const module=id==="reef"||id==="root"?root.GroundWater:id==="autumn"||id==="lake"?root.GroundValley:root.GroundNight;
    module.draw(id,b,t);
    const tiles=partition(b.shapes);
    if(staticPass)fixed.set(id,tiles);
    return tiles;
  }
  function thumbnail(ctx,id){
    const {width,height}=ctx.canvas;
    const back=root.GroundSurfaces.get(id),s=Math.min(width*.247,height*.31);
    const project=([x,y,z])=>[width*.5+s*(.965*x+.262*y),height*.64-s*(-.143*x+.525*y+.840*z)];
    const tl=project([-1.5,1.5,0]),tr=project([1.5,1.5,0]),bl=project([-1.5,-1.5,0]);
    ctx.fillStyle="#203335";ctx.fillRect(0,0,width,height);ctx.save();
    ctx.transform((tr[0]-tl[0])/back.width,(tr[1]-tl[1])/back.width,(bl[0]-tl[0])/back.height,(bl[1]-tl[1])/back.height,...tl);
    ctx.drawImage(back,0,0);ctx.restore();
    const parts=[...model(id,0,true).flat(),...model(id,0,false).flat()];
    const depth=part=>part.points.reduce((s,p)=>s+.22*p[0]-.81*p[1]+.54*p[2],0)/part.points.length;
    parts.sort((a,b)=>depth(a)-depth(b));
    for(const {points,color,alpha} of parts){
      ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();
      points.forEach((p,i)=>ctx[i?"lineTo":"moveTo"](...project(p)));
      ctx.closePath();ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  const api={scenes,model,partition,thumbnail};
  root.CubeHabitats=api;
  if(typeof module==="object"&&module.exports)module.exports=api;
})(globalThis);
