/* Azhariya — логика сайта: каталог, меню, вход и редактор администратора. */

// Пароль администратора (6 цифр). ВНИМАНИЕ: он виден всем, кто откроет код страницы.
// Это не настоящая защита. Для реальной админки нужна проверка на сервере.
var ADMIN_PIN = '650925';
var STORAGE_KEY = 'azhariya_site_v2';
var MAX_PRODUCTS = 24;

var CATS = ['Платья', 'Топы', 'Низ', 'Верхняя одежда'];
var TONES = ['', 'tone2', 'tone3'];

var DEFAULTS = {
  brand: 'Azhariya',
  city: 'Уржар, Казахстан',
  phone: '[+7 ___ ___ __ __]',
  instagram: '[@ваш_аккаунт]',
  instagramUrl: '',
  heroTitle: 'ТВОЙ СТИЛЬ. ТВОЯ ИСТОРИЯ.',
  heroSub: 'Женская одежда, которая подчёркивает твою индивидуальность',
  collTitle: 'КОЛЛЕКЦИЯ',
  collSub: 'Повседневная база. Лёгкая элегантность.',
  aboutTitle: 'БОЛЬШЕ, ЧЕМ МОДА',
  aboutText: 'Azhariya — это уверенность, индивидуальность и естественный стиль. Одежда, с которой каждый день становится особенным.',
  callText: 'Найди свой стиль. Сделай его своим.',
  products: [
    { id: 'p1', name: 'Повседневный комплект', price: 'XX 000 ₸', cat: 'Топы', tone: '', img: '' },
    { id: 'p2', name: 'Платье-комбинация миди', price: 'XX 000 ₸', cat: 'Платья', tone: 'tone2', img: '' },
    { id: 'p3', name: 'Классическая рубашка', price: 'XX 000 ₸', cat: 'Топы', tone: 'tone3', img: '' },
    { id: 'p4', name: 'Широкие брюки', price: 'XX 000 ₸', cat: 'Низ', tone: 'tone2', img: '' },
    { id: 'p5', name: 'Джинсы прямого кроя', price: 'XX 000 ₸', cat: 'Низ', tone: '', img: '' },
    { id: 'p6', name: 'Приталенное пальто', price: 'XX 000 ₸', cat: 'Верхняя одежда', tone: 'tone3', img: '' }
  ]
};

var site = load();
var currentCat = 'Все';
var isAdmin = false;
var lastFocus = null;
var pendingDelete = null;
var pendingReset = false;
var statusMsg = '';

function clone(o) { return JSON.parse(JSON.stringify(o)); }
function str(v, d) { return typeof v === 'string' ? v : d; }
function newId() { return 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36); }

function load() {
  var s = clone(DEFAULTS);
  try {
    var raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      var saved = JSON.parse(raw);
      Object.keys(DEFAULTS).forEach(function (k) {
        if (k !== 'products') s[k] = str(saved[k], s[k]);
      });
      if (Array.isArray(saved.products)) {
        s.products = saved.products.slice(0, MAX_PRODUCTS).map(function (p, i) {
          return {
            id: str(p.id, newId()),
            name: str(p.name, ''),
            price: str(p.price, ''),
            cat: CATS.indexOf(p.cat) >= 0 ? p.cat : CATS[0],
            tone: TONES.indexOf(p.tone) >= 0 ? p.tone : TONES[i % 3],
            img: /^data:image\//.test(p.img || '') ? p.img : ''
          };
        });
      }
    }
  } catch (e) { /* хранилище недоступно — значения по умолчанию */ }
  return s;
}

function save() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(site));
    return true;
  } catch (e) { return false; }
}

/* ---------- Подстановка текстов ---------- */
function computed() {
  return {
    eyebrow: 'Женская одежда · ' + site.city,
    copy: '© ' + new Date().getFullYear() + ' ' + site.brand + '. ' + site.city + '.'
  };
}

function applyText() {
  var extra = computed();
  document.querySelectorAll('[data-bind]').forEach(function (el) {
    var key = el.getAttribute('data-bind');
    var v = key in extra ? extra[key] : site[key];
    v = v == null ? '' : String(v);
    el.textContent = el.hasAttribute('data-upper') ? v.toUpperCase() : v;
  });
  var ig = document.getElementById('ig-link');
  if (ig) {
    var url = (site.instagramUrl || '').trim();
    if (/^https:\/\//i.test(url)) {
      ig.setAttribute('href', url);
      ig.setAttribute('target', '_blank');
      ig.setAttribute('rel', 'noopener');
    } else {
      ig.setAttribute('href', '#contact');
      ig.removeAttribute('target');
      ig.removeAttribute('rel');
    }
  }
  document.title = site.brand + ' — женская одежда, ' + site.city.split(',')[0];
}

