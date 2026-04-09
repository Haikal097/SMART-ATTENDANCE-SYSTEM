import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Welcome() {
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('admin');

  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    post(route('login'), { onFinish: () => reset('password') });
  };

  const timeString = currentTime.toLocaleTimeString('en-US', { hour12: false });
  const dateString = currentTime
    .toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    .toUpperCase();

  return (
    <>
      <Head title="Smart Attendance System - Login" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

        .sas-root { font-family: 'DM Sans', sans-serif; }

        .sas-input:focus {
          outline: none;
          border-color: rgba(0,0,0,0.4);
        }

        .sas-tab-active {
          background: #0f1117;
          color: #fff;
        }

        .sas-tab-inactive {
          background: transparent;
          color: #888;
        }

        .sas-tab-inactive:hover {
          color: #0f1117;
        }

        .sas-alt-btn:hover {
          background: #f5f5f5;
          color: #0f1117;
        }

        .sas-forgot:hover {
          color: #0f1117;
          border-color: rgba(0,0,0,0.4);
        }

        .sas-submit:hover {
          opacity: 0.85;
        }

        .sas-register:hover {
          color: #0f1117;
        }

        .sas-grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>

      <div className="sas-root min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div
          className="flex w-full max-w-4xl overflow-hidden"
          style={{
            borderRadius: 16,
            border: '0.5px solid rgba(0,0,0,0.1)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
          }}
        >
          {/* ── LEFT PANEL ── */}
          <div className="bg-white flex flex-col" style={{ flex: '0 0 420px', padding: '44px 48px' }}>
            {/* Brand with Register Link */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-2">
                <div
                  style={{
                    width: 32, height: 32, background: '#0f1117',
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0f1117' }}>
                  SmartAttend
                </span>
                <span style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', marginBottom: 8, display: 'inline-block' }} />
              </div>
              <Link
                href={route('register')}
                className="sas-register"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#888',
                  textDecoration: 'none',
                  borderBottom: '0.5px solid rgba(0,0,0,0.15)',
                  paddingBottom: 1,
                  transition: 'all 0.15s',
                }}
              >
                Register
              </Link>
            </div>

            {/* Heading */}
            <h1 style={{ fontSize: 26, fontWeight: 500, color: '#0f1117', lineHeight: 1.2, marginBottom: 6 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 32 }}>
              Sign in to access your dashboard
            </p>

            {/* Tabs */}
            <div
              className="flex mb-7"
              style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, overflow: 'hidden' }}
            >
              {[{ id: 'admin', label: 'Administrator' }, { id: 'faculty', label: 'Faculty' }].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={activeTab === tab.id ? 'sas-tab-active' : 'sas-tab-inactive'}
                  style={{ flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={submit}>
              {/* Email */}
              <div className="mb-5">
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#888', marginBottom: 7 }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#aaa', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    className="sas-input"
                    type="email"
                    value={data.email}
                    onChange={e => setData('email', e.target.value)}
                    placeholder="admin@school.edu"
                    required
                    autoFocus
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '11px 12px 11px 36px',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                      background: '#f9f9f9', border: '0.5px solid rgba(0,0,0,0.1)',
                      borderRadius: 8, color: '#0f1117', transition: 'border-color 0.15s',
                    }}
                  />
                </div>
                {errors.email && <p style={{ marginTop: 4, fontSize: 12, color: '#e24b4a' }}>{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="mb-5">
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#888', marginBottom: 7 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#aaa', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    className="sas-input"
                    type={showPassword ? 'text' : 'password'}
                    value={data.password}
                    onChange={e => setData('password', e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '11px 36px 11px 36px',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                      background: '#f9f9f9', border: '0.5px solid rgba(0,0,0,0.1)',
                      borderRadius: 8, color: '#0f1117', transition: 'border-color 0.15s',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0, display: 'flex' }}
                  >
                    {showPassword ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {errors.password && <p style={{ marginTop: 4, fontSize: 12, color: '#e24b4a' }}>{errors.password}</p>}
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between mb-6">
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#888', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={data.remember}
                    onChange={e => setData('remember', e.target.checked)}
                    style={{ width: 14, height: 14, accentColor: '#0f1117' }}
                  />
                  Remember me
                </label>
                <Link
                  href={route('password.request')}
                  className="sas-forgot"
                  style={{ fontSize: 12, color: '#888', textDecoration: 'none', borderBottom: '0.5px solid rgba(0,0,0,0.15)', paddingBottom: 1, transition: 'all 0.15s' }}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={processing}
                className="sas-submit"
                style={{
                  width: '100%', padding: '12px',
                  background: '#0f1117', color: '#fff',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                  letterSpacing: '0.04em', border: 'none', borderRadius: 8,
                  cursor: processing ? 'not-allowed' : 'pointer',
                  opacity: processing ? 0.5 : 1, transition: 'opacity 0.15s',
                }}
              >
                {processing ? 'Signing in…' : 'Sign in to dashboard'}
              </button>
            </form>

            {/* Register Link Below Form */}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: '#888' }}>Don't have an account? </span>
              <Link
                href={route('register')}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#0f1117',
                  textDecoration: 'none',
                  borderBottom: '0.5px solid #0f1117',
                  paddingBottom: 1,
                  transition: 'all 0.15s',
                }}
              >
                Create account
              </Link>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
              <div style={{ flex: 1, height: '0.5px', background: 'rgba(0,0,0,0.1)' }} />
              <span style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Quick access</span>
              <div style={{ flex: 1, height: '0.5px', background: 'rgba(0,0,0,0.1)' }} />
            </div>

            {/* Alt logins */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                {
                  label: 'Face ID',
                  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
                },
                {
                  label: 'SSO Login',
                  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
                },
              ].map(({ label, icon }) => (
                <button
                  key={label}
                  type="button"
                  className="sas-alt-btn"
                  style={{
                    padding: 9, border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8,
                    background: 'transparent', fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12, color: '#888', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'all 0.15s',
                  }}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div
            className="sas-grid-bg hidden lg:flex flex-col"
            style={{ flex: 1, background: '#0f1117', padding: '44px', position: 'relative', overflow: 'hidden' }}
          >
            {/* Accent circles */}
            <div style={{ position: 'absolute', bottom: -120, right: -80, width: 320, height: 320, border: '0.5px solid rgba(74,222,128,0.15)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: -80, right: -40, width: 200, height: 200, border: '0.5px solid rgba(74,222,128,0.08)', borderRadius: '50%' }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Clock */}
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 38, fontWeight: 400, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1, marginBottom: 4 }}>
                {timeString}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 40 }}>
                {dateString}
              </div>

              {/* System Status */}
              <div style={{ border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '22px 24px', marginBottom: 16, background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
                  System status
                </div>
                {[
                  {
                    label: 'Raspberry Pi',
                    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>,
                    status: 'Connected',
                  },
                  {
                    label: 'Camera Module V2',
                    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
                    status: 'Active',
                  },
                ].map(({ label, icon, status }, i) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: i === 0 ? 12 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                      {icon}{label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                      <div style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 6px rgba(74,222,128,0.5)' }} />
                      {status}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[{ num: '1,247', label: 'Students tracked' }, { num: '89%', label: 'Attendance rate' }].map(({ num, label }) => (
                  <div key={label} style={{ border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '18px 20px', background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 400, color: '#fff', lineHeight: 1, marginBottom: 4 }}>{num}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Live Feed */}
              <div style={{ border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '18px 20px', background: 'rgba(255,255,255,0.03)', flex: 1 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>
                  Live activity
                </div>
                {[
                  { name: 'John Doe — CS101', time: '09:15' },
                  { name: 'Jane Smith — MATH202', time: '09:22' },
                  { name: 'Mike Johnson — PHY150', time: '09:30' },
                ].map(({ name, time }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 5, height: 5, background: '#4ade80', borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{name}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{time}</div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ marginTop: 'auto', paddingTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
                Secure · Real-time · Face Recognition
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}