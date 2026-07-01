// Real Cars ETH — Shared Authentication Logic

// Check if user is logged in
function isLoggedIn() {
  return !!localStorage.getItem('rceth_token');
}

// Get user data
function getUserData() {
  return {
    token: localStorage.getItem('rceth_token'),
    username: localStorage.getItem('rceth_username'),
    name: localStorage.getItem('rceth_name'),
    phone: localStorage.getItem('rceth_phone')
  };
}

// Set user data after successful auth
function saveUserData(data) {
  localStorage.setItem('rceth_token', data.token);
  localStorage.setItem('rceth_username', data.username);
  localStorage.setItem('rceth_name', data.name || '');
  localStorage.setItem('rceth_phone', data.phone || '');
  updateNavbarAuth();
}

// Log out user
function logoutUser() {
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
      logoutUser();
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

// Init when script loads
document.addEventListener('DOMContentLoaded', () => {
  updateNavbarAuth();

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
