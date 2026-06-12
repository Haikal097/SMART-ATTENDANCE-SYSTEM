// resources/js/pages/Attendance/Record.tsx

import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    CheckCircle, X, Clock, ChevronLeft,
    BookOpen, Calendar, MapPin, Users,
    Save, RotateCcw, Search, AlertTriangle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface Student {
    id: number;
    name: string;
    student_id: string;
    avatar_url: string | null;
    current_status: AttendanceStatus | null; // existing record if any
}

interface Session {
    id: number;
    date: string;
    start_block: number;
    end_block: number;
    start_time: string;
    end_time: string;
    room: string | null;
    status: string;
}

interface Subject {
    id: number;
    code: string;
    name: string;
}

interface Props {
    subject: Subject;
    session: Session;
    students: Student[];
}

// ─── Block map ────────────────────────────────────────────────────────────────
const BLOCKS: Record<number, { start: string; end: string }> = {
    1:  { start: '08:00', end: '09:00' },
    2:  { start: '09:00', end: '10:00' },
    3:  { start: '10:00', end: '11:00' },
    4:  { start: '11:00', end: '12:00' },
    5:  { start: '12:00', end: '13:00' },
    6:  { start: '13:00', end: '14:00' },
    7:  { start: '14:00', end: '15:00' },
    8:  { start: '15:00', end: '16:00' },
    9:  { start: '16:00', end: '17:00' },
    10: { start: '17:00', end: '18:00' },
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<AttendanceStatus, { label: string; bg: string; color: string; border: string; activeBg: string; icon: React.ReactNode }> = {
    present: {
        label: 'Present',
        bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', activeBg: '#16A34A',
        icon: <CheckCircle size={14} />,
    },
    late: {
        label: 'Late',
        bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', activeBg: '#D97706',
        icon: <Clock size={14} />,
    },
    excused: {
        label: 'Excused',
        bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', activeBg: '#2563EB',
        icon: <AlertTriangle size={14} />,
    },
    absent: {
        label: 'Absent',
        bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', activeBg: '#DC2626',
        icon: <X size={14} />,
    },
};

// ─── Single student row ───────────────────────────────────────────────────────
function StudentRow({
    student,
    status,
    onStatusChange,
}: {
    student: Student;
    status: AttendanceStatus;
    onStatusChange: (id: number, status: AttendanceStatus) => void;
}) {
    const initials = student.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '14px 20px',
            borderBottom: '1px solid #F9FAFB',
            transition: 'background 0.1s',
            background: status === 'present' ? 'rgba(22,163,74,0.02)' : status === 'absent' ? 'rgba(220,38,38,0.02)' : status === 'late' ? 'rgba(217,119,6,0.02)' : 'transparent',
        }}>
            {/* Avatar */}
            <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: status === 'present' ? '#DCFCE7' : status === 'absent' ? '#FEE2E2' : status === 'late' ? '#FEF3C7' : '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: status === 'present' ? '#15803D' : status === 'absent' ? '#B91C1C' : status === 'late' ? '#B45309' : '#6B7280',
                flexShrink: 0,
                transition: 'all 0.15s',
            }}>
                {initials}
            </div>

            {/* Name & ID */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>{student.name}</p>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0', fontFamily: 'monospace' }}>{student.student_id}</p>
            </div>

            {/* Status buttons */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => {
                    const cfg     = STATUS_CONFIG[s];
                    const active  = status === s;
                    return (
                        <button
                            key={s}
                            onClick={() => onStatusChange(student.id, s)}
                            title={cfg.label}
                            style={{
                                height: 34,
                                padding: '0 12px',
                                fontSize: 12,
                                fontWeight: 500,
                                fontFamily: 'inherit',
                                borderRadius: 8,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                transition: 'all 0.12s',
                                background: active ? cfg.activeBg : cfg.bg,
                                color:      active ? '#fff'        : cfg.color,
                                border:     active ? 'none'        : `1px solid ${cfg.border}`,
                                transform:  active ? 'scale(1.04)' : 'scale(1)',
                                boxShadow:  active ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                            }}
                        >
                            {cfg.icon}
                            {cfg.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AttendanceRecord({ subject, session, students }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Subjects',      href: '/subjects' },
        { title: subject.code,    href: `/subjects/${subject.id}` },
        { title: 'Attendance',    href: '#' },
    ];

    // Initialise status map from existing records
    const initialStatuses = Object.fromEntries(
        students.map((s) => [s.id, s.current_status ?? 'absent'])
    ) as Record<number, AttendanceStatus>;

    const [statuses, setStatuses]   = useState<Record<number, AttendanceStatus>>(initialStatuses);
    const [search, setSearch]       = useState('');
    const [saving, setSaving]       = useState(false);
    const [saved, setSaved]         = useState(false);
    const [filterStatus, setFilterStatus] = useState<AttendanceStatus | 'all'>('all');

    const handleStatusChange = (id: number, status: AttendanceStatus) => {
        setStatuses((prev) => ({ ...prev, [id]: status }));
        setSaved(false);
    };

    const markAll = (status: AttendanceStatus) => {
        const updated = Object.fromEntries(students.map((s) => [s.id, status])) as Record<number, AttendanceStatus>;
        setStatuses(updated);
        setSaved(false);
    };

    const reset = () => {
        setStatuses(initialStatuses);
        setSaved(false);
    };

    const save = () => {
        setSaving(true);
        const records = students.map((s) => ({
            student_id: s.id,
            status:     statuses[s.id] ?? 'absent',
        }));

        router.post(
            `/subjects/${subject.id}/sessions/${session.id}/attendance`,
            { records },
            {
                preserveScroll: true,
                onSuccess: () => { setSaving(false); setSaved(true); },
                onError:   () => setSaving(false),
            }
        );
    };

    // Counts
    const counts = students.reduce(
        (acc, s) => {
            const st = statuses[s.id] ?? 'absent';
            acc[st] = (acc[st] ?? 0) + 1;
            return acc;
        },
        {} as Record<AttendanceStatus, number>
    );

    const presentPct = students.length > 0
        ? Math.round(((counts.present ?? 0) / students.length) * 100)
        : 0;

    // Filtered list
    const filtered = students.filter((s) => {
        const matchSearch = search === '' ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.student_id.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || statuses[s.id] === filterStatus;
        return matchSearch && matchStatus;
    });

    const startTime = BLOCKS[session.start_block]?.start ?? '—';
    const endTime   = BLOCKS[session.end_block]?.end     ?? '—';
    const blocks    = session.end_block - session.start_block + 1;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Attendance — ${subject.code}`} />

            <style>{`
                .att-card { background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 14px; }
                .att-input { font-family: inherit; font-size: 13px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 8px 12px; color: #111827; outline: none; }
                .att-input:focus { border-color: #111827; background: #fff; }
                .att-btn { font-family: inherit; font-size: 13px; font-weight: 500; height: 36px; padding: 0 14px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.12s; }
                .att-btn-primary { background: #111827; color: #fff; border: none; }
                .att-btn-primary:hover { opacity: 0.87; }
                .att-btn-ghost { background: #fff; color: #374151; border: 1px solid #E5E7EB; }
                .att-btn-ghost:hover { background: #F9FAFB; }
            `}</style>

            <div style={{ padding: '28px 32px', maxWidth: 1000, fontFamily: 'inherit' }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Link href={`/subjects/${subject.id}`} className="att-btn att-btn-ghost" style={{ padding: '0 10px' }}>
                            <ChevronLeft size={16} />
                        </Link>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={22} color="#059669" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
                                Attendance
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                <BookOpen size={12} color="#9CA3AF" />
                                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                                    {subject.code} — {subject.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Save button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {saved && (
                            <span style={{ fontSize: 13, color: '#059669', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <CheckCircle size={14} />
                                Saved
                            </span>
                        )}
                        <button onClick={reset} className="att-btn att-btn-ghost">
                            <RotateCcw size={13} />
                            Reset
                        </button>
                        <button
                            onClick={save}
                            disabled={saving}
                            className="att-btn att-btn-primary"
                            style={{ opacity: saving ? 0.7 : 1 }}
                        >
                            <Save size={13} />
                            {saving ? 'Saving…' : 'Save attendance'}
                        </button>
                    </div>
                </div>

                {/* ── Session info strip ── */}
                <div className="att-card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={14} color="#9CA3AF" />
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                            {new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                    <div style={{ width: 1, height: 16, background: '#E5E7EB' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock size={14} color="#9CA3AF" />
                        <span style={{ fontSize: 13, color: '#374151' }}>
                            {startTime} – {endTime}
                            <span style={{ color: '#9CA3AF', marginLeft: 6 }}>
                                ({blocks} block{blocks !== 1 ? 's' : ''})
                            </span>
                        </span>
                    </div>
                    {session.room && (
                        <>
                            <div style={{ width: 1, height: 16, background: '#E5E7EB' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <MapPin size={14} color="#9CA3AF" />
                                <span style={{ fontSize: 13, color: '#374151' }}>{session.room}</span>
                            </div>
                        </>
                    )}
                    <div style={{ width: 1, height: 16, background: '#E5E7EB' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={14} color="#9CA3AF" />
                        <span style={{ fontSize: 13, color: '#374151' }}>{students.length} students</span>
                    </div>
                </div>

                {/* ── Stats row ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 10, marginBottom: 20 }}>
                    {/* Attendance rate */}
                    <div className="att-card" style={{ padding: '14px 16px', gridColumn: 'span 1' }}>
                        <p style={{ fontSize: 26, fontWeight: 700, color: presentPct >= 75 ? '#15803D' : '#DC2626', margin: 0, lineHeight: 1 }}>
                            {presentPct}%
                        </p>
                        <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9CA3AF', margin: '5px 0 0' }}>
                            Rate
                        </p>
                    </div>

                    {/* Per-status counts */}
                    {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => {
                        const cfg = STATUS_CONFIG[s];
                        return (
                            <div key={s} className="att-card" style={{ padding: '14px 16px', borderColor: counts[s] > 0 ? cfg.border : undefined }}>
                                <p style={{ fontSize: 26, fontWeight: 700, color: counts[s] > 0 ? cfg.activeBg : '#D1D5DB', margin: 0, lineHeight: 1 }}>
                                    {counts[s] ?? 0}
                                </p>
                                <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9CA3AF', margin: '5px 0 0' }}>
                                    {cfg.label}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* ── Attendance table ── */}
                <div className="att-card" style={{ overflow: 'hidden' }}>
                    {/* Toolbar */}
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {/* Search */}
                        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                placeholder="Search student…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="att-input"
                                style={{ paddingLeft: 32, width: '100%' }}
                            />
                        </div>

                        {/* Filter by status */}
                        <div style={{ display: 'flex', gap: 5 }}>
                            {(['all', ...Object.keys(STATUS_CONFIG)] as (AttendanceStatus | 'all')[]).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    style={{
                                        height: 32,
                                        padding: '0 12px',
                                        fontSize: 12,
                                        fontFamily: 'inherit',
                                        fontWeight: 500,
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        border: filterStatus === s ? 'none' : '1px solid #E5E7EB',
                                        background: filterStatus === s
                                            ? (s === 'all' ? '#111827' : STATUS_CONFIG[s as AttendanceStatus].activeBg)
                                            : '#fff',
                                        color: filterStatus === s ? '#fff' : '#6B7280',
                                        transition: 'all 0.1s',
                                    }}
                                >
                                    {s === 'all' ? 'All' : STATUS_CONFIG[s as AttendanceStatus].label}
                                    {s !== 'all' && counts[s as AttendanceStatus] !== undefined && (
                                        <span style={{ marginLeft: 5, opacity: 0.75 }}>({counts[s as AttendanceStatus]})</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />

                        {/* Mark all */}
                        <div style={{ display: 'flex', gap: 5 }}>
                            <span style={{ fontSize: 12, color: '#9CA3AF', alignSelf: 'center' }}>Mark all:</span>
                            {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => {
                                const cfg = STATUS_CONFIG[s];
                                return (
                                    <button
                                        key={s}
                                        onClick={() => markAll(s)}
                                        style={{ height: 30, padding: '0 10px', fontSize: 11, fontFamily: 'inherit', fontWeight: 500, borderRadius: 7, cursor: 'pointer', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                        {cfg.icon}
                                        {cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Student rows */}
                    {filtered.length === 0 ? (
                        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                            <Users size={36} style={{ color: '#E5E7EB', margin: '0 auto 12px', display: 'block' }} />
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>
                                {students.length === 0 ? 'No students enrolled in this subject' : 'No students match your search'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((student, i) => (
                            <StudentRow
                                key={student.id}
                                student={student}
                                status={statuses[student.id] ?? 'absent'}
                                onStatusChange={handleStatusChange}
                            />
                        ))
                    )}

                    {/* Footer save bar */}
                    {students.length > 0 && (
                        <div style={{ padding: '14px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFAFA' }}>
                            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                                {counts.present ?? 0} present · {counts.late ?? 0} late · {counts.excused ?? 0} excused · {counts.absent ?? 0} absent
                            </p>
                            <button
                                onClick={save}
                                disabled={saving}
                                className="att-btn att-btn-primary"
                                style={{ opacity: saving ? 0.7 : 1 }}
                            >
                                <Save size={13} />
                                {saving ? 'Saving…' : 'Save attendance'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}