/* =============================================================
   MDUI 运行时子集（本地化，零外链）
   涟漪 / 顶栏投影 / Snackbar / Dialog / Collapse / Tabs / Switch
   动效遵循 Material Design 3：standard 与 emphasized-decelerate 曲线
   ============================================================= */
(function () {
  var MD = {};
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 涟漪：从触点扩散，减速曲线，峰值透明度压到 .12 ---------- */
  var RIPPLE_SEL = '.mdui-ripple,.btn,.row-item,.mdui-icon-btn,.mdui-list-item,' +
    '.opt,.opt-q,.md,.know-h,.drill,.mdui-tab,.mdui-fab';
  MD.ripple = function (e) {
    if (REDUCE) return;
    var t = e.target.closest && e.target.closest(RIPPLE_SEL);
    if (!t || t.disabled) return;
    var r = t.getBoundingClientRect();
    var d = Math.max(r.width, r.height) * 2.2;
    /* clientX 可能为 0，不能用 || 兜底 */
    var cx = (e.clientX == null ? r.left + r.width / 2 : e.clientX) - r.left;
    var cy = (e.clientY == null ? r.top + r.height / 2 : e.clientY) - r.top;
    var s = document.createElement('span');
    s.className = 'mdui-ripple-wave';
    s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (cx - d / 2) + 'px;top:' +
      (cy - d / 2) + 'px;opacity:0';
    t.appendChild(s);
    var an = s.animate(
      [
        { transform: 'scale(0)', opacity: 0, offset: 0 },
        { transform: 'scale(.42)', opacity: .12, offset: .2 },
        { transform: 'scale(1)', opacity: 0, offset: 1 }
      ],
      { duration: 540, easing: 'cubic-bezier(.05,.7,.1,1)' }
    );
    an.onfinish = function () { if (s.parentNode) s.parentNode.removeChild(s); };
  };
  document.addEventListener('pointerdown', MD.ripple, true);

  /* ---------- 顶栏：内容滚动时升起 elevation level 2 ---------- */
  MD.bindAppbar = function (bar) {
    if (!bar) return;
    var handler = function (ev) {
      var top = (ev && ev.target && ev.target.scrollTop) || 0;
      bar.classList.toggle('mdui-appbar--scrolled', top > 4);
    };
    var list = document.querySelectorAll('.page,.ov-body,.mdui-dialog__content');
    for (var i = 0; i < list.length; i++) list[i].addEventListener('scroll', handler, { passive: true });
  };

  /* ---------- 是否支持 grid 行插值（用于折叠面板的高性能过渡） ---------- */
  var FR = (window.CSS && CSS.supports && CSS.supports('grid-template-rows', '0fr')) || false;
  var REDUCE = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || false;

  /* ---------- Snackbar ---------- */
  var sbTimer = null;
  MD.snackbar = function (msg) {
    var el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(sbTimer);
    sbTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
  };

  /* ---------- Dialog：居中面板 + 遮罩，Esc 关闭 ---------- */
  var dlg = null;
  MD.dialog = {
    open: function (opt) {
      dlg = $('mduiDialog');
      if (!dlg) return;
      if (typeof opt === 'string') opt = { title: '', desc: '', html: opt };
      $('mduiDialogTitle').innerHTML = opt.title || '';
      $('mduiDialogDesc').innerHTML = opt.desc || '';
      $('mduiDialogBody').innerHTML = opt.html || '';
      dlg.classList.add('show');
      var body = $('mduiDialogBody');
      if (body) {
        body.scrollTop = 0;
        if (!REDUCE) {
          /* 每次打开都重放一次内容入场，换内容时不会显得是"原地跳变" */
          body.classList.remove('md-in');
          void body.offsetWidth;
          body.classList.add('md-in');
        }
      }
    },
    body: function () { return $('mduiDialogBody'); },
    setDesc: function (t) { var d = $('mduiDialogDesc'); if (d) d.innerHTML = t || ''; },
    close: function () { if (dlg) dlg.classList.remove('show'); },
    isOpen: function () { return !!dlg && dlg.classList.contains('show'); }
  };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') MD.dialog.close(); });

  /* ---------- Collapse：按 scrollHeight 动画展开 ---------- */
  MD.collapse = {
    toggle: function (el) {
      if (!el) return;
      var body = el.querySelector(':scope > .mdui-collapse__body');
      if (!body) return;
      var open = el.classList.toggle('mdui-collapse--open');
      if (FR) {
        /* 行插值：CSS 全权负责，JS 不写高度，杜绝强制同步布局 */
        body.style.removeProperty('height');
        return;
      }
      /* 旧引擎回退：仍按 scrollHeight 过渡 */
      if (open) {
        body.style.height = '0px';
        var h = body.scrollHeight;
        body.style.height = h + 'px';
        var done = function () { body.style.height = 'auto'; body.removeEventListener('transitionend', done); };
        body.addEventListener('transitionend', done);
      } else {
        body.style.height = body.scrollHeight + 'px';
        requestAnimationFrame(function () { body.style.height = '0px'; });
      }
    },
    open: function (el) {
      if (!el || el.classList.contains('mdui-collapse--open')) return;
      MD.collapse.toggle(el);
    }
  };

  /* ---------- Tabs：下划线指示器切换 ---------- */
  MD.tabs = function (container, onPick) {
    if (!container) return;
    container.addEventListener('click', function (e) {
      var t = e.target.closest('.mdui-tab');
      if (!t) return;
      var all = container.querySelectorAll('.mdui-tab');
      for (var i = 0; i < all.length; i++) all[i].classList.remove('is-active');
      t.classList.add('is-active');
      if (onPick) onPick(t.getAttribute('data-val'), t);
    });
  };

  window.mdui = MD;
})();
