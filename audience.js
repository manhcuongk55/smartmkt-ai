/**
 * SmartMkt AI — Audience Intelligence
 * Personas, Hashtag Browser, Best Time Heatmap, Competitor Insights
 */
'use strict';
const $ = id => document.getElementById(id);

// ============================================================
// DATA
// ============================================================
const PERSONAS = [
  { id:'p1', emoji:'🧑‍🎤', name:'Gen Z Sáng Tạo', age:'18–24', gender:'Nữ 60%', location:'HCM, Hà Nội', bg:'linear-gradient(135deg,#6366f1,#8b5cf6)',
    pain:'Muốn hàng độc lạ, giá không quá cao, mua online nhiều', tags:['TikTok','Instagram','Độc lạ','Trả nhanh'], motivation:'Thể hiện cá tính'},
  { id:'p2', emoji:'👩‍💼', name:'Mẹ Bỉm Sữa Thông Minh', age:'28–38', gender:'Nữ 90%', location:'Toàn quốc', bg:'linear-gradient(135deg,#f59e0b,#ef4444)',
    pain:'Muốn hàng an toàn, review thật, ship nhanh về tỉnh', tags:['Facebook','Zalo','Review thật','Giá tốt'], motivation:'Gia đình'},
  { id:'p3', emoji:'👨‍💻', name:'Nam Văn Phòng', age:'24–35', gender:'Nam 70%', location:'HCM, Hà Nội, Đà Nẵng', bg:'linear-gradient(135deg,#10b981,#0d9488)',
    pain:'Tìm đồ chất lượng, không cần giá rẻ nhất nhưng phải xứng đáng', tags:['Facebook','Shopee','Chất lượng','Hàng xịn'], motivation:'Phong cách sống'},
  { id:'p4', emoji:'👴', name:'Khách Trung Niên', age:'40–55', gender:'Nam & Nữ', location:'Tỉnh thành', bg:'linear-gradient(135deg,#3b82f6,#6366f1)',
    pain:'Tin vào lời giới thiệu trực tiếp, ngại mua online', tags:['Zalo','Facebook','Tin tưởng','Hỏi nhiều'], motivation:'Sức khỏe & Gia đình'},
];

const HASHTAGS_DB = {
  food: [
    { tag:'#trachahanom', posts:'2.1M', trend:'hot', score:95, industry:'food' },
    { tag:'#doanuongvietnam', posts:'8.4M', trend:'up', score:88, industry:'food' },
    { tag:'#banhmi', posts:'1.2M', trend:'stable', score:75, industry:'food' },
    { tag:'#nuocmanh', posts:'650K', trend:'up', score:70, industry:'food' },
    { tag:'#comvietnam', posts:'3.1M', trend:'stable', score:72, industry:'food' },
    { tag:'#transuatrongso', posts:'420K', trend:'hot', score:90, industry:'food' },
  ],
  fashion: [
    { tag:'#thoitrangthoitrang', posts:'15M', trend:'stable', score:82, industry:'fashion' },
    { tag:'#aothunoversize', posts:'4.2M', trend:'hot', score:94, industry:'fashion' },
    { tag:'#vintagevietnam', posts:'1.8M', trend:'up', score:85, industry:'fashion' },
    { tag:'#outfitoftheday', posts:'22M', trend:'stable', score:80, industry:'fashion' },
    { tag:'#shopthethao', posts:'900K', trend:'up', score:78, industry:'fashion' },
    { tag:'#fashionvn', posts:'6.3M', trend:'stable', score:77, industry:'fashion' },
  ],
  beauty: [
    { tag:'#lamdepcungai', posts:'5.6M', trend:'hot', score:92, industry:'beauty' },
    { tag:'#skincarevietnam', posts:'3.1M', trend:'up', score:88, industry:'beauty' },
    { tag:'#kemduongda', posts:'1.4M', trend:'up', score:85, industry:'beauty' },
    { tag:'#makeupvietnam', posts:'9.2M', trend:'stable', score:80, industry:'beauty' },
    { tag:'#duongdathu', posts:'780K', trend:'hot', score:90, industry:'beauty' },
  ],
  home: [
    { tag:'#trangtricanho', posts:'4.1M', trend:'up', score:83, industry:'home' },
    { tag:'#noisathuc', posts:'2.2M', trend:'stable', score:75, industry:'home' },
    { tag:'#nendong', posts:'510K', trend:'up', score:79, industry:'home' },
  ],
  tech: [
    { tag:'#congnghedoisong', posts:'6.7M', trend:'stable', score:78, industry:'tech' },
    { tag:'#reviewdienthoai', posts:'3.4M', trend:'up', score:82, industry:'tech' },
    { tag:'#phukiendienthoai', posts:'1.1M', trend:'stable', score:70, industry:'tech' },
  ],
  all: [], // populated below
};
HASHTAGS_DB.all = Object.values(HASHTAGS_DB).flat();

