import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { BookOpen, Users, CalendarCheck, TrendingUp, AlertTriangle, ScanFace } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/lecturer/reports' },
];

interface SubjectStat {
    id: number; code: string; name: string;
    enrolled: number; sessions: number;
    total: number; present: number; late: number; absent: number; rate: number;
}
interface TrendDay  { label: string; total: number; present: number; rate: number | null; }
interface AtRisk    { id: number; name: string; student_id: string; subject_code: string; total: number; present: number; absent: number; rate: number; }
interface Summary   { subjects: number; students: number; sessions: number; overallRate: number; }
interface Props     { summary: Summary; subjectStats: SubjectStat[]; trend: TrendDay[]; atRisk: AtRisk[]; }

const PALETTE = [
    { bg: '#EDE9FE', color: '#6D28D9', bar: '#7C3AED' },
    { bg: '#DBEAFE', color: '#1D4ED8', bar: '#2563EB' },
    { bg: '#D1FAE5', color: '#065F46', bar: '#059669' },
    { bg: '#FCE7F3', color: '#BE185D', bar: '#DB2777' },
    { bg: '#FEF3C7', color: '#92400E', bar: '#D97706' },
    { bg: '#FFEDD5', color: '#C2410C', bar: '#EA580C' },
    { bg: '#E0F2FE', color: '#0369A1', bar: '#0284C7' },
    { bg: '#F0FDF4', color: '#15803D', bar: '#16A34A' },
];

function rateColor(r: number) {
    if (r >= 80) return { color: '#065F46', bg: '#D1FAE5', bar: '#059669' };
    if (r >= 60) return { color: '#92400E', bg: '#FEF3C7', bar: '#D97706' };
    return          { color: '#991B1B', bg: '#FEE2E2', bar: '#EF4444' };
}

function MiniBar({ rate, color }: { rate: number; color: string }) {
    return (
        <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden', flex: 1 }}>
            <div style={{ height: '100%', width: `${rate}%`, background: color, borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
    );
}

function TrendChart({ trend }: { trend: TrendDay[] }) {
    const max = Math.max(...trend.map(d => d.total), 1);
    const labeled = trend.filter((_, i) => i % 5 === 0);
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
                {trend.map((d, i) => (
                    <div key={i} title={`${d.label}: ${d.rate ?? 0}%`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <div style={{ width: '100%', borderRadius: 3, background: d.rate === null ? '#F3F4F6' : d.rate >= 80 ? '#BBF7D0' : d.rate >= 60 ? '#FDE68A' : '#FEE2E2', height: `${Math.max((d.total / max) * 64, d.total > 0 ? 4 : 2)}px`, transition: 'height 0.3s' }} />
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {labeled.map((d, i) => (
                    <span key={i} style={{ fontSize: 10, color: '#9CA3AF' }}>{d.label}</span>
                ))}
            </div>
        </div>
    );
}

export default function LecturerReports() {
    const { summary, subjectStats, trend, atRisk } = usePage<any>().props as Props;

    const summaryCards = [
        { label: 'My Subjects',     value: summary.subjects,    icon: <BookOpen size={16} color="#7C3AED" />,    bg: '#F5F3FF' },
        { label: 'Total Students',  value: summary.students,    icon: <Users size={16} color="#2563EB" />,       bg: '#EFF6FF' },
        { label: 'Total Sessions',  value: summary.sessions,    icon: <CalendarCheck size={16} color="#059669" />, bg: '#F0FDF4' },
        { label: 'Overall Rate',    value: `${summary.overallRate}%`, icon: <TrendingUp size={16} color={rateColor(summary.overallRate).color} />, bg: rateColor(summary.overallRate).bg },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />
            <div style={{ padding: '24px', fontFamily: 'ui-sans-serif, system-ui, sans-serif', maxWidth: 1100 }}>

                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Reports & Analytics</h1>
                    <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>Attendance overview across your subjects</p>
                </div>

                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                    {summaryCards.map(({ label, value, icon, bg }) => (
                        <div key={label} style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>{icon}</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
                            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Trend + at-risk row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, marginBottom: 16 }}>

                    {/* 30-day trend */}
                    <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <TrendingUp size={14} color="#6B7280" />
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>30-Day Attendance Trend</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {[{ color: '#BBF7D0', label: '≥80%' }, { color: '#FDE68A', label: '60–79%' }, { color: '#FEE2E2', label: '<60%' }].map(l => (
                                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                                        <span style={{ fontSize: 10, color: '#9CA3AF' }}>{l.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <TrendChart trend={trend} />
                    </div>

                    {/* At-risk students */}
                    <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle size={14} color="#D97706" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>At-Risk Students</span>
                            <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 20, marginLeft: 'auto' }}>
                                &lt; 80%
                            </span>
                        </div>
                        {atRisk.length === 0 ? (
                            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                                    <TrendingUp size={18} color="#059669" />
                                </div>
                                <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', margin: 0 }}>All students on track</p>
                                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>No one below 80% attendance</p>
                            </div>
                        ) : (
                            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                                {atRisk.map((s, i) => {
                                    const rc = rateColor(s.rate);
                                    return (
                                        <div key={`${s.id}-${s.subject_code}`} style={{ padding: '10px 18px', borderBottom: i < atRisk.length - 1 ? '1px solid #F9FAFB' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                                                    {s.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                                                </span>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                                                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{s.student_id} · {s.subject_code}</div>
                                            </div>
                                            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: rc.bg, color: rc.color, flexShrink: 0 }}>{s.rate}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Per-subject breakdown */}
                <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BookOpen size={14} color="#7C3AED" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Subject Breakdown</span>
                    </div>
                    {subjectStats.length === 0 ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                            <ScanFace size={28} style={{ display: 'block', margin: '0 auto 10px', color: '#E5E7EB' }} />
                            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>No subjects assigned</p>
                        </div>
                    ) : (
                        <div>
                            {subjectStats.map((s, idx) => {
                                const p   = PALETTE[idx % PALETTE.length];
                                const rc  = rateColor(s.rate);
                                return (
                                    <div key={s.id} style={{ padding: '16px 20px', borderBottom: idx < subjectStats.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            {/* Subject badge */}
                                            <div style={{ width: 44, height: 44, borderRadius: 11, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <span style={{ fontSize: 11, fontWeight: 800, color: p.color }}>{s.code.replace(/[^A-Z0-9]/gi, '').slice(0, 4)}</span>
                                            </div>

                                            {/* Name + meta */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                    <Link href={`/subjects/${s.id}`} style={{ fontSize: 14, fontWeight: 600, color: '#111827', textDecoration: 'none' }}>{s.code}</Link>
                                                    <span style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                    <MiniBar rate={s.rate} color={p.bar} />
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: rc.color, flexShrink: 0 }}>{s.rate}%</span>
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
                                                {[
                                                    { label: 'Students',  value: s.enrolled },
                                                    { label: 'Sessions',  value: s.sessions },
                                                    { label: 'Present',   value: s.present  },
                                                    { label: 'Late',      value: s.late     },
                                                    { label: 'Absent',    value: s.absent   },
                                                ].map(({ label, value }) => (
                                                    <div key={label} style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{value}</div>
                                                        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </AppLayout>
    );
}
