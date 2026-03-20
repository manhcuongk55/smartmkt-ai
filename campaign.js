/**
 * SmartMkt AI — Campaign Manager
 * Manages multi-channel marketing campaigns with budget tracking and ROI
 */
'use strict';

const $ = id => document.getElementById(id);
const qs = sel => document.querySelector(sel);
const STORAGE_KEY = 'smartmkt_campaigns_v1';

// ============================================================
// SEED DATA
// ============================================================
const SEED_CAMPAIGNS = [
  {
    id: 'c1', name: 'Tết 2026 — Trà Sữa Mango', product: 'Trà sữa mango',
    goal: 'sales', channels: ['tiktok', 'facebook', 'zalo'],
    budget: 5000000, spent: 3200000, revenue: 18500000,
    status: 'active', reach: 48200, leads: 312,
    startDate: '2026-01-20', endDate: '2026-02-10',
    story: 'Tết này muốn cảm ơn 500 khách đầu tiên đã tin tưởng shop từ ngày đầu.',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'c2', name: 'Ra Mắt Áo Oversize SS26', product: 'Áo thun oversize',
    goal: 'launch', channels: ['tiktok', 'instagram'],
    budget: 3000000, spent: 3000000, revenue: 12400000,
    status: 'ended', reach: 31500, leads: 178,
    startDate: '2026-02-01', endDate: '2026-02-28',
    story: 'Bộ sưu tập tự thiết kế — mỗi màu đều có câu chuyện riêng.',
    createdAt: '2026-01-28T10:00:00Z',
  },
  {
    id: 'c3', name: 'Nến Thơm Tháng 3', product: 'Nến thơm lavender',
    goal: 'awareness', channels: ['facebook', 'zalo'],
    budget: 2000000, spent: 400000, revenue: 0,
    status: 'draft', reach: 0, leads: 0,
    startDate: '2026-03-22', endDate: '2026-04-05',
    story: '',
    createdAt: '2026-03-18T14:00:00Z',
  },
];

// ============================================================
// STORAGE
// ============================================================
function loadCampaigns() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CAMPAIGNS));
  return SEED_CAMPAIGNS;
}
function saveCampaigns(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

// ============================================================
// STATE
// ============================================================
let campaigns = loadCampaigns();
let currentFilter = 'all';

// ============================================================
// UTILS
// ============================================================
function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M đ';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K đ';
  return n.toLocaleString('vi-VN') + ' đ';
}
function fmtNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n;
}
function uid() { return 'c' + Date.now().toString(36); }

// ============================================================
// RENDER
// ============================================================
const CHANNEL_ICONS = { tiktok: '🎵', facebook: '👥', zalo: '💬', instagram: '📸' };
const STATUS_CONFIG = {
  active: { label: '🟢 Active', cls: 'badge-active' },
  draft:  { label: '📝 Draft',  cls: 'badge-draft' },
  ended:  { label: '⏹ Ended',  cls: 'badge-ended' },
  paused: { label: '⏸ Paused', cls: 'badge-paused' },
};
const GOAL_LABELS = {
  awareness: '👁 Nhận diện', leads: '🎯 Thu lead',
  sales: '💰 Doanh số', retention: '🔄 Giữ chân', launch: '🚀 Ra mắt',
};

function renderStats() {
  const total = campaigns.length;
  const active = campaigns.filter(c => c.status === 'active').length;
  const totalReach = campaigns.reduce((sum, c) => sum + (c.reach || 0), 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads || 0), 0);
  const totalSpend = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);

  $('statTotal').textContent = total;
  $('statActive').textContent = active;
  $('statReach').textContent = fmtNum(totalReach);
  $('statLeads').textContent = fmtNum(totalLeads);
  $('roiTotalSpend').textContent = fmt(totalSpend);
  $('roiRevenue').textContent = fmt(totalRevenue);
  $('roiActive').textContent = active;
  if (totalSpend > 0) {
    const roi = ((totalRevenue - totalSpend) / totalSpend * 100).toFixed(0);
    $('roiRatio').textContent = `${roi}% ROI`;
    $('roiRatio').style.color = roi > 0 ? 'var(--success)' : 'var(--danger)';
  }
}

