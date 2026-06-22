// resources/js/pages/Subjects/Show.tsx
import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    BookOpen, Users, Clock, BarChart3, Edit,
    ChevronLeft, AlertTriangle, X, CheckCircle,
    Calendar, MapPin, UserMinus, UserPlus, Search, CalendarDays
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lecturer {
    id: number;
    name: string;
    email: string;
    pivot: { role: string };
}

interface Student {
    id: number;
    name: string;
    student_id: string;
    email: string;
    status: string;
    pivot: { enrolled_at: string };
}

interface Session {
    id: number;
    date: string;
    start_block: number;
    end_block: number;
    start_time: string;
    end_time: string;
    room: string | null;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    present: number;
    total: number;
}

interface Subject {
    id: number;
    code: string;
    name: string;
    description: string | null;
    credit_hours: number;
    status: 'active' | 'inactive';
    lecturers: Lecturer[];
    students: Student[];
    sessions: Session[];
    stats: {
        totalStudents: number;
        totalSessions: number;
        avgAttendance: number;
    };
}

interface Props {
    subject: Subject;
    availableStudents: { id: number; name: string; student_id: string; email: string }[];
    canManage: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sessionStatusStyle: Record<string, { bg: string; color: string; border: string; label: string }> = {
    scheduled:  { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: 'Scheduled'  },
    ongoing:    { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', label: 'Ongoing'    },
    completed:  { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB', label: 'Completed'  },
    cancelled:  { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', label: 'Cancelled'  },
};

// ─── Enroll modal ─────────────────────────────────────────────────────────────
function EnrollModal({
    subjectId,
    available,
    onClose,
}: {
    subjectId: number;
    available: { id: number; name: string; student_id: string; email: string }[];
    onClose: () => void;
}) {
    const [search, setSearch]         = useState('');
    const [selected, setSelected]     = useState<number[]>([]);
    const [processing, setProcessing] = useState(false);

    const filtered = available.filter(
        (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.student_id.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase())
    );

    const toggle = (id: number) =>
        setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    const enroll = () => {
        if (selected.length === 0) return;
        setProcessing(true);
        router.post(`/subjects/${subjectId}/enroll`, { student_ids: selected }, {
            preserveScroll: true,
            onSuccess: () => { setProcessing(false); onClose(); },
            onError:   () => setProcessing(false),
        });
    };

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <UserPlus size={18} color="#7C3AED" />
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>Enroll students</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                        <input type="text" placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)}
                            style={{ width: '100%', height: 36, paddingLeft: 32, paddingRight: 12, fontSize: 13, fontFamily: 'inherit', border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', boxSizing: 'border-box', background: '#F9FAFB' }} />
                    </div>
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                            {available.length === 0 ? 'All students are already enrolled.' : 'No students match your search.'}
                        </div>
                    ) : filtered.map((s) => (
                        <div key={s.id} onClick={() => toggle(s.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', cursor: 'pointer', background: selected.includes(s.id) ? '#F5F3FF' : 'transparent', borderBottom: '1px solid #F9FAFB', transition: 'background 0.1s' }}>
                            <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} style={{ width: 15, height: 15, accentColor: '#7C3AED', cursor: 'pointer', flexShrink: 0 }} />
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#7C3AED', flexShrink: 0 }}>
                                {s.name.charAt(0)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: 0 }}>{s.name}</p>
                                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0', fontFamily: 'monospace' }}>{s.student_id} · {s.email}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ padding: '14px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>
                        {selected.length > 0 ? `${selected.length} selected` : 'Select students to enroll'}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={onClose} style={{ height: 34, padding: '0 14px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={enroll} disabled={selected.length === 0 || processing}
                            style={{ height: 34, padding: '0 16px', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, cursor: selected.length === 0 ? 'not-allowed' : 'pointer', opacity: selected.length === 0 ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <UserPlus size={13} />
                            {processing ? 'Enrolling…' : `Enroll${selected.length > 0 ? ` ${selected.length}` : ''}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Remove student confirm ───────────────────────────────────────────────────
function RemoveStudentModal({ student, subjectId, onClose }: { student: Student; subjectId: number; onClose: () => void }) {
    const remove = () => {
        router.delete(`/subjects/${subjectId}/enroll/${student.id}`, {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };
    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #FCA5A5', background: '#FEF2F2', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={16} color="#991B1B" />
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#991B1B', margin: 0 }}>Remove student</p>
                </div>
                <div style={{ padding: 20 }}>
                    <p style={{ fontSize: 14, color: '#374151', margin: '0 0 4px' }}>Remove <strong>{student.name}</strong> from this subject?</p>
                    <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Their attendance records for this subject will be kept.</p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                        <button onClick={onClose} style={{ height: 34, padding: '0 14px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={remove} style={{ height: 34, padding: '0 14px', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <UserMinus size={13} />Remove
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SubjectShow({ subject, availableStudents, canManage }: Props) {
    const [activeTab, setActiveTab]         = useState<'students' | 'sessions'>('students');
    const [showEnroll, setShowEnroll]       = useState(false);
    const [removeTarget, setRemoveTarget]   = useState<Student | null>(null);
    const [studentSearch, setStudentSearch] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Subjects',    href: '/subjects' },
        { title: subject.code, href: `/subjects/${subject.id}` },
    ];

    const filteredStudents = subject.students.filter(
        (s) =>
            s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.student_id.toLowerCase().includes(studentSearch.toLowerCase())
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${subject.code} — ${subject.name}`} />

            <style>{`
                .sh-card { background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 14px; }
                .sh-table th { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #9CA3AF; padding: 11px 16px; text-align: left; background: #FAFAFA; border-bottom: 1px solid #F3F4F6; }
                .sh-table td { padding: 12px 16px; border-bottom: 1px solid #F9FAFB; font-size: 13px; color: #111827; vertical-align: middle; }
                .sh-table tr:last-child td { border-bottom: none; }
                .sh-table tr:hover td { background: #FAFAFA; }
                .sh-btn-primary { font-family: inherit; font-size: 13px; font-weight: 500; height: 36px; padding: 0 16px; background: #111827; color: #fff; border: none; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; text-decoration: none; }
                .sh-btn-primary:hover { opacity: 0.87; }
                .sh-btn-ghost { font-family: inherit; font-size: 13px; font-weight: 500; height: 36px; padding: 0 14px; background: #fff; color: #374151; border: 1px solid #E5E7EB; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; text-decoration: none; }
                .sh-btn-ghost:hover { background: #F9FAFB; }
                .sh-input { font-family: inherit; font-size: 13px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 8px 12px; color: #111827; outline: none; width: 100%; }
                .sh-input:focus { border-color: #111827; background: #fff; }
            `}</style>

            <div style={{ padding: '28px 32px', maxWidth: 1100, fontFamily: 'inherit' }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Link href="/subjects" className="sh-btn-ghost" style={{ padding: '0 10px' }}>
                            <ChevronLeft size={16} />
                        </Link>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <BookOpen size={22} color="#7C3AED" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>{subject.name}</h1>
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, background: '#EDE9FE', color: '#7C3AED', padding: '2px 10px', borderRadius: 20, border: '1px solid #DDD6FE' }}>{subject.code}</span>
                                <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 9px', borderRadius: 20, background: subject.status === 'active' ? '#D1FAE5' : '#F3F4F6', color: subject.status === 'active' ? '#065F46' : '#6B7280', border: `1px solid ${subject.status === 'active' ? '#6EE7B7' : '#E5E7EB'}` }}>
                                    {subject.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            {subject.description && <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{subject.description}</p>}
                        </div>
                    </div>
                    {canManage && (
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <Link href={`/subjects/${subject.id}/edit`} className="sh-btn-ghost"><Edit size={13} />Edit</Link>
                            <Link href={`/subjects/${subject.id}/schedules`} className="sh-btn-primary">
                                <CalendarDays size={13} />Manage timetable
                            </Link>
                        </div>
                    )}
                </div>

                {/* ── Stats ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 24 }}>
                    {[
                        { label: 'Credit hours',      value: `${subject.credit_hours} hrs`,  color: '#7C3AED', bg: '#EDE9FE', icon: BookOpen  },
                        { label: 'Enrolled students', value: subject.stats.totalStudents,    color: '#2563EB', bg: '#DBEAFE', icon: Users     },
                        { label: 'Total sessions',    value: subject.stats.totalSessions,    color: '#D97706', bg: '#FEF3C7', icon: Calendar  },
                        {
                            label: 'Avg attendance',
                            value: `${subject.stats.avgAttendance}%`,
                            color: subject.stats.avgAttendance >= 75 ? '#059669' : '#DC2626',
                            bg:    subject.stats.avgAttendance >= 75 ? '#D1FAE5' : '#FEE2E2',
                            icon:  BarChart3,
                        },
                    ].map((s) => (
                        <div key={s.label} className="sh-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <s.icon size={18} color={s.color} strokeWidth={1.8} />
                            </div>
                            <div>
                                <p style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1 }}>{s.value}</p>
                                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9CA3AF', margin: '4px 0 0' }}>{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Lecturers strip ── */}
                {subject.lecturers.length > 0 && (
                    <div className="sh-card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF', flexShrink: 0 }}>Lecturers</span>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {subject.lecturers.map((l) => (
                                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 20 }}>
                                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#7C3AED' }}>
                                        {l.name.charAt(0)}
                                    </div>
                                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{l.name}</span>
                                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>({l.pivot.role})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Tabs ── */}
                <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: 20 }}>
                    {(['students', 'sessions'] as const).map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? '#111827' : '#6B7280', cursor: 'pointer', borderBottom: activeTab === tab ? '2px solid #111827' : '2px solid transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', marginBottom: -1, background: 'none', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {tab === 'students' ? <Users size={14} /> : <Clock size={14} />}
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 10, background: activeTab === tab ? '#111827' : '#F3F4F6', color: activeTab === tab ? '#fff' : '#6B7280' }}>
                                {tab === 'students' ? subject.students.length : subject.sessions.length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ══ Students tab ══════════════════════════════════════════════ */}
                {activeTab === 'students' && (
                    <div className="sh-card" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                                <input type="text" placeholder="Search enrolled students…" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="sh-input" style={{ paddingLeft: 32 }} />
                            </div>
                            {canManage && (
                                <button onClick={() => setShowEnroll(true)} className="sh-btn-primary" style={{ background: '#7C3AED', flexShrink: 0 }}>
                                    <UserPlus size={13} />Enroll students
                                </button>
                            )}
                        </div>

                        <table className="sh-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>ID</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Enrolled</th>
                                    {canManage && <th style={{ width: 48 }} />}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={canManage ? 6 : 5} style={{ padding: '48px 20px', textAlign: 'center' }}>
                                            <Users size={36} style={{ color: '#E5E7EB', margin: '0 auto 12px', display: 'block' }} />
                                            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>
                                                {subject.students.length === 0 ? 'No students enrolled yet' : 'No students match your search'}
                                            </p>
                                            {canManage && subject.students.length === 0 && (
                                                <button onClick={() => setShowEnroll(true)} style={{ marginTop: 12, fontSize: 13, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                                    Enroll your first student
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : filteredStudents.map((student) => (
                                    <tr key={student.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#374151', flexShrink: 0 }}>
                                                    {student.name.charAt(0)}
                                                </div>
                                                <Link href={`/students/${student.id}`} style={{ fontSize: 13, fontWeight: 600, color: '#111827', textDecoration: 'none' }}>
                                                    {student.name}
                                                </Link>
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#6B7280' }}>{student.student_id}</td>
                                        <td style={{ fontSize: 12, color: '#6B7280' }}>{student.email}</td>
                                        <td>
                                            <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: student.status === 'active' ? '#D1FAE5' : '#F3F4F6', color: student.status === 'active' ? '#065F46' : '#6B7280', border: `1px solid ${student.status === 'active' ? '#6EE7B7' : '#E5E7EB'}` }}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>
                                            {student.pivot?.enrolled_at ?? '—'}
                                        </td>
                                        {canManage && (
                                            <td>
                                                <button onClick={() => setRemoveTarget(student)} title="Remove from subject"
                                                    style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#9CA3AF', display: 'flex', alignItems: 'center' }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                                                >
                                                    <UserMinus size={15} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ══ Sessions tab ══════════════════════════════════════════════ */}
                {activeTab === 'sessions' && (
                    <div className="sh-card" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                                {subject.sessions.length} session{subject.sessions.length !== 1 ? 's' : ''}
                                {subject.sessions.length > 0 && (
                                    <span style={{ color: '#D1D5DB', margin: '0 6px' }}>·</span>
                                )}
                                {subject.sessions.length > 0 && (
                                    <span>
                                        {new Date(subject.sessions[subject.sessions.length - 1].date + 'T00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                                        {' – '}
                                        {new Date(subject.sessions[0].date + 'T00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                )}
                            </p>
                        </div>

                        <table className="sh-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Room</th>
                                    <th>Attendance</th>
                                    <th>Status</th>
                                    {canManage && <th style={{ width: 140 }} />}
                                </tr>
                            </thead>
                            <tbody>
                                {subject.sessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={canManage ? 6 : 5} style={{ padding: '48px 20px', textAlign: 'center' }}>
                                            <Calendar size={36} style={{ color: '#E5E7EB', margin: '0 auto 12px', display: 'block' }} />
                                            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>No sessions yet</p>
                                            {canManage && (
                                                <>
                                                    <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4, marginBottom: 12 }}>Create the first session for this subject</p>
                                                    <Link href={`/subjects/${subject.id}/schedules`} className="sh-btn-primary" style={{ display: 'inline-flex' }}>
                                                        <CalendarDays size={13} />Set up timetable
                                                    </Link>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ) : subject.sessions.map((session) => {
                                    const ss = sessionStatusStyle[session.status];
                                    const pct = session.total > 0 ? Math.round((session.present / session.total) * 100) : 0;
                                    return (
                                        <tr key={session.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Calendar size={14} color="#9CA3AF" />
                                                    <span style={{ fontWeight: 500 }}>
                                                        {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>
                                                {session.start_time} – {session.end_time}
                                            </td>
                                            <td>
                                                {session.room ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#374151' }}>
                                                        <MapPin size={12} color="#9CA3AF" />{session.room}
                                                    </span>
                                                ) : <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>}
                                            </td>
                                            <td>
                                                {session.total > 0 ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{ width: 52, height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
                                                            <div style={{ width: `${pct}%`, height: '100%', background: pct >= 75 ? '#059669' : '#DC2626', borderRadius: 2 }} />
                                                        </div>
                                                        <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#6B7280' }}>{session.present}/{session.total}</span>
                                                    </div>
                                                ) : <span style={{ fontSize: 12, color: '#D1D5DB' }}>Not taken</span>}
                                            </td>
                                            <td>
                                                <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>
                                                    {ss.label}
                                                </span>
                                            </td>
                                            {canManage && (
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <Link href={`/subjects/${subject.id}/sessions/${session.id}/attendance`}
                                                            style={{ height: 30, padding: '0 12px', fontSize: 12, fontFamily: 'inherit', background: '#111827', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
                                                            <CheckCircle size={12} />Attendance
                                                        </Link>
                                                        <Link href={`/subjects/${subject.id}/sessions/${session.id}/edit`}
                                                            style={{ height: 30, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', background: '#fff', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 7, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                                                            <Edit size={12} />
                                                        </Link>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {canManage && showEnroll && <EnrollModal subjectId={subject.id} available={availableStudents} onClose={() => setShowEnroll(false)} />}
            {canManage && removeTarget && <RemoveStudentModal student={removeTarget} subjectId={subject.id} onClose={() => setRemoveTarget(null)} />}
        </AppLayout>
    );
}