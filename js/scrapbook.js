// ==========================================================================
// FILE: js/scrapbook.js — LUXURY EDITION 2026
// FIX: Image pan/drag trong khung hoạt động mượt mà trên cả PC lẫn mobile
// ==========================================================================

let activeStyleType = 'solid';
let activeStyleValue = '#ffffff';
let activeImageToEdit = null;

// Tắt màn hình chờ
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    preloader.style.transition = 'opacity 0.4s ease';
    setTimeout(() => preloader.style.display = 'none', 400);
  }
  document.body.classList.remove('loading');
});

const SAFE_PLACEHOLDER = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23ede8dc%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-size%3D%2216%22%20font-weight%3D%22600%22%20fill%3D%22%23c9a84c%22%3ENh%E1%BA%A5p%20%C4%91%C3%BAp%20ch%E1%BB%8Dn%20%E1%BA%A3nh%3C%2Ftext%3E%3C%2Fsvg%3E";

const FRAME_TEMPLATES = {
  mac: `<div class="frame-content mac-window-frame"><div class="mac-header"><span class="mac-dot dot-red"></span><span class="mac-dot dot-yellow"></span><span class="mac-dot dot-green"></span><span class="mac-title">memories.jpg</span></div><div class="img-crop-window"><img src="${SAFE_PLACEHOLDER}" class="frame-img" crossorigin="anonymous" /></div></div>`,
  classic: `<div class="frame-content polaroid-classic-frame"><div class="img-crop-window"><img src="${SAFE_PLACEHOLDER}" class="frame-img" crossorigin="anonymous" /></div><input type="text" class="polaroid-input" value="Lưu giữ thanh xuân ♡" /></div>`,
  modern: `<div class="frame-content polaroid-modern-frame"><div class="washi-tape-decor"></div><div class="img-crop-window"><img src="${SAFE_PLACEHOLDER}" class="frame-img" crossorigin="anonymous" /></div><input type="text" class="polaroid-input" value="Sikhem II memories" /></div>`,
  music: `<div class="frame-content music-widget-frame"><div class="music-cover"><div class="img-crop-window"><img src="${SAFE_PLACEHOLDER}" class="frame-img" crossorigin="anonymous" /></div></div><div class="music-info"><input type="text" class="music-title-input" value="Đi Lên Sa Mạc" /><input type="text" class="music-artist-input" value="Thiếu Nhi Thánh Thể" /></div><div class="music-progress"><div class="music-progress-bar"></div></div><div class="music-controls"><i class="fa-solid fa-backward-step"></i><i class="fa-solid fa-circle-play play-btn"></i><i class="fa-solid fa-forward-step"></i></div></div>`,
  stamp: `<div class="frame-content stamp-frame"><div class="stamp-scallop-wrapper"><div class="img-crop-window"><img src="${SAFE_PLACEHOLDER}" class="frame-img" crossorigin="anonymous" /></div></div></div>`,
  film: `<div class="frame-content film-strip-frame"><div class="film-holes"><span class="hole"></span><span class="hole"></span><span class="hole"></span><span class="hole"></span></div><div class="img-crop-window"><img src="${SAFE_PLACEHOLDER}" class="frame-img" crossorigin="anonymous" /></div><div class="film-holes film-holes-bottom"><span class="hole"></span><span class="hole"></span><span class="hole"></span><span class="hole"></span></div></div>`,
  heart: `<div class="frame-content heart-frame"><div class="img-crop-window heart-clip"><img src="${SAFE_PLACEHOLDER}" class="frame-img" crossorigin="anonymous" /></div></div>`,
  torn: `<div class="frame-content torn-paper-frame"><div class="img-crop-window torn-clip"><img src="${SAFE_PLACEHOLDER}" class="frame-img" crossorigin="anonymous" /></div></div>`,
  circle: `<div class="frame-content circle-badge-frame"><div class="img-crop-window"><img src="${SAFE_PLACEHOLDER}" class="frame-img" crossorigin="anonymous" /></div></div>`,
  stickyNote: `<div class="frame-content sticky-note-frame"><div class="tape-piece"></div><textarea class="note-textarea" placeholder="Viết note ở đây..."></textarea></div>`
};

