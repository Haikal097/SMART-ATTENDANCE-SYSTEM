import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { CalendarDays, Clock, MapPin, Users, CheckCircle, ChevronRight, ClipboardList } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Take Attendance', href: '/lecturer/attendance/take' },
];

interface Session {
    id: number;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    room: string;
    time: string;
    start_block: number;
    status: string;
    enrolled: number;
    present: number;
    recorded: boolean;
}

interface Props {
    sessions: Session[];
    date: string;
}

const PALETTE = [
    { bg: '#EDE9FE', color: '#6D28D9' },
    { bg: '#DBEAFE', color: '#1D4ED8' },
    { bg: '#D1FAE5', color: '#065F46' },
    { bg: '#FCE7F3', color: '#BE185D' },
    { bg: '#FEF3C7', color: '#92400E' },
    { bg: '#FFEDD5', color: '#C2410C' },
    { bg: '#E0F2FE', color: '#0369A1' },
    { bg: '#F0FDF4', color: '#15803D' },
];

const STATUS_CFG: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    ongoing:   { bg: '#DCFCE7', color: '#166534', dot: '#22C55E', label: 'Ongoing'   },
    scheduled: { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6', label: 'Scheduled' },
    completed: { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF', label: 'Completed' },
};

export default function TakeAttendance() {
    const { sessions, date } = usePage<any>().props as Props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Take Attendance" />
            <style>{`
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
                .session-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important; transform: translateY(-1px); }
                .session-card { transition: box-shadow 0.15s, transform 0.15s; }
            `}</style>

            <div style={{ padding: '24px', fontFamily: 'ui-sans-serif, system-ui, sans-serif', maxWidth: 800 }}>

                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Take Attendance</h1>
                    <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>{date}</p>
                </div>

                {sessions.length === 0 ? (
                    <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 16, padding: '64px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                            <CalendarDays size={24} color="#D1D5DB" />
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>No sessions today</p>
                        <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>Your scheduled sessions will appear here on their day.</p>
                        <Link href="/lecturer/timetable" style={{ display: 'inline-block', marginTop: 16, fontSize: 13, fontWeight: 600, color: '#7C3AED', textDecoration: 'none' }}>
                            View timetable →
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {sessions.map((s, idx) => {
                            const pal = PALETTE[idx % PALETTE.length];
                            const sc  = STATUS_CFG[s.status] ?? STATUS_CFG.scheduled;
                            const rate = s.enrolled > 0 ? Math.round((s.present / s.enrolled) * 100) : 0;

                            return (
                                <Link
                                    key={s.id}
                                    href={`/subjects/${s.subject_id}/sessions/${s.id}/attendance`}
                                    className="session-card"
                                    style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 16, padding: '20px 22px', textDecoration: 'none', display: 'block', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        {/* Subject badge */}
                                        <div style={{ width: 48, height: 48, borderRadius: 13, background: pal.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <span style={{ fontSize: 12, fontWeight: 800, color: pal.color }}>{s.subject_code.replace(/[^A-Z0-9]/gi, '').slice(0, 4)}</span>
                                        </div>

                                        {/* Main info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{s.subject_code}</span>
                                                <span style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.subject_name}</span>
                                                {/* Status badge */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 20, background: sc.bg, marginLeft: 'auto', flexShrink: 0 }}>
                                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot, display: 'inline-block', animation: s.status === 'ongoing' ? 'pulse 1.5s infinite' : 'none' }} />
                                                    <span style={{ fontSize: 10, fontWeight: 600, color: sc.color }}>{sc.label}</span>
                                                </div>
                                            </div>

                                            {/* Meta row */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <Clock size={12} color="#9CA3AF" />
                                                    <span style={{ fontSize: 12, color: '#6B7280' }}>{s.time}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <MapPin size={12} color="#9CA3AF" />
                                                    <span style={{ fontSize: 12, color: '#6B7280' }}>{s.room}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <Users size={12} color="#9CA3AF" />
                                                    <span style={{ fontSize: 12, color: '#6B7280' }}>{s.enrolled} students</span>
                                                </div>
                                            </div>

                                            {/* Progress bar (only if attendance recorded) */}
                                            {s.recorded && (
                                                <div style={{ marginTop: 10 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>
                                                        <span>{s.present} attended</span>
                                                        <span style={{ fontWeight: 600, color: rate >= 75 ? '#059669' : '#D97706' }}>{rate}%</span>
                                                    </div>
                                                    <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${rate}%`, background: rate >= 75 ? '#22C55E' : '#F59E0B', borderRadius: 2 }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right side */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                            {s.recorded ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#059669' }}>
                                                    <CheckCircle size={15} />
                                                    <span style={{ fontSize: 12, fontWeight: 600 }}>Recorded</span>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#7C3AED' }}>
                                                    <ClipboardList size={15} />
                                                    <span style={{ fontSize: 12, fontWeight: 600 }}>Take now</span>
                                                </div>
                                            )}
                                            <ChevronRight size={16} color="#D1D5DB" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
