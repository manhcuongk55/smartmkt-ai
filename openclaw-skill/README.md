# SmartMkt AI — OpenClaw Skill

Skill này cho phép OpenClaw agent truy cập SmartMkt AI để tạo content thật và quản lý CRM ngay trên Zalo, Telegram, WhatsApp, và 20+ kênh khác.

**Triết lý:** Content thật → Người thật → Sản phẩm thật → Niềm tin thật 🔥

---

## Cài đặt

### Bước 1: Cài OpenClaw

```bash
npx -y openclaw onboard
```

### Bước 2: Copy skill vào workspace OpenClaw

```bash
# Mặc định OpenClaw skill workspace
cp -r ./openclaw-skill ~/.openclaw/skills/smartmkt
```

Hoặc thêm vào `~/.openclaw/openclaw.json`:

```json
{
  "skills": {
    "dirs": ["/path/to/smartmkt-ai/openclaw-skill"]
  }
}
```

### Bước 3: Khởi động SmartMkt API (optional)

Nếu muốn agent dùng REST API thay vì invoke tool.js trực tiếp:

```bash
node smartmkt-api.js
# API chạy tại http://127.0.0.1:3791
```

Set env var:
```bash
export SMARTMKT_API_URL=http://127.0.0.1:3791
```

### Bước 4: Kết nối kênh Zalo (Vietnam)

```bash
openclaw channel add zalo
# Làm theo hướng dẫn: https://docs.openclaw.ai/channels/zalo
```

---

## Cách dùng

Sau khi cài xong, nhắn từ Zalo/Telegram/WhatsApp:

```
/smartmkt content trà sữa mango
```

```
/smartmkt content nước hoa handmade --type tiktok_script --tone casual
```

```
/smartmkt content áo thun --story "mình tự chọn vải cho từng cái vì mình bị dị ứng"
```

```
/smartmkt crm
```

```
/smartmkt plan
```

---

## Tích hợp nâng cao

### Multi-agent routing (cho nhiều shop)

Trong `~/.openclaw/openclaw.json`:

```json
{
  "agents": {
    "shop-tra-sua": {
      "workspace": "~/.openclaw/workspaces/tra-sua",
      "skills": ["smartmkt"],
      "channels": ["zalo-personal"]
    },
    "shop-fashion": {
      "workspace": "~/.openclaw/workspaces/fashion",
      "skills": ["smartmkt"],
      "channels": ["telegram"]
    }
  }
}
```

### Kết nối ERPNext (nếu có backend)

Cập nhật `tool.js` — thay hàm `getCRMSummary()` bằng call thật đến ERPNext API:

```javascript
// Thay thế mock data trong tool.js:
const { ERPNextAPI } = require('../erpnext-api');
async function getCRMSummary() {
  const api = new ERPNextAPI({ url: process.env.ERPNEXT_URL, token: process.env.ERPNEXT_TOKEN });
  return await api.getCustomerSummary();
}
```

---

## Channels được hỗ trợ

| Kênh | Ưu tiên | Ghi chú |
|---|---|---|
| 🟢 **Zalo** | Cao nhất | Phổ biến nhất cho SME Việt Nam |
| 🟢 **Zalo Personal** | Cao | Tài khoản cá nhân |
| 🟡 Telegram | Cao | Tốt cho tech-savvy seller |
| 🟡 WhatsApp | Trung bình | Phù hợp xuất khẩu |
| 🟡 Facebook Messenger | Trung bình | Via webchat bridge |
| 🔵 Discord | Thấp | Communities |

---

## Cấu trúc file

```
openclaw-skill/
├── SKILL.md          # Skill definition (OpenClaw reads this)
├── tool.js           # Main dispatcher (content engine + CRM + plan)
├── formatters.js     # Channel-aware output formatting
└── README.md         # This file

smartmkt-api.js       # Local REST API bridge (port 3791)
```

---

## Self-test

```bash
node openclaw-skill/tool.js selftest
```

Expected output:
```
--- SmartMkt AI OpenClaw Tool: Self Test ---
✅ caption/casual (zalo) — 412 chars
✅ tiktok_script/friendly (tiktok) — 528 chars
✅ ad_copy/professional (facebook) — 381 chars

3/3 tests passed
```

---

## License

MIT — Free to use, fork, and extend.
