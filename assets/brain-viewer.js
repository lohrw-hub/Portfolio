(()=>{
const canvas=document.getElementById('brainCanvas');if(!canvas||!window.BRAIN_DATA)return;
const gl=canvas.getContext('webgl2',{antialias:true,alpha:true})||canvas.getContext('webgl',{antialias:true,alpha:true});

function startSoftwareRenderer(){
  // CPU painter's algorithm fallback for systems where WebGL is disabled.
  const ctx=canvas.getContext('2d');if(!ctx)return;
  function toBytes(txt){const raw=atob(txt),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;}
  const v=new Int16Array(toBytes(BRAIN_DATA.v).buffer),f=new Uint32Array(toBytes(BRAIN_DATA.f).buffer);
  const n=v.length/6,px=new Float32Array(n),py=new Float32Array(n),pz=new Float32Array(n);
  const nx=new Float32Array(n),ny=new Float32Array(n),nz=new Float32Array(n);
  const faces=[];let yaw=-.34,pitch=-1.22,zoom=.92,wire=false,drag=false,lx=0,ly=0,scheduled=false;
  const colors=Array.from({length:27},(_,i)=>{const t=i/26;return `rgb(${Math.round(52+t*150)},${Math.round(81+t*160)},${Math.round(77+t*147)})`;});
  function render(){scheduled=false;const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const dpr=Math.min(1.4,window.devicePixelRatio||1),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    ctx.clearRect(0,0,w,h);
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    const sc=zoom*Math.min(w,h)*.48,cx=w/2,yy=h/2;
    for(let i=0;i<n;i++){
      const a=v[i*6]/32767,b=v[i*6+1]/32767,c=v[i*6+2]/32767;
      const y=b*cp-c*sp,z=b*sp+c*cp;
      px[i]=cx+(a*cy+z*sy)*sc;py[i]=yy-y*sc;pz[i]=-a*sy+z*cy;
      const an=v[i*6+3]/32767,bn=v[i*6+4]/32767,cn=v[i*6+5]/32767;
      const ny0=bn*cp-cn*sp,nz0=bn*sp+cn*cp;
      nx[i]=an*cy+nz0*sy;ny[i]=ny0;nz[i]=-an*sy+nz0*cy;
    }
    faces.length=0;
    for(let i=0;i<f.length;i+=3){const a=f[i],b=f[i+1],c=f[i+2];const nor=(nz[a]+nz[b]+nz[c])/3;
      if(nor<-.15)continue;
      const shade=Math.max(0,Math.min(26,Math.round((.20+.52*Math.max(0,(-nx[a]-nx[b]-nx[c])*.2+(ny[a]+ny[b]+ny[c])*.19+(nz[a]+nz[b]+nz[c])*.3)+.22*Math.max(0,(nx[a]+nx[b]+nx[c])*.17))*26)));
      faces.push([((pz[a]+pz[b]+pz[c])/3),a,b,c,shade]);
    }
    faces.sort((a,b)=>a[0]-b[0]);
    if(!wire){for(const t of faces){ctx.fillStyle=colors[t[4]];ctx.beginPath();ctx.moveTo(px[t[1]],py[t[1]]);ctx.lineTo(px[t[2]],py[t[2]]);ctx.lineTo(px[t[3]],py[t[3]]);ctx.closePath();ctx.fill();}}
    else {ctx.strokeStyle='#7ecdb9';ctx.lineWidth=.6*dpr;for(const t of faces){ctx.beginPath();ctx.moveTo(px[t[1]],py[t[1]]);ctx.lineTo(px[t[2]],py[t[2]]);ctx.lineTo(px[t[3]],py[t[3]]);ctx.closePath();ctx.stroke();}}
    canvas.parentNode.classList.add('viewer-ready');
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(render);}}
  canvas.addEventListener('pointerdown',e=>{drag=true;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-lx)*.012;pitch+=(e.clientY-ly)*.012;ly=e.clientY;lx=e.clientX;schedule()});
  canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('pointercancel',()=>drag=false);
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.35,Math.min(1.7,zoom*(e.deltaY>0?.91:1.09)));schedule()},{passive:false});
  function setWire(w){wire=w;document.getElementById('surfaceBtn').classList.toggle('active',!wire);document.getElementById('wireBtn').classList.toggle('active',wire);schedule()}
  document.getElementById('surfaceBtn').addEventListener('click',()=>setWire(false));document.getElementById('wireBtn').addEventListener('click',()=>setWire(true));
  document.getElementById('brainIn').addEventListener('click',()=>{zoom=Math.min(1.7,zoom*1.18);schedule()});document.getElementById('brainOut').addEventListener('click',()=>{zoom=Math.max(.35,zoom/1.18);schedule()});
  document.getElementById('brainReset').addEventListener('click',()=>{yaw=-.34;pitch=-1.22;zoom=.92;schedule()});
  window.addEventListener('resize',schedule);schedule();
}

