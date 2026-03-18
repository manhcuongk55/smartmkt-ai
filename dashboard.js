// ============================================================
// SmartMkt AI — Dashboard CRUD Logic (ERPNext Integrated)
// ============================================================
// Uses ERPNextAPI unified client for all data operations.
// Automatically routes to ERPNext or localStorage based on Settings.
//
// CRUD Flow:
// CREATE → submit form → call API → update state → re-render list
// READ   → fetch API → set state → render UI
// UPDATE → load data vào form → edit → call API → update state → re-render
// DELETE → click delete → call API → remove khỏi state → re-render
// ============================================================

(function () {
  'use strict';

  // ============================================================
  // STATE
  // ============================================================
  let campaigns = [];
  let currentFilter = 'all';
  let editingId = null;
  let deletingId = null;

  // ============================================================
  // DOM ELEMENTS
  // ============================================================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const campaignList = $('#campaignList');
  const emptyState = $('#emptyState');
  const modalOverlay = $('#modalOverlay');
  const deleteOverlay = $('#deleteOverlay');
  const campaignForm = $('#campaignForm');
  const searchInput = $('#searchInput');

  // Stats
  const statTotal = $('#statTotal');
  const statActive = $('#statActive');
  const statDraft = $('#statDraft');
  const statBudget = $('#statBudget');

  // API Mode badge
  const apiModeBadge = $('#apiModeBadge');

  // ============================================================
  // API MODE BADGE
  // ============================================================
  function updateApiModeBadge() {
    if (!apiModeBadge) return;
    const isErp = ERPNextAPI.isERPNextActive();
    const modeText = apiModeBadge.querySelector('.api-mode-text');
    const dot = apiModeBadge.querySelector('.api-dot');

    if (isErp) {
      modeText.textContent = 'ERPNext';
      apiModeBadge.className = 'api-mode-badge mode-erpnext';
    } else {
      modeText.textContent = 'Demo';
      apiModeBadge.className = 'api-mode-badge mode-local';
    }

    apiModeBadge.onclick = () => { window.location.href = 'settings.html'; };
    apiModeBadge.style.cursor = 'pointer';
  }

  // Inject badge styles
  const badgeStyle = document.createElement('style');
  badgeStyle.textContent = `
    .api-mode-badge {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 14px; border-radius: 50px;
      font-size: 11px; font-weight: 700;
      transition: all 0.25s ease;
    }
    .api-mode-badge:hover { transform: translateY(-1px); }
    .api-dot { width: 7px; height: 7px; border-radius: 50%; }
    .mode-local {
      background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25); color: #fbbf24;
    }
    .mode-local .api-dot { background: #fbbf24; }
    .mode-erpnext {
      background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); color: #34d399;
    }
    .mode-erpnext .api-dot { background: #34d399; animation: dotPulse 1.5s ease-in-out infinite; }
    @keyframes dotPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  `;
  document.head.appendChild(badgeStyle);

  // ============================================================
  // READ — Fetch API → Set State → Render UI
  // ============================================================
  async function fetchCampaigns() {
    try {
      campaigns = await ERPNextAPI.getAll();
      updateStats();
      renderList();
      updateApiModeBadge();
    } catch (err) {
      showToast('Lỗi khi tải dữ liệu: ' + err.message, 'error');
    }
  }

  // ============================================================
  // RENDER LIST
  // ============================================================
  function renderList() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    let filtered = campaigns;

    // Filter by status tab
    if (currentFilter !== 'all') {
      filtered = filtered.filter(c => c.status === currentFilter);
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm) ||
        (c.description && c.description.toLowerCase().includes(searchTerm))
      );
    }

    if (filtered.length === 0) {
      campaignList.innerHTML = '';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';

    // List header
    let html = `
      <div class="campaign-list-header">
        <span>Tên campaign</span>
        <span>Nền tảng</span>
        <span>Loại</span>
        <span>Ngân sách</span>
        <span>Trạng thái</span>
        <span></span>
      </div>
    `;

    filtered.forEach((c, i) => {
      const platformLabel = getPlatformLabel(c.platform);
      const typeLabel = getTypeLabel(c.type);
      const statusClass = 'status-' + c.status;
      const statusLabel = getStatusLabel(c.status);
      const budgetFormatted = formatBudget(c.budget);

      html += `
        <div class="campaign-item" style="animation-delay: ${i * 0.05}s" data-id="${c.id}">
          <div class="camp-name-col">
            <div class="camp-name">${escHtml(c.name)}</div>
            <div class="camp-desc">${escHtml(c.description || '')}</div>
          </div>
          <div class="camp-platform">
            <span class="plat-dot plat-${c.platform}"></span>
            ${platformLabel}
          </div>
          <div class="camp-type">${typeLabel}</div>
          <div class="camp-budget">${budgetFormatted}</div>
          <div>
            <span class="camp-status ${statusClass}">${statusLabel}</span>
          </div>
          <div class="camp-actions">
            <button class="action-btn edit-btn" title="Sửa" onclick="editCampaign('${c.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="action-btn delete-btn" title="Xóa" onclick="deleteCampaign('${c.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>
      `;
    });

    campaignList.innerHTML = html;
  }

  // ============================================================
  // UPDATE STATS
  // ============================================================
  function updateStats() {
    const total = campaigns.length;
    const active = campaigns.filter(c => c.status === 'active').length;
    const draft = campaigns.filter(c => c.status === 'draft').length;
    const budget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);

    animateNumber(statTotal, total);
    animateNumber(statActive, active);
    animateNumber(statDraft, draft);
    statBudget.textContent = formatBudgetShort(budget);
  }

  function animateNumber(el, target) {
    const current = parseInt(el.textContent) || 0;
    if (current === target) { el.textContent = target; return; }
    const start = performance.now();
    const dur = 400;
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(current + (target - current) * p);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ============================================================
  // CREATE — Submit form → Call API → Update state → Re-render
  // ============================================================
  async function createCampaign(data) {
    try {
      const created = await ERPNextAPI.create(data);
      campaigns.unshift(created);      // → update state
      updateStats();
      renderList();                     // → re-render list
      showToast('✅ Đã tạo campaign thành công!', 'success');
    } catch (err) {
      showToast('❌ Lỗi: ' + err.message, 'error');
    }
  }

  // ============================================================
  // UPDATE — Load data vào form → Edit → Call API → Update state → Re-render
  // ============================================================
  window.editCampaign = async function (id) {
    editingId = id;

    // Load data vào form
    const camp = campaigns.find(c => c.id === id);
    if (!camp) return;

    $('#campaignId').value = camp.id;
    $('#campaignName').value = camp.name;
    $('#campaignPlatform').value = camp.platform;
    $('#campaignType').value = camp.type;
    $('#campaignBudget').value = camp.budget || '';
    $('#campaignStatus').value = camp.status;
    $('#campaignDesc').value = camp.description || '';
    $('#campaignStart').value = camp.startDate || '';
    $('#campaignEnd').value = camp.endDate || '';

    // Update modal UI
    $('#modalTitle').textContent = 'Chỉnh sửa Campaign';
    $('#btnSubmitText').textContent = 'Lưu thay đổi';

    openModal();
  };

  async function updateCampaign(id, data) {
    try {
      const updated = await ERPNextAPI.update(id, data);
      // → update state
      const idx = campaigns.findIndex(c => c.id === id);
      if (idx !== -1) campaigns[idx] = updated;
      updateStats();
      renderList();                     // → re-render
      showToast('✅ Đã cập nhật campaign!', 'success');
    } catch (err) {
      showToast('❌ Lỗi: ' + err.message, 'error');
    }
  }

  // ============================================================
  // DELETE — Click delete → Call API → Remove khỏi state → Re-render
  // ============================================================
  window.deleteCampaign = function (id) {
    deletingId = id;
    const camp = campaigns.find(c => c.id === id);
    if (!camp) return;
    $('#deleteName').textContent = camp.name;
    deleteOverlay.classList.add('show');
  };

  async function confirmDelete() {
    if (!deletingId) return;
    try {
      await ERPNextAPI.delete(deletingId);
      // → remove khỏi state
      campaigns = campaigns.filter(c => c.id !== deletingId);
      updateStats();
      renderList();                     // → re-render
      showToast('🗑️ Đã xóa campaign!', 'success');
    } catch (err) {
      showToast('❌ Lỗi: ' + err.message, 'error');
    } finally {
      deletingId = null;
      deleteOverlay.classList.remove('show');
    }
  }

  // ============================================================
  // MODAL CONTROLS
  // ============================================================
  function openModal() {
    modalOverlay.classList.add('show');
    setTimeout(() => $('#campaignName').focus(), 200);
  }

  function closeModal() {
    modalOverlay.classList.remove('show');
    resetForm();
  }

  function resetForm() {
    campaignForm.reset();
    $('#campaignId').value = '';
    editingId = null;
    $('#modalTitle').textContent = 'Tạo Campaign mới';
    $('#btnSubmitText').textContent = 'Tạo Campaign';
  }

  window.openModal = openModal;

  // ============================================================
  // FORM SUBMIT HANDLER
  // ============================================================
  campaignForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      name: $('#campaignName').value.trim(),
      platform: $('#campaignPlatform').value,
      type: $('#campaignType').value,
      budget: parseInt($('#campaignBudget').value) || 0,
      status: $('#campaignStatus').value,
      description: $('#campaignDesc').value.trim(),
      startDate: $('#campaignStart').value,
      endDate: $('#campaignEnd').value,
    };

    if (!data.name) {
      showToast('⚠️ Vui lòng nhập tên campaign!', 'error');
      return;
    }

    // Disable submit while processing
    const btn = $('#btnSubmit');
    btn.disabled = true;
    btn.style.opacity = '0.6';

    if (editingId) {
      // UPDATE flow
      await updateCampaign(editingId, data);
    } else {
      // CREATE flow
      await createCampaign(data);
    }

    btn.disabled = false;
    btn.style.opacity = '1';
    closeModal();
  });

  // ============================================================
  // EVENT LISTENERS
  // ============================================================

  // Create button
  $('#btnCreate').addEventListener('click', () => {
    resetForm();
    openModal();
  });

  // Modal close
  $('#modalClose').addEventListener('click', closeModal);
  $('#btnCancel').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Delete modal
  $('#deleteClose').addEventListener('click', () => deleteOverlay.classList.remove('show'));
  $('#deleteCancelBtn').addEventListener('click', () => deleteOverlay.classList.remove('show'));
  $('#deleteConfirmBtn').addEventListener('click', confirmDelete);
  deleteOverlay.addEventListener('click', (e) => {
    if (e.target === deleteOverlay) deleteOverlay.classList.remove('show');
  });

  // Filter tabs
  $$('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderList();
    });
  });

  // Search
  searchInput.addEventListener('input', renderList);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      deleteOverlay.classList.remove('show');
    }
    if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      resetForm();
      openModal();
    }
  });

  // Sidebar toggle (mobile)
  const sidebar = $('#sidebar');
  const sidebarToggle = $('#sidebarToggle');
  sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

  // Sidebar nav active state
  $$('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      if (item.getAttribute('href') && item.getAttribute('href') !== '#') return; // let links work
      e.preventDefault();
      $$('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      $('#pageTitle').textContent = item.textContent.trim();
    });
  });

  // ============================================================
  // HELPERS
  // ============================================================
  function getPlatformLabel(p) {
    const map = { tiktok: 'TikTok', facebook: 'Facebook', zalo: 'Zalo OA', instagram: 'Instagram', multi: 'Đa kênh' };
    return map[p] || p;
  }
  function getTypeLabel(t) {
    const map = { content: 'Content AI', ads: 'Chạy Ads', chatbot: 'Chatbot', full: 'Full Package' };
    return map[t] || t;
  }
  function getStatusLabel(s) {
    const map = { active: '● Đang chạy', draft: '○ Bản nháp', completed: '✓ Hoàn thành' };
    return map[s] || s;
  }
  function formatBudget(n) {
    if (!n) return '—';
    return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
  }
  function formatBudgetShort(n) {
    if (n >= 1000000000) return (n / 1000000000).toFixed(1) + ' tỷ';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
    return n + 'đ';
  }
  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
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
  fetchCampaigns();

  console.log('%c✦ SmartMkt AI Dashboard — ERPNext Integrated', 'color:#8b5cf6;font-weight:bold;font-size:14px');
  console.log('%c  Mode: ' + (ERPNextAPI.isERPNextActive() ? 'ERPNext' : 'Demo (localStorage)'), 'color:#94a3b8;font-size:12px');
  console.log('%c  Ctrl+N → Tạo campaign mới', 'color:#94a3b8;font-size:12px');
})();
