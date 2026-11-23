"use strict";

// Pack the fixed scenery once. Each cubie keeps its own draw range, including
// during a twist. All four passes use the same perspective and depth buffer.
globalThis.HabitatRenderer = function(gl, art, atlas) {
  const vs=`
    attribute vec3 pos;
    attribute vec4 pigment;
    uniform mat4 transform;
    uniform vec2 slot;
    uniform mediump float pass;
    varying vec4 ink;
    varying vec2 coord;
    varying vec2 tile;
    varying float z;
    varying vec3 place;
    void main(){
      vec3 p=pos;
      if(pass<.5 || pass>2.5)p.xy-=slot;
      z=p.z;
      place=pos;
      if(pass>2.5){
        p.xy+=vec2(.25,.20)*max(p.z-.016,0.);
        p.z=.005;
      }
      if(pass>.5 && pass<1.5)p.z=.002;
      tile=p.xy;
      coord=vec2((p.x+slot.x+1.5)/3.,(1.5-p.y-slot.y)/3.);
      gl_Position=transform*vec4(p,1.);
      ink=pigment;
    }`;
  const fs=`
    precision mediump float;
    varying vec4 ink;
    varying vec2 coord;
    varying vec2 tile;
    varying float z;
    varying vec3 place;
    uniform sampler2D painting;
    uniform float pass;
    uniform float light;
    void main(){
      float edge=max(abs(tile.x),abs(tile.y));
      if(pass>2.5 && edge>.489)discard;
      vec3 c;float a=1.;
      if(pass<.5){
        c=ink.rgb*mix(vec3(.49,.61,.66),vec3(1.07,1.045,1.01),light);
        vec3 voxel=floor(place*94.);
        float salt=fract(sin(dot(mod(voxel,67.),vec3(17.17,39.67,8.31)))*373.1);
        float grain=step(.86,salt)*.090-step(salt,.10)*.066;
        c+=grain*c*(vec3(.94,1.,.83)-.24*c);
        a=ink.a;
      }else if(pass<1.5){
        c=texture2D(painting,coord).rgb*mix(vec3(.55,.66,.69),vec3(1.045,1.025,1.),light);
        float trim=smoothstep(.480,.489,edge);
        c=mix(c,vec3(.33,.38,.37),trim*.42);
      }else if(pass<2.5){
        float r=length(tile);
        float groove=1.-smoothstep(.002,.010,abs(r-.255));
        float brass=1.-smoothstep(.002,.008,abs(r-.235));
        float hub=(1.-smoothstep(.065,.078,r))*.55;
        c=mix(vec3(.105,.137,.140),vec3(.33,.35,.31),smoothstep(.449,.491,edge));
        c=mix(c,vec3(.047,.064,.063),groove);
        c=mix(c,vec3(.47,.38,.235),brass*.73+hub)*(.77+.23*light);
      }else{
        c=texture2D(painting,coord).rgb*vec3(.69,.74,.79)*mix(vec3(.55,.66,.69),vec3(1.045,1.025,1.),light);
      }
      gl_FragColor=vec4(c,a);
    }`;
  function shader(type,text){
    const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));
    return s;
  }
  const pg=gl.createProgram();gl.attachShader(pg,shader(gl.VERTEX_SHADER,vs));gl.attachShader(pg,shader(gl.FRAGMENT_SHADER,fs));
  gl.bindAttribLocation(pg,0,"pos");gl.bindAttribLocation(pg,1,"pigment");gl.linkProgram(pg);
  if(!gl.getProgramParameter(pg,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(pg));
  const u=Object.fromEntries(["transform","pass","light","slot","painting"].map(k=>[k,gl.getUniformLocation(pg,k)]));
  const textures=new Map(),inks=new Map(),fixed=new Map(),living=new Map();
  function getTexture(id){
    if(!textures.has(id)){
      const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,GroundSurfaces.get(id));
      for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);
      for(const k of [gl.TEXTURE_MAG_FILTER,gl.TEXTURE_MIN_FILTER])gl.texParameteri(gl.TEXTURE_2D,k,gl.NEAREST);
      textures.set(id,tex);
    }
    return textures.get(id);
  }
  function rgb(hex){
    if(!inks.has(hex)){const c=parseInt(hex.slice(1),16);inks.set(hex,[(c>>16)/255,(c>>8&255)/255,(c&255)/255]);}
    return inks.get(hex);
  }
  function mesh(tiles,old,frozen){
    const groups=[];
    let count=0;
    for(const forms of tiles)for(const f of forms)count+=3*(f.points.length-2);
    const packed=old?.data?.length>=count*7?old.data:new Float32Array(Math.ceil(count*7*1.07));
    let cursor=0;
    for(const forms of tiles){
      const ranges=[];
      for(const opaque of [true,false]){
        const start=cursor/7;
        for(const {color,alpha,points} of forms){
          if((alpha>=.995)!==opaque)continue;
          const c=rgb(color);
          for(let j=1;j<points.length-1;j++)for(const p of [points[0],points[j],points[j+1]]){
            packed[cursor++]=p[0];packed[cursor++]=p[1];packed[cursor++]=p[2];packed[cursor++]=c[0];packed[cursor++]=c[1];packed[cursor++]=c[2];packed[cursor++]=alpha;
          }
        }
        ranges.push({start,count:cursor/7-start});
      }
      groups.push(ranges);
    }
    const buf=old?.buf||gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,packed.subarray(0,cursor),frozen?gl.STATIC_DRAW:gl.DYNAMIC_DRAW);
    return {buf,groups,data:frozen?null:packed};
  }
  function models(id,t) {
    if(!fixed.has(id))fixed.set(id,mesh(art.model(id,0,true),null,true));
    const previous=living.get(id);
    if(previous?.t!==t){const m=mesh(art.model(id,t,false),previous,false);m.t=t;living.set(id,m);}
    return [fixed.get(id),living.get(id)];
  }
  const extent=.491;
  const square=mesh([[{color:"#ffffff",alpha:1,points:[[-extent,-extent,0],[extent,-extent,0],[extent,extent,0],[-extent,extent,0]]}]],null,true);
  function bind(buf){
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);gl.vertexAttribPointer(1,4,gl.FLOAT,false,28,12);
  }
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const add=(a,b,k)=>a.map((v,i)=>v+b[i]*k);
  function getCamera(view,w,h){
    const {eye,right,up}=GroundCamera.axes(view);
    const focus=view.slice(4,7);
    const scale=Math.min(w,h)*.166*view[2];
    const lens=13;
    const column=(p,translation)=>{
      const v=translation?p.map((k,i)=>k-(focus[i]||0)):p;
      const d=dot(v,eye),q=(translation?1:0)-d/lens;
      return [dot(v,right)*scale*2/w,dot(v,up)*scale*2/h,-d*.092,q];
    };
    return {eye,right,up,column,project(p){const [x,y,,w0]=column(p,true);return [(x/w0+1)*w*.5,(1-y/w0)*h*.5,dot(p,eye)];}};
  }
  function paint(cubies,move,angle,view,t,canvas,dpr){
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(!w||!h)return {camera:getCamera(view,1,1),picks:[]};
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    const camera=getCamera(view,w,h);
    gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);
    gl.useProgram(pg);gl.enableVertexAttribArray(0);gl.enableVertexAttribArray(1);gl.uniform1i(u.painting,0);
    const items=[], picks=[];
    for(const cubie of cubies){
      if(!cubie.stickers.length)continue;
      for(const face of Object.keys(CubeState.faces)){
        const {origin,normal,right,forward:up}=CubeState.groundFrame(cubie,face,move,angle);
        const incidence=dot(normal,camera.eye);
        const sticker=cubie.stickers.find(s=>s.face===face);
        if(!sticker && incidence<-.12)continue;
        const anchor=add(origin,normal,extent);
        const matrix=new Float32Array([ ...camera.column(right,false),...camera.column(up,false),...camera.column(normal,false),...camera.column(anchor,true)]);
        const id=sticker?atlas[sticker.face]:null;
        const layer=sticker?3*sticker.row+sticker.col:0;
        const slot=sticker?[sticker.col-1,1-sticker.row]:[0,0];
        const light=Math.max(.06,Math.min(1,.54+.43*incidence+.39*dot(normal,camera.up)-.16*dot(normal,camera.right)));
        const item={matrix,slot,light,id,layer,incidence,anchor,buffer:null};
        if(sticker)item.buffer=models(id,t);
        items.push(item);
        if(sticker&&!move && incidence>.05){
          const points=[[-1,1],[1,1],[1,-1],[-1,-1]].map(([x,y])=>camera.project(add(add(anchor,right,x*extent),up,y*extent)));
          picks.push({cubie,normal,points,anchor,depth:dot(anchor,camera.eye)});
        }
      }
    }
    const setup=item=>{
      gl.uniformMatrix4fv(u.transform,false,item.matrix);gl.uniform2fv(u.slot,item.slot);gl.uniform1f(u.light,item.light);
    };
    bind(square.buf);
    for(const item of items){
      setup(item);
      gl.uniform1f(u.pass,item.id?1:2);
      if(item.id)gl.bindTexture(gl.TEXTURE_2D,getTexture(item.id));
      gl.drawArrays(gl.TRIANGLES,0,6);
    }
    function renderParts(item,layer){
      setup(item);
      for(const group of item.buffer){
        const {start,count}=group.groups[item.layer][layer];
        if(count){bind(group.buf);gl.drawArrays(gl.TRIANGLES,start,count);}
      }
    }
    gl.uniform1f(u.pass,3);
    for(const item of items)if(item.buffer&&item.incidence>.10){
      gl.bindTexture(gl.TEXTURE_2D,getTexture(item.id));renderParts(item,0);
    }
    gl.uniform1f(u.pass,0);
    for(const item of items)if(item.buffer)renderParts(item,0);
    gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
    items.sort((a,b)=>dot(a.anchor,camera.eye)-dot(b.anchor,camera.eye));
    for(const item of items)if(item.buffer)renderParts(item,1);
    gl.depthMask(true);gl.disable(gl.BLEND);
    return {camera,picks:picks.sort((a,b)=>b.depth-a.depth)};
  }
  return {paint,getCamera};
};
