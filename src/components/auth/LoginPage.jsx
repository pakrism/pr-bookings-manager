import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import Logo from '../logo/Logo';
import { PrimaryButton } from '../common/BrandButton';

function LoginPage({ onLogin, errorMessage, loading }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onLogin(form.email, form.password);
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <Box sx={{ mb: 3 }}>
          <Logo />
          <Typography variant="body2" sx={{ color: '#637381', mt: 1 }}>
            Booking Manager
          </Typography>
        </Box>

        <div className="auth-header">
          <h2>Sign in</h2>
          <span>Authorized staff only</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Email</label>
            <input
              className="form-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="form-field">
            <label>Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {errorMessage && <div className="auth-error">{errorMessage}</div>}

          <PrimaryButton
            type="submit"
            disabled={loading}
            fullWidth
            sx={{ mt: 1 }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
