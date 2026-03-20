/**
 * SmartMkt AI — Content Calendar
 * Monthly + Weekly content planning with per-channel color coding
 */
'use strict';
const $ = id => document.getElementById(id);
const STORAGE_KEY = 'smartmkt_calendar_v1';

const CHANNEL_ICONS = { tiktok:'🎵', facebook:'👥', zalo:'💬', instagram:'📸' };
const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

// ============================================================
// STORAGE
// ============================================================
function loadSlots() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : seedData();
}
function saveSlots() { localStorage.setItem(STORAGE_KEY, JSON.stringify(slots)); }

function seedData() {
  const y = today.getFullYear(), m = today.getMonth();
  const pad = d => String(d).padStart(2,'0');
  const dt = (d, mo = m) => `${y}-${pad(mo+1)}-${pad(d)}`;
  const seeds = [
    { id:uid(), date:dt(today.getDate() - 2), channel:'tiktok', time:'19:00', title:'Review sản phẩm mới', contentType:'tiktok_script', status:'posted' },
    { id:uid(), date:dt(today.getDate()), channel:'facebook', time:'08:00', title:'Caption sáng đẹp', contentType:'caption', status:'ready' },
    { id:uid(), date:dt(today.getDate()), channel:'zalo', time:'12:00', title:'Promo trưa', contentType:'promo', status:'planned' },
    { id:uid(), date:dt(today.getDate() + 1), channel:'instagram', time:'18:00', title:'Photo story', contentType:'story', status:'planned' },
    { id:uid(), date:dt(today.getDate() + 3), channel:'tiktok', time:'20:00', title:'Behind the scenes', contentType:'tiktok_script', status:'draft' },
    { id:uid(), date:dt(today.getDate() + 5), channel:'facebook', time:'19:30', title:'Quảng cáo cuối tuần', contentType:'ad_copy', status:'planned' },
    { id:uid(), date:dt(today.getDate() + 7), channel:'zalo', time:'08:00', title:'Chào tuần mới', contentType:'caption', status:'planned' },
    { id:uid(), date:dt(today.getDate() + 10), channel:'tiktok', time:'19:00', title:'Feedback khách hàng', contentType:'caption', status:'draft' },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
  return seeds;
}

function uid() { return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

// ============================================================
// STATE
// ============================================================
const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
let slots = loadSlots();
let currentView = 'month';

// ============================================================
// CALENDAR RENDER — MONTH VIEW
// ============================================================
function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  // Monday = 0, Sunday = 6
  let startDow = first.getDay() - 1; if (startDow < 0) startDow = 6;
  const days = [];
  // Previous month pad
  for (let i = startDow; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    days.push({ date: d, otherMonth: true });
  }
  // Current month
  for (let d = 1; d <= last.getDate(); d++) {
    days.push({ date: new Date(year, month, d), otherMonth: false });
  }
  // Next month pad to fill 6 rows
  while (days.length % 7 !== 0 || days.length < 35) {
    const last2 = days[days.length - 1].date;
    const next = new Date(last2); next.setDate(last2.getDate() + 1);
    days.push({ date: next, otherMonth: true });
  }
  return days;
}

function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function isToday(d) { return toDateKey(d) === toDateKey(today); }

const STATUS_STYLE = {
  posted:  'opacity:.5;text-decoration:line-through',
  ready:   'outline:1.5px solid var(--success)',
  draft:   'opacity:.7',
  planned: '',
};

function renderMonth() {
  const days = getMonthDays(currentYear, currentMonth);
  $('calMonthTitle').textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

  $('calGrid').innerHTML = days.map(({ date, otherMonth }) => {
    const key = toDateKey(date);
    const daySlots = slots.filter(s => s.date === key).sort((a,b) => a.time.localeCompare(b.time));
    const extra = daySlots.length > 3 ? daySlots.length - 3 : 0;
    const shown = daySlots.slice(0, 3);

    const slotsHtml = shown.map(s => `
      <div class="content-slot slot-${s.channel}" data-id="${s.id}" style="${STATUS_STYLE[s.status] || ''}">
        <div class="slot-dot"></div>
        <div class="slot-text">${CHANNEL_ICONS[s.channel]} ${s.title}</div>
      </div>
    `).join('');

    return `
    <div class="cal-cell ${isToday(date) ? 'today' : ''} ${otherMonth ? 'other-month' : ''}" data-date="${key}">
      <div class="cal-date">${date.getDate()}</div>
      ${slotsHtml}
      ${extra > 0 ? `<div style="font-size:10px;color:var(--text-3);margin-top:2px">+${extra} thêm</div>` : ''}
      <div class="add-slot-btn" data-date="${key}">+ Thêm</div>
    </div>`;
  }).join('');

  // Bind slot clicks
  $('calGrid').querySelectorAll('.content-slot').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const s = slots.find(x => x.id === el.dataset.id);
      if (s) openSlotModal(s.date, s);
    });
  });

  // Bind day cell click & add button
  $('calGrid').querySelectorAll('.add-slot-btn, .cal-cell').forEach(el => {
    el.addEventListener('click', e => {
      const date = el.closest('[data-date]')?.dataset.date || el.dataset.date;
      if (date) openSlotModal(date);
    });
  });
}

