import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    BookOpen, Users, Clock, CalendarDays, ChevronRight,
    CheckCircle, AlertTriangle, Search, GraduationCap,
    BarChart3, CalendarCheck,
} from 'lucide-react';

// ─── Timetable constants ──────────────────────────────────────────────────────
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
const DAY_SHORT_TT: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' };
const BLOCKS = Array.from({ length: 10 }, (_, i) => ({ block: i + 1, start: `${String(8 + i).padStart(2, '0')}:00` }));

// ─── Types ────────────────────────────────────────────────────────────────────
interface Schedule {
    id: number;
    day_of_week: string;
    start_block: number;
    end_block: number;
    type: string;
    time_range: string;
}

interface NextSession {
    id: number;
    date: string;
    day: string;
    time: string;
    room: string | null;
    status: string;
}

interface Subject {
    id: number;
    code: string;
    name: string;
    description: string | null;
    credit_hours: number;
    status: 'active' | 'inactive';
    start_date: string | null;
    end_date: string | null;
    lecturer: string;
    sessions_total: number;
    sessions_attended: number;
    sessions_late: number;
    rate: number;
    subject_index: number;
    schedules: Schedule[];
    next_session: NextSession | null;
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
    subjects: Subject[];
    weeklySchedules: WeeklySchedule[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/student/dashboard' },
    { title: 'My Classes', href: '/student/classes' },
];

const PALETTE = [
    { bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE', light: '#F5F3FF' },
    { bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE', light: '#EFF6FF' },
    { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', light: '#ECFDF5' },
    { bg: '#FCE7F3', color: '#BE185D', border: '#FBCFE8', light: '#FDF2F8' },
    { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', light: '#FFFBEB' },
    { bg: '#FFEDD5', color: '#C2410C', border: '#FED7AA', light: '#FFF7ED' },
    { bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD', light: '#F0F9FF' },
    { bg: '#F0FDF4', color: '#15803D', border: '#86EFAC', light: '#F0FDF4' },
];

const TYPE_STYLE: Record<string, { label: string; bg: string; color: string; border: string }> = {
    lecture:  { label: 'Lecture',  bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE' },
    lab:      { label: 'Lab',      bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
    tutorial: { label: 'Tutorial', bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
};

const DAY_SHORT: Record<string, string> = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri',
};

// ─── Timetable ────────────────────────────────────────────────────────────────
function StudentTimetable({ schedules, currentBlock }: { schedules: WeeklySchedule[]; currentBlock: number | null }) {
    const todayName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];

    const grid: Record<string, Record<number, WeeklySchedule>> = {};
    DAYS.forEach(d => { grid[d] = {}; });
    schedules.forEach(sc => {
        for (let b = sc.start_block; b <= sc.end_block; b++) {
            if (!grid[sc.day_of_week]?.[b]) grid[sc.day_of_week][b] = sc;
        }
    });

    if (schedules.length === 0) return null;

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
                                {DAY_SHORT_TT[day]}
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
                                        <span style={{ position: 'absolute', top: 4, right: 4, width: 5, height: 5, borderRadius: '50%', background: '#6366F1' }} />
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

// ─── Class Card ───────────────────────────────────────────────────────────────
function ClassCard({ subject }: { subject: Subject }) {
    const pal      = PALETTE[subject.subject_index % PALETTE.length];
    const rate     = subject.rate;
    const barColor = rate >= 80 ? '#10B981' : rate >= 60 ? '#F59E0B' : '#EF4444';
    const rateText = rate >= 80 ? 'Good' : rate >= 60 ? 'At risk' : 'Critical';
    const missing  = subject.sessions_total - subject.sessions_attended - subject.sessions_late;

    return (
        <div style={{
            background: '#fff',
            border: `1px solid ${pal.border}`,
            borderRadius: 14,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'box-shadow 0.15s, transform 0.15s',
        }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
        >
            {/* Coloured header */}
            <div style={{ background: pal.bg, borderBottom: `1px solid ${pal.border}`, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: '#fff', border: `1px solid ${pal.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BookOpen size={20} color={pal.color} />
                    </div>
                    <div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: pal.color, margin: 0, lineHeight: 1 }}>{subject.code}</p>
                        <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0', lineHeight: 1.3 }}>{subject.name}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: subject.status === 'active' ? '#D1FAE5' : '#F3F4F6', color: subject.status === 'active' ? '#065F46' : '#6B7280', border: `1px solid ${subject.status === 'active' ? '#6EE7B7' : '#E5E7EB'}` }}>
                        {subject.status}
                    </span>
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>{subject.credit_hours} credit hrs</span>
                </div>
            </div>

            {/* Body */}
            <div style={{ padding: '14px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Lecturer */}
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Users size={11} style={{ flexShrink: 0 }} /> {subject.lecturer}
                </p>

                {/* Attendance rate */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>Attendance</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: rate >= 80 ? '#D1FAE5' : rate >= 60 ? '#FEF3C7' : '#FEE2E2', color: barColor }}>{rateText}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{rate}%</span>
                        </div>
                    </div>
                    <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${rate}%`, background: barColor, borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                        <span style={{ fontSize: 10, color: '#059669', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <CheckCircle size={9} /> {subject.sessions_attended} present
                        </span>
                        {subject.sessions_late > 0 && (
                            <span style={{ fontSize: 10, color: '#D97706', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Clock size={9} /> {subject.sessions_late} late
                            </span>
                        )}
                        {missing > 0 && (
                            <span style={{ fontSize: 10, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <AlertTriangle size={9} /> {missing} absent
                            </span>
                        )}
                        <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 'auto' }}>
                            {subject.sessions_attended + subject.sessions_late}/{subject.sessions_total} sessions
                        </span>
                    </div>
                </div>

                {/* Schedule tags */}
                {subject.schedules.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {subject.schedules.map(sc => {
                            const ts = TYPE_STYLE[sc.type] ?? TYPE_STYLE.lecture;
                            return (
                                <span key={sc.id} style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 20, background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <CalendarDays size={9} />
                                    {DAY_SHORT[sc.day_of_week] ?? sc.day_of_week} · {sc.time_range}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Next session */}
                {subject.next_session && (
                    <div style={{ padding: '8px 10px', borderRadius: 8, background: pal.light, border: `1px solid ${pal.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CalendarCheck size={13} color={pal.color} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: pal.color, margin: 0 }}>Next session</p>
                            <p style={{ fontSize: 10, color: '#6B7280', margin: '1px 0 0' }}>
                                {subject.next_session.day}, {subject.next_session.date} · {subject.next_session.time}
                                {subject.next_session.room ? ` · ${subject.next_session.room}` : ''}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 6 }}>
                <Link
                    href="/student/attendance"
                    style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 600, padding: '7px 0', borderRadius: 7, background: pal.bg, color: pal.color, border: `1px solid ${pal.border}`, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                >
                    <CalendarCheck size={11} /> Attendance
                </Link>
                <Link
                    href={`/subjects/${subject.id}`}
                    style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 600, padding: '7px 0', borderRadius: 7, background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                >
                    Details <ChevronRight size={11} />
                </Link>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function StudentClasses({ subjects, weeklySchedules }: Props) {
    const [search, setSearch] = useState('');
    const [currentBlock, setCurrentBlock] = useState<number | null>(null);

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const h = now.getHours();
            setCurrentBlock(h >= 8 && h < 18 ? h - 7 : null);
        };
        tick();
        const id = setInterval(tick, 60_000);
        return () => clearInterval(id);
    }, []);

    const filtered = subjects.filter(s =>
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.lecturer.toLowerCase().includes(search.toLowerCase())
    );

    const avgRate = subjects.length > 0
        ? Math.round(subjects.reduce((a, s) => a + s.rate, 0) / subjects.length)
        : 0;

    const atRisk = subjects.filter(s => s.rate < 80 && s.rate >= 60).length;
    const critical = subjects.filter(s => s.rate < 60).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Classes" />

            <div style={{ padding: '24px 28px', maxWidth: 1100, fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>My Classes</h1>
                        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>
                            {subjects.length} enrolled subject{subjects.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Link href="/student/courses" style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', textDecoration: 'none', padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <GraduationCap size={13} /> Browse courses
                    </Link>
                </div>

                {/* ── Stats ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {[
                        { label: 'Enrolled',    val: subjects.length, icon: <BookOpen size={17} />,      bg: '#EDE9FE', color: '#6D28D9' },
                        { label: 'Avg Rate',    val: `${avgRate}%`,   icon: <BarChart3 size={17} />,     bg: '#D1FAE5', color: '#065F46' },
                        { label: 'At Risk',     val: atRisk,          icon: <AlertTriangle size={17} />, bg: '#FEF3C7', color: '#92400E' },
                        { label: 'Critical',    val: critical,        icon: <AlertTriangle size={17} />, bg: '#FEE2E2', color: '#991B1B' },
                    ].map(card => (
                        <div key={card.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 9, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, flexShrink: 0 }}>
                                {card.icon}
                            </div>
                            <div>
                                <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>{card.label}</p>
                                <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.2 }}>{card.val}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Timetable ── */}
                {weeklySchedules.length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ padding: '12px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CalendarDays size={15} color="#6D28D9" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Weekly Timetable</span>
                            <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>08:00 – 18:00</span>
                        </div>
                        <StudentTimetable schedules={weeklySchedules} currentBlock={currentBlock} />
                    </div>
                )}

                {/* ── Search ── */}
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by code, name or lecturer…"
                        style={{ width: '100%', paddingLeft: 36, paddingRight: 12, height: 38, border: '1px solid #E5E7EB', borderRadius: 9, fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                    />
                </div>

                {/* ── Classes grid ── */}
                {subjects.length === 0 ? (
                    <div style={{ padding: '60px 24px', textAlign: 'center', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14 }}>
                        <BookOpen size={36} style={{ display: 'block', margin: '0 auto 12px', color: '#E5E7EB' }} />
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>No classes yet</p>
                        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '4px 0 16px' }}>You haven't enrolled in any subjects</p>
                        <Link href="/student/courses" style={{ fontSize: 13, fontWeight: 600, color: '#6D28D9', textDecoration: 'none', padding: '8px 18px', border: '1px solid #DDD6FE', borderRadius: 8, background: '#EDE9FE' }}>
                            Browse courses →
                        </Link>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '40px 24px', textAlign: 'center', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14 }}>
                        <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>No classes match "{search}"</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                        {filtered.map(subject => (
                            <ClassCard key={subject.id} subject={subject} />
                        ))}
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
