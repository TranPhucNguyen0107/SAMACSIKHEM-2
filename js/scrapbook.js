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

// 3. THAY ĐỔI ẢNH NỀN PHÍA SAU
function handleBgUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const bgUrl = URL.createObjectURL(file);
    document.querySelector(".canvas-bg").style.backgroundImage = `url('${bgUrl}')`;
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

// 7. XUẤT FILE ẢNH KHÔNG GIAN SÁNG TẠO HD
function triggerDownload() {
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