const status=document.createElement('div');status.style.cssText='position:absolute;right:17px;top:50px;color:#a4c9bf;font-size:10px;z-index:4;background:#102c2cb8;padding:7px 9px;border-radius:5px;max-width:170px;text-align:right';
if(!gl){startSoftwareRenderer();return;}
const vert=`attribute vec3 aPosition;attribute vec3 aNormal;uniform mat3 uRotation;uniform float uZoom;uniform float uAspect;varying vec3 vNormal;varying vec3 vPosition;void main(){vec3 p=uRotation*aPosition;vNormal=normalize(uRotation*aNormal);vPosition=p;gl_Position=vec4(p.x*uZoom/uAspect,p.y*uZoom,p.z*.43,1.);}`;
const frag=`precision mediump float;varying vec3 vNormal;varying vec3 vPosition;uniform float uWire;void main(){vec3 n=normalize(vNormal);vec3 key=normalize(vec3(-.46,.66,.70));vec3 fill=normalize(vec3(.70,-.36,.50));float diffuse=max(dot(n,key),0.);float bounce=max(dot(n,fill),0.);float rim=pow(1.-abs(dot(n,vec3(0.,0.,1.))),2.4);float glow=pow(max(dot(reflect(-key,n),vec3(0.,0.,1.)),0.),20.);vec3 col=vec3(.66,.75,.61)*(.47+.58*diffuse+.16*bounce)+rim*vec3(.16,.26,.15)+glow*vec3(.28,.21,.12);if(uWire>.5)col=vec3(.84,.68,.41);gl_FragColor=vec4(col,1.);}`;
function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
let program;try{program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vert));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,frag));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}catch(e){status.textContent='WebGL shader could not load.';canvas.parentNode.appendChild(status);return;}
canvas.parentNode.classList.add("viewer-ready");gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
function bytes(base){const raw=atob(base),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;}
const vb=bytes(BRAIN_DATA.v),ib=bytes(BRAIN_DATA.f);
const vBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vBuffer);gl.bufferData(gl.ARRAY_BUFFER,vb,gl.STATIC_DRAW);
let indices=new Uint32Array(ib.buffer);let useUint=true;
if(!gl.getExtension('OES_element_index_uint') && !('drawBuffers' in gl)){
 status.textContent='Browser requires 32-bit element-index support.';canvas.parentNode.appendChild(status);return;
}
const iBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,iBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
const posLoc=gl.getAttribLocation(program,'aPosition');const norLoc=gl.getAttribLocation(program,'aNormal');
gl.enableVertexAttribArray(posLoc);gl.enableVertexAttribArray(norLoc);
gl.vertexAttribPointer(posLoc,3,gl.SHORT,true,12,0);gl.vertexAttribPointer(norLoc,3,gl.SHORT,true,12,6);
const uR=gl.getUniformLocation(program,'uRotation'),uZ=gl.getUniformLocation(program,'uZoom'),uA=gl.getUniformLocation(program,'uAspect'),uW=gl.getUniformLocation(program,'uWire');
let yaw=-.34,pitch=-.90,zoom=.83,wire=false,wireBuffer=null;
function mul(a,b){const o=new Float32Array(9);for(let c=0;c<3;c++)for(let r=0;r<3;r++)for(let k=0;k<3;k++)o[c*3+r]+=a[k*3+r]*b[c*3+k];return o}
function rot(){const c=Math.cos(pitch),s=Math.sin(pitch),d=Math.cos(yaw),t=Math.sin(yaw);return mul(new Float32Array([d,0,-t,0,1,0,t,0,d]),new Float32Array([1,0,0,0,c,s,0,-s,c]));}
function resize(){const rect=canvas.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,2);const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}}
function render(){resize();gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix3fv(uR,false,rot());gl.uniform1f(uZ,zoom);gl.uniform1f(uA,canvas.width/canvas.height);gl.uniform1f(uW,wire?1:0);gl.bindBuffer(gl.ARRAY_BUFFER,vBuffer);gl.vertexAttribPointer(posLoc,3,gl.SHORT,true,12,0);gl.vertexAttribPointer(norLoc,3,gl.SHORT,true,12,6);
if(wire){if(!wireBuffer){const out=new Uint32Array(indices.length*2);for(let j=0,k=0;j<indices.length;j+=3){let a=indices[j],b=indices[j+1],c=indices[j+2];out[k++]=a;out[k++]=b;out[k++]=b;out[k++]=c;out[k++]=c;out[k++]=a;}wireBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,wireBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,out,gl.STATIC_DRAW);}else gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,wireBuffer);gl.drawElements(gl.LINES,indices.length*2,gl.UNSIGNED_INT,0);}
else{gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,iBuffer);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_INT,0);}}
let drawing=false,lastX=0,lastY=0;canvas.addEventListener('pointerdown',e=>{drawing=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!drawing)return;yaw+=(e.clientX-lastX)*.011;pitch+=(e.clientY-lastY)*.011;pitch=Math.max(-Math.PI*1.15,Math.min(Math.PI*1.15,pitch));lastX=e.clientX;lastY=e.clientY;render()});canvas.addEventListener('pointerup',()=>drawing=false);canvas.addEventListener('pointercancel',()=>drawing=false);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.min(1.65,Math.max(.36,zoom*(e.deltaY>0?.91:1.09)));render()},{passive:false});
const setActive=()=>{document.getElementById('surfaceBtn').classList.toggle('active',!wire);document.getElementById('wireBtn').classList.toggle('active',wire)};document.getElementById('surfaceBtn').addEventListener('click',()=>{wire=false;setActive();render()});document.getElementById('wireBtn').addEventListener('click',()=>{wire=true;setActive();render()});document.getElementById('brainIn').addEventListener('click',()=>{zoom=Math.min(1.65,zoom*1.18);render()});document.getElementById('brainOut').addEventListener('click',()=>{zoom=Math.max(.36,zoom/1.18);render()});document.getElementById('brainReset').addEventListener('click',()=>{yaw=-.34;pitch=-.90;zoom=.83;render()});window.addEventListener('resize',render);render();
})();
