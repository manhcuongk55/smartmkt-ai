// ============================================================
// SmartMkt AI — Content AI Studio Logic
// ============================================================
// AI content generation engine with Vietnamese marketing templates
// Generates platform-specific content based on user inputs
// ============================================================

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const HISTORY_KEY = 'smartmkt_content_history';
  let selectedPlatform = 'tiktok';
  let selectedTone = 'friendly';

  // ============================================================
  // PLATFORM & TONE SELECTORS
  // ============================================================
  $$('.plat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.plat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPlatform = btn.dataset.plat;
    });
  });

  $$('.tone-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('.tone-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedTone = chip.dataset.tone;
    });
  });

  // ============================================================
  // CONTENT TEMPLATES ENGINE
  // ============================================================
  // This simulates AI-generated content with smart Vietnamese marketing templates.
  // In production, this calls OpenAI/Claude API via backend proxy.

  const PLATFORM_ICONS = { tiktok: '🎵', facebook: '📘', instagram: '📸', zalo: '💬' };
  const PLATFORM_NAMES = { tiktok: 'TikTok', facebook: 'Facebook', instagram: 'Instagram', zalo: 'Zalo' };
  const TYPE_NAMES = {
    caption: 'Caption', tiktok_script: 'Script TikTok', ad_copy: 'Ad Copy',
    reply: 'Trả lời KH', promo: 'Khuyến mãi', story: 'Story',
  };

  const HASHTAG_POOLS = {
    tiktok: ['#tiktokvietnam', '#fyp', '#viral', '#xuhuong', '#tiktokmoi', '#trending'],
    facebook: ['#shopvn', '#muahangtot', '#khuyenmai', '#freeship', '#giamgia'],
    instagram: ['#vietnam', '#shopvn', '#instashop', '#ootd', '#aesthetic'],
    zalo: [],
  };

  const EMOJIS = {
    friendly: ['😊', '❤️', '🎉', '✨', '💕', '🌸', '🎁', '💝'],
    professional: ['📌', '✅', '🔹', '📊', '💡', '⭐', '🏆', '📈'],
    funny: ['😂', '🤣', '💀', '🔥', '😎', '👀', '🤑', '💯'],
    urgent: ['🔥', '⚡', '🚨', '❗', '💥', '⏰', '🏃', '💨'],
    luxury: ['✨', '💎', '🥂', '🌟', '👑', '🌹', '💫', '🪄'],
    casual: ['🤙', '💪', '🎯', '😍', '🙌', '💅', '🤤', '🫶'],
  };

  function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randomEmoji(tone) { return randomPick(EMOJIS[tone] || EMOJIS.friendly); }
  function randomHashtags(plat, n = 5) {
    const pool = [...HASHTAG_POOLS[plat]];
    const result = [];
    for (let i = 0; i < Math.min(n, pool.length); i++) {
      const idx = Math.floor(Math.random() * pool.length);
      result.push(pool.splice(idx, 1)[0]);
    }
    return result.join(' ');
  }

  function generateContent(params) {
    const { brand, product, platform, contentType, tone, extra } = params;
    const brandName = brand || 'Shop của bạn';
    const productName = product || 'sản phẩm';
    const e = () => randomEmoji(tone);
    const hashtags = randomHashtags(platform);

    const templates = {
      caption: {
        friendly: () => `${e()} ${brandName} xin chào cả nhà!

Hôm nay mình muốn giới thiệu ${productName} — sản phẩm mà ai dùng cũng phải khen ${e()}

${e()} Điểm nổi bật:
• Chất lượng cao cấp, bền đẹp
• Giá hợp lý cho mọi người
• Free ship toàn quốc
• Đổi trả miễn phí 7 ngày

${e()} Inbox ngay để được tư vấn chi tiết nhé!

📍 ${brandName}
📞 Inbox / Comment để đặt hàng
${hashtags}`,

        professional: () => `${e()} ${brandName} — ${productName}

Chúng tôi tự hào giới thiệu ${productName} với những ưu điểm vượt trội:

${e()} Tính năng nổi bật:
▸ Thiết kế hiện đại, sang trọng
▸ Chất liệu cao cấp, bền bỉ
▸ Cam kết chính hãng 100%
▸ Chính sách đổi trả linh hoạt

${e()} Ưu đãi đặc biệt:
▸ Giảm 15% cho đơn hàng đầu tiên
▸ Miễn phí vận chuyển đơn từ 500K

Liên hệ ngay để được tư vấn!
${hashtags}`,

        funny: () => `${e()} POV: Bạn chưa biết ${brandName} tồn tại...

Ngày xưa: "Mua đồ ở đâu nhỉ?" 🤔
Bây giờ: "${brandName} ship tận nơi" ${e()}

${productName} nhà mình ngon lắm nha:
• Đẹp quá trời đẹp ${e()}
• Giá rẻ giật mình
• Ship nhanh hơn crush rep tin
• Đổi trả "ez" 7 ngày

Ai chưa thử thì phí 1 đời ${e()}
Comment "MUỐN" để mình inbox giá sốc!
${hashtags}`,

        urgent: () => `${e()} FLASH SALE — CHỈ HÔM NAY!

${brandName} giảm SỐC ${productName} ${e()}

${e()} ƯU ĐÃI CÓ HẠN:
🔴 Giảm 30% — chỉ còn vài suất!
🔴 Free ship TOÀN QUỐC
🔴 Tặng quà khi đặt trong 2 tiếng!

⏰ Thời gian: Đến 23h59 hôm nay
📦 Số lượng: Chỉ 50 suất

${e()} COMMENT "ĐẶT" NGAY — ĐỪng để hết!
${hashtags}`,

        luxury: () => `${e()} ${brandName} — Nâng tầm phong cách

Giới thiệu ${productName} — dành cho những ai yêu thích sự tinh tế ${e()}

${e()} Điều gì làm nên khác biệt:
• Chất liệu được chọn lọc kỹ lưỡng
• Thiết kế độc quyền, giới hạn
• Trải nghiệm mua sắm 5 sao
• Đóng gói quà tặng sang trọng

${e()} Đặt hàng VIP — Nhận ưu đãi riêng

Inbox ${brandName} để được tư vấn 1:1 ${e()}
${hashtags}`,

        casual: () => `${e()} Yo! ${brandName} có hàng mới nè!

${productName} vừa về — xinh lắm luôn ${e()}

Check list đi:
${e()} Đẹp ✓
${e()} Chất ✓  
${e()} Giá sinh viên ✓
${e()} Free ship ✓

Hết hàng là khóc nha ${e()}
Inbox gấp đi mọi ngườiiii~
${hashtags}`,
      },

      tiktok_script: {
        _default: () => `🎬 SCRIPT TIKTOK — ${brandName}
━━━━━━━━━━━━━━━━━━━━━━

📱 Nền tảng: TikTok | Thời lượng: 30-45s

🎵 Nhạc nền gợi ý: Trending sound hiện tại

━━━━━━━━━━━━━━━━━━━━━━

⏱ 0-3s | HOOK (Giữ người xem)
━━━━━━━
[Mở camera selfie] 
"Mọi người ơi, ${productName} này mà không thử thì phí lắm!"
→ Text overlay: "${brandName} — PHẢI THỬ NGAY"

⏱ 3-10s | VẤN ĐỀ
━━━━━━━
"Trước đây mình cũng không biết mua ở đâu cho uy tín..."
→ B-roll: Cảnh scrolling qua nhiều shop lạ
→ Text: "❌ Hàng fake ❌ Ship chậm ❌ Không đổi trả"

⏱ 10-20s | GIỚI THIỆU SẢN PHẨM
━━━━━━━
"Cho đến khi mình tìm thấy ${brandName}!"
→ Unboxing ${productName}
→ Close-up chi tiết sản phẩm
→ Text: "✅ Chính hãng ✅ Ship nhanh ✅ Đổi trả 7 ngày"

⏱ 20-30s | DEMO / REVIEW
━━━━━━━
"Chất lượng thật sự xịn lắm nè..."
→ Quay cận cảnh sử dụng
→ Before/After nếu có
→ Text: "Xịn quá trời ${randomEmoji(tone)}"

⏱ 30-35s | SOCIAL PROOF
━━━━━━━
"Đã bán 1000+ đơn, 5 sao liên tục"
→ Screenshot review từ khách
→ Text: "⭐⭐⭐⭐⭐ 1000+ đánh giá"

⏱ 35-45s | CTA
━━━━━━━
"Link mua ở bio nha! Comment 'MUA' để mình inbox giá!"
→ Trỏ tay lên bio
→ Text: "🛒 LINK BIO | Comment MUA ngay"

━━━━━━━━━━━━━━━━━━━━━━

📌 GHI CHÚ:
• Quay dọc 9:16, không cần chỉnh filter nhiều
• Nói nhanh, tự nhiên, đừng đọc kịch bản
• Thêm subtitle auto trên CapCut
• Đăng lúc 19:00-21:00 để reach cao

${hashtags}`,
      },

      ad_copy: {
        _default: () => `📢 AD COPY — ${brandName}
━━━━━━━━━━━━━━━━━━━━━━

🎯 HEADLINE (Dòng đầu tiên):
"${productName} từ ${brandName} — Đẹp, Chất, Giá Hời!"

📝 PRIMARY TEXT:
${randomEmoji(tone)} Bạn đang tìm ${productName} chất lượng với giá hợp lý?

${brandName} giúp bạn:
✅ Sản phẩm chính hãng 100%
✅ Free ship đơn từ 300K
✅ Đổi trả miễn phí trong 7 ngày
✅ Tư vấn 1:1 tận tâm

${randomEmoji(tone)} Hơn 1,000 khách hàng đã tin tưởng!

👉 ĐẶT HÀNG NGAY — Giảm 20% cho khách mới!

📝 DESCRIPTION:
${brandName} — Uy tín từ 2024. Ship toàn quốc. Đổi trả dễ dàng.

🔹 CTA: Mua ngay | Tìm hiểu thêm | Nhắn tin

━━━━━━━━━━━━━━━━━━━━━━

📊 GỢI Ý TARGETING:
• Độ tuổi: 18-35
• Giới tính: Tùy sản phẩm
• Sở thích: Shopping online, ${productName}
• Địa điểm: HCM, HN, Đà Nẵng
• Ngân sách: 200K-500K/ngày
• Thời gian chạy: 3-7 ngày (test)

📌 A/B TEST:
• Test 2-3 ảnh/video khác nhau
• Test 2 headline khác nhau
• Chạy 3 ngày → giữ ad có CTR > 2%`,
      },

      reply: {
        _default: () => `💬 MẪU TRẢ LỜI KHÁCH HÀNG — ${brandName}
━━━━━━━━━━━━━━━━━━━━━━

📌 KH HỎI GIÁ:
"Chào bạn ${randomEmoji(tone)} Cảm ơn bạn quan tâm đến ${productName} nhé!
Hiện tại giá [SỐ TIỀN]đ ạ. Đang có ưu đãi free ship cho đơn từ 300K.
Bạn muốn mình tư vấn thêm size/màu không ạ?"

📌 KH MUỐN GIẢM GIÁ:
"Dạ bên mình đang có giá tốt nhất rồi ạ ${randomEmoji(tone)}
Nhưng mình có thể tặng bạn [QUÀ TẶNG] nếu đặt hôm nay!
Bạn chốt luôn nha, mình chuẩn bị hàng ngay ${randomEmoji(tone)}"

📌 KH HỎI SHIP:
"Ship toàn quốc bạn nhé! ${randomEmoji(tone)}
• Nội thành HCM/HN: 1-2 ngày
• Tỉnh khác: 2-4 ngày
Free ship đơn từ 300K ạ. Bạn ở đâu để mình báo phí chính xác?"

📌 KH PHÀN NÀN:
"Dạ, mình rất xin lỗi bạn về vấn đề này ${randomEmoji(tone)}
Bạn gửi mình ảnh/video sản phẩm để mình kiểm tra ngay nhé.
${brandName} cam kết đổi trả miễn phí nếu lỗi từ shop ạ!"

📌 KH ĐÃ MUA — FOLLOW UP:
"Chào bạn! ${randomEmoji(tone)} Bạn nhận được ${productName} chưa ạ?
Mình muốn check xem bạn có hài lòng không nhé.
Nếu ổn, bạn để lại 5 sao giúp mình nha, cảm ơn bạn nhiều lắm ${randomEmoji(tone)}"`,
      },

      promo: {
        _default: () => `🎉 THÔNG BÁO KHUYẾN MÃI — ${brandName}
━━━━━━━━━━━━━━━━━━━━━━

${randomEmoji(tone)} ${brandName.toUpperCase()} — ĐẠI TIỆC SALE!

🔥 Ưu đãi đặc biệt cho ${productName}:

🎁 GIẢM 30% toàn bộ sản phẩm
🚚 FREE SHIP không giới hạn
🎪 Tặng quà cho 100 đơn đầu tiên
⏰ Thời gian: [NGÀY] — [NGÀY]

━━━━━━━━━━━━━━━━━━━━━━

📦 Cách đặt hàng:
1️⃣ Chọn sản phẩm yêu thích
2️⃣ Inbox / Comment "ĐẶT" + Mã SP
3️⃣ Nhận hàng & thanh toán COD

${randomEmoji(tone)} Số lượng có hạn — Ai nhanh người đó được!

📍 ${brandName}
💬 Inbox ngay để chốt đơn!
${hashtags}`,
      },

      story: {
        _default: () => `📱 STORY/STATUS — ${brandName}
━━━━━━━━━━━━━━━━━━━━━━

STORY 1 (Teaser):
"Hmm... hôm nay có gì hot nè ${randomEmoji(tone)}"
→ [Ảnh mờ sản phẩm] → Poll: "Đoán xem là gì?"

STORY 2 (Reveal):
"${productName} mới về! ${randomEmoji(tone)}"
→ [Ảnh rõ sản phẩm] → "Vuốt lên để xem chi tiết"

STORY 3 (Social Proof):
"Khách feedback nè ${randomEmoji(tone)}"
→ [Screenshot review 5 sao]

STORY 4 (CTA):
"Ai muốn giảm 20%? ${randomEmoji(tone)}"
→ [Sticker câu hỏi: "Rep MUỐN nha"]

━━━━━━━━━━━━━━━━━━━━━━
📌 Đăng 4 story liên tục, cách nhau 2-3 tiếng
📌 Dùng sticker poll/question để tăng tương tác`,
      },
    };

    // Select template
    const typeTemplates = templates[contentType];
    if (!typeTemplates) return 'Loại content chưa được hỗ trợ.';

    const templateFn = typeTemplates[tone] || typeTemplates._default;
    if (!templateFn) return 'Giọng điệu chưa có template.';

    let content = templateFn();

    // Append extra request
    if (extra) {
      content += `\n\n━━━━━━━━━━━━━━━━━━━━━━\n📝 Yêu cầu thêm: ${extra}`;
    }

    return content;
  }

  // ============================================================
  // GENERATE HANDLER
  // ============================================================
  $('#btnGenerate').addEventListener('click', async () => {
    const brand = $('#contentBrand').value.trim();
    const product = $('#contentProduct').value.trim();
    const contentType = $('#contentType').value;
    const extra = $('#contentExtra').value.trim();
    const btn = $('#btnGenerate');

    // Show loading
    $('#outputEmpty').style.display = 'none';
    $('#outputResult').style.display = 'none';
    $('#outputLoading').style.display = 'block';
    btn.disabled = true;
    btn.classList.add('generating');
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10" stroke="currentColor" stroke-width="2"/></svg>
      Đang tạo...
    `;

    // Simulate AI processing time
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));

    const content = generateContent({
      brand, product,
      platform: selectedPlatform,
      contentType,
      tone: selectedTone,
      extra,
    });

    // Show result
    $('#outputLoading').style.display = 'none';
    $('#outputResult').style.display = 'block';
    $('#resultPlat').textContent = PLATFORM_NAMES[selectedPlatform];
    $('#resultType').textContent = TYPE_NAMES[contentType];
    $('#resultContent').textContent = content;

    const wordCount = content.split(/\s+/).length;
    $('#resultWords').textContent = wordCount + ' từ';
    $('#resultTime').textContent = new Date().toLocaleTimeString('vi-VN');

    // Save to history
    saveToHistory({
      brand: brand || 'Shop',
      product,
      platform: selectedPlatform,
      contentType,
      tone: selectedTone,
      content,
      createdAt: new Date().toISOString(),
    });

    // Reset button
    btn.disabled = false;
    btn.classList.remove('generating');
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10" stroke="currentColor" stroke-width="2"/></svg>
      Tạo Content với AI
    `;

    renderHistory();
    showToast('✅ Content đã được tạo!', 'success');
  });

  // ============================================================
  // COPY TO CLIPBOARD
  // ============================================================
  $('#btnCopy').addEventListener('click', () => {
    const content = $('#resultContent').textContent;
    navigator.clipboard.writeText(content).then(() => {
      showToast('📋 Đã copy vào clipboard!', 'success');
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('📋 Đã copy!', 'success');
    });
  });

  // Regenerate
  $('#btnRegenerate').addEventListener('click', () => {
    $('#btnGenerate').click();
  });

  // ============================================================
  // HISTORY
  // ============================================================
  function saveToHistory(item) {
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    history.unshift(item);
    if (history.length > 20) history = history.slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function renderHistory() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const list = $('#historyList');

    if (history.length === 0) {
      $('#outputHistory').style.display = 'none';
      return;
    }
    $('#outputHistory').style.display = 'block';

    list.innerHTML = history.slice(0, 8).map((h, i) => {
      const icon = PLATFORM_ICONS[h.platform] || '📄';
      const time = new Date(h.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      });
      return `
        <div class="history-item" data-idx="${i}">
          <span class="hi-plat-icon">${icon}</span>
          <div class="hi-info">
            <div class="hi-name">${h.brand} — ${TYPE_NAMES[h.contentType] || h.contentType}</div>
          </div>
          <span class="hi-time">${time}</span>
        </div>
      `;
    }).join('');

    // Click to load history item
    list.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx);
        const h = history[idx];
        if (!h) return;

        $('#outputEmpty').style.display = 'none';
        $('#outputLoading').style.display = 'none';
        $('#outputResult').style.display = 'block';
        $('#resultPlat').textContent = PLATFORM_NAMES[h.platform];
        $('#resultType').textContent = TYPE_NAMES[h.contentType];
        $('#resultContent').textContent = h.content;
        $('#resultWords').textContent = h.content.split(/\s+/).length + ' từ';
        $('#resultTime').textContent = new Date(h.createdAt).toLocaleTimeString('vi-VN');
      });
    });
  }

  // ============================================================
  // SIDEBAR TOGGLE
  // ============================================================
  const sidebarToggle = $('#sidebarToggle');
  if (sidebarToggle) sidebarToggle.addEventListener('click', () => $('#sidebar').classList.toggle('open'));

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
    setTimeout(() => { toast.classList.add('toast-out'); setTimeout(() => toast.remove(), 300); }, 3000);
  }

  // ============================================================
  // INIT
  // ============================================================
  renderHistory();
  console.log('%c✦ SmartMkt AI Content Studio — Loaded', 'color:#06b6d4;font-weight:bold;font-size:14px');
})();
