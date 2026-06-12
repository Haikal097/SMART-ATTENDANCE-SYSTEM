import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { CalendarDays, Clock, BookOpen, ClipboardList, ChevronRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface WeeklySchedule {
    id: number;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    subject_index: number;
    day_of_week: string;
    start_block: number;
    end_block: number;
    type: string;
    time_range: string;
}

interface TodaySession {
    id: number;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    time: string;
    start_block: number;
    end_block: number;
    room: string | null;
    status: string;
}

interface Props {
    weeklySchedules: WeeklySchedule[];
    todaySessions: TodaySession[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/lecturer/dashboard' },
    { title: 'Timetable', href: '/lecturer/timetable' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
type Day = typeof DAYS[number];

const DAY_FULL: Record<Day, string> = {
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday',
};
const DAY_SHORT: Record<string, string> = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri',
};

const BLOCKS = Array.from({ length: 10 }, (_, i) => ({
    block: i + 1,
    start: `${String(8 + i).padStart(2, '0')}:00`,
    end:   `${String(9 + i).padStart(2, '0')}:00`,
    hour:  8 + i,
}));

const PALETTE = [
    { bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE', solid: '#7C3AED' },
    { bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE', solid: '#2563EB' },
    { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', solid: '#059669' },
    { bg: '#FCE7F3', color: '#BE185D', border: '#FBCFE8', solid: '#DB2777' },
    { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', solid: '#D97706' },
    { bg: '#FFEDD5', color: '#C2410C', border: '#FED7AA', solid: '#EA580C' },
    { bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD', solid: '#0284C7' },
    { bg: '#F0FDF4', color: '#15803D', border: '#86EFAC', solid: '#16A34A' },
];

const TYPE_STYLE: Record<string, { label: string; bg: string; color: string; border: string }> = {
    lecture:  { label: 'Lecture',  bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE' },
    lab:      { label: 'Lab',      bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
    tutorial: { label: 'Tutorial', bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
};

const SESSION_STATUS: Record<string, { bg: string; color: string; border: string }> = {
    scheduled: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    ongoing:   { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
    completed: { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
};

// ─── Grid timetable ───────────────────────────────────────────────────────────
function TimetableGrid({ schedules, currentBlock }: { schedules: WeeklySchedule[]; currentBlock: number | null }) {
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
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9CA3AF' }}>
                <CalendarDays size={32} style={{ display: 'block', margin: '0 auto 10px', color: '#E5E7EB' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>No schedules yet</p>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: '4px 0 0' }}>Your assigned subjects have no schedules set up</p>
            </div>
        );
    }

    return (
        <div style={{ overflowX: 'auto', padding: '18px 22px' }}>
            {/* Time header */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(10, 1fr)', gap: 3, marginBottom: 6 }}>
                <div />
                {BLOCKS.map(b => {
                    const isNow = b.block === currentBlock;
                    return (
                        <div key={b.block} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <span style={{ fontSize: 9, fontFamily: 'monospace', color: isNow ? '#4F46E5' : '#9CA3AF', fontWeight: isNow ? 700 : 400 }}>
                                {b.start}
                            </span>
                            <span style={{ width: isNow ? '60%' : '0%', height: 2, background: '#6366F1', borderRadius: 1, display: 'block', transition: 'width 0.3s' }} />
                        </div>
                    );
                })}
            </div>

            {/* Day rows */}
            {DAYS.map(day => {
                const isToday = day === todayName;
                return (
                    <div key={day} style={{
                        display: 'grid', gridTemplateColumns: '80px repeat(10, 1fr)', gap: 3, marginBottom: 4,
                        background: isToday ? '#FFFBEB' : 'transparent',
                        borderRadius: isToday ? 10 : 0,
                        padding: isToday ? '3px 0' : 0,
                        outline: isToday ? '1.5px solid #FCD34D' : 'none',
                    }}>
                        {/* Day label */}
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 10, gap: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? '#92400E' : '#6B7280', lineHeight: 1 }}>
                                {DAY_FULL[day]}
                            </span>
                            {isToday && (
                                <span style={{ fontSize: 7, fontWeight: 700, background: '#FCD34D', color: '#78350F', padding: '1px 4px', borderRadius: 3, lineHeight: 1, width: 'fit-content' }}>
                                    TODAY
                                </span>
                            )}
                        </div>

                        {/* Blocks */}
                        {BLOCKS.map(b => {
                            const sc      = grid[day]?.[b.block];
                            const pal     = sc ? PALETTE[sc.subject_index % PALETTE.length] : null;
                            const isStart = sc && b.block === sc.start_block;
                            const isEnd   = sc && b.block === sc.end_block;
                            const isNow   = isToday && b.block === currentBlock;

                            const bg     = pal ? pal.bg : isNow ? '#EEF2FF' : isToday ? 'rgba(253,211,77,0.06)' : '#F9FAFB';
                            const border = pal ? `1px solid ${pal.border}` : isNow ? '1px solid #C7D2FE' : isToday ? '1px dashed rgba(253,211,77,0.35)' : '1px solid #F3F4F6';
                            const radius = isStart && isEnd ? 8 : isStart ? '8px 0 0 8px' : isEnd ? '0 8px 8px 0' : sc ? 0 : 8;

                            return (
                                <div key={b.block}
                                    title={sc ? `${sc.subject_code} · ${sc.subject_name} · ${sc.time_range}` : undefined}
                                    style={{ height: 44, borderRadius: radius, background: bg, border, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
                                >
                                    {isStart && sc && pal && (
                                        <>
                                            <span style={{ fontSize: 9, fontWeight: 700, color: pal.color, padding: '0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                                {sc.subject_code}
                                            </span>
                                            {sc.end_block > sc.start_block && (
                                                <span style={{ fontSize: 7, color: pal.color, opacity: 0.7 }}>
                                                    {TYPE_STYLE[sc.type]?.label ?? sc.type}
                                                </span>
                                            )}
                                        </>
                                    )}
                                    {isNow && (
                                        <span style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: '50%', background: '#6366F1', display: 'block' }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}

            {/* Legend */}
            <div style={{ marginTop: 12, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                {[...new Map(schedules.map(s => [s.subject_id, s])).values()].map(s => {
                    const pal = PALETTE[s.subject_index % PALETTE.length];
                    return (
                        <span key={s.subject_id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6B7280' }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: pal.bg, border: `1px solid ${pal.border}`, display: 'inline-block' }} />
                            <span style={{ fontWeight: 600, color: pal.color }}>{s.subject_code}</span>
                            <span>{s.subject_name}</span>
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Day detail panel ─────────────────────────────────────────────────────────
function DayPanel({ day, schedules }: { day: Day; schedules: WeeklySchedule[] }) {
    const daySchedules = schedules.filter(s => s.day_of_week === day);

    if (daySchedules.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF' }}>
                <p style={{ fontSize: 12, margin: 0 }}>No classes on {DAY_FULL[day]}</p>
            </div>
        );
    }

    // Deduplicate by subject (show each class once per day)
    const unique = [...new Map(daySchedules.map(s => [s.subject_id, s])).values()];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px' }}>
            {unique.map(sc => {
                const pal = PALETTE[sc.subject_index % PALETTE.length];
                const ts  = TYPE_STYLE[sc.type] ?? TYPE_STYLE.lecture;
                return (
                    <div key={sc.id} style={{ padding: '10px 12px', borderRadius: 10, background: pal.bg, border: `1px solid ${pal.border}`, display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fff', border: `1px solid ${pal.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <BookOpen size={16} color={pal.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: pal.color }}>{sc.subject_code}</span>
                                <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>{ts.label}</span>
                            </div>
                            <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sc.subject_name}</p>
                            <p style={{ fontSize: 10, color: '#9CA3AF', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Clock size={9} /> {sc.time_range}
                            </p>
                        </div>
                        <Link href={`/subjects/${sc.subject_id}`} style={{ fontSize: 10, color: pal.color, textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                            <ChevronRight size={14} />
                        </Link>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LecturerTimetable({ weeklySchedules, todaySessions }: Props) {
    const [time, setTime] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Day>(() => {
        const d = new Date().getDay();
        return (DAYS[d - 1] ?? 'monday') as Day;
    });

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const hour         = time.getHours();
    const currentBlock = hour >= 8 && hour < 18 ? hour - 7 : null;
    const todayName    = DAYS[time.getDay() - 1] as Day | undefined;
    const timeStr      = time.toLocaleTimeString('en-GB', { hour12: false });
    const dateStr      = time.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Per-day class count
    const dayCounts = DAYS.reduce<Record<string, number>>((acc, d) => {
        acc[d] = [...new Set(weeklySchedules.filter(s => s.day_of_week === d).map(s => s.subject_id))].length;
        return acc;
    }, {});

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Timetable" />

            <div style={{ padding: '24px 28px', maxWidth: 1100, fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>My Timetable</h1>
                        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>{dateStr}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'monospace', color: '#111827' }}>{timeStr}</span>
                        <Link href="/lecturer/dashboard" style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', textDecoration: 'none', padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff' }}>
                            ← Dashboard
                        </Link>
                    </div>
                </div>

                {/* ── Weekly grid ── */}
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14 }}>
                    <div style={{ padding: '14px 22px 10px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CalendarDays size={16} color="#6D28D9" />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Weekly Schedule</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>
                            {weeklySchedules.length > 0 ? `${[...new Set(weeklySchedules.map(s => s.subject_id))].length} subject${[...new Set(weeklySchedules.map(s => s.subject_id))].length !== 1 ? 's' : ''}` : 'No schedules'}
                        </span>
                    </div>
                    <TimetableGrid schedules={weeklySchedules} currentBlock={currentBlock} />
                </div>

                {/* ── Day breakdown + Today's sessions ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                    {/* Day breakdown */}
                    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14 }}>
                        <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #F3F4F6' }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Day Breakdown</span>
                        </div>

                        {/* Day tabs */}
                        <div style={{ display: 'flex', padding: '10px 14px', gap: 6, borderBottom: '1px solid #F3F4F6' }}>
                            {DAYS.map(d => {
                                const isActive  = selectedDay === d;
                                const isToday   = d === todayName;
                                const count     = dayCounts[d] ?? 0;
                                return (
                                    <button key={d} onClick={() => setSelectedDay(d)} style={{
                                        flex: 1, padding: '6px 4px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s',
                                        background: isActive ? '#111827' : isToday ? '#FFFBEB' : '#F9FAFB',
                                        color: isActive ? '#fff' : isToday ? '#92400E' : '#6B7280',
                                        borderColor: isActive ? '#111827' : isToday ? '#FCD34D' : '#E5E7EB',
                                        fontWeight: isActive || isToday ? 700 : 400,
                                    }}>
                                        <div style={{ fontSize: 11 }}>{DAY_SHORT[d]}</div>
                                        <div style={{ fontSize: 9, marginTop: 2, opacity: 0.7 }}>{count} class{count !== 1 ? 'es' : ''}</div>
                                    </button>
                                );
                            })}
                        </div>

                        <DayPanel day={selectedDay} schedules={weeklySchedules} />
                    </div>

                    {/* Today's sessions */}
                    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14 }}>
                        <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <ClipboardList size={16} color="#065F46" />
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Today's Sessions</span>
                            </div>
                            <Link href="/lecturer/sessions" style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, padding: '5px 10px', border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff' }}>
                                All sessions <ChevronRight size={11} />
                            </Link>
                        </div>

                        {todaySessions.length === 0 ? (
                            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                                <ClipboardList size={24} style={{ display: 'block', margin: '0 auto 8px', color: '#E5E7EB' }} />
                                <p style={{ fontSize: 13, margin: 0 }}>No sessions today</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px' }}>
                                {todaySessions.map(s => {
                                    const isNow  = currentBlock !== null && s.start_block <= currentBlock && currentBlock <= s.end_block;
                                    const st     = SESSION_STATUS[s.status] ?? SESSION_STATUS.scheduled;
                                    return (
                                        <div key={s.id} style={{ padding: '11px 14px', borderRadius: 10, border: isNow ? '1px solid #C7D2FE' : '1px solid #F3F4F6', background: isNow ? '#EEF2FF' : '#FAFAFA', display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{s.subject_code}</span>
                                                    {isNow && <span style={{ fontSize: 9, fontWeight: 700, background: '#6366F1', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>NOW</span>}
                                                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{s.status}</span>
                                                </div>
                                                <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>
                                                    {s.subject_name} · {s.time}{s.room ? ` · ${s.room}` : ''}
                                                </p>
                                            </div>
                                            <Link href={`/subjects/${s.subject_id}/sessions/${s.id}/attendance`} style={{ fontSize: 11, fontWeight: 500, color: '#374151', textDecoration: 'none', padding: '5px 10px', border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff', whiteSpace: 'nowrap' }}>
                                                Attendance →
                                            </Link>
                                        </div>
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
