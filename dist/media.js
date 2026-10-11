(() => {
 document.querySelectorAll('video').forEach(v=>{const speed=v.closest('.success-card')?1:2;v.defaultPlaybackRate=speed;v.playbackRate=speed;v.addEventListener('loadedmetadata',()=>{v.playbackRate=speed;});});
 document.querySelector('#rollout-speed')?.addEventListener('change',e=>document.querySelectorAll('#videos-panel video').forEach(v=>{v.playbackRate=Number(e.target.value);}));
 document.querySelectorAll('[data-video-speed]').forEach(select=>select.addEventListener('change',()=>{select.closest('figure').querySelector('video').playbackRate=Number(select.value);}));
 document.querySelectorAll('.results-rollouts').forEach(panel=>panel.addEventListener('toggle',()=>{if(!panel.open)panel.querySelectorAll('video').forEach(v=>v.pause());}));
 const tabs = [...document.querySelectorAll('.media-tabs [role="tab"]')];
 const select = tab => {
  tabs.forEach(t => {
   const selected = t === tab;
   t.setAttribute('aria-selected', String(selected));
   t.tabIndex = selected ? 0 : -1;
   const panel = document.getElementById(t.getAttribute('aria-controls'));
   panel.hidden = !selected;
   if (!selected) panel.querySelectorAll('video').forEach(v => v.pause());
  });
 };
 tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => select(tab));
  tab.addEventListener('keydown', e => {
   if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
   e.preventDefault();
   const next = e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs.at(-1) : tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
   select(next); next.focus();
  });
 });
 document.addEventListener('visibilitychange', () => {
  if (document.hidden) document.querySelectorAll('video').forEach(v => v.pause());
 });
})();
