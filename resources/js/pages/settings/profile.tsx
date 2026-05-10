import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, useState, useEffect } from 'react';

import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Camera, CheckCircle, Clock, Pencil, Shield, X, Eye, EyeOff, Lock, Mail, User, AlertTriangle, Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'info' | 'faceid' | 'security' | 'danger';
type FaceStatus = 'none' | 'pending' | 'approved' | 'rejected';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Profile settings', href: '/settings/profile' },
];

const pillStyle: Record<string, React.CSSProperties> = {
    present: { background: '#EAF3DE', color: '#3B6D11' },
    absent:  { background: '#FCEBEB', color: '#A32D2D' },
    late:    { background: '#FAEEDA', color: '#854F0B' },
};

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
    input: {
        height: 40,
        padding: '0 12px 0 36px',
        fontSize: 14,
        fontFamily: 'inherit',
        backgroundColor: '#FFFFFF',
        border: '1px solid #D1D5DB',
        borderRadius: 8,
        color: '#111827',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box' as const,
        transition: 'border-color 0.15s, box-shadow 0.15s',
    } as React.CSSProperties,

    inputNoIcon: {
        height: 40,
        padding: '0 12px',
        fontSize: 14,
        fontFamily: 'inherit',
        backgroundColor: '#FFFFFF',
        border: '1px solid #D1D5DB',
        borderRadius: 8,
        color: '#111827',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box' as const,
        transition: 'border-color 0.15s, box-shadow 0.15s',
    } as React.CSSProperties,

    inputIcon: {
        position: 'absolute',
        left: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#9CA3AF',
        pointerEvents: 'none',
    } as React.CSSProperties,

    btnPrimary: {
        height: 38,
        padding: '0 20px',
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'inherit',
        background: '#111827',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'opacity 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
    } as React.CSSProperties,

    btnGhost: {
        height: 36,
        padding: '0 16px',
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'inherit',
        background: '#FFFFFF',
        color: '#374151',
        border: '1px solid #D1D5DB',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
    } as React.CSSProperties,

    card: {
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    } as React.CSSProperties,

    cardDanger: {
        background: '#FFFFFF',
        border: '1px solid #FCA5A5',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    } as React.CSSProperties,

    cardHead: {
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#FAFAFA',
    } as React.CSSProperties,

    cardHeadDanger: {
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #FCA5A5',
        backgroundColor: '#FEF2F2',
    } as React.CSSProperties,

    cardBody: {
        padding: 20,
    } as React.CSSProperties,

    fieldLabel: {
        fontSize: 12,
        fontWeight: 600,
        color: '#374151',
        marginBottom: 4,
    } as React.CSSProperties,

    sectionLabel: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        color: '#6B7280',
    } as React.CSSProperties,

    inputWrapper: {
        position: 'relative',
    } as React.CSSProperties,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function TabButton({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon?: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? '#111827' : '#6B7280',
                cursor: 'pointer',
                borderBottom: active ? '2px solid #111827' : '2px solid transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                marginBottom: -1,
                background: 'none',
                fontFamily: 'inherit',
                transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
            }}
        >
            {icon}
            {label}
        </button>
    );
}

function Card({ label, badge, children, danger = false }: { label: string; badge?: React.ReactNode; children: React.ReactNode; danger?: boolean }) {
    return (
        <div style={danger ? s.cardDanger : s.card}>
            <div style={danger ? s.cardHeadDanger : s.cardHead}>
                <span style={{ ...s.sectionLabel, color: danger ? '#991B1B' : '#6B7280' }}>{label}</span>
                {badge}
            </div>
            <div style={s.cardBody}>{children}</div>
        </div>
    );
}

function Field({ label, error, children, full = false }: { label: string; error?: string; children: React.ReactNode; full?: boolean }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: full ? 'span 2' : undefined }}>
            <label style={s.fieldLabel}>{label}</label>
            {children}
            {error && <span style={{ fontSize: 11, color: '#DC2626', marginTop: 2 }}>{error}</span>}
        </div>
    );
}