/* ---------- Каталог ---------- */
function renderCats() {
  var box = document.getElementById('cats');
  box.innerHTML = '';
  ['Все'].concat(CATS).forEach(function (c) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cat' + (c === currentCat ? ' on' : '');
    b.textContent = c;
    b.setAttribute('aria-pressed', c === currentCat ? 'true' : 'false');
    b.addEventListener('click', function () { currentCat = c; renderCats(); renderGrid(); });
    box.appendChild(b);
  });
}

function renderGrid() {
  var grid = document.getElementById('grid');
  grid.innerHTML = '';
  var shown = 0;
  site.products.forEach(function (p) {
    if (currentCat !== 'Все' && p.cat !== currentCat) return;
    shown++;
    var card = document.createElement('article');
    card.className = 'card';

    var frame = document.createElement('div');
    frame.className = 'frame';
    var ph = document.createElement('div');
    ph.className = 'ph' + (p.tone ? ' ' + p.tone : '');
    if (p.img) {
      var img = document.createElement('img');
      img.src = p.img; img.alt = p.name; img.loading = 'lazy';
      ph.appendChild(img);
    } else {
      ph.setAttribute('role', 'img');
      ph.setAttribute('aria-label', 'Место для фотографии: ' + p.name);
      var sp = document.createElement('span');
      sp.textContent = 'Фото · ' + p.name;
      ph.appendChild(sp);
    }
    frame.appendChild(ph);

    var meta = document.createElement('div');
    meta.className = 'card-m';
    var h = document.createElement('h3'); h.className = 'card-n'; h.textContent = p.name;
    var pr = document.createElement('p'); pr.className = 'price'; pr.textContent = p.price;
    meta.appendChild(h); meta.appendChild(pr);

    var tag = document.createElement('p');
    tag.className = 'tag';
    tag.textContent = p.cat;

    var a = document.createElement('a');
    a.className = 'btn ghost sm';
    a.href = '#contact';
    a.textContent = 'Подробнее';

    card.appendChild(frame); card.appendChild(meta); card.appendChild(tag); card.appendChild(a);
    grid.appendChild(card);
  });
  if (!shown) {
    var empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = site.products.length
      ? 'В этой категории пока нет товаров.'
      : 'Каталог пуст. Войдите как администратор и добавьте первый товар.';
    grid.appendChild(empty);
  }
}

/* ---------- Мобильное меню ---------- */
var burger = document.getElementById('burger');
var mnav = document.getElementById('mnav');
burger.addEventListener('click', function () {
  var open = mnav.classList.toggle('open');
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
});
mnav.querySelectorAll('a').forEach(function (a) {
  a.addEventListener('click', function () {
    mnav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  });
});

/* ---------- Администратор ---------- */
var ovl = document.getElementById('adm');
var dlg = document.getElementById('dlg');
var loginBox = document.getElementById('adm-login');
var panelBox = document.getElementById('adm-panel');
var form = document.getElementById('adm-form');
var pinInput = document.getElementById('adm-pin');
var errEl = document.getElementById('adm-err');
var openBtn = document.getElementById('adm-open');
var resetBtn = document.getElementById('adm-reset');
var statusEl = document.getElementById('adm-status');

function setStatus(msg) {
  statusMsg = msg || '';
  if (statusEl) statusEl.textContent = statusMsg;
}

function showAdminView() {
  loginBox.hidden = isAdmin;
  panelBox.hidden = !isAdmin;
  dlg.classList.toggle('wide', isAdmin);
  dlg.setAttribute('aria-labelledby', isAdmin ? 'adm-h2' : 'adm-h');
  openBtn.textContent = isAdmin ? 'Редактор сайта' : 'Вход для администратора';
  if (isAdmin) buildFields();
}

function openAdmin() {
  lastFocus = document.activeElement;
  errEl.textContent = '';
  pinInput.value = '';
  pendingDelete = null;
  pendingReset = false;
  setStatus('');
  showAdminView();
  ovl.hidden = false;
  var target = isAdmin ? panelBox.querySelector('input,textarea,select') : pinInput;
  if (target) target.focus();
}

function closeAdmin() {
  ovl.hidden = true;
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

openBtn.addEventListener('click', openAdmin);
document.getElementById('adm-close').addEventListener('click', closeAdmin);
document.getElementById('adm-close2').addEventListener('click', closeAdmin);
ovl.addEventListener('mousedown', function (e) { if (e.target === ovl) closeAdmin(); });
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && !ovl.hidden) closeAdmin();
});

pinInput.addEventListener('input', function () {
  pinInput.value = pinInput.value.replace(/\D/g, '').slice(0, 6);
  errEl.textContent = '';
});

