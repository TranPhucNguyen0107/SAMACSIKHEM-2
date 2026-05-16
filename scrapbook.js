// ==========================================================================
// FILE: js/scrapbook.js — MOBILE-OPTIMIZED v2
// Cải tiến: Tab UI trong panel, pinch-to-zoom cho sticker, touch mượt hơn
// ==========================================================================

// ===== TEXT UPDATE =====
function updateText() {
  document.getElementById("canvas-title").innerText = document.getElementById("input-title").value;
  let noteText = document.getElementById("input-sub").value.replace(/\n/g, '<br>');
  document.getElementById("canvas-sub").innerHTML = noteText;
}

// ===== IMAGE UPLOAD =====
function handleImageUpload(event, targetImgId) {
  const file = event.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = document.getElementById(targetImgId);
  img.src = url;
  img.style.width = "100%";
  img.style.top = "0px";
  img.style.left = "0px";
  makeDraggable(img, false);
}

function handleBgUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const bgImg = document.getElementById('bg-img');
  bgImg.src = url;
  bgImg.style.width = "100%";
  bgImg.style.top = "0px";
  bgImg.style.left = "0px";
  document.getElementById("bg-zoom-slider").value = 100;
}

function zoomImage(targetImgId, zoomValue) {
  const img = document.getElementById(targetImgId);
  if (img) { img.style.width = zoomValue + '%'; img.style.height = 'auto'; }
}

// ===== LAYOUT SWITCH =====
function setLayout(mode, btnElement) {
  const canvas = document.getElementById("scrapbook-canvas");
  document.querySelectorAll(".btn-layout").forEach(b => b.classList.remove("active"));
  btnElement.classList.add("active");
  canvas.classList.toggle("layout-horizontal", mode === 'horizontal');
  canvas.classList.toggle("layout-vertical", mode === 'vertical');
  setTimeout(adjustCanvasScale, 50);
}

// ===== CANVAS SCALE (Mobile) =====
function adjustCanvasScale() {
  const canvas = document.getElementById("scrapbook-canvas");
  const panel = document.querySelector('.editor-panel');

  if (window.innerWidth <= 1024) {
    const isHorizontal = canvas.classList.contains("layout-horizontal");
    const canvasWidth  = isHorizontal ? 1000 : 680;
    const canvasHeight = isHorizontal ? 562 : 880;

    const isPanelOpen = panel && panel.classList.contains('open');
    const headerH = 64;
    const handleH = 60;
    const panelOpenH = window.innerHeight * 0.55;
    const bottomBar = isPanelOpen ? panelOpenH : handleH;
    const availH = window.innerHeight - headerH - bottomBar;
    const availW = window.innerWidth;

    const scaleX = (availW * 0.96) / canvasWidth;
    const scaleY = (availH * 0.96) / canvasHeight;
    const scale  = Math.min(scaleX, scaleY, 1);

    canvas.style.transform = `translate(-50%, -50%) scale(${scale})`;
  } else {
    canvas.style.transform = "none";
  }
}

function getCanvasScale() {
  const canvas = document.getElementById('scrapbook-canvas');
  if (window.innerWidth > 1024 || canvas.style.transform === "none") return 1;
  const rect = canvas.getBoundingClientRect();
  const actualWidth = canvas.classList.contains("layout-horizontal") ? 1000 : 680;
  return rect.width / actualWidth;
}

window.addEventListener("load", adjustCanvasScale);
window.addEventListener("resize", adjustCanvasScale);

