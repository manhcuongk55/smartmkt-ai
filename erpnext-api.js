// ============================================================
// SmartMkt AI — ERPNext API Client
// ============================================================
// Production-grade Frappe/ERPNext REST API integration layer
// Supports: Token auth, CRUD operations, doctype mapping,
//           connection management, and localStorage fallback
// ============================================================

const ERPNextAPI = (function () {
  'use strict';

  // ============================================================
  // CONFIG MANAGEMENT
  // ============================================================
  const CONFIG_KEY = 'smartmkt_erpnext_config';
  const MODE_KEY = 'smartmkt_api_mode'; // 'erpnext' | 'local'

  /**
   * Get saved ERPNext config from localStorage
   * @returns {{ baseUrl: string, apiKey: string, apiSecret: string } | null}
   */
  function getConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Save ERPNext config to localStorage
   * @param {Object} config - { baseUrl, apiKey, apiSecret }
   */
  function saveConfig(config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      baseUrl: (config.baseUrl || '').replace(/\/+$/, ''),
      apiKey: config.apiKey || '',
      apiSecret: config.apiSecret || '',
    }));
  }

  /**
   * Clear saved config
   */
  function clearConfig() {
    localStorage.removeItem(CONFIG_KEY);
  }

  /**
   * Get current API mode
   * @returns {'erpnext' | 'local'}
   */
  function getMode() {
    return localStorage.getItem(MODE_KEY) || 'local';
  }

  /**
   * Set API mode
   * @param {'erpnext' | 'local'} mode
   */
  function setMode(mode) {
    localStorage.setItem(MODE_KEY, mode);
  }

  /**
   * Check if ERPNext mode is active and configured
   * @returns {boolean}
   */
  function isERPNextActive() {
    if (getMode() !== 'erpnext') return false;
    const config = getConfig();
    return !!(config && config.baseUrl && config.apiKey && config.apiSecret);
  }

  // ============================================================
  // HTTP CLIENT
  // ============================================================

  /**
   * Make authenticated request to ERPNext
   * @param {string} endpoint - API endpoint (e.g. /api/resource/Campaign)
   * @param {Object} options - fetch options
   * @returns {Promise<Object>}
   */
  async function request(endpoint, options = {}) {
    const config = getConfig();
    if (!config || !config.baseUrl) {
      throw new Error('ERPNext chưa được cấu hình. Vào Settings để thiết lập.');
    }

    const url = config.baseUrl + endpoint;
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `token ${config.apiKey}:${config.apiSecret}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        mode: 'cors',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.exc_type || errorData.message || errorData._server_messages || `HTTP ${response.status}`;
        throw new Error(`ERPNext Error: ${msg}`);
      }

      return await response.json();
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Không thể kết nối ERPNext. Kiểm tra URL và CORS settings.');
      }
      throw err;
    }
  }

  // ============================================================
  // CONNECTION TEST
  // ============================================================

  /**
   * Test connection to ERPNext instance
   * @param {Object} config - { baseUrl, apiKey, apiSecret }
   * @returns {Promise<{ success: boolean, user: string, message: string }>}
   */
  async function testConnection(config) {
    const prevConfig = getConfig();
    try {
      saveConfig(config);
      const res = await request('/api/method/frappe.auth.get_logged_user');
      return {
        success: true,
        user: res.message || 'Unknown',
        message: `Kết nối thành công! User: ${res.message}`,
      };
    } catch (err) {
      // Restore previous config if test fails
      if (prevConfig) saveConfig(prevConfig);
      else clearConfig();
      return {
        success: false,
        user: '',
        message: err.message,
      };
    }
  }

  // ============================================================
  // DOCTYPE FIELD MAPPING
  // ============================================================
  // SmartMkt AI field → ERPNext Campaign doctype field
  //
  // Standard ERPNext Campaign fields:
  //   campaign_name, status (Planned/In Progress/Completed/Cancelled),
  //   from_date, to_date, budget, description, naming_series
  //
  // Custom fields (need to be added in ERPNext Customize Form):
  //   custom_platform (Select: TikTok/Facebook/Zalo OA/Instagram/Multi)
  //   custom_campaign_type (Select: Content AI/Chạy Ads/Chatbot/Full Package)
  //   custom_smartmkt_id (Data: SmartMkt internal ID)

  const DOCTYPE = 'Campaign';

  const STATUS_MAP_TO_ERP = {
    active: 'In Progress',
    draft: 'Planned',
    completed: 'Completed',
  };

  const STATUS_MAP_FROM_ERP = {
    'Planned': 'draft',
    'In Progress': 'active',
    'Completed': 'completed',
    'Cancelled': 'completed',
  };

  const PLATFORM_LABELS = {
    tiktok: 'TikTok',
    facebook: 'Facebook',
    zalo: 'Zalo OA',
    instagram: 'Instagram',
    multi: 'Đa kênh',
  };

  const TYPE_LABELS = {
    content: 'Content AI',
    ads: 'Chạy Ads',
    chatbot: 'Chatbot',
    full: 'Full Package',
  };

  /**
   * Convert SmartMkt campaign → ERPNext doc
   */
  function toERPNext(campaign) {
    const doc = {
      campaign_name: campaign.name,
      status: STATUS_MAP_TO_ERP[campaign.status] || 'Planned',
      description: campaign.description || '',
    };

    if (campaign.budget) doc.budget = campaign.budget;
    if (campaign.startDate) doc.from_date = campaign.startDate;
    if (campaign.endDate) doc.to_date = campaign.endDate;

    // Custom fields (won't error if they don't exist — ERPNext ignores unknown)
    if (campaign.platform) doc.custom_platform = PLATFORM_LABELS[campaign.platform] || campaign.platform;
    if (campaign.type) doc.custom_campaign_type = TYPE_LABELS[campaign.type] || campaign.type;

    return doc;
  }

  /**
   * Convert ERPNext doc → SmartMkt campaign
   */
  function fromERPNext(doc) {
    // Reverse lookup for platform
    const platformKey = Object.keys(PLATFORM_LABELS).find(
      k => PLATFORM_LABELS[k] === doc.custom_platform
    ) || doc.custom_platform || 'multi';

    // Reverse lookup for type
    const typeKey = Object.keys(TYPE_LABELS).find(
      k => TYPE_LABELS[k] === doc.custom_campaign_type
    ) || doc.custom_campaign_type || 'content';

    return {
      id: doc.name, // ERPNext uses 'name' as primary key
      name: doc.campaign_name || doc.name,
      platform: platformKey,
      type: typeKey,
      budget: doc.budget || 0,
      status: STATUS_MAP_FROM_ERP[doc.status] || 'draft',
      description: doc.description || '',
      startDate: doc.from_date || '',
      endDate: doc.to_date || '',
      createdAt: doc.creation || '',
      updatedAt: doc.modified || '',
      _erpnext: true, // flag to identify ERPNext-sourced data
    };
  }

  // ============================================================
  // CRUD OPERATIONS (ERPNext)
  // ============================================================

  const erpnextCRUD = {
    /**
     * READ ALL — GET /api/resource/Campaign
     */
    async getAll() {
      const res = await request(`/api/resource/${DOCTYPE}`, {
        method: 'GET',
      });

      // Fetch full details for each campaign
      // ERPNext list endpoint returns minimal fields by default
      const names = (res.data || []).map(d => d.name);
      const campaigns = [];

      // Batch fetch with fields parameter for efficiency
      const listRes = await request(
        `/api/resource/${DOCTYPE}?fields=["name","campaign_name","status","description","budget","from_date","to_date","custom_platform","custom_campaign_type","creation","modified"]&order_by=modified desc&limit_page_length=100`
      );

      for (const doc of (listRes.data || [])) {
        campaigns.push(fromERPNext(doc));
      }

      return campaigns;
    },

    /**
     * READ ONE — GET /api/resource/Campaign/:name
     */
    async getById(id) {
      const res = await request(`/api/resource/${DOCTYPE}/${encodeURIComponent(id)}`);
      return res.data ? fromERPNext(res.data) : null;
    },

    /**
     * CREATE — POST /api/resource/Campaign
     */
    async create(campaign) {
      const doc = toERPNext(campaign);
      const res = await request(`/api/resource/${DOCTYPE}`, {
        method: 'POST',
        body: JSON.stringify(doc),
      });
      return fromERPNext(res.data);
    },

    /**
     * UPDATE — PUT /api/resource/Campaign/:name
     */
    async update(id, data) {
      const doc = toERPNext(data);
      const res = await request(`/api/resource/${DOCTYPE}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(doc),
      });
      return fromERPNext(res.data);
    },

    /**
     * DELETE — DELETE /api/resource/Campaign/:name
     */
    async delete(id) {
      await request(`/api/resource/${DOCTYPE}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return true;
    },
  };

  // ============================================================
  // LOCAL STORAGE CRUD (Fallback)
  // ============================================================

  const STORAGE_KEY = 'smartmkt_campaigns';

  const localCRUD = {
    _delay: () => new Promise(r => setTimeout(r, 150 + Math.random() * 200)),

    async getAll() {
      await this._delay();
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    },

    async getById(id) {
      await this._delay();
      const all = await this.getAll();
      return all.find(c => c.id === id) || null;
    },

    async create(campaign) {
      await this._delay();
      const all = await this.getAll();
      const newCampaign = {
        ...campaign,
        id: 'camp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      all.unshift(newCampaign);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return newCampaign;
    },

    async update(id, data) {
      await this._delay();
      const all = await this.getAll();
      const idx = all.findIndex(c => c.id === id);
      if (idx === -1) throw new Error('Campaign không tồn tại');
      all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return all[idx];
    },

    async delete(id) {
      await this._delay();
      let all = await this.getAll();
      all = all.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return true;
    },
  };

  // ============================================================
  // UNIFIED API — Smart routing based on mode
  // ============================================================

  const API = {
    /**
     * Get the active CRUD handler based on current mode
     */
    _handler() {
      return isERPNextActive() ? erpnextCRUD : localCRUD;
    },

    async getAll() {
      try {
        return await this._handler().getAll();
      } catch (err) {
        console.warn('[SmartMkt] ERPNext failed, falling back to localStorage:', err.message);
        if (isERPNextActive()) {
          // Auto-fallback to local on ERPNext failure
          return await localCRUD.getAll();
        }
        throw err;
      }
    },

    async getById(id) {
      return this._handler().getById(id);
    },

    async create(campaign) {
      const result = await this._handler().create(campaign);
      // If ERPNext mode, also save locally as backup
      if (isERPNextActive()) {
        try { await localCRUD.create({ ...campaign, id: result.id, _synced: true }); } catch {}
      }
      return result;
    },

    async update(id, data) {
      return this._handler().update(id, data);
    },

    async delete(id) {
      return this._handler().delete(id);
    },

    // Expose mode/config utilities
    getMode,
    setMode,
    getConfig,
    saveConfig,
    clearConfig,
    isERPNextActive,
    testConnection,
  };

  // ============================================================
  // SEED DATA (for localStorage demo mode)
  // ============================================================
  function seedIfEmpty() {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && JSON.parse(existing).length > 0) return;

    const seeds = [
      {
        id: 'camp_demo_1', name: 'Sale Hè 2026 — TikTok Viral',
        platform: 'tiktok', type: 'full', budget: 5000000, status: 'active',
        description: 'Campaign chạy video viral trên TikTok cho mùa sale hè, target Gen Z tại HCM',
        startDate: '2026-06-01', endDate: '2026-06-30',
        createdAt: '2026-03-15T10:00:00Z', updatedAt: '2026-03-15T10:00:00Z',
      },
      {
        id: 'camp_demo_2', name: 'Quảng bá quán Bún Bò Cô Tám',
        platform: 'facebook', type: 'content', budget: 1500000, status: 'active',
        description: 'Content AI cho quán bún bò, đăng tự động Facebook + Zalo mỗi ngày',
        startDate: '2026-03-01', endDate: '2026-04-30',
        createdAt: '2026-03-01T08:00:00Z', updatedAt: '2026-03-10T14:30:00Z',
      },
      {
        id: 'camp_demo_3', name: 'Shop Thời Trang Mây — Instagram',
        platform: 'instagram', type: 'ads', budget: 3000000, status: 'draft',
        description: 'Chạy Instagram Ads cho bộ sưu tập xuân hè mới',
        startDate: '2026-04-01', endDate: '2026-05-15',
        createdAt: '2026-03-12T09:00:00Z', updatedAt: '2026-03-12T09:00:00Z',
      },
      {
        id: 'camp_demo_4', name: 'Chatbot khuyến mãi cuối năm',
        platform: 'zalo', type: 'chatbot', budget: 800000, status: 'completed',
        description: 'Chatbot Zalo OA tự động gửi voucher và chăm sóc khách cũ',
        startDate: '2025-12-01', endDate: '2025-12-31',
        createdAt: '2025-11-20T10:00:00Z', updatedAt: '2026-01-02T08:00:00Z',
      },
      {
        id: 'camp_demo_5', name: 'Đa kênh — Ra mắt sản phẩm mới',
        platform: 'multi', type: 'full', budget: 10000000, status: 'active',
        description: 'Campaign 360 trên TikTok + Facebook + Zalo cho sản phẩm skincare mới',
        startDate: '2026-03-10', endDate: '2026-04-10',
        createdAt: '2026-03-08T14:00:00Z', updatedAt: '2026-03-16T10:00:00Z',
      },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
  }

  // Auto-seed on load
  seedIfEmpty();

  // ============================================================
  // EXPORTS
  // ============================================================
  return API;

})();

// Make available globally
window.ERPNextAPI = ERPNextAPI;
