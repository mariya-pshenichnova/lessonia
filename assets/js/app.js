/* =====================================================================
   Школа «Лессония» — интерактивность сайта
   ===================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  const D = window.LESSONIA;
  const NEWS = window.LESSONIA_NEWS || [];
  const C = D.config;

  /* ---------- Утилиты ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const thumb = (id) => `assets/photos/thumb/p${id}.jpg`;
  const full = (id) => `assets/photos/full/p${id}.jpg`;

  const SIZES = {};
  (D.photoSizes || '').split(',').forEach((p) => {
    const [id, wh] = p.split(':');
    if (!wh) return;
    const [w, h] = wh.split('x').map(Number);
    SIZES[id] = { w, h };
  });
  const dims = (id, max = 720) => {
    const s = SIZES[id];
    if (!s) return '';
    const k = Math.min(1, max / Math.max(s.w, s.h));
    return `width="${Math.round(s.w * k)}" height="${Math.round(s.h * k)}"`;
  };

  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const DOW = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const DOW_LONG = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

  const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const fmtDate = (s, withYear = true) => { const d = typeof s === 'string' ? parseDate(s) : s; return `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ' ' + d.getFullYear() : ''}`; };
  const fmtDots = (s) => { const d = parseDate(s); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`; };
  const today = () => { const t = C.today ? parseDate(C.today) : new Date(); t.setHours(0, 0, 0, 0); return t; };
  const plural = (n, forms) => { const a = Math.abs(n) % 100, b = a % 10; if (a > 10 && a < 20) return forms[2]; if (b > 1 && b < 5) return forms[1]; if (b === 1) return forms[0]; return forms[2]; };
  const relDay = (d) => {
    const diff = Math.round((d - today()) / 864e5);
    if (diff === 0) return 'сегодня';
    if (diff === 1) return 'завтра';
    if (diff === 2) return 'послезавтра';
    return `через ${diff} ${plural(diff, ['день', 'дня', 'дней'])}`;
  };
  const initials = (name) => name.replace(/[«»"]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const linkify = (s) => esc(s)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    .replace(/(\+7[\d\s()-]{9,16}\d)/g, (m) => `<a href="tel:+7${m.replace(/\D/g, '').slice(1)}">${m}</a>`);

  // В подписях из Telegram скобка в конце — это смайлик «)»; в подписях к фото она лишняя
  const cleanCap = (s) => {
    let t = String(s || '').trim();
    while (t.endsWith(')') && (t.match(/\)/g) || []).length > (t.match(/\(/g) || []).length) t = t.slice(0, -1).trim();
    return t;
  };
  const isMobile = () => window.matchMedia('(max-width: 760px)').matches;
  const dirById = (id) => D.directions.find((d) => d.id === id);
  const teacherById = (id) => D.teachers.find((t) => t.id === id);
  const catLabel = (id) => (D.dirCategories.find((c) => c.id === id) || {}).label || '';
  const CAT_COLORS = { school: '#2F7D1A', tech: '#0A6FA8', art: '#C4451A', stage: '#D9381A', mind: '#8A6100', camp: '#236112' };
  const NEWS_ICONS = { study: 'i-book', clubs: 'i-palette', events: 'i-sparkle', trips: 'i-map', camp: 'i-tent', wins: 'i-trophy' };

  function toast(text, ic = 'i-check') {
    const box = $('.toasts');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `${icon(ic)}<span>${esc(text)}</span>`;
    box.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3200);
  }

  /* ---------- Контакты из конфигурации ---------- */
  function applyConfig() {
    $$('[data-cfg]').forEach((el) => { const v = C[el.dataset.cfg]; if (v) el.textContent = v; });
    $$('[data-cfg-href]').forEach((el) => { const v = C[el.dataset.cfgHref]; if (v) el.href = v; });
    $$('[data-cfg-tel]').forEach((el) => { el.href = 'tel:' + C.phoneHref; });
    $$('[data-cfg-tel2]').forEach((el) => { el.href = 'tel:' + C.phone2Href; });
    $$('[data-cfg-mail]').forEach((el) => { el.href = 'mailto:' + C.email; });
  }

  /* ---------- Модальные окна ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
  const Modal = {
    stack: [],
    open(id, { replace = false } = {}) {
      const m = document.getElementById(id);
      if (!m) return;
      if (replace) while (this.stack.length) this.close(true);
      if (this.stack.some((s) => s.m === m)) return;
      this.stack.push({ m, last: document.activeElement });
      m.hidden = false;
      document.body.classList.add('is-locked');
      const dlg = $('.modal__dialog', m);
      if (dlg) dlg.scrollTop = 0;
      requestAnimationFrame(() => {
        const f = $$(FOCUSABLE, $('.modal__dialog', m) || m).find((el) => !el.closest('[hidden]') && !el.classList.contains('modal__x'));
        (f || $('.modal__x', m) || m).focus({ preventScroll: true });
      });
      m.dispatchEvent(new CustomEvent('modal:open'));
    },
    close(silent) {
      const top = this.stack.pop();
      if (!top) return;
      top.m.hidden = true;
      top.m.dispatchEvent(new CustomEvent('modal:close'));
      if (!this.stack.length && $('#lightbox').hidden && $('#mnav').hidden) document.body.classList.remove('is-locked');
      if (!silent && top.last && top.last.focus) top.last.focus({ preventScroll: true });
    },
    top() { return this.stack.length ? this.stack[this.stack.length - 1].m : null; }
  };

  function trapFocus(e, container) {
    const items = $$(FOCUSABLE, container).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Шапка, меню, навигация ---------- */
  function initHeader() {
    const header = $('.header');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const mnav = $('#mnav'), burger = $('.burger');
    const openMenu = () => { mnav.hidden = false; burger.setAttribute('aria-expanded', 'true'); document.body.classList.add('is-locked'); $('a', mnav).focus(); };
    const closeMenu = () => { mnav.hidden = true; burger.setAttribute('aria-expanded', 'false'); if (!Modal.stack.length) document.body.classList.remove('is-locked'); };
    burger.addEventListener('click', openMenu);
    mnav.addEventListener('click', (e) => {
      if (e.target === mnav || e.target.closest('[data-close-mnav]') || e.target.closest('.mnav__links a') || e.target.closest('[data-book],[data-open]')) closeMenu();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mnav.hidden) closeMenu(); });

    // Подсветка активного раздела
    const links = $$('.nav a');
    const map = { why: 'about', prices: 'directions', booking: 'events', faq: 'gallery' };
    const sections = $$('main section[id]');
    const spy = () => {
      const y = window.scrollY + 140;
      let current = null;
      for (const s of sections) if (s.offsetTop <= y) current = s.id;
      const target = map[current] || current;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + target));
    };
    let ticking = false;
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { spy(); ticking = false; }); } }, { passive: true });
    spy();
  }

  /* ---------- Появление при прокрутке, счётчики ---------- */
  function initReveal() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const sibs = el.parentElement ? $$(':scope > .reveal', el.parentElement) : [];
        const i = Math.max(0, sibs.indexOf(el));
        el.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach((el) => io.observe(el));

    const counters = $$('[data-count]');
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target, to = +el.dataset.count, t0 = performance.now(), dur = 1100;
        const step = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  function initMarquee() {
    const tr = $('.marquee__track');
    if (tr) tr.innerHTML += tr.innerHTML;
  }

  /* ---------- История ---------- */
  function renderHistory() {
    const box = $('[data-render="history"]');
    const colors = ['var(--yellow)', 'var(--red)', 'var(--green)', 'var(--blue)', 'var(--peach)'];
    const bgs = ['var(--yellow-50)', 'var(--red-50)', 'var(--green-50)', 'var(--blue-50)', 'var(--peach-50)'];
    box.innerHTML = D.history.map((h, i) => `
      <li class="history__item" style="--c:${colors[i % 5]};--c-bg:${bgs[i % 5]}">
        <span class="history__dot"></span>
        <article class="history__card">
          ${h.photo ? `<div class="history__img"><img src="${thumb(h.photo)}" alt="${esc(h.title)}" loading="lazy" ${dims(h.photo, 400)}></div>`
            : `<div class="history__img history__img--empty">${icon(h.icon || 'i-sparkle', '')}</div>`}
          <div class="history__body">
            <span class="history__when">${esc(h.when)}</span>
            <h4>${esc(h.title)}</h4>
            <p>${esc(h.text)}</p>
          </div>
        </article>
      </li>`).join('');

    // Перетаскивание мышью
    let down = false, sx = 0, sl = 0, moved = false;
    box.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = box.scrollLeft; });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; box.classList.add('is-drag'); }
      box.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', () => { if (!down) return; down = false; box.classList.remove('is-drag'); });
    box.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    box.addEventListener('dragstart', (e) => e.preventDefault());
  }

  /* ---------- Направления ---------- */
  const dirState = { cat: 'all', openOnly: false, expanded: false };

  function renderDirFilters() {
    const box = $('[data-render="dir-filters"]');
    box.innerHTML = D.dirCategories.map((c) => {
      const n = D.directions.filter((d) => c.id === 'all' || d.cat === c.id).length;
      return `<button class="chip${dirState.cat === c.id ? ' is-active' : ''}" type="button" role="tab" aria-selected="${dirState.cat === c.id}" data-dcat="${c.id}">${esc(c.label)}<span class="chip__n">${n}</span></button>`;
    }).join('');
  }

  function dirCard(d) {
    const closed = d.status === 'closed';
    const long = d.age.length > 3;
    const status = closed
      ? `<span class="status status--closed"><i></i>Набор закрыт</span>`
      : d.isNew ? `<span class="status status--new">Новое направление</span>` : `<span class="status status--open"><i></i>Идёт набор</span>`;
    const t = d.teacher ? teacherById(d.teacher) : null;
    return `
      <article class="dcard${closed ? ' is-closed' : ''}" style="--cat:${CAT_COLORS[d.cat]}">
        <div class="dcard__media" data-dir-open="${d.id}" role="button" tabindex="-1" aria-label="Подробнее: ${esc(d.title)}">
          <img src="${thumb(d.photo)}" alt="${esc(d.title)}" loading="lazy" ${dims(d.photo)} style="object-position:${d.pos || '50% 50%'}">
          <div class="dcard__badges">${status}<span class="dcard__age${long ? ' dcard__age--txt' : ''}">${esc(d.age)}</span></div>
        </div>
        <div class="dcard__body">
          <span class="dcard__cat">${icon(d.icon)}${esc(catLabel(d.cat))}</span>
          <h3>${esc(d.title)}</h3>
          <p class="dcard__short">${esc(d.short)}</p>
          <ul class="dcard__meta">
            <li>${icon('i-calendar')}<span>${esc(d.schedule)}</span></li>
            <li><span class="rub" aria-hidden="true">₽</span><span><b>${esc(d.price)}</b></span></li>
            ${t ? `<li>${icon('i-user')}<span>${esc(t.name)}</span></li>` : ''}
          </ul>
          ${closed ? `<div class="dcard__next">${icon('i-clock')}<span>${esc(d.statusNote)}. ${esc(d.nextLabel || 'Следующий набор')} — <b>с&nbsp;${fmtDots(d.nextIntake)}</b></span></div>` : ''}
          <div class="dcard__foot">
            ${closed
              ? `<button class="btn btn--dark btn--sm" type="button" data-waitlist="${d.id}">В лист ожидания</button>`
              : `<button class="btn btn--primary btn--sm" type="button" data-book="${d.book}" data-dir="${d.id}">Записаться</button>`}
            <button class="btn btn--ghost btn--sm" type="button" data-dir-open="${d.id}">Подробнее</button>
          </div>
        </div>
      </article>`;
  }

  function renderDirections() {
    const box = $('[data-render="directions"]');
    const list = D.directions.filter((d) => (dirState.cat === 'all' || d.cat === dirState.cat) && (!dirState.openOnly || d.status === 'open'));
    const limit = dirState.expanded || !isMobile() ? Infinity : 4;
    box.innerHTML = list.length
      ? list.slice(0, limit).map(dirCard).join('')
      : `<div class="dir-empty">В этой категории сейчас нет открытого набора. <button class="link-btn" type="button" data-open="lead">Оставьте заявку</button> — сообщим, когда он начнётся.</div>`;
    $$('.dcard', box).forEach((c, i) => { c.style.animationDelay = `${Math.min(i, 8) * 45}ms`; });
    const more = $('#dir-more');
    more.hidden = list.length <= limit;
    more.textContent = `Показать все направления (${list.length})`;
  }

  function initDirections() {
    renderDirFilters();
    renderDirections();
    $('[data-render="dir-filters"]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-dcat]');
      if (!b) return;
      dirState.cat = b.dataset.dcat;
      renderDirFilters();
      renderDirections();
    });
    $('#dir-open-only').addEventListener('change', (e) => { dirState.openOnly = e.target.checked; renderDirections(); });
    $('#dir-more').addEventListener('click', () => { dirState.expanded = true; renderDirections(); });
  }

  function openDirection(id) {
    const d = dirById(id);
    if (!d) return;
    const closed = d.status === 'closed';
    const t = d.teacher ? teacherById(d.teacher) : null;
    $('[data-direction-body]').innerHTML = `
      <div class="dmodal">
        <div class="dmodal__media"><img src="${full(d.photo)}" alt="${esc(d.title)}" style="object-position:${d.pos || '50% 50%'}"></div>
        <div class="dmodal__body">
          <div class="dmodal__tags">
            ${closed ? `<span class="status status--closed"><i></i>Набор закрыт</span>` : `<span class="status status--open"><i></i>${esc(d.statusNote)}</span>`}
            <span class="ebadge">${esc(catLabel(d.cat))}</span><span class="ebadge">${esc(d.age)}</span>
          </div>
          <h2>${esc(d.title)}</h2>
          <p class="prose" style="margin:0">${esc(d.short)}</p>
          <div class="dmodal__facts">
            <div class="fact"><small>Расписание</small><b>${esc(d.schedule)}</b></div>
            <div class="fact"><small>Стоимость</small><b>${esc(d.price)}</b></div>
            <div class="fact"><small>Группа</small><b>${esc(d.group)}</b></div>
            <div class="fact"><small>${closed ? esc(d.nextLabel || 'Следующий набор') : 'Набор'}</small><b>${closed ? 'с ' + fmtDots(d.nextIntake) : 'открыт'}</b></div>
          </div>
          <ul class="checklist">${d.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
          ${t ? `<div class="dmodal__teacher"><span class="mono" style="--mc:${CAT_COLORS[d.cat]}">${esc(initials(t.name))}</span><div><small>Педагог</small><b>${esc(t.name)}</b></div></div>` : ''}
          <div class="dmodal__actions">
            ${closed
              ? `<button class="btn btn--primary" type="button" data-waitlist="${d.id}">Встать в лист ожидания</button>`
              : `<button class="btn btn--primary" type="button" data-book="${d.book}" data-dir="${d.id}">${d.book === 'tour' ? 'Записаться на экскурсию' : 'Записаться на пробное занятие'}</button>`}
            <button class="btn btn--ghost" type="button" data-open="callback">${icon('i-callback')}Обратный звонок</button>
          </div>
        </div>
      </div>`;
    Modal.open('modal-direction');
  }

  /* ---------- Педагоги ---------- */
  function renderTeachers() {
    const monoColors = { sky: 'var(--blue-700)', peach: 'var(--orange-700)', yellow: '#9A6B00', mint: 'var(--green-700)', rose: 'var(--red-600)' };
    const box = $('[data-render="teachers"]');
    box.innerHTML = D.teachers.map((t) => {
      const firstDir = dirById(t.dirs[0]);
      const bookType = firstDir ? firstDir.book : 'trial';
      return `
      <article class="tcard tcard--${t.color} reveal">
        <div class="tcard__top">
          <span class="mono" style="--mc:${monoColors[t.color]}">${esc(initials(t.name))}</span>
          <div><h3 class="tcard__name">${esc(t.name)}</h3><p class="tcard__role">${esc(t.role)}</p></div>
        </div>
        <figure class="tcard__photo">
          <img src="${thumb(t.photo)}" alt="Занятие: ${esc(t.tags[0])}" loading="lazy" ${dims(t.photo)} style="object-position:${t.pos || '50% 50%'}">
          <figcaption>Фото с занятий</figcaption>
        </figure>
        <div class="tags">${t.tags.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>
        <ul class="checklist">${t.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        ${t.quote ? `<blockquote class="tcard__quote">«${esc(t.quote.text)}»<cite>${esc(t.quote.author)}, отзыв на Яндекс Картах</cite></blockquote>` : ''}
        <div class="tcard__foot"><button class="btn btn--dark btn--sm" type="button" data-book="${bookType}" data-dir="${t.dirs[0]}">${bookType === 'tour' ? 'Записаться на экскурсию' : 'Записаться на занятие'}${icon('i-arrow')}</button></div>
      </article>`;
    }).join('') + `
      <article class="tcard tcard--team reveal">
        <div>
          <h3>И ещё целая команда</h3>
          <p style="margin-top:10px">Художественную студию, английский язык, современные танцы, плетение из ивы и мастерскую ДПИ ведут педагоги-практики. Познакомьтесь с ними на экскурсии.</p>
        </div>
        <svg class="castle-big" aria-hidden="true"><use href="#castle"/></svg>
        <button class="btn btn--yellow" type="button" data-book="tour">Прийти на экскурсию${icon('i-arrow')}</button>
      </article>`;
  }

  /* ---------- Отзывы ---------- */
  const revState = { src: 'all', shown: 6 };
  const AVA = [['var(--yellow)', 'var(--ink)'], ['var(--green-700)', '#fff'], ['var(--blue-700)', '#fff'], ['var(--red-600)', '#fff'], ['var(--peach)', 'var(--ink)']];

  function renderReviewFilters() {
    const n = (s) => D.reviews.filter((r) => s === 'all' || r.src === s).length;
    const f = [['all', 'Все'], ['yandex', 'Яндекс Карты'], ['telegram', 'Telegram']];
    $('[data-render="review-filters"]').innerHTML = f.map(([id, l]) =>
      `<button class="chip${revState.src === id ? ' is-active' : ''}" type="button" data-rsrc="${id}">${l}<span class="chip__n">${n(id)}</span></button>`).join('');
  }

  function renderReviews() {
    const list = D.reviews.filter((r) => revState.src === 'all' || r.src === revState.src);
    const box = $('[data-render="reviews"]');
    box.innerHTML = list.slice(0, revState.shown).map((r, i) => {
      const [bg, fg] = AVA[(D.reviews.indexOf(r)) % AVA.length];
      const long = r.text.length > 300;
      return `
      <article class="rcard" style="animation-delay:${Math.min(i, 6) * 50}ms">
        <div class="rcard__head">
          <span class="rcard__ava" style="--ac:${bg};color:${fg}">${esc(initials(r.author))}</span>
          <div class="rcard__who"><b>${esc(r.author)}</b><small>${fmtDate(r.date)}</small></div>
          <span class="src src--${r.src}">${r.src === 'yandex' ? 'Яндекс Карты' : 'Telegram'}</span>
        </div>
        ${r.src === 'yandex' ? `<div class="stars" aria-label="Оценка 5 из 5">${icon('i-star', '').repeat(5)}</div>` : ''}
        <p class="rcard__text${long ? ' is-clamped' : ''}">${esc(r.text)}</p>
        ${long ? `<button class="rcard__more" type="button" data-rmore>Читать полностью</button>` : ''}
        ${r.image ? `<img class="rcard__img" src="${r.image}" alt="Отзыв ${esc(r.author)} в Telegram" loading="lazy" width="682" height="169"><p class="rcard__ctx">${esc(r.context || '')}</p>` : ''}
        ${r.reply ? `<details class="reply"><summary>Ответ школы ${icon('i-chev-d')}</summary><p>${esc(r.reply.text)}<small>${fmtDate(r.reply.date)}</small></p></details>` : ''}
      </article>`;
    }).join('');
    $$('.rcard .stars svg', box).forEach((s) => s.setAttribute('fill', 'currentColor'));
    const more = $('#reviews-more');
    more.hidden = list.length <= revState.shown;
  }

  function initReviews() {
    renderReviewFilters();
    renderReviews();
    $('[data-render="review-filters"]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-rsrc]');
      if (!b) return;
      revState.src = b.dataset.rsrc; revState.shown = 6;
      renderReviewFilters(); renderReviews();
    });
    $('#reviews-more').addEventListener('click', () => { revState.shown += 6; renderReviews(); });
    $('[data-render="reviews"]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-rmore]');
      if (!b) return;
      const p = b.previousElementSibling;
      const open = p.classList.toggle('is-clamped');
      b.textContent = open ? 'Читать полностью' : 'Свернуть';
    });
  }

  /* ---------- Афиша ---------- */
  const evState = { day: 'all' };
  const DAYS_AHEAD = 14;

  function upcoming(days = DAYS_AHEAD) {
    const t = today(), out = [];
    for (let i = 0; i < days; i++) {
      const d = addDays(t, i);
      D.eventsRecurring.forEach((ev) => {
        if (!ev.dows.includes(d.getDay())) return;
        if (ev.from && d < parseDate(ev.from)) return;
        const dir = dirById(ev.dir);
        if (dir && dir.status !== 'open') return;
        out.push({ ev, date: d });
      });
    }
    return out.sort((a, b) => a.date - b.date || String(a.ev.time || '99').localeCompare(String(b.ev.time || '99')));
  }

  function renderDatestrip(occ) {
    const t = today();
    const counts = {};
    occ.forEach((o) => { const k = iso(o.date); counts[k] = (counts[k] || 0) + 1; });
    let html = `<button class="day day--all${evState.day === 'all' ? ' is-active' : ''}" type="button" data-day="all"><b>Все дни</b><span>${occ.length} ${plural(occ.length, ['занятие', 'занятия', 'занятий'])}</span></button>`;
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const d = addDays(t, i), k = iso(d);
      const cls = ['day'];
      if (!counts[k]) cls.push('is-empty');
      if (d.getDay() === 0 || d.getDay() === 6) cls.push('is-weekend');
      if (evState.day === k) cls.push('is-active');
      html += `<button class="${cls.join(' ')}" type="button" data-day="${k}" aria-label="${DOW_LONG[d.getDay()]}, ${fmtDate(d, false)}${counts[k] ? ', занятий: ' + counts[k] : ''}"><small>${i === 0 ? 'Сег' : DOW[d.getDay()]}</small><b>${d.getDate()}</b><span>${MONTHS_SHORT[d.getMonth()]}</span>${counts[k] ? '<i></i>' : ''}</button>`;
    }
    $('[data-render="datestrip"]').innerHTML = html;
  }

  function eventCard(o, i) {
    const { ev, date } = o;
    const badges = ev.badges.map((b) => `<span class="ebadge${b === 'Новинка' ? ' ebadge--hot' : ''}${b.startsWith('Первое') ? ' ebadge--free' : ''}">${esc(b)}</span>`).join('');
    return `
      <article class="ecard ecard--${ev.color}" style="animation-delay:${Math.min(i, 8) * 40}ms">
        <div class="ecard__date"><small>${DOW[date.getDay()]}</small><b>${date.getDate()}</b><span>${MONTHS_SHORT[date.getMonth()]}</span></div>
        <div class="ecard__body">
          <span class="ecard__time">${icon('i-clock')}${ev.time ? esc(ev.time) : 'время по возрасту'} · ${relDay(date)}</span>
          <h3>${esc(ev.title)}</h3>
          <p>${esc(ev.text)}</p>
          ${badges ? `<div class="ecard__badges">${badges}</div>` : ''}
          <div class="ecard__foot">
            <span class="ecard__meta">${esc(ev.age)} · <b>${esc(ev.price)}</b></span>
            <button class="btn btn--primary btn--sm" type="button" data-book="event" data-dir="${ev.id}" data-date="${iso(date)}" data-time="${ev.time || ''}">Записаться</button>
          </div>
        </div>
      </article>`;
  }

  function renderEvents() {
    const occ = upcoming();
    renderDatestrip(occ);
    const list = evState.day === 'all' ? occ.slice(0, isMobile() ? 4 : 8) : occ.filter((o) => iso(o.date) === evState.day);
    const box = $('[data-render="events"]');
    if (!list.length) {
      const d = parseDate(evState.day);
      box.innerHTML = `<div class="events-empty">${esc(DOW_LONG[d.getDay()][0].toUpperCase() + DOW_LONG[d.getDay()].slice(1))}, ${fmtDate(d, false)} — открытых занятий нет. Выберите другой день или <button class="link-btn" type="button" data-book="consult">запишитесь на консультацию</button>.</div>`;
      return;
    }
    box.innerHTML = list.map(eventCard).join('') +
      (evState.day === 'all' && occ.length > list.length ? `<div class="events-empty" style="grid-column:1/-1;padding:16px">Ещё ${occ.length - list.length} ${plural(occ.length - list.length, ['занятие', 'занятия', 'занятий'])} в ближайшие две недели — выберите день в календаре выше.</div>` : '');
  }

  function renderPastEvents() {
    $('[data-render="past-events"]').innerHTML = D.eventsPast.map((p, i) => `
      <article class="pcard-ev" data-news-open="${p.news}" style="animation-delay:${Math.min(i, 8) * 40}ms">
        <div class="pcard-ev__img"><img src="${thumb(p.photo)}" alt="" loading="lazy" ${dims(p.photo, 400)}><span class="status status--closed"><i></i>Состоялось</span></div>
        <div class="pcard-ev__body"><small>${esc(p.label || fmtDate(p.date))}</small><b>${esc(p.title)}</b><button type="button" data-news-open="${p.news}">Фото и подробности${icon('i-arrow')}</button></div>
      </article>`).join('');
  }

  function initEvents() {
    renderEvents();
    renderPastEvents();
    $('[data-render="datestrip"]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-day]');
      if (!b) return;
      evState.day = b.dataset.day;
      renderEvents();
    });
    $$('[data-events-tab]').forEach((b) => b.addEventListener('click', () => {
      $$('[data-events-tab]').forEach((x) => { const on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on); });
      $$('.events__panel').forEach((p) => { p.hidden = p.dataset.panel !== b.dataset.eventsTab; });
    }));
  }

  /* ---------- Отправка заявок ---------- */
  async function submitLead(kind, data) {
    const payload = Object.assign({ kind, page: location.href, createdAt: new Date().toISOString() }, data);
    if (C.formEndpoint) {
      const r = await fetch(C.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return;
    }
    await new Promise((res) => setTimeout(res, 650));
    try {
      const list = JSON.parse(localStorage.getItem('lessonia_leads') || '[]');
      list.push(payload);
      localStorage.setItem('lessonia_leads', JSON.stringify(list.slice(-50)));
    } catch (e) { /* хранилище недоступно — не страшно */ }
    console.info('[Лессония] Демо-режим: заявка сохранена в браузере. Укажите config.formEndpoint в data.js, чтобы получать заявки.', payload);
  }

  /* ---------- Маска телефона ---------- */
  function maskPhone(input) {
    const fmt = () => {
      let d = input.value.replace(/\D/g, '');
      if (!d) { input.value = ''; return; }
      if (d[0] === '8') d = '7' + d.slice(1);
      if (d[0] !== '7') d = '7' + d;
      const p = d.slice(1, 11);
      let out = '+7';
      if (p.length) out += ' (' + p.slice(0, 3);
      if (p.length >= 3) out += ')';
      if (p.length > 3) out += ' ' + p.slice(3, 6);
      if (p.length > 6) out += '-' + p.slice(6, 8);
      if (p.length > 8) out += '-' + p.slice(8, 10);
      input.value = out;
    };
    input.addEventListener('input', (e) => { if (e.inputType && e.inputType.startsWith('delete')) return; fmt(); });
    input.addEventListener('blur', () => { if (input.value.replace(/\D/g, '').length <= 1) input.value = ''; else fmt(); });
    input.addEventListener('focus', () => { if (!input.value) input.value = '+7 ('; });
  }
  const phoneOk = (v) => v.replace(/\D/g, '').length === 11;

  function setError(field, msg) {
    const f = field.closest('.field') || field.closest('.check');
    if (!f) return;
    f.classList.toggle('is-invalid', !!msg);
    let e = $('.field__err', f);
    if (msg) {
      if (!e && f.classList.contains('field')) { e = document.createElement('span'); e.className = 'field__err'; f.appendChild(e); }
      if (e) e.textContent = msg;
    } else if (e) e.remove();
  }

  function validateForm(form) {
    let ok = true;
    $$('[required]', form).forEach((el) => {
      let msg = '';
      if (el.type === 'checkbox') { if (!el.checked) msg = 'Нужно согласие'; }
      else if (el.dataset.phone !== undefined) { if (!phoneOk(el.value)) msg = 'Введите номер полностью'; }
      else if (!el.value.trim()) msg = 'Заполните поле';
      setError(el, msg);
      if (msg) ok = false;
    });
    const first = $('.is-invalid input, .is-invalid select, .is-invalid textarea', form);
    if (first) first.focus();
    return ok;
  }

  /* ---------- Формы: обратный звонок и заявка ---------- */
  const AGE_OPTS = ['Не указан', ...Array.from({ length: 14 }, (_, i) => `${i + 3} ${plural(i + 3, ['год', 'года', 'лет'])}`), 'Занятия для взрослого'];
  function interestOptions() {
    const base = ['Экскурсия по школе', 'Консультация по семейному обучению'];
    const dirs = D.directions.filter((d) => d.status === 'open').map((d) => d.title + (d.cat === 'school' ? ` (${d.age})` : ''));
    return [...base, ...dirs, 'Летний лагерь 2027', 'Другое'];
  }

  function initForms() {
    $$('[data-phone]').forEach(maskPhone);
    const ageSel = $('[data-render="age-options"]');
    ageSel.innerHTML = AGE_OPTS.map((a) => `<option>${a}</option>`).join('');
    const intSel = $('[data-render="interest-options"]');
    intSel.innerHTML = interestOptions().map((o) => `<option>${esc(o)}</option>`).join('');

    $$('form[data-form]').forEach((form) => {
      const original = form.innerHTML;
      form.addEventListener('input', (e) => { if (e.target.closest('.is-invalid')) setError(e.target, ''); });
      form.addEventListener('change', (e) => { if (e.target.type === 'checkbox') setError(e.target, ''); });
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm(form)) return;
        const btn = $('[type="submit"]', form);
        const data = Object.fromEntries(new FormData(form).entries());
        delete data.consent;
        btn.disabled = true; btn.textContent = 'Отправляем…';
        try {
          await submitLead(form.dataset.form, data);
          const isCb = form.dataset.form === 'callback';
          form.innerHTML = `
            <div class="form-done">
              <div class="bk__done-ic">${icon('i-check')}</div>
              <h3>${isCb ? 'Перезвоним!' : 'Заявка отправлена'}</h3>
              <p class="muted">${isCb ? `Администратор свяжется с вами (${esc(data.when.toLowerCase())}) по номеру ${esc(data.phone)}.` : `Спасибо, ${esc(data.name)}! Мы свяжемся с вами по номеру ${esc(data.phone)} в ближайшее время.`}</p>
              <button class="btn btn--dark" type="button" data-close>Готово</button>
            </div>`;
        } catch (err) {
          btn.disabled = false; btn.textContent = 'Попробовать ещё раз';
          toast(`Не удалось отправить. Позвоните нам: ${C.phone}`, 'i-info');
        }
      });
      const modal = form.closest('.modal');
      if (modal) modal.addEventListener('modal:close', () => {
        if (!$('.form-done', form)) return;
        form.innerHTML = original;
        $$('[data-phone]', form).forEach(maskPhone);
        const a = $('[data-render="age-options"]', form); if (a) a.innerHTML = AGE_OPTS.map((x) => `<option>${x}</option>`).join('');
        const s = $('[data-render="interest-options"]', form); if (s) s.innerHTML = interestOptions().map((o) => `<option>${esc(o)}</option>`).join('');
      });
    });
  }

  function openLead(interest) {
    Modal.open('modal-lead', { replace: true });
    const sel = $('#modal-lead [name="interest"]');
    if (sel && interest) {
      if (![...sel.options].some((o) => o.value === interest)) sel.insertAdjacentHTML('afterbegin', `<option>${esc(interest)}</option>`);
      sel.value = interest;
    }
  }

  /* ---------- Онлайн-запись ---------- */
  const BK_TYPES = [
    { id: 'tour', icon: 'i-cap', title: 'Экскурсия по школе', sub: 'для поступления в класс' },
    { id: 'trial', icon: 'i-sparkle', title: 'Пробное занятие', sub: 'в кружке или студии' },
    { id: 'event', icon: 'i-calendar', title: 'Мастер-класс', sub: 'открытое занятие из афиши' },
    { id: 'consult', icon: 'i-chat', title: 'Консультация', sub: 'о семейном обучении' }
  ];
  const CONSULT_TOPICS = [
    { id: 'family', title: 'Семейное обучение: как оформить' },
    { id: 'admission', title: 'Поступление в класс' },
    { id: 'clubs', title: 'Кружки и студии' },
    { id: 'camp', title: 'Летний лагерь 2027' }
  ];
  const PREF_TIMES = [{ t: 'Утро', n: '9–12' }, { t: 'День', n: '12–16' }, { t: 'Вечер', n: '16–19' }];

  function bkOptions(type) {
    if (type === 'tour') return D.directions.filter((d) => d.cat === 'school').map((d) => ({ id: d.id, title: `${d.title} (${d.age})${d.status === 'closed' ? ' — набор с ' + fmtDots(d.nextIntake) : ''}` })).concat([{ id: 'undecided', title: 'Пока не решили — подскажите' }]);
    if (type === 'trial') return D.directions.filter((d) => d.cat !== 'school' && d.status === 'open').map((d) => ({ id: d.id, title: d.title }));
    if (type === 'event') return D.eventsRecurring.filter((e) => { const d = dirById(e.dir); return !d || d.status === 'open'; }).map((e) => ({ id: e.id, title: e.title }));
    return CONSULT_TOPICS;
  }

  function bkSlots(type, sel, date) {
    const dow = date.getDay();
    if (type === 'event') {
      const ev = D.eventsRecurring.find((e) => e.id === sel);
      if (!ev || !ev.dows.includes(dow) || (ev.from && date < parseDate(ev.from))) return null;
      return ev.time ? [{ t: ev.time }] : PREF_TIMES;
    }
    if (type === 'trial') {
      const d = dirById(sel);
      if (d && d.slots && d.slots.length) {
        const s = d.slots.filter((x) => x.dow === dow);
        if (!s.length) return null;
        return s.some((x) => !x.time) ? PREF_TIMES : s.map((x) => ({ t: x.time, n: x.note }));
      }
      return dow === 0 ? null : PREF_TIMES;
    }
    if (type === 'tour') {
      if (dow === 0 || dow === 6) return null;
      return ['10:00', '11:00', '12:00', '15:00', '16:00', '17:00'].map((t) => ({ t }));
    }
    if (dow === 0) return null;
    return (dow === 6 ? ['11:00', '12:00', '13:00'] : ['10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00']).map((t) => ({ t }));
  }

  class Booking {
    constructor(root, { inModal = false } = {}) {
      this.root = root;
      this.inModal = inModal;
      this.reset();
      root.addEventListener('click', (e) => this.onClick(e));
      root.addEventListener('change', (e) => this.onChange(e));
      root.addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });
      root.addEventListener('input', (e) => { if (e.target.closest('.is-invalid')) setError(e.target, ''); });
    }
    reset(preset = {}) {
      let type = preset.type || null, sel = preset.dir || null;
      const date = preset.date || null, time = preset.time || null;
      if (type && sel && !bkOptions(type).some((o) => o.id === sel)) {
        // направление пришло из другого раздела — подбираем подходящий тип записи
        const d = dirById(sel);
        if (d) type = d.cat === 'school' ? 'tour' : 'trial';
        if (!bkOptions(type).some((o) => o.id === sel)) sel = null;
      }
      this.s = { step: 1, type, sel, date, time, done: false, contact: {} };
      if (type && sel) this.s.step = date && time ? 3 : 2;
      this.render();
    }
    canNext() {
      const s = this.s;
      if (s.step === 1) return !!(s.type && s.sel);
      if (s.step === 2) return !!(s.date && s.time);
      return true;
    }
    title() {
      const opt = bkOptions(this.s.type).find((o) => o.id === this.s.sel);
      return opt ? opt.title : '';
    }
    whenText() {
      if (!this.s.date) return '';
      const d = parseDate(this.s.date);
      const pt = PREF_TIMES.find((p) => p.t === this.s.time);
      return `${DOW_LONG[d.getDay()]}, ${fmtDate(d, false)}, ${pt ? pt.t.toLowerCase() + ' (' + pt.n + ')' : this.s.time}`;
    }
    render() {
      const s = this.s;
      if (s.done) { this.root.innerHTML = this.doneHtml(); return; }
      const stepsHtml = ['Что', 'Когда', 'Контакты'].map((l, i) => `<span class="bk__step${s.step > i + 1 ? ' is-done' : ''}${s.step === i + 1 ? ' is-current' : ''}">${i + 1}. ${l}</span>`).join('');
      let pane = '';
      if (s.step === 1) pane = this.step1();
      if (s.step === 2) pane = this.step2();
      if (s.step === 3) pane = this.step3();
      this.root.innerHTML = `
        <form class="bk" novalidate>
          <div class="bk__steps" aria-hidden="true">${stepsHtml}</div>
          <div class="bk__pane">${pane}</div>
          <div class="bk__nav">
            ${s.step > 1 ? `<button class="btn btn--ghost" type="button" data-bk="back">${icon('i-chev-l')}Назад</button>` : '<span></span>'}
            ${s.step < 3
              ? `<button class="btn btn--primary" type="button" data-bk="next" ${this.canNext() ? '' : 'disabled'}>Далее${icon('i-arrow')}</button>`
              : `<button class="btn btn--primary" type="submit">Записаться${icon('i-check')}</button>`}
          </div>
        </form>`;
      if (s.step === 3) $$('[data-phone]', this.root).forEach(maskPhone);
    }
    step1() {
      const s = this.s;
      const types = BK_TYPES.map((t) => `
        <label class="bk__type">
          <input type="radio" name="bktype" value="${t.id}" ${s.type === t.id ? 'checked' : ''}>
          <span class="bk__ic">${icon(t.icon)}</span>
          <span><b>${t.title}</b><small>${t.sub}</small></span>
        </label>`).join('');
      const opts = s.type ? bkOptions(s.type) : [];
      const label = { tour: 'Класс', trial: 'Кружок или студия', event: 'Мастер-класс', consult: 'Тема консультации' }[s.type] || '';
      return `
        <h3>Что вас интересует?</h3>
        <div class="bk__types">${types}</div>
        ${s.type ? `<div class="field bk__field"><label for="bk-sel-${this.uid()}">${label}</label>
          <select id="bk-sel-${this.uid()}" name="bksel"><option value="">Выберите…</option>${opts.map((o) => `<option value="${o.id}" ${s.sel === o.id ? 'selected' : ''}>${esc(o.title)}</option>`).join('')}</select></div>`
          : `<p class="bk__hint">${icon('i-info')}Выберите формат — на следующем шаге покажем свободные дни и время. Первое занятие во многих студиях бесплатное.</p>`}`;
    }
    uid() { if (!this._uid) this._uid = Math.random().toString(36).slice(2, 7); return this._uid; }
    step2() {
      const s = this.s, t = today();
      const start = addDays(t, 1), end = addDays(t, 21);
      const gridStart = addDays(start, -((start.getDay() + 6) % 7));
      let cells = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => `<span class="cal__dow">${d}</span>`).join('');
      for (let d = new Date(gridStart); d <= end; d = addDays(d, 1)) {
        const k = iso(d);
        if (d < start) { cells += `<span class="cal__pad"></span>`; continue; }
        const slots = bkSlots(s.type, s.sel, d);
        const cls = ['cal__day'];
        if (s.date === k) cls.push('is-active');
        cells += `<button class="${cls.join(' ')}" type="button" data-date="${k}" ${slots ? '' : 'disabled'} aria-label="${DOW_LONG[d.getDay()]}, ${fmtDate(d, false)}">${d.getDate()}${d.getDate() === 1 || +d === +start ? `<small>${MONTHS_SHORT[d.getMonth()]}</small>` : ''}</button>`;
      }
      let slotsHtml = '';
      if (s.date) {
        const slots = bkSlots(s.type, s.sel, parseDate(s.date)) || [];
        slotsHtml = `<div class="slots" role="group" aria-label="Время">${slots.map((x) => `<button class="slot${s.time === x.t ? ' is-active' : ''}" type="button" data-time="${x.t}">${x.t}${x.n ? `<small>${esc(x.n)}</small>` : ''}</button>`).join('')}</div>`;
      }
      const pref = s.date && (bkSlots(s.type, s.sel, parseDate(s.date)) || []).some((x) => PREF_TIMES.some((p) => p.t === x.t));
      return `
        <h3>Когда вам удобно?</h3>
        <p class="muted" style="margin:-8px 0 12px;font-size:.9rem">${esc(this.title())}</p>
        <div class="cal">${cells}</div>
        ${slotsHtml || `<p class="bk__hint">${icon('i-calendar')}Выберите день — покажем свободное время.</p>`}
        ${s.date ? `<p class="bk__hint">${icon('i-info')}${pref ? 'Точное время согласуем — администратор позвонит и подтвердит запись.' : 'Администратор подтвердит запись звонком или в мессенджере.'}</p>` : ''}`;
    }
    step3() {
      const s = this.s, c = s.contact, u = this.uid();
      return `
        <h3>Как с вами связаться?</h3>
        <div class="bk__summary">
          <div>${icon('i-cal-check')}<span><b>${esc(this.title())}</b></span></div>
          <div>${icon('i-clock')}<span>${esc(this.whenText())}</span></div>
        </div>
        <div class="form" style="margin-top:14px">
          <div class="field-row">
            <div class="field"><label for="bk-name-${u}">Ваше имя</label><input id="bk-name-${u}" name="name" type="text" autocomplete="name" placeholder="Имя" required value="${esc(c.name || '')}"></div>
            <div class="field"><label for="bk-phone-${u}">Телефон</label><input id="bk-phone-${u}" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__" required data-phone value="${esc(c.phone || '')}"></div>
          </div>
          <div class="field-row">
            <div class="field"><label for="bk-child-${u}">Имя ребёнка <span class="muted">— необязательно</span></label><input id="bk-child-${u}" name="child" type="text" placeholder="Имя ребёнка" value="${esc(c.child || '')}"></div>
            <div class="field"><label for="bk-age-${u}">Возраст</label><select id="bk-age-${u}" name="age">${AGE_OPTS.map((a) => `<option ${c.age === a ? 'selected' : ''}>${a}</option>`).join('')}</select></div>
          </div>
          <fieldset class="field">
            <legend>Как удобнее связаться?</legend>
            <div class="pills">${['Звонок', 'Telegram', 'WhatsApp', 'MAX'].map((m, i) => `<label class="pill"><input type="radio" name="channel" value="${m}" ${(c.channel || 'Звонок') === m ? 'checked' : ''}><span>${m}</span></label>`).join('')}</div>
          </fieldset>
          <label class="check"><input type="checkbox" name="consent" required><span>Согласен(на) на обработку персональных данных согласно <button class="link-btn" type="button" data-open="privacy">политике</button></span></label>
        </div>`;
    }
    doneHtml() {
      const s = this.s;
      return `
        <div class="bk bk__done">
          <div class="bk__done-ic">${icon('i-check')}</div>
          <h3>Вы записаны!</h3>
          <p>Спасибо, ${esc(s.contact.name)}! Администратор свяжется с вами${s.contact.channel && s.contact.channel !== 'Звонок' ? ' в ' + esc(s.contact.channel) : ''} по номеру ${esc(s.contact.phone)}, чтобы подтвердить запись.</p>
          <div class="bk__summary">
            <div>${icon('i-cal-check')}<span><b>${esc(this.title())}</b></span></div>
            <div>${icon('i-clock')}<span>${esc(this.whenText())}</span></div>
            <div>${icon('i-pin')}<span>${esc(C.address)}. ${esc(C.howToFind)}</span></div>
          </div>
          <div class="bk__done-btns">
            <button class="btn btn--dark" type="button" data-bk="ics">${icon('i-download')}Добавить в календарь</button>
            ${this.inModal ? `<button class="btn btn--ghost" type="button" data-close>Готово</button>` : `<button class="btn btn--ghost" type="button" data-bk="again">Новая запись</button>`}
          </div>
        </div>`;
    }
    onClick(e) {
      const b = e.target.closest('[data-bk], [data-date], [data-time]');
      if (!b || !this.root.contains(b)) return;
      if (b.dataset.bk === 'next' && this.canNext()) { this.s.step++; this.render(); this.focusPane(); }
      else if (b.dataset.bk === 'back') { this.saveContact(); this.s.step--; this.render(); this.focusPane(); }
      else if (b.dataset.bk === 'ics') this.downloadIcs();
      else if (b.dataset.bk === 'again') this.reset();
      else if (b.classList.contains('cal__day')) { this.s.date = b.dataset.date; this.s.time = null; this.render(); }
      else if (b.classList.contains('slot')) { this.s.time = b.dataset.time; this.render(); const n = $('[data-bk="next"]', this.root); if (n) n.focus(); }
    }
    onChange(e) {
      const t = e.target;
      if (t.name === 'bktype') { this.s.type = t.value; this.s.sel = null; this.s.date = null; this.s.time = null; this.render(); const sel = $('select[name="bksel"]', this.root); if (sel) sel.focus(); }
      else if (t.name === 'bksel') { this.s.sel = t.value || null; this.s.date = null; this.s.time = null; const n = $('[data-bk="next"]', this.root); if (n) n.disabled = !this.canNext(); }
      else if (t.type === 'checkbox') setError(t, '');
    }
    focusPane() { const h = $('.bk__pane h3', this.root); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } if (!this.inModal) this.root.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    saveContact() {
      const f = $('form', this.root);
      if (!f || this.s.step !== 3) return;
      const fd = new FormData(f);
      this.s.contact = { name: fd.get('name'), phone: fd.get('phone'), child: fd.get('child'), age: fd.get('age'), channel: fd.get('channel') };
    }
    async submit() {
      const f = $('form', this.root);
      if (this.s.step !== 3) { if (this.canNext()) { this.s.step++; this.render(); } return; }
      if (!validateForm(f)) return;
      this.saveContact();
      const btn = $('[type="submit"]', f);
      btn.disabled = true; btn.textContent = 'Записываем…';
      try {
        await submitLead('booking', Object.assign({ type: this.s.type, item: this.title(), date: this.s.date, time: this.s.time }, this.s.contact));
        this.s.done = true;
        this.render();
        const h = $('h3', this.root); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      } catch (err) {
        btn.disabled = false; btn.textContent = 'Попробовать ещё раз';
        toast(`Не удалось отправить. Позвоните нам: ${C.phone}`, 'i-info');
      }
    }
    downloadIcs() {
      const s = this.s, d = parseDate(s.date);
      const ymd = iso(d).replace(/-/g, '');
      const exact = /^\d{1,2}:\d{2}$/.test(s.time || '');
      let dt = `DTSTART;VALUE=DATE:${ymd}\r\nDTEND;VALUE=DATE:${iso(addDays(d, 1)).replace(/-/g, '')}`;
      if (exact) { const [h, m] = s.time.split(':'); dt = `DTSTART:${ymd}T${h.padStart(2, '0')}${m}00\r\nDURATION:PT1H`; }
      const clean = (x) => String(x).replace(/[,;\\]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
      const ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lessonia//Booking//RU', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
        `UID:${Date.now()}@lessonia`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`, dt,
        `SUMMARY:${clean('Лессония: ' + this.title())}`,
        `LOCATION:${clean(C.address + ', ' + C.addressFull)}`,
        `DESCRIPTION:${clean(C.howToFind + '. Телефон: ' + C.phone)}`,
        'END:VEVENT', 'END:VCALENDAR'
      ].join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
      a.download = 'lessonia-zapis.ics';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }
  }

  let bookingModal, bookingInline;
  function initBooking() {
    bookingInline = new Booking($('[data-booking-inline]'));
    bookingModal = new Booking($('[data-booking-modal]'), { inModal: true });
  }
  function openBooking(preset) {
    bookingModal.reset(preset);
    Modal.open('modal-booking', { replace: true });
  }

  /* ---------- Новости ---------- */
  const newsState = { cat: 'all', shown: isMobile() ? 4 : 8 };
  const photoNews = {};
  NEWS.forEach((n) => (n.photos || []).forEach((p, i) => { if (!photoNews[p]) photoNews[p] = { n, i }; }));

  const excerpt = (n, len = 170) => {
    const txt = (n.text || []).join(' ').replace(/•\s*/g, '').replace(/\s+/g, ' ').trim();
    return txt.length > len ? txt.slice(0, len).replace(/\s+\S*$/, '') + '…' : txt;
  };

  function renderNewsFilters() {
    const cnt = (c) => NEWS.filter((n) => c === 'all' || n.cat === c).length;
    $('[data-render="news-filters"]').innerHTML = D.newsCategories.map((c) =>
      `<button class="chip${newsState.cat === c.id ? ' is-active' : ''}" type="button" data-ncat="${c.id}">${esc(c.label)}<span class="chip__n">${cnt(c.id)}</span></button>`).join('');
  }

  function newsCard(n, i, feat) {
    const has = n.photos && n.photos.length;
    const media = has
      ? `<div class="ncard__media"><img src="${thumb(n.photos[0])}" alt="" loading="lazy" ${dims(n.photos[0])}>${n.photos.length > 1 || n.video ? `<span class="ncard__count">${icon(n.video ? 'i-play' : 'i-camera')}${n.photos.length}${n.video ? ' + видео' : ''}</span>` : ''}</div>`
      : `<div class="ncard__ph">${icon(n.video ? 'i-play' : (NEWS_ICONS[n.cat] || 'i-sparkle'), 'big')}</div>`;
    return `
      <article class="ncard cat-${n.cat}${feat ? ' ncard--feat' : ''}" data-news-open="${n.id}" style="animation-delay:${Math.min(i, 8) * 40}ms">
        ${media}
        <div class="ncard__body">
          <div class="ncard__meta"><span class="ntag">${esc(n.tag)}</span><time datetime="${n.date}">${fmtDate(n.date)}</time></div>
          <h3>${esc(n.title)}</h3>
          <p>${esc(excerpt(n, feat ? 320 : 170))}</p>
          <button class="ncard__read" type="button" data-news-open="${n.id}" aria-label="Читать новость: ${esc(n.title)}">Читать${icon('i-arrow')}</button>
        </div>
      </article>`;
  }

  function newsList() { return NEWS.filter((n) => newsState.cat === 'all' || n.cat === newsState.cat); }

  function renderNews() {
    const list = newsList();
    const feat = newsState.cat === 'all';
    const box = $('[data-render="news"]');
    box.innerHTML = list.slice(0, newsState.shown).map((n, i) => newsCard(n, i, feat && i === 0)).join('');
    $('#news-more').hidden = list.length <= newsState.shown;
  }

  function initNews() {
    renderNewsFilters();
    renderNews();
    $('[data-render="news-filters"]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-ncat]');
      if (!b) return;
      newsState.cat = b.dataset.ncat;
      newsState.shown = isMobile() ? 4 : (newsState.cat === 'all' ? 8 : 9);
      renderNewsFilters(); renderNews();
    });
    $('#news-more').addEventListener('click', () => { newsState.shown += isMobile() ? 4 : 9; renderNews(); });
  }

  function proseHtml(paras) {
    let html = '';
    (paras || []).forEach((p) => {
      let buf = [], list = [];
      const flushP = () => { if (buf.length) { html += `<p>${buf.map(linkify).join('<br>')}</p>`; buf = []; } };
      const flushL = () => { if (list.length) { html += `<ul>${list.map((l) => `<li>${linkify(l)}</li>`).join('')}</ul>`; list = []; } };
      p.split('\n').forEach((l) => {
        if (l.startsWith('• ')) { flushP(); list.push(l.slice(2)); } else { flushL(); buf.push(l); }
      });
      flushP(); flushL();
    });
    return html.replace(/<\/ul><ul>/g, '');
  }

  let newsCurrent = null;
  function openNews(id) {
    const n = NEWS.find((x) => x.id === id);
    if (!n) return;
    newsCurrent = n;
    const items = newsMedia(n);
    const list = NEWS;
    const idx = list.indexOf(n);
    const prev = list[idx - 1], next = list[idx + 1];
    $('[data-news-body]').innerHTML = `
      ${items.length ? `
      <div class="nmodal__gallery">
        <div class="nmodal__main" data-nm-main></div>
        <p class="nmodal__cap" data-nm-cap></p>
        ${items.length > 1 ? `<div class="nmodal__thumbs">${items.map((it, i) => `<button type="button" data-nm-i="${i}" aria-label="Фото ${i + 1}">${it.type === 'video' ? `<span style="display:grid;place-items:center;height:100%;background:#2a2420;color:#fff">${icon('i-play')}</span>` : `<img src="${it.thumb}" alt="" loading="lazy">`}</button>`).join('')}</div>` : ''}
      </div>` : ''}
      <div class="nmodal__body">
        <div class="ncard__meta cat-${n.cat}"><span class="ntag">${esc(n.tag)}</span><time datetime="${n.date}">${fmtDate(n.date)}</time></div>
        <h2>${esc(n.title)}</h2>
        <div class="prose">${proseHtml(n.text)}</div>
        <div class="nmodal__foot">
          ${n.link ? `<a class="link-arrow" href="${n.link}" target="_blank" rel="noopener">Пост в Telegram${icon('i-arrow-ur')}</a>` : '<span class="muted" style="font-size:.85rem">Из архива Telegram-чата школы</span>'}
          <div class="nmodal__pager">
            ${prev ? `<button class="btn btn--ghost btn--sm" type="button" data-news-open="${prev.id}">${icon('i-chev-l')}Новее</button>` : ''}
            ${next ? `<button class="btn btn--ghost btn--sm" type="button" data-news-open="${next.id}">Старее${icon('i-chev-r')}</button>` : ''}
          </div>
        </div>
      </div>`;
    if (items.length) showNewsMedia(0);
    if (Modal.top() && Modal.top().id === 'modal-news') { $('#modal-news .modal__dialog').scrollTop = 0; }
    else Modal.open('modal-news', { replace: true });
  }

  function newsMedia(n) {
    const caps = n.captions || [];
    const items = (n.photos || []).map((p, i) => ({ type: 'img', src: full(p), thumb: thumb(p), id: p, cap: cleanCap(caps[i]) }));
    if (n.video) items.unshift({ type: 'video', src: `assets/video/${n.video}`, poster: n.photos && n.photos[0] ? full(n.photos[0]) : '', cap: n.title });
    return items;
  }

  function showNewsMedia(i) {
    const items = newsMedia(newsCurrent);
    const it = items[i];
    const main = $('[data-nm-main]');
    if (!main || !it) return;
    main.dataset.index = i;
    main.innerHTML = (it.type === 'video'
      ? `<video src="${it.src}" ${it.poster ? `poster="${it.poster}"` : ''} controls playsinline preload="metadata"></video>`
      : `<img src="${it.src}" alt="${esc(it.cap || newsCurrent.title)}"><button class="ic-zoom" type="button" data-nm-zoom>${icon('i-image')}Во весь экран</button>`) +
      (items.length > 1 ? `<button class="nmodal__arrow nmodal__arrow--prev" type="button" data-nm-step="-1" aria-label="Предыдущее">${icon('i-chev-l')}</button><button class="nmodal__arrow nmodal__arrow--next" type="button" data-nm-step="1" aria-label="Следующее">${icon('i-chev-r')}</button>` : '');
    const cap = $('[data-nm-cap]');
    if (cap) cap.textContent = it.cap && it.type !== 'video' ? it.cap : (items.length > 1 ? `${i + 1} из ${items.length}` : '');
    $$('.nmodal__thumbs button').forEach((b, k) => b.classList.toggle('is-active', k === i));
    const tb = $(`.nmodal__thumbs button[data-nm-i="${i}"]`);
    if (tb) tb.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  /* ---------- Фотоальбом ---------- */
  const galState = { cat: 'all', shown: 16 };
  function galList() { return D.gallery.filter((g) => galState.cat === 'all' || g.cat === galState.cat); }
  function galCaption(g) {
    if (g.video) return { cap: g.title, sub: 'Видео' };
    const m = photoNews[g.id];
    if (!m) return { cap: '', sub: '' };
    const c = cleanCap(m.n.captions && m.n.captions[m.i]);
    return { cap: c || m.n.title, sub: fmtDate(m.n.date) };
  }
  function renderGalFilters() {
    const cnt = (c) => D.gallery.filter((g) => c === 'all' || g.cat === c).length;
    $('[data-render="gallery-filters"]').innerHTML = D.galleryCategories.map((c) =>
      `<button class="chip${galState.cat === c.id ? ' is-active' : ''}" type="button" data-gcat="${c.id}">${esc(c.label)}<span class="chip__n">${cnt(c.id)}</span></button>`).join('');
  }
  function renderGallery() {
    const list = galList();
    $('[data-render="gallery"]').innerHTML = list.slice(0, galState.shown).map((g, i) => {
      const { cap } = galCaption(g);
      if (g.video) return `
        <button class="gitem gitem--video" type="button" data-gi="${i}" style="animation-delay:${Math.min(i % 16, 10) * 35}ms" aria-label="Смотреть видео: ${esc(g.title)}">
          <img src="${thumb(g.poster)}" alt="" loading="lazy" ${dims(g.poster)}>
          <span class="gitem__vlabel">Видео</span>
          <span class="gitem__play"><span>${icon('i-play')}</span></span>
          <span class="gitem__cap">${esc(g.title)}</span>
        </button>`;
      return `
        <button class="gitem" type="button" data-gi="${i}" style="animation-delay:${Math.min(i % 16, 10) * 35}ms" aria-label="Открыть фото${cap ? ': ' + esc(cap) : ''}">
          <img src="${thumb(g.id)}" alt="${esc(cap)}" loading="lazy" ${dims(g.id)}>
          ${cap ? `<span class="gitem__cap">${esc(cap)}</span>` : ''}
        </button>`;
    }).join('');
    $('#gallery-more').hidden = list.length <= galState.shown;
  }
  function initGallery() {
    renderGalFilters();
    renderGallery();
    $('[data-render="gallery-filters"]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-gcat]');
      if (!b) return;
      galState.cat = b.dataset.gcat; galState.shown = 16;
      renderGalFilters(); renderGallery();
    });
    $('#gallery-more').addEventListener('click', () => { galState.shown += 16; renderGallery(); });
    $('[data-render="gallery"]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-gi]');
      if (!b) return;
      const items = galList().map((g) => {
        const { cap, sub } = galCaption(g);
        return g.video ? { type: 'video', src: `assets/video/${g.video}`, poster: full(g.poster), cap, sub } : { type: 'img', src: full(g.id), cap, sub };
      });
      Lightbox.open(items, +b.dataset.gi);
    });
  }

  /* ---------- Лайтбокс ---------- */
  const Lightbox = {
    el: null, items: [], i: 0, last: null,
    init() {
      this.el = $('#lightbox');
      this.el.addEventListener('click', (e) => {
        if (e.target.closest('[data-lb-close]') || e.target === this.el || e.target.classList.contains('lightbox__stage')) this.close();
        else if (e.target.closest('[data-lb-prev]')) this.go(-1);
        else if (e.target.closest('[data-lb-next]')) this.go(1);
      });
      let x0 = null;
      this.el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
      this.el.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) this.go(dx < 0 ? 1 : -1); x0 = null; });
    },
    open(items, i = 0) {
      this.items = items; this.i = i; this.last = document.activeElement;
      this.el.hidden = false;
      document.body.classList.add('is-locked');
      this.render();
      $('[data-lb-close]', this.el).focus();
    },
    close() {
      const v = $('video', this.el); if (v) v.pause();
      this.el.hidden = true;
      if (!Modal.stack.length && $('#mnav').hidden) document.body.classList.remove('is-locked');
      if (this.last && this.last.focus) this.last.focus({ preventScroll: true });
    },
    go(d) { if (this.items.length < 2) return; this.i = (this.i + d + this.items.length) % this.items.length; this.render(); },
    render() {
      const it = this.items[this.i];
      const media = $('.lightbox__media', this.el);
      media.innerHTML = it.type === 'video'
        ? `<video src="${it.src}" ${it.poster ? `poster="${it.poster}"` : ''} controls autoplay playsinline></video>`
        : `<img src="${it.src}" alt="${esc(it.cap || '')}">`;
      $('.lightbox__cap', this.el).innerHTML = it.cap ? `${esc(it.cap)}${it.sub ? `<small>${esc(it.sub)}</small>` : ''}` : '';
      $('.lightbox__count', this.el).textContent = this.items.length > 1 ? `${this.i + 1} / ${this.items.length}` : '';
      $$('.lightbox__nav', this.el).forEach((b) => { b.hidden = this.items.length < 2; });
      [1, -1].forEach((d) => { const n = this.items[(this.i + d + this.items.length) % this.items.length]; if (n && n.type === 'img') { const im = new Image(); im.src = n.src; } });
    }
  };

  /* ---------- Карта ---------- */
  function initMap() {
    const box = $('[data-map]');
    if (!box) return;
    const load = () => {
      if (box.dataset.loaded) return;
      box.dataset.loaded = '1';
      box.innerHTML = `<iframe src="${C.mapWidget}" title="Школа «Лессония» на Яндекс Картах" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    };
    $('.map__load', box).addEventListener('click', load);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { load(); io.disconnect(); } }, { rootMargin: '300px' });
      io.observe(box);
    }
  }

  /* ---------- Плавающая кнопка ---------- */
  function initFab() {
    const fab = $('#fab'), btn = $('.fab__btn', fab), menu = $('#fab-menu');
    const set = (open) => { fab.classList.toggle('is-open', open); menu.hidden = !open; btn.setAttribute('aria-expanded', open); };
    btn.addEventListener('click', () => set(menu.hidden));
    menu.addEventListener('click', (e) => { if (e.target.closest('a, button')) set(false); });
    document.addEventListener('click', (e) => { if (!fab.contains(e.target) && !menu.hidden) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); } });
  }

  /* ---------- Скроллеры ---------- */
  function initScrollers() {
    $$('[data-scroll]').forEach((b) => b.addEventListener('click', () => {
      const t = document.getElementById(b.dataset.scroll);
      const card = t.firstElementChild;
      const w = card ? card.getBoundingClientRect().width + 22 : 300;
      t.scrollBy({ left: w * (+b.dataset.dir) * 2, behavior: 'smooth' });
    }));
  }

  /* ---------- Глобальные клики ---------- */
  function initDelegation() {
    document.addEventListener('click', (e) => {
      const t = e.target;
      const book = t.closest('[data-book]');
      if (book) {
        e.preventDefault();
        openBooking({ type: book.dataset.book || null, dir: book.dataset.dir || null, date: book.dataset.date || null, time: book.dataset.time || null });
        return;
      }
      const op = t.closest('[data-open]');
      if (op) {
        e.preventDefault();
        const what = op.dataset.open;
        if (what === 'lead') openLead(op.dataset.interest);
        else if (what === 'privacy') Modal.open('modal-privacy');
        else Modal.open('modal-' + what, { replace: what !== 'privacy' });
        return;
      }
      const wl = t.closest('[data-waitlist]');
      if (wl) { const d = dirById(wl.dataset.waitlist); openLead(`${d.title} — лист ожидания (набор с ${fmtDots(d.nextIntake)})`); return; }
      const dop = t.closest('[data-dir-open]');
      if (dop) { openDirection(dop.dataset.dirOpen); return; }
      const nop = t.closest('[data-news-open]');
      if (nop) { openNews(nop.dataset.newsOpen); return; }
      if (t.closest('[data-close]')) { Modal.close(); return; }
      const nmi = t.closest('[data-nm-i]');
      if (nmi) { showNewsMedia(+nmi.dataset.nmI); return; }
      const nms = t.closest('[data-nm-step]');
      if (nms) {
        const items = newsMedia(newsCurrent);
        const cur = +($('[data-nm-main]').dataset.index || 0);
        showNewsMedia((cur + +nms.dataset.nmStep + items.length) % items.length);
        return;
      }
      if (t.closest('[data-nm-zoom]')) {
        const items = newsMedia(newsCurrent).map((it) => Object.assign({}, it, { cap: it.cap || newsCurrent.title, sub: fmtDate(newsCurrent.date) }));
        Lightbox.open(items, +($('[data-nm-main]').dataset.index || 0));
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!$('#lightbox').hidden) {
        if (e.key === 'Escape') Lightbox.close();
        else if (e.key === 'ArrowLeft') Lightbox.go(-1);
        else if (e.key === 'ArrowRight') Lightbox.go(1);
        else if (e.key === 'Tab') trapFocus(e, $('#lightbox'));
        return;
      }
      const top = Modal.top();
      if (!top) return;
      if (e.key === 'Escape') Modal.close();
      else if (e.key === 'Tab') trapFocus(e, $('.modal__dialog', top));
      else if (top.id === 'modal-news' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !/INPUT|TEXTAREA|SELECT|VIDEO/.test(document.activeElement.tagName)) {
        const items = newsMedia(newsCurrent);
        if (items.length > 1) { const cur = +($('[data-nm-main]').dataset.index || 0); showNewsMedia((cur + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length); }
      }
    });

    $('#modal-news').addEventListener('modal:close', () => { const v = $('#modal-news video'); if (v) v.pause(); });
    $('#modal-booking').addEventListener('modal:close', () => { if (bookingModal.s.done) bookingModal.reset(); });
  }

  /* ---------- Запуск ---------- */
  function init() {
    applyConfig();
    initHeader();
    initMarquee();
    renderHistory();
    initDirections();
    renderTeachers();
    initReviews();
    initEvents();
    initBooking();
    initNews();
    initGallery();
    initForms();
    initMap();
    initFab();
    initScrollers();
    Lightbox.init();
    initDelegation();
    initReveal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
