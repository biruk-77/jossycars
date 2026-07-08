// Real Cars ETH — Shared Authentication Logic

// Helper to read cookie by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Check if user is logged in
function isLoggedIn() {
  return !!getCookie('rceth_token') || !!localStorage.getItem('rceth_token');
}

// Get user data
function getUserData() {
  return {
    token: getCookie('rceth_token') || localStorage.getItem('rceth_token'),
    username: localStorage.getItem('rceth_username'),
    name: localStorage.getItem('rceth_name'),
    phone: localStorage.getItem('rceth_phone')
  };
}

// Set user data after successful auth
function saveUserData(data) {
  // Set cookie with SameSite=Lax and Secure attribute (30 days expiration)
  document.cookie = `rceth_token=${data.token}; path=/; max-age=${30*24*60*60}; SameSite=Lax; Secure`;
  localStorage.setItem('rceth_token', data.token);
  localStorage.setItem('rceth_username', data.username);
  localStorage.setItem('rceth_name', data.name || '');
  localStorage.setItem('rceth_phone', data.phone || '');
  updateNavbarAuth();
}

// Function to show a custom logout confirmation modal
function showLogoutConfirmation(onConfirm) {
  // Check if modal already exists
  let modal = document.getElementById('custom-logout-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'custom-logout-modal';
    modal.className = 'auth-modal'; // Reuse the existing auth-modal class for backdrop/blur
    document.body.appendChild(modal);
  }

  // Get current translation values
  const lang = window.currentLang || localStorage.getItem("rceth_lang") || "am";
  const translations = window.TRANSLATIONS?.[lang] || {};
  const titleText = translations["logout-confirm-title"] || "Confirm Logout";
  const bodyText = translations["logout-confirm-text"] || "Are you sure you want to log out?";
  const cancelText = translations["logout-confirm-cancel"] || "Cancel";
  const okText = translations["logout-confirm-ok"] || "Log Out";

  // Set inner HTML dynamically to update language if switched
  modal.innerHTML = `
    <div class="auth-modal-content" style="max-width: 400px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 36px 30px;">
      <button class="auth-modal-close" id="custom-logout-close">&times;</button>
      <div style="margin-top: 10px;">
        <i class="fa-solid fa-right-from-bracket" style="font-size: 36px; color: #b22222; background: rgba(178, 34, 34, 0.06); padding: 18px; border-radius: 50%; width: 72px; height: 72px; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box;"></i>
      </div>
      <h3 style="font-size: 20px; font-weight: 800; margin: 0; color: var(--text);">${titleText}</h3>
      <p style="font-size: 13px; color: var(--text-dim); line-height: 1.5; margin: 0 0 8px 0;">${bodyText}</p>
      <div style="display: flex; gap: 12px; width: 100%; justify-content: center; margin-top: 8px;">
        <button id="custom-logout-cancel" class="nav-login-btn" style="flex: 1; padding: 12px; margin: 0; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">${cancelText}</button>
        <button id="custom-logout-confirm" class="auth-modal-submit" style="flex: 1; padding: 12px; margin: 0; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; background: #b22222; color: #fff; box-shadow: 0 8px 20px rgba(178,34,34,0.15);">${okText}</button>
      </div>
    </div>
  `;

  // Event listeners
  const closeModalFunc = () => {
    modal.classList.remove('open');
  };

  modal.querySelector('#custom-logout-close').addEventListener('click', closeModalFunc);
  modal.querySelector('#custom-logout-cancel').addEventListener('click', closeModalFunc);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModalFunc();
  });

  // Setup confirm action
  const confirmBtn = modal.querySelector('#custom-logout-confirm');
  // Recreate the button to clear previous listeners
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  newConfirmBtn.addEventListener('click', () => {
    modal.classList.remove('open');
    onConfirm();
  });

  // Open modal
  setTimeout(() => {
    modal.classList.add('open');
  }, 10);
}

// Log out user
function logoutUser() {
  // Clear cookie
  document.cookie = "rceth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  localStorage.removeItem('rceth_token');
  localStorage.removeItem('rceth_username');
  localStorage.removeItem('rceth_name');
  localStorage.removeItem('rceth_phone');
  updateNavbarAuth();
  // If we are on the details page, redirect to index or refresh
  if (window.location.pathname.includes('car.html')) {
    window.location.href = 'index.html';
  } else {
    window.location.reload();
  }
}

