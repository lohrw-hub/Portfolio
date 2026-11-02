/* Figure-switching component. The selectable studies are defined in each page's HTML. */
document.addEventListener('DOMContentLoaded', () => {
 document.querySelectorAll('[data-showcase]').forEach(box => {
  const im=box.querySelector('.showcase-image'),heading=box.querySelector('.showcase-heading'),description=box.querySelector('.showcase-description'),expand=box.querySelector('.showcase-image-button');
  box.querySelectorAll('.showcase-choice').forEach(button => button.addEventListener('click', () => {
   box.querySelectorAll('.showcase-choice').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')});
   button.classList.add('active');button.setAttribute('aria-pressed','true');
   im.src=button.dataset.src; im.alt=button.dataset.heading;
   heading.textContent=button.dataset.heading; description.textContent=button.dataset.description;
   expand.dataset.caption=button.dataset.ref+': '+button.dataset.heading;
  }));
 });
});
