(()=>{
'use strict';
const canvas=document.querySelector('[data-standalone-canvas]');
if(!canvas)return;
const root=canvas.closest('[data-model-viewer]');
const key=root.dataset.model;
const dat=window.ANATOMY_MODELS?.models?.[key];
const fallback=root.querySelector('[data-standalone-fallback]');
const status=root.querySelector('[data-model-status]');
const defaults={yaw:2.33,pitch:-1.22,zoom:.87};

// WebGL-disabled browsers still receive a rotatable, zoomable Canvas 2D rendering.
function startCanvasFallback(){
  const ctx=canvas.getContext('2d');
  if(!ctx){canvas.hidden=true;if(fallback)fallback.hidden=false;return;}
  const vb=dec(dat.v),fb=dec(dat.f),v=new Int16Array(vb.buffer),f=new Uint16Array(fb.buffer);
  const n=v.length/6;let low=[1,1,1],high=[-1,-1,-1];
  for(let i=0;i<n;i++)for(let j=0;j<3;j++){const val=v[i*6+j]/32767;low[j]=Math.min(low[j],val);high[j]=Math.max(high[j],val)}
  const center=low.map((x,i)=>(x+high[i])/2),scale=1.60/Math.max(.0001,...high.map((x,i)=>x-low[i]));
  let wire=false,yaw=defaults.yaw,pitch=defaults.pitch,zoom=defaults.zoom,drag=false,lastX=0,lastY=0,scheduled=false;
  const px=new Float32Array(n),py=new Float32Array(n),pz=new Float32Array(n),lights=new Float32Array(n),faces=[];
  function render(){
    scheduled=false;const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5),w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    ctx.clearRect(0,0,w,h);
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),ss=Math.min(w,h)*.52*zoom;
    for(let i=0;i<n;i++){
      const x=(v[6*i]/32767-center[0])*scale,y=(v[6*i+1]/32767-center[1])*scale,z=(v[6*i+2]/32767-center[2])*scale;
      const yr=y*cp-z*sp,zr=y*sp+z*cp;
      const rx=x*cy+zr*sy,rz=-x*sy+zr*cy;
      px[i]=w/2+rx*ss;py[i]=h/2-yr*ss;pz[i]=rz;
      const nx=v[6*i+3]/32767,ny=v[6*i+4]/32767,nz=v[6*i+5]/32767;
      const nrY=ny*cp-nz*sp,nrZ=ny*sp+nz*cp;
      const normX=nx*cy+nrZ*sy,normZ=-nx*sy+nrZ*cy;
      lights[i]=Math.max(.1,.38+.42*(normX*-.6+nrY*.52+normZ*.8));
    }
    faces.length=0;
    const step=wire?3:1;
    for(let i=0;i<f.length;i+=3*step){const a=f[i],b=f[i+1],c=f[i+2];faces.push([(pz[a]+pz[b]+pz[c])/3,a,b,c,Math.max(.22,Math.min(1.0,(lights[a]+lights[b]+lights[c])/3))]);}
    faces.sort((a,b)=>b[0]-a[0]);
    if(wire){ctx.lineWidth=Math.max(.45,dpr*.58);ctx.strokeStyle='#c7b585';}
    else{const base=(colors[key]||colors.head).map(x=>Math.round(x*255));const shades=Array.from({length:21},(_,i)=>{const sh=.20+i/20*.85;return `rgb(${base.map(c=>Math.max(0,Math.min(255,Math.round(c*sh)))).join(',')})`});
      for(const t of faces){ctx.fillStyle=shades[Math.max(0,Math.min(20,Math.round(t[4]*20)))];ctx.beginPath();ctx.moveTo(px[t[1]],py[t[1]]);ctx.lineTo(px[t[2]],py[t[2]]);ctx.lineTo(px[t[3]],py[t[3]]);ctx.closePath();ctx.fill();}
    }
    if(wire)for(const t of faces){ctx.beginPath();ctx.moveTo(px[t[1]],py[t[1]]);ctx.lineTo(px[t[2]],py[t[2]]);ctx.lineTo(px[t[3]],py[t[3]]);ctx.closePath();ctx.stroke();}
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(render)}}
  const buttons=root.querySelectorAll('[data-model-action]');
  function active(){buttons.forEach(b=>{if(['surface','wireframe'].includes(b.dataset.modelAction))b.classList.toggle('active',b.dataset.modelAction===(wire?'wireframe':'surface'))})}
  buttons.forEach(b=>b.addEventListener('click',()=>{switch(b.dataset.modelAction){case'surface':wire=false;break;case'wireframe':wire=true;break;case'zoom-in':zoom=Math.min(2.2,zoom*1.2);break;case'zoom-out':zoom=Math.max(.35,zoom/1.2);break;case'reset':yaw=defaults.yaw;pitch=defaults.pitch;zoom=defaults.zoom;wire=false;break;case'front':yaw=0;pitch=0;break;case'side':yaw=Math.PI/2;pitch=0;break;case'top':yaw=0;pitch=-Math.PI/2;break;}active();schedule()}));
  canvas.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-lastX)*.009;pitch+=(e.clientY-lastY)*.009;lastX=e.clientX;lastY=e.clientY;schedule()});
  canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('pointercancel',()=>drag=false);
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.35,Math.min(2.2,zoom*(e.deltaY>0?.91:1.09)));schedule()},{passive:false});
  window.addEventListener('resize',schedule);if(status)status.textContent='Interactive · 2D rendering fallback · Drag to orbit';schedule();
}

