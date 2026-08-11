(function(){
  'use strict';

  var toEl = function(nodeList){ return Array.prototype.slice.call(nodeList); };
  function safe(fn){ try { fn(); } catch(e){ /* isolate failures so one module never blocks the rest */ } }

  /* ---------- Sticky nav ---------- */
  safe(function(){
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var onScroll = function(){
      if (window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    document.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
  });

  /* ---------- Mobile menu ---------- */
  safe(function(){
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', function(){
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    toEl(links.querySelectorAll('a')).forEach(function(a){
      a.addEventListener('click', function(){
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded','false');
        document.body.style.overflow = '';
      });
    });
  });

  /* ---------- Active link on scroll ---------- */
  safe(function(){
    var sections = toEl(document.querySelectorAll('main section[id]'));
    var navAnchors = toEl(document.querySelectorAll('.nav-links a'));
    if (!('IntersectionObserver' in window) || !sections.length) return;
    var navObserver = new IntersectionObserver(function(entries){
      toEl(entries).forEach(function(entry){
        if (entry.isIntersecting){
          navAnchors.forEach(function(a){
            a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    }, { rootMargin:'-45% 0px -50% 0px' });
    sections.forEach(function(s){ navObserver.observe(s); });
  });

  /* ---------- Reveal on scroll ---------- */
  safe(function(){
    var revealEls = toEl(document.querySelectorAll('.reveal, .reveal-stagger'));
    if (!revealEls.length) return;
    if ('IntersectionObserver' in window){
      var revealObserver = new IntersectionObserver(function(entries, obs){
        toEl(entries).forEach(function(entry){
          if (entry.isIntersecting){
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold:0.12, rootMargin:'0px 0px -8% 0px' });
      revealEls.forEach(function(el){ revealObserver.observe(el); });
    } else {
      revealEls.forEach(function(el){ el.classList.add('in-view'); });
    }
    /* Safety net: never leave content permanently invisible if the observer
       is unavailable or misbehaves (older engines, crawlers, print/export). */
    setTimeout(function(){
      revealEls.forEach(function(el){ el.classList.add('in-view'); });
    }, 2500);
  });

  /* ---------- Photo / Music tabs (supports multiple independent tab groups) ---------- */
  safe(function(){
    var groups = toEl(document.querySelectorAll('[role="tablist"]'));
    groups.forEach(function(group){
      var tabs = toEl(group.querySelectorAll('.photo-tab'));
      if (!tabs.length) return;
      tabs.forEach(function(tab){
        tab.addEventListener('click', function(){
          tabs.forEach(function(t){
            var isActive = t === tab;
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-selected', isActive ? 'true' : 'false');
            var panel = document.getElementById(t.getAttribute('data-panel'));
            if (panel){ if (isActive) panel.removeAttribute('hidden'); else panel.setAttribute('hidden',''); }
          });
        });
      });
    });
  });

  /* ---------- Married-time counter (years / months / days since the wedding) ---------- */
  safe(function(){
    var elY = document.getElementById('cd-years');
    var elMo = document.getElementById('cd-months');
    var elD = document.getElementById('cd-days');
    if (!elD) return;
    var weddingDate = new Date('2026-02-04T14:00:00-03:00');
    function pad(n){ n = String(n); return n.length < 2 ? '0' + n : n; }
    function tick(){
      var now = new Date();
      if (now < weddingDate){
        elY.textContent = elMo.textContent = elD.textContent = '00';
        return;
      }
      var years = now.getFullYear() - weddingDate.getFullYear();
      var months = now.getMonth() - weddingDate.getMonth();
      var days = now.getDate() - weddingDate.getDate();
      if (days < 0){
        months -= 1;
        var prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        days += prevMonth;
      }
      if (months < 0){
        years -= 1;
        months += 12;
      }
      elY.textContent = pad(years);
      elMo.textContent = pad(months);
      elD.textContent = pad(days);
    }
    tick();
    setInterval(tick, 60000);
  });

  /* ---------- Toast ---------- */
  var toastEl = document.getElementById('toast');
  var toastTimer;
  function showToast(msg){
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 2400);
  }

  /* ---------- Copy to clipboard ---------- */
  safe(function(){
    function fallbackCopy(text, cb){
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch(e){}
      document.body.removeChild(ta);
      cb();
    }
    toEl(document.querySelectorAll('[data-copy]')).forEach(function(btn){
      btn.addEventListener('click', function(){
        var text = btn.getAttribute('data-copy');
        var done = function(){
          var original = btn.textContent;
          btn.textContent = 'Copiado ✓';
          btn.setAttribute('data-copied','true');
          showToast('Número de cuenta copiado');
          setTimeout(function(){ btn.textContent = original; btn.removeAttribute('data-copied'); }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(text).then(done).catch(function(){ fallbackCopy(text, done); });
        } else {
          fallbackCopy(text, done);
        }
      });
    });
  });

  /* ---------- Background audio ---------- */
  safe(function(){
    var audio = document.getElementById('bgAudio');
    var audioBtn = document.getElementById('audioToggle');
    if (!audio || !audioBtn) return;
    var setPlayingUI = function(playing){
      audioBtn.classList.toggle('paused', !playing);
      audioBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
      audioBtn.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
    };
    var tryAutoplay = function(){
      var p = audio.play();
      if (p && p.then) p.then(function(){ setPlayingUI(true); }).catch(function(){ setPlayingUI(false); });
    };
    window.addEventListener('load', tryAutoplay);
    audioBtn.addEventListener('click', function(){
      if (audio.paused){
        var p = audio.play();
        if (p && p.then) p.then(function(){ setPlayingUI(true); }).catch(function(){ showToast('No se pudo reproducir el audio'); });
      } else {
        audio.pause();
        setPlayingUI(false);
      }
    });
  });

})();
