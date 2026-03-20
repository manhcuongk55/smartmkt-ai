/**
 * SmartMkt AI — OpenClaw Channel Formatters
 * Adapts AI output for different messaging platforms.
 * Zalo: plain text, 2000 char limit per message
 * Telegram: MarkdownV2, 4096 char limit
 * WhatsApp: *bold*, _italic_, no heading support
 * Discord: **bold**, `code`, 2000 char limit
 */

'use strict';

// Max lengths per platform
const LIMITS = {
  zalo: 2000,
  'zalo-personal': 2000,
  telegram: 4096,
  whatsapp: 4096,
  discord: 2000,
  slack: 4000,
  default: 3000,
};

// Detect channel from OpenClaw environment
function detectChannel() {
  // OpenClaw sets OPENCLAW_CHANNEL env var in agent runtime
  const ch = (process.env.OPENCLAW_CHANNEL || '').toLowerCase();
  if (ch.includes('telegram')) return 'telegram';
  if (ch.includes('zalo')) return 'zalo';
  if (ch.includes('whatsapp')) return 'whatsapp';
  if (ch.includes('discord')) return 'discord';
  if (ch.includes('slack')) return 'slack';
  return 'default';
}

/**
 * Format a SmartMkt content block for the target channel.
 * @param {string} content - Raw generated content
 * @param {string} [channel] - Channel override (optional, auto-detected if omitted)
 * @returns {string} Formatted message ready to send
 */
function formatContent(content, channel) {
  const ch = channel || detectChannel();
  const limit = LIMITS[ch] || LIMITS.default;

  let formatted = content;

  switch (ch) {
    case 'telegram':
      // Telegram supports basic markdown — escape special chars for MarkdownV2
      formatted = content
        .replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1') // escape reserved chars
        .replace(/\\\\n/g, '\n'); // restore literal newlines
      break;

    case 'whatsapp':
      // WhatsApp: *bold* _italic_, headers become bold
      formatted = content
        .replace(/^#{1,3}\s+(.+)/gm, '*$1*') // headers → bold
        .replace(/▸/g, '›')                   // arrow substitute
        .replace(/━+/g, '---');               // divider
      break;

    case 'discord':
      // Discord: **bold**, __underline__, ```code blocks```
      formatted = content
        .replace(/^#{1,3}\s+(.+)/gm, '**$1**')
        .replace(/▸/g, '>')
        .replace(/━+/g, '─────────────────');
      break;

    case 'zalo':
    case 'zalo-personal':
    default:
      // Zalo: plain text only, no markdown
      formatted = content
        .replace(/[*_`~]/g, '')              // strip markdown symbols
        .replace(/^#{1,3}\s+/gm, '')         // remove header hashes
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // strip links
      break;
  }

  // Trim to limit
  if (formatted.length > limit) {
    formatted = formatted.slice(0, limit - 120);
    formatted += ch === 'telegram'
      ? '\n\n\\.\\.\\. \\(content bị cắt do giới hạn ký tự\\)'
      : '\n\n... (content bị cắt do giới hạn ký tự)';
  }

  return formatted;
}

/**
 * Format an error message cleanly for the channel.
 */
function formatError(err, channel) {
  const ch = channel || detectChannel();
  const msg = `⚠️ SmartMkt AI lỗi: ${err.message || err}`;
  return ch === 'telegram'
    ? msg.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1')
    : msg;
}

/**
 * Format a help message listing all commands.
 */
function formatHelp(channel) {
  const ch = channel || detectChannel();

  const helpText = `🔥 SmartMkt AI — Lệnh có sẵn:

/smartmkt content <sản phẩm>
  → Tạo caption authentic cho sản phẩm
  → Tùy chọn: --type caption|tiktok_script|ad_copy|reply|promo|story
  → Tùy chọn: --tone friendly|professional|funny|urgent|luxury|casual
  → Tùy chọn: --story "câu chuyện thật của shop"

/smartmkt crm
  → Xem tóm tắt khách hàng & đơn hàng

/smartmkt plan
  → Xem thông tin gói subscription

/smartmkt help
  → Xem danh sách này

Ví dụ:
/smartmkt content trà sữa --tone casual --story "mình mở shop vì con mình thích trà sữa nhà làm"`;

  return formatContent(helpText, ch);
}

module.exports = { formatContent, formatError, formatHelp, detectChannel };
