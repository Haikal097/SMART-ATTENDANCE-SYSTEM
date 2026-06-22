import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Eye, EyeOff, Lock, Loader2, Mail, ScanFace, ShieldCheck, BarChart3, Bell } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { type SharedData } from '@/types';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

const FEATURES = [
    { icon: ScanFace,    text: 'Face ID check-in in under 2 seconds'       },
    { icon: BarChart3,   text: 'Real-time attendance dashboards'             },
    { icon: Bell,        text: 'Automated alerts for at-risk students'       },
    { icon: ShieldCheck, text: 'Secure, role-based access control'          },
];

export default function Login({ status, canResetPassword }: { status?: string; canResetPassword: boolean }) {
    const { name } = usePage<SharedData>().props;
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });
    const [showPw, setShowPw] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <>
            <Head title="Sign in" />

            <style>{`
                * { box-sizing: border-box; }
                body { margin: 0; }
                .auth-input { width: 100%; height: 46px; padding: 0 12px 0 40px; font-size: 14px; font-family: inherit; border: 1.5px solid #E5E7EB; border-radius: 10px; outline: none; background: #fff; color: #111827; transition: border-color 0.15s, box-shadow 0.15s; }
                .auth-input:focus { border-color: #111827; box-shadow: 0 0 0 3px rgba(17,24,39,0.08); }
                .auth-input.error { border-color: #FCA5A5; }
                .auth-input-plain { padding-left: 12px; }
                @media (max-width: 768px) { .auth-left { display: none !important; } .auth-right { padding: 32px 24px !important; } }
            `}</style>

            <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>

                {/* ── Left branding panel ── */}
                <div className="auth-left" style={{
                    width: '44%', flexShrink: 0,
                    background: '#0A0A0A',
                    display: 'flex', flexDirection: 'column',
                    padding: '48px 52px', position: 'relative', overflow: 'hidden',
                }}>
                    {/* Decorative blobs */}
                    <div style={{ position: 'absolute', top: -100, right: -100, width: 380, height: 380, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -80, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.02)', pointerEvents: 'none' }} />

                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ScanFace size={20} color="#0A0A0A" />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>{name}</span>
                    </div>

                    {/* Hero text */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 40 }}>
                        <h2 style={{ fontSize: 34, fontWeight: 800, color: 'white', lineHeight: 1.2, margin: '0 0 14px', letterSpacing: '-0.03em' }}>
                            Smart attendance,<br />effortlessly managed.
                        </h2>
                        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, margin: '0 0 36px', maxWidth: 320 }}>
                            Face recognition powered check-ins, real-time analytics, and automated reporting — all in one place.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {FEATURES.map(({ icon: Icon, text }) => (
                                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon size={16} color="rgba(255,255,255,0.7)" />
                                    </div>
                                    <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', margin: 0 }}>
                        © {new Date().getFullYear()} {name}. All rights reserved.
                    </p>
                </div>

                {/* ── Right form panel ── */}
                <div className="auth-right" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', padding: '48px 40px' }}>
                    <div style={{ width: '100%', maxWidth: 400 }}>

                        {/* Mobile logo (hidden on desktop via media query) */}
                        <div style={{ display: 'none' }} className="mobile-logo">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ScanFace size={16} color="white" />
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{name}</span>
                            </div>
                        </div>

                        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', margin: '0 0 8px' }}>Welcome back</p>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', margin: '0 0 6px' }}>Sign in to your account</h1>
                        <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 32px' }}>Enter your credentials to continue</p>

                        {status && (
                            <div style={{ marginBottom: 20, padding: '12px 16px', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 13, color: '#374151', fontWeight: 500 }}>
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit}>
                            {/* Email */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                                    <input
                                        className={`auth-input${errors.email ? ' error' : ''}`}
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="you@university.edu"
                                        autoFocus
                                        autoComplete="email"
                                    />
                                </div>
                                {errors.email && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 5 }}>{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Password</label>
                                    {canResetPassword && (
                                        <Link href={route('password.request')} style={{ fontSize: 12, color: '#111827', textDecoration: 'none', fontWeight: 500 }}>
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                                    <input
                                        className={`auth-input${errors.password ? ' error' : ''}`}
                                        style={{ paddingRight: 42 }}
                                        type={showPw ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Your password"
                                        autoComplete="current-password"
                                    />
                                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, display: 'flex' }}>
                                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                {errors.password && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 5 }}>{errors.password}</p>}
                            </div>

                            {/* Remember me */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 26 }}>
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    style={{ width: 16, height: 16, accentColor: '#111827', cursor: 'pointer', flexShrink: 0 }}
                                />
                                <label htmlFor="remember" style={{ fontSize: 13, color: '#6B7280', cursor: 'pointer', userSelect: 'none' }}>
                                    Keep me signed in
                                </label>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                style={{
                                    width: '100%', height: 48,
                                    background: processing ? '#374151' : '#111827',
                                    color: 'white', border: 'none', borderRadius: 10,
                                    fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    transition: 'background 0.15s',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                                }}
                            >
                                {processing
                                    ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</>
                                    : 'Sign in'
                                }
                            </button>
                        </form>

                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </>
    );
}
