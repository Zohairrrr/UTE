/* Urban Tiffin & Events – Phase 4 working app (CS3014 AHCI).
   Plain HTML/CSS/JS, hash router, mock JSON data + localStorage. No build step.
   Screen IDs (S-01 … S-12) match the Phase 2 sitemap and the Figma hi-fi frames. */
(function () {
  'use strict';

  // ---------- helpers ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => 'Rs ' + Number(n).toLocaleString('en-US');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parseDay = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmtDay = (iso, year) => { const d = parseDay(iso); return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + (year ? ' ' + d.getFullYear() : ''); };
  const clock = (d) => { let h = d.getHours(); const m = String(d.getMinutes()).padStart(2, '0'); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + ':' + m + ' ' + ap; };
  const fmtWhen = (ms) => {
    const d = new Date(ms); const now = new Date();
    const same = d.toDateString() === now.toDateString();
    return (same ? 'Today' : DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]) + ', ' + clock(d);
  };
  const minutesSince = (ms) => Math.floor((Date.now() - ms) / 60000);
  const nextMonday = () => { const d = new Date(); d.setDate(d.getDate() + 1); while (d.getDay() !== 1) d.setDate(d.getDate() + 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  // ---------- persistent state (localStorage, wrapped so the app still works without it) ----------
  const KEY = 'ute-phase4-v1';
  const fresh = () => ({ firstRunDone: false, signedIn: false, sessionExpired: false, lang: 'en', plan: 'PREMIUM', attempts: 0, lockUntil: 0,
    settings: { whatsapp: true, sms: false, email: true, push: false }, demo: { serverError: false, newUser: false }, orders: null, user: null, nextId: 1043 });
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch (e) { S = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode: keep in memory */ } };

  // ---------- mock back end (JSON files + simulated network) ----------
  let CONFIG = null;
  const fetchJSON = async (url) => { const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); };
  async function seed() {
    if (S.orders) return;
    const j = await fetchJSON('/app/data/orders.json');
    j.orders.forEach((o) => o.history.forEach((h) => { h.at = h.minutesAgo != null ? Date.now() - h.minutesAgo * 60000 : Date.parse(h.at); delete h.minutesAgo; }));
    S.orders = j.orders; S.user = j.user; save();
  }
  const api = {
    async config() { if (!CONFIG) CONFIG = await fetchJSON('/app/data/plans.json'); return CONFIG; },
    async orders() {
      await sleep(600);
      if (!navigator.onLine) return { offline: true, orders: S.demo.newUser ? [] : S.orders };
      if (S.demo.serverError) throw new Error('server');
      return { offline: false, orders: S.demo.newUser ? [] : S.orders };
    },
    async order(id) { const res = await api.orders(); return Object.assign({}, res, { order: res.orders.find((o) => o.id === id) }); }
  };
  const lastUpdated = { at: null };

  // ---------- Urdu (partial: navigation, statuses and the Order Details screen) ----------
  const UR = {
    'Home': 'ہوم', 'Menu': 'مینو', 'Orders': 'آرڈرز', 'Account': 'اکاؤنٹ', 'Q&A': 'سوالات', 'Order Details': 'آرڈر کی تفصیل', 'Receipt': 'رسید',
    'Submitted': 'جمع کرایا گیا', 'Under Review': 'جانچ ہو رہی ہے', 'Confirmed': 'کنفرم', 'Needs Attention': 'توجہ درکار ہے', 'Cancelled': 'منسوخ',
    'Status history': 'اسٹیٹس', 'Amount quoted': 'طے شدہ رقم', 'Amount received': 'موصول رقم', 'Event date': 'تقریب کی تاریخ', 'Token number': 'ٹوکن نمبر',
    'Amount to pay': 'ادا کرنے کی رقم', 'Amount sent': 'بھیجی گئی رقم', 'Starts': 'شروع', 'View receipt': 'رسید دیکھیں', 'Upload a new screenshot': 'نیا اسکرین شاٹ بھیجیں',
    'Questions? Call or WhatsApp us': 'سوال؟ ہمیں کال یا واٹس ایپ کریں', 'Payment received and matched. Your booking is confirmed.': 'ادائیگی موصول ہو گئی اور رقم درست ہے۔ آپ کی بکنگ کنفرم ہے۔',
    'We could not accept your payment screenshot.': 'ہم آپ کا ادائیگی کا اسکرین شاٹ قبول نہیں کر سکے۔', 'Your orders': 'آپ کے آرڈرز', 'Language': 'زبان'
  };
  const t = (s) => (S.lang === 'ur' && UR[s]) || s;

  // ---------- small view components ----------
  const STATUS = { SUBMITTED: ['Submitted', 'upload'], UNDER_REVIEW: ['Under Review', 'clock'], CONFIRMED: ['Confirmed', 'check-circle'], NEEDS_ATTENTION: ['Needs Attention', 'alert'], CANCELLED: ['Cancelled', 'x'] };
  const chip = (st) => '<span class="chip ' + st + '">' + icon(STATUS[st][1], 16) + esc(t(STATUS[st][0])) + '</span>';
  const btn = (label, o) => { o = o || {}; const cls = { primary: 'btn btn-primary', secondary: 'btn btn-secondary', text: 'btn btn-text', danger: 'btn btn-danger' }[o.kind || 'primary'];
    const attrs = (o.action ? ' data-action="' + o.action + '"' : '') + (o.id ? ' id="' + o.id + '"' : '') + (o.disabled ? ' disabled' : '') + (o.arg ? ' data-arg="' + esc(o.arg) + '"' : '');
    if (o.href) return '<a class="' + cls + '" href="' + o.href + '"' + attrs + (o.ext ? ' target="_blank" rel="noopener"' : '') + '>' + (o.icon ? icon(o.icon, 20) : '') + esc(label) + '</a>';
    return '<button type="button" class="' + cls + '"' + attrs + '>' + (o.icon ? icon(o.icon, 20) : '') + esc(label) + '</button>'; };
  const kv = (k, v, cls) => '<div class="kv"><span class="k body">' + esc(t(k)) + '</span><span class="v body num ' + (cls || '') + '">' + v + '</span></div>';
  const metaLine = (o) => o.type === 'PLAN' ? o.id + ' · Starts ' + fmtDay(o.startDate) : o.id + ' · Event ' + fmtDay(o.eventDate);
  const orderCard = (o) => '<a class="card" href="#/orders/' + o.id + '">' + (o.photo ? '<img class="thumb" src="' + o.photo + '" alt="">' : '') +
    '<span class="txt"><span class="strong">' + esc(o.title) + '</span><span class="caption muted">' + esc(metaLine(o)) + '</span>' + chip(o.status) + '</span><span class="chev">' + icon('chevron-right') + '</span></a>';
  const sortOrders = (list) => list.slice().sort((a, b) => ['NEEDS_ATTENTION', 'UNDER_REVIEW', 'SUBMITTED', 'CONFIRMED', 'CANCELLED'].indexOf(a.status) - ['NEEDS_ATTENTION', 'UNDER_REVIEW', 'SUBMITTED', 'CONFIRMED', 'CANCELLED'].indexOf(b.status));
  const loading = (msg) => '<div class="stack" role="status" aria-live="polite"><div class="state" style="padding-top:24px">' + icon('loader', 32, 'spin c-review') + '<p class="body muted">' + esc(msg) + '</p></div>' +
    [1, 2].map(() => '<div class="skel" aria-hidden="true"><i style="width:56px;height:56px"></i><span class="stack tight" style="flex:1"><i style="width:70%;height:12px"></i><i style="width:50%;height:12px"></i><i style="width:35%;height:12px"></i></span></div>').join('') + '</div>';
  const errorState = (title, text) => '<div class="state" role="alert"><div class="circle bad">' + icon('cloud-off', 36) + '</div><h2 class="h2">' + esc(title) + '</h2><p class="body muted">' + esc(text) + '</p>' +
    btn('Try again', { action: 'reload' }) + btn('Call ' + (CONFIG ? CONFIG.phone : '0308 222 5656'), { kind: 'secondary', href: 'tel:+923082225656' }) + '</div>';
  const emptyState = (title, text, label, href) => '<div class="state"><div class="circle neutral">' + icon('receipt', 32) + '</div><h2 class="h2">' + esc(title) + '</h2><p class="body muted">' + esc(text) + '</p>' + btn(label, { href: href }) + '</div>';
  const tiles = () => '<h2 class="h2">Order something new</h2><div class="tiles"><a class="tile" href="#/plans"><img src="/food/thumb/img_8718.jpeg" alt=""><span class="strong">Meal plans</span><span class="caption muted">From Rs 7,800 / month</span></a>' +
    '<a class="tile" href="/events"><img src="/food/thumb/img_8679.jpeg" alt=""><span class="strong">Event catering</span><span class="caption muted">Dholki, mehndi, walima</span></a></div>';

  // ---------- toast, dialog, file reading ----------
  let toastTimer = null; let toastUndo = null;
  function toast(msg, action, onAction) {
    const el = $('#toast'); toastUndo = onAction || null;
    el.innerHTML = icon('check-circle', 20) + '<span class="body">' + esc(msg) + '</span><button type="button" data-action="toast">' + esc(action || 'OK') + '</button>';
    el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), onAction ? 5000 : 3000);
  }
  function dialog(title, text, cancel, ok, danger) {
    return new Promise((resolve) => {
      const host = $('#overlay'); const prev = document.activeElement;
      host.innerHTML = '<div class="scrim" data-close="1"><div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-b"><h2 class="h2" id="dlg-t">' + esc(title) + '</h2><p class="body muted" id="dlg-b">' + esc(text) + '</p>' +
        '<div class="btn-row"><button type="button" class="btn btn-text" data-r="0">' + esc(cancel) + '</button><button type="button" class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" data-r="1">' + esc(ok) + '</button></div></div></div>';
      const done = (v) => { host.innerHTML = ''; document.removeEventListener('keydown', key); if (prev && prev.focus) prev.focus(); resolve(v); };
      const key = (e) => { if (e.key === 'Escape') done(false); };
      document.addEventListener('keydown', key);
      host.querySelector('.scrim').addEventListener('click', (e) => { if (e.target.dataset.close) done(false); const r = e.target.closest('[data-r]'); if (r) done(r.dataset.r === '1'); });
      host.querySelector('[data-r="1"]').focus();
    });
  }
  const MAX = 5 * 1024 * 1024;
  function checkFile(file) {
    if (!file) return { ok: false };
    const ext = (file.name.split('.').pop() || '').toUpperCase();
    if (!/^image\/(jpeg|png)$/.test(file.type)) return { ok: false, title: 'This file is a ' + (ext || 'different type') + '.', text: 'Upload a photo of the screenshot: JPG or PNG, up to 5 MB.' };
    if (file.size > MAX) return { ok: false, title: 'This file is ' + (file.size / 1048576).toFixed(1) + ' MB.', text: 'Choose an image under 5 MB, or take a new screenshot.' };
    return { ok: true, name: file.name, size: file.size < 1048576 ? Math.max(1, Math.round(file.size / 1024)) + ' KB' : (file.size / 1048576).toFixed(1) + ' MB', url: URL.createObjectURL(file) };
  }
  const uploadArea = (u, inputId) => {
    if (u.busy) return '<div class="upload">' + icon('loader', 24, 'spin') + '<div class="stack tight" style="flex:1;min-width:0"><span class="name">' + esc(u.name) + '</span><div class="bar"><i id="bar"></i></div><span class="caption muted" id="pct">Uploading… 0%</span></div></div>';
    if (u.ok) return '<div class="upload ok"><img class="thumb" src="' + u.url + '" alt="Your payment screenshot"><div class="stack tight" style="flex:1;min-width:0;gap:2px"><span class="name">' + esc(u.name) + '</span><span class="caption c-success row" style="gap:4px">' + icon('check-circle', 14) + esc(u.size) + ' · ready to send</span></div>' + btn('Remove', { kind: 'text', action: 'remove-file' }) + '</div>';
    if (u.title) return '<div class="upload bad" role="alert">' + '<span class="c-error">' + icon('alert', 24) + '</span><div class="stack tight" style="flex:1"><span class="strong c-error">' + esc(u.title) + '</span><span class="caption">' + esc(u.text) + '</span><label class="btn btn-text" style="align-self:flex-start;padding:0" for="' + inputId + '">Choose another file</label></div><input id="' + inputId + '" class="sr-only" type="file" accept="image/png,image/jpeg" data-file="1"></div>';
    return '<label class="upload empty" for="' + inputId + '"><span>' + icon('upload', 28) + '</span><span class="strong">Upload payment screenshot</span><span class="caption muted">JPG or PNG, up to 5 MB</span><input id="' + inputId + '" class="sr-only" type="file" accept="image/png,image/jpeg" data-file="1"></label>';
  };
  async function fakeUpload() { for (let p = 0; p <= 100; p += 10) { const b = $('#bar'); const c = $('#pct'); if (b) b.style.width = p + '%'; if (c) c.textContent = 'Uploading… ' + p + '%'; await sleep(120); } }

  // ---------- tiny PDF writer for the receipt (Helvetica, ASCII text) ----------
  function receiptPdf(o, user) {
    const lines = [['URBAN TIFFIN & EVENTS - PAYMENT RECEIPT', 16], ['', 12], ['Token number: ' + o.id, 22], ['Status: Confirmed', 12], ['', 12],
      ['Customer: ' + user.name, 12], ['Booking: ' + o.details, 12], ['Event: ' + fmtDay(o.eventDate, true) + (o.serving ? ', ' + o.serving.replace('–', '-') : ''), 12],
      ['Amount received: Rs ' + Number(o.received || o.amount).toLocaleString('en-US'), 12], ['Paid by: Bank transfer', 12], ['Confirmed: ' + fmtWhen(o.history[o.history.length - 1].at), 12], ['', 12],
      ['Show this token number to our team at your event.', 11], ['Questions: call or WhatsApp 0308 222 5656', 11]];
    let y = 780; let stream = 'BT\n';
    lines.forEach(([txt, size]) => { const safe = txt.replace(/[^\x20-\x7E]/g, '-').replace(/([()\\])/g, '\\$1'); stream += '/F1 ' + size + ' Tf 1 0 0 1 56 ' + y + ' Tm (' + safe + ') Tj\n'; y -= size + 12; });
    stream += 'ET';
    const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
      '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
    let pdf = '%PDF-1.4\n'; const offs = [];
    objs.forEach((b, i) => { offs.push(pdf.length); pdf += (i + 1) + ' 0 obj\n' + b + '\nendobj\n'; });
    const x = pdf.length; pdf += 'xref\n0 6\n0000000000 65535 f \n' + offs.map((n) => String(n).padStart(10, '0') + ' 00000 n \n').join('') + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + x + '\n%%EOF';
    return new Blob([pdf], { type: 'application/pdf' });
  }

  // ---------- views (each returns { title, back, tab, html, after }) ----------
  const V = {};
  let ui = {}; // per-screen in-memory state (selected file, filters…)

  // App-wide: first use
  V.welcome = async () => ({ title: null, html:
    '<div class="stack" style="align-items:center;text-align:center;gap:16px;padding-top:32px"><img src="/brand/urban-tiffin-logo.jpeg" alt="Urban Tiffin & Events" width="96" height="96" style="border-radius:48px">' +
    '<h1 class="h1">Know where your order stands</h1><p class="body muted">Homemade meals and event catering in Lahore, paid by bank transfer.</p>' +
    '<div class="panel surface" style="text-align:left;gap:14px">' + [['upload', 'Pay by bank transfer and upload your screenshot.'], ['clock', 'We check it — usually within 15 minutes.'], ['check-circle', 'You get a token number and a WhatsApp message when it is confirmed.']]
      .map(([i, s]) => '<div class="row top" style="gap:12px">' + icon(i) + '<span class="body">' + s + '</span></div>').join('') + '</div>' +
    btn('Create account', { href: '/login' }) + btn('Sign in', { kind: 'secondary', href: '#/signin' }) + btn('Browse meal plans first', { kind: 'text', href: '#/plans' }) + '</div>',
    after() { S.firstRunDone = true; save(); } });

  // S-01 Home
  V.home = async () => {
    const view = { title: 'Urban Tiffin & Events', tab: 'Home' };
    if (!S.signedIn) { view.html = '<div class="stack"><p class="caption muted">Assalam-o-alaikum</p><h1 class="h1">' + t('Your orders') + '</h1><div class="panel surface"><p class="body">Sign in to see the status of your orders and payments.</p>' + btn('Sign in', { href: '#/signin?next=/home' }) + '</div>' + tiles() + '</div>'; return view; }
    view.html = '<div class="stack"><p class="caption muted">Assalam-o-alaikum, ' + esc(S.user.name.split(' ')[0]) + '</p><div class="row"><h1 class="h1 spacer">' + t('Your orders') + '</h1>' + btn('See all', { kind: 'text', href: '#/orders' }) + '</div><div id="slot">' + loading('Loading your orders…') + '</div>' + tiles() + '</div>';
    view.after = async () => {
      try { const r = await api.orders(); const list = sortOrders(r.orders).filter((o) => o.status !== 'CANCELLED').slice(0, 3);
        $('#slot').innerHTML = (r.offline ? '<p class="caption muted row">' + icon('wifi-off', 16) + 'Offline — showing saved orders</p>' : '') +
          (list.length ? '<div class="stack">' + list.map(orderCard).join('') + '</div>' : emptyState('No orders yet', 'When you order a meal plan or book an event, you can follow its payment status here.', 'View meal plans', '#/plans'));
      } catch (e) { $('#slot').innerHTML = errorState('We couldn’t load your orders', 'Something went wrong on our side. Your orders and payments are safe — try again in a minute.'); }
    };
    return view;
  };

  // S-02 Meal Plans
  V.plans = async () => ({ title: 'Meal Plans', tab: 'Menu', html: '<div id="slot">' + loading('Loading this month’s plans…') + '</div>', async after() {
    try { if (S.demo.serverError) { await sleep(500); throw new Error('server'); } const c = await api.config(); await sleep(300);
      const sel = S.plan; const p = c.plans.find((x) => x.tier === sel) || c.plans[1];
      $('#slot').innerHTML = '<div class="stack"><p class="caption muted row top">' + icon('calendar', 16) + '<span>Monthly lunch plans, Monday to Friday. Order at least 1 day before your start date.</span></p><div class="stack" role="radiogroup" aria-label="Meal plans">' +
        c.plans.map((x) => '<button type="button" class="plan" role="radio" aria-checked="' + (x.tier === p.tier) + '" data-action="pick-plan" data-arg="' + x.tier + '"><span class="row"><span class="h2">' + esc(x.name) + '</span><span class="check">' + icon('check-circle', 22) + '</span></span><span class="overline">' + esc(x.label) + '</span><span class="strong num">' + money(x.price) + ' / month</span><span class="caption muted">' + esc(x.menu) + '</span></button>').join('') +
        '</div>' + btn('Continue with ' + p.name, { action: 'continue-plan' }) + '</div>';
    } catch (e) { $('#slot').innerHTML = errorState('We couldn’t load the plans', 'This is a problem on our side, not your phone. Try again in a minute, or call us to order.'); }
  } });

  // S-03 Sign in
  V.signin = async (p, q) => {
    const next = q.get('next') || '/home';
    return { title: 'Sign in', back: true, tab: 'Menu', html:
      '<form class="stack" id="signin" novalidate>' + (next === '/checkout' ? '<p class="body row top">' + icon('info', 20) + '<span>Sign in to place your order. Your ' + esc(planName()) + ' plan is saved.</span></p>' : '<p class="body muted">Sign in with the mobile number you used to order.</p>') +
      '<div class="field" id="f-phone"><label for="phone">Mobile number</label><div class="box"><input id="phone" name="phone" inputmode="numeric" autocomplete="tel" maxlength="13" placeholder="0300 1234567" aria-describedby="h-phone"></div><span class="help" id="h-phone">11 digits, starting with 03</span></div>' +
      '<div class="field" id="f-pass"><label for="pass">Password</label><div class="box"><input id="pass" name="pass" type="password" autocomplete="current-password" aria-describedby="h-pass"><button type="button" class="icon-btn" data-action="toggle-pass" aria-label="Show password">' + icon('eye', 22) + '</button></div><span class="help" id="h-pass">At least 8 characters</span></div>' +
      '<a class="btn btn-text" style="align-self:flex-start" href="/forgot-password">Forgot password?</a>' +
      '<button class="btn btn-primary" id="signin-btn" type="submit" disabled>Sign in</button>' +
      '<p class="caption muted" style="text-align:center">Demo account: 0301 2345678 · password tiffin123</p></form>',
      after() {
        const form = $('#signin'); const ph = $('#phone'); const pw = $('#pass'); const b = $('#signin-btn');
        const phoneOk = () => /^03\d{9}$/.test(ph.value.replace(/\D/g, ''));
        const setErr = (id, msg, def) => { const f = $('#f-' + id); f.classList.toggle('invalid', !!msg); f.querySelector('.help').innerHTML = msg ? icon('alert', 16) + '<span>' + esc(msg) + '</span>' : esc(def); f.querySelector('input').setAttribute('aria-invalid', msg ? 'true' : 'false'); };
        const update = () => { b.disabled = !(phoneOk() && pw.value.length >= 8) || Date.now() < S.lockUntil; };
        ph.addEventListener('input', () => { if ($('#f-phone').classList.contains('invalid') && phoneOk()) setErr('phone', '', '11 digits, starting with 03'); update(); });
        ph.addEventListener('blur', () => { if (ph.value && !phoneOk()) setErr('phone', 'Enter an 11-digit mobile number, e.g. 03001234567.'); });
        pw.addEventListener('input', () => { setErr('pass', '', 'At least 8 characters'); update(); });
        if (Date.now() < S.lockUntil) setErr('pass', 'Too many tries. Try again at ' + clock(new Date(S.lockUntil)) + ', or reset your password.');
        form.addEventListener('submit', async (e) => {
          e.preventDefault(); if (b.disabled) return;
          b.disabled = true; b.innerHTML = icon('loader', 20, 'spin') + 'Signing in…'; await sleep(800);
          if (ph.value.replace(/\D/g, '') === '03012345678' && pw.value === 'tiffin123') {
            Object.assign(S, { signedIn: true, sessionExpired: false, attempts: 0, lockUntil: 0, firstRunDone: true }); save(); location.replace('#' + next); return;
          }
          S.attempts += 1; const left = 3 - S.attempts;
          if (left <= 0) { S.lockUntil = Date.now() + 15 * 60000; S.attempts = 0; setErr('pass', 'Too many tries. Try again at ' + clock(new Date(S.lockUntil)) + ', or reset your password.'); }
          else setErr('pass', 'Wrong password. ' + left + (left === 1 ? ' try' : ' tries') + ' left before a 15-minute wait.');
          save(); b.innerHTML = 'Sign in'; update(); pw.focus(); pw.select();
        });
        ph.focus();
      } };
  };
  const planName = () => ({ STANDARD: 'Standard', PREMIUM: 'Premium', EXECUTIVE: 'Executive' }[S.plan] || 'Premium');

  // S-04 Plan Checkout
  V.checkout = async () => {
    if (!S.signedIn) { location.replace('#/signin?next=/checkout'); return null; }
    const c = await api.config(); const p = c.plans.find((x) => x.tier === S.plan);
    if (!ui.co) ui.co = { file: {}, whatsapp: S.settings.whatsapp };
    const u = ui.co.file; const start = nextMonday();
    const html = '<div class="stack tight"><p class="caption muted">Step 2 of 3 · Pay and upload</p><div class="progress" aria-hidden="true"><span class="on"></span><span class="on"></span><span></span></div>' +
      '<section class="panel"><h2 class="h2">Your plan</h2>' + kv('Plan', esc(p.name)) + kv('Price', money(p.price) + ' / month') + kv('Delivery', '12:30 – 1:00 pm') + kv('Starts', fmtDay(start)) + '</section>' +
      '<section class="panel"><h2 class="h2">Pay by bank transfer</h2>' + kv('Bank', esc(c.bank.name)) + kv('Account title', esc(c.bank.title)) +
      '<div class="kv"><span class="k body">Account</span><span class="v body num">' + esc(c.bank.account) + '</span>' + btn('Copy', { kind: 'text', action: 'copy', arg: c.bank.account.replace(/\s/g, '') + '|Account number copied' }) + '</div>' +
      '<div class="kv"><span class="k body">Amount to send</span><span class="v body num">' + money(p.price) + '</span>' + btn('Copy', { kind: 'text', action: 'copy', arg: p.price + '|Amount copied' }) + '</div></section>' +
      '<div id="upl">' + uploadArea(u, 'co-file') + '</div>' +
      '<label class="checkrow"><input type="checkbox" id="wa"' + (ui.co.whatsapp ? ' checked' : '') + '><span class="body">Send me status updates on WhatsApp</span></label>' +
      btn('Submit order', { id: 'submit', action: 'submit-order', disabled: !u.ok }) +
      '<p class="caption muted row top" id="hint">' + (u.ok ? icon('lock', 16) + '<span>Only the admin team can see your screenshot.</span>' : icon('info', 16) + '<span>Upload your payment screenshot to submit.</span>') + '</p></div>';
    return { title: 'Plan Checkout', back: true, tab: 'Menu', html, after() { $('#wa').addEventListener('change', (e) => { ui.co.whatsapp = e.target.checked; }); } };
  };

  // S-05 Order Submitted
  V.submitted = async (p) => {
    const o = (S.orders || []).find((x) => x.id === p.id); if (!o) return V.notfound();
    const wa = !!o.whatsapp;
    return { title: 'Order submitted', tab: 'Menu', html: '<div class="stack" style="align-items:center;text-align:center;gap:14px;padding-top:16px"><div class="circle ok">' + icon('check-circle', 36) + '</div><h1 class="h1">Your order is in</h1><p class="body muted">' + esc(o.title) + ' · Order ' + o.id + '</p>' + chip(o.status) +
      '<div class="panel surface" style="text-align:left;gap:12px;align-self:stretch"><h2 class="h2">What happens next</h2>' +
      [['clock', 'We check your payment — usually within 15 minutes (9 am – 9 pm).'], wa ? ['message', 'You get a WhatsApp message on ' + S.user.phone.replace(/(\d{4})(\d{7})/, '$1 $2') + ' when it is confirmed.'] : ['bell', 'WhatsApp updates are off, so check Orders for your status.'], ['receipt', 'Your token number appears in Orders.']]
        .map(([i, s]) => '<div class="row top" style="gap:12px">' + icon(i, 22) + '<span class="body">' + esc(s) + '</span></div>').join('') + '</div>' +
      btn('Go to Orders', { href: '#/orders' }) + (wa ? '' : btn('Turn on WhatsApp updates', { kind: 'secondary', action: 'wa-on', arg: o.id })) + btn('Back to Home', { kind: 'text', href: '#/home' }) + '</div>' };
  };

  // S-06 Order List
  V.orders = async () => {
    if (!S.signedIn) return needSignIn('/orders');
    const f = ui.filter || 'ALL';
    return { title: 'Orders', tab: 'Orders', html: '<div id="slot">' + loading('Loading your orders…') + '</div>', async after() {
      try {
        const r = await api.orders(); if (!r.offline) lastUpdated.at = Date.now();
        const all = sortOrders(r.orders);
        if (!all.length) { $('#slot').innerHTML = emptyState('No orders yet', 'When you order a meal plan or book an event, you can follow its payment status here.', 'View meal plans', '#/plans'); return; }
        const count = (st) => all.filter((o) => o.status === st).length;
        const pills = [['ALL', 'All (' + all.length + ')'], ['NEEDS_ATTENTION', 'Needs action (' + count('NEEDS_ATTENTION') + ')'], ['UNDER_REVIEW', 'In review (' + count('UNDER_REVIEW') + ')'], ['CONFIRMED', 'Confirmed (' + count('CONFIRMED') + ')']];
        const shown = all.filter((o) => f === 'ALL' || o.status === f);
        $('#slot').innerHTML = '<div class="stack">' + (r.offline ? '<div class="panel surface banner" role="status">' + icon('wifi-off') + '<div class="stack tight" style="flex:1;gap:2px"><span class="strong">You’re offline</span><span class="caption muted">Showing orders saved' + (lastUpdated.at ? ' at ' + clock(new Date(lastUpdated.at)) : '') + '. A status may have changed since then.</span></div>' + btn('Retry', { kind: 'text', action: 'reload' }) + '</div>' : '') +
          '<div class="pills" role="group" aria-label="Filter orders">' + pills.map(([k, l]) => '<button type="button" class="pill" aria-pressed="' + (k === f) + '" data-action="filter" data-arg="' + k + '">' + l + '</button>').join('') + '</div>' +
          '<div class="stack"' + (r.offline ? ' style="opacity:.65"' : '') + '>' + (shown.length ? shown.map(orderCard).join('') : '<p class="body muted" style="text-align:center;padding:24px 0">No orders with this status.</p>') + '</div>' +
          (lastUpdated.at ? '<p class="caption muted" style="text-align:center">Updated ' + clock(new Date(lastUpdated.at)) + '</p>' : '') + '</div>';
      } catch (e) { $('#slot').innerHTML = errorState('We couldn’t load your orders', 'Something went wrong on our side. Your orders and payments are safe — try again in a minute.'); }
    } };
  };

  // S-07 Order Status Detail
  const timeline = (o) => {
    const steps = o.history.map((h, i) => ({ s: h.status, at: h.at, kind: i < o.history.length - 1 ? 'done' : ({ CONFIRMED: 'ok', NEEDS_ATTENTION: 'warn', UNDER_REVIEW: 'now', CANCELLED: 'done', SUBMITTED: 'now' }[h.status]) }));
    if (o.status === 'UNDER_REVIEW') steps.push({ s: 'CONFIRMED', note: 'Usually within 15 minutes', kind: 'pend' });
    return '<h2 class="h2">' + t('Status history') + '</h2><ol class="timeline" style="list-style:none;margin:0;padding:0">' + steps.map((x, i) => '<li class="tl"><span class="rail"><span class="dot ' + x.kind + '">' +
      (x.kind === 'pend' ? '' : icon({ warn: 'alert', now: 'clock' }[x.kind] || 'check', 14)) + '</span>' + (i < steps.length - 1 ? '<span class="line ' + (steps[i + 1].kind === 'pend' ? 'pend' : '') + '"></span>' : '') + '</span>' +
      '<span class="t stack" style="gap:0"><span class="strong ' + ({ ok: 'c-success', warn: 'c-error', now: 'c-review', pend: 'muted' }[x.kind] || '') + '">' + esc(t(STATUS[x.s][0])) + (x.note && o.status === 'UNDER_REVIEW' && x.s === 'UNDER_REVIEW' ? '' : '') + '</span><span class="caption muted">' + (x.at ? esc(fmtWhen(x.at)) + (x.kind === 'now' ? ' · ' + minutesSince(x.at) + ' min ago' : '') : esc(x.note)) + '</span></span></li>').join('') + '</ol>';
  };
  V.order = async (p) => {
    if (!S.signedIn) return needSignIn('/orders/' + p.id);
    return { title: t('Order Details'), back: true, tab: 'Orders', html: '<div id="slot">' + loading('Loading order details…') + '</div>', async after() {
      let r; try { r = await api.order(p.id); } catch (e) { $('#slot').innerHTML = errorState('We couldn’t load this order', 'Your order is safe. This is a problem on our side — try again in a minute.'); return; }
      const o = r.order; if (!o) { $('#slot').innerHTML = emptyState('We couldn’t find this order', 'It may have been cancelled. Your other orders are in the Orders tab.', 'Go to Orders', '#/orders'); return; }
      const sub = o.type === 'PLAN' ? 'Order ' + o.id + ' · starts ' + fmtDay(o.startDate) : 'Order ' + o.id + ' · ' + (o.guests ? o.guests + ' guests' : 'Event ' + fmtDay(o.eventDate));
      let banner = ''; let facts = ''; let actions = '';
      if (o.status === 'CONFIRMED') {
        banner = '<div class="panel ok">' + chip(o.status) + '<p class="body">' + t('Payment received and matched. Your booking is confirmed.') + '</p></div>';
        facts = kv('Amount quoted', money(o.amount)) + kv('Amount received', icon('check-circle', 16) + ' ' + money(o.received || o.amount), 'c-success row" style="justify-content:flex-end;gap:4px') + (o.eventDate ? kv('Event date', fmtDay(o.eventDate, true)) : kv('Starts', fmtDay(o.startDate, true))) + kv('Token number', o.id);
        actions = btn(t('View receipt'), { href: '#/receipt/' + o.id });
      } else if (o.status === 'NEEDS_ATTENTION') {
        banner = '<div class="panel warn" role="alert">' + chip(o.status) + '<p class="strong">' + t('We could not accept your payment screenshot.') + '</p><p class="body">Reason: ' + esc(o.reason.charAt(0).toLowerCase() + o.reason.slice(1)) + '</p></div>';
        facts = kv('Amount to pay', money(o.amount)) + (o.eventDate ? kv('Event date', fmtDay(o.eventDate, true)) : '') + (o.holdUntil ? kv('Date held until', fmtDay(o.holdUntil)) : '');
        actions = btn(t('Upload a new screenshot'), { href: '#/fix/' + o.id });
      } else if (o.status === 'UNDER_REVIEW') {
        const mins = minutesSince(o.history[o.history.length - 1].at);
        banner = '<div class="panel review">' + chip(o.status) + '<p class="body">We’re checking your payment of ' + money(o.amount) + '. This usually takes 15 minutes.</p></div>';
        facts = kv('Amount sent', money(o.amount)) + (o.startDate ? kv('Starts', fmtDay(o.startDate, true)) : kv('Event date', fmtDay(o.eventDate, true)));
        actions = (mins >= 15 ? '<div class="panel"><p class="strong">Taking longer than usual?</p><p class="caption muted">Our team checks payments 9 am – 9 pm. You can reach us now:</p><div class="btn-row">' + btn('Call us', { kind: 'secondary', href: 'tel:+923082225656' }) + btn('WhatsApp us', { kind: 'secondary', href: 'https://wa.me/923082225656?text=' + encodeURIComponent('Salam, my order ' + o.id + ' is still under review.'), ext: true }) + '</div></div>' : '') +
          btn('Cancel this order', { kind: 'text', action: 'cancel-order', arg: o.id });
      } else {
        banner = '<div class="panel surface">' + chip(o.status) + '<p class="body">This order was cancelled. Nothing will be charged.</p></div>';
        facts = kv('Amount', money(o.amount));
      }
      const questions = o.status === 'UNDER_REVIEW' ? '' : btn(t('Questions? Call or WhatsApp us'), { kind: 'text', href: 'tel:+923082225656' });
      $('#slot').innerHTML = '<div class="stack"><div><h1 class="h1">' + esc(o.title) + '</h1><p class="caption muted">' + esc(sub) + '</p></div>' + (r.offline ? '<p class="caption muted row">' + icon('wifi-off', 16) + 'Offline — this status may be out of date</p>' : '') + banner + timeline(o) + '<div class="panel">' + facts + '</div>' + actions + questions + '</div>';
    } };
  };

  // S-08 Receipt / Token
  V.receipt = async (p) => {
    if (!S.signedIn) return needSignIn('/receipt/' + p.id);
    const o = (S.orders || []).find((x) => x.id === p.id && x.status === 'CONFIRMED'); if (!o) return V.notfound();
    return { title: t('Receipt'), back: true, tab: 'Orders', html: '<div class="stack"><section class="panel" style="gap:8px;padding:16px"><div class="row" style="gap:12px"><img src="/brand/urban-tiffin-logo.jpeg" alt="" width="48" height="48" style="border-radius:24px"><div class="stack" style="gap:0"><h2 class="h2">Payment receipt</h2><span class="caption muted">Urban Tiffin & Events, Lahore</span></div></div><hr style="border:0;border-top:1px solid var(--border);width:100%;margin:4px 0">' +
      '<p class="overline">Token number</p><p class="h1 num" style="font-size:40px;line-height:44px">' + o.id + '</p>' + chip('CONFIRMED') +
      kv('Customer', esc(S.user.name)) + kv('Booking', esc(o.details)) + (o.eventDate ? kv('Event', fmtDay(o.eventDate, true) + (o.serving ? ', ' + esc(o.serving) : '')) : kv('Starts', fmtDay(o.startDate, true))) + kv('Amount received', money(o.received || o.amount)) + kv('Paid by', 'Bank transfer') + kv('Confirmed', esc(fmtWhen(o.history[o.history.length - 1].at))) + '</section>' +
      '<p class="caption muted row top">' + icon('info', 16) + '<span>Show this token number to our team at your event.</span></p>' +
      btn('Download receipt (PDF)', { action: 'download', arg: o.id, id: 'dl' }) + btn('Share on WhatsApp', { kind: 'secondary', href: 'https://wa.me/?text=' + encodeURIComponent('My Urban Tiffin & Events booking ' + o.id + ' (' + o.title + ') is confirmed.'), ext: true }) + '</div>' };
  };

  // S-09 Upload New Screenshot
  V.fix = async (p) => {
    if (!S.signedIn) return needSignIn('/fix/' + p.id);
    const o = (S.orders || []).find((x) => x.id === p.id); if (!o || o.status !== 'NEEDS_ATTENTION') return V.notfound();
    if (!ui.fix || ui.fix.id !== o.id) ui.fix = { id: o.id, file: {} };
    const u = ui.fix.file; const c = await api.config();
    return { title: 'Fix payment', back: true, tab: 'Orders', html: '<div class="stack"><h2 class="h2">' + esc(o.title) + ' · ' + o.id + '</h2><div class="panel warn"><p class="strong c-error">Why it was not accepted</p><p class="body">' + esc(o.reason) + '</p></div>' +
      '<div class="panel surface" style="gap:8px"><p class="strong">Your new screenshot should clearly show:</p>' + ['The amount: ' + money(o.amount), 'The date and time of the transfer', 'Our account number ending ' + c.bank.account.slice(-5)].map((s) => '<p class="body row"><span class="c-success">' + icon('check', 18) + '</span>' + esc(s) + '</p>').join('') + '</div>' +
      '<div id="upl">' + uploadArea(u, 'fix-file') + '</div>' + btn('Send new screenshot', { id: 'submit', action: 'send-fix', arg: o.id, disabled: !u.ok }) + btn('Cancel', { kind: 'secondary', action: 'back' }) + '</div>' };
  };

  // S-10 Resubmitted
  V.resubmitted = async (p) => {
    const o = (S.orders || []).find((x) => x.id === p.id); if (!o) return V.notfound();
    return { title: 'Screenshot sent', tab: 'Orders', html: '<div class="stack" style="align-items:center;text-align:center;gap:14px;padding-top:16px"><div class="circle ok">' + icon('check-circle', 36) + '</div><h1 class="h1">New screenshot sent</h1><p class="body muted">' + esc(o.title) + ' · Order ' + o.id + '</p>' + chip(o.status) +
      '<div class="panel surface" style="text-align:left;gap:12px;align-self:stretch">' + [['calendar', 'Your event date (' + fmtDay(o.eventDate) + ') stays booked while we check.'], ['clock', 'We check your new screenshot — usually within 15 minutes.'], ['message', 'You get a WhatsApp message when it is confirmed.']]
        .map(([i, s]) => '<div class="row top" style="gap:12px">' + icon(i, 22) + '<span class="body">' + esc(s) + '</span></div>').join('') + '</div>' + btn('Go to Orders', { href: '#/orders' }) + btn('Back to Home', { kind: 'text', href: '#/home' }) + '</div>' };
  };

  // S-11 Account
  V.account = async () => {
    if (!S.signedIn) return needSignIn('/account');
    const row = (ic, label, sub, href, action, danger) => '<' + (href ? 'a href="' + href + '"' : 'button type="button" data-action="' + action + '"') + ' class="card" style="border:0;border-bottom:1px solid var(--border);border-radius:0;min-height:56px;padding:12px 16px"><span class="' + (danger ? 'c-error' : '') + '" style="color:' + (danger ? '' : 'var(--primary)') + '">' + icon(ic, 22) + '</span><span class="txt" style="gap:0"><span class="strong ' + (danger ? 'c-error' : '') + '">' + esc(label) + '</span>' + (sub ? '<span class="caption muted">' + esc(sub) + '</span>' : '') + '</span>' + (danger ? '' : '<span class="chev">' + icon('chevron-right', 20) + '</span>') + '</' + (href ? 'a' : 'button') + '>';
    return { title: 'Account', tab: 'Account', html: '<div class="stack"><div class="row" style="gap:12px"><span style="width:56px;height:56px;border-radius:28px;background:var(--primary);color:var(--on-primary);display:grid;place-items:center" class="h2">' + esc(S.user.initials) + '</span><span class="stack" style="gap:0"><span class="h2">' + esc(S.user.name) + '</span><span class="caption muted">' + esc(S.user.phone.replace(/(\d{4})(\d{7})/, '$1 $2')) + ' · ' + esc(S.user.area) + '</span></span></div>' +
      '<div class="panel" style="padding:0;gap:0;overflow:hidden">' + row('user', 'Profile & address', 'Name, phone, delivery address', '/account') + row('bell', 'Notification settings', 'WhatsApp, SMS, email', '#/notifications') +
      row('info', t('Language'), S.lang === 'ur' ? 'اردو · switch to English' : 'English · اردو', null, 'lang') + row('help', 'Help & contact', 'Call or WhatsApp 0308 222 5656', '#/help') + row('settings', 'Demo tools', 'For the Phase 4 demo only', '#/demo') + row('log-out', 'Sign out', '', null, 'signout', true) + '</div></div>' };
  };

  // S-12 Notification Settings
  V.notifications = async () => {
    if (!S.signedIn) return needSignIn('/notifications');
    if (!ui.nt) ui.nt = Object.assign({}, S.settings);
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    const sw = (k, label, sub) => '<div class="row" style="gap:12px;min-height:64px;padding:12px 16px;border-bottom:1px solid var(--border)"><span class="stack" style="gap:0;flex:1"><span class="strong" id="l-' + k + '">' + esc(label) + '</span><span class="caption muted">' + esc(sub) + '</span></span>' +
      '<button type="button" role="switch" aria-checked="' + !!ui.nt[k] + '" aria-labelledby="l-' + k + '" data-action="switch" data-arg="' + k + '" style="width:52px;height:32px;border-radius:16px;border:1px solid ' + (ui.nt[k] ? 'var(--primary)' : 'var(--disabled-text)') + ';background:' + (ui.nt[k] ? 'var(--primary)' : 'var(--disabled)') + ';position:relative;cursor:pointer;flex:none"><span style="position:absolute;top:3px;' + (ui.nt[k] ? 'right:3px;background:var(--bg)' : 'left:3px;background:var(--bg);border:1px solid var(--disabled-text)') + ';width:24px;height:24px;border-radius:12px;display:grid;place-items:center;color:var(--primary)">' + (ui.nt[k] ? icon('check', 14) : '') + '</span></button></div>';
    const blocked = ui.nt.push && perm === 'denied';
    return { title: 'Notification settings', back: true, tab: 'Account', html: '<div class="stack"><p class="body muted">Choose how we tell you about payment and order updates.</p><div class="panel" style="padding:0;gap:0">' +
      sw('whatsapp', 'WhatsApp message', 'Recommended — most of our customers use this') + sw('sms', 'SMS', 'To ' + S.user.phone.replace(/(\d{4})(\d{7})/, '$1 $2')) + sw('email', 'Email', 'To ' + S.user.email) + sw('push', 'App notifications', 'On this phone') + '</div>' +
      (blocked || (ui.nt.push && perm === 'unsupported') ? '<div class="panel review" role="alert"><p class="strong c-review row top">' + icon('alert', 20) + '<span>' + (blocked ? 'Notifications are blocked for this app on your phone.' : 'This browser can’t show notifications.') + '</span></p><p class="caption">' + (blocked ? 'Turn them on in your browser’s site settings for this website. WhatsApp updates still work.' : 'Use WhatsApp or SMS updates instead.') + '</p></div>' : '') +
      btn('Save settings', { action: 'save-settings', id: 'save' }) + '</div>' };
  };

  // Q&A tab
  V.help = async () => ({ title: 'Q&A', tab: 'Q&A', html: '<div class="stack"><h1 class="h1">Questions and answers</h1>' + [
    ['How do I pay?', 'Send the amount by bank transfer from your banking app, then upload a screenshot of the confirmation in Plan Checkout.'],
    ['How long does the check take?', 'Usually within 15 minutes between 9 am and 9 pm. You see “Under Review” until then.'],
    ['Why does my order say “Needs Attention”?', 'We could not accept the screenshot — for example it was blurry or the amount did not match. Open the order to see the reason and upload a new one.'],
    ['Is my event date kept while you check?', 'Yes. Your date stays booked while a payment is Under Review or Needs Attention, until the “held until” date.'],
    ['Who can see my screenshot?', 'Only our admin team. It is used to match your payment and is not shared.']]
    .map(([q, a]) => '<details class="panel"><summary class="strong" style="cursor:pointer;min-height:32px">' + esc(q) + '</summary><p class="body muted" style="margin-top:8px">' + esc(a) + '</p></details>').join('') +
    '<div class="btn-row">' + btn('Call us', { kind: 'secondary', href: 'tel:+923082225656', icon: 'phone' }) + btn('WhatsApp', { kind: 'secondary', href: 'https://wa.me/923082225656', ext: true, icon: 'message' }) + '</div></div>' });

  // Demo tools – lets the demo video show error, empty, offline and session states on purpose
  V.demo = async () => ({ title: 'Demo tools', back: true, tab: 'Account', html: '<div class="stack"><p class="body muted">These switches exist only for the Phase 4 demo, so every state can be shown on purpose. Real users never see this page.</p>' +
    '<label class="checkrow"><input type="checkbox" data-demo="serverError"' + (S.demo.serverError ? ' checked' : '') + '><span class="body">Simulate a server error</span></label>' +
    '<label class="checkrow"><input type="checkbox" data-demo="newUser"' + (S.demo.newUser ? ' checked' : '') + '><span class="body">Show as a new user with no orders</span></label>' +
    '<p class="caption muted">For “no internet”, turn on airplane mode (or Offline in the browser’s developer tools).</p>' +
    btn('Expire my session', { kind: 'secondary', action: 'expire' }) + btn('Admin: confirm the newest “Under Review” order', { kind: 'secondary', action: 'approve' }) + btn('Admin: reject it (blurry screenshot)', { kind: 'secondary', action: 'reject' }) + btn('Reset all demo data', { kind: 'text', action: 'reset' }) + '</div>' });

  V.notfound = async () => ({ title: 'Not found', back: true, html: emptyState('This page doesn’t exist', 'The link may be old. Your orders are safe in the Orders tab.', 'Go to Orders', '#/orders') });
  function needSignIn(next) {
    if (S.sessionExpired) {
      setTimeout(async () => { if (await dialog('Please sign in again', 'For your safety we sign you out after 30 days. Your orders and screenshots are safe.', 'Not now', 'Sign in')) location.hash = '#/signin?next=' + next; }, 50);
      return { title: 'Orders', tab: 'Orders', html: '<div class="stack">' + emptyState('You are signed out', 'Sign in again to see your orders.', 'Sign in', '#/signin?next=' + next) + '</div>' };
    }
    location.replace('#/signin?next=' + next); return null;
  }

  // ---------- router ----------
  const ROUTES = [['/welcome', 'welcome'], ['/home', 'home'], ['/plans', 'plans'], ['/signin', 'signin'], ['/checkout', 'checkout'], ['/submitted/:id', 'submitted'], ['/orders', 'orders'], ['/orders/:id', 'order'],
    ['/receipt/:id', 'receipt'], ['/fix/:id', 'fix'], ['/resubmitted/:id', 'resubmitted'], ['/account', 'account'], ['/notifications', 'notifications'], ['/help', 'help'], ['/demo', 'demo']];
  const TABS = [['Home', 'home', '#/home'], ['Menu', 'utensils', '#/plans'], ['Orders', 'receipt', '#/orders'], ['Account', 'user', '#/account'], ['Q&A', 'help', '#/help']];
  let renderId = 0;
  async function render() {
    const my = ++renderId;
    const raw = location.hash.replace(/^#/, '') || (S.firstRunDone ? '/home' : '/welcome');
    const [path, qs] = raw.split('?'); const q = new URLSearchParams(qs || '');
    let name = 'notfound'; let params = {};
    for (const [pat, n] of ROUTES) { const pp = pat.split('/'); const xp = path.split('/'); if (pp.length !== xp.length) continue; const pr = {}; if (pp.every((seg, i) => seg.startsWith(':') ? (pr[seg.slice(1)] = decodeURIComponent(xp[i]), true) : seg === xp[i])) { name = n; params = pr; break; } }
    if (S.orders === null) { try { await seed(); } catch (e) { /* data file missing → screens show their error state */ } }
    let view; try { view = await V[name](params, q); } catch (e) { view = { title: 'Something went wrong', back: true, html: errorState('Something went wrong', 'Please try again. If it keeps happening, call us.') }; }
    if (!view || my !== renderId) return;
    const app = $('#app'); app.setAttribute('dir', S.lang === 'ur' ? 'rtl' : 'ltr'); app.setAttribute('lang', S.lang);
    $('#topbar').className = 'topbar' + (view.back ? ' has-back' : ''); $('#topbar').hidden = view.title === null;
    $('#topbar').innerHTML = (view.back ? '<button type="button" class="icon-btn" data-action="back" aria-label="Back">' + icon('chevron-left') + '</button>' : '') + '<h1>' + esc(view.title || '') + '</h1>';
    $('#tabbar').hidden = !view.tab;
    $('#tabbar').innerHTML = TABS.map(([l, ic, href]) => '<a href="' + href + '"' + (view.tab === l ? ' aria-current="page"' : '') + '>' + icon(ic) + '<span>' + esc(t(l)) + '</span></a>').join('');
    const main = $('#view'); main.innerHTML = view.html; main.scrollTop = 0;
    document.title = (view.title ? view.title + ' · ' : '') + 'Urban Tiffin & Events';
    if (view.after) await view.after();
    if (my === renderId) main.focus({ preventScroll: true });
  }

  // ---------- actions ----------
  async function onFile(input) {
    const res = checkFile(input.files && input.files[0]);
    const scope = location.hash.startsWith('#/fix') ? ui.fix : ui.co; if (!scope) return;
    scope.file = res; scope.rawName = input.files[0] && input.files[0].name;
    const host = $('#upl'); host.innerHTML = uploadArea(res, input.id);
    $('#submit').disabled = !res.ok;
    const hint = $('#hint'); if (hint) hint.innerHTML = res.ok ? icon('lock', 16) + '<span>Only the admin team can see your screenshot.</span>' : icon('info', 16) + '<span>Upload your payment screenshot to submit.</span>';
    if (!res.ok && res.title) host.querySelector('label').focus();
  }
  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-file]')) onFile(e.target);
    if (e.target.matches('[data-demo]')) { S.demo[e.target.dataset.demo] = e.target.checked; save(); toast('Demo setting saved'); }
  });
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-action]'); if (!el || el.disabled) return;
    const a = el.dataset.action; const arg = el.dataset.arg;
    if (a === 'back') { if (history.length > 1) history.back(); else location.hash = '#/home'; }
    else if (a === 'reload') render();
    else if (a === 'toast') { $('#toast').classList.remove('show'); if (toastUndo) { const f = toastUndo; toastUndo = null; f(); } }
    else if (a === 'pick-plan') { S.plan = arg; save(); document.querySelectorAll('.plan').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.arg === arg))); const btnC = document.querySelector('[data-action="continue-plan"]'); btnC.textContent = 'Continue with ' + planName(); }
    else if (a === 'continue-plan') { ui.co = null; location.hash = S.signedIn ? '#/checkout' : '#/signin?next=/checkout'; }
    else if (a === 'toggle-pass') { const p = $('#pass'); const show = p.type === 'password'; p.type = show ? 'text' : 'password'; el.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); el.innerHTML = icon(show ? 'eye-off' : 'eye', 22); }
    else if (a === 'copy') { const [val, msg] = arg.split('|'); try { await navigator.clipboard.writeText(val); toast(msg); } catch (err) { toast('Copy didn’t work — please type ' + val); } }
    else if (a === 'remove-file') { const scope = location.hash.startsWith('#/fix') ? ui.fix : ui.co; scope.file = {}; render(); }
    else if (a === 'submit-order') {
      const c = await api.config(); const p = c.plans.find((x) => x.tier === S.plan);
      if (!(await dialog('Submit this payment?', 'We will check ' + money(p.price) + ' against your screenshot, usually within 15 minutes. You can still cancel while it is Under Review.', 'Go back', 'Submit'))) return;
      const name = ui.co.file.name; ui.co.file = { busy: true, name: name }; $('#upl').innerHTML = uploadArea(ui.co.file); el.disabled = true; el.innerHTML = icon('loader', 20, 'spin') + 'Submitting…';
      await fakeUpload();
      if (!navigator.onLine) { ui.co.file = { ok: false, title: 'You’re offline.', text: 'Your screenshot was not sent. Connect to the internet and choose the file again.' }; render(); return; }
      const id = 'UT-' + S.nextId++; const now = Date.now();
      S.orders.unshift({ id, type: 'PLAN', title: p.name + ' Meal Plan', photo: '/food/thumb/img_8718.jpeg', status: 'UNDER_REVIEW', amount: p.price, startDate: nextMonday(), slot: '12:30 – 1:00 pm', details: 'Monthly lunch, Monday to Friday', whatsapp: ui.co.whatsapp, history: [{ status: 'SUBMITTED', at: now }, { status: 'UNDER_REVIEW', at: now + 1000 }] });
      S.settings.whatsapp = ui.co.whatsapp; S.demo.newUser = false; ui.co = null; save(); location.replace('#/submitted/' + id);
    }
    else if (a === 'wa-on') { const o = S.orders.find((x) => x.id === arg); if (o) o.whatsapp = true; S.settings.whatsapp = true; save(); toast('WhatsApp updates are on'); render(); }
    else if (a === 'filter') { ui.filter = arg; render(); }
    else if (a === 'cancel-order') {
      if (!(await dialog('Cancel this order?', 'We will stop checking your payment and delete your screenshot. If you already paid, we will call you about a refund.', 'Keep order', 'Cancel order', true))) return;
      const o = S.orders.find((x) => x.id === arg); const before = JSON.stringify(o); o.status = 'CANCELLED'; o.history.push({ status: 'CANCELLED', at: Date.now() }); save(); render();
      toast('Order ' + o.id + ' cancelled', 'Undo', () => { Object.assign(o, JSON.parse(before)); save(); render(); toast('Order restored'); });
    }
    else if (a === 'download') {
      el.disabled = true; el.innerHTML = icon('loader', 20, 'spin') + 'Saving…'; await sleep(700);
      const o = S.orders.find((x) => x.id === arg); const url = URL.createObjectURL(receiptPdf(o, S.user)); const link = document.createElement('a'); link.href = url; link.download = o.id + '-receipt.pdf'; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
      el.disabled = false; el.innerHTML = 'Download receipt (PDF)'; toast('Receipt saved to Downloads');
    }
    else if (a === 'send-fix') {
      const name = ui.fix.file.name; ui.fix.file = { busy: true, name: name }; $('#upl').innerHTML = uploadArea(ui.fix.file); el.disabled = true; el.innerHTML = icon('loader', 20, 'spin') + 'Sending…';
      await fakeUpload();
      const o = S.orders.find((x) => x.id === arg); o.status = 'UNDER_REVIEW'; delete o.reason; o.history.push({ status: 'UNDER_REVIEW', at: Date.now() }); ui.fix = null; save(); location.replace('#/resubmitted/' + o.id);
    }
    else if (a === 'lang') { S.lang = S.lang === 'ur' ? 'en' : 'ur'; save(); render(); toast(S.lang === 'ur' ? 'زبان اردو کر دی گئی' : 'Language set to English'); }
    else if (a === 'signout') { if (await dialog('Sign out?', 'You will need your mobile number and password to see your orders again.', 'Stay signed in', 'Sign out', true)) { S.signedIn = false; save(); location.hash = '#/welcome'; } }
    else if (a === 'switch') {
      const k = arg; const on = !ui.nt[k];
      if (k === 'push' && on && 'Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (err) { /* ignore */ } }
      ui.nt[k] = on; render();
    }
    else if (a === 'save-settings') { el.disabled = true; el.innerHTML = icon('loader', 20, 'spin') + 'Saving…'; await sleep(600); S.settings = Object.assign({}, ui.nt); save(); el.disabled = false; el.textContent = 'Save settings'; toast('Settings saved'); }
    else if (a === 'expire') { S.signedIn = false; S.sessionExpired = true; save(); location.hash = '#/orders'; }
    else if (a === 'approve' || a === 'reject') {
      const o = S.orders.find((x) => x.status === 'UNDER_REVIEW'); if (!o) { toast('No order is Under Review'); return; }
      if (a === 'approve') { o.status = 'CONFIRMED'; o.received = o.amount; o.history.push({ status: 'CONFIRMED', at: Date.now() }); if (!o.eventDate) o.eventDate = o.startDate; o.serving = o.serving || o.slot; }
      else { o.status = 'NEEDS_ATTENTION'; o.reason = 'The screenshot is blurry, so we could not read the amount.'; o.history.push({ status: 'NEEDS_ATTENTION', at: Date.now() }); o.eventDate = o.eventDate || o.startDate; }
      save(); toast(o.id + (a === 'approve' ? ' confirmed' : ' marked Needs Attention'));
    }
    else if (a === 'reset') { if (await dialog('Reset demo data?', 'All demo orders and settings go back to the start.', 'Keep data', 'Reset', true)) { try { localStorage.removeItem(KEY); } catch (err) { /* ignore */ } S = fresh(); ui = {}; location.hash = '#/welcome'; render(); } }
  });
  window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/checkout')) ui.co = location.hash.startsWith('#/signin') ? ui.co : null; render(); });
  window.addEventListener('online', () => { toast('You’re back online'); render(); });
  window.addEventListener('offline', () => render());
  render();
})();
