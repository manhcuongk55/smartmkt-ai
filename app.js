// SmartMkt AI — Landing Page JavaScript

(function () {
  'use strict';

  /* ============================================================
     NAVBAR SCROLL EFFECT
     ============================================================ */
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  }, { passive: true });

  /* ============================================================
     MOBILE MENU TOGGLE
     ============================================================ */
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinks.style.display === 'flex';
      navLinks.style.display = isOpen ? 'none' : 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '64px';
      navLinks.style.left = '0';
      navLinks.style.right = '0';
      navLinks.style.background = 'rgba(8, 11, 20, 0.97)';
      navLinks.style.backdropFilter = 'blur(20px)';
      navLinks.style.padding = '24px';
      navLinks.style.gap = '20px';
      navLinks.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
      if (!isOpen) {
        navLinks.style.display = 'flex';
      } else {
        navLinks.style.display = 'none';
      }
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => { navLinks.style.display = 'none'; });
    });
  }

  /* ============================================================
     SMOOTH SCROLL for ANCHOR LINKS
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ============================================================
     INTERSECTION OBSERVER — Animate on scroll
     ============================================================ */
  const animTargets = document.querySelectorAll(
    '.feature-card, .testi-card, .price-card, .step-item, .platform-item, .trend-alert'
  );

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = (Array.from(animTargets).indexOf(el) % 4) * 80;
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = el.style.transform
            ? el.style.transform.replace('translateY(32px)', 'translateY(0)')
            : 'translateY(0)';
          el.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)';
        }, delay);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  animTargets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(32px)';
    observer.observe(el);
  });

  /* ============================================================
     COUNTER ANIMATION for HERO STATS
     ============================================================ */
  function animateCounter(el, from, to, suffix, duration = 1200) {
    const startTime = performance.now();
    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (to - from) * eased);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  // Animate stats when in view
  const statNums = document.querySelectorAll('.stat-num');
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent;
        if (text.includes('5.9')) {
          animateCounter(el, 0, 5.9, 'M', 800);
          setTimeout(() => { el.textContent = '5.9M'; }, 850);
        } else if (text.includes('4h')) {
          animateCounter(el, 0, 4, 'h', 600);
        } else if (text.includes('40')) {
          animateCounter(el, 0, 40, '%', 800);
          setTimeout(() => { el.textContent = '+40%'; }, 850);
        }
        statObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  statNums.forEach(el => statObserver.observe(el));

  /* ============================================================
     CHAT DEMO — Typing animation
     ============================================================ */
  const botBubble = document.querySelector('.bot-bubble');
  if (botBubble) {
    const originalText = botBubble.textContent;
    botBubble.textContent = '';
    let charIndex = 0;

    const chatObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const interval = setInterval(() => {
            if (charIndex < originalText.length) {
              botBubble.textContent += originalText[charIndex];
              charIndex++;
            } else {
              clearInterval(interval);
            }
          }, 22);
          chatObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    const chatSection = document.querySelector('.chat-demo');
    if (chatSection) chatObserver.observe(chatSection);
  }

  /* ============================================================
     MINI CHART — Animate bars on scroll
     ============================================================ */
  const chartBars = document.querySelectorAll('.chart-bar');
  const chartObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        chartBars.forEach((bar, i) => {
          const targetHeight = bar.style.height;
          bar.style.height = '0%';
          setTimeout(() => {
            bar.style.transition = 'height 0.6s cubic-bezier(0.16,1,0.3,1)';
            bar.style.height = targetHeight;
          }, i * 80);
        });
        chartObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const miniChart = document.querySelector('.feature-mini-chart');
  if (miniChart) chartObserver.observe(miniChart);

  /* ============================================================
     CURSOR GLOW EFFECT (desktop only)
     ============================================================ */
  if (window.innerWidth > 768) {
    const glow = document.createElement('div');
    glow.style.cssText = `
      position: fixed; pointer-events: none; z-index: 9999;
      width: 300px; height: 300px; border-radius: 50%;
      background: radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%);
      transform: translate(-50%, -50%);
      transition: opacity 0.3s ease;
      top: 0; left: 0;
    `;
    document.body.appendChild(glow);
    document.addEventListener('mousemove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }, { passive: true });
  }

  /* ============================================================
     TREND ALERT BUTTONS — Click feedback
     ============================================================ */
  document.querySelectorAll('.alert-cta').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const original = this.textContent;
      this.textContent = '✓ Đã thêm!';
      this.style.background = 'rgba(16, 185, 129, 0.2)';
      this.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      this.style.color = '#34d399';
      setTimeout(() => {
        this.textContent = original;
        this.style.background = '';
        this.style.borderColor = '';
        this.style.color = '';
      }, 2000);
    });
  });

  /* ============================================================
     PRICING CTA — Track plan selection
     ============================================================ */
  document.querySelectorAll('.btn-price').forEach(btn => {
    btn.addEventListener('click', function (e) {
      if (this.classList.contains('btn-primary-price')) {
        e.preventDefault();
        this.textContent = '✓ Đang chuyển hướng...';
        this.style.pointerEvents = 'none';
        setTimeout(() => {
          this.textContent = 'Dùng thử 14 ngày';
          this.style.pointerEvents = '';
          // In production: redirect to signup page
          alert('🚀 Chào mừng! Tính năng đăng ký sẽ sớm được ra mắt.\n\nLiên hệ Zalo để được hỗ trợ sớm!');
        }, 800);
      }
    });
  });

  /* ============================================================
     FLOATING CARDS — Random micro-movement
     ============================================================ */
  document.querySelectorAll('.float-card').forEach((card, i) => {
    setInterval(() => {
      const x = (Math.random() - 0.5) * 6;
      const y = (Math.random() - 0.5) * 6;
      card.style.transform = `translate(${x}px, ${y}px)`;
    }, 2000 + i * 500);
  });

  /* ============================================================
     HERO CTA — Pulse animation on idle
     ============================================================ */
  let idleTimer;
  const heroCta = document.getElementById('heroCta');
  if (heroCta) {
    function resetIdle() {
      clearTimeout(idleTimer);
      heroCta.style.animation = '';
      idleTimer = setTimeout(() => {
        heroCta.style.animation = 'ctaPulse 1.5s ease-in-out 3';
      }, 5000);
    }

    const style = document.createElement('style');
    style.textContent = `
      @keyframes ctaPulse {
        0%, 100% { box-shadow: 0 4px 30px rgba(139,92,246,0.35); }
        50% { box-shadow: 0 4px 50px rgba(139,92,246,0.7), 0 0 80px rgba(139,92,246,0.3); }
      }
    `;
    document.head.appendChild(style);
    document.addEventListener('scroll', resetIdle, { passive: true });
    document.addEventListener('mousemove', resetIdle, { passive: true });
    resetIdle();
  }

  /* ============================================================
     LOGO — Init
     ============================================================ */
  console.log('%c✦ SmartMkt AI — Loaded', 'color:#8b5cf6;font-weight:bold;font-size:14px');
})();
