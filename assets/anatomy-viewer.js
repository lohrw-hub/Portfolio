(()=>{
'use strict';
const canvas=document.getElementById('anatomyCanvas');
const stage=document.querySelector('.assembly-stage');
const fallback=document.getElementById('anatomyFallback');
const dat=window.ANATOMY_MODELS?.models;
if(!canvas||!stage||!dat) return;
let gl;
try{gl=canvas.getContext('webgl2',{antialias:true,alpha:true,depth:true,preserveDrawingBuffer:false})||canvas.getContext('webgl',{antialias:true,alpha:true,depth:true});}catch(_){}
const colors={brain:[.86,.87,.71],csf:[.32,.73,.69],skull:[.88,.74,.49],head:[.68,.46,.33]};
const thumbs={all:'layered-anatomy.png',brain:'brain-hero.png',csf:'csf-shell.png',skull:'skull-shell.png',head:'head-shell.png'};
let mode='all',yaw=-.45,pitch=-.57,zoom=.92,dragging=false,lastX=0,lastY=0;
const controls=document.querySelectorAll('.assembly-controls [data-model]');
function sync(){controls.forEach(b=>b.classList.toggle('active',b.dataset.model===mode));if(fallback)fallback.src='assets/'+thumbs[mode];}
function fallbackMode(){canvas.style.display='none';fallback.hidden=false;sync();}
if(!gl){fallbackMode();bindInputs();return;}
function shader(type,source){let s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const VS='attribute vec3 aPos; attribute vec3 aNormal; uniform mat3 uRot; uniform float uZoom,uAspect; varying vec3 vNormal; void main(){ vec3 p=uRot*aPos; vNormal=uRot*aNormal; gl_Position=vec4(p.x*uZoom/uAspect,p.y*uZoom,p.z*.3,1.0); }';
const FS='precision mediump float; varying vec3 vNormal; uniform vec3 uColor; uniform float uOpacity; void main(){ vec3 n=normalize(vNormal); vec3 k=normalize(vec3(-.7,.5,.9)); float d=max(0.0,dot(n,k)); float fill=max(0.0,dot(n,vec3(.7,-.35,.55))); float rim=pow(1.0-abs(n.z),2.0); vec3 c=uColor*(.40+.55*d+.18*fill)+rim*vec3(.14,.16,.10); gl_FragColor=vec4(c,uOpacity); }';
let prog;
try{
 prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,VS));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);
 if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));
}catch(e){fallbackMode();bindInputs();return;}
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
function render(){resize();gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix3fv(uniforms.rot,false,rotation());gl.uniform1f(uniforms.zoom,zoom);gl.uniform1f(uniforms.aspect,canvas.width/canvas.height);
 if(mode==='all'){
  gl.disable(gl.BLEND);gl.depthMask(true);drawMesh('brain',1);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
  drawMesh('csf',.23);drawMesh('skull',.23);drawMesh('head',.14);
  gl.depthMask(true);gl.disable(gl.BLEND);
 } else {gl.disable(gl.BLEND);gl.depthMask(true);drawMesh(mode,1);}
}
function bindInputs(){controls.forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.model;sync();zoom=mode==='brain'||mode==='csf'?1.13:.91;if(gl)render();}));
 document.getElementById('anatomyZoomIn')?.addEventListener('click',()=>{zoom=Math.min(1.7,zoom*1.15);if(gl)render();});
 document.getElementById('anatomyZoomOut')?.addEventListener('click',()=>{zoom=Math.max(.35,zoom/1.15);if(gl)render();});
 document.getElementById('anatomyReset')?.addEventListener('click',()=>{yaw=-.45;pitch=-.57;zoom=.92;mode='all';sync();if(gl)render();});
 canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw+=(e.clientX-lastX)*.009;pitch+=(e.clientY-lastY)*.009;lastX=e.clientX;lastY=e.clientY;if(gl)render();});
 canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.35,Math.min(1.7,zoom*(e.deltaY>0?.91:1.09)));if(gl)render();},{passive:false});
 window.addEventListener('resize',()=>{if(gl)render();});
}
bindInputs();sync();render();
})();
