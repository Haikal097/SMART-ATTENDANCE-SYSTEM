import { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { type ReactNode } from 'react';
import {
    BookOpen, CalendarDays, CheckCircle, ChevronRight,
    Clock, AlertTriangle, ScanFace, TrendingUp,
    User, BarChart2, XCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Student {
    id: number;
    name: string;
    student_id: string;
    face_status: string;
    face_image_url: string | null;
}

interface Stats {
    enrolledSubjects: number;
    attendanceRate: number;
    presentToday: number;
    todaySessions: number;
}

interface EnrolledSubject {
    id: number;
    code: string;
    name: string;
    lecturer: string;
    sessions_total: number;
    sessions_attended: number;
    rate: number;
    subject_index: number;
}

interface TodaySession {
    id: number;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    time: string;
    start_block: number;
    end_block: number;
    status: string;
    room: string;
    my_status: 'present' | 'absent' | 'late' | null;
}

interface RecentRecord {
    id: number;
    subject_code: string;
    subject_name: string;
    date: string;
    day: string;
    checked_in_at: string;
    status: 'present' | 'absent' | 'late';
    method: string;
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
    student: Student | null;
    stats: Stats;
    enrolledSubjects: EnrolledSubject[];
    todaySessions: TodaySession[];
    recentAttendance: RecentRecord[];
    weeklySchedules: WeeklySchedule[];
    faceStatus: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/student/dashboard' }];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
const DAY_SHORT: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' };
const BLOCKS = Array.from({ length: 10 }, (_, i) => ({
    block: i + 1,
    start: `${String(8 + i).padStart(2, '0')}:00`,
}));

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

const STATUS_CFG: Record<string, { bg: string; color: string; border: string; icon: ReactNode }> = {
    present: { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', icon: <CheckCircle size={10} /> as ReactNode },
    absent:  { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', icon: <XCircle size={10} /> as ReactNode },
    late:    { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', icon: <Clock size={10} /> as ReactNode },
};

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const METHOD_LABEL: Record<string, string> = { face: 'Face ID', qr: 'QR Code', manual: 'Manual' };

// ─── Mini timetable ───────────────────────────────────────────────────────────
function StudentTimetable({ schedules, currentBlock }: { schedules: WeeklySchedule[]; currentBlock: number | null }) {
    const todayName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];

    const grid: Record<string, Record<number, WeeklySchedule>> = {};
    DAYS.forEach(d => { grid[d] = {}; });
    schedules.forEach(sc => {
        for (let b = sc.start_block; b <= sc.end_block; b++) {
            if (!grid[sc.day_of_week]?.[b]) grid[sc.day_of_week][b] = sc;
        }
    });

    if (schedules.length === 0) {
        return (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                <CalendarDays size={24} style={{ display: 'block', margin: '0 auto 8px', color: '#E5E7EB' }} />
                <p style={{ fontSize: 13, margin: 0 }}>No classes scheduled</p>
                <Link href="/student/courses" style={{ fontSize: 12, color: '#6D28D9', marginTop: 6, display: 'inline-block' }}>Browse courses →</Link>
            </div>
        );
    }

    return (
        <div style={{ overflowX: 'auto', padding: '14px 18px' }}>
            {/* Time header */}
            <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(10, 1fr)', gap: 2, marginBottom: 4 }}>
                <div />
                {BLOCKS.map(b => {
                    const isNow = b.block === currentBlock;
                    return (
                        <div key={b.block} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <span style={{ fontSize: 8, fontFamily: 'monospace', color: isNow ? '#4F46E5' : '#9CA3AF', fontWeight: isNow ? 700 : 400 }}>
                                {b.start}
                            </span>
                            <span style={{ width: isNow ? '60%' : '0%', height: 2, background: '#6366F1', borderRadius: 1, display: 'block', transition: 'width 0.3s' }} />
                        </div>
                    );
                })}
            </div>

            {/* Rows */}
            {DAYS.map(day => {
                const isToday = day === todayName;
                return (
                    <div key={day} style={{
                        display: 'grid', gridTemplateColumns: '56px repeat(10, 1fr)', gap: 2, marginBottom: 2,
                        background: isToday ? '#FFFBEB' : 'transparent',
                        borderRadius: isToday ? 8 : 0,
                        padding: isToday ? '2px 0' : 0,
                        outline: isToday ? '1.5px solid #FCD34D' : 'none',
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 6, gap: 2 }}>
                            <span style={{ fontSize: 10, fontWeight: isToday ? 700 : 500, color: isToday ? '#92400E' : '#6B7280', lineHeight: 1 }}>
                                {DAY_SHORT[day]}
                            </span>
                            {isToday && (
                                <span style={{ fontSize: 6, fontWeight: 700, background: '#FCD34D', color: '#78350F', padding: '1px 3px', borderRadius: 2, lineHeight: 1 }}>
                                    TODAY
                                </span>
                            )}
                        </div>

                        {BLOCKS.map(b => {
                            const sc      = grid[day]?.[b.block];
                            const pal     = sc ? PALETTE[sc.subject_index % PALETTE.length] : null;
                            const isStart = sc && b.block === sc.start_block;
                            const isNow   = isToday && b.block === currentBlock;

                            const bg     = pal ? pal.bg : isNow ? '#EEF2FF' : isToday ? 'rgba(253,211,77,0.06)' : '#F9FAFB';
                            const border = pal ? `1px solid ${pal.border}` : isNow ? '1px solid #C7D2FE' : isToday ? '1px dashed rgba(253,211,77,0.35)' : '1px solid #F3F4F6';

                            return (
                                <div key={b.block}
                                    title={sc ? `${sc.subject_code} · ${sc.time_range}` : isNow ? 'Current time block' : undefined}
                                    style={{
                                        height: 30, borderRadius: 5,
                                        background: bg, border,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        overflow: 'hidden', position: 'relative',
                                    }}
                                >
                                    {isStart && sc && pal && (
                                        <span style={{ fontSize: 8, fontWeight: 700, color: pal.color, padding: '0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {sc.subject_code}
                                        </span>
                                    )}
                                    {/* Small dot in top-right corner for NOW */}
                                    {isNow && (
                                        <span style={{
                                            position: 'absolute', top: 4, right: 4,
                                            width: 5, height: 5, borderRadius: '50%',
                                            background: '#6366F1', display: 'block', flexShrink: 0,
                                        }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}

            {/* Legend */}
            <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[...new Map(schedules.map(s => [s.subject_id, s])).values()].map(s => {
                    const pal = PALETTE[s.subject_index % PALETTE.length];
                    return (
                        <span key={s.subject_id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6B7280' }}>
                            <span style={{ width: 9, height: 9, borderRadius: 2, background: pal.bg, border: `1px solid ${pal.border}`, display: 'inline-block' }} />
                            {s.subject_code}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function StudentDashboard({
    student, stats, enrolledSubjects, todaySessions, recentAttendance, weeklySchedules, faceStatus,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const hour         = time.getHours();
    const currentBlock = hour >= 8 && hour < 18 ? hour - 7 : null;
    const greeting     = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const dateStr      = time.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeStr      = time.toLocaleTimeString('en-GB', { hour12: false });

    const displayName  = student?.name ?? auth.user.name;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Dashboard" />

            <style>{`
                .sd-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 14px; }
                .sd-link { font-family: inherit; font-size: 12px; font-weight: 500; height: 30px; padding: 0 12px; background: #fff; color: #374151; border: 1px solid #E5E7EB; border-radius: 7px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; text-decoration: none; transition: background 0.1s; }
                .sd-link:hover { background: #F9FAFB; }
            `}</style>

            <div style={{ padding: '24px 28px', maxWidth: 1100, fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* ── Face ID alert ── */}
                {(faceStatus === 'none' || faceStatus === 'rejected') && (
                    <div style={{ padding: '12px 18px', background: faceStatus === 'rejected' ? '#FEE2E2' : '#FFFBEB', border: `1px solid ${faceStatus === 'rejected' ? '#FCA5A5' : '#FCD34D'}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <AlertTriangle size={16} color={faceStatus === 'rejected' ? '#DC2626' : '#D97706'} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: faceStatus === 'rejected' ? '#991B1B' : '#92400E', margin: 0 }}>
                                {faceStatus === 'rejected' ? 'Face ID rejected — please re-submit' : 'Face ID not set up'}
                            </p>
                            <p style={{ fontSize: 12, color: faceStatus === 'rejected' ? '#B91C1C' : '#B45309', margin: '2px 0 0' }}>
                                {faceStatus === 'rejected'
                                    ? 'Your face photos were rejected. Submit new ones to use face recognition attendance.'
                                    : 'Set up Face ID to check in to classes automatically using face recognition.'}
                            </p>
                        </div>
                        <Link href="/settings/profile" style={{ height: 34, padding: '0 14px', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: faceStatus === 'rejected' ? '#DC2626' : '#D97706', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', flexShrink: 0 }}>
                            <ScanFace size={13} />
                            {faceStatus === 'rejected' ? 'Re-submit' : 'Set up now'}
                        </Link>
                    </div>
                )}
                {faceStatus === 'pending' && (
                    <div style={{ padding: '10px 18px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ScanFace size={14} color="#1D4ED8" style={{ flexShrink: 0 }} />
                        <p style={{ fontSize: 13, color: '#1E40AF', margin: 0 }}>
                            <strong>Face ID pending review</strong> — your photos are being reviewed. Usually approved within 1–2 hours.
                        </p>
                    </div>
                )}

                {/* ── Header ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {/* Avatar */}
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: faceStatus === 'approved' && student?.face_image_url ? 'transparent' : 'linear-gradient(135deg, #DBEAFE, #EDE9FE)', border: '2px solid #E5E7EB', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#4338CA', flexShrink: 0 }}>
                            {faceStatus === 'approved' && student?.face_image_url
                                ? <img src={student.face_image_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : getInitials(displayName)
                            }
                        </div>
                        <div>
                            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>{greeting} 👋</p>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: '2px 0' }}>
                                {displayName}
                            </h1>
                            <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                                {student?.student_id && <span style={{ fontFamily: 'monospace', marginRight: 8 }}>{student.student_id}</span>}
                                {dateStr}
                            </p>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'monospace', color: '#111827', lineHeight: 1 }}>{timeStr}</div>
                        <Link href="/settings/profile" className="sd-link" style={{ marginTop: 6, fontSize: 11 }}>
                            <User size={11} /> My profile
                        </Link>
                    </div>
                </div>

                {/* ── Stat cards ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {[
                        { label: 'Enrolled Courses', val: stats.enrolledSubjects, icon: <BookOpen size={18} />, bg: '#EDE9FE', color: '#6D28D9', href: '/student/courses' },
                        {
                            label: 'Overall Rate', val: `${stats.attendanceRate}%`,
                            icon: <TrendingUp size={18} />,
                            bg: stats.attendanceRate >= 80 ? '#D1FAE5' : stats.attendanceRate >= 60 ? '#FEF3C7' : '#FEE2E2',
                            color: stats.attendanceRate >= 80 ? '#065F46' : stats.attendanceRate >= 60 ? '#92400E' : '#991B1B',
                            href: '/student/attendance',
                        },
                        { label: "Today's Classes", val: stats.todaySessions, icon: <CalendarDays size={18} />, bg: '#EFF6FF', color: '#1D4ED8', href: '#today' },
                        { label: 'Present Today',   val: stats.presentToday,   icon: <CheckCircle size={18} />, bg: '#F0FDF4', color: '#15803D', href: '#today' },
                    ].map((s) => (
                        <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
                            <div className="sd-card" style={{ padding: '16px 18px', transition: 'all 0.15s' }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                                        {s.icon}
                                    </div>
                                    <ChevronRight size={13} color="#D1D5DB" />
                                </div>
                                <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', fontFamily: 'monospace', lineHeight: 1, marginBottom: 3 }}>
                                    {s.val}
                                </div>
                                <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>{s.label}</div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* ── Weekly timetable ── */}
                <div className="sd-card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '12px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <CalendarDays size={14} color="#6D28D9" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>My Weekly Schedule</span>
                        </div>
                        <Link href="/student/courses" className="sd-link">
                            Manage courses <ChevronRight size={11} />
                        </Link>
                    </div>
                    <StudentTimetable schedules={weeklySchedules} currentBlock={currentBlock} />
                </div>

                {/* ── Row: Today's sessions + Attendance per subject ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>

                    {/* Today's sessions */}
                    <div className="sd-card" style={{ overflow: 'hidden' }} id="today">
                        <div style={{ padding: '12px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Clock size={14} color="#1D4ED8" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Today's Classes</span>
                            <span style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 20 }}>{todaySessions.length}</span>
                        </div>

                        {todaySessions.length === 0 ? (
                            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                                <CalendarDays size={28} style={{ display: 'block', margin: '0 auto 10px', color: '#E5E7EB' }} />
                                <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', margin: 0 }}>No classes today</p>
                                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>Enjoy your free day!</p>
                            </div>
                        ) : (
                            todaySessions.map((s, i) => {
                                const pal       = PALETTE[(enrolledSubjects.find(e => e.id === s.subject_id)?.subject_index ?? 0) % PALETTE.length];
                                const myCfg     = s.my_status ? STATUS_CFG[s.my_status] : null;
                                const isNow     = currentBlock !== null && s.start_block <= currentBlock && s.end_block >= currentBlock;

                                return (
                                    <div key={s.id} style={{ padding: '14px 18px', borderBottom: i < todaySessions.length - 1 ? '1px solid #F9FAFB' : 'none', display: 'flex', alignItems: 'center', gap: 14, background: isNow ? '#FAFAFA' : 'transparent' }}>
                                        <div style={{ width: 38, height: 38, borderRadius: 9, background: pal.bg, border: `1px solid ${pal.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <span style={{ fontSize: 10, fontWeight: 800, color: pal.color }}>{s.subject_code.replace(/[^A-Z0-9]/gi, '').slice(0, 3)}</span>
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                                                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{s.subject_code}</span>
                                                {isNow && (
                                                    <span style={{ fontSize: 9, fontWeight: 700, background: '#111827', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>NOW</span>
                                                )}
                                            </div>
                                            <p style={{ fontSize: 12, color: '#6B7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {s.subject_name} · {s.time} · {s.room}
                                            </p>
                                        </div>

                                        {/* My attendance status */}
                                        {myCfg ? (
                                            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: myCfg.bg, color: myCfg.color, border: `1px solid ${myCfg.border}`, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, textTransform: 'capitalize' }}>
                                                {myCfg.icon} {s.my_status}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>
                                                {s.status === 'scheduled' ? 'Upcoming' : s.status}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Attendance per subject */}
                    <div className="sd-card" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '12px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 7 }}>
                            <BarChart2 size={14} color="#059669" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Attendance by Course</span>
                        </div>

                        {enrolledSubjects.length === 0 ? (
                            <div style={{ padding: '28px 18px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                                Not enrolled in any courses yet.
                            </div>
                        ) : (
                            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {enrolledSubjects.map((s) => {
                                    const pal  = PALETTE[s.subject_index % PALETTE.length];
                                    const rate = s.rate;
                                    const barColor = rate >= 80 ? '#059669' : rate >= 60 ? '#D97706' : '#DC2626';

                                    return (
                                        <div key={s.id}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                                <span style={{ width: 8, height: 8, borderRadius: 2, background: pal.bg, border: `1px solid ${pal.border}`, flexShrink: 0, display: 'inline-block' }} />
                                                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {s.code}
                                                </span>
                                                <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: barColor, flexShrink: 0 }}>
                                                    {rate}%
                                                </span>
                                            </div>
                                            <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${rate}%`, background: barColor, borderRadius: 3, transition: 'width 0.5s' }} />
                                            </div>
                                            <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3 }}>
                                                {s.sessions_attended} / {s.sessions_total} sessions attended
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div style={{ padding: '10px 18px', borderTop: '1px solid #F3F4F6' }}>
                            <Link href="/student/attendance" className="sd-link" style={{ width: '100%', justifyContent: 'center' }}>
                                Full attendance report <ChevronRight size={11} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Recent attendance ── */}
                <div className="sd-card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '12px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <TrendingUp size={14} color="#6D28D9" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Recent Attendance</span>
                        </div>
                        <Link href="/student/attendance" className="sd-link">
                            View all <ChevronRight size={11} />
                        </Link>
                    </div>

                    {recentAttendance.length === 0 ? (
                        <div style={{ padding: '36px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                            <CheckCircle size={28} style={{ display: 'block', margin: '0 auto 10px', color: '#E5E7EB' }} />
                            <p style={{ fontSize: 13, margin: 0, color: '#374151', fontWeight: 500 }}>No attendance records yet</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                                        {['Date', 'Course', 'Check-in', 'Method', 'Status'].map(h => (
                                            <th key={h} style={{ padding: '9px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentAttendance.map((r, i) => {
                                        const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.absent;
                                        return (
                                            <tr key={r.id} style={{ borderBottom: i < recentAttendance.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                                                <td style={{ padding: '11px 18px', fontSize: 12, color: '#374151' }}>
                                                    <span style={{ fontWeight: 500 }}>{r.day}</span>
                                                    <span style={{ color: '#9CA3AF', marginLeft: 4 }}>{r.date}</span>
                                                </td>
                                                <td style={{ padding: '11px 18px', fontSize: 13, fontWeight: 500, color: '#111827' }}>{r.subject_code}</td>
                                                <td style={{ padding: '11px 18px', fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>
                                                    {r.checked_in_at === '—' ? <span style={{ color: '#D1D5DB' }}>—</span> : r.checked_in_at}
                                                </td>
                                                <td style={{ padding: '11px 18px' }}>
                                                    <span style={{ fontSize: 11, color: '#6B7280', background: '#F9FAFB', padding: '2px 8px', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                                                        {METHOD_LABEL[r.method] ?? r.method}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '11px 18px' }}>
                                                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, display: 'inline-flex', alignItems: 'center', gap: 4, textTransform: 'capitalize' }}>
                                                        {cfg.icon} {r.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </AppLayout>
    );
}