function StatusBadge({ status }: { status: FaceStatus }) {
    const map: Record<string, { bg: string; color: string; border: string; icon: React.ReactNode; label: string }> = {
        pending:  { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', icon: <Clock size={10} />,        label: 'Pending approval'     },
        approved: { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', icon: <CheckCircle size={10} />, label: 'Approved'              },
        rejected: { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', icon: <X size={10} />,            label: 'Rejected — re-upload'  },
    };
    const c = map[status];
    if (!c) return null;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
            {c.icon}
            {c.label}
        </span>
    );
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const recentActivity = [
    { status: 'present', label: 'Checked in — Computer Science 301', course: 'CS301', description: 'Main lecture hall A', time: 'Today 08:42' },
    { status: 'present', label: 'Checked in — Mathematics 201',      course: 'MATH201', description: 'Room 204, Building B', time: 'Yesterday 10:15' },
    { status: 'absent',  label: 'Absent — Physics Lab',              course: 'PHY150',  description: 'Lab session missed',     time: 'Mon 14:00' },
    { status: 'present', label: 'Checked in — English Literature',   course: 'ENG101',  description: 'Seminar room 3',         time: 'Fri 09:00' },
    { status: 'late',    label: 'Late — Data Structures',            course: 'CS202',   description: 'Late by 10 minutes',     time: 'Thu 08:55' },
];
const dotColor: Record<string, string> = { present: '#059669', absent: '#DC2626', late: '#D97706' };

// ─── Main component ───────────────────────────────────────────────────────────
export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    const [activeTab, setActiveTab]       = useState<Tab>('overview');
    const [facePreview, setFacePreview]   = useState<string | null>(auth.user.face_image_url || null);
    const [faceStatus, setFaceStatus]     = useState<FaceStatus>((auth.user.face_status as FaceStatus) || 'none');
    const [uploading, setUploading]       = useState(false);
    const [faceDetecting, setFaceDetecting] = useState(false);
    const [faceError, setFaceError]       = useState<string | null>(null);

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: auth.user.name,
        email: auth.user.email,
    });

    // ── Load face-api.js models ───────────────────────────────────────────────
    useEffect(() => {
        const loadModels = async () => {
            try {
                const faceapi = await import('face-api.js');
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                setModelsLoaded(true);
                console.log('✅ Face detection models loaded');
            } catch (err) {
                console.error('Failed to load face detection models:', err);
            }
        };
        loadModels();
    }, []);

    // ── Face detection function ───────────────────────────────────────────────
    const detectFace = async (file: File): Promise<boolean> => {
        try {
            const faceapi = await import('face-api.js');
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = async () => {
                    const detections = await faceapi.detectAllFaces(
                        img,
                        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
                    );
                    resolve(detections.length === 1);
                };
                img.onerror = () => resolve(false);
                img.src = URL.createObjectURL(file);
            });
        } catch {
            return false;
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    const handleFaceUpload = async (file: File) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('face_image', file);
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        try {
            const res    = await fetch('/profile/upload-face', { method: 'POST', body: formData, headers: { 'X-CSRF-TOKEN': csrfToken || '', Accept: 'application/json' } });
            const result = await res.json();
            if (result.success) { setFacePreview(result.url); setFaceStatus('pending'); window.location.reload(); }
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    // ── Updated handleFileChange with face detection ──────────────────────────
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset errors and show preview immediately
        setFaceError(null);
        setFaceDetecting(true);
        const reader = new FileReader();
        reader.onloadend = () => setFacePreview(reader.result as string);
        reader.readAsDataURL(file);

        // Run face detection
        try {
            const hasFace = await detectFace(file);
            if (!hasFace) {
                setFaceError('No face detected. Please upload a clear, front-facing photo.');
                setFacePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setFaceDetecting(false);
                return;
            }
            // Face found — proceed with upload
            setFaceDetecting(false);
            handleFaceUpload(file);
        } catch {
            setFaceError('Could not analyse image. Please try again.');
            setFacePreview(null);
            setFaceDetecting(false);
        }
    };

    const initials = getInitials(auth.user.name);

    const tabs: { id: Tab; label: string; icon?: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview',      icon: <Shield size={14} /> },
        { id: 'info',     label: 'Personal info',  icon: <User size={14} />  },
        { id: 'faceid',   label: 'Face ID',        icon: <Camera size={14} /> },
        { id: 'security', label: 'Security',       icon: <Lock size={14} />  },
        { id: 'danger',   label: 'Account',        icon: <AlertTriangle size={14} /> },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <style>{`
                input:focus {
                    border-color: #111827 !important;
                    box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.1) !important;
                }
                input:hover {
                    border-color: #9CA3AF;
                }
                button:hover {
                    filter: brightness(0.95);
                }
                button:active {
                    transform: scale(0.98);
                }
            `}</style>

            <SettingsLayout>
                <div style={{ maxWidth: 720, fontFamily: 'inherit' }}>

                    {/* ── Identity header ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #DBEAFE 0%, #D1FAE5 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 26,
                                    fontWeight: 700,
                                    color: '#1E40AF',
                                    overflow: 'hidden',
                                    border: '3px solid #E5E7EB',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                }}
                            >
                                {faceStatus === 'approved' && facePreview
                                    ? <img src={facePreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : initials
                                }
                            </div>
                            <span style={{
                                position: 'absolute',
                                bottom: 3,
                                right: 3,
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                background: '#059669',
                                border: '3px solid #FFFFFF',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            }} />
                        </div>

                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#111827', marginBottom: 4 }}>
                                {auth.user.name}
                            </p>
                            <p style={{ fontSize: 13, color: '#6B7280', fontFamily: "'SF Mono', 'DM Mono', monospace", marginBottom: 10 }}>
                                {auth.user.email}
                            </p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: '#DBEAFE', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
                                    <Shield size={10} />
                                    {auth.user.role?.charAt(0).toUpperCase() + auth.user.role?.slice(1) || 'Member'}
                                </span>
                                {faceStatus !== 'none' && <StatusBadge status={faceStatus} />}
                            </div>
                        </div>

                        <button onClick={() => setActiveTab('info')} style={s.btnGhost}>
                            <Pencil size={13} />
                            Edit
                        </button>
                    </div>

                    <div style={{ height: '1px', background: '#E5E7EB', marginBottom: 0 }} />

                    {/* ── Tabs ── */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: 24}}>
                        {tabs.map((t) => (
                            <TabButton key={t.id} label={t.label} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} icon={t.icon} />
                        ))}
                    </div>

                    {/* ══ Overview ════════════════════════════════════════════════ */}
                    {activeTab === 'overview' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
                                {[
                                    { val: '94%', lbl: 'Attendance', sub: 'Above average', color: '#3B6D11', bg: '#EAF3DE' },
                                    { val: '38',  lbl: 'Days present', sub: 'This semester', color: '#185FA5', bg: '#E6F1FB' },
                                    { val: '2',   lbl: 'Absences',    sub: 'Within limit',  color: '#A32D2D', bg: '#FCEBEB' },
                                ].map((stat) => (
                                    <div key={stat.lbl} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="2" strokeLinecap="round">
                                                {stat.lbl === 'Attendance' && <polyline points="20 6 9 17 4 12" />}
                                                {stat.lbl === 'Days present' && <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>}
                                                {stat.lbl === 'Absences' && <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>}
                                            </svg>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <span style={{ fontSize: 22, fontWeight: 600, lineHeight: 1, color: stat.color }}>{stat.val}</span>
                                            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>{stat.lbl}</span>
                                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{stat.sub}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Card label="Recent activity">
                                {recentActivity.map((a, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, width: 72, justifyContent: 'center', ...pillStyle[a.status] }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor[a.status] }} />
                                            {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                                        </span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.course}</div>
                                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{a.description}</div>
                                        </div>
                                        <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{a.time}</span>
                                    </div>
                                ))}
                            </Card>
                        </div>
                    )}

                    {/* ══ Personal info ═══════════════════════════════════════════ */}
                    {activeTab === 'info' && (
                        <Card label="Personal information">
                            <form onSubmit={submit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                    <Field label="Full name" error={errors.name}>
                                        <div style={s.inputWrapper}>
                                            <User size={14} style={s.inputIcon} />
                                            <input style={s.input} value={data.name} onChange={(e) => setData('name', e.target.value)} required autoComplete="name" placeholder="Your full name" />
                                        </div>
                                    </Field>
                                    <Field label="Email address" error={errors.email}>
                                        <div style={s.inputWrapper}>
                                            <Mail size={14} style={s.inputIcon} />
                                            <input style={s.input} type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required autoComplete="username" placeholder="you@example.com" />
                                        </div>
                                    </Field>
                                </div>

                                {mustVerifyEmail && auth.user.email_verified_at === null && (
                                    <div style={{ marginBottom: 16, padding: '12px 16px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, fontSize: 13, color: '#92400E' }}>
                                        <strong>Email not verified.</strong>{' '}
                                        <Link href={route('verification.send')} method="post" as="button" style={{ fontWeight: 700, textDecoration: 'underline', color: '#92400E' }}>
                                            Resend verification email
                                        </Link>
                                        {status === 'verification-link-sent' && (
                                            <p style={{ marginTop: 6, color: '#065F46', fontWeight: 500 }}>✓ Verification link sent.</p>
                                        )}
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <button type="submit" disabled={processing} style={{ ...s.btnPrimary, opacity: processing ? 0.6 : 1 }}>
                                        {processing ? 'Saving...' : 'Save changes'}
                                    </button>
                                    <Transition show={recentlySuccessful} enter="transition ease-in-out duration-200" enterFrom="opacity-0" leave="transition ease-in-out duration-200" leaveTo="opacity-0">
                                        <span style={{ fontSize: 13, color: '#059669', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <CheckCircle size={14} />
                                            Saved
                                        </span>
                                    </Transition>
                                </div>
                            </form>
                        </Card>
                    )}

                    {/* ══ Face ID ═══════════════════════════════════════════════════ */}
                    {activeTab === 'faceid' && (
                        <Card label="Face recognition image" badge={faceStatus !== 'none' ? <StatusBadge status={faceStatus} /> : undefined}>
                            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        width: 120, height: 120, borderRadius: 12,
                                        border: facePreview ? '2px solid #D1D5DB' : '2px dashed #D1D5DB',
                                        background: '#F9FAFB',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', overflow: 'hidden', position: 'relative', flexShrink: 0,
                                        transition: 'border-color 0.15s',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#111827'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = facePreview ? '#D1D5DB' : '#D1D5DB'; }}
                                >
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                    {facePreview ? (
                                        <>
                                            <img src={facePreview} alt="Face preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            {(uploading || faceDetecting) && (
                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                                                    <Loader2 size={20} color="#fff" className="animate-spin" />
                                                    <span style={{ color: '#fff', fontSize: 11, fontWeight: 500 }}>
                                                        {faceDetecting ? 'Detecting face…' : 'Uploading…'}
                                                    </span>
                                                </div>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setFacePreview(null); setFaceStatus('none'); setFaceError(null); }}
                                                style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                                            >
                                                <X size={12} color="#fff" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Camera size={24} color="#9CA3AF" />
                                            <span style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', marginTop: 6, textAlign: 'center', lineHeight: 1.3 }}>
                                                Upload<br />photo
                                            </span>
                                        </>
                                    )}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 18px' }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Photo Requirements</p>
                                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {['Clear front-facing photo, well lit', 'Plain or simple background', 'No sunglasses or face coverings', 'JPEG or PNG, max 5 MB'].map((req) => (
                                                <li key={req} style={{ fontSize: 13, color: '#4B5563', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#9CA3AF', flexShrink: 0 }} />
                                                    {req}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    {faceStatus === 'pending' && (
                                        <div style={{ marginTop: 12, padding: '12px 16px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, fontSize: 13, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Clock size={14} />
                                            Under review. Usually takes 1–2 hours.
                                        </div>
                                    )}
                                    {faceStatus === 'rejected' && (
                                        <div style={{ marginTop: 12, padding: '12px 16px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10, fontSize: 13, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <AlertTriangle size={14} />
                                            Photo rejected. Please upload a new one.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Detection feedback ──────────────────────────────── */}
                            {faceDetecting && (
                                <div style={{ marginTop: 12, padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 13, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Loader2 size={14} className="animate-spin" />
                                    Analysing image for a face…
                                </div>
                            )}

                            {faceError && (
                                <div style={{ marginTop: 12, padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 13, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <AlertTriangle size={14} />
                                    {faceError}
                                </div>
                            )}

                            {facePreview && !faceDetecting && !faceError && (
                                <div style={{ marginTop: 16 }}>
                                    <button onClick={() => fileInputRef.current?.click()} style={s.btnGhost}>Replace photo</button>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* ══ Security ══════════════════════════════════════════════════ */}
                    {activeTab === 'security' && (
                        <>
                            <Card label="Change password">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                    <Field label="Current password" full>
                                        <div style={s.inputWrapper}>
                                            <Lock size={14} style={s.inputIcon} />
                                            <input style={s.input} type={showPassword ? 'text' : 'password'} defaultValue="••••••••••" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </Field>
                                    <div />
                                    <Field label="New password">
                                        <input style={{ ...s.inputNoIcon, paddingRight: 36 }} type="password" placeholder="Min. 8 characters" />
                                    </Field>
                                    <Field label="Confirm new password">
                                        <input style={{ ...s.inputNoIcon, paddingRight: 36 }} type="password" placeholder="Repeat new password" />
                                    </Field>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button style={s.btnPrimary}>Update password</button>
                                    <button style={s.btnGhost}>Cancel</button>
                                </div>
                            </Card>

                            <Card label="Two-factor authentication (2FA)">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Authenticator app</p>
                                        <p style={{ fontSize: 13, color: '#6B7280' }}>Add an extra layer of security to your account.</p>
                                    </div>
                                    <button style={s.btnGhost}>Set up</button>
                                </div>
                            </Card>
                        </>
                    )}

                    {/* ══ Danger ════════════════════════════════════════════════════ */}
                    {activeTab === 'danger' && (
                        <Card label="Danger zone" danger>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Delete account</p>
                                    <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                                        Permanently delete your account and all associated data. This action cannot be undone.
                                    </p>
                                </div>
                                <div style={{ marginLeft: 24, flexShrink: 0 }}>
                                    <DeleteUser />
                                </div>
                            </div>
                        </Card>
                    )}

                </div>
            </SettingsLayout>
        </AppLayout>
    );
}