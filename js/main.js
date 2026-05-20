// ==========================================
// main.js — rebuilt with touch swipe gallery
// ==========================================

// 1. PRELOADER
window.addEventListener("load", function () {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    preloader.classList.add("hide");
    setTimeout(() => {
      preloader.style.display = "none";
      document.body.classList.remove("loading");
      document.body.classList.add("loaded");
    }, 700);
  }
});

document.addEventListener("DOMContentLoaded", function () {

  // 2. SCROLL REVEAL
  const reveals = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  reveals.forEach((el) => revealObserver.observe(el));

  // 3. LIGHTBOX
  const lightboxLinks = document.querySelectorAll(".lightbox");
  const lightboxOverlay = document.getElementById("lightbox-overlay");
  if (lightboxLinks.length > 0 && lightboxOverlay) {
    const lightboxImage = lightboxOverlay.querySelector("img");
    lightboxLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        if (lightboxImage) lightboxImage.src = link.getAttribute("href");
        lightboxOverlay.classList.add("active");
        lightboxOverlay.style.display = "flex";
      });
    });
    lightboxOverlay.addEventListener("click", () => {
      lightboxOverlay.classList.remove("active");
      lightboxOverlay.style.display = "none";
    });
  }

  // 4. CLOSE DROPDOWN ON OUTSIDE CLICK
  window.addEventListener("click", function (e) {
    const dropdown = document.querySelector(".dropdown");
    const menu = document.getElementById("submenu");
    if (dropdown && menu && !dropdown.contains(e.target)) {
      menu.classList.remove("active");
    }
  });

  // 5. GALLERY — rebuilt with touch swipe + dots
  initGallery();

});

// ===== GALLERY ENGINE =====
function initGallery() {
  const track = document.querySelector(".gallery-track");
  const container = document.querySelector(".gallery-slider-container");
  if (!track || !container) return;

  const items = track.querySelectorAll("a");
  if (items.length === 0) return;

  let currentIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragOffset = 0;

  // Re-enable clicks on items (we blocked them for drag logic)
  items.forEach(a => { a.style.pointerEvents = 'auto'; });

  function getItemsPerView() {
    const w = window.innerWidth;
    if (w <= 768) return 1;
    if (w <= 1024) return 2;
    return 3;
  }

  function getMaxIndex() {
    return Math.max(0, items.length - getItemsPerView());
  }

  function getItemWidth() {
    const gap = 16;
    const perView = getItemsPerView();
    const containerW = container.offsetWidth;
    return (containerW - gap * (perView - 1)) / perView;
  }

  function goTo(index, animate = true) {
    const maxIdx = getMaxIndex();
    currentIndex = Math.max(0, Math.min(index, maxIdx));
    const itemW = getItemWidth();
    const gap = 16;
    const offset = currentIndex * (itemW + gap);
    track.style.transition = animate ? 'transform 0.42s cubic-bezier(0.25,0.8,0.25,1)' : 'none';
    track.style.transform = `translateX(-${offset}px)`;
    updateDots();
  }

  // Dots
  const wrapper = container.closest(".gallery-wrapper");
  let dotsContainer = document.querySelector(".gallery-dots");
  if (!dotsContainer && wrapper) {
    dotsContainer = document.createElement("div");
    dotsContainer.className = "gallery-dots";
    wrapper.parentElement.insertBefore(dotsContainer, wrapper.nextSibling);
  }

  function buildDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    const total = getMaxIndex() + 1;
    for (let i = 0; i < total; i++) {
      const dot = document.createElement("button");
      dot.className = "gallery-dot" + (i === currentIndex ? " active" : "");
      dot.setAttribute("aria-label", `Ảnh ${i + 1}`);
      dot.addEventListener("click", () => goTo(i));
      dotsContainer.appendChild(dot);
    }
  }

  function updateDots() {
    if (!dotsContainer) return;
    dotsContainer.querySelectorAll(".gallery-dot").forEach((d, i) => {
      d.classList.toggle("active", i === currentIndex);
    });
  }

  buildDots();
  goTo(0, false);

  // Arrow buttons
  window.moveGallery = function(dir) {
    goTo(currentIndex + dir);
  };

  // Touch swipe
  container.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isDragging = false;
  }, { passive: true });

  container.addEventListener("touchmove", (e) => {
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (!isDragging && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      isDragging = true;
    }
    if (isDragging) {
      // Live drag feedback
      const itemW = getItemWidth();
      const gap = 16;
      const baseOffset = currentIndex * (itemW + gap);
      track.style.transition = 'none';
      track.style.transform = `translateX(${-baseOffset + dx}px)`;
    }
  }, { passive: true });

  container.addEventListener("touchend", (e) => {
    if (!isDragging) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx < -40) goTo(currentIndex + 1);
    else if (dx > 40) goTo(currentIndex - 1);
    else goTo(currentIndex); // snap back
    isDragging = false;
  }, { passive: true });

  // Mouse drag (desktop)
  container.addEventListener("mousedown", (e) => {
    dragStartX = e.clientX;
    isDragging = true;
    dragOffset = 0;
    container.style.cursor = 'grabbing';
    e.preventDefault();
  });
  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    dragOffset = e.clientX - dragStartX;
    const itemW = getItemWidth();
    const gap = 16;
    const base = currentIndex * (itemW + gap);
    track.style.transition = 'none';
    track.style.transform = `translateX(${-base + dragOffset}px)`;
  });
  window.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    container.style.cursor = '';
    if (dragOffset < -40) goTo(currentIndex + 1);
    else if (dragOffset > 40) goTo(currentIndex - 1);
    else goTo(currentIndex);
    dragOffset = 0;
  });

  // Prevent link click during drag
  items.forEach(a => {
    a.addEventListener("click", (e) => {
      if (Math.abs(dragOffset) > 5) e.preventDefault();
    });
  });

  // Recalc on resize
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildDots();
      goTo(Math.min(currentIndex, getMaxIndex()), false);
    }, 120);
  });
}

