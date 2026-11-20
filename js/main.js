/* ==========================================================================
   Da'Vinci — interactions
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- Header */
  var header = document.getElementById('siteHeader');
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* --------------------------------------------------------------- Mobile nav */
  function closeNav() {
    if (!nav || !burger) return;
    nav.classList.remove('is-open');
    burger.classList.remove('is-active');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.classList.toggle('is-active', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      document.body.classList.toggle('no-scroll', open);
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) closeNav();
    });
  }

  /* ------------------------------------------------------------------ Modal */
  var modal = document.getElementById('bookingModal');
  var lastFocused = null;

  function getFocusable(scope) {
    return Array.prototype.slice.call(
      scope.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) {
      return el.offsetParent !== null;
    });
  }

  function resetForm(form) {
    if (!form) return;
    form.reset();
    form.querySelectorAll('.is-invalid').forEach(function (el) { el.classList.remove('is-invalid'); });
    form.querySelectorAll('.field__error').forEach(function (el) { el.textContent = ''; });
    var success = form.querySelector('.form__success');
    if (success) success.hidden = true;
    form.querySelectorAll('input, select, button').forEach(function (el) {
      el.disabled = false;
      el.style.opacity = '';
    });
  }

  function openModal(service) {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');

    var modalForm = modal.querySelector('.form');
    resetForm(modalForm);

    var select = modal.querySelector('select[name="service"]');
    if (select && service) {
      Array.prototype.forEach.call(select.options, function (opt) {
        if (opt.textContent.trim().toLowerCase() === service.trim().toLowerCase()) {
          select.value = opt.value || opt.textContent;
        }
      });
    }

    var first = modal.querySelector('input[name="name"]');
    window.setTimeout(function () {
      if (first) first.focus();
    }, 120);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  if (modal) {
    document.querySelectorAll('[data-open-booking]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeNav();
        openModal(btn.getAttribute('data-service'));
      });
    });

    modal.querySelectorAll('[data-close-modal]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Tab') {
        var items = getFocusable(modal);
        if (!items.length) return;
        var firstItem = items[0];
        var lastItem = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstItem) {
          e.preventDefault();
          lastItem.focus();
        } else if (!e.shiftKey && document.activeElement === lastItem) {
          e.preventDefault();
          firstItem.focus();
        }
      }
    });
  }

  /* ------------------------------------------------------------ Phone input */
  function maskPhone(value) {
    var digits = value.replace(/\D/g, '');
    if (digits.charAt(0) === '8') digits = '7' + digits.slice(1);
    if (digits.charAt(0) !== '7') digits = '7' + digits;
    digits = digits.slice(0, 11);

    var out = '+7';
    if (digits.length > 1) out += ' (' + digits.slice(1, 4);
    if (digits.length >= 5) out += ') ' + digits.slice(4, 7);
    if (digits.length >= 8) out += '-' + digits.slice(7, 9);
    if (digits.length >= 10) out += '-' + digits.slice(9, 11);
    return out;
  }

  document.querySelectorAll('input[type="tel"]').forEach(function (input) {
    input.addEventListener('input', function () {
      input.value = maskPhone(input.value);
      clearError(input);
    });
    input.addEventListener('focus', function () {
      if (!input.value) input.value = '+7 (';
    });
    input.addEventListener('blur', function () {
      if (input.value.replace(/\D/g, '').length <= 1) input.value = '';
    });
  });

  function clearError(input) {
    var field = input.closest('.field');
    var error = field && field.querySelector('.field__error');
    if (field) field.classList.remove('is-invalid');
    if (error) error.textContent = '';
  }

  function setError(input, message) {
    var field = input.closest('.field');
    var error = field && field.querySelector('.field__error');
    if (field) field.classList.add('is-invalid');
    if (error) error.textContent = message;
  }

  document.querySelectorAll('.form input').forEach(function (input) {
    input.addEventListener('input', function () { clearError(input); });
  });

  /* ------------------------------------------------------------------ Forms */
  document.querySelectorAll('.form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.querySelector('input[name="name"]');
      var phone = form.querySelector('input[name="phone"]');
      var valid = true;

      if (name && name.value.trim().length < 2) {
        setError(name, 'Пожалуйста, укажите имя');
        valid = false;
      }
      if (phone && phone.value.replace(/\D/g, '').length < 11) {
        setError(phone, 'Введите номер полностью');
        valid = false;
      }
      if (!valid) return;

      // Демо-режим: данные никуда не отправляются.
      // Для подключения заявок — замените этот блок на fetch() к вашему API.
      var success = form.querySelector('.form__success');
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      form.querySelectorAll('input, select, button[type="submit"]').forEach(function (el) {
        el.disabled = true;
        el.style.opacity = '.55';
      });
    });
  });

  /* --------------------------------------------------------------- Reveal on scroll */
  var revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    revealItems.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ------------------------------------------------------------------ Counters */
  function animateCounter(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';

    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var duration = 1500;
    var start = null;

    function format(value) {
      var text = value.toFixed(decimals);
      return decimals ? text.replace('.', ',') : text;
    }

    if (reduceMotion) { el.textContent = format(target); return; }

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = format(target * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { counterObserver.observe(el); });
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* ------------------------------------------------------------------ Parallax */
  var parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length && !reduceMotion && window.innerWidth > 980) {
    var ticking = false;

    function updateParallax() {
      parallaxEls.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        var progress = (window.innerHeight / 2 - (rect.top + rect.height / 2)) / window.innerHeight;
        el.style.transform = 'translate3d(0, ' + (progress * 46).toFixed(2) + 'px, 0) scale(1.07)';
      });
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
    updateParallax();
  }

  /* ----------------------------------------------------------- Compare slider */
  document.querySelectorAll('[data-compare]').forEach(function (compare) {
    var handle = compare.querySelector('.compare__handle');
    var current = 50;

    function setPosition(percent) {
      current = Math.max(0, Math.min(100, percent));
      compare.style.setProperty('--pos', current + '%');
      if (handle) handle.setAttribute('aria-valuenow', Math.round(current));
    }

    function positionFromEvent(clientX) {
      var rect = compare.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    }

    compare.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.compare__handle')) return;
      compare.setPointerCapture(e.pointerId);
      compare.dataset.dragging = '1';
      setPosition(positionFromEvent(e.clientX));
    });

    compare.addEventListener('pointermove', function (e) {
      if (compare.dataset.dragging !== '1') return;
      e.preventDefault();
      setPosition(positionFromEvent(e.clientX));
    });

    function stopDrag() { compare.dataset.dragging = '0'; }
    compare.addEventListener('pointerup', stopDrag);
    compare.addEventListener('pointercancel', stopDrag);
    compare.addEventListener('pointerleave', stopDrag);

    if (handle) {
      handle.addEventListener('pointerdown', function (e) {
        e.stopPropagation();
        compare.setPointerCapture(e.pointerId);
        compare.dataset.dragging = '1';
      });

      handle.addEventListener('keydown', function (e) {
        var step = e.shiftKey ? 10 : 4;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          setPosition(current - step);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          setPosition(current + step);
        } else if (e.key === 'Home') {
          e.preventDefault();
          setPosition(0);
        } else if (e.key === 'End') {
          e.preventDefault();
          setPosition(100);
        }
      });
    }

    setPosition(current);
  });

  /* ------------------------------------------------------------------- Year */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
