import { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import {
    BookOpen, Users, CalendarDays, TrendingUp,
    CheckCircle, Clock, XCircle, ChevronRight,
    BarChart2, ScanFace, ClipboardList,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
    mySubjects: number;
    totalStudents: number;
    todaySessions: number;
    attendanceRate: number;
}

interface TodayClass {
    id: number;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    time: string;
    start_block: number;
    status: string;
    room: string;
    enrolled_count: number;
    present_count: number;
    late_count: number;
}

interface RecentRecord {
    id: number;
    student_name: string;
    student_id: string;
    subject_code: string;
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

interface SubjectSummary {
    id: number;
    code: string;
    name: string;
    students_count: number;
    sessions_count: number;
    rate: number;
    subject_index: number;
}

interface Props {
    stats: Stats;
    todayClasses: TodayClass[];
    recentAttendance: RecentRecord[];
    weeklySchedules: WeeklySchedule[];
    subjectSummary: SubjectSummary[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/lecturer/dashboard' }];

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

const STATUS_STYLE = {
    present: { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', icon: <CheckCircle size={10} /> },
    absent:  { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', icon: <XCircle size={10} /> },
    late:    { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', icon: <Clock size={10} /> },
} as const;

const METHOD_LABEL: Record<string, string> = { face: 'Face ID', qr: 'QR Code', manual: 'Manual' };

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Timetable ────────────────────────────────────────────────────────────────
function LecturerTimetable({ schedules, currentBlock }: { schedules: WeeklySchedule[]; currentBlock: number | null }) {
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
                <p style={{ fontSize: 13, margin: 0 }}>No schedules assigned yet</p>
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
                                    style={{ height: 30, borderRadius: 5, background: bg, border, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
                                >
                                    {isStart && sc && pal && (
                                        <span style={{ fontSize: 8, fontWeight: 700, color: pal.color, padding: '0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {sc.subject_code}
                                        </span>
                                    )}
                                    {isNow && (
                                        <span style={{ position: 'absolute', top: 4, right: 4, width: 5, height: 5, borderRadius: '50%', background: '#6366F1', display: 'block' }} />
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
export default function LecturerDashboard({ stats, todayClasses, recentAttendance, weeklySchedules, subjectSummary }: Props) {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Lecturer Dashboard" />

            <style>{`
                .ld-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 14px; }
                .ld-link { font-family: inherit; font-size: 12px; font-weight: 500; height: 30px; padding: 0 12px; background: #fff; color: #374151; border: 1px solid #E5E7EB; border-radius: 7px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; text-decoration: none; transition: background 0.1s; }
                .ld-link:hover { background: #F9FAFB; }
            `}</style>

            <div style={{ padding: '24px 28px', maxWidth: 1100, fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #DBEAFE, #EDE9FE)', border: '2px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#4338CA', flexShrink: 0 }}>
                            {getInitials(auth.user.name)}
                        </div>
                        <div>
                            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>{greeting} 👋</p>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: '2px 0' }}>
                                {auth.user.name}
                            </h1>
                            <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>{dateStr}</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'monospace', color: '#111827', lineHeight: 1 }}>{timeStr}</div>
                        <Link href="/settings/profile" className="ld-link" style={{ marginTop: 6, fontSize: 11 }}>
                            My profile
                        </Link>
                    </div>
                </div>

                {/* ── Stat cards ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {[
                        { label: 'My Subjects',      val: stats.mySubjects,     icon: <BookOpen size={18} />,  bg: '#EDE9FE', color: '#6D28D9', href: '/lecturer/subjects' },
                        { label: 'Total Students',   val: stats.totalStudents,  icon: <Users size={18} />,     bg: '#DBEAFE', color: '#1D4ED8', href: '/lecturer/students' },
                        { label: "Today's Sessions", val: stats.todaySessions,  icon: <ClipboardList size={18} />, bg: '#D1FAE5', color: '#065F46', href: '/lecturer/sessions' },
                        { label: 'Attendance Rate',  val: `${stats.attendanceRate}%`, icon: <TrendingUp size={18} />, bg: '#FEF3C7', color: '#92400E', href: '/lecturer/reports' },
                    ].map(card => (
                        <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
                            <div className="ld-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)')}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, flexShrink: 0 }}>
                                    {card.icon}
                                </div>
                                <div>
                                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{card.label}</p>
                                    <p style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.2 }}>{card.val}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* ── Timetable ── */}
                <div className="ld-card">
                    <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CalendarDays size={16} color="#6D28D9" />
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>My Weekly Schedule</span>
                        </div>
                        <Link href="/lecturer/timetable" className="ld-link">Manage →</Link>
                    </div>
                    <LecturerTimetable schedules={weeklySchedules} currentBlock={currentBlock} />
                </div>

                {/* ── Row: Today's sessions + Subject summary ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>

                    {/* Today's sessions */}
                    <div className="ld-card">
                        <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <ClipboardList size={16} color="#065F46" />
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Today's Sessions</span>
                            </div>
                            <Link href="/lecturer/sessions" className="ld-link">All sessions →</Link>
                        </div>

                        {todayClasses.length === 0 ? (
                            <div style={{ padding: '28px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                                <ClipboardList size={24} style={{ display: 'block', margin: '0 auto 8px', color: '#E5E7EB' }} />
                                <p style={{ fontSize: 13, margin: 0 }}>No sessions scheduled today</p>
                            </div>
                        ) : (
                            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {todayClasses.map(cls => {
                                    const rate = cls.enrolled_count > 0 ? Math.round(((cls.present_count + cls.late_count) / cls.enrolled_count) * 100) : 0;
                                    const isNowBlock = currentBlock === cls.start_block;
                                    return (
                                        <div key={cls.id} style={{ padding: '12px 14px', borderRadius: 10, border: isNowBlock ? '1px solid #C7D2FE' : '1px solid #F3F4F6', background: isNowBlock ? '#EEF2FF' : '#FAFAFA', display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <BookOpen size={18} color="#6D28D9" />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{cls.subject_code}</span>
                                                    {isNowBlock && <span style={{ fontSize: 9, fontWeight: 700, background: '#6366F1', color: '#fff', padding: '1px 5px', borderRadius: 4 }}>NOW</span>}
                                                </div>
                                                <p style={{ fontSize: 11, color: '#6B7280', margin: '1px 0 0' }}>{cls.subject_name} · {cls.time} · {cls.room || 'No room'}</p>
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <p style={{ fontSize: 15, fontWeight: 700, color: rate >= 80 ? '#059669' : rate >= 60 ? '#D97706' : '#DC2626', margin: 0 }}>{rate}%</p>
                                                <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>{cls.present_count + cls.late_count}/{cls.enrolled_count} present</p>
                                            </div>
                                            <Link href={`/subjects/${cls.subject_id}/sessions/${cls.id}/attendance`} className="ld-link" style={{ flexShrink: 0 }}>
                                                <ScanFace size={12} /> Attendance
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Subject summary */}
                    <div className="ld-card">
                        <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <BarChart2 size={16} color="#1D4ED8" />
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>My Subjects</span>
                            </div>
                            <Link href="/lecturer/subjects" className="ld-link"><ChevronRight size={12} /></Link>
                        </div>

                        {subjectSummary.length === 0 ? (
                            <div style={{ padding: '28px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                                <BookOpen size={24} style={{ display: 'block', margin: '0 auto 8px', color: '#E5E7EB' }} />
                                <p style={{ fontSize: 13, margin: 0 }}>No subjects assigned</p>
                            </div>
                        ) : (
                            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {subjectSummary.map(s => {
                                    const pal  = PALETTE[s.subject_index % PALETTE.length];
                                    const rate = s.rate;
                                    const barColor = rate >= 80 ? '#10B981' : rate >= 60 ? '#F59E0B' : '#EF4444';
                                    return (
                                        <div key={s.id} style={{ padding: '10px 12px', borderRadius: 9, border: `1px solid ${pal.border}`, background: pal.bg }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                                <div>
                                                    <p style={{ fontSize: 12, fontWeight: 700, color: pal.color, margin: 0 }}>{s.code}</p>
                                                    <p style={{ fontSize: 10, color: '#6B7280', margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{s.name}</p>
                                                </div>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{rate}%</span>
                                            </div>
                                            <div style={{ height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 2 }}>
                                                <div style={{ height: '100%', width: `${rate}%`, background: barColor, borderRadius: 2, transition: 'width 0.4s' }} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                                <span style={{ fontSize: 9, color: '#9CA3AF' }}>{s.students_count} students</span>
                                                <span style={{ fontSize: 9, color: '#9CA3AF' }}>{s.sessions_count} sessions</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Recent attendance ── */}
                <div className="ld-card">
                    <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ScanFace size={16} color="#059669" />
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Recent Attendance</span>
                        </div>
                        <Link href="/lecturer/attendance/records" className="ld-link">View all →</Link>
                    </div>

                    {recentAttendance.length === 0 ? (
                        <div style={{ padding: '28px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                            <p style={{ fontSize: 13, margin: 0 }}>No attendance records yet</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                                        {['Student', 'ID', 'Subject', 'Time', 'Method', 'Status'].map(h => (
                                            <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentAttendance.map((r, i) => {
                                        const cfg = STATUS_STYLE[r.status] ?? STATUS_STYLE.absent;
                                        return (
                                            <tr key={r.id} style={{ borderBottom: i < recentAttendance.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                                                <td style={{ padding: '9px 14px', fontWeight: 500, color: '#111827' }}>{r.student_name}</td>
                                                <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: '#6B7280', fontSize: 11 }}>{r.student_id}</td>
                                                <td style={{ padding: '9px 14px', color: '#6B7280' }}>{r.subject_code}</td>
                                                <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: '#6B7280' }}>{r.checked_in_at}</td>
                                                <td style={{ padding: '9px 14px', color: '#9CA3AF' }}>{METHOD_LABEL[r.method] ?? r.method}</td>
                                                <td style={{ padding: '9px 14px' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
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
