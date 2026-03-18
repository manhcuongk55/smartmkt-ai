// ============================================================
// SmartMkt AI — Customer CRM Logic
// ============================================================
// Full CRUD for customer/lead management with localStorage
// Maps to ERPNext Lead/Customer doctypes when connected
// ============================================================

(function () {
  'use strict';

  const STORAGE_KEY = 'smartmkt_customers';
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ============================================================
  // STATE
  // ============================================================
  let customers = [];
  let currentFilter = 'all';
  let editingId = null;
  let deletingId = null;

  // ============================================================
  // LOCAL API (mirrors ERPNext pattern)
  // ============================================================
  const API = {
    _delay: () => new Promise(r => setTimeout(r, 150 + Math.random() * 200)),

    async getAll() {
      await this._delay();
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    },
    async create(customer) {
      await this._delay();
      const all = await this.getAll();
      const newCust = {
        ...customer,
        id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      all.unshift(newCust);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return newCust;
    },
    async update(id, data) {
      await this._delay();
      const all = await this.getAll();
      const idx = all.findIndex(c => c.id === id);
      if (idx === -1) throw new Error('Khách hàng không tồn tại');
      all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return all[idx];
    },
    async delete(id) {
      await this._delay();
      let all = await this.getAll();
      all = all.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return true;
    },
  };

  // ============================================================
  // SEED DATA
  // ============================================================
  function seedIfEmpty() {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && JSON.parse(existing).length > 0) return;

    const seeds = [
      {
        id: 'cust_demo_1', name: 'Nguyễn Thị Mai', phone: '0912 345 678',
        email: 'mai.nguyen@gmail.com', source: 'facebook', type: 'customer',
        totalSpent: 2500000, tags: ['thời trang', 'HCM', 'quay lại'],
        note: 'Khách quen, mua đợt sale tháng 3. Thích sản phẩm cao cấp.',
        pendingMessages: 2,
        createdAt: '2026-02-15T08:00:00Z', updatedAt: '2026-03-16T10:00:00Z',
      },
      {
        id: 'cust_demo_2', name: 'Trần Văn Hùng', phone: '0987 654 321',
        email: 'hung.tran@shop.vn', source: 'tiktok', type: 'vip',
        totalSpent: 15000000, tags: ['VIP', 'skincare', 'HN', 'đại lý'],
        note: 'Đại lý nhỏ ở Hà Nội, mua sỉ hàng tháng. Ưu tiên giao hàng nhanh.',
        pendingMessages: 0,
        createdAt: '2026-01-10T14:00:00Z', updatedAt: '2026-03-17T09:00:00Z',
      },
      {
        id: 'cust_demo_3', name: 'Lê Hoàng Anh', phone: '0355 123 456',
        email: '', source: 'zalo', type: 'lead',
        totalSpent: 0, tags: ['Đà Nẵng', 'quan tâm'],
        note: 'Inbox hỏi giá qua Zalo, chưa chốt đơn.',
        pendingMessages: 1,
        createdAt: '2026-03-16T15:00:00Z', updatedAt: '2026-03-16T15:00:00Z',
      },
      {
        id: 'cust_demo_4', name: 'Phạm Minh Tú', phone: '0901 222 333',
        email: 'tu.pham@company.com', source: 'website', type: 'customer',
        totalSpent: 800000, tags: ['phụ kiện', 'HCM'],
        note: 'Đặt hàng qua web, thanh toán COD.',
        pendingMessages: 0,
        createdAt: '2026-03-10T11:00:00Z', updatedAt: '2026-03-14T08:00:00Z',
      },
      {
        id: 'cust_demo_5', name: 'Võ Thị Hương', phone: '0776 888 999',
        email: 'huong.vo@mail.com', source: 'instagram', type: 'lead',
        totalSpent: 0, tags: ['Instagram', 'mỹ phẩm'],
        note: 'Comment hỏi trên Instagram Reels.',
        pendingMessages: 3,
        createdAt: '2026-03-17T06:00:00Z', updatedAt: '2026-03-17T06:00:00Z',
      },
      {
        id: 'cust_demo_6', name: 'Đỗ Quang Minh', phone: '0888 111 222',
        email: 'minh.do@gmail.com', source: 'referral', type: 'vip',
        totalSpent: 22000000, tags: ['VIP', 'giới thiệu', 'HCM', 'B2B'],
        note: 'Được giới thiệu bởi Trần Văn Hùng. Mua số lượng lớn cho công ty.',
        pendingMessages: 0,
        createdAt: '2025-12-01T10:00:00Z', updatedAt: '2026-03-15T14:00:00Z',
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
  }

  // ============================================================
  // READ → fetch → set state → render
  // ============================================================
  async function fetchCustomers() {
    try {
      customers = await API.getAll();
      updateStats();
      renderGrid();
    } catch (err) {
      showToast('Lỗi tải dữ liệu: ' + err.message, 'error');
    }
  }

  // ============================================================
  // RENDER GRID
  // ============================================================
  const AVATAR_COLORS = ['av-purple', 'av-blue', 'av-cyan', 'av-green', 'av-orange', 'av-pink'];
  const SOURCE_LABELS = { facebook:'Facebook', tiktok:'TikTok', zalo:'Zalo', instagram:'Instagram', website:'Website', referral:'Giới thiệu', other:'Khác' };
  const TYPE_LABELS = { lead:'Lead', customer:'Khách hàng', vip:'VIP' };

  function renderGrid() {
    const searchTerm = ($('#searchInput').value || '').toLowerCase().trim();
    let filtered = customers;

    if (currentFilter !== 'all') {
      filtered = filtered.filter(c => c.type === currentFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm)) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c.tags && c.tags.some(t => t.toLowerCase().includes(searchTerm)))
      );
    }

    if (filtered.length === 0) {
      $('#customerGrid').innerHTML = '';
      $('#emptyState').style.display = 'flex';
      return;
    }

    $('#emptyState').style.display = 'none';

    let html = '';
    filtered.forEach((c, i) => {
      const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2);
      const avColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
      const contact = c.phone || c.email || 'Không có thông tin';
      const tagsHtml = (c.tags || []).map(t => `<span class="cc-tag">${escHtml(t)}</span>`).join('');
      const spent = c.totalSpent ? new Intl.NumberFormat('vi-VN').format(c.totalSpent) + 'đ' : '—';

      html += `
        <div class="customer-card" style="animation-delay:${i * 0.05}s" data-id="${c.id}">
          <div class="cc-top">
            <div class="cc-avatar ${avColor}">${initials}</div>
            <div class="cc-info">
              <div class="cc-name">${escHtml(c.name)}</div>
              <div class="cc-contact">${escHtml(contact)}</div>
            </div>
            <span class="cc-type type-${c.type}">${TYPE_LABELS[c.type] || c.type}</span>
          </div>

          <div class="cc-details">
            <div class="cc-detail">
              <div class="cc-detail-label">Nguồn</div>
              <div class="cc-detail-value">
                <span class="cc-source"><span class="source-dot src-${c.source}"></span>${SOURCE_LABELS[c.source] || c.source}</span>
              </div>
            </div>
            <div class="cc-detail">
              <div class="cc-detail-label">Chi tiêu</div>
              <div class="cc-detail-value">${spent}</div>
            </div>
            <div class="cc-detail">
              <div class="cc-detail-label">Tin nhắn</div>
              <div class="cc-detail-value">${c.pendingMessages || 0}</div>
            </div>
          </div>

          ${tagsHtml ? `<div class="cc-tags">${tagsHtml}</div>` : ''}
          ${c.note ? `<div class="cc-note">${escHtml(c.note)}</div>` : ''}

          <div class="cc-actions">
            <button class="action-btn edit-btn" title="Sửa" onclick="editCustomer('${c.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
            <button class="action-btn delete-btn" title="Xóa" onclick="deleteCustomer('${c.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>
      `;
    });

    $('#customerGrid').innerHTML = html;
  }

  // ============================================================
  // STATS
  // ============================================================
  function updateStats() {
    animateNum($('#statTotal'), customers.length);
    animateNum($('#statLeads'), customers.filter(c => c.type === 'lead').length);
    animateNum($('#statConverted'), customers.filter(c => c.type === 'customer' || c.type === 'vip').length);
    animateNum($('#statMessages'), customers.reduce((s, c) => s + (c.pendingMessages || 0), 0));
  }
  function animateNum(el, target) {
    const current = parseInt(el.textContent) || 0;
    if (current === target) { el.textContent = target; return; }
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / 400, 1);
      el.textContent = Math.round(current + (target - current) * p);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ============================================================
  // CREATE → submit → API → update state → re-render
  // ============================================================
  async function createCustomer(data) {
    try {
      const created = await API.create(data);
      customers.unshift(created);
      updateStats();
      renderGrid();
      showToast('✅ Đã thêm khách hàng!', 'success');
    } catch (err) {
      showToast('❌ Lỗi: ' + err.message, 'error');
    }
  }

  // ============================================================
  // UPDATE → load form → edit → API → update state → re-render
  // ============================================================
  window.editCustomer = function (id) {
    editingId = id;
    const c = customers.find(x => x.id === id);
    if (!c) return;

    $('#customerId').value = c.id;
    $('#customerName').value = c.name;
    $('#customerPhone').value = c.phone || '';
    $('#customerEmail').value = c.email || '';
    $('#customerSource').value = c.source || 'other';
    $('#customerType').value = c.type || 'lead';
    $('#customerSpent').value = c.totalSpent || '';
    $('#customerTags').value = (c.tags || []).join(', ');
    $('#customerNote').value = c.note || '';

    $('#modalTitle').textContent = 'Chỉnh sửa khách hàng';
    $('#btnSubmitText').textContent = 'Lưu thay đổi';
    openCustomerModal();
  };

  async function updateCustomer(id, data) {
    try {
      const updated = await API.update(id, data);
      const idx = customers.findIndex(c => c.id === id);
      if (idx !== -1) customers[idx] = updated;
      updateStats();
      renderGrid();
      showToast('✅ Đã cập nhật!', 'success');
    } catch (err) {
      showToast('❌ Lỗi: ' + err.message, 'error');
    }
  }

  // ============================================================
  // DELETE → confirm → API → remove state → re-render
  // ============================================================
  window.deleteCustomer = function (id) {
    deletingId = id;
    const c = customers.find(x => x.id === id);
    if (!c) return;
    $('#deleteName').textContent = c.name;
    $('#deleteOverlay').classList.add('show');
  };

  async function confirmDelete() {
    if (!deletingId) return;
    try {
      await API.delete(deletingId);
      customers = customers.filter(c => c.id !== deletingId);
      updateStats();
      renderGrid();
      showToast('🗑️ Đã xóa!', 'success');
    } catch (err) {
      showToast('❌ Lỗi: ' + err.message, 'error');
    } finally {
      deletingId = null;
      $('#deleteOverlay').classList.remove('show');
    }
  }

  // ============================================================
  // MODAL
  // ============================================================
  function openCustomerModal() {
    $('#modalOverlay').classList.add('show');
    setTimeout(() => $('#customerName').focus(), 200);
  }
  window.openCustomerModal = openCustomerModal;

  function closeModal() {
    $('#modalOverlay').classList.remove('show');
    resetForm();
  }
  function resetForm() {
    $('#customerForm').reset();
    $('#customerId').value = '';
    editingId = null;
    $('#modalTitle').textContent = 'Thêm khách hàng';
    $('#btnSubmitText').textContent = 'Thêm khách hàng';
  }

  // ============================================================
  // FORM SUBMIT
  // ============================================================
  $('#customerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const tagsRaw = $('#customerTags').value.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    const data = {
      name: $('#customerName').value.trim(),
      phone: $('#customerPhone').value.trim(),
      email: $('#customerEmail').value.trim(),
      source: $('#customerSource').value,
      type: $('#customerType').value,
      totalSpent: parseInt($('#customerSpent').value) || 0,
      tags,
      note: $('#customerNote').value.trim(),
      pendingMessages: 0,
    };

    if (!data.name) { showToast('⚠️ Nhập họ tên!', 'error'); return; }

    const btn = $('#btnSubmit');
    btn.disabled = true;
    btn.style.opacity = '0.6';

    if (editingId) {
      await updateCustomer(editingId, data);
    } else {
      await createCustomer(data);
    }

    btn.disabled = false;
    btn.style.opacity = '1';
    closeModal();
  });

  // ============================================================
  // EVENT LISTENERS
  // ============================================================
  $('#btnCreate').addEventListener('click', () => { resetForm(); openCustomerModal(); });
  $('#modalClose').addEventListener('click', closeModal);
  $('#btnCancel').addEventListener('click', closeModal);
  $('#modalOverlay').addEventListener('click', (e) => { if (e.target === $('#modalOverlay')) closeModal(); });

  $('#deleteClose').addEventListener('click', () => $('#deleteOverlay').classList.remove('show'));
  $('#deleteCancelBtn').addEventListener('click', () => $('#deleteOverlay').classList.remove('show'));
  $('#deleteConfirmBtn').addEventListener('click', confirmDelete);
  $('#deleteOverlay').addEventListener('click', (e) => { if (e.target === $('#deleteOverlay')) $('#deleteOverlay').classList.remove('show'); });

  $$('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderGrid();
    });
  });

  $('#searchInput').addEventListener('input', renderGrid);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); $('#deleteOverlay').classList.remove('show'); }
    if (e.key === 'n' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); resetForm(); openCustomerModal(); }
  });

  const sidebarToggle = $('#sidebarToggle');
  if (sidebarToggle) sidebarToggle.addEventListener('click', () => $('#sidebar').classList.toggle('open'));

  // ============================================================
  // HELPERS
  // ============================================================
  function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function showToast(message, type = 'success') {
    const container = $('#toastContainer');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('toast-out'); setTimeout(() => toast.remove(), 300); }, 3000);
  }

  // ============================================================
  // INIT
  // ============================================================
  seedIfEmpty();
  fetchCustomers();

  console.log('%c✦ SmartMkt AI CRM — Loaded', 'color:#ec4899;font-weight:bold;font-size:14px');
})();