// ===== DRAGGABLE (Mouse + Touch) =====
function makeDraggable(element, isMovableElement = true) {
  let isDragging = false;
  let startX, startY, currentLeft, currentTop;

  function getCoords(e) {
    if (e.touches && e.touches.length > 0)
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function onStart(e) {
    isDragging = true;
    const c = getCoords(e);
    startX = c.x; startY = c.y;
    currentLeft = parseInt(element.style.left || window.getComputedStyle(element).left, 10) || 0;
    currentTop  = parseInt(element.style.top  || window.getComputedStyle(element).top,  10) || 0;
    element.style.cursor = 'grabbing';
    e.stopPropagation();
  }

  function onMove(e) {
    if (!isDragging) return;
    const c = getCoords(e);
    const scale = getCanvasScale();
    element.style.left = (currentLeft + (c.x - startX) / scale) + 'px';
    element.style.top  = (currentTop  + (c.y - startY) / scale) + 'px';
  }

  function onEnd() { isDragging = false; element.style.cursor = 'grab'; }

  element.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
  element.addEventListener('touchstart', onStart, { passive: false });
  window.addEventListener('touchmove', onMove,   { passive: false });
  window.addEventListener('touchend',  onEnd);
}

document.querySelectorAll('.decor-movable').forEach(el => makeDraggable(el, true));
makeDraggable(document.getElementById('target-img-1'), false);
makeDraggable(document.getElementById('target-img-2'), false);
makeDraggable(document.getElementById('target-img-3'), false);
makeDraggable(document.getElementById('bg-img'), false);

// ===== STICKER SYSTEM =====
function addSticker(iconClass) {
  const canvas = document.getElementById("scrapbook-canvas");
  const selectedColor = document.getElementById("sticker-color").value;

  document.querySelectorAll('.sticker-wrapper').forEach(el => el.classList.remove('active'));

  const wrapper = document.createElement("div");
  wrapper.className = "sticker-wrapper active";

  const icon = document.createElement("i");
  icon.className = iconClass + " sticker-icon";
  icon.style.color = selectedColor;

  const deleteBtn = document.createElement("div");
  deleteBtn.className = "sticker-delete";
  deleteBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';

  const resizeBtn = document.createElement("div");
  resizeBtn.className = "sticker-resize";

  wrapper.appendChild(icon);
  wrapper.appendChild(deleteBtn);
  wrapper.appendChild(resizeBtn);

  wrapper.style.left = (canvas.offsetWidth / 2 - 30) + 'px';
  wrapper.style.top  = (canvas.offsetHeight / 2 - 30) + 'px';
  wrapper.style.transform = `rotate(${Math.floor(Math.random() * 30) - 15}deg)`;

  canvas.appendChild(wrapper);
  makeStickerInteractable(wrapper, icon, deleteBtn, resizeBtn);
}

function makeStickerInteractable(wrapper, icon, deleteBtn, resizeBtn) {
  let isDragging = false, isResizing = false;
  let startX, startY, initialLeft, initialTop, initialFontSize;
  // Pinch-to-zoom support
  let pinchDist0 = null, pinchSize0 = null;

  function getCoords(e) {
    if (e.touches && e.touches.length > 0)
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function getTouchDist(e) {
    if (e.touches && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.hypot(dx, dy);
    }
    return null;
  }

  function startDrag(e) {
    if (e.target.closest('.sticker-delete') || e.target.closest('.sticker-resize')) return;
    // 2-finger = pinch, not drag
    if (e.touches && e.touches.length === 2) return;

    document.querySelectorAll('.sticker-wrapper').forEach(el => el.classList.remove('active'));
    wrapper.classList.add('active');
    isDragging = true;
    const c = getCoords(e);
    startX = c.x; startY = c.y;
    initialLeft = parseInt(wrapper.style.left || 0, 10);
    initialTop  = parseInt(wrapper.style.top  || 0, 10);
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
  }

  function handleDelete(e) {
    e.stopPropagation();
    wrapper.remove();
  }

  function startResize(e) {
    isResizing = true;
    const c = getCoords(e);
    startX = c.x;
    initialFontSize = parseFloat(window.getComputedStyle(icon).fontSize);
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
  }

  // Pinch to zoom (2 fingers on wrapper)
  function onTouchStartWrapper(e) {
    if (e.touches.length === 2) {
      pinchDist0 = getTouchDist(e);
      pinchSize0 = parseFloat(window.getComputedStyle(icon).fontSize);
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();
    }
  }

  function onMove(e) {
    const scale = getCanvasScale();

    // Pinch zoom
    if (e.touches && e.touches.length === 2 && pinchDist0 !== null) {
      const dist = getTouchDist(e);
      if (dist) {
        const ratio = dist / pinchDist0;
        const newSize = Math.min(350, Math.max(15, pinchSize0 * ratio));
        icon.style.fontSize = newSize + 'px';
      }
      return;
    }

    if (isDragging) {
      const c = getCoords(e);
      wrapper.style.left = (initialLeft + (c.x - startX) / scale) + 'px';
      wrapper.style.top  = (initialTop  + (c.y - startY) / scale) + 'px';
    }
    if (isResizing) {
      const c = getCoords(e);
      const dx = (c.x - startX) / scale;
      icon.style.fontSize = Math.min(350, Math.max(15, initialFontSize + dx)) + 'px';
    }
  }

  function onEnd(e) {
    isDragging = false; isResizing = false;
    if (e.touches && e.touches.length < 2) pinchDist0 = null;
  }

  // Mouse
  wrapper.addEventListener('mousedown', startDrag);
  deleteBtn.addEventListener('mousedown', handleDelete);
  resizeBtn.addEventListener('mousedown', startResize);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);

  // Touch
  wrapper.addEventListener('touchstart', startDrag, { passive: false });
  wrapper.addEventListener('touchstart', onTouchStartWrapper, { passive: false });
  deleteBtn.addEventListener('touchstart', handleDelete, { passive: false });
  resizeBtn.addEventListener('touchstart', startResize, { passive: false });
  window.addEventListener('touchmove',  onMove, { passive: false });
  window.addEventListener('touchend',   onEnd);
}

// Cập nhật màu sticker đang active
document.getElementById("sticker-color").addEventListener("input", function(e) {
  const activeIcon = document.querySelector('.sticker-wrapper.active .sticker-icon');
  if (activeIcon) activeIcon.style.color = e.target.value;
});

// Tắt viền sticker khi click nền canvas
function closeActiveStickers(e) {
  if (e.target.id === 'scrapbook-canvas' || e.target.classList.contains('canvas-bg')) {
    document.querySelectorAll('.sticker-wrapper').forEach(el => el.classList.remove('active'));
  }
}
document.getElementById("scrapbook-canvas").addEventListener('mousedown', closeActiveStickers);
document.getElementById("scrapbook-canvas").addEventListener('touchstart', closeActiveStickers, { passive: true });

// ===== BOTTOM SHEET PANEL =====
function toggleEditor() {
  const panel      = document.querySelector('.editor-panel');
  const canvasZone = document.querySelector('.canvas-zone');
  const handleTitle = document.getElementById('handle-title');

  if (panel.classList.contains('open')) {
    panel.classList.remove('open');
    canvasZone.classList.remove('shrink-for-editor');
    handleTitle.innerText = "CÔNG CỤ THIẾT KẾ • Nhấn để mở";
  } else {
    panel.classList.add('open');
    canvasZone.classList.add('shrink-for-editor');
    handleTitle.innerText = "VUỐT XUỐNG ĐỂ THU GỌN";
  }
  adjustCanvasScale();
}

// Auto-đóng panel khi chạm vào canvas
function closeEditorOnTouch(e) {
  closeActiveStickers(e);
  if (window.innerWidth <= 1024) {
    const panel      = document.querySelector('.editor-panel');
    const canvasZone = document.querySelector('.canvas-zone');
    const handleTitle = document.getElementById('handle-title');
    if (panel && panel.classList.contains('open')) {
      panel.classList.remove('open');
      canvasZone.classList.remove('shrink-for-editor');
      handleTitle.innerText = "CÔNG CỤ THIẾT KẾ • Nhấn để mở";
      adjustCanvasScale();
    }
  }
}

document.getElementById("scrapbook-canvas").addEventListener('mousedown', closeEditorOnTouch);
document.getElementById("scrapbook-canvas").addEventListener('touchstart', closeEditorOnTouch, { passive: true });

// ===== TAB NAVIGATION (Mobile panel) =====
function initPanelTabs() {
  const tabs = document.querySelectorAll('.panel-tab');
  const sections = document.querySelectorAll('.tab-section');

  if (!tabs.length) return; // Desktop không có tab

  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const target = this.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      this.classList.add('active');
      const targetSection = document.getElementById('tab-' + target);
      if (targetSection) targetSection.classList.add('active');
    });
  });

  // Mở tab đầu tiên
  if (tabs[0]) tabs[0].click();
}

