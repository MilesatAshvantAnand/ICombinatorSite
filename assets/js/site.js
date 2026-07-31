/* I Combinator — mobile nav, company filtering, accessible form handling.
   No backend in v1: forms POST to FORM_ENDPOINT if configured, else fall back
   to a prefilled mailto so the site is functional the moment it is deployed. */
(() => {
  'use strict';

  // FormSubmit requires no account: the first submission sends a one-time confirmation
  // email to CONTACT_EMAIL which must be clicked before further submissions are delivered.
  const FORM_ENDPOINT = 'https://formsubmit.co/ajax/icombinatorireland@gmail.com';
  const CONTACT_EMAIL = 'icombinatorireland@gmail.com';

  /* ---------- mobile nav ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  const mq = window.matchMedia('(max-width: 880px)');

  function syncNav() {
    if (!toggle || !nav) return;
    if (mq.matches) {
      nav.hidden = toggle.getAttribute('aria-expanded') !== 'true';
    } else {
      nav.hidden = false;
      toggle.setAttribute('aria-expanded', 'false');
    }
  }
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', toggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
      syncNav();
    });
    mq.addEventListener('change', syncNav);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mq.matches && !nav.hidden) {
        toggle.setAttribute('aria-expanded', 'false'); syncNav(); toggle.focus();
      }
    });
    syncNav();
  }

  /* ---------- company sector filter ---------- */
  const filters = document.querySelectorAll('.filter');
  const companies = document.querySelectorAll('[data-sector]');
  const countEl = document.getElementById('company-count');
  if (filters.length && companies.length) {
    filters.forEach(btn => btn.addEventListener('click', () => {
      const want = btn.dataset.filter;
      filters.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      let shown = 0;
      companies.forEach(c => {
        const match = want === 'all' || c.dataset.sector === want;
        c.hidden = !match;
        if (match) shown++;
      });
      if (countEl) countEl.textContent = `${shown} ${shown === 1 ? 'company' : 'companies'}`;
    }));
  }

  /* ---------- forms ---------- */
  function showError(field, message) {
    field.classList.add('field--error');
    const msg = field.querySelector('.error-msg');
    const input = field.querySelector('input, textarea, select');
    if (msg) { msg.textContent = message; msg.hidden = false; }
    if (input) input.setAttribute('aria-invalid', 'true');
  }
  function clearError(field) {
    field.classList.remove('field--error');
    const msg = field.querySelector('.error-msg');
    const input = field.querySelector('input, textarea, select');
    if (msg) msg.hidden = true;
    if (input) input.removeAttribute('aria-invalid');
  }

  function validate(form) {
    let firstBad = null;
    form.querySelectorAll('.field').forEach(field => {
      const input = field.querySelector('input, textarea, select');
      if (!input) return;
      clearError(field);
      const value = (input.type === 'checkbox') ? input.checked : input.value.trim();

      if (input.required && !value) {
        showError(field, input.type === 'checkbox' ? 'Please confirm to continue.' : 'This field is required.');
        firstBad = firstBad || input;
        return;
      }
      if (input.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        showError(field, 'Enter a valid email address.');
        firstBad = firstBad || input;
        return;
      }
      if (input.dataset.minwords) {
        const words = String(value).split(/\s+/).filter(Boolean).length;
        if (value && words < Number(input.dataset.minwords)) {
          showError(field, `Please write at least ${input.dataset.minwords} words — this is read by a person.`);
          firstBad = firstBad || input;
        }
      }
    });
    return firstBad;
  }

  document.querySelectorAll('form[data-form]').forEach(form => {
    const status = form.querySelector('.status');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const bad = validate(form);
      if (bad) { bad.focus(); return; }

      const data = Object.fromEntries(new FormData(form).entries());
      const subject = `[I Combinator] ${form.dataset.form}`;
      const btn = form.querySelector('button[type="submit"]');

      if (FORM_ENDPOINT) {
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
        try {
          const payload = { _subject: subject, _template: 'table', _captcha: 'false', ...data };
          if (data.email) payload._replyto = data.email;          // let the team hit "reply" directly
          if (form.dataset.autoresponse) payload._autoresponse = form.dataset.autoresponse;

          const res = await fetch(FORM_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload),
          });
          let json = null;
          try { json = await res.json(); } catch (_) { /* non-JSON body */ }
          // FormSubmit can return HTTP 200 with success:false (e.g. pending inbox activation) —
          // trusting res.ok alone silently drops those as false positives.
          if (!res.ok || (json && json.success === false)) {
            throw new Error((json && json.message) || `request failed (${res.status})`);
          }
          form.reset();
          if (status) { status.hidden = false; status.textContent = form.dataset.success ||
            'Received. We read every submission and will reply directly.'; status.focus(); }
        } catch (err) {
          if (status) { status.hidden = false;
            status.textContent = `Could not submit automatically (${err.message}). Please email ${CONTACT_EMAIL} instead.`;
            status.focus(); }
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Submit'; }
        }
        return;
      }

      // Fallback: no endpoint configured — hand off to the user's mail client.
      const body = Object.entries(data)
        .filter(([k]) => k !== 'consent' && k !== '_honey')
        .map(([k, v]) => `${k}: ${v}`).join('\n');
      window.location.href =
        `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      if (status) {
        status.hidden = false;
        status.textContent = `Opening your email client to send this to ${CONTACT_EMAIL}. If nothing happens, email us directly.`;
        status.focus();
      }
    });
  });

  /* ---------- current year ---------- */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
