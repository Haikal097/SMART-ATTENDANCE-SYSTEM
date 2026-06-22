import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { CalendarDays, Users, CheckCircle, Clock, ScanFace, UserCheck, Activity } from 'lucide-react';

const POLL_MS = 8000;
const PI_POLL_MS = 15000;

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Today's Activity", href: '/attendance/today' },
];

interface SessionCard {
    id: number;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    room: string;
    time: string;
    start_block: number;
    end_block: number;
    status: string;
    enrolled: number;
    present: number;
    late: number;
    absent: number;
}

interface FeedItem {
    id: number;
    student_db_id: number | null;
    student_name: string;
    student_id: string;
    subject_code: string;
    session_id: number;
    time: string;
    status: 'present' | 'late' | 'absent';
    method: string;
}

interface Stats {
    total_sessions: number;
    total: number;
    present: number;
    late: number;
    absent: number;
    face_id: number;
}

interface Props {
    sessions: SessionCard[];
    feed: FeedItem[];
    stats: Stats;
    date: string;
}

const STATUS_CFG = {
    present: { bg: '#DCFCE7', color: '#166534', label: 'Present' },
    late:    { bg: '#FEF9C3', color: '#854D0E', label: 'Late'    },
    absent:  { bg: '#FEE2E2', color: '#991B1B', label: 'Absent'  },
};

