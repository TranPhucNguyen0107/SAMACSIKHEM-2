// ==========================================================================
// FILE: js/scrapbook.js
// ==========================================================================

// 1. CẬP NHẬT TEXT TIÊU ĐỀ VÀ LỜI NHẮN NHỦ
function updateText() {
  document.getElementById("canvas-title").innerText = document.getElementById("input-title").value;
  let noteText = document.getElementById("input-sub").value.replace(/\n/g, '<br>');
  document.getElementById("canvas-sub").innerHTML = noteText;
}

// 2. LOAD ẢNH PHÂN VÙNG VÀ CHUẨN BỊ KÉO THẢ TRONG KHUNG CẮT CRoP
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

// 3. THAY ĐỔI ẢNH NỀN PHÍA SAU (CẬP NHẬT CÓ KÉO THẢ)
function handleBgUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const bgUrl = URL.createObjectURL(file);
    const bgImg = document.getElementById('bg-img');
    
    bgImg.src = bgUrl;
    
    // Reset lại vị trí và size khi đổi ảnh nền mới
    bgImg.style.width = "100%";
    bgImg.style.top = "0px";
    bgImg.style.left = "0px";
    
    // Reset lại thanh trượt slider về 100%
    document.getElementById("bg-zoom-slider").value = 100;
  }
}

// 4. CHUYỂN ĐỔI BỐ CỤC KHUNG TRANH (NGANG / DỌC)
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
}

// 5. BẬT / TẮT HIỆN THỊ PHỤ KIỆN TRANG TRÍ
function toggleDecor(decorClass, btnElement) {
  const targetDecor = document.querySelector('.' + decorClass);
  if (targetDecor) {
    if (targetDecor.style.display === "none" || targetDecor.style.display === "") {
      targetDecor.style.display = "block";
      btnElement.classList.add("active");
    } else {
      targetDecor.style.display = "none";
      btnElement.classList.remove("active");
    }
  }
}

// 6. BIẾN THÀNH PHẦN THÀNH ĐỐI TƯỢNG KÉO THẢ TỰ DO HOẶC PAN TRONG KHUNG
function makeDraggable(element, isMovableElement = true) {
  let isDragging = false;
  let startX, startY;
  let currentLeft, currentTop;

  element.addEventListener('mousedown', (e) => {
    // Nếu kéo khối trang trí tự do ngoài canvas hoặc kéo ảnh bên trong crop window
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    currentLeft = parseInt(element.style.left || window.getComputedStyle(element).left, 10);
    currentTop = parseInt(element.style.top || window.getComputedStyle(element).top, 10);
    
    element.style.cursor = 'grabbing';
    e.preventDefault();
    e.stopPropagation(); // Tránh xung đột sự kiện kiện chồng lấp khối
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      element.style.cursor = isMovableElement ? 'grab' : 'grab';
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    element.style.left = (currentLeft + dx) + 'px';
    element.style.top = (currentTop + dy) + 'px';
  });
}

// Kích hoạt kéo thả cho các thành phần mặc định trên canvas
document.querySelectorAll('.decor-movable').forEach(el => {
  makeDraggable(el, true);
});

