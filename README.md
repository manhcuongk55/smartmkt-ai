# ✦ SmartMkt AI — AI Marketing cho SME Việt Nam

> **AI Marketing Co-Pilot** dành riêng cho 5.9 triệu SME và hộ kinh doanh Việt Nam.  
> Tự động tạo content, chạy ads, chăm sóc khách hàng — không cần team marketing.

🔗 **Live Demo**: [smartmkt-ai.vercel.app](https://smartmkt-ai.vercel.app)

---

## 🚀 Giới thiệu

SmartMkt AI là landing page cho nền tảng AI marketing tự động hóa dành cho SME và hộ kinh doanh nhỏ tại Việt Nam. Thị trường mục tiêu:
- ~900.000 doanh nghiệp SME
- ~5.000.000 hộ kinh doanh

**3 trụ cột sản phẩm:**
| Pillar | Mô tả |
|---|---|
| 🎨 AI Content Studio | Tạo 30 ngày content, script TikTok, banner tự động |
| 🎯 AI Ads Engine | Setup & optimize TikTok Ads / Facebook Ads / Zalo Ads tự động |
| 💬 AI Customer Care | Chatbot 24/7, auto-CRM, upsell thông minh |

---

## 🛠️ Tech Stack

Dự án này là **static landing page** thuần HTML/CSS/JS — không cần framework, không cần build step.

```
index.html   — Cấu trúc trang
style.css    — Toàn bộ styling (dark theme, glassmorphism, animations)
app.js       — Interactivity (scroll effects, typing animation, chart animation)
```

**Design system:**
- Dark theme: `#080b14` background
- Gradient accent: Purple → Blue → Cyan
- Font: `Be Vietnam Pro` (Vietnamese-optimized) + `Inter`
- Animations: CSS keyframes + Intersection Observer API

---

## 🖥️ Chạy local

```bash
# Clone repo
git clone https://github.com/manhcuongk55/smartmkt-ai.git
cd smartmkt-ai

# Mở trực tiếp — không cần install, không cần build
open index.html

# Hoặc dùng live-server (hot reload)
npx live-server
```

---

## 🚢 Deploy

### Vercel (recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy lên production
vercel deploy --yes

# Kết quả: URL dạng https://smartmkt-ai.vercel.app
```

### GitHub Pages
1. Push code lên GitHub
2. Settings → Pages → Source: `main` branch / `root`
3. Site sẽ live tại `https://<username>.github.io/smartmkt-ai`

### Netlify
Drag & drop thư mục project vào [app.netlify.com/drop](https://app.netlify.com/drop) — xong ngay.

---

## 📁 Cấu trúc dự án

```
smartmkt-ai/
├── index.html          # Main page (Hero, Features, Pricing, CTA, Footer)
├── style.css           # All styles — CSS variables, animations, responsive
├── app.js              # JS interactions — scroll, typing, counters, chart
└── README.md           # This file
```

---

## 🎨 Customization Guide

### Thay đổi màu sắc
Tìm `:root` trong `style.css`:
```css
:root {
  --accent-purple: #8b5cf6;   /* Màu chính */
  --accent-blue: #3b82f6;     /* Màu phụ */
  --bg-primary: #080b14;      /* Background tối */
}
```

### Cập nhật nội dung
Mọi nội dung (text, pricing, testimonials) đều nằm trong `index.html` — tìm và sửa trực tiếp.

### Thêm kênh mạng xã hội
Thêm vào `.platform-logos` trong `index.html`:
```html
<div class="platform-item">
  <div class="plat-icon"><!-- Icon SVG --></div>
  <span>Tên nền tảng</span>
</div>
```

### Thay đổi giá
Tìm section `#pricing` trong `index.html`, cập nhật `.price-num`.

---

## 🗺️ Roadmap sản phẩm thật

Landing page này là bước đầu. Roadmap đầy đủ:

```
v1 (Hiện tại) → Landing page + waitlist
v2 (Q2 2026)  → MVP Content Studio (AI tạo content từ thông tin shop)
v3 (Q3 2026)  → AI Chatbot tích hợp Zalo OA + Facebook Messenger
v4 (Q4 2026)  → AI Ads Engine (TikTok Ads + Facebook Ads)
v5 (2027)     → Full platform + AI Analytics Dashboard
```

---

## 🤝 Đóng góp

Pull requests welcome! Một số ý tưởng cần làm:

- [ ] Thêm form đăng ký waitlist (tích hợp Formspree hoặc Supabase)
- [ ] Animation cho phần "Cách hoạt động"
- [ ] Video demo nhúng thẳng vào trang
- [ ] Dark/Light mode toggle
- [ ] Trang `/blog` với case study thật
- [ ] Tích hợp Zalo OA widget
- [ ] A/B test cho hero CTA (VD: "Dùng thử miễn phí" vs "Tăng doanh thu ngay")

### Quy trình đóng góp
```bash
# Fork repo về
git fork https://github.com/manhcuongk55/smartmkt-ai

# Tạo branch mới
git checkout -b feature/ten-tinh-nang

# Commit changes
git commit -m "feat: mô tả thay đổi"

# Push và tạo Pull Request
git push origin feature/ten-tinh-nang
```

---

## 📊 Performance

Trang được tối ưu cho tốc độ tải:
- **0 dependencies** — không cần npm install
- **Pure CSS animations** — không dùng JS animation library
- **Google Fonts** preconnect để giảm FOIT
- **Lazy intersection observer** — animation chỉ chạy khi vào viewport

---

## 📄 License

MIT License — sử dụng tự do cho mục đích cá nhân và thương mại.

---

<div align="center">

**✦ SmartMkt AI** — Built with ❤️ for Vietnam SMEs 🇻🇳

[Live Demo](https://smartmkt-ai.vercel.app) · [Report Bug](https://github.com/manhcuongk55/smartmkt-ai/issues) · [Request Feature](https://github.com/manhcuongk55/smartmkt-ai/issues)

</div>