// ==========================================================================
// 1. HỆ THỐNG KÉO ẢNH TRONG KHUNG — PAN + PINCH-TO-ZOOM (PC & MOBILE)
// ==========================================================================

/**
 * Dùng POINTER EVENTS thống nhất cho pan (1 ngón).
 * Dùng TOUCH EVENTS riêng cho pinch-to-zoom (2 ngón) — vì Pointer API
 * không cung cấp khoảng cách giữa 2 pointer một cách tiện lợi.
 * Hai hệ thống này không conflict vì pinch chặn pointer khi activePointers >= 2.
 */
function makeImageInteractable(img, isBackground = false) {
  // --- PAN state ---
  let isDragging = false;
  let panPointerId = null;
  let startX, startY, startTx, startTy;

  // --- PINCH state ---
  let isPinching = false;
  let pinchStartDist = 0;
  let pinchStartScale = 1;

  // --- Double-tap state ---
  let lastTap = 0;

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 5.0;

  // ── helpers ──────────────────────────────────────────────────────────────
  function canInteract() {
    if (isBackground) return true;
    const wrapper = img.closest('.element-wrapper');
    return wrapper && wrapper.classList.contains('is-editing');
  }

  function currentScale() {
    return isBackground
      ? parseFloat(document.getElementById('bg-zoom-slider').value) / 100
      : parseFloat(img.dataset.imgScale || 1);
  }

  function setScale(val) {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, val));
    if (isBackground) {
      document.getElementById('bg-zoom-slider').value = clamped * 100;
    } else {
      img.dataset.imgScale = clamped;
      // Đồng bộ slider nếu toolbar đang mở
      const slider = document.getElementById('frame-zoom-slider');
      if (slider && activeImageToEdit === img) slider.value = clamped;
    }
    return clamped;
  }

  function touchDist(t1, t2) {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  }

  // ── POINTER: pan (1 ngón / chuột) ────────────────────────────────────────
  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    // Nếu đang pinch (2 touch) thì bỏ qua pointer mới
    if (isPinching) return;

    const wrapper = img.closest('.element-wrapper');
    const now = Date.now();
    const since = now - lastTap;

    // Double-tap / double-click
    if (since < 320 && since > 0 && !isBackground) {
      lastTap = 0;
      if (img.src.includes('data:image')) {
        triggerImageUpload(img);
      } else {
        openImageEditMode(img, wrapper);
      }
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    lastTap = now;

    if (!canInteract()) return;

    // Touch với 2 ngón sẽ được xử lý bởi touch events, bỏ qua ở đây
    if (e.pointerType === 'touch' && e.isPrimary === false) return;

    isDragging = true;
    panPointerId = e.pointerId;

    try { img.setPointerCapture(e.pointerId); } catch (_) {}

    startX  = e.clientX;
    startY  = e.clientY;
    startTx = parseFloat(img.dataset.tx || 0);
    startTy = parseFloat(img.dataset.ty || 0);

    img.style.cursor = 'grabbing';
    e.preventDefault();
    e.stopPropagation();
  }

  function onPointerMove(e) {
    if (!isDragging || e.pointerId !== panPointerId || isPinching) return;

    const cs = getCanvasScale();
    const wrapper = img.closest('.element-wrapper');
    const ws = wrapper ? parseFloat(wrapper.dataset.scale || 1) : 1;

    const dx = (e.clientX - startX) / (cs * ws);
    const dy = (e.clientY - startY) / (cs * ws);

    img.dataset.tx = startTx + dx;
    img.dataset.ty = startTy + dy;
    updateImgTransform(img, isBackground);

    e.preventDefault();
  }

  function onPointerUp(e) {
    if (e.pointerId !== panPointerId) return;
    isDragging = false;
    panPointerId = null;
    img.style.cursor = 'grab';
    try { img.releasePointerCapture(e.pointerId); } catch (_) {}
  }

  // ── TOUCH: pinch-to-zoom (2 ngón) ────────────────────────────────────────
  function onTouchStart(e) {
    if (e.touches.length === 2) {
      // Chỉ pinch khi đang trong edit mode (hoặc ảnh nền)
      if (!canInteract()) return;

      isPinching = true;
      isDragging = false; // Dừng pan

      pinchStartDist  = touchDist(e.touches[0], e.touches[1]);
      pinchStartScale = currentScale();

      e.preventDefault();
      e.stopPropagation();
    }
  }

  function onTouchMove(e) {
    if (!isPinching || e.touches.length !== 2) return;

    const dist  = touchDist(e.touches[0], e.touches[1]);
    const ratio = dist / pinchStartDist;
    const newScale = setScale(pinchStartScale * ratio);

    updateImgTransform(img, isBackground);

    e.preventDefault();
  }

  function onTouchEnd(e) {
    if (e.touches.length < 2) {
      isPinching = false;
    }
  }

  // ── Gắn events ────────────────────────────────────────────────────────────
  img.addEventListener('pointerdown',   onPointerDown,  { passive: false });
  img.addEventListener('pointermove',   onPointerMove,  { passive: false });
  img.addEventListener('pointerup',     onPointerUp);
  img.addEventListener('pointercancel', onPointerUp);

  // Touch events cho pinch — dùng vùng chứa rộng hơn để bắt 2 ngón tay
  // Background dùng .canvas-bg, frame dùng .img-crop-window
  const cropWin = isBackground
    ? (img.closest('.canvas-bg') || img)
    : (img.closest('.img-crop-window') || img);

  cropWin.addEventListener('touchstart', onTouchStart, { passive: false });
  cropWin.addEventListener('touchmove',  onTouchMove,  { passive: false });
  cropWin.addEventListener('touchend',   onTouchEnd,   { passive: true  });
  cropWin.addEventListener('touchcancel',onTouchEnd,   { passive: true  });

  img.addEventListener('contextmenu', e => e.preventDefault());
}

