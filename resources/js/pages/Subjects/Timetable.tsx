// resources/js/pages/Subjects/Timetable.tsx

import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    BookOpen, ChevronLeft, Plus, Trash2, AlertTriangle,
    CheckCircle, Calendar, Clock, RefreshCw, X, Zap,
    CalendarDays, Flag,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Subject {
    id: number;
    code: string;
    name: string;
    start_date: string | null;
    end_date: string | null;
    status: string;
}

interface Schedule {
    id: number;
    subject_id: number;
    day_of_week: DayOfWeek;
    start_block: number;
    end_block: number;
    type: SessionType;
    time_range: string;
    block_count: number;
}

interface OtherSchedule {
    id: number;
    subject_code: string;
    day_of_week: DayOfWeek;
    start_block: number;
    end_block: number;
    type: SessionType;
    time_range: string;
}

interface ConflictInfo {
    day: DayOfWeek;
    start_block: number;
    end_block: number;
    conflicting_subject: string;
    conflicting_type: string;
    conflicting_time: string;
}

interface Props {
    subject: Subject;
    schedules: Schedule[];
    otherSchedules: OtherSchedule[];
    conflicts: ConflictInfo[];
    generatedCount: number | null;
    pendingHolidays: number;
}

type DayOfWeek   = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
type SessionType = 'lecture' | 'lab' | 'tutorial';

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
    const start = `${String(h).padStart(2,'0')}:00`;
    const end   = `${String(h+1).padStart(2,'0')}:00`;
    return { block: i + 1, start, end, label: `${h < 12 ? h : h-12}${h < 12 ? 'am' : 'pm'}` };
});

