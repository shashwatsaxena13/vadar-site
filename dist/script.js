document.querySelector('#copy-citation').addEventListener('click', async () => {
 const status = document.querySelector('#copy-status');
 try { await navigator.clipboard.writeText(document.querySelector('#bibtex').textContent); status.textContent = 'BibTeX copied to clipboard.'; }
 catch { const range = document.createRange(); range.selectNodeContents(document.querySelector('#bibtex')); const selection=window.getSelection(); selection.removeAllRanges(); selection.addRange(range); status.textContent = 'Citation selected. Press Ctrl+C or ⌘C to copy.'; }
});
const navLinks = [...document.querySelectorAll('.nav-links a')];
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting) navLinks.forEach(a=>{ const active=a.hash==='#'+entry.target.id; a.classList.toggle('active',active); if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current'); }); }), {rootMargin:'-12% 0px -65% 0px'});
navLinks.forEach(a => { const target = document.querySelector(a.hash); if(target)observer.observe(target); });
function progress(){ const max=document.documentElement.scrollHeight-innerHeight; document.querySelector('#progress').style.width = (max>0?Math.min(100,Math.max(0,scrollY/max*100)):0)+'%'; }
addEventListener('scroll',progress,{passive:true});addEventListener('resize',progress);progress();
const viewer=document.querySelector('#figure-viewer'), viewerImg=document.querySelector('#viewer-img');
document.querySelectorAll('figure a:has(img)').forEach(a=>a.addEventListener('click',e=>{
 if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
 e.preventDefault();const img=a.querySelector('img');viewerImg.src=img.src;viewerImg.alt=img.alt;
 document.querySelector('#viewer-original').href=a.href;
 document.querySelector('#viewer-caption').textContent=a.closest('figure').querySelector('figcaption').textContent;
 viewer.classList.remove('zoomed');document.querySelector('#viewer-zoom').textContent='Zoom to full size';viewer.showModal();
}));
document.querySelector('#viewer-close').addEventListener('click',()=>viewer.close());
document.querySelector('#viewer-zoom').addEventListener('click',e=>{const zoom=viewer.classList.toggle('zoomed');e.target.textContent=zoom?'Fit to window':'Zoom to full size';});
viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close();});