function updateImgTransform(img, isBackground) {
  const tx = parseFloat(img.dataset.tx || 0);
  const ty = parseFloat(img.dataset.ty || 0);
  const scale = isBackground
    ? (parseFloat(document.getElementById('bg-zoom-slider').value) / 100)
    : (parseFloat(img.dataset.imgScale) || 1);
  img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}

// ===== TOOLBAR NỔI (EDIT MODE) =====
function openImageEditMode(img, wrapper) {
  // Thoát edit mode cũ trước
  exitImageEditMode();

  activeImageToEdit = img;
  wrapper.classList.add('is-editing');

  const toolbar = document.getElementById('image-edit-toolbar');
  if (!toolbar) return;

  const slider = document.getElementById('frame-zoom-slider');
  slider.value = parseFloat(img.dataset.imgScale || 1);

  // Vị trí toolbar
  const rect = wrapper.getBoundingClientRect();
  const tbW = 280;
  let tbLeft = rect.left + rect.width / 2 - tbW / 2;
  let tbTop  = rect.bottom + 16;

  // Clamp vào viewport
  tbLeft = Math.max(8, Math.min(tbLeft, window.innerWidth - tbW - 8));
  if (tbTop + 130 > window.innerHeight) tbTop = rect.top - 130 - 8;

  toolbar.style.left = `${tbLeft}px`;
  toolbar.style.top  = `${tbTop}px`;
  toolbar.style.bottom = 'auto';
  toolbar.classList.add('show');

  slider.oninput = function () {
    if (activeImageToEdit) {
      activeImageToEdit.dataset.imgScale = this.value;
      updateImgTransform(activeImageToEdit, false);
    }
  };

  document.getElementById('btn-change-frame-img').onclick = function () {
    if (activeImageToEdit) triggerImageUpload(activeImageToEdit);
  };
}

function exitImageEditMode() {
  const toolbar = document.getElementById('image-edit-toolbar');
  if (toolbar) toolbar.classList.remove('show');

  if (activeImageToEdit) {
    const wrapper = activeImageToEdit.closest('.element-wrapper');
    if (wrapper) wrapper.classList.remove('is-editing');
    activeImageToEdit = null;
  }
}

function triggerImageUpload(img) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (evt) => {
    const file = evt.target.files[0];
    if (!file) return;
    img.src = URL.createObjectURL(file);
    img.dataset.tx = 0;
    img.dataset.ty = 0;
    img.dataset.imgScale = 1;
    updateImgTransform(img, false);
  };
  input.click();
}

function handleBgUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const bgImg = document.getElementById('bg-img');
  bgImg.src = URL.createObjectURL(file);
  bgImg.dataset.tx = 0;
  bgImg.dataset.ty = 0;
  document.getElementById('bg-zoom-slider').value = 100;
  updateImgTransform(bgImg, true);
}

function zoomBg() {
  const bgImg = document.getElementById('bg-img');
  if (bgImg) updateImgTransform(bgImg, true);
}

// ==========================================================================
// 2. CANVAS & ELEMENT ENGINE
// ==========================================================================
function setLayout(mode, btnElement) {
  const canvas = document.getElementById('scrapbook-canvas');
  document.querySelectorAll('.btn-layout').forEach(b => b.classList.remove('active'));
  btnElement.classList.add('active');
  canvas.classList.toggle('layout-horizontal', mode === 'horizontal');
  canvas.classList.toggle('layout-vertical',   mode === 'vertical');

  setTimeout(() => {
    adjustCanvasScale();
    const actualHeight = mode === 'horizontal' ? 562 : 880;
    const titleEl = document.getElementById('mandatory-title');
    if (titleEl) titleEl.style.top = `${actualHeight - 120}px`;
  }, 60);
}

function adjustCanvasScale() {
  const canvas = document.getElementById('scrapbook-canvas');
  const panel  = document.querySelector('.editor-panel');
  if (window.innerWidth <= 1024) {
    const isHorizontal = canvas.classList.contains('layout-horizontal');
    const cW = isHorizontal ? 1000 : 680;
    const cH = isHorizontal ? 562  : 880;
    const isPanelOpen = panel && panel.classList.contains('open');
    const headerH = 64;
    const handleH = 58;
    const panelOpenH = window.innerHeight * 0.5;
    const bottomBar = isPanelOpen ? panelOpenH : handleH;
    const availH = window.innerHeight - headerH - bottomBar;
    const scale = Math.min((window.innerWidth * 0.95) / cW, (availH * 0.95) / cH, 1);
    canvas.style.transform = `translate(-50%, -50%) scale(${scale})`;
    canvas.style.top  = `${headerH + availH / 2}px`;
    canvas.style.left = '50%';
  } else {
    canvas.style.transform = 'none';
    canvas.style.top  = 'auto';
    canvas.style.left = 'auto';
  }
}

function getCanvasScale() {
  const canvas = document.getElementById('scrapbook-canvas');
  if (window.innerWidth > 1024 || canvas.style.transform === 'none') return 1;
  return canvas.getBoundingClientRect().width /
    (canvas.classList.contains('layout-horizontal') ? 1000 : 680);
}

function selectStickerStyle(type, value = '') {
  activeStyleType  = type;
  activeStyleValue = value;

  const activeWrapper = document.querySelector('.element-wrapper.active');
  if (!activeWrapper) return;

  const activeSticker = activeWrapper.querySelector('.sticker-icon');
  const activeText    = activeWrapper.querySelector('.text-display');

  if (activeSticker) {
    activeSticker.className = activeSticker.className.replace(/gradient-\w+/g, '').trim();
    activeSticker.style.color = type === 'solid' ? value : '';
    if (type !== 'solid') activeSticker.classList.add(type);
  }

  if (activeText) {
    activeText.className = activeText.className.replace(/gradient-\w+/g, '').trim();
    if (type === 'solid') {
      activeText.style.background = 'none';
      activeText.style.webkitTextFillColor = 'initial';
      activeText.style.color = value;
      activeText.style.textShadow = '2px 3px 8px rgba(0,0,0,0.35)';
    } else {
      activeText.style.color = 'transparent';
      activeText.style.textShadow = 'none';
      activeText.classList.add(type);
    }
  }
}

