// ============================================================
// SmartMkt AI — Dashboard CRUD Logic
// ============================================================
// CRUD Flow:
// CREATE → submit form → call API → update state → re-render list
// READ   → fetch API → set state → render UI
// UPDATE → load data vào form → edit → call API → update state → re-render
// DELETE → click delete → call API → remove khỏi state → re-render
// ============================================================

(function () {
  'use strict';

  // ============================================================
  // MOCK API (simulates backend with localStorage)
  // ============================================================
  const API = {
    STORAGE_KEY: 'smartmkt_campaigns',
    _delay: () => new Promise(r => setTimeout(r, 200 + Math.random() * 300)),

    async getAll() {
      await this._delay();
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    },

    async getById(id) {
      await this._delay();
      const all = await this.getAll();
      return all.find(c => c.id === id) || null;
    },

    async create(campaign) {
      await this._delay();
      const all = await this.getAll();
      const newCampaign = {
        ...campaign,
        id: 'camp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      all.unshift(newCampaign);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
      return newCampaign;
    },

    async update(id, data) {
      await this._delay();
      const all = await this.getAll();
      const idx = all.findIndex(c => c.id === id);
      if (idx === -1) throw new Error('Campaign không tồn tại');
      all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
      return all[idx];
    },

    async delete(id) {
      await this._delay();
      let all = await this.getAll();
      all = all.filter(c => c.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
      return true;
    },
  };

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

  // ============================================================
  // SEED DATA (first-time demo)
  // ============================================================
  function seedIfEmpty() {
    const existing = localStorage.getItem(API.STORAGE_KEY);
    if (existing && JSON.parse(existing).length > 0) return;

    const seeds = [
      {
        id: 'camp_demo_1',
        name: 'Sale Hè 2026 — TikTok Viral',
        platform: 'tiktok',
        type: 'full',
        budget: 5000000,
        status: 'active',
        description: 'Campaign chạy video viral trên TikTok cho mùa sale hè, target Gen Z tại HCM',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        createdAt: '2026-03-15T10:00:00Z',
        updatedAt: '2026-03-15T10:00:00Z',
      },
      {
        id: 'camp_demo_2',
        name: 'Quảng bá quán Bún Bò Cô Tám',
        platform: 'facebook',
        type: 'content',
        budget: 1500000,
        status: 'active',
        description: 'Content AI cho quán bún bò, đăng tự động Facebook + Zalo mỗi ngày',
        startDate: '2026-03-01',
        endDate: '2026-04-30',
        createdAt: '2026-03-01T08:00:00Z',
        updatedAt: '2026-03-10T14:30:00Z',
      },
      {
        id: 'camp_demo_3',
        name: 'Shop Thời Trang Mây — Instagram',
        platform: 'instagram',
        type: 'ads',
        budget: 3000000,
        status: 'draft',
        description: 'Chạy Instagram Ads cho bộ sưu tập xuân hè mới',
        startDate: '2026-04-01',
        endDate: '2026-05-15',
        createdAt: '2026-03-12T09:00:00Z',
        updatedAt: '2026-03-12T09:00:00Z',
      },
      {
        id: 'camp_demo_4',
        name: 'Chatbot khuyến mãi cuối năm',
        platform: 'zalo',
        type: 'chatbot',
        budget: 800000,
        status: 'completed',
        description: 'Chatbot Zalo OA tự đông gửi voucher và chăm sóc khách cũ',
        startDate: '2025-12-01',
        endDate: '2025-12-31',
        createdAt: '2025-11-20T10:00:00Z',
        updatedAt: '2026-01-02T08:00:00Z',
      },
      {
        id: 'camp_demo_5',
        name: 'Đa kênh — Ra mắt sản phẩm mới',
        platform: 'multi',
        type: 'full',
        budget: 10000000,
        status: 'active',
        description: 'Campaign 360 trên TikTok + Facebook + Zalo cho sản phẩm skincare mới',
        startDate: '2026-03-10',
        endDate: '2026-04-10',
        createdAt: '2026-03-08T14:00:00Z',
        updatedAt: '2026-03-16T10:00:00Z',
      },
    ];

    localStorage.setItem(API.STORAGE_KEY, JSON.stringify(seeds));
  }

  // ============================================================
  // READ — Fetch API → Set State → Render UI
  // ============================================================
  async function fetchCampaigns() {
    try {
      campaigns = await API.getAll();
      updateStats();
      renderList();
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
      const created = await API.create(data);
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
      const updated = await API.update(id, data);
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
      await API.delete(deletingId);
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
  // INIT — Seed data + Fetch (READ)
  // ============================================================
  seedIfEmpty();
  fetchCampaigns();

  console.log('%c✦ SmartMkt AI Dashboard — CRUD Ready', 'color:#8b5cf6;font-weight:bold;font-size:14px');
  console.log('%c  Ctrl+N → Tạo campaign mới', 'color:#94a3b8;font-size:12px');
})();
