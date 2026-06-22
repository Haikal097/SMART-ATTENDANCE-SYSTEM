import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { ChevronLeft, Mail, Phone, Calendar, BookOpen, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface Attendance {
    id: number;
    status: 'present' | 'late' | 'absent' | 'excused';
    date: string | null;
    subject: string;
    subject_code: string;
    time: string;
    checked_in_at: string | null;
}

interface Subject {
    id: number;
    code: string;
    name: string;
    status: string;
}

interface Student {
    id: number;
    name: string;
    studentId: string;
    email: string;
    phone: string | null;
    enrollmentDate: string | null;
    status: string;
    faceStatus: string;
    attendanceRate: number;
    totalSessions: number;
    attended: number;
}

interface Props {
    student: Student;
    subjects: Subject[];
    recentAttendance: Attendance[];
}

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    present:  { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
    late:     { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
    absent:   { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
    excused:  { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    present: <CheckCircle size={13} />,
    late:    <Clock size={13} />,
    absent:  <XCircle size={13} />,
    excused: <AlertCircle size={13} />,
};

const FACE_BADGE: Record<string, { label: string; bg: string; color: string; border: string }> = {
    approved: { label: 'Registered',  bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
    pending:  { label: 'Pending',     bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
    rejected: { label: 'Rejected',    bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
    none:     { label: 'Missing',     bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
};

export default function StudentShow({ student, subjects, recentAttendance }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Students', href: '/students' },
        { title: student.name, href: `/students/${student.id}` },
    ];

    const face = FACE_BADGE[student.faceStatus] ?? FACE_BADGE.none;
    const rateColor = student.attendanceRate >= 75 ? '#059669' : student.attendanceRate >= 50 ? '#D97706' : '#DC2626';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={student.name} />

            <div style={{ padding: '28px 32px', maxWidth: 1000, fontFamily: 'inherit' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                    <Link href="/students" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#6B7280', textDecoration: 'none' }}>
                        <ChevronLeft size={18} />
                    </Link>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#7C3AED', flexShrink: 0 }}>
                        {student.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>{student.name}</h1>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6B7280', background: '#F3F4F6', padding: '2px 8px', borderRadius: 6 }}>{student.studentId}</span>
                            <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 9px', borderRadius: 20, background: student.status === 'active' ? '#D1FAE5' : '#F3F4F6', color: student.status === 'active' ? '#065F46' : '#6B7280', border: `1px solid ${student.status === 'active' ? '#6EE7B7' : '#E5E7EB'}` }}>
                                {student.status}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 9px', borderRadius: 20, background: face.bg, color: face.color, border: `1px solid ${face.border}` }}>
                                {face.label}
                            </span>
                        </div>
                        <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>{student.email}</p>
                    </div>
                    <Link href={`/students/${student.id}/edit`} style={{ height: 36, padding: '0 16px', fontSize: 13, fontWeight: 500, background: '#fff', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                        Edit
                    </Link>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                    {[
                        { label: 'Attendance Rate', value: `${student.attendanceRate}%`, color: rateColor },
                        { label: 'Sessions Attended', value: student.attended, color: '#2563EB' },
                        { label: 'Total Sessions', value: student.totalSessions, color: '#374151' },
                    ].map(s => (
                        <div key={s.label} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '16px 20px' }}>
                            <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9CA3AF', margin: '5px 0 0' }}>{s.label}</p>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    {/* Info card */}
                    <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '20px' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 14px' }}>Student Info</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Mail size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: '#374151' }}>{student.email}</span>
                            </div>
                            {student.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Phone size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: 13, color: '#374151' }}>{student.phone}</span>
                                </div>
                            )}
                            {student.enrollmentDate && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Calendar size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: 13, color: '#374151' }}>Enrolled {student.enrollmentDate}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Subjects card */}
                    <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '20px' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 14px' }}>Enrolled Subjects ({subjects.length})</p>
                        {subjects.length === 0 ? (
                            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Not enrolled in any subjects.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {subjects.map(s => (
                                    <Link key={s.id} href={`/subjects/${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: '#F9FAFB', textDecoration: 'none' }}>
                                        <BookOpen size={13} color="#7C3AED" />
                                        <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#7C3AED', fontWeight: 600 }}>{s.code}</span>
                                        <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>{s.name}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent attendance */}
                <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>Recent Attendance</p>
                    </div>
                    {recentAttendance.length === 0 ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No attendance records yet.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#FAFAFA' }}>
                                    {['Date', 'Subject', 'Time', 'Status'].map(h => (
                                        <th key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #F3F4F6' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {recentAttendance.map(a => {
                                    const sc = STATUS_COLORS[a.status] ?? STATUS_COLORS.absent;
                                    return (
                                        <tr key={a.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                                            <td style={{ padding: '11px 16px', fontSize: 13, color: '#374151', fontFamily: 'monospace' }}>{a.date ?? '—'}</td>
                                            <td style={{ padding: '11px 16px' }}>
                                                <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: '#7C3AED', marginRight: 6 }}>{a.subject_code}</span>
                                                <span style={{ fontSize: 13, color: '#374151' }}>{a.subject}</span>
                                            </td>
                                            <td style={{ padding: '11px 16px', fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>{a.time}</td>
                                            <td style={{ padding: '11px 16px' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                                    {STATUS_ICONS[a.status]}
                                                    {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
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
