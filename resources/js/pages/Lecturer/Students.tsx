import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Search, Users, ChevronLeft, ChevronRight, Filter, X, ScanFace, BookOpen, CircleCheck, CircleAlert } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'My Students', href: '/lecturer/students' },
];

interface EnrolledSubject { id: number; code: string; name: string; }

interface Student {
    id: number;
    name: string;
    student_id: string;
    email: string;
    status: string;
    face_status: string;
    attendance_rate: number | null;
    total_att: number;
    present_att: number;
    enrolled_subjects: EnrolledSubject[];
}

interface PaginatedStudents {
    data: Student[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Subject { id: number; code: string; name: string; }
interface Stats   { total: number; active: number; face_reg: number; }
interface Filters { search?: string; subject?: string; status?: string; }
interface Props   { students: PaginatedStudents; subjects: Subject[]; filters: Filters; stats: Stats; }

const PALETTE = ['#7C3AED','#1D4ED8','#059669','#BE185D','#C2410C','#0369A1','#15803D','#9333EA'];

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % PALETTE.length;
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', background: PALETTE[hue] + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1.5px solid ${PALETTE[hue]}33` }}>
            <span style={{ fontSize: size * 0.33, fontWeight: 700, color: PALETTE[hue] }}>{initials}</span>
        </div>
    );
}