const SESSION_STATUS_CFG: Record<string, { bg: string; color: string; dot: string }> = {
    ongoing:   { bg: '#DCFCE7', color: '#166534', dot: '#22C55E' },
    scheduled: { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
    completed: { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
};

const PALETTE      = ['#EDE9FE','#DBEAFE','#D1FAE5','#FCE7F3','#FEF3C7','#FFEDD5','#E0F2FE','#F0FDF4'];
const PALETTE_TEXT = ['#6D28D9','#1D4ED8','#065F46','#BE185D','#92400E','#C2410C','#0369A1','#15803D'];

export default function TodayActivity() {
    const { sessions, feed, stats, date } = usePage<any>().props as Props;

    const [newIds, setNewIds]   = useState<Set<number>>(new Set());
    const prevIds               = useRef<Set<number>>(new Set(feed.map(f => f.id)));
    const [clock, setClock]     = useState(new Date());
    const [piOnline, setPiOnline] = useState<boolean | null>(null);

    // Clock tick
    useEffect(() => {
        const t = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // Data polling
    useEffect(() => {
        const t = setInterval(() => {
            router.reload({ only: ['sessions', 'feed', 'stats'], preserveUrl: true });
        }, POLL_MS);
        return () => clearInterval(t);
    }, []);

    // Pi status polling
    useEffect(() => {
        const check = async () => {
            try {
                const res  = await fetch('/system/pi-status/api');
                const data = await res.json();
                setPiOnline(data.online === true);
            } catch { setPiOnline(false); }
        };
        check();
        const t = setInterval(check, PI_POLL_MS);
        return () => clearInterval(t);
    }, []);

    // Highlight new feed items
    useEffect(() => {
        const incoming = feed.map(f => f.id);
        const fresh    = incoming.filter(id => !prevIds.current.has(id));
        if (fresh.length) {
            setNewIds(new Set(fresh));
            setTimeout(() => setNewIds(new Set()), 3000);
        }
        prevIds.current = new Set(incoming);
    }, [feed]);

    const piDot   = piOnline === null ? '#9CA3AF' : piOnline ? '#22C55E' : '#EF4444';
    const piLabel = piOnline === null ? 'Checking…' : piOnline ? `Live · ${clock.toLocaleTimeString('en-US', { hour12: false })}` : 'Pi offline';
    const piAnim  = piOnline === true ? 'pulse 1.5s infinite' : 'none';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Today's Activity" />
            <style>{`
                @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
                @keyframes fadein { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
                .feed-new { animation: fadein 0.35s ease; background: #F0FDF4 !important; }
                .session-card { transition: box-shadow 0.15s, transform 0.15s; cursor: pointer; text-decoration: none; display: block; }
                .session-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.10) !important; transform: translateY(-1px); }
                .feed-row { transition: background 0.15s; cursor: pointer; text-decoration: none; display: flex; }
                .feed-row:hover { background: #F9FAFB !important; }
            `}</style>

            <div style={{ padding: '24px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Today's Activity</h1>
                        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>{date}</p>
                    </div>
                    {/* Pi-aware live indicator */}
                    <Link href="/system/pi-status" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6B7280', textDecoration: 'none', padding: '6px 12px', borderRadius: 20, border: '1px solid #E5E7EB', background: '#fff' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: piDot, display: 'inline-block', animation: piAnim }} />
                        {piLabel}
                    </Link>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                        { label: 'Sessions Today', value: stats.total_sessions, icon: <CalendarDays size={15} color="#7C3AED" />, bg: '#F5F3FF' },
                        { label: 'Check-ins',      value: stats.total,          icon: <Users size={15} color="#2563EB" />,        bg: '#EFF6FF' },
                        { label: 'Present',        value: stats.present,        icon: <CheckCircle size={15} color="#059669" />,  bg: '#F0FDF4' },
                        { label: 'Late',           value: stats.late,           icon: <Clock size={15} color="#D97706" />,        bg: '#FFFBEB' },
                        { label: 'Via Face ID',    value: stats.face_id,        icon: <ScanFace size={15} color="#6D28D9" />,     bg: '#EDE9FE' },
                    ].map(({ label, value, icon, bg }) => (
                        <div key={label} style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{icon}</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Sessions + Feed */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

                    {/* Sessions grid */}
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 12px' }}>
                            Sessions — {sessions.length} today
                        </p>

                        {sessions.length === 0 ? (
                            <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, padding: '48px 20px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                                <CalendarDays size={28} style={{ display: 'block', margin: '0 auto 10px', color: '#E5E7EB' }} />
                                <p style={{ fontSize: 14, fontWeight: 500, color: '#374151', margin: 0 }}>No sessions scheduled today</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                                {sessions.map((s, idx) => {
                                    const attendRate = s.enrolled > 0 ? Math.round(((s.present + s.late) / s.enrolled) * 100) : 0;
                                    const sc  = SESSION_STATUS_CFG[s.status] ?? SESSION_STATUS_CFG.scheduled;
                                    const pal = PALETTE[idx % PALETTE.length];
                                    const palT = PALETTE_TEXT[idx % PALETTE_TEXT.length];

                                    return (
                                        <Link
                                            key={s.id}
                                            href={`/subjects/${s.subject_id}/sessions/${s.id}/attendance`}
                                            className="session-card"
                                            style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', color: 'inherit' }}
                                        >
                                            {/* Top row */}
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: pal, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <span style={{ fontSize: 11, fontWeight: 800, color: palT }}>{s.subject_code.replace(/[^A-Z0-9]/gi, '').slice(0, 4)}</span>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{s.subject_code}</div>
                                                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{s.subject_name}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: sc.bg }}>
                                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot, display: 'inline-block', animation: s.status === 'ongoing' ? 'pulse 1.5s infinite' : 'none' }} />
                                                    <span style={{ fontSize: 10, fontWeight: 600, color: sc.color, textTransform: 'capitalize' }}>{s.status}</span>
                                                </div>
                                            </div>

                                            {/* Meta */}
                                            <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                                                <div style={{ fontSize: 11, color: '#6B7280' }}>
                                                    <span style={{ color: '#9CA3AF' }}>Time </span>{s.time}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#6B7280' }}>
                                                    <span style={{ color: '#9CA3AF' }}>Room </span>{s.room}
                                                </div>
                                            </div>

                                            {/* Attendance bar */}
                                            <div style={{ marginBottom: 10 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B7280', marginBottom: 5 }}>
                                                    <span>{s.present + s.late} / {s.enrolled} attended</span>
                                                    <span style={{ fontWeight: 700, color: attendRate >= 75 ? '#059669' : attendRate >= 50 ? '#D97706' : '#DC2626' }}>{attendRate}%</span>
                                                </div>
                                                <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${attendRate}%`, background: attendRate >= 75 ? '#22C55E' : attendRate >= 50 ? '#F59E0B' : '#EF4444', borderRadius: 3, transition: 'width 0.5s' }} />
                                                </div>
                                            </div>

                                            {/* Breakdown pills */}
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {[
                                                    { label: `${s.present} present`, bg: '#DCFCE7', color: '#166534' },
                                                    { label: `${s.late} late`,       bg: '#FEF9C3', color: '#854D0E' },
                                                    { label: `${s.absent} absent`,   bg: '#FEE2E2', color: '#991B1B' },
                                                ].map(p => (
                                                    <span key={p.label} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: p.bg, color: p.color }}>{p.label}</span>
                                                ))}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Live feed */}
                    <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <Activity size={13} color="#6B7280" />
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Live Feed</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: piDot, display: 'inline-block', animation: piAnim }} />
                                <span style={{ fontSize: 10, color: '#9CA3AF' }}>auto-refresh</span>
                            </div>
                        </div>

                        {feed.length === 0 ? (
                            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                                <ScanFace size={24} style={{ display: 'block', margin: '0 auto 8px', color: '#E5E7EB' }} />
                                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>No check-ins yet today</p>
                            </div>
                        ) : (
                            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                                {feed.map((f, i) => {
                                    const sc     = STATUS_CFG[f.status] ?? STATUS_CFG.absent;
                                    const isFace = f.method === 'face' || f.method === 'face_id';
                                    const href   = f.student_db_id ? `/students/${f.student_db_id}` : '#';
                                    return (
                                        <Link
                                            key={f.id}
                                            href={href}
                                            className={`feed-row${newIds.has(f.id) ? ' feed-new' : ''}`}
                                            style={{ padding: '10px 16px', borderBottom: i < feed.length - 1 ? '1px solid #F9FAFB' : 'none', alignItems: 'center', gap: 10, color: 'inherit' }}
                                        >
                                            {/* Avatar */}
                                            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                                                    {f.student_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.student_name}</div>
                                                <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                                                    <span>{f.subject_code}</span>
                                                    {isFace  && <><span>·</span><ScanFace size={10} color="#7C3AED" /></>}
                                                    {!isFace && <><span>·</span><UserCheck size={10} color="#059669" /></>}
                                                </div>
                                            </div>

                                            {/* Time + status */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                                                <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#9CA3AF' }}>{f.time}</span>
                                                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color }}>{sc.label}</span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
