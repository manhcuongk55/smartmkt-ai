// ============================================================
// SmartMkt AI — Settings Page Logic
// ============================================================

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  // ============================================================
  // LOAD SAVED CONFIG
  // ============================================================
  function loadConfig() {
    const config = ERPNextAPI.getConfig();
    const mode = ERPNextAPI.getMode();

    // Set mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Show/hide ERPNext config section
    updateConfigVisibility(mode);

    // Fill form
    if (config) {
      $('#erpUrl').value = config.baseUrl || '';
      $('#erpApiKey').value = config.apiKey || '';
      $('#erpApiSecret').value = config.apiSecret || '';
    }

    // Update connection status
    updateConnectionBadge();
  }

  // ============================================================
  // MODE SWITCHING
  // ============================================================
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      ERPNextAPI.setMode(mode);

      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      updateConfigVisibility(mode);
      updateConnectionBadge();

      showToast(
        mode === 'erpnext'
          ? '🏢 Đã chuyển sang ERPNext Mode'
          : '💾 Đã chuyển sang Demo Mode (localStorage)',
        'info'
      );
    });
  });

  function updateConfigVisibility(mode) {
    const configSection = $('#erpnextConfig');
    if (mode === 'erpnext') {
      configSection.style.opacity = '1';
      configSection.style.pointerEvents = 'auto';
    } else {
      configSection.style.opacity = '0.5';
      configSection.style.pointerEvents = 'none';
    }
  }

  // ============================================================
  // CONNECTION STATUS BADGE
  // ============================================================
  function updateConnectionBadge() {
    const badge = $('#connectionBadge');
    const text = badge.querySelector('.conn-text');

    if (ERPNextAPI.isERPNextActive()) {
      badge.classList.add('connected');
      text.textContent = 'Đã kết nối';
    } else {
      badge.classList.remove('connected');
      text.textContent = ERPNextAPI.getMode() === 'erpnext' ? 'Chưa cấu hình' : 'Demo Mode';
    }
  }

  // ============================================================
  // TEST CONNECTION
  // ============================================================
  $('#btnTest').addEventListener('click', async () => {
    const btn = $('#btnTest');
    const resultDiv = $('#testResult');
    const testIcon = $('#testIcon');
    const testMsg = $('#testMessage');

    const url = $('#erpUrl').value.trim();
    const key = $('#erpApiKey').value.trim();
    const secret = $('#erpApiSecret').value.trim();

    if (!url || !key || !secret) {
      resultDiv.style.display = 'flex';
      resultDiv.className = 'test-result error';
      testIcon.textContent = '❌';
      testMsg.textContent = 'Vui lòng điền đầy đủ URL, API Key và API Secret';
      return;
    }

    // Show loading
    btn.disabled = true;
    btn.classList.add('testing');
    btn.querySelector('span') || (btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Đang kiểm tra...
    `);

    const result = await ERPNextAPI.testConnection({
      baseUrl: url,
      apiKey: key,
      apiSecret: secret,
    });

    // Show result
    resultDiv.style.display = 'flex';
    if (result.success) {
      resultDiv.className = 'test-result success';
      testIcon.textContent = '✅';
      testMsg.textContent = result.message;
      updateConnectionBadge();
    } else {
      resultDiv.className = 'test-result error';
      testIcon.textContent = '❌';
      testMsg.textContent = result.message;
    }

    btn.disabled = false;
    btn.classList.remove('testing');
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Kiểm tra kết nối
    `;
  });

  // ============================================================
  // SAVE CONFIG
  // ============================================================
  $('#erpnextForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const url = $('#erpUrl').value.trim();
    const key = $('#erpApiKey').value.trim();
    const secret = $('#erpApiSecret').value.trim();

    if (!url) {
      showToast('⚠️ Vui lòng nhập ERPNext URL', 'error');
      return;
    }

    ERPNextAPI.saveConfig({
      baseUrl: url,
      apiKey: key,
      apiSecret: secret,
    });

    updateConnectionBadge();
    showToast('✅ Đã lưu cấu hình ERPNext!', 'success');
  });

  // ============================================================
  // SECRET TOGGLE (show/hide password)
  // ============================================================
  $('#secretToggle').addEventListener('click', () => {
    const input = $('#erpApiSecret');
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
  });

  // ============================================================
  // SIDEBAR TOGGLE (mobile)
  // ============================================================
  const sidebarToggle = $('#sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      $('#sidebar').classList.toggle('open');
    });
  }

  // ============================================================
  // TOAST
  // ============================================================
  function showToast(message, type = 'success') {
    const container = $('#toastContainer');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ============================================================
  // INIT
  // ============================================================
  loadConfig();

  console.log('%c✦ SmartMkt AI Settings — Loaded', 'color:#8b5cf6;font-weight:bold;font-size:14px');
})();
