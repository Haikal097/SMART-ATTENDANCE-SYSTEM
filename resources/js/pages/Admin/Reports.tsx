import { type ReactNode } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    Users, BookOpen, CalendarCheck, TrendingUp,
    AlertTriangle, CheckCircle, ScanFace,
    QrCode, UserCheck, BarChart3, Activity,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrendDay {
    date: string;
    label: string;
    total: number;
    present: number;
    rate: number | null;
}

interface SubjectStat {
    id: number;
    code: string;
    name: string;
    status: string;
    enrolled: number;
    sessions: number;
    total: number;
    present: number;
    late: number;
    absent: number;
    rate: number;
}

interface MethodStat {
    method: string;
    count: number;
}

interface DayStat {
    day: string;
    total: number;
    present: number;
    rate: number;
}

interface AtRiskStudent {
    id: number;
    name: string;
    student_id: string;
    total: number;
    present: number;
    late: number;
    absent: number;
    rate: number;
}

interface Summary {
    totalStudents: number;
    activeSubjects: number;
    totalSessions: number;
    overallRate: number;
    totalAtt: number;
    presentAll: number;
}

interface Props {
    summary: Summary;
    trend: TrendDay[];
    subjectStats: SubjectStat[];
    methods: MethodStat[];
    dayStats: DayStat[];
    atRisk: AtRiskStudent[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Reports & Analytics', href: '/reports' },
];

const PALETTE = [
    { bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE' },
    { bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
    { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
    { bg: '#FCE7F3', color: '#BE185D', border: '#FBCFE8' },
    { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
    { bg: '#FFEDD5', color: '#C2410C', border: '#FED7AA' },
    { bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' },
    { bg: '#F0FDF4', color: '#15803D', border: '#86EFAC' },
];

const METHOD_CFG: Record<string, { label: string; icon: ReactNode; color: string; bg: string; border: string }> = {
    face:    { label: 'Face ID',  icon: <ScanFace size={13} />,   color: '#6D28D9', bg: '#EDE9FE', border: '#DDD6FE' },
    qr:      { label: 'QR Code',  icon: <QrCode size={13} />,     color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE' },
    manual:  { label: 'Manual',   icon: <UserCheck size={13} />,  color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7' },
    unknown: { label: 'Unknown',  icon: <BarChart3 size={13} />,  color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' },
};

function rateColor(rate: number) {
    return rate >= 80 ? '#10B981' : rate >= 60 ? '#F59E0B' : '#EF4444';
}
function rateBg(rate: number) {
    return rate >= 80 ? '#D1FAE5' : rate >= 60 ? '#FEF3C7' : '#FEE2E2';
}
function rateLabel(rate: number) {
    return rate >= 80 ? 'Good' : rate >= 60 ? 'At risk' : 'Critical';
}

// ─── Trend Chart (SVG) ────────────────────────────────────────────────────────
function TrendChart({ trend }: { trend: TrendDay[] }) {
    const W = 800, H = 130;
    const PAD = { top: 12, right: 8, bottom: 28, left: 32 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;
    const n = trend.length;
    const slotW = chartW / n;
    const barW = Math.max(3, slotW - 2);

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }} preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(v => {
                const y = PAD.top + chartH - (v / 100) * chartH;
                return (
                    <g key={v}>
                        <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#F3F4F6" strokeWidth={1} />
                        <text x={PAD.left - 4} y={y + 3} fontSize={8} fill="#9CA3AF" textAnchor="end">{v}</text>
                    </g>
                );
            })}

            {/* Bars */}
            {trend.map((d, i) => {
                const x = PAD.left + i * slotW + (slotW - barW) / 2;
                if (d.rate === null) {
                    return (
                        <rect key={i} x={x} y={PAD.top + chartH - 4} width={barW} height={4}
                            fill="#F3F4F6" rx={1} />
                    );
                }
                const barH = Math.max(2, (d.rate / 100) * chartH);
                const y = PAD.top + chartH - barH;
                const color = rateColor(d.rate);
                return (
                    <g key={i}>
                        <rect x={x} y={y} width={barW} height={barH} fill={color} rx={2} opacity={0.82} />
                        <title>{`${d.label}: ${d.rate}% (${d.present}/${d.total})`}</title>
                    </g>
                );
            })}

            {/* X labels every 5 days */}
            {trend.map((d, i) => {
                if (i % 5 !== 0 && i !== n - 1) return null;
                const x = PAD.left + i * slotW + slotW / 2;
                return (
                    <text key={i} x={x} y={H - 6} fontSize={8} fill="#9CA3AF" textAnchor="middle">
                        {d.label}
                    </text>
                );
            })}
        </svg>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminReports({ summary, trend, subjectStats, methods, dayStats, atRisk }: Props) {
    const totalMethods = methods.reduce((a, m) => a + m.count, 0);
    const maxDayTotal  = Math.max(...dayStats.map(d => d.total), 1);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports & Analytics" />

            <div style={{ padding: '24px 28px', maxWidth: 1200, fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
                            Reports & Analytics
                        </h1>
                        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>
                            Attendance insights across all subjects and students
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Activity size={14} color="#9CA3AF" />
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Last 30 days trend</span>
                    </div>
                </div>

                {/* ── Summary cards ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {[
                        { label: 'Total Students',   val: summary.totalStudents,  icon: <Users size={18} />,         bg: '#EDE9FE', color: '#6D28D9' },
                        { label: 'Active Subjects',  val: summary.activeSubjects, icon: <BookOpen size={18} />,      bg: '#DBEAFE', color: '#1D4ED8' },
                        { label: 'Sessions Held',    val: summary.totalSessions,  icon: <CalendarCheck size={18} />, bg: '#D1FAE5', color: '#065F46' },
                        { label: 'Overall Rate',     val: `${summary.overallRate}%`, icon: <TrendingUp size={18} />, bg: summary.overallRate >= 80 ? '#D1FAE5' : summary.overallRate >= 60 ? '#FEF3C7' : '#FEE2E2', color: rateColor(summary.overallRate) },
                    ].map(card => (
                        <div key={card.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, flexShrink: 0 }}>
                                {card.icon}
                            </div>
                            <div>
                                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{card.label}</p>
                                <p style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.15 }}>{card.val}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Attendance Trend ── */}
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TrendingUp size={15} color="#6D28D9" />
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Attendance Trend</span>
                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>· past 30 days</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            {[
                                { color: '#10B981', label: '≥ 80% Good' },
                                { color: '#F59E0B', label: '60–79% At risk' },
                                { color: '#EF4444', label: '< 60% Critical' },
                            ].map(l => (
                                <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6B7280' }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: 'inline-block' }} />
                                    {l.label}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div style={{ padding: '16px 20px 8px' }}>
                        <TrendChart trend={trend} />
                    </div>
                    <div style={{ padding: '8px 20px 14px', display: 'flex', gap: 20 }}>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>
                            <span style={{ fontWeight: 600, color: '#111827' }}>{summary.presentAll.toLocaleString()}</span> present records
                        </span>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>
                            <span style={{ fontWeight: 600, color: '#111827' }}>{summary.totalAtt.toLocaleString()}</span> total records
                        </span>
                        <span style={{ fontSize: 11, color: rateColor(summary.overallRate) }}>
                            <span style={{ fontWeight: 600 }}>{summary.overallRate}%</span> overall attendance rate
                        </span>
                    </div>
                </div>

                {/* ── Middle row: Subject performance + Side panel ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

                    {/* Subject Performance */}
                    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BookOpen size={15} color="#1D4ED8" />
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Subject Performance</span>
                            <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>{subjectStats.length} subjects</span>
                        </div>

                        {subjectStats.length === 0 ? (
                            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No subjects found</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                                            {['Subject', 'Enrolled', 'Sessions', 'Present', 'Late', 'Absent', 'Rate'].map(h => (
                                                <th key={h} style={{ padding: '8px 14px', textAlign: h === 'Subject' ? 'left' : 'center', fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subjectStats.map((s, i) => {
                                            const pal = PALETTE[i % PALETTE.length];
                                            return (
                                                <tr key={s.id} style={{ borderBottom: '1px solid #F9FAFB' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    <td style={{ padding: '10px 14px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ width: 8, height: 8, borderRadius: 2, background: pal.bg, border: `1px solid ${pal.border}`, display: 'inline-block', flexShrink: 0 }} />
                                                            <div>
                                                                <p style={{ fontWeight: 600, color: pal.color, margin: 0, fontSize: 12 }}>{s.code}</p>
                                                                <p style={{ color: '#6B7280', margin: 0, fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#374151', fontWeight: 500 }}>{s.enrolled}</td>
                                                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#374151' }}>{s.sessions}</td>
                                                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                        <span style={{ color: '#059669', fontWeight: 500 }}>{s.present}</span>
                                                    </td>
                                                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                        <span style={{ color: '#D97706' }}>{s.late}</span>
                                                    </td>
                                                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                        <span style={{ color: '#DC2626' }}>{s.absent}</span>
                                                    </td>
                                                    <td style={{ padding: '10px 14px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 90 }}>
                                                            <div style={{ flex: 1, height: 5, background: '#F3F4F6', borderRadius: 3 }}>
                                                                <div style={{ height: '100%', width: `${s.rate}%`, background: rateColor(s.rate), borderRadius: 3 }} />
                                                            </div>
                                                            <span style={{ fontSize: 11, fontWeight: 600, color: rateColor(s.rate), width: 32, textAlign: 'right' }}>{s.rate}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Side panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                        {/* Check-in Methods */}
                        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
                            <div style={{ padding: '13px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 7 }}>
                                <CheckCircle size={14} color="#065F46" />
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Check-in Methods</span>
                            </div>
                            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {methods.length === 0 ? (
                                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, textAlign: 'center', padding: '8px 0' }}>No data</p>
                                ) : (
                                    methods.map(m => {
                                        const cfg = METHOD_CFG[m.method] ?? METHOD_CFG.unknown;
                                        const pct = totalMethods > 0 ? Math.round((m.count / totalMethods) * 100) : 0;
                                        return (
                                            <div key={m.method}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: cfg.color }}>
                                                        {cfg.icon} {cfg.label}
                                                    </span>
                                                    <span style={{ fontSize: 11, color: '#6B7280' }}>
                                                        {m.count.toLocaleString()} <span style={{ color: cfg.color, fontWeight: 600 }}>({pct}%)</span>
                                                    </span>
                                                </div>
                                                <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3 }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, background: cfg.color, borderRadius: 3, opacity: 0.8, transition: 'width 0.4s' }} />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Day-of-week pattern */}
                        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
                            <div style={{ padding: '13px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 7 }}>
                                <CalendarCheck size={14} color="#0369A1" />
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Day Pattern</span>
                            </div>
                            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {dayStats.map(d => (
                                    <div key={d.day} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', width: 28 }}>{d.day}</span>
                                        <div style={{ flex: 1, height: 16, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${d.total > 0 ? (d.total / maxDayTotal) * 100 : 0}%`,
                                                background: d.rate >= 80 ? '#10B981' : d.rate >= 60 ? '#F59E0B' : d.total === 0 ? '#E5E7EB' : '#EF4444',
                                                borderRadius: 4,
                                                opacity: 0.7,
                                                transition: 'width 0.4s',
                                            }} />
                                            {d.total > 0 && (
                                                <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 600, color: '#fff', lineHeight: 1 }}>
                                                    {d.rate}%
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: 10, color: '#9CA3AF', width: 28, textAlign: 'right' }}>{d.total}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── At-risk students ── */}
                {atRisk.length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle size={15} color="#D97706" />
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>At-Risk Students</span>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', marginLeft: 4 }}>
                                {atRisk.length} student{atRisk.length !== 1 ? 's' : ''} below 80%
                            </span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                                        {['Student', 'ID', 'Sessions', 'Present', 'Late', 'Absent', 'Rate', ''].map(h => (
                                            <th key={h} style={{ padding: '8px 14px', textAlign: h === 'Student' ? 'left' : 'center', fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {atRisk.map(s => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid #F9FAFB' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#FFFBEB')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={{ padding: '10px 14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: 7, background: rateBg(s.rate), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: rateColor(s.rate), flexShrink: 0 }}>
                                                        {s.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight: 500, color: '#111827' }}>{s.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center', color: '#6B7280', fontFamily: 'monospace', fontSize: 11 }}>{s.student_id}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center', color: '#374151', fontWeight: 500 }}>{s.total}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center' }}><span style={{ color: '#059669', fontWeight: 500 }}>{s.present}</span></td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center' }}><span style={{ color: '#D97706' }}>{s.late}</span></td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center' }}><span style={{ color: '#DC2626', fontWeight: 500 }}>{s.absent}</span></td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 90 }}>
                                                    <div style={{ flex: 1, height: 5, background: '#F3F4F6', borderRadius: 3 }}>
                                                        <div style={{ height: '100%', width: `${s.rate}%`, background: rateColor(s.rate), borderRadius: 3 }} />
                                                    </div>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: rateColor(s.rate), width: 32, textAlign: 'right' }}>{s.rate}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: rateBg(s.rate), color: rateColor(s.rate), border: `1px solid ${rateColor(s.rate)}33` }}>
                                                    {rateLabel(s.rate)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {atRisk.length === 15 && (
                            <div style={{ padding: '10px 20px', borderTop: '1px solid #F3F4F6', textAlign: 'center' }}>
                                <Link href="/students" style={{ fontSize: 12, color: '#6D28D9', textDecoration: 'none', fontWeight: 500 }}>
                                    View all students →
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {atRisk.length === 0 && (
                    <div style={{ background: '#F0FDF4', border: '1px solid #6EE7B7', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CheckCircle size={20} color="#059669" />
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#065F46', margin: 0 }}>All students above threshold</p>
                            <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>No students currently below 80% attendance rate</p>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