// 5. TOGGLE MENU MOBILE
window.toggleMenu = function () {
  const navLinks = document.querySelector(".nav-links");
  if (navLinks) navLinks.classList.toggle("show");
};

// 6. TOGGLE DROPDOWN
window.toggleDropdown = function (event) {
  event.preventDefault();
  const menu = document.getElementById("submenu");
  if (menu) menu.classList.toggle("active");
};

// 7. COUNTDOWN
function initCountdown(targetDateStr) {
  const targetDate = new Date(targetDateStr).getTime();
  const timer = setInterval(function() {
    const now = new Date().getTime();
    const distance = targetDate - now;
    if (distance < 0) {
      clearInterval(timer);
      const container = document.getElementById("countdown");
      if (container) container.innerHTML = "<h3 style='color:#fff;font-weight:800'>⛺ SA MẠC ĐÃ BẮT ĐẦU!</h3>";
      return;
    }
    const days    = Math.floor(distance / (1000*60*60*24));
    const hours   = Math.floor((distance % (1000*60*60*24)) / (1000*60*60));
    const minutes = Math.floor((distance % (1000*60*60)) / (1000*60));
    const seconds = Math.floor((distance % (1000*60)) / 1000);
    if (document.getElementById("days")) {
      document.getElementById("days").innerText    = days    < 10 ? "0"+days    : days;
      document.getElementById("hours").innerText   = hours   < 10 ? "0"+hours   : hours;
      document.getElementById("minutes").innerText = minutes < 10 ? "0"+minutes : minutes;
      document.getElementById("seconds").innerText = seconds < 10 ? "0"+seconds : seconds;
    }
  }, 1000);
}

document.addEventListener("DOMContentLoaded", function() {
  if (document.getElementById("countdown")) {
    initCountdown("July 24, 2026 05:00:00");
  }
});