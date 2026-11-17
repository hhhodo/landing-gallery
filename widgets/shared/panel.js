/* Widget control panel. Usage: CWPanel.mount({title, root, controls, defaults, onChange})
   control types: color | range | select | toggle | text | button | group
   - {key, type, label, css:'--var', unit:'px'}  -> sets CSS var on root
   - {key, type:'select'|'toggle', attr:'data-x'} -> sets attribute on root
   - any control may be read in onChange(state) for re-render. */
(function(){
  function mount(cfg){
    var root=cfg.root, state=Object.assign({},cfg.defaults||{}), initial;
    var panel=document.createElement('aside'); panel.className='cw-panel';
    panel.innerHTML='<div class="cw-panel__head"><span>'+(cfg.title||'위젯 설정')+'</span><button class="cw-panel__toggle" type="button">접기</button></div><div class="cw-panel__body"></div>';
    var body=panel.querySelector('.cw-panel__body');
    panel.querySelector('.cw-panel__toggle').onclick=function(e){panel.classList.toggle('is-closed');e.target.textContent=panel.classList.contains('is-closed')?'펼치기':'접기'};
    var inputs={};
    function apply(c){
      var v=state[c.key];
      if(c.css) root.style.setProperty(c.css,(c.type==='range'&&c.unit)?v+c.unit:v);
      if(c.attr) root.setAttribute(c.attr,c.type==='toggle'?String(!!v):v);
    }
    function emit(c){apply(c);cfg.onChange&&cfg.onChange(state,c.key)}
    cfg.controls.forEach(function(c){
      if(c.type==='group'){var g=document.createElement('div');g.className='cw-group';g.textContent=c.label;body.appendChild(g);return}
      if(c.type==='button'){var b=document.createElement('div');b.className='cw-btns';var btn=document.createElement('button');btn.type='button';btn.textContent=c.label;btn.onclick=c.onClick;b.appendChild(btn);body.appendChild(b);return}
      var row=document.createElement('div');row.className='cw-row';
      var id='cw_'+c.key, lab=document.createElement('label');lab.htmlFor=id;lab.textContent=c.label;row.appendChild(lab);
      var el;
      if(c.type==='select'){el=document.createElement('select');c.options.forEach(function(o){var op=document.createElement('option');op.value=o.value!==undefined?o.value:o;op.textContent=o.label||o;el.appendChild(op)})}
      else{el=document.createElement('input');el.type=c.type==='toggle'?'checkbox':c.type;if(c.type==='range'){el.min=c.min;el.max=c.max;el.step=c.step||1}}
      el.id=id;inputs[c.key]=el;
      if(state[c.key]===undefined) state[c.key]=c.default;
      var val=null;if(c.type==='range'){val=document.createElement('span');val.className='cw-val'}
      function sync(){if(c.type==='toggle')el.checked=!!state[c.key];else el.value=state[c.key];if(val)val.textContent=state[c.key]+(c.unit||'')}
      sync();
      el.addEventListener(c.type==='range'||c.type==='color'||c.type==='text'?'input':'change',function(){state[c.key]=c.type==='toggle'?el.checked:(c.type==='range'?Number(el.value):el.value);if(val)val.textContent=state[c.key]+(c.unit||'');emit(c)});
      row.appendChild(el);if(val)row.appendChild(val);body.appendChild(row);
      c._sync=sync;
    });
    initial=JSON.stringify(state);
    var bar=document.createElement('div');bar.className='cw-btns';
    bar.innerHTML='<button type="button" data-a="reset">초기화</button><button type="button" class="is-primary" data-a="copy">설정 복사(JSON)</button>';
    body.appendChild(bar);
    bar.onclick=function(e){var a=e.target.dataset.a;if(a==='reset'){state=JSON.parse(initial);cfg.controls.forEach(function(c){if(c.key&&c._sync){c._sync();apply(c)}});cfg.onReset&&cfg.onReset();cfg.onChange&&cfg.onChange(state,null)}
      if(a==='copy'){var t=JSON.stringify(cfg.getExport?cfg.getExport(state):state,null,2);(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){toast('설정을 복사했습니다')},function(){window.prompt('복사하세요',t)})}};
    document.body.appendChild(panel);
    if(/[?&]nopanel/.test(location.search))panel.style.display='none';
    cfg.controls.forEach(function(c){if(c.key&&(c.css||c.attr))apply(c)});
    cfg.onChange&&cfg.onChange(state,null);
    return {state:function(){return state},panel:panel};
  }
  function toast(m){var t=document.createElement('div');t.className='cw-toast';t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.remove()},1600)}
  /* inline text editing: elements with data-i (index) + data-f (field) write back into data[i][f]; data-g edits data.meta[g] */
  function setEditable(container,on){container.querySelectorAll('[data-f],[data-g]').forEach(function(n){n.contentEditable=on?'true':'false'});}
  function bindEdit(container,data,meta){container.addEventListener('input',function(e){var n=e.target.closest('[data-f],[data-g]');if(!n)return;if(n.dataset.g)meta[n.dataset.g]=n.textContent;else data[+n.dataset.i][n.dataset.f]=n.innerText.replace(/\n+$/,'')});
    container.addEventListener('keydown',function(e){if(e.target.isContentEditable&&e.key===' ')e.stopPropagation()});}
  window.CWPanel={mount:mount,toast:toast,setEditable:setEditable,bindEdit:bindEdit};
})();
