"use strict";

// The pond and seabed are in the xy plane. Heights, buoyancy, and the
// ballistic arc of the frog all use the face's local z axis.
globalThis.GroundNight = (() => {
  const TAU=Math.PI*2, sin=Math.sin, cos=Math.cos;
  const pick=(colors,i)=>colors[(i%colors.length+colors.length)%colors.length];
  const mix=(a,b,t)=>a+(b-a)*t;
  const mixPoint=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
  function tube(b,points,radii,colors,sides=5){
    for(let i=1;i<points.length;i++)b.branch(points[i-1],points[i],radii[i-1],radii[i],pick(colors,i-1),sides);
  }
  function glint(b,x,y,z,r,colors){
    const rim=[[x+r,y,z],[x,y+r,z],[x-r,y,z],[x,y-r,z]];
    const top=[x,y,z+r],bottom=[x,y,z-r];
    for(let i=0;i<4;i++){
      const j=(i+1)%4;
      b.face([top,rim[i],rim[j]],pick(colors,i));
      b.face([bottom,rim[j],rim[i]],colors[0]);
    }
  }
  function stone(b,x,y,rx,ry,h,seed,colors){
    const rings=[[],[],[]], n=7, phase=b.rnd(seed)*TAU;
    for(let i=0;i<n;i++){
      const a=phase+TAU*i/n, r=.83+.17*b.rnd(seed+31*i);
      for(const [j,k] of [.91,1,.68].entries()){
        rings[j].push([x+rx*k*r*cos(a)+.035*j*rx,y+ry*k*r*sin(a),[.022,h*.58,h][j]]);
      }
    }
    for(let i=0;i<n;i++){
      const k=(i+1)%n;
      b.face([rings[0][i],rings[0][k],rings[1][k],rings[1][i]],pick(colors,i%3));
      b.face([rings[1][i],rings[1][k],rings[2][k],rings[2][i]],pick(colors,1+i%3));
    }
    b.face(rings[2],colors[3]);
  }
  function folded(b,base,tip,width,azimuth,crest,c1,c2){
    const center=mixPoint(base,tip,.53), vx=cos(azimuth)*width,vy=sin(azimuth)*width;
    const a=[center[0]+vx,center[1]+vy,center[2]-.12*width],d=[center[0]-vx,center[1]-vy,center[2]-.12*width];
    const ridge=[center[0],center[1],center[2]+crest];
    b.face([base,a,ridge],c1); b.face([a,tip,ridge],c1);
    b.face([base,ridge,d],c2); b.face([ridge,tip,d],c2);
  }

  const marshStone=["#344b57","#456265","#607676","#89a097"];
  function lilyPad(b,x,y,r,z,seed){
    const n=12,angle=b.rnd(seed)*TAU;
    const center=[x,y,z+.009],vertices=[];
    for(let i=0;i<=n;i++){
      const a=angle+.17+(TAU-.43)*i/n, radius=r*(.93+.07*b.rnd(seed+i*13));
      vertices.push([x+radius*cos(a),y+radius*.88*sin(a),z+.009*sin(2*a+seed)]);
    }
    const colors=["#4e8579","#609780","#4f8b79","#427e74"];
    for(let i=0;i<n;i++){
      const a=vertices[i],d=vertices[i+1];
      b.face([center,a,d],pick(colors,Math.floor((i+seed)/3)));
      b.face([a,d,[d[0],d[1],d[2]-.010],[a[0],a[1],a[2]-.010]],"#305c5c");
      if(i%3===1){
        const t=mixPoint(center,a,.76);t[2]+=.002;
        b.branch([x,y,z+.012],t,.003,.001,"#93ae86",3);
      }
    }
  }
  function lotus(b,x,y,size,t,seed){
    const z=.087+size*.22, phase=seed*.37, breathe=sin(t*.85+phase);
    b.branch([x+.012,y-.014,.022],[x,y,z],size*.058,size*.043,"#719184",5);
    for(let tier=0;tier<2;tier++){
      const n=tier===0?9:6;
      for(let i=0;i<n;i++){
        const a=TAU*i/n+tier*.31+phase, r=size*(tier===0?.90:.58)*(1+.035*breathe);
        const tip=[x+cos(a)*r,y+sin(a)*r,z+size*(tier===0?.43:.77)];
        folded(b,[x+cos(a)*size*.15,y+sin(a)*size*.15,z],tip,size*(tier===0?.20:.17),a+Math.PI/2,.085*size,
          tier===0?pick(["#f4b2be","#fbd5c9","#e39aad"],i):"#ffdecf",tier===0?"#b77b97":"#e5a1b0");
      }
    }
    b.ell(x,y,z+size*.30,size*.21,size*.21,size*.14,"#e9bc63",seed);
  }
  const pads=[
    [-1.17,-.76,.21],[-.86,-.94,.16],[-.69,-.80,.10],[-1.18,-1.15,.15],
    [.44,-.91,.23],[.90,-.83,.19],[1.16,-1.14,.20],[.63,-1.18,.13],[1.17,-.54,.11],
    [-1.12,.47,.14],[-.97,.75,.17],[-.69,.84,.11],[.49,.85,.19],[.84,.99,.14],[1.13,.50,.12],
    [-.94,-.31,.105],[.88,.25,.13],[1.30,.18,.075],[.03,.97,.10]
  ];
  function marshGround(b){
    stone(b,-.30,.10,.32,.23,.148,42,marshStone);
    stone(b,-.66,.24,.19,.13,.079,33,marshStone);
    stone(b,-.66,.49,.10,.08,.047,37,marshStone);
    for(let i=0;i<26;i++){
      const s=i*53+14,x=-1.36+b.rnd(s)*2.70,y=-1.36+b.rnd(s+9)*2.70;
      if(Math.hypot(x+.30,y-.10)>.54)
        stone(b,x,y,.028+b.rnd(s+3)*.058,.022+b.rnd(s+1)*.052,.030+b.rnd(s+2)*.025,s,marshStone);
    }
    pads.forEach(([x,y,r],i)=>lilyPad(b,x,y,r,.052+(i%3)*.004,88+i*9));
  }
  function reeds(b,cx,cy,size,seed,t,n){
    for(let i=0;i<n;i++){
      const key=seed+17*i,a=b.rnd(key)*TAU,r=.12*Math.sqrt(b.rnd(key+1));
      const base=[cx+cos(a)*r,cy+sin(a)*r,.026],height=size*(.40+.60*b.rnd(key+2));
      const tip=[base[0]+.13*cos(a)+.037*sin(t*1.46+key)*height,base[1]+.10*sin(a)+.020*cos(t*1.21+key)*height,height];
      if(i%4===0){
        const stem=mixPoint(base,tip,.83);
        b.branch(base,tip,.008,.004,"#8ca27b",4);
        b.branch(stem,tip,.019,.014,i%2?"#a98766":"#c4a475",6);
      }else{
        folded(b,base,tip,.015+.009*b.rnd(key+4),a+.8,.018,
          pick(["#80a37e","#6fa08a","#58877b"],i),pick(["#3d706b","#4e7e73"],i));
      }
    }
  }

  function egret(b,t){
    const x=-.29,y=.11, bob=.010*sin(t*1.52);
    // Two independent tarsi and splayed toes touch the horizontal top of the stone.
    for(const side of [-1,1]){
      const dy=side*.071,heel=[x-.042+side*.046,y+dy,.155];
      const knee=[heel[0]+.030,y+dy,.32+side*.020];
      tube(b,[heel,knee,[x+.029+side*.038,y+dy*.72,.507+bob]],[.012,.014,.024],["#aa986c","#596c64"],5);
      for(const angle of [-.70,0,.74,2.75])
        b.branch(heel,[heel[0]+cos(angle)*.069,heel[1]+sin(angle)*.068,.151],.008,.002,"#c2a96f",4);
    }
    const rings=[];
    for(const [dx,dz,yr,zr] of [[-.48,.59,.017,.020],[-.32,.59,.116,.076],[-.11,.58,.157,.147],[.10,.61,.133,.139],[.22,.66,.072,.095]]){
      const ring=[];
      for(let i=0;i<10;i++){
        const a=TAU*i/10;
        ring.push([x+dx,y+yr*cos(a),dz+bob+zr*sin(a)]);
      }
      rings.push(ring);
    }
    const plumage=["#eee9d4","#fff5dc","#fffbe6","#f6f2de","#d9dfcf","#bfcec7","#9db8b9","#a6bfc0","#c3d1c9","#d9e3d2"];
    for(let j=0;j<rings.length-1;j++)for(let i=0;i<10;i++){
      const k=(i+1)%10;b.face([rings[j][i],rings[j+1][i],rings[j+1][k],rings[j][k]],plumage[i]);
    }
    b.face(rings[0],"#dce2d0");b.face(rings.at(-1),"#e8e7d4");
    const stretch=Math.pow(.5+.5*sin(t*1.26-.85),3),sway=.018*sin(t*.97);
    for(const side of [-1,1]){
      const shoulder=[x+.115,y+side*.099,.674+bob];
      for(let i=0;i<5;i++){
        const q=i/4,tip=[x-.43-.10*q,y+side*(.14-.06*q+.18*stretch),.51+.155*q+.18*stretch+bob];
        const leading=[x-.14,y+side*(.147+.12*stretch),.685+.053*stretch+bob-.035*q];
        const inner=[x-.16,y+side*(.151+.12*stretch),.573+.049*q+.054*stretch+bob];
        b.face([shoulder,leading,inner],pick(["#d6e0d6","#dce4d9","#ebebd9"],i));
        b.face([leading,tip,inner],pick(["#faf2db","#e8e8d4","#cddbd0","#e4e9d8","#dae3dd"],i));
      }
    }
    // The neck's S bend opens as the bird surveys the water.
    const tilt=.034*sin(t*1.46), head=[x+.303+tilt,y+sway,1.078+bob+.036*sin(t*.87)];
    tube(b,[[x+.14,y,.649+bob],[x+.251,y,.719+bob],[x+.210+tilt*.35,y+.012,.825+bob],
      [x+.133+tilt*.70,y+.015,.920+bob],[x+.167+tilt,y+.008,head[2]-.044],head],
      [.096,.079,.055,.042,.038,.040],["#edf0da","#f9f3dd","#f1f1dc","#fff4d9","#e8edde"],7);
    b.ell(...head,.086,.049,.054,"#f4f2db",6);
    for(const side of [-1,1]){
      b.ell(head[0]+.035,head[1]+side*.043,head[2]+.006,.019,.008,.014,"#e7b94e",4);
      b.ell(head[0]+.040,head[1]+side*.049,head[2]+.009,.009,.005,.008,"#243443",8);
    }
    const bill=[head[0]+.072,head[1],head[2]-.009], tip=[head[0]+.298,head[1]-.005,head[2]-.040+.009*sin(t*1.46)];
    const mouth=[bill[0],bill[1],bill[2]-.018];
    for(const side of [-1,1]){
      const corner=[bill[0],bill[1]+side*.023,bill[2]];
      b.face([corner,tip,[bill[0],bill[1],bill[2]+.018]],side===-1?"#ffd479":"#dcad57");
      b.face([mouth,tip,corner],"#b97d48");
      const crest=[head[0]-.040,head[1]+side*.013,head[2]+.032];
      b.branch(crest,[head[0]-.177,head[1]+side*.042,head[2]-.020-.012*stretch],.008,.002,"#efe9d4",4);
    }
  }
  function ripple(b,x,y,z,r,color){
    for(let i=0;i<15;i++){
      const a=TAU*i/15,j=a+TAU/15*.74;
      b.face([[x+r*cos(a),y+r*sin(a),z],[x+r*cos(j),y+r*sin(j),z],
        [x+(r+.009)*cos(j),y+(r+.009)*sin(j),z],[x+(r+.009)*cos(a),y+(r+.009)*sin(a),z]],color);
    }
  }
  function frogPose(t){
    const cycle=((t+2.7)%5.8+5.8)%5.8, reverse=cycle>=2.9,phase=cycle%2.9;
    const u=Math.min(1,phase/.55),k=reverse?1-u:u;
    const [from,to]=[pads[4],pads[5]];
    return {position:[mix(from[0],to[0],k),mix(from[1],to[1],k),.093+.205*4*u*(1-u)],
      dir:reverse?-1:1,extension:sin(Math.PI*u),rippleAge:phase-.55,landing:reverse?from:to};
  }
  function frog(b,t){
    const {position:[x,y,z],dir,extension,rippleAge,landing}=frogPose(t);
    b.ell(x,y,z,.069,.05,.034,"#84a954",3);
    b.ell(x+dir*.041,y,z+.014,.044,.046,.030,"#a1ba68",9);
    for(const side of [-1,1]){
      b.ell(x+dir*.053,y+side*.030,z+.041,.010,.009,.009,"#2d4a46",6);
      b.branch([x-dir*.012,y+side*.038,z],[x-dir*(.066+.039*extension),y+side*.066,z-.014],.014,.008,"#809c51",4);
    }
    if(rippleAge>=0&&rippleAge<.78)ripple(b,landing[0],landing[1],.065,.17+.25*rippleAge,"#7aaca3");
  }
  function marsh(b,t){
    b.static("moon-pond",marshGround);
    for(const [x,y,h,s,n] of [[-1.18,.97,.71,130,12],[1.16,.92,.66,277,11],[-1.23,-.45,.49,401,7],[1.21,-.33,.47,100,7],[.25,1.15,.37,893,6]]){
      reeds(b,x,y,h,s,t,n);
    }
    for(const [x,y,r,s] of [[.68,-.99,.202,9],[-1.00,.66,.146,61],[-1.02,-.96,.118,5],[1.01,.77,.139,81]])lotus(b,x,y,r,t,s);
    egret(b,t);frog(b,t);
    for(let i=0;i<17;i++){
      const seed=131+i*37, a=t*(.55+.22*b.rnd(seed+2))+i;
      const x=-1.25+2.5*b.rnd(seed)+.053*sin(a),y=-1.20+2.4*b.rnd(seed+1)+.052*cos(a);
      const z=.15+.28*b.rnd(seed+3)+.080*(.5+.5*sin(2*a+i)),r=.010+.009*Math.pow(.5+.5*sin(2.7*a),3);
      glint(b,x,y,z,r,["#d1c978",i%3?"#ffe6a1":"#cde49b","#fff2c5","#e1d690"]);
    }
  }

  const basalt=["#243f53","#335263","#49656c","#647c79"];
  function seaStar(b,x,y,z,r,seed){
    const top=[x,y,z+r*.19],center=[x,y,z];
    for(let i=0;i<5;i++){
      const a=TAU*i/5+seed,t=a+Math.PI/5,p=a-Math.PI/5;
      const tip=[x+r*cos(a),y+r*sin(a),z+.008];
      const l=[x+r*.31*cos(p),y+r*.31*sin(p),z+.004],d=[x+r*.31*cos(t),y+r*.31*sin(t),z+.004];
      b.face([top,l,tip],"#c88f7e");b.face([top,tip,d],"#dcaa8e");b.face([center,d,tip],"#9b796d");
    }
  }
  function kelpFloor(b){
    const shelves=[[-1.07,.73,.33,.26,.195],[1.03,.86,.32,.26,.173],[-1.11,-.70,.28,.23,.130],
      [.92,-.64,.23,.21,.122],[-.62,1.18,.23,.15,.102],[.36,-1.07,.16,.111,.089]];
    shelves.forEach(([x,y,rx,ry,h],i)=>stone(b,x,y,rx,ry,h,52+i*19,basalt));
    for(let i=0;i<43;i++){
      const seed=410+i*41,x=-1.37+2.74*b.rnd(seed),y=-1.37+2.74*b.rnd(seed+2);
      const r=.024+.066*b.rnd(seed+1);
      stone(b,x,y,r,r*(.62+.28*b.rnd(seed+4)),.031+r*.30,seed,basalt);
    }
    seaStar(b,.48,-.87,.038,.16,.28);seaStar(b,-.83,.24,.035,.11,.93);
    seaStar(b,-.85,-.91,.042,.125,.60);seaStar(b,.88,.42,.038,.102,2);
    // A patch of stalked polyps supplies warm-scale detail on the dark floor.
    for(const [x,y] of [[-.88,-.79],[.89,.61],[.62,-.80],[-.87,1.08]]){
      for(let i=0;i<6;i++){
        const a=i*2.41,r=.036*Math.sqrt(i),xx=x+cos(a)*r,yy=y+sin(a)*r;
        const h=.065+.038*b.rnd(i+58);
        b.branch([xx,yy,.027],[xx+.009,yy,h],.012,.017,"#9c826f",5);
        for(let j=0;j<5;j++){
          const k=TAU*j/5;
          b.branch([xx+.009,yy,h],[xx+.009+.023*cos(k),yy+.023*sin(k),h+.015],.005,.002,"#ebb393",3);
        }
      }
    }
  }
  const weedColors=[["#386f6a","#539281","#80baa1"],["#367e74","#63a591","#a2c59b"],
    ["#407d6d","#6b9c75","#afba82"],["#2e6570","#467f84","#7faeaa"]];
  // A holdfast, a meandering stipe and thin folded blades describe the kelp
  // from all sides, including when the current moves a blade edge-on.
  function kelpPlant(b,x,y,z,height,angle,seed,t){
    const colors=weedColors[seed%4],n=7,base=[x,y,z],nodes=[];
    const tipSweep=.11*sin(t*1.22+seed)+.1;
    for(let j=0;j<=n;j++){
      const q=j/n, lean=height*q*q*(tipSweep+.115*sin(2.6*q+seed));
      nodes.push([x+cos(angle)*lean+.026*q*sin(t*.84+q*5+seed),
        y+sin(angle)*lean+.034*q*cos(t*1.08+q*5+seed),z+height*q]);
    }
    let lastL=base,lastC=base,lastR=base;
    for(let j=0;j<n;j++){
      const q=(j+1)/n,p=nodes[j],next=nodes[j+1];
      b.branch(p,next,height*(.013-.006*q),height*(.011-.006*q),colors[1],4);
      const w=height*(.062+.024*sin(seed))*Math.pow(sin(Math.PI*q),.66);
      const ribbonAngle=angle+1.1+1.05*sin(q*5.5+t*.66+seed);
      const ox=w*cos(ribbonAngle),oy=w*sin(ribbonAngle);
      const l=[next[0]-ox,next[1]-oy,next[2]-.02*height*sin(q*Math.PI)];
      const c=[next[0]+.015*height*cos(ribbonAngle+1.57),next[1]+.015*height*sin(ribbonAngle+1.57),next[2]];
      const r=[next[0]+ox,next[1]+oy,next[2]+.015*height*sin(q*Math.PI)];
      b.face([lastL,lastC,c,l],colors[0]);b.face([lastC,lastR,r,c],colors[1]);
      lastL=l;lastC=c;lastR=r;
      if(j===0){continue;}
      const sign=j%2?-1:1,az=angle+sign*(1.03+.49*sin(j*2+seed));
      const size=height*(.15+.17*sin(Math.PI*q))*(.92+.08*sin(seed+j));
      const wave=.13*size*sin(t*1.69+j*.46+seed);
      const tip=[p[0]+cos(az)*size,p[1]+sin(az)*size,p[2]+size*(.68+.25*q)+wave];
      folded(b,p,tip,size*.24,az+Math.PI*.5,.065*size,colors[1],colors[0]);
      if(j%2){
        const mid=mixPoint(p,tip,.62);mid[2]+=.025;
        b.branch(p,mid,.003,.0015,colors[2],3);
      }
    }
    for(let k=0;k<3;k++){
      const az=angle+k*TAU/3;
      b.branch(base,[x+.040*cos(az),y+.04*sin(az),Math.max(.021,z-.018)],.012,.004,colors[0],4);
    }
  }
  const weedBeds=[
    [-1.07,.73,.195,.64],[-1.26,.90,.024,.69],[-.96,1.04,.024,.76],[-.77,1.08,.024,.49],
    [.98,.85,.173,.68],[1.22,.91,.024,.83],[.87,1.14,.024,.61],[.61,1.15,.024,.45],
    [-1.12,-.7,.13,.43],[-1.28,-.85,.024,.45],[-1.14,-.94,.024,.30],
    [.91,-.65,.122,.36],[1.15,-.75,.023,.47],[1.21,-.47,.024,.38],
    [-.23,1.18,.024,.42],[.17,1.26,.024,.32],[-1.31,.07,.025,.55],[1.31,.16,.024,.48]
  ];
  const amethyst={
    sun:["#f8d6ef","#ddc9f2","#b8aaed","#ac94df","#cf93db","#e9b7e0"],
    dark:["#b6b9e6","#a7a2dc","#9387ca","#8c72ba","#b382bc","#bf97c7"],
    line:"#f8cee9",rim:"#ffe3e7",tentacle:"#b4b6e6",core:"#dfafd9",spot:"#fff0e5"
  };
  const azure={
    sun:["#ddfff0","#b5f6e2","#8fe4df","#72d1d1","#83dbd1","#abf2da"],
    dark:["#a2d7d3","#8cc8cd","#6eacc1","#629fb8","#6ab2bb","#8ac5c2"],
    line:"#cbf6e2",rim:"#e6ffe9",tentacle:"#81c1c9",core:"#a2dbd6",spot:"#fff1bf"
  };
  function jelly(b,x,y,h,r,s,t,colors){
    const phase=t*2.0+s,stroke=sin(phase),pump=.5+.5*stroke;
    const width=r*(1+.085*stroke),height=r*(.79-.12*stroke);
    h+=r*(.11*sin(t*.83+s)+.055*sin(phase-.32));x+=r*.13*sin(t*.57+s);y+=r*.11*cos(t*.69+s);
    const n=14;
    function ring(w,z,skirt=false){
      return Array.from({length:n},(_,i)=>{
        const a=TAU*i/n;
        return [x+width*w*cos(a),y+width*w*.96*sin(a),h+height*(z+(skirt?.055*(i%2):0))];
      });
    }
    const rings=[ring(.10,1.00),ring(.48,.89),ring(.73,.67),ring(.91,.40),ring(.99,.15,true),ring(1,.061,true),ring(.82,.069,true)];
    for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){
      const k=(i+1)%n, pal=sin(TAU*i/n-.7)>.15?colors.dark:colors.sun;
      const a=rings[j][i],c=rings[j][k],d=rings[j+1][k],e=rings[j+1][i];
      b.face([a,c,d],pal[j],j===4?.92:1);b.face([a,d,e],pal[j],j===4?.92:1);
    }
    b.face(rings[0],colors.sun[0]);
    // Four petal-shaped gonads rest on the dome. Canals descend farther
    // as meridians, giving the bell its characteristic luminous silhouette.
    for(let j=0;j<4;j++){
      const centerAngle=j*TAU/4+.23;
      let prev;
      for(let k=0;k<=9;k++){
        const a=k*TAU/9, rad=.25+.125*cos(a), angle=centerAngle+.53*sin(a);
        const p=[x+width*rad*cos(angle),y+width*.96*rad*sin(angle),h+height*(1.033-.27*rad)];
        if(prev)b.branch(prev,p,r*.013,r*.013,colors.spot,3);
        prev=p;
      }
    }
    for(let i=0;i<n;i+=2){
      for(let j=1;j<4;j++){
        const a=rings[j][i],c=rings[j+1][i], p=mixPoint(a,c,.08),q=mixPoint(a,c,.88);
        p[2]+=.006;q[2]+=.006;b.branch(p,q,r*.009,r*.006,colors.line,3);
      }
      const a=rings[4][i],c=rings[4][(i+1)%n];b.branch(a,c,r*.012,r*.010,colors.rim,4);
    }
    for(let i=0;i<10;i++){
      const a=i*TAU/10+.16,inner=i%3===0,radial=inner?.37:.86;
      const length=r*(inner?1.21:1.47+.20*sin(i*4.1+1));
      const start=[x+cos(a)*width*radial,y+sin(a)*width*.96*radial,h+height*.067];
      let prev=start, prevRing;
      const sides=inner?4:3;
      const ringAt=(point,thick)=>Array.from({length:sides},(_,k)=>{
        const theta=TAU*k/sides+a*.5;
        return [point[0]+thick*cos(theta),point[1]+thick*sin(theta),point[2]];
      });
      for(let k=1;k<=7;k++){
        const q=k/7, swing=q*r*(.15+.065*pump);
        const next=[start[0]+swing*sin(phase-.95-q*5+i)+.12*r*q*q,
          start[1]+swing*.54*cos(phase*.91-q*5+i*.53),start[2]-q*length];
        const thick=r*(inner?.058:.018)*(1-.74*q);
        if(!prevRing)prevRing=ringAt(prev,thick*1.14);
        const nextRing=ringAt(next,thick);
        for(let j=0;j<sides;j++){
          const m=(j+1)%sides;
          b.face([prevRing[j],prevRing[m],nextRing[m],nextRing[j]],
            inner?(j===0?colors.line:colors.core):(j===0?colors.line:colors.tentacle));
        }
        if(inner&&k<7){
          const lobe=[next[0]+.055*r*cos(a+k*2.2),next[1]+.055*r*sin(a+k*2.2),next[2]-.023*r];
          folded(b,prev,lobe,r*.035,a,.011*r,colors.line,colors.core);
        }
        prev=next;prevRing=nextRing;
      }
    }
  }
  function kelp(b,t){
    b.static("kelp-benthos",kelpFloor);
    weedBeds.forEach(([x,y,z,h],i)=>kelpPlant(b,x,y,z,h,i*2.399,i+3,t));
    jelly(b,-.23,-.05,.829,.392,1.0,t,amethyst);
    jelly(b,.77,.51,.626,.228,3.55,t,azure);
    jelly(b,-.81,-.47,.438,.150,.32,t,azure);
    for(let i=0;i<22;i++){
      const seed=50+71*i, q=(t*(.13+.057*b.rnd(seed))+b.rnd(193+i))%1;
      const x=-1.20+2.40*b.rnd(seed+1)+.041*sin(q*5.2+i);
      const y=-1.21+2.42*b.rnd(seed+4)+.031*cos(q*3.7+i*.9),z=.068+q*.94;
      const r=(.008+.012*b.rnd(seed+3))*Math.min(1,q*18,(1-q)*18);
      if(r<.002)continue;
      glint(b,x,y,z,r,["#65a8b9","#8ac3ca","#cbf5e5","#8ecad1"]);
    }
  }

  return {frogPose,draw(id,b,t){if(id==="marsh")marsh(b,t);else if(id==="kelp")kelp(b,t);else throw Error("Unknown night habitat "+id);}};
})();
