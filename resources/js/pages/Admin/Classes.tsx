import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    BookOpen, CalendarDays, Users, Clock, ChevronRight,
    LayoutGrid, List, AlertTriangle, CheckCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type DayOfWeek   = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
type SessionType = 'lecture' | 'lab' | 'tutorial';
type ViewMode    = 'grid' | 'list';

interface Schedule {
    id: number;
    day_of_week: DayOfWeek;
    start_block: number;
    end_block: number;
    type: SessionType;
    time_range: string;
    block_count: number;
}

interface Subject {
    id: number;
    code: string;
    name: string;
    status: 'active' | 'inactive';
    credit_hours: number;
    start_date: string | null;
    end_date: string | null;
    lecturer: string;
    students_count: number;
    sessions_count: number;
    schedules: Schedule[];
}

interface Props {
    subjects: Subject[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_LABELS: Record<DayOfWeek, string> = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri',
};
const DAY_FULL: Record<DayOfWeek, string> = {
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday',
};

const BLOCKS = Array.from({ length: 10 }, (_, i) => {
    const h = 8 + i;
    return {
        block: i + 1,
        start: `${String(h).padStart(2, '0')}:00`,
        end:   `${String(h + 1).padStart(2, '0')}:00`,
        label: `${h < 12 ? h : h - 12}${h < 12 ? 'am' : 'pm'}`,
    };
});

const TYPE_CONFIG: Record<SessionType, { label: string; bg: string; color: string; border: string }> = {
    lecture:  { label: 'Lecture',  bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE' },
    lab:      { label: 'Lab',      bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
    tutorial: { label: 'Tutorial', bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
};

// 12 visually distinct subject colours (bg / text / border)
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '#' },
    { title: 'Classes', href: '/admin/classes' },
];

// ─── Mini timetable grid (used in each subject card) ─────────────────────────
function MiniGrid({ schedules, paletteIdx }: { schedules: Schedule[]; paletteIdx: number }) {
    const pal = SUBJECT_PALETTE[paletteIdx % SUBJECT_PALETTE.length];

    if (schedules.length === 0) {
        return (
            <div style={{ padding: '14px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
                No schedule set
            </div>
        );
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            {/* Time header */}
            <div style={{ display: 'grid', gridTemplateColumns: '42px repeat(10, 1fr)', gap: 2, marginBottom: 4 }}>
                <div />
                {BLOCKS.map((b) => (
                    <div key={b.block} style={{ textAlign: 'center', fontSize: 9, color: '#9CA3AF', fontFamily: 'monospace' }}>
                        {b.label}
                    </div>
                ))}
            </div>

            {/* Day rows */}
            {DAYS.map((day) => {
                const dayScheds = schedules.filter((s) => s.day_of_week === day);
                const hasAny = dayScheds.length > 0;

                return (
                    <div key={day} style={{ display: 'grid', gridTemplateColumns: '42px repeat(10, 1fr)', gap: 2, marginBottom: 2 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: hasAny ? '#374151' : '#D1D5DB', display: 'flex', alignItems: 'center' }}>
                            {DAY_LABELS[day]}
                        </div>
                        {BLOCKS.map((b) => {
                            const sched   = dayScheds.find((s) => b.block >= s.start_block && b.block <= s.end_block);
                            const isStart = sched && b.block === sched.start_block;
                            const cfg     = sched ? TYPE_CONFIG[sched.type] : null;

                            return (
                                <div key={b.block} style={{
                                    height: 26, borderRadius: 4,
                                    background: cfg ? cfg.bg : '#F9FAFB',
                                    border: cfg ? `1px solid ${cfg.border}` : '1px solid #F3F4F6',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden',
                                }}>
                                    {isStart && sched && (
                                        <span style={{ fontSize: 8, fontWeight: 700, color: cfg!.color, whiteSpace: 'nowrap', padding: '0 3px' }}>
                                            {TYPE_CONFIG[sched.type].label.slice(0, 3)}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Master consolidated timetable ───────────────────────────────────────────
function MasterGrid({ subjects, filter }: { subjects: Subject[]; filter: string }) {
    const filtered = filter === 'all' ? subjects : subjects.filter((s) => s.status === filter);

    // Build a lookup: day → block → { subject, type }
    type SlotInfo = { subject: Subject; type: SessionType; paletteIdx: number };
    const grid: Record<DayOfWeek, Record<number, SlotInfo>> = {
        monday: {}, tuesday: {}, wednesday: {}, thursday: {}, friday: {},
    };

    filtered.forEach((subj, idx) => {
        subj.schedules.forEach((sc) => {
            for (let b = sc.start_block; b <= sc.end_block; b++) {
                if (!grid[sc.day_of_week][b]) {
                    grid[sc.day_of_week][b] = { subject: subj, type: sc.type, paletteIdx: idx };
                }
            }
        });
    });

    // Count weekly booked blocks
    const bookedBlocks = filtered.reduce((sum, s) =>
        sum + s.schedules.reduce((s2, sc) => s2 + sc.block_count, 0), 0);

    return (
        <div>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                    { val: filtered.length,  lbl: 'Subjects',      color: '#1D4ED8', bg: '#DBEAFE' },
                    { val: filtered.filter(s => s.status === 'active').length, lbl: 'Active', color: '#065F46', bg: '#D1FAE5' },
                    { val: bookedBlocks,     lbl: 'hrs/week booked', color: '#6D28D9', bg: '#EDE9FE' },
                    { val: 50 - bookedBlocks, lbl: 'hrs/week free', color: '#9CA3AF', bg: '#F3F4F6' },
                ].map((stat) => (
                    <div key={stat.lbl} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, flex: '1 1 0', minWidth: 120 }}>
                        <span style={{ width: 36, height: 36, borderRadius: 9, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: stat.color, flexShrink: 0 }}>
                            {stat.val}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{stat.lbl}</span>
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF', margin: 0 }}>
                        Consolidated weekly timetable
                    </p>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>08:00 – 18:00</span>
                </div>

                <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
                    {/* Time header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(10, 1fr)', gap: 3, marginBottom: 6 }}>
                        <div />
                        {BLOCKS.map((b) => (
                            <div key={b.block} style={{ textAlign: 'center', fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>
                                {b.start}
                            </div>
                        ))}
                    </div>

                    {/* Day rows */}
                    {DAYS.map((day) => (
                        <div key={day} style={{ display: 'grid', gridTemplateColumns: '80px repeat(10, 1fr)', gap: 3, marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600, color: '#374151', paddingRight: 8 }}>
                                {DAY_FULL[day]}
                            </div>
                            {BLOCKS.map((b) => {
                                const slot = grid[day][b.block];
                                const pal  = slot ? SUBJECT_PALETTE[slot.paletteIdx % SUBJECT_PALETTE.length] : null;

                                // Only render label at start block
                                const isStart = slot && filtered.find((s) => s.id === slot.subject.id)
                                    ?.schedules.some((sc) => sc.day_of_week === day && sc.start_block === b.block);

                                return (
                                    <div key={b.block}
                                        title={slot ? `${slot.subject.code} – ${slot.subject.name} (${TYPE_CONFIG[slot.type].label})` : undefined}
                                        style={{
                                            height: 44, borderRadius: 7,
                                            background: pal ? pal.bg : '#F9FAFB',
                                            border: pal ? `1px solid ${pal.border}` : '1px solid #F3F4F6',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            overflow: 'hidden', cursor: slot ? 'pointer' : 'default',
                                            transition: 'filter 0.1s',
                                        }}
                                        onClick={() => slot && (window.location.href = `/subjects/${slot.subject.id}/schedules`)}
                                        onMouseEnter={(e) => { if (slot) e.currentTarget.style.filter = 'brightness(0.94)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
                                    >
                                        {isStart && slot && (
                                            <span style={{ fontSize: 9, fontWeight: 700, color: pal!.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 4px', textAlign: 'center', lineHeight: 1.2 }}>
                                                {slot.subject.code}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div style={{ padding: '10px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginRight: 4 }}>Subjects:</span>
                    {filtered.map((s, idx) => {
                        const pal = SUBJECT_PALETTE[idx % SUBJECT_PALETTE.length];
                        return (
                            <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6B7280' }}>
                                <span style={{ width: 12, height: 12, borderRadius: 3, background: pal.bg, border: `1px solid ${pal.border}`, display: 'inline-block', flexShrink: 0 }} />
                                {s.code}
                            </span>
                        );
                    })}
                    {filtered.length === 0 && (
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>No subjects match the current filter</span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Subject card ─────────────────────────────────────────────────────────────
function SubjectCard({ subject, paletteIdx }: { subject: Subject; paletteIdx: number }) {
    const [expanded, setExpanded] = useState(false);
    const pal = SUBJECT_PALETTE[paletteIdx % SUBJECT_PALETTE.length];

    const weeklyHours = subject.schedules.reduce((sum, sc) => sum + sc.block_count, 0);
    const daysSummary = [...new Set(subject.schedules.map((s) => DAY_LABELS[s.day_of_week]))].join(', ');

    return (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', transition: 'box-shadow 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
        >
            {/* Card header */}
            <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Colour swatch */}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: pal.bg, border: `1px solid ${pal.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: pal.color }}>
                        {subject.code.replace(/[^A-Z0-9]/gi, '').slice(0, 3)}
                    </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {subject.code}
                        </p>
                        <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                            background: subject.status === 'active' ? '#D1FAE5' : '#F3F4F6',
                            color:      subject.status === 'active' ? '#065F46' : '#6B7280',
                            border:     subject.status === 'active' ? '1px solid #6EE7B7' : '1px solid #E5E7EB',
                        }}>
                            {subject.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {subject.name}
                    </p>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}>
                        <Users size={12} />
                        {subject.students_count}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}>
                        <Clock size={12} />
                        {weeklyHours}h/wk
                    </span>

                    {/* Expand toggle */}
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        style={{ width: 28, height: 28, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', transition: 'all 0.15s' }}
                    >
                        <CalendarDays size={13} />
                    </button>

                    <Link
                        href={`/subjects/${subject.id}/schedules`}
                        style={{ width: 28, height: 28, background: pal.bg, border: `1px solid ${pal.border}`, borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: pal.color, textDecoration: 'none' }}
                        title="View full timetable"
                    >
                        <ChevronRight size={13} />
                    </Link>
                </div>
            </div>

            {/* Quick schedule summary (always visible) */}
            {subject.schedules.length > 0 && !expanded && (
                <div style={{ padding: '0 18px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {subject.schedules.map((sc) => {
                        const cfg = TYPE_CONFIG[sc.type];
                        return (
                            <span key={sc.id} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontWeight: 500 }}>
                                {DAY_LABELS[sc.day_of_week]} · {sc.time_range} · {cfg.label}
                            </span>
                        );
                    })}
                </div>
            )}

            {subject.schedules.length === 0 && !expanded && (
                <div style={{ padding: '0 18px 12px' }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <AlertTriangle size={11} />
                        No schedule configured
                    </span>
                </div>
            )}

            {/* Expanded mini-grid */}
            {expanded && (
                <div style={{ borderTop: '1px solid #F3F4F6', padding: '12px 18px' }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 12, color: '#6B7280' }}>
                        <span><strong style={{ color: '#374151' }}>Lecturer:</strong> {subject.lecturer}</span>
                        <span><strong style={{ color: '#374151' }}>Credits:</strong> {subject.credit_hours}</span>
                        {subject.start_date && <span><strong style={{ color: '#374151' }}>Semester:</strong> {subject.start_date} – {subject.end_date}</span>}
                        <span><strong style={{ color: '#374151' }}>Sessions:</strong> {subject.sessions_count} generated</span>
                    </div>
                    <MiniGrid schedules={subject.schedules} paletteIdx={paletteIdx} />
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                        <Link href={`/subjects/${subject.id}`} style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <BookOpen size={11} /> View subject
                        </Link>
                        <span style={{ color: '#E5E7EB' }}>·</span>
                        <Link href={`/subjects/${subject.id}/schedules`} style={{ fontSize: 12, color: pal.color, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                            <CalendarDays size={11} /> Edit timetable
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminClasses({ subjects }: Props) {
    const [filter,   setFilter]   = useState<'all' | 'active' | 'inactive'>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [search,   setSearch]   = useState('');

    const filtered = subjects.filter((s) => {
        const matchStatus = filter === 'all' || s.status === filter;
        const matchSearch = search === '' ||
            s.code.toLowerCase().includes(search.toLowerCase()) ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.lecturer.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    const totalWeeklyHours = subjects.reduce(
        (sum, s) => sum + s.schedules.reduce((s2, sc) => s2 + sc.block_count, 0), 0
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Classes — Admin" />

            <style>{`
                .cls-tab { font-family: inherit; font-size: 13px; font-weight: 500; height: 34px; padding: 0 14px; border-radius: 8px; cursor: pointer; border: 1px solid #E5E7EB; background: #fff; color: #374151; transition: all 0.1s; }
                .cls-tab.active { background: #111827; color: #fff; border-color: #111827; }
                .cls-tab:not(.active):hover { background: #F9FAFB; }
                .cls-icon-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #E5E7EB; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6B7280; transition: all 0.1s; }
                .cls-icon-btn.active { background: #111827; color: #fff; border-color: #111827; }
                .cls-icon-btn:not(.active):hover { background: #F9FAFB; }
            `}</style>

            <div style={{ padding: '28px 32px', maxWidth: 1200, fontFamily: 'inherit' }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CalendarDays size={22} color="#7C3AED" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>Classes</h1>
                            <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>
                                {subjects.length} subject{subjects.length !== 1 ? 's' : ''} · {totalWeeklyHours} hrs/week scheduled
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/subjects/create"
                        style={{ height: 36, padding: '0 16px', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}
                    >
                        + New subject
                    </Link>
                </div>

                {/* ── Toolbar ── */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
                        <BookOpen size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search subjects…"
                            style={{ width: '100%', height: 34, padding: '0 10px 0 32px', fontSize: 13, fontFamily: 'inherit', border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', boxSizing: 'border-box', color: '#111827', background: '#fff' }}
                        />
                    </div>

                    {/* Status filter */}
                    <div style={{ display: 'flex', gap: 4 }}>
                        {(['all', 'active', 'inactive'] as const).map((f) => (
                            <button key={f} onClick={() => setFilter(f)} className={`cls-tab${filter === f ? ' active' : ''}`}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                        <button onClick={() => setViewMode('grid')} className={`cls-icon-btn${viewMode === 'grid' ? ' active' : ''}`} title="Card view">
                            <LayoutGrid size={14} />
                        </button>
                        <button onClick={() => setViewMode('list')} className={`cls-icon-btn${viewMode === 'list' ? ' active' : ''}`} title="List view">
                            <List size={14} />
                        </button>
                    </div>
                </div>

                {/* ── Master timetable ── */}
                <div style={{ marginBottom: 28 }}>
                    <MasterGrid subjects={filtered} filter={filter} />
                </div>

                {/* ── Subject cards / list ── */}
                <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 12px' }}>
                        Subject schedules ({filtered.length})
                    </p>
                </div>

                {filtered.length === 0 ? (
                    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '64px 20px', textAlign: 'center' }}>
                        <CalendarDays size={40} style={{ color: '#E5E7EB', display: 'block', margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>No subjects found</p>
                        <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Try adjusting your search or filter</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 12 }}>
                        {filtered.map((s) => {
                            const realIdx = subjects.indexOf(s);
                            return <SubjectCard key={s.id} subject={s} paletteIdx={realIdx} />;
                        })}
                    </div>
                ) : (
                    /* List view */
                    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
                        {filtered.map((s, i) => {
                            const realIdx = subjects.indexOf(s);
                            const pal = SUBJECT_PALETTE[realIdx % SUBJECT_PALETTE.length];
                            const weeklyHours = s.schedules.reduce((sum, sc) => sum + sc.block_count, 0);

                            return (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 9, background: pal.bg, border: `1px solid ${pal.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: pal.color }}>{s.code.replace(/[^A-Z0-9]/gi, '').slice(0, 3)}</span>
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{s.code}</span>
                                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: s.status === 'active' ? '#D1FAE5' : '#F3F4F6', color: s.status === 'active' ? '#065F46' : '#6B7280', border: s.status === 'active' ? '1px solid #6EE7B7' : '1px solid #E5E7EB' }}>
                                                {s.status === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                                    </div>

                                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6B7280', flexShrink: 0 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11} />{s.students_count}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{weeklyHours}h/wk</span>
                                        {s.schedules.length > 0
                                            ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={11} color="#059669" />{s.schedules.length} slot{s.schedules.length !== 1 ? 's' : ''}</span>
                                            : <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11} color="#D97706" />No schedule</span>
                                        }
                                    </div>

                                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                        <Link href={`/subjects/${s.id}`} style={{ height: 30, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', background: '#fff', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
                                            <BookOpen size={11} /> Subject
                                        </Link>
                                        <Link href={`/subjects/${s.id}/schedules`} style={{ height: 30, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', background: pal.bg, color: pal.color, border: `1px solid ${pal.border}`, borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', fontWeight: 600 }}>
                                            <CalendarDays size={11} /> Timetable
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
