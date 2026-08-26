(function(){
  "use strict";
  var $ = function(s,r){return (r||document).querySelector(s);};
  var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var money = function(n){return '$' + (Math.round(n*100)/100).toFixed(2);};
  function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
  function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){return null;}}

  var GAMES = [
    {id:'lantern', title:'Lantern & Loam', studio:'Mossgarden', tag:'Farm sim', price:18, c1:'#2f6b4f', c2:'#8fd694',
     desc:'Tend a sunken garden by lantern-light. Grow odd plants, keep a few animals, and trade with the folk who visit after dark.'},
    {id:'tidepool', title:'Tidepool Post', studio:'Saltwind Games', tag:'Delivery sim', price:15, c1:'#22617f', c2:'#7fd0e6',
     desc:'Row the morning mail between island villages. No rush and no combat, just tides, letters, and the people waiting for them.'},
    {id:'teahouse', title:'Neon Teahouse', studio:'Yumi Interactive', tag:'Shop sim', price:22, c1:'#7a2f8a', c2:'#ff8fce',
     desc:'Run a small tea shop in the rain district. Pour drinks, remember regulars, and follow the stories that unfold over the seasons.'},
    {id:'ascent', title:'The Long Ascent', studio:'Cairn Collective', tag:'Climbing', price:24, c1:'#4a4360', c2:'#b9b0d6',
     desc:'One mountain, climbed a hold at a time. There are no timers. Just the route, the weather, and how far you can plan ahead.'},
    {id:'comets', title:'Paper Comets', studio:'Foldwork', tag:'Puzzle', price:15, c1:'#b5532a', c2:'#ffc38f',
     desc:'A folding puzzle game about origami and orbits. Bend each sheet into an arc and release it at the right moment.'},
    {id:'grove', title:'Grove of Small Machines', studio:'Tinker & Fern', tag:'Automation', price:20, c1:'#3f7d6a', c2:'#d9e08a',
     desc:'Build a garden that runs itself. Plant gears, wire up simple logic, and watch the grove tend its own harvest.'},
    {id:'carto', title:'Midnight Cartography', studio:'Vellum', tag:'Adventure', price:16, c1:'#2b3a6b', c2:'#8fa6e6',
     desc:'Chart a coastline that redraws itself each night. Map the shore, name the coves, and decide which places to keep secret.'},
    {id:'ember', title:'Ember Hollow', studio:'Hearthlight', tag:'Roguelite', price:26, c1:'#8a2f3a', c2:'#ff9a6e',
     desc:'A short, forgiving roguelite. Delve a little, warm your hands at the fire, and carry a small light back up each run.'}
  ];
  var byId = {}; GAMES.forEach(function(g){byId[g.id]=g;});

  var themeBtn=$('#themeBtn'), themeIcon=$('#themeIcon'), root=document.documentElement;
  var moon='<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';
  var sun='<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8"/>';
  (function initTheme(){
    var saved=store('warpcd_theme');
    if(saved==='light'||saved==='dark') root.setAttribute('data-theme',saved);
    var light=root.getAttribute('data-theme')==='light';
    if(themeIcon) themeIcon.innerHTML=light?sun:moon;
    if(themeBtn) themeBtn.setAttribute('aria-label',light?'Switch to dark theme':'Switch to light theme');
  })();
  if(themeBtn) themeBtn.addEventListener('click',function(){
    var light=root.getAttribute('data-theme')==='light';
    var next=light?'dark':'light';
    root.setAttribute('data-theme',next); store('warpcd_theme',next);
    if(themeIcon) themeIcon.innerHTML=(next==='light')?sun:moon;
    themeBtn.setAttribute('aria-label',(next==='light')?'Switch to dark theme':'Switch to light theme');
  });

  var navLinks=$('#navLinks'), burger=$('#burger');
  function toggleMenu(open){ if(!navLinks)return; navLinks.classList.toggle('open',open); if(burger) burger.setAttribute('aria-expanded',open?'true':'false'); }
  if(burger) burger.addEventListener('click',function(){ toggleMenu(!navLinks.classList.contains('open')); });
  $$('#navLinks a').forEach(function(a){ a.addEventListener('click',function(){ toggleMenu(false); }); });

  var toastWrap=$('#toasts');
  function toast(msg){
    if(!toastWrap) return;
    var t=document.createElement('div'); t.className='toast';
    t.innerHTML='<span class="dot"></span><span>'+esc(msg)+'</span>';
    toastWrap.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add('show'); });
    setTimeout(function(){ t.classList.remove('show'); setTimeout(function(){ t.remove(); },300); },2600);
  }

  var shelf={};
  (function loadShelf(){ var raw=store('warpcd_shelf'); if(raw){ try{ var o=JSON.parse(raw); if(o&&typeof o==='object') Object.keys(o).forEach(function(k){ if(byId[k]&&o[k]>0) shelf[k]=o[k]; }); }catch(e){} } })();
  function saveShelf(){ store('warpcd_shelf', JSON.stringify(shelf)); }
  function shelfQty(){ var n=0; for(var k in shelf) n+=shelf[k]; return n; }

  var drawer=$('#drawer'), scrim=$('#scrim'), dBody=$('#drawerBody'), dFoot=$('#drawerFoot'),
      totalEl=$('#drawerTotal'), countEl=$('#shelfCount'), shelfBtn=$('#shelfBtn');
  function renderShelf(){
    if(countEl){ var n=shelfQty(); countEl.textContent=n; countEl.classList.toggle('show',n>0);
      if(shelfBtn) shelfBtn.setAttribute('aria-label','Open your shelf ('+n+' item'+(n===1?'':'s')+')'); }
    if(!dBody) return;
    var ids=Object.keys(shelf), total=0;
    if(!ids.length){
      dBody.innerHTML='<div class="drawer__empty">Your shelf is empty.<br><a href="index.html#shelf" id="emptyBrowse">Browse the shelf</a></div>';
      if(dFoot) dFoot.style.display='none';
      var eb=$('#emptyBrowse'); if(eb) eb.addEventListener('click',closeDrawer);
      return;
    }
    var html='';
    ids.forEach(function(id){
      var g=byId[id], q=shelf[id], line=g.price*q; total+=line;
      html+='<div class="line-item">'+
        '<div class="line-item__art" style="--c1:'+g.c1+';--c2:'+g.c2+'"></div>'+
        '<div class="line-item__info"><div class="line-item__t">'+esc(g.title)+'</div>'+
          '<div class="line-item__meta">'+money(g.price)+' each</div>'+
          '<div class="qty"><button data-dec="'+id+'" aria-label="Decrease">\u2013</button><span>'+q+'</span><button data-inc="'+id+'" aria-label="Increase">+</button></div>'+
        '</div>'+
        '<div class="line-item__price">'+money(line)+'</div></div>';
    });
    dBody.innerHTML=html;
    if(totalEl) totalEl.textContent=money(total);
    if(dFoot) dFoot.style.display='block';
  }
  if(dBody) dBody.addEventListener('click',function(e){
    var inc=e.target.getAttribute&&e.target.getAttribute('data-inc'), dec=e.target.getAttribute&&e.target.getAttribute('data-dec');
    if(inc){ shelf[inc]++; saveShelf(); renderShelf(); }
    else if(dec){ shelf[dec]--; if(shelf[dec]<=0) delete shelf[dec]; saveShelf(); renderShelf(); }
  });
  function addToShelf(id){ if(!byId[id])return; shelf[id]=(shelf[id]||0)+1; saveShelf(); renderShelf();
    if(countEl&&countEl.animate) countEl.animate([{transform:'scale(1.4)'},{transform:'scale(1)'}],{duration:260,easing:'cubic-bezier(.34,1.4,.64,1)'});
    toast('Added \u201C'+byId[id].title+'\u201D to your shelf'); }
  function openDrawer(){ renderShelf(); if(scrim)scrim.classList.add('show'); if(drawer){drawer.classList.add('show');drawer.setAttribute('aria-hidden','false');} }
  function closeDrawer(){ if(drawer){drawer.classList.remove('show');drawer.setAttribute('aria-hidden','true');} maybeHideScrim(); }
  if(shelfBtn) shelfBtn.addEventListener('click',openDrawer);
  var dClose=$('#drawerClose'); if(dClose) dClose.addEventListener('click',closeDrawer);
  var checkoutBtn=$('#checkoutBtn'); if(checkoutBtn) checkoutBtn.addEventListener('click',function(){
    toast('This is a demo, so no payment is taken. Thanks for supporting indie devs.');
    shelf={}; saveShelf(); renderShelf(); setTimeout(closeDrawer,400);
  });

  var grid=$('#shelfGrid');
  if(grid){
    GAMES.forEach(function(g){
      var card=document.createElement('article');
      card.className='game'; card.setAttribute('tabindex','0'); card.setAttribute('role','button');
      card.setAttribute('aria-label',g.title+', '+money(g.price)+'. View details.');
      card.style.setProperty('--c1',g.c1); card.style.setProperty('--c2',g.c2);
      card.innerHTML=
        '<div class="case"><div class="case__cd"></div>'+
          '<div class="case__sleeve"><div class="case__spine">'+esc(g.studio)+'</div>'+
          '<div class="case__spine" style="align-self:flex-end;font-size:.8rem;letter-spacing:-.01em;text-transform:none">'+esc(g.title)+'</div></div>'+
          '<div class="case__price">'+money(g.price)+'</div></div>'+
        '<div class="game__body"><div class="game__title">'+esc(g.title)+'</div>'+
          '<div class="game__studio">'+esc(g.studio)+'</div>'+
          '<div class="game__tag">'+esc(g.tag)+'</div>'+
          '<div class="game__foot"><button class="btn btn--metal btn--sm add" data-id="'+g.id+'">Add to shelf</button></div></div>';
      grid.appendChild(card);
      card.addEventListener('click',function(e){ if(!e.target.closest('.add')) openModal(g.id); });
      card.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openModal(g.id);} });
    });
    grid.addEventListener('click',function(e){ var b=e.target.closest('.add'); if(!b)return; e.stopPropagation(); addToShelf(b.getAttribute('data-id')); });
  }

  var modal=$('#modal'), lastFocus=null, currentModalId=null;
  function openModal(id){
    if(!modal)return; var g=byId[id]; if(!g)return; currentModalId=id; lastFocus=document.activeElement;
    var art=$('#modalArt'); art.style.setProperty('--c1',g.c1); art.style.setProperty('--c2',g.c2);
    $('#modalSpine').textContent=g.studio; $('#modalTag').textContent=g.tag; $('#modalTitle').textContent=g.title;
    $('#modalStudio').textContent=g.studio; $('#modalDesc').textContent=g.desc; $('#modalPrice').textContent=money(g.price);
    if(scrim)scrim.classList.add('show'); modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
    var add=$('#modalAdd'); if(add) add.focus();
  }
  function closeModal(){ if(!modal)return; modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); maybeHideScrim(); if(lastFocus)lastFocus.focus(); }
  var mClose=$('#modalClose'); if(mClose) mClose.addEventListener('click',closeModal);
  var mAdd=$('#modalAdd'); if(mAdd) mAdd.addEventListener('click',function(){ if(currentModalId){ addToShelf(currentModalId); closeModal(); } });

  function maybeHideScrim(){ var d=drawer&&drawer.classList.contains('show'), m=modal&&modal.classList.contains('show'); if(!d&&!m&&scrim) scrim.classList.remove('show'); }
  if(scrim) scrim.addEventListener('click',function(){ closeDrawer(); closeModal(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ closeDrawer(); closeModal(); if(navLinks&&navLinks.classList.contains('open')) toggleMenu(false); } });

  var priceInput=$('#priceInput'), priceRange=$('#priceRange');
  if(priceInput&&priceRange){
    var devCut=$('#devCut'), priceEcho=$('#priceEcho'), warpCut=$('#warpCut');
    var clampPrice=function(v){ v=parseFloat(v); if(isNaN(v)) v=20; return Math.max(15,Math.min(30,v)); };
    function renderCalc(v){ var dev=v*0.8; if(devCut)devCut.textContent=money(dev); if(priceEcho)priceEcho.textContent=money(v); if(warpCut)warpCut.textContent='warp.cd '+money(v-dev); }
    function setPrice(v){ v=clampPrice(v); priceInput.value=(v%1===0)?v:v.toFixed(2); priceRange.value=Math.round(v); renderCalc(v); }
    priceInput.addEventListener('input',function(){ renderCalc(clampPrice(priceInput.value)); });
    priceInput.addEventListener('change',function(){ setPrice(priceInput.value); });
    priceRange.addEventListener('input',function(){ setPrice(priceRange.value); });
    setPrice(20);
  }

  var form=$('#applyForm');
  if(form){
    var fPrice=$('#fPrice'), formEarn=$('#formEarn');
    var clampP=function(v){ v=parseFloat(v); if(isNaN(v))v=20; return Math.max(15,Math.min(30,v)); };
    function echoEarn(){ if(!fPrice||!formEarn)return; var v=clampP(fPrice.value); formEarn.textContent='You\u2019d earn '+money(v*0.8)+' per copy'; }
    if(fPrice) fPrice.addEventListener('input',echoEarn); echoEarn();
    function setInvalid(el,bad){ var f=el.closest('.field'); if(f) f.classList.toggle('invalid',bad); }
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var ok=true;
      ['fGame','fStudio','fPitch','fLink'].forEach(function(id){ var el=$('#'+id); var bad=!el.value.trim(); setInvalid(el,bad); if(bad)ok=false; });
      var email=$('#fEmail'); var eBad=!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()); setInvalid(email,eBad); if(eBad)ok=false;
      var agree=$('#fAgree'); if(!agree.checked){ ok=false; toast('Please confirm the rights and split to continue.'); }
      if(!ok){ var fb=$('.field.invalid .control'); if(fb)fb.focus(); return; }

      var ref='WCD-'+Math.random().toString(16).slice(2,6).toUpperCase();
      var game=$('#fGame').value.trim(), studio=$('#fStudio').value.trim(), mail=email.value.trim(),
          platform=$('#fPlatform').value, price=clampP(fPrice.value), pitch=$('#fPitch').value.trim(), link=$('#fLink').value.trim();
      var subject='warp.cd application: '+game;
      var body='New disc application via warp.cd\n\n'+
        'Reference: '+ref+'\n'+
        'Game: '+game+'\n'+
        'Studio / name: '+studio+'\n'+
        'Contact email: '+mail+'\n'+
        'Platform: '+platform+'\n'+
        'Retail price: '+money(price)+'\n'+
        'Developer keeps (80%): '+money(price*0.8)+'\n\n'+
        'Pitch:\n'+pitch+'\n\n'+
        'Build / store link: '+link+'\n';
      var href='mailto:warpdriveconsole@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);

      var rEl=$('#applyRef'); if(rEl) rEl.textContent=ref;
      var ml=$('#applyMailLink'); if(ml) ml.setAttribute('href',href);
      var sMsg=$('#successMsg'); if(sMsg) sMsg.textContent='Your email app should open with the application ready to send to warpdriveconsole@gmail.com. If it does not, use the link below and quote this reference.';
      form.style.display='none';
      var sc=$('#applySuccess'); if(sc){ sc.classList.add('show'); if(sc.scrollIntoView){ try{ sc.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'}); }catch(err){} } }
      toast('Opening your email app for '+ref);
      try{ window.location.href=href; }catch(err){}
    });
    var again=$('#applyAnother'); if(again) again.addEventListener('click',function(){
      var sc=$('#applySuccess'); if(sc)sc.classList.remove('show');
      form.reset(); $$('.field.invalid').forEach(function(f){f.classList.remove('invalid');}); echoEarn();
      form.style.display='block'; var fg=$('#fGame'); if(fg)fg.focus();
    });
  }

  var faqList=$('#faqList');
  if(faqList){
    faqList.addEventListener('click',function(e){
      var q=e.target.closest('.qa__q'); if(!q)return;
      var qa=q.parentElement, a=qa.querySelector('.qa__a'), open=qa.classList.toggle('open');
      q.setAttribute('aria-expanded',open?'true':'false');
      a.style.maxHeight=open?a.scrollHeight+'px':'0px';
    });
    window.addEventListener('resize',function(){ $$('.qa.open .qa__a').forEach(function(a){ a.style.maxHeight=a.scrollHeight+'px'; }); });
  }

  $$('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var id=a.getAttribute('href'); if(id.length<2)return;
      var el=document.querySelector(id); if(!el)return;
      e.preventDefault(); if(el.scrollIntoView){ try{ el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}); }catch(err){ if(el.id) location.hash=el.id; } } else if(el.id){ location.hash=el.id; }
    });
  });

  var reveals=$$('.reveal');
  if(reduce||!('IntersectionObserver' in window)){ reveals.forEach(function(r){ r.classList.add('in'); }); }
  else{
    var io=new IntersectionObserver(function(entries){ entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } }); },{threshold:.12,rootMargin:'0px 0px -8% 0px'});
    reveals.forEach(function(r){ io.observe(r); });
  }

  var yr=$('#year'); if(yr) yr.textContent=new Date().getFullYear();
  renderShelf();
})();