// ===== BASE WRAPPER =====
function createBaseWrapper(x = 150, y = 150, isDeletable = true) {
  const canvas = document.getElementById('scrapbook-canvas');
  document.querySelectorAll('.element-wrapper').forEach(el => el.classList.remove('active', 'is-editing'));
  exitImageEditMode();

  const wrapper = document.createElement('div');
  wrapper.className = 'element-wrapper active';
  wrapper.style.left = `${x}px`;
  wrapper.style.top  = `${y}px`;
  wrapper.dataset.angle = 0;
  wrapper.dataset.scale = 1;

  const createBtn = (cls, icon, action) => {
    const b = document.createElement('div');
    b.className = `ctrl-btn ${cls}`;
    b.innerHTML = `<i class="fa-solid fa-${icon}"></i>`;
    if (action) b.addEventListener('pointerdown', (e) => { e.stopPropagation(); action(b); });
    return b;
  };

  const rotBtn   = createBtn('ctrl-rotate',     'rotate');
  const resBtn   = createBtn('ctrl-resize',     'up-right-and-down-left-from-center');
  const layerUp  = createBtn('ctrl-layer-up',   'layer-group', () => {
    let z = parseInt(wrapper.style.zIndex) || 10;
    wrapper.style.zIndex = z + 1;
  });
  const layerDown = createBtn('ctrl-layer-down', 'down-long', () => {
    let z = parseInt(wrapper.style.zIndex) || 10;
    wrapper.style.zIndex = Math.max(1, z - 1);
  });

  if (isDeletable) {
    const delBtn = createBtn('ctrl-delete', 'xmark', () => {
      wrapper.remove();
      exitImageEditMode();
    });
    wrapper.appendChild(delBtn);
  }

  wrapper.append(rotBtn, resBtn, layerUp, layerDown);
  canvas.appendChild(wrapper);
  makeInteractable(wrapper, rotBtn, resBtn);
  return wrapper;
}

// ===== TEMPLATE MẶC ĐỊNH =====
function spawnMandatoryTemplate() {
  const canvas = document.getElementById('scrapbook-canvas');
  const actualHeight = canvas.classList.contains('layout-horizontal') ? 562 : 880;

  // Logo
  const logoWrapper = createBaseWrapper(30, 30, false);
  const logoFrame = document.createElement('div');
  logoFrame.className = 'frame-content';
  logoFrame.innerHTML = `<img src="img/843e7611d60662583b17.png" style="width:100px;height:auto;pointer-events:none;user-select:none;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.25));" />`;
  logoWrapper.appendChild(logoFrame);

  // Text nghệ thuật
  const textWrapper = createBaseWrapper(40, actualHeight - 120, false);
  textWrapper.id = 'mandatory-title';
  const textFrame = document.createElement('div');
  textFrame.className = 'frame-content text-element-frame';
  textFrame.innerHTML = `<div class="text-display" contenteditable="true" spellcheck="false" style="color:#ffffff;">SIKHEM II - 2026</div>`;
  textWrapper.appendChild(textFrame);

  const textDisplay = textFrame.querySelector('.text-display');
  textDisplay.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    textDisplay.focus();
    document.execCommand('selectAll', false, null);
  });

  document.querySelectorAll('.element-wrapper').forEach(el => el.classList.remove('active'));
}

// ===== SPAWN FRAME =====
function spawnFrame(type, x, y) {
  if (!FRAME_TEMPLATES[type]) return;
  const wrapper = createBaseWrapper(x, y, true);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = FRAME_TEMPLATES[type];
  const frameContent = tempDiv.firstElementChild;
  wrapper.appendChild(frameContent);
  const img = frameContent.querySelector('.frame-img');
  if (img) makeImageInteractable(img, false);
}

// ===== ADD STICKERS =====
function addFASticker(iconClass) {
  const wrapper = createBaseWrapper(250, 150, true);
  const icon = document.createElement('i');
  icon.className = `${iconClass} sticker-icon`;
  if (activeStyleType === 'solid') icon.style.color = activeStyleValue;
  else icon.classList.add(activeStyleType);
  wrapper.appendChild(icon);
}

function addEmojiSticker(emoji, x, y) {
  const wrapper = createBaseWrapper(x || 250, y || 150, true);
  const span = document.createElement('span');
  span.className = 'sticker-icon';
  span.style.fontFamily = 'Apple Color Emoji, Segoe UI Emoji, sans-serif';
  span.innerText = emoji;
  wrapper.appendChild(span);
}

