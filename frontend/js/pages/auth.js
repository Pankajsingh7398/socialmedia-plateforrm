import { login, register, verifyEmail, forgotPassword, resetPassword } from '../auth.js';
import { showToast } from '../utils.js';

export const renderLogin = () => `
  <div class="auth-layout">
    <div class="auth-card fade-in">
      <div class="auth-logo"><div class="pulse-logo">Pulse</div></div>
      <p class="auth-subtitle">Welcome back to Pulse.</p>
      <form id="login-form">
        <div class="form-group">
          <label class="form-label" for="email">Email</label>
          <input class="form-input" type="email" id="email" name="email" required placeholder="you@example.com">
        </div>
        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <input class="form-input" type="password" id="password" name="password" required placeholder="••••••••">
        </div>
        <button type="submit" class="btn btn-primary btn-lg" style="width:100%">Sign In</button>
      </form>
      <p class="auth-footer">
        <a href="#forgot-password">Forgot password?</a>
      </p>
      <div class="auth-divider">or</div>
      <p class="auth-footer">Don't have an account? <a href="#register">Create one</a></p>
    </div>
  </div>
`;

export const renderRegister = () => `
  <div class="auth-layout">
    <div class="auth-card fade-in">
      <div class="auth-logo"><div class="pulse-logo">Pulse</div></div>
      <p class="auth-subtitle">Join the Pulse community.</p>
      <form id="register-form">
        <div class="form-group">
          <label class="form-label" for="name">Full Name</label>
          <input class="form-input" type="text" id="name" name="name" required placeholder="John Doe">
        </div>
        <div class="form-group">
          <label class="form-label" for="username">Username</label>
          <input class="form-input" type="text" id="username" name="username" required placeholder="johndoe" pattern="[a-zA-Z0-9_]+">
        </div>
        <div class="form-group">
          <label class="form-label" for="email">Email</label>
          <input class="form-input" type="email" id="email" name="email" required placeholder="you@example.com">
        </div>
        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <input class="form-input" type="password" id="password" name="password" required minlength="6" placeholder="Min 6 characters">
        </div>
        <button type="submit" class="btn btn-primary btn-lg" style="width:100%">Create Account</button>
      </form>
      <p class="auth-footer">Already have an account? <a href="#login">Sign in</a></p>
    </div>
  </div>
`;

export const renderForgotPassword = () => `
  <div class="auth-layout">
    <div class="auth-card fade-in">
      <div class="auth-logo">Pulse</div>
      <p class="auth-subtitle">Enter your email to reset your password.</p>
      <form id="forgot-form">
        <div class="form-group">
          <label class="form-label" for="email">Email</label>
          <input class="form-input" type="email" id="email" name="email" required>
        </div>
        <button type="submit" class="btn btn-primary btn-lg" style="width:100%">Send Reset Link</button>
      </form>
      <p class="auth-footer"><a href="#login">Back to login</a></p>
    </div>
  </div>
`;

export const renderResetPassword = (token) => `
  <div class="auth-layout">
    <div class="auth-card fade-in">
      <div class="auth-logo">Pulse</div>
      <p class="auth-subtitle">Enter your new password.</p>
      <form id="reset-form" data-token="${token}">
        <div class="form-group">
          <label class="form-label" for="password">New Password</label>
          <input class="form-input" type="password" id="password" name="password" required minlength="6">
        </div>
        <div class="form-group">
          <label class="form-label" for="confirm">Confirm Password</label>
          <input class="form-input" type="password" id="confirm" name="confirm" required minlength="6">
        </div>
        <button type="submit" class="btn btn-primary btn-lg" style="width:100%">Reset Password</button>
      </form>
    </div>
  </div>
`;

export const renderVerifyEmail = (token) => `
  <div class="auth-layout">
    <div class="auth-card fade-in text-center">
      <div class="auth-logo">Pulse</div>
      <div id="verify-status">
        <div class="spinner" style="margin:2rem auto"></div>
        <p>Verifying your email...</p>
      </div>
    </div>
  </div>
`;

export const bindAuthEvents = (onSuccess) => {
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await login(form.email.value, form.password.value);
      showToast('Welcome back!', 'success');
      onSuccess();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await register({
        name: form.name.value,
        username: form.username.value,
        email: form.email.value,
        password: form.password.value,
      });
      showToast('Account created! Check your email to verify.', 'success');
      onSuccess();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      await forgotPassword(form.email.value);
      showToast('If that email exists, a reset link has been sent.', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('reset-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    if (form.password.value !== form.confirm.value) {
      showToast('Passwords do not match', 'error');
      return;
    }
    try {
      await resetPassword(form.dataset.token, form.password.value);
      showToast('Password reset successful!', 'success');
      onSuccess();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
};

export const handleVerifyEmail = async (token, onSuccess) => {
  const status = document.getElementById('verify-status');
  try {
    await verifyEmail(token);
    status.innerHTML = '<p class="text-success" style="font-size:1.25rem;margin:2rem 0">✓ Email verified!</p><a href="#feed" class="btn btn-primary">Go to Feed</a>';
    onSuccess?.();
  } catch (err) {
    status.innerHTML = `<p class="text-danger" style="margin:2rem 0">${err.message}</p><a href="#login" class="btn btn-primary">Back to Login</a>`;
  }
};
