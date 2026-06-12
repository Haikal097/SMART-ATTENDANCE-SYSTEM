import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    BookOpen, Users, Clock, BarChart3, ChevronRight,
    Search, CalendarDays, ClipboardList, ScanFace,
    CheckCircle, AlertTriangle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Schedule {
    id: number;
    day_of_week: string;
    start_block: number;
    end_block: number;
    type: string;
    time_range: string;
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
    students_count: number;
    sessions_count: number;
    attendance_rate: number;
    subject_index: number;
    schedules: Schedule[];
}

interface Props {
    subjects: Subject[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/lecturer/dashboard' },
    { title: 'My Subjects', href: '/lecturer/subjects' },
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

// ─── Subject Card ─────────────────────────────────────────────────────────────
function SubjectCard({ subject }: { subject: Subject }) {
    const pal  = PALETTE[subject.subject_index % PALETTE.length];
    const rate = subject.attendance_rate;
    const barColor = rate >= 80 ? '#10B981' : rate >= 60 ? '#F59E0B' : '#EF4444';

    return (
        <div style={{
            background: '#fff', border: `1px solid ${pal.border}`,
            borderRadius: 14, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'box-shadow 0.15s, transform 0.15s',
        }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
        >
            {/* Colour header */}
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
                <span style={{
                    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                    background: subject.status === 'active' ? '#D1FAE5' : '#F3F4F6',
                    color: subject.status === 'active' ? '#065F46' : '#6B7280',
                    border: `1px solid ${subject.status === 'active' ? '#6EE7B7' : '#E5E7EB'}`,
                    flexShrink: 0,
                }}>
                    {subject.status === 'active' ? <CheckCircle size={9} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} /> : <AlertTriangle size={9} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />}
                    {subject.status}
                </span>
            </div>

            {/* Body */}
            <div style={{ padding: '14px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                        { label: 'Students',  val: subject.students_count, icon: <Users size={13} color={pal.color} /> },
                        { label: 'Sessions',  val: subject.sessions_count, icon: <ClipboardList size={13} color={pal.color} /> },
                        { label: 'Credit hrs',val: subject.credit_hours,   icon: <Clock size={13} color={pal.color} /> },
                    ].map(item => (
                        <div key={item.label} style={{ background: pal.light, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 3 }}>{item.icon}</div>
                            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1 }}>{item.val}</p>
                            <p style={{ fontSize: 9, color: '#9CA3AF', margin: '2px 0 0' }}>{item.label}</p>
                        </div>
                    ))}
                </div>

                {/* Attendance rate */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>Attendance Rate</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{rate}%</span>
                    </div>
                    <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${rate}%`, background: barColor, borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                </div>

                {/* Schedule tags */}
                {subject.schedules.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {subject.schedules.map(sc => {
                            const ts = TYPE_STYLE[sc.type] ?? TYPE_STYLE.lecture;
                            return (
                                <span key={sc.id} style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 20, background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CalendarDays size={9} />
                                    {DAY_SHORT[sc.day_of_week] ?? sc.day_of_week} · {sc.time_range}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Semester dates */}
                {(subject.start_date || subject.end_date) && (
                    <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>
                        <Clock size={9} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                        {subject.start_date ?? '—'} – {subject.end_date ?? '—'}
                    </p>
                )}
            </div>

            {/* Footer actions */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 6 }}>
                <Link href={`/subjects/${subject.id}`} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 600, padding: '7px 0', borderRadius: 7, background: pal.bg, color: pal.color, border: `1px solid ${pal.border}`, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <BookOpen size={11} /> View Details
                </Link>
                <Link href={`/subjects/${subject.id}/sessions/create`} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 600, padding: '7px 0', borderRadius: 7, background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <ClipboardList size={11} /> Sessions
                </Link>
                <Link href={`/subjects/${subject.id}/schedules`} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 600, padding: '7px 0', borderRadius: 7, background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <CalendarDays size={11} /> Schedule
                </Link>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LecturerSubjects({ subjects }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const filtered = subjects.filter(s => {
        const matchSearch = s.code.toLowerCase().includes(search.toLowerCase()) ||
            s.name.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalStudents = subjects.reduce((acc, s) => acc + s.students_count, 0);
    const avgRate = subjects.length > 0
        ? Math.round(subjects.reduce((acc, s) => acc + s.attendance_rate, 0) / subjects.length)
        : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Subjects" />

            <div style={{ padding: '24px 28px', maxWidth: 1100, fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* ── Page header ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>My Subjects</h1>
                        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>
                            {subjects.length} subject{subjects.length !== 1 ? 's' : ''} assigned to you
                        </p>
                    </div>
                    <Link href="/lecturer/dashboard" style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff' }}>
                        ← Dashboard
                    </Link>
                </div>

                {/* ── Summary stats ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {[
                        { label: 'Total Subjects',  val: subjects.length,            icon: <BookOpen size={17} />,  bg: '#EDE9FE', color: '#6D28D9' },
                        { label: 'Total Students',  val: totalStudents,              icon: <Users size={17} />,     bg: '#DBEAFE', color: '#1D4ED8' },
                        { label: 'Active Subjects', val: subjects.filter(s => s.status === 'active').length, icon: <CheckCircle size={17} />, bg: '#D1FAE5', color: '#065F46' },
                        { label: 'Avg Attendance',  val: `${avgRate}%`,              icon: <BarChart3 size={17} />, bg: '#FEF3C7', color: '#92400E' },
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

                {/* ── Filters ── */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by code or name…"
                            style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 36, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {(['all', 'active', 'inactive'] as const).map(f => (
                            <button key={f} onClick={() => setStatusFilter(f)} style={{ height: 36, padding: '0 14px', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', borderRadius: 8, border: '1px solid', transition: 'all 0.1s', background: statusFilter === f ? '#111827' : '#fff', color: statusFilter === f ? '#fff' : '#6B7280', borderColor: statusFilter === f ? '#111827' : '#E5E7EB' }}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Subject grid ── */}
                {filtered.length === 0 ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14 }}>
                        <BookOpen size={32} style={{ display: 'block', margin: '0 auto 10px', color: '#E5E7EB' }} />
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>No subjects found</p>
                        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '4px 0 0' }}>
                            {search ? 'Try a different search term' : 'No subjects have been assigned to you yet'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                        {filtered.map(subject => (
                            <SubjectCard key={subject.id} subject={subject} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