function spawnTextElement() {
  const canvas = document.getElementById('scrapbook-canvas');
  const actualHeight = canvas.classList.contains('layout-horizontal') ? 562 : 880;
  const wrapper = createBaseWrapper(40, actualHeight - 200, true);
  const textFrame = document.createElement('div');
  textFrame.className = 'frame-content text-element-frame';
  textFrame.innerHTML = `<div class="text-display" contenteditable="true" spellcheck="false" style="color:#ffffff;">Chạm đúp sửa chữ</div>`;
  wrapper.appendChild(textFrame);

  const textDisplay = textFrame.querySelector('.text-display');
  textDisplay.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    textDisplay.focus();
    document.execCommand('selectAll', false, null);
  });
}

// ==========================================================================
// 3. DRAG / ROTATE / RESIZE CHO WRAPPER (KHUNG) — POINTER EVENTS UNIFIED
// ==========================================================================
function makeInteractable(wrapper, rotBtn, resBtn) {
  let mode = null; // 'drag' | 'rotate' | 'resize'
  let pointerId = null;
  let startX, startY, startLeft, startTop;
  let startAngle, startDist, startScale;

  function getCoords(e) { return { x: e.clientX, y: e.clientY }; }

  function onWrapperDown(e) {
    if (wrapper.classList.contains('is-editing')) return;
    if (e.target.closest('.ctrl-btn')) return;
    if (e.target.tagName.toLowerCase() === 'input' ||
        e.target.tagName.toLowerCase() === 'textarea') return;
    if (e.target.closest('[contenteditable="true"]')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    // Deselect others
    document.querySelectorAll('.element-wrapper').forEach(el => {
      if (el !== wrapper) el.classList.remove('active', 'is-editing');
    });
    wrapper.classList.add('active');
    exitImageEditMode();

    mode = 'drag';
    pointerId = e.pointerId;
    const c = getCoords(e);
    startX    = c.x;
    startY    = c.y;
    startLeft = parseInt(wrapper.style.left || 0);
    startTop  = parseInt(wrapper.style.top  || 0);

    try { wrapper.setPointerCapture(e.pointerId); } catch(err) {}
    e.preventDefault();
  }

  function onRotateDown(e) {
    e.stopPropagation();
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    mode = 'rotate';
    pointerId = e.pointerId;
    const c = getCoords(e);
    const rect = wrapper.getBoundingClientRect();
    startAngle = Math.atan2(
      c.y - (rect.top  + rect.height / 2),
      c.x - (rect.left + rect.width  / 2)
    ) * (180 / Math.PI) - parseFloat(wrapper.dataset.angle || 0);
    try { rotBtn.setPointerCapture(e.pointerId); } catch(err) {}
    e.preventDefault();
  }

  function onResizeDown(e) {
    e.stopPropagation();
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    mode = 'resize';
    pointerId = e.pointerId;
    const c = getCoords(e);
    const rect = wrapper.getBoundingClientRect();
    startDist  = Math.hypot(c.x - (rect.left + rect.width/2), c.y - (rect.top + rect.height/2));
    startScale = parseFloat(wrapper.dataset.scale || 1);
    try { resBtn.setPointerCapture(e.pointerId); } catch(err) {}
    e.preventDefault();
  }

  function onMove(e) {
    if (!mode || e.pointerId !== pointerId) return;
    const scaleFactor = getCanvasScale();
    const c = getCoords(e);

    if (mode === 'drag') {
      wrapper.style.left = `${startLeft + (c.x - startX) / scaleFactor}px`;
      wrapper.style.top  = `${startTop  + (c.y - startY) / scaleFactor}px`;
    } else if (mode === 'rotate') {
      const rect = wrapper.getBoundingClientRect();
      const angle = Math.atan2(
        c.y - (rect.top  + rect.height / 2),
        c.x - (rect.left + rect.width  / 2)
      ) * (180 / Math.PI) - startAngle;
      wrapper.dataset.angle = angle;
      updateWrapperTransform();
    } else if (mode === 'resize') {
      const rect = wrapper.getBoundingClientRect();
      const dist  = Math.hypot(c.x - (rect.left + rect.width/2), c.y - (rect.top + rect.height/2));
      const scale = Math.max(0.3, Math.min(startScale * (dist / startDist), 3.5));
      wrapper.dataset.scale = scale;
      updateWrapperTransform();
    }

    e.preventDefault();
  }

  function onUp(e) {
    if (e.pointerId !== pointerId) return;
    mode = null;
    pointerId = null;
  }

  function updateWrapperTransform() {
    wrapper.style.transform = `rotate(${wrapper.dataset.angle || 0}deg) scale(${wrapper.dataset.scale || 1})`;
  }

  // Wrapper: drag
  wrapper.addEventListener('pointerdown', onWrapperDown, { passive: false });
  wrapper.addEventListener('pointermove', onMove, { passive: false });
  wrapper.addEventListener('pointerup',   onUp);
  wrapper.addEventListener('pointercancel', onUp);

  // Rotate btn
  rotBtn.addEventListener('pointerdown', onRotateDown, { passive: false });
  rotBtn.addEventListener('pointermove', onMove, { passive: false });
  rotBtn.addEventListener('pointerup',   onUp);
  rotBtn.addEventListener('pointercancel', onUp);

  // Resize btn
  resBtn.addEventListener('pointerdown', onResizeDown, { passive: false });
  resBtn.addEventListener('pointermove', onMove, { passive: false });
  resBtn.addEventListener('pointerup',   onUp);
  resBtn.addEventListener('pointercancel', onUp);

  // Click ngoài để deselect
  document.addEventListener('pointerdown', (e) => {
    if (!wrapper.contains(e.target) && !e.target.closest('#image-edit-toolbar')) {
      wrapper.classList.remove('active');
    }
  }, { passive: true });
}

// ==========================================================================
// 4. TABS & EXPORT
// ==========================================================================
function toggleEditor() {
  const panel = document.querySelector('.editor-panel');
  const handleTitle = document.getElementById('handle-title');
  const canvasZone  = document.querySelector('.canvas-zone');

  if (panel.classList.contains('open')) {
    panel.classList.remove('open');
    canvasZone.classList.remove('shrink-for-editor');
    handleTitle.innerText = 'CÔNG CỤ THIẾT KẾ • Nhấn để mở';
  } else {
    panel.classList.add('open');
    canvasZone.classList.add('shrink-for-editor');
    handleTitle.innerText = 'VUỐT XUỐNG ĐỂ THU GỌN';
  }
  setTimeout(adjustCanvasScale, 60);
}

document.addEventListener('DOMContentLoaded', () => {
  const tabs     = document.querySelectorAll('.panel-tab');
  const sections = document.querySelectorAll('.tab-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => {
        s.style.opacity = 0;
        setTimeout(() => s.classList.remove('active'), 120);
      });
      tab.classList.add('active');
      const target = document.getElementById(`tab-${tab.dataset.tab}`);
      setTimeout(() => { if (target) target.classList.add('active'); }, 120);
    });
  });
});

