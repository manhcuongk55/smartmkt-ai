'use strict';

// ===========================
// PARTNER DASHBOARD JS
// SmartMkt AI
// ===========================

// ---- MOCK DATA ----
const PARTNER = {
  name: 'Minh Cường',
  code: 'GOLD_MC01',
  tier: 'gold',
  commission: 0.30,
  walletBalance: 8550000,
  monthRevenue: 28500000,
  referredCount: 42,
  totalCommission: 124200000,
  tierProgress: 57,
  nextTierAmount: 21500000,
};

const PAYOUT_HISTORY = [
  { month: 'Tháng 3/2026', clients: 42, revenue: 28500000, commission: 8550000, tax: 855000, net: 7695000, status: 'pending' },
  { month: 'Tháng 2/2026', clients: 38, revenue: 25840000, commission: 7752000, tax: 775200, net: 6976800, status: 'paid' },
  { month: 'Tháng 1/2026', clients: 35, revenue: 23180000, commission: 6954000, tax: 695400, net: 6258600, status: 'paid' },
  { month: 'Tháng 12/2025', clients: 31, revenue: 20950000, commission: 6285000, tax: 628500, net: 5656500, status: 'paid' },
  { month: 'Tháng 11/2025', clients: 28, revenue: 18560000, commission: 5568000, tax: 556800, net: 5011200, status: 'paid' },
  { month: 'Tháng 10/2025', clients: 25, revenue: 16750000, commission: 5025000, tax: 502500, net: 4522500, status: 'paid' },
];

// ---- FORMAT UTILS ----
function fmtVND(amount) {
  return amount.toLocaleString('vi-VN') + 'đ';
}

// ---- HISTORY TABLE ----
function renderHistory(filter = 'all') {
  const tbody = document.getElementById('historyTableBody');
  const filtered = filter === 'all'
    ? PAYOUT_HISTORY
    : PAYOUT_HISTORY.filter(r => r.status === filter);

  tbody.innerHTML = filtered.map(row => `
    <tr>
      <td>${row.month}</td>
      <td>${row.clients} khách</td>
      <td>${fmtVND(row.revenue)}</td>
      <td class="val-green">+${fmtVND(row.commission)}</td>
      <td class="val-red">-${fmtVND(row.tax)}</td>
      <td><strong>${fmtVND(row.net)}</strong></td>
      <td>
        <span class="status-badge ${row.status === 'paid' ? 'status-paid' : row.status === 'pending' ? 'status-pending' : 'status-withheld'}">
          ${row.status === 'paid' ? '✓ Đã thanh toán' : row.status === 'pending' ? '⏳ Đang xử lý' : '🧾 Khấu trừ'}
        </span>
      </td>
    </tr>
  `).join('');
}

// ---- COMMISSION CALCULATOR ----
function updateCalculator() {
  const clients = parseInt(document.getElementById('calcClients').value) || 0;
  const planPrice = parseInt(document.getElementById('calcPlan').value) || 0;
  const tierPct = parseInt(document.getElementById('calcTier').value) / 100;

  const gross = clients * planPrice;
  const commission = gross * tierPct;
  const tax = commission * 0.10;
  const net = commission - tax;

  document.getElementById('calcGross').textContent = fmtVND(gross);
  document.getElementById('calcCommission').textContent = fmtVND(commission);
  document.getElementById('calcTax').textContent = '-' + fmtVND(tax);
  document.getElementById('calcNet').textContent = fmtVND(net);
}

// ---- INVITE COMMISSION PREVIEW ----
function updateInvitePreview() {
  const planPrices = { 0: 499000, 1: 1200000, 2: 3000000 };
  const idx = document.getElementById('invitePlan').selectedIndex;
  const price = planPrices[idx] || 1200000;
  const comm = price * PARTNER.commission;
  const net = comm * 0.9;
  document.getElementById('inviteCommPreview').textContent = fmtVND(net) + '/tháng';
}

