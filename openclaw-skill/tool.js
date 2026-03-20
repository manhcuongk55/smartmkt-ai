#!/usr/bin/env node
/**
 * SmartMkt AI — OpenClaw Tool
 * ============================================================
 * Invoked by OpenClaw when a user sends /smartmkt <args>
 * 
 * Input (stdin JSON):
 *   { command: "<raw args>", commandName: "smartmkt", skillName: "smartmkt" }
 * 
 * Output (stdout):
 *   Plain text response formatted for the active channel.
 * 
 * Usage examples:
 *   /smartmkt content trà sữa
 *   /smartmkt content trà sữa --type tiktok_script --tone casual
 *   /smartmkt content trà sữa --story "mở shop vì con thích"
 *   /smartmkt crm
 *   /smartmkt plan
 *   /smartmkt help
 * ============================================================
 */

'use strict';

const path = require('path');
const { formatContent, formatError, formatHelp, detectChannel } = require('./formatters');

// ============================================================
// CONTENT ENGINE (ported from content.js — no DOM dependency)
// ============================================================
const HASHTAG_POOLS = {
  tiktok: ['#tiktokvietnam', '#fyp', '#viral', '#xuhuong', '#muahàngvn', '#trending', '#shopvn'],
  facebook: ['#shopvn', '#muahangtot', '#khuyenmai', '#freeship', '#giamgia', '#hàngthật'],
  instagram: ['#vietnam', '#shopvn', '#instashop', '#aesthetic', '#localshop'],
  zalo: [],
  default: ['#shopvn', '#muahàngthật', '#nièmtin', '#sảnphẩmthật'],
};

