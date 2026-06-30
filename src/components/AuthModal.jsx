import React, { useState } from 'react';
import { X, User, Lock, AlertCircle, Loader2 } from 'lucide-react';

function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    if (activeTab === 'signup' && (username.trim().length < 3 || password.length < 4)) {
      setError('Username must be at least 3 characters and password at least 4 characters.');
      return;
    }

    setLoading(true);
    const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      let data = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error('Authentication server is restarting or unreachable. Please try again in a few seconds.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      if (activeTab === 'login') {
        // Success login
        onLoginSuccess(data.username, data.token, data.data, rememberMe);
        onClose();
        resetForm();
      } else {
        // Successful registration, switch to login tab
        setActiveTab('login');
        setError('');
        // Automatically try to login
        try {
          const loginRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: username.trim(),
              password,
            }),
          });
          
          let loginData = {};
          const loginContentType = loginRes.headers.get('content-type');
          if (loginContentType && loginContentType.includes('application/json')) {
            loginData = await loginRes.json();
          } else {
            throw new Error('Server offline');
          }

          if (loginRes.ok) {
            onLoginSuccess(loginData.username, loginData.token, loginData.data, rememberMe);
            onClose();
            resetForm();
          }
        } catch (err) {
          setError('Account created! Please log in.');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setError('');
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      animation: 'fadeIn 0.25s ease-out'
    }}>
      <div className="glass-card" style={{
        width: '90%',
        maxWidth: '400px',
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.1)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose} 
          className="btn-icon" 
          style={{ 
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '6px',
            color: 'var(--text-secondary)'
          }}
        >
          <X size={18} />
        </button>

        {/* Logo/Header */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '800',
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 6px 0',
            fontFamily: 'var(--font-secondary)'
          }}>
            {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {activeTab === 'login' ? 'Login to sync your library across devices' : 'Register to save your playlists and liked songs'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.04)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'login' ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: activeTab === 'login' ? '#fff' : 'var(--text-secondary)',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'signup' ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: activeTab === 'signup' ? '#fff' : 'var(--text-secondary)',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username" 
                required
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  padding: '10px 14px 10px 40px',
                  outline: 'none',
                  fontSize: '14px',
                  fontFamily: 'var(--font-primary)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password" 
                required
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  padding: '10px 14px 10px 40px',
                  outline: 'none',
                  fontSize: '14px',
                  fontFamily: 'var(--font-primary)'
                }}
              />
            </div>
          </div>

          {activeTab === 'login' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '2px' }} onClick={() => setRememberMe(!rememberMe)}>
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={() => {}} // handled by click on container
                style={{
                  accentColor: 'var(--vibe-accent)',
                  cursor: 'pointer',
                  width: '15px',
                  height: '15px'
                }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', userSelect: 'none' }}>
                Remember me on this device
              </span>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              fontSize: '15px', 
              fontWeight: '700',
              marginTop: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {activeTab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