const colors={brain:[.78,.82,.67],csf:[.36,.74,.72],skull:[.86,.72,.49],head:[.71,.52,.43],bottomHead:[.77,.74,.66]};
let yaw=defaults.yaw,pitch=defaults.pitch,zoom=defaults.zoom,wire=false,dragging=false,lastX=0,lastY=0;
let gl;
try{gl=canvas.getContext('webgl2',{alpha:true,antialias:true,depth:true})||canvas.getContext('webgl',{alpha:true,antialias:true,depth:true});}catch(e){}
if(!dat){canvas.hidden=true;if(fallback)fallback.hidden=false;if(status)status.textContent='Model preview unavailable.';return;}
if(!gl){startCanvasFallback();return;}
function dec(b){const raw=atob(b),u=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)u[i]=raw.charCodeAt(i);return u;}
function shader(type,s){const sh=gl.createShader(type);gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));return sh;}
const vs='attribute vec3 aPos;attribute vec3 aNormal;uniform mat3 uRot;uniform vec3 uCenter;uniform float uScale,uZoom,uAspect;varying vec3 vNormal;void main(){vec3 p=uRot*((aPos-uCenter)*uScale);vNormal=uRot*aNormal;gl_Position=vec4(p.x*uZoom/uAspect,p.y*uZoom,p.z*.36,1.0);}';
const fs='precision mediump float;varying vec3 vNormal;uniform vec3 uColor;uniform float uWire;void main(){vec3 n=normalize(gl_FrontFacing?vNormal:-vNormal);vec3 k=normalize(vec3(-.6,.54,.8));float d=max(dot(n,k),0.0);float fill=max(dot(n,vec3(.8,-.32,.5)),0.0);float rim=pow(1.-abs(n.z),2.3);vec3 c=uColor*(.37+.61*d+.22*fill)+rim*vec3(.10,.15,.13);if(uWire>0.5)c=vec3(.84,.72,.48);gl_FragColor=vec4(c,1.0);}';
let program;
try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}catch(e){canvas.hidden=true;if(fallback)fallback.hidden=false;if(status)status.textContent='Static preview (3D initialization failed).';return;}
const vb=dec(dat.v),fb=dec(dat.f);const v=new Int16Array(vb.buffer),f=new Uint16Array(fb.buffer);
const count=v.length/6;let low=[1,1,1],high=[-1,-1,-1];
for(let i=0;i<count;i++){for(let j=0;j<3;j++){let p=v[6*i+j]/32767;low[j]=Math.min(low[j],p);high[j]=Math.max(high[j],p)}}
const center=low.map((x,i)=>(x+high[i])/2);const extent=Math.max(...high.map((x,i)=>x-low[i]));const scale=1.60/Math.max(.0001,extent);
const vbuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vbuf);gl.bufferData(gl.ARRAY_BUFFER,vb,gl.STATIC_DRAW);
const ibuf=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibuf);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,f,gl.STATIC_DRAW);
let wirebuf=null,wirecount=0;
const pos=gl.getAttribLocation(program,'aPos'),normal=gl.getAttribLocation(program,'aNormal');
const u={rot:gl.getUniformLocation(program,'uRot'),center:gl.getUniformLocation(program,'uCenter'),scale:gl.getUniformLocation(program,'uScale'),zoom:gl.getUniformLocation(program,'uZoom'),aspect:gl.getUniformLocation(program,'uAspect'),color:gl.getUniformLocation(program,'uColor'),wire:gl.getUniformLocation(program,'uWire')};
gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(normal);
function multiply(a,b){const o=new Float32Array(9);for(let c=0;c<3;c++)for(let r=0;r<3;r++)for(let k=0;k<3;k++)o[c*3+r]+=a[k*3+r]*b[c*3+k];return o;}
function rot(){const c=Math.cos(pitch),s=Math.sin(pitch),d=Math.cos(yaw),t=Math.sin(yaw);return multiply(new Float32Array([d,0,-t,0,1,0,t,0,d]),new Float32Array([1,0,0,0,c,s,0,-s,c]));}
function resize(){const b=canvas.getBoundingClientRect();const d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(b.width*d)),h=Math.max(1,Math.round(b.height*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}}
function render(){resize();gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix3fv(u.rot,false,rot());gl.uniform3fv(u.center,new Float32Array(center));gl.uniform1f(u.scale,scale);gl.uniform1f(u.zoom,zoom);gl.uniform1f(u.aspect,canvas.width/canvas.height);gl.uniform3fv(u.color,new Float32Array(colors[key]||colors.head));gl.uniform1f(u.wire,wire?1:0);gl.bindBuffer(gl.ARRAY_BUFFER,vbuf);gl.vertexAttribPointer(pos,3,gl.SHORT,true,12,0);gl.vertexAttribPointer(normal,3,gl.SHORT,true,12,6);
 if(wire){if(!wirebuf){const lines=new Uint16Array(f.length*2);for(let i=0,j=0;i<f.length;i+=3){const a=f[i],b=f[i+1],c=f[i+2];lines[j++]=a;lines[j++]=b;lines[j++]=b;lines[j++]=c;lines[j++]=c;lines[j++]=a;}wirebuf=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,wirebuf);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,lines,gl.STATIC_DRAW);wirecount=lines.length;}else gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,wirebuf);gl.drawElements(gl.LINES,wirecount,gl.UNSIGNED_SHORT,0);}
 else{gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibuf);gl.drawElements(gl.TRIANGLES,f.length,gl.UNSIGNED_SHORT,0)}
}
const all=root.querySelectorAll('[data-model-action]');
function active(){all.forEach(b=>{if(b.dataset.modelAction==='surface'||b.dataset.modelAction==='wireframe')b.classList.toggle('active',b.dataset.modelAction===(wire?'wireframe':'surface'));});}
all.forEach(b=>b.addEventListener('click',()=>{switch(b.dataset.modelAction){case'surface':wire=false;break;case'wireframe':wire=true;break;case'zoom-in':zoom=Math.min(2.2,zoom*1.2);break;case'zoom-out':zoom=Math.max(.35,zoom/1.2);break;case'reset':yaw=defaults.yaw;pitch=defaults.pitch;zoom=defaults.zoom;wire=false;break;case'front':yaw=0;pitch=0;break;case'side':yaw=Math.PI/2;pitch=0;break;case'top':yaw=0;pitch=-Math.PI/2;break;}active();render();}));
canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw+=(e.clientX-lastX)*.009;pitch+=(e.clientY-lastY)*.009;pitch=Math.max(-Math.PI,Math.min(Math.PI,pitch));lastX=e.clientX;lastY=e.clientY;render()});
canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.35,Math.min(2.2,zoom*(e.deltaY>0?.91:1.09)));render()},{passive:false});
window.addEventListener('resize',render);active();render();if(status)status.textContent='Interactive · Drag to rotate · Scroll to zoom';
})();