// Best posting time data by platform
const BEST_TIME_DATA = {
  tiktok: {
    // heat[hour][day] where day 0=Mon..6=Sun, value 0-4
    heat: [
      [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[1,1,1,1,1,2,2],[2,2,2,2,2,3,3],
      [3,3,3,3,3,4,4],[2,2,2,2,2,3,3],[1,1,1,1,1,2,2],[2,2,2,2,2,2,2],
      [3,3,3,3,3,3,3],[2,2,2,2,2,2,3],[1,1,1,1,1,2,2],[1,1,1,1,1,2,2],
      [2,2,2,2,2,2,2],[3,3,3,3,3,3,3],[4,4,4,4,4,4,4],[4,4,4,4,4,4,4],
      [4,4,4,4,4,4,4],[3,3,3,3,3,4,4],[2,2,2,2,2,3,3],[1,1,1,1,1,2,2],
    ],
    peak1: '19:00', peak2: '08:00', peakDay: 'Thứ 7 & CN', avoid: '02:00–05:00',
  },
  facebook: {
    heat: [
      [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[1,1,1,1,1,1,2],[3,3,3,3,3,3,3],
      [4,4,4,4,4,3,3],[3,3,3,3,3,2,2],[2,2,2,2,2,2,2],[3,3,3,3,3,3,3],
      [3,3,3,3,3,3,3],[2,2,2,2,2,3,3],[1,1,1,1,1,2,2],[1,1,1,1,1,2,2],
      [2,2,2,2,2,2,2],[3,3,3,3,3,3,3],[4,4,4,4,4,4,4],[4,4,4,4,4,4,4],
      [3,3,3,3,3,3,3],[2,2,2,2,2,2,2],[1,1,1,1,1,2,1],[0,0,0,0,0,1,0],
    ],
    peak1: '19:30', peak2: '07:30', peakDay: 'Thứ 4 & Thứ 5', avoid: '01:00–06:00',
  },
  zalo: {
    heat: [
      [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,1],[2,2,2,2,2,2,2],
      [4,4,4,4,4,3,3],[4,4,4,4,4,3,3],[3,3,3,3,3,3,3],[3,3,3,3,3,3,3],
      [2,2,2,2,2,2,2],[3,3,3,3,3,3,3],[3,3,3,3,3,3,3],[3,3,3,3,3,3,3],
      [2,2,2,2,2,2,2],[2,2,2,2,2,2,2],[3,3,3,3,3,3,3],[4,4,4,4,4,4,4],
      [4,4,4,4,4,4,4],[3,3,3,3,3,3,3],[2,2,2,2,2,2,1],[0,0,0,0,0,1,0],
    ],
    peak1: '08:00', peak2: '20:00', peakDay: 'Thứ 2 đến Thứ 6', avoid: '23:00–06:00',
  },
  instagram: {
    heat: [
      [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,1],[1,1,1,1,1,2,2],
      [2,2,2,2,2,2,3],[2,2,2,2,2,2,2],[1,1,1,1,1,2,2],[2,2,2,2,2,2,2],
      [2,2,2,2,2,3,3],[2,2,2,2,2,3,3],[1,1,1,1,1,2,2],[1,1,1,1,1,2,2],
      [2,2,2,2,2,2,2],[3,3,3,3,3,4,4],[4,4,4,4,4,4,4],[4,4,4,4,4,4,4],
      [3,3,3,3,3,3,3],[2,2,2,2,2,2,2],[1,1,1,1,1,1,1],[0,0,0,0,0,0,0],
    ],
    peak1: '18:00', peak2: '09:00', peakDay: 'Thứ 6 & Thứ 7', avoid: '03:00–06:00',
  },
};

const COMPETITORS = [
  { id:'comp1', name:'Shop Trà Sữa ABC', handle:'@trasua.abc', followers:'12.4K', engRate:'6.2%', postsWeek:7,
    insights:['Dùng nhiều UGC từ khách hàng', 'Hook "3 giây shock" rất hiệu quả', 'Đăng lúc 19h–21h', 'Tránh chủ đề giá — focus vào cảm xúc'],
    platform:'TikTok'},
  { id:'comp2', name:'Fashion Local VN', handle:'@fashionlocalvn', followers:'28.1K', engRate:'4.8%', postsWeek:5,
    insights:['Dùng influencer micro 10K–50K follower', 'Behind-the-scenes rất viral', 'Caption ngắn, 3 dòng, hashtag ít', 'Ngày thứ 2 và thứ 4 cao nhất'],
    platform:'Instagram'},
];

// ============================================================
// TABS
// ============================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ============================================================
// PERSONAS
// ============================================================
function renderPersonas() {
  $('personaGrid').innerHTML = PERSONAS.map(p => `
    <div class="persona-card">
      <div class="persona-avatar" style="background:${p.bg}">${p.emoji}</div>
      <div class="persona-name">${p.name}</div>
      <div class="persona-meta">🎂 ${p.age} · ${p.gender} · 📍 ${p.location}</div>
      <div class="persona-pain">💡 <strong>Insight:</strong> ${p.pain}</div>
      <div class="persona-tags">${p.tags.map(t => `<span class="persona-tag">${t}</span>`).join('')}</div>
    </div>
  `).join('');
}

// ============================================================
// HASHTAGS
// ============================================================
function renderHashtags(list) {
  $('hashtagGrid').innerHTML = list.map(h => {
    const trendCls = h.trend === 'hot' ? 'trend-hot' : h.trend === 'up' ? 'trend-up' : 'trend-stable';
    const trendLabel = h.trend === 'hot' ? '🔥 Hot' : h.trend === 'up' ? '📈 Tăng' : '📊 Ổn định';
    return `
    <div class="hashtag-card" onclick="copyHashtag('${h.tag}')">
      <div class="hashtag-tag">${h.tag}</div>
      <div class="hashtag-meta">
        <span>📊 ${h.posts} bài</span>
        <span class="hashtag-trend ${trendCls}">${trendLabel}</span>
      </div>
      <div class="bar-mini"><div class="bar-mini-fill" style="width:${h.score}%"></div></div>
      <div style="font-size:10px;color:var(--text-3);margin-top:4px">Sức mạnh: ${h.score}/100 · Click để copy</div>
    </div>`;
  }).join('');
}

function copyHashtag(tag) {
  navigator.clipboard.writeText(tag).catch(() => {});
  toast(`📋 Đã copy ${tag}`, 'success');
}
window.copyHashtag = copyHashtag;

function filterHashtags() {
  const q = $('hashtagSearch').value.toLowerCase();
  const ind = $('hashtagIndustry').value;
  let list = ind === 'all' ? HASHTAGS_DB.all : (HASHTAGS_DB[ind] || []);
  if (q) list = list.filter(h => h.tag.includes(q));
  renderHashtags(list);
}

$('btnSearchHashtag').addEventListener('click', filterHashtags);
$('hashtagSearch').addEventListener('keydown', e => { if (e.key === 'Enter') filterHashtags(); });
$('hashtagIndustry').addEventListener('change', filterHashtags);

// ============================================================
// BEST TIME HEATMAP
// ============================================================
const DAYS = ['T2','T3','T4','T5','T6','T7','CN'];
const HOURS = ['0h','1h','2h','3h','4h','5h','6h','7h','8h','9h','10h','11h','12h','13h','14h','15h','16h','17h','18h','19h','20h','21h','22h','23h'];

function renderHeatmap(platform) {
  const data = BEST_TIME_DATA[platform];
  let html = '';
  // Header row
  html += `<div></div>`; // corner
  DAYS.forEach(d => { html += `<div class="heatmap-day">${d}</div>`; });
  // Data rows
  data.heat.forEach((row, hour) => {
    html += `<div class="heatmap-label">${HOURS[hour]}</div>`;
    row.forEach((val, day) => {
      html += `<div class="heatmap-cell heat-${val}" title="${HOURS[hour]} ${DAYS[day]}: ${['Thấp','Bình thường','Tốt','Rất tốt','Tuyệt vời'][val]}">${val >= 4 ? '⭐' : ''}</div>`;
    });
  });
  $('heatmapGrid').innerHTML = html;
  $('peak1').textContent = data.peak1;
  $('peak2').textContent = data.peak2;
  $('peakDay').textContent = data.peakDay;
  $('avoidTime').textContent = data.avoid;
}

$('bestTimePlatform').addEventListener('change', e => renderHeatmap(e.target.value));

// ============================================================
// COMPETITORS
// ============================================================
function renderCompetitors() {
  $('competitorGrid').innerHTML = COMPETITORS.map(c => `
    <div class="competitor-card">
      <div class="comp-name">${c.name}</div>
      <div class="comp-handle">${c.handle} · ${c.platform}</div>
      <div class="comp-stat-row"><span>👥 Followers</span><span class="comp-val">${c.followers}</span></div>
      <div class="comp-stat-row"><span>❤️ Engagement</span><span class="comp-val" style="color:var(--success)">${c.engRate}</span></div>
      <div class="comp-stat-row"><span>📅 Bài/tuần</span><span class="comp-val">${c.postsWeek}</span></div>
      <ul class="insight-list">
        ${c.insights.map(i => `<li class="insight-item">💡 <strong>${i.split(':')[0]}</strong>${i.includes(':') ? ':' + i.split(':').slice(1).join(':') : ''}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}

// ============================================================
// EXPORT
// ============================================================
$('btnExportInsights').addEventListener('click', () => {
  const data = {
    personas: PERSONAS.length,
    hashtags: HASHTAGS_DB.all.length,
    competitors: COMPETITORS.length,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'smartmkt-audience-insights.json'; a.click();
  toast('📥 Đã xuất Audience Insights', 'success');
});

// ============================================================
// TOAST
// ============================================================
function toast(msg, type = 'success') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${msg}</span>`;
  $('toastContainer').appendChild(el);
  setTimeout(() => { el.classList.add('toast-out'); setTimeout(() => el.remove(), 300); }, 3000);
}

// ============================================================
// INIT
// ============================================================
renderPersonas();
renderHashtags(HASHTAGS_DB.food);
renderHeatmap('tiktok');
renderCompetitors();
console.log('%c✦ SmartMkt AI Audience Intelligence — Loaded', 'color:#6366f1;font-weight:bold;font-size:14px');