// ===== EXPORT =====
function triggerDownload() {
  document.querySelectorAll('.sticker-wrapper').forEach(el => el.classList.remove('active'));
  const canvasArea  = document.getElementById("scrapbook-canvas");
  const downloadBtn = document.querySelector(".btn-download");
  const originalText = downloadBtn.innerHTML;

  downloadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ĐANG XUẤT ẢNH...`;
  downloadBtn.style.pointerEvents = "none";
  canvasArea.classList.add('taking-photo');

  document.fonts.ready.then(() => {
    html2canvas(canvasArea, {
      scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#aed581"
    }).then(canvas => {
      canvasArea.classList.remove('taking-photo');
      const link = document.createElement("a");
      link.download = "Feed_KyNiem_SIKHEM_II.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      downloadBtn.innerHTML = originalText;
      downloadBtn.style.pointerEvents = "auto";
    }).catch(err => {
      canvasArea.classList.remove('taking-photo');
      console.error("Lỗi:", err);
      alert("Lỗi xuất ảnh!");
      downloadBtn.innerHTML = originalText;
      downloadBtn.style.pointerEvents = "auto";
    });
  });
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", function() {
  initPanelTabs();

  // Cập nhật handle title theo trạng thái mặc định
  const handleTitle = document.getElementById('handle-title');
  if (handleTitle && window.innerWidth <= 1024) {
    handleTitle.innerText = "CÔNG CỤ THIẾT KẾ • Nhấn để mở";
  }
});