// Update the navbar to show user name & logout or login button
function updateNavbarAuth() {
  const container = document.getElementById('nav-auth-container');
  if (!container) return;

  if (isLoggedIn()) {
    const username = localStorage.getItem('rceth_username');
    container.innerHTML = `
      <div class="nav-user-info">
        <i class="fa-solid fa-circle-user"></i>
        <span>${username}</span>
      </div>
      <button class="nav-logout-btn" id="nav-profile-action" style="background:rgba(212,175,55,0.12);color:#b8860b;border:1px solid rgba(212,175,55,0.3);margin-right:6px;">
        <i class="fa-solid fa-pen-to-square" style="margin-right:4px;"></i>Profile
      </button>
      <button class="nav-logout-btn" id="nav-logout-action">Logout</button>
    `;
    document.getElementById('nav-logout-action')?.addEventListener('click', (e) => {
      e.preventDefault();
      showLogoutConfirmation(() => {
        logoutUser();
      });
    });

    document.getElementById('nav-profile-action')?.addEventListener('click', (e) => {
      e.preventDefault();
      openProfileModal();
    });
  } else {
    container.innerHTML = `
      <a href="#" class="nav-login-btn" id="nav-login-action">Login</a>
    `;
    document.getElementById('nav-login-action')?.addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal();
    });
  }
}

// Modal management
let onAuthSuccessCallback = null;

function openAuthModal(callback = null) {
  onAuthSuccessCallback = callback;
  const modal = document.getElementById('customer-auth-modal');
  if (modal) {
    modal.classList.add('open');
    resetAuthForm();
  }
}

function closeAuthModal() {
  const modal = document.getElementById('customer-auth-modal');
  if (modal) {
    modal.classList.remove('open');
  }
}

function resetAuthForm() {
  const form = document.getElementById('customer-auth-form');
  const msgEl = document.getElementById('customer-auth-msg');
  if (form) form.reset();
  if (msgEl) {
    msgEl.style.display = 'none';
    msgEl.className = 'auth-modal-msg';
    msgEl.textContent = '';
  }
  // Reset tabs to Login
  switchTab('login');
}

function switchTab(tab) {
  const tabLogin = document.getElementById('tab-login-btn');
  const tabSignup = document.getElementById('tab-signup-btn');
  const nameGroup = document.getElementById('group-name');
  const phoneGroup = document.getElementById('group-phone');
  const submitBtn = document.getElementById('cust-submit-btn');

  if (tab === 'login') {
    tabLogin?.classList.add('active');
    tabSignup?.classList.remove('active');
    if (nameGroup) nameGroup.style.display = 'none';
    if (phoneGroup) phoneGroup.style.display = 'none';
    if (submitBtn) submitBtn.textContent = 'Unlock Details';
    // Remove required attributes
    document.getElementById('cust-name')?.removeAttribute('required');
    document.getElementById('cust-phone')?.removeAttribute('required');
  } else {
    tabLogin?.classList.remove('active');
    tabSignup?.classList.add('active');
    if (nameGroup) nameGroup.style.display = 'flex';
    if (phoneGroup) phoneGroup.style.display = 'flex';
    if (submitBtn) submitBtn.textContent = 'Create Account & Unlock';
    // Add required attributes for signup
    document.getElementById('cust-name')?.setAttribute('required', 'true');
    document.getElementById('cust-phone')?.setAttribute('required', 'true');
  }
}

// Handle Form Submission
async function handleAuthSubmit(e) {
  e.preventDefault();
  const msgEl = document.getElementById('customer-auth-msg');
  const isSignup = document.getElementById('tab-signup-btn')?.classList.contains('active');

  const username = document.getElementById('cust-username').value.trim();
  const password = document.getElementById('cust-password').value.trim();
  const name = document.getElementById('cust-name')?.value.trim();
  const phone = document.getElementById('cust-phone')?.value.trim();

  if (msgEl) {
    msgEl.style.display = 'none';
    msgEl.className = 'auth-modal-msg';
  }

  const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
  const bodyData = isSignup 
    ? { username, password, name, phone } 
    : { username, password };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    // Success
    msgEl.className = 'auth-modal-msg success';
    msgEl.textContent = isSignup ? 'Registration successful! Unlocking...' : 'Login successful! Unlocking...';
    msgEl.style.display = 'block';

    setTimeout(() => {
      saveUserData(data);
      closeAuthModal();
      if (onAuthSuccessCallback) {
        onAuthSuccessCallback();
      }
    }, 1000);

  } catch (err) {
    msgEl.className = 'auth-modal-msg error';
    msgEl.textContent = err.message;
    msgEl.style.display = 'block';
  }
}