form.addEventListener('submit', function (e) {
  e.preventDefault();
  var pin = pinInput.value.trim();
  pinInput.value = '';
  if (!/^\d{6}$/.test(pin)) { errEl.textContent = 'Введите ровно 6 цифр'; return; }
  if (pin !== ADMIN_PIN) { errEl.textContent = 'Неверный пароль'; return; }
  isAdmin = true;
  showAdminView();
  var first = panelBox.querySelector('input,textarea,select');
  if (first) first.focus();
});

document.getElementById('adm-logout').addEventListener('click', function () {
  isAdmin = false;
  showAdminView();
  closeAdmin();
});

/* Сброс: подтверждение внутри страницы (confirm() в просмотре не работает) */
resetBtn.addEventListener('click', function () {
  if (!pendingReset) {
    pendingReset = true;
    resetBtn.textContent = 'Нажмите ещё раз для сброса';
    setStatus('Все тексты и товары вернутся к исходным. Фото будут удалены.');
    return;
  }
  site = clone(DEFAULTS);
  try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  pendingReset = false;
  pendingDelete = null;
  resetBtn.textContent = 'Сбросить к исходным';
  refresh();
  buildFields();
  setStatus('Сайт возвращён к исходным данным.');
});

/* Сжатие фото перед сохранением, чтобы поместиться в память браузера */
function readPhoto(file, cb) {
  if (!file || !/^image\//.test(file.type)) { cb(null, 'Выберите файл изображения.'); return; }
  var fr = new FileReader();
  fr.onerror = function () { cb(null, 'Не удалось прочитать файл.'); };
  fr.onload = function () {
    var im = new Image();
    im.onerror = function () { cb(null, 'Не удалось открыть изображение.'); };
    im.onload = function () {
      var max = 900;
      var k = Math.min(1, max / Math.max(im.width, im.height));
      var c = document.createElement('canvas');
      c.width = Math.round(im.width * k);
      c.height = Math.round(im.height * k);
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(im, 0, 0, c.width, c.height);
      cb(c.toDataURL('image/jpeg', 0.8));
    };
    im.src = fr.result;
  };
  fr.readAsDataURL(file);
}

/* Поля редактора */
function buildFields() {
  var box = document.getElementById('fields');
  box.innerHTML = '';

  function head(t, extra) {
    var h = document.createElement('h3'); h.className = 'gh'; h.textContent = t;
    if (extra) h.appendChild(extra);
    box.appendChild(h);
  }
  function field(id, label, value, multi, full, onChange, parent) {
    var wrap = document.createElement('div');
    wrap.className = 'fld' + (full ? ' full' : '');
    var l = document.createElement('label'); l.htmlFor = id; l.textContent = label;
    var inp = document.createElement(multi ? 'textarea' : 'input');
    inp.id = id; inp.className = 'inp';
    if (multi) inp.rows = 3; else inp.type = 'text';
    inp.value = value;
    inp.addEventListener('input', function () { onChange(inp.value); });
    wrap.appendChild(l); wrap.appendChild(inp);
    (parent || box).appendChild(wrap);
  }
  function top(key, id, label, multi, full) {
    field(id, label, site[key], multi, full, function (v) {
      site[key] = v;
      if (!save()) setStatus('Не удалось сохранить: память браузера недоступна.');
      refresh();
    });
  }

  head('Бренд и контакты');
  top('brand', 'f-brand', 'Название бренда', false, false);
  top('city', 'f-city', 'Локация', false, false);
  top('phone', 'f-phone', 'Телефон', false, false);
  top('instagram', 'f-ig', 'Instagram (как показать)', false, false);
  top('instagramUrl', 'f-igurl', 'Ссылка на Instagram (https://…)', false, true);
  head('Тексты сайта');
  top('heroTitle', 'f-ht', 'Заголовок главной', false, true);
  top('heroSub', 'f-hs', 'Подзаголовок главной', true, true);
  top('collTitle', 'f-ct', 'Заголовок коллекции', false, false);
  top('collSub', 'f-cs', 'Подзаголовок коллекции', false, false);
  top('aboutTitle', 'f-at', 'Заголовок «О бренде»', false, true);
  top('aboutText', 'f-ax', 'Текст «О бренде»', true, true);
  top('callText', 'f-call', 'Призыв', false, true);

  /* Каталог */
  var count = document.createElement('span');
  count.className = 'count';
  count.textContent = ' · ' + site.products.length + ' из ' + MAX_PRODUCTS;
  head('Каталог', count);

  site.products.forEach(function (p, i) {
    var item = document.createElement('div');
    item.className = 'prod full';
    var title = document.createElement('p');
    title.className = 'prod-t';
    title.textContent = 'Товар ' + (i + 1);
    item.appendChild(title);

    var row = document.createElement('div');
    row.className = 'prod-f';
    field('f-pn' + p.id, 'Название', p.name, false, false, function (v) {
      p.name = v; save(); renderGrid();
    }, row);
    field('f-pp' + p.id, 'Цена', p.price, false, false, function (v) {
      p.price = v; save(); renderGrid();
    }, row);

    var cw = document.createElement('div');
    cw.className = 'fld';
    var cl = document.createElement('label'); cl.htmlFor = 'f-pc' + p.id; cl.textContent = 'Категория';
    var sel = document.createElement('select');
    sel.id = 'f-pc' + p.id; sel.className = 'inp';
    CATS.forEach(function (c) {
      var o = document.createElement('option'); o.value = c; o.textContent = c;
      if (c === p.cat) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () { p.cat = sel.value; save(); renderGrid(); });
    cw.appendChild(cl); cw.appendChild(sel); row.appendChild(cw);

    var pw = document.createElement('div');
    pw.className = 'fld';
    var pl = document.createElement('label'); pl.htmlFor = 'f-pf' + p.id; pl.textContent = 'Фото';
    var file = document.createElement('input');
    file.type = 'file'; file.accept = 'image/*'; file.id = 'f-pf' + p.id; file.className = 'inp file';
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      setStatus('Загружаю фото…');
      readPhoto(f, function (data, err) {
        if (err) { setStatus(err); return; }
        var old = p.img;
        p.img = data;
        if (!save()) {
          p.img = old;
          setStatus('Фото слишком большое для памяти браузера. Попробуйте файл меньше.');
          return;
        }
        renderGrid();
        buildFields();
        setStatus('Фото сохранено.');
      });
    });
    pw.appendChild(pl); pw.appendChild(file); row.appendChild(pw);
    item.appendChild(row);

    var acts = document.createElement('div');
    acts.className = 'prod-a';
    if (p.img) {
      var thumb = document.createElement('img');
      thumb.className = 'thumb'; thumb.src = p.img; thumb.alt = 'Фото: ' + p.name;
      acts.appendChild(thumb);
      var rm = document.createElement('button');
      rm.type = 'button'; rm.className = 'btn ghost sm'; rm.textContent = 'Убрать фото';
      rm.addEventListener('click', function () {
        p.img = ''; save(); renderGrid(); buildFields(); setStatus('Фото убрано.');
      });
      acts.appendChild(rm);
    }
    function mover(label, delta) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'btn ghost sm'; b.textContent = label;
      var j = i + delta;
      if (j < 0 || j >= site.products.length) b.disabled = true;
      b.addEventListener('click', function () {
        var t = site.products[i]; site.products[i] = site.products[j]; site.products[j] = t;
        save(); renderGrid(); buildFields();
        var again = document.getElementById('f-pn' + p.id);
        if (again) again.focus();
      });
      return b;
    }
    acts.appendChild(mover('Выше', -1));
    acts.appendChild(mover('Ниже', 1));

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn ghost sm danger';
    del.textContent = pendingDelete === p.id ? 'Нажмите ещё раз, чтобы удалить' : 'Удалить товар';
    del.addEventListener('click', function () {
      if (pendingDelete !== p.id) {
        pendingDelete = p.id;
        buildFields();
        var again = Array.prototype.filter.call(document.querySelectorAll('.danger'), function (n) {
          return n.textContent.indexOf('ещё раз') >= 0;
        })[0];
        if (again) again.focus();
        return;
      }
      pendingDelete = null;
      site.products = site.products.filter(function (x) { return x.id !== p.id; });
      save(); renderGrid(); buildFields();
      setStatus('Товар удалён.');
    });
    acts.appendChild(del);
    item.appendChild(acts);
    box.appendChild(item);
  });

  var addWrap = document.createElement('div');
  addWrap.className = 'fld full';
  var add = document.createElement('button');
  add.type = 'button';
  add.className = 'btn';
  add.textContent = 'Добавить товар';
  if (site.products.length >= MAX_PRODUCTS) { add.disabled = true; add.textContent = 'Достигнут предел каталога'; }
  add.addEventListener('click', function () {
    var n = site.products.length;
    var p = { id: newId(), name: 'Новый товар', price: '0 ₸', cat: CATS[0], tone: TONES[n % 3], img: '' };
    site.products.push(p);
    save(); renderGrid(); buildFields();
    var inp = document.getElementById('f-pn' + p.id);
    if (inp) { inp.focus(); inp.select(); }
    setStatus('Товар добавлен. Измените название, цену и фото.');
  });
  addWrap.appendChild(add);
  box.appendChild(addWrap);

  if (statusEl) statusEl.textContent = statusMsg;
}

function refresh() {
  applyText();
  renderGrid();
}

/* ---------- Старт ---------- */
renderCats();
refresh();
