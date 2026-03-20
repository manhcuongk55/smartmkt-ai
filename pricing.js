// ============================================================
// SmartMkt AI — Pricing & Signup Logic
// ============================================================
// Multi-step signup flow: Plan Selection → Registration → Payment → Success
// ============================================================

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ============================================================
  // STATE
  // ============================================================
  let selectedPlan = 'flame'; // default
  let selectedPayment = 'momo';
  let signupData = {};

  // Steps
  const steps = {
    plan: $('#stepPlan'),
    signup: $('#stepSignup'),
    payment: $('#stepPayment'),
    success: $('#stepSuccess'),
  };

  // ============================================================
  // URL PARAMS — Pre-select plan from landing page
  // ============================================================
  function readUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan');
    if (plan && AuthManager.PLANS[plan]) {
      selectedPlan = plan;
    }
  }
  readUrlParams();

  // ============================================================
  // STEP NAVIGATION
  // ============================================================
  function showStep(stepName) {
    Object.values(steps).forEach(s => s.classList.add('hidden'));
    steps[stepName].classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ============================================================
  // PLAN SELECTION (Step 1)
  // ============================================================
  function initPlanSelection() {
    // Highlight selected plan
    highlightPlan(selectedPlan);

    // Plan card clicks
    $$('.plan-card').forEach(card => {
      card.addEventListener('click', () => {
        const plan = card.dataset.plan;
        selectedPlan = plan;
        highlightPlan(plan);
      });
    });

    // Plan select buttons
    $$('.plan-select-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedPlan = btn.dataset.plan;
        highlightPlan(selectedPlan);

        // Go to step 2
        setTimeout(() => {
          updateSignupStep();
          showStep('signup');
        }, 200);
      });
    });
  }

  function highlightPlan(planId) {
    $$('.plan-card').forEach(c => c.classList.remove('selected'));
    const card = $(`.plan-card[data-plan="${planId}"]`);
    if (card) card.classList.add('selected');
  }

  // ============================================================
  // SIGNUP FORM (Step 2)
  // ============================================================
  function updateSignupStep() {
    const plan = AuthManager.PLANS[selectedPlan];
    if (!plan) return;

    $('#spmName').textContent = plan.name + ' — ' + plan.priceLabel + plan.period;
  }

  // Change plan button
  if ($('#btnChangePlan')) {
    $('#btnChangePlan').addEventListener('click', () => {
      showStep('plan');
    });
  }

  // Form submit → go to payment
  if ($('#signupForm')) {
    $('#signupForm').addEventListener('submit', (e) => {
      e.preventDefault();

      signupData = {
        shopName: $('#shopName').value.trim(),
        email: $('#signupEmail').value.trim(),
        phone: $('#signupPhone').value.trim(),
        industry: $('#signupIndustry').value,
        referralCode: $('#referralCode').value.trim().toUpperCase(),
        plan: selectedPlan,
      };

      if (!signupData.shopName || !signupData.email) {
        showToast('⚠️ Vui lòng nhập tên shop và email!', 'error');
        return;
      }

      // Skip payment for free plan
      if (selectedPlan === 'free') {
        processSignup();
        return;
      }

      updatePaymentStep();
      showStep('payment');
    });
  }

  // ============================================================
  // PAYMENT (Step 3)
  // ============================================================
  function updatePaymentStep() {
    const plan = AuthManager.PLANS[selectedPlan];
    if (!plan) return;

    // Order summary
    $('#osPlanName').textContent = plan.name;
    $('#osPlanPrice').textContent = formatCurrency(plan.price) + plan.period;
    $('#osMonthly').textContent = formatCurrency(plan.price);
    $('#osNextCharge').textContent = formatCurrency(plan.price);

    // Check referral
    if (signupData.referralCode) {
      $('#osDiscountRow').style.display = 'flex';
      $('#osDiscount').textContent = '-' + formatCurrency(plan.price);
    } else {
      $('#osDiscountRow').style.display = 'none';
    }

    // Total today = 0 (trial)
    $('#osTotalPrice').textContent = '0đ';

    // Bank transfer content
    $('#bankContent').textContent = 'SMARTMKT ' + (signupData.email || '').replace(/@.*/, '').toUpperCase();
  }

  // Payment method selection
  $$('.pm-card').forEach(card => {
    card.addEventListener('click', () => {
      $$('.pm-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedPayment = card.dataset.method;

      // Show/hide QR or bank info
      if (selectedPayment === 'bank') {
        $('#qrDisplay').style.display = 'none';
        $('#bankInfo').style.display = 'block';
      } else {
        $('#qrDisplay').style.display = 'block';
        $('#bankInfo').style.display = 'none';

        const labels = {
          momo: 'Quét mã QR bằng MoMo',
          zalopay: 'Quét mã QR bằng ZaloPay',
          vnpay: 'Quét mã QR bằng VNPAY',
        };
        $('#qrLabel').textContent = labels[selectedPayment] || 'Quét mã QR';
      }
    });
  });

  // Back button
  if ($('#btnBackToSignup')) {
    $('#btnBackToSignup').addEventListener('click', () => showStep('signup'));
  }

  // Confirm payment
  if ($('#btnConfirm')) {
    $('#btnConfirm').addEventListener('click', () => {
      processSignup();
    });
  }

  // ============================================================
  // PROCESS SIGNUP
  // ============================================================
  function processSignup() {
    const btn = $('#btnConfirm') || $('#btnToPayment');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Đang xử lý...';
    }

    // Simulate processing delay
    setTimeout(() => {
      try {
        const user = AuthManager.signup({
          ...signupData,
          plan: selectedPlan,
          paymentMethod: selectedPayment,
        });

        // Show success
        updateSuccessStep(user);
        showStep('success');
        showToast('🎉 Đăng ký thành công!', 'success');

      } catch (err) {
        showToast('❌ ' + err.message, 'error');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2"/></svg>
            Xác nhận đăng ký
          `;
        }
      }
    }, 1500);
  }

  // ============================================================
  // SUCCESS (Step 4)
  // ============================================================
  function updateSuccessStep(user) {
    const plan = AuthManager.PLANS[user.plan];
    $('#spcPlan').textContent = plan?.name || 'Free';

    if (user.plan === 'free') {
      $('.spc-trial').textContent = 'Gói miễn phí — nâng cấp bất kỳ lúc nào';
    }

    // Referral code
    $('#rcCode').textContent = user.referralCode || 'N/A';

    // Copy referral
    $('#btnCopyReferral').addEventListener('click', () => {
      const code = user.referralCode;
      const text = `🔥 Dùng mã ${code} để đăng ký SmartMkt AI — AI Marketing cho SME! Mỗi 3 bạn giới thiệu = 1 tháng miễn phí 🎁\n\nhttps://smartmkt-ai.vercel.app/pricing.html?ref=${code}`;
      navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Đã copy mã giới thiệu!', 'success');
        $('#btnCopyReferral').textContent = '✅ Đã copy!';
        setTimeout(() => { $('#btnCopyReferral').textContent = '📋 Copy'; }, 2000);
      });
    });

    // Share buttons
    $('#shareZalo').addEventListener('click', () => {
      const url = `https://smartmkt-ai.vercel.app/pricing.html?ref=${user.referralCode}`;
      window.open(`https://zalo.me/share?url=${encodeURIComponent(url)}`, '_blank');
    });

    $('#shareFb').addEventListener('click', () => {
      const url = `https://smartmkt-ai.vercel.app/pricing.html?ref=${user.referralCode}`;
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================
  function formatCurrency(n) {
    return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
  }

  function showToast(message, type = 'success') {
    const container = $('#toastContainer');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ============================================================
  // INIT
  // ============================================================
  initPlanSelection();

  // If plan param in URL, auto-advance to signup
  const urlPlan = new URLSearchParams(window.location.search).get('plan');
  if (urlPlan && AuthManager.PLANS[urlPlan]) {
    selectedPlan = urlPlan;
    highlightPlan(selectedPlan);
    // Small delay for visual effect
    setTimeout(() => {
      updateSignupStep();
      showStep('signup');
    }, 500);
  }

  // Check for referral code in URL
  const urlRef = new URLSearchParams(window.location.search).get('ref');
  if (urlRef) {
    const refInput = $('#referralCode');
    if (refInput) refInput.value = urlRef;
  }

  console.log('%c✦ SmartMkt AI Pricing — Loaded', 'color:#8b5cf6;font-weight:bold;font-size:14px');
})();
