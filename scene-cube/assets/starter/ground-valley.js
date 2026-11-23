"use strict";

// Both habitats share one convention. X and Y measure a footprint on the
// ground, and Z is elevation above it. The entire domain is three units wide.
((root) => {
  const tau=2*Math.PI, sin=Math.sin, cos=Math.cos;
  const rnd=n=>{const r=sin(n*73.829+35.119)*41723.72;return r-Math.floor(r);};
  const choose=(colors,n)=>colors[Math.min(colors.length-1,Math.floor(rnd(n)*colors.length))];
  const between=(a,b,k)=>a+(b-a)*k;
  const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
  const river=y=>.33+.34*sin(1.82*y+.25)+.12*y;
  const riverWidth=y=>.177+.035*(.5+.5*cos(3.8*y+.9));
  const shore=y=>-.60+.38*y+.23*sin(2.1*y+.50)+.19*Math.exp(-Math.pow((y+.12)/.29,2));
  function surface(id,x,y){
    if(id==="autumn")return Math.abs(x-river(y))-riverWidth(y);
    const islet=.25-Math.hypot((x-.98)*1.03,(y-.90)*1.29);
    return Math.max(shore(y)-x,islet);
  }
  const bark=["#503a30","#694631","#755039","#856040"];
  const cinnabar=["#8a3831","#ac442d","#cb5330","#e66b38","#f49351"];
  const amber=["#9d5929","#ba702e","#cf8d32","#e7a947","#f3c764"];
  const rose=["#813937","#9d423b","#b75140","#cc6951","#e48a66"];
  const ivory=["#9a9164","#b4a976","#c9bf8a","#ddd69c","#ece7b1"];
  const pines=["#30483f","#37564b","#436653","#57775b","#77936b"];
  function ring(b,x,y,z,rx,ry,seed,ink){
    const p=Array.from({length:9},(_,i)=>{const a=tau*i/9,r=.89+.11*rnd(seed+i);return [x+rx*r*cos(a),y+ry*r*sin(a),z];});
    b.face(p,ink);
  }
  function plank(b,p,q,w,color){
    b.branch(p,q,w,w,color,4);
  }
  function timber(b,p,q,r0,r1,ink){
    b.branch(p,q,r0,r1,ink,6);
  }
  function prism(b,x,y,bottom,top,r0,r1,sides,palette,offset=0){
    const v=(i,r,z)=>[x+r*cos(i*tau/sides+offset),y+r*sin(i*tau/sides+offset),z];
    for(let i=0;i<sides;i++){
      const a=(i+.5)*tau/sides+offset;
      const shade=clamp(Math.round((.45-.23*cos(a)-.25*sin(a))*(palette.length-1)),0,palette.length-1);
      b.face([v(i,r0,bottom),v(i+1,r0,bottom),v(i+1,r1,top),v(i,r1,top)],palette[shade]);
    }
    if(r1>.002)b.face(Array.from({length:sides},(_,i)=>v(i,r1,top)),palette.at(-1));
  }
  function leafPatch(b,x,y,z,scale,angle,ink){
    const p=(u,v,h)=>[x+scale*(u*cos(angle)-v*sin(angle)),y+scale*(u*sin(angle)+v*cos(angle)),z+scale*h];
    b.face([p(-.67,0,0),p(-.06,-.32,.07),p(.63,0,0),p(-.05,.29,0)],ink);
  }
  function rock(b,x,y,size,seed,base=.016,grey=false){
    const tones=grey?["#566361","#66716b","#778077","#889183"]:["#68694f","#737155","#89876b","#96907a"];
    const sx=size*(.88+.34*rnd(seed)),sy=size*(.71+.28*rnd(seed+15));
    const n=6,rings=[[],[]];
    for(let i=0;i<n;i++){
      const a=(i+.23)*tau/n, r=.84+.16*rnd(seed+17*i);
      rings[0].push([x+sx*r*cos(a),y+sy*r*sin(a),base]);
      rings[1].push([x+sx*r*(.52+.20*rnd(seed+i+8))*cos(a),y+sy*r*.68*sin(a),base+size*(.53+.12*rnd(seed+i+30))]);
    }
    const apex=[x-sx*.17,y+sy*.1,base+size*.77];
    for(let i=0;i<n;i++){
      const j=(i+1)%n;
      b.face([rings[0][i],rings[0][j],rings[1][j],rings[1][i]],tones[(i+1)%3]);
      b.face([apex,rings[1][i],rings[1][j]],tones[2+(i%3===0?1:0)]);
    }
  }
  function tuft(b,x,y,z,size,seed,palette){
    for(let k=0;k<5;k++){
      const a=tau*rnd(seed+8*k),len=size*(.47+.7*rnd(seed+k*33));
      const xx=x+size*(rnd(seed+37*k)-.5)*.43,yy=y+size*(rnd(seed+39*k)-.5)*.40;
      b.face([[xx-.16*len*sin(a),yy+.16*len*cos(a),z],[xx+.16*len*sin(a),yy-.16*len*cos(a),z],
        [xx+len*.43*cos(a),yy+len*.43*sin(a),z+len]],palette[k%palette.length]);
    }
  }

  // Crown lobes have distinct lower branches, a band of shaded side facets
  // and a sunward cap; leaves sparkle on the cap rather than orbiting a trunk.
  function crown(b,x,y,z,rx,ry,rz,pal,seed){
    const n=8,phi=tau*rnd(seed),belt=[],upper=[],lower=[];
    for(let i=0;i<n;i++){
      const a=phi+i*tau/n,rad=.68+.38*rnd(seed+i*13);
      belt.push([x+rx*rad*cos(a),y+ry*rad*sin(a),z+rz*(rnd(seed+19*i)-.5)*.37]);
      upper.push([x+rx*.72*rad*cos(a+.12),y+ry*.76*rad*sin(a+.12),z+rz*(.52+.32*rnd(i+seed*2))]);
      lower.push([x+rx*.50*rad*cos(a-.09),y+ry*.51*rad*sin(a-.09),z-rz*(.48+.28*rnd(seed+i+39))]);
    }
    const top=[x-rx*.12,y+ry*.06,z+rz*.91];
    for(let i=0;i<n;i++){
      const j=(i+1)%n,a=phi+(i+.5)*tau/n;
      const faceLight=(-.7*cos(a)-.55*sin(a))*.5+.5;
      b.face([lower[i],lower[j],belt[j],belt[i]],pal[faceLight>.65?1:0]);
      b.face([belt[i],belt[j],upper[j],upper[i]],pal[faceLight>.68?3:faceLight>.25?2:1]);
      b.face([upper[i],upper[j],top],pal[faceLight>.50?4:3]);
      if(faceLight>.46){
        const a=upper[i],d=belt[j],c=belt[i];
        const stamp=(u,v)=>a.map((n,k)=>n+(d[k]-n)*u+(c[k]-n)*v+
          (k===2?.0015:.0008*Math.sign(n-(k?y:x))));
        for(let k=0;k<3;k++){
          const u=.16+.40*rnd(seed+i*34+k*19),v=.09+.18*rnd(seed+k+i);
          const length=.090+.080*rnd(seed+i+k);
          b.face([stamp(u,v),stamp(u+length,v-.038),stamp(u+length+.018,v+.029),stamp(u+.035,v+.057)],
            (i+k)%3===0?pal[4]:pal[3]);
        }
      }
    }
    for(let i=0;i<4;i++){
      const a=tau*rnd(seed+79*i),r=.12+.48*rnd(29*i+seed);
      leafPatch(b,x+rx*r*cos(a),y+ry*r*sin(a),z+rz*(.96-.24*r*r),rx*.15,a,pal[i===0?3:4]);
    }
  }
  function leafSpray(b,tip,size,a,pal,seed){
    const [x,y,z]=tip;
    for(let j=0;j<6;j++){
      const q=a+(j%2?1:-1)*(.48+.24*(j%3)),tier=(j+.3)/6;
      const xx=x+size*tier*.67*cos(a),yy=y+size*tier*.67*sin(a),zz=z+size*(tier-.35)*.48;
      const reach=size*(.32+.17*rnd(seed+j));
      const world=(u,v,w)=>[xx+reach*(u*cos(q)-v*sin(q)),yy+reach*(u*sin(q)+v*cos(q)),zz+reach*w];
      const stem=world(0,0,0),end=world(1.12,0,.43),mid=world(.53,0,.31);
      const outer=world(.48,-.26,.08);
      b.face([stem,world(.31,-.35,.06),outer,mid],pal[3]);
      b.face([mid,outer,world(.70,-.34,.15),end],pal[3]);
      b.face([stem,mid,world(.59,.32,.16),world(.38,.24,.09)],pal[j%3?4:2]);
      b.face([mid,end,world(.59,.32,.16)],pal[j%3?4:2]);
    }
  }
  function maple(b,x,y,height,r,pal,seed,birch=false){
    const base=.021, center=[x+.022*rnd(seed),y-.028*rnd(seed+1),base+.44*height];
    const barkColor=birch?"#d1c8a1":choose(bark,seed);
    timber(b,[x,y,base],center,height*.047,height*.025,barkColor);
    if(birch)for(let j=1;j<5;j++){
      const f=j/5,z=base+.44*height*f;
      b.box(between(x,center[0],f)+.012,between(y,center[1],f)-.012,z,.026*height,.018*height,.013*height,"#6e6b56");
    }
    const phi=tau*rnd(seed+29);
    for(let i=0;i<5;i++){
      const a=phi+i*tau/5,radius=r*(.42+.26*rnd(seed+12*i));
      const cz=base+height*(.54+.22*rnd(seed+i*31));
      const cx=x+radius*cos(a),cy=y+radius*sin(a);
      timber(b,center,[cx,cy,cz],height*.020,height*.010,barkColor);
      crown(b,cx,cy,cz,r*(.57+.08*rnd(i+seed)),r*.57,height*(.17+.05*rnd(i+seed+70)),pal,seed+i*47);
    }
    crown(b,x-.016,y+.019,base+height*.84,r*.70,r*.65,height*.155,pal,seed+58);
    // A few open forks sit below the crown, terminating in small, wind-turned
    // sprays. Their negative spaces break up the clustered upper silhouette.
    for(let i=0;i<4;i++){
      const a=phi+(i+.47)*tau/4;
      const mx=x+cos(a)*r*.58,my=y+sin(a)*r*.58,mz=height*(.36+.10*rnd(seed+i*19));
      const tx=x+cos(a+.10)*r*(.93+.19*rnd(seed+i)),ty=y+sin(a+.10)*r*(.93+.15*rnd(seed+i));
      const tz=mz+height*(.094+.093*rnd(seed+i*81));
      timber(b,[x,y,base+height*(.23+.07*rnd(seed+i))],[mx,my,mz],height*.017,height*.011,barkColor);
      timber(b,[mx,my,mz],[tx,ty,tz],height*.010,height*.0035,barkColor);
      const fork=[tx-.15*r*cos(a+.9),ty-.15*r*sin(a+.9),tz+.074*height];
      timber(b,[mx+.37*(tx-mx),my+.37*(ty-my),mz+.40*(tz-mz)],fork,height*.0068,height*.002,barkColor);
      leafSpray(b,[tx,ty,tz],r*.33,a,pal,seed+i*5);
      leafSpray(b,fork,r*.29,a-.72,pal,seed+i*39);
      if(i%2===0){
        const tip=[x+r*.88*cos(a),y+r*.88*sin(a),height*(.73+.087*rnd(seed+i))];
        leafSpray(b,tip,r*.37,a+.4,pal,seed+88+i);
      }
    }
    for(let k=0;k<5;k++){
      const a=k*tau/5;
      timber(b,[x,y,.06],[x+r*.26*cos(a),y+r*.26*sin(a),.022],height*.019,height*.006,barkColor);
    }
  }
  function pine(b,x,y,h,r,seed){
    const slope=.05*h*(rnd(seed)-.48);
    const trunk=z=>[x+slope*z,y+.025*h*z,z*h+.018];
    timber(b,trunk(0),trunk(.98),.041*h,.008*h,"#604c37");
    for(let tier=0;tier<6;tier++){
      const f=tier/6,z=.22+.65*f,range=r*(1-.78*f),n=8;
      const p=trunk(z),offset=rnd(seed+tier*57)*.6;
      const tips=[],inner=[],under=[];
      for(let i=0;i<n*2;i++){
        const a=offset+i*tau/(2*n),radius=range*(i%2?.52+.12*rnd(i+seed):.88+.16*rnd(i+tier+seed));
        tips.push([p[0]+radius*cos(a),p[1]+radius*sin(a),p[2]+h*(i%2?.045:.016+.032*rnd(i+seed+80))]);
        inner.push([p[0]+radius*.36*cos(a),p[1]+radius*.36*sin(a),p[2]+h*(.14+.035*rnd(seed+i))]);
        under.push([p[0]+radius*.48*cos(a),p[1]+radius*.48*sin(a),p[2]-.017*h]);
      }
      const apex=trunk(z+.19);
      for(let i=0;i<n*2;i++){
        const j=(i+1)%(n*2),a=offset+(i+.5)*tau/(n*2);
        const grade=clamp(Math.round(2-.82*cos(a)-.71*sin(a)+.33*rnd(i+seed)),1,4);
        b.face([under[i],under[j],tips[j],tips[i]],pines[grade-1]);
        b.face([tips[i],tips[j],inner[j],inner[i]],pines[grade]);
        b.face([apex,inner[i],inner[j]],pines[Math.min(4,grade+1)]);
      }
    }
  }

  function hut(b,x,y){
    const w=.58,d=.57,z0=.040,eave=.407,peak=.686;
    const xmin=x-w/2,xmax=x+w/2,front=y-d/2,back=y+d/2;
    b.box(x,y,.042,w+.065,d+.07,.064,"#727465");
    b.box(x,y,(z0+eave)/2,w,d,eave-z0,"#aa7951");
    // Horizontal siding and corner posts wrap all four exterior walls.
    for(let row=0;row<8;row++){
      const z=.088+row*.042;
      for(const sign of [-1,1]){
        b.box(x+sign*(w/2+.003),y,z,.009,d-.010,.008,row%3?"#936545":"#bf9061");
        b.box(x,y+sign*(d/2+.003),z,w-.010,.009,.008,row%3?"#795940":"#bb895c");
      }
    }
    for(const xx of [xmin,xmax])for(const yy of [front,back])b.box(xx,yy,.234,.049,.049,.362,"#72533d");
    for(const sign of [-1,1]){
      const yy=y+sign*(d*.5+.001);
      b.face([[xmin,yy,eave-.008],[xmax,yy,eave-.008],[x,yy,peak-.012]],"#c29466");
      plank(b,[x,yy,.438],[x,yy,.643],.010,"#785c43");
      for(const v of [-1,1])plank(b,[x,yy,.447],[x+v*.158,yy,.524],.009,"#785c43");
    }
    for(const side of [-1,1]){
      const xedge=x+side*(w*.5+.06),yf=front-.065,yb=back+.065;
      const p=(k,yy,h=.0)=>[between(x,xedge,k),yy,between(peak+.021,eave,k)+h];
      b.face([p(0,yf),p(1,yf),p(1,yb),p(0,yb)],side<0?"#43545b":"#536367");
      b.face([p(1,yf),p(1,yb),p(1,yb,-.032),p(1,yf,-.032)],"#394745");
      // Shingles follow the actual roof pitch, including the changing height.
      for(let row=0;row<6;row++){
        const k0=row/6,k1=(row+1)/6;
        for(let j=-1;j<7;j++){
          const a=clamp((j+(row%2)*.50)/6,0,1),c=clamp((j+1+(row%2)*.50)/6,0,1);
          if(c-a<.01)continue;
          const u=between(yf,yb,a)+.0025,v=between(yf,yb,c)-.0025,co=choose(["#435458","#4c5d5d","#526463","#5d6b67","#4b595b"],j*14+row+37*side);
          b.face([p(k0,u,.003),p(k1-.009,u,.003),p(k1-.009,v,.003),p(k0,v,.003)],co);
        }
      }
      for(const yy of [yf,yb])plank(b,p(0,yy,.008),p(1,yy,.008),.016,"#cac19a");
    }
    plank(b,[x,front-.070,peak+.023],[x,back+.070,peak+.023],.016,"#8a9485");
    function windowWall(xx,yy,angle,ww,hh,zc){
      const c=cos(angle),s=sin(angle);
      const rect=(u,d,z,sw,dep,sh,col)=>{
        const xc=xx+u*c-d*s,yc=yy+u*s+d*c;
        b.box(xc,yc,z,Math.abs(c)*sw+Math.abs(s)*dep,Math.abs(c)*dep+Math.abs(s)*sw,sh,col);
      };
      rect(0,0,zc,ww+.025,.016,hh+.023,"#5b5144");
      rect(0,.011,zc,ww,.010,hh,"#ffcf79");
      rect(-ww*.28,.019,zc+.01,ww*.32,.005,hh*.77,"#e9a85f");
      rect(0,.024,zc,ww,.007,.012,"#695b43");rect(0,.024,zc,.012,.007,hh,"#695b43");
      rect(0,.021,zc-hh/2-.016,ww+.045,.042,.018,"#ded3a3");
    }
    windowWall(x+.138,front-.018,Math.PI,.103,.135,.257);
    windowWall(x-.14,front-.018,Math.PI,.106,.135,.257);
    for(const sign of [-1,1])for(const off of [-.13,.13])
      windowWall(x+sign*(w/2+.018),y+off,-sign*Math.PI/2,.110,.13,.24);
    windowWall(x-.12,back+.018,0,.11,.13,.235);
    b.box(x,front-.017,.174,.107,.032,.246,"#5c584b");
    b.box(x,front-.037,.221,.065,.014,.074,"#f4c27b");
    b.box(x+.035,front-.043,.134,.012,.013,.012,"#d5ac6c");
    b.box(x,front-.071,.057,.29,.15,.058,"#937c5b");
    b.box(x,front-.158,.035,.25,.057,.026,"#a89a79");
    // The chimney exits the pitched roof next to the ridge.
    const cx=x+.118,cy=y+.12;
    b.box(cx,cy,.611,.096,.103,.289,"#a46349");
    for(let r=0;r<5;r++)b.box(cx,cy,.510+r*.048,.098,.105,.009,"#b8906d");
    b.box(cx,cy,.765,.124,.132,.035,"#775b4b");
    b.box(cx,cy,.784,.067,.070,.006,"#514d42");
    for(let i=0;i<5;i++)timber(b,[xmin-.075,back-.03-i*.047,.078],[xmin-.075,back+.078-i*.047,.078],.030,.030,"#886348");
    return [cx,cy,.788];
  }
  const home=[-.52,.05];
  function bridge(b){
    const y=-.62,x=river(y),span=.75;
    for(const s of [-1,1]){
      b.box(x,y+s*.103,.085,span,.037,.053,"#6b5a45");
      for(const side of [-1,1]){
        const xx=x+side*(span/2-.045);
        timber(b,[xx,y+s*.113,.009],[xx,y+s*.113,.255],.019,.014,"#80654a");
      }
      plank(b,[x-span*.45,y+s*.115,.245],[x+span*.45,y+s*.115,.245],.014,"#9f825a");
    }
    for(let i=0;i<13;i++){
      const u=(i+.5)/13-.5,z=.121+.010*cos(u*Math.PI);
      b.box(x+u*span,y,z,span/13-.004,.263+.012*rnd(i),.032,choose(["#b29568","#c0a573","#a88c64","#b39c74"],i+43));
    }
  }
  function autumnFixed(b){
    // Cut rock margins and irregular pebbles trace both riverbanks in plan.
    for(let i=0;i<51;i++)for(const s of [-1,1]){
      const y=-1.43+2.86*(i+.22*rnd(i+10*s))/51,xx=river(y)+s*(riverWidth(y)-.012+.046*rnd(i+2*s));
      if(Math.abs(y+.62)<.14)continue;
      const r=.014+.039*rnd(i*4+s+3);
      rock(b,xx,y,r,i*13+s,.012,true);
      if(i%5===2)tuft(b,xx+s*.044,y,.022,.067,rnd(i+3)*188,["#8a8e5c","#b0a56a","#73895d"]);
    }
    for(let i=0;i<9;i++){
      const y=.65+.07*i,x=river(y)+.02+.075*sin(i*2);
      rock(b,x,y,.025+.031*rnd(41+i),7+i,.013,true);
    }
    const stands=[
      [-1.12,.92,.89,.30,cinnabar],[-.66,1.15,.62,.23,amber],[-.14,1.06,.77,.25,rose],
      [.17,1.27,.49,.16,amber],[1.11,.87,.82,.28,cinnabar],[1.10,.30,.65,.23,amber],
      [1.11,-.41,.69,.25,cinnabar],[.84,-1.08,.51,.20,rose],[.49,-1.20,.39,.14,ivory],
      [-1.22,.38,.61,.18,ivory],[-1.15,-.56,.55,.22,amber],[-.78,-1.11,.46,.16,cinnabar]
    ];
    for(let i=0;i<stands.length;i++){
      const [x,y,h,r,p]=stands[i];
      ring(b,x,y,.018,r*.92,r*.63,i,"#807c52");
      maple(b,x,y,h,r,p,83*i+43,p===ivory);
    }
    for(const [x,y,h,r,s] of [[-.98,1.24,.58,.13,2],[-.36,1.23,.48,.12,71],[1.24,-.90,.46,.13,44]])
      pine(b,x,y,h,r,s);
    for(const [x,y,r,pal,seed] of [[-1.15,-.94,.13,rose,31],[-.57,1.32,.14,cinnabar,71],[1.27,.58,.12,amber,56],[.73,-1.32,.12,amber,81]]){
      for(let i=0;i<4;i++){
        const a=i*1.72+seed,tip=[x+r*.72*cos(a),y+r*.62*sin(a),r*(.55+.30*rnd(seed+i))];
        timber(b,[x,y,.02],tip,.011,.004,"#69543c");
        crown(b,...tip,r*.62,r*.46,r*.39,pal,seed+i*71);
        leafSpray(b,tip,r*.51,a,pal,seed+i);
      }
    }
    hut(b,...home);bridge(b);
    // Fence and flagstones follow a walk from the doorway to the bridge.
    const railY=-.31;
    for(let i=0;i<4;i++){
      const x=-1.09+i*.102;
      b.box(x,railY,.102,.027,.027,.17,"#997c54");
      if(i<3)b.box(x+.051,railY,.131,.105,.020,.018,"#aa8b5e");
    }
    for(let i=0;i<8;i++){
      const f=i/8,x=between(home[0],river(-.62)-.39,f),y=between(home[1]-.43,-.62,f);
      ring(b,x,y,.019,.060,.035,i+77,choose(["#a49b76","#afa381","#999576"],i));
    }
    for(let i=0;i<110;i++){
      const x=(rnd(i*3+402)-.5)*2.83,y=(rnd(i*7+601)-.5)*2.84;
      if(surface("autumn",x,y)<.05)continue;
      leafPatch(b,x,y,.021,.012+.026*rnd(i+481),i,choose(["#ce8548","#d59345","#d07b40","#a76a41","#b0a165"],i+19));
      if(i%8===0)tuft(b,x,y,.02,.05+.05*rnd(i+354),i+172,["#657a54","#94a071","#aba675"]);
    }
  }
  function autumn(b,t){
    b.static("autumn-ground",layer=>autumnFixed(layer||b));
    // Projected gravity is -Z: leaves release from crowns, tumble, then settle.
    const trees=[[-1.12,.92,.81,.23],[1.11,-.41,.62,.21],[-.14,1.06,.70,.22],[-1.15,-.56,.49,.17],[.84,-1.08,.47,.17]];
    for(let i=0;i<17;i++){
      const [x,y,h,r]=trees[i%trees.length],q=(rnd(41*i+66)+t*(.18+.075*rnd(i+13)))%1;
      const fall=Math.min(1,q/.82),zz=.027+h*(1-fall*fall);
      const xx=x+.61*r*cos(i+fall*5.6)+fall*.11,yy=y+.32*r*sin(i*2+fall*8.1)-fall*.07;
      const life=Math.min(1,q*10,(1-q)*10);
      leafPatch(b,xx,yy,zz,.045*life,q*9+i,choose(["#ffad55","#e77d45","#d55e3d","#e5b961"],i+17));
    }
    const px=home[0]+.118,py=home[1]+.12;
    for(let i=0;i<7;i++){
      const q=(t*.30+i/7)%1,r=(.019+.031*q)*Math.min(1,q*11,(1-q)*7);
      if(r<.002)continue;
      const x=px+q*q*.13+.011*sin(6*q+t*.52),y=py+q*.036,z=.79+q*.34;
      b.ell(x,y,z,r,r*.83,r*.83,choose(["#d4cfb9","#c6c8b7","#e4dcc4"],i+2),i+207);
    }
    for(let i=0;i<28;i++){
      const y=1.47-2.94*((rnd(i+571)+t*(.045+.016*rnd(i*7+22)))%1),x=river(y)+(rnd(3*i+65)-.5)*riverWidth(y)*1.32;
      const len=.031+.061*rnd(i+164),stroke=.009+.008*rnd(i+500);
      b.face([[x,y-len,.018],[x+stroke,y-len*.52,.018],[x+stroke*.35,y+len,.018],[x-stroke*.60,y+len*.33,.018]],choose(["#a7c5af","#c1cdb0","#82aca3"],i));
    }
  }
  function reed(b,x,y,size,seed){
    for(let j=0;j<4;j++){
      const a=rnd(j+seed)*tau,r=.036*rnd(seed+91*j);
      const base=[x+r*cos(a),y+r*sin(a),.012],tip=[base[0]+.032*cos(a),base[1]+.035*sin(a),size*(.61+.45*rnd(seed+j*16))];
      const mid=base.map((v,i)=>between(v,tip[i],.79));
      timber(b,base,tip,.0048,.0027,"#8d995f");
      if(j<2)timber(b,mid,tip,.009,.007,"#956a41");
      else b.face([base,[base[0]+.028*cos(a),base[1]+.028*sin(a),tip[2]*.46],
        [base[0]+.088*cos(a),base[1]+.088*sin(a),tip[2]*.82]],"#91a36b");
    }
  }
  const lantern=[-.70,.31];
  function lighthouse(b,x,y){
    const pale=["#bbbca7","#ced0b9","#e4ddc7","#ece4c9"];
    const red=["#aa4d3d","#bc5b44","#cd7051","#db8260"];
    const iron=["#3c504f","#485b58","#5a6960","#75806f"];
    prism(b,x,y,.014,.066,.191,.167,10,["#777767","#8b8c77","#a1977d","#b8ab8a"]);
    const bands=[[.064,.225,.135,.123,pale],[.225,.351,.123,.114,red],[.351,.545,.114,.096,pale]];
    for(const [lo,hi,r0,r1,co] of bands)prism(b,x,y,lo,hi,r0,r1,10,co);
    // Small recessed windows and an entrance follow different wall normals.
    b.box(x,y-.127,.128,.064,.022,.119,"#5e6256");
    b.box(x,y-.141,.129,.043,.012,.094,"#9e7657");
    b.box(x+.101,y-.001,.427,.019,.038,.058,"#536663");
    b.box(x-.056,y+.080,.470,.031,.021,.047,"#657475");
    b.box(x,y-.168,.035,.103,.067,.024,"#a49b84");
    prism(b,x,y,.541,.566,.106,.152,12,iron);
    prism(b,x,y,.566,.586,.153,.153,12,iron);
    for(let i=0;i<12;i++){
      const a=tau*i/12,c=tau*(i+1)/12,r=.141;
      const xx=x+r*cos(a),yy=y+r*sin(a),nx=x+r*cos(c),ny=y+r*sin(c);
      timber(b,[xx,yy,.579],[xx,yy,.648],.006,.005,"#4b5e57");
      plank(b,[xx,yy,.647],[nx,ny,.647],.006,"#677467");
    }
    // Octagonal glazing surrounds a visibly three-dimensional lamp.
    prism(b,x,y,.587,.603,.096,.096,8,iron);
    for(let i=0;i<8;i++){
      const a=tau*i/8,r=.082;
      timber(b,[x+r*cos(a),y+r*sin(a),.60],[x+r*cos(a),y+r*sin(a),.722],.005,.005,"#6b7260");
    }
    b.ell(x,y,.666,.037,.037,.057,"#ffd385",19);
    prism(b,x,y,.715,.733,.097,.112,8,red);
    prism(b,x,y,.733,.793,.118,.016,8,red);
    timber(b,[x,y,.79],[x,y,.852],.007,.002,"#485959");
    b.ell(x,y,.807,.015,.015,.013,"#b5a26f",19);
    ring(b,x-.011,y-.011,.016,.218,.204,42,"#9a9173");
    for(let j=0;j<5;j++)ring(b,x+.04*j,y-.236-.071*j,.018,.039,.026,7+j,"#a49b7a");
  }
  const dockY=-.25,dockStart=shore(dockY)-.115,dockEnd=dockStart+.81;
  function dock(b){
    for(const side of [-1,1]){
      const y=dockY+side*.103;
      b.box((dockStart+dockEnd)/2,y,.089,.83,.043,.045,"#76674e");
      for(let i=0;i<4;i++){
        const x=between(dockStart+.05,dockEnd-.035,i/3);
        timber(b,[x,y,.008],[x,y,i===3?.177:.121],.025,.022,"#826c50");
        if(i===3)b.box(x,y,.149,.053,.049,.014,"#c7b991");
      }
    }
    for(let k=0;k<15;k++){
      const x=between(dockStart,dockEnd,(k+.5)/15);
      b.box(x,dockY,.115,.81/15-.003,.256+.009*sin(k),.025,choose(["#b59770","#ac9069","#c2a67b","#af9571","#cfb185"],k+8));
      if(k%4===2)b.box(x+.003,dockY+.02,.129,.003,.107,.002,"#918169");
    }
    // A wind-worn handline, coiled against the bollard.
    for(let ringIndex=0;ringIndex<3;ringIndex++)for(let i=0;i<8;i++){
      const r=.017+ringIndex*.005,a=tau*i/8,c=tau*(i+1)/8;
      const p=v=>[dockEnd-.067+r*cos(v),dockY+.018+.66*r*sin(v),.1315+ringIndex*.001];
      plank(b,p(a),p(c),.0028,"#786449");
    }
    b.box(dockStart+.08,dockY+.06,.167,.089,.068,.073,"#ad754a");
    b.box(dockStart+.08,dockY+.06,.207,.094,.073,.011,"#bc8a57");
  }
  function lakeFixed(b){
    const grove=[
      [-1.16,.97,1.07,.235],[-.87,1.21,.79,.192],[-.73,.85,.72,.196],[-.37,1.14,.67,.162],
      [-1.21,.47,.79,.192],[-1.16,.04,.57,.146],[-1.24,-.67,.52,.155],[-1.06,-1.16,.33,.107],
      [.96,.93,.47,.132],[1.095,.93,.29,.076]
    ];
    for(let i=0;i<grove.length;i++){
      const [x,y,h,r]=grove[i];
      ring(b,x,y,.017,r*1.12,r*.85,33+i,"#596e58");pine(b,x,y,h,r,79+i*43);
      if(i%2===0)tuft(b,x+r*.67,y-r*.53,.017,.086,73*i+11,["#7d946a","#8a9c72","#5f7958"]);
    }
    lighthouse(b,...lantern);dock(b);
    for(let i=0;i<61;i++){
      const y=between(-1.44,1.44,(i+.21*rnd(i+191))/61),x=shore(y);
      if(Math.abs(y-dockY)<.15)continue;
      const r=.033+.062*rnd(i*17+31);
      rock(b,x+.036*(rnd(i+500)-.5),y,r,i*32+47,.012,true);
      if(i%3===0)reed(b,x+.037+.042*rnd(i+17),y+.02,.132+.108*rnd(i+101),i*42);
      if(i%4===0)rock(b,x+.109,y-.021,.022+.015*rnd(i*11),27+i,.009,true);
    }
    for(let i=0;i<15;i++){
      const a=i*tau/15;
      rock(b,.98+.214*cos(a),.90+.168*sin(a),.037+.034*rnd(i+3),413+i,.011,true);
    }
    for(let k=0;k<74;k++){
      const x=(rnd(921+4*k)-.5)*2.8,y=(rnd(411+13*k)-.5)*2.8;
      if(surface("lake",x,y)<.045 || Math.hypot(x-lantern[0],y-lantern[1])<.239)continue;
      if(k%3===0)rock(b,x,y,.024+.042*rnd(k+31),k+705,.015,true);
      else tuft(b,x,y,.018,.05+.07*rnd(k+909),k*6+81,["#75885b","#97a46d","#9a9b66"]);
    }
  }
  function boatPose(t){
    return [dockEnd-.11+.019*sin(t*.83),dockY-.263+.033*sin(t*.70+.4),.038+.009*sin(t*1.83),.12+.098*sin(t*.70)];
  }
  function boat(b,t){
    const [x,y,z,yaw]=boatPose(t),roll=.068*sin(t*1.37),pitch=.025*sin(t*1.08+.8);
    const p=(u,v,h)=>[x+u*cos(yaw)-v*sin(yaw),y+u*sin(yaw)+v*cos(yaw),z+h+roll*v+pitch*u];
    const f=(pts,c)=>b.face(pts.map(a=>p(...a)),c);
    // The hull is hollow, with an inner bilge and raised gunwales on both sides.
    const sections=[[-.274,.014,.076],[-.192,.073,.055],[-.06,.097,.05],[.12,.088,.053],[.211,.056,.064],[.265,.008,.105]];
    for(let i=0;i+1<sections.length;i++){
      const [u,w,h]=sections[i],[v,d,hh]=sections[i+1];
      f([[u,-w*.55,.010],[u,w*.55,.010],[v,d*.55,.010],[v,-d*.55,.010]],"#a77950");
      for(const s of [-1,1]){
        f([[u,s*w,h],[v,s*d,hh],[v,s*d*.55,.001],[u,s*w*.55,.001]],i%3===0?"#a66443":"#b6774d");
        f([[u,s*w,h],[u,s*(w*.84),h-.004],[v,s*d*.84,hh-.004],[v,s*d,hh]],"#e6c18a");
        f([[u,s*w*.84,h-.004],[u,s*w*.55,.01],[v,s*d*.55,.01],[v,s*d*.84,hh-.004]],"#8f684a");
      }
    }
    for(const u of [-.105,.076])f([[u-.022,-.077,.043],[u+.022,-.077,.043],[u+.022,.077,.043],[u-.022,.077,.043]],"#d8af7d");
    plank(b,p(-.175,-.065,.072),p(.160,.135,.117),.007,"#b79069");
    f([[.108,.088,.111],[.184,.120,.118],[.218,.162,.119],[.199,.179,.121],[.141,.135,.116]],"#cfaa79");
    plank(b,[dockEnd-.033,dockY-.103,.158],p(.22,.025,.085),.0045,"#c8b588");
  }
  function ripple(b,x,y,z,rx,ry,tint,thick,offset=0,portion=1){
    for(let i=0;i<14;i++){
      const a=offset+portion*tau*i/14,c=offset+portion*tau*(i+1)/14;
      const p=(ang,r)=>[x+cos(ang)*(rx-r),y+sin(ang)*(ry-r),z];
      b.face([p(a,0),p(c,0),p(c,thick),p(a,thick)],tint);
    }
  }
  function tern(b,x,y,z,size,yaw,phase){
    const p=(u,v,h)=>[x+size*(u*cos(yaw)-v*sin(yaw)),y+size*(u*sin(yaw)+v*cos(yaw)),z+size*h];
    const f=(o,c)=>b.face(o.map(a=>p(...a)),c);
    const flap=sin(phase);
    f([[-.64,-.11,.02],[.29,-.12,.065],[.61,0,.13],[.22,.14,.10],[-.57,.124,.066]],"#e8dec5");
    f([[.35,-.07,.112],[.61,-.073,.157],[.69,.026,.155],[.52,.084,.14]],"#4a5856");
    f([[.57,-.03,.143],[.89,0,.102],[.59,.037,.146]],"#d7955f");
    for(const s of [-1,1]){
      const a=[.24,.04*s,.09],d=[-.25,.045*s,.08],el=[-.12,.61*s,.17+.24*flap];
      const elbow=[-.39,.62*s,.09+.23*flap],tip=[-.58,.99*s,.19+.55*flap];
      f([a,el,elbow,d],s>0?"#dddbc8":"#f1e9d1");
      f([el,tip,elbow],"#687372");
      f([[-.45,.075*s,.07],[-.86,.24*s,.105],[-.63,0,.038]],"#c5c6b8");
    }
  }
  function trout(b,t){
    const q=(t*.32+.30)%1,x=.74,y=-.43;
    if(q<.49){
      const u=q/.49,dx=(u-.5)*.44;
      const center=[x+dx,y+.045*sin(Math.PI*u),-.075+.37*4*u*(1-u)];
      const angle=Math.atan2(.295*4*(1-2*u),.44);
      const p=(xx,yy,hh)=>[center[0]+xx*cos(angle)-hh*sin(angle),center[1]+yy,center[2]+xx*sin(angle)+hh*cos(angle)];
      // Only the part of the jumping fish above the waterline is visible.
      const drawSurface=(vertices,color)=>{
        const waterline=.016,out=[];
        let prev=vertices.at(-1);
        for(const next of vertices){
          if((prev[2]>=waterline)!==(next[2]>=waterline)){
            const f=(waterline-prev[2])/(next[2]-prev[2]);
            out.push([between(prev[0],next[0],f),between(prev[1],next[1],f),waterline]);
          }
          if(next[2]>=waterline)out.push(next);
          prev=next;
        }
        if(out.length>=3)b.face(out,color);
      };
      const sections=[[-.085,.009,.012],[-.043,.025,.038],[.008,.028,.041],[.068,.021,.028],[.095,.003,.006]];
      for(let i=0;i+1<sections.length;i++){
        const ring=([u,w,h])=>[[u,0,h],[u,w,h*.39],[u,w,-h*.52],[u,0,-h],[u,-w,-h*.46],[u,-w,h*.40]];
        const a=ring(sections[i]),c=ring(sections[i+1]);
        for(let k=0;k<6;k++){const j=(k+1)%6;drawSurface([a[k],c[k],c[j],a[j]].map(v=>p(...v)),["#77876e","#bdab78","#d2ccaa","#c9c9a6","#a1aa8a","#758773"][k]);}
      }
      const tail=sin(t*11)*.022;
      drawSurface([p(-.082,0,.010),p(-.137,tail,.047),p(-.122,tail,.004),p(-.08,0,-.006)],"#8d9376");
      drawSurface([p(-.08,0,-.006),p(-.122,tail,.004),p(-.142,tail,-.035)],"#aaa180");
    }
    if(q>.42 && q<.89){
      const k=(q-.42)/.47,r=.036+.20*k;
      ripple(b,x+.207,y,.020,r,r*.76,"#c1cbb3",.003+.009*(1-k),q*1.7,.78);
      if(k<.58)for(let i=0;i<7;i++){
        const a=tau*i/7,radius=.03+.14*k,zz=.021+.11*Math.max(0,4*(k/.58)*(1-k/.58));
        b.ell(x+.207+cos(a)*radius,y+sin(a)*radius,zz,.007,.007,.012,"#c5d7c4",i);
      }
    }
  }
  function lake(b,t){
    b.static("lake-ground",layer=>lakeFixed(layer||b));
    boat(b,t);trout(b,t);
    const route=t*.33,heading=route+Math.PI/2,cx=.35+.40*cos(route),cy=.20+.53*sin(route);
    for(let i=0;i<5;i++){
      const row=(i+1)>>1,side=i===0?0:(i%2?1:-1);
      const offx=-row*.173,offy=side*row*.123;
      const x=cx+offx*cos(heading)-offy*sin(heading),y=cy+offx*sin(heading)+offy*cos(heading);
      tern(b,x,y,.76+.051*sin(t*.90+i*1.6)+i*.017,.105+.015*(i===0),heading,t*4.1+i*2.04);
    }
    // Short, broken glints travel along the ground plane and leave open water
    // between the island, lighthouse and boat.
    for(let i=0;i<72;i++){
      const x=(rnd(i*19+401)-.5)*2.80+.024*sin(t*.98+i),y=(rnd(i*29+145)-.5)*2.75+.013*cos(t*1.43+i);
      if(surface("lake",x,y)>-.037)continue;
      const f=.55+.43*sin(t*1.47+i*3.41);
      const r=f*(.017+.073*rnd(i+39)),w=.003+.008*rnd(i+72);
      const warm=Math.abs(x-.71+.21*y)<.30;
      b.face([[x-r,y,.014],[x-r*.54,y+w,.014],[x+r,y+w*.62,.014],[x+r*.73,y-.002,.014]],choose(warm?["#ffd89f","#f8ca8d","#edc48c"]:["#81ada9","#9bbeb4","#78a7aa"],i));
    }
    const [x,y]=boatPose(t);
    for(let i=0;i<2;i++){
      const q=(t*.25+i*.5)%1;
      ripple(b,x-.19,y-.026,.018,.10+.15*q,.06+.09*q,choose(["#aec1ad","#8fb4aa"],i),.008*(1-q)+.002,1.22,.51);
    }
    const a=t*.93;
    b.ell(lantern[0]+.028*cos(a),lantern[1]+.028*sin(a),.677,.015,.015,.029,"#fff1ad",44);
  }
  root.GroundValley=Object.freeze({surface,draw(id,b,t){
    if(id==="autumn")autumn(b,t);
    else if(id==="lake")lake(b,t);
    else throw Error("Unknown ground habitat "+id);
  }});
})(globalThis);