function renderCard(c) {
  const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
  const pct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
  const channels = (c.channels || []).map(ch =>
    `<span class="channel-pill pill-${ch}">${CHANNEL_ICONS[ch] || '📢'} ${ch}</span>`
  ).join('');

  return `
  <div class="campaign-card" data-id="${c.id}">
    <div class="card-top">
      <div>
        <div class="card-title">${c.name}</div>
        <div class="card-product">${c.product} · ${GOAL_LABELS[c.goal] || c.goal}</div>
      </div>
      <span class="badge-status ${sc.cls}">${sc.label}</span>
    </div>
    <div class="card-channels">${channels}</div>
    <div class="budget-info">
      <div class="budget-row"><span>Ngân sách</span><span>${fmt(c.budget)}</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(pct,100)}%"></div></div>
      <div class="budget-row"><span>Đã chi ${pct}%</span><span>${fmt(c.spent)}</span></div>
    </div>
    <div class="card-metrics">
      <div class="metric-box"><div class="metric-val">${fmtNum(c.reach)}</div><div class="metric-lbl">Tiếp cận</div></div>
      <div class="metric-box"><div class="metric-val">${fmtNum(c.leads)}</div><div class="metric-lbl">Leads</div></div>
      <div class="metric-box"><div class="metric-val" style="color:var(--success)">${c.revenue > 0 ? fmt(c.revenue) : '—'}</div><div class="metric-lbl">Doanh thu</div></div>
    </div>
    <div class="card-footer">
      <div class="card-date">📅 ${c.startDate} → ${c.endDate || '...'}</div>
      <div class="card-actions">
        <button class="btn-icon btn-edit" data-id="${c.id}" title="Chỉnh sửa">✏️</button>
        <button class="btn-icon btn-generate" data-id="${c.id}" title="AI tạo content">⚡</button>
        <button class="btn-icon btn-del" data-id="${c.id}" title="Xóa">🗑</button>
      </div>
    </div>
  </div>`;
}

function renderBoard() {
  const filtered = currentFilter === 'all'
    ? campaigns
    : campaigns.filter(c => c.status === currentFilter);

  const grid = $('campaignGrid');
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">📣</div>
      <div class="empty-title">${currentFilter === 'all' ? 'Chưa có campaign nào' : 'Không có campaign ' + currentFilter}</div>
      <div class="empty-sub">Nhấn <strong>Tạo Campaign</strong> để bắt đầu chiến dịch marketing đầu tiên với AI.</div>
    </div>`;
    return;
  }
  grid.innerHTML = filtered.map(renderCard).join('');
  renderStats();
  bindCardActions();
}

function bindCardActions() {
  document.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (confirm('Xóa campaign này?')) {
        campaigns = campaigns.filter(c => c.id !== btn.dataset.id);
        saveCampaigns(campaigns);
        renderBoard();
        toast('🗑 Đã xóa campaign', 'info');
      }
    });
  });

  document.querySelectorAll('.btn-generate').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const c = campaigns.find(x => x.id === btn.dataset.id);
      if (!c) return;
      // Open content studio with prefilled product
      window.location.href = `content.html?product=${encodeURIComponent(c.product)}&brand=${encodeURIComponent(c.name)}`;
    });
  });

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const c = campaigns.find(x => x.id === btn.dataset.id);
      if (!c) return;
      prefillModal(c);
      openModal();
      $('btnSaveCampaign').dataset.editId = c.id;
    });
  });
}

// ============================================================
// MODAL
// ============================================================
function openModal() { $('modalOverlay').classList.add('open'); }
function closeModal() { $('modalOverlay').classList.remove('open'); delete $('btnSaveCampaign').dataset.editId; resetModal(); }

function resetModal() {
  ['fName','fProduct','fBudget','fStory'].forEach(id => $(id).value = '');
  $('fStatus').value = 'draft';
  $('fStart').value = $('fEnd').value = '';
  document.querySelectorAll('.goal-chip').forEach(c => c.classList.remove('selected'));
  document.querySelector('.goal-chip[data-goal="sales"]').classList.add('selected');
  document.querySelectorAll('.channel-check').forEach(c => {
    const input = c.querySelector('input');
    const isDefault = ['tiktok','facebook'].includes(input.value);
    input.checked = isDefault;
    c.classList.toggle('checked', isDefault);
  });
}

function prefillModal(c) {
  $('fName').value = c.name;
  $('fProduct').value = c.product;
  $('fBudget').value = c.budget;
  $('fStatus').value = c.status;
  $('fStart').value = c.startDate;
  $('fEnd').value = c.endDate;
  $('fStory').value = c.story || '';
  document.querySelectorAll('.goal-chip').forEach(ch => ch.classList.toggle('selected', ch.dataset.goal === c.goal));
  document.querySelectorAll('.channel-check input').forEach(inp => {
    inp.checked = c.channels.includes(inp.value);
    inp.parentElement.classList.toggle('checked', inp.checked);
  });
}

function getFormData() {
  const channels = [...document.querySelectorAll('.channel-check input:checked')].map(i => i.value);
  const goal = document.querySelector('.goal-chip.selected')?.dataset.goal || 'sales';
  return {
    name: $('fName').value.trim(),
    product: $('fProduct').value.trim(),
    goal,
    channels,
    budget: parseInt($('fBudget').value) || 0,
    status: $('fStatus').value,
    startDate: $('fStart').value,
    endDate: $('fEnd').value,
    story: $('fStory').value.trim(),
  };
}

// ============================================================
// TOAST
// ============================================================
function toast(msg, type = 'success') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || '✅'}</span><span>${msg}</span>`;
  $('toastContainer').appendChild(el);
  setTimeout(() => { el.classList.add('toast-out'); setTimeout(() => el.remove(), 300); }, 3000);
}

