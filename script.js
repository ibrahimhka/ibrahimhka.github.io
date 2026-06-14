(function () {
  'use strict';

  function each(list, fn) {
    for (var i = 0; i < list.length; i++) fn(list[i], i);
  }

  // Dynamic date
  each(document.querySelectorAll('.masthead-date'), function (el) { el.textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); });

  // Smooth scroll for nav links
  each(document.querySelectorAll('.section-nav a[href^="#"]'), function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Active nav highlight on scroll
  var sections = document.querySelectorAll('section[id]');
  var navItems = document.querySelectorAll('.section-nav a[href^="#"]');

  function highlightNav() {
    var scrollY = window.pageYOffset;
    each(sections, function (section) {
      var top = section.offsetTop - 100;
      var bottom = top + section.offsetHeight;
      var id = section.getAttribute('id');
      if (scrollY >= top && scrollY < bottom) {
        each(navItems, function (item) {
          item.classList.remove('active');
          if (item.getAttribute('href') === '#' + id) item.classList.add('active');
        });
      }
    });
  }
  window.addEventListener('scroll', highlightNav, { passive: true });
  highlightNav();

  // ---- Project modal logic (nav + keyboard) ----

  var modal = document.getElementById('project-modal');
  var viewport = document.getElementById('gallery-viewport');
  var counter = document.getElementById('gallery-counter');
  var closeBtn = document.getElementById('modal-close');
  var prevBtn = document.getElementById('gallery-prev');
  var nextBtn = document.getElementById('gallery-next');

  var projects = {
    bubuai: { title: 'BubuAI', desc: 'Enterprise childcare management with AI face recognition for attendance and parent communication.', tags: 'Python \u00b7 Face Rec. \u00b7 PostgreSQL', assets: ['screen-1.png', 'screen-2.png', 'screen-3.png', 'screen-4.png', 'screen-5.png', 'screen-6.png'] },
    draims: { title: 'Draims AI', desc: 'AI video and image generation platform built on Google Imagen 3, ElevenLabs, Veo3, Runway and Kling.', tags: 'Python \u00b7 TypeScript \u00b7 FFMPEG \u00b7 GenAI', assets: ['hero.jpeg', 'screen-1.png', 'screen-2.png', 'screen-3.png', 'screen-4.png', 'screen-5.png', 'video.mp4'] },
    hl: { title: 'HistoryLens', desc: 'News aggregation with an interactive 3D globe, real-time monitoring and NLP entity extraction.', tags: 'Python \u00b7 NLP \u00b7 WebGL', assets: ['screen-1.png', 'screen-2.png', 'screen-3.png', 'screen-4.png', 'screen-5.png', 'screen-6.png', 'screen-7.png'] },
    mlcryptotrade: { title: 'ML Crypto Algo Trading', desc: 'Algorithmic trading bot using ML regressors and reinforcement learning on self-hosted Kubernetes with GPU training.', tags: 'Python \u00b7 ML/RL \u00b7 Kubernetes \u00b7 Freqtrade', assets: ['chart-1.jpeg', 'chart-2.jpeg', 'chart-3.jpeg', 'chart-4.jpeg', 'video-1.mp4', 'video-2.mp4'] }
  };

  var isVid = {};
  var keys = Object.keys(projects);
  for (var k = 0; k < keys.length; k++) {
    isVid[keys[k]] = {};
    for (var a = 0; a < projects[keys[k]].assets.length; a++) {
      var fn = projects[keys[k]].assets[a];
      isVid[keys[k]][fn] = fn.indexOf('.mp4') > -1;
    }
  }

  var curSlug = null;
  var curIdx = 0;

  var BASE = 'https://ibrahimhka.github.io/assets/';

  function show(idx) {
    var data = projects[curSlug];
    var name = data.assets[idx];
    var path = BASE + curSlug + '/' + name;
    viewport.innerHTML = isVid[curSlug][name]
      ? '<video controls autoplay><source src="' + path + '" type="video/mp4"></video>'
      : '<img src="' + path + '" alt="' + data.title + '">';
    counter.textContent = (idx + 1) + ' / ' + data.assets.length;
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === data.assets.length - 1;
  }

  window.openProjectModal = function (slug) {
    var data = projects[slug];
    if (!data) return;
    curSlug = slug;
    curIdx = 0;
    document.getElementById('modal-title').textContent = data.title;
    document.getElementById('modal-desc').textContent = data.desc;
    document.getElementById('modal-tags').textContent = data.tags;
    show(0);
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  function close() {
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    viewport.innerHTML = '';
    curSlug = null;
  }

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  if (prevBtn) prevBtn.addEventListener('click', function () { if (curSlug && curIdx > 0) { curIdx--; show(curIdx); } });
  if (nextBtn) nextBtn.addEventListener('click', function () { if (curSlug && curIdx < projects[curSlug].assets.length - 1) { curIdx++; show(curIdx); } });
  document.addEventListener('keydown', function (e) {
    if (!modal || !modal.classList.contains('active')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft' && prevBtn && !prevBtn.disabled) { curIdx--; show(curIdx); }
    if (e.key === 'ArrowRight' && nextBtn && !nextBtn.disabled) { curIdx++; show(curIdx); }
  });
})();