// ============================================================
// NAVIGATION
// ============================================================
$('btnPrev').addEventListener('click', () => {
  currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderMonth();
});
$('btnNext').addEventListener('click', () => {
  currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderMonth();
});
$('btnToday').addEventListener('click', () => {
  currentYear = today.getFullYear(); currentMonth = today.getMonth();
  renderMonth();
});

// ============================================================
// SLOT MODAL
// ============================================================
let editSlotId = null;

function openSlotModal(date, slot = null) {
  editSlotId = slot?.id || null;
  $('slotModalTitle').textContent = slot ? '✏️ Chỉnh sửa bài đăng' : '📝 Thêm bài đăng';
  $('slotDate').value = date;
  $('slotTime').value = slot?.time || '19:00';
  $('slotTitle').value = slot?.title || '';
  $('slotChannel').value = slot?.channel || 'tiktok';

  document.querySelectorAll('#slotTypePicker .goal-chip').forEach(c => c.classList.toggle('selected', c.dataset.type === (slot?.contentType || 'caption')));
  document.querySelectorAll('#slotStatusPicker .goal-chip').forEach(c => c.classList.toggle('selected', c.dataset.status === (slot?.status || 'planned')));

  $('slotModal').classList.add('open');
}

function closeSlotModal() { $('slotModal').classList.remove('open'); editSlotId = null; }

$('slotModalClose').addEventListener('click', closeSlotModal);
$('slotModal').addEventListener('click', e => { if (e.target === $('slotModal')) closeSlotModal(); });

document.querySelectorAll('#slotTypePicker .goal-chip').forEach(c => {
  c.addEventListener('click', () => {
    document.querySelectorAll('#slotTypePicker .goal-chip').forEach(x => x.classList.remove('selected'));
    c.classList.add('selected');
  });
});
document.querySelectorAll('#slotStatusPicker .goal-chip').forEach(c => {
  c.addEventListener('click', () => {
    document.querySelectorAll('#slotStatusPicker .goal-chip').forEach(x => x.classList.remove('selected'));
    c.classList.add('selected');
  });
});

$('btnSaveSlot').addEventListener('click', () => {
  const title = $('slotTitle').value.trim();
  if (!title) { toast('⚠️ Nhập tiêu đề bài đăng', 'error'); return; }

  const slot = {
    id: editSlotId || uid(),
    date: $('slotDate').value,
    time: $('slotTime').value,
    channel: $('slotChannel').value,
    title,
    contentType: document.querySelector('#slotTypePicker .goal-chip.selected')?.dataset.type || 'caption',
    status: document.querySelector('#slotStatusPicker .goal-chip.selected')?.dataset.status || 'planned',
  };

  if (editSlotId) {
    const idx = slots.findIndex(s => s.id === editSlotId);
    if (idx >= 0) slots[idx] = slot;
  } else {
    slots.push(slot);
  }
  saveSlots();
  renderMonth();
  closeSlotModal();
  toast(editSlotId ? '✅ Đã cập nhật bài' : '📅 Đã thêm vào lịch!');
});

// AI Gen — redirect to content studio
$('btnAIGenSlot').addEventListener('click', () => {
  const title = $('slotTitle').value.trim() || 'sản phẩm';
  const type = document.querySelector('#slotTypePicker .goal-chip.selected')?.dataset.type || 'caption';
  window.location.href = `content.html?product=${encodeURIComponent(title)}&type=${type}`;
});

// Quick fill — AI auto-populate 7 days of content slots
$('btnQuickFill').addEventListener('click', () => {
  const templates = [
    { channel:'tiktok', time:'19:00', title:'Video giới thiệu sản phẩm', contentType:'tiktok_script' },
    { channel:'facebook', time:'08:00', title:'Caption sáng đẹp', contentType:'caption' },
    { channel:'zalo', time:'12:00', title:'Promo giờ vàng', contentType:'promo' },
    { channel:'instagram', time:'18:00', title:'Story behind-the-scenes', contentType:'story' },
    { channel:'tiktok', time:'20:00', title:'Review khách hàng thật', contentType:'caption' },
    { channel:'facebook', time:'19:30', title:'Quảng cáo cuối tuần', contentType:'ad_copy' },
    { channel:'zalo', time:'08:00', title:'Chào tuần mới', contentType:'caption' },
  ];
  const base = new Date(currentYear, currentMonth, today.getDate());
  templates.forEach((t, i) => {
    const d = new Date(base); d.setDate(base.getDate() + i);
    const key = toDateKey(d);
    if (!slots.some(s => s.date === key && s.channel === t.channel)) {
      slots.push({ id: uid(), ...t, date: key, status: 'planned' });
    }
  });
  saveSlots();
  renderMonth();
  toast('⚡ AI đã lên lịch 7 ngày tới!', 'success');
});

// View toggle
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentView = btn.dataset.view;
    renderMonth(); // Both views use same base for now
    toast(currentView === 'week' ? '📅 Chế độ tuần (coming soon)' : '📅 Chế độ tháng', 'info');
  });
});

// ============================================================
// TOAST
// ============================================================
function toast(msg, type = 'success') {
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${msg}</span>`;
  $('toastContainer').appendChild(el);
  setTimeout(() => { el.classList.add('toast-out'); setTimeout(() => el.remove(), 300); }, 3000);
}

// ============================================================
// INIT
// ============================================================
renderMonth();
console.log('%c✦ SmartMkt AI Content Calendar — Loaded', 'color:#6366f1;font-weight:bold;font-size:14px');
