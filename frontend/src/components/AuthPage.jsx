import React, { useState } from 'react';
import { 
  Database, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Zap,
  TrendingUp,
  Cpu,
  LogIn,
  UserPlus
} from 'lucide-react';
import { registerUser, loginUser } from '../api/client';

export default function AuthPage({ onAuthSuccess }) {
  // Requirement 2: Whenever user visits first time, register page should appear
  const [mode, setMode] = useState('register'); // 'register' | 'login'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [registeredNotice, setRegisteredNotice] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setRegisteredNotice(false);

    if (!email || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setErrorMsg('Please enter your full name to register.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        const res = await registerUser({ name: name.trim(), email: email.trim(), password });
        setInfoMsg('Account created successfully! Launching portfolio workspace...');
        setTimeout(() => {
          onAuthSuccess(res.user, res.access_token);
        }, 500);
      } else {
        const res = await loginUser({ email: email.trim(), password, name: name.trim() });
        setInfoMsg(`Welcome back, ${res.user.name}!`);
        setTimeout(() => {
          onAuthSuccess(res.user, res.access_token);
        }, 500);
      }
    } catch (err) {
      console.error('Auth action error:', err);
      
      // Requirement 3: After register page check whether he is registered or not if registered tell him to login
      if (mode === 'register' && err.isRegistered) {
        setRegisteredNotice(true);
        setErrorMsg('You are already registered with this email! Please log in instead.');
        // Automatically switch to login mode with the email pre-preserved
        setTimeout(() => {
          setMode('login');
        }, 1200);
      } else if (mode === 'login' && err.isRegistered === false) {
        setErrorMsg('No registered account found with this email. Please create an account first.');
        setTimeout(() => {
          setMode('register');
        }, 1200);
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    setInfoMsg('');
    setRegisteredNotice(false);
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Background Decorative Mesh Gradients */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-10%',
        width: '550px',
        height: '550px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.05) 50%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-10%',
        width: '550px',
        height: '550px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        maxWidth: '1050px',
        width: '100%',
        backgroundColor: 'var(--bg-glass-card)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--bg-glass-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg), var(--glow-subtle)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Left Side: Brand & Feature Highlights */}
        <div style={{
          flex: '1 1 45%',
          padding: '48px 40px',
          background: 'linear-gradient(145deg, rgba(13, 17, 26, 0.9) 0%, rgba(19, 25, 38, 0.6) 100%)',
          borderRight: '1px solid var(--bg-glass-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }} className="desktop-only-flex">
          
          <div>
            {/* Logo Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.45)'
              }}>
                <Database size={24} color="#041B11" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.02em', color: '#FFF' }}>
                    Trade<span style={{ color: 'var(--emerald-primary)' }}>Pulse</span>
                  </span>
                  <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>v1.0</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Portfolio & CSV Analytics Chatbot</div>
              </div>
            </div>

            {/* Main Catchphrase */}
            <h2 style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#FFF',
              lineHeight: 1.25,
              marginBottom: '16px',
              letterSpacing: '-0.02em'
            }}>
              AI-Powered Financial Intelligence for Your <span style={{
                background: 'linear-gradient(90deg, #10B981 0%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Portfolios</span>
            </h2>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
              Transform complex trading records and multi-custodian holdings into instant interactive SQL analytics using natural language.
            </p>

            {/* Feature Bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--emerald-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={15} color="var(--emerald-primary)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>Dynamic NL-to-SQL Engine</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>High-precision SQL generation powered by Groq Llama 3.3</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--cyan-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={15} color="var(--cyan-primary)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>Holdings & P&L Analytics</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Instant aggregates, yearly returns & custodian breakdowns</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--purple-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={15} color="var(--purple-primary)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>Protected Security & Revocable Tokens</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Rate limited API with real-time token blacklisting</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--bg-glass-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '28px'
          }}>
            <Cpu size={18} color="var(--cyan-primary)" />
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Self-learning RAG memory stores successful queries securely.
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div style={{
          flex: '1 1 55%',
          padding: '44px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minWidth: '320px'
        }}>
          
          {/* Header Switcher */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex',
              padding: '4px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--bg-glass-border)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '20px',
              width: '100%'
            }}>
              <button
                type="button"
                onClick={() => switchMode('register')}
                style={{
                  flex: 1,
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: mode === 'register' ? 'var(--emerald-primary)' : 'transparent',
                  color: mode === 'register' ? '#041B11' : 'var(--text-secondary)',
                  boxShadow: mode === 'register' ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none',
                  transition: 'all var(--transition-smooth)'
                }}
              >
                <UserPlus size={16} /> Create Account (First Visit)
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  flex: 1,
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: mode === 'login' ? 'var(--cyan-primary)' : 'transparent',
                  color: mode === 'login' ? '#07090E' : 'var(--text-secondary)',
                  boxShadow: mode === 'login' ? '0 2px 8px rgba(6, 182, 212, 0.4)' : 'none',
                  transition: 'all var(--transition-smooth)'
                }}
              >
                <LogIn size={16} /> Sign In
              </button>
            </div>

            <h3 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFF', marginBottom: '6px' }}>
              {mode === 'register' ? 'Register New Account' : 'Welcome Back'}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              {mode === 'register' 
                ? 'Create your credentials to access the TradePulse studio.'
                : 'Sign in with your email and password to resume your analytics session.'}
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div style={{
              padding: '12px 14px',
              backgroundColor: registeredNotice ? 'var(--amber-surface)' : 'var(--rose-surface)',
              border: `1px solid ${registeredNotice ? 'var(--amber-primary)' : 'var(--rose-primary)'}`,
              borderRadius: 'var(--radius-md)',
              color: registeredNotice ? '#FDE68A' : '#FECDD3',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 600 }}>{registeredNotice ? 'Already Registered' : 'Authentication Notice'}</div>
                <div>{errorMsg}</div>
                {registeredNotice && (
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    style={{
                      marginTop: '6px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--amber-primary)',
                      textDecoration: 'underline',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      padding: 0
                    }}
                  >
                    Click here to Sign In now →
                  </button>
                )}
              </div>
            </div>
          )}

          {infoMsg && (
            <div style={{
              padding: '12px 14px',
              backgroundColor: 'var(--emerald-surface)',
              border: '1px solid var(--emerald-primary)',
              borderRadius: 'var(--radius-md)',
              color: '#A7F3D0',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
              <div>{infoMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Name Input Field (Requirement: register and login should name , email and password place holders) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Full Name {mode === 'login' && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional for login)</span>}
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--bg-glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0 12px',
                transition: 'border-color var(--transition-fast)'
              }}>
                <User size={16} color="var(--text-muted)" style={{ marginRight: '10px', flexShrink: 0 }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit'
                  }}
                  required={mode === 'register'}
                />
              </div>
            </div>

            {/* Email Input Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--bg-glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0 12px',
                transition: 'border-color var(--transition-fast)'
              }}>
                <Mail size={16} color="var(--text-muted)" style={{ marginRight: '10px', flexShrink: 0 }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>
            </div>

            {/* Password Input Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--bg-glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0 12px',
                transition: 'border-color var(--transition-fast)'
              }}>
                <Lock size={16} color="var(--text-muted)" style={{ marginRight: '10px', flexShrink: 0 }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your secure password"
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '10px',
                padding: '13px 20px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: mode === 'register' 
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
                color: mode === 'register' ? '#041B11' : '#FFF',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: mode === 'register' 
                  ? '0 4px 14px rgba(16, 185, 129, 0.4)' 
                  : '0 4px 14px rgba(6, 182, 212, 0.4)',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all var(--transition-smooth)'
              }}
            >
              {isLoading ? (
                <>Processing...</>
              ) : mode === 'register' ? (
                <>Create Account & Start Exploring <ArrowRight size={17} /></>
              ) : (
                <>Sign In to Studio <ArrowRight size={17} /></>
              )}
            </button>
          </form>

          {/* Footer toggle prompt */}
          <div style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--bg-glass-border)',
            paddingTop: '16px'
          }}>
            {mode === 'register' ? (
              <span>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--cyan-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Log in to your account
                </button>
              </span>
            ) : (
              <span>
                New to TradePulse?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--emerald-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Register an account
                </button>
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