// Save inquiry to DB when a car is opened
async function recordInquiry(car) {
  const user = getUserData();
  if (!user.token) return;

  try {
    await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({
        name: user.name || user.username,
        phone: user.phone || 'N/A',
        carId: car.id,
        carTitle: car.title,
        carPrice: car.price
      })
    });
  } catch (err) {
    console.error('Error recording lead inquiry:', err);
  }
}

// ── Profile Modal ──
function openProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  // Pre-fill with saved data
  document.getElementById('prof-name').value = localStorage.getItem('rceth_name') || '';
  document.getElementById('prof-phone').value = localStorage.getItem('rceth_phone') || '';
  document.getElementById('prof-current-pw').value = '';
  document.getElementById('prof-new-pw').value = '';
  const msgEl = document.getElementById('profile-msg');
  if (msgEl) { msgEl.style.display = 'none'; msgEl.textContent = ''; }
  modal.style.display = 'flex';
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
  });
}

function closeProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  modal.style.opacity = '0';
  modal.style.pointerEvents = 'none';
  setTimeout(() => { modal.style.display = 'none'; }, 300);
}

async function loadGlobalSettings() {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to load settings');
    const settings = await res.json();
    window.siteSettings = settings;

    // Apply settings to elements
    // 1. Text content
    document.querySelectorAll('[data-setting-text]').forEach(el => {
      const key = el.getAttribute('data-setting-text');
      if (settings[key]) {
        el.textContent = settings[key];
      }
    });

    // 2. HTML content (preserves newlines as breaks)
    document.querySelectorAll('[data-setting-html]').forEach(el => {
      const key = el.getAttribute('data-setting-html');
      if (settings[key]) {
        el.innerHTML = settings[key].replace(/\n/g, '<br>');
      }
    });

    // 3. Links (href attributes)
    document.querySelectorAll('[data-setting-href]').forEach(el => {
      const key = el.getAttribute('data-setting-href');
      if (settings[key]) {
        let val = settings[key];
        if (key.startsWith('phone') && !val.startsWith('tel:') && !val.startsWith('http')) {
          val = 'tel:' + val.replace(/\s+/g, '');
        } else if (key.startsWith('telegram_chat_username') && !val.startsWith('http')) {
          val = 'https://t.me/' + val.replace('@', '');
        }
        el.href = val;
      }
    });

    // Re-apply translations with dynamic settings injected!
    if (typeof applyTranslations === 'function') {
      applyTranslations();
    }

    // Invoke page-specific callback if registered
    if (window.onSettingsLoaded) {
      window.onSettingsLoaded(settings);
    }
  } catch (err) {
    console.error('Error loading global site settings:', err);
  }
}

// Init when script loads
document.addEventListener('DOMContentLoaded', () => {
  updateNavbarAuth();
  loadGlobalSettings();

  // Tab buttons
  document.getElementById('tab-login-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('login');
  });
  document.getElementById('tab-signup-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('signup');
  });

  // Close button
  document.getElementById('customer-auth-close')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeAuthModal();
  });

  // Close modal when clicking background
  const modal = document.getElementById('customer-auth-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAuthModal();
    });
  }

  // Form submit
  document.getElementById('customer-auth-form')?.addEventListener('submit', handleAuthSubmit);

  // Profile modal close
  document.getElementById('profile-modal-close')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeProfileModal();
  });
  document.getElementById('profile-modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('profile-modal')) closeProfileModal();
  });

  // Profile form submit
  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgEl = document.getElementById('profile-msg');
    msgEl.style.display = 'none';
    const name = document.getElementById('prof-name').value.trim();
    const phone = document.getElementById('prof-phone').value.trim();
    const currentPassword = document.getElementById('prof-current-pw').value;
    const newPassword = document.getElementById('prof-new-pw').value;
    const token = localStorage.getItem('rceth_token');

    const body = { name, phone };
    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      // Persist updated token & info
      localStorage.setItem('rceth_name', data.name || name);
      localStorage.setItem('rceth_phone', data.phone || phone);
      if (data.token) localStorage.setItem('rceth_token', data.token);

      msgEl.style.cssText = 'display:block;padding:10px 14px;border-radius:6px;font-size:13px;margin-bottom:16px;background:#e8f5e9;color:#2d6a2d;border:1px solid rgba(46,213,115,0.3);';
      msgEl.textContent = 'Profile updated successfully!';
      setTimeout(() => closeProfileModal(), 1500);
    } catch (err) {
      msgEl.style.cssText = 'display:block;padding:10px 14px;border-radius:6px;font-size:13px;margin-bottom:16px;background:#fdecea;color:#b22222;border:1px solid rgba(178,34,34,0.2);';
      msgEl.textContent = err.message;
    }
  });
});
