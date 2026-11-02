(()=>{
'use strict';
let canvas=document.getElementById('anatomyCanvas');
const stage=document.querySelector('.assembly-stage');
const fallback=document.getElementById('anatomyFallback');
const dat=window.ANATOMY_MODELS?.models;
if(!canvas||!stage||!dat) return;
let gl;
try{gl=canvas.getContext('webgl2',{antialias:true,alpha:true,depth:true,preserveDrawingBuffer:false})||canvas.getContext('webgl',{antialias:true,alpha:true,depth:true});}catch(_){}
const colors={brain:[.86,.87,.71],csf:[.32,.73,.69],skull:[.88,.74,.49],head:[.68,.46,.33]};
const thumbs={all:'anatomy-all.png',brain:'anatomy-brain.png',csf:'anatomy-csf.png',skull:'anatomy-skull.png',head:'anatomy-head.png'};
// STL meshes use Z as the superior/inferior anatomical axis. Start from an
// anterior-oblique view (not a view from beneath the cranium).
const DEFAULT_VIEW={yaw:2.33,pitch:-1.22,zoom:.84};
let mode='all',yaw=DEFAULT_VIEW.yaw,pitch=DEFAULT_VIEW.pitch,zoom=DEFAULT_VIEW.zoom,dragging=false,lastX=0,lastY=0;
const controls=document.querySelectorAll('.assembly-controls [data-model]');
function sync(){controls.forEach(b=>b.classList.toggle('active',b.dataset.model===mode));if(fallback)fallback.src='assets/'+thumbs[mode];}
// WebGL is optional. When it is unavailable, render the same layer model
// to a rotatable 2D canvas rather than a static image. This is also the
// interaction model used by the standalone brain-surface viewer.
function interactiveCanvasFallback(){
  const ctx=canvas.getContext('2d');
  if(!ctx){canvas.style.display='none';if(fallback){fallback.hidden=false;fallback.style.display='block';}return;}
  if(fallback){fallback.hidden=true;fallback.style.display='none';fallback.style.pointerEvents='none';}
  canvas.style.display='block';
  const mesh={};
  function decode(b64){const s=atob(b64),v=new Uint8Array(s.length);for(let i=0;i<s.length;i++)v[i]=s.charCodeAt(i);return v;}
  for(const [name,obj] of Object.entries(dat)){
    const v=decode(obj.v),f=decode(obj.f);
    mesh[name]={v:new Int16Array(v.buffer),f:new Uint16Array(f.buffer),sx:new Float32Array(v.length/12),sy:new Float32Array(v.length/12),sz:new Float32Array(v.length/12),nz:new Float32Array(v.length/12),light:new Float32Array(v.length/12)};
  }
  const color={brain:[216,216,178],csf:[80,181,174],skull:[207,172,111],head:[153,110,82]};
  const opac={brain:1,csf:.22,skull:.30,head:.20};
  const palettes={};
  for(const name of Object.keys(mesh)){
    const [r,g,b]=color[name],a=opac[name];
    palettes[name]=Array.from({length:32},(_,i)=>{const l=.42+i*.033;return `rgba(${Math.min(255,Math.round(r*l))},${Math.min(255,Math.round(g*l))},${Math.min(255,Math.round(b*l))},${a})`;});
  }
  let queued=false,usedFrames=0;
  function render(){
    queued=false;usedFrames++;
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.6),w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    ctx.clearRect(0,0,w,h);
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),ss=Math.min(w,h)*.56*zoom;
    const isAll=mode==='all',layers=isAll?['brain','csf','skull','head']:[mode];
    const allFaces=[];
    for(const name of layers){
      const m=mesh[name];if(!m)continue;
      const v=m.v,n=m.sx.length;
      const single=!isAll;
      // The full assembly keeps the shared MRI coordinate system. Individual
      // surfaces are recentered and framed like the standalone brain viewer.
      let min=[1,1,1],max=[-1,-1,-1];
      if(single){for(let i=0;i<n;i++){for(let j=0;j<3;j++){const q=v[i*6+j]/32767;min[j]=Math.min(min[j],q);max[j]=Math.max(max[j],q);}}}
      const localCenter=single?min.map((q,j)=>(q+max[j])/2):[0,0,0];
      const localScale=single?1.6/Math.max(.001,...min.map((q,j)=>max[j]-q)):1.0;
      for(let i=0;i<n;i++){
        const ix=i*6,xx=(v[ix]/32767-localCenter[0])*localScale,yy=(v[ix+1]/32767-localCenter[1])*localScale,zz=(v[ix+2]/32767-localCenter[2])*localScale;
        const yy2=yy*cp-zz*sp,zz2=yy*sp+zz*cp;
        m.sx[i]=w*.5+(xx*cy+zz2*sy)*ss;
        m.sy[i]=h*.50-yy2*ss;
        m.sz[i]=-xx*sy+zz2*cy;
        const nx=v[ix+3]/32767,ny=v[ix+4]/32767,nz=v[ix+5]/32767;
        const ny2=ny*cp-nz*sp,nz2=ny*sp+nz*cp;
        const nx2=nx*cy+nz2*sy;
        m.nz[i]=-nx*sy+nz2*cy;
        m.light[i]=Math.max(.15,Math.min(1.24,.52+.44*(nx2*-.6+ny2*.52+m.nz[i]*.8)));
      }
      const f=m.f,step=(single?1:name==='brain'?1:name==='csf'?3:name==='skull'?2:2);
      for(let i=0;i<f.length;i+=3*step){
        const a=f[i],b=f[i+1],c=f[i+2];
        const norm=(m.nz[a]+m.nz[b]+m.nz[c])/3;
        // Transparent shells are represented only by their outward visible faces.
        if(isAll&&name!=='brain'&&norm<.04)continue;
        const lum=(m.light[a]+m.light[b]+m.light[c])/3;
        const shade=Math.max(0,Math.min(31,Math.round((lum-.15)/1.09*31)));
        allFaces.push({name,depth:(m.sz[a]+m.sz[b]+m.sz[c])/3,a,b,c,shade});
      }
    }
    allFaces.sort((a,b)=>b.depth-a.depth);
    for(const f of allFaces){
      const m=mesh[f.name];
      ctx.fillStyle=palettes[f.name][f.shade];
      ctx.beginPath();ctx.moveTo(m.sx[f.a],m.sy[f.a]);ctx.lineTo(m.sx[f.b],m.sy[f.b]);ctx.lineTo(m.sx[f.c],m.sy[f.c]);ctx.closePath();ctx.fill();
    }
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(render);}}
  controls.forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.model;sync();schedule();}));
  document.getElementById('anatomyZoomIn')?.addEventListener('click',()=>{zoom=Math.min(1.8,zoom*1.15);schedule();});
  document.getElementById('anatomyZoomOut')?.addEventListener('click',()=>{zoom=Math.max(.36,zoom/1.15);schedule();});
  document.getElementById('anatomyReset')?.addEventListener('click',()=>{yaw=DEFAULT_VIEW.yaw;pitch=DEFAULT_VIEW.pitch;zoom=DEFAULT_VIEW.zoom;mode='all';sync();schedule();});
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw+=(e.clientX-lastX)*.009;pitch+=(e.clientY-lastY)*.009;pitch=Math.max(-Math.PI,Math.min(Math.PI,pitch));lastX=e.clientX;lastY=e.clientY;schedule();});
  canvas.addEventListener('pointerup',()=>dragging=false);
  canvas.addEventListener('pointercancel',()=>dragging=false);
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.36,Math.min(1.8,zoom*(e.deltaY>0?.91:1.09)));schedule();},{passive:false});
  window.addEventListener('resize',schedule);
  window.assemblyViewerDebug=()=>({mode,yaw,pitch,zoom,renderedFrames:usedFrames,renderer:'Canvas 2D'});
  sync();schedule();
}
if(!gl){interactiveCanvasFallback();return;}
function shader(type,source){let s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const VS='attribute vec3 aPos; attribute vec3 aNormal; uniform mat3 uRot; uniform float uZoom,uAspect; varying vec3 vNormal; void main(){ vec3 p=uRot*aPos; vNormal=uRot*aNormal; gl_Position=vec4(p.x*uZoom/uAspect,p.y*uZoom,p.z*.3,1.0); }';
const FS='precision mediump float; varying vec3 vNormal; uniform vec3 uColor; uniform float uOpacity; void main(){ vec3 n=normalize(vNormal); vec3 k=normalize(vec3(-.7,.5,.9)); float d=max(0.0,dot(n,k)); float fill=max(0.0,dot(n,vec3(.7,-.35,.55))); float rim=pow(1.0-abs(n.z),2.0); vec3 c=uColor*(.40+.55*d+.18*fill)+rim*vec3(.14,.16,.10); gl_FragColor=vec4(c,uOpacity); }';
let prog;
try{
 prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,VS));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);
 if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));
}catch(e){
 // WebGL was initialized but the shader failed. Replace it with a fresh canvas
 // so the interactive 2D renderer can still be used.
 const fresh=canvas.cloneNode(false);canvas.replaceWith(fresh);canvas=fresh;gl=null;interactiveCanvasFallback();return;
}
gl.useProgram(prog);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
function bytes(t){let b=atob(t),out=new Uint8Array(b.length);for(let i=0;i<b.length;i++)out[i]=b.charCodeAt(i);return out;}
const models={};for(const [key,o] of Object.entries(dat)){
 let v=bytes(o.v),f=bytes(o.f);let vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,v,gl.STATIC_DRAW);
 let ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(f.buffer),gl.STATIC_DRAW);
 models[key]={vb,ib,count:f.length/2};
}
const pos=gl.getAttribLocation(prog,'aPos'),norm=gl.getAttribLocation(prog,'aNormal');
const uniforms={rot:gl.getUniformLocation(prog,'uRot'),zoom:gl.getUniformLocation(prog,'uZoom'),aspect:gl.getUniformLocation(prog,'uAspect'),color:gl.getUniformLocation(prog,'uColor'),alpha:gl.getUniformLocation(prog,'uOpacity')};
gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(norm);
function mul(a,b){const o=new Float32Array(9);for(let c=0;c<3;c++)for(let r=0;r<3;r++)for(let k=0;k<3;k++)o[c*3+r]+=a[k*3+r]*b[c*3+k];return o;}
function rotation(){let c=Math.cos(pitch),s=Math.sin(pitch),d=Math.cos(yaw),t=Math.sin(yaw);return mul(new Float32Array([d,0,-t,0,1,0,t,0,d]),new Float32Array([1,0,0,0,c,s,0,-s,c]));}
function resize(){let rect=canvas.getBoundingClientRect(),r=Math.min(2,devicePixelRatio||1),w=Math.max(1,Math.round(rect.width*r)),h=Math.max(1,Math.round(rect.height*r));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}}
function drawMesh(key,alpha){let m=models[key];if(!m)return;gl.uniform3fv(uniforms.color,new Float32Array(colors[key]));gl.uniform1f(uniforms.alpha,alpha);gl.bindBuffer(gl.ARRAY_BUFFER,m.vb);gl.vertexAttribPointer(pos,3,gl.SHORT,true,12,0);gl.vertexAttribPointer(norm,3,gl.SHORT,true,12,6);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.ib);gl.drawElements(gl.TRIANGLES,m.count,gl.UNSIGNED_SHORT,0);}
function render(){
 resize();gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.uniformMatrix3fv(uniforms.rot,false,rotation());
 gl.uniform1f(uniforms.zoom,zoom);
 gl.uniform1f(uniforms.aspect,canvas.width/canvas.height);
 if(mode==='all'){
  // The four STLs already share the same physical coordinate system.
  // Render the opaque brain to the depth buffer first; then render both
  // sides of each surrounding shell using face culling and alpha blending.
  // The original renderer used a very low shell opacity from an
  // underside camera angle, making the brain look detached.
  gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.depthMask(true);
  drawMesh('brain',1.0);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);gl.enable(gl.CULL_FACE);
  // Back faces first, then front faces. Opaque brain correctly masks
  // shell surfaces that fall behind the brain in the current view.
  for(const face of [gl.FRONT,gl.BACK]){
   gl.cullFace(face);
   drawMesh('csf',.24);
   drawMesh('skull',.34);
   drawMesh('head',.29);
  }
  gl.disable(gl.CULL_FACE);gl.depthMask(true);gl.disable(gl.BLEND);
 }else{
  gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.depthMask(true);
  drawMesh(mode,1.0);
 }
}
function bindInputs(){controls.forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.model;sync();zoom=mode==='brain'||mode==='csf'?1.02:DEFAULT_VIEW.zoom;if(gl)render();}));
 document.getElementById('anatomyZoomIn')?.addEventListener('click',()=>{zoom=Math.min(1.7,zoom*1.15);if(gl)render();});
 document.getElementById('anatomyZoomOut')?.addEventListener('click',()=>{zoom=Math.max(.35,zoom/1.15);if(gl)render();});
 document.getElementById('anatomyReset')?.addEventListener('click',()=>{yaw=DEFAULT_VIEW.yaw;pitch=DEFAULT_VIEW.pitch;zoom=DEFAULT_VIEW.zoom;mode='all';sync();if(gl)render();});
 canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw+=(e.clientX-lastX)*.009;pitch+=(e.clientY-lastY)*.009;lastX=e.clientX;lastY=e.clientY;if(gl)render();});
 canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.35,Math.min(1.7,zoom*(e.deltaY>0?.91:1.09)));if(gl)render();},{passive:false});
 window.addEventListener('resize',()=>{if(gl)render();});
}
if(fallback){fallback.hidden=true;fallback.style.display="none";fallback.style.pointerEvents="none";}
window.assemblyViewerDebug=()=>({mode,yaw,pitch,zoom,renderer:"WebGL"});
bindInputs();sync();render();
})();
