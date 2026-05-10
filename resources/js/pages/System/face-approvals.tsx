import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    ScanFace,
    CheckCircle,
    X,
    Clock,
    Search,
    Filter,
    ChevronDown,
    User,
    Eye,
    AlertTriangle,
    RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface FaceApproval {
    id: number;
    user_id: number;
    name: string;
    email: string;
    role: string;
    face_image_url: string;
    submitted_at: string;
    status: ApprovalStatus;
    rejection_reason?: string;
}

interface Props {
    approvals: FaceApproval[];
    stats: {
        pending: number;
        approved: number;
        rejected: number;
        total: number;
    };
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'System', href: '/system' },
    { title: 'Face Approvals', href: '/system/face-approvals' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
    btnPrimary: {
        height: 36,
        padding: '0 16px',
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'inherit',
        background: '#111827',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
    } as React.CSSProperties,

    btnGhost: {
        height: 34,
        padding: '0 14px',
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'inherit',
        background: '#fff',
        color: '#374151',
        border: '1px solid #D1D5DB',
        borderRadius: 8,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
    } as React.CSSProperties,

    btnApprove: {
        height: 32,
        padding: '0 14px',
        fontSize: 12,
        fontWeight: 500,
        fontFamily: 'inherit',
        background: '#EAF3DE',
        color: '#3B6D11',
        border: '1px solid #C0DD97',
        borderRadius: 7,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        transition: 'all 0.15s',
    } as React.CSSProperties,

    btnReject: {
        height: 32,
        padding: '0 14px',
        fontSize: 12,
        fontWeight: 500,
        fontFamily: 'inherit',
        background: '#FCEBEB',
        color: '#A32D2D',
        border: '1px solid #F7C1C1',
        borderRadius: 7,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        transition: 'all 0.15s',
    } as React.CSSProperties,
};

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ApprovalStatus }) {
    const map = {
        pending:  { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', icon: <Clock size={10} />,        label: 'Pending'  },
        approved: { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', icon: <CheckCircle size={10} />, label: 'Approved' },
        rejected: { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', icon: <X size={10} />,            label: 'Rejected' },
    };
    const c = map[status];
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
            {c.icon}
            {c.label}
        </span>
    );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ val, label, color, bg, icon }: { val: number; label: string; color: string; bg: string; icon: React.ReactNode }) {
    return (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
            </div>
            <div>
                <p style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>{val}</p>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>{label}</p>
            </div>
        </div>
    );
}

// ─── Image preview modal ──────────────────────────────────────────────────────
function ImageModal({ approval, onClose }: { approval: FaceApproval; onClose: () => void }) {
    return (
        <div
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            >
                {/* Modal header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#185FA5' }}>
                            {approval.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>{approval.name}</p>
                            <p style={{ fontSize: 12, color: '#6B7280', margin: 0, fontFamily: 'monospace' }}>{approval.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4, borderRadius: 6 }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Image */}
                <div style={{ background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <img
                        src={approval.face_image_url}
                        alt={`${approval.name} face photo`}
                        style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 10, border: '1px solid #E5E7EB' }}
                    />
                </div>

                {/* Meta */}
                <div style={{ padding: '14px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                        Submitted {approval.submitted_at}
                    </div>
                    <StatusBadge status={approval.status} />
                </div>
            </div>
        </div>
    );
}

// ─── Rejection modal ──────────────────────────────────────────────────────────
function RejectModal({ approval, onClose, onConfirm }: { approval: FaceApproval; onClose: () => void; onConfirm: (reason: string) => void }) {
    const [reason, setReason] = useState('');
    const presets = ['Photo is blurry or unclear', 'Face not clearly visible', 'Multiple faces in photo', 'Inappropriate content', 'Wrong person in photo'];

    return (
        <div
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
            >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #FCA5A5', background: '#FEF2F2', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={18} color="#991B1B" />
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#991B1B', margin: 0 }}>Reject photo — {approval.name}</p>
                </div>

                <div style={{ padding: 20 }}>
                    <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Select a reason or write a custom one:</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                        {presets.map((p) => (
                            <button
                                key={p}
                                onClick={() => setReason(p)}
                                style={{
                                    padding: '8px 12px',
                                    fontSize: 13,
                                    fontFamily: 'inherit',
                                    textAlign: 'left',
                                    background: reason === p ? '#FEE2E2' : '#F9FAFB',
                                    border: reason === p ? '1px solid #FCA5A5' : '1px solid #E5E7EB',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    color: reason === p ? '#991B1B' : '#374151',
                                    transition: 'all 0.12s',
                                }}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Or write a custom reason…"
                        rows={3}
                        style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', border: '1px solid #D1D5DB', borderRadius: 8, resize: 'none', outline: 'none', color: '#111827', boxSizing: 'border-box' }}
                    />

                    <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                        <button onClick={onClose} style={s.btnGhost}>Cancel</button>
                        <button
                            onClick={() => onConfirm(reason)}
                            disabled={!reason.trim()}
                            style={{ ...s.btnReject, height: 36, padding: '0 18px', fontSize: 13, opacity: reason.trim() ? 1 : 0.5, cursor: reason.trim() ? 'pointer' : 'not-allowed' }}
                        >
                            <X size={14} />
                            Reject photo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FaceApprovals({ approvals = [], stats = { pending: 0, approved: 0, rejected: 0, total: 0 } }: Props) {
    const [filter, setFilter]           = useState<ApprovalStatus | 'all'>('pending');
    const [search, setSearch]           = useState('');
    const [previewItem, setPreviewItem] = useState<FaceApproval | null>(null);
    const [rejectItem, setRejectItem]   = useState<FaceApproval | null>(null);
    const [processing, setProcessing]   = useState<number | null>(null);

    // ── Actions ───────────────────────────────────────────────────────────────
    const handleApprove = (approval: FaceApproval) => {
        setProcessing(approval.id);
        router.post(`/system/face-approvals/${approval.id}/approve`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(null),
        });
    };

    const handleReject = (approval: FaceApproval, reason: string) => {
        setProcessing(approval.id);
        setRejectItem(null);
        router.post(`/system/face-approvals/${approval.id}/reject`, { reason }, {
            preserveScroll: true,
            onFinish: () => setProcessing(null),
        });
    };

    // ── Filtering ─────────────────────────────────────────────────────────────
    const filtered = approvals.filter((a) => {
        const matchesFilter = filter === 'all' || a.status === filter;
        const matchesSearch = search === '' ||
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.email.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Face Approvals" />

            <style>{`
                button:hover { filter: brightness(0.96); }
                button:active { transform: scale(0.98); }
                input:focus { border-color: #111827 !important; box-shadow: 0 0 0 3px rgba(17,24,39,0.08) !important; outline: none; }
            `}</style>

            <div style={{ padding: '28px 32px', maxWidth: 1100, fontFamily: 'inherit' }}>

                {/* ── Page header ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ScanFace size={22} color="#185FA5" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
                                Face Approvals
                            </h1>
                            <p style={{ fontSize: 13, color: '#6B7280', margin: 0, marginTop: 3 }}>
                                Review and approve student face recognition photos
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.reload()}
                        style={s.btnGhost}
                    >
                        <RefreshCw size={13} />
                        Refresh
                    </button>
                </div>

                {/* ── Stats ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 28 }}>
                    <StatCard val={stats.pending}  label="Pending review" color="#92400E" bg="#FEF3C7" icon={<Clock size={20} color="#D97706" />} />
                    <StatCard val={stats.approved} label="Approved"        color="#065F46" bg="#D1FAE5" icon={<CheckCircle size={20} color="#059669" />} />
                    <StatCard val={stats.rejected} label="Rejected"        color="#991B1B" bg="#FEE2E2" icon={<X size={20} color="#DC2626" />} />
                    <StatCard val={stats.total}    label="Total submitted" color="#1E40AF" bg="#DBEAFE" icon={<User size={20} color="#2563EB" />} />
                </div>

                {/* ── Filter bar ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                        <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                        <input
                            type="text"
                            placeholder="Search by name or email…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ height: 36, width: '100%', padding: '0 12px 0 34px', fontSize: 13, fontFamily: 'inherit', border: '1px solid #D1D5DB', borderRadius: 8, color: '#111827', background: '#fff', boxSizing: 'border-box', outline: 'none' }}
                        />
                    </div>

                    {/* Status filters */}
                    <div style={{ display: 'flex', gap: 6 }}>
                        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    height: 34,
                                    padding: '0 14px',
                                    fontSize: 12,
                                    fontWeight: 500,
                                    fontFamily: 'inherit',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    border: filter === f ? '1px solid #111827' : '1px solid #D1D5DB',
                                    background: filter === f ? '#111827' : '#fff',
                                    color: filter === f ? '#fff' : '#374151',
                                    transition: 'all 0.12s',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                {f === 'pending' && <Clock size={11} />}
                                {f === 'approved' && <CheckCircle size={11} />}
                                {f === 'rejected' && <X size={11} />}
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                {f !== 'all' && (
                                    <span style={{ fontSize: 10, fontWeight: 700, background: filter === f ? 'rgba(255,255,255,0.2)' : '#F3F4F6', color: filter === f ? '#fff' : '#6B7280', borderRadius: 10, padding: '1px 6px' }}>
                                        {f === 'pending' ? stats.pending : f === 'approved' ? stats.approved : stats.rejected}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Table ── */}
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                    {/* Table head */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', gap: 0, padding: '11px 20px', background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                        {['Student', 'Email', 'Role', 'Submitted', 'Status'].map((h) => (
                            <span key={h} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B7280' }}>{h}</span>
                        ))}
                    </div>

                    {/* Rows */}
                    {filtered.length === 0 ? (
                        <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                            <ScanFace size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
                            <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>No submissions found</p>
                            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
                                {filter === 'pending' ? 'No pending approvals — you\'re all caught up!' : 'Try adjusting your filters.'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((approval, i) => (
                            <div
                                key={approval.id}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
                                    alignItems: 'center',
                                    gap: 0,
                                    padding: '14px 20px',
                                    borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none',
                                    background: processing === approval.id ? '#FAFAFA' : '#fff',
                                    transition: 'background 0.1s',
                                    opacity: processing === approval.id ? 0.6 : 1,
                                }}
                            >
                                {/* Student */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {/* Face thumbnail */}
                                    <div
                                        onClick={() => setPreviewItem(approval)}
                                        style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E7EB', cursor: 'pointer', flexShrink: 0, position: 'relative', background: '#F3F4F6' }}
                                        title="Click to preview"
                                    >
                                        <img src={approval.face_image_url} alt={approval.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.35)'; (e.currentTarget.querySelector('svg') as SVGElement | null)!.style.opacity = '1'; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0)'; (e.currentTarget.querySelector('svg') as SVGElement | null)!.style.opacity = '0'; }}
                                        >
                                            <Eye size={14} color="#fff" style={{ opacity: 0, transition: 'opacity 0.15s' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>{approval.name}</p>
                                        {approval.rejection_reason && (
                                            <p style={{ fontSize: 11, color: '#DC2626', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <AlertTriangle size={10} />
                                                {approval.rejection_reason}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Email */}
                                <span style={{ fontSize: 13, color: '#6B7280', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {approval.email}
                                </span>

                                {/* Role */}
                                <span style={{ display: 'inline-flex', alignItems: 'center', width: 'fit-content', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: '#DBEAFE', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
                                    {approval.role.charAt(0).toUpperCase() + approval.role.slice(1)}
                                </span>

                                {/* Submitted */}
                                <span style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>
                                    {approval.submitted_at}
                                </span>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    {approval.status === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => handleApprove(approval)}
                                                disabled={processing === approval.id}
                                                style={s.btnApprove}
                                                title="Approve"
                                            >
                                                <CheckCircle size={13} />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => setRejectItem(approval)}
                                                disabled={processing === approval.id}
                                                style={s.btnReject}
                                                title="Reject"
                                            >
                                                <X size={13} />
                                                Reject
                                            </button>
                                        </>
                                    ) : (
                                        <StatusBadge status={approval.status} />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Result count */}
                {filtered.length > 0 && (
                    <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12, textAlign: 'right' }}>
                        Showing {filtered.length} of {approvals.length} submissions
                    </p>
                )}
            </div>

            {/* ── Modals ── */}
            {previewItem && (
                <ImageModal approval={previewItem} onClose={() => setPreviewItem(null)} />
            )}
            {rejectItem && (
                <RejectModal
                    approval={rejectItem}
                    onClose={() => setRejectItem(null)}
                    onConfirm={(reason) => handleReject(rejectItem, reason)}
                />
            )}
        </AppLayout>
    );
}