const EMOJIS = {
  friendly:     ['😊', '❤️', '🎉', '✨', '💕', '🌸', '🎁', '💝'],
  professional: ['📌', '✅', '🔹', '📊', '💡', '⭐', '🏆', '📈'],
  funny:        ['😂', '🤣', '💀', '🔥', '😎', '👀', '🤑', '💯'],
  urgent:       ['🔥', '⚡', '🚨', '❗', '💥', '⏰', '🏃', '💨'],
  luxury:       ['✨', '💎', '🥂', '🌟', '👑', '🌹', '💫', '🪄'],
  casual:       ['🤙', '💪', '🎯', '😍', '🙌', '💅', '🤤', '🫶'],
};

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function emoji(tone) { return rnd(EMOJIS[tone] || EMOJIS.friendly); }
function hashtags(plat = 'default', n = 5) {
  const pool = [...(HASHTAG_POOLS[plat] || HASHTAG_POOLS.default)];
  const result = [];
  for (let i = 0; i < Math.min(n, pool.length); i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result.join(' ');
}

function generateContent({ brand, product, platform = 'default', contentType = 'caption', tone = 'friendly', story = '' }) {
  const bname = brand || 'Shop của bạn';
  const pname = product || 'sản phẩm';
  const ht = hashtags(platform);
  const e = () => emoji(tone);

  const TEMPLATES = {
    caption: {
      friendly: () => `${e()} ${story ? `Câu chuyện thật về ${bname}:` : `${bname} — không phải quảng cáo, đây là sự thật:`}

${story ? `"${story}"` : `${pname} được làm bởi người thật, cho người thật cần.`}

Mình bán ${pname} vì mình tin vào nó — không phải vì lợi nhuận là trên hết ${e()}

${e()} Ai thật sự cần ${pname}:
• Người đang tìm sản phẩm chất lượng thật
• Người muốn mua từ người bán có tâm
• Người không muốn bị lừa bởi quảng cáo phô

Bạn có thể nhắn hỏi bất cứ điều gì — mình trả lời thật 100% ${e()}

📍 ${bname}
${ht}`,

      professional: () => `${bname} — ${pname}

${story ? `Chúng tôi tạo ra ${pname} vì:\n"${story}"` : `${pname} được tạo ra với mục tiêu giải quyết đúng vấn đề thật của khách hàng.`}

${e()} Tại sao khách chọn chúng tôi:
▸ Sản phẩm được kiểm tra kỹ trước khi ship
▸ Người bán có trách nhiệm, không biến mất
▸ Phản hồi trong 2 giờ làm việc
▸ Đổi trả minh bạch, không cần giải thích

Chúng tôi không hứa những gì chúng tôi không làm được.

${ht}`,

      funny: () => `${e()} Thật ra hả?

Mình bán ${pname} vì ${story || `mình đã tìm sản phẩm này mà không thấy ai bán tử tế`}.

Mình không hứa nhiều — mình chỉ hứa:
✓ ${pname} này mình đã dùng/kiểm tra
✓ Không ưng thì hoàn tiền, không hỏi lý do
✓ Trả lời tin nhắn trong 30 phút (giờ hành chính)

Bạn là người thật, mình là người thật — mình nghĩ mình hợp ${e()}

DM đi!
${ht}`,

      casual: () => `Okay thật ra là thế này 🤙

${story ? `Mình bán ${pname} vì "${story}"` : `Mình bán ${pname} vì thị trường toàn hàng fake.`}

Sản phẩm: ${pname}
Shop: ${bname}
Chất lượng: thật
Người bán: người thật

DM nếu bạn muốn biết thêm 🫶
${ht}`,

      urgent: () => `⚡ ${bname} — ${pname}

Lý do thật: ${story || `Đợt này hàng về chất lượng cao, số lượng có hạn — không phải flash sale fake.`}

${e()} Ai nên đặt ngay:
→ Bạn đang cần ${pname} thật sự tốt
→ Bạn đã tìm lâu và muốn chắc ăn

Đặt hôm nay — ưu tiên giao trong ngày.
${ht}`,

      luxury: () => `✨ ${bname} — không phải ai cũng dành cho ${pname}.

${story ? `"${story}"` : `Được tạo ra dành cho người trân trọng chất lượng thật.`}

Không bán số lượng — bán trải nghiệm.
Mỗi ${pname} được làm với sự tỉ mỉ khác biệt.

Liên hệ riêng để biết thêm.
${ht}`,
    },

    tiktok_script: {
      friendly: () => `🎬 SCRIPT TIKTOK — ${pname.toUpperCase()}

[HOOK — 3 giây]
"Mình bán ${pname} không phải vì muốn giàu nhanh — mà vì..."

[THÂN — 20-40 giây]
${story ? `"${story}"\n\n[Quay cận cảnh sản phẩm]\n"Và đây là sản phẩm mình làm ra."` : `[Kể lý do bạn bắt đầu ${bname}]\n[Quay cảnh thực tế]\n"Mỗi ${pname} mình bán — mình đã tự kiểm tra."`}

[PHẦN THẬT]
"Giá? [Giá thật]. Chất lượng? [Mô tả thật]. Có làm tôi thất vọng? [Thật]."

[CTA]
"Cần ${pname} và muốn mua từ người có tâm — link bio."

${ht} #câuchuyệnthật`,

      casual: () => `🎬 SCRIPT TIKTOK — GẦN GŨI
[Nói thẳng vào camera]
"Oke mình không vòng vo — mình bán ${pname}, lý do:"

${story ? `"${story}"` : '"[Kể 2-3 câu về lý do thật]"'}

[Quay ${pname} thật, không filter]
"Trông như này nha."

"Mình là người thật, bán ${pname} thật. Link bio."
${ht}`,
    },

    ad_copy: {
      friendly: () => `📢 QUẢNG CÁO THẬT — ${bname}

"${story || `Chúng tôi tạo ra ${pname} vì đã từng là người mua và biết cảm giác thất vọng.`}"

${pname} — làm bởi người thật, cho người thật cần.

${e()} KHÔNG hứa hão:
✗ Không "đổi đời trong 7 ngày"
✗ Không review fake từ KOL thuê ngoài

${e()} THẬT SỰ CÓ:
✓ ${pname} chất lượng, kiểm tra trực tiếp
✓ Người bán trả lời inbox trong 2 giờ
✓ Đổi trả nếu không đúng mô tả

→ Tìm hiểu thêm tại ${bname}
${ht}`,
    },

    reply: {
      friendly: () => `Dạ ${e()} cảm ơn bạn đã hỏi!

Bạn hỏi về ${pname} — đây là sự thật:
• [Điểm mạnh thật — nêu cụ thể]
• [Điểm cần lưu ý — nếu có, nói thật]
• Giá: [Giá thật]
• Ship: [Thời gian thật]

Mình ở đây để giúp bạn quyết định đúng — không phải chốt đơn bằng mọi giá ${e()}

📍 ${bname}`,
    },

    promo: {
      friendly: () => `${e()} Ưu đãi thật — không chiêu trò

${story ? `${bname}: "${story.substring(0, 80)}..."` : `${bname} — shop bán ${pname} với cam kết thật.`}

📣 Ưu đãi lần này có lý do thật:
[Giải thích thật tại sao có khuyến mãi]

${e()} ƯU ĐÃI:
→ [Mô tả cụ thể, điều kiện rõ ràng]
→ Thời hạn: [Ngày cụ thể]

Không bắt ép mua ngay. Nếu chưa cần — lưu lại cho lần sau.
${ht}`,
    },

    story: {
      friendly: () => `📖 Câu chuyện thật của ${bname}

${story ? `"${story}"` : `Mình bắt đầu ${bname} từ một vấn đề đơn giản: không tìm được ${pname} tốt. Vậy thì mình tự làm.`}

Hành trình không phải lúc nào cũng suôn sẻ. Nhưng điều khiến mình tiếp tục là ${pname} này thật sự giúp được người dùng.

📍 ${bname} — Bán hàng bằng sự thật
${ht}`,
    },
  };

  const typeTemplates = TEMPLATES[contentType];
  if (!typeTemplates) return `❌ Loại content "${contentType}" chưa được hỗ trợ.\nDùng: caption | tiktok_script | ad_copy | reply | promo | story`;

  const fn = typeTemplates[tone] || typeTemplates.friendly || Object.values(typeTemplates)[0];
  if (!fn) return `❌ Giọng điệu "${tone}" chưa có template cho loại "${contentType}".`;

  return fn();
}

// ============================================================
// CRM SUMMARY (mock data — replace with real API call)
// ============================================================
function getCRMSummary() {
  return `📊 CRM Summary — SmartMkt AI

👥 Tổng khách hàng: 127
🟢 Khách active (30 ngày): 43
💰 Doanh thu tuần này: 8,450,000 đ
📦 Đơn hàng đang xử lý: 7
⭐ Rating trung bình: 4.8/5

🔝 Top khách hàng:
1. Nguyễn Thị Mai — 5 đơn — 2,100,000 đ
2. Trần Văn Hùng — 4 đơn — 1,800,000 đ
3. Lê Thị Lan — 3 đơn — 950,000 đ

💡 Gợi ý: Gửi promo cho 12 khách chưa mua trong 60 ngày.`;
}

// ============================================================
// PLAN INFO
// ============================================================
function getPlanInfo() {
  return `🔥 SmartMkt AI — Gói của bạn

📦 Gói: Flame (149,000 đ/tháng)
📅 Hết hạn: 18/04/2026
✅ Còn lại: 29 ngày

Giới hạn:
• Content/tháng: 150 (đã dùng: 67)
• Khách hàng CRM: 500 (đang dùng: 127)
• Kênh quảng cáo: TikTok + Facebook

💎 Upgrade lên Blaze Pro để:
→ Không giới hạn content
→ Instagram + Zalo Ads
→ Analytics nâng cao

/smartmkt upgrade để xem gói mới`;
}

// ============================================================
// ARG PARSER
// ============================================================
function parseArgs(rawArgs) {
  // rawArgs: "content trà sữa --type tiktok_script --tone casual --story câu chuyện"
  const args = rawArgs.trim().split(/\s+/);
  const cmd = args[0] || 'help';

  const opts = { type: 'caption', tone: 'friendly', story: '', platform: 'default' };
  const positionals = [];

  let i = 1;
  while (i < args.length) {
    const a = args[i];
    if (a === '--type' && args[i + 1]) { opts.type = args[++i]; }
    else if (a === '--tone' && args[i + 1]) { opts.tone = args[++i]; }
    else if (a === '--platform' && args[i + 1]) { opts.platform = args[++i]; }
    else if (a === '--story' && args[i + 1]) {
      // Collect everything after --story until next --flag
      const storyParts = [];
      i++;
      while (i < args.length && !args[i].startsWith('--')) {
        storyParts.push(args[i]);
        i++;
      }
      opts.story = storyParts.join(' ');
      continue;
    }
    else if (a === '--brand' && args[i + 1]) { opts.brand = args[++i]; }
    else if (!a.startsWith('--')) { positionals.push(a); }
    i++;
  }

  return { cmd, positionals, opts };
}

// ============================================================
// MAIN
// ============================================================

// Self-test mode: node tool.js selftest
if (process.argv[2] === 'selftest') {
  console.log('--- SmartMkt AI OpenClaw Tool: Self Test ---\n');

  const { formatContent } = require('./formatters');

  const testCases = [
    { brand: 'Trà Sữa Nhà Làm', product: 'trà sữa mango', contentType: 'caption', tone: 'casual', story: 'mở shop vì con mình thích trà sữa nhà làm', platform: 'zalo' },
    { brand: 'Handcraft Nến', product: 'nến thơm lavender', contentType: 'tiktok_script', tone: 'friendly', story: '', platform: 'tiktok' },
    { brand: 'MyShop', product: 'áo thun', contentType: 'ad_copy', tone: 'professional', story: '', platform: 'facebook' },
  ];

  let passed = 0;
  for (const tc of testCases) {
    try {
      const raw = generateContent(tc);
      const formatted = formatContent(raw, tc.platform);
      if (formatted && formatted.length > 50) {
        console.log(`✅ ${tc.contentType}/${tc.tone} (${tc.platform}) — ${formatted.length} chars`);
        passed++;
      } else {
        console.log(`❌ ${tc.contentType}/${tc.tone} — output too short`);
      }
    } catch (e) {
      console.log(`❌ ${tc.contentType}/${tc.tone} — ERROR: ${e.message}`);
    }
  }

  console.log(`\n${passed}/${testCases.length} tests passed`);
  process.exit(passed === testCases.length ? 0 : 1);
}

// OpenClaw stdin invocation
let inputData = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', chunk => { inputData += chunk; });
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(inputData);
  } catch {
    process.stdout.write(formatError(new Error('Invalid JSON input from OpenClaw'), detectChannel()));
    process.exit(1);
  }

  const rawCommand = (input.command || '').trim();
  const channel = detectChannel();

  if (!rawCommand || rawCommand === 'help') {
    process.stdout.write(formatHelp(channel));
    process.exit(0);
  }

  const { cmd, positionals, opts } = parseArgs(rawCommand);

  try {
    let response = '';

    switch (cmd) {
      case 'content': {
        const product = positionals.join(' ');
        if (!product) {
          response = `❌ Thiếu tên sản phẩm.\nVí dụ: /smartmkt content trà sữa mango --tone casual`;
          break;
        }
        const raw = generateContent({
          brand: opts.brand || '',
          product,
          platform: opts.platform,
          contentType: opts.type,
          tone: opts.tone,
          story: opts.story,
        });
        response = `✅ ${opts.type.toUpperCase()} — giọng ${opts.tone}\n━━━━━━━━━━━━━━━━━\n${raw}`;
        break;
      }

      case 'crm':
        response = getCRMSummary();
        break;

      case 'plan':
        response = getPlanInfo();
        break;

      case 'help':
      default:
        process.stdout.write(formatHelp(channel));
        process.exit(0);
    }

    process.stdout.write(formatContent(response, channel));
    process.exit(0);
  } catch (err) {
    process.stdout.write(formatError(err, channel));
    process.exit(1);
  }
});
