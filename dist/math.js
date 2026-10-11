window.mathHTML = tex => katex.renderToString(tex, {throwOnError:false, output:'htmlAndMathml'});
window.renderPageMath = (root=document) => {
 root.querySelectorAll('[data-tex]').forEach(el => {
  if (el.dataset.mathDone===el.dataset.tex) return;
  el.innerHTML=mathHTML(el.dataset.tex);el.dataset.mathDone=el.dataset.tex;
 });
};
renderPageMath();
// Inline symbols in prose, captions, and dynamically updated animation text.
const mathTokens=/Q[₁₂₃₄]|w[₁₂₃₄]|π\(a \| s\)|λ(?:\s*=\s*[\d.]+(?:\s+or\s+[\d.]+)?)?|N\s*=\s*4|best-of-N/g;
function inlineMath(root){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];
 while(walker.nextNode()){
  const n=walker.currentNode;
  if(!n.parentElement.closest('script,style,pre,svg,.katex,[data-tex],button,select')) nodes.push(n);
 }
 nodes.forEach(n=>{
  const matches=[...n.textContent.matchAll(mathTokens)];if(!matches.length)return;
  const f=document.createDocumentFragment();let from=0;
  matches.forEach(m=>{
   f.append(n.textContent.slice(from,m.index));
   if(m[0]==='best-of-N'){f.append('best-of-');const e=document.createElement('span');e.innerHTML=mathHTML('N');f.append(e);}
   else {const e=document.createElement('span');let tex=m[0].replace(/Q([₁₂₃₄])/g,(_,x)=>'Q_'+('₁₂₃₄'.indexOf(x)+1)).replace(/w([₁₂₃₄])/g,(_,x)=>'w_'+('₁₂₃₄'.indexOf(x)+1)).replace('λ','\\lambda').replace(' or ','\\text{ or }').replace('π(a | s)','\\pi(a\\mid s)');e.innerHTML=mathHTML(tex);f.append(e);}
   from=m.index+m[0].length;
  });f.append(n.textContent.slice(from));n.replaceWith(f);
 });
}
window.renderInlineMath=inlineMath;
inlineMath(document.body);
