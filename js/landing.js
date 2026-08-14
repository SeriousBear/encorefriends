/* ============================================================
   Encore — Landing Page JavaScript (landing.js)
   Scroll-driven lighting, beat, origin thread, vibe switcher,
   forward demo, constellation, scroll-spy, phone tilt, FAQ.
   Loaded with `defer`, so the DOM is ready when this runs.
   ============================================================ */
(function(){
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var root=document.documentElement, body=document.body, nav=document.getElementById('nav'), drop=document.getElementById('show');
  function peak(p,c,w){var v=1-Math.abs(p-c)/w;return v<0?0:(v>1?1:v);}
  function clamp01(v){return v<0?0:(v>1?1:v);}

  ['l0','l1','l2'].forEach(function(id,i){setTimeout(function(){var e=document.getElementById(id);if(e)e.classList.add('show');},180+i*150);});
  setTimeout(function(){var h=document.getElementById('hed');if(h&&!reduce)h.classList.add('beat');},950);

  // ---- VIBE SWITCHER ----
  var genres=[
    {n:'EDM',c:'',bpm:128,tag:'EDM night'},
    {n:'House',c:'g-house',bpm:124,tag:'house groove'},
    {n:'Techno',c:'g-techno',bpm:132,tag:'techno tunnel'},
    {n:'Bass',c:'g-bass',bpm:140,tag:'bass drop'},
    {n:'Trance',c:'g-trance',bpm:138,tag:'trance state'},
    {n:'Indie',c:'g-indie',bpm:118,tag:'indie set'}
  ];
  var vibe=document.getElementById('vibe'), flash=document.getElementById('flash');
  var bpmEl=document.getElementById('bpm'), tagEl=document.getElementById('vibetag');
  var classes=genres.map(function(g){return g.c;}).filter(Boolean);
  genres.forEach(function(g,i){
    var b=document.createElement('button');
    b.className='chip'+(i===0?' on':''); b.textContent=g.n;
    b.addEventListener('click',function(){
      classes.forEach(function(c){body.classList.remove(c);});
      if(g.c) body.classList.add(g.c);
      root.style.setProperty('--beat',(60/g.bpm).toFixed(3)+'s');
      bpmEl.textContent=g.bpm; tagEl.textContent=g.tag;
      vibe.querySelectorAll('.chip').forEach(function(c){c.classList.remove('on');});
      b.classList.add('on');
      if(!reduce){flash.classList.remove('go');void flash.offsetWidth;flash.classList.add('go');}
    });
    vibe.appendChild(b);
  });

  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.15,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.reveal').forEach(function(e){io.observe(e);});

  // community constellation — draw the connecting lines
  (function(){var svg=document.getElementById('lines');if(!svg)return;
    var pairs=[[18,32,44,66],[44,66,70,28],[70,28,83,64],[18,32,53,22],[53,22,70,28],[44,66,83,64]],h='';
    pairs.forEach(function(p){h+='<line x1="'+p[0]+'%" y1="'+p[1]+'%" x2="'+p[2]+'%" y2="'+p[3]+'%"/>';});
    svg.innerHTML=h;})();

  // scroll-spy — highlight the nav link for the section you're in
  (function(){
    var links={};
    document.querySelectorAll('.nav-links a').forEach(function(a){var h=a.getAttribute('href');if(h&&h.charAt(0)==='#')links[h.slice(1)]=a;});
    var spy=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){var id=e.target.id;
        Object.keys(links).forEach(function(k){links[k].classList.toggle('active',k===id);});}
    });},{rootMargin:'-45% 0px -45% 0px',threshold:0});
    Object.keys(links).forEach(function(id){var el=document.getElementById(id);if(el)spy.observe(el);});
  })();

  // count-up the hero stat
  (function(){
    var el=document.querySelector('[data-count]');if(!el||reduce)return;
    var target=+el.getAttribute('data-count'),start=null;
    requestAnimationFrame(function step(t){if(!start)start=t;var pr=Math.min((t-start)/900,1);
      el.textContent=Math.round(pr*target);if(pr<1)requestAnimationFrame(step);});
  })();

  // phone 3D tilt on pointer
  (function(){
    var wrap=document.getElementById('phoneWrap');
    if(!wrap||reduce||!window.matchMedia('(pointer:fine)').matches)return;
    var tilt=wrap.querySelector('.phone-tilt');if(!tilt)return;
    wrap.addEventListener('pointermove',function(e){var r=wrap.getBoundingClientRect();
      var rx=((e.clientY-(r.top+r.height/2))/r.height)*-10;
      var ry=((e.clientX-(r.left+r.width/2))/r.width)*12;
      tilt.style.transform='rotateX('+rx.toFixed(1)+'deg) rotateY('+ry.toFixed(1)+'deg)';});
    wrap.addEventListener('pointerleave',function(){tilt.style.transform='';});
  })();

  // FAQ modal
  (function(){
    var modal=document.getElementById('faqModal');if(!modal)return;
    function open(e){if(e)e.preventDefault();modal.classList.add('open');}
    function close(){modal.classList.remove('open');}
    document.querySelectorAll('[data-faq]').forEach(function(b){b.addEventListener('click',open);});
    var x=document.getElementById('faqClose');if(x)x.addEventListener('click',close);
    modal.addEventListener('click',function(e){if(e.target===modal)close();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
    modal.querySelectorAll('.faq-q').forEach(function(q){q.addEventListener('click',function(){q.parentNode.classList.toggle('on');});});
  })();

  var thread=document.getElementById('thread');
  if(thread){
    var msgs=[].slice.call(thread.querySelectorAll('.msg'));
    if(reduce){msgs.forEach(function(m){m.classList.add('in');});}
    else{var started=false;
      var tio=new IntersectionObserver(function(es){es.forEach(function(e){
        if(e.isIntersecting&&!started){started=true;
          msgs.forEach(function(m,i){setTimeout(function(){m.classList.add('in');},i*430);});tio.disconnect();}});},{threshold:.2});
      tio.observe(thread);}
  }

  var magnet=document.getElementById('magnet');
  if(magnet&&!reduce&&window.matchMedia('(pointer:fine)').matches){
    magnet.addEventListener('pointermove',function(e){var r=magnet.getBoundingClientRect();
      magnet.style.transform='translate('+((e.clientX-(r.left+r.width/2))*.25)+'px,'+((e.clientY-(r.top+r.height/2))*.35)+'px)';});
    magnet.addEventListener('pointerleave',function(){magnet.style.transform='';});
  }

  if(reduce){
    root.style.setProperty('--g-gold','.5');root.style.setProperty('--g-mag','.3');
    root.style.setProperty('--g-cyan','.25');root.style.setProperty('--beam','.3');
    return;
  }

  var ticking=false,vh=window.innerHeight,docH=1;
  function measure(){vh=window.innerHeight;docH=document.body.scrollHeight-vh;}
  measure();window.addEventListener('resize',measure,{passive:true});
  function frame(){
    ticking=false;
    var y=window.scrollY||window.pageYOffset;
    var p=docH>0?clamp01(y/docH):0;
    root.style.setProperty('--p',p.toFixed(4));
    root.style.setProperty('--g-ember',(peak(p,0.18,0.22)*0.7+peak(p,0.88,0.18)*0.5).toFixed(3));
    root.style.setProperty('--g-gold',(0.15+peak(p,0.42,0.30)*0.7+peak(p,0.66,0.2)*0.35).toFixed(3));
    root.style.setProperty('--g-mag',(peak(p,0.42,0.24)*0.75).toFixed(3));
    root.style.setProperty('--g-cyan',(peak(p,0.44,0.22)*0.6).toFixed(3));
    nav.classList.toggle('scrolled',y>60);
    var r=drop.getBoundingClientRect(), span=drop.offsetHeight-vh, start=vh*0.8;
    // begin the reveal while the section is still approaching (not only once pinned)
    drop.querySelector('.drop-stage').style.setProperty('--lp',clamp01((start - r.top)/((span>0?span:1)+start)).toFixed(4));
    root.style.setProperty('--beam',clamp01(peak(p,0.42,0.26)*1.15).toFixed(3));
  }
  window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(frame);}},{passive:true});
  frame();
})();
