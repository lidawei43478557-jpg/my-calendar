/* 我的日历 — 无广告个人日历（公历 + 农历 + 节气节日 + 生日提醒）· 纯本地存储版 */
(function () {
  'use strict';

  var SOLAR = window.Solar, LUNAR = window.Lunar, LUNARYEAR = window.LunarYear, LUNARMONTH = window.LunarMonth;
  var MONTH_CN = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
  var DAY_CN = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
  /* 只显示这些节日，避免「世界住房日」这类冷门纪念日挤掉农历日期 */
  var FEST_OK = {
    '元旦': 1, '春节': 1, '元宵节': 1, '龙抬头': 1, '上巳节': 1, '端午节': 1, '七夕节': 1,
    '中元节': 1, '中秋节': 1, '重阳节': 1, '寒衣节': 1, '下元节': 1, '腊八节': 1, '除夕': 1,
    '妇女节': 1, '植树节': 1, '劳动节': 1, '青年节': 1, '儿童节': 1, '建党节': 1, '建军节': 1,
    '教师节': 1, '国庆节': 1, '万圣节': 1, '平安夜': 1, '圣诞节': 1,
    '母亲节': 1, '父亲节': 1, '情人节': 1, '感恩节': 1, '护士节': 1, '记者节': 1
  };
  var FEST_SHORT = { '劳动节': '劳动节', '国庆节': '国庆', '儿童节': '儿童节', '妇女节': '妇女节', '植树节': '植树节', '教师节': '教师节', '青年节': '青年节', '万圣节': '万圣节', '平安夜': '平安夜', '圣诞节': '圣诞', '元旦': '元旦', '春节': '春节', '元宵节': '元宵', '端午节': '端午', '中秋节': '中秋', '七夕节': '七夕', '中元节': '中元', '重阳节': '重阳', '腊八节': '腊八', '除夕': '除夕', '寒衣节': '寒衣节', '下元节': '下元节', '龙抬头': '龙抬头', '上巳节': '上巳节', '建党节': '建党节', '建军节': '建军节' };

  /* 国家历史纪念日：显示在日期下方（优先级低于传统节日与节气） */
  var HIST_DAYS = {
    '01-21': '列宁逝世纪念', '03-05': '学雷锋日', '04-24': '中国航天日',
    '05-04': '五四运动', '05-30': '科技工作者日', '07-07': '七七事变',
    '08-15': '日本投降', '09-03': '抗战胜利', '09-18': '九一八事变',
    '09-28': '孔子诞辰', '09-30': '烈士纪念日', '10-10': '辛亥革命',
    '10-25': '抗美援朝', '11-12': '孙中山诞辰', '12-09': '一二九运动',
    '12-13': '国家公祭日', '12-20': '澳门回归'
  };
  /* 法定节假日 / 调休补班：每年由国务院公布，没有公式，按年维护。
     显示规则（参考中华万年历）：休息日（周末 + 放假日期）标红「休」，
     调休补班日（通常为周末）标蓝「班」，班优先于休。
     2027 年及以后待国务院公布后再补；未维护的年份不显示角标。 */
  var HOLIDAYS = (function () {
    function pad2(n) { return n < 10 ? '0' + n : '' + n; }
    function rng(y, m, d1, d2) {
      var a = [];
      for (var d = d1; d <= d2; d++) a.push(y + '-' + pad2(m) + '-' + pad2(d));
      return a;
    }
    var raw = {
      2025: {
        rest: [].concat(
          ['2025-01-01'],                                   // 元旦（不调休）
          rng(2025, 1, 28, 31), rng(2025, 2, 1, 4),         // 春节 1/28(除夕)-2/4 共8天
          ['2025-04-04', '2025-04-05', '2025-04-06'],        // 清明
          rng(2025, 5, 1, 5),                               // 劳动 5/1-5/5 共5天
          ['2025-05-31', '2025-06-01', '2025-06-02'],        // 端午
          rng(2025, 10, 1, 8)                               // 国庆+中秋合并 10/1-10/8 共8天
        ),
        work: ['2025-01-26', '2025-02-08', '2025-04-27', '2025-09-28', '2025-10-11']
      },
      2026: {
        rest: [].concat(
          rng(2026, 1, 1, 3),                               // 元旦 1/1-1/3 共3天
          rng(2026, 2, 15, 23),                             // 春节（史上最长 9 天）
          ['2026-04-04', '2026-04-05', '2026-04-06'],        // 清明
          rng(2026, 5, 1, 5),                               // 劳动 5/1-5/5 共5天
          ['2026-06-19', '2026-06-20', '2026-06-21'],        // 端午
          ['2026-09-25', '2026-09-26', '2026-09-27'],        // 中秋
          rng(2026, 10, 1, 7)                               // 国庆 10/1-10/7 共7天
        ),
        work: ['2026-01-04', '2026-02-14', '2026-02-28', '2026-05-09', '2026-09-20', '2026-10-10']
      }
    };
    var map = {};
    Object.keys(raw).forEach(function (y) {
      var o = {};
      (raw[y].rest || []).forEach(function (d) { o[d] = 'rest'; });
      (raw[y].work || []).forEach(function (d) { o[d] = 'work'; }); // 班 覆盖 休
      map[y] = o;
    });
    return {
      flag: function (ds) {
        var y = ds.slice(0, 4);
        var val = null;
        var bo = map[y];
        if (bo && bo[ds]) val = bo[ds];           // 内置安排
        var u = USER_HOLIDAYS[y];                 // 用户手动录入（优先、可覆盖）
        if (u) {
          if (u.work && u.work.indexOf(ds) >= 0) val = 'work'; // 补班优先（班 > 休）
          else if (u.rest && u.rest.some(function (r) { return ds >= r.s && ds <= r.e; })) {
            if (val !== 'work') val = 'rest';
          }
        }
        return val; // 'work' | 'rest' | null
      }
    };
  })();
  /* ---------- 用户在设置页手动录入的节假日 ---------- */
  function saveUserHolidays() { try { lsSet(K.holidays, USER_HOLIDAYS); } catch (e) { } }
  function yearKey() { return String(($('hd-year') && $('hd-year').value) || new Date().getFullYear()); }
  function renderHolidayList() {
    var box = $('hd-list'); if (!box) return;
    var y = yearKey();
    var u = USER_HOLIDAYS[y] || { rest: [], work: [] };
    var html = '';
    (u.rest || []).forEach(function (r, i) {
      var name = r.n ? ('（' + esc(r.n) + '）') : '';
      html += '<div class="hd-list-item" data-kind="rest" data-i="' + i + '">' +
        '<span><span class="hd-tag rest">休</span>' + r.s + ' ~ ' + r.e + name + '</span>' +
        '<button type="button" data-act="del">删除</button></div>';
    });
    (u.work || []).forEach(function (d, i) {
      html += '<div class="hd-list-item" data-kind="work" data-i="' + i + '">' +
        '<span><span class="hd-tag work">班</span>' + d + '</span>' +
        '<button type="button" data-act="del">删除</button></div>';
    });
    box.innerHTML = html;
    var tip = $('hd-year-tip');
    if (tip) tip.textContent = ((u.rest && u.rest.length) || (u.work && u.work.length)) ? ('本页是 ' + y + ' 年已录入的安排') : ('2025/2026 已内置，' + y + ' 年请在此录入');
  }
  function addUserRest() {
    var y = yearKey();
    var s = ($('hd-rest-s') || {}).value, e = ($('hd-rest-e') || {}).value;
    var nSel = ($('hd-rest-n') || {}).value || '';
    var n = nSel;
    if (nSel === '其他（自定义）') n = (($('hd-rest-n-custom') || {}).value || '').trim();
    if (!s || !e) { toast('请先选起止日期'); return; }
    if (s > e) { var t = s; s = e; e = t; } // 顺序点反了也不怕
    if (!USER_HOLIDAYS[y]) USER_HOLIDAYS[y] = { rest: [], work: [] };
    if (!USER_HOLIDAYS[y].rest) USER_HOLIDAYS[y].rest = [];
    USER_HOLIDAYS[y].rest.push({ s: s, e: e, n: n });
    saveUserHolidays(); renderHolidayList(); renderCalendar();
    toast('已添加 ' + y + ' 放假区间');
  }
  function addUserWork() {
    var y = yearKey();
    var d = ($('hd-work-d') || {}).value;
    if (!d) { toast('请先选补班日期'); return; }
    if (!USER_HOLIDAYS[y]) USER_HOLIDAYS[y] = { rest: [], work: [] };
    if (!USER_HOLIDAYS[y].work) USER_HOLIDAYS[y].work = [];
    if (USER_HOLIDAYS[y].work.indexOf(d) < 0) USER_HOLIDAYS[y].work.push(d);
    saveUserHolidays(); renderHolidayList(); renderCalendar();
    toast('已添加 ' + y + ' 补班日期');
  }
  function delUserHoliday(kind, idx) {
    var y = yearKey();
    var u = USER_HOLIDAYS[y]; if (!u) return;
    if (kind === 'rest' && u.rest) u.rest.splice(idx, 1);
    if (kind === 'work' && u.work) u.work.splice(idx, 1);
    if (u.rest && !u.rest.length) delete u.rest;
    if (u.work && !u.work.length) delete u.work;
    if (!u.rest && !u.work) delete USER_HOLIDAYS[y];
    saveUserHolidays(); renderHolidayList(); renderCalendar();
  }
  function populateHolidayYears() {
    var sel = $('hd-year'); if (!sel) return;
    var cy = new Date().getFullYear();
    var html = '';
    // 与日历跨度同步：当前年往前 2 年 + 往后 28 年，共 30 年可选
    for (var y = cy - 2; y <= cy + 27; y++) {
      html += '<option value="' + y + '"' + (y === cy ? ' selected' : '') + '>' + y + ' 年</option>';
    }
    sel.innerHTML = html;
  }
  // 法定假日名称下拉（覆盖每年所有法定节假日），最后一项为自定义
  var HOLIDAY_NAMES = ['元旦', '春节', '清明节', '劳动节', '端午节', '中秋节', '国庆节', '除夕', '其他（自定义）'];
  function populateHolidayNames() {
    var sel = $('hd-rest-n'); if (!sel) return;
    sel.innerHTML = HOLIDAY_NAMES.map(function (n) {
      return '<option value="' + esc(n) + '">' + esc(n) + '</option>';
    }).join('');
  }
  /* 心情打卡：四种心情 + 显示色 */
  var MOODS = [
    { k: 'happy', e: '😄', n: '开心', c: '#f0a020' },
    { k: 'calm', e: '😌', n: '平静', c: '#3fa87a' },
    { k: 'tired', e: '😪', n: '疲惫', c: '#8a7fb8' },
    { k: 'bad', e: '😞', n: '糟糕', c: '#5b7fbd' }
  ];
  function moodOf(k) {
    for (var i = 0; i < MOODS.length; i++) if (MOODS[i].k === k) return MOODS[i];
    return null;
  }
  var ICS_YEARS = 30;   /* 农历生日导出到系统日历时，往后展开的年数 */
  var MAX_PHOTOS = 60;  /* 背景照片上限（受手机存储空间约束） */

  var state = {
    view: 'view-calendar',
    y: 0, m: 0, today: null, selected: '',
    notes: [], todos: [], birthdays: [], photos: [], moods: {},
    settings: { bg_mode: 'fixed', bg_interval: 30, mask_opacity: 0.35, card_opacity: 0.72, panel_style: 'glass' },
    curPhotoId: null, bgTimer: null, editBdId: null, bdType: 'solar',
    dayBirthdays: []
  };

  /* ---------- 运行环境检测 ----------
     资料库发布页是「外壳 + 跨域 iframe」。iOS Safari 会把第三方 iframe 的
     localStorage / IndexedDB 放进临时分区，关掉页面后可能被清掉（表现为
     「昨晚录的数据今早没了」），同时沙箱还拦掉了文件下载。
     解决办法是把应用提到顶层打开，届时存储、下载、定位、PWA 全部恢复正常。 */
  var ENV = { inFrame: false, storeOk: true };
  function detectEnv() {
    try { ENV.inFrame = (window.self !== window.top); } catch (e) { ENV.inFrame = true; }
    // 存储自检：写进去立刻读回来，读不到说明存储不可靠
    try {
      var k = '__mc_probe__';
      localStorage.setItem(k, '1');
      ENV.storeOk = localStorage.getItem(k) === '1';
      try { localStorage.removeItem(k); } catch (e) { }
    } catch (e) { ENV.storeOk = false; }
  }
  /* 完整版地址（真正跑在顶层的那份应用）。
     注意：资料库发布页是「外壳 + 跨域 iframe」，而平台给每个 HTML 注入了
     /page/page_comm/inject.js —— 只要 self === top 就把整页换成
     「🔒 Security Restriction(安全限制)」，所以 CDN 直链一进顶层就废。
     因此 iframe 里一律跳到独立托管的完整版域名。 */
  var FULL_APP_URL = 'https://lidawei43478557-jpg.github.io/my-calendar/';
  function topUrl() {
    var cfg = '';
    try { cfg = localStorage.getItem('mc.fullUrl') || ''; } catch (e) { }
    var m = (window.location.search || '').match(/[?&]full=([^&]+)/);
    if (m && m[1]) {
      try { cfg = decodeURIComponent(m[1]); localStorage.setItem('mc.fullUrl', cfg); } catch (e) { }
    }
    if (ENV.inFrame) return cfg || FULL_APP_URL || '';
    try { return window.location.href.split('#')[0]; } catch (e) { return ''; }
  }
  /* 二维码：iOS Safari 经常拦掉从 iframe 里发起的跳转，扫码是最稳的入口 */
  function hideQr() { var b = $('env-qr-box'); if (b) b.classList.add('hidden'); }
  function renderQr(text) {
    var box = $('env-qr-box'), el = $('env-qr');
    if (!box || !el || !text || typeof qrcode !== 'function') { hideQr(); return; }
    try {
      var qr = null;
      try { qr = qrcode(0, 'M'); qr.addData(text); qr.make(); } catch (e) { qr = null; }
      if (!qr) {
        for (var t = 1; t <= 20 && !qr; t++) {
          try { var q = qrcode(t, 'M'); q.addData(text); q.make(); qr = q; } catch (e) { }
        }
      }
      if (!qr) { hideQr(); return; }
      el.innerHTML = qr.createImgTag(4, 6);
      var img = el.getElementsByTagName('img')[0];
      if (img) { img.style.width = '148px'; img.style.height = '148px'; img.style.display = 'block'; }
      box.classList.remove('hidden');
    } catch (e) { hideQr(); }
  }
  function fullBase() {
    if (window.self !== window.top && FULL_APP_URL) return FULL_APP_URL;
    return topUrl();
  }
  function showEnvNotice() {
    var box = $('env-notice');
    if (!box) return;
    var link = $('env-notice-link'), copy = $('env-notice-copy'), btn = $('env-notice-btn'), url = $('env-notice-url');
    var msg = '', u = topUrl();
    if (ENV.inFrame) {
      msg = u
        ? '现在是「预览模式」（被套在别人的页面里）：数据可能保不住、文件也导不出，而且和完整版不互通。请用下面的方式打开完整版，以后就用它（可添加到主屏幕当 App）。'
        : '现在是「预览模式」（被套在别人的页面里）：数据可能保不住、文件也导不出。完整版请这样打开：① iPhone 上用离线单文件版（存到「文件」App，Safari 打开）；② 在家里电脑上双击「启动日历服务」，用手机扫二维码打开。';
      if (u && link) { link.href = u; link.classList.remove('hidden'); }
      if (copy) copy.classList.remove('hidden');
      if (btn) btn.classList.add('hidden');
      if (url) { url.textContent = u || ''; url.classList.remove('hidden'); }
      if (u) renderQr(u); else hideQr();
    } else if (!ENV.storeOk) {
      msg = '浏览器阻止了本机存储，现在的数据关掉就没了。请关闭「无痕模式」或允许网站存储后重试。';
      if (link) link.classList.add('hidden');
      if (copy) copy.classList.add('hidden');
      if (btn) { btn.textContent = '重新检测'; btn.classList.remove('hidden'); }
      if (url) url.classList.add('hidden');
      hideQr();
    } else {
      box.classList.add('hidden');
      hideQr();
      return;
    }
    $('env-notice-text').textContent = msg;
    box.classList.remove('hidden');
  }
  /* 不再用 window.open 脚本弹窗：iOS Safari / 各大 App 内置浏览器会把脚本弹窗
     判定为「Security Restriction」直接拦掉。改成真实的 <a target="_blank"> 链接，
     由用户手势触发，任何浏览器都不会拦；再配一个「复制地址」兜底。 */
  function copyText(t) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(function () { toast('地址已复制，去 Safari 新建标签粘贴打开'); }, fallback);
        return;
      }
    } catch (e) { }
    fallback();
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length);
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        toast(ok ? '地址已复制，去 Safari 新建标签粘贴打开' : '复制失败，请长按上方地址手动复制');
      } catch (e) { toast('复制失败，请长按上方地址手动复制'); }
    }
  }
  function enterFullMode() {
    // 只在「存储不可用」分支下作为「重新检测」使用
    detectEnv(); showEnvNotice();
    if (!ENV.inFrame && !ENV.storeOk) toast('还是不行的话，请关闭无痕模式或换个浏览器');
  }
  /* 把提示条变成「去顶层做某件事」的入口（导出文件等被沙箱拦掉的操作都走这里） */
  function offerTopLink(url, label, tip) {
    var box = $('env-notice'), link = $('env-notice-link');
    if (!box || !link) { toast(tip); return; }
    link.href = url; link.textContent = label; link.classList.remove('hidden');
    var c = $('env-notice-copy'); if (c) { c.dataset.url = url; c.classList.remove('hidden'); }
    var b = $('env-notice-btn'); if (b) b.classList.add('hidden');
    var u = $('env-notice-url'); if (u) { u.textContent = url.split('#')[0]; u.classList.remove('hidden'); }
    $('env-notice-text').textContent = tip;
    box.classList.remove('hidden');
  }

  /* ---------- 本地存储 ---------- */
  var K = {
    notes: 'mc.notes', todos: 'mc.todos', bds: 'mc.birthdays', moods: 'mc.moods',
    st: 'mc.settings', cur: 'mc.curPhoto',
    wcity: 'mc.weatherCity', wdata: 'mc.weatherData',
    holidays: 'mc.holidays'
  };
  /* 用户在 App 内手动录入的节假日（每年官方公布后自己填），存在本机 localStorage，
     与内置 HOLIDAYS 合并。结构：{ '2027': { rest: [{s,e,n}], work: ['2027-04-26', ...] }, ... } */
  var USER_HOLIDAYS = {};
  function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function lsGet(k, def) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { toast('本地存储空间不足，请先删掉一些照片'); return false; }
  }

  /* 照片用 IndexedDB（localStorage 只有 5MB，放不下照片） */
  var IDB = (function () {
    var dbp = null;
    function open() {
      if (dbp) return dbp;
      dbp = new Promise(function (res, rej) {
        var r = indexedDB.open('my-calendar', 1);
        r.onupgradeneeded = function () {
          var d = r.result;
          if (!d.objectStoreNames.contains('photos')) d.createObjectStore('photos', { keyPath: 'id' });
        };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error); };
      });
      return dbp;
    }
    function store(mode) { return open().then(function (d) { return d.transaction('photos', mode).objectStore('photos'); }); }
    function wrap(req) {
      return new Promise(function (res, rej) { req.onsuccess = function () { res(req.result); }; req.onerror = function () { rej(req.error); }; });
    }
    return {
      all: function () {
        return store('readonly').then(function (s) {
          if (s.getAll) return wrap(s.getAll());
          return new Promise(function (res, rej) {
            var out = [], c = s.openCursor();
            c.onsuccess = function () { if (c.result) { out.push(c.result.value); c.result.continue(); } else res(out); };
            c.onerror = function () { rej(c.error); };
          });
        });
      },
      put: function (rec) { return store('readwrite').then(function (s) { return wrap(s.put(rec)); }); },
      /* 一批照片只开一个事务，比逐张开快很多（尤其手机上） */
      putMany: function (recs) {
        return store('readwrite').then(function (s) {
          return new Promise(function (res, rej) {
            var tx = s.transaction;
            tx.oncomplete = function () { res(true); };
            tx.onerror = function () { rej(tx.error || new Error('写入失败')); };
            tx.onabort = function () { rej(tx.error || new Error('写入被中断')); };
            recs.forEach(function (r) { s.put(r); });
          });
        });
      },
      del: function (id) { return store('readwrite').then(function (s) { return wrap(s.delete(id)); }); },
      clear: function () { return store('readwrite').then(function (s) { return wrap(s.clear()); }); }
    };
  })();

  /* ---------- 工具 ---------- */
  function $(id) { return document.getElementById(id); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseYmd(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dayDiff(a, b) { return Math.round((b - a) / 86400000); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  var toastTimer = null;
  function toast(msg) {
    var t = $('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- 农历 / 节气 / 节日 ---------- */
  /* 日期下方那行小字的优先级：
     生日姓名 > 传统节日 > 节气 > 国家历史纪念日 > 农历日期 */
  function cellSub(y, m, d, bds) {
    if (bds && bds.length) {
      var names = bds.map(function (b) { return b.name; }).join('、');
      return { text: names, cls: 'bdname' };
    }
    try {
      var solar = SOLAR.fromYmd(y, m + 1, d);
      var lunar = solar.getLunar();
      var lf = pickFest(lunar.getFestivals() || []);
      var sf = pickFest(solar.getFestivals() || []);
      var jq = lunar.getJieQi() || '';
      if (lf) return { text: shortName(lf), cls: 'festival' };
      if (sf) return { text: shortName(sf), cls: 'festival' };
      // 历史纪念排在节气前面：像 7/7 七七事变常和小暑同一天，
      // 这种日子用户更想看到事变纪念（中华万年历也是这么排的）
      var hd = HIST_DAYS[pad(m + 1) + '-' + pad(d)];
      if (hd) return { text: hd, cls: 'hist' };
      if (jq) return { text: jq, cls: 'jieqi' };
      var dayIdx = Math.abs(lunar.getDay()) - 1;
      if (dayIdx <= 0) return { text: MONTH_CN[Math.abs(lunar.getMonth()) - 1] || '', cls: '' };
      return { text: DAY_CN[dayIdx] || '', cls: '' };
    } catch (e) { return { text: '', cls: '' }; }
  }
  function shortName(n) { return FEST_SHORT[n] || n; }
  function pickFest(list) {
    for (var i = 0; i < list.length; i++) { if (FEST_OK[list[i]]) return list[i]; }
    return '';
  }
  function lunarText(s) {
    try {
      var d = parseYmd(s), l = SOLAR.fromDate(d).getLunar();
      var lm = Math.abs(l.getMonth()), ld = Math.abs(l.getDay());
      return '农历' + (l.getMonth() < 0 ? '闰' : '') + MONTH_CN[lm - 1] + DAY_CN[ld - 1];
    } catch (e) { return ''; }
  }

  /* ---------- 生日换算 ---------- */
  function lunarMonthDays(y, m) {
    try { return LUNARMONTH.fromYm(y, m).getDayCount(); } catch (e) { return 30; }
  }
  function birthdaySolarForYear(bd, year) {
    try {
      if (bd.date_type === 'solar') {
        if (bd.month === 2 && bd.day === 29 && !isLeap(year)) return year + '-02-28';
        return year + '-' + pad(bd.month) + '-' + pad(bd.day);
      }
      var m = bd.month;
      if (bd.leap) {
        var lm = 0;
        try { lm = LUNARYEAR.fromYear(year).getLeapMonth(); } catch (e) { lm = 0; }
        m = (lm === bd.month) ? -bd.month : bd.month;
      }
      var day = bd.day;
      var max = lunarMonthDays(year, m);
      if (day > max) day = max;
      return LUNAR.fromYmd(year, m, day).getSolar().toYmd();
    } catch (e) { return null; }
  }
  function nextBirthday(bd) {
    var t = state.today;
    var thisY = t.getFullYear();
    var a = birthdaySolarForYear(bd, thisY);
    if (a && dayDiff(t, parseYmd(a)) >= 0) return { date: a, year: thisY };
    var b = birthdaySolarForYear(bd, thisY + 1);
    return b ? { date: b, year: thisY + 1 } : { date: a, year: thisY };
  }
  function ageOf(bd, targetYear) { return bd.birth_year ? targetYear - bd.birth_year : null; }
  function birthdaysOn(s) {
    return state.birthdays.filter(function (b) {
      var n = nextBirthday(b);
      return n && n.date === s;
    });
  }
  function notesOn(ds) { return state.notes.filter(function (n) { return n.note_date === ds; }); }
  function todosOn(ds) { return state.todos.filter(function (t) { return t.todo_date === ds; }); }

  /* ---------- 数据读写 ---------- */
  function loadAll() {
    state.notes = lsGet(K.notes, []);
    state.todos = lsGet(K.todos, []);
    state.birthdays = lsGet(K.bds, []);
    state.moods = lsGet(K.moods, {}) || {};
    state.settings = lsGet(K.st, { bg_mode: 'fixed', bg_interval: 30, mask_opacity: 0.35 });
    USER_HOLIDAYS = lsGet(K.holidays, {}) || {};
  }
  function saveNotes() { lsSet(K.notes, state.notes); }
  function saveTodos() { lsSet(K.todos, state.todos); }
  function saveBds() { lsSet(K.bds, state.birthdays); }
  function saveMoods() { lsSet(K.moods, state.moods); }
  function saveSettings(patch) {
    Object.keys(patch || {}).forEach(function (k) { state.settings[k] = patch[k]; });
    lsSet(K.st, state.settings);
  }
  async function loadPhotos() {
    try {
      var rows = await IDB.all();
      rows.sort(function (a, b) { return (a.created_at || 0) - (b.created_at || 0); });
      // 兼容旧版本存成 dataURL 的照片，并为每条生成 objectURL
      rows.forEach(function (p) {
        if (!p.blob && p.data && p.data.indexOf('data:') === 0) {
          try { p.blob = dataUrlToBlob(p.data); p.type = p.type || (p.blob.type || 'image/jpeg'); delete p.data; } catch (e) { }
        }
        photoUrl(p);
      });
      state.photos = rows.filter(function (p) { return p.blob || p._url; });
    } catch (e) { state.photos = []; }
    var saved = lsGet(K.cur, null);
    state.curPhotoId = (saved && state.photos.some(function (p) { return p.id === saved; }))
      ? saved : (state.photos.length ? state.photos[0].id : null);
  }

  /* ---------- 渲染：日历 ---------- */
  function renderCalendar() {
    var grid = $('cal-grid');
    $('cal-title').textContent = state.y + '年' + (state.m + 1) + '月';
    var first = new Date(state.y, state.m, 1);
    var startDow = (first.getDay() + 6) % 7;
    var daysInMonth = new Date(state.y, state.m + 1, 0).getDate();
    var prevDays = new Date(state.y, state.m, 0).getDate();
    var html = '';
    for (var i = 0; i < 42; i++) {
      var cy, cm, cd, out = false;
      if (i < startDow) { cy = state.m === 0 ? state.y - 1 : state.y; cm = state.m === 0 ? 11 : state.m - 1; cd = prevDays - startDow + i + 1; out = true; }
      else if (i >= startDow + daysInMonth) { var k = i - (startDow + daysInMonth) + 1; cy = state.m === 11 ? state.y + 1 : state.y; cm = state.m === 11 ? 0 : state.m + 1; cd = k; out = true; }
      else { cy = state.y; cm = state.m; cd = i - startDow + 1; }
      var ds = cy + '-' + pad(cm + 1) + '-' + pad(cd);
      var bds = out ? [] : birthdaysOn(ds);
      var sub = out ? { text: '', cls: '' } : cellSub(cy, cm, cd, bds);
      var isToday = ymd(state.today) === ds;
      var dow = (i % 7);
      var cls = 'day-cell' + (out ? ' out-month' : '') + (isToday ? ' today' : '') + (state.selected === ds ? ' selected' : '') + (dow >= 5 ? ' weekend' : '') + (bds.length ? ' has-bd' : '');
      var hasNote = notesOn(ds).length || todosOn(ds).length;
      var mo = out ? null : moodOf(state.moods[ds] || '');
      // 法定节假日角标：班 > 休；仅法定节假日标「休」，普通周末不标
      var hflag = HOLIDAYS.flag(ds);
      var flagChar = hflag === 'work' ? '班' : (hflag === 'rest' ? '休' : '');
      html += '<div class="' + cls + '" data-date="' + ds + '">' +
        '<div class="day-num">' + cd + '</div>' +
        '<div class="day-sub ' + sub.cls + '">' + esc(sub.text) + '</div>' +
        (bds.length ? '<div class="bd-dot">♥</div>' : '') +
        (flagChar ? '<div class="day-flag ' + (flagChar === '班' ? 'f-work' : 'f-rest') + '">' + flagChar + '</div>' : '') +
        (mo ? '<div class="day-mood">' + mo.e + '</div>' : '') +
        (hasNote ? '<div class="dot"></div>' : '') +
        '</div>';
      if (i >= startDow + daysInMonth && (i % 7) === 6) break;
    }
    grid.innerHTML = html;
    renderMoodCard();
  }

  /* ---------- 心情月历 ---------- */
  function renderMoodCard() {
    var box = $('mood-strip'), stat = $('mood-stat'), lab = $('mood-month');
    if (!box || !stat) return;
    if (lab) lab.textContent = (state.m + 1) + '月';
    var startDow = (new Date(state.y, state.m, 1).getDay() + 6) % 7;
    var days = new Date(state.y, state.m + 1, 0).getDate();
    var counts = { happy: 0, calm: 0, tired: 0, bad: 0 }, total = 0;
    var html = '';
    for (var i = 0; i < startDow; i++) html += '<div class="mood-day pad"></div>';
    for (var d = 1; d <= days; d++) {
      var ds = state.y + '-' + pad(state.m + 1) + '-' + pad(d);
      var mo = moodOf(state.moods[ds] || '');
      if (mo) { counts[mo.k]++; total++; }
      html += '<button type="button" class="mood-day' + (mo ? ' has' : '') + '" data-date="' + ds + '"' +
        (mo ? ' style="background:' + mo.c + '26"' : '') + '>' + (mo ? mo.e : '') + '</button>';
    }
    box.innerHTML = html;
    if (!total) { stat.innerHTML = '<div class="mood-empty">这个月还没打卡，点开任意日期选个表情就行</div>'; return; }
    var sh = '', top = null;
    MOODS.forEach(function (m) {
      if (counts[m.k]) sh += '<span class="mood-chip">' + m.e + ' ' + m.n + ' <b>' + counts[m.k] + '</b> 天</span>';
      if (!top || counts[m.k] > counts[top]) top = m.k;
    });
    if (top) sh += '<span class="mood-chip">本月主调 <b>' + moodOf(top).n + '</b></span>';
    stat.innerHTML = sh;
  }
  function renderMoodPick() {
    var pick = $('mood-pick'); if (!pick) return;
    var cur = state.moods[state.selected] || '';
    Array.prototype.forEach.call(pick.querySelectorAll('.mood-btn'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-m') === cur);
    });
  }

  function renderBanner() {
    var b = $('banner');
    var list = birthdaysOn(ymd(state.today));
    if (!list.length) { b.classList.add('hidden'); return; }
    var names = list.map(function (x) { return x.name; }).join('、');
    var extra = list.map(function (x) { var n = nextBirthday(x); var a = ageOf(x, n.year); return a ? '（' + a + '岁）' : ''; });
    b.textContent = '今天是 ' + names + extra[0] + ' 的生日';
    b.classList.remove('hidden');
  }

  /* ---------- 渲染：日期详情 ---------- */
  function openSheet(ds) {
    state.selected = ds;
    state.dayBirthdays = birthdaysOn(ds);
    renderCalendar();
    $('sheet-date').textContent = ds.replace(/-/g, '.');
    var lt = lunarText(ds);
    var jq = '';
    try { jq = SOLAR.fromDate(parseYmd(ds)).getLunar().getJieQi() || ''; } catch (e) { }
    var fes = '';
    try {
      var so = SOLAR.fromDate(parseYmd(ds));
      fes = pickFest(so.getLunar().getFestivals() || []) || pickFest(so.getFestivals() || []);
    } catch (e) { }
    $('sheet-lunar').textContent = [lt, jq, fes].filter(Boolean).join(' · ');
    renderMoodPick();
    renderDayItems();
    $('sheet-mask').classList.remove('hidden');
    $('day-sheet').classList.remove('hidden');
  }
  function closeSheet() {
    $('sheet-mask').classList.add('hidden');
    $('day-sheet').classList.add('hidden');
    state.selected = '';
    renderCalendar();
  }
  function renderDayItems() {
    var ds = state.selected;
    var notes = notesOn(ds), todos = todosOn(ds);
    var nh = '';
    if (state.dayBirthdays.length) {
      nh += '<div class="item-row" style="border:none;color:var(--orange)">♥ ' +
        esc(state.dayBirthdays.map(function (b) { return b.name; }).join('、')) + ' 生日</div>';
    }
    if (!notes.length && !state.dayBirthdays.length) nh = '<div class="empty-hint">这天还没有记事</div>';
    notes.forEach(function (n) {
      nh += '<div class="item-row" data-id="' + n.id + '"><span class="txt">' + esc(n.content) + '</span>' +
        '<button type="button" class="op edit" data-act="edit-note">改</button>' +
        '<button type="button" class="op" data-act="del-note">删</button></div>';
    });
    $('note-list').innerHTML = nh;

    var th = todos.length ? '' : '<div class="empty-hint">这天还没有待办</div>';
    todos.forEach(function (t) {
      th += '<div class="item-row' + (t.done ? ' done' : '') + '" data-id="' + t.id + '">' +
        '<input type="checkbox"' + (t.done ? ' checked' : '') + ' data-act="toggle-todo">' +
        '<span class="txt">' + esc(t.content) + '</span>' +
        '<button type="button" class="op" data-act="del-todo">删</button></div>';
    });
    $('todo-list').innerHTML = th;
  }

  /* ---------- 渲染：生日列表 ---------- */
  /* 按姓名生成稳定的头像色，避免所有头像一个色 */
  var AVA_COLORS = ['#d9534f', '#e08a2e', '#3b8ac4', '#4a9d7f', '#8a6bbf', '#c2608f', '#5a7d9a', '#b5843c'];
  function avaColor(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return AVA_COLORS[h % AVA_COLORS.length];
  }
  function renderBirthdays() {
    var list = state.birthdays.slice().map(function (b) {
      var n = nextBirthday(b);
      return { b: b, date: n.date, year: n.year, days: dayDiff(state.today, parseYmd(n.date)) };
    }).sort(function (a, c) { return a.days - c.days; });

    if (!list.length) { $('bd-list').innerHTML = '<div class="bd-empty">还没有生日记录，点右上角添加</div>'; return; }
    var html = '';
    list.forEach(function (it) {
      var b = it.b;
      var orig = b.date_type === 'lunar'
        ? ('农历' + (b.leap ? '闰' : '') + MONTH_CN[b.month - 1] + DAY_CN[b.day - 1])
        : (b.month + '月' + b.day + '日');
      var solarStr = it.date.slice(5).replace('-', '月') + '日';
      var a = ageOf(b, it.year);
      var cnt = it.days === 0 ? '就是今天' : ('还有 ' + it.days + ' 天');
      html += '<div class="bd-item">' +
        '<div class="bd-ava" style="background:' + avaColor(b.name) + '">' + esc(b.name.slice(0, 1)) + '</div>' +
        '<div class="bd-info">' +
        '<div class="bd-name">' + esc(b.name) + '<span class="badge ' + b.date_type + '">' + (b.date_type === 'lunar' ? '农历' : '公历') + '</span></div>' +
        '<div class="bd-meta">' + esc(orig) + ' · 今年 ' + solarStr + (a ? ' · ' + a + '岁' : '') + '</div>' +
        '<div class="bd-actions"><button type="button" data-act="ics" data-id="' + b.id + '">导出到系统日历</button>' +
        '<button type="button" data-act="edit-bd" data-id="' + b.id + '">编辑</button>' +
        '<button type="button" class="del" data-act="del-bd" data-id="' + b.id + '">删除</button></div>' +
        '</div>' +
        '<div class="bd-right"><div class="bd-count' + (it.days === 0 ? ' is-today' : '') + '">' + cnt + '</div></div>' +
        '</div>';
    });
    $('bd-list').innerHTML = html;
  }

  /* ---------- 生日编辑 ---------- */
  function fillBdSelects() {
    var ms = $('bd-month'), ds = $('bd-day');
    var mh = '', dh = '';
    if (state.bdType === 'lunar') {
      for (var i = 1; i <= 12; i++) mh += '<option value="' + i + '">' + MONTH_CN[i - 1] + '</option>';
    } else {
      for (var j = 1; j <= 12; j++) mh += '<option value="' + j + '">' + j + '月</option>';
    }
    for (var k = 1; k <= 31; k++) {
      var lb = state.bdType === 'lunar' ? (DAY_CN[k - 1] || (k + '日')) : (k + '日');
      dh += '<option value="' + k + '">' + lb + '</option>';
    }
    ms.innerHTML = mh; ds.innerHTML = dh;
    $('bd-leap-row').classList.toggle('hidden', state.bdType !== 'lunar');
    updateBdPreview();
  }
  function updateBdPreview() {
    var m = +$('bd-month').value, d = +$('bd-day').value, leap = $('bd-leap').checked;
    var name = $('bd-name').value.trim() || 'TA';
    var tmp = { date_type: state.bdType, month: m, day: d, leap: leap, name: name };
    var s = birthdaySolarForYear(tmp, state.today.getFullYear());
    if (!s) { $('bd-preview').textContent = ''; return; }
    var extra = '';
    if (state.bdType === 'lunar' && leap) {
      var lm = 0; try { lm = LUNARYEAR.fromYear(state.today.getFullYear()).getLeapMonth(); } catch (e) { }
      extra = (lm === m) ? '' : '（今年无闰' + MONTH_CN[m - 1] + '，按' + MONTH_CN[m - 1] + '算）';
    }
    $('bd-preview').textContent = '今年对应公历：' + s + extra;
  }
  function openBdModal(bd) {
    state.editBdId = bd ? bd.id : null;
    $('bd-modal-title').textContent = bd ? '编辑生日' : '添加生日';
    $('bd-name').value = bd ? bd.name : '';
    $('bd-year').value = bd && bd.birth_year ? bd.birth_year : '';
    state.bdType = bd ? bd.date_type : 'solar';
    segSet('seg-bdtype', state.bdType);
    fillBdSelects();
    if (bd) { $('bd-month').value = bd.month; $('bd-day').value = bd.day; $('bd-leap').checked = !!bd.leap; }
    updateBdPreview();
    $('bd-del').classList.toggle('hidden', !bd);
    $('bd-ics').classList.toggle('hidden', !bd);
    $('bd-mask').classList.remove('hidden');
    $('bd-modal').classList.remove('hidden');
  }
  function closeBdModal() { $('bd-mask').classList.add('hidden'); $('bd-modal').classList.add('hidden'); }

  /* ---------- .ics 导出 ---------- */
  function compactYmd(s) { return s.replace(/-/g, ''); }
  function icsEscape(s) { return String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n'); }
  function buildIcs(bd) {
    var stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    var title = bd.name + '的生日';
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//我的日历//ZH', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:' + icsEscape(title)];
    function ev(uid, date, summary) {
      return ['BEGIN:VEVENT', 'UID:' + uid, 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + compactYmd(date),
        'SUMMARY:' + icsEscape(summary), 'TRANSP:TRANSPARENT',
        'BEGIN:VALARM', 'TRIGGER;RELATED=START:PT9H', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(summary), 'END:VALARM',
        'END:VEVENT'];
    }
    if (bd.date_type === 'solar') {
      var d0 = bd.month === 2 && bd.day === 29 ? bd.birth_year || 2000 : state.today.getFullYear();
      var base = birthdaySolarForYear(bd, d0);
      L = L.concat(ev('bd-' + bd.id + '@mycalendar', base, title));
      L.push('RRULE:FREQ=YEARLY');
    } else {
      var y0 = state.today.getFullYear();
      for (var i = 0; i < ICS_YEARS; i++) {
        var y = y0 + i, dd = birthdaySolarForYear(bd, y);
        if (dd) L = L.concat(ev('bd-' + bd.id + '-' + y + '@mycalendar', dd, title));
      }
    }
    L.push('END:VCALENDAR');
    return L.join('\r\n');
  }
  /* 真正执行下载（只有在顶层页面调用才有效） */
  function doDownload(name, text, mime, bom) {
    var blob = new Blob([bom ? '\ufeff' + text : text], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () {
      try { document.body.removeChild(a); } catch (e) { }
      URL.revokeObjectURL(url);
    }, 2000);
  }
  var DOWNLOAD_KEY = 'mc.pendingDownload';
  /* bom=true 才加 UTF-8 BOM（.ics 导入 iOS 日历需要）；JSON 备份绝不能加，否则 JSON.parse 会失败 */
  function downloadFile(name, text, mime, bom) {
    if (window.self !== window.top) {
      /* 预览外壳的 iframe 沙箱没有 allow-downloads，blob 下载会被拦，
         表现为 iOS 上「WebKitBlobResource 错误 1」。
         把要下载的内容带着一起切到顶层，由顶层完成下载。 */
      var payload = '';
      try { payload = JSON.stringify({ n: name, t: text, m: mime, b: !!bom }); } catch (e) { }
      try { sessionStorage.setItem(DOWNLOAD_KEY, payload); } catch (e) { }
      var base = fullBase();
      if (!base) { toast('预览模式导不出文件，请在完整版里导出'); return; }
      var url = base, ok = false;
      try {
        var enc = encodeURIComponent(btoa(unescape(encodeURIComponent(payload))));
        if (enc.length < 8000) { url = base + '#dl=' + enc; ok = true; }
      } catch (e) { }
      offerTopLink(url, '下载「' + name + '」',
        ok ? '预览模式不能直接下载文件。点下面的按钮，会在完整版里自动开始下载。'
           : '预览模式装不下这个文件。点下面的按钮进完整版，在那边重新导出一次（完整版的数据才是你自己那份）。');
      return;
    }
    doDownload(name, text, mime, bom);
  }
  /* 顶层启动时，把从 iframe 带过来的下载任务完成掉 */
  function flushPendingDownload() {
    var payload = '';
    try {
      var h = location.hash || '';
      var m = h.match(/#dl=(.*)$/);
      if (m && m[1]) {
        payload = decodeURIComponent(escape(atob(decodeURIComponent(m[1]))));
        try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
      } else {
        payload = sessionStorage.getItem(DOWNLOAD_KEY) || '';
      }
      if (payload) { try { sessionStorage.removeItem(DOWNLOAD_KEY); } catch (e) { } }
    } catch (e) { payload = ''; }
    if (!payload) return;
    try {
      var p = JSON.parse(payload);
      if (p && p.n && p.t) {
        setTimeout(function () { doDownload(p.n, p.t, p.m || 'text/plain', !!p.b); toast('已导出「' + p.n + '」'); }, 600);
      }
    } catch (e) { }
  }
  function downloadIcs(bd) {
    downloadFile(bd.name + '的生日.ics', buildIcs(bd), 'text/calendar;charset=utf-8', true);
    toast('已导出，用「文件」App 打开即可导入日历');
  }

  /* ---------- 背景照片（支持 GIF 动图） ---------- */
  /* 动图必须保留原始文件，canvas 压缩只会拿到第一帧、动画会丢 */
  function isAnimated(file) {
    return /gif$/i.test(file.type) || /\.gif$/i.test(file.name || '');
  }
  /* iPhone 默认拍出来是 HEIC/HEIF。这种格式在 iOS Safari 上能显示，但用 canvas
     重编码成 JPEG（drawImage → toBlob）会卡死/失败，表现为「选完点✔后一直转、啥都不加」。
     所以 HEIC 也像 GIF 一样直接存原文件，不重编码。 */
  function isHeic(file) {
    var t = (file.type || '').toLowerCase();
    return t === 'image/heic' || t === 'image/heif' ||
      /\.(heic|heif)$/i.test(file.name || '');
  }
  /* 给上传加上硬超时：任何一步（图片解码 / canvas 导出）卡住时，N 秒后直接判失败，
     而不是让整批照片一直挂着（iOS 上最容易因此「等几分钟后什么都没加」）。 */
  function withTimeout(ms, label, p) {
    return new Promise(function (res, rej) {
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; rej(new Error(label || '处理超时')); } }, ms);
      p.then(function (v) { if (!done) { done = true; clearTimeout(t); res(v); } },
        function (e) { if (!done) { done = true; clearTimeout(t); rej(e); } });
    });
  }
  /* iPhone 上原来用 dataURL 解码，一张 1200 万像素的照片会先变成十几 MB 的字符串，
     连传几张就把 Safari 内存吃光，后面的照片全部静默失败（表现为「只能传 3 张」）。
     改成 objectURL 直接给 <img>，用完立刻回收 —— 内存占用降一个数量级。 */
  function compressToBlob(file, maxSide, quality) {
    return withTimeout(10000, '图片解码超时', new Promise(function (res, rej) {
      var url = '';
      try { url = URL.createObjectURL(file); } catch (e) { }
      if (!url) { rej(new Error('无法读取文件')); return; }
      var q = quality || 0.72;
      var img = new Image();
      function cleanup(cv) {
        try { URL.revokeObjectURL(url); } catch (e) { }
        try { img.src = ''; } catch (e) { }
        try { if (cv) { cv.width = cv.height = 0; } } catch (e) { }
      }
      img.onload = function () {
        var cv = null;
        try {
          var w = img.width, h = img.height;
          var sc = Math.min(1, maxSide / Math.max(w, h));
          var cw = Math.max(1, Math.round(w * sc)), ch = Math.max(1, Math.round(h * sc));
          cv = document.createElement('canvas');
          cv.width = cw; cv.height = ch;
          cv.getContext('2d').drawImage(img, 0, 0, cw, ch);
          if (cv.toBlob) {
            cv.toBlob(function (b) { cleanup(cv); b ? res(b) : rej(new Error('压缩失败')); }, 'image/jpeg', q);
          } else {
            var out = dataUrlToBlob(cv.toDataURL('image/jpeg', q));
            cleanup(cv); res(out);
          }
        } catch (e) { cleanup(cv); rej(e); }
      };
      img.onerror = function () { cleanup(null); rej(new Error('图片解码失败')); };
      img.src = url;
    }));
  }
  /* 失败就降一档规格再试一次，还不行才跳过 */
  async function compressWithFallback(file) {
    try { return await compressToBlob(file, 1024, 0.72); }
    catch (e) {
      try { return await compressToBlob(file, 800, 0.62); }
      catch (e2) { throw e; }
    }
  }
  /* HEIC/HEIF 转成小尺寸 JPEG：
     - 旧方案直接存原文件，单张 1.5~4MB，传几张就把 iOS 的本地存储配额(IndexedDB)撑爆，
       之后所有写入全部失败、再也传不进去（用户反馈「8张失败→5张成功→2张失败→1张失败→再传不了」正是这个）。
     - 用 createImageBitmap 解码 HEIC（iOS 13+ 支持，且不会像 <img> 那样卡死），再画到 canvas 导成
       1280px / 0.8 的 JPEG，单张降到 100~300KB，配额问题消失。
     - 整段包超时：万一某一步卡住，8 秒后退回「存原文件」兜底，绝不卡 UI。 */
  async function heicToJpeg(file) {
    try {
      var bmp = await withTimeout(8000, 'HEIC 解码超时',
        createImageBitmap ? createImageBitmap(file, { imageOrientation: 'from-image' }) : Promise.reject(new Error('不支持')));
      try {
        var w = bmp.width, h = bmp.height;
        var maxSide = 1280, q = 0.8;
        var sc = Math.min(1, maxSide / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * sc)), ch = Math.max(1, Math.round(h * sc));
        var cv = document.createElement('canvas');
        cv.width = cw; cv.height = ch;
        cv.getContext('2d').drawImage(bmp, 0, 0, cw, ch);
        var blob = await withTimeout(8000, 'HEIC 导出超时', new Promise(function (res, rej) {
          cv.toBlob(function (b) { b ? res(b) : rej(new Error('HEIC 导出失败')); }, 'image/jpeg', q);
        }));
        return blob;
      } finally {
        try { if (bmp.close) bmp.close(); } catch (e) { }
        try { cv.width = cv.height = 0; } catch (e) { }
      }
    } catch (e) {
      return null; // 转不动就交回调用方存原文件兜底
    }
  }
  /* 判断是不是「本地存储已满」这类错误，给出明确的用户提示 */
  function isQuotaError(e) {
    var m = String((e && (e.name || e.message || '')) || '');
    return /quota|QuotaExceeded|NS_ERROR_DOM_QUOTA|storage/i.test(m) || (e && e.code === 22);
  }
  function dataUrlToBlob(u) {
    var p = u.split(','), mime = (p[0].match(/:(.*?);/) || [])[1] || 'image/jpeg';
    var bin = atob(p[1]), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  function blobToDataUrl(b) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () { res(fr.result); };
      fr.onerror = function () { rej(new Error('读取失败')); };
      fr.readAsDataURL(b);
    });
  }
  /* objectURL 统一在这里管理，避免重复创建导致内存泄漏 */
  function photoUrl(p) {
    if (!p) return '';
    if (!p._url) {
      if (p.blob) p._url = URL.createObjectURL(p.blob);
      else if (p.data) p._url = p.data; // 兼容旧版本存的 dataURL
    }
    return p._url || '';
  }
  function releasePhotoUrls() {
    state.photos.forEach(function (p) {
      if (p._url && p._url.indexOf('blob:') === 0) { try { URL.revokeObjectURL(p._url); } catch (e) { } }
      p._url = null;
    });
  }
  function setBgPhoto(p) {
    if (!p) { $('bg-layer').style.backgroundImage = ''; return; }
    $('bg-layer').style.backgroundImage = 'url("' + photoUrl(p) + '")';
  }
  function stopCarousel() { clearInterval(state.bgTimer); state.bgTimer = null; }
  function applyBackground() {
    stopCarousel();
    $('bg-mask').style.opacity = state.settings.mask_opacity;
    if (!state.photos.length) { $('bg-layer').style.backgroundImage = ''; return; }
    var cur = state.photos.filter(function (p) { return p.id === state.curPhotoId; })[0] || state.photos[0];
    state.curPhotoId = cur.id;
    if (state.settings.bg_mode === 'carousel' && state.photos.length > 1) {
      var idx = state.photos.indexOf(cur);
      setBgPhoto(cur);
      state.bgTimer = setInterval(function () {
        idx = (idx + 1) % state.photos.length;
        var p = state.photos[idx]; state.curPhotoId = p.id;
        setBgPhoto(p);
      }, state.settings.bg_interval * 1000);
    } else {
      setBgPhoto(cur);
    }
  }
  function renderThumbs() {
    var box = $('bg-thumbs');
    var cnt = $('photo-count');
    if (cnt) cnt.textContent = state.photos.length ? ('已上传 ' + state.photos.length + ' / ' + MAX_PHOTOS + ' 张') : '';
    if (!state.photos.length) { box.innerHTML = '<div class="bg-empty">还没有上传照片</div>'; $('sel-current').innerHTML = ''; return; }
    var html = '', opts = '';
    for (var i = 0; i < state.photos.length; i++) {
      var p = state.photos[i];
      html += '<div class="bg-thumb"><img src="' + photoUrl(p) + '" alt="">' +
        (p.anim ? '<span class="gif-mark">GIF</span>' : '') +
        (p.id === state.curPhotoId ? '<span class="cur-mark">当前</span>' : '') +
        '<button type="button" class="rm" data-act="rm-bg" data-id="' + p.id + '">✕</button></div>';
      opts += '<option value="' + p.id + '"' + (p.id === state.curPhotoId ? ' selected' : '') + '>' +
        (p.anim ? '动图 ' : '照片 ') + (i + 1) + '</option>';
    }
    box.innerHTML = html;
    $('sel-current').innerHTML = opts;
  }
  async function uploadPhotos(files) {
    if (!files || !files.length) return;
    var ok = 0, gif = 0, skip = 0, why = [];
    function reason(s) { if (why.indexOf(s) < 0) why.push(s); }
    var CHUNK = 3; // 每 3 张写一次库并刷新一次缩略图，既省事务开销又能看到进度
    for (var start = 0; start < files.length; start += CHUNK) {
      var slice = Array.prototype.slice.call(files, start, start + CHUNK);
      var batch = [];
      for (var j = 0; j < slice.length; j++) {
        var f = slice[j];
        if (state.photos.length + batch.length >= MAX_PHOTOS) { reason('最多 ' + MAX_PHOTOS + ' 张，先删几张再传'); break; }
        if (!f) { skip++; continue; }
        if (!/^image\//.test(f.type)) { skip++; reason('有文件不是图片'); continue; }
        var anim = isAnimated(f);
        if (f.size > (anim ? 25 : 20) * 1024 * 1024) { skip++; reason('单张' + (anim ? '动图' : '照片') + '需小于 ' + (anim ? 25 : 20) + 'MB'); continue; }
        try {
          var blob, isGif = anim;
          if (anim) {
            blob = f; // 动图必须保留原文件
          } else if (isHeic(f)) {
            var conv = await heicToJpeg(f); // 优先转成小 JPEG，避免原文件太大撑爆本地存储
            blob = (conv && conv.size) ? conv : f; // 转不动才退回到存原文件
          } else {
            blob = await compressWithFallback(f); // 普通照片压缩到 1024px
          }
          var rec = { id: genId(), blob: blob, type: blob.type || f.type, name: f.name || '', anim: isGif, created_at: Date.now() };
          batch.push(rec);
          // 给浏览器一点喘息时间回收内存，连传时更稳（iOS Safari 内存吃紧的关键缓冲）
          await new Promise(function (r) { setTimeout(r, 120); });
        } catch (e) {
          skip++;
          if (isQuotaError(e)) reason('手机存储空间已满，先删几张照片');
          else reason('第 ' + (start + j + 1) + ' 张处理失败');
        }
      }
      if (batch.length) {
        try {
          await IDB.putMany(batch);
          // 只有真正写库成功，才并入内存并刷新 —— 否则会出现「内存里有、库里没有」的脏状态，
          // 还会让后续的写入判断失真。写失败时释放这批 objectURL，避免内存泄漏。
          batch.forEach(function (rec) {
            rec._url = URL.createObjectURL(rec.blob);
            state.photos.push(rec);
            ok++; if (rec.anim) gif++;
          });
          if (!state.curPhotoId && state.photos.length) { state.curPhotoId = state.photos[0].id; lsSet(K.cur, state.curPhotoId); }
          renderThumbs(); applyBackground(); updateUsage();
        } catch (e) {
          batch.forEach(function (rec) { if (rec._url) { try { URL.revokeObjectURL(rec._url); } catch (x) { } rec._url = null; } });
          if (isQuotaError(e)) reason('手机本地存储空间已满，请到设置里删掉几张背景照片后再传');
          else reason('保存到本地失败，请重试');
        }
      }
    }
    if (ok) {
      toast('已添加 ' + ok + ' 张' + (gif ? '（含 ' + gif + ' 张动图）' : '') + '，共 ' + state.photos.length + ' 张' +
        (why.length ? '；' + why.join('、') : ''));
    } else {
      toast(why.length ? why.join('、') : '没有可用的图片');
    }
  }
  async function removePhoto(id) {
    var p = state.photos.filter(function (x) { return x.id === id; })[0];
    if (p && p._url && p._url.indexOf('blob:') === 0) { try { URL.revokeObjectURL(p._url); } catch (e) { } }
    try { await IDB.del(id); } catch (e) { }
    await loadPhotos(); renderThumbs(); applyBackground(); updateUsage();
  }

  /* ---------- 备份 / 恢复 ---------- */
  async function exportBackup() {
    toast('正在打包备份…');
    // 照片是 Blob，JSON 只能装文本，逐张转成 dataURL
    var photos = [];
    for (var i = 0; i < state.photos.length; i++) {
      var p = state.photos[i];
      try {
        photos.push({
          id: p.id, anim: !!p.anim, type: p.type || '', name: p.name || '',
          created_at: p.created_at || 0,
          data: p.blob ? await blobToDataUrl(p.blob) : (p.data || '')
        });
      } catch (e) { }
    }
    var data = {
      app: 'my-calendar', v: 2, exported_at: new Date().toISOString(),
      notes: state.notes, todos: state.todos, birthdays: state.birthdays, moods: state.moods,
      settings: state.settings, photos: photos
    };
    downloadFile('我的日历备份-' + ymd(new Date()) + '.json', JSON.stringify(data), 'application/json;charset=utf-8', false);
    toast('备份已导出，请存到「文件」App 或发给自己');
  }
  async function importBackup(file) {
    try {
      var text = (await file.text() || '').replace(/^\ufeff/, ''); // 兼容早期带 BOM 的备份文件
      var d = JSON.parse(text);
      if (!d || d.app !== 'my-calendar') { toast('这不是本应用的备份文件'); return; }
      if (!confirm('导入会覆盖当前所有数据，确定继续？')) return;
      state.notes = d.notes || []; state.todos = d.todos || [];
      state.birthdays = d.birthdays || [];
      state.moods = d.moods || {};
      state.settings = d.settings || state.settings;
      saveNotes(); saveTodos(); saveBds(); saveMoods(); lsSet(K.st, state.settings);
      releasePhotoUrls();
      await IDB.clear();
      var photos = d.photos || [];
      for (var i = 0; i < photos.length; i++) {
        var p = photos[i];
        // dataURL → Blob，动图才会动
        if (p.data && p.data.indexOf('data:') === 0 && !p.blob) {
          try { p.blob = dataUrlToBlob(p.data); delete p.data; } catch (e) { }
        }
        if (p.blob || p.data) await IDB.put(p);
      }
      await loadPhotos();
      toast('导入完成');
      setTimeout(function () { location.reload(); }, 800);
    } catch (e) { toast('导入失败：' + (e.message || '文件格式不对')); }
  }
  async function clearAll() {
    if (!confirm('会删除所有记事、待办、生日和背景照片，且无法恢复。确定清空？')) return;
    if (!confirm('再确认一次：真的要清空全部数据吗？')) return;
    releasePhotoUrls();
    try { await IDB.clear(); } catch (e) { }
    [K.notes, K.todos, K.bds, K.moods, K.st, K.cur, K.wcity].forEach(function (k) { localStorage.removeItem(k); });
    toast('已清空');
    setTimeout(function () { location.reload(); }, 800);
  }
  function updateUsage() {
    var el = $('usage');
    if (!el) return;
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(function (e) {
        var mb = (e.usage || 0) / 1048576;
        el.textContent = '已占用约 ' + mb.toFixed(1) + ' MB';
      }).catch(function () { el.textContent = ''; });
    } else {
      el.textContent = '共 ' + (state.notes.length + state.todos.length) + ' 条记录 · ' + state.photos.length + ' 张照片';
    }
  }

  /* ---------- 视图切换 ---------- */
  function segSet(id, v) {
    var box = $(id);
    Array.prototype.forEach.call(box.querySelectorAll('button'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-v') === v);
    });
  }
  function switchView(v) {
    state.view = v;
    ['view-calendar', 'view-birthdays', 'view-settings'].forEach(function (id) {
      $(id).classList.toggle('hidden', id !== v);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#tabbar .tab'), function (t) {
      t.classList.toggle('active', t.getAttribute('data-view') === v);
    });
    if (v === 'view-settings') { updateUsage(); renderHolidayList(); }
  }

  /* ---------- 天气（Open-Meteo 免费接口，无需 API Key） ---------- */
  var WMO = {
    0: ['晴', '☀️'], 1: ['晴间多云', '🌤'], 2: ['多云', '⛅'], 3: ['阴', '☁️'],
    45: ['雾', '🌫'], 48: ['雾凇', '🌫'],
    51: ['毛毛雨', '🌦'], 53: ['小雨', '🌦'], 55: ['中雨', '🌧'],
    56: ['冻雨', '🌧'], 57: ['冻雨', '🌧'],
    61: ['小雨', '🌦'], 63: ['中雨', '🌧'], 65: ['大雨', '🌧'],
    66: ['冻雨', '🌧'], 67: ['冻雨', '🌧'],
    71: ['小雪', '🌨'], 73: ['中雪', '🌨'], 75: ['大雪', '❄️'], 77: ['米雪', '🌨'],
    80: ['阵雨', '🌦'], 81: ['阵雨', '🌧'], 82: ['暴雨', '⛈'],
    85: ['阵雪', '🌨'], 86: ['阵雪', '❄️'],
    95: ['雷阵雨', '⛈'], 96: ['雷阵雨伴冰雹', '⛈'], 99: ['雷暴冰雹', '⛈']
  };
  var HOT_CITIES = [
    { name: '北京', lat: 39.9075, lon: 116.3972 }, { name: '上海', lat: 31.2304, lon: 121.4737 },
    { name: '广州', lat: 23.1291, lon: 113.2644 }, { name: '深圳', lat: 22.5455, lon: 114.0683 },
    { name: '杭州', lat: 30.2741, lon: 120.1551 }, { name: '成都', lat: 30.5728, lon: 104.0668 },
    { name: '武汉', lat: 30.5928, lon: 114.3055 }, { name: '西安', lat: 34.3416, lon: 108.9398 },
    { name: '重庆', lat: 29.5630, lon: 106.5516 }, { name: '南京', lat: 32.0603, lon: 118.7969 },
    { name: '天津', lat: 39.3434, lon: 117.3616 }, { name: '苏州', lat: 31.2989, lon: 120.5853 }
  ];
  function wmo(code) { return WMO[code] || ['—', '🌡']; }
  function weekName(ds) {
    var d = parseYmd(ds), w = d.getDay();
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][w];
  }
  function mdShort(ds) { var p = ds.split('-'); return (+p[1]) + '/' + (+p[2]); }
  /* 穿衣建议：按体感温度分档，再按天气码补一句提醒 */
  var RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
  var SNOW_CODES = [71, 73, 75, 77, 85, 86];
  function dressingTip(t, code) {
    if (typeof t !== 'number' || isNaN(t)) return '';
    var s;
    if (t >= 32) s = '短袖短裤，尽量避开正午外出';
    else if (t >= 28) s = '短袖短裤，注意防晒补水';
    else if (t >= 24) s = '短袖为主，出汗后别吹冷风';
    else if (t >= 20) s = '单件长袖，或短袖加件薄外套';
    else if (t >= 15) s = '长袖＋外套，早晚偏凉';
    else if (t >= 10) s = '毛衣／卫衣＋外套';
    else if (t >= 5) s = '厚外套＋毛衣，注意保暖';
    else if (t >= 0) s = '棉服或薄羽绒';
    else s = '羽绒服＋保暖内衣，戴好帽子手套';
    if (RAIN_CODES.indexOf(code) >= 0) s += '，出门带伞';
    else if (SNOW_CODES.indexOf(code) >= 0) s += '，路面湿滑注意防滑';
    else if (code === 45 || code === 48) s += '，雾大能见度低';
    return '👕 ' + s;
  }
  function renderWeather(data, stale) {
    var box = $('wx-card'); if (!box) return;
    if (!data || !data.current) {
      $('wx-t').textContent = '--';
      $('wx-ico').textContent = '🌡';
      $('wx-desc').textContent = data ? '暂无天气数据' : '未设置城市';
      $('wx-extra').textContent = '';
      $('wx-forecast').innerHTML = '';
      var et = $('wx-tip'); if (et) et.textContent = data ? '' : '选个城市就能看到穿衣建议';
      return;
    }
    var c = data.current, w = wmo(c.weather_code);
    $('wx-t').textContent = Math.round(c.temperature_2m);
    $('wx-ico').textContent = w[1];
    $('wx-desc').textContent = w[0] + (stale ? '（数据较旧）' : '');
    var parts = [];
    if (c.relative_humidity_2m != null) parts.push('湿度 ' + Math.round(c.relative_humidity_2m) + '%');
    if (c.wind_speed_10m != null) parts.push('风 ' + Math.round(c.wind_speed_10m) + ' km/h');
    if (data.daily && data.daily.temperature_2m_max && data.daily.temperature_2m_max.length) {
      parts.push('今日 ' + Math.round(data.daily.temperature_2m_min[0]) + '~' + Math.round(data.daily.temperature_2m_max[0]) + '°');
    }
    $('wx-extra').textContent = parts.join(' · ');
    var tip = $('wx-tip');
    if (tip) tip.textContent = dressingTip(Math.round(c.temperature_2m), c.weather_code);
    var fh = '';
    if (data.daily && data.daily.time) {
      for (var i = 0; i < Math.min(5, data.daily.time.length); i++) {
        var ww = wmo(data.daily.weather_code[i]);
        fh += '<div class="wx-day"><div class="wx-dow">' + (i === 0 ? '今天' : weekName(data.daily.time[i])) + '</div>' +
          '<div class="wx-dico">' + ww[1] + '</div>' +
          '<div class="wx-dt">' + Math.round(data.daily.temperature_2m_max[i]) + '° ' +
          '<span class="wx-dmin">' + Math.round(data.daily.temperature_2m_min[i]) + '°</span></div></div>';
      }
    }
    $('wx-forecast').innerHTML = fh;
  }
  async function fetchWeather(city, silent) {
    if (!city) return;
    $('wx-city').textContent = city.name;
    var cached = lsGet(K.wdata, null);
    if (cached && cached.key === city.name && (Date.now() - cached.ts) < 30 * 60 * 1000 && cached.data) {
      renderWeather(cached.data, false);
      return;
    }
    if (cached && cached.data) renderWeather(cached.data, true); // 先显示旧数据
    try {
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + encodeURIComponent(city.lat) +
        '&longitude=' + encodeURIComponent(city.lon) +
        '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
        '&timezone=Asia%2FShanghai&forecast_days=5';
      var r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var d = await r.json();
      lsSet(K.wdata, { key: city.name, ts: Date.now(), data: d });
      renderWeather(d, false);
    } catch (e) {
      if (!silent) toast('天气获取失败，请检查网络');
      renderWeather(cached && cached.data ? cached.data : null, true);
    }
  }
  function saveCity(city) { lsSet(K.wcity, city); fetchWeather(city); }
  async function openCityPicker() {
    $('city-mask').classList.remove('hidden');
    $('city-modal').classList.remove('hidden');
    $('city-q').value = '';
    var hot = '';
    HOT_CITIES.forEach(function (c) {
      hot += '<button type="button" class="city-chip" data-lat="' + c.lat + '" data-lon="' + c.lon + '">' + c.name + '</button>';
    });
    $('city-hot').innerHTML = hot;
    var cur = lsGet(K.wcity, null);
    $('city-list').innerHTML = cur ? '<div class="city-row muted-row">当前：' + esc(cur.name) + '</div>' : '';
    setTimeout(function () { try { $('city-q').focus(); } catch (e) { } }, 300);
  }
  function closeCityPicker() {
    $('city-mask').classList.add('hidden');
    $('city-modal').classList.add('hidden');
  }
  async function searchCity(q) {
    q = (q || '').trim();
    if (!q) { $('city-list').innerHTML = ''; return; }
    $('city-list').innerHTML = '<div class="city-row muted-row">搜索中…</div>';
    try {
      var r = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=8&language=zh', { cache: 'no-store' });
      var d = await r.json();
      var list = (d.results || []).filter(function (x) { return !x.country_code || x.country_code === 'CN'; });
      if (!list.length) list = d.results || [];
      if (!list.length) { $('city-list').innerHTML = '<div class="city-row muted-row">没找到，换个名字试试</div>'; return; }
      var h = '';
      list.forEach(function (x) {
        var sub = [x.admin1, x.country].filter(Boolean).join(' · ');
        h += '<button type="button" class="city-row" data-name="' + esc(x.name) + '" data-lat="' + x.latitude + '" data-lon="' + x.longitude + '">' +
          '<b>' + esc(x.name) + '</b><span>' + esc(sub) + '</span></button>';
      });
      $('city-list').innerHTML = h;
    } catch (e) { $('city-list').innerHTML = '<div class="city-row muted-row">搜索失败，请检查网络</div>'; }
  }
  function locateMe() {
    if (!navigator.geolocation) { toast('这台设备不支持定位，请手动选城市'); return; }
    toast('定位中…');
    navigator.geolocation.getCurrentPosition(function (pos) {
      var c = { name: '当前位置', lat: +pos.coords.latitude.toFixed(4), lon: +pos.coords.longitude.toFixed(4) };
      saveCity(c);
      toast('已定位');
    }, function (err) {
      toast(err && err.code === 1 ? '定位被拒绝，请手动选城市' : '定位失败，请手动选城市');
    }, { timeout: 10000, maximumAge: 600000 });
  }

  /* ---------- 启动 ---------- */
  async function boot() {
    var now = new Date();
    state.today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    state.y = now.getFullYear(); state.m = now.getMonth();
    detectEnv();
    flushPendingDownload();
    loadAll();
    if (typeof state.settings.card_opacity !== 'number') state.settings.card_opacity = 0.72;
    await loadPhotos();
    renderCalendar(); renderBanner(); renderBirthdays(); renderThumbs();
    $('mask-slider').value = Math.round(state.settings.mask_opacity * 100);
    $('mask-val').textContent = Math.round(state.settings.mask_opacity * 100) + '%';
    var cop = $('card-slider');
    if (cop) {
      cop.value = Math.round(state.settings.card_opacity * 100);
      $('card-val').textContent = Math.round(state.settings.card_opacity * 100) + '%';
    }
    applyCardOpacity();
    applyPanelStyle();
    segSet('seg-panel', state.settings.panel_style || 'glass');
    segSet('seg-mode', state.settings.bg_mode);
    segSet('seg-interval', String(state.settings.bg_interval));
    $('field-interval').classList.toggle('hidden', state.settings.bg_mode !== 'carousel');
    applyBackground();
    updateUsage();
    showEnvNotice();
    // 天气
    var city = lsGet(K.wcity, null);
    if (city) fetchWeather(city); else renderWeather(null);
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(function () { });
    }
  }
  function applyCardOpacity() {
    var v = (typeof state.settings.card_opacity === 'number') ? state.settings.card_opacity : 0.72;
    document.documentElement.style.setProperty('--card-a', String(v));
  }
  /* 面板样式：glass = 毛玻璃；clear = 半透（不模糊，背景照片直接透出来）。
     半透模式下日期文字会加白色描边，即使面板透明度拉到 0 也看得清。 */
  function applyPanelStyle() {
    var v = state.settings.panel_style || 'glass';
    var cl = document.body.classList;
    cl.toggle('panel-clear', v === 'clear');
    cl.toggle('panel-glass', v !== 'clear');
  }

  /* ---------- 翻月（按钮 + 左右滑动） ---------- */
  function goMonth(delta) {
    if (delta > 0) { state.m++; if (state.m > 11) { state.m = 0; state.y++; } }
    else { state.m--; if (state.m < 0) { state.m = 11; state.y--; } }
    renderCalendar();
    var g = $('cal-grid');
    if (g) {
      g.classList.remove('slide-l', 'slide-r');
      void g.offsetWidth;                       // 强制重排，动画才会重新播
      g.classList.add(delta > 0 ? 'slide-l' : 'slide-r');
    }
  }
  /* 左右滑屏切月：只认「横向位移明显大于纵向」的快滑，避免和上下滚动打架 */
  function bindSwipe(el) {
    if (!el) return;
    var x0 = 0, y0 = 0, t0 = 0, moved = false;
    el.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { moved = false; return; }
      var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); moved = true;
    }, { passive: true });
    el.addEventListener('touchmove', function (e) {
      if (!moved || e.touches.length !== 1) return;
      var t = e.touches[0];
      // 纵向滑动就交给页面滚动，不再当作切月
      if (Math.abs(t.clientY - y0) > Math.abs(t.clientX - x0)) moved = false;
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (!moved) return;
      moved = false;
      var t = e.changedTouches && e.changedTouches[0]; if (!t) return;
      var dx = t.clientX - x0, dy = t.clientY - y0, dt = Date.now() - t0;
      if (dt > 800) return;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      goMonth(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ---------- 事件 ---------- */
  function bind() {
    $('cal-grid').addEventListener('click', function (e) {
      var c = e.target.closest('.day-cell');
      if (!c) return;
      openSheet(c.getAttribute('data-date'));
    });
    $('prev-month').onclick = function () { goMonth(-1); };
    $('next-month').onclick = function () { goMonth(1); };
    bindSwipe($('view-calendar'));
    $('mood-pick').addEventListener('click', function (e) {
      var b = e.target.closest('.mood-btn'); if (!b) return;
      if (!state.selected) return;
      var m = b.getAttribute('data-m'), mo = moodOf(m);
      if (state.moods[state.selected] === m) { delete state.moods[state.selected]; toast('已取消这天的心情'); }
      else { state.moods[state.selected] = m; toast(mo.n + '，记下了'); }
      saveMoods(); renderMoodPick(); renderCalendar(); renderBanner();
    });
    $('mood-strip').addEventListener('click', function (e) {
      var b = e.target.closest('.mood-day[data-date]'); if (!b) return;
      openSheet(b.getAttribute('data-date'));
    });
    $('btn-today').onclick = function () {
      var n = new Date(); state.y = n.getFullYear(); state.m = n.getMonth();
      renderCalendar();
    };
    $('sheet-mask').onclick = closeSheet;
    $('sheet-close').onclick = closeSheet;
    $('dt-note').onclick = function () { $('pane-note').classList.remove('hidden'); $('pane-todo').classList.add('hidden'); $('dt-note').classList.add('active'); $('dt-todo').classList.remove('active'); };
    $('dt-todo').onclick = function () { $('pane-todo').classList.remove('hidden'); $('pane-note').classList.add('hidden'); $('dt-todo').classList.add('active'); $('dt-note').classList.remove('active'); };

    $('note-add').onclick = function () {
      var v = $('note-input').value.trim();
      if (!v) return;
      if (!state.selected) return;
      state.notes.push({ id: genId(), note_date: state.selected, content: v, created_at: Date.now() });
      saveNotes();
      $('note-input').value = '';
      renderCalendar(); renderDayItems();
    };
    $('todo-add').onclick = function () {
      var v = $('todo-input').value.trim();
      if (!v) return;
      if (!state.selected) return;
      state.todos.push({ id: genId(), todo_date: state.selected, content: v, done: false, created_at: Date.now() });
      saveTodos();
      $('todo-input').value = '';
      renderCalendar(); renderDayItems();
    };
    $('note-list').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var row = e.target.closest('.item-row'); if (!row) return;
      var id = row.getAttribute('data-id');
      if (b.getAttribute('data-act') === 'del-note') {
        state.notes = state.notes.filter(function (n) { return n.id !== id; });
        saveNotes(); renderCalendar(); renderDayItems();
      } else {
        var nv = prompt('修改记事', row.querySelector('.txt').textContent);
        if (nv == null) return;
        nv = nv.trim(); if (!nv) return;
        state.notes.forEach(function (n) { if (n.id === id) n.content = nv; });
        saveNotes(); renderDayItems();
      }
    });
    $('todo-list').addEventListener('click', function (e) {
      var row = e.target.closest('.item-row'); if (!row) return;
      var id = row.getAttribute('data-id');
      var cb = e.target.closest('input[type="checkbox"]');
      if (cb) {
        state.todos.forEach(function (t) { if (t.id === id) t.done = cb.checked; });
        saveTodos(); renderDayItems();
        return;
      }
      var b = e.target.closest('button');
      if (b && b.getAttribute('data-act') === 'del-todo') {
        state.todos = state.todos.filter(function (t) { return t.id !== id; });
        saveTodos(); renderCalendar(); renderDayItems();
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll('#tabbar .tab'), function (t) {
      t.onclick = function () { switchView(t.getAttribute('data-view')); };
    });

    $('btn-add-bd').onclick = function () { openBdModal(null); };
    $('bd-close').onclick = closeBdModal;
    $('bd-mask').onclick = closeBdModal;
    $('seg-bdtype').onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      state.bdType = b.getAttribute('data-v');
      segSet('seg-bdtype', state.bdType); fillBdSelects();
    };
    $('bd-month').onchange = updateBdPreview;
    $('bd-day').onchange = updateBdPreview;
    $('bd-leap').onchange = updateBdPreview;
    $('bd-name').oninput = updateBdPreview;
    $('bd-save').onclick = function () {
      var name = $('bd-name').value.trim();
      if (!name) return toast('请填姓名');
      var yr = $('bd-year').value ? +$('bd-year').value : null;
      var row = {
        name: name, date_type: state.bdType,
        month: +$('bd-month').value, day: +$('bd-day').value,
        leap: state.bdType === 'lunar' && $('bd-leap').checked,
        birth_year: yr
      };
      if (state.editBdId) {
        state.birthdays = state.birthdays.map(function (b) {
          if (b.id !== state.editBdId) return b;
          row.id = b.id; return row;
        });
      } else {
        row.id = genId();
        state.birthdays.push(row);
      }
      saveBds();
      closeBdModal();
      renderBirthdays(); renderCalendar(); renderBanner();
      toast('已保存');
    };
    $('bd-del').onclick = function () {
      if (!state.editBdId) return;
      if (!confirm('删除这个生日？')) return;
      state.birthdays = state.birthdays.filter(function (b) { return b.id !== state.editBdId; });
      saveBds();
      closeBdModal();
      renderBirthdays(); renderCalendar(); renderBanner();
    };
    $('bd-ics').onclick = function () {
      var b = state.birthdays.filter(function (x) { return x.id === state.editBdId; })[0];
      if (b) downloadIcs(b);
    };
    $('bd-list').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var id = b.getAttribute('data-id');
      var bd = state.birthdays.filter(function (x) { return x.id === id; })[0];
      if (!bd) return;
      var act = b.getAttribute('data-act');
      if (act === 'ics') downloadIcs(bd);
      else if (act === 'edit-bd') openBdModal(bd);
      else if (act === 'del-bd') {
        if (!confirm('删除 ' + bd.name + ' 的生日？')) return;
        state.birthdays = state.birthdays.filter(function (x) { return x.id !== id; });
        saveBds();
        renderBirthdays(); renderCalendar(); renderBanner();
      }
    });

    $('bg-upload').onchange = function (e) {
      // 先把 File 引用拷出来；注意：iOS Safari 下如果立刻清空 input.value，
      // 刚拿到的 File 引用会被一并失效，导致后面读不到图。所以清空放到上传结束后再做。
      var files = Array.prototype.slice.call(e.target.files || []);
      if (!files.length) { toast('没选到照片，请重新打开相册再选一次（iOS 有时要重试）'); e.target.value = ''; return; }
      uploadPhotos(files).finally(function () {
        try { e.target.value = ''; } catch (_) { }
      });
    };
    $('bg-thumbs').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      removePhoto(b.getAttribute('data-id'));
    });
    $('sel-current').onchange = function () {
      state.curPhotoId = $('sel-current').value;
      lsSet(K.cur, state.curPhotoId);
      renderThumbs(); applyBackground();
    };
    $('seg-panel').onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var v = b.getAttribute('data-v');
      segSet('seg-panel', v);
      saveSettings({ panel_style: v });
      applyPanelStyle();
      toast(v === 'clear' ? '已切到半透面板，背景照片会直接透出来' : '已切回毛玻璃面板');
    };
    $('seg-mode').onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var v = b.getAttribute('data-v');
      segSet('seg-mode', v);
      $('field-interval').classList.toggle('hidden', v !== 'carousel');
      saveSettings({ bg_mode: v });
      applyBackground();
    };
    $('seg-interval').onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var v = +b.getAttribute('data-v');
      segSet('seg-interval', String(v));
      saveSettings({ bg_interval: v });
      applyBackground();
    };
    $('mask-slider').oninput = function () {
      var v = +$('mask-slider').value / 100;
      $('mask-val').textContent = Math.round(v * 100) + '%';
      $('bg-mask').style.opacity = v;
      state.settings.mask_opacity = v;
    };
    $('mask-slider').onchange = function () { saveSettings({}); };

    $('btn-export').onclick = exportBackup;
    $('btn-import').onchange = function (e) {
      var f = e.target.files && e.target.files[0];
      if (f) importBackup(f);
      e.target.value = '';
    };
    $('btn-clear').onclick = clearAll;

    /* 节假日数据录入 */
    populateHolidayYears();
    populateHolidayNames();
    $('hd-year').onchange = function () { renderHolidayList(); };
    $('hd-rest-n').onchange = function () {
      var show = this.value === '其他（自定义）';
      $('hd-rest-n-custom').classList.toggle('hidden', !show);
      if (show) { try { $('hd-rest-n-custom').focus(); } catch (_) { } }
    };
    $('hd-add-rest').onclick = addUserRest;
    $('hd-add-work').onclick = addUserWork;
    $('hd-list').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act="del"]');
      if (!btn) return;
      var item = btn.closest('.hd-list-item');
      if (!item) return;
      delUserHoliday(item.getAttribute('data-kind'), parseInt(item.getAttribute('data-i'), 10));
    });

    /* 环境提示 */
    var enb = $('env-notice-btn');
    if (enb) enb.onclick = enterFullMode;
    var enc = $('env-notice-copy');
    if (enc) enc.onclick = function () { copyText(enc.dataset.url || topUrl()); };
    var enl = $('env-notice-link');
    if (enl) enl.onclick = function () { toast('已打开完整模式，可在那边添加到主屏幕'); };

    /* 卡片透明度（让背景照片透出来） */
    var cs = $('card-slider');
    if (cs) {
      cs.oninput = function () {
        var v = +cs.value / 100;
        $('card-val').textContent = Math.round(v * 100) + '%';
        state.settings.card_opacity = v;
        applyCardOpacity();
      };
      cs.onchange = function () { saveSettings({}); };
    }

    /* 天气 */
    var wp = $('wx-pick'); if (wp) wp.onclick = openCityPicker;
    var wl = $('wx-locate'); if (wl) wl.onclick = locateMe;
    var wcard = $('wx-card'); if (wcard) wcard.onclick = function (e) { if (e.target.closest('button')) return; openCityPicker(); };
    $('city-close').onclick = closeCityPicker;
    $('city-mask').onclick = closeCityPicker;
    $('city-q').oninput = function () { searchCity($('city-q').value); };
    $('city-hot').addEventListener('click', function (e) {
      var b = e.target.closest('.city-chip'); if (!b) return;
      saveCity({ name: b.textContent, lat: +b.getAttribute('data-lat'), lon: +b.getAttribute('data-lon') });
      closeCityPicker();
    });
    $('city-list').addEventListener('click', function (e) {
      var b = e.target.closest('.city-row[data-lat]'); if (!b) return;
      saveCity({ name: b.getAttribute('data-name'), lat: +b.getAttribute('data-lat'), lon: +b.getAttribute('data-lon') });
      closeCityPicker();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!SOLAR || !LUNAR) {
      document.body.innerHTML = '<p style="padding:24px;font:16px system-ui">日历核心库加载失败，请刷新重试。</p>';
      return;
    }
    bind();
    boot();
  });
})();
