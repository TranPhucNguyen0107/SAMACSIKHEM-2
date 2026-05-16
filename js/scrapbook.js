// ==========================================================================
// FILE: js/scrapbook.js (BẢN TỐI ƯU UX CANVA MOBILE)
// ==========================================================================

function updateText() {
  document.getElementById("canvas-title").innerText = document.getElementById("input-title").value;
  let noteText = document.getElementById("input-sub").value.replace(/\n/g, '<br>');
  document.getElementById("canvas-sub").innerHTML = noteText;
}

function handleImageUpload(event, targetImgId) {
  const file = event.target.files[0];
  if (file) {
    const localImageUrl = URL.createObjectURL(file);
    const imgElement = document.getElementById(targetImgId);
    imgElement.src = localImageUrl;
    imgElement.style.width = "100%";
    imgElement.style.top = "0px";
    imgElement.style.left = "0px";
    makeDraggable(imgElement, false);
  }
}

function handleBgUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const bgUrl = URL.createObjectURL(file);
    const bgImg = document.getElementById('bg-img');
    bgImg.src = bgUrl;
    bgImg.style.width = "100%";
    bgImg.style.top = "0px";
    bgImg.style.left = "0px";
    document.getElementById("bg-zoom-slider").value = 100;
  }
}

function setLayout(mode, btnElement) {
  const canvas = document.getElementById("scrapbook-canvas");
  const buttons = document.querySelectorAll(".btn-layout");
  buttons.forEach(btn => btn.classList.remove("active"));
  btnElement.classList.add("active");
  
  if (mode === 'vertical') {
    canvas.classList.remove("layout-horizontal");
    canvas.classList.add("layout-vertical");
  } else {
    canvas.classList.remove("layout-vertical");
    canvas.classList.add("layout-horizontal");
  }
  // Tự động scale lại ngay khi đổi layout
  setTimeout(adjustCanvasScale, 50);
}
// --- HỆ THỐNG SCALE ẢNH VỪA KHÍT MOBILE VÀ TÍNH TỌA ĐỘ ---
function adjustCanvasScale() {
  const canvas = document.getElementById("scrapbook-canvas");
  const panel = document.querySelector('.editor-panel');

  if (window.innerWidth <= 1024) {
    const canvasWidth = canvas.classList.contains("layout-horizontal") ? 1000 : 680;
    const canvasHeight = canvas.classList.contains("layout-horizontal") ? 562 : 880;

    const isPanelOpen = panel && panel.classList.contains('open');
    const zoneWidth = window.innerWidth;
    
    // Nếu bảng MỞ -> chừa 55vh chiều cao. Nếu ĐÓNG -> chừa 50px.
    const availableHeight = isPanelOpen 
      ? window.innerHeight - 64 - (window.innerHeight * 0.55) 
      : window.innerHeight - 64 - 50;

    const scaleX = (zoneWidth * 0.95) / canvasWidth;
    const scaleY = (availableHeight * 0.95) / canvasHeight;
    const scale = Math.min(scaleX, scaleY);

    // Ép canvas nằm ngay tâm điểm và scale thu nhỏ lại
    canvas.style.transform = `translate(-50%, -50%) scale(${scale})`;
  } else {
    canvas.style.transform = "none";
  }
}

// Hàm lấy tỷ lệ scale hiện tại để bù trừ tốc độ kéo thả chuột
function getCanvasScale() {
  const canvas = document.getElementById('scrapbook-canvas');
  if (window.innerWidth > 1024 || canvas.style.transform === "none") return 1;
  const rect = canvas.getBoundingClientRect();
  const actualWidth = canvas.classList.contains("layout-horizontal") ? 1000 : 680;
  return rect.width / actualWidth;
}

window.addEventListener("load", adjustCanvasScale);
window.addEventListener("resize", adjustCanvasScale);

