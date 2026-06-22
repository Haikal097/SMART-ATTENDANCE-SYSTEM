import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, ScanFace } from 'lucide-react';

interface Activity {
    name: string;
    subject_code: string;
    time: string;
}

interface Props {
    totalStudents: number;
    avgAttendance: number;
    recentActivity: Activity[];
}

interface PiStatus {
    online: boolean;
    camera_running: boolean;
    faces_loaded: number;
}

export default function Welcome({ totalStudents, avgAttendance, recentActivity }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [currentTime, setCurrentTime]   = useState(new Date());
    const [piStatus, setPiStatus]         = useState<PiStatus | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const check = async () => {
            try {
                const res  = await fetch('/api/pi-status-public');
                const data = await res.json();
                setPiStatus(data);
            } catch {
                setPiStatus({ online: false, camera_running: false, faces_loaded: 0 });
            }
        };
        check();
        const t = setInterval(check, 15000);
        return () => clearInterval(t);
    }, []);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    const timeStr = currentTime.toLocaleTimeString('en-US', { hour12: false });
    const dateStr = currentTime.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });


    return (
        <>
            <Head title="Sign in — SmartAttend" />

            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #F1F5F9; }
                .w-input { width: 100%; height: 46px; padding: 0 42px 0 40px; font-size: 14px; font-family: inherit; border: 1.5px solid #E5E7EB; border-radius: 10px; outline: none; background: #fff; color: #111827; transition: border-color 0.15s, box-shadow 0.15s; }
                .w-input:focus { border-color: #111827; box-shadow: 0 0 0 3px rgba(17,24,39,0.08); }
                .w-input.err { border-color: #FCA5A5; }
                .w-input-plain { padding-left: 12px; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
                @media (max-width: 900px) { .w-right-panel { display: none !important; } .w-card { max-width: 460px !important; } }
            `}</style>

            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                <div style={{ display: 'flex', width: '100%', maxWidth: 920, borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.14)', border: '1px solid rgba(0,0,0,0.06)' }}>

                    {/* ── Left: login form ── */}
                    <div className="w-card" style={{ flex: '0 0 420px', background: '#fff', padding: '44px 48px', display: 'flex', flexDirection: 'column' }}>

                        {/* Brand */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                <div style={{ width: 32, height: 32, background: '#111827', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <ScanFace size={17} color="white" />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', color: '#111827' }}>SmartAttend</span>
                                <span style={{ width: 6, height: 6, background: 'rgba(255,255,255,0.6)', borderRadius: '50%', marginBottom: 6, display: 'inline-block', animation: 'pulse 2s infinite' }} />
                            </div>
                        </div>

                        {/* Heading */}
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 4 }}>
                            Welcome back
                        </h1>
                        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>
                            Sign in to access your dashboard
                        </p>


                        <form onSubmit={submit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            {/* Email */}
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 6 }}>Email</label>
                                <div style={{ position: 'relative' }}>
                                    <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9CA3AF', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    <input
                                        className={`w-input${errors.email ? ' err' : ''}`}
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="your@email.com"
                                        autoFocus
                                        autoComplete="email"
                                    />
                                </div>
                                {errors.email && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280' }}>Password</label>
                                    <Link href={route('password.request')} style={{ fontSize: 11, color: '#6B7280', textDecoration: 'none', borderBottom: '1px solid #E5E7EB', paddingBottom: 1 }}>
                                        Forgot?
                                    </Link>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9CA3AF', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <input
                                        className={`w-input${errors.password ? ' err' : ''}`}
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, display: 'flex' }}>
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                {errors.password && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>{errors.password}</p>}
                            </div>

                            {/* Remember */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                                <input type="checkbox" id="remember" checked={data.remember} onChange={(e) => setData('remember', e.target.checked as false)} style={{ width: 15, height: 15, accentColor: '#111827', cursor: 'pointer', flexShrink: 0 }} />
                                <label htmlFor="remember" style={{ fontSize: 12, color: '#6B7280', cursor: 'pointer', userSelect: 'none' }}>Keep me signed in</label>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                style={{ width: '100%', height: 48, background: processing ? '#374151' : '#111827', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s', letterSpacing: '-0.01em' }}
                            >
                                {processing
                                    ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</>
                                    : 'Sign in to dashboard'
                                }
                            </button>
                        </form>

                    </div>

                    {/* ── Right: live system panel ── */}
                    <div className="w-right-panel" style={{ flex: 1, background: '#0A0A0A', padding: '44px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                        {/* Blobs */}
                        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', bottom: -60, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.02)', pointerEvents: 'none' }} />

                        {/* Clock */}
                        <div style={{ marginBottom: 32 }}>
                            <div style={{ fontFamily: "'SF Mono','DM Mono',monospace", fontSize: 42, fontWeight: 500, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 4 }}>
                                {timeStr}
                            </div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                                {dateStr}
                            </div>
                        </div>

                        {/* System status */}
                        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px', marginBottom: 14, background: 'rgba(255,255,255,0.04)' }}>
                            <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>System status</p>
                            {(() => {
                                const checking = piStatus === null;
                                const rows = [
                                    {
                                        label:  'Raspberry Pi',
                                        on:     piStatus?.online ?? null,
                                        active: 'Connected',
                                        off:    'Disconnected',
                                    },
                                    {
                                        label:  'Camera Module V2',
                                        on:     piStatus?.camera_running ?? null,
                                        active: 'Active',
                                        off:    'Inactive',
                                    },
                                    {
                                        label:  'Face Recognition',
                                        on:     piStatus ? (piStatus.faces_loaded > 0) : null,
                                        active: 'Online',
                                        off:    'Standby',
                                    },
                                ];
                                return rows.map((item, i) => {
                                    const isOn   = item.on === true;
                                    const dotColor = checking || item.on === null
                                        ? 'rgba(255,255,255,0.3)'
                                        : isOn ? '#22C55E' : '#EF4444';
                                    const label = checking || item.on === null
                                        ? '—'
                                        : isOn ? item.active : item.off;
                                    return (
                                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: i < 2 ? 10 : 0 }}>
                                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{item.label}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ width: 6, height: 6, background: dotColor, borderRadius: '50%', animation: isOn && !checking ? 'pulse 2s infinite' : 'none' }} />
                                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{label}</span>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                            {[
                                { num: totalStudents.toLocaleString(), label: 'Students enrolled' },
                                { num: `${avgAttendance}%`,            label: 'Avg attendance'    },
                            ].map(({ num, label }) => (
                                <div key={label} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 18px', background: 'rgba(255,255,255,0.04)' }}>
                                    <p style={{ fontFamily: "'SF Mono','DM Mono',monospace", fontSize: 26, fontWeight: 500, color: '#fff', lineHeight: 1, marginBottom: 4 }}>{num}</p>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.03em' }}>{label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Live activity */}
                        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px', background: 'rgba(255,255,255,0.04)', flex: 1 }}>
                            <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Live activity</p>
                            {recentActivity.length === 0 ? (
                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>No recent activity</p>
                            ) : recentActivity.map((a, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                    <div style={{ width: 5, height: 5, background: 'rgba(255,255,255,0.5)', borderRadius: '50%', flexShrink: 0 }} />
                                    <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name} — {a.subject_code}</span>
                                    <span style={{ fontFamily: "'SF Mono','DM Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{a.time}</span>
                                </div>
                            ))}
                        </div>

                        <p style={{ marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.05em' }}>
                            Secure · Real-time · Face Recognition
                        </p>
                    </div>

                </div>
            </div>
        </>
    );
}
