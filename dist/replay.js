(() => {
 const demo=document.querySelector('.replay-demo');if(!demo)return;
 const button=document.querySelector('#replay-toggle'),critic=demo.querySelector('.replay-critic');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const predictions=[[.82,.64,.37,.21],[.76,.59,.42,.28],[.88,.71,.53,.34],[.91,.78,.56,.40],[.68,.51,.29,.16],[.84,.66,.47,.32],[.79,.62,.44,.25],[.93,.81,.61,.46]];
 const targets=[[.90,.70,.45,.30],[.82,.66,.49,.33],[.91,.77,.59,.41],[.94,.82,.62,.46],[.75,.57,.35,.22],[.90,.73,.53,.38],[.85,.67,.51,.31],[.96,.87,.68,.52]];
 let paused=reduced.matches,visible=false,phase=0,sample=0,elapsed=0,last=0;
 const interval=2400;
 const track=demo.querySelector('.replay-track');track.append(track.querySelector('.replay-group').cloneNode(true));const cards=[...track.querySelectorAll('.transition-card')];
 const next=document.createElement('button');next.type='button';next.className='button';next.id='replay-next';next.textContent='Next transition →';button.before(next);
 demo.querySelector('.replay-selector').remove();
 const input=demo.querySelector('.sample-input');
 input.innerHTML='<span id="sample-name"></span><span id="sample-tuple"></span><span class="input-detail">One state-action pair enters the shared critic</span>';
 const backbone=demo.querySelector('.supervision-backbone');
 backbone.innerHTML='<span class="critic-model-title">Shared critic</span><span id="critic-function"></span><span class="critic-model-note">Shared representation · four subgoal predictions</span>';
 demo.querySelector('.forward-arrow').style.visibility='hidden';
 const label=demo.querySelector('.prediction-label');label.textContent='Predict all four subgoal values for this transition';
 const columns=[...demo.querySelectorAll('.prediction-column')];
 columns.forEach(c=>c.querySelector('.branch-wire').style.visibility='hidden');
 const ns='http://www.w3.org/2000/svg';
 const flow=document.createElementNS(ns,'svg');flow.classList.add('critic-flow');flow.setAttribute('aria-hidden','true');critic.prepend(flow);
 const number=(x)=>x.toFixed(2);
 const tex=(selector,value)=>{const el=demo.querySelector(selector);el.innerHTML=mathHTML(value);};
 function positionRibbon(animate=true){
  const view=demo.querySelector('.replay-window');
  const card=cards[sample+8];
  track.style.transition=animate&&!reduced.matches?'transform 650ms ease-in-out':'none';
  track.style.transform=`translateX(${view.clientWidth/2-card.offsetLeft-card.offsetWidth/2}px)`;
  cards.forEach((c,i)=>c.classList.toggle('sampled-card',i===sample+8));
 }
 function refreshSample(){
  const j=sample+1;
  document.querySelector('#sample-name').textContent=`Sampled transition ${String(j).padStart(2,'0')}`;
  tex('#sample-tuple',`(s_{${j}},a_{${j}},\\mathbf{r}_{${j}},s'_{${j}})`);
  tex('#critic-function',`Q_{\\phi}(s_{${j}},a_{${j}},\\cdot)`);
  columns.forEach((c,i)=>{
   c.querySelector('.prediction-formula').innerHTML=mathHTML(`Q_{${i+1}}(s_{${j}},a_{${j}})`);
   c.querySelector('.prediction-number').innerHTML=mathHTML(number(predictions[sample][i]));
   c.querySelector('.target-value b').innerHTML=mathHTML(`y_{${i+1}}=${number(targets[sample][i])}`);
   const loss=(predictions[sample][i]-targets[sample][i])**2;
   c.querySelector('.prediction-loss').innerHTML=mathHTML(`\\mathcal{L}_{${i+1}}=(Q_{${i+1}}-y_{${i+1}})^2`)+`<span class="loss-value">${mathHTML('='+loss.toFixed(4))}</span>`;
  });
  const total=predictions[sample].reduce((acc,v,i)=>acc+(v-targets[sample][i])**2,0);
  demo.querySelector('.critic-feedback [data-tex]').innerHTML=mathHTML(`\\mathcal{L}_{\\mathrm{critic}}=\\sum_{g=1}^{4}\\mathcal{L}_g=${total.toFixed(4)}`);
  positionRibbon(sample!==0);drawFlow();
 }
 function drawFlow(){
  const rect=critic.getBoundingClientRect();if(!rect.width)return;
  flow.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
  const bounds=el=>{const r=el.getBoundingClientRect();return {x:r.left-rect.left,y:r.top-rect.top,w:r.width,h:r.height};};
  const a=bounds(input),b=bounds(backbone),cx=b.x+b.w/2;
  let paths=`<defs><marker id="critic-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="none" stroke="#376fa7"/></marker></defs>`;
  const add=(id,d,cls)=>{paths+=`<path id="${id}" class="${cls}" d="${d}" marker-end="url(#critic-arrow)"/>`;};
  add('transition-to-critic',`M${a.x+a.w/2} ${a.y+a.h} L${cx} ${b.y-4}`,'input-flow');
  columns.forEach((col,i)=>{
   const p=bounds(col.querySelector('.predicted-value')),px=p.x+p.w/2;
   // Route each output down from the critic; mobile routes second-row outputs at the outside edges.
   const left=bounds(columns[0].querySelector('.predicted-value')),right=bounds(columns[1].querySelector('.predicted-value'));
   const lane=i<2||innerWidth>600?cx:(i===2?left.x-12:right.x+right.w+12);
   const startX=i<2||innerWidth>600?cx:lane;
   const d=i<2||innerWidth>600?`M${cx} ${b.y+b.h} L${cx} ${b.y+b.h+12} L${px} ${b.y+b.h+12} L${px} ${p.y-5}`:`M${cx} ${b.y+b.h} L${cx} ${b.y+b.h+12} L${lane} ${b.y+b.h+12} L${lane} ${p.y-16} L${px} ${p.y-16} L${px} ${p.y-5}`;
   add(`critic-to-q-${i}`,d,'output-flow');
  });
  paths+='<circle id="input-signal" r="4" fill="#376fa7"/>';
  for(let i=0;i<4;i++)paths+=`<circle id="output-signal-${i}" r="4" fill="#376fa7"/>`;
  flow.innerHTML=paths;animateSignals();
 }
 function animateSignals(){
  const put=(pathId,dotId,show)=>{
   const p=flow.querySelector('#'+pathId),dot=flow.querySelector('#'+dotId);if(!p||!dot)return;
   dot.style.opacity=show?'1':'0';if(!show)return;
   const point=p.getPointAtLength(p.getTotalLength()*Math.min(1,(elapsed%1200)/1200));dot.setAttribute('cx',point.x);dot.setAttribute('cy',point.y);
  };
  put('transition-to-critic','input-signal',phase===0&&!reduced.matches);
  for(let i=0;i<4;i++)put('critic-to-q-'+i,'output-signal-'+i,phase===1&&!reduced.matches);
 }
 function render(){
  demo.dataset.phase=phase;demo.dataset.sample=sample+1;
  demo.querySelectorAll('[data-step]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.step===phase)));
  const descriptions=[
   `Transition ${sample+1} supplies one state-action pair to the critic.`,
   `For transition ${sample+1}, the critic predicts all four subgoal returns in one forward pass.`,
   'Each subgoal prediction is compared with its own temporal-difference target, producing four losses.',
   'The sum of the four losses updates the shared critic. The next sampled transition produces another set of four predictions.'
  ];
  document.querySelector('#replay-explanation').textContent=descriptions[phase];animateSignals();
 }
 function sync(){
  demo.classList.toggle('replay-paused',paused||!visible||document.hidden);
  button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'Play animation':'Pause animation';
 }
 function advanceSample(){sample=(sample+1)%predictions.length;phase=reduced.matches?3:0;elapsed=0;refreshSample();render();}
 next.addEventListener('click',()=>{advanceSample();});
 button.addEventListener('click',()=>{paused=!paused;sync();});
 demo.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{phase=+b.dataset.step;elapsed=0;paused=true;render();sync();}));
 new IntersectionObserver(es=>{visible=es[0].isIntersecting;sync();}).observe(demo);
 document.addEventListener('visibilitychange',sync);
 reduced.addEventListener('change',()=>{paused=reduced.matches;if(paused){phase=3;render();}sync();});
 new ResizeObserver(()=>{positionRibbon(false);drawFlow();}).observe(critic);
 document.fonts.ready.then(()=>{positionRibbon(false);drawFlow();});
 function tick(now){
  if(last&&!paused&&visible&&!document.hidden){elapsed+=Math.min(100,now-last);if(elapsed>=interval){elapsed=0;if(phase===3)advanceSample();else {phase++;render();}}animateSignals();}
  last=now;requestAnimationFrame(tick);
 }
 if(reduced.matches)phase=3;refreshSample();render();sync();requestAnimationFrame(tick);
})();