// --- LOGIC KÉO THẢ TỐI ƯU ---
function makeDraggable(element, isMovableElement = true) {
  let isDragging = false;
  let startX, startY, currentLeft, currentTop;

  function getCoords(e) {
    if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function onStart(e) {
    isDragging = true;
    const coords = getCoords(e);
    startX = coords.x;
    startY = coords.y;
    currentLeft = parseInt(element.style.left || window.getComputedStyle(element).left, 10) || 0;
    currentTop  = parseInt(element.style.top  || window.getComputedStyle(element).top,  10) || 0;
    element.style.cursor = 'grabbing';
    e.stopPropagation();
  }

  function onMove(e) {
    if (!isDragging) return;
    const coords = getCoords(e);
    const scale = getCanvasScale(); // Bù trừ tốc độ di chuyển ngón tay
    const dx = (coords.x - startX) / scale;
    const dy = (coords.y - startY) / scale;
    element.style.left = (currentLeft + dx) + 'px';
    element.style.top  = (currentTop  + dy) + 'px';
  }

  function onEnd() { isDragging = false; element.style.cursor = 'grab'; }

  element.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
  element.addEventListener('touchstart', onStart, { passive: true });
  window.addEventListener('touchmove', onMove,  { passive: true });
  window.addEventListener('touchend',  onEnd);
}

document.querySelectorAll('.decor-movable').forEach(el => makeDraggable(el, true));
makeDraggable(document.getElementById('target-img-1'), false);
makeDraggable(document.getElementById('target-img-2'), false);
makeDraggable(document.getElementById('target-img-3'), false);
makeDraggable(document.getElementById('bg-img'), false);

// --- TẠO VÀ XỬ LÝ STICKER ---
const stickerColors = ['#ff5f56', '#ffbd2e', '#27c93f', '#e91e63', '#9c27b0', '#3f51b5', '#00bcd4', '#4ab362', '#ffeb3b', '#ff9800', '#ffffff', '#333333'];

function addSticker(iconClass) {
  const canvas = document.getElementById("scrapbook-canvas");
  const selectedColor = document.getElementById("sticker-color").value;
  
  const wrapper = document.createElement("div");
  wrapper.className = "sticker-wrapper active"; 
  document.querySelectorAll('.sticker-wrapper').forEach(el => el.classList.remove('active'));

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
  
  wrapper.style.left = (canvas.offsetWidth / 2 - 20) + 'px';
  wrapper.style.top = (canvas.offsetHeight / 2 - 20) + 'px';
  wrapper.style.transform = `rotate(${Math.floor(Math.random() * 30) - 15}deg)`;

  canvas.appendChild(wrapper);
  makeStickerInteractable(wrapper, icon, deleteBtn, resizeBtn);
}

function makeStickerInteractable(wrapper, icon, deleteBtn, resizeBtn) {
  let isDragging = false, isResizing = false, startX, startY, initialLeft, initialTop, initialFontSize;

  function getCoords(e) {
    if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function startDrag(e) {
    if (e.target.closest('.sticker-delete') || e.target.closest('.sticker-resize')) return;
    document.querySelectorAll('.sticker-wrapper').forEach(el => el.classList.remove('active'));
    wrapper.classList.add('active');
    isDragging = true;
    const coords = getCoords(e);
    startX = coords.x; startY = coords.y;
    initialLeft = parseInt(wrapper.style.left || 0, 10);
    initialTop  = parseInt(wrapper.style.top  || 0, 10);
    e.stopPropagation();
  }

  function handleDelete(e) { e.stopPropagation(); wrapper.remove(); }

  function startResize(e) {
    isResizing = true;
    const coords = getCoords(e);
    startX = coords.x;
    initialFontSize = parseFloat(window.getComputedStyle(icon).fontSize);
    e.stopPropagation();
  }

  function onMove(e) {
    const coords = getCoords(e);
    const scale = getCanvasScale(); // Bù trừ tốc độ scale trên mobile
    
    if (isDragging) {
      const dx = (coords.x - startX) / scale;
      const dy = (coords.y - startY) / scale;
      wrapper.style.left = (initialLeft + dx) + 'px';
      wrapper.style.top  = (initialTop  + dy) + 'px';
    }
    if (isResizing) {
      const dx = (coords.x - startX) / scale;
      let newSize = Math.min(350, Math.max(15, initialFontSize + dx));
      icon.style.fontSize = newSize + 'px';
    }
  }

  function onEnd() { isDragging = false; isResizing = false; }

  wrapper.addEventListener('mousedown', startDrag);
  deleteBtn.addEventListener('mousedown', handleDelete);
  resizeBtn.addEventListener('mousedown', startResize);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);

  wrapper.addEventListener('touchstart', startDrag, { passive: true });
  deleteBtn.addEventListener('touchstart', handleDelete, { passive: true });
  resizeBtn.addEventListener('touchstart', startResize, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onEnd);
}

document.getElementById("sticker-color").addEventListener("input", function(e) {
  const activeWrapper = document.querySelector('.sticker-wrapper.active');
  if (activeWrapper) {
    const activeIcon = activeWrapper.querySelector('.sticker-icon');
    if (activeIcon) activeIcon.style.color = e.target.value;
  }
});

// TẮT VIỀN STICKER & TỰ ĐỘNG THU GỌN BẢNG KHI CHẠM VÀO ẢNH
document.getElementById("scrapbook-canvas").addEventListener('mousedown', (e) => {
  // 1. Tắt khung viền xanh của sticker
  if (e.target.id === 'scrapbook-canvas' || e.target.classList.contains('canvas-bg')) {
    document.querySelectorAll('.sticker-wrapper').forEach(el => el.classList.remove('active'));
  }
  
  // 2. Tự động thụt bảng Setting xuống để nhường chỗ xem ảnh
  if (window.innerWidth <= 1024) {
    const panel = document.querySelector('.editor-panel');
    const handleTitle = document.getElementById('handle-title');
    if (panel && panel.classList.contains('open')) {
      panel.classList.remove('open');
      handleTitle.innerText = "CÔNG CỤ THIẾT KẾ (Nhấn để mở)";
    }
  }
});

// Thêm sự kiện touchstart cho Mobile nhạy hơn
document.getElementById("scrapbook-canvas").addEventListener('touchstart', (e) => {
  if (window.innerWidth <= 1024) {
    const panel = document.querySelector('.editor-panel');
    const handleTitle = document.getElementById('handle-title');
    if (panel && panel.classList.contains('open')) {
      panel.classList.remove('open');
      handleTitle.innerText = "CÔNG CỤ THIẾT KẾ (Nhấn để mở)";
    }
  }
}, { passive: true });

function zoomImage(targetImgId, zoomValue) {
  const imgElement = document.getElementById(targetImgId);
  if (imgElement) {
    imgElement.style.width = zoomValue + '%';
    imgElement.style.height = 'auto';
  }
}
// --- XUẤT ẢNH: TRẢ VỀ KÍCH THƯỚC GỐC ĐỂ ẢNH ĐƯỢC NÉT ---
function triggerDownload() {
  document.querySelectorAll('.sticker-wrapper').forEach(el => el.classList.remove('active'));
  const canvasArea = document.getElementById("scrapbook-canvas");
  const downloadBtn = document.querySelector(".btn-download");
  
  const originalBtnText = downloadBtn.innerHTML;
  downloadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ĐANG KẾT XUẤT ẢNH...`;
  downloadBtn.style.pointerEvents = "none";

  // Thêm class gỡ bỏ các định vị absolute chống lệch góc khi chụp
  canvasArea.classList.add('taking-photo');

  document.fonts.ready.then(() => {
    html2canvas(canvasArea, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#aed581"
    }).then(canvas => {
      canvasArea.classList.remove('taking-photo'); // Chụp xong trả lại như cũ
      const link = document.createElement("a");
      link.download = "Feed_KyNiem_SIKHEM_II.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      downloadBtn.innerHTML = originalBtnText;
      downloadBtn.style.pointerEvents = "auto";
    }).catch(err => {
      canvasArea.classList.remove('taking-photo');
      console.error("Lỗi:", err);
      alert("Lỗi xuất ảnh!");
      downloadBtn.innerHTML = originalBtnText;
      downloadBtn.style.pointerEvents = "auto";
    });
  });
}

// --- ĐÓNG MỞ BẢNG CÔNG CỤ TRÊN MOBILE ---
// --- ĐÓNG MỞ BẢNG CÔNG CỤ TRÊN MOBILE ---
function toggleEditor() {
  const panel = document.querySelector('.editor-panel');
  const canvasZone = document.querySelector('.canvas-zone'); // Khu vực chứa ảnh
  const handleTitle = document.getElementById('handle-title');
  
  if (panel.classList.contains('open')) {
    panel.classList.remove('open');
    canvasZone.classList.remove('shrink-for-editor'); // Trả ảnh về full màn
    handleTitle.innerText = "CÔNG CỤ THIẾT KẾ (Nhấn để mở)";
  } else {
    panel.classList.add('open');
    canvasZone.classList.add('shrink-for-editor'); // Đẩy ảnh lên trên
    handleTitle.innerText = "VUỐT XUỐNG ĐỂ THU GỌN";
  }
  
  // Ép JS tính toán lại khung ảnh ngay lập tức cho mượt
  adjustCanvasScale();
}

// TẮT VIỀN STICKER & TỰ ĐỘNG THU GỌN BẢNG KHI CHẠM VÀO ẢNH
function closeEditorOnTouch(e) {
  if (e.target.id === 'scrapbook-canvas' || e.target.classList.contains('canvas-bg')) {
    document.querySelectorAll('.sticker-wrapper').forEach(el => el.classList.remove('active'));
  }
  
  if (window.innerWidth <= 1024) {
    const panel = document.querySelector('.editor-panel');
    const canvasZone = document.querySelector('.canvas-zone');
    const handleTitle = document.getElementById('handle-title');
    
    // Nếu chạm vào ảnh mà bảng đang mở -> Đóng bảng lại ngay
    if (panel && panel.classList.contains('open')) {
      panel.classList.remove('open');
      canvasZone.classList.remove('shrink-for-editor');
      handleTitle.innerText = "CÔNG CỤ THIẾT KẾ (Nhấn để mở)";
      adjustCanvasScale();
    }
  }
}

document.getElementById("scrapbook-canvas").addEventListener('mousedown', closeEditorOnTouch);
document.getElementById("scrapbook-canvas").addEventListener('touchstart', closeEditorOnTouch, { passive: true });