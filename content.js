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
    const story = extra || ''; // The "why" — seller's true story
    const e = () => randomEmoji(tone);
    const hashtags = randomHashtags(platform);

    // ============================================================
    // PHILOSOPHY: Real Story → Real People → Real Trust → Real Sales
    // Every template leads with the authentic human story behind the product.
    // AI does NOT create fake promotions — it amplifies the real truth.
    // ============================================================

    const templates = {
      caption: {
        friendly: () => `${e()} ${story ? `Câu chuyện thật về ${brandName}:` : `${brandName} — không phải quảng cáo, đây là sự thật:`}

${story
  ? `"${story}"`
  : `${productName} được làm bởi người thật, cho người thật cần.`}

Mình ${story ? 'bán' : 'làm'} ${productName} vì mình tin vào nó — không phải vì lợi nhuận là trên hết ${e()}

${e()} Ai thật sự cần ${productName}:
• Người đang tìm sản phẩm chất lượng thật
• Người muốn mua từ người bán có tâm
• Người không muốn bị lừa bởi quảng cáo phô

${e()} Bạn có thể nhắn hỏi bất cứ điều gì — mình trả lời thật 100%

📍 ${brandName}
${hashtags}`,

        professional: () => `${brandName} — ${productName}

${story ? `Chúng tôi tạo ra ${productName} vì:\n"${story}"` : `${productName} được tạo ra với một mục tiêu rõ ràng: giải quyết đúng vấn đề thật của khách hàng.`}

${e()} Tại sao khách hàng chọn chúng tôi:
▸ Sản phẩm được kiểm tra kỹ trước khi đến tay bạn
▸ Người bán có trách nhiệm — không biến mất sau khi bán
▸ Phản hồi khách hàng trong 2 giờ làm việc
▸ Chính sách đổi trả minh bạch, không cần giải thích

${e()} Chúng tôi không hứa hẹn những gì chúng tôi không thể làm.
Chúng tôi chỉ hứa điều chúng tôi đã và đang làm.

Liên hệ để biết thêm về ${productName}
${hashtags}`,

        funny: () => `${e()} Thật ra hả?

Mình bán ${productName} vì ${story || `mình đã từng tìm sản phẩm này mà không thấy ai bán tử tế`}.

Không phải vì mình nghĩ "ừ bán cái này có vẻ kiếm được tiền" ${e()}

${e()} Mình không hứa nhiều — mình chỉ hứa:
✓ ${productName} này mình đã dùng / đã làm / đã kiểm tra
✓ Nếu không ưng mình hoàn tiền, không hỏi lý do
✓ Mình trả lời tin nhắn trong 30 phút (giờ hành chính)

Nếu bạn đang đọc đến đây — bạn là người thật, mình là người thật, mình nghĩ mình hợp ${e()}

DM đi, mình chờ!

${hashtags}`,

        urgent: () => `⚡ Không phải flash sale giả tạo.

${story ? `Lý do thật: "${story}"` : `${brandName} đang có đợt hàng chất lượng cao nhất từ trước đến nay.`}

${productName} này có hạn — không phải chiêu trò khuyến mãi.
Lý do thật: ${story || 'chúng tôi chỉ nhập hàng khi chắc chắn chất lượng đạt chuẩn, và đợt này số lượng hữu hạn.'}

${e()} Ai nên đặt ngay:
→ Bạn đang cần một ${productName} thật sự tốt
→ Bạn đã tìm kiếm lâu và muốn chắc ăn
→ Bạn không muốn phải đổi trả phiền phức

Đặt hôm nay — mình ưu tiên giao trong ngày.
📞 Inbox ngay!
${hashtags}`,

        luxury: () => `✨ Không phải ai cũng dành cho ${productName}.

${story ? `Câu chuyện tạo ra ${brandName}:\n"${story}"` : `${brandName} được tạo ra dành cho người trân trọng chất lượng thật.`}

Chúng tôi không bán số lượng — chúng tôi bán trải nghiệm.
${productName} của ${brandName} không phải hàng đại trà.
Mỗi ${productName} được làm với sự tỉ mỉ khác biệt.

${e()} Khách hàng mua ${productName} không chỉ mua sản phẩm —
họ mua sự đảm bảo rằng điều gì đó được làm đúng cách.

Để biết thêm, hãy liên hệ riêng.
${hashtags}`,

        casual: () => `Okay thật ra là thế này 🤙

${story ? `Mình làm ${productName} vì "${story}"` : `Mình làm ${productName} vì mình thấy thị trường toàn hàng fake, mình muốn làm cái thật.`}

Không màu mè, không vẽ vời. ${e()}

Sản phẩm: ${productName}
Shop: ${brandName}
Chất lượng: thật
Giá: hợp lý (inbox để hỏi)
Người bán: là mình — người thật, bán hàng thật

DM nếu bạn muốn biết thêm, mình reply nhanh lắm 🫶
${hashtags}`,
      },

      tiktok_script: {
        friendly: () => `🎬 SCRIPT TIKTOK — ${productName.toUpperCase()}
— Thể loại: Câu chuyện thật của người bán —

[HOOK — 3 giây đầu]
"Tôi bán ${productName} không phải vì muốn giàu nhanh — mà vì..."

[THÂN — 20-40 giây]
${story
  ? `"${story}"\n\n[Quay cận cảnh sản phẩm + tay người làm]\n"Và đây là sản phẩm tôi làm ra từ câu chuyện đó."`
  : `[Kể ngắn gọn bạn bắt đầu ${brandName} như thế nào, tại sao]\n[Quay cảnh thực tế làm/bán ${productName}]\n"Mỗi ${productName} tôi bán ra — tôi đã tự mình kiểm tra."`}

[PHẦN THẬT]
"Giá bao nhiêu? [Giá thật]. Chất lượng như thế nào? [Mô tả thật]. Có làm tôi thất vọng không? [Trả lời thật]."

[CALL TO ACTION tự nhiên]
"Nếu bạn đang cần ${productName} và muốn mua từ người có tâm — link bio."

[HASHTAGS]
${hashtags} #câuchuyệnthật #muahàngvn`,

        professional: () => `🎬 SCRIPT TIKTOK — PROFESSIONAL
${brandName} | ${productName}

[HOOK]
"95% người mua ${productName} online gặp vấn đề này. Chúng tôi giải quyết nó như thế nào?"

[PROBLEM]
[Nêu đúng 1 pain point thật của khách hàng khi tìm ${productName}]
"Bạn không biết sản phẩm có thật sự chất lượng không?"
"Người bán có còn đó sau khi bạn thanh toán không?"

[SOLUTION — thật, không phóng đại]
${story ? `"${story} — đó là lý do chúng tôi tạo ra ${productName} theo cách này."\n` : ''}
"${brandName} giải quyết điều đó bằng: [Chính sách cụ thể, thật]"

[PROOF — bằng chứng thật]
[Review thật / số liệu thật / hình ảnh sản phẩm thật]

[CTA]
"Xem chi tiết tại link bio — không spam, không telesale."
${hashtags}`,

        funny: () => `🎬 SCRIPT TIKTOK — CÓ HỒN 😂
${brandName}

[HOOK — gây chú ý]
"POV: Bạn order ${productName} online và nhận được... đúng như ảnh. Sốc không?"

[TWIST hài]
"Ừ, với ${brandName} thì như vậy đó. Không phải viral trick — là thật."

[So sánh thật vs fake — hài hước nhưng honest]
"Cái shop kia: ảnh lung linh, hàng về... 💀"
"${brandName}: ảnh bình thường, hàng về... [quay unboxing thật]"

[STORY ngắn]
${story ? `"Mình bán ${productName} vì: ${story}. Nghe có vẻ nerd nhưng mà đó là thật."` : '"Mình bán thật, ship thật, chăm sóc thật."'}

[CTA]
"Mua thật? Link bio. Mình chờ 😎"
${hashtags} #mấtngủvìhàngxịn`,

        casual: () => `🎬 SCRIPT TIKTOK — CỰC GẦN GŨI
${brandName} | ${productName}

[HOOK — tự nhiên]
[Tự nói thẳng vào camera, không dàn dựng]
"Oke tôi sẽ không vòng vo — tôi bán ${productName}, đây là lý do tôi làm điều này:"

[STORY — ngắn, thật, có cảm xúc]
${story
  ? `"${story}"`
  : '"[Kể 2-3 câu về lý do bạn bắt đầu — điều gì thúc đẩy bạn]"'}

[SẢN PHẨM — show thật]
[Quay ${productName} thật, từ nhiều góc, dưới ánh sáng thật]
"Trông như thế này nha — không filter, không edit."

[GIÁ — công khai]
"Giá [X]. Ai hỏi mình đều nói thật, không mặc cả kiểu tăng giá trước."

[KẾT]
"Mình là [Tên], tôi làm ${brandName}. Link bio nếu bạn cần."
${hashtags}`,
      },

      ad_copy: {
        friendly: () => `📢 QUẢNG CÁO THẬT — ${brandName}

"${story || `Chúng tôi tạo ra ${productName} vì chúng tôi đã từng là người mua và biết cảm giác thất vọng.`}"

${productName} — được làm bởi người thật, cho người thật cần.

${e()} KHÔNG hứa hão:
✗ Không "đổi đời trong 7 ngày"
✗ Không "cam kết 0 rủi ro" (vì rủi ro luôn tồn tại)
✗ Không "review từ KOL" — chỉ từ khách thật

${e()} THẬT SỰ CÓ:
✓ ${productName} chất lượng, được kiểm tra trực tiếp
✓ Người bán trả lời inbox trong vòng 2 giờ
✓ Đổi trả nếu không đúng như mô tả

CTA: Tìm hiểu thêm → [Link]
${hashtags}`,

        professional: () => `${brandName} | ${productName}

${story ? `Lý do tồn tại của chúng tôi:\n"${story}"` : `Chúng tôi giải quyết vấn đề mà ${productName} phổ biến trên thị trường chưa giải quyết được.`}

Dành cho:  người đang tìm ${productName} với:
→ Chất lượng nhất quán, không may rủi
→ Người bán có trách nhiệm rõ ràng
→ Giá minh bạch, không ẩn phí

Không phù hợp nếu bạn chỉ tìm hàng rẻ nhất thị trường.
Phù hợp nếu bạn muốn đúng như mô tả.

Tìm hiểu thêm: [Link]
${hashtags}`,
      },

      reply: {
        friendly: () => `Dạ ${e()} cảm ơn bạn đã hỏi!

[Trả lời thẳng câu hỏi của khách — không lòng vòng]

Bạn hỏi về ${productName} — đây là sự thật:
• [Điểm mạnh thật — nêu cụ thể]
• [Điểm cần lưu ý — nếu có, nói thật]
• Giá: [Giá thật, đúng giá bán]
• Ship: [Thời gian thật, không hứa hão]

Nếu bạn cần thêm thông tin, nhắn thoải mái nhé!
Mình ở đây để giúp bạn quyết định đúng, không phải để chốt đơn bằng mọi giá ${e()}

📍 ${brandName}`,

        professional: () => `Kính chào,

Cảm ơn bạn đã quan tâm đến ${productName} của ${brandName}.

Về câu hỏi của bạn — chúng tôi sẽ trả lời trực tiếp và trung thực:

[Trả lời đúng trọng tâm câu hỏi]
[Nếu sản phẩm không phù hợp với nhu cầu khách, nói thẳng]
[Đề xuất giải pháp thay thế nếu cần]

Mọi thắc mắc thêm, bạn có thể liên hệ trực tiếp:
📧 [Email] | 📞 [SĐT]

Trân trọng,
${brandName}`,
      },

      promo: {
        friendly: () => `${e()} Ưu đãi thật — không chiêu trò

${story ? `${brandName}: "${story.substring(0, 80)}..."` : `${brandName} — shop bán ${productName} với cam kết thật.`}

📣 Ưu đãi lần này có lý do thật:
[Giải thích thật tại sao có khuyến mãi — ví dụ: nhập hàng về nhiều, muốn khách dùng thử, kỷ niệm shop...]

${e()} ƯU ĐÃI:
→ [Mô tả ưu đãi cụ thể, có điều kiện rõ ràng]
→ Thời hạn: [Ngày cụ thể, không "hết hàng thôi"]

Không bắt ép mua ngay. Nếu chưa cần — lưu lại cho lần sau.
Nếu cần — inbox để đặt.

${hashtags}`,
      },

      story: {
        friendly: () => `📖 Câu chuyện thật của ${brandName}

${story
  ? `"${story}"`
  : `Tôi bắt đầu ${brandName} từ một vấn đề đơn giản: tôi không tìm được ${productName} tốt trên thị trường. Vậy thì tôi tự làm.`}

Hành trình không phải lúc nào cũng suôn sẻ. Có những lúc:
→ [Thử thách thật bạn đã gặp]
→ [Điều bạn học được]

Nhưng điều khiến tôi tiếp tục là ${productName} này thật sự giúp được người dùng.

Không phải mọi người đều cần ${productName}. Nhưng người nào cần — tôi muốn họ tìm được cái đúng.

📍 ${brandName} — Bán hàng bằng sự thật
${hashtags}`,
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
