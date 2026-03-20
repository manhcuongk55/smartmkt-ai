#!/usr/bin/env node
/**
 * SmartMkt AI — Local REST API Bridge
 * ============================================================
 * Runs as a local HTTP server on port 3791.
 * Exposes SmartMkt content generation, CRM, and plan endpoints.
 * Used by the OpenClaw tool.js for API-based integrations.
 * 
 * Start: node smartmkt-api.js
 * 
 * Endpoints:
 *   POST /api/content        — Generate content
 *   GET  /api/crm/summary    — CRM summary
 *   GET  /api/plan           — Subscription plan info
 *   GET  /api/health         — Health check
 *   GET  /api/channels       — Supported channels list
 * ============================================================
 */

'use strict';

const http = require('http');

const PORT = process.env.SMARTMKT_API_PORT || 3791;
const HOST = '127.0.0.1'; // local only — never expose externally

// ============================================================
// CONTENT ENGINE (same logic as openclaw-skill/tool.js)
// ============================================================
const HASHTAG_POOLS = {
  tiktok:   ['#tiktokvietnam', '#fyp', '#viral', '#xuhuong', '#muahàngvn', '#trending'],
  facebook: ['#shopvn', '#muahangtot', '#khuyenmai', '#freeship', '#hàngthật'],
  zalo:     [],
  default:  ['#shopvn', '#muahàngthật', '#niềmtin', '#sảnphẩmthật'],
};
const EMOJIS = {
  friendly:     ['😊', '❤️', '🎉', '✨', '💕', '🌸'],
  professional: ['📌', '✅', '🔹', '📊', '💡', '⭐'],
  funny:        ['😂', '🤣', '💀', '🔥', '😎', '👀'],
  urgent:       ['🔥', '⚡', '🚨', '❗', '💥', '⏰'],
  luxury:       ['✨', '💎', '🥂', '🌟', '👑', '🌹'],
  casual:       ['🤙', '💪', '🎯', '😍', '🙌', '🫶'],
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

function generateContent({ brand = '', product = 'sản phẩm', platform = 'default', contentType = 'caption', tone = 'friendly', story = '' }) {
  const bname = brand || 'Shop của bạn';
  const ht = hashtags(platform);
  const e = () => emoji(tone);

  const templates = {
    caption: {
      friendly: () => `${e()} ${story ? `Câu chuyện thật về ${bname}:` : `${bname} — không phải quảng cáo, đây là sự thật:`}

${story ? `"${story}"` : `${product} được làm bởi người thật, cho người thật cần.`}

Mình bán ${product} vì mình tin vào nó ${e()}

• Người tìm sản phẩm chất lượng thật
• Người muốn mua từ người bán có tâm  
• Người không muốn bị lừa bởi quảng cáo phô

Nhắn hỏi bất cứ điều gì — mình trả lời thật 100%

📍 ${bname}
${ht}`,

      professional: () => `${bname} — ${product}

${story ? `"${story}"` : `Giải quyết đúng vấn đề thật của khách hàng.`}

▸ Kiểm tra kỹ trước khi ship
▸ Người bán có trách nhiệm
▸ Phản hồi trong 2 giờ  
▸ Đổi trả minh bạch

Chúng tôi chỉ hứa điều chúng tôi đang làm.
${ht}`,

      funny: () => `${e()} Thật ra hả?

Mình bán ${product} vì ${story || `không thấy ai bán tử tế`}.

✓ Đã dùng/kiểm tra trước
✓ Không ưng → hoàn tiền
✓ Reply trong 30 phút

DM đi! ${e()}
${ht}`,

      casual: () => `Thật ra là thế này 🤙

${story ? `"${story}"` : `Mình bán ${product} vì thị trường toàn hàng fake.`}

Shop: ${bname} | Hàng: thật | Người bán: thật
DM để biết thêm 🫶
${ht}`,
    },

    tiktok_script: {
      friendly: () => `🎬 SCRIPT TIKTOK — ${product.toUpperCase()}

[HOOK] "Mình bán ${product} không phải vì muốn giàu nhanh — mà vì..."

[THÂN]
${story ? `"${story}"` : `[Kể lý do bạn bắt đầu ${bname}]`}
[Quay cảnh thực tế]

[PHẦN THẬT]
"Giá? Chất lượng? Có thất vọng không? → [Trả lời thật]"

[CTA] "Cần ${product} từ người có tâm — link bio."
${ht} #câuchuyệnthật`,
    },

    ad_copy: {
      professional: () => `${bname} | ${product}

${story ? `"${story}"` : `Giải quyết vấn đề mà thị trường chưa giải quyết được.`}

Dành cho người tìm ${product} với:
→ Chất lượng nhất quán
→ Người bán có trách nhiệm
→ Giá minh bạch

Không phù hợp nếu chỉ tìm hàng rẻ nhất.
Phù hợp nếu muốn đúng như mô tả.

→ ${bname}
${ht}`,

      friendly: () => `📢 QUẢNG CÁO THẬT — ${bname}

"${story || `Chúng tôi tạo ra ${product} vì đã từng là người mua.`}"

✗ Không "đổi đời 7 ngày"
✗ Không review fake

✓ ${product} kiểm tra trực tiếp
✓ Inbox trong 2 giờ
✓ Đổi trả nếu không đúng mô tả
${ht}`,
    },

    reply: {
      friendly: () => `Dạ ${e()} cảm ơn đã hỏi!

${product} — sự thật:
• [Điểm mạnh thật]
• [Điểm cần lưu ý]
• Giá: [Giá thật]

Mình giúp bạn quyết định đúng — không chốt đơn bằng mọi giá ${e()}
📍 ${bname}`,
    },

    promo: {
      friendly: () => `${e()} Ưu đãi thật — không chiêu trò

${story ? `${bname}: "${story.substring(0, 80)}"` : `${bname} — ${product} cam kết thật.`}

📣 Lý do ưu đãi thật:
[Giải thích thật: nhập hàng về nhiều / muốn khách dùng thử / kỷ niệm shop...]

→ [Mô tả ưu đãi cụ thể]
→ Hết hạn: [Ngày cụ thể]

Không vội. Nếu chưa cần — lưu cho lần sau.
${ht}`,
    },

    story: {
      friendly: () => `📖 Câu chuyện thật của ${bname}

${story ? `"${story}"` : `Mình bắt đầu từ một vấn đề: không tìm được ${product} tốt. Vậy thì mình tự làm.`}

Không phải mọi người đều cần ${product}.
Nhưng người nào cần — mình muốn họ tìm được cái đúng.

📍 ${bname} — Bán hàng bằng sự thật
${ht}`,
    },
  };

  const typeTemplates = templates[contentType];
  if (!typeTemplates) {
    throw new Error(`Loại content "${contentType}" không hỗ trợ. Dùng: caption | tiktok_script | ad_copy | reply | promo | story`);
  }
  const fn = typeTemplates[tone] || typeTemplates.friendly || Object.values(typeTemplates)[0];
  return fn();
}

// ============================================================
// HTTP SERVER
// ============================================================
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function send(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': 'http://127.0.0.1:8765', // live-server
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { send(res, 204, {}); return; }

  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const pathname = url.pathname;

  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  try {
    // ── GET /api/health ──────────────────────────────────────
    if (req.method === 'GET' && pathname === '/api/health') {
      send(res, 200, {
        status: 'ok',
        service: 'SmartMkt AI Local API',
        version: '1.0.0',
        philosophy: 'Content thật → Người thật → Sản phẩm thật → Niềm tin thật',
        channels: ['zalo', 'telegram', 'whatsapp', 'discord', 'slack', 'facebook'],
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // ── POST /api/content ────────────────────────────────────
    if (req.method === 'POST' && pathname === '/api/content') {
      const body = await parseBody(req);
      const { brand, product, platform, contentType, tone, story } = body;

      if (!product) {
        send(res, 400, { error: 'Missing required field: product' });
        return;
      }

      const content = generateContent({
        brand: brand || '',
        product,
        platform: platform || 'default',
        contentType: contentType || 'caption',
        tone: tone || 'friendly',
        story: story || '',
      });

      send(res, 200, {
        content,
        meta: { contentType: contentType || 'caption', tone: tone || 'friendly', platform: platform || 'default' },
        generatedAt: new Date().toISOString(),
      });
      return;
    }

    // ── GET /api/crm/summary ─────────────────────────────────
    if (req.method === 'GET' && pathname === '/api/crm/summary') {
      // In production: read from localStorage sync or ERPNext API
      send(res, 200, {
        totalCustomers: 127,
        activeCustomers: 43,
        weeklyRevenue: 8450000,
        pendingOrders: 7,
        averageRating: 4.8,
        topCustomers: [
          { name: 'Nguyễn Thị Mai', orders: 5, revenue: 2100000 },
          { name: 'Trần Văn Hùng', orders: 4, revenue: 1800000 },
          { name: 'Lê Thị Lan', orders: 3, revenue: 950000 },
        ],
        insight: 'Gửi promo cho 12 khách chưa mua trong 60 ngày.',
        asOf: new Date().toISOString(),
      });
      return;
    }

    // ── GET /api/plan ────────────────────────────────────────
    if (req.method === 'GET' && pathname === '/api/plan') {
      send(res, 200, {
        plan: 'Flame',
        price: 149000,
        currency: 'VND',
        billingCycle: 'monthly',
        expiresAt: '2026-04-18',
        daysRemaining: 29,
        usage: {
          content: { used: 67, limit: 150 },
          customers: { used: 127, limit: 500 },
          channels: ['TikTok', 'Facebook'],
        },
        upgrade: {
          nextPlan: 'Blaze Pro',
          price: 399000,
          benefits: ['Không giới hạn content', 'Instagram + Zalo Ads', 'Analytics nâng cao'],
        },
      });
      return;
    }

    // ── GET /api/channels ────────────────────────────────────
    if (req.method === 'GET' && pathname === '/api/channels') {
      send(res, 200, {
        channels: [
          { id: 'zalo', name: 'Zalo', desc: 'Kênh chính của SME Việt Nam', supported: true },
          { id: 'telegram', name: 'Telegram', desc: 'Dành cho tech-savvy seller', supported: true },
          { id: 'whatsapp', name: 'WhatsApp', desc: 'Quốc tế', supported: true },
          { id: 'facebook', name: 'Facebook Messenger', desc: 'Phổ biến nhất VN', supported: true },
          { id: 'discord', name: 'Discord', desc: 'Communities', supported: true },
          { id: 'tiktok', name: 'TikTok', desc: 'Short-form content', supported: true },
        ],
      });
      return;
    }

    // ── 404 ──────────────────────────────────────────────────
    send(res, 404, { error: `Route not found: ${pathname}` });
  } catch (err) {
    console.error('[ERROR]', err.message);
    send(res, 500, { error: err.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n🔥 SmartMkt AI Local API — Running on http://${HOST}:${PORT}`);
  console.log(`\n   GET  http://${HOST}:${PORT}/api/health`);
  console.log(`   POST http://${HOST}:${PORT}/api/content`);
  console.log(`   GET  http://${HOST}:${PORT}/api/crm/summary`);
  console.log(`   GET  http://${HOST}:${PORT}/api/plan`);
  console.log(`\n   Philosophy: Content thật → Người thật → Sản phẩm thật → Niềm tin thật\n`);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use. Kill the existing process or set SMARTMKT_API_PORT env var.\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
