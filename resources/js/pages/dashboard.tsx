import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    Users, BookOpen, CalendarDays, ScanFace,
    Clock, CheckCircle, AlertTriangle, ChevronRight,
    Cpu, TrendingUp, BarChart2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
    totalStudents: number;
    activeSubjects: number;
    todaySessions: number;
    pendingFaceApprovals: number;
}

interface TodayClass {
    id: number;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    time: string;
    status: string;
    room: string;
    enrolled_count: number;
    present_count: number;
    late_count: number;
    lecturer: string;
}

interface AttendanceRecord {
    id: number;
    student_name: string;
    student_id: string;
    subject_code: string;
    checked_in_at: string;
    status: 'present' | 'absent' | 'late';
    method: string;
}

interface TrendDay {
    label: string;
    date: string;
    total: number;
    present: number;
    rate: number;
}

interface WeeklySchedule {
    subject_id: number;
    subject_code: string;
    subject_index: number;
    day_of_week: string;
    start_block: number;
    end_block: number;
    type: string;
    time_range: string;
}

interface Props {
    stats: Stats;
    todayClasses: TodayClass[];
    recentAttendance: AttendanceRecord[];
    weeklyTrend: TrendDay[];
    weeklySchedules: WeeklySchedule[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

const STATUS_PILL: Record<string, { bg: string; color: string; border: string }> = {
    present:  { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
    absent:   { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
    late:     { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
    ongoing:  { bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
    scheduled:{ bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' },
    completed:{ bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
};

const METHOD_LABEL: Record<string, string> = {
    face: 'Face ID', qr: 'QR', manual: 'Manual',
};

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Timetable constants ─────────────────────────────────────────────────────
const TT_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
const TT_DAY_FULL: Record<string, string> = {
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday',
};
const TT_BLOCKS = Array.from({ length: 10 }, (_, i) => {
    const h = 8 + i;
    return { block: i + 1, label: `${h < 12 ? h : h - 12}${h < 12 ? 'am' : 'pm'}`, start: `${String(h).padStart(2,'0')}:00` };
});
const SUBJECT_PALETTE = [
    { bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE' },
    { bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
    { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
    { bg: '#FCE7F3', color: '#BE185D', border: '#FBCFE8' },
    { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
    { bg: '#FFEDD5', color: '#C2410C', border: '#FED7AA' },
    { bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' },
    { bg: '#F0FDF4', color: '#15803D', border: '#86EFAC' },
    { bg: '#FDF4FF', color: '#A21CAF', border: '#F0ABFC' },
    { bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' },
    { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4' },
    { bg: '#FEF9C3', color: '#854D0E', border: '#FEF08A' },
];

// ─── Consolidated timetable grid ──────────────────────────────────────────────
function DashTimetable({ schedules, currentBlock }: { schedules: WeeklySchedule[]; currentBlock: number | null }) {
    const todayName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];

    // day → block → schedule
    const grid: Record<string, Record<number, WeeklySchedule>> = {};
    TT_DAYS.forEach(d => { grid[d] = {}; });
    schedules.forEach(sc => {
        for (let b = sc.start_block; b <= sc.end_block; b++) {
            if (!grid[sc.day_of_week]?.[b]) {
                if (!grid[sc.day_of_week]) grid[sc.day_of_week] = {};
                grid[sc.day_of_week][b] = sc;
            }
        }
    });

    if (schedules.length === 0) {
        return (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                <CalendarDays size={28} style={{ display: 'block', margin: '0 auto 8px', color: '#E5E7EB' }} />
                <p style={{ fontSize: 13, margin: 0 }}>No schedules configured yet</p>
            </div>
        );
    }

    return (
        <div style={{ overflowX: 'auto', padding: '16px 20px' }}>
            {/* Time header */}
            <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(10, 1fr)', gap: 3, marginBottom: 5 }}>
                <div />
                {TT_BLOCKS.map(b => {
                    const isNow = b.block === currentBlock;
                    return (
                        <div key={b.block} style={{ textAlign: 'center', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <span style={{ fontSize: 9, color: isNow ? '#4F46E5' : '#9CA3AF', fontWeight: isNow ? 700 : 400 }}>
                                {b.start}
                            </span>
                            <span style={{ width: isNow ? '60%' : '0%', height: 2, background: '#6366F1', borderRadius: 1, display: 'block', transition: 'width 0.3s' }} />
                        </div>
                    );
                })}
            </div>

            {/* Day rows */}
            {TT_DAYS.map(day => {
                const isToday = day === todayName;
                return (
                    <div key={day} style={{
                        display: 'grid', gridTemplateColumns: '72px repeat(10, 1fr)', gap: 3, marginBottom: 3,
                        background: isToday ? '#FFFBEB' : 'transparent',
                        borderRadius: isToday ? 10 : 0,
                        padding: isToday ? '3px 0' : 0,
                        outline: isToday ? '1.5px solid #FCD34D' : 'none',
                    }}>
                        {/* Day label */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 8, gap: 2 }}>
                            <span style={{ fontSize: 11, fontWeight: isToday ? 700 : 500, color: isToday ? '#92400E' : '#6B7280', lineHeight: 1 }}>
                                {TT_DAY_FULL[day].slice(0, 3)}
                            </span>
                            {isToday && (
                                <span style={{ fontSize: 7, fontWeight: 700, background: '#FCD34D', color: '#78350F', padding: '1px 4px', borderRadius: 3, lineHeight: 1 }}>
                                    TODAY
                                </span>
                            )}
                        </div>

                        {/* Block cells */}
                        {TT_BLOCKS.map(b => {
                            const sc      = grid[day]?.[b.block];
                            const pal     = sc ? SUBJECT_PALETTE[sc.subject_index % SUBJECT_PALETTE.length] : null;
                            const isStart = sc && b.block === sc.start_block;
                            const isNow   = isToday && b.block === currentBlock;

                            const bg     = pal ? pal.bg     : isNow ? '#EEF2FF' : isToday ? 'rgba(253,211,77,0.08)' : '#F9FAFB';
                            const border = pal ? `1px solid ${pal.border}` : isNow ? '1px solid #C7D2FE' : isToday ? '1px dashed rgba(253,211,77,0.4)' : '1px solid #F3F4F6';

                            return (
                                <div key={b.block}
                                    title={sc ? `${sc.subject_code} · ${sc.time_range}` : isNow ? 'Current time block' : undefined}
                                    style={{
                                        height: 36, borderRadius: 6,
                                        background: bg, border,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        overflow: 'hidden', position: 'relative',
                                    }}
                                >
                                    {isStart && sc && pal && (
                                        <span style={{ fontSize: 9, fontWeight: 700, color: pal.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 4px', textAlign: 'center' }}>
                                            {sc.subject_code}
                                        </span>
                                    )}
                                    {/* Small dot in top-right corner for NOW */}
                                    {isNow && (
                                        <span style={{
                                            position: 'absolute', top: 5, right: 5,
                                            width: 6, height: 6, borderRadius: '50%',
                                            background: '#6366F1', display: 'block',
                                        }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}

            {/* Legend */}
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                {[...new Map(schedules.map(s => [s.subject_id, s])).values()].map(s => {
                    const pal = SUBJECT_PALETTE[s.subject_index % SUBJECT_PALETTE.length];
                    return (
                        <span key={s.subject_id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6B7280' }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: pal.bg, border: `1px solid ${pal.border}`, flexShrink: 0, display: 'inline-block' }} />
                            {s.subject_code}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function WeekChart({ trend }: { trend: TrendDay[] }) {
    const maxRate = 100;
    const today   = new Date().toISOString().slice(0, 10);

    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
            {trend.map((d) => {
                const isToday = d.date === today;
                const height  = d.total === 0 ? 4 : Math.max(6, (d.rate / maxRate) * 72);
                return (
                    <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 9, fontFamily: 'monospace', color: d.total === 0 ? '#D1D5DB' : '#6B7280' }}>
                            {d.total === 0 ? '' : `${d.rate}%`}
                        </span>
                        <div
                            title={`${d.label}: ${d.present}/${d.total} present (${d.rate}%)`}
                            style={{
                                width: '100%', height, borderRadius: 4,
                                background: isToday ? '#111827' : d.total === 0 ? '#F3F4F6' : '#DBEAFE',
                                border: isToday ? 'none' : `1px solid ${d.total === 0 ? '#E5E7EB' : '#BFDBFE'}`,
                                transition: 'height 0.3s',
                            }}
                        />
                        <span style={{ fontSize: 9, color: isToday ? '#111827' : '#9CA3AF', fontWeight: isToday ? 700 : 400 }}>
                            {d.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

const STREAM_URL = 'https://raspberrypi.tail1d11cb.ts.net/house/';

function CameraFeed() {
    const [status, setStatus] = useState<'loading' | 'live' | 'offline'>('loading');

    return (
        <div className="d-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Camera Feed</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 20, background: status === 'live' ? '#F0FDF4' : '#F3F4F6', color: status === 'live' ? '#166534' : '#9CA3AF' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', display: 'inline-block', background: status === 'live' ? '#22C55E' : '#D1D5DB', boxShadow: status === 'live' ? '0 0 6px rgba(34,197,94,0.6)' : 'none' }} />
                    {status === 'live' ? 'LIVE' : status === 'loading' ? 'CONNECTING…' : 'OFFLINE'}
                </span>
            </div>
            <div style={{ aspectRatio: '16/9', background: '#0f1117', position: 'relative' }}>
                {status === 'offline' && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
                        </svg>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>NO SIGNAL</span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>Ensure Tailscale is connected</span>
                    </div>
                )}
                <iframe
                    src={STREAM_URL}
                    style={{ width: '100%', height: '100%', border: 'none', display: status === 'offline' ? 'none' : 'block' }}
                    onLoad={() => setStatus('live')}
                    onError={() => setStatus('offline')}
                    allow="autoplay"
                    title="Pi Camera Feed"
                />
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Dashboard({ stats, todayClasses, recentAttendance, weeklyTrend, weeklySchedules }: Props) {
    const [time, setTime] = useState(new Date());
    const [search, setSearch] = useState('');

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const timeStr = time.toLocaleTimeString('en-GB', { hour12: false });
    const dateStr = time.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const currentHour  = time.getHours();
    const currentBlock = currentHour >= 8 && currentHour < 18 ? currentHour - 7 : null;

    const filteredAttendance = recentAttendance.filter((r) =>
        search === '' ||
        r.student_name.toLowerCase().includes(search.toLowerCase()) ||
        r.student_id.toLowerCase().includes(search.toLowerCase()) ||
        r.subject_code.toLowerCase().includes(search.toLowerCase())
    );

    const todayRate = (() => {
        const total   = recentAttendance.length;
        const present = recentAttendance.filter(r => r.status === 'present').length;
        return total > 0 ? Math.round((present / total) * 100) : null;
    })();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <style>{`
                .d-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 14px; }
                .d-card-hover:hover { border-color: #D1D5DB; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
                .d-btn-ghost { font-family: inherit; font-size: 12px; font-weight: 500; height: 32px; padding: 0 12px; background: #fff; color: #374151; border: 1px solid #E5E7EB; border-radius: 7px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; transition: background 0.1s; }
                .d-btn-ghost:hover { background: #F9FAFB; }
            `}</style>

            <div style={{ padding: '24px 28px', maxWidth: 1200, fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>Dashboard</h1>
                        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>{dateStr}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Pi status pill */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20 }}>
                            <Cpu size={12} color="#6B7280" />
                            <span style={{ fontSize: 12, color: '#6B7280' }}>Pi</span>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', boxShadow: '0 0 6px rgba(5,150,105,0.4)' }} />
                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#6B7280' }}>online</span>
                        </div>

                        {/* Live clock */}
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', fontFamily: 'monospace', lineHeight: 1 }}>{timeStr}</div>
                        </div>
                    </div>
                </div>

                {/* ── Stat cards ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {[
                        { label: 'Total Students',   val: stats.totalStudents,        icon: <Users size={18} />,        bg: '#EFF6FF', color: '#1D4ED8', href: '/students' },
                        { label: 'Active Subjects',  val: stats.activeSubjects,        icon: <BookOpen size={18} />,     bg: '#F0FDF4', color: '#15803D', href: '/subjects' },
                        { label: "Today's Sessions", val: stats.todaySessions,         icon: <CalendarDays size={18} />, bg: '#FDF4FF', color: '#9333EA', href: '/admin/classes' },
                        { label: 'Pending Face IDs', val: stats.pendingFaceApprovals,  icon: <ScanFace size={18} />,     bg: stats.pendingFaceApprovals > 0 ? '#FFFBEB' : '#F9FAFB', color: stats.pendingFaceApprovals > 0 ? '#D97706' : '#9CA3AF', href: '/system/face-approvals' },
                    ].map((s) => (
                        <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
                            <div className="d-card d-card-hover" style={{ padding: '18px 20px', transition: 'all 0.15s', display: 'block' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                                        {s.icon}
                                    </div>
                                    <ChevronRight size={14} color="#D1D5DB" />
                                </div>
                                <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', fontFamily: 'monospace', lineHeight: 1, marginBottom: 4 }}>
                                    {s.val}
                                </div>
                                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{s.label}</div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* ── Consolidated weekly timetable ── */}
                <div className="d-card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '13px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CalendarDays size={14} color="#9333EA" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Weekly Timetable</span>
                        </div>
                        <Link href="/admin/classes" className="d-btn-ghost">
                            Manage <ChevronRight size={11} />
                        </Link>
                    </div>
                    <DashTimetable schedules={weeklySchedules} currentBlock={currentBlock} />
                </div>

                {/* ── Row 2: Today's sessions + camera ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14 }}>

                    {/* Today's sessions */}
                    <div className="d-card" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CalendarDays size={14} color="#7C3AED" />
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Today's Sessions</span>
                                <span style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 20 }}>{todayClasses.length}</span>
                            </div>
                            <Link href="/admin/classes" className="d-btn-ghost">
                                All classes <ChevronRight size={11} />
                            </Link>
                        </div>

                        {todayClasses.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                                <CalendarDays size={32} style={{ display: 'block', margin: '0 auto 10px', color: '#E5E7EB' }} />
                                <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', margin: 0 }}>No sessions today</p>
                                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Scheduled sessions will appear here</p>
                            </div>
                        ) : (
                            <div>
                                {todayClasses.map((cls, i) => {
                                    const rate        = cls.enrolled_count > 0 ? Math.round((cls.present_count / cls.enrolled_count) * 100) : 0;
                                    const pillCfg     = STATUS_PILL[cls.status] ?? STATUS_PILL.scheduled;
                                    const isLast      = i === todayClasses.length - 1;

                                    return (
                                        <div key={cls.id} style={{ padding: '14px 20px', borderBottom: isLast ? 'none' : '1px solid #F9FAFB', display: 'flex', alignItems: 'center', gap: 16 }}>
                                            {/* Subject swatch */}
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <span style={{ fontSize: 11, fontWeight: 800, color: '#6D28D9' }}>
                                                    {cls.subject_code.replace(/[^A-Z0-9]/gi, '').slice(0, 3)}
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{cls.subject_code}</span>
                                                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500, background: pillCfg.bg, color: pillCfg.color, border: `1px solid ${pillCfg.border}` }}>
                                                        {cls.status}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {cls.subject_name} · {cls.time} · {cls.room}
                                                </div>
                                            </div>

                                            {/* Attendance bar */}
                                            <div style={{ width: 120, flexShrink: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B7280', marginBottom: 5 }}>
                                                    <span>{cls.present_count}/{cls.enrolled_count}</span>
                                                    <span style={{ fontWeight: 600, color: rate >= 75 ? '#059669' : rate >= 50 ? '#D97706' : '#DC2626' }}>{rate}%</span>
                                                </div>
                                                <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${rate}%`, background: rate >= 75 ? '#059669' : rate >= 50 ? '#D97706' : '#DC2626', borderRadius: 3, transition: 'width 0.5s' }} />
                                                </div>
                                            </div>

                                            {/* Link */}
                                            <Link href={`/subjects/${cls.subject_id}`} style={{ color: '#9CA3AF', flexShrink: 0 }}>
                                                <ChevronRight size={16} />
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Camera feed */}
                    <CameraFeed />
                </div>

                {/* ── Row 3: Weekly chart + quick actions ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 14 }}>

                    {/* Weekly chart */}
                    <div className="d-card" style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <BarChart2 size={14} color="#6B7280" />
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Weekly Attendance</span>
                            </div>
                            {todayRate !== null && (
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>{todayRate}% today</span>
                            )}
                        </div>
                        <WeekChart trend={weeklyTrend} />
                    </div>

                    {/* Quick links */}
                    <div className="d-card" style={{ padding: '14px 16px' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 10px' }}>Quick actions</p>
                        {[
                            { label: 'View all students',   href: '/students',              icon: <Users size={13} />,        color: '#1D4ED8' },
                            { label: 'Manage subjects',     href: '/subjects',              icon: <BookOpen size={13} />,     color: '#7C3AED' },
                            { label: 'Class timetables',    href: '/admin/classes',         icon: <CalendarDays size={13} />, color: '#9333EA' },
                            { label: 'Face approvals',      href: '/system/face-approvals', icon: <ScanFace size={13} />,     color: '#D97706' },
                            { label: 'System status',       href: '/system/pi-status',      icon: <Cpu size={13} />,          color: '#059669' },
                        ].map((a) => (
                            <Link key={a.href} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', borderRadius: 7, textDecoration: 'none', transition: 'background 0.1s', color: '#374151' }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#F9FAFB'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = ''; }}
                            >
                                <span style={{ color: a.color }}>{a.icon}</span>
                                <span style={{ fontSize: 13 }}>{a.label}</span>
                                <ChevronRight size={12} color="#D1D5DB" style={{ marginLeft: 'auto' }} />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── Recent attendance ── */}
                <div className="d-card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TrendingUp size={14} color="#059669" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Recent Attendance</span>
                            <span style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 20 }}>Today</span>
                        </div>

                        {/* Search */}
                        <div style={{ position: 'relative' }}>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search student or subject…"
                                style={{ height: 32, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', width: 240, color: '#111827', background: '#F9FAFB' }}
                            />
                        </div>
                    </div>

                    {filteredAttendance.length === 0 ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                            <CheckCircle size={32} style={{ display: 'block', margin: '0 auto 10px', color: '#E5E7EB' }} />
                            <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', margin: 0 }}>
                                {recentAttendance.length === 0 ? 'No attendance recorded today' : 'No results found'}
                            </p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                                    {['Student', 'ID', 'Subject', 'Time', 'Method', 'Status'].map((h) => (
                                        <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAttendance.map((r, i) => {
                                    const pill = STATUS_PILL[r.status] ?? STATUS_PILL.absent;
                                    return (
                                        <tr key={r.id} style={{ borderBottom: i < filteredAttendance.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                                            <td style={{ padding: '12px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                                        {getInitials(r.student_name)}
                                                    </div>
                                                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{r.student_name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 20px', fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>{r.student_id}</td>
                                            <td style={{ padding: '12px 20px', fontSize: 13, color: '#374151' }}>{r.subject_code}</td>
                                            <td style={{ padding: '12px 20px', fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Clock size={11} />
                                                    {r.checked_in_at}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 20px' }}>
                                                <span style={{ fontSize: 11, color: '#6B7280', background: '#F9FAFB', padding: '2px 8px', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                                                    {METHOD_LABEL[r.method] ?? r.method}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 20px' }}>
                                                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: pill.bg, color: pill.color, border: `1px solid ${pill.border}`, textTransform: 'capitalize' }}>
                                                    {r.status === 'present' && <CheckCircle size={10} style={{ display: 'inline', marginRight: 4 }} />}
                                                    {r.status === 'absent'  && <AlertTriangle size={10} style={{ display: 'inline', marginRight: 4 }} />}
                                                    {r.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>
        </AppLayout>
    );
}