const TYPE_CONFIG: Record<SessionType, { label: string; bg: string; color: string; border: string }> = {
    lecture:  { label: 'Lecture',  bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE' },
    lab:      { label: 'Lab',      bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
    tutorial: { label: 'Tutorial', bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
};

// ─── Add schedule modal ───────────────────────────────────────────────────────
function AddScheduleModal({
    subjectId,
    existingSchedules,
    otherSchedules,
    onClose,
}: {
    subjectId: number;
    existingSchedules: Schedule[];
    otherSchedules: OtherSchedule[];
    onClose: () => void;
}) {
    const [day, setDay]             = useState<DayOfWeek>('monday');
    const [startBlock, setStartBlock] = useState(0);
    const [endBlock, setEndBlock]   = useState(0);
    const [type, setType]           = useState<SessionType>('lecture');
    const [processing, setProcessing] = useState(false);
    const [error, setError]         = useState<string | null>(null);

    // Check overlap against existing schedules and other subjects for same day
    const checkOverlap = (sb: number, eb: number, d: DayOfWeek): string | null => {
        for (const s of existingSchedules) {
            if (s.day_of_week !== d) continue;
            if (sb <= s.end_block && eb >= s.start_block)
                return `Conflicts with ${s.type} (${s.time_range}) on ${DAY_FULL[d]}`;
        }
        for (const s of otherSchedules) {
            if (s.day_of_week !== d) continue;
            if (sb <= s.end_block && eb >= s.start_block)
                return `Conflicts with ${s.subject_code} (${s.time_range}) on ${DAY_FULL[d]}`;
        }
        return null;
    };

    const handleBlockClick = (block: number) => {
        if (startBlock === 0 || endBlock !== 0) {
            setStartBlock(block);
            setEndBlock(0);
            setError(null);
        } else {
            if (block < startBlock) {
                setStartBlock(block);
                setEndBlock(0);
            } else {
                const conflict = checkOverlap(startBlock, block, day);
                if (conflict) {
                    setError(conflict);
                    setEndBlock(0);
                    setStartBlock(0);
                } else {
                    setEndBlock(block);
                    setError(null);
                }
            }
        }
    };

    const handleDayChange = (d: DayOfWeek) => {
        setDay(d);
        setStartBlock(0);
        setEndBlock(0);
        setError(null);
    };

    const submit = () => {
        if (startBlock === 0 || endBlock === 0) return;
        setProcessing(true);
        router.post(`/subjects/${subjectId}/schedules`, {
            day_of_week: day,
            start_block: startBlock,
            end_block:   endBlock,
            type,
        }, {
            preserveScroll: true,
            onSuccess: () => { setProcessing(false); onClose(); },
            onError:   (e) => { setProcessing(false); setError(Object.values(e)[0] as string); },
        });
    };

    const totalBlocks = endBlock > 0 ? endBlock - startBlock + 1 : 0;

    // Occupied blocks on selected day (this subject)
    const occupiedBlocks = new Set(
        existingSchedules
            .filter((s) => s.day_of_week === day)
            .flatMap((s) => Array.from({ length: s.end_block - s.start_block + 1 }, (_, i) => s.start_block + i))
    );

    // Other subjects' blocks on selected day: block → subject_code
    const otherBlockMap = new Map<number, string>();
    otherSchedules
        .filter((s) => s.day_of_week === day)
        .forEach((s) => {
            for (let b = s.start_block; b <= s.end_block; b++) otherBlockMap.set(b, s.subject_code);
        });

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', maxWidth: 560, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
                {/* Header */}
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Plus size={18} color="#7C3AED" />
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Add recurring schedule</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding: 24 }}>
                    {/* Day selector */}
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 10px' }}>Day of week</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {DAYS.map((d) => (
                                <button key={d} onClick={() => handleDayChange(d)}
                                    style={{ flex: 1, height: 38, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', borderRadius: 9, cursor: 'pointer', border: day === d ? 'none' : '1px solid #E5E7EB', background: day === d ? '#111827' : '#F9FAFB', color: day === d ? '#fff' : '#374151', transition: 'all 0.1s' }}>
                                    {DAY_LABELS[d]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Session type */}
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 10px' }}>Session type</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {(Object.keys(TYPE_CONFIG) as SessionType[]).map((t) => {
                                const cfg = TYPE_CONFIG[t];
                                return (
                                    <button key={t} onClick={() => setType(t)}
                                        style={{ flex: 1, height: 36, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', borderRadius: 8, cursor: 'pointer', border: type === t ? `1px solid ${cfg.border}` : '1px solid #E5E7EB', background: type === t ? cfg.bg : '#F9FAFB', color: type === t ? cfg.color : '#6B7280', transition: 'all 0.1s' }}>
                                        {cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Block picker */}
                    <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 10px' }}>
                            Time blocks
                            <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#9CA3AF' }}>
                                — click start then end
                            </span>
                        </p>

                        {/* Hour labels */}
                        <div style={{ display: 'flex', marginBottom: 4 }}>
                            {BLOCKS.map((b) => (
                                <div key={b.block} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#9CA3AF', fontFamily: 'monospace' }}>
                                    {b.label}
                                </div>
                            ))}
                        </div>

                        {/* Blocks */}
                        <div style={{ display: 'flex', gap: 3 }}>
                            {BLOCKS.map((b) => {
                                const occupied  = occupiedBlocks.has(b.block);
                                const otherCode = !occupied ? otherBlockMap.get(b.block) : undefined;
                                const isBlocked = occupied || !!otherCode;
                                const isSelected = !isBlocked && startBlock !== 0 && endBlock !== 0 && b.block >= startBlock && b.block <= endBlock;
                                const isPending  = !isBlocked && b.block === startBlock && endBlock === 0;
                                const cfg = TYPE_CONFIG[type];

                                return (
                                    <div key={b.block}
                                        onClick={() => !isBlocked && handleBlockClick(b.block)}
                                        title={
                                            occupied  ? 'Already scheduled for this subject' :
                                            otherCode ? `${otherCode} is scheduled here` :
                                            `Block ${b.block}: ${b.start}–${b.end}`
                                        }
                                        style={{
                                            flex: 1, height: 48, borderRadius: 8,
                                            cursor: isBlocked ? 'not-allowed' : 'pointer',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                                            transition: 'all 0.1s',
                                            background: occupied  ? '#F3F4F6'  : otherCode ? '#FEF3C7'           : isSelected ? cfg.bg    : isPending ? '#F0FDF4'    : '#F9FAFB',
                                            border:     occupied  ? '2px solid #E5E7EB' : otherCode ? '2px solid #FCD34D' : isSelected ? `2px solid ${cfg.border}` : isPending ? '2px solid #86EFAC' : '2px solid transparent',
                                            opacity: occupied ? 0.45 : 1,
                                        }}
                                    >
                                        <span style={{ fontSize: otherCode ? 8 : 12, fontWeight: 700, color: occupied ? '#D1D5DB' : otherCode ? '#92400E' : isSelected ? cfg.color : isPending ? '#15803D' : '#9CA3AF', lineHeight: 1, textAlign: 'center', padding: '0 2px' }}>
                                            {otherCode ?? b.block}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary */}
                        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 9, background: startBlock === 0 ? '#F9FAFB' : endBlock === 0 ? '#FFFBEB' : TYPE_CONFIG[type].bg, border: `1px solid ${startBlock === 0 ? '#E5E7EB' : endBlock === 0 ? '#FDE68A' : TYPE_CONFIG[type].border}`, minHeight: 38, display: 'flex', alignItems: 'center' }}>
                            {startBlock === 0 ? (
                                <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Click a block to set start time</p>
                            ) : endBlock === 0 ? (
                                <p style={{ fontSize: 13, color: '#92400E', margin: 0 }}>
                                    Start: <strong>{BLOCKS[startBlock-1].start}</strong> — now click end block
                                </p>
                            ) : (
                                <p style={{ fontSize: 13, color: TYPE_CONFIG[type].color, margin: 0, fontWeight: 500 }}>
                                    {DAY_FULL[day]} · {BLOCKS[startBlock-1].start} – {BLOCKS[endBlock-1].end} · {totalBlocks} hr{totalBlocks!==1?'s':''} · {TYPE_CONFIG[type].label}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 9, fontSize: 13, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <AlertTriangle size={14} />
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button onClick={onClose} style={{ height: 36, padding: '0 16px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button onClick={submit}
                            disabled={startBlock === 0 || endBlock === 0 || processing}
                            style={{ height: 36, padding: '0 18px', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', background: startBlock > 0 && endBlock > 0 ? '#111827' : '#E5E7EB', color: startBlock > 0 && endBlock > 0 ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 8, cursor: startBlock > 0 && endBlock > 0 ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Plus size={13} />
                            {processing ? 'Saving…' : 'Add schedule'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Generate sessions confirm modal ─────────────────────────────────────────
function GenerateModal({
    subject,
    schedules,
    onClose,
    onConfirm,
    processing,
}: {
    subject: Subject;
    schedules: Schedule[];
    onClose: () => void;
    onConfirm: () => void;
    processing: boolean;
}) {
    if (!subject.start_date || !subject.end_date) return null;

    const start  = new Date(subject.start_date);
    const end    = new Date(subject.end_date);
    const weeks  = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const estimated = schedules.length * weeks;

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Zap size={18} color="#D97706" />
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>Generate sessions</p>
                </div>
                <div style={{ padding: 20 }}>
                    <p style={{ fontSize: 14, color: '#374151', marginBottom: 12 }}>
                        This will generate all weekly sessions from{' '}
                        <strong>{new Date(subject.start_date + 'T00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                        {' '}to{' '}
                        <strong>{new Date(subject.end_date + 'T00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>.
                    </p>

                    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                        <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 8px' }}>What will be generated:</p>
                        {schedules.map((s) => {
                            const cfg = TYPE_CONFIG[s.type];
                            return (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontWeight: 500 }}>
                                        {cfg.label}
                                    </span>
                                    <span style={{ fontSize: 13, color: '#374151' }}>
                                        Every {DAY_FULL[s.day_of_week]} · {s.time_range}
                                    </span>
                                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>~{weeks} sessions</span>
                                </div>
                            );
                        })}
                        <p style={{ fontSize: 12, color: '#6B7280', margin: '10px 0 0', borderTop: '1px solid #E5E7EB', paddingTop: 8 }}>
                            ~<strong>{estimated}</strong> sessions total · public holidays will be flagged for review
                        </p>
                    </div>

                    <div style={{ padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 9, fontSize: 13, color: '#92400E', display: 'flex', gap: 8, marginBottom: 16 }}>
                        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>Existing auto-generated sessions will be replaced. Manually edited sessions are kept.</span>
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button onClick={onClose} style={{ height: 36, padding: '0 16px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button onClick={onConfirm} disabled={processing}
                            style={{ height: 36, padding: '0 18px', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: processing ? 0.7 : 1 }}>
                            <Zap size={13} />
                            {processing ? 'Generating…' : 'Generate sessions'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SubjectTimetable({ subject, schedules, otherSchedules, conflicts, generatedCount, pendingHolidays }: Props) {
    const [showAddModal, setShowAddModal]       = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generating, setGenerating]           = useState(false);
    const [deleteTarget, setDeleteTarget]       = useState<Schedule | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Subjects',      href: '/subjects' },
        { title: subject.code,    href: `/subjects/${subject.id}` },
        { title: 'Timetable',     href: '#' },
    ];

    const handleDelete = (schedule: Schedule) => {
        router.delete(`/subjects/${subject.id}/schedules/${schedule.id}`, {
            preserveScroll: true,
        });
    };

    const handleGenerate = () => {
        setGenerating(true);
        router.post(`/subjects/${subject.id}/schedules/generate`, {}, {
            preserveScroll: true,
            onSuccess: () => { setGenerating(false); setShowGenerateModal(false); },
            onError:   () => setGenerating(false),
        });
    };

    const canGenerate = subject.start_date && subject.end_date && schedules.length > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Timetable — ${subject.code}`} />

            <style>{`
                .tt-card { background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 14px; }
                .tt-btn-primary { font-family: inherit; font-size: 13px; font-weight: 500; height: 36px; padding: 0 16px; background: #111827; color: #fff; border: none; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; text-decoration: none; }
                .tt-btn-primary:hover { opacity: 0.87; }
                .tt-btn-ghost { font-family: inherit; font-size: 13px; font-weight: 500; height: 36px; padding: 0 14px; background: #fff; color: #374151; border: 1px solid #E5E7EB; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; text-decoration: none; }
                .tt-btn-ghost:hover { background: #F9FAFB; }
            `}</style>

            <div style={{ padding: '28px 32px', maxWidth: 1100, fontFamily: 'inherit' }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Link href={`/subjects/${subject.id}`} className="tt-btn-ghost" style={{ padding: '0 10px' }}>
                            <ChevronLeft size={16} />
                        </Link>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CalendarDays size={22} color="#7C3AED" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
                                Timetable
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                <BookOpen size={12} color="#9CA3AF" />
                                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                                    {subject.code} — {subject.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        {pendingHolidays > 0 && (
                            <Link href={`/subjects/${subject.id}/holidays`} style={{ height: 36, padding: '0 14px', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
                                <Flag size={13} />
                                {pendingHolidays} holiday{pendingHolidays !== 1 ? 's' : ''} to review
                            </Link>
                        )}
                        <button onClick={() => setShowAddModal(true)} className="tt-btn-ghost">
                            <Plus size={13} />
                            Add schedule
                        </button>
                        <button
                            onClick={() => setShowGenerateModal(true)}
                            disabled={!canGenerate}
                            className="tt-btn-primary"
                            style={{ opacity: canGenerate ? 1 : 0.4, cursor: canGenerate ? 'pointer' : 'not-allowed' }}
                            title={!canGenerate ? 'Set semester dates and add at least one schedule first' : ''}
                        >
                            <Zap size={13} />
                            Generate sessions
                        </button>
                    </div>
                </div>

                {/* ── Semester dates info ── */}
                <div className="tt-card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Calendar size={14} color="#9CA3AF" />
                            <span style={{ fontSize: 13, color: '#374151' }}>
                                {subject.start_date && subject.end_date ? (
                                    <>
                                        <strong>Semester: </strong>
                                        {new Date(subject.start_date + 'T00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        {' – '}
                                        {new Date(subject.end_date + 'T00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </>
                                ) : (
                                    <span style={{ color: '#DC2626' }}>⚠ Semester dates not set — edit subject first</span>
                                )}
                            </span>
                        </div>
                        {generatedCount !== null && (
                            <>
                                <div style={{ width: 1, height: 16, background: '#E5E7EB' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <CheckCircle size={13} color="#059669" />
                                    <span style={{ fontSize: 13, color: '#059669' }}>
                                        {generatedCount} sessions generated
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                    <Link href={`/subjects/${subject.id}/edit`} className="tt-btn-ghost" style={{ height: 30, padding: '0 12px', fontSize: 12 }}>
                        Edit dates
                    </Link>
                </div>

                {/* ── Conflicts warning ── */}
                {conflicts.length > 0 && (
                    <div style={{ padding: '14px 20px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <AlertTriangle size={16} color="#DC2626" />
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#991B1B', margin: 0 }}>
                                {conflicts.length} schedule conflict{conflicts.length !== 1 ? 's' : ''} detected
                            </p>
                        </div>
                        {conflicts.map((c, i) => (
                            <p key={i} style={{ fontSize: 12, color: '#B91C1C', margin: '4px 0 0', paddingLeft: 24 }}>
                                • {DAY_FULL[c.day]} Block {c.start_block}–{c.end_block} conflicts with {c.conflicting_subject} ({c.conflicting_type}) at {c.conflicting_time}
                            </p>
                        ))}
                    </div>
                )}

                {/* ── Visual timetable grid ── */}
                <div className="tt-card" style={{ overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF', margin: 0 }}>
                            Weekly timetable
                        </p>
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
                        {DAYS.map((day) => {
                            const daySchedules      = schedules.filter((s) => s.day_of_week === day);
                            const dayOtherSchedules = otherSchedules.filter((s) => s.day_of_week === day);

                            return (
                                <div key={day} style={{ display: 'grid', gridTemplateColumns: '80px repeat(10, 1fr)', gap: 3, marginBottom: 4 }}>
                                    {/* Day label */}
                                    <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600, color: '#374151', paddingRight: 8 }}>
                                        {DAY_FULL[day]}
                                    </div>

                                    {/* Block cells */}
                                    {BLOCKS.map((b) => {
                                        const sched      = daySchedules.find((s) => b.block >= s.start_block && b.block <= s.end_block);
                                        const otherSched = !sched ? dayOtherSchedules.find((s) => b.block >= s.start_block && b.block <= s.end_block) : undefined;
                                        const isStart    = sched && b.block === sched.start_block;
                                        const otherIsStart = otherSched && b.block === otherSched.start_block;
                                        const cfg        = sched ? TYPE_CONFIG[sched.type] : null;

                                        return (
                                            <div key={b.block}
                                                title={otherSched ? `${otherSched.subject_code} · ${otherSched.time_range}` : undefined}
                                                style={{
                                                    height: 40, borderRadius: 7,
                                                    background: cfg ? cfg.bg : otherSched ? '#F3F4F6' : '#F9FAFB',
                                                    border: cfg ? `1px solid ${cfg.border}` : otherSched ? '1px dashed #D1D5DB' : '1px solid #F3F4F6',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    position: 'relative', overflow: 'hidden',
                                                }}
                                            >
                                                {isStart && sched && (
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: cfg!.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 4px' }}>
                                                        {TYPE_CONFIG[sched.type].label}
                                                    </span>
                                                )}
                                                {otherIsStart && otherSched && (
                                                    <span style={{ fontSize: 9, fontWeight: 600, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 4px' }}>
                                                        {otherSched.subject_code}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: 16, padding: '10px 20px', borderTop: '1px solid #F3F4F6', flexWrap: 'wrap' }}>
                        {(Object.keys(TYPE_CONFIG) as SessionType[]).map((t) => (
                            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6B7280' }}>
                                <span style={{ width: 12, height: 12, borderRadius: 3, background: TYPE_CONFIG[t].bg, border: `1px solid ${TYPE_CONFIG[t].border}`, display: 'inline-block', flexShrink: 0 }} />
                                {TYPE_CONFIG[t].label}
                            </span>
                        ))}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6B7280' }}>
                            <span style={{ width: 12, height: 12, borderRadius: 3, background: '#F3F4F6', border: '1px dashed #D1D5DB', display: 'inline-block', flexShrink: 0 }} />
                            Other subject
                        </span>
                    </div>
                </div>

                {/* ── Schedule list ── */}
                <div className="tt-card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF', margin: 0 }}>
                            Recurring schedules ({schedules.length})
                        </p>
                        <button onClick={() => setShowAddModal(true)} className="tt-btn-ghost" style={{ height: 30, padding: '0 12px', fontSize: 12 }}>
                            <Plus size={12} />Add
                        </button>
                    </div>

                    {schedules.length === 0 ? (
                        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                            <CalendarDays size={36} style={{ color: '#E5E7EB', margin: '0 auto 12px', display: 'block' }} />
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>No schedules yet</p>
                            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4, marginBottom: 16 }}>
                                Add recurring time slots for this subject
                            </p>
                            <button onClick={() => setShowAddModal(true)} className="tt-btn-primary" style={{ display: 'inline-flex' }}>
                                <Plus size={13} />Add schedule
                            </button>
                        </div>
                    ) : (
                        schedules.map((s, i) => {
                            const cfg = TYPE_CONFIG[s.type];
                            const confirming = deleteTarget?.id === s.id;
                            return (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < schedules.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0 }}>
                                        {cfg.label}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>
                                            Every {DAY_FULL[s.day_of_week]}
                                        </p>
                                        <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0', fontFamily: 'monospace' }}>
                                            {s.time_range} · {s.block_count} block{s.block_count !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    {confirming ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                            <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 500 }}>Remove?</span>
                                            <button onClick={() => { handleDelete(s); setDeleteTarget(null); }} style={{ height: 26, padding: '0 10px', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Yes</button>
                                            <button onClick={() => setDeleteTarget(null)} style={{ height: 26, padding: '0 10px', fontSize: 11, fontWeight: 500, fontFamily: 'inherit', background: '#fff', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer' }}>No</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteTarget(s)}
                                            style={{ width: 30, height: 30, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', flexShrink: 0 }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modals */}
            {showAddModal && (
                <AddScheduleModal
                    subjectId={subject.id}
                    existingSchedules={schedules}
                    otherSchedules={otherSchedules}
                    onClose={() => setShowAddModal(false)}
                />
            )}
            {showGenerateModal && (
                <GenerateModal
                    subject={subject}
                    schedules={schedules}
                    onClose={() => setShowGenerateModal(false)}
                    onConfirm={handleGenerate}
                    processing={generating}
                />
            )}
        </AppLayout>
    );
}