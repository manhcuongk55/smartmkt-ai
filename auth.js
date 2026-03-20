// ============================================================
// SmartMkt AI — Auth & Subscription Manager
// ============================================================
// Lightweight authentication and subscription management.
// Uses localStorage for MVP — replace with real backend later.
//
// AuthManager API:
//   signup(data)          → Create new account
//   login(email)          → Check existing account
//   logout()              → Clear session
//   getCurrentUser()      → Get logged-in user
//   getPlan()             → Get current subscription plan
//   upgradePlan(plan)     → Change subscription
//   generateReferralCode()→ Generate unique referral code
//   applyReferral(code)   → Apply referral discount
//   getSubscribers()      → Get all subscribers (admin)
//   getRevenueMetrics()   → Calculate revenue stats
// ============================================================

const AuthManager = (function () {
  'use strict';

  const USERS_KEY = 'smartmkt_users';
  const SESSION_KEY = 'smartmkt_session';
  const REFERRALS_KEY = 'smartmkt_referrals';
  const PAYMENTS_KEY = 'smartmkt_payments';

  // ============================================================
  // PLANS CONFIG
  // ============================================================
  const PLANS = {
    free: {
      id: 'free',
      name: 'Miễn phí',
      price: 0,
      priceLabel: '0đ',
      period: '/tháng',
      color: '#94a3b8',
      features: ['5 bài content AI/tháng', 'Trend alert cơ bản', '1 kênh MXH'],
      limits: { contentPerMonth: 5, channels: 1, chatbot: false, ads: false },
    },
    flame: {
      id: 'flame',
      name: 'Flame',
      price: 499000,
      priceLabel: '499k',
      period: '/tháng',
      color: '#f59e0b',
      badge: 'Phổ biến nhất',
      features: ['30 bài content AI/tháng', 'Script TikTok không giới hạn', '3 kênh MXH', 'Chatbot cơ bản', 'Trend Intelligence'],
      limits: { contentPerMonth: 30, channels: 3, chatbot: true, ads: false },
    },
    blaze: {
      id: 'blaze',
      name: 'Blaze Pro',
      price: 1200000,
      priceLabel: '1.2M',
      period: '/tháng',
      color: '#8b5cf6',
      features: ['Content AI không giới hạn', 'AI Ads TikTok + FB + Zalo', 'Chatbot nâng cao + CRM', 'Auto upsell & cross-sell', 'Analytics & Reports', 'Ưu tiên support'],
      limits: { contentPerMonth: -1, channels: -1, chatbot: true, ads: true },
    },
    inferno: {
      id: 'inferno',
      name: 'Inferno Agency',
      price: 3000000,
      priceLabel: '3M',
      period: '/tháng',
      color: '#ef4444',
      badge: 'Agency',
      features: ['Tất cả Blaze Pro', 'White-label logo riêng', 'Quản lý đa shop', 'API access', 'Dedicated account manager', '30% reseller commission'],
      limits: { contentPerMonth: -1, channels: -1, chatbot: true, ads: true, whiteLabel: true },
    },
  };

  // ============================================================
  // PAYMENT METHODS
  // ============================================================
  const PAYMENT_METHODS = {
    momo: { id: 'momo', name: 'MoMo', icon: '💜', color: '#ae2070', qr: true },
    zalopay: { id: 'zalopay', name: 'ZaloPay', icon: '💙', color: '#008fe5', qr: true },
    bank: { id: 'bank', name: 'Chuyển khoản', icon: '🏦', color: '#10b981', qr: false },
    vnpay: { id: 'vnpay', name: 'VNPAY', icon: '🔴', color: '#ec1c24', qr: true },
  };

  // ============================================================
  // STORAGE HELPERS
  // ============================================================
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
    catch { return []; }
  }
  function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

  function getPayments() {
    try { return JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]'); }
    catch { return []; }
  }
  function savePayments(p) { localStorage.setItem(PAYMENTS_KEY, JSON.stringify(p)); }

  function getReferrals() {
    try { return JSON.parse(localStorage.getItem(REFERRALS_KEY) || '{}'); }
    catch { return {}; }
  }
  function saveReferrals(r) { localStorage.setItem(REFERRALS_KEY, JSON.stringify(r)); }

  // ============================================================
  // AUTH FUNCTIONS
  // ============================================================

  /**
   * Create new account
   * @param {{ shopName, email, phone, industry, plan, paymentMethod, referralCode }} data
   */
  function signup(data) {
    const users = getUsers();

    // Check duplicate email
    if (data.email && users.find(u => u.email === data.email)) {
      throw new Error('Email này đã được đăng ký. Vui lòng đăng nhập.');
    }

    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const referralCode = generateReferralCodeFor(data.shopName || data.email);

    const user = {
      id: userId,
      shopName: data.shopName || '',
      email: data.email || '',
      phone: data.phone || '',
      industry: data.industry || 'retail',
      plan: data.plan || 'free',
      referralCode: referralCode,
      referredBy: data.referralCode || null,
      createdAt: new Date().toISOString(),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
      status: 'active',
    };

    users.push(user);
    saveUsers(users);

    // Record payment if paid plan
    if (data.plan !== 'free' && PLANS[data.plan]) {
      recordPayment(userId, data.plan, data.paymentMethod || 'bank');
    }

    // Process referral
    if (data.referralCode) {
      processReferral(data.referralCode, userId);
    }

    // Set session
    setSession(userId);

    return user;
  }

  /**
   * Login by email
   */
  function login(email) {
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) throw new Error('Email không tìm thấy. Vui lòng đăng ký.');
    setSession(user.id);
    return user;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function setSession(userId) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      userId,
      loginAt: new Date().toISOString(),
    }));
  }

  function getCurrentUser() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (!session || !session.userId) return null;
      const users = getUsers();
      return users.find(u => u.id === session.userId) || null;
    } catch {
      return null;
    }
  }

  function isLoggedIn() {
    return getCurrentUser() !== null;
  }

  function getPlan() {
    const user = getCurrentUser();
    if (!user) return PLANS.free;
    return PLANS[user.plan] || PLANS.free;
  }

  function upgradePlan(planId) {
    const user = getCurrentUser();
    if (!user) throw new Error('Chưa đăng nhập.');
    if (!PLANS[planId]) throw new Error('Gói không hợp lệ.');

    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) throw new Error('User không tồn tại.');

    users[idx].plan = planId;
    users[idx].upgradedAt = new Date().toISOString();
    saveUsers(users);

    return users[idx];
  }

  // ============================================================
  // REFERRAL SYSTEM
  // ============================================================

  function generateReferralCodeFor(name) {
    const clean = (name || 'shop').replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
    const suffix = Math.random().toString(36).substr(2, 4).toUpperCase();
    return clean + suffix;
  }

  function processReferral(code, newUserId) {
    const users = getUsers();
    const referrer = users.find(u => u.referralCode === code);
    if (!referrer) return false;

    const referrals = getReferrals();
    if (!referrals[referrer.id]) {
      referrals[referrer.id] = { count: 0, users: [], rewards: 0 };
    }
    referrals[referrer.id].count++;
    referrals[referrer.id].users.push(newUserId);

    // Every 3 referrals = 1 month free (value of Flame plan)
    if (referrals[referrer.id].count % 3 === 0) {
      referrals[referrer.id].rewards++;
    }

    saveReferrals(referrals);
    return true;
  }

  function getReferralStats(userId) {
    const referrals = getReferrals();
    return referrals[userId] || { count: 0, users: [], rewards: 0 };
  }

  // ============================================================
  // PAYMENT TRACKING
  // ============================================================

  function recordPayment(userId, planId, method) {
    const payments = getPayments();
    payments.push({
      id: 'pay_' + Date.now(),
      userId,
      plan: planId,
      amount: PLANS[planId]?.price || 0,
      method,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });
    savePayments(payments);
  }

  // ============================================================
  // REVENUE METRICS (Admin)
  // ============================================================

  function getRevenueMetrics() {
    const users = getUsers();
    const payments = getPayments();

    const totalUsers = users.length;
    const paidUsers = users.filter(u => u.plan !== 'free');
    const mrr = paidUsers.reduce((sum, u) => sum + (PLANS[u.plan]?.price || 0), 0);
    const arr = mrr * 12;

    const planBreakdown = {};
    Object.keys(PLANS).forEach(p => {
      planBreakdown[p] = {
        ...PLANS[p],
        count: users.filter(u => u.plan === p).length,
        revenue: users.filter(u => u.plan === p).length * (PLANS[p]?.price || 0),
      };
    });

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const conversionRate = totalUsers > 0 ? ((paidUsers.length / totalUsers) * 100).toFixed(1) : 0;

    // Industry breakdown
    const industryBreakdown = {};
    users.forEach(u => {
      const ind = u.industry || 'other';
      if (!industryBreakdown[ind]) industryBreakdown[ind] = 0;
      industryBreakdown[ind]++;
    });

    // Referral stats
    const referrals = getReferrals();
    const totalReferrals = Object.values(referrals).reduce((s, r) => s + r.count, 0);

    return {
      totalUsers,
      paidUsers: paidUsers.length,
      mrr,
      arr,
      totalRevenue,
      conversionRate,
      planBreakdown,
      industryBreakdown,
      totalReferrals,
      churnRate: 0, // placeholder
      avgRevenuePerUser: paidUsers.length > 0 ? mrr / paidUsers.length : 0,
    };
  }

  function getSubscribers() {
    return getUsers().filter(u => u.plan !== 'free');
  }

  // ============================================================
  // SEED DEMO DATA
  // ============================================================
  function seedDemoUsers() {
    if (getUsers().length > 0) return;

    const demoUsers = [
      { id: 'demo_1', shopName: 'Shop Thời Trang Mây', email: 'may@shop.vn', phone: '0901234567', industry: 'fashion', plan: 'blaze', referralCode: 'MAY1A2B', referredBy: null, createdAt: '2026-01-15T08:00:00Z', status: 'active' },
      { id: 'demo_2', shopName: 'Quán Bún Bò Cô Tám', email: 'cotam@food.vn', phone: '0912345678', industry: 'fnb', plan: 'flame', referralCode: 'BUNBO3C', referredBy: 'MAY1A2B', createdAt: '2026-02-01T10:00:00Z', status: 'active' },
      { id: 'demo_3', shopName: 'Mỹ Phẩm Handmade Thảo', email: 'thao@beauty.vn', phone: '0923456789', industry: 'beauty', plan: 'flame', referralCode: 'THAO4D5', referredBy: 'MAY1A2B', createdAt: '2026-02-10T14:00:00Z', status: 'active' },
      { id: 'demo_4', shopName: 'Agency DigiMax', email: 'hello@digimax.vn', phone: '0281234567', industry: 'agency', plan: 'inferno', referralCode: 'DIGI6E7', referredBy: null, createdAt: '2026-01-20T09:00:00Z', status: 'active' },
      { id: 'demo_5', shopName: 'Tiệm Hoa Sài Gòn', email: 'hoa@saigon.vn', phone: '0934567890', industry: 'retail', plan: 'free', referralCode: 'HOASG8F', referredBy: 'DIGI6E7', createdAt: '2026-03-01T12:00:00Z', status: 'active' },
      { id: 'demo_6', shopName: 'Coffee & More', email: 'info@coffeemore.vn', phone: '0945678901', industry: 'fnb', plan: 'flame', referralCode: 'COFM9A1', referredBy: 'BUNBO3C', createdAt: '2026-02-20T11:00:00Z', status: 'active' },
      { id: 'demo_7', shopName: 'Tech Store VN', email: 'sales@techstore.vn', phone: '0956789012', industry: 'electronics', plan: 'blaze', referralCode: 'TECH2B3', referredBy: null, createdAt: '2026-01-28T15:00:00Z', status: 'active' },
      { id: 'demo_8', shopName: 'Fitness Hub', email: 'fit@hub.vn', phone: '0967890123', industry: 'health', plan: 'free', referralCode: 'FITH4C5', referredBy: 'TECH2B3', createdAt: '2026-03-05T09:00:00Z', status: 'active' },
      { id: 'demo_9', shopName: 'Baby Shop Miko', email: 'miko@babyshop.vn', phone: '0978901234', industry: 'baby', plan: 'flame', referralCode: 'MIKO6D7', referredBy: 'MAY1A2B', createdAt: '2026-02-15T16:00:00Z', status: 'active' },
      { id: 'demo_10', shopName: 'Nội Thất Hiện Đại', email: 'nt@modern.vn', phone: '0989012345', industry: 'furniture', plan: 'blaze', referralCode: 'NTHD8E9', referredBy: null, createdAt: '2026-02-05T13:00:00Z', status: 'active' },
      { id: 'demo_11', shopName: 'Bánh Mì Sài Gòn', email: 'banhmi@sg.vn', phone: '0990123456', industry: 'fnb', plan: 'free', referralCode: 'BMSG0F1', referredBy: 'COFM9A1', createdAt: '2026-03-10T08:00:00Z', status: 'active' },
      { id: 'demo_12', shopName: 'Pet Shop Lucky', email: 'lucky@petshop.vn', phone: '0911234567', industry: 'pets', plan: 'flame', referralCode: 'LUCK2G3', referredBy: 'DIGI6E7', createdAt: '2026-02-25T10:00:00Z', status: 'active' },
    ];

    saveUsers(demoUsers);

    // Seed payments
    const demoPayments = demoUsers.filter(u => u.plan !== 'free').map(u => ({
      id: 'pay_demo_' + u.id,
      userId: u.id,
      plan: u.plan,
      amount: PLANS[u.plan]?.price || 0,
      method: ['momo', 'zalopay', 'bank', 'vnpay'][Math.floor(Math.random() * 4)],
      status: 'completed',
      createdAt: u.createdAt,
    }));
    savePayments(demoPayments);

    // Seed referrals
    const demoReferrals = {
      'demo_1': { count: 3, users: ['demo_2', 'demo_3', 'demo_9'], rewards: 1 },
      'demo_4': { count: 2, users: ['demo_5', 'demo_12'], rewards: 0 },
      'demo_2': { count: 1, users: ['demo_6'], rewards: 0 },
      'demo_7': { count: 1, users: ['demo_8'], rewards: 0 },
      'demo_6': { count: 1, users: ['demo_11'], rewards: 0 },
    };
    saveReferrals(demoReferrals);
  }

  // Auto-seed
  seedDemoUsers();

  // ============================================================
  // EXPORTS
  // ============================================================
  return {
    PLANS,
    PAYMENT_METHODS,
    signup,
    login,
    logout,
    getCurrentUser,
    isLoggedIn,
    getPlan,
    upgradePlan,
    getReferralStats,
    getRevenueMetrics,
    getSubscribers,
    recordPayment,
    getUsers,
  };
})();

window.AuthManager = AuthManager;
