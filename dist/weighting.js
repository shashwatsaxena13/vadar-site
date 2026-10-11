(() => {
 const stage=document.querySelector('#stage'), svg=document.querySelector('#weighting-svg'), play=document.querySelector('#anim-play');
 const labels=['Grasp frame','Insert frame','Grasp wrench','Hang wrench'];
 let mode='next', running=false, elapsed=0, lastTime=0, phase=-1, frame=0, mobile=false;
 const duration=8000, ns='http://www.w3.org/2000/svg';
 const selected=()=>[0,1,2,3].filter(i=>mode==='myopic'?i===+stage.value:i>=(mode==='next'?Math.min(+stage.value+1,3):+stage.value));
 function el(tag,attrs){const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;}
 function setCaption(step){
  const captions=[`Sample a replay transition while ${labels[+stage.value].toLowerCase()} is the first unfinished subgoal.`, 'Compute a separate target for every subgoal. All four losses update the shared critic, including values excluded from policy extraction.', `Apply ${mode==='next'?'next-future':mode==='current'?'current-future':'current-myopic'} weights. Only the red paths contribute to the aggregate value.`, 'Use the aggregate value in the base algorithm’s policy loss. The policy takes only the state as input.'];
  document.querySelector('#animation-caption').textContent=captions[step];
  renderInlineMath(document.querySelector('#animation-caption'));
  document.querySelectorAll('.phase-track span').forEach((e,i)=>e.classList.toggle('active',i===step));
 }
 function diagram(){
  mobile=svg.parentElement.clientWidth<580;
  const active=selected();
  const W=mobile?450:960,H=mobile?500:510;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  let html='<title id="animation-title">All-subgoal supervision and weighted policy extraction</title><desc id="animation-description">Blue paths supervise all four values. Red paths carry only selected values into the policy objective. Zero-weight values still receive critic supervision.</desc>';
  const input={x:W/2,y:42,w:mobile?210:230,h:58};
  const sum={x:W/2,y:mobile?346:365,w:mobile?190:230,h:58};
  const policy={x:W/2,y:mobile?451:465,w:mobile?190:200,h:56};
  const box=(o,cls,title,subtitle)=>`<g class="${cls}"><rect x="${o.x-o.w/2}" y="${o.y-o.h/2}" width="${o.w}" height="${o.h}" rx="9"/><text x="${o.x}" y="${o.y-3}" text-anchor="middle" class="svg-title">${title}</text><text x="${o.x}" y="${o.y+17}" text-anchor="middle" class="svg-small">${subtitle}</text></g>`;
  for(let i=0;i<4;i++){
   const q={x:W*(i+.5)/4,y:mobile?170:185,w:mobile?94:156,h:64};
   const path=`M ${input.x} ${input.y+29} C ${input.x} 110, ${q.x} 110, ${q.x} ${q.y-32}`;
   const gate={x:q.x,y:mobile?255:278};
   const out=`M ${q.x} ${q.y+32} L ${gate.x} ${gate.y} C ${gate.x} ${sum.y-42},${sum.x} ${sum.y-42},${sum.x} ${sum.y-29}`;
   html+=`<path id="supervise-${i}" class="supervision-path" d="${path}"/><path id="extract-${i}" class="extraction-path ${active.includes(i)?'selected':''}" d="${out}"/>`;
   html+=box(q,'value-node',`Q${'₁₂₃₄'[i]}`,'TD target + loss');
   html+=`<g class="weight-gate ${active.includes(i)?'selected':''}"><circle cx="${gate.x}" cy="${gate.y}" r="18"/><text x="${gate.x}" y="${gate.y+5}" text-anchor="middle">${active.includes(i)?'×1':'×0'}</text></g>`;
  }
  const finalPath=`M ${sum.x} ${sum.y+29} L ${policy.x} ${policy.y-28}`;
  html+=`<path id="policy-path" class="extraction-path selected" d="${finalPath}"/>`;
  html+=box(input,'input-node','Replay transition','(s, a, s′) + subgoal labels');
  html+=box(sum,'sum-node','Aggregate value','sum of selected Q-values');
  html+=box(policy,'policy-node','Policy update','π(a | s)');
  html+=`<text x="${W/2}" y="${mobile?125:133}" text-anchor="middle" class="svg-small">Shared critic parameters · subgoals ordered left to right</text>`;
  svg.innerHTML=html;
  svg.querySelectorAll('text').forEach(t=>{
   const label=t.textContent;let tex=null;
   if(/^Q[₁₂₃₄]$/.test(label))tex='Q_'+('₁₂₃₄'.indexOf(label[1])+1);
   else if(label==='π(a | s)')tex='\\pi(a\\mid s)';
   else if(label==='(s, a, s′) + subgoal labels')tex="(s,a,s^{\\prime})\\text{ + subgoal labels}";
   else if(/^×[01]$/.test(label))tex='\\times '+label[1];
   if(!tex)return;
   const x=+t.getAttribute('x'),y=+t.getAttribute('y');
   const small=t.classList.contains('svg-small'),gate=t.parentElement.classList.contains('weight-gate');
   const width=small?210:70,height=small?24:32;
   const foreign=el('foreignObject',{x:x-width/2,y:y-(small?15:23),width,height});
   foreign.innerHTML='<div xmlns="http://www.w3.org/1999/xhtml" class="svg-math '+(small?'small':gate?'gate':'')+'">'+mathHTML(tex)+'</div>';
   t.replaceWith(foreign);
  });
  for(let i=0;i<4;i++){svg.append(el('circle',{id:`blue-packet-${i}`,r:5,fill:'#376fa7',opacity:0}));svg.append(el('circle',{id:`red-packet-${i}`,r:5,fill:'#a5332e',opacity:0}));}
  svg.append(el('circle',{id:'policy-packet',r:6,fill:'#a5332e',opacity:0}));
  draw(elapsed/duration);
 }
 function position(pathId,circleId,t,show){
  const dot=svg.querySelector('#'+circleId); dot.setAttribute('opacity',show?'1':'0');
  if(!show)return;
  const path=svg.querySelector('#'+pathId),p=path.getPointAtLength(path.getTotalLength()*Math.max(0,Math.min(1,t)));
  dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);
 }
 function draw(t){
  const step=Math.min(3,Math.floor(t*4));
  if(phase!==step){phase=step;setCaption(step);}
  svg.querySelector('.input-node').classList.toggle('lit',running&&step===0);
  svg.querySelectorAll('.value-node').forEach(n=>n.classList.toggle('lit',running&&step===1));
  svg.querySelector('.sum-node').classList.toggle('lit',running&&step===2);
  svg.querySelector('.policy-node').classList.toggle('lit',running&&step===3);
  const active=selected();
  for(let i=0;i<4;i++){
   position(`supervise-${i}`,`blue-packet-${i}`,(t-.25)*4,running&&step===1);
   position(`extract-${i}`,`red-packet-${i}`,(t-.5)*4,running&&step===2&&active.includes(i));
  }
  position('policy-path','policy-packet',(t-.75)*4,running&&step===3);
 }
 function render(){
  const current=+stage.value,active=selected();
  document.querySelector('#stage-output').textContent=`${current+1} of 4 · ${labels[current]}`;
  document.querySelector('#goal-chain').innerHTML=labels.map((label,i)=>`<div class="goal ${active.includes(i)?'active':''} ${i<current?'complete':''} ${i===current?'current-goal':''}"><span class="q">g<sub>${i+1}</sub></span><strong>${label}</strong><span class="state">${i<current?'Completed':i===current?'Current unfinished':'Future subgoal'}</span><span class="weight">w${'₁₂₃₄'[i]} = ${active.includes(i)?1:0}</span></div>`).join('');
  document.querySelector('#weight-equation').innerHTML=`Q<sub>agg</sub> = ${active.map(i=>`Q<sub>${i+1}</sub>`).join(' + ')}`;
  const text={myopic:'Only the current-subgoal value enters the policy objective. The critic still learns all four values.',current:'The current and every later subgoal value enter the policy objective. Completed values are excluded.',next:current===3?'Only hanging the wrench remains. Next-future keeps Q₄ active at this final stage.':`Q${'₁₂₃₄'[current]} is excluded from policy extraction while ${labels[current].toLowerCase()} is unfinished. Later values enter the objective, and all four values still receive critic supervision.`};
  document.querySelector('#weight-explanation').textContent=text[mode];
  document.querySelectorAll('#goal-chain .q').forEach((e,i)=>e.innerHTML=mathHTML('g_'+(i+1)));
  document.querySelectorAll('#goal-chain .weight').forEach((e,i)=>e.innerHTML=mathHTML('w_'+(i+1)+'='+ (active.includes(i)?1:0)));
  document.querySelector('#weight-equation').innerHTML=mathHTML('Q_{\\mathrm{agg}}='+active.map(i=>'Q_'+(i+1)).join('+'));
  renderInlineMath(document.querySelector('#weight-explanation'));
  phase=-1;diagram();
 }
 function tick(now){
  if(!running)return;
  elapsed+=Math.min(100,now-lastTime)*Number(document.querySelector('#anim-speed').value);lastTime=now;
  if(elapsed>=duration){
   if(+stage.value===3){elapsed=duration-1;pause();document.querySelector('#animation-caption').textContent='The final-stage objective is Q₄. Replay to follow the weighting from the first subgoal.';renderInlineMath(document.querySelector('#animation-caption'));return;}
   stage.value=String(+stage.value+1);elapsed=0;render();
  }
  draw(elapsed/duration);frame=requestAnimationFrame(tick);
 }
 function pause(){running=false;cancelAnimationFrame(frame);play.textContent=+stage.value===3&&elapsed>=duration-1?'↺ Replay':'▶ Play';play.setAttribute('aria-pressed','false');draw(elapsed/duration);}
 play.addEventListener('click',()=>{if(running){pause();return;}if(elapsed>=duration-1){elapsed=0;stage.value='0';render();}running=true;lastTime=performance.now();play.textContent='Ⅱ Pause';play.setAttribute('aria-pressed','true');frame=requestAnimationFrame(tick);});
 stage.addEventListener('input',()=>{pause();elapsed=0;render();});
 document.querySelector('#anim-step').addEventListener('click',()=>{pause();stage.value=String((+stage.value+1)%4);elapsed=0;render();});
 document.querySelector('#anim-reset').addEventListener('click',()=>{pause();stage.value='0';elapsed=0;play.textContent='▶ Play';render();});
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));elapsed=0;render();}));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 new ResizeObserver(()=>{const next=svg.parentElement.clientWidth<580;if(next!==mobile)diagram();}).observe(svg.parentElement);
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)document.querySelector('#animation-caption').textContent='Use Next subgoal to explore without animation, or choose Play.';
 render();
 // Start when the reader reaches the animation, so it has not finished offscreen.
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
  let interacted=false;
  document.querySelector('#weighting-demo').addEventListener('pointerdown',()=>{interacted=true;},{once:true});
  document.querySelector('#weighting-demo').addEventListener('keydown',()=>{interacted=true;},{once:true});
  const autoplay=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting)){
    autoplay.disconnect();
    if(!interacted&&!running)play.click();
   }
  },{threshold:0.2});
  autoplay.observe(svg);
 }
})();
