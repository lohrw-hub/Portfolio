/* Shared site navigation and image-lightbox. Change these items to rename the header on every page. */
const SITE = {
  owner: 'Wesley H. Lohr, PhD',
  subtitle: 'Neurotechnology · hardware engineering',
  linkedin: 'https://www.linkedin.com/in/wesleyhlohr/',
  email: 'wesleyhlohr.research@gmail.com',
  nav: [
    {text:'TMS Phantom', href:'tms.html', pages:['tms.html','instrumentation.html','data.html']},
    {text:'Simulations', href:'simulations.html', pages:['simulations.html']},
    {text:'Materials', href:'materials.html', pages:['materials.html']},
    {text:'CAD', href:'cad.html', pages:['cad.html','head-models.html','human.html','macaque.html','rat.html','fixtures.html','electrodes.html']},
    {text:'Other', href:'other.html', pages:['other.html']}
  ]
};
function initializePortfolio() {
 const current = location.pathname.split('/').pop() || 'index.html';
 const header=document.getElementById('siteHeader');
 if(header){header.innerHTML=`<div class="topbar"><a aria-label="Return to the portfolio homepage" class="identity" href="index.html"><img alt="Portrait of Wesley H. Lohr" src="assets/profile.jpg"/><span><span class="name">${SITE.owner}</span><span class="role">${SITE.subtitle}</span></span></a><nav class="topnav" aria-label="Main navigation">${SITE.nav.map(x=>`<a href="${x.href}" ${x.pages.includes(current)?'class="active" aria-current="page"':''}>${x.text}</a>`).join('')}<a class="external dissertation-link" href="https://scholarscompass.vcu.edu/etd/8379/" target="_blank" rel="noopener noreferrer">Dissertation ↗</a><a class="external" href="${SITE.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></nav></div>`}
 const footer=document.getElementById('siteFooter');
 if(footer){footer.innerHTML=`<div class="wrap footer-inner"><div><strong>${SITE.owner}</strong><p>Neurotechnology hardware, modeling and measurement systems.<br>Richmond, Virginia · © ${new Date().getFullYear()}</p></div><div class="footer-links"><a href="mailto:${SITE.email}">Email ↗</a><a href="${SITE.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a href="index.html">Home ↑</a></div></div>`}
 const dialog=document.getElementById('lightbox');
 if(dialog){const im=dialog.querySelector('img'), cap=dialog.querySelector('.modal-caption');
 document.querySelectorAll('.figure-trigger').forEach(btn=>btn.addEventListener('click',()=>{
  const pic=btn.querySelector('img'); if(!pic)return;im.src=pic.src;im.alt=pic.alt;cap.textContent=btn.dataset.caption||pic.alt;
  if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
 }));dialog.querySelector('.close')?.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});}
 document.querySelectorAll('[data-currentyear]').forEach(e=>e.textContent=new Date().getFullYear());
}
document.addEventListener('DOMContentLoaded', initializePortfolio);