export default function LecturerStudents() {
    const { students, subjects, filters, stats } = usePage<any>().props as Props;

    const [search,  setSearch]  = useState(filters.search  ?? '');
    const [subject, setSubject] = useState(filters.subject ?? '');
    const [status,  setStatus]  = useState(filters.status  ?? '');

    const applyFilters = () => {
        router.get('/lecturer/students', {
            ...(search  && { search }),
            ...(subject && { subject }),
            ...(status  && { status }),
        }, { preserveScroll: true });
    };

    const clearFilters = () => {
        setSearch(''); setSubject(''); setStatus('');
        router.get('/lecturer/students', {}, { preserveScroll: true });
    };

    const hasFilters = !!(filters.search || filters.subject || filters.status);
    const inputStyle: React.CSSProperties  = { height: 36, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', background: '#fff', color: '#111827' };
    const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Students" />

            <div style={{ padding: '24px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>

                {/* Header */}
                <div style={{ marginBottom: 20 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>My Students</h1>
                    <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>All students enrolled in your subjects</p>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                        { label: 'Total Students',   value: stats.total,    icon: <Users size={16} color="#7C3AED" />,       bg: '#F5F3FF' },
                        { label: 'Active',           value: stats.active,   icon: <CircleCheck size={16} color="#059669" />, bg: '#F0FDF4' },
                        { label: 'Face Registered',  value: stats.face_reg, icon: <ScanFace size={16} color="#1D4ED8" />,    bg: '#EFF6FF' },
                    ].map(({ label, value, icon, bg }) => (
                        <div key={label} style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {icon}
                            </div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>{value.toLocaleString()}</div>
                                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, padding: '16px 18px', marginBottom: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Filter size={13} color="#6B7280" />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Filters</span>
                        {hasFilters && (
                            <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', fontSize: 11, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={11} /> Clear all
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 140px auto', gap: 8, alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} placeholder="Name or student ID…" style={{ ...inputStyle, width: '100%', paddingLeft: 30 }} />
                        </div>
                        <select value={subject} onChange={e => setSubject(e.target.value)} style={selectStyle}>
                            <option value="">All subjects</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                        </select>
                        <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <button onClick={applyFilters} style={{ height: 36, padding: '0 18px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                            Apply
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, color: '#6B7280' }}>
                            {students.total > 0
                                ? <>Showing <strong style={{ color: '#111827' }}>{students.from}–{students.to}</strong> of <strong style={{ color: '#111827' }}>{students.total.toLocaleString()}</strong> students</>
                                : 'No students found'}
                        </span>
                        {hasFilters && <span style={{ fontSize: 12, color: '#7C3AED', background: '#F5F3FF', padding: '3px 10px', borderRadius: 20 }}>Filtered</span>}
                    </div>

                    {students.data.length === 0 ? (
                        <div style={{ padding: '56px 20px', textAlign: 'center' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                <Users size={20} color="#D1D5DB" />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 500, color: '#374151', margin: 0 }}>No students found</p>
                            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
                                {hasFilters ? 'Try adjusting your filters' : 'No students are enrolled in your subjects yet'}
                            </p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                                    {['Student', 'ID', 'Subjects', 'Attendance', 'Face ID', 'Status'].map(h => (
                                        <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {students.data.map((s, i) => {
                                    const rate = s.attendance_rate;
                                    const rateColor = rate === null ? '#9CA3AF' : rate >= 80 ? '#059669' : rate >= 60 ? '#D97706' : '#DC2626';
                                    const rateBg    = rate === null ? '#F3F4F6'  : rate >= 80 ? '#DCFCE7'  : rate >= 60 ? '#FEF3C7'  : '#FEE2E2';

                                    return (
                                        <tr key={s.id}
                                            style={{ borderBottom: i < students.data.length - 1 ? '1px solid #F9FAFB' : 'none' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                                            onMouseLeave={e => (e.currentTarget.style.background = '')}>

                                            {/* Student */}
                                            <td style={{ padding: '13px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <Avatar name={s.name} />
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.name}</div>
                                                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{s.email}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Student ID */}
                                            <td style={{ padding: '13px 20px', fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>{s.student_id}</td>

                                            {/* Subjects */}
                                            <td style={{ padding: '13px 20px' }}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                    {s.enrolled_subjects.map(sub => (
                                                        <span key={sub.id} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#F3F4F6', color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <BookOpen size={10} color="#9CA3AF" />
                                                            {sub.code}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Attendance */}
                                            <td style={{ padding: '13px 20px', minWidth: 120 }}>
                                                {rate === null ? (
                                                    <span style={{ fontSize: 12, color: '#D1D5DB' }}>No records</span>
                                                ) : (
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                            <span style={{ fontSize: 13, fontWeight: 700, color: rateColor }}>{rate}%</span>
                                                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{s.present_att}/{s.total_att}</span>
                                                        </div>
                                                        <div style={{ height: 3, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden', width: 80 }}>
                                                            <div style={{ height: '100%', width: `${rate}%`, background: rateColor, borderRadius: 2 }} />
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Face ID */}
                                            <td style={{ padding: '13px 20px' }}>
                                                {s.face_status === 'approved' ? (
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#059669', fontSize: 12, fontWeight: 600 }}>
                                                        <CircleCheck size={13} /> Registered
                                                    </div>
                                                ) : s.face_status === 'pending' ? (
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#D97706', fontSize: 12, fontWeight: 600 }}>
                                                        <CircleAlert size={13} /> Pending
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding: '13px 20px' }}>
                                                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: s.status === 'active' ? '#DCFCE7' : '#F3F4F6', color: s.status === 'active' ? '#166534' : '#6B7280' }}>
                                                    {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination */}
                    {students.last_page > 1 && (
                        <div style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, color: '#6B7280' }}>Page {students.current_page} of {students.last_page}</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {students.links.map((link, i) => {
                                    if (!link.url && !link.active) return null;
                                    return (
                                        <Link key={i} href={link.url ?? '#'} style={{ minWidth: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, fontSize: 13, fontWeight: link.active ? 700 : 400, textDecoration: 'none', background: link.active ? '#111827' : '#F9FAFB', color: link.active ? '#fff' : link.url ? '#374151' : '#D1D5DB', border: '1px solid ' + (link.active ? '#111827' : '#F3F4F6'), pointerEvents: link.url ? 'auto' : 'none', padding: '0 8px' }}>
                                            {link.label.includes('Previous') ? <ChevronLeft size={14} /> : link.label.includes('Next') ? <ChevronRight size={14} /> : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </AppLayout>
    );
}
