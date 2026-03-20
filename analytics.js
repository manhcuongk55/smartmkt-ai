// ============================================================
// SmartMkt AI — Analytics Dashboard Logic
// ============================================================
// Revenue metrics, plan breakdown charts, subscriber table,
// referral leaderboard, and CSV export.
// ============================================================

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ============================================================
  // COLORS
  // ============================================================
  const PLAN_COLORS = {
    free: '#94a3b8',
    flame: '#f59e0b',
    blaze: '#8b5cf6',
    inferno: '#ef4444',
  };

  const INDUSTRY_COLORS = {
    fnb: '#f97316',
    fashion: '#ec4899',
    beauty: '#f43f5e',
    electronics: '#3b82f6',
    health: '#10b981',
    education: '#06b6d4',
    retail: '#8b5cf6',
    agency: '#6366f1',
    furniture: '#a78bfa',
    baby: '#fb923c',
    pets: '#34d399',
    other: '#64748b',
  };

  const INDUSTRY_NAMES = {
    fnb: 'F&B',
    fashion: 'Thời trang',
    beauty: 'Mỹ phẩm',
    electronics: 'Điện tử',
    health: 'Sức khỏe',
    education: 'Giáo dục',
    retail: 'Bán lẻ',
    agency: 'Agency',
    furniture: 'Nội thất',
    baby: 'Mẹ & Bé',
    pets: 'Thú cưng',
    other: 'Khác',
  };

  // ============================================================
  // RENDER METRICS
  // ============================================================
  function renderMetrics() {
    const m = AuthManager.getRevenueMetrics();

    // Cards
    $('#mrrValue').textContent = formatCurrency(m.mrr);
    $('#arrValue').textContent = formatCurrency(m.arr);
    $('#totalUsersValue').textContent = m.totalUsers;
    $('#paidUsersLabel').textContent = m.paidUsers + ' trả phí';
    $('#convValue').textContent = m.conversionRate + '%';

    // Plan badge
    const user = AuthManager.getCurrentUser();
    if (user) {
      const plan = AuthManager.PLANS[user.plan];
      if (plan) {
        $('#planBadge .plan-text').textContent = plan.name;
      }
    }

    // Plan chart
    renderPlanChart(m.planBreakdown);

    // Industry chart
    renderIndustryChart(m.industryBreakdown, m.totalUsers);

    // Subscribers table
    renderSubscriberTable();

    // Referral board
    renderReferralBoard(m.totalReferrals);
  }

  // ============================================================
  // PLAN BAR CHART
  // ============================================================
  function renderPlanChart(breakdown) {
    const container = $('#planChart');
    const legend = $('#planLegend');
    if (!container) return;

    const maxRev = Math.max(...Object.values(breakdown).map(b => b.revenue), 1);

    let chartHtml = '';
    let legendHtml = '';

    Object.entries(breakdown).forEach(([key, data]) => {
      const heightPct = Math.max((data.revenue / maxRev) * 100, 3);
      const color = PLAN_COLORS[key] || '#94a3b8';

      chartHtml += `
        <div class="bar-item">
          <div class="bar-fill" style="height: 0%; background: ${color};" data-target="${heightPct}">
            <div class="bar-value">${data.count} users — ${formatCurrencyShort(data.revenue)}</div>
          </div>
          <div class="bar-label">${data.name}</div>
        </div>
      `;

      legendHtml += `
        <div class="legend-item">
          <div class="legend-dot" style="background: ${color}"></div>
          ${data.name}: ${data.count} (${formatCurrencyShort(data.revenue)}/tháng)
        </div>
      `;
    });

    container.innerHTML = chartHtml;
    legend.innerHTML = legendHtml;

    // Animate bars
    setTimeout(() => {
      container.querySelectorAll('.bar-fill').forEach(bar => {
        bar.style.height = bar.dataset.target + '%';
      });
    }, 100);
  }

  // ============================================================
  // INDUSTRY DONUT CHART
  // ============================================================
  function renderIndustryChart(breakdown, total) {
    const svg = $('#industryChart .donut-svg');
    const legend = $('#industryLegend');
    if (!svg) return;

    $('#donutTotal').textContent = total;

    const r = 50;
    const cx = 60, cy = 60;
    const circumference = 2 * Math.PI * r;
    let offset = 0;

    let paths = '';
    let legendHtml = '';

    // Sort by count descending
    const sorted = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

    sorted.forEach(([key, count]) => {
      const pct = count / Math.max(total, 1);
      const dashLen = pct * circumference;
      const color = INDUSTRY_COLORS[key] || '#64748b';
      const name = INDUSTRY_NAMES[key] || key;

      paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
        stroke="${color}" stroke-width="16"
        stroke-dasharray="${dashLen} ${circumference - dashLen}"
        stroke-dashoffset="${-offset}"
        style="transition: stroke-dashoffset 0.8s ease"/>`;

      offset += dashLen;

      legendHtml += `
        <div class="dl-item">
          <div class="dl-dot" style="background: ${color}"></div>
          <span class="dl-name">${name}</span>
          <span class="dl-count">${count}</span>
        </div>
      `;
    });

    svg.innerHTML = paths;
    legend.innerHTML = legendHtml;
  }

  // ============================================================
  // SUBSCRIBERS TABLE
  // ============================================================
  function renderSubscriberTable() {
    const tbody = $('#subTableBody');
    if (!tbody) return;

    const users = AuthManager.getUsers()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    tbody.innerHTML = users.map(u => {
      const planClass = `plan-tag-${u.plan}`;
      const planName = (AuthManager.PLANS[u.plan]?.name) || u.plan;
      const industry = INDUSTRY_NAMES[u.industry] || u.industry || '—';
      const date = new Date(u.createdAt).toLocaleDateString('vi-VN');

      return `
        <tr>
          <td><strong>${escHtml(u.shopName || '—')}</strong></td>
          <td>${escHtml(u.email || '—')}</td>
          <td><span class="plan-tag ${planClass}">${planName}</span></td>
          <td>${industry}</td>
          <td>${date}</td>
        </tr>
      `;
    }).join('');
  }

  // ============================================================
  // REFERRAL LEADERBOARD
  // ============================================================
  function renderReferralBoard(totalReferrals) {
    const board = $('#referralBoard');
    if (!board) return;

    const users = AuthManager.getUsers();
    const referralData = [];

    // Get referral stats from localStorage
    try {
      const refs = JSON.parse(localStorage.getItem('smartmkt_referrals') || '{}');
      Object.entries(refs).forEach(([userId, data]) => {
        const user = users.find(u => u.id === userId);
        if (user) {
          referralData.push({
            ...user,
            refCount: data.count,
            rewards: data.rewards,
          });
        }
      });
    } catch {}

    // Sort by refCount
    referralData.sort((a, b) => b.refCount - a.refCount);

    board.innerHTML = referralData.slice(0, 6).map((u, i) => {
      const rankClass = i === 0 ? 'rb-rank-1' : i === 1 ? 'rb-rank-2' : i === 2 ? 'rb-rank-3' : 'rb-rank-n';
      const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);

      return `
        <div class="rb-item">
          <div class="rb-rank ${rankClass}">${rankIcon}</div>
          <div class="rb-info">
            <div class="rb-name">${escHtml(u.shopName)}</div>
            <div class="rb-email">${escHtml(u.email)}</div>
          </div>
          <div class="rb-count">
            ${u.refCount}
            <span class="rb-count-label">referrals</span>
          </div>
        </div>
      `;
    }).join('');

    // Total
    const rtValue = $('#referralTotal .rt-value');
    if (rtValue) rtValue.textContent = totalReferrals;
  }

  // ============================================================
  // CSV EXPORT
  // ============================================================
  if ($('#btnExport')) {
    $('#btnExport').addEventListener('click', () => {
      const users = AuthManager.getUsers();
      const headers = ['Shop Name', 'Email', 'Phone', 'Plan', 'Industry', 'Created At', 'Referral Code', 'Referred By'];

      const rows = users.map(u => [
        u.shopName, u.email, u.phone, u.plan,
        INDUSTRY_NAMES[u.industry] || u.industry,
        u.createdAt, u.referralCode, u.referredBy || ''
      ]);

      const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartmkt_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('📥 Đã xuất file CSV!', 'success');
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================
  function formatCurrency(n) {
    if (!n) return '0đ';
    return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
  }

  function formatCurrencyShort(n) {
    if (n >= 1000000000) return (n / 1000000000).toFixed(1) + ' tỷ';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
    return n + 'đ';
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function showToast(message, type = 'success') {
    const container = $('#toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ============================================================
  // SIDEBAR
  // ============================================================
  const sidebar = $('#sidebar');
  const sidebarToggle = $('#sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  // ============================================================
  // INIT
  // ============================================================
  renderMetrics();

  console.log('%c✦ SmartMkt AI Analytics — Loaded', 'color:#8b5cf6;font-weight:bold;font-size:14px');
})();