// ============================================================
// EVENTS
// ============================================================
(() => {
  renderBoard();
  renderStats();

  $('btnNewCampaign').addEventListener('click', () => {
    resetModal();
    openModal();
  });
  $('modalClose').addEventListener('click', closeModal);
  $('modalOverlay').addEventListener('click', e => { if (e.target === $('modalOverlay')) closeModal(); });

  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderBoard();
    });
  });

  document.querySelectorAll('.goal-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.goal-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
    });
  });

  document.querySelectorAll('.channel-check').forEach(label => {
    label.addEventListener('click', () => {
      const input = label.querySelector('input');
      input.checked = !input.checked;
      label.classList.toggle('checked', input.checked);
    });
  });

  $('btnSaveCampaign').addEventListener('click', () => {
    const data = getFormData();
    if (!data.name || !data.product) { toast('⚠️ Điền tên campaign và sản phẩm', 'error'); return; }

    const editId = $('btnSaveCampaign').dataset.editId;
    if (editId) {
      const idx = campaigns.findIndex(c => c.id === editId);
      if (idx >= 0) campaigns[idx] = { ...campaigns[idx], ...data };
    } else {
      campaigns.unshift({ id: uid(), ...data, spent: 0, revenue: 0, reach: 0, leads: 0, createdAt: new Date().toISOString() });
    }

    saveCampaigns(campaigns);
    renderBoard();
    closeModal();
    toast(editId ? '✅ Đã cập nhật campaign' : '🚀 Campaign mới đã tạo!');
  });

  // AI Brief button — generate a campaign content brief and redirect to content studio
  $('btnAIBrief').addEventListener('click', () => {
    const active = campaigns.filter(c => c.status === 'active');
    if (active.length === 0) { toast('⚠️ Chưa có campaign active để tạo brief', 'info'); return; }
    const c = active[0];
    window.location.href = `content.html?product=${encodeURIComponent(c.product)}&story=${encodeURIComponent(c.story || '')}`;
  });

  console.log('%c✦ SmartMkt AI Campaign Manager — Loaded', 'color:#6366f1;font-weight:bold;font-size:14px');
})();
