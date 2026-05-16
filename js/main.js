// ==========================================
// FILE: js/main.js - Dùng chung cho cả 3 trang
// ==========================================

// 1. XỬ LÝ PRELOADER
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
    { threshold: 0.12 }
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

  // 4. ĐÓNG DROPDOWN KHI CLICK RA NGOÀI
  window.addEventListener("click", function (e) {
    const dropdown = document.querySelector(".dropdown");
    const menu = document.getElementById("submenu");
    if (dropdown && menu && !dropdown.contains(e.target)) {
      menu.classList.remove("active");
    }
  });

});

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

// 8. LOGIC ĐẾM NGƯỢC (COUNTDOWN)
function initCountdown(targetDateStr) {
  const targetDate = new Date(targetDateStr).getTime();

  const timer = setInterval(function() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      clearInterval(timer);
      const container = document.getElementById("countdown");
      if (container) container.innerHTML = "<h3>SA MẠC ĐÃ BẮT ĐẦU!</h3>";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Hiển thị ra màn hình
    if (document.getElementById("days")) {
        document.getElementById("days").innerText = days < 10 ? "0" + days : days;
        document.getElementById("hours").innerText = hours < 10 ? "0" + hours : hours;
        document.getElementById("minutes").innerText = minutes < 10 ? "0" + minutes : minutes;
        document.getElementById("seconds").innerText = seconds < 10 ? "0" + seconds : seconds;
    }
  }, 1000);
}

// Gọi hàm với ngày bạn muốn (Ví dụ: 10 tháng 7 năm 2026)
document.addEventListener("DOMContentLoaded", function() {
    if (document.getElementById("countdown")) {
        initCountdown("July 24, 2026 05:00:00");
    }
});