// ---- TOAST ----
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ---- MODALS ----
function openModal(id) {
  document.getElementById(id).classList.add('active');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {

  // Render history
  renderHistory();

  // History filter
  document.getElementById('historyFilter').addEventListener('change', (e) => {
    renderHistory(e.target.value);
  });

  // Calculator live update
  ['calcClients', 'calcPlan', 'calcTier'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateCalculator);
    document.getElementById(id).addEventListener('change', updateCalculator);
  });
  updateCalculator();

  // Withdraw modal
  document.getElementById('btnWithdraw').addEventListener('click', () => openModal('withdrawModal'));
  document.getElementById('btnWithdrawWallet').addEventListener('click', () => openModal('withdrawModal'));
  document.getElementById('modalClose').addEventListener('click', () => closeModal('withdrawModal'));

  document.getElementById('btnConfirmWithdraw').addEventListener('click', () => {
    const amount = parseInt(document.getElementById('withdrawAmount').value);
    if (!amount || amount < 100000) {
      showToast('Số tiền rút tối thiểu 100,000đ', 'error'); return;
    }
    if (amount > PARTNER.walletBalance) {
      showToast('Số dư không đủ', 'error'); return;
    }
    closeModal('withdrawModal');
    showToast(`Đã gửi yêu cầu rút ${fmtVND(amount)}. Xử lý trong 1–2 ngày làm việc.`);
  });

  // Invite modal
  document.getElementById('btnInvite').addEventListener('click', () => openModal('inviteModal'));
  document.getElementById('inviteModalClose').addEventListener('click', () => closeModal('inviteModal'));
  document.getElementById('invitePlan').addEventListener('change', updateInvitePreview);
  updateInvitePreview();

  document.getElementById('btnSendInvite').addEventListener('click', () => {
    const email = document.getElementById('inviteEmail').value;
    const shop = document.getElementById('inviteShop').value;
    if (!email) { showToast('Vui lòng nhập email khách hàng', 'error'); return; }
    closeModal('inviteModal');
    showToast(`Đã gửi lời mời đến ${email}${shop ? ' — ' + shop : ''}!`);
  });

  // Copy ref link
  document.getElementById('btnCopyLink').addEventListener('click', () => {
    const link = document.getElementById('refLink').textContent;
    navigator.clipboard.writeText(link).then(() => showToast('Đã copy link giới thiệu!'));
  });

  // Share buttons
  document.getElementById('shareZalo').addEventListener('click', () => {
    const link = encodeURIComponent('https://smartmkt-ai.vercel.app/?ref=GOLD_MC01');
    window.open(`https://zalo.me/share?url=${link}`, '_blank');
  });
  document.getElementById('shareFB').addEventListener('click', () => {
    const link = encodeURIComponent('https://smartmkt-ai.vercel.app/?ref=GOLD_MC01');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${link}`, '_blank');
  });
  document.getElementById('shareTele').addEventListener('click', () => {
    const link = encodeURIComponent('https://smartmkt-ai.vercel.app/?ref=GOLD_MC01');
    window.open(`https://t.me/share/url?url=${link}&text=AI Marketing cho SME Việt Nam`, '_blank');
  });

  // Tax cert download (mock)
  document.querySelectorAll('.btn-download').forEach(btn => {
    btn.addEventListener('click', () => showToast('Đang xuất chứng từ PDF...'));
  });

  // History view shortcut
  document.getElementById('btnViewHistory').addEventListener('click', () => {
    document.querySelector('.history-card').scrollIntoView({ behavior: 'smooth' });
  });

  // Close modals on overlay click
  ['withdrawModal', 'inviteModal'].forEach(id => {
    document.getElementById(id).addEventListener('click', function(e) {
      if (e.target === this) closeModal(id);
    });
  });

  // Animate tier progress bar
  setTimeout(() => {
    const fill = document.getElementById('tierProgressFill');
    if (fill) fill.style.width = PARTNER.tierProgress + '%';
  }, 300);
});
