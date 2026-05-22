import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const handleQuickLogin = async (role) => {
    let demoEmail = '';
    let demoPassword = '';
    
    if (role === 'admin') {
      demoEmail = 'admin@taskmanager.com';
      demoPassword = 'admin123';
    } else {
      demoEmail = 'member1@taskmanager.com';
      demoPassword = 'member123';
    }

    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);

    const result = await login(demoEmail, demoPassword);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon" style={{ margin: '0 auto', width: '40px', height: '40px', fontSize: '1.25rem' }}>AG</div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to manage your team tasks</p>
        </div>

        {error && <div className="auth-alert auth-alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="e.g. admin@taskmanager.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-subtitle" style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Sign up</Link>
        </p>

        <div className="quick-login-section">
          <p className="quick-login-divider"><span>Or Live Demo Sign-In</span></p>
          
          <div className="quick-login-grid">
            <div className="quick-login-card admin" onClick={() => handleQuickLogin('admin')}>
              <div className="quick-login-badge admin">Admin Access</div>
              <div className="quick-login-body">
                <span className="quick-login-icon">🛡️</span>
                <span className="quick-login-title">Administrator</span>
                <span className="quick-login-desc">Full control to create projects, assign teams, and build tasks.</span>
              </div>
            </div>
            
            <div className="quick-login-card member" onClick={() => handleQuickLogin('member')}>
              <div className="quick-login-badge member">Member Access</div>
              <div className="quick-login-body">
                <span className="quick-login-icon">👥</span>
                <span className="quick-login-title">Team Member</span>
                <span className="quick-login-desc">View assigned tasks and progress statuses in real-time.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