function triggerDownload() {
  document.querySelectorAll('.element-wrapper').forEach(el => el.classList.remove('active', 'is-editing'));
  exitImageEditMode();

  const canvasArea  = document.getElementById('scrapbook-canvas');
  const downloadBtn = document.querySelector('.btn-export');
  const originalHTML = downloadBtn.innerHTML;

  downloadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ĐANG XUẤT...`;
  downloadBtn.style.pointerEvents = 'none';
  canvasArea.classList.add('taking-photo');

  document.fonts.ready.then(() => {
    html2canvas(canvasArea, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f0ebe2'
    }).then(canvas => {
      canvasArea.classList.remove('taking-photo');
      const link = document.createElement('a');
      link.download = 'Feed_KyNiem_SIKHEM_II.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      downloadBtn.innerHTML = originalHTML;
      downloadBtn.style.pointerEvents = 'auto';
    }).catch(err => {
      canvasArea.classList.remove('taking-photo');
      alert('Lỗi xuất ảnh. Vui lòng thử lại!');
      downloadBtn.innerHTML = originalHTML;
      downloadBtn.style.pointerEvents = 'auto';
    });
  });
}

// ==========================================================================
// 5. KHỞI ĐỘNG
// ==========================================================================
window.addEventListener('load', () => {
  adjustCanvasScale();
  spawnMandatoryTemplate();

  const bgImg = document.getElementById('bg-img');
  if (bgImg) makeImageInteractable(bgImg, true);

  window.addEventListener('resize', adjustCanvasScale);
});