// Kích hoạt kéo thả pan ảnh cho 3 ảnh upload
makeDraggable(document.getElementById('target-img-1'), false);
makeDraggable(document.getElementById('target-img-2'), false);
makeDraggable(document.getElementById('target-img-3'), false);
makeDraggable(document.getElementById('bg-img'), false);
// 7. XUẤT FILE ẢNH KHÔNG GIAN SÁNG TẠO HD
function triggerDownload() {
  document.querySelectorAll('.sticker-wrapper').forEach(el => el.classList.remove('active'));
  const canvasArea = document.getElementById("scrapbook-canvas");
  const downloadBtn = document.querySelector(".btn-download");
  
  const originalBtnText = downloadBtn.innerHTML;
  downloadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ĐANG KẾT XUẤT ẢNH...`;
  downloadBtn.style.pointerEvents = "none";

  document.fonts.ready.then(() => {
    html2canvas(canvasArea, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#aed581"
    })
    .then(canvas => {
      const link = document.createElement("a");
      link.download = "Feed_KyNiem_SIKHEM_II.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      downloadBtn.innerHTML = originalBtnText;
      downloadBtn.style.pointerEvents = "auto";
    })
    .catch(err => {
      console.error("Lỗi kết xuất hình ảnh:", err);
      alert("Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại trên trình duyệt máy tính!");
      downloadBtn.innerHTML = originalBtnText;
      downloadBtn.style.pointerEvents = "auto";
    });
  });
}

// Danh sách các màu cực "nghệ" để random cho sticker

// 8. TẠO STICKER ĐỘNG VÀO CANVAS
// Danh sách màu sắc
const stickerColors = ['#ff5f56', '#ffbd2e', '#27c93f', '#e91e63', '#9c27b0', '#3f51b5', '#00bcd4', '#4ab362', '#ffeb3b', '#ff9800', '#ffffff', '#333333'];

// 8. TẠO STICKER CHUẨN FB/INSTA (CÓ THU PHÓNG)
function addSticker(iconClass) {
  const canvas = document.getElementById("scrapbook-canvas");
  
  // Tạo Khung viền (Wrapper)
  const wrapper = document.createElement("div");
  wrapper.className = "sticker-wrapper active"; // Tự động active khi mới sinh ra
  
  // Tắt viền của các sticker khác
  document.querySelectorAll('.sticker-wrapper').forEach(el => el.classList.remove('active'));

  // Tạo Icon
  const icon = document.createElement("i");
  icon.className = iconClass + " sticker-icon";
  icon.style.color = stickerColors[Math.floor(Math.random() * stickerColors.length)];

  // Tạo nút Xóa
  const deleteBtn = document.createElement("div");
  deleteBtn.className = "sticker-delete";
  deleteBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';

  // Tạo nút Thu Phóng
  const resizeBtn = document.createElement("div");
  resizeBtn.className = "sticker-resize";

  // Lắp ráp các thành phần
  wrapper.appendChild(icon);
  wrapper.appendChild(deleteBtn);
  wrapper.appendChild(resizeBtn);
  
  // Vị trí mặc định ở giữa Canvas
  wrapper.style.left = (canvas.offsetWidth / 2 - 20) + 'px';
  wrapper.style.top = (canvas.offsetHeight / 2 - 20) + 'px';
  
  // Random góc nghiêng cho tự nhiên
  const randomRotation = Math.floor(Math.random() * 30) - 15;
  wrapper.style.transform = `rotate(${randomRotation}deg)`;

  canvas.appendChild(wrapper);
  
  // Áp dụng Logic Di chuyển, Xóa và Thu phóng
  makeStickerInteractable(wrapper, icon, deleteBtn, resizeBtn);
}

// LOGIC XỬ LÝ KÉO THẢ VÀ THU PHÓNG STICKER
function makeStickerInteractable(wrapper, icon, deleteBtn, resizeBtn) {
  let isDragging = false;
  let isResizing = false;
  let startX, startY;
  let initialLeft, initialTop;
  let initialFontSize;

  // 1. Click vào sticker để Bật Viền & Bắt đầu Kéo đi
  wrapper.addEventListener('mousedown', (e) => {
    if (e.target === deleteBtn || e.target === resizeBtn) return; // Bỏ qua nếu bấm vào nút
    
    // Đổi active sang sticker này
    document.querySelectorAll('.sticker-wrapper').forEach(el => el.classList.remove('active'));
    wrapper.classList.add('active');
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = parseInt(wrapper.style.left || 0, 10);
    initialTop = parseInt(wrapper.style.top || 0, 10);
    e.stopPropagation();
  });

  // 2. Bấm X để xóa
  deleteBtn.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    wrapper.remove();
  });

  // 3. Nắm góc phải dưới để Thu/Phóng
  resizeBtn.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    initialFontSize = parseFloat(window.getComputedStyle(icon).fontSize);
    e.stopPropagation();
  });

  // Logic Di chuột chung
  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      wrapper.style.left = (initialLeft + dx) + 'px';
      wrapper.style.top = (initialTop + dy) + 'px';
    }
    
    if (isResizing) {
      const dx = e.clientX - startX;
      // Kéo chuột sang phải thì to ra, sang trái thì nhỏ lại
      let newSize = initialFontSize + dx;
      
      // Giới hạn max/min để không bị biến mất hay lấp đầy màn hình
      if (newSize < 15) newSize = 15; 
      if (newSize > 350) newSize = 350; 
      
      icon.style.fontSize = newSize + 'px';
    }
  });

  // Thả chuột ra
  window.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
  });
}
// --- TÍNH NĂNG ĐỔI MÀU TRỰC TIẾP CHO STICKER ĐANG ĐƯỢC CHỌN ---
document.getElementById("sticker-color").addEventListener("input", function(e) {
  const newColor = e.target.value;
  
  // Tìm xem có sticker nào đang được active (hiện khung viền đứt nét) không
  const activeWrapper = document.querySelector('.sticker-wrapper.active');
  
  if (activeWrapper) {
    // Tìm thẻ icon bên trong wrapper đó và đổi màu
    const activeIcon = activeWrapper.querySelector('.sticker-icon');
    if (activeIcon) {
      activeIcon.style.color = newColor;
    }
  }
});
// 9. TẮT VIỀN KHI CLICK RA NGOÀI (Click vào Canvas)
document.getElementById("scrapbook-canvas").addEventListener('mousedown', (e) => {
  // Nếu target chính là cái nền canvas (không phải sticker)
  if (e.target.id === 'scrapbook-canvas' || e.target.classList.contains('canvas-bg')) {
    document.querySelectorAll('.sticker-wrapper').forEach(el => el.classList.remove('active'));
  }

  
});

// ==========================================
// 10. HÀM ZOOM ẢNH (Dùng chung cho ảnh nền và ảnh tải lên)
// ==========================================
function zoomImage(targetImgId, zoomValue) {
  const imgElement = document.getElementById(targetImgId);
  if (imgElement) {
    // Phóng to/thu nhỏ ảnh theo phần trăm của thanh trượt
    imgElement.style.width = zoomValue + '%';
    imgElement.style.height = 'auto'; // Đảm bảo không bị méo hình
  }
}