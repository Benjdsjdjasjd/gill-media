/* ============================================
   GILL MEDIA — Main JavaScript
   Animations, scroll effects, interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- CUSTOM CURSOR ----------
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursor-follower');
  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;

  if (window.matchMedia('(hover: hover)').matches && cursor && follower) {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
    });

    // Smooth follower
    function animateFollower() {
      followerX += (mouseX - followerX) * 0.12;
      followerY += (mouseY - followerY) * 0.12;
      follower.style.left = followerX + 'px';
      follower.style.top = followerY + 'px';
      requestAnimationFrame(animateFollower);
    }
    animateFollower();

    // Hover effects on interactive elements
    const interactiveEls = document.querySelectorAll('a, button, .service-card, .pricing-card, .work-card, .showcase-card, input, textarea, select');
    interactiveEls.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('active');
        follower.classList.add('active');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('active');
        follower.classList.remove('active');
      });
    });
  }

  // ---------- NAVIGATION ----------
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-menu__link');

  // Scroll effect on nav
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  });

  // Mobile menu toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ---------- HERO ANIMATIONS ----------
  // Title reveal
  setTimeout(() => {
    const words = document.querySelectorAll('.hero__title-word');
    words.forEach((word, i) => {
      setTimeout(() => word.classList.add('visible'), i * 200);
    });

    // Subtitle and actions
    setTimeout(() => {
      const subtitle = document.querySelector('.hero__subtitle');
      const actions = document.querySelector('.hero__actions');
      if (subtitle) subtitle.classList.add('visible');
      if (actions) actions.classList.add('visible');
    }, 800);
  }, 300);

  // Stat counter animation
  function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-count'));
      const duration = 2000;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        counter.textContent = Math.round(target * ease);
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    });
  }

  // Trigger counters when hero is visible
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(animateCounters, 1000);
        heroObserver.disconnect();
      }
    });
  }, { threshold: 0.5 });

  const heroSection = document.querySelector('.hero');
  if (heroSection) heroObserver.observe(heroSection);

  // ---------- PARTICLE CANVAS ----------
  const canvas = document.getElementById('heroParticles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;

    function resizeCanvas() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.1;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
          this.reset();
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 106, 239, ${this.opacity})`;
        ctx.fill();
      }
    }

    // Create particles
    const particleCount = Math.min(80, Math.floor(canvas.width * canvas.height / 15000));
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(124, 106, 239, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

  // ---------- SCROLL REVEAL ----------
  // Add reveal classes to elements
  const revealSelectors = [
    '.services__header',
    '.services__intro',
    '.pricing-card',
    '.work__header',
    '.showcase-card',
    '.work__cta',
    '.about__header',
    '.about__lead',
    '.about__text',
    '.about__value',
    '.about__visual',
    '.testimonial',
    '.contact__header',
    '.contact__form',
    '.contact__info'
  ];

  revealSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.classList.add('reveal');
    });
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Stagger children
  document.querySelectorAll('.stagger-children').forEach(el => revealObserver.observe(el));

  // ---------- GSAP SCROLL ANIMATIONS ----------
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Parallax orbs in hero
    gsap.to('.hero__orb--1', {
      y: -100,
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      }
    });
    gsap.to('.hero__orb--2', {
      y: -80,
      x: 40,
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      }
    });

    // About image parallax
    gsap.to('.about__image-frame--1', {
      y: -30,
      scrollTrigger: {
        trigger: '.about__visual',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });
    gsap.to('.about__image-frame--2', {
      y: 20,
      scrollTrigger: {
        trigger: '.about__visual',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });

    // Marquee speed up on scroll
    gsap.to('.marquee__inner', {
      x: '-=200',
      ease: 'none',
      scrollTrigger: {
        trigger: '.marquee',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.5
      }
    });

    // Nav theme system — each section gets a completely different nav identity
    const navThemes = [
      { el: '.hero', theme: '' },
      { el: '.services', theme: 'nav--services' },
      { el: '.work', theme: 'nav--showcases' },
      { el: '.about', theme: 'nav--about' },
      { el: '.contact', theme: 'nav--contact' }
    ];

    const allNavThemeClasses = ['nav--services', 'nav--showcases', 'nav--about', 'nav--contact'];

    function setNavTheme(theme) {
      nav.classList.remove(...allNavThemeClasses);
      if (theme) nav.classList.add(theme);
    }

    navThemes.forEach(section => {
      const sectionEl = document.querySelector(section.el);
      if (!sectionEl) return;

      ScrollTrigger.create({
        trigger: sectionEl,
        start: 'top 60px',
        end: 'bottom 60px',
        onEnter: () => setNavTheme(section.theme),
        onEnterBack: () => setNavTheme(section.theme),
      });
    });
  }

  // ---------- SMOOTH SCROLL ----------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---------- CONTACT FORM ----------
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const btn = this.querySelector('.contact__submit');
      const originalContent = btn.innerHTML;
      btn.innerHTML = '<span>Sending...</span>';
      btn.style.pointerEvents = 'none';

      const formData = new FormData(this);

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      })
      .then(response => {
        if (response.ok) {
          btn.innerHTML = '<span>Message Sent!</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
          btn.style.background = 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)';
          setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.style.background = '';
            btn.style.pointerEvents = '';
            contactForm.reset();
          }, 3000);
        } else {
          throw new Error('Form submission failed');
        }
      })
      .catch(error => {
        btn.innerHTML = '<span>Error — Try Again</span>';
        btn.style.background = 'linear-gradient(135deg, #ff4444 0%, #ff6666 100%)';
        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.style.background = '';
          btn.style.pointerEvents = '';
        }, 3000);
      });
    });
  }

  // ---------- MAGNETIC BUTTON EFFECT ----------
  document.querySelectorAll('.hero__btn, .contact__submit, .nav__link--cta').forEach(btn => {
    btn.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      this.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    btn.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });

  // ---------- TILT EFFECT ON WORK CARDS ----------
  document.querySelectorAll('.work-card').forEach(card => {
    card.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateX = (y - 0.5) * -8;
      const rotateY = (x - 0.5) * 8;
      this.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });

  // ---------- SERVICE CARD GLOW FOLLOW ----------
  document.querySelectorAll('.service-card, .pricing-card').forEach(card => {
    card.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.style.setProperty('--glow-x', x + 'px');
      this.style.setProperty('--glow-y', y + 'px');
    });
  });

  // ---------- GSAP CONTACT SHAPE PARALLAX ----------
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.to('.contact__shape--1', {
      y: -60,
      x: 30,
      scrollTrigger: {
        trigger: '.contact',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });
    gsap.to('.contact__shape--2', {
      y: 40,
      x: -20,
      scrollTrigger: {
        trigger: '.contact',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });
    gsap.to('.contact__shape--3', {
      y: -30,
      x: 40,
      scrollTrigger: {
        trigger: '.contact',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });
    gsap.to('.contact__shape--4', {
      y: 50,
      x: -30,
      scrollTrigger: {
        trigger: '.contact',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });
  }

});
