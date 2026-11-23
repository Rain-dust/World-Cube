"use strict";

// A whole aquarium uses a horizontal (x,y) bed and positive z for buoyancy.
// All positions, including animal paths, stay in that face's local gravity frame.
((root)=>{
  const {sin,cos,PI,hypot}=Math, TAU=PI*2;
  const sand=.023;
  const pick=(arr,n)=>arr[Math.floor(rand(n)*arr.length)];
  function rand(n){const v=sin(n*91.293+33.36)*43758.5453;return v-Math.floor(v);}
  const tones=new Map();
  function pigment(color,k){
    const step=Math.round(k*36),key=color+step;
    if(!tones.has(key))tones.set(key,"#"+[1,3,5].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(color.slice(i,i+2),16)*step/36))).toString(16).padStart(2,"0")).join(""));
    return tones.get(key);
  }
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  function ribbon(b,path,radii,col,sides=6){
    // Construct rings normal to the local tangent. End caps and seams follow
    // the actual bend, including sections that lean towards the viewer.
    const rings=path.map((p,i)=>{
      const a=path[Math.max(0,i-1)],e=path[Math.min(path.length-1,i+1)];
      const dx=e[0]-a[0],dy=e[1]-a[1],dz=e[2]-a[2],l=hypot(dx,dy,dz)||1;
      const h=hypot(dx,dy),u=h>1e-5?[-dy/h,dx/h,0]:[0,1,0];
      const v=[-dz*u[1]/l,dz*u[0]/l,(dx*u[1]-dy*u[0])/l];
      return Array.from({length:sides},(_,j)=>{
        const angle=TAU*j/sides+.15;
        const vertex=p.map((n,k)=>n+radii[i]*(cos(angle)*u[k]+sin(angle)*v[k]));
        vertex[2]=Math.max(.013,vertex[2]);
        return vertex;
      });
    });
    for(let i=0;i<rings.length-1;i++)for(let j=0;j<sides;j++){
      const next=(j+1)%sides, a=rings[i][j],c=rings[i][next],e=rings[i+1][j],f=rings[i+1][next];
      const diff=a.map((n,k)=>(n+c[k])*.5-path[i][k]),l=hypot(...diff)||1;
      const shade=.86+(-.25*diff[0]-.20*diff[1]+.31*diff[2])/l;
      const ink=pigment(Array.isArray(col)?col[j%col.length]:col,shade);
      b.face([a,c,e],ink);b.face([e,c,f],ink);
    }
    b.face(rings[0],pigment(Array.isArray(col)?col[0]:col,.78));
    b.face(rings.at(-1),pigment(Array.isArray(col)?col[0]:col,1.12));
  }
  function rock(b,x,y,rx,ry,h,seed,col){
    const sides=8,angle=rand(seed)*TAU;
    const rings=[[-.05,.91],[.32,1],[.72,.86],[.96,.53]].map(([z,r],k)=>
      Array.from({length:sides},(_,j)=>{
        const a=angle+TAU*j/sides,w=.84+.25*rand(seed+j*17);
        return [x+rx*r*w*cos(a)+rx*.10*k/3,y+ry*r*w*sin(a),Math.max(.013,sand+h*(z+rand(seed+j*11+k)*.075))];
      }));
    for(let i=0;i<3;i++)for(let j=0;j<sides;j++){
      const k=(j+1)%sides,a=angle+(j+.5)*TAU/sides;
      const c=pigment(col,.75+.10*i-.14*cos(a)-.09*sin(a)+.05*rand(j*3+seed));
      b.face([rings[i][j],rings[i][k],rings[i+1][k]],c);
      b.face([rings[i][j],rings[i+1][k],rings[i+1][j]],pigment(c,1.04));
    }
    for(let j=0;j<sides;j++)b.face([rings[3][j],rings[3][(j+1)%sides],[x+rx*.14,y,h+sand]],pigment(col,1.12+.06*rand(j+seed)));
    return sand+h;
  }
  function fan(b,x,y,z,height,heading,seed,colors){
    const dir=[cos(heading),sin(heading)];
    function twig(p,dx,dy,dz,r,k,s){
      const end=[p[0]+dx,p[1]+dy,p[2]+dz];
      b.branch(p,end,r,r*.76,colors[Math.min(k,colors.length-1)],5);
      if(k===3){
        const rim=.010+height*.012;
        b.ell(...end,rim,rim*.87,rim*1.28,colors[3],s);return;
      }
      for(const sign of [-1,1]){
        const f=height*(.155-.025*k)*(.85+.35*rand(s+sign));
        const n=(rand(s*3+sign*2)-.50)*height*(.22-.045*k);
        twig(end,dx*.53+sign*dir[0]*f-dir[1]*n,dy*.53+sign*dir[1]*f+dir[0]*n,dz*(.72+.07*rand(s+37)),r*.65,k+1,s*2.3+sign*4);
      }
    }
    twig([x,y,z],.024*cos(seed),.024*sin(seed),height*.36,height*.059,0,seed);
  }
  function plate(b,x,y,z,r,seed,palette){
    for(let tier=0;tier<4;tier++){
      const rad=r*(1-tier*.133), cz=z+r*(.11+tier*.26),ox=r*.20*cos(seed+tier),oy=r*.15*sin(seed+tier);
      const rings=[.48,1].map((f,idx)=>Array.from({length:14},(_,j)=>{
        const a=j*TAU/14, w=rad*f*(1+.12*sin(3*a+tier)+.07*cos(5*a+seed));
        return [x+ox+w*cos(a),y+oy+w*sin(a),cz+r*(idx?.08+.076*sin(4*a+seed):.15)];
      }));
      const colors=palette[tier%palette.length];
      for(let j=0;j<14;j++){
        const k=(j+1)%14, tip=rings[1][j],tip2=rings[1][k];
        b.face([[x+ox,y+oy,cz+.12*r],rings[0][j],rings[0][k]],pigment(colors,.86));
        b.face([rings[0][j],rings[0][k],tip2,tip],pigment(colors,.96+.11*cos(j*.49)));
        b.face([tip,tip2,[tip2[0],tip2[1],tip2[2]-.034*r],[tip[0],tip[1],tip[2]-.034*r]],pigment(colors,1.29));
      }
    }
  }
  function tube(b,x,y,z,h,r,ink,seed){
    const rings=[0,1,2].map(k=>Array.from({length:9},(_,j)=>{
      const a=TAU*j/9,rr=r*(k===0?.53:k===1?1:.60)*(1+.06*cos(3*a+seed)),m=k?1:0;
      return [x+cos(a)*rr+m*.05*sin(seed),y+sin(a)*rr+m*.028*cos(seed),z+(k===0?0:k===1?h:h-r*.33)];
    }));
    for(let j=0;j<9;j++){
      const k=(j+1)%9;
      b.face([rings[0][j],rings[0][k],rings[1][k],rings[1][j]],pigment(ink,.91-.19*cos((j+.5)*TAU/9)-.12*sin((j+.5)*TAU/9)));
      b.face([rings[1][j],rings[1][k],rings[2][k],rings[2][j]],pigment(ink,1.27));
    }
    b.face(rings[2],pigment(ink,.40));
  }
  function grassBlade(b,x,y,z,size,heading,ink,seed,t){
    const dir=[cos(heading),sin(heading)],side=[-dir[1],dir[0]];
    let previous;
    for(let i=0;i<=5;i++){
      const f=i/5, bend=size*f*f*(.20+.20*sin(t*1.75+seed-f*2.1));
      const w=size*(.049+.034*sin(f*PI))*(1-f*.96);
      const axis=[x+bend*dir[0]+.047*size*sin(f*5+seed)*f,y+bend*dir[1],z+size*f];
      const row=[[-1,-.007],[0,.018],[1,-.007]].map(([sg,ht])=>[axis[0]+sg*w*side[0]+ht*dir[0],axis[1]+sg*w*side[1]+ht*dir[1],axis[2]]);
      if(previous)for(let j=0;j<2;j++)b.face([previous[j],previous[j+1],row[j+1],row[j]],j?ink:pigment(ink,.73));
      previous=row;
    }
  }
  function leaves(b,p,s,seed,t=0){
    // Broad, folded aquatic leaves lean out from the sides of their host.
    for(let j=0;j<6;j++){
      const a=seed+TAU*j/6,r=s*(.75+.25*rand(j+seed)),rise=r*(.50+.34*rand(j+22+seed));
      const w=r*.27,off=[-sin(a)*w,cos(a)*w],swing=.04*r*sin(t*1.8+seed+j);
      const end=[p[0]+r*cos(a)+swing,p[1]+r*sin(a),p[2]+rise],mid=mix(p,end,.48),crest=[mid[0],mid[1],mid[2]+.13*r];
      const a1=[mid[0]+off[0],mid[1]+off[1],mid[2]+.039*r],a2=[mid[0]-off[0],mid[1]-off[1],mid[2]-.011*r];
      b.face([p,a1,crest],"#72a956");b.face([a1,end,crest],"#94bd64");
      b.face([p,crest,a2],"#3c7650");b.face([crest,end,a2],"#589653");
      b.branch(p,crest,.013*r,.009*r,"#a5c87c",4);
    }
  }
  function star(b,x,y,scale,angle){
    for(let j=0;j<5;j++){
      const a=angle+TAU*j/5,w=scale*.235,u=[cos(a),sin(a)],v=[-u[1],u[0]];
      const P=(r,off,h)=>[x+r*u[0]+off*v[0],y+r*u[1]+off*v[1],sand+h];
      const tip=P(scale,0,.014),ridge=P(.40*scale,0,.052),center=P(0,0,.044);
      b.face([center,P(.26*scale,w,.012),ridge],"#fba969");
      b.face([P(.26*scale,w,.012),tip,ridge],"#ec915d");
      b.face([center,ridge,P(.26*scale,-w,.014)],"#d77d55");
      b.face([ridge,tip,P(.26*scale,-w,.014)],"#ef975d");
    }
  }
  function reefBed(b){
    for(const r of [
      [-.95,.67,.46,.44,.26,48,"#65958c"],[-.68,.85,.35,.34,.19,74,"#879b83"],
      [-1.10,.28,.28,.32,.17,15,"#759b94"],[.87,-.57,.43,.36,.21,24,"#739393"],
      [1.02,-.83,.31,.30,.17,283,"#7f9b98"],[.56,-.75,.28,.27,.135,94,"#83a497"],
      [-.20,-1.05,.36,.23,.11,31,"#a6ac91"],[.72,1.07,.27,.21,.11,32,"#779e96"]
    ])rock(b,...r);
    const red=["#aa455e","#d76070","#ec7f7e","#ffc49d"],pink=["#a5498f","#c867a7","#e188bf","#ffc3cd"];
    for(const [x,y,z,h,hd,n,p] of [
      [-.91,.69,.235,.76,.29,13,red],[-1.02,.40,.160,.54,1.21,31,red],
      [-.60,.83,.15,.57,1.04,61,pink],[.91,-.52,.19,.65,.70,21,pink],
      [.70,-.63,.165,.49,-.33,86,pink],[.76,1.08,.097,.36,.32,75,red]
    ])fan(b,x,y,z,h,hd,n,p);
    const plates=["#3c8c78","#53a386","#78b58d","#b1cd99"];
    for(const p of [[-.99,.12,.08,.25,3],[-.54,.62,.075,.20,17],[.51,-.78,.09,.24,33],[-.22,-1.03,.099,.19,7]])plate(b,...p,plates);
    for(const c of [
      [1.11,-.79,.145,.26,.066,"#a06bba",51],[1.01,-.88,.15,.34,.082,"#b574c0",91],[.91,-.91,.134,.20,.052,"#ce90c4",105],
      [-1.07,.88,.15,.25,.067,"#43a5a1",19],[-1.18,.68,.14,.31,.065,"#459d9c",85],[-1.23,.79,.10,.19,.052,"#83b6a0",17]
    ])tube(b,...c);
    star(b,.33,-.29,.14,.36);star(b,-.45,-1.10,.09,2.2);
    for(let i=0;i<65;i++){
      const x=(rand(i*4+19)-.5)*2.84,y=(rand(i*3+416)-.5)*2.82;
      const r=.014+.035*rand(i+783);
      rock(b,x,y,r*1.33,r,r*.65,i+117,pick(["#9daf9a","#bfbd97","#c7bf9c","#90a49b"],i+113));
    }
  }
  function shark(b,t){
    const cx=-.005+.18*sin(.91*t),cy=-.09+.23*sin(.70*t+.47),h=.759+.055*sin(.99*t+.3);
    const az=.06+.25*sin(.79*t+.60), pitch=.044*cos(.95*t),roll=.05*sin(.81*t);
    const C=cos(az),S=sin(az);
    function P(u,v,z){
      const tail=Math.min(1,Math.max(0,(-u-.10)/.87));
      const y=v+tail*tail*.174*sin(5.5*t+u*2.35)+z*roll;
      return [cx+C*u-S*y,cy+S*u+C*y,h+z+u*pitch-v*roll];
    }
    const sections=[[-.86,.033,.032,0],[-.64,.069,.058,-.014],[-.37,.139,.124,-.006],[-.08,.184,.169,.004],[.18,.184,.171,.018],[.45,.150,.138,.020],[.67,.095,.088,.017],[.82,.040,.033,.017],[.86,.011,.012,.020]];
    const rings=sections.map(([x,ry,rz,off])=>Array.from({length:10},(_,j)=>{const a=TAU*j/10;return P(x,ry*cos(a),off+rz*sin(a));}));
    for(let i=0;i<rings.length-1;i++)for(let j=0;j<10;j++){
      const k=(j+1)%10,a=(j+.5)*TAU/10;
      const color=sin(a)>.70?"#467f8a":sin(a)>.15?"#6299a2":sin(a)>-.36?"#8ab7ba":"#e3d9bd";
      const col=pigment(color,.99-.075*cos(a)+.025*cos(i));
      b.face([rings[i][j],rings[i+1][j],rings[i][k]],col);
      b.face([rings[i][k],rings[i+1][j],rings[i+1][k]],col);
    }
    const fin=(a,c,d,bulge,front,back)=>{
      const [A,B,C,D]=[a,c,d,bulge].map(p=>P(...p));
      b.face([A,B,D],front);b.face([D,B,C],pigment(front,.91));b.face([D,C,A],pigment(front,1.07));b.face([A,C,B],back);
    };
    fin([.12,0,.165],[-.20,0,.411],[-.19,0,.144],[-.06,-.048,.195],"#528993","#538590");
    fin([-.72,0,.028],[-1.037,.015,.267],[-.91,.015,.007],[-.85,-.032,.065],"#578c99","#467985");
    fin([-.92,.015,.007],[-1.029,.025,-.177],[-.75,.004,-.019],[-.869,-.026,-.029],"#92b1b5","#59838b");
    for(const side of [-1,1]){
      fin([.12,side*.145,-.034],[-.24,side*.39,-.127],[-.12,side*.152,-.052],[-.05,side*.198,-.051],"#63959c","#c3c9b7");
      fin([-.33,side*.087,-.07],[-.52,side*.159,-.116],[-.49,side*.068,-.067],[-.43,side*.113,-.082],"#82a7a9","#c4c5af");
      b.ell(...P(.61,side*.122,.056),.026,.015,.024,"#f6d889",17);
      b.ell(...P(.617,side*.132,.056),.017,.010,.016,"#16363c",19);
      for(let g=0;g<4;g++){
        const x=.31+.044*g,y=side*(.177-.008*g);
        b.face([P(x,y,.055),P(x+.011,y,.056),P(x-.005,y+side*.007,-.010),P(x-.018,y+side*.006,-.004)],"#355f68");
      }
      b.face([P(.583,side*.123,-.041),P(.64,side*.112,-.032),P(.747,side*.076,-.019)],"#6c5552");
      // Pale flanking flecks, alternating with the blue bars along the back.
      for(let k=0;k<6;k++){
        const x=-.45+k*.086;
        b.face([P(x,side*.080,.140),P(x+.034,side*.093,.145),P(x+.061,side*.11,.124)],"#82aeb1");
      }
    }
  }
  function minnow(b,x,y,z,s,facing,t,palette){
    const az=facing,cs=cos(az),sn=sin(az);
    const P=(u,v,w)=>[x+s*(u*cs-v*sn),y+s*(u*sn+v*cs),z+s*w];
    const nose=P(.85,0,.055),top=P(.07,0,.37),bottom=P(0,0,-.29),tail=P(-.65,0,0);
    const n=P(.05,-.22,.02),f=P(.04,.22,.03);
    for(const [a,c,d,col] of [[nose,n,top,palette[0]],[top,n,tail,palette[1]],[tail,n,bottom,palette[1]],[bottom,n,nose,palette[2]],[nose,f,top,palette[0]],[top,f,tail,palette[1]],[tail,f,bottom,palette[1]],[bottom,f,nose,palette[2]]])b.face([a,c,d],col);
    const flex=.27*sin(6.4*t+x*3.1);
    b.face([tail,P(-1.01,flex,.32),P(-.97,flex,-.28)],palette[1]);
    b.face([P(-.28,0,.20),P(-.22,0,.52),P(.05,0,.30)],palette[0]);
    for(const side of [-1,1]){
      // Eyemark is a tiny solid whose silhouette survives a reverse viewing angle.
      const e=P(.44,.12*side,.09);b.box(...e,.084*s,.065*s,.090*s,"#213941");
    }
  }
  const archKnots=[
    [-1.13,-.36,.035,.085],[-.98,-.29,.160,.119],[-.81,-.28,.396,.132],
    [-.63,-.26,.582,.127],[-.42,-.20,.708,.118],[-.15,-.126,.770,.116],
    [.11,-.046,.758,.126],[.34,.033,.680,.148],[.50,.10,.519,.177],
    [.63,.168,.355,.182],[.74,.24,.197,.157],[.94,.30,.048,.101]
  ];
  const bark=["#765039","#8d6345","#9b714b","#99704b","#78563f","#5a4638","#674a37"];
  const mossBark=["#70623e","#857345","#867746","#7c6944","#6f5c3e","#5d5439","#605438"];
  function wood(b,knots,colors){
    const points=knots.map(p=>p.slice(0,3)),radii=knots.map(p=>p[3]);
    ribbon(b,points,radii,colors,8);
  }
  function archAt(t){
    const f=Math.max(0,Math.min(.9999,t))*(archKnots.length-1),k=Math.floor(f);
    return mix(archKnots[k],archKnots[k+1],f-k);
  }
  function roots(b){
    const arms=[
      archKnots,
      [[.55,.12,.40,.171],[.51,.30,.57,.144],[.53,.45,.733,.128],[.39,.64,.875,.093],[.19,.78,.944,.058],[.05,.86,1.007,.018]],
      [[.53,.44,.69,.105],[.73,.59,.798,.082],[.95,.67,.857,.048],[1.105,.61,.958,.018]],
      [[.38,.64,.855,.057],[.41,.81,.932,.046],[.55,.93,.988,.018]],
      [[.58,.10,.39,.141],[.90,.04,.26,.118],[1.11,-.12,.13,.077],[1.30,-.26,.041,.035]],
      [[.87,.055,.267,.079],[1.046,.175,.16,.072],[1.14,.264,.074,.031],[1.29,.275,.029,.012]],
      [[.72,.243,.22,.124],[.80,.492,.17,.107],[.79,.705,.081,.060],[.95,.956,.030,.031]],
      [[.60,.16,.38,.122],[.41,.39,.384,.083],[.12,.53,.289,.080],[-.13,.56,.146,.062],[-.33,.68,.035,.028]],
      [[-.83,-.276,.37,.087],[-.91,-.08,.292,.074],[-1.12,.055,.201,.050],[-1.26,.23,.055,.025]],
      [[-.945,-.29,.199,.081],[-.958,-.519,.143,.078],[-1.13,-.73,.078,.046],[-1.26,-.80,.031,.025]],
      [[-.65,-.23,.572,.089],[-.74,-.003,.623,.078],[-.91,.077,.671,.041],[-.99,.225,.73,.016]],
      [[-.14,.87,.075,.052],[-.32,1.00,.17,.072],[-.52,1.02,.22,.057],[-.75,1.10,.129,.048],[-.90,1.23,.045,.034]]
    ];
    arms.forEach((knots,i)=>wood(b,knots,i===11?mossBark:bark));
    // Narrow raised strips follow the changing radius of the bark. They are
    // continuous in 3D, even where the trunk divides into separate cubies.
    for(let j=0;j<4;j++){
      const path=archKnots.slice(1,-1).map(([x,y,z,r],i)=>{
        const angle=.16+j*.64+.13*sin(i*.8+j);
        return [x,y-r*cos(angle)*.94,z+r*sin(angle)*.94];
      });
      ribbon(b,path,path.map((_,k)=>.005+.009*sin(PI*(k+.4)/(path.length))),j%2?"#a67a50":"#5b4737",4);
    }
    for(const p of [
      [-1.09,-.49,.33,.27,.133,49,"#69796d"],[-1.27,-.18,.19,.22,.15,89,"#63786c"],
      [.92,.43,.32,.27,.16,42,"#738173"],[.82,.68,.27,.30,.11,91,"#798578"],
      [.23,.69,.25,.21,.083,98,"#73856c"],[-.74,.87,.29,.24,.11,52,"#647e68"],
      [1.06,-.75,.19,.24,.091,91,"#889881"],[-.20,-.91,.16,.12,.069,191,"#818b78"]
    ])rock(b,...p);
    for(const [x,y,z,s,n] of [
      [-.85,-.25,.40,.19,43],[-.45,-.19,.765,.14,61],[.47,.43,.75,.20,95],
      [.32,.68,.91,.16,18],[.78,.59,.82,.17,31],[.74,.64,.115,.23,61],
      [-1.09,-.44,.134,.23,17],[-.60,.94,.167,.25,19],[-.28,.70,.095,.18,46],
      [.97,.43,.139,.27,51],[.95,-.76,.091,.20,27],[-.01,-1.06,.024,.135,61],
      [1.17,.95,.023,.14,73],[-1.17,.92,.023,.17,83],[-.88,-1.06,.023,.12,97]
    ])leaves(b,[x,y,z],s,n);
    for(let i=0;i<68;i++){
      const x=(rand(i+614)-.5)*2.84,y=(rand(i+337)-.5)*2.83,r=.015+.04*rand(i+47);
      rock(b,x,y,r*1.43,r*1.04,r*.67,i+311,pick(["#919579","#7b8979","#667d71","#ab9d79","#9a9d7d"],i+44));
    }
    // A pair of alder cones, lying with their scales and stems on the bed.
    for(const [x,y,s,ang] of [[-.72,-.91,.12,-.5],[.27,1.0,.089,1.1]]){
      b.branch([x-.11*cos(ang),y-.11*sin(ang),s*.56],[x+.19*cos(ang),y+.19*sin(ang),s*.55],.012,.006,"#63543c",5);
      for(let j=0;j<5;j++)for(let k=0;k<5;k++){
        const a=k*TAU/5+j*.6,l=(j-2)*s*.39,d=s*.40*cos(a)*(1-.1*Math.abs(j-2));
        b.ell(x+l*cos(ang)-d*sin(ang),y+l*sin(ang)+d*cos(ang),s*.60+s*.35*sin(a),s*.40,s*.32,s*.20,pick(["#806141","#986f48","#71583d"],j+k*2),j*2+k);
      }
    }
  }
  function shrimp(b,u,s,facing,t,seed){
    const p=archAt(u),ahead=archAt(u+.012),behind=archAt(u-.012);
    const az=Math.atan2(ahead[1]-behind[1],ahead[0]-behind[0])+(facing<0?PI:0);
    const slope=(ahead[2]-behind[2])/hypot(ahead[0]-behind[0],ahead[1]-behind[1])*facing;
    const feet=p[2]+p[3]*.91, body=feet+s*.315;
    const P=(x,y,z)=>[p[0]+s*(x*cos(az)-y*sin(az)),p[1]+s*(x*sin(az)+y*cos(az)),body+s*(z+Math.max(-.47,Math.min(.47,x))*slope)];
    const segments=[[.31,.055,.21,.155],[.07,.080,.218,.183],[-.135,.045,.183,.166],[-.319,-.02,.157,.145],[-.453,-.114,.126,.113],[-.56,-.158,.095,.084]];
    for(let j=segments.length-1;j>=0;j--){
      const [x,z,r,w]=segments[j],center=P(x,0,z);
      b.ell(...center,r*s,w*s,r*.91*s,["#ffb048","#f9bd4e","#f2bb56","#e7a448","#e99a40","#db8c3e"][j],j+74);
      for(const d of [-1,1]){
        if(j===0)continue;
        const strip=[P(x+r*.55,d*w*.48,z+r*.75),P(x+r*.81,d*w*.85,z+r*.17),P(x+r*.75,d*w*.87,z-r*.27)];
        ribbon(b,strip,[s*.017,s*.024,s*.008],"#b88036",4);
      }
    }
    for(const d of [-1,1]){
      b.branch(P(.37,d*.085,.12),P(.49,d*.15,.161),s*.028,s*.020,"#df9840",5);
      b.ell(...P(.496,d*.15,.161),s*.048,s*.038,s*.043,"#303d34",5);
      for(let j=0;j<5;j++){
        const x=-.30+j*.137,phase=t*5.25+j*1.25+d*.65+seed;
        const kick=.078*sin(phase),lift=.071*Math.max(0,cos(phase));
        const shoulder=P(x,d*.122,-.055),knee=P(x-.066+kick,d*.20,-.185),foot=P(x+.105+kick,d*.249,-.319+lift);
        b.branch(shoulder,knee,.020*s,.015*s,"#d19b49",4);b.branch(knee,foot,.016*s,.008*s,"#f4c56b",4);
      }
      const tip=P(1.10,d*(.37+.08*sin(t*2.2+seed+d)),.197+.078*sin(t*2.5+seed));
      ribbon(b,[P(.41,d*.065,.088),P(.73,d*.18,.218),tip],[s*.014,s*.010,s*.004],"#f4d58b",4);
    }
    b.face([P(.40,-.050,.125),P(.81,0,.207),P(.41,.04,.056)],"#f8bd5b");
    for(let j=-1;j<=1;j++){
      b.face([P(-.54,0,-.16),P(-.83,j*.19-.07,-.14+.03*Math.abs(j)),P(-.85,j*.19+.07,-.13+.04*Math.abs(j))],j===0?"#f1b64e":"#d79741");
    }
  }
  function effervescence(b,origin,t,count,seed,rate,height){
    for(let i=0;i<count;i++){
      const q=((t*rate+i/count+rand(seed)*.3)%1+1)%1;
      const [x,y,z]=origin,r=(.019+.024*q+.008*rand(seed+i))*Math.min(1,(1-q)*10+.02);
      const cx=x+.033*q*sin(q*8+t*.7+seed),cy=y+.033*q*cos(q*7+seed),cz=z+height*q;
      const belt=Array.from({length:7},(_,j)=>[cx+r*cos(j*TAU/7),cy+r*sin(j*TAU/7),cz]);
      for(let j=0;j<7;j++){
        const k=(j+1)%7;
        b.face([[cx,cy,cz+r],belt[j],belt[k]],"#b6f5ed",.28);
        b.face([[cx,cy,cz-r],belt[k],belt[j]],"#67c7ce",.26);
      }
      const mirror=[cx-r*.48,cy-r*.51,cz+r*.56],size=r*.39;
      b.face([[mirror[0]-size,mirror[1],mirror[2]],[mirror[0],mirror[1]-size*.73,mirror[2]+size],[mirror[0]+size,mirror[1],mirror[2]]],"#dbfff4",.90);
    }
  }
  function caustics(b,t,brackish){
    for(let n=0;n<26;n++){
      const x=(rand(n+813)-.5)*2.73,y=(rand(n+522)-.5)*2.72,phase=t*(.88+.31*rand(n+88))+n;
      const l=.053+.063*rand(n+617),w=.004+.006*rand(n+416),alpha=(.5+.5*sin(phase))*(brackish?.17:.42);
      if(alpha<.015)continue;
      const p=[x+.028*sin(phase),y+.020*cos(phase),.035],tangent=[l*cos(n+.22*sin(phase)),l*sin(n+.22*sin(phase))];
      b.face([[p[0]-tangent[0],p[1]-tangent[1],p[2]],[p[0],p[1]+w,p[2]],[p[0]+tangent[0],p[1]+tangent[1],p[2]],[p[0],p[1]-w,p[2]]],brackish?"#d0cb8d":"#e3ead0",alpha);
    }
  }
  function draw(id,b,t){
    if(id==="reef"){
      b.static("reef",()=>reefBed(b));
      shark(b,t);
      for(let i=0;i<7;i++){
        const x=-.52+(i%4)*.21+.31*sin(t*.98+i*.16),y=.63+Math.floor(i/4)*.16+.12*sin(t*.81+i*.55);
        minnow(b,x,y,.48+.083*sin(t*1.52+i*.72),.112+(i%3)*.015,-.15+.42*cos(t*.84+i*.4),t+i,["#ffc269","#ec8e4b","#ffe0a4"]);
      }
      for(const [x,y,h,ang,n] of [[-1.18,.11,.61,-.9,19],[-1.14,.20,.72,-.4,8],[-1.24,.29,.48,-1.2,12],[.96,.90,.48,.73,25],[1.06,.89,.60,.99,56],[.89,.93,.34,.42,41],[-.60,-1.03,.31,-.26,42]])grassBlade(b,x,y,.025,h,ang,"#56a985",n,t);
      effervescence(b,[1.01+.05*sin(91),-.88+.028*cos(91),.49],t,5,13,.34,.69);
      effervescence(b,[-1.18+.05*sin(85),.68+.028*cos(85),.45],t+.7,4,67,.29,.58);
      caustics(b,t,false);
    }else if(id==="root"){
      b.static("root",()=>roots(b));
      shrimp(b,.446+.032*sin(t*.72),.375,1,t,37);
      shrimp(b,.628+.024*sin(t*.83+.84),.326,-1,t+.91,51);
      for(let i=0;i<6;i++){
        const x=-.60+.18*(i%3)+.29*sin(t*1.09+i*.21),y=-.48-.15*Math.floor(i/3)+.105*sin(t*.83+i*.62);
        minnow(b,x,y,.31+.054*sin(t*1.27+i*.67),.111+(i%2)*.014,-.12+.35*cos(t*.96+i*.3),t+i,["#d8ce76","#9eae61","#f2dc96"]);
      }
      for(const [x,y,h,ang,n] of [[-1.11,.87,.36,-.8,27],[-1.18,.93,.43,-.2,45],[.99,-.74,.34,.56,37],[1.11,-.71,.42,.87,89],[.08,1.06,.35,.92,106]])grassBlade(b,x,y,.025,h,ang,"#79a86a",n,t*.83);
      leaves(b,[.46,.31,.615],.176,49,t);
      effervescence(b,[-.73,.79,.075],t,4,17,.23,.84);
      caustics(b,t,true);
    }else throw Error("Unknown water habitat: "+id);
  }
  root.GroundWater=Object.freeze({draw});
})(globalThis);
